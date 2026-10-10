-- 0029_estimate_proposal
--
-- Customer-facing proposal PDF for an estimate (Estimating Engine — Iteration Phase 1).
-- Two columns on `estimates`:
--   proposal_path          — live storage path of the generated proposal PDF
--                            (${tenant_id}/live/estimates/proposals/${estimate_id}.pdf; overwritten on regen)
--   proposal_generated_at  — when the current proposal PDF was last rendered
--
-- No new table, no new RLS — the existing `estimates` RLS (enabled + forced + WITH CHECK, migration 0028)
-- already scopes these columns. Sending a proposal reuses the FSM 'sent' status (migration 0028), so no
-- status enum change. See docs/Estimating_Engine_v1_0.md + Schema_Reference.md §Domain 18.

ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS proposal_path         TEXT,
  ADD COLUMN IF NOT EXISTS proposal_generated_at TIMESTAMPTZ;
