-- 0032_cross_tenant_rfi — link an RFI to a GC↔Sub connection for cross-tenant sharing
-- Locked decisions: A-07 (bridge via shared_project_events), T-44/T-45 (app-layer membership guard), P-02 (user-accessible v1.1)
--
-- When rfis.connection_id is set, the RFI is mirrored into shared_project_events
-- (event_type 'rfi.created'/'rfi.updated') with a WHITELISTED payload. The mirror is
-- application-layer only (rfis stays RLS-scoped to the GC; shared_project_events is RLS-exempt, T-44).
-- Nullable: the vast majority of RFIs are internal and never cross the bridge.

ALTER TABLE rfis
  ADD COLUMN connection_id UUID REFERENCES tenant_connections(id);

-- Partial index — only the small subset of shared RFIs.
CREATE INDEX idx_rfis_connection
  ON rfis (tenant_id, connection_id)
  WHERE connection_id IS NOT NULL;
