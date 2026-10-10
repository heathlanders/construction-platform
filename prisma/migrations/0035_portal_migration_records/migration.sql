-- 0035_portal_migration_records — chain-of-custody map for the portal-migration data copy (T-46, T-58)
--
-- Platform-scoped, NO RLS (mirrors portal_migrations / tenant_connections). One row per copied
-- source record. Makes the associated-data copy IDEMPOTENT/RESUMABLE (unique on
-- migration+source_table+source_id → a re-run never duplicates) and is the T-58 chain-of-custody
-- trail of exactly what moved where (source_id → target_id, per table).

CREATE TABLE portal_migration_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id      UUID NOT NULL REFERENCES portal_migrations(id) ON DELETE CASCADE,
  source_table      TEXT NOT NULL,
  source_tenant_id  UUID NOT NULL,
  source_id         UUID NOT NULL,
  target_tenant_id  UUID NOT NULL,
  target_id         UUID NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency: one mapping per (migration, source table, source row).
CREATE UNIQUE INDEX idx_pmr_unique ON portal_migration_records (migration_id, source_table, source_id);
CREATE INDEX idx_pmr_migration ON portal_migration_records (migration_id);

-- NO RLS — platform-scoped, guarded by requireSuperAdmin at the application layer.
