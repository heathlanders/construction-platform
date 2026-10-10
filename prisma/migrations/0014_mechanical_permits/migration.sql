-- Migration 0014: Mechanical (HVAC) Permits
-- Extends the trade-aware permits table (T-59) to support mechanical/HVAC permits.
-- An HVAC permit is industry-called a "mechanical permit" → permit_type = 'mechanical'.
--
-- The generic jurisdiction columns (code_type, code_edition) and the permit lifecycle FSM
-- introduced in 0009/0013 are trade-neutral and reused as-is. This migration only widens
-- the permit_type CHECK — no new columns required.

ALTER TABLE permits DROP CONSTRAINT IF EXISTS permits_permit_type_check;
ALTER TABLE permits
  ADD CONSTRAINT permits_permit_type_check
  CHECK (permit_type IN ('electrical', 'plumbing', 'mechanical'));
