-- Migration 0008: Blueprint Intelligence
-- blueprint_analyses: tracks a parse/analysis job for a project
-- blueprint_sheets: individual PDF pages extracted from a blueprint set
-- blueprint_proposed_tasks: AI- or template-generated tasks pending user review

-- ─── blueprint_analyses ──────────────────────────────────────────────────────

CREATE TABLE blueprint_analyses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  project_id            UUID NOT NULL REFERENCES projects(id),
  document_id           UUID REFERENCES documents(id),   -- NULL for template-only runs
  building_type         TEXT NOT NULL,                   -- 'residential_sf', 'residential_mf', 'commercial', 'industrial'
  status                TEXT NOT NULL DEFAULT 'pending', -- pending, processing, review_ready, imported, failed
  sheet_count           INTEGER,
  extracted_task_count  INTEGER,
  import_metadata       JSONB,                           -- summary: trades found, phases found, counts
  version               INTEGER NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  created_by            UUID REFERENCES users(id)
);

CREATE INDEX idx_blueprint_analyses_tenant         ON blueprint_analyses(tenant_id);
CREATE INDEX idx_blueprint_analyses_tenant_deleted ON blueprint_analyses(tenant_id, deleted_at);
CREATE INDEX idx_blueprint_analyses_project        ON blueprint_analyses(tenant_id, project_id);
CREATE INDEX idx_blueprint_analyses_status         ON blueprint_analyses(tenant_id, status);

ALTER TABLE blueprint_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_analyses FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON blueprint_analyses
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ─── blueprint_sheets ─────────────────────────────────────────────────────────

CREATE TABLE blueprint_sheets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  analysis_id     UUID NOT NULL REFERENCES blueprint_analyses(id),
  sheet_number    TEXT,           -- e.g. 'E1.0', 'P2.3', 'A-101'
  sheet_title     TEXT,
  discipline      TEXT,           -- 'architectural', 'structural', 'electrical', 'plumbing', 'mechanical', 'civil', 'specs'
  page_number     INTEGER,
  storage_path    TEXT,           -- pre-rendered page image in live storage (never direct URL)
  status          TEXT NOT NULL DEFAULT 'pending',   -- pending, analyzed, failed
  analysis_result JSONB,          -- raw AI/stub output for this sheet
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blueprint_sheets_tenant      ON blueprint_sheets(tenant_id);
CREATE INDEX idx_blueprint_sheets_analysis    ON blueprint_sheets(tenant_id, analysis_id);
CREATE INDEX idx_blueprint_sheets_status      ON blueprint_sheets(tenant_id, status);

ALTER TABLE blueprint_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_sheets FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON blueprint_sheets
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ─── blueprint_proposed_tasks ─────────────────────────────────────────────────

CREATE TABLE blueprint_proposed_tasks (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id),
  analysis_id              UUID NOT NULL REFERENCES blueprint_analyses(id),
  sheet_id                 UUID REFERENCES blueprint_sheets(id),
  title                    TEXT NOT NULL,
  description              TEXT,
  trade_type               TEXT,   -- 'electrical', 'plumbing', 'hvac', 'framing', 'concrete', 'roofing', 'architectural', 'civil', 'structural', 'general'
  phase                    TEXT,   -- 'site_prep', 'foundation', 'framing', 'roofing', 'rough_in', 'inspections', 'insulation', 'drywall', 'finishes_interior', 'finishes_exterior', 'sitework', 'commissioning', 'punch'
  csi_division             TEXT,   -- e.g. '26 00 00' (Electrical), '22 00 00' (Plumbing)
  estimated_duration_days  INTEGER,
  sort_order               INTEGER,
  review_status            TEXT NOT NULL DEFAULT 'pending',  -- pending, accepted, rejected, modified
  schedule_task_id         UUID REFERENCES schedule_tasks(id),  -- set on import
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blueprint_proposed_tasks_tenant   ON blueprint_proposed_tasks(tenant_id);
CREATE INDEX idx_blueprint_proposed_tasks_analysis ON blueprint_proposed_tasks(tenant_id, analysis_id);
CREATE INDEX idx_blueprint_proposed_tasks_trade    ON blueprint_proposed_tasks(tenant_id, trade_type);
CREATE INDEX idx_blueprint_proposed_tasks_phase    ON blueprint_proposed_tasks(tenant_id, phase);
CREATE INDEX idx_blueprint_proposed_tasks_status   ON blueprint_proposed_tasks(tenant_id, review_status);

ALTER TABLE blueprint_proposed_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_proposed_tasks FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON blueprint_proposed_tasks
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);
