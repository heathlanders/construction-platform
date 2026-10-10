-- 0022_task_steps
--
-- Task Build-Out Engine output: per-task ordered work steps for the field.
-- The deterministic engine (api/src/lib/task-buildout/) expands each schedule_task into laborer
-- instructions, referencing the blueprint analysis (extracted panels/fixtures/rooms/flags/components)
-- and the codes engine (resolved code edition + inspection sequence). Built on blueprint import and
-- rebuildable on demand. Steps are read by all org users; rebuild is OWNER/PM.
--
-- Regenerated as a SET (no per-row version): a rebuild soft-deletes prior source='rule_engine' rows
-- and inserts fresh ones, preserving any source='manual' rows.

CREATE TABLE IF NOT EXISTS task_steps (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  task_id                 UUID NOT NULL REFERENCES schedule_tasks(id),
  step_order              INTEGER NOT NULL DEFAULT 0,
  title                   TEXT NOT NULL,
  instruction             TEXT NOT NULL,
  detail                  TEXT,
  code_refs               JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{code_type, section, note?}]
  tools                   JSONB NOT NULL DEFAULT '[]'::jsonb,  -- string[]
  materials               JSONB NOT NULL DEFAULT '[]'::jsonb,  -- string[]
  safety                  JSONB NOT NULL DEFAULT '[]'::jsonb,  -- string[]
  gating_inspection_type  TEXT,                                -- matches inspections.inspection_type
  qa_check                TEXT,
  source                  TEXT NOT NULL DEFAULT 'rule_engine'
                            CHECK (source IN ('rule_engine','manual')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

ALTER TABLE task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_steps FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON task_steps
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_task_steps_tenant_task ON task_steps(tenant_id, task_id, step_order);
