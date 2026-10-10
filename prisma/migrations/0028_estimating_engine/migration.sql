-- 0028_estimating_engine
--
-- Deterministic sub-level job estimating engine. Three tenant-scoped tables:
--   estimate_assemblies  — the cost catalog. System rows (sentinel tenant, is_system=TRUE) ship
--                          with the platform and are readable by every tenant; a tenant row with the
--                          same (trade, code) OVERRIDES the system row (cost cascade). Holds material$,
--                          production rate (labor_hours_per_unit), equipment$, waste% per unit.
--   estimates            — estimate header + markup params (overhead/profit/tax/contingency) + a
--                          snapshot burdened labor rate + rolled-up totals. FSM draft→final→sent→awarded/lost.
--   estimate_line_items  — priced lines. Each carries the unit cost basis snapshot + computed
--                          material/labor/equipment/extended cents + assumptions[]. Regenerated as a
--                          SET for source='rule_engine' (manual lines preserved), but individually
--                          optimistic-locked for hand edits.
--
-- Money in cents (T-02). RLS enabled + forced with WITH CHECK (A-03, mirrors 0026). Optimistic
-- locking via version (T-12). No tier gate — estimating is available on every tier.

-- Sentinel SYSTEM tenant (idempotent — also created by 0012).
INSERT INTO tenants (id, name, slug, tier, status, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000','SYSTEM','system','enterprise','active',NOW(),NOW())
ON CONFLICT (id) DO NOTHING;

-- ─── 1. estimate_assemblies (cost catalog) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS estimate_assemblies (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id),
  trade                  TEXT NOT NULL CHECK (trade IN ('electrical','plumbing','mechanical','building','general')),
  code                   TEXT NOT NULL,                       -- stable key, e.g. 'E-RECEP-DUP', 'PARAM-ELECTRICAL'
  name                   TEXT NOT NULL,
  description            TEXT,
  unit                   TEXT NOT NULL DEFAULT 'EA',          -- 'EA','LF','SF','CY',...
  csi_division           TEXT,
  material_cost_cents    INTEGER NOT NULL DEFAULT 0,          -- material $ per unit (T-02)
  labor_hours_per_unit   NUMERIC(10,3) NOT NULL DEFAULT 0,    -- production rate
  equipment_cost_cents   INTEGER NOT NULL DEFAULT 0,          -- equipment $ per unit
  waste_pct              NUMERIC(5,2) NOT NULL DEFAULT 0,     -- material waste %
  is_system              BOOLEAN NOT NULL DEFAULT FALSE,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  source                 TEXT,                                -- 'platform-seed' | 'tenant'
  version                INTEGER NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,
  created_by             UUID REFERENCES users(id)
);

ALTER TABLE estimate_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_assemblies FORCE ROW LEVEL SECURITY;
-- Read: own tenant OR any system row. Write (WITH CHECK): own tenant only — no tenant can insert or
-- mutate a system row (is_system rows carry the sentinel tenant_id, which never equals a real context).
CREATE POLICY tenant_isolation ON estimate_assemblies
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid OR is_system = TRUE)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE INDEX idx_estimate_assemblies_tenant ON estimate_assemblies(tenant_id, deleted_at);
CREATE INDEX idx_estimate_assemblies_trade ON estimate_assemblies(trade, deleted_at);
CREATE INDEX idx_estimate_assemblies_system ON estimate_assemblies(is_system) WHERE is_system = TRUE;
CREATE UNIQUE INDEX idx_estimate_assemblies_code ON estimate_assemblies(tenant_id, trade, code) WHERE deleted_at IS NULL;

-- ─── 2. estimates (header) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estimates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  project_id        UUID REFERENCES projects(id),           -- nullable: prospect/standalone estimate
  name              TEXT NOT NULL,
  trade             TEXT,                                    -- primary trade (nullable = multi-trade)
  building_type     TEXT,
  mode              TEXT NOT NULL DEFAULT 'assembly' CHECK (mode IN ('assembly','parametric')),
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','final','sent','awarded','lost')),
  labor_rate_cents  INTEGER NOT NULL DEFAULT 0,             -- burdened $/hr snapshot used for labor$
  overhead_pct      NUMERIC(5,2) NOT NULL DEFAULT 0,
  profit_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_pct           NUMERIC(5,2) NOT NULL DEFAULT 0,        -- applied to material only
  contingency_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
  material_cents    INTEGER NOT NULL DEFAULT 0,
  labor_cents       INTEGER NOT NULL DEFAULT 0,
  equipment_cents   INTEGER NOT NULL DEFAULT 0,
  subtotal_cents    INTEGER NOT NULL DEFAULT 0,
  markup_cents      INTEGER NOT NULL DEFAULT 0,
  total_cents       INTEGER NOT NULL DEFAULT 0,
  notes             TEXT,
  version           INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id)
);

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON estimates
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE INDEX idx_estimates_tenant ON estimates(tenant_id, deleted_at);
CREATE INDEX idx_estimates_project ON estimates(tenant_id, project_id);
CREATE INDEX idx_estimates_status ON estimates(tenant_id, status);

-- ─── 3. estimate_line_items ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estimate_line_items (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id),
  estimate_id            UUID NOT NULL REFERENCES estimates(id),
  assembly_id            UUID REFERENCES estimate_assemblies(id),  -- nullable: ad-hoc manual line
  assembly_code          TEXT,
  trade                  TEXT,
  description            TEXT NOT NULL,
  csi_division           TEXT,
  unit                   TEXT,
  quantity               NUMERIC(12,3) NOT NULL DEFAULT 0,
  -- unit cost basis snapshot (from the assembly at generate; editable per line)
  material_unit_cents    INTEGER NOT NULL DEFAULT 0,
  labor_hours_per_unit   NUMERIC(10,3) NOT NULL DEFAULT 0,
  equipment_unit_cents   INTEGER NOT NULL DEFAULT 0,
  waste_pct              NUMERIC(5,2) NOT NULL DEFAULT 0,
  -- computed amounts (recomputed on any edit / rate change)
  material_cents         INTEGER NOT NULL DEFAULT 0,
  labor_hours            NUMERIC(12,3) NOT NULL DEFAULT 0,
  labor_cents            INTEGER NOT NULL DEFAULT 0,
  equipment_cents        INTEGER NOT NULL DEFAULT 0,
  extended_cents         INTEGER NOT NULL DEFAULT 0,
  assumptions            JSONB NOT NULL DEFAULT '[]'::jsonb,       -- string[] — defensibility
  source                 TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('rule_engine','manual')),
  sort_order             INTEGER NOT NULL DEFAULT 0,
  version                INTEGER NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,
  created_by             UUID REFERENCES users(id)
);

ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON estimate_line_items
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE INDEX idx_estimate_line_items_tenant ON estimate_line_items(tenant_id, deleted_at);
CREATE INDEX idx_estimate_line_items_estimate ON estimate_line_items(tenant_id, estimate_id, sort_order);

-- ─── Seed: system assembly catalog (platform-seed) ──────────────────────────
-- Production rates (labor_hours_per_unit) are stable industry values; material $ are rough national
-- baselines a tenant tunes. All is_system=TRUE, sentinel tenant, source='platform-seed'.
INSERT INTO estimate_assemblies
  (tenant_id, trade, code, name, unit, csi_division, material_cost_cents, labor_hours_per_unit, equipment_cost_cents, waste_pct, is_system, source)
VALUES
  -- Electrical
  ('00000000-0000-0000-0000-000000000000','electrical','E-RECEP-DUP','Duplex receptacle (device + box + plate + wire)','EA','26 27 26',350,0.35,0,3,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-RECEP-GFCI','GFCI receptacle','EA','26 27 26',1800,0.45,0,3,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-SWITCH-1P','Single-pole switch','EA','26 27 26',300,0.30,0,3,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-LIGHT-REC','Recessed light (housing + trim)','EA','26 51 00',2800,0.60,0,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-LIGHT-FIX','Surface light fixture','EA','26 51 00',4500,0.50,0,3,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-SMOKE-CO','Smoke / CO combination detector','EA','28 31 00',3500,0.40,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-CIRCUIT-20','20A branch circuit home run (avg 60 ft)','EA','26 05 19',4200,1.20,0,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-PANEL-200','200A main panel + breakers','EA','26 24 16',45000,8.00,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-PANEL-100','100A sub-panel + breakers','EA','26 24 16',22000,5.00,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-SERVICE-200','200A service entrance (mast, meter, GEC)','EA','26 05 00',38000,10.00,0,0,TRUE,'platform-seed'),
  -- Plumbing
  ('00000000-0000-0000-0000-000000000000','plumbing','P-FIX-TOILET','Water closet set','EA','22 41 00',22000,2.00,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-FIX-LAV','Lavatory sink + faucet','EA','22 41 00',18000,2.50,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-FIX-TUB','Tub / shower set','EA','22 41 00',45000,4.00,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-FIX-KSINK','Kitchen sink + faucet','EA','22 41 00',28000,3.00,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-FIX-WH','Water heater (50 gal)','EA','22 33 00',95000,4.00,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-FIX-HOSE','Hose bib','EA','22 11 19',2500,0.75,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-DWV-ROUGH','DWV rough-in (per fixture)','EA','22 13 16',6500,2.50,0,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-SUPPLY-ROUGH','Water supply rough-in (per fixture)','EA','22 11 16',4500,2.00,0,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-GAS-LINE','Gas line drop','EA','22 11 23',8000,3.00,0,5,TRUE,'platform-seed'),
  -- Mechanical
  ('00000000-0000-0000-0000-000000000000','mechanical','M-FURNACE','Furnace / FAU set','EA','23 54 00',120000,8.00,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','mechanical','M-CONDENSER','AC condenser set','EA','23 62 00',140000,6.00,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','mechanical','M-DUCT-RUN','Duct run (per register)','EA','23 31 00',8500,2.50,0,10,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','mechanical','M-REGISTER','Supply / return register','EA','23 37 00',2200,0.50,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','mechanical','M-BATH-FAN','Bath exhaust fan + duct','EA','23 34 00',6500,1.50,0,5,TRUE,'platform-seed'),
  -- Building / general (unit)
  ('00000000-0000-0000-0000-000000000000','building','B-FOOTING','Continuous footing','LF','03 30 00',1800,0.15,400,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-SLAB-SF','Slab on grade','SF','03 30 00',650,0.020,40,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FRAME-SF','Wood framing (floor area)','SF','06 11 00',900,0.050,0,10,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-ROOF-SF','Roof cover','SF','07 31 00',450,0.030,0,12,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-INSUL-SF','Insulation','SF','07 21 00',180,0.010,0,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-DRYWALL-SF','Drywall hung + finished','SF','09 29 00',220,0.020,0,10,TRUE,'platform-seed'),
  -- Parametric $/SF (all-in per SF; labor rolled into material_cost_cents, labor_hours=0). mode='parametric'.
  ('00000000-0000-0000-0000-000000000000','electrical','PARAM-ELECTRICAL','Electrical — all-in per SF','SF','26 00 00',1200,0,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','PARAM-PLUMBING','Plumbing — all-in per SF','SF','22 00 00',1000,0,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','mechanical','PARAM-MECHANICAL','Mechanical — all-in per SF','SF','23 00 00',900,0,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','PARAM-BUILDING','General building — all-in per SF','SF','01 00 00',8500,0,0,0,TRUE,'platform-seed');
