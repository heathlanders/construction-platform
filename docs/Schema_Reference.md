# Schema Reference
> **Source of truth for runtime queries.** Extracted from Platform_DataModel_v1_0.docx.
> When this file conflicts with Prisma migrations, the migrations win — update this file.
> All tables use the universal column pattern unless noted as exempt.

---

## Universal column pattern (all tenant-scoped tables)

```sql
tenant_id    UUID NOT NULL REFERENCES tenants(id)
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at   TIMESTAMPTZ          -- NULL = active; soft-delete pattern
created_by   UUID REFERENCES users(id)
```

Every tenant-scoped table also requires:
```sql
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);
CREATE INDEX idx_{table}_tenant_deleted ON {table}(tenant_id, deleted_at);
```

Mobile-writable tables additionally require:
```sql
version      INTEGER NOT NULL DEFAULT 1  -- optimistic locking (T-12)
```

---

## Domain 1: Platform

### `tenants`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| name | TEXT | NOT NULL | Display name |
| slug | TEXT | NOT NULL UNIQUE | URL-safe identifier |
| tier | tenant_tier | NOT NULL DEFAULT 'starter' | |
| status | tenant_status | NOT NULL DEFAULT 'trial' | |
| trial_ends_at | TIMESTAMPTZ | | NULL after conversion |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| deleted_at | TIMESTAMPTZ | | Soft delete |

**No RLS on tenants** — platform-scoped table, accessed by application with validated JWT.

Enums:
- `tenant_tier`: starter, professional, business, enterprise
- `tenant_status`: trial, active, cancelled, grace_period, suspended

### `platform_admins`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | TEXT UNIQUE NOT NULL | |
| password_hash | TEXT NOT NULL | |
| status | TEXT NOT NULL DEFAULT 'active' | |
| created_at | TIMESTAMPTZ | |
| last_login_at | TIMESTAMPTZ | |

**No RLS** — platform-scoped table.

---

## Domain 2: Users

### `users`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL FK tenants(id) | RLS enforced |
| email | TEXT | NOT NULL | |
| password_hash | TEXT | | NULL for SSO |
| first_name | TEXT | NOT NULL | |
| last_name | TEXT | NOT NULL | |
| role | user_role | NOT NULL | |
| language_preference | CHAR(2) | NOT NULL DEFAULT 'en' | ISO 639-1 |
| status | user_status | NOT NULL DEFAULT 'active' | |
| last_login_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| deleted_at | TIMESTAMPTZ | | Soft delete |
| created_by | UUID | FK users(id) | |

Unique: `(tenant_id, email)`

Enums:
- `user_role`: owner, project_manager, estimator, foreman, field_tech, accountant, safety_officer, client_portal, sub_portal
- `user_status`: active, invited, suspended, deactivated

### `user_devices` (mobile push tokens)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| user_id | UUID FK users(id) | |
| platform | TEXT | 'ios' or 'android' |
| push_token | TEXT NOT NULL | APNs or FCM token |
| active | BOOLEAN NOT NULL DEFAULT TRUE | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `notification_preferences`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| user_id | UUID FK | |
| category | TEXT | Notification category |
| channel | TEXT | 'push', 'email', 'sms' |
| enabled | BOOLEAN NOT NULL DEFAULT TRUE | |
| quiet_hours_start | TIME | |
| quiet_hours_end | TIME | |

---

## Domain 3: Projects

### `projects`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| name | TEXT NOT NULL | |
| status | project_status | |
| start_date | DATE | |
| end_date | DATE | |
| address | TEXT | |
| city | TEXT | |
| state | CHAR(2) | |
| zip | TEXT | |
| county_fips | CHAR(5) | Nullable, user-correctable. Drives jurisdiction engine when set. Added 0019 |
| county_name | TEXT | Nullable. Added 0019 |
| latitude | NUMERIC(9,6) | Nullable. Set by `geocode-worker` (Census) or manual pin-drop. Added 0036 (Project Map) |
| longitude | NUMERIC(9,6) | Nullable. Added 0036 |
| geocode_status | TEXT NOT NULL DEFAULT 'pending' | CHECK ('pending','exact','approximate','failed'). `approximate` = county-centroid fallback. Added 0036 |
| geocoded_at | TIMESTAMPTZ | Last successful geocode. Added 0036 |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

Enum: `project_status`: active, completed, on_hold, cancelled

### `project_members`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID FK projects(id) | |
| user_id | UUID FK users(id) | |
| role | user_role | Project-level role override |
| created_at | TIMESTAMPTZ | |

### `task_dependencies` (Session 33 — prerequisite DAG; migration 0018)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| predecessor_task_id | UUID NOT NULL FK schedule_tasks(id) | |
| successor_task_id | UUID NOT NULL FK schedule_tasks(id) | |
| dependency_type | TEXT NOT NULL DEFAULT 'finish_to_start' | CHECK ('finish_to_start','start_to_start','finish_to_finish','start_to_finish') |
| origin | TEXT NOT NULL DEFAULT 'rule_engine' | CHECK ('rule_engine','manual'). Re-import soft-deletes only `rule_engine` edges; `manual` preserved |
| created_at / updated_at / deleted_at / created_by | — | Soft delete; no `version` (join table) |

Many-to-many predecessor→successor edges between `schedule_tasks`. Populated by the deterministic
rule engine (`api/src/lib/task-dependencies/rules.ts`) on blueprint import; also user-editable via
`/v1/task-dependencies`. The legacy single FK `schedule_tasks.predecessor_task_id` is backfilled with
the "primary" (most immediate) predecessor for the Gantt. RLS enabled + forced.
Unique: `(tenant_id, predecessor_task_id, successor_task_id)` where `deleted_at IS NULL`.
CHECK `no_self_dependency` (`predecessor_task_id <> successor_task_id`).
Acyclic by construction (edges only point forward in PHASE_ORDER × sort_order).

---

## Domain 4: Cross-Tenant Bridge

### `shared_project_events` ⚠️ RLS EXEMPT (T-44)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| connection_id | UUID FK tenant_connections(id) | Links GC + Sub |
| source_tenant_id | UUID NOT NULL | Who wrote this event |
| event_type | TEXT NOT NULL | e.g. 'rfi.created', 'submittal.updated' |
| payload | JSONB NOT NULL | Event data (no internal sub data in GC-visible payload) |
| created_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |

**No RLS policy.** Access controlled at application layer — connection membership
validated before every read/write (T-45).

### `tenant_connections`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| gc_tenant_id | UUID NOT NULL FK tenants(id) | |
| sub_tenant_id | UUID NOT NULL FK tenants(id) | |
| status | TEXT | 'pending', 'active', 'revoked' |
| invited_by | UUID FK users(id) | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**No RLS** — cross-tenant table, access controlled at application layer.

---

## Domain 5: Financial

### `invoices`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| amount_cents | INTEGER NOT NULL | Never float (T-02) |
| status | TEXT | 'draft', 'sent', 'paid', 'void' |
| due_date | DATE | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

### `change_orders`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| title | TEXT NOT NULL | |
| description | TEXT | |
| amount_cents | INTEGER NOT NULL | Never float (T-02) |
| status | TEXT | 'pending', 'approved', 'rejected' |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

### `budget_line_items`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| cost_code_id | UUID FK cost_codes(id) | |
| description | TEXT NOT NULL | |
| budget_cents | INTEGER NOT NULL DEFAULT 0 | Never float (T-02) |
| actual_cents | INTEGER NOT NULL DEFAULT 0 | Never float (T-02) |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

### `cost_codes`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| code | TEXT NOT NULL | e.g. '03-000' |
| name | TEXT NOT NULL | |
| category | TEXT | e.g. 'Labor', 'Materials', 'Equipment' |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

Unique: `(tenant_id, code)` where `deleted_at IS NULL`

---

## Domain 6: Documents

### `documents`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| doc_type | TEXT | 'rfi', 'submittal', 'plan', 'spec', 'contract' |
| title | TEXT NOT NULL | |
| storage_path | TEXT | Live storage path (never direct URL) |
| file_size_bytes | INTEGER | |
| status | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

### `rfis`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| number | INTEGER NOT NULL | Sequential per project |
| subject | TEXT NOT NULL | |
| status | TEXT | 'draft', 'open', 'answered', 'closed' |
| due_date | DATE | |
| assignee_id | UUID FK users(id) | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

Unique: `(tenant_id, project_id, number)` where `deleted_at IS NULL`

### `submittals`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| number | INTEGER NOT NULL | Sequential per project |
| title | TEXT NOT NULL | |
| status | TEXT | 'draft', 'submitted', 'under_review', 'approved', 'approved_as_noted', 'rejected', 'resubmit' |
| spec_section | TEXT | e.g. '03300' |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

Unique: `(tenant_id, project_id, number)` where `deleted_at IS NULL`

---

## Domain 7: Field Operations

### `daily_reports`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| report_date | DATE NOT NULL | |
| weather | JSONB | Conditions at time of report |
| notes | TEXT | Append-only — last-write-wins conflict policy |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

### `time_entries`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID FK projects(id) | **Nullable since migration 0024** — a time entry / clock punch may have no project (employee just logs hours). |
| user_id | UUID NOT NULL FK users(id) | Worker being logged |
| date | DATE NOT NULL | |
| hours_worked | NUMERIC(5,2) NOT NULL | e.g. 8.50 |
| cost_code_id | UUID FK cost_codes(id) | |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

### `punch_list_items`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| title | TEXT NOT NULL | |
| description | TEXT | |
| status | TEXT | 'open', 'in_progress', 'complete' |
| assigned_to | UUID FK users(id) | |
| due_date | DATE | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

### `inspections`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| title | TEXT NOT NULL | |
| inspection_date | TIMESTAMPTZ | |
| status | TEXT | 'scheduled', 'passed', 'failed', 'requires_action' |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

---

## Domain 8: Safety

### `safety_incidents`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| incident_date | TIMESTAMPTZ NOT NULL | |
| description | TEXT NOT NULL | |
| severity | TEXT | 'near_miss', 'first_aid', 'recordable', 'lost_time', 'fatality' |
| status | TEXT | 'open', 'under_investigation', 'closed' |
| version | INTEGER NOT NULL DEFAULT 1 | Tier 3 conflict — blocks until Safety Officer resolves |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

### `jsa_records`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| title | TEXT NOT NULL | |
| conducted_at | TIMESTAMPTZ NOT NULL | |
| attendees | JSONB | Array of { user_id, name, signature_at } |
| hazards | JSONB | Array of { description, controls, severity } |
| version | INTEGER NOT NULL DEFAULT 1 | Tier 3 conflict — safety-critical |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |
| created_by | UUID FK users(id) | |

### `safety_certifications`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| user_id | UUID NOT NULL FK users(id) | Worker holding the certification |
| cert_type | TEXT NOT NULL | e.g. 'OSHA_10', 'OSHA_30', 'First Aid', 'Forklift' |
| issued_at | DATE | |
| expires_at | DATE | NULL = no expiry |
| document_path | TEXT | Live storage path (never direct URL) |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

---

## Domain 9: Estimating

### `bid_packages`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| title | TEXT NOT NULL | |
| status | TEXT | 'draft', 'open', 'closed', 'awarded' |
| due_date | DATE | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

### `takeoff_items`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| bid_package_id | UUID FK bid_packages(id) | |
| description | TEXT NOT NULL | |
| quantity | NUMERIC(10,3) NOT NULL DEFAULT 0 | |
| unit | TEXT | e.g. 'LF', 'SF', 'EA', 'CY' |
| unit_cost_cents | INTEGER NOT NULL DEFAULT 0 | Never float (T-02) |
| assembly_code | TEXT | Added 0031 (estimating Phase 2a). Source `estimate_assemblies.code`, stamped by `/estimates/:id/to-bid-package`. Material-actuals chain: awarded `vendor_bid_line_items.unit_cost_cents` → `takeoff_item_id` → here → the assembly. Index `(tenant_id, assembly_code) WHERE assembly_code IS NOT NULL`. |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

### `markups`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| name | TEXT NOT NULL | e.g. 'Overhead & Profit', 'Tax' |
| percentage | NUMERIC(5,2) NOT NULL | e.g. 15.00 for 15% |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

---

## Domain 10: Trade Modules

### `electrical_panels`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| name | TEXT NOT NULL | e.g. 'Main Panel', 'Sub-Panel A' |
| amperage | INTEGER | e.g. 200 |
| voltage | INTEGER | e.g. 120, 240 |
| location | TEXT | |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

### `electrical_circuits`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| panel_id | UUID NOT NULL FK electrical_panels(id) | |
| circuit_number | INTEGER NOT NULL | |
| description | TEXT | |
| amperage | INTEGER | |
| status | TEXT | 'planned', 'roughed_in', 'complete' |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

Unique: `(tenant_id, panel_id, circuit_number)` where `deleted_at IS NULL`

### `permits` (Session 27 — electrical AHJ permits; trade-aware since 0013 — T-59)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| permit_type | TEXT NOT NULL DEFAULT 'electrical' | CHECK ('electrical','plumbing','mechanical','building') — widened 0013 (plumbing), 0014 (mechanical/HVAC), 0015 (building/general). T-59 |
| building_type | TEXT NOT NULL | 'residential_sf', 'residential_mf', 'commercial', 'industrial' |
| state_code | CHAR(2) NOT NULL | Denormalized from project.state at creation |
| county_fips | CHAR(5) | Resolved-location snapshot. Added 0019 (jurisdiction engine) |
| county_name | TEXT | Resolved-location snapshot. Added 0019 |
| city_name | TEXT | Resolved-location snapshot (normalized). Added 0019 |
| jurisdiction_key | TEXT | Canonical key, e.g. 'WI/55025/madison'. Added 0019 |
| ahj_level | TEXT | 'state'\|'county'\|'city' — which layer's AHJ enforces. Added 0019 |
| code_type | TEXT | Model-code family: 'NEC' (electrical), 'IPC'\|'UPC' (plumbing), 'IMC'\|'UMC' (mechanical), 'IRC'\|'IBC' (building — derived from building_type). Added 0013 (T-59) |
| code_edition | TEXT | Edition/year for the model code, e.g. '2020','2021'. Added 0013 (T-59) |
| nec_edition | TEXT | Electrical-only; NULL for plumbing. NOT NULL dropped in 0013 (T-59). '2017','2020','2023' |
| jurisdiction_notes | TEXT | Populated for amended/home-rule states (electrical: CA/OR/NY/IL; plumbing: many — IPC/UPC split) |
| ahj_name | TEXT | |
| ahj_address | TEXT | |
| ahj_phone | TEXT | |
| ahj_contact_name | TEXT | |
| permit_number | TEXT | Assigned by AHJ |
| status | TEXT NOT NULL DEFAULT 'draft' | CHECK ('draft','submitted','approved','active','failed_inspection','closed','voided') |
| applied_date | DATE | |
| approved_date | DATE | |
| expiry_date | DATE | |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

RLS: enabled + forced. Status transitions enforced at application layer (not DB).
No UNIQUE on (tenant_id, project_id, permit_type) — a project can have multiple permits (phased work, temp power + full).

**Jurisdiction engine (0019):** `code_type`/`code_edition`/`nec_edition`/`jurisdiction_notes` + the new `county_*`/`city_name`/`jurisdiction_key`/`ahj_level` columns are a frozen snapshot resolved at creation by `api/src/lib/jurisdictions/` — a deterministic (no-AI) cascade: city → county → state → national default (the 4 trade libs). `POST /permits` resolves from project state + county (project.county_fips → ZIP lookup) + city; `generate-milestones` re-resolves from the permit's stored snapshot. AHJ identity (`ahj_name`/`ahj_address`/`ahj_phone`/`ahj_contact_name`) is pre-filled from the matched AHJ when the user leaves it blank. Initial seeded jurisdictions: Dane County WI + Madison/Stoughton/Windsor. Blueprint permit-milestone injection (`blueprint-worker.ts`) also resolves through the engine using each active permit's stored geo, so AHJ-added/removed steps flow into blueprint-generated tasks too (Phase 3).

**New columns on `inspections`** (Session 27 — all nullable, backward-compatible):
| Column | Type | Notes |
|--------|------|-------|
| permit_id | UUID FK permits(id) | Links inspection to an AHJ permit |
| trade_type | TEXT | 'electrical', 'plumbing', etc. NULL = general inspection |
| inspection_type | TEXT | 'temporary_power', 'rough_in', 'service', 'cover', 'final' |
| sequence_order | INTEGER | Display order within a permit's milestone sequence |
| inspector_name | TEXT | AHJ inspector name |
| correction_notice | TEXT | AHJ correction notice text on failure |
| result | TEXT | CHECK ('pass', 'fail', 'partial') — formal AHJ result; synced to `status` |

**status vs result duality:** `status` ('scheduled','passed','failed','requires_action') is the UI-canonical field. `result` captures the formal AHJ outcome. Route handler auto-syncs: `pass→passed`, `fail→failed`, `partial→requires_action`.

### `concrete_pours`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| pour_type | TEXT NOT NULL | 'slab','footing','wall','column','driveway','other' |
| volume_cy | NUMERIC(8,2) | Cubic yards |
| mix_design | TEXT | e.g. '4000 PSI, 3/4" aggregate' |
| slump_inches | NUMERIC(4,1) | |
| pour_date | DATE | |
| status | TEXT | 'planned','in_progress','complete','failed' |
| version / created_at / updated_at / deleted_at / created_by | — | Universal pattern |

### `concrete_test_records` (Session 31 — ACI 318 QA depth; child of concrete_pours)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| pour_id | UUID NOT NULL FK concrete_pours(id) | |
| test_type | TEXT NOT NULL | CHECK ('cylinder_compressive','slump','air_content','temperature','other') |
| test_date | DATE | |
| age_days | INTEGER | Cylinder break age (7, 28) |
| specified_value | NUMERIC(10,2) | Design target (f'c psi, slump in, air %, temp F) |
| measured_value | NUMERIC(10,2) | Measured result |
| unit | TEXT | 'psi'\|'in'\|'pct'\|'F' |
| result | TEXT NOT NULL DEFAULT 'pending' | CHECK ('pass','fail','pending'). Auto pass/fail for cylinder breaks (measured ≥ specified) |
| sample_id | TEXT | Cylinder set / sample identifier |
| lab_name | TEXT | |
| version / created_at / updated_at / deleted_at / created_by | — | Universal pattern |

Indexes: `(tenant_id)`, `(tenant_id, deleted_at)`, `(tenant_id, pour_id)`, `(tenant_id, updated_at)`. RLS enabled + forced.

### `roofing_qa_records` (Session 31 — child of roofing_systems)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| roofing_system_id | UUID NOT NULL FK roofing_systems(id) | |
| qa_type | TEXT NOT NULL | CHECK ('deck','underlayment_dry_in','flashing','seam_weld','fastener_pull','water_test','manufacturer_warranty','final','other') |
| inspection_date | DATE | |
| result | TEXT NOT NULL DEFAULT 'pending' | CHECK ('pass','fail','pending') |
| measured_value | NUMERIC(10,2) | e.g. fastener pull-out lbf, seam-probe count |
| unit | TEXT | 'lbf','count','in', etc. |
| inspector_name | TEXT | |
| version / created_at / updated_at / deleted_at / created_by | — | Universal pattern |

Indexes: `(tenant_id)`, `(tenant_id, deleted_at)`, `(tenant_id, roofing_system_id)`, `(tenant_id, updated_at)`. RLS enabled + forced.

### `framing_correction_items` (Session 31 — child of framing_inspections)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| framing_inspection_id | UUID NOT NULL FK framing_inspections(id) | |
| description | TEXT NOT NULL | |
| location | TEXT | e.g. 'NW corner, bedroom 2' |
| severity | TEXT NOT NULL DEFAULT 'minor' | CHECK ('minor','major','safety') |
| status | TEXT NOT NULL DEFAULT 'open' | CHECK ('open','in_progress','resolved') |
| resolved_at | TIMESTAMPTZ | Auto-stamped on status→resolved |
| resolved_by | UUID FK users(id) | Auto-stamped on status→resolved |
| version / created_at / updated_at / deleted_at / created_by | — | Universal pattern |

Indexes: `(tenant_id)`, `(tenant_id, deleted_at)`, `(tenant_id, framing_inspection_id)`, `(tenant_id, status)`, `(tenant_id, updated_at)`. RLS enabled + forced.

### `plumbing_systems`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| name | TEXT NOT NULL | e.g. 'Domestic Water Supply' |
| system_type | TEXT | 'supply', 'drain', 'gas', 'fire' |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

### `plumbing_fixtures`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| system_id | UUID NOT NULL FK plumbing_systems(id) | |
| fixture_type | TEXT | e.g. 'toilet', 'sink', 'shower', 'hose_bib' |
| location | TEXT | |
| status | TEXT | 'planned', 'rough_in', 'trimmed', 'complete' |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

---

## Domain 11: Platform Services

### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK | RLS enforced |
| user_id | UUID NOT NULL FK users(id) | Recipient |
| title | TEXT NOT NULL | |
| body | TEXT NOT NULL | |
| category | TEXT NOT NULL | 'safety', 'financial', 'project', 'system', 'cross_tenant' |
| read_at | TIMESTAMPTZ | NULL = unread |
| data | JSONB | Deep-link / action payload |
| created_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |

**No updated_at, no deleted_at** — append-only notification log.
Unread count cached in Redis per user for badge display (T-41).
All notifications stored in user's preferred_language (T-41).

### Subscriptions & Billing (no RLS — billing is cross-scoped)

### `tenant_subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL UNIQUE FK | |
| stripe_customer_id | TEXT | |
| stripe_subscription_id | TEXT | |
| tier | tenant_tier | |
| status | TEXT | mirrors Stripe subscription status |
| addon_gc_module | BOOLEAN NOT NULL DEFAULT FALSE | |
| addon_cross_tenant | BOOLEAN NOT NULL DEFAULT FALSE | |
| current_period_end | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**No RLS** — billing is cross-scoped; accessed by billing service with validated tenant_id.

### `tenant_storage_usage`
| Column | Type | Notes |
|--------|------|-------|
| tenant_id | UUID PK FK | |
| bytes_used | BIGINT NOT NULL DEFAULT 0 | Updated on upload/delete |
| updated_at | TIMESTAMPTZ | |

---

## Domain 12: Audit Log

### `audit_log`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL | RLS enforced; 'PLATFORM' for super admin events |
| category | TEXT NOT NULL | auth, data, access, admin, billing, cross_tenant |
| action | TEXT NOT NULL | e.g. 'project.updated' |
| actor_id | UUID | |
| actor_email | TEXT | Denormalized — preserved if user deleted (T-34) |
| actor_role | TEXT | |
| resource_type | TEXT | |
| resource_id | UUID | |
| payload | JSONB | before/after for data events |
| ip_address | INET | NOT exposed to tenant admins (T-33) |
| created_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |
| previous_hash | TEXT NOT NULL | Hash of previous entry |
| entry_hash | TEXT NOT NULL | SHA-256 of this entry (T-32) |

**Append-only** — no UPDATE or DELETE ever. 7-year retention (T-34).

---

## Domain 9b: Reconciliation Layer (Session 7)

### `vendors`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| name | TEXT NOT NULL | |
| vendor_type | vendor_type | subcontractor, supplier, equipment, other |
| trade_type | TEXT | e.g. 'electrical', 'plumbing' |
| contact_name | TEXT | |
| contact_email | TEXT | |
| contact_phone | TEXT | |
| is_preferred | BOOLEAN NOT NULL DEFAULT FALSE | |
| is_prequalified | BOOLEAN NOT NULL DEFAULT FALSE | |
| performance_notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

### `contracts` ⚠️ CRITICAL — governing document
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID FK projects(id) | |
| contract_type | contract_type | prime_contract, subcontract, purchase_order |
| vendor_id | UUID FK vendors(id) NULLABLE | NULL = prime contract with owner |
| original_value_cents | INTEGER NOT NULL DEFAULT 0 | Never float (T-02) |
| approved_co_value_cents | INTEGER NOT NULL DEFAULT 0 | Updated by budget_co_adjustment job |
| status | contract_status | draft, pending_signature, executed, complete, terminated |
| retainage_pct | NUMERIC(5,2) NOT NULL DEFAULT 0 | |
| executed_at | TIMESTAMPTZ | |
| docusign_envelope_id | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

**Computed in app layer:** `current_value_cents = original_value_cents + approved_co_value_cents`

### `vendor_bids`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| bid_package_id | UUID FK bid_packages(id) | |
| vendor_id | UUID FK vendors(id) | |
| status | vendor_bid_status | invited, submitted, awarded, declined |
| submitted_at | TIMESTAMPTZ | Set on submit action |
| total_amount_cents | INTEGER NOT NULL DEFAULT 0 | Never float (T-02) |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

### `vendor_bid_line_items`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| vendor_bid_id | UUID FK vendor_bids(id) | |
| takeoff_item_id | UUID FK takeoff_items(id) NULLABLE | |
| unit_cost_cents | INTEGER NOT NULL DEFAULT 0 | Never float (T-02) |
| total_cost_cents | INTEGER NOT NULL DEFAULT 0 | Never float (T-02) |
| notes | TEXT | |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

**No version column** — child of VendorBid, not independently optimistic-locked.

### `schedule_tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID FK projects(id) | |
| title | TEXT NOT NULL | |
| description | TEXT | |
| status | schedule_task_status | not_started, in_progress, complete, on_hold |
| percent_complete | NUMERIC(5,2) NOT NULL DEFAULT 0 | Triggers schedule_cost_projection job when changed |
| planned_start / planned_end | DATE | |
| actual_start / actual_end | DATE | |
| assigned_to_user_id | UUID FK users(id) NULLABLE | |
| predecessor_task_id | UUID FK schedule_tasks(id) NULLABLE | Self-referencing |
| show_in_client_portal | BOOLEAN NOT NULL DEFAULT FALSE | |
| trade_type | TEXT | Added 0021. Trade for codes resolution + phase column. Backfilled from `blueprint_proposed_tasks`; stamped on blueprint import + settable on manual tasks |
| phase | TEXT | Added 0021. Construction phase (PHASE_ORDER). Drives the Overview DAG phase columns |
| csi_division | TEXT | Added 0021. CSI MasterFormat code |
| sort_order | INTEGER | Added 0023. Sequence order within a phase; backfilled from `blueprint_proposed_tasks.sort_order`. Editable via PATCH; drives the dependency rule engine on recompute |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

**Task detail (Session 41):** `GET /v1/schedule-tasks/:id/detail` aggregates the task + resolved
codes/inspection sequence (jurisdiction engine, keyed on the task's `trade_type` → permit trade via
`lib/jurisdictions/trade-map.ts`) + live AHJ inspection status (the project's permit of that trade) +
dependencies + QA photos. `trade_type`/`phase`/`csi_division` are editable via `PATCH /schedule-tasks/:id`.

### `schedule_task_photos` (migration 0021 — QA/proof photos)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enabled + forced |
| task_id | UUID NOT NULL FK schedule_tasks(id) | |
| storage_path | TEXT NOT NULL | LIVE path from `files.storage_path` after scan passes (reuses `/v1/files/upload` quarantine pipeline) |
| caption | TEXT | |
| photo_type | TEXT NOT NULL DEFAULT 'proof' | CHECK ('proof','qa','progress','defect') |
| uploaded_by | UUID FK users(id) | |
| created_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |

Upload roles: OWNER/PM/FOREMAN/FIELD_TECH/SAFETY_OFFICER. Delete: OWNER/PM or uploader.
Index: `(tenant_id, task_id)`. Mobile capture+upload is online-only (offline queue deferred).

### `task_steps` (migration 0022 — Task Build-Out Engine output)
Per-task ordered work steps for the field, generated by the deterministic per-trade engine
(`api/src/lib/task-buildout/`) referencing the blueprint analysis facts + the codes engine. Built on
blueprint `/import` and rebuildable via `POST /v1/schedule-tasks/:id/build-steps` (one) /
`POST /v1/schedule-tasks/project/:projectId/build-steps` (all). Read by all org users; build = OWNER/PM.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enabled + forced |
| task_id | UUID NOT NULL FK schedule_tasks(id) | |
| step_order | INTEGER NOT NULL DEFAULT 0 | |
| title | TEXT NOT NULL | |
| instruction | TEXT NOT NULL | Laborer how-to |
| detail | TEXT | |
| code_refs | JSONB NOT NULL DEFAULT '[]' | `[{code_type, section, note?}]` from the codes engine |
| tools / materials / safety | JSONB NOT NULL DEFAULT '[]' | string[] |
| equipment | JSONB NOT NULL DEFAULT '[]' | Added 0032. `[{type, category, reason, optional?}]` — heavy equipment/power tools to do the step efficiently. `type` canonical (= `company_assets.asset_type` for EAM join; = `EQUIP-{TYPE}` estimating catalog code). Deterministic per trade/phase/facts/scale (`lib/task-buildout/equipment-rules.ts`). |
| gating_inspection_type | TEXT | matches `inspections.inspection_type`; drives task-scoped compliance |
| qa_check | TEXT | verify-before-inspection note |
| source | TEXT NOT NULL DEFAULT 'rule_engine' | CHECK ('rule_engine','manual'); rebuild soft-deletes prior rule_engine rows |
| created_at / updated_at / deleted_at | — | No `version` (regenerated as a set) |

Index: `(tenant_id, task_id, step_order)`. The task-detail endpoint returns `steps` + scopes
`codes.compliance` to the `inspection_type`s the task's steps gate (+ `codes.task_code_refs`).

### `milestones`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID FK projects(id) | |
| title | TEXT NOT NULL | |
| schedule_task_id | UUID FK schedule_tasks(id) NULLABLE | |
| due_date | DATE | |
| completed_at | TIMESTAMPTZ | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

### `crew_assignments` (routes deferred to v1.1)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID FK projects(id) | |
| user_id | UUID FK users(id) | Worker assigned |
| schedule_task_id | UUID FK schedule_tasks(id) NULLABLE | |
| start_date / end_date | DATE | |
| role_on_task | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

### New columns on existing tables (Session 7)

**`budget_line_items`** additions:
| Column | Type | Notes |
|--------|------|-------|
| committed_amount_cents | INTEGER NOT NULL DEFAULT 0 | Money committed to a vendor |
| projected_final_cents | INTEGER NOT NULL DEFAULT 0 | Updated by schedule_cost_projection job |
| vendor_bid_id | UUID FK vendor_bids(id) NULLABLE | Set on bid award |
| contract_id | UUID FK contracts(id) NULLABLE | |
| assembly_code | TEXT NULLABLE | Added 0031 (estimating Phase 2a). Source `estimate_assemblies.code`, stamped by `/estimates/:id/award`. Labor-actuals attribution: `actual_cents` (field-cost-worker) joins back to the catalog assembly for learn-from-actuals. Index `(tenant_id, assembly_code) WHERE assembly_code IS NOT NULL`. |

**`time_entries`** additions:
| Column | Type | Notes |
|--------|------|-------|
| budget_line_item_id | UUID FK budget_line_items(id) NULLABLE | Triggers field_cost_rollup job |
| hourly_rate_cents | INTEGER | Rate at time of logging (T-02) |

**`invoices`** additions:
| Column | Type | Notes |
|--------|------|-------|
| contract_id | UUID FK contracts(id) NULLABLE | |
| retainage_held_cents | INTEGER NOT NULL DEFAULT 0 | |
| retainage_released_cents | INTEGER NOT NULL DEFAULT 0 | |
| stripe_payment_intent_id | TEXT | Set by Stripe worker |
| quickbooks_invoice_id | TEXT | Set by QuickBooks worker |
| connection_id | UUID FK tenant_connections(id) NULLABLE | Added 0041. **Sub-side** bridge link (Doc 07 §5.1 — sub bills GC, reversed vs rfis). `status='sent'` mirrors `invoice.submitted`; GC approve/pay = ledger events via `/connections/:id/invoice-response`. Partial idx `(tenant_id, connection_id) WHERE connection_id IS NOT NULL`. Lien waivers are event-ledger-only — no table. |

**`change_orders`** additions:
| Column | Type | Notes |
|--------|------|-------|
| contract_id | UUID FK contracts(id) NULLABLE | Links CO to governing contract |
| schedule_impact_days | INTEGER NOT NULL DEFAULT 0 | |
| direction | TEXT | 'owner_to_gc' \| 'gc_to_sub' |
| vendor_id | UUID FK vendors(id) NULLABLE | |
| reason_code | TEXT | |

**`bid_packages`** additions:
| Column | Type | Notes |
|--------|------|-------|
| schedule_task_id | UUID FK schedule_tasks(id) NULLABLE | Links scope to schedule |

---

## Domain 13: Blueprint Intelligence (Session 21)

### `blueprint_analyses`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| project_id | UUID NOT NULL FK projects(id) | |
| document_id | UUID FK documents(id) NULLABLE | NULL for template-only runs |
| building_type | TEXT NOT NULL | 'residential_sf', 'residential_mf', 'commercial', 'industrial', 'pole_barn' (post-frame, added for OCR/Madison set). Not DB-CHECK-constrained — validated app-side against `BUILDING_TYPE_LABELS` |
| status | TEXT NOT NULL DEFAULT 'pending' | pending, processing, review_ready, imported, failed |
| sheet_count | INTEGER | Set after PDF split |
| extracted_task_count | INTEGER | Set after aggregation |
| import_metadata | JSONB | `{ trades_found, phases_found, task_count, source, ... }`. `source` ∈ `text_extraction` \| `ocr_extraction` (scanned→mupdf+tesseract.js, no AI) \| `template` \| `template_fallback` \| `template_scanned_fallback` |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | UUID FK users(id) | |

### `blueprint_sheets`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| analysis_id | UUID NOT NULL FK blueprint_analyses(id) | |
| sheet_number | TEXT | e.g. 'E1.0', 'P2.3', 'A-101' |
| sheet_title | TEXT | |
| discipline | TEXT | 'architectural', 'structural', 'electrical', 'plumbing', 'mechanical', 'civil', 'specs' |
| page_number | INTEGER | |
| storage_path | TEXT | Live storage path for rendered page image (never direct URL) |
| status | TEXT NOT NULL DEFAULT 'pending' | pending, analyzed, failed |
| analysis_result | JSONB | Raw AI/stub output for this sheet |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**No deleted_at, no version** — child records, not independently soft-deleted.

### `blueprint_proposed_tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| analysis_id | UUID NOT NULL FK blueprint_analyses(id) | |
| sheet_id | UUID FK blueprint_sheets(id) NULLABLE | NULL for template-sourced tasks |
| title | TEXT NOT NULL | |
| description | TEXT | |
| trade_type | TEXT | 'electrical', 'plumbing', 'hvac', 'framing', 'concrete', 'roofing', 'architectural', 'civil', 'structural', 'general', 'insulation', 'drywall', 'finishes' |
| phase | TEXT | 'site_prep', 'foundation', 'framing', 'roofing', 'rough_in', 'inspections', 'insulation', 'drywall', 'finishes_interior', 'finishes_exterior', 'sitework', 'commissioning', 'punch' |
| csi_division | TEXT | CSI MasterFormat code e.g. '26 27 26' |
| estimated_duration_days | INTEGER | |
| sort_order | INTEGER | Display order within phase/trade |
| review_status | TEXT NOT NULL DEFAULT 'pending' | pending, accepted, rejected, modified |
| schedule_task_id | UUID FK schedule_tasks(id) NULLABLE | Set when imported |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**No deleted_at, no version** — reviewed and discarded, never soft-deleted.

---

## Domain 14: Company Asset Management (Session 29)

> Full spec: `@docs/Asset_Management_v1_0.md` — 25 tables, Business+ tier gate (T-56)

### `company_assets`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| asset_number | TEXT NOT NULL | Auto-gen AST-0001 or manual |
| name | TEXT NOT NULL | |
| asset_category | TEXT NOT NULL | CHECK (vehicle\|heavy_equipment\|trailer\|attachment\|power_tool\|hand_tool\|safety_equipment\|technology\|other) |
| asset_type | TEXT | Specific type: pickup_truck, excavator, forklift, drill, etc. |
| make / model / year | TEXT / INTEGER | |
| serial_number | TEXT | |
| vin | TEXT | Vehicles only |
| color | TEXT | |
| ownership_type | TEXT NOT NULL | CHECK (owned\|rented\|leased\|borrowed) |
| status | TEXT NOT NULL DEFAULT 'active' | CHECK (active\|in_repair\|out_of_service\|decommissioned\|sold\|stolen\|lost\|reserved) |
| condition | TEXT | CHECK (excellent\|good\|fair\|poor) |
| purchase_date | DATE | |
| purchase_price_cents | INTEGER | Never float (T-02) |
| purchase_vendor_id | UUID FK vendors(id) | Nullable |
| current_value_cents | INTEGER | Updated by depreciation job |
| disposal_date / disposal_price_cents / disposal_notes | — | |
| home_location | TEXT | Yard/warehouse address |
| meter_type | TEXT NOT NULL DEFAULT 'none' | CHECK (odometer\|hours\|none) |
| current_meter_reading | NUMERIC(12,1) | Snapshot; history in asset_meter_readings |
| requires_operator_cert | BOOLEAN NOT NULL DEFAULT FALSE | Block assignment if true and cert missing (T-57) |
| required_cert_type | TEXT | CDL_A\|CDL_B\|forklift\|crane_operator\|aerial_lift\|other |
| dot_regulated | BOOLEAN NOT NULL DEFAULT FALSE | |
| dot_unit_number | TEXT | |
| osha_inspection_required | BOOLEAN NOT NULL DEFAULT FALSE | |
| osha_inspection_frequency_days | INTEGER | |
| group_id | UUID FK asset_groups(id) | Nullable |
| photo_path | TEXT | Live storage path |
| custom_fields | JSONB | Contractor-defined metadata |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

### `asset_groups` · `asset_meter_readings` · `asset_project_assignments`
### `asset_operator_assignments` · `asset_checkouts` · `asset_reservations`
### `asset_rental_details` · `asset_service_records` · `asset_maintenance_schedules`
### `asset_inspection_templates` · `asset_inspections`
### `asset_warranties` · `asset_warranty_claims`
### `asset_insurance_policies` · `asset_insurance_policy_assets` · `asset_insurance_claims`
### `asset_registrations` · `asset_fuel_logs`
### `asset_depreciation_schedules` · `asset_depreciation_entries`
### `asset_damage_incidents` · `asset_documents` · `asset_recalls` · `asset_calibration_records`

Full column specs in `@docs/Asset_Management_v1_0.md`.

Key notes:
- `asset_meter_readings` and `asset_depreciation_entries` are **append-only** — no UPDATE or DELETE
- `asset_inspections.result = 'fail'` auto-sets `company_assets.status = 'out_of_service'` in same transaction
- `asset_operator_assignments` and `asset_checkouts` enforce cert check via `safety_certifications` (T-57)
- All project assignments logged to `audit_log` as chain of custody (T-58)

---

## Domain 16: Codes Reference Store (Session 36 — migration 0020)

> National jurisdiction/codes engine storage. See `@docs/Codes_Engine_National_Plan_v1_0.md` (Doc 16).
> **All four tables are platform-scoped reference data — NO RLS** (mirror `tenants`/`tenant_subscriptions`).
> They hold no tenant-owned rows. The jurisdiction engine (`api/src/lib/jurisdictions/`) stays pure:
> a DB-backed in-memory cache loads `code_editions` + `jurisdiction_layers` at boot; `zip_county` is
> queried on demand. Curated tables carry `source` + `last_verified` (versioned, manual review).
> **BUILT — Phases 1–4 done (Sessions 36–38):** schema (0020), DB-backed loader swap, full US
> ZIP→county ingest, and super-admin curation (`/v1/admin/jurisdiction-layers*`, `/v1/admin/code-editions*`
> — new rows carry `source='admin-curation'`). Writes refresh the in-memory cache. No schema change since 0020.

### `code_editions`
Code family + edition per state per trade. Replaces the inline `*-codes/*-editions.ts` libs.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| trade | TEXT NOT NULL | CHECK ('electrical','plumbing','mechanical','building') |
| state_code | CHAR(2) NOT NULL | |
| code_type | TEXT NOT NULL | 'NEC','IPC','UPC','IMC','UMC','IRC','IBC' |
| code_edition | TEXT | e.g. '2020','2021' |
| nec_edition | TEXT | electrical only; NULL otherwise |
| notes | TEXT | amendment / home-rule notes (appended in cascade) |
| source | TEXT | provenance |
| last_verified | DATE | |
| created_at / updated_at | TIMESTAMPTZ | |

Unique: `(trade, state_code)`. Index: `(state_code)`.

### `zip_county`
Full US ZIP↔county crosswalk (~41k ZIPs, multi-county aware). Primary county = `MAX(ratio)` per zip.
| Column | Type | Notes |
|--------|------|-------|
| zip | CHAR(5) | PK part |
| county_fips | CHAR(5) | PK part |
| county_name | TEXT NOT NULL | |
| state_code | CHAR(2) NOT NULL | |
| primary_city | TEXT | hint, not authoritative |
| ratio | NUMERIC | HUD res_ratio; primary = max per zip |

PK: `(zip, county_fips)`. Index: `(zip)`.

### `counties`
FIPS reference (~3,143) — validation + UI pickers.
| Column | Type | Notes |
|--------|------|-------|
| county_fips | CHAR(5) PK | |
| county_name | TEXT NOT NULL | |
| state_code | CHAR(2) NOT NULL | |
| centroid_lat | NUMERIC(9,6) | Nullable. County internal point. `approximate` geocode fallback for the Project Map. Added 0036; ingested by `scripts/import-county-centroids.ts` (Census Gazetteer). |
| centroid_lng | NUMERIC(9,6) | Nullable. Added 0036. |

Index: `(state_code)`.

### `jurisdiction_layers`
Sparse city/county/state override layers. Replaces `seed/wi-*.ts`. `ahj` = AhjMetadata JSONB;
`codes` = `Partial<Record<Trade, TradeCodeOverride>>` JSONB (incl. `sequence_ops`). `city_name`
normalized (lowercased, prefixes stripped) by the loader.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| level | TEXT NOT NULL | CHECK ('state','county','city') |
| state_code | CHAR(2) | |
| county_fips | CHAR(5) | |
| county_name | TEXT | |
| city_name | TEXT | normalized |
| ahj | JSONB | AhjMetadata |
| codes | JSONB | per-trade overrides + sequence_ops |
| notes | TEXT | |
| source | TEXT | provenance |
| last_verified | DATE | |
| created_at / updated_at | TIMESTAMPTZ | |

Index: `(state_code, county_fips, city_name)`.

---

## Domain 17: Time Tracking & Payroll (Sessions 7, 22–26 — migrations 0005/0007/0011)

> Full spec: `@docs/Time_Tracking_Payroll_v1_0.md` (Doc 17). Locked: T-60/61/62. **No tier gate.**
> `time_entries` itself is in Domain 7 (Field Operations) with Session-7 additions
> (`budget_line_item_id`, `hourly_rate_cents`) in Domain 12. The 5 tables below complete the domain.

### `timecards` (migration 0005)
Weekly aggregation of `time_entries` per user with an approval FSM (T-60).
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| user_id | UUID NOT NULL FK users(id) | Worker the card is for |
| week_start | DATE NOT NULL | Monday of the ISO week |
| status | TEXT NOT NULL DEFAULT 'draft' | CHECK ('draft','submitted','approved','rejected') |
| total_hours | NUMERIC(6,2) NOT NULL DEFAULT 0 | Re-summed from time_entries on open/submit |
| overtime_hours | NUMERIC(6,2) NOT NULL DEFAULT 0 | `max(0, total_hours − 40)` |
| submitted_at | TIMESTAMPTZ | |
| approved_by | UUID FK users(id) | |
| approved_at | TIMESTAMPTZ | |
| rejection_note | TEXT | Required on reject |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking (T-12) |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

RLS enabled + forced. **Partial UNIQUE:** `(tenant_id, user_id, week_start) WHERE status != 'rejected' AND deleted_at IS NULL`.

### `time_punches` (migration 0011)
Clock in/out events; clock-out upserts the day's `time_entries` row (T-61).
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| user_id | UUID NOT NULL FK users(id) | |
| project_id | UUID FK projects(id) | Nullable |
| cost_code_id | UUID FK cost_codes(id) | Nullable |
| clock_in_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |
| clock_out_at | TIMESTAMPTZ | NULL = punch still open |
| hours_worked | NUMERIC(5,2) | Set on close |
| auto_clocked_out | BOOLEAN NOT NULL DEFAULT FALSE | Midnight cron closed it |
| time_entry_id | UUID FK time_entries(id) | The upserted entry; set on close |
| notes | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic locking |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

RLS enabled + forced. **Partial UNIQUE:** `(tenant_id, user_id) WHERE clock_out_at IS NULL AND deleted_at IS NULL` (one open punch per user).

### `tenant_settings` (migration 0011)
Per-tenant time-capture mode toggle (T-61). One row per tenant.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL UNIQUE FK | RLS enforced |
| time_tracking_mode | TEXT NOT NULL DEFAULT 'manual' | CHECK ('manual','clock_in_out') |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at / updated_at | TIMESTAMPTZ | |
| updated_by | UUID FK users(id) | Nullable |

RLS enabled + forced. Index `(tenant_id)`.

### `tenant_integrations` (migration 0007)
Encrypted payroll/accounting provider tokens (T-62).
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| provider | TEXT NOT NULL | CHECK ('quickbooks','gusto','adp') |
| access_token_enc | TEXT | AES-256-GCM |
| refresh_token_enc | TEXT | AES-256-GCM |
| token_expires_at | TIMESTAMPTZ | |
| external_id | TEXT | realmId / company_uuid / org_id |
| status | TEXT NOT NULL DEFAULT 'active' | CHECK ('active','disconnected','error') |
| last_sync_at | TIMESTAMPTZ | |
| sync_error | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

RLS enabled + forced. **UNIQUE `(tenant_id, provider)`**.

### `user_payroll_settings` (migration 0007)
Per-user pay configuration. One row per user.
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS enforced |
| user_id | UUID NOT NULL UNIQUE FK users(id) | |
| employment_type | TEXT NOT NULL DEFAULT 'w2' | CHECK ('w2','contractor_1099') |
| default_hourly_rate_cents | INTEGER NOT NULL DEFAULT 0 | Never float (T-02) |
| overtime_multiplier | NUMERIC(4,2) NOT NULL DEFAULT 1.50 | |
| pay_frequency | TEXT NOT NULL DEFAULT 'biweekly' | CHECK ('weekly','biweekly','semimonthly','monthly') |
| gusto_employee_id | TEXT | |
| adp_worker_aoid | TEXT | |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

RLS enabled + forced.

---

## Domain 18: Estimating Engine (Session 46 — migration 0028)

> Full spec: `@docs/Estimating_Engine_v1_0.md`. Locked: T-63. **No tier gate.** Deterministic
> sub-level job estimating (`api/src/lib/estimating/`). Money in cents (T-02), optimistic lock (T-12),
> RLS enabled + forced with WITH CHECK (A-03).

### `estimate_assemblies` (cost catalog — system + tenant cascade)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS. **System rows use sentinel `00000000-…`** |
| trade | TEXT NOT NULL | CHECK ('electrical','plumbing','mechanical','building','general') |
| code | TEXT NOT NULL | stable key, e.g. 'E-RECEP-DUP', 'PARAM-ELECTRICAL' |
| name | TEXT NOT NULL | |
| description | TEXT | |
| unit | TEXT NOT NULL DEFAULT 'EA' | 'EA','LF','SF','CY',… |
| csi_division | TEXT | |
| material_cost_cents | INTEGER NOT NULL DEFAULT 0 | material $ per unit |
| labor_hours_per_unit | NUMERIC(10,3) NOT NULL DEFAULT 0 | production rate |
| equipment_cost_cents | INTEGER NOT NULL DEFAULT 0 | equipment $ per unit |
| waste_pct | NUMERIC(5,2) NOT NULL DEFAULT 0 | material waste % |
| is_system | BOOLEAN NOT NULL DEFAULT FALSE | system row (read-any) |
| is_active | BOOLEAN NOT NULL DEFAULT TRUE | |
| source | TEXT | 'platform-seed' \| 'tenant' |
| version | INTEGER NOT NULL DEFAULT 1 | |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

RLS: `USING (tenant_id = current OR is_system = TRUE)`, `WITH CHECK (tenant_id = current)` — tenants
read system rows but can never write them. A tenant row with the same `(trade, code)` OVERRIDES the
system row in the engine cascade. Unique: `(tenant_id, trade, code) WHERE deleted_at IS NULL`.
Seeded system catalog (0028 baseline + 0030 depth = 60 rows): electrical(14) + plumbing(14) + mechanical(12) + building(16) unit assemblies +
4 `PARAM-{TRADE}` $/SF rows. **0033 adds 17 `EQUIP-{TYPE}` rows** (trade `general`, unit `DAY`, cost in
`equipment_cost_cents`) — equipment day-rates matching `task_steps.equipment[].type`; seeded into an
estimate by `POST /estimates/:id/generate {include_equipment:true}` (aggregates the project's task-step
equipment → DAY lines).
**0048+ (`NNNN_trade_pack_catalog_wNN`) are GENERATED** from Trade Knowledge Packs (`npm run gen:catalog-migration`,
Doc 23) — 0048 adds 7 `B-DECK-*` rows; provenance per row in SQL comments, code→migration map in
`api/src/lib/trades/packs/catalog-manifest.ts`.
**0045 adds 14 flatwork rows** (`G-SITE-DEMO-SF` exterior removal, `B-FLAT-*` adders on top of the 4" broom
`B-FLATWORK-SF` baseline: excavation, thickness per SF·in, fiber/mesh, trowel/stamp/exposed/color/border, saw-cut,
sealer, steps, trench drain) — priced by the Design Studio `concrete_flatwork` intake module (`lib/intake/`).

### `estimates` (header + markup params + totals)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS |
| project_id | UUID FK projects(id) | Nullable — prospect/standalone estimate |
| name | TEXT NOT NULL | |
| trade | TEXT | primary trade (nullable = multi-trade) |
| building_type | TEXT | |
| mode | TEXT NOT NULL DEFAULT 'assembly' | CHECK ('assembly','parametric') |
| status | TEXT NOT NULL DEFAULT 'draft' | CHECK ('draft','final','sent','awarded','lost') |
| labor_rate_cents | INTEGER NOT NULL DEFAULT 0 | **burdened** $/hr snapshot (T-63) |
| overhead_pct / profit_pct / tax_pct / contingency_pct | NUMERIC(5,2) | markup params (tax on material only) |
| material_cents / labor_cents / equipment_cents / subtotal_cents / markup_cents / total_cents | INTEGER | rolled-up totals |
| notes | TEXT | |
| proposal_path | TEXT | live storage path of the generated proposal PDF (`{tenant}/live/estimates/proposals/{id}.pdf`; overwritten on regen). Added 0029 |
| proposal_generated_at | TIMESTAMPTZ | when the proposal PDF was last rendered. Added 0029 |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic lock |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

FSM `draft→final→sent→awarded/lost`. `awarded` is locked (edits → 409). RLS enabled + forced + WITH CHECK.
Proposal PDF (migration 0029): `POST /estimates/:id/proposal` renders a branded customer proposal
(pdfkit, `lib/estimate-pdf.ts`) → uploads to live storage → `proposal_path`; `send=true` emails a
7-day link (T-35 precedent) via SendGrid + advances `draft`/`final` → `sent`. `GET /estimates/:id/proposal`
returns a fresh 15-min URL.

### `estimate_line_items`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID FK | RLS |
| estimate_id | UUID NOT NULL FK estimates(id) | |
| assembly_id | UUID FK estimate_assemblies(id) | Nullable — ad-hoc manual line |
| assembly_code | TEXT | |
| trade / description / csi_division / unit | TEXT | description NOT NULL |
| quantity | NUMERIC(12,3) NOT NULL DEFAULT 0 | |
| material_unit_cents / labor_hours_per_unit / equipment_unit_cents / waste_pct | — | cost basis snapshot (editable) |
| material_cents / labor_hours / labor_cents / equipment_cents / extended_cents | — | computed amounts (recomputed on edit / rate change) |
| assumptions | JSONB NOT NULL DEFAULT '[]' | string[] — defensibility |
| source | TEXT NOT NULL DEFAULT 'manual' | CHECK ('rule_engine','manual') — rebuild replaces rule_engine, preserves manual |
| sort_order | INTEGER NOT NULL DEFAULT 0 | |
| version | INTEGER NOT NULL DEFAULT 1 | Optimistic lock |
| created_at / updated_at / deleted_at / created_by | — | Universal pattern |

RLS enabled + forced + WITH CHECK.

---

## Domain 19: Design Studio (migration 0046 — proposed T-65)

> Full spec: `@docs/Client_Visualizer_v1_0.md`. Contractor-invited client (CLIENT_PORTAL user) builds a request
> of one or more trade scopes; each scope's `spec` is validated by the trade's intake module (`api/src/lib/intake/`).
> All 5 tables: RLS enabled + forced with WITH CHECK, TEXT+CHECK enums (T-53). No tier gate yet (open question).

### `tenant_trade_offerings`
`trade_key` (must have a registered intake module — app-enforced), `enabled`, `display_order`, `settings` JSONB
(`labor_rate_cents`, `overhead_pct`, `profit_pct`, `tax_pct`, `contingency_pct`, `renders_enabled` — params for
client ranges), `version`, universal cols. Partial UNIQUE `(tenant_id, trade_key) WHERE deleted_at IS NULL`.

### `design_requests`
`client_user_id` FK users, `project_id?`, `channel` ('contractor_invite'|'marketplace'), `status`
('draft'|'submitted'|'reviewed'|'converted'|'declined'), `title`, `site` JSONB, `common_values` JSONB,
`common_intake_version`, `estimate_id?` FK estimates, `range_low_cents`/`range_high_cents` (rollup), `submitted_at`,
`decline_reason`, `proposal_response` ('accepted'|'changes_requested', 0047), `proposal_responded_at`, `proposal_note`, `version`.
Index `(tenant_id, status, created_at DESC)`, `(tenant_id, client_user_id)`. A response is stale once the estimate's
`proposal_generated_at` is newer (re-sent proposal).

### `design_request_scopes`
`request_id`, `trade_key`, `intake_version`, `spec` JSONB `{trade_key,intake_version,values,provenance}`,
`ai_suggestions` JSONB (last validated suggestions — accept applies these with their recorded provenance),
`status` ('draft'|'complete'|'submitted'), `measurements_verified`, `range_low/high_cents`, `quantities_snapshot` +
`summary_snapshot` (frozen at submit), `selected_render_id?` FK design_renders, `sort_order`, `version`.
No unique on trade_key (patio + driveway on one request).

### `design_renders`
`request_id`, `scope_id`, `source_file_id` FK files, `spec_snapshot` JSONB, `intake_version`, `prompt`, `provider`,
`model`, `status` ('queued'|'running'|'succeeded'|'failed'|'blocked'), `storage_path` (live, system-generated),
`error`, `usage_event_id` FK ai_usage_events, `version`.

### `ai_usage_events` (append-only)
`user_id?`, `feature` ('studio.render'|'studio.assess'|'studio.guide'), `provider`, `model`, `units`, `unit_kind`
('call'|'image'|'token'), `cost_micro_usd BIGINT`, `subject_type`/`subject_id`, `status` ('ok'|'failed'|'blocked'),
`created_at`. RLS: SELECT + INSERT policies only → UPDATE/DELETE denied under FORCE RLS.

---

## Indexes summary (all tables)

| Table | Indexes |
|-------|---------|
| All tenant-scoped | `(tenant_id)`, `(tenant_id, deleted_at)` |
| Mobile-writable | `(tenant_id, updated_at)` for sync pulls |
| users | `(email)`, `(tenant_id, email)` UNIQUE |
| projects | `(tenant_id, status)` |
| invoices | `(tenant_id, project_id)`, `(tenant_id, status)` |
| change_orders | `(tenant_id, project_id)`, `(tenant_id, status)` |
| budget_line_items | `(tenant_id, project_id)` |
| cost_codes | `(tenant_id, code)` |
| rfis | `(tenant_id, project_id)`, `(tenant_id, project_id, number)` UNIQUE |
| submittals | `(tenant_id, project_id)`, `(tenant_id, project_id, number)` UNIQUE |
| time_entries | `(tenant_id, project_id)`, `(tenant_id, user_id)`, `(tenant_id, date)` |
| punch_list_items | `(tenant_id, project_id)`, `(tenant_id, assigned_to)` |
| inspections | `(tenant_id, project_id)` |
| safety_incidents | `(tenant_id, project_id)`, `(tenant_id, status)` |
| jsa_records | `(tenant_id, project_id)` |
| safety_certifications | `(tenant_id, user_id)`, `(tenant_id, expires_at)` |
| bid_packages | `(tenant_id, project_id)`, `(tenant_id, schedule_task_id)` |
| takeoff_items | `(tenant_id, project_id)`, `(tenant_id, bid_package_id)` |
| vendors | `(tenant_id, vendor_type)` |
| contracts | `(tenant_id, project_id)`, `(tenant_id, status)` |
| vendor_bids | `(tenant_id, bid_package_id)` |
| vendor_bid_line_items | `(tenant_id, vendor_bid_id)` |
| schedule_tasks | `(tenant_id, project_id)`, `(tenant_id, updated_at)` |
| task_dependencies | `(tenant_id)`, `(tenant_id, deleted_at)`, `(tenant_id, project_id)`, `(tenant_id, predecessor_task_id)`, `(tenant_id, successor_task_id)`, UNIQUE `(tenant_id, predecessor_task_id, successor_task_id) WHERE deleted_at IS NULL` |
| milestones | `(tenant_id, project_id)` |
| crew_assignments | `(tenant_id, project_id)`, `(tenant_id, user_id)` |
| budget_line_items (new) | `(tenant_id, vendor_bid_id)`, `(tenant_id, contract_id)` |
| time_entries (new) | `(tenant_id, budget_line_item_id)` |
| invoices (new) | `(tenant_id, contract_id)` |
| change_orders (new) | `(tenant_id, contract_id)` |
| permits | `(tenant_id)`, `(tenant_id, deleted_at)`, `(tenant_id, project_id)`, `(tenant_id, status)`, `(tenant_id, updated_at)`, `(tenant_id, jurisdiction_key)` |
| inspections (new) | `(permit_id) WHERE permit_id IS NOT NULL`, `(tenant_id, trade_type) WHERE trade_type IS NOT NULL`, `(permit_id, sequence_order) WHERE permit_id IS NOT NULL` |
| electrical_panels | `(tenant_id, project_id)` |
| electrical_circuits | `(tenant_id, panel_id)` |
| plumbing_systems | `(tenant_id, project_id)` |
| plumbing_fixtures | `(tenant_id, system_id)` |
| notifications | `(tenant_id, user_id)`, `(tenant_id, user_id, read_at)` |
| audit_log | `(tenant_id, created_at)`, `(tenant_id, category)` |
| shared_project_events | `(connection_id)`, `(source_tenant_id)`, `(created_at)` |
| blueprint_analyses | `(tenant_id, project_id)`, `(tenant_id, status)` |
| blueprint_sheets | `(tenant_id, analysis_id)`, `(tenant_id, status)` |
| blueprint_proposed_tasks | `(tenant_id, analysis_id)`, `(tenant_id, trade_type)`, `(tenant_id, phase)`, `(tenant_id, review_status)` |
| company_assets | `(tenant_id, asset_category)`, `(tenant_id, status)`, `(tenant_id, group_id)`, `(tenant_id, updated_at)` |
| asset_meter_readings | `(tenant_id, asset_id)`, `(tenant_id, asset_id, reading_date)` |
| asset_project_assignments | `(tenant_id, asset_id)`, `(tenant_id, project_id)`, `(tenant_id, asset_id, returned_at)` |
| asset_checkouts | `(tenant_id, asset_id)`, `(tenant_id, checked_out_by)`, `(tenant_id, checked_in_at) WHERE checked_in_at IS NULL` |
| asset_service_records | `(tenant_id, asset_id)`, `(tenant_id, asset_id, service_date)` |
| asset_maintenance_schedules | `(tenant_id, asset_id)`, `(tenant_id, next_due_date)` |
| asset_inspections | `(tenant_id, asset_id)`, `(tenant_id, asset_id, inspected_at)`, `(tenant_id, out_of_service) WHERE out_of_service = TRUE` |
| asset_warranties | `(tenant_id, asset_id)`, `(tenant_id, expiry_date)` |
| asset_insurance_policies | `(tenant_id, expiry_date)`, `(tenant_id, is_fleet_policy)` |
| asset_insurance_policy_assets | `(tenant_id, policy_id)`, `(tenant_id, asset_id)` |
| asset_registrations | `(tenant_id, asset_id)`, `(tenant_id, expiry_date)` |
| asset_fuel_logs | `(tenant_id, asset_id)`, `(tenant_id, asset_id, log_date)`, `(tenant_id, project_id) WHERE project_id IS NOT NULL` |
| asset_depreciation_schedules | `(tenant_id, asset_id)` UNIQUE |
| asset_depreciation_entries | `(tenant_id, asset_id)`, `(tenant_id, schedule_id, period_start)` |
| asset_damage_incidents | `(tenant_id, asset_id)`, `(tenant_id, status)` |
| asset_recalls | `(tenant_id, asset_id)`, `(tenant_id, status)` |
| asset_calibration_records | `(tenant_id, asset_id)`, `(tenant_id, next_calibration_due)` |
| code_editions (no RLS) | `(state_code)`, UNIQUE `(trade, state_code)` |
| zip_county (no RLS) | PK `(zip, county_fips)`, `(zip)` |
| counties (no RLS) | PK `(county_fips)`, `(state_code)` |
| jurisdiction_layers (no RLS) | `(state_code, county_fips, city_name)` |
| time_entries | `(tenant_id, project_id)`, `(tenant_id, user_id, date)`, `(tenant_id, updated_at)`, `(tenant_id, budget_line_item_id)` |
| timecards | `(tenant_id, status)`, `(tenant_id, updated_at)`, partial UNIQUE `(tenant_id, user_id, week_start) WHERE status != 'rejected' AND deleted_at IS NULL` |
| time_punches | `(tenant_id, user_id, clock_in_at DESC)`, `(tenant_id, project_id, clock_in_at DESC)`, `(tenant_id, clock_out_at) WHERE clock_out_at IS NULL`, partial UNIQUE `(tenant_id, user_id) WHERE clock_out_at IS NULL AND deleted_at IS NULL` |
| tenant_settings | `(tenant_id)` |
| tenant_integrations | `(tenant_id, provider)`, UNIQUE `(tenant_id, provider)` |
| user_payroll_settings | `(tenant_id, user_id)` |
| estimate_assemblies | `(tenant_id, deleted_at)`, `(trade, deleted_at)`, `(is_system) WHERE is_system`, UNIQUE `(tenant_id, trade, code) WHERE deleted_at IS NULL` |
| estimates | `(tenant_id, deleted_at)`, `(tenant_id, project_id)`, `(tenant_id, status)` |
| estimate_line_items | `(tenant_id, deleted_at)`, `(tenant_id, estimate_id, sort_order)` |
