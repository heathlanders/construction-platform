// lib/sync-core.ts — the offline sync engine (batch protocol).
//
// Split out of `sync.ts` so it can be unit-tested: `sync.ts` statically imports the
// six capture-queue flushers, which live in React Native screens, so importing it in
// a node test drags in the whole RN module graph. This file touches only the local
// DB, the API client and AsyncStorage — all mockable. `sync.ts` keeps the sweep
// orchestration (engine + queue flushes) and re-exports what screens use.
//
// Writes land in the local DB first (offline-first); a sweep then reconciles with
// the server over the SHARED batch protocol — ONE `POST /v1/sync/push` and ONE
// `GET /v1/sync/pull` per sweep for every offline table (was: a per-record
// POST/PATCH per table, and a separate pull call per table).
//
// Ids: this app keeps the dual-id pattern (WatermelonDB `Model.id` locally,
// `server_id` for the server). The server accepts a CLIENT-minted `id` on create
// and inserts `ON CONFLICT (id) DO NOTHING`, so we mint `server_id` before the
// first push — pushes are idempotent and a retry after a dropped response can
// never duplicate a row. (This is what the old "batch push needs a shared-id
// rework" note assumed was impossible.)
//
// T-12: version-based optimistic locking. Pull only overwrites a local row when
//       server.version >= local.version, and never touches a dirty local row.
// T-13/T-14: tiered conflict policy — Tier 1 last-write-wins (daily reports),
//       Tier 2 side-by-side resolve (time entries, punch list), Tier 3 blocked
//       until an authorized user resolves (safety incidents).

import { Q, Model } from '@nozbe/watermelondb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from './database';
import { mobileApi } from './api';
import { saveConflictFor, type ServerSnapshot } from './conflicts';
import { uuidv4 } from './uuid';
import {
  buildPushPayload, indexConflicts, conflictKey, nextLocalVersion,
  type PendingRow, type PushConflict,
} from './sync-payload';
import { Project } from '../models/Project';
import { TimeEntry } from '../models/TimeEntry';
import { DailyReport } from '../models/DailyReport';
import { PunchListItem } from '../models/PunchListItem';
import { SafetyIncident } from '../models/SafetyIncident';
import { JsaRecord, parseJsonArray } from '../models/JsaRecord';
import { Permit } from '../models/Permit';
import { ConcretePour } from '../models/ConcretePour';
import { ConcreteTestRecord } from '../models/ConcreteTestRecord';
import { RoofingSystem } from '../models/RoofingSystem';
import { RoofingQaRecord } from '../models/RoofingQaRecord';
import { FramingInspection } from '../models/FramingInspection';
import { FramingCorrectionItem } from '../models/FramingCorrectionItem';
import { ElectricalPanel } from '../models/ElectricalPanel';
import { ElectricalCircuit } from '../models/ElectricalCircuit';
import { PlumbingSystem } from '../models/PlumbingSystem';
import { PlumbingFixture } from '../models/PlumbingFixture';
import { Inspection } from '../models/Inspection';
import { SafetyCertification } from '../models/SafetyCertification';
import { CompanyAsset } from '../models/CompanyAsset';

// ─── Table registry ───────────────────────────────────────────────────────────
// One entry per offline table. `push` maps a local record to server columns;
// `applyPull` writes a server row back onto a local record. Tier decides what a
// conflict does (T-13). Local collection name === server table name.

type AnyRecord = Model & { server_id: string; version: number; sync_status: string; synced_at: string | null; is_deleted: boolean };

interface TableDef<T extends AnyRecord> {
  table: string;
  /** Columns the client may write (must be a subset of the server's pushCols). */
  push: (r: T) => Record<string, unknown>;
  /** Copy a pulled server row onto a local record. */
  applyPull: (r: T, row: Record<string, unknown>) => void;
  /** Tier 1 = last-write-wins (no UI); 2 = resolve screen; 3 = blocked (T-13).
   *  Tiers 2/3 stash the server row generically — the resolve screen is registry-driven
   *  (lib/conflict-registry.ts), so a new table needs no new screen. */
  tier: 1 | 2 | 3;
}

const timeEntries: TableDef<TimeEntry> = {
  table: 'time_entries',
  tier: 2,
  push: (r) => ({
    project_id: r.project_id || null,
    user_id: r.user_id,
    date: r.date,
    hours_worked: r.hours_worked,
    cost_code_id: r.cost_code_id || null,
    budget_line_item_id: r.budget_line_item_id || null,
    hourly_rate_cents: r.hourly_rate_cents ?? null,
    notes: r.notes || null,
  }),
  applyPull: (r, row) => {
    r.project_id = (row.project_id as string) ?? '';
    r.user_id = row.user_id as string;
    r.date = row.date as string;
    r.hours_worked = Number(row.hours_worked);
    r.hourly_rate_cents = (row.hourly_rate_cents as number | null) ?? null;
    r.cost_code_id = (row.cost_code_id as string | null) ?? null;
    r.budget_line_item_id = (row.budget_line_item_id as string | null) ?? null;
    r.notes = (row.notes as string | null) ?? null;
  },
};

const dailyReports: TableDef<DailyReport> = {
  table: 'daily_reports',
  tier: 1, // append-only notes — last-write-wins, no resolve UI (T-13 Tier 1)
  push: (r) => ({
    project_id: r.project_id,
    report_date: r.report_date,
    // The server stores free-text conditions inside the `weather` jsonb column.
    weather: r.conditions ? { conditions: r.conditions } : null,
    notes: r.notes || null,
  }),
  applyPull: (r, row) => {
    r.project_id = row.project_id as string;
    r.report_date = row.report_date as string;
    r.conditions = ((row.weather as { conditions?: string } | null)?.conditions) ?? null;
    r.notes = (row.notes as string | null) ?? null;
  },
};

const punchListItems: TableDef<PunchListItem> = {
  table: 'punch_list_items',
  tier: 2,
  push: (r) => ({
    project_id: r.project_id,
    title: r.title,
    description: r.description || null,
    status: r.status,
    due_date: r.due_date || null,
  }),
  applyPull: (r, row) => {
    r.project_id = row.project_id as string;
    r.title = row.title as string;
    r.description = (row.description as string | null) ?? null;
    r.status = row.status as string;
    r.due_date = (row.due_date as string | null) ?? null;
  },
};

const safetyIncidents: TableDef<SafetyIncident> = {
  table: 'safety_incidents',
  tier: 3,
  push: (r) => ({
    project_id: r.project_id,
    // The screen stores 'YYYY-MM-DD'; the column is TIMESTAMPTZ.
    incident_date: new Date(r.incident_date).toISOString(),
    description: r.description,
    severity: r.severity,
    status: r.status,
  }),
  applyPull: (r, row) => {
    r.project_id = row.project_id as string;
    r.incident_date = String(row.incident_date).slice(0, 10);
    r.description = row.description as string;
    r.severity = row.severity as string;
    r.status = row.status as string;
  },
};

const jsaRecords: TableDef<JsaRecord> = {
  table: 'jsa_records',
  tier: 3,   // safety-critical (T-13): a conflict blocks until an authorized role resolves it
  push: (r) => ({
    project_id: r.project_id,
    title: r.title,
    // The form captures 'YYYY-MM-DD'; the column is TIMESTAMPTZ.
    conducted_at: new Date(r.conducted_at).toISOString(),
    // JSONB on the server, JSON TEXT locally — parsed here so the wire carries arrays.
    attendees: parseJsonArray(r.attendees_json),
    hazards: parseJsonArray(r.hazards_json),
  }),
  applyPull: (r, row) => {
    r.project_id = row.project_id as string;
    r.title = row.title as string;
    r.conducted_at = String(row.conducted_at).slice(0, 10);
    r.attendees_json = JSON.stringify(row.attendees ?? []);
    r.hazards_json = JSON.stringify(row.hazards ?? []);
  },
};

const concreteTests: TableDef<ConcreteTestRecord> = {
  table: 'concrete_test_records',
  tier: 2,   // a conflict here is two people disagreeing about a measurement
  push: (r) => ({
    pour_id: r.pour_id,
    test_type: r.test_type,
    test_date: r.test_date || null,
    age_days: r.age_days ?? null,
    specified_value: r.specified_value ?? null,
    measured_value: r.measured_value ?? null,
    unit: r.unit || null,
    result: r.result,
    sample_id: r.sample_id || null,
    lab_name: r.lab_name || null,
    notes: r.notes || null,
  }),
  applyPull: (r, row) => {
    r.pour_id = row.pour_id as string;
    r.test_type = row.test_type as string;
    r.test_date = (row.test_date as string | null) ?? null;
    r.age_days = (row.age_days as number | null) ?? null;
    // NUMERIC comes back as a string from pg — Number() or the local column rejects it.
    r.specified_value = row.specified_value == null ? null : Number(row.specified_value);
    r.measured_value = row.measured_value == null ? null : Number(row.measured_value);
    r.unit = (row.unit as string | null) ?? null;
    r.result = row.result as string;
    r.sample_id = (row.sample_id as string | null) ?? null;
    r.lab_name = (row.lab_name as string | null) ?? null;
    r.notes = (row.notes as string | null) ?? null;
  },
};

const roofingQa: TableDef<RoofingQaRecord> = {
  table: 'roofing_qa_records',
  tier: 2,
  push: (r) => ({
    roofing_system_id: r.roofing_system_id,
    qa_type: r.qa_type,
    inspection_date: r.inspection_date || null,
    result: r.result,
    measured_value: r.measured_value ?? null,
    unit: r.unit || null,
    inspector_name: r.inspector_name || null,
    notes: r.notes || null,
  }),
  applyPull: (r, row) => {
    r.roofing_system_id = row.roofing_system_id as string;
    r.qa_type = row.qa_type as string;
    r.inspection_date = row.inspection_date ? String(row.inspection_date).slice(0, 10) : null;
    r.result = row.result as string;
    // NUMERIC arrives as a string from pg.
    r.measured_value = row.measured_value == null ? null : Number(row.measured_value);
    r.unit = (row.unit as string | null) ?? null;
    r.inspector_name = (row.inspector_name as string | null) ?? null;
    r.notes = (row.notes as string | null) ?? null;
  },
};

const framingCorrections: TableDef<FramingCorrectionItem> = {
  table: 'framing_correction_items',
  tier: 2,
  push: (r) => ({
    framing_inspection_id: r.framing_inspection_id,
    description: r.description,
    location: r.location || null,
    severity: r.severity,
    status: r.status,
    notes: r.notes || null,
  }),
  applyPull: (r, row) => {
    r.framing_inspection_id = row.framing_inspection_id as string;
    r.description = row.description as string;
    r.location = (row.location as string | null) ?? null;
    r.severity = row.severity as string;
    r.status = row.status as string;
    r.notes = (row.notes as string | null) ?? null;
  },
};

const electricalCircuits: TableDef<ElectricalCircuit> = {
  table: 'electrical_circuits',
  tier: 2,
  push: (r) => ({
    panel_id: r.panel_id,
    circuit_number: r.circuit_number,
    description: r.description || null,
    amperage: r.amperage ?? null,
    status: r.status,
  }),
  applyPull: (r, row) => {
    r.panel_id = row.panel_id as string;
    r.circuit_number = Number(row.circuit_number);
    r.description = (row.description as string | null) ?? null;
    r.amperage = (row.amperage as number | null) ?? null;
    r.status = (row.status as string | null) ?? 'planned';
  },
};

const plumbingFixtures: TableDef<PlumbingFixture> = {
  table: 'plumbing_fixtures',
  tier: 2,
  push: (r) => ({
    system_id: r.system_id,
    fixture_type: r.fixture_type || null,
    location: r.location || null,
    status: r.status,
  }),
  applyPull: (r, row) => {
    r.system_id = row.system_id as string;
    r.fixture_type = (row.fixture_type as string | null) ?? null;
    r.location = (row.location as string | null) ?? null;
    r.status = (row.status as string | null) ?? 'planned';
  },
};

// ─── Pull-only (read cache) ───────────────────────────────────────────────────
// Pulled, never pushed — the screen renders with no signal but its writes still go
// straight to the API. `safety_certifications` stays read-only on purpose: issuing a
// cert offline is a compliance record nobody is waiting on in the field, and it has
// no capture screen worth the write path. `inspections` graduated to offline writes
// once the conflict inbox became registry-driven (see lib/conflict-registry.ts).

const projects: TableDef<Project> = {
  table: 'projects',
  tier: 1,
  push: () => ({}),
  applyPull: (r, row) => {
    r.name = row.name as string;
    r.status = row.status as string;
  },
};

const inspections: TableDef<Inspection> = {
  table: 'inspections',
  // Offline WRITES enabled (Tier 2) now that the resolve screen is registry-driven:
  // a conflict here lands in the shared inbox instead of being an invisible stuck row.
  tier: 2,
  push: (r) => ({
    project_id: r.project_id,
    title: r.title,
    inspection_date: r.inspection_date || null,
    status: r.status,
    notes: r.notes || null,
    inspector_name: r.inspector_name || null,
    trade_type: r.trade_type || null,
    // The AHJ outcome — the whole reason an inspection is writable offline.
    result: r.result || null,
    correction_notice: r.correction_notice || null,
    // permit_id / inspection_type / sequence_order are deliberately NOT pushed: the
    // server rejects them, so a phone can't re-parent an inspection or reorder a
    // milestone sequence.
  }),
  applyPull: (r, row) => {
    r.project_id = row.project_id as string;
    r.title = row.title as string;
    r.inspection_date = (row.inspection_date as string | null) ?? null;
    r.status = row.status as string;
    r.notes = (row.notes as string | null) ?? null;
    r.inspector_name = (row.inspector_name as string | null) ?? null;
    r.trade_type = (row.trade_type as string | null) ?? null;
    r.permit_id = (row.permit_id as string | null) ?? null;
    r.inspection_type = (row.inspection_type as string | null) ?? null;
    r.sequence_order = (row.sequence_order as number | null) ?? null;
    r.result = (row.result as string | null) ?? null;
    r.correction_notice = (row.correction_notice as string | null) ?? null;
  },
};

const permits: TableDef<Permit> = {
  table: 'permits',
  tier: 1,
  push: () => ({}),   // read cache — see models/Permit.ts for why lifecycle stays office-side
  applyPull: (r, row) => {
    r.project_id = row.project_id as string;
    r.permit_type = row.permit_type as string;
    r.permit_number = (row.permit_number as string | null) ?? null;
    r.building_type = (row.building_type as string | null) ?? null;
    r.status = row.status as string;
    r.code_type = (row.code_type as string | null) ?? null;
    r.code_edition = (row.code_edition as string | null) ?? null;
    r.nec_edition = (row.nec_edition as string | null) ?? null;
    r.ahj_name = (row.ahj_name as string | null) ?? null;
    r.ahj_level = (row.ahj_level as string | null) ?? null;
    r.ahj_phone = (row.ahj_phone as string | null) ?? null;
    r.jurisdiction_notes = (row.jurisdiction_notes as string | null) ?? null;
    r.applied_date = (row.applied_date as string | null) ?? null;
  },
};

const safetyCerts: TableDef<SafetyCertification> = {
  table: 'safety_certifications',
  tier: 1,
  push: () => ({}),
  applyPull: (r, row) => {
    r.user_id = row.user_id as string;
    r.cert_type = row.cert_type as string;
    r.issued_at = (row.issued_at as string | null) ?? null;
    r.expires_at = (row.expires_at as string | null) ?? null;
    r.document_path = (row.document_path as string | null) ?? null;
  },
};

// The yard read cache: without it the QR scan can't resolve an asset offline, which
// made the fuel / inspection / damage capture queues unreachable in the field.
const companyAssets: TableDef<CompanyAsset> = {
  table: 'company_assets',
  tier: 1,
  push: () => ({}),
  applyPull: (r, row) => {
    r.asset_number = row.asset_number as string;
    r.name = row.name as string;
    r.asset_category = row.asset_category as string;
    r.asset_type = (row.asset_type as string | null) ?? null;
    r.make = (row.make as string | null) ?? null;
    r.model = (row.model as string | null) ?? null;
    r.year = (row.year as number | null) ?? null;
    r.status = row.status as string;
    r.condition = (row.condition as string | null) ?? null;
    r.home_location = (row.home_location as string | null) ?? null;
    r.meter_type = (row.meter_type as string) ?? 'none';
    r.current_meter_reading = row.current_meter_reading == null ? null : Number(row.current_meter_reading);
    r.requires_operator_cert = Boolean(row.requires_operator_cert);
    r.required_cert_type = (row.required_cert_type as string | null) ?? null;
    r.ownership_type = (row.ownership_type as string) ?? 'owned';
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PUSH_TABLES: TableDef<any>[] = [timeEntries, dailyReports, punchListItems, safetyIncidents, inspections, jsaRecords, concreteTests, roofingQa, framingCorrections, electricalCircuits, plumbingFixtures];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const concretePours: TableDef<ConcretePour> = {
  table: 'concrete_pours',
  tier: 1,
  push: () => ({}),
  applyPull: (r, row) => {
    r.project_id = row.project_id as string;
    r.pour_type = row.pour_type as string;
    r.volume_cy = row.volume_cy == null ? null : Number(row.volume_cy);
    r.mix_design = (row.mix_design as string | null) ?? null;
    r.pour_date = row.pour_date ? String(row.pour_date).slice(0, 10) : null;
    r.status = row.status as string;
  },
};

const roofingSystems: TableDef<RoofingSystem> = {
  table: 'roofing_systems',
  tier: 1,
  push: () => ({}),
  applyPull: (r, row) => {
    r.project_id = row.project_id as string;
    r.roof_type = row.roof_type as string;
    r.total_squares = row.total_squares == null ? null : Number(row.total_squares);
    r.manufacturer = (row.manufacturer as string | null) ?? null;
    r.warranty_years = (row.warranty_years as number | null) ?? null;
    r.status = row.status as string;
  },
};

const framingInspections: TableDef<FramingInspection> = {
  table: 'framing_inspections',
  tier: 1,
  push: () => ({}),
  applyPull: (r, row) => {
    r.project_id = row.project_id as string;
    r.section = row.section as string;
    r.inspection_date = row.inspection_date ? String(row.inspection_date).slice(0, 10) : null;
    r.status = row.status as string;
    r.inspector_name = (row.inspector_name as string | null) ?? null;
  },
};

const electricalPanels: TableDef<ElectricalPanel> = {
  table: 'electrical_panels',
  tier: 1,
  push: () => ({}),
  applyPull: (r, row) => {
    r.project_id = row.project_id as string;
    r.name = row.name as string;
    r.amperage = (row.amperage as number | null) ?? null;
    r.voltage = (row.voltage as number | null) ?? null;
    r.location = (row.location as string | null) ?? null;
  },
};

const plumbingSystems: TableDef<PlumbingSystem> = {
  table: 'plumbing_systems',
  tier: 1,
  push: () => ({}),
  applyPull: (r, row) => {
    r.project_id = row.project_id as string;
    r.name = row.name as string;
    r.system_type = (row.system_type as string | null) ?? null;
  },
};

const PULL_ONLY_TABLES: TableDef<any>[] = [projects, safetyCerts, companyAssets, permits, concretePours, roofingSystems, framingInspections, electricalPanels, plumbingSystems];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PULL_TABLES: TableDef<any>[] = [...PULL_ONLY_TABLES, ...PUSH_TABLES];

// Rows the server refused as `forbidden` (e.g. the row belongs to another user).
// Retrying can never succeed, so they're skipped for the rest of the session
// instead of being re-pushed every sweep. Cleared on app restart.
const refused = new Set<string>();

// ─── Batch push ───────────────────────────────────────────────────────────────

/**
 * Push every pending local change across all offline tables in ONE request.
 *
 * Returns true when at least one Tier-1 row was re-versioned from a conflict, so
 * the caller can immediately retry it at the server's version (last-write-wins).
 */
export async function pushAll(): Promise<boolean> {
  const byTable: Record<string, PendingRow[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records = new Map<string, any>();

  for (const def of PUSH_TABLES) {
    const pending = await database.collections
      .get<AnyRecord>(def.table)
      .query(Q.where('sync_status', 'pending'))
      .fetch();

    const rows: PendingRow[] = [];
    for (const rec of pending) {
      if (refused.has(rec.id)) continue;
      // Mint the server id up front so creates are idempotent across retries.
      if (!rec.server_id) {
        const minted = uuidv4();
        await database.write(async () => { await rec.update((r) => { r.server_id = minted; }); });
      }
      records.set(`${def.table}:${rec.id}`, rec);
      rows.push({
        local_id: rec.id,
        server_id: rec.server_id,
        version: rec.version,
        never_synced: !rec.synced_at,
        is_deleted: rec.is_deleted,
        fields: def.push(rec),
      });
    }
    if (rows.length > 0) byTable[def.table] = rows;
  }

  const { payload, index, count } = buildPushPayload(byTable);
  if (count === 0) return false;

  let conflicts: PushConflict[];
  try {
    const res = await mobileApi<{ conflicts: PushConflict[] }>('/sync/push', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    conflicts = res.conflicts ?? [];
  } catch {
    // Offline or server error — everything stays pending, retried next sweep.
    return false;
  }

  const byKey = indexConflicts(conflicts);
  let retryTier1 = false;
  const now = new Date().toISOString();

  for (const [key, entry] of index) {
    const rec = records.get(`${entry.table}:${entry.local_id}`);
    if (!rec) continue;
    const def = PUSH_TABLES.find((d) => d.table === entry.table)!;
    const conflict = byKey.get(key);

    if (!conflict) {
      // Applied. Mirror the server's version bump so the next push isn't stale.
      await database.write(async () => {
        await rec.update((r: AnyRecord) => {
          r.version = nextLocalVersion(entry.outcome, rec.version);
          r.sync_status = 'synced';
          r.synced_at = now;
        });
      });
      continue;
    }

    if (conflict.conflict_type === 'forbidden') {
      // The server rejected the write on ownership grounds — no server_record is
      // returned (by design, no leak), so there is nothing to resolve against.
      // Park it: keep the local data, stop hammering the server.
      refused.add(rec.id);
      continue;
    }

    const server = conflict.server_record;
    if (!server) continue; // shouldn't happen — leave pending

    if (def.tier === 1) {
      // T-13 Tier 1 (append-only): local wins. Adopt the server's version so the
      // immediate retry below re-applies the local values on top.
      await database.write(async () => {
        await rec.update((r: AnyRecord) => { r.version = server.version as number; });
      });
      retryTier1 = true;
      continue;
    }

    // Tier 2/3: stash the server row and flag for the resolve screen. Held in the
    // queue — never blocks the other records (T-14).
    await saveConflictFor(def.table, rec.id, server as unknown as ServerSnapshot);
    await database.write(async () => {
      await rec.update((r: AnyRecord) => { r.sync_status = 'conflict'; });
    });
  }

  return retryTier1;
}

// ─── Batch pull ───────────────────────────────────────────────────────────────

const SINCE_KEY = 'sync:lastPulledAt:v2';

interface PullDelta {
  created: Record<string, unknown>[];
  updated: Record<string, unknown>[];
  deleted: string[];
}

/**
 * Incremental delta pull for EVERY offline table in one request, matched by
 * `server_id`. T-12: never clobber a `pending`/`conflict` local row — those hold
 * unsynced edits that the push sweep reconciles (a server-side change there
 * surfaces as a conflict, not a silent overwrite).
 */
export async function pullAll(): Promise<void> {
  let res: { changes: Record<string, PullDelta>; timestamp: string };
  try {
    const since = await AsyncStorage.getItem(SINCE_KEY);
    const qs = since ? `?since=${encodeURIComponent(since)}` : '';
    res = await mobileApi(`/sync/pull${qs}`, { method: 'GET' });
  } catch {
    // Offline — keep the old cursor, retry next sweep.
    return;
  }

  let applied = true;

  for (const def of PULL_TABLES) {
    const delta = res.changes?.[def.table];
    if (!delta) continue;
    const collection = database.collections.get<AnyRecord>(def.table);

    try {
      await database.write(async () => {
        for (const row of [...delta.created, ...delta.updated]) {
          const serverId = row.id as string;
          const existing = await collection.query(Q.where('server_id', serverId)).fetch();

          if (existing.length > 0) {
            const local = existing[0];
            if (local.sync_status === 'pending' || local.sync_status === 'conflict') continue;
            if ((row.version as number) < local.version) continue;
            await local.update((r) => {
              def.applyPull(r, row);
              r.version = row.version as number;
              r.sync_status = 'synced';
              r.synced_at = new Date().toISOString();
            });
          } else {
            await collection.create((r) => {
              r.server_id = serverId;
              def.applyPull(r, row);
              r.version = row.version as number;
              r.sync_status = 'synced';
              r.synced_at = new Date().toISOString();
              r.is_deleted = false;
            });
          }
        }

        for (const serverId of delta.deleted) {
          const existing = await collection.query(Q.where('server_id', serverId)).fetch();
          for (const local of existing) {
            if (local.sync_status === 'pending' || local.sync_status === 'conflict') continue;
            await local.update((r) => { r.is_deleted = true; r.sync_status = 'synced'; });
          }
        }
      });
    } catch (err) {
      // One bad table must not kill the sweep — and must not advance the cursor,
      // or its delta would be skipped forever.
      applied = false;
      console.warn(`[sync] pull apply failed for ${def.table}`, err);
    }
  }

  // Advance the cursor only after every table applied cleanly.
  if (applied) await AsyncStorage.setItem(SINCE_KEY, res.timestamp);
}

