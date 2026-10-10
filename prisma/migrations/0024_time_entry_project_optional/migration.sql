-- 0024_time_entry_project_optional
--
-- Make time_entries.project_id nullable so employees can log hours without tying them to a
-- specific project (per product decision: on the employee Add-Hours screen, project is an
-- optional field — only date + hours are required). Clock punches already allow a null project;
-- this aligns the manual ledger. No data change — existing rows keep their project_id.

ALTER TABLE time_entries ALTER COLUMN project_id DROP NOT NULL;
