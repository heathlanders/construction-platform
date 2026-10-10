-- ============================================================
-- 0001_initial — Full platform schema with RLS policies
-- ============================================================
-- Run AFTER prisma migrate dev (which generates its own migration).
-- This file is the AUTHORITATIVE reference for the initial DB state.
-- Apply RLS policies manually after Prisma creates the tables,
-- or run this directly against the database (bypasses Prisma migration tracking).
--
-- Key locked decisions:
--   A-03: RLS for tenant isolation
--   T-44: shared_project_events exempt from standard RLS
--   T-48: SET LOCAL only (not SET SESSION)
--   T-49: DISCARD ALL backstop in PgBouncer
-- ============================================================

-- ─── Enable required extensions ──────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE tenant_tier AS ENUM ('starter', 'professional', 'business', 'enterprise');
CREATE TYPE tenant_status AS ENUM ('trial', 'active', 'cancelled', 'grace_period', 'suspended');
CREATE TYPE user_role AS ENUM (
  'owner', 'project_manager', 'estimator', 'foreman',
  'field_tech', 'accountant', 'safety_officer', 'client_portal', 'sub_portal'
);
CREATE TYPE user_status AS ENUM ('active', 'invited', 'suspended', 'deactivated');
CREATE TYPE project_status AS ENUM ('active', 'completed', 'on_hold', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'void');
CREATE TYPE change_order_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM ('rfi', 'submittal', 'plan', 'spec', 'contract', 'report', 'other');
CREATE TYPE punch_list_status AS ENUM ('open', 'in_progress', 'complete');
CREATE TYPE inspection_status AS ENUM ('scheduled', 'passed', 'failed', 'requires_action');
CREATE TYPE incident_severity AS ENUM ('near_miss', 'first_aid', 'recordable', 'lost_time', 'fatality');
CREATE TYPE incident_status AS ENUM ('open', 'under_investigation', 'closed');
CREATE TYPE bid_package_status AS ENUM ('draft', 'open', 'closed', 'awarded');

-- ─── DOMAIN 1: Platform ───────────────────────────────────────────────────────

CREATE TABLE tenants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  tier         tenant_tier NOT NULL DEFAULT 'starter',
  status       tenant_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);
-- NO RLS on tenants — platform-scoped table

CREATE TABLE platform_admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
-- NO RLS on platform_admins — protected by requireSuperAdmin middleware (T-52)

-- ─── DOMAIN 2: Users ──────────────────────────────────────────────────────────

CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  email               TEXT NOT NULL,
  password_hash       TEXT,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  role                user_role NOT NULL,
  language_preference CHAR(2) NOT NULL DEFAULT 'en',
  status              user_status NOT NULL DEFAULT 'active',
  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  created_by          UUID REFERENCES users(id),
  UNIQUE (tenant_id, email)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_tenant_deleted ON users(tenant_id, deleted_at);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE user_devices (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  user_id    UUID NOT NULL REFERENCES users(id),
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  push_token TEXT NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON user_devices
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_user_devices_tenant_id ON user_devices(tenant_id);
CREATE INDEX idx_user_devices_tenant_user ON user_devices(tenant_id, user_id);
CREATE INDEX idx_user_devices_tenant_active ON user_devices(tenant_id, active);

CREATE TABLE notification_preferences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  user_id          UUID NOT NULL REFERENCES users(id),
  category         TEXT NOT NULL,
  channel          TEXT NOT NULL CHECK (channel IN ('push', 'email', 'sms')),
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end   TIME,
  UNIQUE (tenant_id, user_id, category, channel)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notification_preferences
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_notification_prefs_tenant ON notification_preferences(tenant_id);
CREATE INDEX idx_notification_prefs_user ON notification_preferences(tenant_id, user_id);

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  user_id    UUID NOT NULL REFERENCES users(id),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  category   TEXT NOT NULL,
  read_at    TIMESTAMPTZ,
  data       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notifications
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_user_read ON notifications(tenant_id, user_id, read_at);
CREATE INDEX idx_notifications_created ON notifications(tenant_id, created_at);

-- ─── DOMAIN 3: Projects ───────────────────────────────────────────────────────

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  status      project_status NOT NULL DEFAULT 'active',
  start_date  DATE,
  end_date    DATE,
  address     TEXT,
  city        TEXT,
  state       CHAR(2),
  zip         TEXT,
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES users(id)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON projects
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_projects_tenant ON projects(tenant_id);
CREATE INDEX idx_projects_tenant_deleted ON projects(tenant_id, deleted_at);
CREATE INDEX idx_projects_tenant_status ON projects(tenant_id, status);
CREATE INDEX idx_projects_tenant_updated ON projects(tenant_id, updated_at);

CREATE TABLE project_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id    UUID NOT NULL REFERENCES users(id),
  role       user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, project_id, user_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON project_members
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_project_members_tenant ON project_members(tenant_id);
CREATE INDEX idx_project_members_project ON project_members(tenant_id, project_id);

-- ─── DOMAIN 4: Cross-Tenant Bridge ───────────────────────────────────────────
-- T-44: shared_project_events is EXEMPT from standard RLS
-- T-45: Access controlled at application layer — connection membership validated

CREATE TABLE tenant_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gc_tenant_id  UUID NOT NULL REFERENCES tenants(id),
  sub_tenant_id UUID NOT NULL REFERENCES tenants(id),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'revoked')),
  invited_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- NO RLS — cross-tenant table, application-layer access control only

CREATE INDEX idx_tenant_connections_gc ON tenant_connections(gc_tenant_id);
CREATE INDEX idx_tenant_connections_sub ON tenant_connections(sub_tenant_id);
CREATE INDEX idx_tenant_connections_status ON tenant_connections(status);

CREATE TABLE shared_project_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id    UUID NOT NULL REFERENCES tenant_connections(id),
  source_tenant_id UUID NOT NULL,
  event_type       TEXT NOT NULL,
  payload          JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- NO RLS per T-44 — access controlled at application layer per T-45
-- Sub's internal data must NEVER enter GC's channel payload (T-17)

CREATE INDEX idx_spe_connection ON shared_project_events(connection_id);
CREATE INDEX idx_spe_source_tenant ON shared_project_events(source_tenant_id);
CREATE INDEX idx_spe_created ON shared_project_events(created_at);

-- ─── DOMAIN 5: Financials ─────────────────────────────────────────────────────

CREATE TABLE cost_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  code       TEXT NOT NULL,
  name       TEXT NOT NULL,
  category   TEXT,
  version    INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  UNIQUE (tenant_id, code)
);

ALTER TABLE cost_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_codes FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON cost_codes
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_cost_codes_tenant ON cost_codes(tenant_id);
CREATE INDEX idx_cost_codes_tenant_deleted ON cost_codes(tenant_id, deleted_at);

CREATE TABLE invoices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  amount_cents INTEGER NOT NULL,  -- T-02: never float
  status       invoice_status NOT NULL DEFAULT 'draft',
  due_date     DATE,
  version      INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  created_by   UUID REFERENCES users(id)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_tenant_deleted ON invoices(tenant_id, deleted_at);
CREATE INDEX idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX idx_invoices_tenant_updated ON invoices(tenant_id, updated_at);

CREATE TABLE change_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  title        TEXT NOT NULL,
  description  TEXT,
  amount_cents INTEGER NOT NULL,
  status       change_order_status NOT NULL DEFAULT 'pending',
  version      INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  created_by   UUID REFERENCES users(id)
);

ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON change_orders
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_change_orders_tenant ON change_orders(tenant_id);
CREATE INDEX idx_change_orders_tenant_deleted ON change_orders(tenant_id, deleted_at);
CREATE INDEX idx_change_orders_tenant_updated ON change_orders(tenant_id, updated_at);

CREATE TABLE budget_line_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  cost_code_id UUID REFERENCES cost_codes(id),
  description  TEXT NOT NULL,
  budget_cents INTEGER NOT NULL,
  actual_cents INTEGER NOT NULL DEFAULT 0,
  version      INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  created_by   UUID REFERENCES users(id)
);

ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON budget_line_items
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_budget_items_tenant ON budget_line_items(tenant_id);
CREATE INDEX idx_budget_items_tenant_deleted ON budget_line_items(tenant_id, deleted_at);
CREATE INDEX idx_budget_items_tenant_updated ON budget_line_items(tenant_id, updated_at);

-- ─── DOMAIN 6: Documents ──────────────────────────────────────────────────────

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  project_id      UUID NOT NULL REFERENCES projects(id),
  doc_type        document_type NOT NULL,
  title           TEXT NOT NULL,
  storage_path    TEXT,  -- live path only — never direct URL (T-05)
  file_size_bytes INTEGER,
  status          TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id)
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON documents
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_tenant_deleted ON documents(tenant_id, deleted_at);
CREATE INDEX idx_documents_tenant_type ON documents(tenant_id, doc_type);
CREATE INDEX idx_documents_tenant_updated ON documents(tenant_id, updated_at);

CREATE TABLE rfis (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  project_id  UUID NOT NULL REFERENCES projects(id),
  number      INTEGER NOT NULL,
  subject     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'answered', 'closed')),
  due_date    DATE,
  assignee_id UUID REFERENCES users(id),
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES users(id),
  UNIQUE (tenant_id, project_id, number)
);

ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfis FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON rfis
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_rfis_tenant ON rfis(tenant_id);
CREATE INDEX idx_rfis_tenant_deleted ON rfis(tenant_id, deleted_at);
CREATE INDEX idx_rfis_tenant_updated ON rfis(tenant_id, updated_at);

CREATE TABLE submittals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  number       INTEGER NOT NULL,
  title        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  spec_section TEXT,
  version      INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  created_by   UUID REFERENCES users(id),
  UNIQUE (tenant_id, project_id, number)
);

ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittals FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON submittals
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_submittals_tenant ON submittals(tenant_id);
CREATE INDEX idx_submittals_tenant_deleted ON submittals(tenant_id, deleted_at);
CREATE INDEX idx_submittals_tenant_updated ON submittals(tenant_id, updated_at);

-- ─── DOMAIN 7: Field Operations ───────────────────────────────────────────────

CREATE TABLE daily_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  project_id  UUID NOT NULL REFERENCES projects(id),
  report_date DATE NOT NULL,
  weather     JSONB,
  notes       TEXT,  -- append-only conflict policy (T-13)
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES users(id)
);

ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON daily_reports
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_daily_reports_tenant ON daily_reports(tenant_id);
CREATE INDEX idx_daily_reports_tenant_deleted ON daily_reports(tenant_id, deleted_at);
CREATE INDEX idx_daily_reports_tenant_updated ON daily_reports(tenant_id, updated_at);
CREATE INDEX idx_daily_reports_date ON daily_reports(tenant_id, report_date);

CREATE TABLE time_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  user_id      UUID NOT NULL REFERENCES users(id),
  date         DATE NOT NULL,
  hours_worked NUMERIC(5, 2) NOT NULL,
  cost_code_id UUID REFERENCES cost_codes(id),
  notes        TEXT,
  version      INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  created_by   UUID REFERENCES users(id)
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON time_entries
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_time_entries_tenant ON time_entries(tenant_id);
CREATE INDEX idx_time_entries_tenant_deleted ON time_entries(tenant_id, deleted_at);
CREATE INDEX idx_time_entries_tenant_updated ON time_entries(tenant_id, updated_at);
CREATE INDEX idx_time_entries_user_date ON time_entries(tenant_id, user_id, date);

CREATE TABLE punch_list_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  project_id  UUID NOT NULL REFERENCES projects(id),
  title       TEXT NOT NULL,
  description TEXT,
  status      punch_list_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES users(id),
  due_date    DATE,
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES users(id)
);

ALTER TABLE punch_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_list_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON punch_list_items
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_punch_list_tenant ON punch_list_items(tenant_id);
CREATE INDEX idx_punch_list_tenant_deleted ON punch_list_items(tenant_id, deleted_at);
CREATE INDEX idx_punch_list_tenant_updated ON punch_list_items(tenant_id, updated_at);
CREATE INDEX idx_punch_list_status ON punch_list_items(tenant_id, status);

CREATE TABLE inspections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  project_id      UUID NOT NULL REFERENCES projects(id),
  title           TEXT NOT NULL,
  inspection_date TIMESTAMPTZ,
  status          inspection_status NOT NULL DEFAULT 'scheduled',
  notes           TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id)
);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON inspections
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_inspections_tenant ON inspections(tenant_id);
CREATE INDEX idx_inspections_tenant_deleted ON inspections(tenant_id, deleted_at);
CREATE INDEX idx_inspections_tenant_updated ON inspections(tenant_id, updated_at);

-- ─── DOMAIN 8: Safety ─────────────────────────────────────────────────────────

CREATE TABLE safety_incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  project_id    UUID NOT NULL REFERENCES projects(id),
  incident_date TIMESTAMPTZ NOT NULL,
  description   TEXT NOT NULL,
  severity      incident_severity NOT NULL,
  status        incident_status NOT NULL DEFAULT 'open',
  version       INTEGER NOT NULL DEFAULT 1,  -- T-13 Tier 3: blocks until Safety Officer resolves
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id)
);

ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON safety_incidents
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_safety_incidents_tenant ON safety_incidents(tenant_id);
CREATE INDEX idx_safety_incidents_tenant_deleted ON safety_incidents(tenant_id, deleted_at);
CREATE INDEX idx_safety_incidents_tenant_updated ON safety_incidents(tenant_id, updated_at);
CREATE INDEX idx_safety_incidents_status ON safety_incidents(tenant_id, status);

CREATE TABLE jsa_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  project_id   UUID NOT NULL REFERENCES projects(id),
  title        TEXT NOT NULL,
  conducted_at TIMESTAMPTZ,
  attendees    JSONB,
  hazards      JSONB,
  version      INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  created_by   UUID REFERENCES users(id)
);

ALTER TABLE jsa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE jsa_records FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON jsa_records
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_jsa_records_tenant ON jsa_records(tenant_id);
CREATE INDEX idx_jsa_records_tenant_deleted ON jsa_records(tenant_id, deleted_at);
CREATE INDEX idx_jsa_records_tenant_updated ON jsa_records(tenant_id, updated_at);

CREATE TABLE safety_certifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  user_id       UUID NOT NULL REFERENCES users(id),
  cert_type     TEXT NOT NULL,
  issued_at     DATE,
  expires_at    DATE,
  document_path TEXT,
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id)
);

ALTER TABLE safety_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_certifications FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON safety_certifications
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_safety_certs_tenant ON safety_certifications(tenant_id);
CREATE INDEX idx_safety_certs_tenant_deleted ON safety_certifications(tenant_id, deleted_at);
CREATE INDEX idx_safety_certs_user ON safety_certifications(tenant_id, user_id);

-- ─── DOMAIN 9: Estimating ─────────────────────────────────────────────────────

CREATE TABLE bid_packages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  title      TEXT NOT NULL,
  status     bid_package_status NOT NULL DEFAULT 'draft',
  due_date   DATE,
  version    INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id)
);

ALTER TABLE bid_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_packages FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON bid_packages
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_bid_packages_tenant ON bid_packages(tenant_id);
CREATE INDEX idx_bid_packages_tenant_deleted ON bid_packages(tenant_id, deleted_at);
CREATE INDEX idx_bid_packages_tenant_updated ON bid_packages(tenant_id, updated_at);

CREATE TABLE takeoff_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  project_id      UUID NOT NULL REFERENCES projects(id),
  bid_package_id  UUID REFERENCES bid_packages(id),
  description     TEXT NOT NULL,
  quantity        NUMERIC(10, 3) NOT NULL,
  unit            TEXT,
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id)
);

ALTER TABLE takeoff_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON takeoff_items
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_takeoff_items_tenant ON takeoff_items(tenant_id);
CREATE INDEX idx_takeoff_items_tenant_deleted ON takeoff_items(tenant_id, deleted_at);
CREATE INDEX idx_takeoff_items_tenant_updated ON takeoff_items(tenant_id, updated_at);

CREATE TABLE markups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  name       TEXT NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL,
  version    INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id)
);

ALTER TABLE markups ENABLE ROW LEVEL SECURITY;
ALTER TABLE markups FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON markups
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_markups_tenant ON markups(tenant_id);
CREATE INDEX idx_markups_tenant_deleted ON markups(tenant_id, deleted_at);

-- ─── DOMAIN 10: Trade Modules ─────────────────────────────────────────────────

CREATE TABLE electrical_panels (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  name       TEXT NOT NULL,
  amperage   INTEGER,
  voltage    INTEGER,
  location   TEXT,
  notes      TEXT,
  version    INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id)
);

ALTER TABLE electrical_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE electrical_panels FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON electrical_panels
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_electrical_panels_tenant ON electrical_panels(tenant_id);
CREATE INDEX idx_electrical_panels_tenant_deleted ON electrical_panels(tenant_id, deleted_at);
CREATE INDEX idx_electrical_panels_tenant_updated ON electrical_panels(tenant_id, updated_at);

CREATE TABLE electrical_circuits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  panel_id       UUID NOT NULL REFERENCES electrical_panels(id),
  circuit_number INTEGER NOT NULL,
  description    TEXT,
  amperage       INTEGER,
  status         TEXT,
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,
  created_by     UUID REFERENCES users(id),
  UNIQUE (tenant_id, panel_id, circuit_number)
);

ALTER TABLE electrical_circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE electrical_circuits FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON electrical_circuits
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_electrical_circuits_tenant ON electrical_circuits(tenant_id);
CREATE INDEX idx_electrical_circuits_tenant_deleted ON electrical_circuits(tenant_id, deleted_at);
CREATE INDEX idx_electrical_circuits_tenant_updated ON electrical_circuits(tenant_id, updated_at);

CREATE TABLE plumbing_systems (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  project_id  UUID NOT NULL REFERENCES projects(id),
  name        TEXT NOT NULL,
  system_type TEXT CHECK (system_type IN ('supply', 'drain', 'gas', 'fire')),
  notes       TEXT,
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES users(id)
);

ALTER TABLE plumbing_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE plumbing_systems FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON plumbing_systems
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_plumbing_systems_tenant ON plumbing_systems(tenant_id);
CREATE INDEX idx_plumbing_systems_tenant_deleted ON plumbing_systems(tenant_id, deleted_at);
CREATE INDEX idx_plumbing_systems_tenant_updated ON plumbing_systems(tenant_id, updated_at);

CREATE TABLE plumbing_fixtures (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  system_id    UUID NOT NULL REFERENCES plumbing_systems(id),
  fixture_type TEXT,
  location     TEXT,
  status       TEXT CHECK (status IN ('planned', 'rough_in', 'trimmed', 'complete')),
  version      INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  created_by   UUID REFERENCES users(id)
);

ALTER TABLE plumbing_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE plumbing_fixtures FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON plumbing_fixtures
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_plumbing_fixtures_tenant ON plumbing_fixtures(tenant_id);
CREATE INDEX idx_plumbing_fixtures_tenant_deleted ON plumbing_fixtures(tenant_id, deleted_at);
CREATE INDEX idx_plumbing_fixtures_tenant_updated ON plumbing_fixtures(tenant_id, updated_at);

-- ─── DOMAIN 11: Platform Services ────────────────────────────────────────────

-- AuditLog — append-only, hash-chained (T-32, T-34)
-- No updated_at, no deleted_at — entries are IMMUTABLE
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL,  -- TEXT (not UUID) to allow 'PLATFORM' sentinel
  category      TEXT NOT NULL CHECK (category IN ('auth','data','access','admin','billing','cross_tenant')),
  action        TEXT NOT NULL,
  actor_id      UUID,
  actor_email   TEXT,    -- denormalized — preserved if user deleted (T-34)
  actor_role    TEXT,
  resource_type TEXT,
  resource_id   UUID,
  payload       JSONB,
  ip_address    INET,    -- NOT exposed to tenant admins (T-33)
  previous_hash TEXT NOT NULL,
  entry_hash    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log RLS: tenants see their own events; PLATFORM sentinel allows platform admin reads
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_log
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.current_tenant_id', true) = 'PLATFORM'
  );
-- NOTE: No WITH CHECK — audit_log is INSERT-only at application layer;
-- updates/deletes are prevented by application logic (never via SQL UPDATE/DELETE)

CREATE INDEX idx_audit_log_tenant_created ON audit_log(tenant_id, created_at);
CREATE INDEX idx_audit_log_tenant_category ON audit_log(tenant_id, category);

-- TenantSubscription — NO RLS (billing service validates tenant_id directly)
CREATE TABLE tenant_subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL UNIQUE REFERENCES tenants(id),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  tier                   tenant_tier NOT NULL,
  status                 TEXT NOT NULL,
  addon_gc_module        BOOLEAN NOT NULL DEFAULT FALSE,
  addon_cross_tenant     BOOLEAN NOT NULL DEFAULT FALSE,
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- NO RLS — billing service with validated tenant_id

-- TenantStorageUsage — NO RLS (billing service)
CREATE TABLE tenant_storage_usage (
  tenant_id  UUID PRIMARY KEY REFERENCES tenants(id),
  bytes_used BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- NO RLS — billing service

-- ─── Optimistic locking trigger ───────────────────────────────────────────────
-- T-12: version integer incremented by DB trigger — NEVER trusted from client

CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all mobile-writable tables (tables with version column)
CREATE TRIGGER trg_version_projects
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_invoices
  BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_change_orders
  BEFORE UPDATE ON change_orders FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_budget_line_items
  BEFORE UPDATE ON budget_line_items FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_documents
  BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_rfis
  BEFORE UPDATE ON rfis FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_submittals
  BEFORE UPDATE ON submittals FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_daily_reports
  BEFORE UPDATE ON daily_reports FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_time_entries
  BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_punch_list_items
  BEFORE UPDATE ON punch_list_items FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_inspections
  BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_safety_incidents
  BEFORE UPDATE ON safety_incidents FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_jsa_records
  BEFORE UPDATE ON jsa_records FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_safety_certifications
  BEFORE UPDATE ON safety_certifications FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_bid_packages
  BEFORE UPDATE ON bid_packages FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_takeoff_items
  BEFORE UPDATE ON takeoff_items FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_electrical_panels
  BEFORE UPDATE ON electrical_panels FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_electrical_circuits
  BEFORE UPDATE ON electrical_circuits FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_plumbing_systems
  BEFORE UPDATE ON plumbing_systems FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER trg_version_plumbing_fixtures
  BEFORE UPDATE ON plumbing_fixtures FOR EACH ROW EXECUTE FUNCTION increment_version();

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tenants','users','user_devices','projects','invoices','change_orders',
    'budget_line_items','cost_codes','documents','rfis','submittals',
    'daily_reports','time_entries','punch_list_items','inspections',
    'safety_incidents','jsa_records','safety_certifications',
    'bid_packages','takeoff_items','markups',
    'electrical_panels','electrical_circuits','plumbing_systems','plumbing_fixtures',
    'tenant_connections','tenant_subscriptions','tenant_storage_usage'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_updated_at_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;
