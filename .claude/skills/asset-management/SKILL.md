# Asset Management Skill
**Feature added: Session 29 (2026-03-29)**
**See full spec: @docs/Asset_Management_v1_0.md**
**Locked decisions: T-56, T-57, T-58**

## What this feature does

Full Enterprise Asset Management (EAM) for vehicles, heavy equipment, and tools.
Tracks service records, warranties, insurance, registrations, fuel, depreciation,
pre-use inspections, damage incidents, recalls, and calibration records.

## Key invariants

1. All 25 asset tables are **tenant-scoped with RLS** (standard pattern)
2. All background jobs carry `tenant_id` in envelope (T-10) and use `withTenantContext()` (T-42)
3. **Operator cert blocking (T-57):** If `company_assets.requires_operator_cert = true`, validate `safety_certifications` before inserting `asset_operator_assignments` or `asset_checkouts`. Throw 403 if cert missing or expired.
4. **Chain of custody (T-58):** Every project assignment and operator change is written to `audit_log` (category: `operational`). Never mutable.
5. **OOS auto-sync:** When `asset_inspections.result = 'fail'`, route handler sets `company_assets.status = 'out_of_service'` in the same transaction.
6. **Depreciation entries are append-only** — never UPDATE or DELETE.
7. **Meter readings are append-only** — append to `asset_meter_readings`, update snapshot on `company_assets.current_meter_reading`.
8. **Tier gate (T-56):** ALL asset endpoints gate at Business+. Use `assertTier('BUSINESS')` in service layer. Returns 402 for Starter and Professional.
9. **Safety-critical recalls:** `severity = 'safety_critical'` triggers immediate push notification to Owner, PM, and assigned operator. Cannot be disabled by notification preferences.
10. **Multiple project assignments allowed** — one asset can be on multiple projects simultaneously.
11. **Route SQL must match migration 0010** (fix 2026-06-26, `2498787`): `asset-fuel.ts`/`asset-inspections.ts` had non-existent column names → 500s. Real cols: fuel `log_date/gallons/cost_per_gallon_cents/station_name` (`fuel_type` incl `natural_gas`; `total_cost_cents` NOT NULL); inspection `inspected_at/inspected_by/inspection_type(NOT NULL)/result∈pass|fail|conditional/out_of_service`; template `name/inspection_frequency` (no `description`/`version`); in-service status `active` (no `available`). GET keys `{fuel_logs}`/`{inspections}`/`{templates}`. Diff against `prisma/migrations/0010_asset_management/migration.sql` before extending.

## Mobile offline — the yard flow (2026-07-27, Enterprise Plan §B1)

Mobile has **no asset LIST screen**: the only entry point is the **QR scan** in
`screens/assets/Checkout.tsx`. That scan used to require the API to turn a scanned `asset_number`
into an asset — so although fuel logs / asset inspections / damage reports had queued offline for a
while, they were **unreachable in the yard**, which is exactly where there's no signal.

- **`company_assets` is now an offline READ cache.** It's the first `readOnly: true` entry in the
  server's `SYNC_TABLES` (`api/src/routes/v1/sync.ts`) — pulled, never pushed — and a `PULL_ONLY`
  entry in the mobile `lib/sync.ts` registry (schema **v4** + a `createTable` migration step +
  `models/CompanyAsset.ts`). `Checkout.tsx` `findCachedAsset(assetNumber)` resolves the scan from the
  local cache when the API call fails.
- **Works offline:** fuel log, asset inspection, damage report — the capture queues were already
  there; the asset cache is what made them reachable.
- **Does NOT work offline (by design): checkout / check-in.** Both buttons are disabled with a
  warning notice (`common.assets.offline_checkout_blocked`, EN+ES) when the asset came from cache.
  **T-57 operator-cert enforcement is server-side** and cannot be replicated on the device — letting
  a worker believe they checked out a machine they aren't certified for is worse than asking them to
  reconnect. The cached row carries `requires_operator_cert` + `required_cert_type` so the UI can
  warn *before* an attempt, but that's a hint, never the gate.
- **T-56 is a feature gate, not a data gate** — a Starter/Pro tenant simply has no `company_assets`
  rows to pull, so no special-casing is needed on the sync path.

## Table quick reference (25 tables)

| Table | Purpose |
|-------|---------|
| `company_assets` | Master registry |
| `asset_groups` | Fleet groupings |
| `asset_meter_readings` | Full odometer/hours history (append-only) |
| `asset_project_assignments` | Asset ↔ project (many-to-many) |
| `asset_operator_assignments` | Primary operator (cert-checked) |
| `asset_checkouts` | Tool check-in/check-out (cert-checked) |
| `asset_reservations` | Future project booking |
| `asset_rental_details` | Rental/lease terms |
| `asset_service_records` | Service history |
| `asset_maintenance_schedules` | Recurring maintenance plans |
| `asset_inspection_templates` | OSHA/DOT checklist templates |
| `asset_inspections` | Completed inspection records |
| `asset_warranties` | Warranty coverage |
| `asset_warranty_claims` | Claims against warranties |
| `asset_insurance_policies` | Fleet or per-asset policies |
| `asset_insurance_policy_assets` | Policy ↔ asset many-to-many |
| `asset_insurance_claims` | Insurance claims |
| `asset_registrations` | State reg, DOT, IFTA, oversize |
| `asset_fuel_logs` | Fuel fill-up records |
| `asset_depreciation_schedules` | Method + parameters |
| `asset_depreciation_entries` | Monthly entries (append-only) |
| `asset_damage_incidents` | Damage workflow |
| `asset_documents` | Titles, manuals, certs, etc. |
| `asset_recalls` | NHTSA/manufacturer recalls |
| `asset_calibration_records` | Measuring equipment calibration |

## Background jobs

| Job type | Trigger | Action |
|----------|---------|--------|
| `asset.daily_expiry_check` | Daily cron 06:00 | Fire notifications for expiring items (60/30/14/7 days) |
| `asset.monthly_depreciation` | 1st of month | Create depreciation entries; update book values |
| `asset.sync_depreciation_to_qb` | After depreciation run | Push journal entries to QuickBooks |
| `asset.overdue_checkout_alert` | Daily cron 07:00 | Alert on tools not returned by expected_return_at |

## API quick reference

```
GET    /v1/assets                    — list (filter: category, status, project_id)
POST   /v1/assets                    — create
GET    /v1/assets/dashboard          — expiry alerts, OOS count, checked-out summary
GET    /v1/assets/expiring           — ?days=30|60|90
GET    /v1/assets/maintenance-due    — overdue + upcoming 14 days
GET    /v1/assets/:id                — detail
PATCH  /v1/assets/:id                — update
POST   /v1/assets/:id/meter-reading  — log meter reading

POST   /v1/assets/:id/assignments         — assign to project (cert checked)
POST   /v1/assets/:id/checkout            — check out tool (cert checked)
POST   /v1/assets/:id/checkin             — check in tool

GET/POST    /v1/assets/:id/service-records
GET/POST    /v1/assets/:id/maintenance-schedules
GET/POST    /v1/assets/:id/inspections
POST        /v1/assets/:id/inspections/:iid/return-to-service

GET/POST    /v1/assets/:id/warranties
GET/POST    /v1/assets/:id/warranties/:wid/claims

GET/POST    /v1/asset-insurance-policies
GET/POST    /v1/asset-insurance-policies/:pid/claims
GET/POST    /v1/asset-insurance-policies/:pid/assets

GET/POST    /v1/assets/:id/registrations
GET/POST    /v1/assets/:id/fuel-logs
GET/POST    /v1/assets/:id/depreciation
GET/POST    /v1/assets/:id/damage-incidents
GET/POST    /v1/assets/:id/documents
GET/POST    /v1/assets/:id/recalls
GET/POST    /v1/assets/:id/calibration-records
```

## Operator cert check pattern

```typescript
// In service layer — fires before any assignment or checkout insert
async function assertOperatorCertified(
  tenantId: string,
  assetId: string,
  userId: string,
  client: PoolClient
): Promise<void> {
  const asset = await getAsset(tenantId, assetId, client);
  if (!asset.requires_operator_cert) return;

  const certs = await client.query(
    `SELECT cert_type, expires_at FROM safety_certifications
     WHERE tenant_id = $1 AND user_id = $2
       AND cert_type = $3 AND deleted_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())`,
    [tenantId, userId, asset.required_cert_type]
  );
  if (certs.rows.length === 0) {
    throw new Error(`OPERATOR_CERT_REQUIRED:${asset.required_cert_type}`);
  }
}
```

## Depreciation method cheat sheet

| Method key | When to use |
|------------|-------------|
| `straight_line` | Most assets — simple equal annual charge |
| `declining_balance` | Vehicles/tech that lose value faster early |
| `sum_of_years` | Accelerated; softer than DB |
| `units_of_production` | Equipment where wear tracks to usage (hours/miles) |

## File locations

```
docs/Asset_Management_v1_0.md          — full spec
prisma/migrations/0010_asset_management — DB schema
api/src/routes/v1/assets.ts            — core CRUD
api/src/routes/v1/asset-*.ts           — domain route files
api/src/workers/asset-worker.ts        — background jobs
web/src/app/(dashboard)/assets/        — web UI
mobile/src/screens/assets/             — mobile screens
```
