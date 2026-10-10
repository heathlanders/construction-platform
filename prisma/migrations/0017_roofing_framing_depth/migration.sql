-- Migration 0017: Roofing & Framing QA depth
-- Adds a QA child table to each of the two thin structural trades, paralleling
-- concrete_test_records (0016):
--   roofing_qa_records       — installation / manufacturer-warranty QA inspections with
--                              optional measured values (fastener pull lbf, seam-probe pass, etc.)
--   framing_correction_items — punch items raised by a framing inspection, tracked to resolution

-- ─── roofing_qa_records (child of roofing_systems) ─────────────────────────────
CREATE TABLE roofing_qa_records (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID         NOT NULL REFERENCES tenants(id),
  roofing_system_id   UUID         NOT NULL REFERENCES roofing_systems(id),

  qa_type             TEXT         NOT NULL
                                   CHECK (qa_type IN (
                                     'deck',                 -- substrate/deck condition
                                     'underlayment_dry_in',  -- dry-in / underlayment
                                     'flashing',             -- flashing & penetrations
                                     'seam_weld',            -- TPO/EPDM seam weld/probe test
                                     'fastener_pull',        -- fastener pull-out test (lbf)
                                     'water_test',           -- flood / water test
                                     'manufacturer_warranty',-- manufacturer warranty inspection
                                     'final',
                                     'other'
                                   )),
  inspection_date     DATE,
  result              TEXT         NOT NULL DEFAULT 'pending'
                                   CHECK (result IN ('pass', 'fail', 'pending')),
  measured_value      NUMERIC(10,2),           -- e.g. pull-out lbf, probe pass count
  unit                TEXT,                    -- 'lbf', 'count', 'in', etc.
  inspector_name      TEXT,
  notes               TEXT,

  version             INTEGER      NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  created_by          UUID         REFERENCES users(id)
);

ALTER TABLE roofing_qa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE roofing_qa_records FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON roofing_qa_records
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE INDEX idx_roofing_qa_records_tenant_id      ON roofing_qa_records(tenant_id);
CREATE INDEX idx_roofing_qa_records_tenant_deleted ON roofing_qa_records(tenant_id, deleted_at);
CREATE INDEX idx_roofing_qa_records_tenant_system  ON roofing_qa_records(tenant_id, roofing_system_id);
CREATE INDEX idx_roofing_qa_records_tenant_updated ON roofing_qa_records(tenant_id, updated_at);

-- ─── framing_correction_items (child of framing_inspections) ───────────────────
CREATE TABLE framing_correction_items (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID         NOT NULL REFERENCES tenants(id),
  framing_inspection_id  UUID         NOT NULL REFERENCES framing_inspections(id),

  description            TEXT         NOT NULL,
  location               TEXT,                 -- e.g. 'NW corner, bedroom 2'
  severity               TEXT         NOT NULL DEFAULT 'minor'
                                      CHECK (severity IN ('minor', 'major', 'safety')),
  status                 TEXT         NOT NULL DEFAULT 'open'
                                      CHECK (status IN ('open', 'in_progress', 'resolved')),
  resolved_at            TIMESTAMPTZ,
  resolved_by            UUID         REFERENCES users(id),
  notes                  TEXT,

  version                INTEGER      NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,
  created_by             UUID         REFERENCES users(id)
);

ALTER TABLE framing_correction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE framing_correction_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON framing_correction_items
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE INDEX idx_framing_corr_items_tenant_id        ON framing_correction_items(tenant_id);
CREATE INDEX idx_framing_corr_items_tenant_deleted   ON framing_correction_items(tenant_id, deleted_at);
CREATE INDEX idx_framing_corr_items_tenant_inspection ON framing_correction_items(tenant_id, framing_inspection_id);
CREATE INDEX idx_framing_corr_items_tenant_status    ON framing_correction_items(tenant_id, status);
CREATE INDEX idx_framing_corr_items_tenant_updated   ON framing_correction_items(tenant_id, updated_at);
