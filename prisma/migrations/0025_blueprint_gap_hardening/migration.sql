-- Migration 0025: Blueprint gap hardening (Phase 1 — B1.1, B1.3)
-- 1. Repoint blueprint_analyses.document_id from the orphaned `documents` table to `files`
--    (the upload UI only ever creates `files` rows; nothing writes `documents` on the
--    blueprint on-ramp). NOT VALID keeps the 14 legacy analyses (which point at real
--    documents rows and are already terminal/imported) — only new inserts/updates check.
-- 2. Concurrency: UNIQUE (analysis_id, page_number) on sheets, and a unique key that makes
--    the proposed-task ON CONFLICT DO NOTHING (permit-milestone re-injection) real.

-- ─── 1. document_id → files ──────────────────────────────────────────────────
ALTER TABLE blueprint_analyses DROP CONSTRAINT IF EXISTS blueprint_analyses_document_id_fkey;

ALTER TABLE blueprint_analyses
  ADD CONSTRAINT blueprint_analyses_document_id_files_fkey
  FOREIGN KEY (document_id) REFERENCES files(id) NOT VALID;

COMMENT ON COLUMN blueprint_analyses.document_id IS
  'FK to files(id) (the scanned plan). Legacy rows may still reference documents(id) — FK is NOT VALID so those are not re-checked.';

-- ─── 2. Concurrency guards ───────────────────────────────────────────────────
-- One sheet row per page per analysis (worker inserts one row per PDF page).
CREATE UNIQUE INDEX IF NOT EXISTS uq_blueprint_sheets_analysis_page
  ON blueprint_sheets (analysis_id, page_number);

-- Makes the proposed-task `ON CONFLICT DO NOTHING` (permit-milestone re-injection,
-- legacy per-sheet stub) genuinely idempotent. Template/extraction plain INSERTs each
-- carry a distinct sort_order so they never collide here; only re-injection can.
CREATE UNIQUE INDEX IF NOT EXISTS uq_blueprint_proposed_tasks_dedup
  ON blueprint_proposed_tasks (analysis_id, phase, sort_order, title);
