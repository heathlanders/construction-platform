# Development Setup Guide

> **Prerequisite reading:** `CLAUDE.md` → `docs/LOCKED_DECISIONS.md`
> before writing any code.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS | `nvm install 20` |
| Docker | 24+ | docker.com |
| Docker Compose | v2 (bundled with Docker Desktop) | |
| pnpm | 8+ | `npm install -g pnpm` |
| Prisma CLI | via pnpm | see below |

---

## 1. Clone and install

```bash
git clone <repo-url>
cd construction-platform
pnpm install
```

---

## 2. Environment variables

```bash
cp .env.example .env
# Edit .env and fill in values.
# The defaults work for local Docker — only external service keys need changing.
```

The only values you MUST set for local dev (everything else has working defaults):
- `STRIPE_SECRET_KEY` — use a Stripe test-mode key
- `PUSHER_*` — create a free Pusher sandbox app

---

## 3. Start local infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 15** on port `15432` (direct, for migrations — non-standard to avoid port conflicts)
- **PgBouncer** on port `15433` (pooled, transaction mode — all app queries)
- **Redis 7** on port `16379`

Verify everything is healthy:
```bash
docker compose ps
# All three services should show "healthy"
```

### Validating PgBouncer transaction mode (T-43)
```bash
# Connect via PgBouncer
psql postgresql://platform_user:changeme@localhost:15433/platform_dev

# This must fail — SET SESSION is prohibited in transaction mode
SET SESSION app.current_tenant_id = 'test';
# Expected: ERROR: SET SESSION not allowed in transaction mode

# This must succeed — SET LOCAL is the correct pattern
BEGIN;
SET LOCAL app.current_tenant_id = 'test-uuid';
SELECT current_setting('app.current_tenant_id');
COMMIT;
# Expected: returns 'test-uuid' during transaction, cleared after COMMIT
```

If `SET SESSION` does NOT fail, PgBouncer is misconfigured. Do not proceed.

---

## 4. Run database migrations

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations (uses DATABASE_URL — direct PostgreSQL on port 15432, not PgBouncer)
pnpm prisma migrate dev --name init

# Seed development data
pnpm prisma db seed
```

### RLS layering procedure (read before touching migrations)

Our `prisma/migrations/0001_initial/migration.sql` is the **complete** initial migration —
it creates tables, enums, indexes, RLS policies, version-increment triggers, and Domain 4
cross-tenant tables. Prisma did not generate this file; it was hand-written.

**What happens when you run `prisma migrate dev`:**

1. Prisma finds `0001_initial/` and applies our SQL — tables are created correctly.
2. Prisma may then diff the resulting DB state against `schema.prisma` and generate a
   **second migration** for perceived drift (RLS policies, triggers, and cross-tenant
   tables that Prisma doesn't know about).

**If Prisma generates a drift migration:**

- Open the generated `.sql` file before it runs.
- Remove any `CREATE TABLE` / `ALTER TABLE` statements that duplicate what our SQL
  already creates correctly (Prisma's DDL won't include RLS or triggers).
- Append the corresponding `CREATE POLICY` and trigger SQL from `0001_initial/` for
  any new tables Prisma added.
- Commit the reviewed `.sql` file — never let unreviewed Prisma-generated DDL deploy.

**For ongoing schema changes:**

```bash
# 1. Edit prisma/schema.prisma to add/change a model
# 2. Generate migration (Prisma writes the DDL)
pnpm prisma migrate dev --name add_widget

# 3. Open the generated migration file
#    prisma/migrations/YYYYMMDDHHMMSS_add_widget/migration.sql

# 4. Append RLS policy for new tables:
#    ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
#    FORCE ROW LEVEL SECURITY ON widgets;
#    CREATE POLICY tenant_isolation ON widgets
#      USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
#    CREATE INDEX idx_widgets_tenant_id ON widgets(tenant_id);
#    CREATE INDEX idx_widgets_tenant_deleted ON widgets(tenant_id, deleted_at);

# 5. Run prisma migrate deploy to apply the reviewed SQL
pnpm prisma migrate deploy
```

**Never use `prisma migrate deploy` without reviewing the SQL for RLS coverage first.**
Tables missing RLS policies will silently return all-tenant data.

### After pulling latest / bringing the stack up

New commits often add migrations. **Apply pending migrations before (re)starting api/web**, or
routes hit missing columns/indexes:
```bash
# direct Postgres (port 15432), NOT PgBouncer:
pnpm prisma migrate deploy          # applies any new prisma/migrations/*
```
The local Docker stack's `api` connects to the **same `platform_dev` DB** (via PgBouncer), so a
`migrate deploy` from the host covers the containers too. Rebuild images when app code changed:
`docker compose build api web && docker compose up -d api web` (web is a prod build — no source
mount, so code changes need a rebuild). Confirm the latest migration is applied:
```bash
docker compose exec postgres psql -U postgres -d platform_dev \
  -c "SELECT migration_name FROM _prisma_migrations ORDER BY started_at DESC LIMIT 1;"
```

After migration, verify RLS is active:
```bash
psql postgresql://platform_user:changeme@localhost:15432/platform_dev

-- Should return 0 rows (no tenant context set)
SELECT * FROM projects;

-- Should return only tenant A's projects
BEGIN;
SET LOCAL app.current_tenant_id = '<tenant-a-uuid>';
SELECT * FROM projects;
COMMIT;
```

---

## 5. Start the API server

```bash
cd api
pnpm dev
# API starts on http://localhost:3000
```

---

## 6. Start the web frontend

```bash
cd web
pnpm dev
# Web starts on http://localhost:3001
```

---

## 7. Key development URLs

| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| Web | http://localhost:3001 |
| PostgreSQL (direct) | localhost:15432 |
| PgBouncer (pooled) | localhost:15433 |
| Redis | localhost:16379 |

---

## 8. Pre-PR checklist

Before opening any pull request:

```bash
# 1. Check for raw DB calls outside withTenantContext (tenant isolation leak risk)
grep -rn "pgPool\.query\|pgPool\.connect" --include="*.ts" api/src | grep -v "withTenantContext"

# 2. Check for Prisma usage inside tenant-context paths
grep -rn "prisma\." --include="*.ts" api/src | grep -v "migrations\|schema\|seed\|health"

# 3. Run tests (includes RLS isolation tests)
pnpm test

# 4. Run linter
pnpm lint
```

See `docs/Testing_Strategy_v1_0.md` for the full test harness.

---

## 9. Troubleshooting

**PgBouncer won't start:**
Check that port 5432 (PostgreSQL) is healthy before PgBouncer starts.
`docker compose logs pgbouncer` for details.

**Migration fails:**
Ensure you're using `DATABASE_URL` (direct PostgreSQL), not `DATABASE_POOL_URL`.
Prisma migrations must run against direct PostgreSQL — not PgBouncer.

**RLS not working (all rows visible):**
Check that `SET LOCAL` is being called inside a transaction (`BEGIN`...`COMMIT`).
`SET LOCAL` outside a transaction has no effect.

**Redis connection refused:**
`docker compose up -d redis` — ensure the redis container is running.
