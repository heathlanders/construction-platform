-- 0038_punch_gps
--
-- Project Map Phase 6a (Doc 20 §1) — the ADDITIVE, non-enforcing half of OQ-17: capture the
-- device location at clock-in when the device grants GPS. Capture only — geofence ENFORCEMENT
-- stays deferred (OQ-17). If GPS is denied/unavailable the punch still succeeds with null coords
-- (→ the worker shows on the map only via the degraded per-project crew ring, not precisely).
-- Feeds the precise crew layer on /v1/crew/map.

ALTER TABLE time_punches
  ADD COLUMN clock_in_lat NUMERIC(9,6),
  ADD COLUMN clock_in_lng NUMERIC(9,6);

COMMENT ON COLUMN time_punches.clock_in_lat IS 'Device latitude at clock-in (nullable — GPS optional, never blocks the punch). OQ-17 additive half.';
COMMENT ON COLUMN time_punches.clock_in_lng IS 'Device longitude at clock-in (nullable). OQ-17 additive half.';

-- Open punches with coords — the precise crew-layer query.
CREATE INDEX idx_time_punches_open_gps
  ON time_punches (tenant_id)
  WHERE clock_out_at IS NULL AND deleted_at IS NULL AND clock_in_lat IS NOT NULL;
