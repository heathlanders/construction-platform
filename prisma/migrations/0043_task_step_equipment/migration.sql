-- 0043_task_step_equipment
--
-- Equipment recommendation for the Task Build-Out Engine. Each work step gains a structured list of
-- the heavy equipment / power tools a crew needs to do the step EFFICIENTLY (excavator, scissor/boom
-- lift, concrete pump, compactor…). Distinct from the freeform `tools` array: `equipment[].type` is a
-- canonical value aligned to company_assets.asset_type so the fleet (EAM, Phase 2) and the estimating
-- catalog (EQUIP-{TYPE}, Phase 3) can join on it.
--
-- Deterministic engine output (api/src/lib/task-buildout/equipment-rules.ts). Regenerated as a SET
-- with the rest of task_steps — no per-row version. Default '[]' so pre-0032 rows read cleanly.

ALTER TABLE task_steps
  ADD COLUMN IF NOT EXISTS equipment JSONB NOT NULL DEFAULT '[]'::jsonb;
  -- [{ type, category, reason, optional? }]
