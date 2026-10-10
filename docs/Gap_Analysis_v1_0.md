# Platform Gap Analysis v1.0

> **Generated:** 2026-03-19
> **Last updated:** 2026-03-19 (session 3)
> **Status:** Living document — update as gaps are closed

---

## Overall scaffold status: ~65% complete

| Layer | Status | Notes |
|---|---|---|
| Architecture docs & locked decisions | 95% | Solid — 52 locked decisions, 13 skills |
| Prisma schema | 95% | All 11 domains complete (session 3) |
| Database migrations | 60% | `0001_initial/migration.sql` written — needs `prisma migrate dev` run |
| RLS policies | 90% | All policies in migration.sql; needs staging validation (T-43) |
| API core files | 70% | tenant-context, auth, audit-log, tier-enforcement, index — done (session 3) |
| API route handlers | 0% | No route handlers yet |
| Web frontend code | 0% | Directory structure only |
| Mobile code | 0% | Directory structure only |
| Billing code | 0% | Directory structure only |
| Translation files | 100% | All 14 locale files created (session 3) ✅ |
| package.json files | 100% | Root + 4 modules + workspace config (session 3) ✅ |
| CI/CD | 0% | No `.github/workflows/` |

---

## 1. Closed in session 3

| # | Gap | Status |
|---|---|---|
| Prisma schema Domains 5–11 | All models added | ✅ Done |
| `platform_admins` table | Added to Prisma schema | ✅ Done |
| `audit_log` table | Added to Prisma schema + migration SQL | ✅ Done |
| `project_members` table | Added to Prisma schema | ✅ Done |
| `prisma/migrations/0001_initial/migration.sql` | Written — full schema + RLS + triggers | ✅ Done |
| `prisma/seed.ts` | Created | ✅ Done |
| `package.json` (root + all modules) | Created | ✅ Done |
| `pnpm-workspace.yaml` | Created | ✅ Done |
| `tsconfig.json` (root + api) | Created | ✅ Done |
| `api/src/lib/tenant-context.ts` | Implements withTenantContext (T-48, T-49, T-50, T-51, T-52) | ✅ Done |
| `api/src/lib/audit-log.ts` | Hash-chain writer + `writePlatformAuditEntry()` | ✅ Done |
| `api/src/lib/redis.ts` | Shared Redis client | ✅ Done |
| `api/src/lib/db.ts` | Raw pg pool for withTenantContext | ✅ Done |
| `api/src/middleware/auth.ts` | JWT validation, RBAC, super admin, locale resolution | ✅ Done |
| `api/src/services/tier-enforcement.ts` | All tier limits, addon checks, 402 format | ✅ Done |
| `api/src/index.ts` | Fastify entry point | ✅ Done |
| `locales/en/` (7 files) | Common, projects, financial, safety, field, trade-electrical, trade-plumbing | ✅ Done |
| `locales/es/` (7 files) | All 7 Spanish translations | ✅ Done |
| `docs/Schema_Reference.md` Domains 5–11 | Full column specs | ✅ Done |
| `.claude/skills/api-patterns/SKILL.md` | T-02, T-03, T-04, T-05, T-06 patterns | ✅ Done |
| `.claude/skills/sub-portal/SKILL.md` | P-04 Sub Portal invitation + migration flow | ✅ Done |
| OQ-02 resolved | Node.js/Fastify — locked by implementation (all skill + core files use Fastify) | ✅ Done |

---

## 2. Remaining gaps

### 2a. Must do before first API endpoint works

| Gap | Priority | Notes |
|---|---|---|
| Run `prisma migrate dev` to generate official migration | **Blocker** | Needs Docker running; T-43 PgBouncer validation |
| PgBouncer transaction-mode validation (T-43) | **Blocker** | Must validate before any production DB write |
| `pnpm install` — install all packages | High | package.json files now exist; run installs |

### 2b. API route handlers — 0% complete

No route handlers exist yet. Needed before anything is testable:

| Route group | Priority |
|---|---|
| `POST /v1/auth/login`, `POST /v1/auth/logout` | Highest |
| `POST /v1/users`, `GET /v1/users` | High |
| `POST /v1/projects`, `GET /v1/projects/:id` | High |
| `POST /v1/files/upload` (quarantine model) | High |
| All other CRUD routes | Medium |

### 2c. Missing implementation files

| File | Notes |
|---|---|
| `api/src/lib/prisma.ts` | Prisma client singleton for non-tenant queries |
| `api/src/lib/storage.ts` | S3/Spaces client + pre-signed URL helpers (T-05) |
| `api/src/lib/queue.ts` | pg-boss setup + job sender (A-14) |
| `api/src/routes/` | All route handlers |
| `api/src/plugins/` | Fastify plugin wrappers |
| `web/src/` | All Next.js frontend code |
| `mobile/src/` | All React Native code |
| `billing/src/` | Stripe webhook handlers |

### 2d. CI/CD — 0%

| File | Priority |
|---|---|
| `.github/workflows/ci.yml` | Before first deployment |
| PgBouncer transaction-mode test in CI | Required per T-43 |
| RLS audit grep in CI (pre-PR checklist) | Required per tenant-context/SKILL.md |

### 2e. Remaining doc gaps (low priority)

| Doc | What's missing |
|---|---|
| `docs/Migration_Runbook_v1_0.md` | Schema evolution procedures (manual migration after `prisma migrate dev`) |
| `docs/SuperAdmin_Operations_v1_0.md` | ✅ `writePlatformAuditEntry()` now implemented in `audit-log.ts` |

### 2f. Open questions (high priority)

| # | Question | Impact |
|---|---|---|
| OQ-01 | Final product name | Branding/legal — blocks marketing |
| OQ-11 | Design partner recruitment strategy | Revenue — first 10 customers |
| OQ-12 | Spanish-speaking design partner for i18n QA | v1.0 gate (P-09) |

OQ-02 (Node vs Go) — RESOLVED. Node.js/Fastify. All core files use Fastify patterns.

---

## 3. What's now in good shape

- All 52 locked decisions documented and consistent ✅
- All 13 skill files (11 original + api-patterns + sub-portal) ✅
- Complete Prisma schema — all 11 domains ✅
- Migration SQL with RLS on all 20+ tenant-scoped tables ✅
- Optimistic locking DB triggers on all mobile-writable tables (T-12) ✅
- Core API files: `withTenantContext`, `auth`, `audit-log`, `tier-enforcement` ✅
- 14 locale files (EN + ES) — v1.0 launch gate satisfied ✅
- All package.json files — `pnpm install` will now work ✅
- `prisma/seed.ts` for local dev ✅
- Domain 4 (shared_project_events, tenant_connections) in migration SQL as raw SQL, NOT in Prisma (T-44) ✅
- `writePlatformAuditEntry()` implemented (previously referenced in SuperAdmin_Operations_v1_0.md but missing) ✅

---

## 4. Priority order for next session

1. `pnpm install` — install packages
2. `docker compose up` + `prisma migrate dev` — apply schema
3. PgBouncer transaction-mode validation (T-43)
4. Create `api/src/lib/prisma.ts` (Prisma singleton)
5. Implement auth routes (`POST /v1/auth/login`, `POST /v1/auth/logout`)
6. Implement project routes (`POST /v1/projects`, `GET /v1/projects`)
7. Implement file upload (quarantine model — file-upload-security/SKILL.md)
8. CI/CD pipeline with RLS audit + PgBouncer validation

---

*Last updated: 2026-03-19 (session 3 — closed all session 2 open items)*
*Next review: After first route handler implemented*
