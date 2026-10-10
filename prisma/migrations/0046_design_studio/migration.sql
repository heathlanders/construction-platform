-- 0046_design_studio
--
-- Design Studio (Client Visualizer, proposed T-65) — P2 data model. A contractor-invited client
-- (CLIENT_PORTAL user inside the contractor tenant) builds a REQUEST made of one or more trade SCOPES;
-- each scope's spec is validated by the trade's intake module (api/src/lib/intake/). Renders are
-- concept images paired with the exact spec snapshot that produced them. Every AI call is metered.
--
-- Multi-trade from day 1 (request → many scopes); v1 UI creates one scope. `channel` keeps a future
-- marketplace entry open. All tables: RLS ENABLED + FORCED with WITH CHECK (A-03), TEXT+CHECK enums
-- (T-53), universal columns, optimistic `version` (T-12) where rows are edited.
--
-- Invariants enforced in the app layer (documented here for reviewers):
--   * offerings: trade_key must have a registered intake module (DB can't see TypeScript)
--   * client DTOs never expose cost/catalog/markup data — only range_low/high_cents
--   * every client query re-derives access via design_requests.client_user_id = jwt.user_id

-- ─── 1. tenant_trade_offerings — which trades a contractor offers through the studio ──────────────
CREATE TABLE IF NOT EXISTS tenant_trade_offerings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  trade_key      TEXT NOT NULL,
  enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  display_order  INTEGER NOT NULL DEFAULT 0,
  settings       JSONB NOT NULL DEFAULT '{}'::jsonb,   -- pricing params for client ranges, renders on/off
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,
  created_by     UUID REFERENCES users(id)
);
ALTER TABLE tenant_trade_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_trade_offerings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_trade_offerings
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
CREATE INDEX idx_tenant_trade_offerings_tenant ON tenant_trade_offerings(tenant_id, deleted_at);
CREATE UNIQUE INDEX idx_tenant_trade_offerings_key ON tenant_trade_offerings(tenant_id, trade_key) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_version_tenant_trade_offerings BEFORE UPDATE ON tenant_trade_offerings FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER trg_updated_at_tenant_trade_offerings BEFORE UPDATE ON tenant_trade_offerings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 2. design_requests — one client request (may hold several trade scopes) ─────────────────────
CREATE TABLE IF NOT EXISTS design_requests (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id),
  client_user_id         UUID NOT NULL REFERENCES users(id),
  project_id             UUID REFERENCES projects(id),
  channel                TEXT NOT NULL DEFAULT 'contractor_invite' CHECK (channel IN ('contractor_invite','marketplace')),
  status                 TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','reviewed','converted','declined')),
  title                  TEXT,
  site                   JSONB NOT NULL DEFAULT '{}'::jsonb,   -- address / city / state / zip
  common_values          JSONB NOT NULL DEFAULT '{}'::jsonb,   -- answers to the common steps
  common_intake_version  INTEGER NOT NULL DEFAULT 1,
  estimate_id            UUID REFERENCES estimates(id),
  range_low_cents        INTEGER,
  range_high_cents       INTEGER,
  submitted_at           TIMESTAMPTZ,
  decline_reason         TEXT,
  version                INTEGER NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,
  created_by             UUID REFERENCES users(id)
);
ALTER TABLE design_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON design_requests
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
CREATE INDEX idx_design_requests_tenant ON design_requests(tenant_id, deleted_at);
CREATE INDEX idx_design_requests_status ON design_requests(tenant_id, status, created_at DESC);
CREATE INDEX idx_design_requests_client ON design_requests(tenant_id, client_user_id);
CREATE TRIGGER trg_version_design_requests BEFORE UPDATE ON design_requests FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER trg_updated_at_design_requests BEFORE UPDATE ON design_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 3. design_request_scopes — one trade's spec within a request ────────────────────────────────
CREATE TABLE IF NOT EXISTS design_request_scopes (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id),
  request_id             UUID NOT NULL REFERENCES design_requests(id),
  trade_key              TEXT NOT NULL,
  intake_version         INTEGER NOT NULL,
  spec                   JSONB NOT NULL DEFAULT '{}'::jsonb,   -- {trade_key,intake_version,values,provenance}
  ai_suggestions         JSONB NOT NULL DEFAULT '[]'::jsonb,   -- last validated AI suggestions (accept applies these)
  status                 TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','complete','submitted')),
  measurements_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  range_low_cents        INTEGER,
  range_high_cents       INTEGER,
  quantities_snapshot    JSONB,                                -- frozen at submit
  summary_snapshot       JSONB,                                -- frozen at submit (bilingual)
  selected_render_id     UUID,
  sort_order             INTEGER NOT NULL DEFAULT 0,
  version                INTEGER NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,
  created_by             UUID REFERENCES users(id)
);
ALTER TABLE design_request_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_request_scopes FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON design_request_scopes
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
CREATE INDEX idx_design_request_scopes_tenant ON design_request_scopes(tenant_id, deleted_at);
CREATE INDEX idx_design_request_scopes_request ON design_request_scopes(tenant_id, request_id, sort_order);
CREATE TRIGGER trg_version_design_request_scopes BEFORE UPDATE ON design_request_scopes FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER trg_updated_at_design_request_scopes BEFORE UPDATE ON design_request_scopes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 4. ai_usage_events — append-only AI metering (first in the platform) ───────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  user_id         UUID REFERENCES users(id),
  feature         TEXT NOT NULL CHECK (feature IN ('studio.render','studio.assess','studio.guide')),
  provider        TEXT NOT NULL,
  model           TEXT,
  units           NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_kind       TEXT NOT NULL DEFAULT 'call' CHECK (unit_kind IN ('call','image','token')),
  cost_micro_usd  BIGINT NOT NULL DEFAULT 0,               -- LLM calls cost fractions of a cent
  subject_type    TEXT,
  subject_id      UUID,
  status          TEXT NOT NULL CHECK (status IN ('ok','failed','blocked')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_events FORCE ROW LEVEL SECURITY;
-- Append-only: SELECT + INSERT policies only (no UPDATE/DELETE policy → denied under FORCE RLS).
CREATE POLICY tenant_select ON ai_usage_events FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
CREATE POLICY tenant_insert ON ai_usage_events FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
CREATE INDEX idx_ai_usage_events_tenant ON ai_usage_events(tenant_id, created_at DESC);
CREATE INDEX idx_ai_usage_events_subject ON ai_usage_events(tenant_id, subject_type, subject_id);

-- ─── 5. design_renders — concept images paired with their spec snapshot ──────────────────────────
CREATE TABLE IF NOT EXISTS design_renders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  request_id       UUID NOT NULL REFERENCES design_requests(id),
  scope_id         UUID NOT NULL REFERENCES design_request_scopes(id),
  source_file_id   UUID NOT NULL REFERENCES files(id),
  spec_snapshot    JSONB NOT NULL,
  intake_version   INTEGER NOT NULL,
  prompt           TEXT NOT NULL,
  provider         TEXT NOT NULL,
  model            TEXT,
  status           TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed','blocked')),
  storage_path     TEXT,
  error            TEXT,
  usage_event_id   UUID REFERENCES ai_usage_events(id),
  version          INTEGER NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  created_by       UUID REFERENCES users(id)
);
ALTER TABLE design_renders ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_renders FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON design_renders
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
CREATE INDEX idx_design_renders_tenant ON design_renders(tenant_id, deleted_at);
CREATE INDEX idx_design_renders_scope ON design_renders(tenant_id, scope_id, created_at DESC);
CREATE TRIGGER trg_version_design_renders BEFORE UPDATE ON design_renders FOR EACH ROW EXECUTE FUNCTION increment_version();
CREATE TRIGGER trg_updated_at_design_renders BEFORE UPDATE ON design_renders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE design_request_scopes
  ADD CONSTRAINT fk_design_request_scopes_selected_render FOREIGN KEY (selected_render_id) REFERENCES design_renders(id);
