-- Domain 15: Builder Warranties
-- Locked decisions: Business+ tier gate (same pattern as T-56)
-- 12 tables total; circular FK (warranty_claims ↔ warranty_insurance_claims)
-- resolved via ALTER TABLE at end of migration.

-- ─── 1. warranty_coverage_templates ─────────────────────────────────────────

CREATE TABLE warranty_coverage_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  name              TEXT NOT NULL,
  description       TEXT,
  is_system_template BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  version           INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id)
);

ALTER TABLE warranty_coverage_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_coverage_templates FORCE ROW LEVEL SECURITY;
-- System templates (sentinel tenant_id 00000000-...) are visible to all tenants
CREATE POLICY tenant_isolation ON warranty_coverage_templates
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    OR is_system_template = TRUE
  );

CREATE INDEX idx_wct_tenant ON warranty_coverage_templates(tenant_id);
CREATE INDEX idx_wct_tenant_deleted ON warranty_coverage_templates(tenant_id, deleted_at);
CREATE INDEX idx_wct_system ON warranty_coverage_templates(is_system_template) WHERE is_system_template = TRUE;

-- ─── 2. warranty_coverage_template_items ────────────────────────────────────

CREATE TABLE warranty_coverage_template_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  template_id      UUID NOT NULL REFERENCES warranty_coverage_templates(id),
  coverage_type    TEXT NOT NULL CHECK (coverage_type IN ('workmanship','systems','structural','custom')),
  title            TEXT NOT NULL,
  description      TEXT,
  duration_months  INTEGER NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  created_by       UUID REFERENCES users(id)
);

ALTER TABLE warranty_coverage_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_coverage_template_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON warranty_coverage_template_items
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    OR EXISTS (
      SELECT 1 FROM warranty_coverage_templates wct
      WHERE wct.id = template_id AND wct.is_system_template = TRUE
    )
  );

CREATE INDEX idx_wcti_tenant ON warranty_coverage_template_items(tenant_id);
CREATE INDEX idx_wcti_template ON warranty_coverage_template_items(template_id);

-- ─── 3. builder_warranties ──────────────────────────────────────────────────

CREATE TABLE builder_warranties (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id),
  project_id             UUID REFERENCES projects(id),
  template_id            UUID REFERENCES warranty_coverage_templates(id),
  title                  TEXT NOT NULL,
  property_address       TEXT NOT NULL,
  homeowner_name         TEXT NOT NULL,
  homeowner_email        TEXT NOT NULL,
  homeowner_phone        TEXT,
  effective_date         DATE NOT NULL,
  builder_contact_name   TEXT,
  builder_contact_email  TEXT,
  builder_contact_phone  TEXT,
  status                 TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('draft','active','expired','voided','closed')),
  notes                  TEXT,
  version                INTEGER NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,
  created_by             UUID REFERENCES users(id)
);

ALTER TABLE builder_warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_warranties FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON builder_warranties
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_bw_tenant ON builder_warranties(tenant_id);
CREATE INDEX idx_bw_tenant_deleted ON builder_warranties(tenant_id, deleted_at);
CREATE INDEX idx_bw_tenant_project ON builder_warranties(tenant_id, project_id);
CREATE INDEX idx_bw_tenant_status ON builder_warranties(tenant_id, status);
CREATE INDEX idx_bw_tenant_updated ON builder_warranties(tenant_id, updated_at);

-- ─── 4. warranty_coverage_items (snapshot at issuance) ──────────────────────

CREATE TABLE warranty_coverage_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  warranty_id      UUID NOT NULL REFERENCES builder_warranties(id),
  coverage_type    TEXT NOT NULL CHECK (coverage_type IN ('workmanship','systems','structural','custom')),
  title            TEXT NOT NULL,
  description      TEXT,
  duration_months  INTEGER NOT NULL,
  expiry_date      DATE NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE warranty_coverage_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_coverage_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON warranty_coverage_items
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_wci_tenant ON warranty_coverage_items(tenant_id);
CREATE INDEX idx_wci_warranty ON warranty_coverage_items(warranty_id);

-- ─── 5. warranty_homeowner_bindings ─────────────────────────────────────────

CREATE TABLE warranty_homeowner_bindings (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id),
  warranty_id            UUID NOT NULL REFERENCES builder_warranties(id),
  user_id                UUID NOT NULL REFERENCES users(id),
  magic_link_last_sent   TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, warranty_id, user_id)
);

ALTER TABLE warranty_homeowner_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_homeowner_bindings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON warranty_homeowner_bindings
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_whb_tenant ON warranty_homeowner_bindings(tenant_id);
CREATE INDEX idx_whb_user ON warranty_homeowner_bindings(user_id);
CREATE INDEX idx_whb_warranty ON warranty_homeowner_bindings(warranty_id);

-- ─── 6. warranty_claims ─────────────────────────────────────────────────────
-- insurance_claim_id FK added via ALTER TABLE after warranty_insurance_claims

CREATE TABLE warranty_claims (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id),
  warranty_id              UUID NOT NULL REFERENCES builder_warranties(id),
  coverage_item_id         UUID REFERENCES warranty_coverage_items(id),
  submitted_by_user_id     UUID REFERENCES users(id),
  submitted_by_homeowner   BOOLEAN NOT NULL DEFAULT FALSE,
  title                    TEXT NOT NULL,
  description              TEXT NOT NULL,
  category                 TEXT NOT NULL CHECK (category IN ('workmanship','systems','structural','other')),
  status                   TEXT NOT NULL DEFAULT 'submitted'
                             CHECK (status IN ('submitted','acknowledged','under_investigation','repair_scheduled','repair_complete','denied','closed')),
  priority                 TEXT NOT NULL DEFAULT 'medium'
                             CHECK (priority IN ('low','medium','high','urgent')),
  scheduled_repair_date    DATE,
  completed_at             TIMESTAMPTZ,
  resolution_notes         TEXT,
  insurance_claim_id       UUID,
  is_sub_liable            BOOLEAN NOT NULL DEFAULT FALSE,
  version                  INTEGER NOT NULL DEFAULT 1,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at               TIMESTAMPTZ,
  created_by               UUID REFERENCES users(id)
);

ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_claims FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON warranty_claims
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_wc_tenant ON warranty_claims(tenant_id);
CREATE INDEX idx_wc_tenant_deleted ON warranty_claims(tenant_id, deleted_at);
CREATE INDEX idx_wc_warranty ON warranty_claims(warranty_id);
CREATE INDEX idx_wc_tenant_status ON warranty_claims(tenant_id, status);
CREATE INDEX idx_wc_tenant_updated ON warranty_claims(tenant_id, updated_at);

-- ─── 7. warranty_claim_status_history (append-only) ─────────────────────────

CREATE TABLE warranty_claim_status_history (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  claim_id              UUID NOT NULL REFERENCES warranty_claims(id),
  from_status           TEXT,
  to_status             TEXT NOT NULL,
  changed_by_user_id    UUID REFERENCES users(id),
  changed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE warranty_claim_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_claim_status_history FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON warranty_claim_status_history
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_wcsh_tenant ON warranty_claim_status_history(tenant_id);
CREATE INDEX idx_wcsh_claim ON warranty_claim_status_history(claim_id);

-- ─── 8. warranty_claim_photos ────────────────────────────────────────────────

CREATE TABLE warranty_claim_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  claim_id      UUID NOT NULL REFERENCES warranty_claims(id),
  storage_path  TEXT NOT NULL,
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE warranty_claim_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_claim_photos FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON warranty_claim_photos
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_wcp_tenant ON warranty_claim_photos(tenant_id);
CREATE INDEX idx_wcp_claim ON warranty_claim_photos(claim_id);

-- ─── 9. warranty_sub_liability_items ────────────────────────────────────────

CREATE TABLE warranty_sub_liability_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  claim_id            UUID NOT NULL REFERENCES warranty_claims(id),
  vendor_id           UUID NOT NULL REFERENCES vendors(id),
  notified_at         TIMESTAMPTZ,
  acknowledged_at     TIMESTAMPTZ,
  resolution_status   TEXT NOT NULL DEFAULT 'pending'
                        CHECK (resolution_status IN ('pending','accepted','rejected','resolved')),
  liability_amount_cents INTEGER NOT NULL DEFAULT 0,
  resolution_notes    TEXT,
  version             INTEGER NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES users(id)
);

ALTER TABLE warranty_sub_liability_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_sub_liability_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON warranty_sub_liability_items
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_wsli_tenant ON warranty_sub_liability_items(tenant_id);
CREATE INDEX idx_wsli_claim ON warranty_sub_liability_items(claim_id);
CREATE INDEX idx_wsli_vendor ON warranty_sub_liability_items(vendor_id);

-- ─── 10. warranty_insurance_policies ────────────────────────────────────────

CREATE TABLE warranty_insurance_policies (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  policy_type           TEXT NOT NULL CHECK (policy_type IN ('how','2_10_hbw','builder_risk','other')),
  policy_name           TEXT NOT NULL,
  carrier_name          TEXT NOT NULL,
  policy_number         TEXT NOT NULL,
  coverage_description  TEXT,
  coverage_limit_cents  INTEGER,
  deductible_cents      INTEGER,
  annual_premium_cents  INTEGER,
  effective_date        DATE NOT NULL,
  expiry_date           DATE NOT NULL,
  contact_name          TEXT,
  contact_email         TEXT,
  contact_phone         TEXT,
  document_path         TEXT,
  notes                 TEXT,
  version               INTEGER NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  created_by            UUID REFERENCES users(id)
);

ALTER TABLE warranty_insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_insurance_policies FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON warranty_insurance_policies
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_wip_tenant ON warranty_insurance_policies(tenant_id);
CREATE INDEX idx_wip_tenant_deleted ON warranty_insurance_policies(tenant_id, deleted_at);
CREATE INDEX idx_wip_expiry ON warranty_insurance_policies(tenant_id, expiry_date);

-- ─── 11. warranty_insurance_claims ──────────────────────────────────────────

CREATE TABLE warranty_insurance_claims (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id),
  policy_id              UUID NOT NULL REFERENCES warranty_insurance_policies(id),
  warranty_id            UUID NOT NULL REFERENCES builder_warranties(id),
  claim_id               UUID REFERENCES warranty_claims(id),
  incident_date          DATE NOT NULL,
  description            TEXT NOT NULL,
  claim_amount_cents     INTEGER NOT NULL DEFAULT 0,
  approved_amount_cents  INTEGER,
  status                 TEXT NOT NULL DEFAULT 'reported'
                           CHECK (status IN ('reported','under_review','approved','denied','paid','closed')),
  adjuster_name          TEXT,
  adjuster_contact       TEXT,
  document_path          TEXT,
  notes                  TEXT,
  version                INTEGER NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,
  created_by             UUID REFERENCES users(id)
);

ALTER TABLE warranty_insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_insurance_claims FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON warranty_insurance_claims
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_wic_tenant ON warranty_insurance_claims(tenant_id);
CREATE INDEX idx_wic_tenant_deleted ON warranty_insurance_claims(tenant_id, deleted_at);
CREATE INDEX idx_wic_policy ON warranty_insurance_claims(policy_id);
CREATE INDEX idx_wic_warranty ON warranty_insurance_claims(warranty_id);

-- ─── Resolve circular FK ─────────────────────────────────────────────────────
ALTER TABLE warranty_claims
  ADD CONSTRAINT fk_warranty_claims_insurance_claim
  FOREIGN KEY (insurance_claim_id) REFERENCES warranty_insurance_claims(id);

-- ─── 12. warranty_audit_events (append-only) ────────────────────────────────

CREATE TABLE warranty_audit_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  warranty_id  UUID NOT NULL REFERENCES builder_warranties(id),
  claim_id     UUID REFERENCES warranty_claims(id),
  event_type   TEXT NOT NULL,
  actor_id     UUID REFERENCES users(id),
  actor_type   TEXT NOT NULL DEFAULT 'staff' CHECK (actor_type IN ('staff','homeowner','system')),
  description  TEXT NOT NULL,
  payload      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE warranty_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON warranty_audit_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX idx_wae_tenant ON warranty_audit_events(tenant_id);
CREATE INDEX idx_wae_warranty ON warranty_audit_events(warranty_id);
CREATE INDEX idx_wae_claim ON warranty_audit_events(claim_id) WHERE claim_id IS NOT NULL;

-- ─── Seed: system templates (1-2-10) ────────────────────────────────────────
-- tenant_id = '00000000-0000-0000-0000-000000000000' (sentinel for system records)
-- is_system_template = TRUE so RLS policy allows all tenants to read

-- Insert sentinel tenant row so system templates can reference it via FK
INSERT INTO tenants (id, name, slug, tier, status, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'SYSTEM',
  'system',
  'enterprise',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO warranty_coverage_templates
  (id, tenant_id, name, description, is_system_template, is_active)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  '1-2-10 Standard Builder Warranty',
  'Industry-standard: 1-year workmanship, 2-year systems, 10-year structural',
  TRUE, TRUE
);

INSERT INTO warranty_coverage_template_items
  (tenant_id, template_id, coverage_type, title, description, duration_months, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000001',
   'workmanship', '1-Year Workmanship', 'Defects in materials and workmanship', 12, 1),
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000001',
   'systems', '2-Year Systems', 'Mechanical, electrical, plumbing, and HVAC systems', 24, 2),
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000001',
   'structural', '10-Year Structural', 'Load-bearing components and structural defects', 120, 3);
