-- 0033_cross_tenant_co_submittal — share change orders + submittals across a GC↔Sub connection
-- Locked decisions: A-07, T-44/T-45, P-02. Mirrors 0032 (rfis.connection_id).
--
-- When connection_id is set, the object is mirrored into shared_project_events with a
-- WHITELISTED payload (change_order.created/updated, submittal.created/updated). Nullable —
-- the vast majority of change orders / submittals are internal and never cross the bridge.

ALTER TABLE change_orders
  ADD COLUMN connection_id UUID REFERENCES tenant_connections(id);
CREATE INDEX idx_change_orders_connection
  ON change_orders (tenant_id, connection_id)
  WHERE connection_id IS NOT NULL;

ALTER TABLE submittals
  ADD COLUMN connection_id UUID REFERENCES tenant_connections(id);
CREATE INDEX idx_submittals_connection
  ON submittals (tenant_id, connection_id)
  WHERE connection_id IS NOT NULL;
