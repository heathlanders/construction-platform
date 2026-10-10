-- Cross-Tenant v1.1 follow-up — Doc 07 §5 per-connection permissions + §8 closeout.
-- tenant_connections stays RLS-EXEMPT (T-44); permissions are enforced at the app layer
-- inside publishIfActive (bridge.ts), LAYERED ON TOP of the payload whitelist (the leak
-- floor — CLAUDE.md rules 11-13). Default = §5.1 defaults (core ON, all optional ON,
-- labor visibility OFF) so every existing connection keeps exactly its current behavior.

ALTER TABLE tenant_connections
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{
    "core_events": {"task_updates": true, "inspection_events": true, "invoice_workflow": true, "change_orders": true, "lien_waivers": true},
    "optional_events": {"daily_reports": true, "rfi_events": true, "submittal_events": true, "messages": true},
    "labor_visibility": {"show_total_hours": false, "show_crew_names": false, "show_labor_costs": false},
    "negotiated_at": null,
    "accepted_by_sub": true
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS proposed_permissions JSONB,
  ADD COLUMN IF NOT EXISTS closed_reason TEXT,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- proposed_permissions shape (app-enforced): { permissions: <§5 object>, proposed_by_tenant_id, proposed_at }

ALTER TABLE tenant_connections DROP CONSTRAINT IF EXISTS tenant_connections_status_check;
ALTER TABLE tenant_connections ADD CONSTRAINT tenant_connections_status_check
  CHECK (status IN ('pending', 'active', 'revoked', 'rejected', 'completed'));

ALTER TABLE tenant_connections DROP CONSTRAINT IF EXISTS tenant_connections_closed_reason_check;
ALTER TABLE tenant_connections ADD CONSTRAINT tenant_connections_closed_reason_check
  CHECK (closed_reason IS NULL OR closed_reason IN ('completed', 'terminated_for_cause', 'mutual_agreement', 'other'));
