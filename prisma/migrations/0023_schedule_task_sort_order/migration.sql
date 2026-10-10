-- 0023_schedule_task_sort_order
--
-- Adds sort_order to schedule_tasks so task ordering is editable post-import and the
-- dependency rule engine can be RE-run from live schedule_tasks (not just at blueprint import).
-- Until now sort_order lived only on blueprint_proposed_tasks; the engine read it at import time
-- and it was lost afterward, so a recompute had nothing to order by. Backfill from the proposed
-- task each schedule_task was imported from.

ALTER TABLE schedule_tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER;

UPDATE schedule_tasks st
SET    sort_order = bpt.sort_order
FROM   blueprint_proposed_tasks bpt
WHERE  bpt.schedule_task_id = st.id
  AND  st.sort_order IS NULL;
