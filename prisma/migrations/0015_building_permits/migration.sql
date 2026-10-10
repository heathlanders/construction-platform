-- Migration 0015: Building Permits (general / structural)
-- Extends the trade-aware permits table (T-59) with the general building permit.
-- Unlike the trade permits, roofing/concrete/framing do NOT have their own AHJ permits —
-- their work is inspected under a single building permit (permit_type='building'), governed
-- by the ICC family (IRC for 1-2 family, IBC for everything else).
--
-- Only the permit_type CHECK is widened — the generic code_type/code_edition columns and the
-- lifecycle FSM are reused as-is.

ALTER TABLE permits DROP CONSTRAINT IF EXISTS permits_permit_type_check;
ALTER TABLE permits
  ADD CONSTRAINT permits_permit_type_check
  CHECK (permit_type IN ('electrical', 'plumbing', 'mechanical', 'building'));
