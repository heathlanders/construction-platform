# /gen-migration

Generates a Prisma migration file following project conventions.

## Usage
```
/gen-migration [description]
Example: /gen-migration add-project-milestones-table
```

## Steps
1. Load skill: rls-patterns
2. Load skill: tenant-context
3. Read Platform_DataModel_v1_0.docx for schema conventions

4. Generate migration file in `/prisma/migrations/` with:
   - Timestamp prefix: `YYYYMMDDHHMMSS_[description]`
   - All new tables include universal columns:
     ```sql
     tenant_id   UUID NOT NULL REFERENCES tenants(id)
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
     deleted_at  TIMESTAMPTZ
     created_by  UUID REFERENCES users(id)
     ```
   - RLS policy on every tenant-scoped table
   - Required indexes: `(tenant_id)` and `(tenant_id, deleted_at)`
   - Foreign key constraints with appropriate ON DELETE behavior

5. Update Prisma schema file (`/prisma/schema.prisma`) to match

6. Verify migration does NOT:
   - Hard-delete any rows (use soft delete)
   - Add a table without RLS
   - Add a tenant-scoped table without tenant_id index

## Output checklist
- [ ] Migration file created with correct timestamp
- [ ] Universal columns present on all new tables
- [ ] RLS policy added for each tenant-scoped table
- [ ] Indexes added
- [ ] Prisma schema updated
- [ ] No hard deletes
