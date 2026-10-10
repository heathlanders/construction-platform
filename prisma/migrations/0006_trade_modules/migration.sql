-- Migration 0006: Residential trade modules
-- concrete_pours, framing_inspections, hvac_equipment, roofing_systems

-- ─── concrete_pours ─────────────────────────────────────────────────────────

CREATE TABLE concrete_pours (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  project_id      UUID NOT NULL REFERENCES projects(id),
  pour_type       TEXT NOT NULL,          -- slab, footing, wall, column, driveway, other
  volume_cy       NUMERIC(8,2),           -- cubic yards
  mix_design      TEXT,                   -- e.g. '4000 PSI, 3/4" aggregate'
  slump_inches    NUMERIC(4,1),           -- slump test result
  pour_date       DATE,
  status          TEXT NOT NULL DEFAULT 'planned',  -- planned, in_progress, complete, failed
  notes           TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_concrete_pours_tenant_id      ON concrete_pours(tenant_id);
CREATE INDEX idx_concrete_pours_tenant_deleted ON concrete_pours(tenant_id, deleted_at);
CREATE INDEX idx_concrete_pours_tenant_project ON concrete_pours(tenant_id, project_id);
CREATE INDEX idx_concrete_pours_tenant_updated ON concrete_pours(tenant_id, updated_at);

ALTER TABLE concrete_pours ENABLE ROW LEVEL SECURITY;
ALTER TABLE concrete_pours FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON concrete_pours
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ─── framing_inspections ────────────────────────────────────────────────────

CREATE TABLE framing_inspections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  project_id      UUID NOT NULL REFERENCES projects(id),
  section         TEXT NOT NULL,  -- exterior_walls, roof_trusses, floor_system, sheathing, interior_walls, other
  inspection_date DATE,
  inspector_name  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending, passed, failed, requires_correction
  correction_note TEXT,
  notes           TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_framing_inspections_tenant_id      ON framing_inspections(tenant_id);
CREATE INDEX idx_framing_inspections_tenant_deleted ON framing_inspections(tenant_id, deleted_at);
CREATE INDEX idx_framing_inspections_tenant_project ON framing_inspections(tenant_id, project_id);
CREATE INDEX idx_framing_inspections_tenant_updated ON framing_inspections(tenant_id, updated_at);

ALTER TABLE framing_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE framing_inspections FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON framing_inspections
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ─── hvac_equipment ─────────────────────────────────────────────────────────

CREATE TABLE hvac_equipment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  project_id      UUID NOT NULL REFERENCES projects(id),
  equipment_type  TEXT NOT NULL,  -- furnace, ac_unit, heat_pump, air_handler, mini_split, duct_system, ventilation, other
  manufacturer    TEXT,
  model           TEXT,
  serial_number   TEXT,
  tonnage         NUMERIC(4,1),   -- cooling tons (e.g. 3.5)
  seer_rating     NUMERIC(5,1),   -- Seasonal Energy Efficiency Ratio
  location        TEXT,           -- e.g. 'Basement', 'Attic', 'Unit 2'
  permit_number   TEXT,
  install_date    DATE,
  status          TEXT NOT NULL DEFAULT 'planned',  -- planned, ordered, installed, commissioned, complete
  notes           TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_hvac_equipment_tenant_id      ON hvac_equipment(tenant_id);
CREATE INDEX idx_hvac_equipment_tenant_deleted ON hvac_equipment(tenant_id, deleted_at);
CREATE INDEX idx_hvac_equipment_tenant_project ON hvac_equipment(tenant_id, project_id);
CREATE INDEX idx_hvac_equipment_tenant_updated ON hvac_equipment(tenant_id, updated_at);

ALTER TABLE hvac_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvac_equipment FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON hvac_equipment
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ─── roofing_systems ────────────────────────────────────────────────────────

CREATE TABLE roofing_systems (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  project_id      UUID NOT NULL REFERENCES projects(id),
  roof_type       TEXT NOT NULL,  -- asphalt_shingle, metal, flat_tpo, flat_epdm, tile, cedar_shake, other
  total_squares   NUMERIC(8,2),   -- roofing squares (1 square = 100 sq ft)
  underlayment_type TEXT,         -- e.g. 'Synthetic felt', 'Ice & water shield'
  manufacturer    TEXT,
  product_line    TEXT,           -- e.g. 'Owens Corning Duration'
  color           TEXT,
  warranty_years  INTEGER,        -- manufacturer warranty
  install_date    DATE,
  status          TEXT NOT NULL DEFAULT 'planned',  -- planned, tear_off, decking, underlayment, installed, inspected, complete
  permit_number   TEXT,
  notes           TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_roofing_systems_tenant_id      ON roofing_systems(tenant_id);
CREATE INDEX idx_roofing_systems_tenant_deleted ON roofing_systems(tenant_id, deleted_at);
CREATE INDEX idx_roofing_systems_tenant_project ON roofing_systems(tenant_id, project_id);
CREATE INDEX idx_roofing_systems_tenant_updated ON roofing_systems(tenant_id, updated_at);

ALTER TABLE roofing_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE roofing_systems FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON roofing_systems
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);
