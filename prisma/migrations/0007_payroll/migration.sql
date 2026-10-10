-- Migration 0007: Payroll integration foundation
-- tenant_integrations: persistent token storage for QB/Gusto/ADP (replaces Redis 24h TTL)
-- user_payroll_settings: per-employee rate, type, OT multiplier, provider IDs

-- ─── tenant_integrations ────────────────────────────────────────────────────

CREATE TABLE tenant_integrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  provider          TEXT NOT NULL,       -- 'quickbooks', 'gusto', 'adp'
  access_token_enc  TEXT,                -- AES-256-GCM encrypted at rest
  refresh_token_enc TEXT,                -- AES-256-GCM encrypted at rest
  token_expires_at  TIMESTAMPTZ,
  external_id       TEXT,                -- QB: realmId | Gusto: company_uuid | ADP: org_id
  status            TEXT NOT NULL DEFAULT 'active',  -- active, disconnected, error
  last_sync_at      TIMESTAMPTZ,
  sync_error        TEXT,
  version           INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id),
  UNIQUE (tenant_id, provider)
);

CREATE INDEX idx_tenant_integrations_tenant         ON tenant_integrations(tenant_id);
CREATE INDEX idx_tenant_integrations_tenant_deleted ON tenant_integrations(tenant_id, deleted_at);
CREATE INDEX idx_tenant_integrations_provider       ON tenant_integrations(tenant_id, provider);

ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_integrations FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant_integrations
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ─── user_payroll_settings ──────────────────────────────────────────────────

CREATE TABLE user_payroll_settings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id),
  user_id                   UUID NOT NULL UNIQUE REFERENCES users(id),
  employment_type           TEXT NOT NULL DEFAULT 'w2',        -- w2, contractor_1099
  default_hourly_rate_cents INTEGER NOT NULL DEFAULT 0,        -- fallback when time_entry has no rate
  overtime_multiplier       NUMERIC(4,2) NOT NULL DEFAULT 1.50,
  pay_frequency             TEXT NOT NULL DEFAULT 'biweekly',  -- weekly, biweekly, semimonthly, monthly
  gusto_employee_id         TEXT,
  adp_worker_aoid           TEXT,   -- ADP Assigned Organization Identifier
  version                   INTEGER NOT NULL DEFAULT 1,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ,
  created_by                UUID REFERENCES users(id)
);

CREATE INDEX idx_user_payroll_settings_tenant ON user_payroll_settings(tenant_id);
CREATE INDEX idx_user_payroll_settings_user   ON user_payroll_settings(tenant_id, user_id);
CREATE INDEX idx_user_payroll_settings_tenant_deleted ON user_payroll_settings(tenant_id, deleted_at);

ALTER TABLE user_payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payroll_settings FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON user_payroll_settings
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Version triggers
CREATE TRIGGER trg_version_tenant_integrations
  BEFORE UPDATE ON tenant_integrations FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_user_payroll_settings
  BEFORE UPDATE ON user_payroll_settings FOR EACH ROW EXECUTE FUNCTION increment_version();

-- updated_at triggers
CREATE TRIGGER trg_updated_at_tenant_integrations
  BEFORE UPDATE ON tenant_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at_user_payroll_settings
  BEFORE UPDATE ON user_payroll_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
