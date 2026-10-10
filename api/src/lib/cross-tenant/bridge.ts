// lib/cross-tenant/bridge.ts — the ONE choke point for cross-tenant reads/writes.
// Locked decisions: A-07, T-44, T-45.
//
// `shared_project_events` and `tenant_connections` are RLS-EXEMPT (T-44) — isolation is
// enforced HERE, at the application layer, on every access (T-45). Every cross-tenant path
// (connections routes, RFI mirror hooks) MUST go through these helpers, never raw SQL against
// the two neutral tables. The payload whitelist below is the data-leak boundary (CLAUDE.md
// rules 11–13): a source tenant's internal ids/fields must never enter the other party's view.

import { z } from 'zod';
import { pgPool } from '../db.js';
import { withTenantContext } from '../tenant-context.js';
import { sendJob } from '../queue.js';
import { triggerToTenant } from '../pusher.js';

export interface ConnectionRow {
  id: string;
  gc_tenant_id: string;
  sub_tenant_id: string;
  status: string;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
  project_id: string | null;
  scope_description: string | null;
  contract_value_cents: number | null;
  permissions: ConnectionPermissions;
  proposed_permissions: ProposedPermissions | null;
  closed_reason: string | null;
  closed_at: string | null;
}

// ─── Per-connection permissions (Doc 07 §5 — migration 0040) ────────────────────
// Stored on tenant_connections.permissions (JSONB). This layer sits ON TOP of the
// payload whitelist below — the whitelist stays the leak floor regardless of flags.
// core_events can never be false (Zod literal(true) at the PUT route); labor
// show_labor_costs is hardcoded false (literal(false)) — Sub cost data never crosses.
export interface ConnectionPermissions {
  core_events: {
    task_updates: boolean;
    inspection_events: boolean;
    invoice_workflow: boolean;
    change_orders: boolean;
    lien_waivers: boolean;
  };
  optional_events: {
    daily_reports: boolean;
    rfi_events: boolean;
    submittal_events: boolean;
    messages: boolean;
  };
  labor_visibility: {
    show_total_hours: boolean;
    show_crew_names: boolean;
    show_labor_costs: boolean;
  };
  negotiated_at: string | null;
  accepted_by_sub: boolean;
}

export interface ProposedPermissions {
  permissions: ConnectionPermissions;
  proposed_by_tenant_id: string;
  proposed_at: string;
}

/** Mirror of the migration-0040 column default (§5.1 defaults). */
export const DEFAULT_CONNECTION_PERMISSIONS: ConnectionPermissions = {
  core_events: {
    task_updates: true,
    inspection_events: true,
    invoice_workflow: true,
    change_orders: true,
    lien_waivers: true,
  },
  optional_events: { daily_reports: true, rfi_events: true, submittal_events: true, messages: true },
  labor_visibility: { show_total_hours: false, show_crew_names: false, show_labor_costs: false },
  negotiated_at: null,
  accepted_by_sub: true,
};

/**
 * Doc 07 §5 event gate — pure, no I/O. Core event families are ALWAYS allowed (the
 * spec locks them ON); only the optional families gate. Missing/partial permissions
 * default to ALLOWED (fail-open is safe here: the payload whitelist remains the leak
 * floor — this layer only controls which whitelisted families flow, never what fields).
 *
 * daily_report.* gates on optional_events.daily_reports (fail-open). labor.* gates on the
 * labor_visibility flags and — DEVIATING from the fail-open norm — fails CLOSED: the §5
 * defaults are false (migration 0040), so labor publishes only on explicit opt-in.
 */
export function eventTypePermitted(
  permissions: ConnectionPermissions | null | undefined,
  eventType: string,
): boolean {
  const opt = permissions?.optional_events;
  if (eventType.startsWith('rfi.')) return opt?.rfi_events !== false;
  if (eventType.startsWith('submittal.')) return opt?.submittal_events !== false;
  if (eventType === 'note.posted' || eventType === 'message.sent') return opt?.messages !== false;
  if (eventType.startsWith('daily_report.')) return opt?.daily_reports !== false;
  if (eventType.startsWith('labor.')) {
    // §5 DEVIATION from the fail-open norm: labor flags DEFAULT FALSE (migration 0040).
    // Fail CLOSED — publish only on explicit opt-in to at least one visibility field.
    const lv = permissions?.labor_visibility;
    return lv?.show_total_hours === true || lv?.show_crew_names === true;
  }
  // change_order.* (core), invoice.* (core invoice_workflow), lien_waiver.* (core
  // lien_waivers), project.location (map layer), connection.* (lifecycle),
  // milestone.updated / schedule.updated (core task_updates) — always allowed.
  // invoice.* / lien_waiver.* are CORE families (§5.1 — z.literal(true) at the PUT
  // permissions route): they fall through to `true` and must NEVER gain a gating branch.
  return true;
}

export interface SharedEventRow {
  id: string;
  connection_id: string;
  source_tenant_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

/**
 * T-45: validate the calling tenant is a member of the connection.
 * Returns the connection row if the caller is the GC or the Sub; null otherwise
 * (caller sends 403 — we don't distinguish 404 vs non-member, to prevent connection enumeration).
 * MANDATORY before any cross-tenant read/write — never bypassed for performance.
 */
export async function validateConnectionMembership(
  connectionId: string,
  callerTenantId: string,
): Promise<ConnectionRow | null> {
  const { rows, rowCount } = await pgPool.query<ConnectionRow>(
    `SELECT id, gc_tenant_id, sub_tenant_id, status, invited_by, created_at, updated_at,
            project_id, scope_description, contract_value_cents,
            permissions, proposed_permissions, closed_reason, closed_at
       FROM tenant_connections WHERE id = $1`,
    [connectionId],
  );
  if (rowCount === 0) return null;
  const conn = rows[0];
  if (conn.gc_tenant_id !== callerTenantId && conn.sub_tenant_id !== callerTenantId) return null;
  return conn;
}

/**
 * Write one event to the neutral bridge table. Caller MUST have already run
 * validateConnectionMembership + confirmed status === 'active'. `sourceTenantId` is the
 * writer's own tenant_id (stamped as provenance — never trusted from the client body).
 */
export async function publishSharedEvent(
  connectionId: string,
  sourceTenantId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<SharedEventRow> {
  const { rows } = await pgPool.query<SharedEventRow>(
    `INSERT INTO shared_project_events (connection_id, source_tenant_id, event_type, payload, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, connection_id, source_tenant_id, event_type, payload, created_at`,
    [connectionId, sourceTenantId, eventType, JSON.stringify(payload)],
  );
  // T-17: server fan-out to BOTH parties' private channels (best-effort, no-op if Pusher disabled).
  // publishSharedEvent is the one write choke point, so this covers every mirror/response site.
  void fanOutSharedEvent(connectionId, eventType, payload, sourceTenantId);
  return rows[0];
}

/**
 * T-17: publish the (already-whitelisted) event payload to EACH party's own private channel
 * independently — `private-tenant-{gc}` and `private-tenant-{sub}`. The payload is the same object
 * that crossed the bridge, so no internal data leaks (the whitelist is the boundary). Best-effort:
 * resolves the connection, triggers both channels, never throws. No-ops when Pusher is disabled.
 */
export async function fanOutSharedEvent(
  connectionId: string,
  eventType: string,
  payload: Record<string, unknown>,
  sourceTenantId?: string,
): Promise<void> {
  try {
    const { rows } = await pgPool.query<{ gc_tenant_id: string; sub_tenant_id: string }>(
      `SELECT gc_tenant_id, sub_tenant_id FROM tenant_connections WHERE id = $1`,
      [connectionId],
    );
    if (rows.length === 0) return;
    const { gc_tenant_id, sub_tenant_id } = rows[0];
    // source_tenant_id lets clients skip toasting their own actions. Both parties are
    // connection members — the tenant ids are already mutually known, nothing leaks.
    const data = { connection_id: connectionId, event_type: eventType, payload, source_tenant_id: sourceTenantId ?? null };
    await Promise.all([
      triggerToTenant(gc_tenant_id, 'shared.event', data),
      triggerToTenant(sub_tenant_id, 'shared.event', data),
    ]);
  } catch {
    // best-effort — realtime never blocks the write path
  }
}

/**
 * Fan-out helper: enqueue a `cross_tenant.notify` job to the party that is NOT the source
 * (T-10 — envelope tenant_id is the RECIPIENT tenant; the worker uses withTenantContext on it).
 * Fire-and-forget — safe to call after every publishSharedEvent / mirror hook. Phase 6 (Pusher
 * realtime) reuses this same recipient-resolution shape.
 *
 * `ref` is attached to the notification `data`. Pass ONLY the whitelisted event payload
 * (the same object that crossed the bridge) — never the source's internal row. If the connection
 * row is gone (revoked/deleted) the notify is silently skipped.
 */
export async function notifyCounterparty(
  connectionId: string,
  sourceTenantId: string,
  eventType: string,
  ref: Record<string, unknown> = {},
): Promise<void> {
  const { rows } = await pgPool.query<{ gc_tenant_id: string; sub_tenant_id: string }>(
    `SELECT gc_tenant_id, sub_tenant_id FROM tenant_connections WHERE id = $1`,
    [connectionId],
  );
  if (rows.length === 0) return;
  const { gc_tenant_id, sub_tenant_id } = rows[0];
  const recipientTenantId = sourceTenantId === gc_tenant_id ? sub_tenant_id : gc_tenant_id;
  await sendJob('cross_tenant.notify', recipientTenantId, {
    connection_id: connectionId,
    source_tenant_id: sourceTenantId,
    event_type: eventType,
    ref,
  });
}

// ─── RFI payload whitelist (leak boundary — CLAUDE.md rules 11–13) ──────────────
// Only these RFI fields may cross the bridge. Internal ids (tenant_id, project_id,
// assignee_id, created_by) and the whole row are NEVER shared.
export interface RfiLike {
  id: string;
  number: number;
  subject: string;
  status: string;
  due_date: string | null;
}

/**
 * Build the whitelisted cross-tenant payload for an RFI event.
 * `rfi_id` is the source RFI's id (opaque handle for correlating a later rfi.answered) —
 * it is the GC's own id and safe to expose as a reference token; the Sub cannot query the
 * GC's RLS-scoped rfis table with it.
 */
export function buildRfiEventPayload(rfi: RfiLike): Record<string, unknown> {
  return {
    rfi_id: rfi.id,
    number: rfi.number,
    subject: rfi.subject,
    status: rfi.status,
    due_date: rfi.due_date,
  };
}

// ─── Change-order payload whitelist ─────────────────────────────────────────
// Excludes internal ids (vendor_id, contract_id, reason_code, direction, project_id).
export interface ChangeOrderLike {
  id: string;
  title: string;
  amount_cents: number;
  status: string;
}
export function buildChangeOrderEventPayload(co: ChangeOrderLike): Record<string, unknown> {
  return { co_id: co.id, title: co.title, amount_cents: co.amount_cents, status: co.status };
}

// ─── Submittal payload whitelist ────────────────────────────────────────────
export interface SubmittalLike {
  id: string;
  number: number;
  title: string;
  status: string;
  spec_section: string | null;
}
export function buildSubmittalEventPayload(s: SubmittalLike): Record<string, unknown> {
  return { submittal_id: s.id, number: s.number, title: s.title, status: s.status, spec_section: s.spec_section };
}

// ─── Invoice payload whitelist (Doc 07 §5.1 core invoice workflow) ──────────
// Excludes contract_id, retainage_*, stripe/quickbooks ids, project_id, created_by.
// Direction is sub→GC (the sub bills the GC); the GC never holds an invoice row.
export interface InvoiceLike {
  id: string;
  amount_cents: number;
  status: string;
  due_date: string | null;
}
export function buildInvoiceEventPayload(inv: InvoiceLike): Record<string, unknown> {
  return {
    invoice_id: inv.id,
    amount_cents: Number(inv.amount_cents),
    status: inv.status,
    due_date: inv.due_date,
  };
}
// (No lien-waiver builder — waivers are event-ledger-only with no source row; the typed
// routes in connections.ts construct the payload inline from the validated body.)

// ─── Daily-report payload whitelist (§5 optional daily_reports family) ──────
// weather/notes pass through as stored — field-activity visibility is the point.
// tenant/project/created_by ids excluded. Auto-mirrored from daily-reports routes
// when the report's project is a bridge mirror (projects.connection_id set).
export interface DailyReportLike {
  id: string;
  report_date: string | Date; // pg DATE arrives as a JS Date — normalized below
  weather: Record<string, unknown> | null;
  notes: string | null;
}
export function buildDailyReportEventPayload(r: DailyReportLike): Record<string, unknown> {
  const d = typeof r.report_date === 'string'
    ? r.report_date.slice(0, 10)
    : new Date(r.report_date).toISOString().slice(0, 10);
  return { report_id: r.id, report_date: d, weather: r.weather, notes: r.notes };
}

// ─── Labor-summary payload (§5 labor_visibility field-level filtering) ──────
// show_labor_costs is Zod-locked false: NO cents field exists in this shape, ever.
export interface LaborSummaryAgg {
  date: string; // YYYY-MM-DD
  total_hours: number;
  worker_count: number;
  crew: { name: string; hours: number }[];
}
export function buildLaborSummaryPayload(
  agg: LaborSummaryAgg,
  lv: ConnectionPermissions['labor_visibility'] | null | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = { date: agg.date };
  if (lv?.show_total_hours === true) {
    out.total_hours = agg.total_hours;
    out.worker_count = agg.worker_count;
  }
  if (lv?.show_crew_names === true) {
    // Per-worker hours only when BOTH flags are on — names alone otherwise.
    out.crew = agg.crew.map((w) =>
      lv?.show_total_hours === true ? { name: w.name, hours: w.hours } : { name: w.name });
  }
  return out;
}

/**
 * One labor.summary per connection per date — guards pg-boss retry double-publish
 * (publish succeeded, notify threw → the retried job must not re-publish).
 */
export async function laborSummaryAlreadyPublished(connectionId: string, date: string): Promise<boolean> {
  const { rowCount } = await pgPool.query(
    `SELECT 1 FROM shared_project_events
      WHERE connection_id = $1 AND event_type = 'labor.summary' AND payload->>'date' = $2 LIMIT 1`,
    [connectionId, date],
  );
  return (rowCount ?? 0) > 0;
}

/**
 * Guarded publisher: re-validates membership + `status === 'active'` + the §5 permission
 * gate AT PUBLISH TIME (T-45), returning null (no publish, no throw) otherwise. Used by
 * every mirror/hook site so a revoked bridge — or a disabled optional event family —
 * blocks writes even when connection_id was validated earlier at row-create time.
 * Callers must gate notifyCounterparty on a non-null result (no notify without publish).
 */
export async function publishIfActive(
  connectionId: string,
  sourceTenantId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<SharedEventRow | null> {
  const conn = await validateConnectionMembership(connectionId, sourceTenantId);
  if (!conn || conn.status !== 'active') return null;
  if (!eventTypePermitted(conn.permissions, eventType)) return null;
  return publishSharedEvent(connectionId, sourceTenantId, eventType, payload);
}

// ─── project.location payload whitelist (Doc 20 Phase 6b — map pins) ────────────
// The ONLY project fields that cross the bridge for the map layer. No address/zip/ids/costs.
export interface ProjectSiteLike {
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
  status: string;
  geocode_status: string;
  city: string | null;
  state: string | null;
  /** Sub-side: set when this project is a bridge-instantiated mirror (projects.connection_id).
   *  Must come from the CALLER's own RLS-scoped project row — this raw-pool helper cannot
   *  read the FORCE-RLS projects table itself. Not part of the published payload. */
  connection_id?: string | null;
}
export function buildProjectLocationPayload(p: ProjectSiteLike): Record<string, unknown> {
  return {
    project_name: p.name,
    lat: p.latitude === null ? null : Number(p.latitude),
    lng: p.longitude === null ? null : Number(p.longitude),
    status: p.status,
    geocode_status: p.geocode_status,
    city: p.city,
    state: p.state,
  };
}

/**
 * Publish the caller's project site location to every ACTIVE connection that shares it —
 * BOTH directions. GC side: connections that link this project as the GC's shared project.
 * Sub side: this project is a bridge-instantiated mirror (`p.connection_id` set from the
 * caller's own RLS-scoped row) — publish back to the GC with source = the sub tenant, which
 * is what lights up the GC's "Connected sites" map layer (`/connections/map` filters
 * source != caller). Called after PATCH /projects/:id/location and from the geocode worker.
 * Best-effort: zero matching connections is the common case and a no-op; never throws.
 */
export async function publishProjectLocationForProject(
  tenantId: string,
  projectId: string,
  p: ProjectSiteLike,
): Promise<void> {
  try {
    const { rows } = await pgPool.query<{ id: string }>(
      `SELECT id FROM tenant_connections
        WHERE gc_tenant_id = $1 AND project_id = $2 AND status = 'active'`,
      [tenantId, projectId],
    );
    // Set dedupes the multi-tier edge (a sub's mirror project re-shared downstream as GC).
    const targets = new Set(rows.map((r) => r.id));
    if (p.connection_id) {
      const sub = await pgPool.query<{ id: string }>(
        `SELECT id FROM tenant_connections
          WHERE id = $1 AND sub_tenant_id = $2 AND status = 'active'`,
        [p.connection_id, tenantId],
      );
      if (sub.rows[0]) targets.add(sub.rows[0].id);
    }
    const payload = buildProjectLocationPayload(p);
    for (const id of targets) {
      await publishIfActive(id, tenantId, 'project.location', payload);
    }
  } catch {
    // best-effort — location fan-out never blocks the pin-drop / geocode path
  }
}

/**
 * Accept-time site snapshot of the GC's linked project (Doc 07 §6 sub-project instantiation).
 * A-07 justification: this is a GOVERNED copy through the bridge choke point — whitelisted
 * fields only (site identity, no members/costs/internal ids), executed server-side at accept,
 * audited in both tenants, and materialized as a `project.location` bridge event.
 */
export interface GcProjectSiteSnapshot {
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  geocode_status: string;
  status: string;
}
export async function readGcProjectSiteSnapshot(
  gcTenantId: string,
  projectId: string,
): Promise<GcProjectSiteSnapshot | null> {
  return withTenantContext(gcTenantId, async (client) => {
    const { rows } = await client.query<GcProjectSiteSnapshot>(
      `SELECT name, address, city, state, zip, latitude, longitude, geocode_status, status
         FROM projects WHERE id = $1 AND deleted_at IS NULL`,
      [projectId],
    );
    return rows[0] ?? null;
  });
}

// ─── Generic event whitelist (forgery guard on POST /connections/:id/events) ────
// System event families are reserved for server-side publishers — a member must not be able
// to forge a `project.location` pin or a fake `rfi.answered` through the generic endpoint.
export const RESERVED_EVENT_PREFIXES = [
  'project.',
  'rfi.',
  'change_order.',
  'submittal.',
  'connection.',
  'invoice.',
  'lien_waiver.',
  'daily_report.',
  'labor.',
] as const;

export const GENERIC_EVENT_TYPES: Record<string, z.ZodTypeAny> = {
  'milestone.updated': z
    .object({
      title: z.string().min(1).max(200),
      status: z.string().max(50).optional(),
      date: z.string().max(30).optional(),
    })
    .strict(),
  'schedule.updated': z
    .object({ note: z.string().min(1).max(2000), date: z.string().max(30).optional() })
    .strict(),
  'note.posted': z.object({ note: z.string().min(1).max(2000) }).strict(),
  // §5.1's message event — alias of note.posted (kept for back-compat); both gate on
  // optional_events.messages in eventTypePermitted.
  'message.sent': z.object({ message: z.string().min(1).max(2000) }).strict(),
};
