-- 0036_project_geocode — Project Map Phase 1 (Foundation)
-- Adds geocode columns to `projects` + centroid columns to the `counties` reference table.
-- See docs/Project_Map_v1_0.md §1, §2, §10.
--
-- `projects` is tenant-scoped (RLS). New cols are worker-set (geocode-worker) or set by the
-- manual pin-drop PATCH /v1/projects/:id/location — no `version` change needed for the worker path.
-- `counties` is a platform-scoped no-RLS reference table (migration 0020, Domain 16); its centroids
-- are the `approximate` geocode fallback (MQ-1), ingested by scripts/import-county-centroids.ts.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS latitude       NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude      NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS geocode_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (geocode_status IN ('pending','exact','approximate','failed')),
  ADD COLUMN IF NOT EXISTS geocoded_at    TIMESTAMPTZ;

-- Bbox / has-coords lookups for the portfolio map — live rows only.
CREATE INDEX IF NOT EXISTS idx_projects_tenant_lat_lng
  ON projects(tenant_id, latitude, longitude)
  WHERE deleted_at IS NULL;

-- County centroid — source for the `approximate` geocode fallback (MQ-1).
ALTER TABLE counties
  ADD COLUMN IF NOT EXISTS centroid_lat NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS centroid_lng NUMERIC(9,6);
