-- Migration 0005: Timecards table for weekly timecard approval workflow
-- Locked decisions: T-12 (optimistic locking), T-03 (UUID), T-04 (TIMESTAMPTZ)

CREATE TABLE timecards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  user_id        UUID NOT NULL REFERENCES users(id),
  week_start     DATE NOT NULL,                          -- Monday of the ISO week
  status         TEXT NOT NULL DEFAULT 'draft',          -- draft, submitted, approved, rejected
  total_hours    NUMERIC(6,2) NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(6,2) NOT NULL DEFAULT 0,        -- hours above 40 for the week
  submitted_at   TIMESTAMPTZ,
  approved_by    UUID REFERENCES users(id),
  approved_at    TIMESTAMPTZ,
  rejection_note TEXT,
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,
  created_by     UUID REFERENCES users(id)
);

-- Only one active (non-rejected) timecard per user per week
CREATE UNIQUE INDEX idx_timecards_user_week
  ON timecards(tenant_id, user_id, week_start)
  WHERE status != 'rejected' AND deleted_at IS NULL;

CREATE INDEX idx_timecards_tenant_id ON timecards(tenant_id);
CREATE INDEX idx_timecards_tenant_status ON timecards(tenant_id, status);
CREATE INDEX idx_timecards_tenant_deleted ON timecards(tenant_id, deleted_at);
CREATE INDEX idx_timecards_tenant_updated ON timecards(tenant_id, updated_at);

-- RLS: tenants only see their own timecards
ALTER TABLE timecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY timecards_tenant_isolation ON timecards
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
ALTER TABLE timecards FORCE ROW LEVEL SECURITY;
