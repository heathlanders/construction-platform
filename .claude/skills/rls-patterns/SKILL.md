# RLS Patterns Skill
**Locked decisions: A-03, T-42 through T-49**

## What RLS does
PostgreSQL Row-Level Security enforces that a DB connection can only see rows
where `tenant_id = current_setting('app.current_tenant_id')`.
Even if application code has a bug, data cannot leak across tenants.

## Enabling RLS on a table
```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Policy: tenants can only see their own rows
CREATE POLICY tenant_isolation ON your_table
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Force RLS even for table owner — no application role bypasses RLS at runtime
-- (DB-level migration account bypasses RLS only during migration execution, never at runtime)
ALTER TABLE your_table FORCE ROW LEVEL SECURITY;
```

## Universal columns on every tenant-scoped table
```sql
tenant_id    UUID NOT NULL REFERENCES tenants(id)
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at   TIMESTAMPTZ  -- soft delete pattern, NULL = active
created_by   UUID REFERENCES users(id)
```

## Soft delete pattern
Never hard-delete rows. Set `deleted_at = NOW()`.
All RLS policies and queries filter `WHERE deleted_at IS NULL`.

## shared_project_events — special case (T-44, T-45)
This table is EXEMPT from standard RLS.
It is a neutral cross-tenant bridge — owned by neither GC nor Sub tenant.
Access is controlled at the application layer by validating connection membership.
Do NOT add standard tenant RLS policies to this table.

## Indexes required for RLS performance
Every tenant-scoped table needs:
```sql
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);
CREATE INDEX idx_{table}_tenant_deleted ON {table}(tenant_id, deleted_at);
```

## Prisma migrations
Prisma handles schema migrations.
RLS policies are added in migration files as raw SQL (`prisma.$executeRaw`).
Never bypass Prisma migrations to alter production schema directly.

## Testing RLS
```sql
-- Test as a specific tenant
SET LOCAL app.current_tenant_id = 'test-tenant-uuid';
SELECT * FROM projects; -- should only return that tenant's projects

-- Verify cross-tenant leak is blocked
SET LOCAL app.current_tenant_id = 'tenant-a-uuid';
SELECT * FROM projects WHERE tenant_id = 'tenant-b-uuid'; -- should return 0 rows
```
