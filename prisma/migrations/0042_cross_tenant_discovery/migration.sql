-- ============================================================
-- 0042_cross_tenant_discovery — Doc 07 §3.3 opt-in fuzzy discovery
-- ============================================================
-- pg_trgm powers the fuzzy company-name match (similarity()).
-- ⚠️ Never use set_limit() or the % operator at runtime — both read the
-- session GUC pg_trgm.similarity_threshold, which leaks across PgBouncer
-- transaction-mode pooling (same class as T-48). Queries must use the
-- stateless form: similarity(a, b) >= <threshold>.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- NO RLS per T-44 — cross-tenant table, application-layer access control only.
-- Opt-in by construction: a row only ever contains data the tenant's OWNER
-- explicitly chose to publish to the directory (discoverable defaults FALSE,
-- so untouched tenants are unfindable). This table IS the leak whitelist —
-- never add columns beyond name-adjacent directory fields.
CREATE TABLE tenant_discovery_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL UNIQUE REFERENCES tenants(id),
  discoverable BOOLEAN NOT NULL DEFAULT FALSE,
  trades       TEXT[]    NOT NULL DEFAULT '{}',  -- canonical taxonomy keys (T-64)
  states       CHAR(2)[] NOT NULL DEFAULT '{}',  -- service region (US state codes)
  service_area TEXT,                             -- free-text blurb, e.g. "Dane County WI"
  updated_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discovery_discoverable
  ON tenant_discovery_profiles (discoverable) WHERE discoverable;
