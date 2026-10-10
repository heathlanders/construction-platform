-- Migration: 0010_asset_management
-- Company Asset Management (EAM) — 25 tables
-- Locked decisions: T-56 (Business+ tier gate), T-57 (operator cert blocking), T-58 (chain of custody)
-- All status/type columns use TEXT + CHECK constraint (T-53) — no PG ENUM types

-- ============================================================
-- 1. asset_groups
-- ============================================================
CREATE TABLE asset_groups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  name        TEXT        NOT NULL,
  description TEXT,
  version     INTEGER     NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  created_by  UUID        REFERENCES users(id)
);
ALTER TABLE asset_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_groups FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_groups
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_groups_tenant_id ON asset_groups(tenant_id);
CREATE INDEX idx_asset_groups_tenant_deleted ON asset_groups(tenant_id, deleted_at);

-- ============================================================
-- 2. asset_inspection_templates
-- ============================================================
CREATE TABLE asset_inspection_templates (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL REFERENCES tenants(id),
  name                TEXT        NOT NULL,
  asset_category      TEXT,
  asset_type          TEXT,
  inspection_frequency TEXT       NOT NULL CHECK (inspection_frequency IN ('pre_use','daily','weekly','monthly','annual')),
  is_osha_required    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_dot_required     BOOLEAN     NOT NULL DEFAULT FALSE,
  checklist_items     JSONB       NOT NULL DEFAULT '[]',
  is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
  is_system_template  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  created_by          UUID        REFERENCES users(id)
);
ALTER TABLE asset_inspection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_inspection_templates FORCE ROW LEVEL SECURITY;
-- System templates visible to all tenants (T-53 exception for shared platform data)
CREATE POLICY tenant_isolation ON asset_inspection_templates
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid OR is_system_template = TRUE);
CREATE INDEX idx_asset_inspection_templates_tenant ON asset_inspection_templates(tenant_id);
CREATE INDEX idx_asset_inspection_templates_tenant_deleted ON asset_inspection_templates(tenant_id, deleted_at);

-- ============================================================
-- 3. asset_insurance_policies (created before company_assets because rental_details references it)
-- ============================================================
CREATE TABLE asset_insurance_policies (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        NOT NULL REFERENCES tenants(id),
  policy_type           TEXT        NOT NULL CHECK (policy_type IN ('fleet','individual','equipment_floater','inland_marine','umbrella','liability')),
  policy_name           TEXT        NOT NULL,
  is_fleet_policy       BOOLEAN     NOT NULL DEFAULT FALSE,
  carrier_name          TEXT        NOT NULL,
  carrier_contact       TEXT,
  broker_name           TEXT,
  broker_contact        TEXT,
  policy_number         TEXT        NOT NULL,
  coverage_description  TEXT,
  coverage_limit_cents  INTEGER,
  deductible_cents      INTEGER,
  annual_premium_cents  INTEGER,
  effective_date        DATE        NOT NULL,
  expiry_date           DATE        NOT NULL,
  auto_renew            BOOLEAN     NOT NULL DEFAULT FALSE,
  document_path         TEXT,
  notes                 TEXT,
  version               INTEGER     NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  created_by            UUID        REFERENCES users(id)
);
ALTER TABLE asset_insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_insurance_policies FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_insurance_policies
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_insurance_policies_tenant ON asset_insurance_policies(tenant_id);
CREATE INDEX idx_asset_insurance_policies_tenant_deleted ON asset_insurance_policies(tenant_id, deleted_at);
CREATE INDEX idx_asset_insurance_policies_expiry ON asset_insurance_policies(tenant_id, expiry_date);

-- ============================================================
-- 4. company_assets — master registry
-- ============================================================
CREATE TABLE company_assets (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID        NOT NULL REFERENCES tenants(id),
  asset_number                TEXT        NOT NULL,
  name                        TEXT        NOT NULL,
  asset_category              TEXT        NOT NULL CHECK (asset_category IN ('vehicle','heavy_equipment','trailer','attachment','power_tool','hand_tool','safety_equipment','technology','other')),
  asset_type                  TEXT,
  make                        TEXT,
  model                       TEXT,
  year                        INTEGER,
  serial_number               TEXT,
  vin                         TEXT,
  color                       TEXT,
  ownership_type              TEXT        NOT NULL CHECK (ownership_type IN ('owned','rented','leased','borrowed')),
  status                      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','in_repair','out_of_service','decommissioned','sold','stolen','lost','reserved')),
  condition                   TEXT        CHECK (condition IN ('excellent','good','fair','poor')),
  purchase_date               DATE,
  purchase_price_cents        INTEGER,
  purchase_vendor_id          UUID        REFERENCES vendors(id),
  current_value_cents         INTEGER,
  disposal_date               DATE,
  disposal_price_cents        INTEGER,
  disposal_notes              TEXT,
  home_location               TEXT,
  meter_type                  TEXT        NOT NULL DEFAULT 'none' CHECK (meter_type IN ('odometer','hours','none')),
  current_meter_reading       NUMERIC(12,1),
  requires_operator_cert      BOOLEAN     NOT NULL DEFAULT FALSE,
  required_cert_type          TEXT,
  dot_regulated               BOOLEAN     NOT NULL DEFAULT FALSE,
  dot_unit_number             TEXT,
  osha_inspection_required    BOOLEAN     NOT NULL DEFAULT FALSE,
  osha_inspection_frequency_days INTEGER,
  group_id                    UUID        REFERENCES asset_groups(id),
  photo_path                  TEXT,
  custom_fields               JSONB,
  notes                       TEXT,
  version                     INTEGER     NOT NULL DEFAULT 1,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,
  created_by                  UUID        REFERENCES users(id)
);
ALTER TABLE company_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_assets FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON company_assets
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_company_assets_tenant ON company_assets(tenant_id);
CREATE INDEX idx_company_assets_tenant_deleted ON company_assets(tenant_id, deleted_at);
CREATE INDEX idx_company_assets_tenant_category ON company_assets(tenant_id, asset_category);
CREATE INDEX idx_company_assets_tenant_status ON company_assets(tenant_id, status);
CREATE INDEX idx_company_assets_tenant_group ON company_assets(tenant_id, group_id);
CREATE INDEX idx_company_assets_tenant_updated ON company_assets(tenant_id, updated_at);

-- ============================================================
-- 5. asset_meter_readings — append-only
-- ============================================================
CREATE TABLE asset_meter_readings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id),
  asset_id      UUID        NOT NULL REFERENCES company_assets(id),
  reading_date  DATE        NOT NULL,
  reading_value NUMERIC(12,1) NOT NULL,
  source        TEXT        NOT NULL CHECK (source IN ('manual','service','inspection','telematics','fuel_log')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID        REFERENCES users(id)
  -- NO updated_at, NO deleted_at — append-only
);
ALTER TABLE asset_meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_meter_readings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_meter_readings
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_meter_readings_tenant ON asset_meter_readings(tenant_id);
CREATE INDEX idx_asset_meter_readings_asset ON asset_meter_readings(tenant_id, asset_id);
CREATE INDEX idx_asset_meter_readings_asset_date ON asset_meter_readings(tenant_id, asset_id, reading_date);

-- ============================================================
-- 6. asset_project_assignments — chain of custody, no deleted_at
-- ============================================================
CREATE TABLE asset_project_assignments (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        NOT NULL REFERENCES tenants(id),
  asset_id              UUID        NOT NULL REFERENCES company_assets(id),
  project_id            UUID        NOT NULL REFERENCES projects(id),
  assigned_by           UUID        REFERENCES users(id),
  assigned_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return_date  DATE,
  returned_at           TIMESTAMPTZ,
  return_condition      TEXT        CHECK (return_condition IN ('good','fair','damaged','needs_repair')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NO deleted_at — chain of custody (T-58)
);
ALTER TABLE asset_project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_project_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_project_assignments
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_project_assignments_tenant ON asset_project_assignments(tenant_id);
CREATE INDEX idx_asset_project_assignments_asset ON asset_project_assignments(tenant_id, asset_id);
CREATE INDEX idx_asset_project_assignments_project ON asset_project_assignments(tenant_id, project_id);
CREATE INDEX idx_asset_project_assignments_asset_returned ON asset_project_assignments(tenant_id, asset_id, returned_at);

-- ============================================================
-- 7. asset_operator_assignments
-- ============================================================
CREATE TABLE asset_operator_assignments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  asset_id    UUID        NOT NULL REFERENCES company_assets(id),
  user_id     UUID        NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE asset_operator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_operator_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_operator_assignments
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_operator_assignments_tenant ON asset_operator_assignments(tenant_id);
CREATE INDEX idx_asset_operator_assignments_asset ON asset_operator_assignments(tenant_id, asset_id);
CREATE INDEX idx_asset_operator_assignments_user ON asset_operator_assignments(tenant_id, user_id);

-- ============================================================
-- 8. asset_checkouts
-- ============================================================
CREATE TABLE asset_checkouts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id),
  asset_id          UUID        NOT NULL REFERENCES company_assets(id),
  checked_out_by    UUID        NOT NULL REFERENCES users(id),
  checked_out_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return_at TIMESTAMPTZ,
  project_id        UUID        REFERENCES projects(id),
  condition_out     TEXT        NOT NULL CHECK (condition_out IN ('good','fair','damaged','needs_repair')),
  notes_out         TEXT,
  checked_in_at     TIMESTAMPTZ,
  checked_in_by     UUID        REFERENCES users(id),
  condition_in      TEXT        CHECK (condition_in IN ('good','fair','damaged','needs_repair')),
  notes_in          TEXT,
  qr_scan_out       BOOLEAN     NOT NULL DEFAULT FALSE,
  qr_scan_in        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE asset_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_checkouts FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_checkouts
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_checkouts_tenant ON asset_checkouts(tenant_id);
CREATE INDEX idx_asset_checkouts_asset ON asset_checkouts(tenant_id, asset_id);
CREATE INDEX idx_asset_checkouts_user ON asset_checkouts(tenant_id, checked_out_by);
CREATE INDEX idx_asset_checkouts_open ON asset_checkouts(tenant_id, checked_in_at) WHERE checked_in_at IS NULL;

-- ============================================================
-- 9. asset_reservations
-- ============================================================
CREATE TABLE asset_reservations (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        NOT NULL REFERENCES tenants(id),
  asset_id              UUID        NOT NULL REFERENCES company_assets(id),
  project_id            UUID        REFERENCES projects(id),
  reserved_by           UUID        NOT NULL REFERENCES users(id),
  reserved_for_user_id  UUID        REFERENCES users(id),
  start_date            DATE        NOT NULL,
  end_date              DATE        NOT NULL,
  status                TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  notes                 TEXT,
  version               INTEGER     NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  created_by            UUID        REFERENCES users(id)
);
ALTER TABLE asset_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_reservations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_reservations
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_reservations_tenant ON asset_reservations(tenant_id);
CREATE INDEX idx_asset_reservations_tenant_deleted ON asset_reservations(tenant_id, deleted_at);
CREATE INDEX idx_asset_reservations_asset ON asset_reservations(tenant_id, asset_id);

-- ============================================================
-- 10. asset_rental_details
-- ============================================================
CREATE TABLE asset_rental_details (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        NOT NULL REFERENCES tenants(id),
  asset_id              UUID        NOT NULL UNIQUE REFERENCES company_assets(id),
  rental_vendor_id      UUID        REFERENCES vendors(id),
  agreement_number      TEXT,
  rental_start_date     DATE,
  rental_end_date       DATE,
  daily_rate_cents      INTEGER,
  weekly_rate_cents     INTEGER,
  monthly_rate_cents    INTEGER,
  deposit_cents         INTEGER,
  lessor_requires_coi   BOOLEAN     NOT NULL DEFAULT FALSE,
  insurance_policy_id   UUID        REFERENCES asset_insurance_policies(id),
  notes                 TEXT,
  version               INTEGER     NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  created_by            UUID        REFERENCES users(id)
);
ALTER TABLE asset_rental_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_rental_details FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_rental_details
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_rental_details_tenant ON asset_rental_details(tenant_id);
CREATE INDEX idx_asset_rental_details_tenant_deleted ON asset_rental_details(tenant_id, deleted_at);
CREATE INDEX idx_asset_rental_details_asset ON asset_rental_details(tenant_id, asset_id);

-- ============================================================
-- 11. asset_service_records
-- ============================================================
CREATE TABLE asset_service_records (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID        NOT NULL REFERENCES tenants(id),
  asset_id                UUID        NOT NULL REFERENCES company_assets(id),
  service_type            TEXT        NOT NULL CHECK (service_type IN ('oil_change','tire_rotation','brake_service','filter_replacement','pm_scheduled','pm_unscheduled','repair','recall','inspection','warranty_repair','calibration','other')),
  service_date            DATE        NOT NULL,
  meter_reading_at_service NUMERIC(12,1),
  description             TEXT        NOT NULL,
  vendor_id               UUID        REFERENCES vendors(id),
  technician_name         TEXT,
  labor_cost_cents        INTEGER     NOT NULL DEFAULT 0,
  parts_cost_cents        INTEGER     NOT NULL DEFAULT 0,
  total_cost_cents        INTEGER     NOT NULL DEFAULT 0,
  invoice_number          TEXT,
  project_id              UUID        REFERENCES projects(id),
  next_service_due_date   DATE,
  next_service_due_meter  NUMERIC(12,1),
  notes                   TEXT,
  version                 INTEGER     NOT NULL DEFAULT 1,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,
  created_by              UUID        REFERENCES users(id)
);
ALTER TABLE asset_service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_service_records FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_service_records
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_service_records_tenant ON asset_service_records(tenant_id);
CREATE INDEX idx_asset_service_records_tenant_deleted ON asset_service_records(tenant_id, deleted_at);
CREATE INDEX idx_asset_service_records_asset ON asset_service_records(tenant_id, asset_id);
CREATE INDEX idx_asset_service_records_asset_date ON asset_service_records(tenant_id, asset_id, service_date);

-- ============================================================
-- 12. asset_maintenance_schedules
-- ============================================================
CREATE TABLE asset_maintenance_schedules (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        NOT NULL REFERENCES tenants(id),
  asset_id              UUID        NOT NULL REFERENCES company_assets(id),
  schedule_name         TEXT        NOT NULL,
  service_type          TEXT        NOT NULL CHECK (service_type IN ('oil_change','tire_rotation','brake_service','filter_replacement','pm_scheduled','pm_unscheduled','repair','recall','inspection','warranty_repair','calibration','other')),
  interval_type         TEXT        NOT NULL CHECK (interval_type IN ('calendar_days','meter_units')),
  interval_value        NUMERIC     NOT NULL,
  last_performed_date   DATE,
  last_performed_meter  NUMERIC(12,1),
  next_due_date         DATE,
  next_due_meter        NUMERIC(12,1),
  alert_days_before     INTEGER     NOT NULL DEFAULT 14,
  alert_meter_before    NUMERIC,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  notes                 TEXT,
  version               INTEGER     NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  created_by            UUID        REFERENCES users(id)
);
ALTER TABLE asset_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance_schedules FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_maintenance_schedules
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_maintenance_schedules_tenant ON asset_maintenance_schedules(tenant_id);
CREATE INDEX idx_asset_maintenance_schedules_tenant_deleted ON asset_maintenance_schedules(tenant_id, deleted_at);
CREATE INDEX idx_asset_maintenance_schedules_asset ON asset_maintenance_schedules(tenant_id, asset_id);

-- ============================================================
-- 13. asset_inspections
-- ============================================================
CREATE TABLE asset_inspections (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID        NOT NULL REFERENCES tenants(id),
  asset_id                UUID        NOT NULL REFERENCES company_assets(id),
  template_id             UUID        REFERENCES asset_inspection_templates(id),
  inspection_type         TEXT        NOT NULL CHECK (inspection_type IN ('pre_use','daily','weekly','monthly','annual','osha','dot','return','calibration')),
  inspected_at            TIMESTAMPTZ NOT NULL,
  inspected_by            UUID        NOT NULL REFERENCES users(id),
  meter_reading           NUMERIC(12,1),
  result                  TEXT        NOT NULL CHECK (result IN ('pass','fail','conditional')),
  checklist_responses     JSONB,
  defects_noted           JSONB,
  out_of_service          BOOLEAN     NOT NULL DEFAULT FALSE,
  out_of_service_at       TIMESTAMPTZ,
  returned_to_service_at  TIMESTAMPTZ,
  returned_to_service_by  UUID        REFERENCES users(id),
  signature_at            TIMESTAMPTZ,
  notes                   TEXT,
  version                 INTEGER     NOT NULL DEFAULT 1,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,
  created_by              UUID        REFERENCES users(id)
);
ALTER TABLE asset_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_inspections FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_inspections
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_inspections_tenant ON asset_inspections(tenant_id);
CREATE INDEX idx_asset_inspections_tenant_deleted ON asset_inspections(tenant_id, deleted_at);
CREATE INDEX idx_asset_inspections_asset ON asset_inspections(tenant_id, asset_id);
CREATE INDEX idx_asset_inspections_asset_date ON asset_inspections(tenant_id, asset_id, inspected_at);

-- ============================================================
-- 14. asset_warranties
-- ============================================================
CREATE TABLE asset_warranties (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        NOT NULL REFERENCES tenants(id),
  asset_id              UUID        NOT NULL REFERENCES company_assets(id),
  warranty_type         TEXT        NOT NULL CHECK (warranty_type IN ('manufacturer','extended','drivetrain','component','structural')),
  provider_name         TEXT        NOT NULL,
  provider_contact      TEXT,
  policy_number         TEXT,
  coverage_description  TEXT,
  start_date            DATE        NOT NULL,
  expiry_date           DATE        NOT NULL,
  mileage_limit         INTEGER,
  hours_limit           INTEGER,
  is_transferable       BOOLEAN     NOT NULL DEFAULT FALSE,
  document_path         TEXT,
  notes                 TEXT,
  version               INTEGER     NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  created_by            UUID        REFERENCES users(id)
);
ALTER TABLE asset_warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_warranties FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_warranties
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_warranties_tenant ON asset_warranties(tenant_id);
CREATE INDEX idx_asset_warranties_tenant_deleted ON asset_warranties(tenant_id, deleted_at);
CREATE INDEX idx_asset_warranties_asset ON asset_warranties(tenant_id, asset_id);
CREATE INDEX idx_asset_warranties_expiry ON asset_warranties(tenant_id, asset_id, expiry_date);

-- ============================================================
-- 15. asset_warranty_claims
-- ============================================================
CREATE TABLE asset_warranty_claims (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID        NOT NULL REFERENCES tenants(id),
  warranty_id             UUID        NOT NULL REFERENCES asset_warranties(id),
  asset_id                UUID        NOT NULL REFERENCES company_assets(id),
  claim_date              DATE        NOT NULL,
  description             TEXT        NOT NULL,
  claim_amount_cents      INTEGER     NOT NULL DEFAULT 0,
  approved_amount_cents   INTEGER,
  status                  TEXT        NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','denied','paid','closed')),
  resolution_notes        TEXT,
  document_path           TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,
  created_by              UUID        REFERENCES users(id)
);
ALTER TABLE asset_warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_warranty_claims FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_warranty_claims
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_warranty_claims_tenant ON asset_warranty_claims(tenant_id);
CREATE INDEX idx_asset_warranty_claims_tenant_deleted ON asset_warranty_claims(tenant_id, deleted_at);
CREATE INDEX idx_asset_warranty_claims_warranty ON asset_warranty_claims(tenant_id, warranty_id);

-- ============================================================
-- 16. asset_insurance_policy_assets
-- ============================================================
CREATE TABLE asset_insurance_policy_assets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id),
  policy_id     UUID        NOT NULL REFERENCES asset_insurance_policies(id),
  asset_id      UUID        NOT NULL REFERENCES company_assets(id),
  added_date    DATE,
  removed_date  DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE asset_insurance_policy_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_insurance_policy_assets FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_insurance_policy_assets
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_insurance_policy_assets_tenant ON asset_insurance_policy_assets(tenant_id);
CREATE INDEX idx_asset_insurance_policy_assets_policy ON asset_insurance_policy_assets(tenant_id, policy_id);
CREATE INDEX idx_asset_insurance_policy_assets_asset ON asset_insurance_policy_assets(tenant_id, asset_id);
-- Partial unique: one active link per (policy, asset)
CREATE UNIQUE INDEX idx_asset_insurance_policy_assets_unique_active
  ON asset_insurance_policy_assets(tenant_id, policy_id, asset_id)
  WHERE removed_date IS NULL;

-- ============================================================
-- 17. asset_damage_incidents — WITHOUT insurance_claim_id first (circular FK workaround)
-- ============================================================
CREATE TABLE asset_damage_incidents (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID        NOT NULL REFERENCES tenants(id),
  asset_id                UUID        NOT NULL REFERENCES company_assets(id),
  incident_date           TIMESTAMPTZ NOT NULL,
  reported_by             UUID        NOT NULL REFERENCES users(id),
  description             TEXT        NOT NULL,
  damage_type             TEXT        NOT NULL CHECK (damage_type IN ('collision','vandalism','weather','operational','theft','fire','flood','other')),
  severity                TEXT        NOT NULL CHECK (severity IN ('minor','moderate','major','total_loss')),
  estimated_repair_cents  INTEGER,
  actual_repair_cents     INTEGER,
  out_of_service          BOOLEAN     NOT NULL DEFAULT FALSE,
  out_of_service_start    TIMESTAMPTZ,
  out_of_service_end      TIMESTAMPTZ,
  repair_authorized_by    UUID        REFERENCES users(id),
  repair_authorized_at    TIMESTAMPTZ,
  -- insurance_claim_id added below after asset_insurance_claims is created
  status                  TEXT        NOT NULL DEFAULT 'reported' CHECK (status IN ('reported','under_review','repair_authorized','in_repair','resolved','written_off')),
  photo_paths             JSONB,
  notes                   TEXT,
  version                 INTEGER     NOT NULL DEFAULT 1,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,
  created_by              UUID        REFERENCES users(id)
);
ALTER TABLE asset_damage_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_damage_incidents FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_damage_incidents
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_damage_incidents_tenant ON asset_damage_incidents(tenant_id);
CREATE INDEX idx_asset_damage_incidents_tenant_deleted ON asset_damage_incidents(tenant_id, deleted_at);
CREATE INDEX idx_asset_damage_incidents_asset ON asset_damage_incidents(tenant_id, asset_id);
CREATE INDEX idx_asset_damage_incidents_status ON asset_damage_incidents(tenant_id, status);

-- ============================================================
-- 18. asset_insurance_claims
-- ============================================================
CREATE TABLE asset_insurance_claims (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID        NOT NULL REFERENCES tenants(id),
  policy_id                 UUID        NOT NULL REFERENCES asset_insurance_policies(id),
  asset_id                  UUID        NOT NULL REFERENCES company_assets(id),
  damage_incident_id        UUID        REFERENCES asset_damage_incidents(id),
  incident_date             DATE        NOT NULL,
  claim_number              TEXT,
  description               TEXT        NOT NULL,
  claim_amount_cents        INTEGER     NOT NULL DEFAULT 0,
  approved_amount_cents     INTEGER,
  deductible_applied_cents  INTEGER,
  status                    TEXT        NOT NULL DEFAULT 'reported' CHECK (status IN ('reported','under_review','approved','denied','paid','closed')),
  adjuster_name             TEXT,
  adjuster_contact          TEXT,
  resolution_notes          TEXT,
  document_path             TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ,
  created_by                UUID        REFERENCES users(id)
);
ALTER TABLE asset_insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_insurance_claims FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_insurance_claims
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_insurance_claims_tenant ON asset_insurance_claims(tenant_id);
CREATE INDEX idx_asset_insurance_claims_tenant_deleted ON asset_insurance_claims(tenant_id, deleted_at);
CREATE INDEX idx_asset_insurance_claims_policy ON asset_insurance_claims(tenant_id, policy_id);
CREATE INDEX idx_asset_insurance_claims_asset ON asset_insurance_claims(tenant_id, asset_id);

-- 19. Resolve circular FK: add insurance_claim_id to damage_incidents
ALTER TABLE asset_damage_incidents
  ADD COLUMN insurance_claim_id UUID REFERENCES asset_insurance_claims(id);

-- ============================================================
-- 20. asset_registrations
-- ============================================================
CREATE TABLE asset_registrations (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        NOT NULL REFERENCES tenants(id),
  asset_id              UUID        NOT NULL REFERENCES company_assets(id),
  registration_type     TEXT        NOT NULL CHECK (registration_type IN ('state_vehicle','dot','ifta','irp','oversize_permit','equipment_cert')),
  state_code            CHAR(2),
  registration_number   TEXT,
  license_plate         TEXT,
  expiry_date           DATE,
  renewal_cost_cents    INTEGER,
  document_path         TEXT,
  notes                 TEXT,
  version               INTEGER     NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  created_by            UUID        REFERENCES users(id)
);
ALTER TABLE asset_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_registrations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_registrations
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_registrations_tenant ON asset_registrations(tenant_id);
CREATE INDEX idx_asset_registrations_tenant_deleted ON asset_registrations(tenant_id, deleted_at);
CREATE INDEX idx_asset_registrations_asset ON asset_registrations(tenant_id, asset_id);
CREATE INDEX idx_asset_registrations_expiry ON asset_registrations(tenant_id, asset_id, expiry_date);

-- ============================================================
-- 21. asset_fuel_logs
-- ============================================================
CREATE TABLE asset_fuel_logs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        NOT NULL REFERENCES tenants(id),
  asset_id              UUID        NOT NULL REFERENCES company_assets(id),
  log_date              DATE        NOT NULL,
  fuel_type             TEXT        NOT NULL CHECK (fuel_type IN ('gasoline','diesel','propane','electric','natural_gas','other')),
  gallons               NUMERIC(8,3),
  cost_per_gallon_cents INTEGER,
  total_cost_cents      INTEGER     NOT NULL,
  odometer_reading      NUMERIC(12,1),
  hours_reading         NUMERIC(12,1),
  is_full_fill          BOOLEAN     NOT NULL DEFAULT TRUE,
  state_code            CHAR(2),
  fuel_card_number      TEXT,
  station_name          TEXT,
  project_id            UUID        REFERENCES projects(id),
  budget_line_item_id   UUID        REFERENCES budget_line_items(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  created_by            UUID        REFERENCES users(id)
);
ALTER TABLE asset_fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_fuel_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_fuel_logs
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_fuel_logs_tenant ON asset_fuel_logs(tenant_id);
CREATE INDEX idx_asset_fuel_logs_tenant_deleted ON asset_fuel_logs(tenant_id, deleted_at);
CREATE INDEX idx_asset_fuel_logs_asset ON asset_fuel_logs(tenant_id, asset_id);
CREATE INDEX idx_asset_fuel_logs_asset_date ON asset_fuel_logs(tenant_id, asset_id, log_date);
CREATE INDEX idx_asset_fuel_logs_project ON asset_fuel_logs(tenant_id, project_id) WHERE project_id IS NOT NULL;

-- ============================================================
-- 22. asset_depreciation_schedules
-- ============================================================
CREATE TABLE asset_depreciation_schedules (
  id                                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                             UUID        NOT NULL REFERENCES tenants(id),
  asset_id                              UUID        NOT NULL UNIQUE REFERENCES company_assets(id),
  method                                TEXT        NOT NULL CHECK (method IN ('straight_line','declining_balance','sum_of_years','units_of_production')),
  useful_life_years                     INTEGER     NOT NULL,
  expected_total_units                  NUMERIC,
  salvage_value_cents                   INTEGER     NOT NULL DEFAULT 0,
  depreciation_start_date               DATE        NOT NULL,
  annual_depreciation_cents             INTEGER,
  current_book_value_cents              INTEGER,
  is_active                             BOOLEAN     NOT NULL DEFAULT TRUE,
  quickbooks_asset_account_id           TEXT,
  quickbooks_depreciation_account_id    TEXT,
  quickbooks_expense_account_id         TEXT,
  notes                                 TEXT,
  version                               INTEGER     NOT NULL DEFAULT 1,
  created_at                            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                            TIMESTAMPTZ,
  created_by                            UUID        REFERENCES users(id)
);
ALTER TABLE asset_depreciation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_depreciation_schedules FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_depreciation_schedules
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_depreciation_schedules_tenant ON asset_depreciation_schedules(tenant_id);
CREATE INDEX idx_asset_depreciation_schedules_tenant_deleted ON asset_depreciation_schedules(tenant_id, deleted_at);
CREATE INDEX idx_asset_depreciation_schedules_asset ON asset_depreciation_schedules(tenant_id, asset_id);

-- ============================================================
-- 23. asset_depreciation_entries — append-only
-- ============================================================
CREATE TABLE asset_depreciation_entries (
  id                            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                     UUID        NOT NULL REFERENCES tenants(id),
  schedule_id                   UUID        NOT NULL REFERENCES asset_depreciation_schedules(id),
  asset_id                      UUID        NOT NULL REFERENCES company_assets(id),
  period_start                  DATE        NOT NULL,
  period_end                    DATE        NOT NULL,
  units_in_period               NUMERIC,
  depreciation_amount_cents     INTEGER     NOT NULL,
  book_value_after_cents        INTEGER     NOT NULL,
  quickbooks_journal_entry_id   TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NO updated_at, NO deleted_at, NO version — append-only
);
ALTER TABLE asset_depreciation_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_depreciation_entries FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_depreciation_entries
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_depreciation_entries_tenant ON asset_depreciation_entries(tenant_id);
CREATE INDEX idx_asset_depreciation_entries_asset ON asset_depreciation_entries(tenant_id, asset_id);
CREATE INDEX idx_asset_depreciation_entries_schedule_period ON asset_depreciation_entries(tenant_id, schedule_id, period_start);

-- ============================================================
-- 24. asset_documents
-- ============================================================
CREATE TABLE asset_documents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  asset_id        UUID        NOT NULL REFERENCES company_assets(id),
  doc_type        TEXT        NOT NULL CHECK (doc_type IN ('title','registration','insurance','warranty','purchase_agreement','lease','rental_agreement','operator_manual','inspection_report','recall_notice','calibration_cert','lien_release','other')),
  title           TEXT        NOT NULL,
  storage_path    TEXT        NOT NULL,
  file_size_bytes INTEGER,
  expiry_date     DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  created_by      UUID        REFERENCES users(id)
);
ALTER TABLE asset_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_documents FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_documents
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_documents_tenant ON asset_documents(tenant_id);
CREATE INDEX idx_asset_documents_tenant_deleted ON asset_documents(tenant_id, deleted_at);
CREATE INDEX idx_asset_documents_asset ON asset_documents(tenant_id, asset_id);

-- ============================================================
-- 25. asset_recalls
-- ============================================================
CREATE TABLE asset_recalls (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID        NOT NULL REFERENCES tenants(id),
  asset_id                UUID        NOT NULL REFERENCES company_assets(id),
  recall_number           TEXT,
  recall_date             DATE        NOT NULL,
  source                  TEXT        NOT NULL CHECK (source IN ('nhtsa','manufacturer','osha','manual')),
  description             TEXT        NOT NULL,
  severity                TEXT        NOT NULL CHECK (severity IN ('safety_critical','non_safety')),
  remedy_description      TEXT,
  status                  TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','scheduled','completed','not_applicable')),
  scheduled_service_date  DATE,
  completed_date          DATE,
  service_record_id       UUID        REFERENCES asset_service_records(id),
  document_path           TEXT,
  notes                   TEXT,
  version                 INTEGER     NOT NULL DEFAULT 1,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,
  created_by              UUID        REFERENCES users(id)
);
ALTER TABLE asset_recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_recalls FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_recalls
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_recalls_tenant ON asset_recalls(tenant_id);
CREATE INDEX idx_asset_recalls_tenant_deleted ON asset_recalls(tenant_id, deleted_at);
CREATE INDEX idx_asset_recalls_asset ON asset_recalls(tenant_id, asset_id);
CREATE INDEX idx_asset_recalls_severity ON asset_recalls(tenant_id, severity);

-- ============================================================
-- 26. asset_calibration_records
-- ============================================================
CREATE TABLE asset_calibration_records (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        NOT NULL REFERENCES tenants(id),
  asset_id              UUID        NOT NULL REFERENCES company_assets(id),
  calibration_date      DATE        NOT NULL,
  next_calibration_due  DATE        NOT NULL,
  performed_by          TEXT        NOT NULL,
  certificate_number    TEXT,
  result                TEXT        NOT NULL CHECK (result IN ('pass','fail','adjusted')),
  document_path         TEXT,
  notes                 TEXT,
  version               INTEGER     NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  created_by            UUID        REFERENCES users(id)
);
ALTER TABLE asset_calibration_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_calibration_records FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON asset_calibration_records
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE INDEX idx_asset_calibration_records_tenant ON asset_calibration_records(tenant_id);
CREATE INDEX idx_asset_calibration_records_tenant_deleted ON asset_calibration_records(tenant_id, deleted_at);
CREATE INDEX idx_asset_calibration_records_asset ON asset_calibration_records(tenant_id, asset_id);
CREATE INDEX idx_asset_calibration_records_due ON asset_calibration_records(tenant_id, asset_id, next_calibration_due);
