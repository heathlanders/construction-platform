// routes/v1/studio.ts — Design Studio, CONTRACTOR side (proposed T-65). OWNER / PROJECT_MANAGER / ESTIMATOR.
//
//   GET    /v1/studio/trades                              registered intake modules + this tenant's offering
//   PUT    /v1/studio/offerings/:trade_key                enable/disable a trade + pricing params (module required)
//   POST   /v1/studio/invites                             invite a client (CLIENT_PORTAL user) → draft request + magic link
//   POST   /v1/studio/requests/:id/resend-invite          fresh magic link
//   GET    /v1/studio/requests                            inbox (cursor)
//   GET    /v1/studio/requests/:id                        review: spec, provenance, renders, pricing detail
//   PATCH  /v1/studio/requests/:id/scopes/:sid            verify measurements / correct answers (re-prices)
//   POST   /v1/studio/requests/:id/estimate               → draft estimate (existing estimates UI + proposal flow)
//   POST   /v1/studio/requests/:id/decline
//
// The client side lives in client-studio.ts (/v1/client-portal/studio, CLIENT_PORTAL only).

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { withTenantContext } from '../../lib/tenant-context.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { generateClientStudioMagicLinkToken, sendClientStudioInviteEmail } from '../../lib/password-reset.js';
import { tradeDef } from '../../lib/trades/taxonomy.js';
import { applyPatch, commonSteps, getIntakeModule, listIntakeModules, newSpec, summarizeSpec } from '../../lib/intake/index.js';
import { recomputeEstimateTotals } from '../../services/estimates.js';
import { estTradeFor } from '../../lib/estimating/trade-bucket.js';
import {
  StudioError, contractorScopeDto, currentSpec, loadOfferings, loadRenders, loadRequest, loadScope, loadScopes,
  offeringFor, offeringSettingsSchema, parseSettings, photoFileIds, priceScopeRow, proposalFor, type CatalogCache, type RequestRow, type ScopeRow,
} from '../../lib/studio/service.js';
import { assertCanCreateProject, TierEnforcementError } from '../../services/tier-enforcement.js';
import { sendJob } from '../../lib/queue.js';
import { studioCaps } from '../../lib/studio/metering.js';

const W = ['OWNER', 'PROJECT_MANAGER', 'ESTIMATOR'] as const;
const uuid = z.string().uuid();

const OfferingSchema = z.object({
  enabled: z.boolean(),
  display_order: z.number().int().min(0).max(1000).optional(),
  settings: offeringSettingsSchema.partial().optional(),
});

const SiteSchema = z.object({
  address: z.string().max(200).optional(), city: z.string().max(100).optional(),
  state: z.string().length(2).optional(), zip: z.string().max(10).optional(),
}).strip();

const InviteSchema = z.object({
  email: z.string().email().max(254),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  language: z.enum(['en', 'es']).default('en'),
  trade_key: z.string().max(64).optional(),
  entry_point_id: z.string().max(64).optional(),
  project_id: uuid.optional(),
  title: z.string().max(200).optional(),
  site: SiteSchema.optional(),
});

const ScopeEditSchema = z.object({
  version: z.number().int().positive(),
  measurements_verified: z.boolean().optional(),
  values: z.record(z.unknown()).optional(),
});

const ListQuery = z.object({
  status: z.enum(['draft', 'submitted', 'reviewed', 'converted', 'declined']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: uuid.optional(),
});

/** loadRequest under SELECT … FOR UPDATE — serializes state transitions on one request. */
async function lockRequest(c: PoolClient, id: string): Promise<RequestRow | null> {
  const { rows } = await c.query(`SELECT id FROM design_requests WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [id]);
  return rows.length ? loadRequest(c, id) : null;
}

function fail(reply: FastifyReply, status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return reply.status(status).send({ error: { code, message, ...extra } });
}

function handleErr(err: unknown, reply: FastifyReply) {
  if (err instanceof StudioError) return fail(reply, err.statusCode, err.code, err.message);
  throw err;
}

const audit = (client: PoolClient, req: FastifyRequest, action: string, resourceType: string, resourceId: string, payload: Record<string, unknown> = {}) =>
  writeAuditEntry(client, {
    tenantId: req.jwt.tenant_id, category: 'data', action, actorId: req.jwt.user_id, actorEmail: req.jwt.email,
    actorRole: req.jwt.role, resourceType, resourceId, payload, ipAddress: req.ip,
  });

async function invite(client: PoolClient, tenantId: string, clientUserId: string) {
  const token = await generateClientStudioMagicLinkToken(clientUserId, tenantId);
  const { rows: [u] } = await client.query(`SELECT email, first_name, language_preference FROM users WHERE id = $1`, [clientUserId]);
  const { rows: [t] } = await client.query(`SELECT name, slug FROM tenants WHERE id = $1`, [tenantId]);
  return { token, email: u.email as string, firstName: u.first_name as string, lang: (u.language_preference === 'es' ? 'es' : 'en') as 'en' | 'es', contractor: (t?.name as string) ?? 'Your contractor', slug: t?.slug as string | undefined };
}

/** Re-freeze a submitted scope's snapshots + roll the request range up after a contractor edit. */
async function refreeze(client: PoolClient, request: RequestRow, scope: ScopeRow, cache: CatalogCache) {
  if (scope.status !== 'submitted') return;
  const offering = await offeringFor(client, scope.trade_key);
  const { module, spec, pricing } = await priceScopeRow(client, scope, parseSettings(offering?.settings), cache);
  await client.query(
    `UPDATE design_request_scopes SET quantities_snapshot = $2::jsonb, summary_snapshot = $3::jsonb,
            range_low_cents = $4, range_high_cents = $5 WHERE id = $1`,
    [scope.id, JSON.stringify(pricing.quantities), JSON.stringify(summarizeSpec(module.steps, spec.values)),
      pricing.range.low_cents, pricing.range.high_cents]);
  await client.query(
    `UPDATE design_requests SET
       range_low_cents = (SELECT SUM(range_low_cents) FROM design_request_scopes WHERE request_id = $1 AND deleted_at IS NULL),
       range_high_cents = (SELECT SUM(range_high_cents) FROM design_request_scopes WHERE request_id = $1 AND deleted_at IS NULL)
     WHERE id = $1`, [request.id]);
}

export async function studioRoutes(app: FastifyInstance): Promise<void> {
  const pre = [authenticate, requireRole(...W)];

  // ── GET /v1/studio/usage — AI usage this calendar month (feeds the tier/pricing decision) ─────
  app.get('/studio/usage', { preHandler: pre }, async (req, reply) => {
    const rows = await withTenantContext(req.jwt.tenant_id, async (c) => {
      const res = await c.query(
        `SELECT feature, status, COUNT(*)::int AS n, COALESCE(SUM(cost_micro_usd), 0)::bigint AS cost
           FROM ai_usage_events WHERE created_at >= date_trunc('month', NOW())
          GROUP BY feature, status`);
      return res.rows as { feature: string; status: string; n: number; cost: string }[];
    });
    const features = ['studio.render', 'studio.assess', 'studio.guide'].map((f) => {
      const r = rows.filter((x) => x.feature === f);
      const sum = (st?: string) => r.filter((x) => !st || x.status === st).reduce((a, x) => a + x.n, 0);
      return {
        feature: f, total: sum(), ok: sum('ok'), failed: sum('failed'), blocked: sum('blocked'),
        cost_micro_usd: r.reduce((a, x) => a + Number(x.cost), 0),
      };
    });
    return reply.send({
      month_start: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString(),
      features,
      total_cost_micro_usd: features.reduce((a, f) => a + f.cost_micro_usd, 0),
      caps: studioCaps(),
    });
  });

  // ── GET /v1/studio/trades ─────────────────────────────────────────────────────────────────────
  app.get('/studio/trades', { preHandler: pre }, async (req, reply) => {
    const offerings = await withTenantContext(req.jwt.tenant_id, (c) => loadOfferings(c));
    const byKey = new Map(offerings.map((o) => [o.trade_key, o]));
    const trades = listIntakeModules().map((m) => {
      const def = tradeDef(m.trade_key);
      return {
        trade_key: m.trade_key, label: def?.label ?? m.trade_key, label_es: def?.label_es ?? m.trade_key,
        intake_version: m.intake_version, capabilities: m.capabilities,
        entry_points: m.entry_points.map((e) => ({ id: e.id, label: e.label })),
        offering: byKey.get(m.trade_key) ?? null,
      };
    });
    return reply.send({ trades });
  });

  // ── PUT /v1/studio/offerings/:trade_key ──────────────────────────────────────────────────────
  app.put('/studio/offerings/:trade_key', { preHandler: pre }, async (req, reply) => {
    const { trade_key } = req.params as { trade_key: string };
    const module = getIntakeModule(trade_key);
    if (!module || module.trade_key !== trade_key) {
      return fail(reply, 400, 'TRADE_NOT_SUPPORTED', `"${trade_key}" has no studio intake module`);
    }
    const body = OfferingSchema.safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', body.error.errors[0]?.message ?? 'Invalid body');
    const offering = await withTenantContext(req.jwt.tenant_id, async (c) => {
      const existing = await c.query(`SELECT id, settings FROM tenant_trade_offerings WHERE trade_key = $1 AND deleted_at IS NULL`, [trade_key]);
      const settings = parseSettings({ ...(existing.rows[0]?.settings ?? {}), ...(body.data.settings ?? {}) });
      let row;
      if (existing.rows[0]) {
        ({ rows: [row] } = await c.query(
          `UPDATE tenant_trade_offerings SET enabled = $2, display_order = COALESCE($3, display_order), settings = $4::jsonb
            WHERE id = $1 RETURNING id, trade_key, enabled, display_order, settings, version`,
          [existing.rows[0].id, body.data.enabled, body.data.display_order ?? null, JSON.stringify(settings)]));
      } else {
        ({ rows: [row] } = await c.query(
          `INSERT INTO tenant_trade_offerings (tenant_id, trade_key, enabled, display_order, settings, created_by)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING id, trade_key, enabled, display_order, settings, version`,
          [req.jwt.tenant_id, trade_key, body.data.enabled, body.data.display_order ?? 0, JSON.stringify(settings), req.jwt.user_id]));
      }
      await audit(c, req, 'studio.offering_updated', 'tenant_trade_offering', row.id, { trade_key, enabled: body.data.enabled });
      return row;
    });
    return reply.send({ offering });
  });

  // ── POST /v1/studio/invites ──────────────────────────────────────────────────────────────────
  app.post('/studio/invites', { preHandler: pre }, async (req, reply) => {
    const body = InviteSchema.safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', body.error.errors[0]?.message ?? 'Invalid body');
    const d = body.data;
    const { tenant_id, user_id } = req.jwt;
    try {
      const result = await withTenantContext(tenant_id, async (c) => {
        let module = null;
        if (d.trade_key) {
          module = getIntakeModule(d.trade_key);
          if (!module || !(await offeringFor(c, module.trade_key))) {
            throw new StudioError(422, 'TRADE_NOT_OFFERED', 'Enable this trade in Design Studio settings first');
          }
          if (d.entry_point_id && !module.entry_points.some((e) => e.id === d.entry_point_id)) {
            throw new StudioError(422, 'VALIDATION_ERROR', 'Unknown entry point for this trade');
          }
        }
        if (d.project_id) {
          const p = await c.query(`SELECT 1 FROM projects WHERE id = $1 AND deleted_at IS NULL`, [d.project_id]);
          if (!p.rows.length) throw new StudioError(422, 'PROJECT_NOT_FOUND', 'Project not found');
        }

        // Client user: reuse an existing client_portal user with this email, never another role.
        const email = d.email.toLowerCase();
        const ex = await c.query(`SELECT id, role FROM users WHERE lower(email) = $1 AND deleted_at IS NULL`, [email]);
        let clientId: string;
        if (ex.rows[0]) {
          if (ex.rows[0].role !== 'client_portal') {
            throw new StudioError(409, 'EMAIL_ALREADY_EXISTS', 'A team member already uses this email');
          }
          clientId = ex.rows[0].id;
        } else {
          // Passwordless (magic link). Clients are external — they don't consume a team seat.
          const hash = await bcrypt.hash(randomUUID(), 10);
          const ins = await c.query(
            `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, language_preference, status, created_by)
             VALUES ($1,$2,$3,$4,$5,'client_portal',$6,'invited',$7) RETURNING id`,
            [tenant_id, email, hash, d.first_name, d.last_name, d.language, user_id]);
          clientId = ins.rows[0].id;
        }
        if (d.project_id) {
          await c.query(
            `INSERT INTO project_members (tenant_id, project_id, user_id, role)
             SELECT $1,$2,$3,'client_portal' WHERE NOT EXISTS
               (SELECT 1 FROM project_members WHERE tenant_id = $1 AND project_id = $2 AND user_id = $3)`,
            [tenant_id, d.project_id, clientId]);
        }

        const { rows: [request] } = await c.query(
          `INSERT INTO design_requests (tenant_id, client_user_id, project_id, title, site, created_by)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING id, status, title, project_id, created_at`,
          [tenant_id, clientId, d.project_id ?? null, d.title ?? null, JSON.stringify(d.site ?? {}), user_id]);
        if (module) {
          const spec = newSpec(module, d.entry_point_id);
          await c.query(
            `INSERT INTO design_request_scopes (tenant_id, request_id, trade_key, intake_version, spec, created_by)
             VALUES ($1,$2,$3,$4,$5::jsonb,$6)`,
            [tenant_id, request.id, module.trade_key, module.intake_version, JSON.stringify(spec), user_id]);
        }
        await audit(c, req, 'studio.client_invited', 'design_request', request.id, { client_user_id: clientId, trade_key: module?.trade_key ?? null });
        return { request, clientId, inv: await invite(c, tenant_id, clientId) };
      });
      sendClientStudioInviteEmail(result.inv.email, result.inv.firstName, result.inv.contractor, result.inv.token, result.inv.lang, result.inv.slug)
        .catch((err) => req.log.warn({ err }, 'client studio invite email failed'));
      return reply.status(201).send({ request: result.request, client: { id: result.clientId, email: result.inv.email } });
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── POST /v1/studio/requests/:id/resend-invite ───────────────────────────────────────────────
  app.post('/studio/requests/:id/resend-invite', { preHandler: pre }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!uuid.safeParse(id).success) return fail(reply, 404, 'NOT_FOUND', 'Request not found');
    const inv = await withTenantContext(req.jwt.tenant_id, async (c) => {
      const r = await loadRequest(c, id);
      if (!r) return null;
      await audit(c, req, 'studio.invite_resent', 'design_request', id);
      return invite(c, req.jwt.tenant_id, r.client_user_id);
    });
    if (!inv) return fail(reply, 404, 'NOT_FOUND', 'Request not found');
    sendClientStudioInviteEmail(inv.email, inv.firstName, inv.contractor, inv.token, inv.lang, inv.slug)
      .catch((err) => req.log.warn({ err }, 'client studio invite email failed'));
    return reply.send({ sent: true });
  });

  // ── GET /v1/studio/requests ──────────────────────────────────────────────────────────────────
  app.get('/studio/requests', { preHandler: pre }, async (req, reply) => {
    const q = ListQuery.safeParse(req.query);
    if (!q.success) return fail(reply, 422, 'VALIDATION_ERROR', 'Invalid query');
    const { status, limit, cursor } = q.data;
    const rows = await withTenantContext(req.jwt.tenant_id, async (c) => {
      const params: unknown[] = [];
      let where = 'r.deleted_at IS NULL';
      if (status) { params.push(status); where += ` AND r.status = $${params.length}`; }
      if (cursor) { params.push(cursor); where += ` AND (r.created_at, r.id) < (SELECT created_at, id FROM design_requests WHERE id = $${params.length})`; }
      params.push(limit + 1);
      const res = await c.query(
        `SELECT r.id, r.status, r.title, r.project_id, r.range_low_cents, r.range_high_cents, r.submitted_at, r.created_at,
                u.first_name, u.last_name, u.email,
                COALESCE((SELECT json_agg(s.trade_key ORDER BY s.sort_order) FROM design_request_scopes s
                           WHERE s.request_id = r.id AND s.deleted_at IS NULL), '[]'::json) AS trades
           FROM design_requests r JOIN users u ON u.id = r.client_user_id
          WHERE ${where} ORDER BY r.created_at DESC, r.id DESC LIMIT $${params.length}`, params);
      return res.rows;
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return reply.send({ requests: page, pagination: { has_more: hasMore, next_cursor: hasMore ? page[page.length - 1].id : null } });
  });

  // ── GET /v1/studio/requests/:id ──────────────────────────────────────────────────────────────
  app.get('/studio/requests/:id', { preHandler: pre }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!uuid.safeParse(id).success) return fail(reply, 404, 'NOT_FOUND', 'Request not found');
    try {
      const bundle = await withTenantContext(req.jwt.tenant_id, async (c) => {
        const r = await loadRequest(c, id);
        if (!r) return null;
        const scopes = await loadScopes(c, id);
        const renders = await loadRenders(c, scopes.map((s) => s.id));
        const offerings = await loadOfferings(c);
        const cache: CatalogCache = {};
        const { rows: [client] } = await c.query(
          `SELECT id, email, first_name, last_name, language_preference, status FROM users WHERE id = $1`, [r.client_user_id]);
        const locs = new Set(scopes.map((s) => getIntakeModule(s.trade_key)?.location ?? 'exterior'));
        const commonSummary = summarizeSpec(commonSteps(locs.size === 1 ? [...locs][0]! : 'mixed'), r.common_values as never);
        return {
          request: r, client, common_summary: commonSummary,
          proposal: await proposalFor(c, r),
          scopes: await Promise.all(scopes.map((s) => contractorScopeDto(c, r, s, renders,
            parseSettings(offerings.find((o) => o.trade_key === s.trade_key)?.settings), cache))),
        };
      });
      if (!bundle) return fail(reply, 404, 'NOT_FOUND', 'Request not found');
      return reply.send(bundle);
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── PATCH /v1/studio/requests/:id/scopes/:sid ────────────────────────────────────────────────
  app.patch('/studio/requests/:id/scopes/:sid', { preHandler: pre }, async (req, reply) => {
    const { id, sid } = req.params as { id: string; sid: string };
    if (!uuid.safeParse(id).success || !uuid.safeParse(sid).success) return fail(reply, 404, 'NOT_FOUND', 'Scope not found');
    const body = ScopeEditSchema.safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', body.error.errors[0]?.message ?? 'Invalid body');
    try {
      const out = await withTenantContext(req.jwt.tenant_id, async (c) => {
        const r = await loadRequest(c, id);
        const s = r && await loadScope(c, id, sid);
        if (!r || !s) throw new StudioError(404, 'NOT_FOUND', 'Scope not found');
        if (r.status === 'converted' || r.status === 'declined') throw new StudioError(409, 'REQUEST_CLOSED', 'This request is closed');
        if (s.version !== body.data.version) throw new StudioError(409, 'VERSION_CONFLICT', 'Scope changed — reload and try again');
        const { module, spec } = currentSpec(s);
        let next = spec;
        let dropped: string[] = [];
        if (body.data.values) {
          // Photos are the client's: a contractor may remove one, never add a file id (it could name
          // any tenant file and the client DTO would hand out a download link for it).
          const before = new Set(photoFileIds(module, spec));
          ({ spec: next, dropped } = applyPatch(module, spec, body.data.values, 'contractor'));
          if (photoFileIds(module, next).some((fid) => !before.has(fid))) {
            throw new StudioError(422, 'PHOTOS_CLIENT_ONLY', 'Only the client can add photos');
          }
        }
        await c.query(
          `UPDATE design_request_scopes SET spec = $2::jsonb, intake_version = $3,
                  measurements_verified = COALESCE($4, measurements_verified)
            WHERE id = $1`,
          [sid, JSON.stringify(next), module.intake_version, body.data.measurements_verified ?? null]);
        const cache: CatalogCache = {};
        await refreeze(c, r, (await loadScope(c, id, sid))!, cache);
        await audit(c, req, 'studio.scope_reviewed', 'design_request_scope', sid,
          { measurements_verified: body.data.measurements_verified, fields: Object.keys(body.data.values ?? {}) });
        const offering = await offeringFor(c, s.trade_key);
        const renders = await loadRenders(c, [sid]);
        return { scope: await contractorScopeDto(c, (await loadRequest(c, id))!, (await loadScope(c, id, sid))!, renders, parseSettings(offering?.settings), cache), dropped };
      });
      return reply.send(out);
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── POST /v1/studio/requests/:id/estimate ────────────────────────────────────────────────────
  app.post('/studio/requests/:id/estimate', { preHandler: pre }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!uuid.safeParse(id).success) return fail(reply, 404, 'NOT_FOUND', 'Request not found');
    const name = z.object({ name: z.string().min(1).max(200).optional() }).safeParse(req.body ?? {});
    if (!name.success) return fail(reply, 422, 'VALIDATION_ERROR', 'Invalid name');
    try {
      const est = await withTenantContext(req.jwt.tenant_id, async (c) => {
        // Row lock: two clicks (or two PMs) must not both pass the estimate_id check and create two estimates.
        const r = await lockRequest(c, id);
        if (!r) throw new StudioError(404, 'NOT_FOUND', 'Request not found');
        if (r.estimate_id) throw new StudioError(409, 'ESTIMATE_EXISTS', 'An estimate already exists for this request');
        if (r.status !== 'submitted' && r.status !== 'reviewed') throw new StudioError(409, 'NOT_SUBMITTED', 'The client has not submitted this request yet');
        const scopes = await loadScopes(c, id);
        const offerings = await loadOfferings(c);
        const settingsFor = (k: string) => parseSettings(offerings.find((o) => o.trade_key === k)?.settings);
        const first = settingsFor(scopes[0]?.trade_key ?? '');
        // An estimate carries ONE burdened labor rate + one markup set (T-63), and recomputeEstimateTotals
        // reprices every line at it. Price every scope at those settings up front so the draft doesn't
        // silently drift from what was inserted, and flag it when the scopes' trade settings disagree.
        const rateKeys = ['labor_rate_cents', 'overhead_pct', 'profit_pct', 'tax_pct', 'contingency_pct'] as const;
        const mixedSettings = scopes.some((sc) => rateKeys.some((k) => settingsFor(sc.trade_key)[k] !== first[k]));
        const { rows: [client] } = await c.query(`SELECT first_name, last_name FROM users WHERE id = $1`, [r.client_user_id]);
        const trades = [...new Set(scopes.map((s) => estTradeFor(s.trade_key)))];
        const { rows: [e] } = await c.query(
          `INSERT INTO estimates (tenant_id, project_id, name, trade, mode, labor_rate_cents, overhead_pct, profit_pct, tax_pct,
                                  contingency_pct, notes, created_by)
           VALUES ($1,$2,$3,$4,'assembly',$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
          [req.jwt.tenant_id, r.project_id, name.data.name ?? `${r.title ?? 'Design Studio'} — ${client.first_name} ${client.last_name}`,
            trades.length === 1 ? trades[0] : null, first.labor_rate_cents, first.overhead_pct, first.profit_pct, first.tax_pct,
            first.contingency_pct,
            `From Design Studio request ${id}. Verify measurements on site before sending.` +
              (mixedSettings ? ` The trades on this request use different rates/markups in Design Studio settings; this estimate uses the ${scopes[0]!.trade_key} settings for every line — review before sending.` : ''),
            req.jwt.user_id]);
        const cache: CatalogCache = {};
        let so = 0;
        for (const s of scopes) {
          const { pricing } = await priceScopeRow(c, s, first, cache);
          for (const d of pricing.lines) {
            await c.query(
              `INSERT INTO estimate_line_items
                 (tenant_id, estimate_id, assembly_id, assembly_code, trade, description, csi_division, unit, quantity,
                  material_unit_cents, labor_hours_per_unit, equipment_unit_cents, waste_pct,
                  material_cents, labor_hours, labor_cents, equipment_cents, extended_cents, assumptions, source, sort_order)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,'rule_engine',$20)`,
              [req.jwt.tenant_id, e.id, d.assembly_id, d.assembly_code, d.trade, d.description, d.csi_division, d.unit, d.quantity,
                d.material_unit_cents, d.labor_hours_per_unit, d.equipment_unit_cents, d.waste_pct,
                d.material_cents, d.labor_hours, d.labor_cents, d.equipment_cents, d.extended_cents,
                JSON.stringify([...d.assumptions, `Design Studio: ${s.trade_key}`]), (++so) * 10]);
          }
        }
        await recomputeEstimateTotals(c, e.id);
        await c.query(`UPDATE design_requests SET estimate_id = $2, status = 'reviewed' WHERE id = $1`, [id, e.id]);
        await audit(c, req, 'studio.estimate_created', 'design_request', id, { estimate_id: e.id });
        return e.id as string;
      });
      return reply.status(201).send({ estimate_id: est });
    } catch (err) {
      return handleErr(err, reply);
    }
  });

  // ── POST /v1/studio/requests/:id/convert — accepted work becomes a project (P4) ──────────────
  // OWNER/PM only (same as POST /v1/projects) + the project tier limit. Reuses an existing project
  // when the client was invited onto one; links the estimate; the client becomes a project member so
  // the read-only client portal shows the job.
  app.post('/studio/requests/:id/convert', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!uuid.safeParse(id).success) return fail(reply, 404, 'NOT_FOUND', 'Request not found');
    const body = z.object({ name: z.string().min(1).max(200).optional() }).safeParse(req.body ?? {});
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', 'Invalid name');
    const { tenant_id, user_id } = req.jwt;
    try {
      const existing = await withTenantContext(tenant_id, (c) => loadRequest(c, id));
      if (!existing) throw new StudioError(404, 'NOT_FOUND', 'Request not found');
      if (existing.status === 'converted') throw new StudioError(409, 'ALREADY_CONVERTED', 'This request is already a project');
      if (existing.status !== 'submitted' && existing.status !== 'reviewed') throw new StudioError(409, 'NOT_SUBMITTED', 'The client has not submitted this request yet');
      if (!existing.project_id) await assertCanCreateProject(tenant_id);

      const project = await withTenantContext(tenant_id, async (c) => {
        // Re-check under a row lock: the checks above ran in another transaction, so a double-click
        // (or two PMs) could otherwise both create a project and both mark the request converted.
        const r = await lockRequest(c, id);
        if (!r) throw new StudioError(404, 'NOT_FOUND', 'Request not found');
        if (r.status === 'converted') throw new StudioError(409, 'ALREADY_CONVERTED', 'This request is already a project');
        if (r.status !== 'submitted' && r.status !== 'reviewed') throw new StudioError(409, 'NOT_SUBMITTED', 'The client has not submitted this request yet');
        let projectId = r.project_id;
        let created = false;
        if (!projectId) {
          const { rows: [u] } = await c.query(`SELECT first_name, last_name FROM users WHERE id = $1`, [r.client_user_id]);
          const site = r.site as Record<string, string | undefined>;
          const name = body.data.name ?? r.title ?? `${u.first_name} ${u.last_name}`;
          const { rows: [p] } = await c.query(
            `INSERT INTO projects (tenant_id, name, status, address, city, state, zip, created_by)
             VALUES ($1,$2,'active',$3,$4,$5,$6,$7) RETURNING id, address, city, zip`,
            [tenant_id, name, site.address ?? null, site.city ?? null, site.state ?? null, site.zip ?? null, user_id]);
          projectId = p.id as string;
          created = true;
          await audit(c, req, 'project.created', 'project', projectId, { name, source: 'design_studio', design_request_id: id });
        }
        await c.query(
          `INSERT INTO project_members (tenant_id, project_id, user_id, role)
           SELECT $1,$2,$3,'client_portal' WHERE NOT EXISTS
             (SELECT 1 FROM project_members WHERE tenant_id = $1 AND project_id = $2 AND user_id = $3)`,
          [tenant_id, projectId, r.client_user_id]);
        if (r.estimate_id) await c.query(`UPDATE estimates SET project_id = $2 WHERE id = $1 AND project_id IS NULL`, [r.estimate_id, projectId]);
        await c.query(`UPDATE design_requests SET project_id = $2, status = 'converted' WHERE id = $1`, [id, projectId]);
        await audit(c, req, 'studio.request_converted', 'design_request', id, { project_id: projectId, created });
        return { id: projectId, created, geocode: created && Object.values(r.site ?? {}).some(Boolean) };
      });
      if (project.geocode) {
        await sendJob('geocode.project', tenant_id, { project_id: project.id }).catch((err) => req.log.warn({ err }, 'geocode enqueue failed'));
      }
      return reply.status(201).send({ project_id: project.id, created: project.created });
    } catch (err) {
      if (err instanceof TierEnforcementError) {
        return reply.status(402).send({ error: { code: err.code, message: err.message, upgrade_to: err.upgradeToTier } });
      }
      return handleErr(err, reply);
    }
  });

  // ── POST /v1/studio/requests/:id/decline ─────────────────────────────────────────────────────
  app.post('/studio/requests/:id/decline', { preHandler: pre }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!uuid.safeParse(id).success) return fail(reply, 404, 'NOT_FOUND', 'Request not found');
    const body = z.object({ reason: z.string().max(1000).optional() }).safeParse(req.body ?? {});
    if (!body.success) return fail(reply, 422, 'VALIDATION_ERROR', 'Invalid reason');
    const ok = await withTenantContext(req.jwt.tenant_id, async (c) => {
      const res = await c.query(
        `UPDATE design_requests SET status = 'declined', decline_reason = $2
          WHERE id = $1 AND deleted_at IS NULL AND status IN ('draft','submitted','reviewed') RETURNING id`,
        [id, body.data.reason ?? null]);
      if (!res.rows.length) return false;
      await audit(c, req, 'studio.request_declined', 'design_request', id);
      return true;
    });
    if (!ok) return fail(reply, 409, 'NOT_DECLINABLE', 'Request not found or already closed');
    return reply.send({ declined: true });
  });
}
