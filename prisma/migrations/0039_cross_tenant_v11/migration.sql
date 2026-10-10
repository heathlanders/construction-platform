-- Cross-Tenant v1.1 Bridge — user-accessible GC↔Sub collaboration (P-02)
-- tenant_connections gains invite context (GC project link, scope, contract value) and a
-- 'rejected' status for sub-side decline. projects gains connection_id: non-null marks a
-- bridge-instantiated mirror project in the sub's tenant (Doc 07 §6).

ALTER TABLE tenant_connections
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id),
  ADD COLUMN IF NOT EXISTS scope_description TEXT,
  ADD COLUMN IF NOT EXISTS contract_value_cents BIGINT;

ALTER TABLE tenant_connections DROP CONSTRAINT IF EXISTS tenant_connections_status_check;
ALTER TABLE tenant_connections ADD CONSTRAINT tenant_connections_status_check
  CHECK (status IN ('pending', 'active', 'revoked', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_tenant_connections_project
  ON tenant_connections(project_id) WHERE project_id IS NOT NULL;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES tenant_connections(id);

CREATE INDEX IF NOT EXISTS idx_projects_connection
  ON projects(tenant_id, connection_id) WHERE connection_id IS NOT NULL AND deleted_at IS NULL;

-- Email → tenant lookup for connection invites. users is FORCE RLS; this SECURITY DEFINER
-- function (owned by the migration superuser, which bypasses RLS) is the one governed
-- exception: it returns tenant ids ONLY, exact-match, active users, LIMIT 2 so the caller
-- can detect ambiguity without enumerating tenants.
CREATE OR REPLACE FUNCTION cross_tenant_lookup_tenant_by_email(p_email TEXT)
RETURNS TABLE(tenant_id UUID)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT u.tenant_id
  FROM users u
  WHERE lower(u.email) = lower(p_email)
    AND u.deleted_at IS NULL
    AND u.status = 'active'
  LIMIT 2;
$$;

GRANT EXECUTE ON FUNCTION cross_tenant_lookup_tenant_by_email(TEXT) TO platform_user;
