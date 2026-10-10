-- Migration 0011: Clock In/Out time tracking
-- tenant_settings: org-level configuration (time_tracking_mode = manual | clock_in_out)
-- time_punches: individual clock-in/clock-out events that auto-create time_entries on close

-- ─── tenant_settings ─────────────────────────────────────────────────────────

CREATE TABLE tenant_settings (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID        NOT NULL UNIQUE REFERENCES tenants(id),
  time_tracking_mode   TEXT        NOT NULL DEFAULT 'manual'
                                   CHECK (time_tracking_mode IN ('manual', 'clock_in_out')),
  version              INTEGER     NOT NULL DEFAULT 1,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by           UUID        REFERENCES users(id)
);

CREATE INDEX idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant_settings
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE TRIGGER trg_version_tenant_settings
  BEFORE UPDATE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_updated_at_tenant_settings
  BEFORE UPDATE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── time_punches ─────────────────────────────────────────────────────────────
-- One punch = one continuous work period on one project.
-- Multiple punches per day per worker (one per project switch).
-- clock_out_at IS NULL = punch is still open.
-- Partial unique index ensures one open punch per user at a time (DB-level).

CREATE TABLE time_punches (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id),
  user_id          UUID        NOT NULL REFERENCES users(id),
  project_id       UUID        REFERENCES projects(id),
  cost_code_id     UUID        REFERENCES cost_codes(id),
  clock_in_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out_at     TIMESTAMPTZ,                               -- NULL = still clocked in
  hours_worked     NUMERIC(5,2),                              -- calculated and stored on close
  auto_clocked_out BOOLEAN     NOT NULL DEFAULT FALSE,        -- TRUE when closed by midnight job
  notes            TEXT,
  time_entry_id    UUID        REFERENCES time_entries(id),   -- set on close
  version          INTEGER     NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  created_by       UUID        REFERENCES users(id)
);

-- One open punch per user at the DB level (prevents race conditions)
CREATE UNIQUE INDEX idx_time_punches_open_per_user
  ON time_punches(tenant_id, user_id)
  WHERE clock_out_at IS NULL AND deleted_at IS NULL;

CREATE INDEX idx_time_punches_tenant_id      ON time_punches(tenant_id);
CREATE INDEX idx_time_punches_tenant_deleted ON time_punches(tenant_id, deleted_at);
CREATE INDEX idx_time_punches_tenant_updated ON time_punches(tenant_id, updated_at);
CREATE INDEX idx_time_punches_user_date
  ON time_punches(tenant_id, user_id, clock_in_at DESC);
CREATE INDEX idx_time_punches_open
  ON time_punches(tenant_id, clock_out_at)
  WHERE clock_out_at IS NULL AND deleted_at IS NULL;
CREATE INDEX idx_time_punches_project
  ON time_punches(tenant_id, project_id, clock_in_at DESC);

ALTER TABLE time_punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_punches FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON time_punches
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE TRIGGER trg_version_time_punches
  BEFORE UPDATE ON time_punches FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_updated_at_time_punches
  BEFORE UPDATE ON time_punches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
