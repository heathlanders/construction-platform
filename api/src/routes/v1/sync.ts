// routes/v1/sync.ts — WatermelonDB offline sync protocol
// Locked decisions: T-06, T-12, T-13, T-14
// GET  /v1/sync/pull?since={ISO timestamp}  — server→client delta
// POST /v1/sync/push                         — client→server batch writes

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate } from '../../plugins/auth-plugin.js';
import { sendJob } from '../../lib/queue.js';
import type { PoolClient } from 'pg';

// ─── Sync table registry ──────────────────────────────────────────────────────
// Defines which tables participate in sync and what columns the client may write.
// Server-protected fields (tenant_id, created_by) are always excluded from push.
// "tier3" tables block on conflict rather than returning the record (T-13).

interface SyncTableConfig {
  table: string;
  pullCols: string;            // SELECT columns for pull response
  pushCols: string[];          // columns client may write on create/update
  tier3?: true;                // safety-critical — conflict blocks until SO resolves
  readOnly?: true;             // pull-only reference data — the client may never push it
  jsonCols?: string[];         // JSONB columns — must be stringified before binding (see below)
  ownerCol?: string;           // self-guard column — non-managers may only write their own rows
  managerRoles?: string[];     // roles exempt from the self-guard (mirrors the resource route)
  costRollup?: true;           // dispatch reconciliation.field_cost_rollup on write (job parity with the route)
}

// Mirrors MANAGER_ROLES in routes/v1/time-entries.ts — a field tech may only sync their OWN time.
const TIME_ENTRY_MANAGER_ROLES = ['OWNER', 'PROJECT_MANAGER', 'FOREMAN', 'ACCOUNTANT'];

const SYNC_TABLES: SyncTableConfig[] = [
  {
    table: 'projects',
    pullCols: 'id,name,status,start_date,end_date,address,city,state,zip,version,created_at,updated_at,deleted_at,created_by',
    // Pull-only. A project create must pass assertCanCreateProject (tier cap) + the route's
    // role gate — neither exists on the batch path, so the client may never push one.
    pushCols: [],
    readOnly: true,
  },
  {
    table: 'daily_reports',
    pullCols: 'id,project_id,report_date,weather,notes,version,created_at,updated_at,deleted_at,created_by',
    pushCols: ['project_id','report_date','weather','notes'],
    jsonCols: ['weather'],
  },
  {
    table: 'time_entries',
    pullCols: 'id,project_id,user_id,date,hours_worked,hourly_rate_cents,cost_code_id,budget_line_item_id,notes,version,created_at,updated_at,deleted_at,created_by',
    pushCols: ['project_id','user_id','date','hours_worked','hourly_rate_cents','cost_code_id','budget_line_item_id','notes'],
    ownerCol: 'user_id',
    managerRoles: TIME_ENTRY_MANAGER_ROLES,
    costRollup: true,
  },
  {
    table: 'punch_list_items',
    pullCols: 'id,project_id,title,description,status,assigned_to,due_date,version,created_at,updated_at,deleted_at,created_by',
    pushCols: ['project_id','title','description','status','assigned_to','due_date'],
  },
  {
    table: 'inspections',
    // inspector_name/trade_type carried for the mobile offline cache (parity with
    // POST /v1/inspections, which accepts both) — see routes/v1/inspections.ts.
    pullCols: 'id,project_id,title,inspection_date,status,notes,inspector_name,trade_type,permit_id,inspection_type,sequence_order,result,correction_notice,version,created_at,updated_at,deleted_at,created_by',
    // `result` + `correction_notice` are the AHJ outcome a foreman records standing with
    // the inspector — often with no signal. `permit_id`/`inspection_type`/`sequence_order`
    // are pull-only ON PURPOSE: a client must not be able to re-parent an inspection onto
    // another permit or reorder an AHJ milestone sequence.
    pushCols: ['project_id','title','inspection_date','status','notes','inspector_name','trade_type','result','correction_notice'],
  },
  {
    table: 'safety_incidents',
    pullCols: 'id,project_id,incident_date,description,severity,status,version,created_at,updated_at,deleted_at,created_by',
    pushCols: ['project_id','incident_date','description','severity','status'],
    tier3: true,
  },
  {
    table: 'jsa_records',
    pullCols: 'id,project_id,title,conducted_at,attendees,hazards,version,created_at,updated_at,deleted_at,created_by',
    pushCols: ['project_id','title','conducted_at','attendees','hazards'],
    tier3: true,
    jsonCols: ['attendees', 'hazards'],
  },
  {
    table: 'safety_certifications',
    pullCols: 'id,user_id,cert_type,issued_at,expires_at,document_path,version,created_at,updated_at,deleted_at,created_by',
    // Pull-only. A certification gates operator checkout (T-57) — letting any role push one
    // would let a worker self-certify on a forklift. Certs are issued via the resource route.
    pushCols: [],
    readOnly: true,
  },
  {
    // A circuit's status flips as the work gets done — roughed in, then complete — and
    // that happens standing at the panel. Tier 2.
    table: 'electrical_circuits',
    pullCols: 'id,panel_id,circuit_number,description,amperage,status,version,created_at,updated_at,deleted_at,created_by',
    pushCols: ['panel_id','circuit_number','description','amperage','status'],
  },
  {
    table: 'electrical_panels',
    pullCols: 'id,project_id,name,amperage,voltage,location,notes,version,created_at,updated_at,deleted_at,created_by',
    pushCols: [],
    readOnly: true,
  },
  {
    // Same for a fixture: planned → rough_in → trimmed → complete is field progress.
    table: 'plumbing_fixtures',
    pullCols: 'id,system_id,fixture_type,location,status,version,created_at,updated_at,deleted_at,created_by',
    pushCols: ['system_id','fixture_type','location','status'],
  },
  {
    table: 'plumbing_systems',
    pullCols: 'id,project_id,name,system_type,notes,version,created_at,updated_at,deleted_at,created_by',
    pushCols: [],
    readOnly: true,
  },
  {
    // Roofing QA — dry-in, seam welds and fastener pulls are checked ON the roof, which
    // is not where the signal is. Tier 2: a disputed reading needs a human.
    table: 'roofing_qa_records',
    pullCols: 'id,roofing_system_id,qa_type,inspection_date,result,measured_value,unit,inspector_name,notes,version,created_at,updated_at,deleted_at,created_by',
    pushCols: ['roofing_system_id','qa_type','inspection_date','result','measured_value','unit','inspector_name','notes'],
  },
  {
    table: 'roofing_systems',
    pullCols: 'id,project_id,roof_type,total_squares,manufacturer,warranty_years,status,version,created_at,updated_at,deleted_at,created_by',
    pushCols: [],
    readOnly: true,
  },
  {
    // Framing corrections are raised AND cleared at the wall — the whole life of the
    // record happens on site.
    table: 'framing_correction_items',
    pullCols: 'id,framing_inspection_id,description,location,severity,status,notes,resolved_at,resolved_by,version,created_at,updated_at,deleted_at,created_by',
    pushCols: ['framing_inspection_id','description','location','severity','status','notes'],
  },
  {
    table: 'framing_inspections',
    pullCols: 'id,project_id,section,inspection_date,status,inspector_name,version,created_at,updated_at,deleted_at,created_by',
    pushCols: [],
    readOnly: true,
  },
  {
    // Concrete QA tests are taken AT the pour — slump, air, temperature are measured
    // while the truck is there, and a cylinder break is logged against that same pour.
    // Tier 2: a conflict is a real disagreement about a measurement, so it goes to the
    // resolve inbox rather than last-write-wins.
    table: 'concrete_test_records',
    pullCols: 'id,pour_id,test_type,test_date,age_days,specified_value,measured_value,unit,result,sample_id,lab_name,notes,version,created_at,updated_at,deleted_at,created_by',
    pushCols: ['pour_id','test_type','test_date','age_days','specified_value','measured_value','unit','result','sample_id','lab_name','notes'],
  },
  {
    // Pours themselves are a read cache — creating one is a scheduling act, not a field
    // capture, and the tests need something to hang off.
    table: 'concrete_pours',
    pullCols: 'id,project_id,pour_type,volume_cy,mix_design,slump_inches,pour_date,status,version,created_at,updated_at,deleted_at,created_by',
    pushCols: [],
    readOnly: true,
  },
  {
    // Read-only cache so the permit + its AHJ milestones survive with no signal — an
    // inspection is witnessed at the site, which is exactly where the bars run out.
    // Never pushed: permit lifecycle (submit/approve/void) is an office action with
    // tier gates and jurisdiction resolution behind it (T-55/T-59).
    table: 'permits',
    pullCols: 'id,project_id,permit_type,permit_number,building_type,status,code_type,code_edition,nec_edition,ahj_name,ahj_level,ahj_phone,jurisdiction_notes,applied_date,approved_date,expiry_date,version,created_at,updated_at,deleted_at,created_by',
    pushCols: [],
    readOnly: true,
  },
  {
    // Read-only cache for the mobile yard flow: the QR scan resolves an asset_number
    // locally, so fuel logs / inspections / damage reports are reachable with no signal.
    // Business+ (T-56) is a feature gate, not a data gate — a lower tier simply has no rows.
    table: 'company_assets',
    pullCols: 'id,asset_number,name,asset_category,asset_type,make,model,year,status,condition,home_location,meter_type,current_meter_reading,requires_operator_cert,required_cert_type,ownership_type,version,created_at,updated_at,deleted_at,created_by',
    pushCols: [],
    readOnly: true,
  },
  {
    table: 'bid_packages',
    pullCols: 'id,project_id,title,status,due_date,version,created_at,updated_at,deleted_at,created_by',
    pushCols: ['project_id','title','status','due_date'],
  },
  {
    table: 'takeoff_items',
    pullCols: 'id,project_id,bid_package_id,description,quantity,unit,unit_cost_cents,version,created_at,updated_at,deleted_at,created_by',
    pushCols: ['project_id','bid_package_id','description','quantity','unit','unit_cost_cents'],
  },
];

const SYNC_TABLE_MAP = new Map(SYNC_TABLES.map(t => [t.table, t]));

// ─── Schemas ──────────────────────────────────────────────────────────────────

const PullQuery = z.object({
  since: z.string().datetime().optional(),
  project_id: z.string().uuid().optional(), // optional scope filter
});

const SyncRecord = z.record(z.unknown());
const PushChanges = z.record(
  z.object({
    created: z.array(SyncRecord).optional().default([]),
    updated: z.array(SyncRecord).optional().default([]),
    deleted: z.array(z.string().uuid()).optional().default([]),
  })
);
const PushBody = z.object({ changes: PushChanges });

// ─── Pull helper ──────────────────────────────────────────────────────────────

async function pullTable(
  client: PoolClient,
  config: SyncTableConfig,
  since: Date | null,
  projectId: string | undefined
): Promise<{ created: unknown[]; updated: unknown[]; deleted: string[] }> {
  const { table, pullCols } = config;
  const hasProjectCol = pullCols.includes('project_id');

  const params: unknown[] = [];
  const conds: string[] = [];
  let idx = 1;

  if (since) {
    conds.push(`(updated_at > $${idx} OR deleted_at > $${idx})`);
    params.push(since.toISOString());
    idx++;
  }
  if (projectId && hasProjectCol) {
    conds.push(`project_id=$${idx++}`);
    params.push(projectId);
  }

  const where = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT ${pullCols} FROM ${table} ${where} ORDER BY updated_at ASC`,
    params
  );

  const sinceTs = since?.getTime() ?? 0;
  const created: unknown[] = [];
  const updated: unknown[] = [];
  const deleted: string[] = [];

  for (const row of rows) {
    if (row.deleted_at && new Date(row.deleted_at).getTime() > sinceTs) {
      deleted.push(row.id as string);
    } else if (new Date(row.created_at).getTime() > sinceTs) {
      created.push(row);
    } else {
      updated.push(row);
    }
  }

  return { created, updated, deleted };
}

// ─── Push helper ──────────────────────────────────────────────────────────────

interface PushConflict {
  table: string;
  id: string;
  conflict_type: 'version_conflict' | 'safety_blocked' | 'forbidden';
  server_record?: unknown;
}

// Job side-effects collected during the push transaction and dispatched AFTER it commits
// (mirrors the resource routes, which sendJob outside withTenantContext).
interface RollupTarget { budget_line_item_id: string; project_id: string | null }

async function pushTable(
  client: PoolClient,
  tenantId: string,
  userId: string,
  email: string,
  role: string,
  config: SyncTableConfig,
  changes: { created: Record<string, unknown>[]; updated: Record<string, unknown>[]; deleted: string[] },
  conflicts: PushConflict[],
  rollups: RollupTarget[],
  ip: string
): Promise<void> {
  const { table, pushCols, tier3, ownerCol, managerRoles, costRollup, jsonCols } = config;

  // node-pg turns a JS OBJECT into JSON but a JS ARRAY into a Postgres array literal
  // (`{...}`), which a jsonb column rejects. `daily_reports.weather` is an object so it
  // survived by luck; `jsa_records.attendees`/`hazards` are arrays and would have failed
  // every push. Stringify declared JSONB columns and let pg cast from text.
  const bind = (col: string, v: unknown): unknown =>
    jsonCols?.includes(col) && v !== null && v !== undefined ? JSON.stringify(v) : v;

  // Pull-only reference data: a client push here is either a bug or an attack
  // (an INSERT with no columns would violate the table's NOT NULLs). Ignore it.
  if (config.readOnly) return;

  // Self-guard: a non-manager may only write rows they own (parity with the resource route).
  const selfGuarded = Boolean(ownerCol) && !(managerRoles ?? []).includes(role);
  const rollupCols = costRollup ? ',budget_line_item_id,project_id' : '';
  const collectRollup = (row: Record<string, unknown> | undefined) => {
    if (!costRollup || !row?.budget_line_item_id) return;
    rollups.push({
      budget_line_item_id: row.budget_line_item_id as string,
      project_id: (row.project_id as string | null) ?? null,
    });
  };

  // Creates ──────────────────────────────────────────────────────────────────
  for (const raw of changes.created) {
    const id = (raw.id as string | undefined) ?? crypto.randomUUID();
    // Force ownership to the actor when self-guarded — never trust a client-sent owner id.
    const rec = selfGuarded && ownerCol ? { ...raw, [ownerCol]: userId } : raw;
    const writeable = pushCols.filter(c => rec[c] !== undefined);
    const cols = ['tenant_id', 'id', 'created_by', ...writeable];
    const vals = [tenantId, id, userId, ...writeable.map(c => bind(c, rec[c] ?? null))];
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(',');

    const { rows } = await client.query(
      `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING RETURNING id${rollupCols}`,
      vals
    );
    // No row back = duplicate id (idempotent retry) — already applied, no audit/job re-fire.
    if (rows.length === 0) continue;
    collectRollup(rows[0]);
    await writeAuditEntry(client, { tenantId, category:'data', action:`${table}.synced_create`, actorId:userId, actorEmail:email, actorRole:role, resourceType:table, resourceId:id, payload:{ sync:true }, ipAddress:ip });
  }

  // Updates ──────────────────────────────────────────────────────────────────
  for (const rec of changes.updated) {
    const id = rec.id as string;
    const version = rec.version as number;
    if (!id || !version) continue;

    // Ownership is never client-writable on a self-guarded table.
    const writeable = pushCols.filter(c => rec[c] !== undefined && !(selfGuarded && c === ownerCol));
    if (writeable.length === 0) continue;

    const sets = ['version=version+1', 'updated_at=NOW()', ...writeable.map((c, i) => `${c}=$${i + 1}`)];
    const params: unknown[] = [...writeable.map(c => bind(c, rec[c] ?? null)), id, version];
    let ownGuard = '';
    if (selfGuarded) { params.push(userId); ownGuard = ` AND ${ownerCol}=$${writeable.length + 3}`; }

    const { rows } = await client.query(
      `UPDATE ${table} SET ${sets.join(',')} WHERE id=$${writeable.length + 1} AND version=$${writeable.length + 2} AND deleted_at IS NULL${ownGuard} RETURNING id${rollupCols}`,
      params
    );

    if (rows.length === 0) {
      // Determine not_found vs forbidden vs conflict
      const ownerSel = selfGuarded ? `,${ownerCol}` : '';
      const { rows: check } = await client.query(`SELECT id,version${ownerSel} FROM ${table} WHERE id=$1 AND deleted_at IS NULL`, [id]);
      if (check.length === 0) continue; // deleted — skip silently

      if (selfGuarded && ownerCol && check[0][ownerCol] !== userId) {
        // Someone else's row — report without leaking its contents.
        conflicts.push({ table, id, conflict_type:'forbidden' });
        continue;
      }

      const { rows: srv } = await client.query(`SELECT * FROM ${table} WHERE id=$1`, [id]);
      // T-13 Tier 3: safety records block — don't auto-resolve
      conflicts.push({ table, id, conflict_type: tier3 ? 'safety_blocked' : 'version_conflict', server_record: srv[0] });
    } else {
      collectRollup(rows[0]);
      await writeAuditEntry(client, { tenantId, category:'data', action:`${table}.synced_update`, actorId:userId, actorEmail:email, actorRole:role, resourceType:table, resourceId:id, payload:{ sync:true }, ipAddress:ip });
    }
  }

  // Deletes (soft) ───────────────────────────────────────────────────────────
  for (const id of changes.deleted) {
    const params: unknown[] = [id, tenantId];
    let ownGuard = '';
    if (selfGuarded) { params.push(userId); ownGuard = ` AND ${ownerCol}=$3`; }
    const { rows } = await client.query(
      `UPDATE ${table} SET deleted_at=NOW() WHERE id=$1 AND tenant_id=$2 AND deleted_at IS NULL${ownGuard} RETURNING id${rollupCols}`,
      params
    );
    if (rows.length > 0) {
      // Removing costed hours must re-sum the budget line too.
      collectRollup(rows[0]);
      await writeAuditEntry(client, { tenantId, category:'data', action:`${table}.synced_delete`, actorId:userId, actorEmail:email, actorRole:role, resourceType:table, resourceId:id, payload:{ sync:true }, ipAddress:ip });
    }
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function syncRoutes(app: FastifyInstance): Promise<void> {

  // GET /v1/sync/pull?since={ISO}&project_id={uuid}
  // Returns all records created/updated/deleted since the given timestamp.
  // `since` is omitted on first sync — returns entire tenant dataset.
  app.get('/sync/pull', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = PullQuery.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{ code:'VALIDATION_ERROR', message:'Invalid query' } });

      const { tenant_id } = req.jwt;
      const { since, project_id } = q.data;
      const sinceDate = since ? new Date(since) : null;
      const serverTimestamp = new Date().toISOString();

      const changes: Record<string, { created: unknown[]; updated: unknown[]; deleted: string[] }> = {};

      await withTenantContext(tenant_id, async (client) => {
        for (const config of SYNC_TABLES) {
          const tableChanges = await pullTable(client, config, sinceDate, project_id);
          // Only include tables that have changes (reduces payload size)
          if (tableChanges.created.length > 0 || tableChanges.updated.length > 0 || tableChanges.deleted.length > 0) {
            changes[config.table] = tableChanges;
          }
        }
      });

      return reply.status(200).send({ changes, timestamp: serverTimestamp });
    }
  );

  // POST /v1/sync/push
  // Accepts batched local changes from the mobile client.
  // Returns conflicts for records that couldn't be applied.
  app.post('/sync/push', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = PushBody.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{ code:'VALIDATION_ERROR', message:'Invalid push payload' } });

      const { tenant_id, user_id, email, role } = req.jwt;
      const conflicts: PushConflict[] = [];
      const rollups: RollupTarget[] = [];

      await withTenantContext(tenant_id, async (client) => {
        for (const [tableName, tableChanges] of Object.entries(body.data.changes)) {
          const config = SYNC_TABLE_MAP.get(tableName);
          if (!config) {
            // Unknown table — skip silently (client may be newer than server)
            app.log.warn({ tableName }, 'sync/push: unknown table ignored');
            continue;
          }

          const typedChanges = {
            created: tableChanges.created as Record<string, unknown>[],
            updated: tableChanges.updated as Record<string, unknown>[],
            deleted: tableChanges.deleted,
          };

          await pushTable(client, tenant_id, user_id, email, role, config, typedChanges, conflicts, rollups, req.ip);
        }
      });

      // Job parity with the resource routes: costed field labor must re-sum the budget line.
      // Dispatched after the transaction commits; deduped per budget line.
      const seen = new Set<string>();
      for (const r of rollups) {
        if (seen.has(r.budget_line_item_id)) continue;
        seen.add(r.budget_line_item_id);
        await sendJob('reconciliation.field_cost_rollup', tenant_id, {
          budget_line_item_id: r.budget_line_item_id,
          project_id: r.project_id,
        });
      }

      return reply.status(200).send({ conflicts });
    }
  );
}
