-- ============================================================
-- 0002_reconciliation_layer — New tables + columns for
-- cross-domain data flow (financial, schedule, contracts)
-- ============================================================
-- Prompted by: construction PM gap analysis (Session 7)
-- Gaps addressed: cost, risk, schedule, contracts, payments
--
-- Apply order: 1) ENUMs, 2) new tables (FK order),
--              3) ALTER existing tables, 4) RLS policies, 5) indexes
--
-- Locked decisions: A-03, T-02, T-12, T-48
-- ============================================================

-- ─── New ENUMs ────────────────────────────────────────────────────────────────

CREATE TYPE vendor_type AS ENUM ('subcontractor', 'supplier', 'equipment', 'other');
CREATE TYPE contract_type AS ENUM ('prime_contract', 'subcontract', 'purchase_order');
CREATE TYPE contract_status AS ENUM ('draft', 'pending_signature', 'executed', 'complete', 'terminated');
CREATE TYPE vendor_bid_status AS ENUM ('invited', 'submitted', 'awarded', 'declined');
CREATE TYPE schedule_task_status AS ENUM ('not_started', 'in_progress', 'complete', 'on_hold');

-- ─── New tables (FK dependency order) ───────────────────────────────────────

-- Vendors: subcontractors, suppliers, equipment vendors
CREATE TABLE vendors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  name              TEXT NOT NULL,
  vendor_type       vendor_type NOT NULL DEFAULT 'subcontractor',
  trade_type        TEXT,
  contact_name      TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  is_preferred      BOOLEAN NOT NULL DEFAULT FALSE,
  is_prequalified   BOOLEAN NOT NULL DEFAULT FALSE,
  performance_notes TEXT,
  version           INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id)
);

-- Schedule tasks: basic project schedule (self-referencing predecessor)
CREATE TABLE schedule_tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  project_id            UUID NOT NULL REFERENCES projects(id),
  title                 TEXT NOT NULL,
  description           TEXT,
  status                schedule_task_status NOT NULL DEFAULT 'not_started',
  percent_complete      NUMERIC(5,2) NOT NULL DEFAULT 0,
  planned_start         DATE,
  planned_end           DATE,
  actual_start          DATE,
  actual_end            DATE,
  assigned_to_user_id   UUID REFERENCES users(id),
  predecessor_task_id   UUID REFERENCES schedule_tasks(id),
  show_in_client_portal BOOLEAN NOT NULL DEFAULT FALSE,
  version               INTEGER NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  created_by            UUID REFERENCES users(id)
);

-- Milestones: billing/schedule milestones
CREATE TABLE milestones (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  project_id       UUID NOT NULL REFERENCES projects(id),
  title            TEXT NOT NULL,
  schedule_task_id UUID REFERENCES schedule_tasks(id),
  due_date         DATE,
  completed_at     TIMESTAMPTZ,
  version          INTEGER NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  created_by       UUID REFERENCES users(id)
);

-- Contracts: CRITICAL governing document tying invoices, COs, and payments
-- current_value_cents = original_value_cents + approved_co_value_cents (computed in app layer)
CREATE TABLE contracts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  project_id              UUID NOT NULL REFERENCES projects(id),
  contract_type           contract_type NOT NULL,
  vendor_id               UUID REFERENCES vendors(id),   -- NULL = prime contract with owner
  original_value_cents    INTEGER NOT NULL DEFAULT 0,    -- T-02: never float
  approved_co_value_cents INTEGER NOT NULL DEFAULT 0,    -- updated by budget_co_adjustment job
  status                  contract_status NOT NULL DEFAULT 'draft',
  retainage_pct           NUMERIC(5,2) NOT NULL DEFAULT 0,
  executed_at             TIMESTAMPTZ,
  docusign_envelope_id    TEXT,
  version                 INTEGER NOT NULL DEFAULT 1,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,
  created_by              UUID REFERENCES users(id)
);

-- Vendor bids: sub's bid response to a bid package
CREATE TABLE vendor_bids (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id),
  bid_package_id     UUID NOT NULL REFERENCES bid_packages(id),
  vendor_id          UUID NOT NULL REFERENCES vendors(id),
  status             vendor_bid_status NOT NULL DEFAULT 'invited',
  submitted_at       TIMESTAMPTZ,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  notes              TEXT,
  version            INTEGER NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ,
  created_by         UUID REFERENCES users(id)
);

-- Vendor bid line items: per-line vendor pricing
-- No version column — child of VendorBid, not independently optimistic-locked
CREATE TABLE vendor_bid_line_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  vendor_bid_id    UUID NOT NULL REFERENCES vendor_bids(id),
  takeoff_item_id  UUID REFERENCES takeoff_items(id),
  unit_cost_cents  INTEGER NOT NULL DEFAULT 0,
  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  created_by       UUID REFERENCES users(id)
);

-- Crew assignments: light-touch now to avoid costly v1.1 migration
-- Routes deferred to v1.1 — table exists to accept FKs from schedule_tasks
CREATE TABLE crew_assignments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  project_id       UUID NOT NULL REFERENCES projects(id),
  user_id          UUID NOT NULL REFERENCES users(id),
  schedule_task_id UUID REFERENCES schedule_tasks(id),
  start_date       DATE,
  end_date         DATE,
  role_on_task     TEXT,
  version          INTEGER NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  created_by       UUID REFERENCES users(id)
);

-- ─── ALTER existing tables ───────────────────────────────────────────────────

-- budget_line_items: add reconciliation columns
ALTER TABLE budget_line_items
  ADD COLUMN committed_amount_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN projected_final_cents  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN vendor_bid_id          UUID REFERENCES vendor_bids(id),
  ADD COLUMN contract_id            UUID REFERENCES contracts(id);

-- time_entries: link to budget line + capture rate at time of logging
ALTER TABLE time_entries
  ADD COLUMN budget_line_item_id UUID REFERENCES budget_line_items(id),
  ADD COLUMN hourly_rate_cents   INTEGER;

-- invoices: link to contract + retainage tracking + payment integration refs
ALTER TABLE invoices
  ADD COLUMN contract_id               UUID REFERENCES contracts(id),
  ADD COLUMN retainage_held_cents      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN retainage_released_cents  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN stripe_payment_intent_id  TEXT,
  ADD COLUMN quickbooks_invoice_id     TEXT;

-- change_orders: link to contract + schedule + vendor context
ALTER TABLE change_orders
  ADD COLUMN contract_id          UUID REFERENCES contracts(id),
  ADD COLUMN schedule_impact_days INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN direction            TEXT,    -- 'owner_to_gc' | 'gc_to_sub'
  ADD COLUMN vendor_id            UUID REFERENCES vendors(id),
  ADD COLUMN reason_code          TEXT;

-- bid_packages: link to schedule task
ALTER TABLE bid_packages
  ADD COLUMN schedule_task_id UUID REFERENCES schedule_tasks(id);

-- ─── RLS policies for new tables ────────────────────────────────────────────

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors FORCE ROW LEVEL SECURITY;
CREATE POLICY vendors_tenant_isolation ON vendors
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE schedule_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_tasks FORCE ROW LEVEL SECURITY;
CREATE POLICY schedule_tasks_tenant_isolation ON schedule_tasks
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones FORCE ROW LEVEL SECURITY;
CREATE POLICY milestones_tenant_isolation ON milestones
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts FORCE ROW LEVEL SECURITY;
CREATE POLICY contracts_tenant_isolation ON contracts
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE vendor_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_bids FORCE ROW LEVEL SECURITY;
CREATE POLICY vendor_bids_tenant_isolation ON vendor_bids
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE vendor_bid_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_bid_line_items FORCE ROW LEVEL SECURITY;
CREATE POLICY vendor_bid_line_items_tenant_isolation ON vendor_bid_line_items
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY crew_assignments_tenant_isolation ON crew_assignments
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ─── Indexes (new tables) ────────────────────────────────────────────────────

CREATE INDEX idx_vendors_tenant_id       ON vendors(tenant_id);
CREATE INDEX idx_vendors_tenant_deleted  ON vendors(tenant_id, deleted_at);
CREATE INDEX idx_vendors_tenant_type     ON vendors(tenant_id, vendor_type);

CREATE INDEX idx_schedule_tasks_tenant_id      ON schedule_tasks(tenant_id);
CREATE INDEX idx_schedule_tasks_tenant_deleted ON schedule_tasks(tenant_id, deleted_at);
CREATE INDEX idx_schedule_tasks_tenant_project ON schedule_tasks(tenant_id, project_id);
CREATE INDEX idx_schedule_tasks_tenant_updated ON schedule_tasks(tenant_id, updated_at);

CREATE INDEX idx_milestones_tenant_id      ON milestones(tenant_id);
CREATE INDEX idx_milestones_tenant_deleted ON milestones(tenant_id, deleted_at);
CREATE INDEX idx_milestones_tenant_project ON milestones(tenant_id, project_id);

CREATE INDEX idx_contracts_tenant_id      ON contracts(tenant_id);
CREATE INDEX idx_contracts_tenant_deleted ON contracts(tenant_id, deleted_at);
CREATE INDEX idx_contracts_tenant_project ON contracts(tenant_id, project_id);
CREATE INDEX idx_contracts_tenant_status  ON contracts(tenant_id, status);

CREATE INDEX idx_vendor_bids_tenant_id         ON vendor_bids(tenant_id);
CREATE INDEX idx_vendor_bids_tenant_deleted    ON vendor_bids(tenant_id, deleted_at);
CREATE INDEX idx_vendor_bids_tenant_package    ON vendor_bids(tenant_id, bid_package_id);

CREATE INDEX idx_vendor_bid_line_items_tenant_id  ON vendor_bid_line_items(tenant_id);
CREATE INDEX idx_vendor_bid_line_items_tenant_bid ON vendor_bid_line_items(tenant_id, vendor_bid_id);

CREATE INDEX idx_crew_assignments_tenant_id      ON crew_assignments(tenant_id);
CREATE INDEX idx_crew_assignments_tenant_deleted ON crew_assignments(tenant_id, deleted_at);
CREATE INDEX idx_crew_assignments_tenant_project ON crew_assignments(tenant_id, project_id);
CREATE INDEX idx_crew_assignments_tenant_user    ON crew_assignments(tenant_id, user_id);

-- ─── Indexes (new columns on existing tables) ───────────────────────────────

CREATE INDEX idx_budget_line_items_vendor_bid ON budget_line_items(tenant_id, vendor_bid_id);
CREATE INDEX idx_budget_line_items_contract   ON budget_line_items(tenant_id, contract_id);
CREATE INDEX idx_time_entries_budget_line     ON time_entries(tenant_id, budget_line_item_id);
CREATE INDEX idx_invoices_contract            ON invoices(tenant_id, contract_id);
CREATE INDEX idx_change_orders_contract       ON change_orders(tenant_id, contract_id);
CREATE INDEX idx_bid_packages_schedule_task   ON bid_packages(tenant_id, schedule_task_id);

-- ─── Session 9: add phone column to users (needed for SMS delivery T-38) ────
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
