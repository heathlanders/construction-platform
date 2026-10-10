-- 0019_jurisdiction_engine
--
-- Sub-state jurisdiction / AHJ resolution. The deterministic engine
-- (api/src/lib/jurisdictions/) resolves code + inspection sequence + AHJ for any US location
-- via a city → county → state → national-default cascade. These columns freeze the resolved
-- geography + AHJ level as a snapshot on each permit (so later seed edits never rewrite issued
-- permits), and let a project carry a user-correctable county.
--
-- All columns nullable + IF NOT EXISTS — backward-compatible, mirrors 0013-0015 permit widenings.
-- No data migration: existing permits keep state-level resolution; new columns stay NULL until
-- a permit is created/regenerated through the engine.

-- ── permits: denormalized resolved-location + AHJ-level snapshot ─────────────────────────────
ALTER TABLE permits
  ADD COLUMN IF NOT EXISTS county_fips      CHAR(5),
  ADD COLUMN IF NOT EXISTS county_name      TEXT,
  ADD COLUMN IF NOT EXISTS city_name        TEXT,
  ADD COLUMN IF NOT EXISTS jurisdiction_key TEXT,   -- canonical key, e.g. 'WI/55025/madison'
  ADD COLUMN IF NOT EXISTS ahj_level        TEXT;   -- 'state' | 'county' | 'city' — who enforces

CREATE INDEX IF NOT EXISTS idx_permits_tenant_jurisdiction ON permits(tenant_id, jurisdiction_key);

-- ── projects: optional, user-correctable county (drives the engine when set) ─────────────────
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS county_fips CHAR(5),
  ADD COLUMN IF NOT EXISTS county_name TEXT;
