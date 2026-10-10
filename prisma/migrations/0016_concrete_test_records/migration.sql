-- Migration 0016: Concrete Test Records (QA depth for concrete pours)
-- Child of concrete_pours. Captures field/lab strength & quality tests required by
-- ACI 318 / IBC Chapter 19: cylinder compressive breaks (typically 7-day and 28-day),
-- slump, air content, and concrete temperature. Each test carries the specified target
-- and the measured value, and a pass/fail result against spec.

CREATE TABLE concrete_test_records (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID         NOT NULL REFERENCES tenants(id),
  pour_id                 UUID         NOT NULL REFERENCES concrete_pours(id),

  test_type               TEXT         NOT NULL
                                       CHECK (test_type IN (
                                         'cylinder_compressive',  -- psi at a given age
                                         'slump',                 -- inches
                                         'air_content',           -- percent
                                         'temperature',           -- degrees F
                                         'other'
                                       )),
  test_date               DATE,
  age_days                INTEGER,                 -- cylinder break age (e.g. 7, 28)
  specified_value         NUMERIC(10,2),           -- design target (f'c psi, slump in, air %, temp F)
  measured_value          NUMERIC(10,2),           -- measured result
  unit                    TEXT,                    -- 'psi' | 'in' | 'pct' | 'F'
  result                  TEXT         NOT NULL DEFAULT 'pending'
                                       CHECK (result IN ('pass', 'fail', 'pending')),
  sample_id               TEXT,                    -- cylinder set / sample identifier
  lab_name                TEXT,
  notes                   TEXT,

  -- Universal column pattern
  version                 INTEGER      NOT NULL DEFAULT 1,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,
  created_by              UUID         REFERENCES users(id)
);

ALTER TABLE concrete_test_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE concrete_test_records FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON concrete_test_records
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE INDEX idx_concrete_test_records_tenant_id      ON concrete_test_records(tenant_id);
CREATE INDEX idx_concrete_test_records_tenant_deleted ON concrete_test_records(tenant_id, deleted_at);
CREATE INDEX idx_concrete_test_records_tenant_pour    ON concrete_test_records(tenant_id, pour_id);
CREATE INDEX idx_concrete_test_records_tenant_updated ON concrete_test_records(tenant_id, updated_at);
