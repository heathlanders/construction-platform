-- 0044_equipment_catalog
--
-- Equipment cost — Phase 3 of the task-equipment feature. Seeds EQUIP-{TYPE} system assemblies so the
-- estimating engine can price the heavy equipment the Task Build-Out Engine recommends per task.
-- Unit = DAY; the whole cost sits in equipment_cost_cents (material/labor = 0) so it rolls into the
-- estimate's equipment_cents without touching material/labor math. trade='general' (equipment is not a
-- discipline). `code` = EQUIP-{TYPE} where TYPE matches task_steps.equipment[].type / company_assets.asset_type.
--
-- Day rates are rough national rental baselines a tenant tunes with a same-(trade,code) override
-- (RLS cascade, migration 0028). INSERT-only, sentinel tenant, source='platform-seed'.
-- Idempotent: ON CONFLICT on the partial unique (tenant_id,trade,code) WHERE deleted_at IS NULL.

INSERT INTO estimate_assemblies
  (tenant_id, trade, code, name, unit, csi_division, material_cost_cents, labor_hours_per_unit, equipment_cost_cents, waste_pct, is_system, source)
VALUES
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-EXCAVATOR','Excavator (rental, per day)','DAY','01 54 00',0,0,60000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-BACKHOE','Backhoe (rental, per day)','DAY','01 54 00',0,0,45000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-SKID_STEER','Skid steer (rental, per day)','DAY','01 54 00',0,0,35000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-TRENCHER','Trencher (rental, per day)','DAY','01 54 00',0,0,30000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-COMPACTOR','Plate compactor / roller (rental, per day)','DAY','01 54 00',0,0,12000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-DUMP_TRUCK','Dump truck (per day)','DAY','01 54 00',0,0,55000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-CONCRETE_PUMP','Concrete pump (per day)','DAY','01 54 00',0,0,150000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-POWER_TROWEL','Power trowel (rental, per day)','DAY','01 54 00',0,0,10000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-SCISSOR_LIFT','Scissor lift (rental, per day)','DAY','01 54 00',0,0,18000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-BOOM_LIFT','Boom lift (rental, per day)','DAY','01 54 00',0,0,45000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-TELEHANDLER','Telehandler (rental, per day)','DAY','01 54 00',0,0,40000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-FORKLIFT','Rough-terrain forklift (rental, per day)','DAY','01 54 00',0,0,40000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-CRANE','Crane + operator (per day)','DAY','01 54 00',0,0,250000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-MATERIAL_HOIST','Material hoist (rental, per day)','DAY','01 54 00',0,0,20000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-GENERATOR','Generator (rental, per day)','DAY','01 54 00',0,0,12000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-AIR_COMPRESSOR','Air compressor (rental, per day)','DAY','01 54 00',0,0,10000,0,TRUE,'platform-seed'),
  ('00000000-0000-0000-0000-000000000000','general','EQUIP-WELDER','Welder (rental, per day)','DAY','01 54 00',0,0,12000,0,TRUE,'platform-seed')
ON CONFLICT (tenant_id, trade, code) WHERE deleted_at IS NULL DO NOTHING;
