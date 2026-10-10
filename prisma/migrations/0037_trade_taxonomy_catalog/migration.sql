-- 0037_trade_taxonomy_catalog
--
-- Trade Taxonomy (T-64, Doc 21) — Phase 4: estimating catalog depth for the newly-classified
-- subcontractor trades (masonry, asphalt/flatwork, siding/stucco, drywall, painting, tile,
-- flooring, cabinetry, striping, fire sprinkler, gas piping, fire alarm, solar, generators …).
-- Data-ops only — no engine/schema change. Assemblies stay in the 5 EstTrade buckets
-- (electrical|plumbing|mechanical|building|general); the code prefix + csi_division carry the
-- taxonomy trade. INSERT-only, sentinel tenant, source='platform-seed'. Rough national baseline
-- $ a tenant tunes with a same-(trade,code) override (RLS cascade, migration 0028).
-- (0036 is reserved by the Project Map branch.)
--
-- Idempotent: ON CONFLICT on the partial unique (tenant_id,trade,code) WHERE deleted_at IS NULL.

INSERT INTO estimate_assemblies
  (tenant_id, trade, code, name, unit, csi_division, material_cost_cents, labor_hours_per_unit, equipment_cost_cents, waste_pct, is_system, source)
VALUES
  -- Electrical bucket: fire alarm / security / solar / generator (taxonomy: fire_alarm, security_access, solar_pv, generators)
  ('00000000-0000-0000-0000-000000000000','electrical','E-FA-DEVICE','Fire alarm device (horn/strobe/detector, wired)','EA','28 46 00',9500,1.00,0,3,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-SEC-CAMERA','Security camera drop (IP cam + cabling)','EA','28 20 00',22000,1.50,0,3,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-PV-PANEL','Solar PV panel installed (racking share incl.)','EA','26 31 00',28000,1.25,0,2,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','electrical','E-GENERATOR-STANDBY','Standby generator + transfer switch (residential)','EA','26 32 13',550000,16.00,5000,0,TRUE,'platform-seed'),

  -- Plumbing bucket: fire sprinkler / gas piping (taxonomy: fire_sprinkler, gas_piping)
  ('00000000-0000-0000-0000-000000000000','plumbing','P-SPRINKLER-HEAD','Fire sprinkler head + branch piping share','EA','21 13 13',8500,1.20,0,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','plumbing','P-GAS-PIPE-LF','Fuel gas piping (black iron/CSST)','LF','23 11 23',750,0.070,0,8,TRUE,'platform-seed'),

  -- Building bucket: masonry (taxonomy: masonry)
  ('00000000-0000-0000-0000-000000000000','building','B-CMU-SF','CMU block wall (laid, reinforced, grouted)','SF','04 22 00',950,0.110,0,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-BRICK-VENEER-SF','Brick veneer (anchored, flashed, weeped)','SF','04 21 13',1400,0.140,0,8,TRUE,'platform-seed'),

  -- Building bucket: site paving / flatwork / striping support (taxonomy: asphalt_paving, concrete_flatwork)
  ('00000000-0000-0000-0000-000000000000','building','B-ASPHALT-SY','Asphalt paving, 3" lift over prepared base','SY','32 12 16',2200,0.060,600,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-AGG-BASE-SY','Aggregate base, 6" compacted','SY','32 11 23',800,0.040,300,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FLATWORK-SF','Concrete flatwork 4" (drives/walks, broom finish)','SF','32 13 13',650,0.045,50,5,TRUE,'platform-seed'),

  -- Building bucket: cladding (taxonomy: siding, stucco_eifs) + fence + gutters
  ('00000000-0000-0000-0000-000000000000','building','B-SIDING-FC-SF','Fiber cement siding over WRB','SF','07 46 46',520,0.045,0,12,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-STUCCO-SF','Three-coat stucco over lath','SF','09 24 00',700,0.070,0,10,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-FENCE-LF','Site fencing (wood privacy baseline)','LF','32 31 29',3200,0.180,0,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','building','B-GUTTER-LF','Gutter + downspout (aluminum K-style)','LF','07 71 23',600,0.050,0,5,TRUE,'platform-seed'),

  -- Building bucket: drywall (taxonomy: drywall — hang/tape/finish per SF of board)
  ('00000000-0000-0000-0000-000000000000','building','B-DRYWALL-SF','Gypsum board hung, taped, finished (level 4)','SF','09 21 16',95,0.016,0,10,TRUE,'platform-seed'),

  -- General bucket: interior finish trades (taxonomy: painting, tile, flooring_*, cabinetry, countertops)
  ('00000000-0000-0000-0000-000000000000','general','G-PAINT-SF','Interior painting, walls/ceilings (prime + 2 coats)','SF','09 91 23',35,0.008,0,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','G-PAINT-EXT-SF','Exterior painting (prep + 2 coats)','SF','09 91 13',45,0.010,0,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','G-TILE-FLOOR-SF','Ceramic/porcelain floor tile set + grouted','SF','09 30 13',750,0.080,0,10,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','G-TILE-SHOWER-SF','Shower wall tile incl. waterproofing membrane','SF','09 30 13',1100,0.120,0,10,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','G-FLOOR-LVP-SF','LVP / resilient plank flooring','SF','09 65 19',420,0.020,0,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','G-FLOOR-HARDWOOD-SF','Hardwood flooring installed + finished','SF','09 64 29',950,0.045,0,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','G-FLOOR-CARPET-SY','Carpet + pad installed','SY','09 68 13',2800,0.120,0,8,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','G-FLOOR-EPOXY-SF','Epoxy floor coating (prep + 2 coats)','SF','09 67 23',380,0.020,0,5,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','G-CAB-BASE-LF','Base cabinets installed','LF','12 32 00',22000,0.700,0,3,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','G-CAB-UPPER-LF','Upper cabinets installed','LF','12 32 00',18000,0.600,0,3,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','G-CTOP-LF','Countertop templated + installed (stone baseline)','LF','12 36 40',14000,0.400,0,5,TRUE,'platform-seed'),

  -- General bucket: sitework services (taxonomy: pavement_marking, demolition, final_clean)
  ('00000000-0000-0000-0000-000000000000','general','G-STRIPE-STALL','Parking stall striped (layout + paint)','EA','32 17 23',900,0.150,0,3,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','G-DEMO-SF','Selective interior demolition + haul-off','SF','02 41 19',60,0.015,20,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','G-CLEAN-SF','Final construction clean','SF','01 74 23',6,0.004,0,0,TRUE,'platform-seed')
ON CONFLICT (tenant_id, trade, code) WHERE deleted_at IS NULL DO NOTHING;
