// routes/v1/connections.ts — Cross-tenant GC↔Sub connection lifecycle
// Locked decisions: T-44, T-45, P-02, A-07
// tenant_connections and shared_project_events have NO RLS — application-layer guard only (T-44)
// Connection membership validated before every cross-tenant data access (T-45)
// Schema built in v1.0; user-accessible feature in v1.1 (P-02)

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pgPool } from '../../lib/db.js';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { sendJob } from '../../lib/queue.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { assertHasAddon, assertCanCreateProject } from '../../services/tier-enforcement.js';
import { normalizeTradeKey } from '../../lib/trades/taxonomy.js';
import {
  validateConnectionMembership,
  publishSharedEvent,
  publishIfActive,
  notifyCounterparty,
  readGcProjectSiteSnapshot,
  buildProjectLocationPayload,
  eventTypePermitted,
  GENERIC_EVENT_TYPES,
  RESERVED_EVENT_PREFIXES,
  type ConnectionRow,
  type ConnectionPermissions,
} from '../../lib/cross-tenant/bridge.js';

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function connectionRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /v1/connections/lookup — resolve a tenant by slug or user email ──
  // Exact match only (no fuzzy, no listing). Addon-gated FIRST so a scanner without the
  // paid feature learns nothing. Uniform 404 on miss (anti-enumeration); returns name only.
  app.get(
    '/connections/lookup',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;
      await assertHasAddon(tenant_id, 'cross_tenant');

      const q = z
        .object({ slug: z.string().min(1).max(100).optional(), email: z.string().email().optional() })
        .refine((v) => (v.slug ? !v.email : !!v.email), { message: 'exactly one of slug or email' })
        .safeParse(req.query);
      if (!q.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Provide exactly one of slug or email' } });
      }

      let match: { tenant_id: string; name: string } | null = null;
      if (q.data.slug) {
        const r = await pgPool.query<{ id: string; name: string }>(
          `SELECT id, name FROM tenants WHERE slug = $1 AND deleted_at IS NULL`,
          [q.data.slug],
        );
        if (r.rows[0]) match = { tenant_id: r.rows[0].id, name: r.rows[0].name };
      } else {
        // users is FORCE RLS — cross_tenant_lookup_tenant_by_email (SECURITY DEFINER, migration
        // 0039) is the one governed exception: tenant ids only, exact match, LIMIT 2.
        const r = await pgPool.query<{ tenant_id: string }>(
          `SELECT tenant_id FROM cross_tenant_lookup_tenant_by_email($1)`,
          [q.data.email],
        );
        if (r.rows.length > 1) {
          return reply.status(409).send({ error: { code: 'EMAIL_AMBIGUOUS', message: 'Email matches more than one company — use the company slug instead' } });
        }
        if (r.rows[0]) {
          const t = await pgPool.query<{ id: string; name: string }>(
            `SELECT id, name FROM tenants WHERE id = $1 AND deleted_at IS NULL`,
            [r.rows[0].tenant_id],
          );
          if (t.rows[0]) match = { tenant_id: t.rows[0].id, name: t.rows[0].name };
        }
      }

      if (!match) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'No company found' } });
      }

      await withTenantContext(tenant_id, async (client) => {
        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'cross_tenant',
          action: 'connection.lookup',
          actorId: user_id,
          actorEmail: req.jwt.email,
          actorRole: req.jwt.role,
          resourceType: 'tenant',
          resourceId: match.tenant_id,
          payload: { mode: q.data.slug ? 'slug' : 'email' },
          ipAddress: req.ip,
        });
      });

      return reply.status(200).send({ tenant: match });
    },
  );

  // ── GET /v1/connections/map — cross-tenant site pins (Doc 20 Phase 6b) ───
  // Latest project.location event per ACTIVE connection where the caller is NOT the source.
  // Membership validation IS the WHERE clause (T-45); fields come only from the whitelisted
  // payload. Today only the GC publishes locations, so this is primarily the SUB's view of
  // GC sites; sub→GC publishing is a deferred follow-on.
  app.get(
    '/connections/map',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id } = req.jwt;
      await assertHasAddon(tenant_id, 'cross_tenant');

      const result = await pgPool.query<{
        connection_id: string;
        payload: Record<string, unknown>;
        created_at: string;
        counterparty_name: string;
      }>(
        `SELECT DISTINCT ON (e.connection_id)
                e.connection_id, e.payload, e.created_at,
                CASE WHEN c.gc_tenant_id = $1 THEN ts.name ELSE tg.name END AS counterparty_name
           FROM shared_project_events e
           JOIN tenant_connections c ON c.id = e.connection_id
           JOIN tenants tg ON tg.id = c.gc_tenant_id
           JOIN tenants ts ON ts.id = c.sub_tenant_id
          WHERE (c.gc_tenant_id = $1 OR c.sub_tenant_id = $1)
            AND c.status = 'active'
            AND e.event_type = 'project.location'
            AND e.source_tenant_id <> $1
          ORDER BY e.connection_id, e.created_at DESC, e.id DESC
          LIMIT 500`,
        [tenant_id],
      );

      const pins = result.rows
        .map((r) => ({
          connection_id: r.connection_id,
          counterparty_name: r.counterparty_name,
          project_name: r.payload.project_name ?? null,
          lat: r.payload.lat ?? null,
          lng: r.payload.lng ?? null,
          status: r.payload.status ?? null,
          geocode_status: r.payload.geocode_status ?? null,
          city: r.payload.city ?? null,
          state: r.payload.state ?? null,
        }))
        .filter((p) => p.lat !== null && p.lng !== null);

      return reply.status(200).send({ pins });
    },
  );

  // ── Discovery (Doc 07 §3.3) — opt-in fuzzy directory ─────────────────────
  // tenant_discovery_profiles is NO-RLS (T-44 class): opt-in by construction —
  // a row only holds directory fields the tenant's OWNER chose to publish.
  // The SELECT column list below is the leak whitelist — never widen it.

  // GET /v1/connections/discovery-profile — own tenant's directory profile.
  // No addon gate: being findable is free (mirrors the decline rationale —
  // controlling your own exposure must never require purchasing the add-on).
  app.get(
    '/connections/discovery-profile',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const r = await pgPool.query(
        `SELECT discoverable, trades, states, service_area, updated_at
           FROM tenant_discovery_profiles WHERE tenant_id = $1`,
        [req.jwt.tenant_id],
      );
      const row = r.rows[0];
      return reply.status(200).send({
        profile: row
          ? { discoverable: row.discoverable, trades: row.trades, states: row.states, service_area: row.service_area, updated_at: row.updated_at }
          : { discoverable: false, trades: [], states: [], service_area: null, updated_at: null },
      });
    },
  );

  // PUT /v1/connections/discovery-profile — OWNER only (org-exposure decision,
  // settings-org precedent). Trades validated against the canonical taxonomy
  // (T-64) — aliases collapse to canonical keys, unknown keys → 422.
  app.put(
    '/connections/discovery-profile',
    { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const schema = z.object({
        discoverable: z.boolean(),
        trades: z.array(z.string().min(1).max(64)).max(20).default([]),
        states: z.array(z.string().regex(/^[A-Z]{2}$/)).max(10).default([]),
        service_area: z.string().max(500).nullable().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid discovery profile' } });
      }
      const trades: string[] = [];
      for (const raw of parsed.data.trades) {
        const key = normalizeTradeKey(raw);
        if (!key) {
          return reply.status(422).send({ error: { code: 'UNKNOWN_TRADE', message: `Unknown trade: ${raw}`, field: 'trades' } });
        }
        if (!trades.includes(key)) trades.push(key);
      }
      const states = [...new Set(parsed.data.states)];
      const { tenant_id, user_id } = req.jwt;

      const r = await pgPool.query(
        `INSERT INTO tenant_discovery_profiles (tenant_id, discoverable, trades, states, service_area, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (tenant_id) DO UPDATE
           SET discoverable = EXCLUDED.discoverable,
               trades = EXCLUDED.trades,
               states = EXCLUDED.states,
               service_area = EXCLUDED.service_area,
               updated_by = EXCLUDED.updated_by,
               updated_at = NOW()
         RETURNING discoverable, trades, states, service_area, updated_at`,
        [tenant_id, parsed.data.discoverable, trades, states, parsed.data.service_area ?? null, user_id],
      );

      await withTenantContext(tenant_id, async (client) => {
        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'cross_tenant',
          action: 'connection.discovery_profile_updated',
          actorId: user_id,
          actorEmail: req.jwt.email,
          actorRole: req.jwt.role,
          resourceType: 'tenant_discovery_profile',
          resourceId: tenant_id,
          payload: { discoverable: parsed.data.discoverable, trades, states },
          ipAddress: req.ip,
        });
      });

      return reply.status(200).send({ profile: r.rows[0] });
    },
  );

  // GET /v1/connections/discovery?q=&trade=&state= — fuzzy directory search.
  // Addon-gated FIRST (mirrors /connections/lookup — a scanner without the paid
  // feature learns nothing). q is REQUIRED (no browse-all listing); ILIKE
  // metacharacters are escaped so q='%%'/'__' cannot bypass the min-length
  // guard; similarity() gets the raw q (no metacharacters there). Stateless
  // similarity(a,b) >= 0.3 only — set_limit()/% operator are session-GUC-based
  // and forbidden under PgBouncer transaction mode (T-48 class). Capped at 10.
  app.get(
    '/connections/discovery',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;
      await assertHasAddon(tenant_id, 'cross_tenant');

      const schema = z.object({
        q: z.string().min(2).max(100),
        trade: z.string().min(1).max(64).optional(),
        state: z.string().regex(/^[A-Z]{2}$/).optional(),
      });
      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'q (2-100 chars) is required; trade/state optional' } });
      }
      const { q, state } = parsed.data;
      let trade: string | undefined;
      if (parsed.data.trade) {
        const key = normalizeTradeKey(parsed.data.trade);
        if (!key) {
          return reply.status(422).send({ error: { code: 'UNKNOWN_TRADE', message: `Unknown trade: ${parsed.data.trade}`, field: 'trade' } });
        }
        trade = key;
      }

      const esc = q.replace(/[\\%_]/g, '\\$&');
      const params: unknown[] = [tenant_id, esc, q];
      const filters: string[] = [];
      if (trade) {
        params.push(trade);
        filters.push(`$${params.length} = ANY(p.trades)`);
      }
      if (state) {
        params.push(state);
        filters.push(`$${params.length} = ANY(p.states)`);
      }

      const r = await pgPool.query(
        `SELECT p.tenant_id, t.name, p.trades, p.states, p.service_area
           FROM tenant_discovery_profiles p
           JOIN tenants t ON t.id = p.tenant_id
          WHERE p.discoverable
            AND t.deleted_at IS NULL
            AND p.tenant_id <> $1
            AND (t.name ILIKE '%' || $2 || '%' ESCAPE '\\' OR similarity(t.name, $3) >= 0.3)
            ${filters.length ? 'AND ' + filters.join(' AND ') : ''}
          ORDER BY similarity(t.name, $3) DESC, t.name ASC
          LIMIT 10`,
        params,
      );

      await withTenantContext(tenant_id, async (client) => {
        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'cross_tenant',
          action: 'connection.discovery_search',
          actorId: user_id,
          actorEmail: req.jwt.email,
          actorRole: req.jwt.role,
          resourceType: 'tenant_discovery_profile',
          payload: { q, trade: trade ?? null, state: state ?? null, result_count: r.rows.length },
          ipAddress: req.ip,
        });
      });

      return reply.status(200).send({ results: r.rows });
    },
  );

  // ── POST /v1/connections — GC invites a sub ──────────────────────────────
  app.post(
    '/connections',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const schema = z.object({
        sub_tenant_id: z.string().uuid(),
        project_id: z.string().uuid().optional(),
        scope_description: z.string().min(1).max(2000).optional(),
        contract_value_cents: z.number().int().min(0).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'sub_tenant_id (uuid) is required' } });
      }

      const { tenant_id: gc_tenant_id, user_id } = req.jwt;
      const { sub_tenant_id, project_id, scope_description, contract_value_cents } = parsed.data;

      if (sub_tenant_id === gc_tenant_id) {
        return reply.status(400).send({ error: { code: 'INVALID_REQUEST', message: 'Cannot connect a tenant to itself' } });
      }

      // Tier gate (PR-08): cross-tenant collaboration requires the add-on on Professional
      // (included Business+). Throws TierEnforcementError → 402 ADDON_REQUIRED via the error handler.
      await assertHasAddon(gc_tenant_id, 'cross_tenant');

      // Verify sub tenant exists
      const subCheck = await pgPool.query<{ id: string }>(
        `SELECT id FROM tenants WHERE id = $1 AND deleted_at IS NULL`,
        [sub_tenant_id],
      );
      if (subCheck.rowCount === 0) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Sub tenant not found' } });
      }

      // If a project link was supplied, verify it belongs to the CALLER (RLS-scoped read) —
      // prevents attaching someone else's project id to the connection.
      let gcProjectName: string | null = null;
      if (project_id) {
        const proj = await withTenantContext(gc_tenant_id, async (client) => {
          const { rows } = await client.query<{ name: string }>(
            `SELECT name FROM projects WHERE id = $1 AND deleted_at IS NULL`,
            [project_id],
          );
          return rows[0] ?? null;
        });
        if (!proj) {
          return reply.status(404).send({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } });
        }
        gcProjectName = proj.name;
      }

      // Check for existing open connection (revoked/rejected/completed allow a fresh re-invite)
      const existing = await pgPool.query<{ id: string; status: string }>(
        `SELECT id, status FROM tenant_connections
         WHERE gc_tenant_id = $1 AND sub_tenant_id = $2 AND status NOT IN ('revoked', 'rejected', 'completed')
         LIMIT 1`,
        [gc_tenant_id, sub_tenant_id],
      );
      if ((existing.rowCount ?? 0) > 0) {
        return reply.status(409).send({ error: { code: 'CONNECTION_EXISTS', message: 'An active or pending connection already exists' } });
      }

      // Insert connection
      const result = await pgPool.query<ConnectionRow>(
        `INSERT INTO tenant_connections
           (gc_tenant_id, sub_tenant_id, status, invited_by, project_id, scope_description, contract_value_cents, created_at, updated_at)
         VALUES ($1, $2, 'pending', $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, gc_tenant_id, sub_tenant_id, status, invited_by, created_at, updated_at,
                   project_id, scope_description, contract_value_cents`,
        [gc_tenant_id, sub_tenant_id, user_id, project_id ?? null, scope_description ?? null, contract_value_cents ?? null],
      );
      const connection = result.rows[0];

      // Audit — use GC tenant context (T-45: all cross-tenant access audited)
      await withTenantContext(gc_tenant_id, async (client) => {
        await writeAuditEntry(client, {
          tenantId: gc_tenant_id,
          category: 'cross_tenant',
          action: 'connection.invite_sent',
          actorId: user_id,
          actorEmail: req.jwt.email,
          actorRole: req.jwt.role,
          resourceType: 'tenant_connection',
          resourceId: connection.id,
          payload: { sub_tenant_id, connection_id: connection.id },
          ipAddress: req.ip,
        });
      });

      // Enqueue job to notify sub users (worker uses withTenantContext(sub_tenant_id)).
      // project_name/scope are the GC's own strings, deliberately shared with the invitee.
      await sendJob('connection.invite_sent', sub_tenant_id, {
        connection_id: connection.id,
        gc_tenant_id,
        sub_tenant_id,
        project_name: gcProjectName,
        scope_description: scope_description ?? null,
      });

      return reply.status(201).send({ connection });
    },
  );

  // ── POST /v1/connections/:id/accept — Sub accepts invitation ─────────────
  app.post(
    '/connections/:id/accept',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id } = req.jwt;

      const conn = await pgPool.query<ConnectionRow>(
        `SELECT id, gc_tenant_id, sub_tenant_id, status, project_id, scope_description
           FROM tenant_connections WHERE id = $1`,
        [id],
      );
      if (conn.rowCount === 0) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Connection not found' } });
      }

      const connection = conn.rows[0];

      // Caller must be the sub_tenant_id (only sub can accept)
      if (connection.sub_tenant_id !== tenant_id) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only the invited sub can accept this connection' } });
      }

      if (connection.status !== 'pending') {
        return reply.status(409).send({ error: { code: 'INVALID_STATUS', message: `Connection is already ${connection.status}` } });
      }

      // Tier gate (PR-08): the Sub also needs the cross-tenant add-on to connect (a Professional
      // sub without it must upgrade/buy the add-on; included Business+). Checked after membership +
      // status so non-members still get 403 and stale invites still 409 — tier info isn't leaked.
      await assertHasAddon(tenant_id, 'cross_tenant');

      // Doc 07 §6 — accept instantiates a REAL project in the Sub's tenant when the invite
      // carries a GC project link. Accept is blocked at the sub's project limit (402, connection
      // stays pending — retryable) to keep the invariant: accepted + project ⇒ mirror exists.
      let subProject: { id: string; name: string } | null = null;
      let snapshot: Awaited<ReturnType<typeof readGcProjectSiteSnapshot>> = null;
      if (connection.project_id) {
        await assertCanCreateProject(tenant_id);

        snapshot = await readGcProjectSiteSnapshot(connection.gc_tenant_id, connection.project_id);
        const gcTenant = await pgPool.query<{ name: string }>(
          `SELECT name FROM tenants WHERE id = $1`,
          [connection.gc_tenant_id],
        );
        const gcTenantName = gcTenant.rows[0]?.name ?? 'General Contractor';

        const projectName = `${snapshot?.name ?? 'Project'} — ${connection.scope_description ?? 'Subcontract'} (${gcTenantName})`.slice(0, 255);

        // Runs in the CALLER's (sub's) own tenant context — this is the sub's own project row.
        subProject = await withTenantContext(tenant_id, async (client) => {
          const { rows } = await client.query<{ id: string; name: string; address: string | null }>(
            `INSERT INTO projects
               (tenant_id, name, status, address, city, state, zip, latitude, longitude, geocode_status, connection_id, created_by)
             VALUES (current_setting('app.current_tenant_id')::uuid, $1, 'active', $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id, name, address`,
            [
              projectName,
              snapshot?.address ?? null,
              snapshot?.city ?? null,
              snapshot?.state ?? null,
              snapshot?.zip ?? null,
              snapshot?.latitude ?? null,
              snapshot?.longitude ?? null,
              snapshot?.latitude != null ? snapshot.geocode_status : 'pending',
              id,
              user_id,
            ],
          );
          return rows[0];
        });
        if (snapshot?.latitude == null && snapshot?.address) {
          await sendJob('geocode.project', tenant_id, { project_id: subProject.id });
        }
      }

      await pgPool.query(
        `UPDATE tenant_connections SET status = 'active', updated_at = NOW() WHERE id = $1`,
        [id],
      );

      // Materialize the site transfer on the bridge ledger (source = GC — it's the GC's data;
      // also what makes the sub's `/connections/map` query `source != caller` return it).
      if (snapshot) {
        await publishIfActive(id, connection.gc_tenant_id, 'project.location', buildProjectLocationPayload(snapshot));
      }

      // Audit — connection.accepted in the sub's log; the governed snapshot copy in BOTH logs.
      const auditCopy = async (tid: string) =>
        withTenantContext(tid, async (client) => {
          await writeAuditEntry(client, {
            tenantId: tid,
            category: 'cross_tenant',
            action: 'connection.project_snapshot_copied',
            actorId: user_id,
            actorEmail: req.jwt.email,
            actorRole: req.jwt.role,
            resourceType: 'tenant_connection',
            resourceId: id,
            payload: { connection_id: id, sub_project_id: subProject?.id ?? null },
            ipAddress: req.ip,
          });
        });

      await withTenantContext(tenant_id, async (client) => {
        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'cross_tenant',
          action: 'connection.accepted',
          actorId: user_id,
          actorEmail: req.jwt.email,
          actorRole: req.jwt.role,
          resourceType: 'tenant_connection',
          resourceId: id,
          payload: { gc_tenant_id: connection.gc_tenant_id, sub_project_id: subProject?.id ?? null },
          ipAddress: req.ip,
        });
      });
      if (subProject) {
        await auditCopy(tenant_id);
        await auditCopy(connection.gc_tenant_id);
      }

      return reply.status(200).send({ connection: { id, status: 'active' }, project: subProject });
    },
  );

  // ── POST /v1/connections/:id/decline — Sub declines a pending invite ─────
  // NO addon gate: refusing a connection must never require purchasing the add-on.
  app.post(
    '/connections/:id/decline',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id } = req.jwt;

      const conn = await pgPool.query<ConnectionRow>(
        `SELECT id, gc_tenant_id, sub_tenant_id, status FROM tenant_connections WHERE id = $1`,
        [id],
      );
      // Uniform 403 for missing OR non-sub caller (anti-enumeration, same shape as accept's 403)
      if (conn.rowCount === 0 || conn.rows[0].sub_tenant_id !== tenant_id) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only the invited sub can decline this connection' } });
      }
      const connection = conn.rows[0];
      if (connection.status !== 'pending') {
        return reply.status(409).send({ error: { code: 'INVALID_STATUS', message: `Connection is already ${connection.status}` } });
      }

      await pgPool.query(
        `UPDATE tenant_connections SET status = 'rejected', updated_at = NOW() WHERE id = $1`,
        [id],
      );

      await withTenantContext(tenant_id, async (client) => {
        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'cross_tenant',
          action: 'connection.declined',
          actorId: user_id,
          actorEmail: req.jwt.email,
          actorRole: req.jwt.role,
          resourceType: 'tenant_connection',
          resourceId: id,
          payload: { gc_tenant_id: connection.gc_tenant_id },
          ipAddress: req.ip,
        });
      });

      await notifyCounterparty(id, tenant_id, 'connection.declined', {});

      return reply.status(200).send({ connection: { id, status: 'rejected' } });
    },
  );

  // ── POST /v1/connections/:id/revoke — Either party revokes (Doc 07 §8.2) ─────
  // reason_code drives the sub mirror project's disposition in the worker:
  // mutual_agreement → 'completed'; terminated_for_cause/other → 'on_hold'.
  // 'completed' is deliberately NOT a revoke reason — use POST /:id/complete.
  app.post(
    '/connections/:id/revoke',
    { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id } = req.jwt;

      const body = z
        .object({ reason_code: z.enum(['terminated_for_cause', 'mutual_agreement', 'other']).default('other') })
        .default({})
        .safeParse(req.body ?? {});
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'reason_code must be terminated_for_cause, mutual_agreement or other' } });
      }
      const reasonCode = body.data.reason_code;

      const conn = await pgPool.query<ConnectionRow>(
        `SELECT id, gc_tenant_id, sub_tenant_id, status FROM tenant_connections WHERE id = $1`,
        [id],
      );
      if (conn.rowCount === 0) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Connection not found' } });
      }

      const connection = conn.rows[0];

      // Caller must be gc OR sub (T-45 membership check)
      if (connection.gc_tenant_id !== tenant_id && connection.sub_tenant_id !== tenant_id) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this connection' } });
      }

      if (connection.status === 'revoked') {
        return reply.status(409).send({ error: { code: 'ALREADY_REVOKED', message: 'Connection is already revoked' } });
      }
      if (connection.status === 'completed') {
        return reply.status(409).send({ error: { code: 'ALREADY_CLOSED', message: 'Connection is already completed' } });
      }

      await pgPool.query(
        `UPDATE tenant_connections
            SET status = 'revoked', closed_reason = $2, closed_at = NOW(), updated_at = NOW()
          WHERE id = $1`,
        [id, reasonCode],
      );

      // Audit — scope to calling tenant
      await withTenantContext(tenant_id, async (client) => {
        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'cross_tenant',
          action: 'connection.revoked',
          actorId: user_id,
          actorEmail: req.jwt.email,
          actorRole: req.jwt.role,
          resourceType: 'tenant_connection',
          resourceId: id,
          payload: { revoked_by_tenant_id: tenant_id, reason_code: reasonCode },
          ipAddress: req.ip,
        });
      });

      // Sub's bridge-instantiated mirror project (if any) is dispositioned ASYNC in the sub's
      // own tenant context — never inline from a possibly-GC-initiated request (A-07 + T-10).
      await sendJob('connection.revoked', connection.sub_tenant_id, {
        connection_id: id,
        revoked_by_tenant_id: tenant_id,
        reason_code: reasonCode,
      });

      return reply.status(200).send({ revoked: true, reason_code: reasonCode });
    },
  );

  // ── GET /v1/connections — List connections for the calling tenant ─────────
  // No RLS — raw pgPool with tenant_id in WHERE clause (T-44)
  app.get(
    '/connections',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = z.object({
        cursor: z.string().uuid().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        status: z.enum(['pending', 'active', 'revoked', 'rejected', 'completed']).optional(),
      }).safeParse(req.query);

      if (!q.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' } });
      }

      const { tenant_id } = req.jwt;
      const { cursor, limit, status } = q.data;

      const params: unknown[] = [tenant_id, limit + 1];
      const conds: string[] = [
        `(c.gc_tenant_id = $1 OR c.sub_tenant_id = $1)`,
      ];
      let idx = 3;

      if (status) {
        conds.push(`c.status = $${idx++}`);
        params.push(status);
      }

      if (cursor) {
        conds.push(`(c.created_at, c.id) < (SELECT created_at, id FROM tenant_connections WHERE id = $${idx++})`);
        params.push(cursor);
      }

      // tenants is platform-scoped (no RLS) — expose NAME only, to members only.
      const result = await pgPool.query<ConnectionRow & { gc_tenant_name: string; sub_tenant_name: string }>(
        `SELECT c.id, c.gc_tenant_id, c.sub_tenant_id, c.status, c.invited_by, c.created_at, c.updated_at,
                c.project_id, c.scope_description, c.contract_value_cents, c.closed_reason,
                tg.name AS gc_tenant_name, ts.name AS sub_tenant_name
         FROM tenant_connections c
         JOIN tenants tg ON tg.id = c.gc_tenant_id
         JOIN tenants ts ON ts.id = c.sub_tenant_id
         WHERE ${conds.join(' AND ')}
         ORDER BY c.created_at DESC, c.id DESC
         LIMIT $2`,
        params,
      );

      const hasMore = result.rows.length > limit;
      const data = hasMore ? result.rows.slice(0, limit) : result.rows;

      return reply.status(200).send({
        connections: data,
        pagination: {
          has_more: hasMore,
          next_cursor: hasMore ? data[data.length - 1].id : null,
        },
      });
    },
  );

  // ── GET /v1/connections/:id — True connection detail ─────────────────────
  app.get(
    '/connections/:id',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;

      // T-45 — uniform 403 (no 404) to prevent connection enumeration
      const connection = await validateConnectionMembership(id, tenant_id);
      if (!connection) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this connection' } });
      }

      const names = await pgPool.query<{ id: string; name: string }>(
        `SELECT id, name FROM tenants WHERE id = ANY($1::uuid[])`,
        [[connection.gc_tenant_id, connection.sub_tenant_id]],
      );
      const nameOf = (tid: string) => names.rows.find((r) => r.id === tid)?.name ?? null;

      const yourSide = connection.gc_tenant_id === tenant_id ? 'gc' : 'sub';

      // GC project name: already shared data (it's baked into the sub project's name).
      let gcProjectName: string | null = null;
      if (connection.project_id) {
        const snap = await readGcProjectSiteSnapshot(connection.gc_tenant_id, connection.project_id);
        gcProjectName = snap?.name ?? null;
      }

      // Sub caller: their own bridge-instantiated mirror project (own-context RLS read).
      let myProject: { id: string; name: string; status: string } | null = null;
      if (yourSide === 'sub') {
        myProject = await withTenantContext(tenant_id, async (client) => {
          const { rows } = await client.query<{ id: string; name: string; status: string }>(
            `SELECT id, name, status FROM projects
              WHERE connection_id = $1 AND deleted_at IS NULL
              ORDER BY created_at DESC LIMIT 1`,
            [id],
          );
          return rows[0] ?? null;
        });
      }

      return reply.status(200).send({
        connection: {
          id: connection.id,
          status: connection.status,
          created_at: connection.created_at,
          updated_at: connection.updated_at,
          invited_by: connection.invited_by,
          gc_tenant_id: connection.gc_tenant_id,
          sub_tenant_id: connection.sub_tenant_id,
          gc_tenant_name: nameOf(connection.gc_tenant_id),
          sub_tenant_name: nameOf(connection.sub_tenant_id),
          scope_description: connection.scope_description,
          contract_value_cents: connection.contract_value_cents,
          project_name: gcProjectName,
          your_side: yourSide,
          my_project: myProject,
          permissions: connection.permissions,
          proposed_permissions: connection.proposed_permissions,
          closed_reason: connection.closed_reason,
          closed_at: connection.closed_at,
        },
      });
    },
  );

  // ── GET /v1/connections/:id/events — Read shared_project_events ──────────
  app.get(
    '/connections/:id/events',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id } = req.jwt;

      // T-45: validate membership before any cross-tenant data access
      const connection = await validateConnectionMembership(id, tenant_id);
      if (!connection) {
        // Don't distinguish 404 vs 403 to avoid connection enumeration
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this connection' } });
      }

      const q = z.object({
        cursor: z.string().uuid().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        event_type: z.string().optional(),
      }).safeParse(req.query);

      if (!q.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' } });
      }

      const { cursor, limit, event_type } = q.data;

      const params: unknown[] = [id, limit + 1];
      const conds = [`connection_id = $1`];
      let idx = 3;

      if (event_type) {
        conds.push(`event_type = $${idx++}`);
        params.push(event_type);
      }
      if (cursor) {
        conds.push(`(created_at, id) < (SELECT created_at, id FROM shared_project_events WHERE id = $${idx++})`);
        params.push(cursor);
      }

      const result = await pgPool.query(
        `SELECT id, connection_id, source_tenant_id, event_type, payload, created_at
         FROM shared_project_events
         WHERE ${conds.join(' AND ')}
         ORDER BY created_at DESC, id DESC
         LIMIT $2`,
        params,
      );

      // Audit cross-tenant access (T-45)
      await withTenantContext(tenant_id, async (client) => {
        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'cross_tenant',
          action: 'connection.events_read',
          actorId: user_id,
          actorEmail: req.jwt.email,
          actorRole: req.jwt.role,
          resourceType: 'tenant_connection',
          resourceId: id,
          payload: { event_count: result.rows.length },
          ipAddress: req.ip,
        });
      });

      const hasMore = result.rows.length > limit;
      const data = hasMore ? result.rows.slice(0, limit) : result.rows;

      return reply.status(200).send({
        events: data,
        pagination: {
          has_more: hasMore,
          next_cursor: hasMore ? data[data.length - 1].id : null,
        },
      });
    },
  );

  // ── POST /v1/connections/:id/events — Publish cross-tenant event ─────────
  app.post(
    '/connections/:id/events',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id } = req.jwt;

      // T-45: validate membership before any cross-tenant data write
      const connection = await validateConnectionMembership(id, tenant_id);
      if (!connection) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this connection' } });
      }

      if (connection.status !== 'active') {
        return reply.status(409).send({ error: { code: 'CONNECTION_NOT_ACTIVE', message: 'Connection must be active to publish events' } });
      }

      const schema = z.object({
        event_type: z.string().min(1).max(100),
        payload: z.record(z.unknown()).default({}),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'event_type (string) is required' } });
      }

      const { event_type, payload } = parsed.data;

      // Forgery guard: system event families (project./rfi./…) are reserved for server-side
      // publishers; free-form types are gone — only the typed generic whitelist remains,
      // each with a bounded payload schema.
      const generic = GENERIC_EVENT_TYPES[event_type];
      if (!generic || RESERVED_EVENT_PREFIXES.some((p) => event_type.startsWith(p))) {
        return reply.status(422).send({ error: { code: 'EVENT_TYPE_NOT_ALLOWED', message: `event_type must be one of: ${Object.keys(GENERIC_EVENT_TYPES).join(', ')}` } });
      }
      const payloadParsed = generic.safeParse(payload);
      if (!payloadParsed.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid payload for event_type' } });
      }

      // Doc 07 §5 — a disabled optional event family gets a clear client error here
      // (mirror sites use publishIfActive's silent block instead).
      if (!eventTypePermitted(connection.permissions, event_type)) {
        return reply.status(403).send({ error: { code: 'EVENT_TYPE_DISABLED', message: 'This event family is disabled by the connection permissions' } });
      }

      // publishSharedEvent = the one write choke point (gains T-17 realtime fan-out).
      const event = await publishSharedEvent(id, tenant_id, event_type, payloadParsed.data as Record<string, unknown>);

      // Notify the counterparty (Phase 3) — payload is schema-bounded and only ever visible to
      // connection members, so it is safe to attach as the notification ref.
      await notifyCounterparty(id, tenant_id, event_type, payloadParsed.data as Record<string, unknown>);

      // Audit (T-45)
      await withTenantContext(tenant_id, async (client) => {
        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'cross_tenant',
          action: 'event.published',
          actorId: user_id,
          actorEmail: req.jwt.email,
          actorRole: req.jwt.role,
          resourceType: 'shared_project_event',
          resourceId: event.id,
          payload: { event_type, connection_id: id },
          ipAddress: req.ip,
        });
      });

      return reply.status(201).send({ event });
    },
  );

  // ── Cross-tenant "response" endpoints ────────────────────────────────────
  // Typed, whitelisted alternatives to the generic events publish. The responding party
  // (usually the Sub) answers/decides on a shared object; it mirrors back as a *.responded
  // event the source party reads. One helper, one per object type — payloads stay whitelisted.
  const decision = z.enum(['approved', 'rejected', 'revise']);
  const RESPONSE_ROUTES: {
    path: string;
    // Static event type, or resolved from the parsed body (e.g. invoice decision → approved|paid).
    eventType: string | ((d: Record<string, unknown>) => string);
    // Restrict the endpoint to one side of the connection; undefined = either member.
    side?: 'gc' | 'sub';
    schema: z.ZodTypeAny;
    build: (d: Record<string, unknown>, tenantId: string) => Record<string, unknown>;
  }[] = [
    {
      path: 'rfi-response',
      eventType: 'rfi.answered',
      schema: z.object({ rfi_id: z.string().uuid(), number: z.number().int().positive(), answer: z.string().min(1).max(5000) }),
      build: (d, tid) => ({ rfi_id: d.rfi_id, number: d.number, answer: d.answer, answered_by_tenant_id: tid }),
    },
    {
      path: 'change-order-response',
      eventType: 'change_order.responded',
      schema: z.object({ co_id: z.string().uuid(), decision, note: z.string().max(5000).optional() }),
      build: (d, tid) => ({ co_id: d.co_id, decision: d.decision, note: d.note ?? null, responded_by_tenant_id: tid }),
    },
    {
      path: 'submittal-response',
      eventType: 'submittal.responded',
      schema: z.object({ submittal_id: z.string().uuid(), number: z.number().int().positive(), decision, note: z.string().max(5000).optional() }),
      build: (d, tid) => ({ submittal_id: d.submittal_id, number: d.number, decision: d.decision, note: d.note ?? null, responded_by_tenant_id: tid }),
    },
    {
      // Doc 07 §5.1 invoice workflow — the GC is approver/payer of a sub-submitted invoice.
      // GC-only: without the side guard the Sub could forge its own invoice.approved/paid.
      path: 'invoice-response',
      side: 'gc',
      eventType: (d) => (d.decision === 'paid' ? 'invoice.paid' : 'invoice.approved'),
      schema: z.object({ invoice_id: z.string().uuid(), decision: z.enum(['approved', 'paid']), note: z.string().max(5000).optional() }),
      build: (d, tid) => ({ invoice_id: d.invoice_id, decision: d.decision, note: d.note ?? null, responded_by_tenant_id: tid }),
    },
  ];

  for (const spec of RESPONSE_ROUTES) {
    app.post(
      `/connections/:id/${spec.path}`,
      { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
      async (req: FastifyRequest, reply: FastifyReply) => {
        const { id } = req.params as { id: string };
        const { tenant_id, user_id } = req.jwt;

        // T-45: membership before any cross-tenant write
        const connection = await validateConnectionMembership(id, tenant_id);
        if (!connection) {
          return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this connection' } });
        }
        if (connection.status !== 'active') {
          return reply.status(409).send({ error: { code: 'CONNECTION_NOT_ACTIVE', message: 'Connection must be active to respond' } });
        }
        // Side guard: some responses belong to exactly one party (e.g. only the GC
        // approves/pays an invoice). Undefined = either member (rfi/CO/submittal).
        if (spec.side === 'gc' && connection.gc_tenant_id !== tenant_id) {
          return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only the GC may use this endpoint' } });
        }
        if (spec.side === 'sub' && connection.sub_tenant_id !== tenant_id) {
          return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only the Sub may use this endpoint' } });
        }

        // Parse BEFORE resolving the event type — it may depend on the body (invoice decision).
        const parsed = spec.schema.safeParse(req.body);
        if (!parsed.success) {
          return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid response body' } });
        }
        const data = parsed.data as Record<string, unknown>;
        const eventType = typeof spec.eventType === 'function' ? spec.eventType(data) : spec.eventType;

        // Doc 07 §5 — symmetric gate: if rfi_events is off, the response direction blocks too.
        // (invoice.* is core and always passes — kept for uniformity.)
        if (!eventTypePermitted(connection.permissions, eventType)) {
          return reply.status(403).send({ error: { code: 'EVENT_TYPE_DISABLED', message: 'This event family is disabled by the connection permissions' } });
        }

        const respPayload = spec.build(data, tenant_id);
        const event = await publishSharedEvent(id, tenant_id, eventType, respPayload);
        await notifyCounterparty(id, tenant_id, eventType, respPayload);

        await withTenantContext(tenant_id, async (client) => {
          await writeAuditEntry(client, {
            tenantId: tenant_id,
            category: 'cross_tenant',
            action: eventType,
            actorId: user_id,
            actorEmail: req.jwt.email,
            actorRole: req.jwt.role,
            resourceType: 'shared_project_event',
            resourceId: event.id,
            payload: { connection_id: id, event_type: eventType },
            ipAddress: req.ip,
          });
        });

        return reply.status(201).send({ event });
      },
    );
  }

  // ── Doc 07 §5.1 — lien waivers (core closeout family) ─────────────────────
  // Event-ledger-only: NO lien_waivers table. The GC requests, the Sub signs; the two
  // events are matched by a server-generated waiver_id in the payload. Neither side
  // naturally owns a row (a tenant-scoped table would put one party's closeout state
  // inside the other's workflow); the ledger is append-only = free audit trail. The
  // closeout checklist derives open waivers the same way it derives open RFIs/COs.
  // lien_waiver.* is CORE — never gated by eventTypePermitted; the 'lien_waiver.'
  // reserved prefix blocks forgery via the generic events endpoint.

  const lienWaiverGuards = async (
    req: FastifyRequest,
    reply: FastifyReply,
    side: 'gc' | 'sub',
  ): Promise<ConnectionRow | null> => {
    const { id } = req.params as { id: string };
    const { tenant_id } = req.jwt;
    const connection = await validateConnectionMembership(id, tenant_id);
    if (!connection) {
      reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this connection' } });
      return null;
    }
    if (connection.status !== 'active') {
      reply.status(409).send({ error: { code: 'CONNECTION_NOT_ACTIVE', message: 'Connection must be active' } });
      return null;
    }
    // GC demands waivers (payment/closeout condition); only the Sub may execute its own
    // waiver — blocks the GC forging a signature that releases the Sub's lien rights.
    if (side === 'gc' && connection.gc_tenant_id !== tenant_id) {
      reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only the GC may request a lien waiver' } });
      return null;
    }
    if (side === 'sub' && connection.sub_tenant_id !== tenant_id) {
      reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only the Sub may sign a lien waiver' } });
      return null;
    }
    return connection;
  };

  const publishLienWaiverEvent = async (
    req: FastifyRequest,
    connectionId: string,
    eventType: 'lien_waiver.requested' | 'lien_waiver.signed',
    payload: Record<string, unknown>,
  ) => {
    const { tenant_id, user_id } = req.jwt;
    const event = await publishSharedEvent(connectionId, tenant_id, eventType, payload);
    await notifyCounterparty(connectionId, tenant_id, eventType, payload);
    await withTenantContext(tenant_id, async (client) => {
      await writeAuditEntry(client, {
        tenantId: tenant_id,
        category: 'cross_tenant',
        action: eventType,
        actorId: user_id,
        actorEmail: req.jwt.email,
        actorRole: req.jwt.role,
        resourceType: 'shared_project_event',
        resourceId: event.id,
        payload: { connection_id: connectionId, event_type: eventType, waiver_id: payload.waiver_id },
        ipAddress: req.ip,
      });
    });
    return event;
  };

  const lienWaiverRequestSchema = z.object({
    waiver_type: z.enum(['conditional_progress', 'unconditional_progress', 'conditional_final', 'unconditional_final']),
    amount_cents: z.number().int().min(0).optional(),
    through_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    note: z.string().max(5000).optional(),
  });

  app.post(
    '/connections/:id/lien-waiver-request',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const connection = await lienWaiverGuards(req, reply, 'gc');
      if (!connection) return;
      const parsed = lienWaiverRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid lien waiver request body' } });
      }
      const d = parsed.data;
      const payload = {
        waiver_id: randomUUID(),
        waiver_type: d.waiver_type,
        amount_cents: d.amount_cents ?? null,
        through_date: d.through_date ?? null,
        note: d.note ?? null,
        requested_by_tenant_id: req.jwt.tenant_id,
      };
      const event = await publishLienWaiverEvent(req, id, 'lien_waiver.requested', payload);
      return reply.status(201).send({ event });
    },
  );

  const lienWaiverSignSchema = z.object({
    waiver_id: z.string().uuid(),
    note: z.string().max(5000).optional(),
  });

  app.post(
    '/connections/:id/lien-waiver-sign',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const connection = await lienWaiverGuards(req, reply, 'sub');
      if (!connection) return;
      const parsed = lienWaiverSignSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid lien waiver sign body' } });
      }
      const { waiver_id, note } = parsed.data;
      // Ledger validation (raw query after membership validation — computeCloseoutChecklist
      // precedent): the waiver must have been requested on THIS connection and not yet signed.
      const ledger = await pgPool.query<{ event_type: string }>(
        `SELECT event_type FROM shared_project_events
          WHERE connection_id = $1
            AND event_type IN ('lien_waiver.requested', 'lien_waiver.signed')
            AND payload->>'waiver_id' = $2`,
        [id, waiver_id],
      );
      if (!ledger.rows.some((r) => r.event_type === 'lien_waiver.requested')) {
        return reply.status(404).send({ error: { code: 'WAIVER_NOT_FOUND', message: 'No lien waiver request with that id on this connection' } });
      }
      if (ledger.rows.some((r) => r.event_type === 'lien_waiver.signed')) {
        return reply.status(409).send({ error: { code: 'WAIVER_ALREADY_SIGNED', message: 'This lien waiver is already signed' } });
      }
      const payload = {
        waiver_id,
        note: note ?? null,
        signed_by_tenant_id: req.jwt.tenant_id,
      };
      const event = await publishLienWaiverEvent(req, id, 'lien_waiver.signed', payload);
      return reply.status(201).send({ event });
    },
  );

  // ── Doc 07 §5 — permission negotiation ─────────────────────────────────────
  // The client sends only the three permission blocks; negotiated_at / accepted_by_sub are
  // server-managed. Core events are locked ON (z.literal(true)) and show_labor_costs is
  // locked OFF (z.literal(false)) — a violating body 422s before any diff logic runs.
  const permissionsBodySchema = z
    .object({
      core_events: z
        .object({
          task_updates: z.literal(true),
          inspection_events: z.literal(true),
          invoice_workflow: z.literal(true),
          change_orders: z.literal(true),
          lien_waivers: z.literal(true),
        })
        .strict(),
      optional_events: z
        .object({
          daily_reports: z.boolean(),
          rfi_events: z.boolean(),
          submittal_events: z.boolean(),
          messages: z.boolean(),
        })
        .strict(),
      labor_visibility: z
        .object({
          show_total_hours: z.boolean(),
          show_crew_names: z.boolean(),
          show_labor_costs: z.literal(false), // §5: Sub cost data is NEVER shared
        })
        .strict(),
    })
    .strict();
  type PermissionsBody = z.infer<typeof permissionsBodySchema>;

  // Diff over the 6 mutable booleans. Current flags read defensively with the same
  // defaults as eventTypePermitted (optional → true, labor → false).
  function diffPermissions(current: ConnectionPermissions | null | undefined, target: PermissionsBody) {
    const changed: { flag: string; from: boolean; to: boolean }[] = [];
    for (const k of ['daily_reports', 'rfi_events', 'submittal_events', 'messages'] as const) {
      const from = current?.optional_events?.[k] !== false;
      if (from !== target.optional_events[k]) changed.push({ flag: `optional_events.${k}`, from, to: target.optional_events[k] });
    }
    for (const k of ['show_total_hours', 'show_crew_names'] as const) {
      const from = current?.labor_visibility?.[k] === true;
      if (from !== target.labor_visibility[k]) changed.push({ flag: `labor_visibility.${k}`, from, to: target.labor_visibility[k] });
    }
    return { changed, loosening: changed.some((c) => !c.from && c.to) };
  }

  function mergedPermissions(
    body: PermissionsBody,
    opts: { negotiated_at: string | null; accepted_by_sub: boolean },
  ): ConnectionPermissions {
    return {
      core_events: body.core_events,
      optional_events: body.optional_events,
      labor_visibility: body.labor_visibility,
      negotiated_at: opts.negotiated_at,
      accepted_by_sub: opts.accepted_by_sub,
    };
  }

  // Dual-tenant audit (accept pattern) — permission changes are shared-state changes.
  async function auditPermissionsBoth(
    req: FastifyRequest,
    connection: ConnectionRow,
    action: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    for (const tid of [connection.gc_tenant_id, connection.sub_tenant_id]) {
      await withTenantContext(tid, async (client) => {
        await writeAuditEntry(client, {
          tenantId: tid,
          category: 'cross_tenant',
          action,
          actorId: req.jwt.user_id,
          actorEmail: req.jwt.email,
          actorRole: req.jwt.role,
          resourceType: 'tenant_connection',
          resourceId: connection.id,
          payload,
          ipAddress: req.ip,
        });
      });
    }
  }

  async function applyPermissions(
    req: FastifyRequest,
    connection: ConnectionRow,
    next: ConnectionPermissions,
    auditPayload: Record<string, unknown>,
  ): Promise<void> {
    await pgPool.query(
      `UPDATE tenant_connections SET permissions = $2, proposed_permissions = NULL, updated_at = NOW() WHERE id = $1`,
      [connection.id, JSON.stringify(next)],
    );
    await auditPermissionsBoth(req, connection, 'connection.permissions_updated', auditPayload);
    // Reserved-prefix server-side event — clients can't forge it via the generic endpoint.
    // Payload = the flags themselves (already shared negotiation state; no internal data).
    await publishSharedEvent(connection.id, req.jwt.tenant_id, 'connection.permissions_updated', {
      optional_events: next.optional_events,
      labor_visibility: next.labor_visibility,
    });
    await notifyCounterparty(connection.id, req.jwt.tenant_id, 'connection.permissions_updated', {});
  }

  // ── PUT /v1/connections/:id/permissions — propose or apply a permission change ──
  // Pure TIGHTENING (only true→false) applies immediately — either party may always share
  // less unilaterally. ANY loosening (false→true) is a "significant change" (Doc 07 §5) and
  // becomes a pending proposal the counterparty must consent to (both-party re-consent).
  app.put(
    '/connections/:id/permissions',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id } = req.jwt;

      const connection = await validateConnectionMembership(id, tenant_id);
      if (!connection) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this connection' } });
      }
      if (connection.status !== 'active') {
        return reply.status(409).send({ error: { code: 'CONNECTION_NOT_ACTIVE', message: 'Permissions can only change on an active connection' } });
      }

      const parsed = permissionsBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid permissions: core events cannot be disabled and labor costs are never shared' } });
      }

      const { changed, loosening } = diffPermissions(connection.permissions, parsed.data);

      if (changed.length === 0) {
        // No-op — but a proposer re-submitting the current state withdraws their own proposal.
        if (connection.proposed_permissions?.proposed_by_tenant_id === tenant_id) {
          await pgPool.query(`UPDATE tenant_connections SET proposed_permissions = NULL, updated_at = NOW() WHERE id = $1`, [id]);
        }
        return reply.status(200).send({ applied: false, proposed: false, permissions: connection.permissions });
      }

      if (!loosening) {
        const next = mergedPermissions(parsed.data, {
          negotiated_at: connection.permissions?.negotiated_at ?? null,
          accepted_by_sub: true,
        });
        await applyPermissions(req, connection, next, { changed, via: 'tighten' });
        return reply.status(200).send({ applied: true, proposed: false, permissions: next });
      }

      // Loosening present — whole target becomes the pending proposal (atomic, no partial apply).
      const proposal = {
        permissions: mergedPermissions(parsed.data, { negotiated_at: null, accepted_by_sub: false }),
        proposed_by_tenant_id: tenant_id,
        proposed_at: new Date().toISOString(),
      };
      await pgPool.query(
        `UPDATE tenant_connections SET proposed_permissions = $2, updated_at = NOW() WHERE id = $1`,
        [id, JSON.stringify(proposal)],
      );
      await withTenantContext(tenant_id, async (client) => {
        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'cross_tenant',
          action: 'connection.permissions_proposed',
          actorId: user_id,
          actorEmail: req.jwt.email,
          actorRole: req.jwt.role,
          resourceType: 'tenant_connection',
          resourceId: id,
          payload: { changed },
          ipAddress: req.ip,
        });
      });
      await notifyCounterparty(id, tenant_id, 'connection.permissions_proposed', {});
      return reply.status(200).send({ applied: false, proposed: true });
    },
  );

  // ── POST /v1/connections/:id/permissions/consent — counterparty decides a proposal ──
  app.post(
    '/connections/:id/permissions/consent',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id } = req.jwt;

      const connection = await validateConnectionMembership(id, tenant_id);
      if (!connection) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this connection' } });
      }
      if (connection.status !== 'active') {
        return reply.status(409).send({ error: { code: 'CONNECTION_NOT_ACTIVE', message: 'Permissions can only change on an active connection' } });
      }

      const parsed = z.object({ accept: z.boolean() }).safeParse(req.body);
      if (!parsed.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'accept (boolean) is required' } });
      }

      const proposal = connection.proposed_permissions;
      if (!proposal) {
        return reply.status(409).send({ error: { code: 'NO_PENDING_PROPOSAL', message: 'No pending permissions proposal on this connection' } });
      }
      if (proposal.proposed_by_tenant_id === tenant_id) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'The counterparty must consent to the proposal' } });
      }

      if (!parsed.data.accept) {
        await pgPool.query(`UPDATE tenant_connections SET proposed_permissions = NULL, updated_at = NOW() WHERE id = $1`, [id]);
        await withTenantContext(tenant_id, async (client) => {
          await writeAuditEntry(client, {
            tenantId: tenant_id,
            category: 'cross_tenant',
            action: 'connection.permissions_proposal_rejected',
            actorId: user_id,
            actorEmail: req.jwt.email,
            actorRole: req.jwt.role,
            resourceType: 'tenant_connection',
            resourceId: id,
            payload: {},
            ipAddress: req.ip,
          });
        });
        await notifyCounterparty(id, tenant_id, 'connection.permissions_proposal_rejected', {});
        return reply.status(200).send({ applied: false });
      }

      // Consent — the applied set has, by construction, been touched by both parties.
      const next: ConnectionPermissions = {
        ...proposal.permissions,
        negotiated_at: new Date().toISOString(),
        accepted_by_sub: true,
      };
      await applyPermissions(req, connection, next, { via: 'consent', proposed_by_tenant_id: proposal.proposed_by_tenant_id });
      return reply.status(200).send({ applied: true, permissions: next });
    },
  );

  // ── Doc 07 §8 — connection closeout ────────────────────────────────────────
  // Checklist over the bridge ledger itself: shared RFIs without an answer, shared COs
  // without a response. Advisory — an item the GC closed internally without a bridge
  // response still counts open; POST /complete has an acknowledge_incomplete escape hatch.
  async function computeCloseoutChecklist(connectionId: string): Promise<{ open_rfis: number; open_change_orders: number; open_lien_waivers: number; clear: boolean }> {
    const { rows } = await pgPool.query<{ open_rfis: number; open_change_orders: number; open_lien_waivers: number }>(
      `SELECT
         (SELECT COUNT(DISTINCT e.payload->>'rfi_id')::int FROM shared_project_events e
           WHERE e.connection_id = $1 AND e.event_type = 'rfi.created'
             AND NOT EXISTS (SELECT 1 FROM shared_project_events a
               WHERE a.connection_id = $1 AND a.event_type = 'rfi.answered'
                 AND a.payload->>'rfi_id' = e.payload->>'rfi_id')) AS open_rfis,
         (SELECT COUNT(DISTINCT e.payload->>'co_id')::int FROM shared_project_events e
           WHERE e.connection_id = $1 AND e.event_type = 'change_order.created'
             AND NOT EXISTS (SELECT 1 FROM shared_project_events a
               WHERE a.connection_id = $1 AND a.event_type = 'change_order.responded'
                 AND a.payload->>'co_id' = e.payload->>'co_id')) AS open_change_orders,
         (SELECT COUNT(DISTINCT e.payload->>'waiver_id')::int FROM shared_project_events e
           WHERE e.connection_id = $1 AND e.event_type = 'lien_waiver.requested'
             AND NOT EXISTS (SELECT 1 FROM shared_project_events a
               WHERE a.connection_id = $1 AND a.event_type = 'lien_waiver.signed'
                 AND a.payload->>'waiver_id' = e.payload->>'waiver_id')) AS open_lien_waivers`,
      [connectionId],
    );
    const open_rfis = rows[0]?.open_rfis ?? 0;
    const open_change_orders = rows[0]?.open_change_orders ?? 0;
    const open_lien_waivers = rows[0]?.open_lien_waivers ?? 0;
    return { open_rfis, open_change_orders, open_lien_waivers, clear: open_rfis === 0 && open_change_orders === 0 && open_lien_waivers === 0 };
  }

  // ── GET /v1/connections/:id/closeout — checklist (read-only, any status) ──
  app.get(
    '/connections/:id/closeout',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;

      const connection = await validateConnectionMembership(id, tenant_id);
      if (!connection) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this connection' } });
      }

      const checklist = await computeCloseoutChecklist(id);
      return reply.status(200).send({
        checklist,
        closeable: connection.status === 'active' && connection.gc_tenant_id === tenant_id,
      });
    },
  );

  // ── POST /v1/connections/:id/complete — GC marks the connection completed (§8.1) ──
  // The cooperative closeout path (revoke stays OWNER-only; complete allows PM too).
  // Blocks on open checklist items unless acknowledge_incomplete. The sub mirror project
  // is dispositioned async by the worker with reason_code 'completed' → project 'completed'.
  app.post(
    '/connections/:id/complete',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id } = req.jwt;

      const connection = await validateConnectionMembership(id, tenant_id);
      if (!connection) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this connection' } });
      }
      if (connection.gc_tenant_id !== tenant_id) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only the GC can complete a connection' } });
      }
      if (connection.status !== 'active') {
        return reply.status(409).send({ error: { code: 'INVALID_STATUS', message: 'Only an active connection can be completed' } });
      }

      const body = z.object({ acknowledge_incomplete: z.boolean().default(false) }).default({}).safeParse(req.body ?? {});
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'acknowledge_incomplete must be a boolean' } });
      }

      const checklist = await computeCloseoutChecklist(id);
      if (!checklist.clear && !body.data.acknowledge_incomplete) {
        return reply.status(409).send({
          error: { code: 'CLOSEOUT_INCOMPLETE', message: 'Open shared items remain — resolve them or acknowledge_incomplete' },
          details: { open_rfis: checklist.open_rfis, open_change_orders: checklist.open_change_orders, open_lien_waivers: checklist.open_lien_waivers },
        });
      }

      // Final ledger entry — published WHILE still active (server-side reserved-prefix event).
      await publishSharedEvent(id, tenant_id, 'connection.completed', {
        acknowledged_incomplete: !checklist.clear,
      });

      await pgPool.query(
        `UPDATE tenant_connections
            SET status = 'completed', closed_reason = 'completed', closed_at = NOW(), updated_at = NOW()
          WHERE id = $1`,
        [id],
      );

      // Dual audit — completion is a shared-state change (accept pattern).
      for (const tid of [connection.gc_tenant_id, connection.sub_tenant_id]) {
        await withTenantContext(tid, async (client) => {
          await writeAuditEntry(client, {
            tenantId: tid,
            category: 'cross_tenant',
            action: 'connection.completed',
            actorId: user_id,
            actorEmail: req.jwt.email,
            actorRole: req.jwt.role,
            resourceType: 'tenant_connection',
            resourceId: id,
            payload: {
              acknowledged_incomplete: !checklist.clear,
              open_rfis: checklist.open_rfis,
              open_change_orders: checklist.open_change_orders,
              open_lien_waivers: checklist.open_lien_waivers,
            },
            ipAddress: req.ip,
          });
        });
      }

      await sendJob('connection.closed', connection.sub_tenant_id, {
        connection_id: id,
        closed_by_tenant_id: tenant_id,
        reason_code: 'completed',
      });

      return reply.status(200).send({ connection: { id, status: 'completed' }, checklist });
    },
  );
}
