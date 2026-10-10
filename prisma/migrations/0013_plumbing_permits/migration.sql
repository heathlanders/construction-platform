-- Migration 0013: Plumbing Permits (trade-aware permits generalization)
-- Extends the permits table (introduced in 0009 for electrical) to support plumbing,
-- without duplicating the table or route. The permit lifecycle FSM, AHJ fields, and
-- inspection-milestone linkage are all trade-neutral and reused as-is.
--
-- Strategy:
--   1. Widen the permit_type CHECK to allow 'plumbing' (keeps T-53 TEXT+CHECK pattern,
--      keeps T-54 no-unique-constraint). Column name stays permit_type (no rename — no
--      code references it; route relies on the column DEFAULT for electrical).
--   2. Add trade-neutral jurisdiction columns code_type + code_edition. The electrical
--      NEC edition continues to live in nec_edition (backward compatible); plumbing writes
--      its IPC/UPC family + edition into code_type/code_edition and leaves nec_edition NULL.
--   3. Drop NOT NULL on nec_edition (electrical-specific; never set for plumbing rows).
--   4. Backfill existing electrical rows into the new generic columns.

-- ─── 1. Widen permit_type CHECK ────────────────────────────────────────────────
ALTER TABLE permits DROP CONSTRAINT IF EXISTS permits_permit_type_check;
ALTER TABLE permits
  ADD CONSTRAINT permits_permit_type_check
  CHECK (permit_type IN ('electrical', 'plumbing'));

-- ─── 2. Trade-neutral jurisdiction columns ─────────────────────────────────────
-- code_type   : model-code family — 'NEC' (electrical), 'IPC' | 'UPC' (plumbing)
-- code_edition : the edition/year string for that model code (e.g. '2020', '2021')
ALTER TABLE permits
  ADD COLUMN IF NOT EXISTS code_type     TEXT,
  ADD COLUMN IF NOT EXISTS code_edition  TEXT;

-- ─── 3. nec_edition becomes electrical-only (nullable) ─────────────────────────
ALTER TABLE permits ALTER COLUMN nec_edition DROP NOT NULL;

-- ─── 4. Backfill existing electrical permits into generic columns ──────────────
UPDATE permits
   SET code_type    = 'NEC',
       code_edition = nec_edition
 WHERE permit_type = 'electrical'
   AND code_type IS NULL;

-- Note: no new indexes required — existing permit indexes
-- (tenant, tenant+deleted, tenant+project, tenant+status, tenant+updated)
-- are trade-neutral and serve plumbing permit queries unchanged.
