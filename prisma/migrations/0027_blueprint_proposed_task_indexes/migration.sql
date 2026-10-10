-- 0027_blueprint_proposed_task_indexes — B4.4 (Blueprint Gap Remediation Phase 4)
-- Composite indexes on blueprint_proposed_tasks for the two hot access paths:
--   1. Task list / review — ordered by sort_order, cursor-paginated by id, scoped to an analysis.
--   2. Import — the accepted, not-yet-imported query (review_status='accepted' AND schedule_task_id IS NULL).
-- The table is small per analysis but grows across a tenant's history; these keep the list + import
-- queries index-only-ish instead of scanning all of a tenant's proposed tasks.

CREATE INDEX IF NOT EXISTS idx_blueprint_proposed_tasks_analysis_order
  ON blueprint_proposed_tasks (analysis_id, sort_order, id);

CREATE INDEX IF NOT EXISTS idx_blueprint_proposed_tasks_analysis_review
  ON blueprint_proposed_tasks (analysis_id, review_status, schedule_task_id);
