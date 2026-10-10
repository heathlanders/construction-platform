-- 0021_schedule_task_meta_photos
--
-- Two changes to support the richer task view/editor + codes integration + QA photos:
--
--   A1. Make trade_type/phase/csi_division NATIVE on schedule_tasks. Until now these lived
--       only on blueprint_proposed_tasks and were read via LEFT JOIN — so hand-created
--       (non-blueprint) tasks had no trade/phase and could not resolve codes or slot into a
--       phase column. Backfill from the originating proposed task; new/manual tasks set them
--       directly. The Overview query keeps the JOIN as a fallback for any un-backfilled row.
--
--   A2. schedule_task_photos — proof/QA photos attached to a task (uploaded mostly from the
--       mobile app by field roles, reviewed on web/mobile by OWNER/PM). Mirrors
--       warranty_claim_photos: storage_path points at the LIVE path of an already-scanned
--       file (the existing /v1/files/upload quarantine→scan→live pipeline produces it).
--
-- All ALTERs use IF NOT EXISTS — backward-compatible (mirrors 0013-0019 widenings).

-- ── A1: schedule_tasks trade/phase/csi (nullable, loose TEXT like blueprint_proposed_tasks) ──
ALTER TABLE schedule_tasks
  ADD COLUMN IF NOT EXISTS trade_type   TEXT,
  ADD COLUMN IF NOT EXISTS phase        TEXT,
  ADD COLUMN IF NOT EXISTS csi_division TEXT;

-- Backfill from the proposed task that produced each schedule task (only where unset).
UPDATE schedule_tasks st
SET trade_type   = bpt.trade_type,
    phase        = bpt.phase,
    csi_division = bpt.csi_division
FROM blueprint_proposed_tasks bpt
WHERE bpt.schedule_task_id = st.id
  AND st.trade_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_schedule_tasks_tenant_phase ON schedule_tasks(tenant_id, phase);

-- ── A2: schedule_task_photos (proof/QA photos) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_task_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  task_id       UUID NOT NULL REFERENCES schedule_tasks(id),
  storage_path  TEXT NOT NULL,                 -- LIVE path (files.storage_path after scan passes)
  caption       TEXT,
  photo_type    TEXT NOT NULL DEFAULT 'proof'
                  CHECK (photo_type IN ('proof','qa','progress','defect')),
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

ALTER TABLE schedule_task_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_task_photos FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON schedule_task_photos
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_stp_tenant_task ON schedule_task_photos(tenant_id, task_id);
