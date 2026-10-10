-- ============================================================
-- 0003_files_table — file tracking for quarantine → live flow
-- ============================================================
-- The file-scan-worker expects a `files` table to track upload
-- lifecycle: scanning → ready | rejected.
-- Locked decisions: A-06, T-03, T-05, T-27, T-28, T-29, T-48
-- ============================================================

CREATE TYPE file_status AS ENUM ('scanning', 'ready', 'rejected');

CREATE TABLE files (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  project_id        UUID REFERENCES projects(id),
  filename          TEXT NOT NULL,
  content_type      TEXT NOT NULL,
  file_size_bytes   INTEGER NOT NULL,
  category          TEXT NOT NULL DEFAULT 'documents', -- image|document|plan|video
  quarantine_path   TEXT NOT NULL,
  storage_path      TEXT,     -- populated after scan passes and file is moved to live
  status            file_status NOT NULL DEFAULT 'scanning',
  version           INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id)
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE files FORCE ROW LEVEL SECURITY;

CREATE POLICY files_tenant_isolation ON files
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Standard indexes
CREATE INDEX idx_files_tenant_id      ON files(tenant_id);
CREATE INDEX idx_files_tenant_deleted ON files(tenant_id, deleted_at);
CREATE INDEX idx_files_tenant_project ON files(tenant_id, project_id);
CREATE INDEX idx_files_tenant_status  ON files(tenant_id, status);
