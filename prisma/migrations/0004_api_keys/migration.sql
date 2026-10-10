-- 0004_api_keys — Enterprise API key management
-- Locked decisions: PR-04 (Enterprise), T-03

CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  name          TEXT NOT NULL,
  key_hash      TEXT NOT NULL,
  key_prefix    TEXT NOT NULL DEFAULT '',
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id)
);

CREATE INDEX idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_tenant_revoked ON api_keys(tenant_id, revoked_at);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
