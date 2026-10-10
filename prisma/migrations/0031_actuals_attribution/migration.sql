-- 0031_actuals_attribution
--
-- Estimating Engine — Iteration Phase 2a (attribution link for learn-from-actuals).
--
-- Stamp the source assembly onto the records that later accrue ACTUAL cost, so a tenant's
-- historical actuals can be joined back to the `estimate_assemblies` catalog row they came from
-- (basis for the deterministic `GET /v1/estimate-assemblies/suggestions` endpoint, Phase 2b).
--
--   budget_line_items.assembly_code  — stamped by POST /v1/estimates/:id/award when seeding budget
--                                      lines from estimate_line_items (labor actuals flow here via
--                                      field-cost-worker → budget_line_items.actual_cents).
--   takeoff_items.assembly_code      — stamped by POST /v1/estimates/:id/to-bid-package. Material
--                                      actuals chain: awarded vendor_bid_line_items.unit_cost_cents
--                                      → takeoff_item_id → takeoff_items.assembly_code → the assembly.
--
-- Both columns are NULLABLE and backfill-safe (no default, no rewrite of existing rows). No new table.
-- `budget_line_items` already carries `cost_code_id` (migration 0007) — no need to add it here.
-- Existing RLS on both tables (enabled + forced) already scopes these columns. See
-- docs/Estimating_Engine_Iteration_Plan_v2_0.md §Phase 2 + Schema_Reference.md §Domain 18.

ALTER TABLE budget_line_items
  ADD COLUMN IF NOT EXISTS assembly_code TEXT;

ALTER TABLE takeoff_items
  ADD COLUMN IF NOT EXISTS assembly_code TEXT;

-- Attribution join indexes (partial — only stamped rows participate)
CREATE INDEX IF NOT EXISTS idx_budget_line_items_assembly
  ON budget_line_items (tenant_id, assembly_code) WHERE assembly_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_takeoff_items_assembly
  ON takeoff_items (tenant_id, assembly_code) WHERE assembly_code IS NOT NULL;
