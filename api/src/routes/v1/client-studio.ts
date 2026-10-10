// routes/v1/client-studio.ts — Design Studio, CLIENT side (/v1/client-portal/studio, CLIENT_PORTAL only).
//
// SECURITY BOUNDARY (ultrathink) — same model as client-portal.ts:
//   1. portal-gate.ts confines a CLIENT_PORTAL token to /v1/client-portal (+ studio writes here only).
//   2. Every query re-derives access: design_requests.client_user_id = jwt.user_id. A request id that
//      isn't yours is a 404 (never reveals existence).
//   3. Responses are client DTOs — range bounds only, never lines/costs/markups (invariant 2).
//   4. Photos upload through THIS namespace (images only, quarantine + scan) — /v1/files/upload stays
//      closed to portal roles (invariant 3).
//   5. The spec is written only through the intake validator; AI output is stored as suggestions and
//      applied only via /suggestions/accept with the provenance the server recorded (invariant 7).
//   6. AI/provider calls run OUTSIDE any DB transaction (a slow model must not hold a connection).
//
//   POST   /auth/exchange                         magic link → JWT (public)
//   GET    /trades · /trades/:key/intake          offerable trades (enabled ∩ registered) + localized steps
//   GET    /requests · POST /requests · GET|PATCH /requests/:id
//   POST   /requests/:id/scopes · PATCH|DELETE /requests/:id/scopes/:sid
//   POST   /requests/:id/scopes/:sid/uploads      presigned quarantine PUT (jpg/png)
//   POST   /requests/:id/scopes/:sid/ai/assess|guide · /suggestions/accept
//   POST   /requests/:id/scopes/:sid/renders · PUT /selected-render
//   POST   /requests/:id/submit

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { withTenantContext } from '../../lib/tenant-context.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { issueToken, requireUserAgent } from '../../middleware/auth.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { consumeClientStudioMagicLinkToken, generateClientStudioMagicLinkToken, sendClientStudioInviteEmail } from '../../lib/password-reset.js';
import { pgPool } from '../../lib/db.js';
import { redis } from '../../lib/redis.js';
import { checkUpload } from '../../lib/upload-validation.js';
import { assertStorageQuota, TierEnforcementError } from '../../services/tier-enforcement.js';
import { generateUploadUrl, liveCompanyPath, downloadLiveObject } from '../../lib/storage.js';
import { sendJob } from '../../lib/queue.js';
import { createNotification } from '../../lib/notify.js';
import { tradeDef } from '../../lib/trades/taxonomy.js';
import {
  aiSystemPrompt, applyPatch, commonSteps, compileAiSchema, compilePrompt, COMMON_INTAKE_VERSION, getIntakeModule,
  localizeSteps, missingRequired, newSpec, offerableTrades, sanitizeValues, summarizeSpec, validateAiReply,
  type AiMode, type AiSuggestion, type Lang,
} from '../../lib/intake/index.js';
import { getImageProvider, getLlmProvider } from '../../lib/studio/providers.js';
import { assertRenderCaps, recordUsage, reserveAiCall, StudioCapError } from '../../lib/studio/metering.js';
import { circuitOpen, recordProviderResult } from '../../lib/studio/circuit.js';
import { stripImageMetadata, UnsafeImageError } from '../../lib/studio/image-meta.js';
import {
  StudioError, assertOwnPhotos, clientRequestFields, clientScopeDto, currentSpec, loadOfferings, loadRenders,
  loadRequest, loadScope, loadScopes, missingCommon, moduleFor, offeringFor, parseSettings, photoFileIds,
  priceScopeRow, proposalFor, type CatalogCache, type RequestRow,
} from '../../lib/studio/service.js';

const uuid = z.string().uuid();
const MAX_SCOPES = 5;
const MAX_ASSESS_PHOTOS = 3;
const STUDIO_IMAGE_EXT = /\.(jpe?g|png)$/i;

const fail = (reply: FastifyReply, status: number, code: string, message: string) =>
  reply.status(status).send({ error: { code, message } });

function handleErr(err: unknown, reply: FastifyReply) {
  if (err instanceof StudioError) return fail(reply, err.statusCode, err.code, err.message);
  if (err instanceof StudioCapError) return fail(reply, 429, err.code, err.message);
  if (err instanceof UnsafeImageError) return fail(reply, 422, 'PHOTO_UNREADABLE', 'One of your photos could not be read — try taking it again');
  if (err instanceof TierEnforcementError) return reply.status(402).send({ error: { code: err.code, message: err.message } });
  throw err;
}

const langOf = (req: FastifyRequest): Lang => {
  const q = (req.query as { lang?: string } | undefined)?.lang;
  if (q === 'es' || q === 'en') return q;
  return (req.jwt as { preferred_language?: string }).preferred_language === 'es' ? 'es' : 'en';
};

const audit = (client: PoolClient, req: FastifyRequest, action: string, resourceType: string, resourceId: string, payload: Record<string, unknown> = {}) =>
  writeAuditEntry(client, {
    tenantId: req.jwt.tenant_id, category: 'data', action, actorId: req.jwt.user_id, actorEmail: req.jwt.email,
    actorRole: req.jwt.role, resourceType, resourceId, payload, ipAddress: req.ip,
  });

/** Own request (404 otherwise); `draft` requires status draft (409 once submitted). */
async function ownRequest(c: PoolClient, req: FastifyRequest, id: string, draft = false): Promise<RequestRow> {
  if (!uuid.safeParse(id).success) throw new StudioError(404, 'NOT_FOUND', 'Request not found');
  const r = await loadRequest(c, id, req.jwt.user_id);
  if (!r) throw new StudioError(404, 'NOT_FOUND', 'Request not found');
  if (draft && r.status !== 'draft') throw new StudioError(409, 'REQUEST_SUBMITTED', 'This request was already sent to your contractor');
  return r;
}

async function ownScope(c: PoolClient, req: FastifyRequest, id: string, sid: string, draft = false) {
  const r = await ownRequest(c, req, id, draft);
  if (!uuid.safeParse(sid).success) throw new StudioError(404, 'NOT_FOUND', 'Scope not found');
  const s = await loadScope(c, id, sid);
  if (!s) throw new StudioError(404, 'NOT_FOUND', 'Scope not found');
  return { r, s };
}

async function scopeDto(c: PoolClient, r: RequestRow, scopeId: string) {
  const s = (await loadScope(c, r.id, scopeId))!;
  const offering = await offeringFor(c, s.trade_key);
  return clientScopeDto(c, r, s, await loadRenders(c, [s.id]), parseSettings(offering?.settings), {});
}

/**
 * Tell the contractor's owners/PMs/estimators — AFTER the client's action committed, never inside it.
 * In-transaction, a failed notification INSERT aborts the whole Postgres transaction (a .catch() can't
 * undo that), and push/SMS jobs would go out for a submit that then rolled back. Each notification gets
 * its own savepoint so one bad row doesn't drop the rest. Best-effort: never fails the request.
 */
async function notifyStaff(req: FastifyRequest, requestId: string, title: string, body: (who: string) => string): Promise<void> {
  try {
    await withTenantContext(req.jwt.tenant_id, async (c) => {
      const { rows: [u] } = await c.query(`SELECT first_name, last_name FROM users WHERE id = $1`, [req.jwt.user_id]);
      const who = `${u?.first_name ?? 'A client'} ${u?.last_name ?? ''}`.replace(/\s+/g, ' ').trim();
      const { rows: staff } = await c.query<{ id: string }>(
        `SELECT id FROM users WHERE role IN ('owner','project_manager','estimator') AND status = 'active' AND deleted_at IS NULL LIMIT 25`);
      for (const st of staff) {
        await c.query('SAVEPOINT studio_notify');
        try {
          await createNotification(c, req.jwt.tenant_id, {
            userId: st.id, category: 'project', title, body: body(who), data: { design_request_id: requestId },
          });
          await c.query('RELEASE SAVEPOINT studio_notify');
        } catch (err) {
          await c.query('ROLLBACK TO SAVEPOINT studio_notify');
          req.log.warn({ err, userId: st.id }, 'studio: staff notification failed');
        }
      }
    });
  } catch (err) {
    req.log.warn({ err, requestId }, 'studio: staff notifications skipped');
  }
}

export async function clientStudioRoutes(app: FastifyInstance): Promise<void> {
  const pre = [authenticate, requireRole('CLIENT_PORTAL')];
  const P = '/client-portal/studio';

  // ── POST /auth/exchange — public: magic link → CLIENT_PORTAL JWT ─────────────────────────────
  app.post(`${P}/auth/exchange`, { preHandler: requireUserAgent }, async (req, reply) => {
    const body = z.object({ token: z.string().min(1).max(200) }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', 'token is required');
    const consumed = await consumeClientStudioMagicLinkToken(body.data.token);
    if (!consumed) return fail(reply, 401, 'TOKEN_INVALID', 'This link is invalid or expired — ask your contractor to resend it');
    const user = await withTenantContext(consumed.tenantId, async (c) => {
      const res = await c.query(
        `UPDATE users SET status = 'active', last_login_at = NOW(), updated_at = NOW()
          WHERE id = $1 AND role = 'client_portal' AND deleted_at IS NULL AND status IN ('invited','active')
          RETURNING id, tenant_id, email, first_name, last_name, language_preference`, [consumed.userId]);
      return res.rows[0] ?? null;
    });
    if (!user) return fail(reply, 401, 'USER_NOT_FOUND', 'Account not found');
    const token = issueToken(
      { id: user.id, tenantId: user.tenant_id, role: 'CLIENT_PORTAL', email: user.email, languagePreference: user.language_preference },
      'web');
    return reply.send({ token, user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, language: user.language_preference } });
  });

  // ── POST /auth/resend — public: "email me a new link" ───────────────────────────────────────
  // ALWAYS answers 202 the same way (no account enumeration). The contractor is identified by the
  // tenant slug carried on the original link (`?t=`); the tenant id is looked up on the platform-scoped
  // (no-RLS) tenants table, then the client is read under that tenant's RLS. One email per address per
  // 2 minutes (Redis), so the endpoint can't be used to spam someone.
  app.post(`${P}/auth/resend`, { preHandler: requireUserAgent }, async (req, reply) => {
    const body = z.object({ email: z.string().email().max(254), tenant_slug: z.string().min(1).max(100) }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', 'email and tenant_slug are required');
    const ok = () => reply.status(202).send({ sent: true });
    const email = body.data.email.toLowerCase();
    try {
      const throttle = await redis.set(`client_studio_resend:${body.data.tenant_slug}:${email}`, '1', 'EX', 120, 'NX');
      if (!throttle) return ok();
      const { rows: [t] } = await pgPool.query(
        `SELECT id, name, slug FROM tenants WHERE slug = $1 AND deleted_at IS NULL AND status IN ('active','trial','grace_period')`,
        [body.data.tenant_slug]);
      if (!t) return ok();
      const user = await withTenantContext(t.id, async (c) => {
        const res = await c.query(
          `SELECT id, email, first_name, language_preference FROM users
            WHERE lower(email) = $1 AND role = 'client_portal' AND deleted_at IS NULL AND status IN ('invited','active')`, [email]);
        return res.rows[0] ?? null;
      });
      if (!user) return ok();
      const token = await generateClientStudioMagicLinkToken(user.id, t.id);
      sendClientStudioInviteEmail(user.email, user.first_name, t.name, token, user.language_preference === 'es' ? 'es' : 'en', t.slug)
        .catch((err) => req.log.warn({ err }, 'client studio resend email failed'));
      return ok();
    } catch (err) {
      req.log.warn({ err }, 'client studio resend failed');
      return ok();
    }
  });

  // ── GET /trades — what this contractor offers (enabled ∩ registered ∩ priced) ────────────────
  app.get(`${P}/trades`, { preHandler: pre }, async (req, reply) => {
    const lang = langOf(req);
    const offerings = await withTenantContext(req.jwt.tenant_id, (c) => loadOfferings(c));
    const mods = offerableTrades(offerings.filter((o) => o.enabled).map((o) => o.trade_key));
    return reply.send({
      trades: mods.map((m) => ({
        trade_key: m.trade_key,
        label: lang === 'es' ? tradeDef(m.trade_key)?.label_es : tradeDef(m.trade_key)?.label,
        entry_points: m.entry_points.map((e) => ({ id: e.id, label: e.label[lang], keywords: e.keywords[lang] })),
      })),
    });
  });

  // ── GET /trades/:key/intake — localized steps for the trade-agnostic wizard ──────────────────
  app.get(`${P}/trades/:key/intake`, { preHandler: pre }, async (req, reply) => {
    const { key } = req.params as { key: string };
    const lang = langOf(req);
    const module = getIntakeModule(key);
    const offering = module && await withTenantContext(req.jwt.tenant_id, (c) => offeringFor(c, module.trade_key));
    if (!module || !offering) return fail(reply, 404, 'TRADE_NOT_OFFERED', 'This contractor does not offer that work here');
    const settings = parseSettings(offering.settings);
    return reply.send({
      trade_key: module.trade_key,
      intake_version: module.intake_version,
      common_intake_version: COMMON_INTAKE_VERSION,
      common_steps: localizeSteps(commonSteps(module.location), lang),
      steps: localizeSteps(module.steps, lang),
      features: {
        renders: module.capabilities.renderable && settings.renders_enabled && !!getImageProvider(),
        ai_guide: !!getLlmProvider(),
        photo_assess: module.capabilities.photo_assess && !!getLlmProvider(),
      },
    });
  });

  // ── GET /requests — my requests ──────────────────────────────────────────────────────────────
  app.get(`${P}/requests`, { preHandler: pre }, async (req, reply) => {
    const rows = await withTenantContext(req.jwt.tenant_id, async (c) => {
      const res = await c.query(
        `SELECT r.id, r.status, r.title, r.range_low_cents, r.range_high_cents, r.submitted_at, r.created_at,
                COALESCE((SELECT json_agg(s.trade_key ORDER BY s.sort_order) FROM design_request_scopes s
                           WHERE s.request_id = r.id AND s.deleted_at IS NULL), '[]'::json) AS trades
           FROM design_requests r WHERE r.client_user_id = $1 AND r.deleted_at IS NULL
          ORDER BY r.created_at DESC LIMIT 100`, [req.jwt.user_id]);
      return res.rows;
    });
    return reply.send({ requests: rows });
  });

  // ── POST /requests — start another request ───────────────────────────────────────────────────
  app.post(`${P}/requests`, { preHandler: pre }, async (req, reply) => {
    const body = z.object({ title: z.string().max(200).optional() }).safeParse(req.body ?? {});
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', 'Invalid title');
    const request = await withTenantContext(req.jwt.tenant_id, async (c) => {
      const { rows: [r] } = await c.query(
        `INSERT INTO design_requests (tenant_id, client_user_id, title, created_by) VALUES ($1,$2,$3,$2) RETURNING id`,
        [req.jwt.tenant_id, req.jwt.user_id, body.data.title ?? null]);
      await audit(c, req, 'studio.request_started', 'design_request', r.id);
      return clientRequestFields((await loadRequest(c, r.id, req.jwt.user_id))!);
    });
    return reply.status(201).send({ request });
  });

  // ── GET /requests/:id ────────────────────────────────────────────────────────────────────────
  app.get(`${P}/requests/:id`, { preHandler: pre }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const out = await withTenantContext(req.jwt.tenant_id, async (c) => {
        const r = await ownRequest(c, req, id);
        const scopes = await loadScopes(c, id);
        const renders = await loadRenders(c, scopes.map((s) => s.id));
        const offerings = await loadOfferings(c);
        const cache: CatalogCache = {};
        const modules = scopes.map((s) => moduleFor(s.trade_key));
        return {
          request: clientRequestFields(r),
          proposal: await proposalFor(c, r),
          missing_common: missingCommon(r, modules),
          scopes: await Promise.all(scopes.map((s) => clientScopeDto(c, r, s, renders,
            parseSettings(offerings.find((o) => o.trade_key === s.trade_key)?.settings), cache))),
        };
      });
      return reply.send(out);
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── PATCH /requests/:id — common answers, site, title (draft only) ───────────────────────────
  app.patch(`${P}/requests/:id`, { preHandler: pre }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = z.object({
      version: z.number().int().positive(),
      title: z.string().max(200).nullable().optional(),
      common_values: z.record(z.unknown()).optional(),
      site: z.object({
        address: z.string().max(200).optional(), city: z.string().max(100).optional(),
        state: z.string().length(2).optional(), zip: z.string().max(10).optional(),
      }).strip().optional(),
    }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', body.error.errors[0]?.message ?? 'Invalid body');
    try {
      const out = await withTenantContext(req.jwt.tenant_id, async (c) => {
        const r = await ownRequest(c, req, id, true);
        if (r.version !== body.data.version) throw new StudioError(409, 'VERSION_CONFLICT', 'Changed elsewhere — reload and try again');
        const scopes = await loadScopes(c, id);
        const locs = new Set(scopes.map((s) => moduleFor(s.trade_key).location));
        const steps = commonSteps(locs.size === 1 ? [...locs][0]! : 'mixed');
        const merged = { ...(r.common_values ?? {}), ...(body.data.common_values ?? {}) };
        const { values, dropped } = sanitizeValues(steps, merged);
        await c.query(
          `UPDATE design_requests SET common_values = $2::jsonb, site = COALESCE($3::jsonb, site),
                  title = CASE WHEN $4::boolean THEN $5 ELSE title END
            WHERE id = $1`,
          [id, JSON.stringify(values), body.data.site ? JSON.stringify({ ...r.site, ...body.data.site }) : null,
            body.data.title !== undefined, body.data.title ?? null]);
        const fresh = (await loadRequest(c, id, req.jwt.user_id))!;
        return { request: clientRequestFields(fresh), missing_common: missingCommon(fresh, scopes.map((s) => moduleFor(s.trade_key))),
          dropped: dropped.filter((k) => body.data.common_values && k in body.data.common_values) };
      });
      return reply.send(out);
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── POST /requests/:id/scopes — add a trade scope (draft only) ───────────────────────────────
  app.post(`${P}/requests/:id/scopes`, { preHandler: pre }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = z.object({ trade_key: z.string().max(64), entry_point_id: z.string().max(64).optional() }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', 'trade_key is required');
    try {
      const scope = await withTenantContext(req.jwt.tenant_id, async (c) => {
        const r = await ownRequest(c, req, id, true);
        const module = getIntakeModule(body.data.trade_key);
        if (!module || !(await offeringFor(c, module.trade_key))) throw new StudioError(422, 'TRADE_NOT_OFFERED', 'This contractor does not offer that work here');
        if (body.data.entry_point_id && !module.entry_points.some((e) => e.id === body.data.entry_point_id)) {
          throw new StudioError(422, 'VALIDATION_ERROR', 'Unknown starting point');
        }
        const existing = await loadScopes(c, id);
        if (existing.length >= MAX_SCOPES) throw new StudioError(422, 'TOO_MANY_SCOPES', `Up to ${MAX_SCOPES} kinds of work per request`);
        const spec = newSpec(module, body.data.entry_point_id);
        const { rows: [s] } = await c.query(
          `INSERT INTO design_request_scopes (tenant_id, request_id, trade_key, intake_version, spec, sort_order, created_by)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) RETURNING id`,
          [req.jwt.tenant_id, id, module.trade_key, module.intake_version, JSON.stringify(spec), existing.length, req.jwt.user_id]);
        await audit(c, req, 'studio.scope_added', 'design_request_scope', s.id, { trade_key: module.trade_key });
        return scopeDto(c, r, s.id);
      });
      return reply.status(201).send({ scope });
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── PATCH /requests/:id/scopes/:sid — answers (draft only) ───────────────────────────────────
  app.patch(`${P}/requests/:id/scopes/:sid`, { preHandler: pre }, async (req, reply) => {
    const { id, sid } = req.params as { id: string; sid: string };
    const body = z.object({ version: z.number().int().positive(), values: z.record(z.unknown()) }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', body.error.errors[0]?.message ?? 'Invalid body');
    try {
      const out = await withTenantContext(req.jwt.tenant_id, async (c) => {
        const { r, s } = await ownScope(c, req, id, sid, true);
        if (s.version !== body.data.version) throw new StudioError(409, 'VERSION_CONFLICT', 'Changed elsewhere — reload and try again');
        const { module, spec } = currentSpec(s);
        const { spec: next, dropped } = applyPatch(module, spec, body.data.values, 'client');
        await assertOwnPhotos(c, photoFileIds(module, next), req.jwt.user_id);
        await c.query(`UPDATE design_request_scopes SET spec = $2::jsonb, intake_version = $3 WHERE id = $1`,
          [sid, JSON.stringify(next), module.intake_version]);
        return { scope: await scopeDto(c, r, sid), dropped };
      });
      return reply.send(out);
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── DELETE /requests/:id/scopes/:sid (draft only) ────────────────────────────────────────────
  app.delete(`${P}/requests/:id/scopes/:sid`, { preHandler: pre }, async (req, reply) => {
    const { id, sid } = req.params as { id: string; sid: string };
    try {
      await withTenantContext(req.jwt.tenant_id, async (c) => {
        await ownScope(c, req, id, sid, true);
        await c.query(`UPDATE design_request_scopes SET deleted_at = NOW() WHERE id = $1`, [sid]);
        await audit(c, req, 'studio.scope_removed', 'design_request_scope', sid);
      });
      return reply.status(204).send();
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── POST /requests/:id/scopes/:sid/uploads — photo upload (jpg/png → quarantine → scan) ──────
  app.post(`${P}/requests/:id/scopes/:sid/uploads`, { preHandler: pre }, async (req, reply) => {
    const { id, sid } = req.params as { id: string; sid: string };
    const body = z.object({
      filename: z.string().min(1).max(255), content_type: z.string().min(1).max(100), file_size_bytes: z.number().int().positive(),
    }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', 'filename, content_type and file_size_bytes are required');
    const { filename, content_type, file_size_bytes } = body.data;
    const check = checkUpload(filename, content_type, file_size_bytes, ['image']);
    if (!check.ok) return fail(reply, 422, check.code, check.message);
    if (!STUDIO_IMAGE_EXT.test(filename) || !/^image\/(jpeg|png)$/i.test(content_type.split(';')[0]!.trim())) {
      return fail(reply, 422, 'INVALID_FILE_TYPE', 'Photos must be JPG or PNG');
    }
    try {
      const tenantId = req.jwt.tenant_id;
      const out = await withTenantContext(tenantId, async (c) => {
        const { r } = await ownScope(c, req, id, sid, true);
        await assertStorageQuota(tenantId, file_size_bytes);
        const { uploadUrl, quarantinePath } = await generateUploadUrl(tenantId, filename);
        const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const livePath = liveCompanyPath(tenantId, `studio/${r.id}`, `${randomUUID()}-${safe}`);
        const { rows: [f] } = await c.query<{ id: string }>(
          `INSERT INTO files (tenant_id, project_id, filename, content_type, file_size_bytes, category, quarantine_path, storage_path, status, created_by)
           VALUES ($1,$2,$3,$4,$5,'image',$6,$7,'scanning',$8) RETURNING id`,
          [tenantId, r.project_id, filename, content_type, file_size_bytes, quarantinePath, livePath, req.jwt.user_id]);
        await audit(c, req, 'file.upload_requested', 'file', f!.id, { filename, content_type, file_size_bytes, source: 'design_studio', scope_id: sid });
        return { file_id: f!.id, uploadUrl, quarantinePath, livePath };
      });
      await sendJob('file.scan', tenantId, {
        file_id: out.file_id, quarantine_path: out.quarantinePath, live_path: out.livePath, filename, content_type, file_size_bytes,
      });
      return reply.send({ file_id: out.file_id, upload_url: out.uploadUrl, upload_expires_in_seconds: 300 });
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── POST /requests/:id/scopes/:sid/ai/{assess,guide} — suggestions only ──────────────────────
  for (const mode of ['assess', 'guide'] as AiMode[]) {
    app.post(`${P}/requests/:id/scopes/:sid/ai/${mode}`, { preHandler: pre }, async (req, reply) => {
      const { id, sid } = req.params as { id: string; sid: string };
      const body = z.object({ message: z.string().min(1).max(1000).optional() }).safeParse(req.body ?? {});
      if (!body.success || (mode === 'guide' && !body.data.message)) return fail(reply, 422, 'VALIDATION_ERROR', 'message is required');
      const provider = getLlmProvider();
      if (!provider || await circuitOpen(provider.name)) return fail(reply, 503, 'AI_UNAVAILABLE', 'The assistant is not available right now — you can keep going without it');
      const feature = mode === 'assess' ? 'studio.assess' : 'studio.guide';
      try {
        // Tx 1: authorize, gather inputs, reserve a cap slot.
        const prep = await withTenantContext(req.jwt.tenant_id, async (c) => {
          const { s } = await ownScope(c, req, id, sid, true);
          const { module, spec } = currentSpec(s);
          if (mode === 'assess' && !module.capabilities.photo_assess) throw new StudioError(422, 'NOT_SUPPORTED', 'Photo check is not available for this work');
          let paths: string[] = [];
          if (mode === 'assess') {
            const ids = photoFileIds(module, spec);
            if (!ids.length) throw new StudioError(422, 'PHOTO_REQUIRED', 'Add a photo first');
            await assertOwnPhotos(c, ids, req.jwt.user_id, true);
            const { rows } = await c.query<{ storage_path: string }>(
              `SELECT storage_path FROM files WHERE id = ANY($1::uuid[]) ORDER BY created_at LIMIT ${MAX_ASSESS_PHOTOS}`, [ids]);
            paths = rows.map((x) => x.storage_path);
          }
          // Last step of tx 1 so nothing after it can throw and strand the reservation.
          const release = await reserveAiCall(c, req.jwt.tenant_id, req.jwt.user_id, sid);
          return { module, spec, paths, release };
        });
        try {
          // Outside any transaction: the model call.
          const images = await Promise.all(prep.paths.map(async (p) => ({
            data: stripImageMetadata(await downloadLiveObject(p)), contentType: p.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
          })));
          const result = await provider.structured({
            system: aiSystemPrompt(prep.module, mode, prep.spec.values),
            user: mode === 'assess' ? 'Estimate the listed fields from these photos.' : body.data.message!,
            images,
            schema: compileAiSchema(prep.module, mode, prep.spec.values),
          });
          const validated = result ? validateAiReply(prep.module, mode, prep.spec, result.raw) : null;
          await recordProviderResult(provider.name, !!validated);

          // Tx 2: meter + store suggestions.
          const out = await withTenantContext(req.jwt.tenant_id, async (c) => {
            await recordUsage(c, {
              tenantId: req.jwt.tenant_id, userId: req.jwt.user_id, feature, provider: provider.name, model: result?.model ?? null,
              costMicroUsd: result?.costMicroUsd ?? 0, subjectType: 'design_scope', subjectId: sid, status: validated ? 'ok' : 'failed',
            });
            if (!validated) return null;
            await c.query(`UPDATE design_request_scopes SET ai_suggestions = $2::jsonb WHERE id = $1`, [sid, JSON.stringify(validated.suggestions)]);
            return validated;
          });
          if (!out) return fail(reply, 502, 'AI_NO_ANSWER', 'The assistant could not help with that — you can keep going without it');
          return reply.send({ suggestions: out.suggestions, next_field: out.next_field });
        } finally {
          await prep.release(); // after tx 2 committed the usage row (or the call failed)
        }
      } catch (err) {
        return handleErr(err, reply);
      }
    });
  }

  // ── POST /requests/:id/scopes/:sid/suggestions/accept ────────────────────────────────────────
  app.post(`${P}/requests/:id/scopes/:sid/suggestions/accept`, { preHandler: pre }, async (req, reply) => {
    const { id, sid } = req.params as { id: string; sid: string };
    const body = z.object({ fields: z.array(z.string().max(64)).min(1).max(50) }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', 'fields is required');
    try {
      const out = await withTenantContext(req.jwt.tenant_id, async (c) => {
        const { r, s } = await ownScope(c, req, id, sid, true);
        const { module, spec } = currentSpec(s);
        const stored = (Array.isArray(s.ai_suggestions) ? s.ai_suggestions : []) as AiSuggestion[];
        const accept = stored.filter((x) => body.data.fields.includes(x.field));
        let next = spec;
        for (const prov of ['ai_confirmed', 'photo_estimate'] as const) {
          const patch = Object.fromEntries(accept.filter((x) => x.provenance === prov).map((x) => [x.field, x.value]));
          if (Object.keys(patch).length) next = applyPatch(module, next, patch, prov).spec;
        }
        const remaining = stored.filter((x) => !body.data.fields.includes(x.field));
        await c.query(`UPDATE design_request_scopes SET spec = $2::jsonb, ai_suggestions = $3::jsonb WHERE id = $1`,
          [sid, JSON.stringify(next), JSON.stringify(remaining)]);
        return { scope: await scopeDto(c, r, sid), accepted: accept.map((x) => x.field) };
      });
      return reply.send(out);
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── POST /requests/:id/scopes/:sid/renders — queue a concept picture ─────────────────────────
  app.post(`${P}/requests/:id/scopes/:sid/renders`, { preHandler: pre }, async (req, reply) => {
    const { id, sid } = req.params as { id: string; sid: string };
    const body = z.object({ photo_file_id: uuid }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', 'photo_file_id is required');
    const provider = getImageProvider();
    try {
      const render = await withTenantContext(req.jwt.tenant_id, async (c) => {
        const { s } = await ownScope(c, req, id, sid, true);
        const { module, spec } = currentSpec(s);
        const offering = await offeringFor(c, s.trade_key);
        if (!module.capabilities.renderable || !parseSettings(offering?.settings).renders_enabled || !provider) {
          throw new StudioError(503, 'RENDERS_UNAVAILABLE', 'Pictures are not available right now');
        }
        if (!photoFileIds(module, spec).includes(body.data.photo_file_id)) throw new StudioError(422, 'PHOTO_NOT_FOUND', 'Choose one of your photos for this project');
        await assertOwnPhotos(c, [body.data.photo_file_id], req.jwt.user_id, true);
        await assertRenderCaps(c, req.jwt.tenant_id, req.jwt.user_id, sid); // lock held until the INSERT commits
        const { rows: [row] } = await c.query(
          `INSERT INTO design_renders (tenant_id, request_id, scope_id, source_file_id, spec_snapshot, intake_version, prompt, provider, created_by)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9) RETURNING id, status, created_at`,
          [req.jwt.tenant_id, id, sid, body.data.photo_file_id, JSON.stringify(spec), module.intake_version,
            compilePrompt(module, spec.values), provider.name, req.jwt.user_id]);
        return row;
      });
      await sendJob('studio.render', req.jwt.tenant_id, { render_id: render.id });
      return reply.status(202).send({ render: { ...render, url: null } });
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── PUT /requests/:id/scopes/:sid/selected-render ────────────────────────────────────────────
  app.put(`${P}/requests/:id/scopes/:sid/selected-render`, { preHandler: pre }, async (req, reply) => {
    const { id, sid } = req.params as { id: string; sid: string };
    const body = z.object({ render_id: uuid.nullable() }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', 'render_id is required');
    try {
      const scope = await withTenantContext(req.jwt.tenant_id, async (c) => {
        const { r } = await ownScope(c, req, id, sid, true);
        if (body.data.render_id) {
          const ok = await c.query(`SELECT 1 FROM design_renders WHERE id = $1 AND scope_id = $2 AND status = 'succeeded' AND deleted_at IS NULL`, [body.data.render_id, sid]);
          if (!ok.rows.length) throw new StudioError(422, 'RENDER_NOT_FOUND', 'Picture not found');
        }
        await c.query(`UPDATE design_request_scopes SET selected_render_id = $2 WHERE id = $1`, [sid, body.data.render_id]);
        return scopeDto(c, r, sid);
      });
      return reply.send({ scope });
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── POST /requests/:id/proposal/respond — accept or ask for changes (P4) ─────────────────────
  app.post(`${P}/requests/:id/proposal/respond`, { preHandler: pre }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = z.object({
      response: z.enum(['accepted', 'changes_requested']),
      note: z.string().max(2000).optional(),
    }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', 'response must be accepted or changes_requested');
    if (body.data.response === 'changes_requested' && !body.data.note?.trim()) {
      return fail(reply, 422, 'NOTE_REQUIRED', 'Tell your contractor what you would like changed');
    }
    try {
      const out = await withTenantContext(req.jwt.tenant_id, async (c) => {
        const r = await ownRequest(c, req, id);
        if (r.status === 'declined' || r.status === 'draft') throw new StudioError(409, 'NO_PROPOSAL', 'There is no proposal to answer yet');
        const proposal = await proposalFor(c, r);
        if (!proposal) throw new StudioError(409, 'NO_PROPOSAL', 'There is no proposal to answer yet');
        if (proposal.response) throw new StudioError(409, 'ALREADY_ANSWERED', 'You already answered this proposal');
        await c.query(
          `UPDATE design_requests SET proposal_response = $2, proposal_responded_at = NOW(), proposal_note = $3 WHERE id = $1`,
          [id, body.data.response, body.data.note?.trim() || null]);
        await audit(c, req, `studio.proposal_${body.data.response}`, 'design_request', id, { estimate_id: proposal.estimate_id });
        const fresh = (await loadRequest(c, id, req.jwt.user_id))!;
        return { request: clientRequestFields(fresh), proposal: await proposalFor(c, fresh) };
      });
      const accepted = body.data.response === 'accepted';
      await notifyStaff(req, id, accepted ? 'Proposal accepted' : 'Proposal changes requested',
        (who) => accepted ? `${who} accepted your proposal.` : `${who} asked for changes to your proposal.`);
      return reply.send(out);
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── POST /requests/:id/submit — freeze snapshots, send to the contractor ─────────────────────
  app.post(`${P}/requests/:id/submit`, { preHandler: pre }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = z.object({ version: z.number().int().positive() }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', 'version is required');
    try {
      const out = await withTenantContext(req.jwt.tenant_id, async (c) => {
        const r = await ownRequest(c, req, id, true);
        if (r.version !== body.data.version) throw new StudioError(409, 'VERSION_CONFLICT', 'Changed elsewhere — reload and try again');
        const scopes = await loadScopes(c, id);
        if (!scopes.length) throw new StudioError(422, 'INCOMPLETE', 'Choose the kind of work first');
        const modules = scopes.map((s) => moduleFor(s.trade_key));
        const missing: Record<string, string[]> = {};
        const mc = missingCommon(r, modules);
        if (mc.length) missing.request = mc;
        for (const s of scopes) {
          const { module, spec } = currentSpec(s);
          const m = missingRequired(module.steps, spec.values);
          if (m.length) missing[s.id] = m;
          await assertOwnPhotos(c, photoFileIds(module, spec), req.jwt.user_id, true);
        }
        if (Object.keys(missing).length) {
          throw Object.assign(new StudioError(422, 'INCOMPLETE', 'Some required answers are missing'), { missing });
        }
        const offerings = await loadOfferings(c);
        const cache: CatalogCache = {};
        let low = 0; let high = 0;
        for (const s of scopes) {
          const settings = parseSettings(offerings.find((o) => o.trade_key === s.trade_key)?.settings);
          const { module, spec, pricing } = await priceScopeRow(c, s, settings, cache);
          low += pricing.range.low_cents; high += pricing.range.high_cents;
          await c.query(
            `UPDATE design_request_scopes SET status = 'submitted', spec = $2::jsonb, intake_version = $3,
                    quantities_snapshot = $4::jsonb, summary_snapshot = $5::jsonb, range_low_cents = $6, range_high_cents = $7
              WHERE id = $1`,
            [s.id, JSON.stringify(spec), module.intake_version, JSON.stringify(pricing.quantities),
              JSON.stringify(summarizeSpec(module.steps, spec.values)), pricing.range.low_cents, pricing.range.high_cents]);
        }
        await c.query(
          `UPDATE design_requests SET status = 'submitted', submitted_at = NOW(), range_low_cents = $2, range_high_cents = $3,
                  common_intake_version = $4 WHERE id = $1`, [id, low, high, COMMON_INTAKE_VERSION]);
        await audit(c, req, 'studio.request_submitted', 'design_request', id, { scopes: scopes.map((s) => s.trade_key) });
        return { request: clientRequestFields((await loadRequest(c, id, req.jwt.user_id))!) };
      });
      await notifyStaff(req, id, 'New Design Studio request', (who) => `${who} sent a project request.`);
      return reply.send(out);
    } catch (err) {
      if (err instanceof StudioError && (err as StudioError & { missing?: unknown }).missing) {
        return reply.status(422).send({ error: { code: err.code, message: err.message, missing: (err as StudioError & { missing?: unknown }).missing } });
      }
      return handleErr(err, reply);
    }
  });
}
