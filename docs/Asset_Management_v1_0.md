# Company Asset Management — Feature Specification v1.0
**"The Operating System for Construction" — Fleet, Equipment & Tool Management**

> **Tier gate:** Business+ only (T-56). All asset endpoints return 402 for Starter and Professional.
> **Locked decisions:** T-56 (tier gate), T-57 (operator cert blocking), T-58 (chain of custody log)

---

## Overview

Company Asset Management is a full Enterprise Asset Management (EAM) system for construction
companies. It tracks every vehicle, machine, and tool the company owns, rents, or leases —
along with all service records, warranties, insurance policies, inspections, registrations,
fuel consumption, and depreciation schedules.

**Core principle:** Every asset is a cost center. The system connects asset operating costs
directly to project budget line items for accurate job costing.

---

## Asset Categories

| Category Key | Examples |
|---|---|
| `vehicle` | Pickup trucks, vans, dump trucks, semi trucks, company cars |
| `heavy_equipment` | Excavators, bulldozers, cranes, backhoes, skid steers, compactors |
| `trailer` | Flatbed, enclosed, dump, equipment, utility trailers |
| `attachment` | Buckets, blades, augers, grapples (attached to heavy equipment) |
| `power_tool` | Generators, compressors, welders, concrete saws, jack hammers |
| `hand_tool` | Drills, grinders, levels, measuring equipment, hand tools |
| `safety_equipment` | Harnesses, fall protection systems, gas detectors, PPE inventory |
| `technology` | Tablets, laptops, radios, survey equipment, GPS units |
| `other` | Anything that doesn't fit above |

---

## Status Lifecycle

```
active ──────────────────────────────────────────────────────→ decommissioned
  │                                                                   │
  ├──→ in_repair ──→ active                                          sold
  │
  ├──→ out_of_service (failed inspection, pending decision)
  │         └──→ in_repair ──→ active
  │
  ├──→ stolen / lost  (triggers insurance claim workflow)
  │
  └──→ reserved  (booked for future project, not yet deployed)
```

---

## Data Model

### `company_assets` — Master registry

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_number | TEXT NOT NULL | Auto-gen AST-0001 or manual |
| name | TEXT NOT NULL | Display name |
| asset_category | TEXT NOT NULL | CHECK (vehicle\|heavy_equipment\|trailer\|attachment\|power_tool\|hand_tool\|safety_equipment\|technology\|other) |
| asset_type | TEXT | Specific type: pickup_truck, excavator, forklift, drill, etc. |
| make | TEXT | Manufacturer name |
| model | TEXT | Model name/number |
| year | INTEGER | Model year |
| serial_number | TEXT | Universal serial number |
| vin | TEXT | Vehicle Identification Number (vehicles only) |
| color | TEXT | |
| ownership_type | TEXT NOT NULL | CHECK (owned\|rented\|leased\|borrowed) |
| status | TEXT NOT NULL DEFAULT 'active' | CHECK (active\|in_repair\|out_of_service\|decommissioned\|sold\|stolen\|lost\|reserved) |
| condition | TEXT | CHECK (excellent\|good\|fair\|poor) |
| purchase_date | DATE | |
| purchase_price_cents | INTEGER | Never float (T-02) |
| purchase_vendor_id | UUID FK vendors(id) NULLABLE | Dealer/auction |
| current_value_cents | INTEGER | Updated by depreciation job |
| disposal_date | DATE | When sold, scrapped, or written off |
| disposal_price_cents | INTEGER | Sale/scrap value |
| disposal_notes | TEXT | |
| home_location | TEXT | Yard address, warehouse, storage lot |
| meter_type | TEXT NOT NULL DEFAULT 'none' | CHECK (odometer\|hours\|none) |
| current_meter_reading | NUMERIC(12,1) | Snapshot; full history in asset_meter_readings |
| requires_operator_cert | BOOLEAN NOT NULL DEFAULT FALSE | If true, block unqualified assignment (T-57) |
| required_cert_type | TEXT | CDL_A\|CDL_B\|forklift\|crane_operator\|aerial_lift\|powered_industrial_truck\|excavator\|other |
| dot_regulated | BOOLEAN NOT NULL DEFAULT FALSE | Subject to FMCSA/DOT regulations |
| dot_unit_number | TEXT | DOT unit number for commercial vehicles |
| osha_inspection_required | BOOLEAN NOT NULL DEFAULT FALSE | Requires periodic OSHA inspection |
| osha_inspection_frequency_days | INTEGER | 365 for annual, 90 for quarterly, etc. |
| group_id | UUID FK asset_groups(id) NULLABLE | Fleet grouping |
| photo_path | TEXT | Primary photo (live storage path) |
| custom_fields | JSONB | Contractor-defined metadata |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

Indexes: `(tenant_id)`, `(tenant_id, deleted_at)`, `(tenant_id, asset_category)`,
`(tenant_id, status)`, `(tenant_id, group_id)`, `(tenant_id, updated_at)`

---

### `asset_groups` — Fleet groupings

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| name | TEXT NOT NULL | e.g. "Dump Trucks", "Welding Equipment" |
| description | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_meter_readings` — Full odometer/hours history

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| reading_date | DATE NOT NULL | |
| reading_value | NUMERIC(12,1) NOT NULL | Miles or hours |
| source | TEXT NOT NULL | CHECK (manual\|service\|inspection\|telematics\|fuel_log) |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

Indexes: `(tenant_id, asset_id)`, `(tenant_id, asset_id, reading_date)`

**No updated_at, no deleted_at** — append-only meter log.

---

### `asset_project_assignments` — Asset ↔ Project (chain of custody)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| project_id | UUID NOT NULL FK projects(id) | |
| assigned_by | UUID FK users(id) | |
| assigned_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |
| expected_return_date | DATE | |
| returned_at | TIMESTAMPTZ | NULL = still assigned |
| return_condition | TEXT | CHECK (good\|fair\|damaged\|needs_repair) |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Chain of custody:** All assignment events written to audit_log (T-58). Never deleted.
Multiple simultaneous project assignments are allowed per T-answer (shared equipment).

Indexes: `(tenant_id, asset_id)`, `(tenant_id, project_id)`, `(tenant_id, asset_id, returned_at)`

---

### `asset_operator_assignments` — Primary operator assignment

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| user_id | UUID NOT NULL FK users(id) | |
| assigned_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |
| released_at | TIMESTAMPTZ | NULL = currently assigned |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Certification check (T-57):** If `company_assets.requires_operator_cert = true`, service
layer validates `safety_certifications` before inserting this row. Throws 403 if no active cert.

---

### `asset_checkouts` — Tool check-in / check-out

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| checked_out_by | UUID NOT NULL FK users(id) | |
| checked_out_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |
| expected_return_at | TIMESTAMPTZ | |
| project_id | UUID FK projects(id) NULLABLE | |
| condition_out | TEXT NOT NULL | CHECK (good\|fair\|damaged\|needs_repair) |
| notes_out | TEXT | |
| checked_in_at | TIMESTAMPTZ | NULL = still checked out |
| checked_in_by | UUID FK users(id) | |
| condition_in | TEXT | CHECK (good\|fair\|damaged\|needs_repair) |
| notes_in | TEXT | |
| qr_scan_out | BOOLEAN NOT NULL DEFAULT FALSE | Was this a QR-code checkout? |
| qr_scan_in | BOOLEAN NOT NULL DEFAULT FALSE | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

Indexes: `(tenant_id, asset_id)`, `(tenant_id, checked_out_by)`,
`(tenant_id, checked_in_at) WHERE checked_in_at IS NULL` (for "currently checked out" queries)

---

### `asset_reservations` — Future booking

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| project_id | UUID FK projects(id) NULLABLE | |
| reserved_by | UUID NOT NULL FK users(id) | |
| reserved_for_user_id | UUID FK users(id) NULLABLE | Who will use it |
| start_date | DATE NOT NULL | |
| end_date | DATE NOT NULL | |
| status | TEXT NOT NULL DEFAULT 'pending' | CHECK (pending\|confirmed\|cancelled\|completed) |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_rental_details` — Rental/lease terms

One row per rented or leased asset (where `company_assets.ownership_type IN ('rented','leased')`).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) UNIQUE | |
| rental_vendor_id | UUID FK vendors(id) NULLABLE | Rental company |
| agreement_number | TEXT | Contract/PO number |
| rental_start_date | DATE | |
| rental_end_date | DATE | **Alert fires 14 and 7 days before** |
| daily_rate_cents | INTEGER | Never float (T-02) |
| weekly_rate_cents | INTEGER | |
| monthly_rate_cents | INTEGER | |
| deposit_cents | INTEGER | |
| lessor_requires_coi | BOOLEAN NOT NULL DEFAULT FALSE | Lessor requires COI proof |
| insurance_policy_id | UUID FK asset_insurance_policies(id) NULLABLE | Policy covering this rental |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_service_records` — Full service history

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| service_type | TEXT NOT NULL | CHECK (oil_change\|tire_rotation\|brake_service\|filter_replacement\|pm_scheduled\|pm_unscheduled\|repair\|recall\|inspection\|warranty_repair\|calibration\|other) |
| service_date | DATE NOT NULL | |
| meter_reading_at_service | NUMERIC(12,1) | Odometer or hours at time of service |
| description | TEXT NOT NULL | What was done |
| vendor_id | UUID FK vendors(id) NULLABLE | Service provider |
| technician_name | TEXT | |
| labor_cost_cents | INTEGER NOT NULL DEFAULT 0 | |
| parts_cost_cents | INTEGER NOT NULL DEFAULT 0 | |
| total_cost_cents | INTEGER NOT NULL DEFAULT 0 | Sum of labor + parts |
| invoice_number | TEXT | Shop invoice reference |
| project_id | UUID FK projects(id) NULLABLE | Allocate cost to project |
| next_service_due_date | DATE | |
| next_service_due_meter | NUMERIC(12,1) | |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_maintenance_schedules` — Recurring maintenance plans

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| schedule_name | TEXT NOT NULL | e.g. "Oil Change Every 5,000 Miles" |
| service_type | TEXT NOT NULL | Same CHECK as service_records |
| interval_type | TEXT NOT NULL | CHECK (calendar_days\|meter_units) |
| interval_value | NUMERIC NOT NULL | 90 days OR 5000 miles/hours |
| last_performed_date | DATE | |
| last_performed_meter | NUMERIC(12,1) | |
| next_due_date | DATE | Recalculated after each service record |
| next_due_meter | NUMERIC(12,1) | |
| alert_days_before | INTEGER NOT NULL DEFAULT 14 | Alert X days before due date |
| alert_meter_before | NUMERIC | Alert when X units before due meter |
| is_active | BOOLEAN NOT NULL DEFAULT TRUE | |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_inspection_templates` — Checklist templates (OSHA/DOT)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| name | TEXT NOT NULL | e.g. "Forklift Daily Pre-Use Inspection" |
| asset_category | TEXT | Which category this applies to |
| asset_type | TEXT | More specific: forklift, aerial_lift, crane, etc. |
| inspection_frequency | TEXT NOT NULL | CHECK (pre_use\|daily\|weekly\|monthly\|annual) |
| is_osha_required | BOOLEAN NOT NULL DEFAULT FALSE | |
| is_dot_required | BOOLEAN NOT NULL DEFAULT FALSE | |
| checklist_items | JSONB NOT NULL | Array of: `{ id, description, response_type: 'ok_defect_na'\|'text'\|'numeric', required: bool }` |
| is_active | BOOLEAN NOT NULL DEFAULT TRUE | |
| is_system_template | BOOLEAN NOT NULL DEFAULT FALSE | Platform-provided vs tenant-created |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

**System templates** (platform-provided, read-only): Forklift Pre-Use, Aerial Lift Pre-Use,
CDL Vehicle Pre-Trip, Crane Daily, Scaffold Weekly, Rigging/Chain Annual.

---

### `asset_inspections` — Completed inspection records

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| template_id | UUID FK asset_inspection_templates(id) NULLABLE | |
| inspection_type | TEXT NOT NULL | CHECK (pre_use\|daily\|weekly\|monthly\|annual\|osha\|dot\|return\|calibration) |
| inspected_at | TIMESTAMPTZ NOT NULL | |
| inspected_by | UUID NOT NULL FK users(id) | |
| meter_reading | NUMERIC(12,1) | |
| result | TEXT NOT NULL | CHECK (pass\|fail\|conditional) |
| checklist_responses | JSONB | Array of `{ item_id, response: 'ok'\|'defect'\|'na', note }` |
| defects_noted | JSONB | Array of `{ description, severity: 'minor'\|'major', photo_path }` |
| out_of_service | BOOLEAN NOT NULL DEFAULT FALSE | TRUE = asset status set to out_of_service |
| out_of_service_at | TIMESTAMPTZ | When OOS was declared |
| returned_to_service_at | TIMESTAMPTZ | When cleared |
| returned_to_service_by | UUID FK users(id) | |
| signature_at | TIMESTAMPTZ | Inspector signed-off timestamp |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

**OSHA note:** When `out_of_service = TRUE`, route handler automatically sets
`company_assets.status = 'out_of_service'` in the same transaction.

---

### `asset_warranties` — Warranty coverage

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| warranty_type | TEXT NOT NULL | CHECK (manufacturer\|extended\|drivetrain\|component\|structural) |
| provider_name | TEXT NOT NULL | Manufacturer or 3rd-party warranty company |
| provider_contact | TEXT | Phone/email |
| policy_number | TEXT | |
| coverage_description | TEXT | What's covered |
| start_date | DATE NOT NULL | |
| expiry_date | DATE NOT NULL | **Alert fires 60 and 30 days before** |
| mileage_limit | INTEGER | e.g. 36000 — NULL if no mileage limit |
| hours_limit | INTEGER | e.g. 2000 hours — NULL if no hours limit |
| is_transferable | BOOLEAN NOT NULL DEFAULT FALSE | |
| document_path | TEXT | Warranty certificate (live storage) |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_warranty_claims` — Claims against warranties

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| warranty_id | UUID NOT NULL FK asset_warranties(id) | |
| asset_id | UUID NOT NULL FK company_assets(id) | Denormalized for query convenience |
| claim_date | DATE NOT NULL | |
| description | TEXT NOT NULL | |
| claim_amount_cents | INTEGER NOT NULL DEFAULT 0 | |
| approved_amount_cents | INTEGER | |
| status | TEXT NOT NULL DEFAULT 'submitted' | CHECK (submitted\|approved\|denied\|paid\|closed) |
| resolution_notes | TEXT | |
| document_path | TEXT | Claim documentation |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_insurance_policies` — Insurance policies (fleet-wide or per-asset)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| policy_type | TEXT NOT NULL | CHECK (fleet\|individual\|equipment_floater\|inland_marine\|umbrella\|liability) |
| policy_name | TEXT NOT NULL | e.g. "2026 Fleet Auto Policy" |
| is_fleet_policy | BOOLEAN NOT NULL DEFAULT FALSE | If true, covers all assets unless exclusions set |
| carrier_name | TEXT NOT NULL | Insurance company |
| carrier_contact | TEXT | |
| broker_name | TEXT | |
| broker_contact | TEXT | |
| policy_number | TEXT NOT NULL | |
| coverage_description | TEXT | |
| coverage_limit_cents | INTEGER | Per-occurrence limit |
| deductible_cents | INTEGER | |
| annual_premium_cents | INTEGER | |
| effective_date | DATE NOT NULL | |
| expiry_date | DATE NOT NULL | **Alert fires 60 and 30 days before** |
| auto_renew | BOOLEAN NOT NULL DEFAULT FALSE | |
| document_path | TEXT | COI storage (live storage path) |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_insurance_policy_assets` — Policy ↔ specific assets (individual policies)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| policy_id | UUID NOT NULL FK asset_insurance_policies(id) | |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| added_date | DATE | |
| removed_date | DATE | NULL = currently covered |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |

Unique: `(tenant_id, policy_id, asset_id)` where `removed_date IS NULL`

---

### `asset_insurance_claims` — Insurance claims

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| policy_id | UUID NOT NULL FK asset_insurance_policies(id) | |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| damage_incident_id | UUID FK asset_damage_incidents(id) NULLABLE | Links back to damage report |
| incident_date | DATE NOT NULL | |
| claim_number | TEXT | Assigned by insurer |
| description | TEXT NOT NULL | |
| claim_amount_cents | INTEGER NOT NULL DEFAULT 0 | |
| approved_amount_cents | INTEGER | |
| deductible_applied_cents | INTEGER | |
| status | TEXT NOT NULL DEFAULT 'reported' | CHECK (reported\|under_review\|approved\|denied\|paid\|closed) |
| adjuster_name | TEXT | |
| adjuster_contact | TEXT | |
| resolution_notes | TEXT | |
| document_path | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_registrations` — Vehicle & equipment registrations/compliance

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| registration_type | TEXT NOT NULL | CHECK (state_vehicle\|dot\|ifta\|irp\|oversize_permit\|equipment_cert) |
| state_code | CHAR(2) | For state_vehicle registrations |
| registration_number | TEXT | License plate or cert number |
| license_plate | TEXT | For vehicles |
| expiry_date | DATE | **Alert fires 60, 30, and 7 days before** |
| renewal_cost_cents | INTEGER | Last known renewal cost |
| document_path | TEXT | Registration certificate |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_fuel_logs` — Fuel fill-up records

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| log_date | DATE NOT NULL | |
| fuel_type | TEXT NOT NULL | CHECK (gasoline\|diesel\|propane\|electric\|natural_gas\|other) |
| gallons | NUMERIC(8,3) | Gallons (or kWh for electric) |
| cost_per_gallon_cents | INTEGER | |
| total_cost_cents | INTEGER NOT NULL | |
| odometer_reading | NUMERIC(12,1) | At time of fill-up |
| hours_reading | NUMERIC(12,1) | For equipment with hours meter |
| is_full_fill | BOOLEAN NOT NULL DEFAULT TRUE | FALSE = partial fill (exclude from MPG calc) |
| state_code | CHAR(2) | For IFTA multi-state fuel tax tracking |
| fuel_card_number | TEXT | Last 4 of fuel card |
| station_name | TEXT | |
| project_id | UUID FK projects(id) NULLABLE | Allocate cost to project |
| budget_line_item_id | UUID FK budget_line_items(id) NULLABLE | Direct cost allocation |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

Indexes: `(tenant_id, asset_id)`, `(tenant_id, asset_id, log_date)`, `(tenant_id, project_id) WHERE project_id IS NOT NULL`

---

### `asset_depreciation_schedules` — Depreciation configuration

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) UNIQUE | One schedule per asset |
| method | TEXT NOT NULL | CHECK (straight_line\|declining_balance\|sum_of_years\|units_of_production) |
| useful_life_years | INTEGER NOT NULL | e.g. 5 |
| expected_total_units | NUMERIC | For units_of_production only (total miles/hours expected) |
| salvage_value_cents | INTEGER NOT NULL DEFAULT 0 | Estimated residual value |
| depreciation_start_date | DATE NOT NULL | Usually purchase date |
| annual_depreciation_cents | INTEGER | Calculated and stored for SL method |
| current_book_value_cents | INTEGER | Updated monthly by job |
| is_active | BOOLEAN NOT NULL DEFAULT TRUE | |
| quickbooks_asset_account_id | TEXT | QB fixed asset account for sync |
| quickbooks_depreciation_account_id | TEXT | QB accumulated depreciation account |
| quickbooks_expense_account_id | TEXT | QB depreciation expense account |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_depreciation_entries` — Monthly/annual depreciation records

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| schedule_id | UUID NOT NULL FK asset_depreciation_schedules(id) | |
| asset_id | UUID NOT NULL FK company_assets(id) | Denormalized |
| period_start | DATE NOT NULL | First day of period |
| period_end | DATE NOT NULL | Last day of period |
| units_in_period | NUMERIC | For units_of_production method |
| depreciation_amount_cents | INTEGER NOT NULL | |
| book_value_after_cents | INTEGER NOT NULL | |
| quickbooks_journal_entry_id | TEXT | Set after QB sync |
| created_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |

**Append-only** — no UPDATE or DELETE.
Indexes: `(tenant_id, asset_id)`, `(tenant_id, schedule_id, period_start)`

---

### `asset_damage_incidents` — Damage reporting workflow

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| incident_date | TIMESTAMPTZ NOT NULL | |
| reported_by | UUID NOT NULL FK users(id) | |
| description | TEXT NOT NULL | |
| damage_type | TEXT NOT NULL | CHECK (collision\|vandalism\|weather\|operational\|theft\|fire\|flood\|other) |
| severity | TEXT NOT NULL | CHECK (minor\|moderate\|major\|total_loss) |
| estimated_repair_cents | INTEGER | |
| actual_repair_cents | INTEGER | Set when resolved |
| out_of_service | BOOLEAN NOT NULL DEFAULT FALSE | |
| out_of_service_start | TIMESTAMPTZ | |
| out_of_service_end | TIMESTAMPTZ | |
| repair_authorized_by | UUID FK users(id) | |
| repair_authorized_at | TIMESTAMPTZ | |
| insurance_claim_id | UUID FK asset_insurance_claims(id) NULLABLE | |
| status | TEXT NOT NULL DEFAULT 'reported' | CHECK (reported\|under_review\|repair_authorized\|in_repair\|resolved\|written_off) |
| photo_paths | JSONB | Array of live storage paths |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_documents` — Document storage per asset

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| doc_type | TEXT NOT NULL | CHECK (title\|registration\|insurance\|warranty\|purchase_agreement\|lease\|rental_agreement\|operator_manual\|inspection_report\|recall_notice\|calibration_cert\|lien_release\|other) |
| title | TEXT NOT NULL | |
| storage_path | TEXT NOT NULL | Live storage path (never direct URL) |
| file_size_bytes | INTEGER | |
| expiry_date | DATE NULLABLE | For docs that expire (reg, insurance card) |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

### `asset_recalls` — Manufacturer/NHTSA recall notices

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| recall_number | TEXT | NHTSA or manufacturer recall ID |
| recall_date | DATE NOT NULL | |
| source | TEXT NOT NULL | CHECK (nhtsa\|manufacturer\|osha\|manual) |
| description | TEXT NOT NULL | What the recall is for |
| severity | TEXT NOT NULL | CHECK (safety_critical\|non_safety) |
| remedy_description | TEXT | What repair/remedy is required |
| status | TEXT NOT NULL DEFAULT 'open' | CHECK (open\|scheduled\|completed\|not_applicable) |
| scheduled_service_date | DATE | |
| completed_date | DATE | |
| service_record_id | UUID FK asset_service_records(id) NULLABLE | Linked to the service record that resolved it |
| document_path | TEXT | |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

**Safety-critical recalls trigger an immediate push notification to Owner + PM + operator.**

---

### `asset_calibration_records` — Measuring equipment calibration

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_id | UUID NOT NULL FK company_assets(id) | |
| calibration_date | DATE NOT NULL | |
| next_calibration_due | DATE NOT NULL | Alert fires 30 days before |
| performed_by | TEXT NOT NULL | Lab or technician name |
| certificate_number | TEXT | |
| result | TEXT NOT NULL | CHECK (pass\|fail\|adjusted) |
| document_path | TEXT | Calibration certificate |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

---

## API Endpoints

All require JWT auth, `/v1/` prefix, `User-Agent` header, and Business+ tier (T-56).

### Asset Registry

| Method | Path | Roles | Purpose |
|--------|------|-------|---------|
| GET | `/v1/assets` | OWNER, PM, FOREMAN | List assets (filter: category, status, project_id, group_id, overdue_maintenance, available) |
| POST | `/v1/assets` | OWNER, PM | Create asset |
| GET | `/v1/assets/dashboard` | OWNER, PM | Summary: total assets, expiry alerts, OOS count, checked-out tools |
| GET | `/v1/assets/expiring` | OWNER, PM | Items expiring in ?days=30\|60\|90 (reg, warranty, insurance, rental) |
| GET | `/v1/assets/maintenance-due` | OWNER, PM, FOREMAN | Overdue + upcoming within 14 days |
| GET | `/v1/assets/checked-out` | OWNER, PM, FOREMAN | All currently checked-out tools |
| GET | `/v1/assets/:id` | OWNER, PM, FOREMAN | Asset detail |
| PATCH | `/v1/assets/:id` | OWNER, PM | Update |
| DELETE | `/v1/assets/:id` | OWNER | Soft delete (requires status = decommissioned\|sold) |
| POST | `/v1/assets/:id/meter-reading` | OWNER, PM, FOREMAN, FIELD_TECH | Log meter reading |
| GET | `/v1/assets/:id/utilization` | OWNER, PM | Cost + hours/miles per project |

### Groups
| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/v1/asset-groups` | |
| PATCH/DELETE | `/v1/asset-groups/:gid` | |

### Assignments & Checkouts
| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/v1/assets/:id/assignments` | Cert check fires on POST |
| PATCH | `/v1/assets/:id/assignments/:aid` | Return or extend |
| GET/POST | `/v1/assets/:id/operator-assignments` | Primary operator |
| PATCH | `/v1/assets/:id/operator-assignments/:oid` | Release operator |
| POST | `/v1/assets/:id/checkout` | Check out tool |
| POST | `/v1/assets/:id/checkin` | Check in tool |
| GET/POST/PATCH/DELETE | `/v1/assets/:id/reservations` | Future booking |

### Service & Maintenance
| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/v1/assets/:id/service-records` | Creates meter_reading record on POST |
| PATCH/DELETE | `/v1/assets/:id/service-records/:sid` | |
| GET/POST | `/v1/assets/:id/maintenance-schedules` | |
| PATCH/DELETE | `/v1/assets/:id/maintenance-schedules/:mid` | |

### Inspections
| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/v1/assets/:id/inspections` | POST auto-sets OOS status if result=fail |
| GET | `/v1/assets/:id/inspections/:iid` | |
| POST | `/v1/assets/:id/inspections/:iid/return-to-service` | Clears OOS; requires OWNER or PM |
| GET/POST/PATCH/DELETE | `/v1/asset-inspection-templates` | System templates are read-only |

### Warranties
| Method | Path | Notes |
|--------|------|-------|
| GET/POST/PATCH/DELETE | `/v1/assets/:id/warranties` | |
| GET/POST/PATCH | `/v1/assets/:id/warranties/:wid/claims` | |

### Insurance
| Method | Path | Notes |
|--------|------|-------|
| GET/POST/PATCH/DELETE | `/v1/asset-insurance-policies` | Fleet-level |
| GET/POST | `/v1/asset-insurance-policies/:pid/assets` | Add asset to policy |
| DELETE | `/v1/asset-insurance-policies/:pid/assets/:aid` | Remove asset |
| GET/POST/PATCH | `/v1/asset-insurance-policies/:pid/claims` | |

### Registrations, Fuel, Depreciation, Damage, Documents, Recalls, Calibration
| Method | Path |
|--------|------|
| GET/POST/PATCH/DELETE | `/v1/assets/:id/registrations` |
| GET/POST/PATCH | `/v1/assets/:id/fuel-logs` |
| GET | `/v1/assets/fuel-summary` |
| GET/POST | `/v1/assets/:id/depreciation` |
| PATCH | `/v1/assets/:id/depreciation/:did` |
| GET/POST/PATCH/DELETE | `/v1/assets/:id/damage-incidents` |
| POST | `/v1/assets/:id/damage-incidents/:did/authorize-repair` |
| POST | `/v1/assets/:id/damage-incidents/:did/resolve` |
| GET/POST/DELETE | `/v1/assets/:id/documents` |
| GET/POST/PATCH | `/v1/assets/:id/recalls` |
| GET/POST/PATCH | `/v1/assets/:id/calibration-records` |

---

## Background Jobs

| Job Type | Trigger | Action |
|----------|---------|--------|
| `asset.daily_expiry_check` | Daily cron 06:00 | Scan all maintenance_schedules, registrations, warranties, insurance policies, rental return dates; fire notifications for items at 60/30/14/7 day thresholds |
| `asset.monthly_depreciation` | 1st of month, 02:00 | Create depreciation entries for all active schedules; update `current_value_cents`; enqueue `asset.sync_depreciation_to_qb` if QB connected |
| `asset.sync_depreciation_to_qb` | After depreciation run | Push journal entries to QuickBooks; set `quickbooks_journal_entry_id` on each entry |
| `asset.overdue_checkout_alert` | Daily 07:00 | Find checkouts where `expected_return_at < NOW() AND checked_in_at IS NULL`; notify PM and checkout user |

All jobs use `JobEnvelope` with `tenant_id` (T-10) and `withTenantContext()` (T-42).

---

## Notifications & Alerts (9 types)

| Event | Recipient | Channel | Safety-lock? |
|-------|-----------|---------|--------------|
| Maintenance overdue | Owner, PM | push + email | No |
| Registration expiring (60/30/7 days) | Owner, PM | push + email | No |
| Insurance expiring (60/30 days) | Owner, PM | push + email | No |
| Warranty expiring (60/30 days) | Owner, PM | push + email | No |
| Rental return due (14/7 days) | Owner, PM | push + email | No |
| Asset inspection failed / OOS | Owner, PM, assigned operator | push | No |
| Damage incident reported (major/total_loss) | Owner, PM | push + email | No |
| Recall notice — safety_critical | Owner, PM, assigned operator | push + email | **Yes — cannot disable** |
| Tool checkout overdue | PM, checked-out user | push | No |

Notification category: `operational`. Safety-critical recalls use category `safety`.

---

## Web UI

### Top-level navigation
`/assets` — Company-wide asset registry (not project-scoped)

### Pages

| Page | Path | Purpose |
|------|------|---------|
| Asset Dashboard | `/assets` | Summary cards + alert panel + asset list |
| Asset Detail | `/assets/[id]` | 9-tab detail view |
| Insurance Policies | `/assets/insurance` | Fleet-level policy management |
| Inspection Templates | `/assets/inspection-templates` | Manage checklists |

### Asset Detail Tabs (9)
1. **Overview** — photo, specs, assignment, current status, open alerts
2. **Service** — service record history + maintenance schedules
3. **Inspections** — completed inspections, last result badge, OOS history
4. **Warranties** — warranty cards + claims
5. **Insurance** — which policies cover this asset + claims
6. **Registration** — all registration/compliance records with expiry indicators
7. **Fuel** — fill-up log + MPG chart (vehicles) / cost-per-hour chart (equipment)
8. **Depreciation** — schedule + monthly book value chart + QB sync status
9. **Documents** — file cabinet for all asset documents

### Slide-over pattern (consistent with Sessions 25–26)
All list rows open a slide-over panel for quick edit. Full detail available via "Open" link.

---

## Mobile Features

| Feature | Screen | Notes |
|---------|--------|-------|
| Pre-use inspection | `mobile/src/screens/assets/InspectionForm.tsx` | Checklist form, photo capture for defects, offline-capable |
| Fuel log entry | `mobile/src/screens/assets/FuelLog.tsx` | GPS can auto-capture location, offline queue |
| Tool checkout/checkin | `mobile/src/screens/assets/Checkout.tsx` | QR code scan via camera; `expo-camera` + `expo-barcode-scanner` |
| Damage report | `mobile/src/screens/assets/DamageReport.tsx` | Photo capture + description; offline queue |
| Asset lookup | `mobile/src/screens/assets/AssetDetail.tsx` | Scan QR sticker → view asset record |

All mobile operations are offline-first. Sync queue flushes on reconnect.

---

## Operator Certification Enforcement (T-57)

When assigning an operator to equipment with `requires_operator_cert = true`:

```typescript
// In service layer — before inserting asset_operator_assignments row
const certs = await getActiveCertifications(tenantId, userId, client);
const hasRequired = certs.some(
  c => c.cert_type === asset.required_cert_type &&
       (c.expires_at === null || c.expires_at > new Date())
);
if (!hasRequired) {
  throw new TierEnforcementError(
    'OPERATOR_CERT_REQUIRED',
    `This equipment requires a valid ${asset.required_cert_type} certification. ` +
    `Operator ${user.first_name} ${user.last_name} does not hold one.`,
  );
}
```

Same check applies to `asset_checkouts`. Checkout is blocked if cert missing or expired.
Certification data is read from `safety_certifications` table (existing Domain 8).

---

## Depreciation Methods

| Method | Formula | Notes |
|--------|---------|-------|
| `straight_line` | (cost - salvage) / useful_life_years | Equal charge each year |
| `declining_balance` | book_value × (2 / useful_life_years) | Accelerated; switches to SL when SL > DB |
| `sum_of_years` | (cost - salvage) × (remaining_life / SYD) | Accelerated |
| `units_of_production` | (cost - salvage) × (units_this_period / expected_total_units) | Based on meter readings |

**QuickBooks sync:** Depreciation entries push as Journal Entries to the accounts specified
in `asset_depreciation_schedules`. Sync uses existing QuickBooks integration pattern
(circuit breaker, retry with jitter — T-21, T-22).

---

## Future Integrations (documented, not in v1.0)

| Integration | Provider | What it adds |
|-------------|---------|--------------|
| Telematics/GPS | Samsara, Verizon Connect, Geotab | Live odometer/hours, location, idle time |
| Fuel cards | WEX, Comdata | Auto-import fuel transactions |
| NHTSA API | api.nhtsa.dot.gov | Auto-lookup recalls by VIN |
| ELD/HOS | Samsara, KeepTruckin | Hours-of-service compliance for CDL drivers |

---

## Gaps Identified (deferred to v1.1+)

| Item | Notes |
|------|-------|
| **OSHA rigging tags** | Quarterly color-coded tags for chains/slings/scaffolding (OSHA 1926.251). Different from service records — needs tag_color, quarter fields |
| **Parts inventory** | Spare parts stock tracking per asset type. Links to procurement |
| **Equipment utilization billing** | Charge project budget at standard equipment rate (e.g., $150/hr for excavator) |
| **Asset templates** | Create 10 identical forklifts from one template — reduces data entry |
| **NHTSA VIN lookup** | Auto-populate make/model/year and check for open recalls on creation |
| **IFTA fuel tax report** | Multi-state fuel tax reporting for interstate trucking; requires state_code on fuel_logs (column is already there) |
| **Lessor COI generation** | Generate COI proof PDF for lessors who require it |
| **Lien/title tracking** | Who holds lien on financed equipment; relevant for bonding/insurance |

---

## File Locations

| File | Purpose |
|------|---------|
| `prisma/migrations/0010_asset_management/migration.sql` | DB schema for all 25 tables |
| `api/src/routes/v1/assets.ts` | Core asset CRUD + meter readings + utilization |
| `api/src/routes/v1/asset-groups.ts` | Group CRUD |
| `api/src/routes/v1/asset-assignments.ts` | Project assignments + operator assignments + checkouts + reservations |
| `api/src/routes/v1/asset-service.ts` | Service records + maintenance schedules |
| `api/src/routes/v1/asset-inspections.ts` | Inspections + templates |
| `api/src/routes/v1/asset-warranties.ts` | Warranties + claims |
| `api/src/routes/v1/asset-insurance.ts` | Insurance policies + claims + policy-asset links |
| `api/src/routes/v1/asset-compliance.ts` | Registrations + recalls + calibration |
| `api/src/routes/v1/asset-fuel.ts` | Fuel logs + fleet fuel summary |
| `api/src/routes/v1/asset-depreciation.ts` | Depreciation schedules + entries |
| `api/src/routes/v1/asset-damage.ts` | Damage incidents |
| `api/src/routes/v1/asset-documents.ts` | Document CRUD |
| `api/src/workers/asset-worker.ts` | Background job handlers (expiry, depreciation, QB sync) |
| `web/src/app/(dashboard)/assets/page.tsx` | Asset dashboard + list |
| `web/src/app/(dashboard)/assets/[id]/page.tsx` | 9-tab asset detail |
| `web/src/app/(dashboard)/assets/insurance/page.tsx` | Fleet insurance policies |
| `web/src/app/(dashboard)/assets/inspection-templates/page.tsx` | Checklist management |
| `mobile/src/screens/assets/InspectionForm.tsx` | Mobile pre-use inspection |
| `mobile/src/screens/assets/Checkout.tsx` | QR checkout/checkin |
| `mobile/src/screens/assets/FuelLog.tsx` | Mobile fuel entry |
| `mobile/src/screens/assets/DamageReport.tsx` | Mobile damage reporting |

---

*Spec version: 1.0 — Session 29 — 2026-03-29*
