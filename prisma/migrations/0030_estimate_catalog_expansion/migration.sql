-- 0030_estimate_catalog_expansion
--
-- Estimating Engine — Iteration Phase 3 (catalog depth, data-ops only; no engine/schema change).
-- Adds is_system depth assemblies across all four trades so estimators have real unit-of-measure
-- coverage (LF/CY/SQ/EA) beyond the launch baseline. INSERT-only, sentinel tenant, source='platform-seed'.
-- Production rates are stable industry values; material $ are rough national baselines a tenant tunes
-- with a same-(trade,code) override (RLS cascade, migration 0028). The building rows also back the new
-- assembly-mode building seeder in quantities.ts (window/door/room-area → B-WINDOW/B-DOOR/B-*-SF).
--
-- Idempotent: ON CONFLICT on the partial unique (tenant_id,trade,code) WHERE deleted_at IS NULL.

INSERT INTO estimate_assemblies
  (tenant_id, trade, code, name, unit, csi_division, material_cost_cents, labor_hours_per_unit, equipment_cost_cents, waste_pct, is_system, source)
VALUES
  -- Electrical (low-voltage, EV, sub-feeds)
  ('00000000-0000-0000-0000-000000000000','electrical','E-SUBPANEL-100','100A sub-panel + feed','EA','26 24 16',18000,4.00,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-DATA-DROP','Low-voltage data drop (Cat6, jack, term)','EA','27 15 00',1200,0.50,0,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-EVSE','Level-2 EV charger circuit (40A)','EA','26 27 00',65000,3.00,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-AC-DISCONNECT','AC disconnect + whip','EA','26 28 16',4500,0.75,0,0,TRUE,'platform-seed'),
  -- Plumbing (by-LF pipe + more fixtures)
  ('00000000-0000-0000-0000-000000000000','plumbing','P-FIX-SHOWER','Shower valve + trim set','EA','22 41 00',38000,3.50,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-FLOOR-DRAIN','Floor drain + trap','EA','22 13 19',6000,1.50,0,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-PIPE-PEX-LF','PEX water supply pipe','LF','22 11 16',180,0.040,0,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-DWV-PIPE-LF','DWV pipe (PVC/ABS)','LF','22 13 16',650,0.060,0,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-CLEANOUT','Cleanout access','EA','22 05 76',3500,1.00,0,0,TRUE,'platform-seed'),
  -- Mechanical (ductwork by LF, ductless, commercial)
  ('00000000-0000-0000-0000-000000000000','mechanical','M-DUCT-LF','Sheet-metal / flex duct','LF','23 31 00',1400,0.120,0,10,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','mechanical','M-DUCT-INSUL-LF','Duct insulation wrap','LF','23 07 13',350,0.030,0,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','mechanical','M-REFRIG-LINE-LF','Refrigerant line set','LF','23 23 00',900,0.080,0,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','mechanical','M-MINISPLIT','Ductless mini-split (indoor + outdoor)','EA','23 81 26',180000,6.00,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','mechanical','M-THERMOSTAT','Programmable thermostat','EA','23 09 00',12000,1.00,0,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','mechanical','M-RTU','Packaged rooftop unit (commercial)','EA','23 74 00',850000,16.00,5000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','mechanical','M-VAV-BOX','VAV terminal box','EA','23 36 00',65000,3.00,0,0,TRUE,'platform-seed'),
  -- Building (by real units: SQ, CY, LF, EA)
  ('00000000-0000-0000-0000-000000000000','building','B-ROOF-SHINGLE-SQ','Asphalt shingle roofing (per square = 100 SF)','SQ','07 31 13',12000,1.60,0,12,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-UNDERLAYMENT-SF','Roof underlayment','SF','07 31 00',45,0.005,0,10,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-CONCRETE-CY','Ready-mix concrete placed','CY','03 30 00',16500,0.80,800,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-REBAR-LF','Reinforcing bar','LF','03 21 00',120,0.020,0,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-WALL-FRAME-LF','Wall framing (per LF of wall)','LF','06 11 00',1400,0.090,0,10,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-SHEATHING-SF','Wall / roof sheathing','SF','06 16 00',130,0.012,0,10,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-SIDING-SF','Exterior siding','SF','07 46 00',380,0.035,0,12,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-WINDOW','Window unit (supply + install)','EA','08 50 00',45000,1.50,0,3,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-DOOR-INT','Interior door (slab + jamb + hardware)','EA','08 14 00',18000,1.20,0,3,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-DOOR-EXT','Exterior door (unit + install)','EA','08 11 00',65000,2.50,0,3,TRUE,'platform-seed')
ON CONFLICT (tenant_id, trade, code) WHERE deleted_at IS NULL DO NOTHING;
