-- Migration 0026: Blueprint gap hardening (Phase 2 — B2.2)
-- The three blueprint RLS policies (migration 0008) were USING-only. USING gates
-- SELECT/UPDATE/DELETE row visibility but does NOT constrain INSERT/UPDATE row values —
-- so a WITH CHECK is required to stop a row being written with a tenant_id other than the
-- current tenant context. Add WITH CHECK mirroring USING to every blueprint table.

ALTER POLICY tenant_isolation ON blueprint_analyses
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

ALTER POLICY tenant_isolation ON blueprint_sheets
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

ALTER POLICY tenant_isolation ON blueprint_proposed_tasks
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);
