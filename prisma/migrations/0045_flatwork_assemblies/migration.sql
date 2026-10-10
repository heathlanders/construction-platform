-- 0045_flatwork_assemblies
--
-- Design Studio (Client Visualizer, proposed T-65) — P1b: catalog depth for the concrete_flatwork
-- intake module (api/src/lib/intake/trades/concrete_flatwork.ts). The module prices against the
-- existing B-FLATWORK-SF (4" broom baseline), B-AGG-BASE-SY, B-REBAR-LF and EQUIP-CONCRETE_PUMP plus
-- the add-on/option rows below. Codes are modelled as ADDERS on top of the 4" broom baseline so every
-- client choice maps to exactly one priced line (defensible, editable by the contractor).
--
-- Data-ops only, same convention as 0037: INSERT-only, sentinel tenant, source='platform-seed',
-- rough national baseline $ a tenant tunes with a same-(trade,code) override. Removal of an existing
-- EXTERIOR surface gets its own code — G-DEMO-SF is interior selective demo.
--
-- Idempotent: ON CONFLICT on the partial unique (tenant_id,trade,code) WHERE deleted_at IS NULL.

INSERT INTO estimate_assemblies
  (tenant_id, trade, code, name, unit, csi_division, material_cost_cents, labor_hours_per_unit, equipment_cost_cents, waste_pct, is_system, source)
VALUES
  -- Site prep
  ('00000000-0000-0000-0000-000000000000','general','G-SITE-DEMO-SF','Exterior hardscape removal + haul-off (concrete/asphalt/pavers, to 6")','SF','02 41 13',0,0.030,120,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-EXCAV-SF','Excavate + grade for flatwork (sod/soil removal, 6")','SF','31 22 00',0,0.015,40,0,TRUE,'platform-seed'),

  -- Structure adders (on top of B-FLATWORK-SF 4" broom)
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-THICK-SF-IN','Flatwork added thickness (per SF, per inch over 4")','SF','32 13 13',55,0.004,5,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-FIBER-SF','Synthetic fiber reinforcement (flatwork)','SF','03 24 00',15,0.000,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-MESH-SF','Welded wire mesh reinforcement, chaired (flatwork)','SF','03 22 00',35,0.005,0,10,TRUE,'platform-seed'),

  -- Finish / look adders
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-TROWEL-SF','Smooth steel-trowel finish upgrade (flatwork)','SF','03 35 00',0,0.010,5,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-STAMP-SF','Stamped finish incl. color hardener + release (flatwork)','SF','03 35 16',250,0.060,20,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-EXPOSED-SF','Exposed aggregate finish (flatwork)','SF','03 35 23',120,0.030,10,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-COLOR-SF','Integral color (flatwork)','SF','03 05 00',90,0.000,0,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-BORDER-LF','Decorative border band (stamped/colored, flatwork)','LF','03 35 16',300,0.080,0,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-SAWCUT-LF','Saw-cut control joints (flatwork)','LF','32 13 73',10,0.020,25,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-SEAL-SF','Penetrating/acrylic sealer (flatwork)','SF','07 19 00',25,0.004,0,10,TRUE,'platform-seed'),

  -- Extras
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-STEP-EA','Concrete step, formed (per riser, to 6 ft wide)','EA','03 30 00',9000,3.00,0,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FLAT-DRAIN-LF','Trench / channel drain set in flatwork','LF','33 46 00',4500,0.500,0,3,TRUE,'platform-seed')
ON CONFLICT (tenant_id, trade, code) WHERE deleted_at IS NULL DO NOTHING;
