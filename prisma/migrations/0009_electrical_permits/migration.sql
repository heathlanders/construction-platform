-- Migration 0009: Electrical Permits
-- Adds permits table and extends inspections with permit linkage + trade/sequence fields.
-- permits must be created BEFORE the FK on inspections.

-- ─── permits ─────────────────────────────────────────────────────────────────
-- Full AHJ permit lifecycle: application → approval → inspections → final close.
-- permit_type is scoped to 'electrical' at v1.0; extend CHECK in v1.1 for plumbing/hvac.
-- jurisdiction fields (state_code, nec_edition, jurisdiction_notes) are denormalized
-- from the static electrical-codes library at permit creation time so the permit
-- record remains accurate even if the static library is updated later.

CREATE TABLE permits (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID         NOT NULL REFERENCES tenants(id),
  project_id           UUID         NOT NULL REFERENCES projects(id),

  -- Scope
  permit_type          TEXT         NOT NULL DEFAULT 'electrical'
                                    CHECK (permit_type IN ('electrical')),
  building_type        TEXT         NOT NULL,

  -- Jurisdiction (denormalized at creation from electrical-codes library)
  state_code           CHAR(2)      NOT NULL,
  nec_edition          TEXT         NOT NULL,
  jurisdiction_notes   TEXT,

  -- AHJ (Authority Having Jurisdiction)
  ahj_name             TEXT,
  ahj_address          TEXT,
  ahj_phone            TEXT,
  ahj_contact_name     TEXT,

  -- Permit identity
  permit_number        TEXT,

  -- Workflow status — TEXT + CHECK (not ENUM: easier to extend without ALTER TYPE)
  status               TEXT         NOT NULL DEFAULT 'draft'
                                    CHECK (status IN (
                                      'draft',
                                      'submitted',
                                      'approved',
                                      'active',
                                      'failed_inspection',
                                      'closed',
                                      'voided'
                                    )),

  -- Dates
  applied_date         DATE,
  approved_date        DATE,
  expiry_date          DATE,

  -- Notes
  notes                TEXT,

  -- Universal column pattern
  version              INTEGER      NOT NULL DEFAULT 1,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,
  created_by           UUID         REFERENCES users(id)
);

ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE permits FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON permits
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE INDEX idx_permits_tenant         ON permits(tenant_id);
CREATE INDEX idx_permits_tenant_deleted ON permits(tenant_id, deleted_at);
CREATE INDEX idx_permits_tenant_project ON permits(tenant_id, project_id);
CREATE INDEX idx_permits_tenant_status  ON permits(tenant_id, status);
CREATE INDEX idx_permits_tenant_updated ON permits(tenant_id, updated_at);

-- ─── inspections extensions ───────────────────────────────────────────────────
-- All columns nullable — fully backward-compatible with existing generic inspections.
-- permit_id links a milestone to its governing permit.
-- result ('pass'/'fail'/'partial') is the formal AHJ result; the existing status
-- column ('scheduled','passed','failed','requires_action') remains the UI-facing state.
-- Route handler syncs status from result when result is set.

ALTER TABLE inspections
  ADD COLUMN permit_id         UUID         REFERENCES permits(id),
  ADD COLUMN trade_type        TEXT,
  ADD COLUMN inspection_type   TEXT,
  ADD COLUMN sequence_order    INTEGER,
  ADD COLUMN inspector_name    TEXT,
  ADD COLUMN correction_notice TEXT,
  ADD COLUMN result            TEXT
                               CHECK (result IN ('pass', 'fail', 'partial'));

-- Indexes for new query patterns
CREATE INDEX idx_inspections_permit_id ON inspections(permit_id)
  WHERE permit_id IS NOT NULL;

CREATE INDEX idx_inspections_trade_type ON inspections(tenant_id, trade_type)
  WHERE trade_type IS NOT NULL;

CREATE INDEX idx_inspections_sequence ON inspections(permit_id, sequence_order)
  WHERE permit_id IS NOT NULL;
