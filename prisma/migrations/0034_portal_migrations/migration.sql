-- 0034_portal_migrations — super-admin portal-user → own-tenant migration (T-46, T-47)
-- Platform-scoped table, NO RLS (mirrors tenant_connections / platform_admins). Access is
-- controlled at the application layer by requireSuperAdmin. Two-admin control: the approver
-- must differ from the initiator (T-47), enforced in the route.
--
-- T-46: execution COPIES the user into the target tenant with a NEW uuid and soft-deletes the
-- original — never re-stamps tenant_id on existing rows. new_user_id records the copy.

CREATE TABLE portal_migrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,               -- the sub_portal user being migrated (source tenant)
  source_tenant_id  UUID NOT NULL REFERENCES tenants(id),
  target_tenant_id  UUID NOT NULL REFERENCES tenants(id),
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','complete','failed')),
  initiated_by      UUID NOT NULL,               -- platform_admins.id
  approved_by       UUID,                        -- platform_admins.id (must differ — T-47)
  new_user_id       UUID,                        -- the copied user's id in target tenant
  note              TEXT,
  error             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One live (pending/approved) migration per user at a time.
CREATE UNIQUE INDEX idx_portal_migrations_active_user
  ON portal_migrations (user_id)
  WHERE status IN ('pending','approved');

CREATE INDEX idx_portal_migrations_status ON portal_migrations (status);
CREATE INDEX idx_portal_migrations_created ON portal_migrations (created_at DESC);

-- NO RLS — platform-scoped, guarded by requireSuperAdmin at the application layer.
