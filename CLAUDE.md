# The Jobsite — Claude Code Context
**"The Operating System for Construction"**
> Product name: **The Jobsite** (`thejobsite.app`) — locked, resolves OQ-01.

> Read this file at the start of every session. Check PROJECT_MASTER_REFERENCE.md
> before making any architectural decision. Check Locked Decisions before re-opening
> any resolved question.

---

## What this project is

Multi-tenant SaaS platform for construction companies.
- Every GC or trade contractor gets their own fully isolated tenant environment
- Cross-tenant collaboration bridge connects GCs to their Subs in real time
- Target market: 3.7M US construction businesses underserved by Procore ($375+/mo)
- Launch: GC + Electrical + Plumbing modules at v1.0

## Master reference (read before any arch decision)
@docs/PROJECT_MASTER_REFERENCE.md

## Locked decisions (load before any architectural decision)
@docs/LOCKED_DECISIONS.md

## Spec documents
| Doc | File | Use for |
|-----|------|---------|
| PRD | @docs/Platform_PRD_v1_0.docx | Full feature requirements, personas |
| MVP Scope | @docs/Platform_MVP_Scope_v1_0.docx | What's in v1.0 vs deferred |
| Architecture | @docs/Platform_Architecture_v1_1.docx | All tech decisions (canonical) |
| Data Model | @docs/Platform_DataModel_v1_0.docx | PostgreSQL schema, all tables |
| API Spec | @docs/Platform_API_Spec_v1_0.docx | Every endpoint, auth, integrations |
| Roles | @docs/Platform_Roles_Permissions_v1_0.docx | 9 roles, permission matrix |
| Cross-Tenant | @docs/Platform_CrossTenant_Spec_v1_0.docx | GC↔Sub bridge spec |
| UX | @docs/Platform_UX_Wireframe_Brief_v1_0.docx | Design system, screens |
| Mobile | @docs/Platform_Mobile_Spec_v1_0.docx | React Native, offline-first |
| Pricing | @docs/Platform_Pricing_Billing_v1_0.docx | 4 tiers, billing model |
| GTM | @docs/Platform_GTM_Strategy_v1_0.docx | Go-to-market strategy |
| Schema Ref | @docs/Schema_Reference.md | Runtime column specs, indexes, enums for all domains |
| Blueprint Intelligence | @docs/Blueprint_Intelligence_v1_0.md | Pre-built task generation — templates + AI vision analysis |
| SuperAdmin Ops | @docs/SuperAdmin_Operations_v1_0.md | Super admin JWT, capabilities, audit patterns |
| Tier Enforcement | @docs/Pricing_Tier_Enforcement_Matrix.md | Per-feature tier gates, enforcement rules |
| Asset Management | @docs/Asset_Management_v1_0.md | EAM — vehicles, equipment, tools; service records, warranties, insurance, depreciation, compliance. Business+. |
| Time Tracking & Payroll | @docs/Time_Tracking_Payroll_v1_0.md | Time entries, weekly timecards (approval FSM), clock in/out punches, payroll CSV export + QB/Gusto/ADP. 6 tables. No tier gate. T-60/61/62. |
| Task Build-Out Engine | @docs/Task_BuildOut_Engine_v1_0.md | Per-trade deterministic engine → `task_steps` (laborer work steps + code refs + gating inspection + tools/safety). Task detail w/ task-scoped codes + QA photos. Migrations 0021/0022. No tier gate. |
| Estimating Engine | @docs/Estimating_Engine_v1_0.md | Deterministic sub-level job estimating (`lib/estimating/`) — quantities (blueprint facts / parametric $/SF / takeoff) → assembly (material + labor_hrs×burdened_rate + equipment)×waste → markups → bid. Cost catalog (system + tenant override), estimates FSM, convert-to-bid + award→budget seed. Migration 0028. No tier gate. T-63. |
| Design Studio | @docs/Client_Visualizer_v1_0.md | Client visualizer (proposed T-65) — AI-guided per-trade intake wizard, concept renders, budget range → draft estimate. Trade-generic framework `api/src/lib/intake/`; v1 = concrete_flatwork. Migrations 0045/0046. |
| Trade Taxonomy | @docs/Trade_Taxonomy_v1_0.md | Canonical ~100-trade subcontractor taxonomy (`api/src/lib/trades/taxonomy.ts`) — key/label/CSI/phase/`permit_trade` + aliases; data-driven `tradeToPermitTrade()`; `GET /v1/trades`. Permit layer stays 4 trades (T-59). T-64. |
| Trade Knowledge Packs | @docs/Trade_Knowledge_Packs_v1_0.md | Per-trade knowledge (steps, code refs, hazards, QA, costs, blueprint callouts) as one pack file per trade, 183 trades. Ledger `docs/Trade_Knowledge_Session_Plan.md` (kickoff prompt + wave status). Proposed T-66. |

---

## Tech stack (all locked — do not deviate)

| Layer | Choice | Notes |
|-------|--------|-------|
| Database | PostgreSQL 15+ | RLS enforced at DB layer |
| ORM | Prisma (dual-client pattern) | Raw pg for SET LOCAL, Prisma for migrations |
| Connection pool | PgBouncer — transaction mode | Session mode breaks RLS |
| Backend | Node.js + Fastify | Locked (A-11) — Fastify 4.26, dual-client pg+Prisma |
| Web frontend | React + Next.js | SSR, code-sharing with mobile |
| Mobile | React Native + Expo | Single codebase iOS+Android |
| Offline storage | WatermelonDB (SQLite) | Offline-first mobile |
| Auth | JWT with tenant_id claim | 24hr web / 30d mobile, Redis jti blacklist |
| Queue | pg-boss (Stage 1–2) → AWS SQS (Stage 3+) | Same envelope, swap via env var |
| File storage | DigitalOcean Spaces → AWS S3 at 300+ tenants | S3-compatible, zero-code migration |
| Realtime | Pusher (Stage 1–2) → native WebSocket (Stage 3+) | One private channel per tenant |
| Email | SendGrid | Transactional email (notifications, exports, alerts) |
| i18n | react-i18next | EN + ES at launch, same lib web+mobile |
| Infrastructure | DigitalOcean (~$200-350/mo) → AWS at 300+ tenants | Production target (A-12/T-24) |
| Pre-launch hosting | Local Docker stack exposed via **Cloudflare Tunnel** at `thejobsite.app` | Stage 0 testing only — outbound tunnel, OTP-gated web, ungated JWT api. See deployment skill |

---

## Non-negotiable architecture rules

**Tenant isolation:**
1. EVERY database query must use `withTenantContext()` — see `.claude/skills/tenant-context/SKILL.md`
2. Use `SET LOCAL` only — never `SET SESSION` (breaks PgBouncer transaction mode)
3. `DISCARD ALL` as exception backstop in `withTenantContext()`
4. Superadmin bypass of tenant context is PROHIBITED
5. Pre-PR checklist: grep codebase for raw DB calls outside `withTenantContext()`

**Background jobs:**
6. SQS message envelope MUST carry `tenant_id`
7. Workers call `withTenantContext()` using envelope tenant_id before any DB operation

**API:**
8. All routes use `/v1/` URL prefix
9. `User-Agent` header required on all requests
10. Breaking changes = new version. 6-month deprecation window.

**Cross-tenant:**
11. Sub data NEVER lives in GC tenant tables
12. All cross-tenant data flows through `shared_project_events` table
13. `shared_project_events` is exempt from standard RLS — application-layer guard only
14. Cross-tenant schema built in v1.0, user-accessible in v1.1

**Files:**
15. ALL uploads go to quarantine first — triple validation before release to live storage
16. Pre-signed URLs only — no direct storage exposure
17. Per-type size limits and per-tier storage quotas enforced

**Security:**
18. Audit log: 6 categories, hash-chained for tamper evidence, 7-year retention
19. Offline conflicts: optimistic locking with version integer, tiered field policy

---

## Module CLAUDE.md files (load when working in each area)
- API layer: @api/CLAUDE.md
- Mobile: @mobile/CLAUDE.md
- Web frontend: @web/CLAUDE.md
- Billing: @billing/CLAUDE.md
- Blueprint Intelligence: @.claude/skills/blueprint-intelligence/SKILL.md
- Task Detail / Codes / Build-Out Engine: @.claude/skills/task-buildout/SKILL.md
- Estimating Engine (assembly pricing / cost catalog): @.claude/skills/estimating/SKILL.md
- Design Studio (client visualizer / trade intake modules): @.claude/skills/design-studio/SKILL.md
- Trade Knowledge Packs (adding/deepening any trade): @.claude/skills/trade-packs/SKILL.md
- Asset Management: @.claude/skills/asset-management/SKILL.md
- Time Tracking & Payroll: @.claude/skills/time-tracking/SKILL.md
- Deployment / public hosting: @.claude/skills/deployment/SKILL.md

---

## Workflow rules
- Run `/plan` before ANY task touching more than 2 files
- Run `/compact` at 50% context usage — do not wait for the dumb zone
- Use `ultrathink` in any prompt involving RLS, cross-tenant, or security design
- Commit after every completed task
- Use plan mode (`/plan`) to start every new feature

## CI — local first (GitHub Actions minutes are capped)
- The default gate is **`scripts/ci-local.sh`** — same checks as `.github/workflows/ci.yml` (API vitest +
  PgBouncer gate + tsc, web tsc) plus mobile tsc + jest, against the local Docker stack. Only changed
  areas run (`--all` for everything, `--docker` to also build images). `--report` posts a free
  `local-ci` commit status on the PR — run it on the final commit before asking for a merge.
- GitHub CI is **manual-only** (`gh workflow run CI --ref <branch>`) — use it for dependency/Dockerfile
  changes or pre-release, not every PR.
- **Batch small changes into one PR** (e.g. a feature + its E2E + follow-up fixes) instead of a PR each.

## Branching — one feature = one branch
- **Never build a new feature directly on `main`.** Before the first code change, branch from a fresh `main`:
  `git checkout main && git pull && git checkout -b feat/<short-name>`.
- **Name the branch for the feature being built** — not whatever was last checked out. Don't pile an unrelated
  feature onto an existing feature branch (e.g. building a "what's new popup" on `feat/codes-engine-...`).
- When a new feature is requested, **auto-suggest the branch name** — derive a kebab-case `feat/<name>` from
  the request (e.g. "add a what's new popup" → `feat/whats-new-popup`) and propose it for the user's OK; don't
  ask blankly. Create it on confirmation, then start the work there. A `SessionStart` hook
  (`scripts/session-branch-check.sh`, wired in `.claude/settings.json`) surfaces the current branch + this
  rule at session start.
- Tiny doc/config tweaks the user explicitly wants on `main` are the only exception.
- `main` auto-ships mobile OTA via the pre-push hook — another reason feature work stays off `main` until merged.
