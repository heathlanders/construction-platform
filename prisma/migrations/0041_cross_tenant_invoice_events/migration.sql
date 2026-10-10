-- 0041_cross_tenant_invoice_events — link an invoice to a GC↔Sub connection (Doc 07 §5.1 invoice workflow)
-- Locked decisions: A-07 (bridge via shared_project_events), T-44/T-45 (app-layer membership guard), P-02 (v1.1)
-- Mirrors 0032 (rfis) / 0033 (change_orders, submittals).
--
-- Direction is REVERSED vs rfis/COs: the SUB links the invoice (sub bills the GC). The GC never
-- holds an invoice row — it reads invoice.submitted/approved/paid events off the bridge ledger.
-- When invoices.connection_id is set, status='sent' mirrors 'invoice.submitted' with a WHITELISTED
-- payload (invoice_id, amount_cents, status, due_date — no contract/retainage/provider internals).
-- Nullable: most invoices are internal and never cross the bridge.
-- Lien waivers (lien_waiver.requested/signed) are event-ledger-only — deliberately NO table.

ALTER TABLE invoices
  ADD COLUMN connection_id UUID REFERENCES tenant_connections(id);

-- Partial index — only the small subset of shared invoices.
CREATE INDEX idx_invoices_connection
  ON invoices (tenant_id, connection_id)
  WHERE connection_id IS NOT NULL;
