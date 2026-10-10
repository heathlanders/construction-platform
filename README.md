# Construction Platform
**"The Operating System for Construction"**

Pre-launch — engineering document set complete, development starting.

---

## Quick Start (Claude Code)

```bash
# 1. Install Claude Code (if not already installed)
curl -fsSL https://claude.ai/install.sh | bash

# 2. Navigate to project root
cd construction-platform

# 3. Copy your spec docs into /docs
# (copy all 14 files from your project into the docs/ folder)

# 4. Launch Claude Code
claude

# 5. Start every session with
/start
```

---

## Project Structure

```
construction-platform/
├── CLAUDE.md                  ← Master context (Claude reads this first)
├── .mcp.json                  ← MCP server config (Postgres, GitHub, Playwright)
├── .gitignore
│
├── docs/                      ← All 14 spec documents (copy here)
│   ├── PROJECT_MASTER_REFERENCE.md  ← Slim nav index (always loaded)
│   ├── LOCKED_DECISIONS.md          ← All 49 locked decisions (load before arch work)
│   ├── GLOSSARY.md                  ← Platform terminology (load on demand)
│   ├── CHANGE_LOG.md                ← Change log + session summaries (load on demand)
│   ├── Platform_PRD_v1_0.docx
│   ├── Platform_Architecture_v1_1.docx
│   ├── Platform_DataModel_v1_0.docx
│   ├── Platform_API_Spec_v1_0.docx
│   ├── Platform_Roles_Permissions_v1_0.docx
│   ├── Platform_CrossTenant_Spec_v1_0.docx
│   ├── Platform_UX_Wireframe_Brief_v1_0.docx
│   ├── Platform_Mobile_Spec_v1_0.docx
│   ├── Platform_MVP_Scope_v1_0.docx
│   └── Platform_Competitive_Analysis_v1_0.docx
│
├── .claude/
│   ├── settings.json          ← Claude Code settings & permissions
│   │
│   ├── commands/              ← Slash commands (/start, /scaffold-trade-module, etc.)
│   │   ├── start.md
│   │   ├── scaffold-trade-module.md
│   │   ├── gen-migration.md
│   │   ├── gen-api-endpoint.md
│   │   ├── rls-audit.md
│   │   └── provision-tenant.md
│   │
│   ├── agents/                ← Domain specialist sub-agents
│   │   ├── rls-agent.md       ← Tenant isolation (use Opus, critical work)
│   │   ├── cross-tenant-agent.md  ← GC↔Sub bridge (use Opus)
│   │   ├── api-agent.md       ← Backend API & integrations
│   │   ├── mobile-agent.md    ← React Native & offline
│   │   └── billing-agent.md   ← Stripe & subscriptions
│   │
│   └── skills/                ← Reusable locked-decision codifications
│       ├── tenant-context/SKILL.md     ← withTenantContext pattern (MOST CRITICAL)
│       ├── rls-patterns/SKILL.md       ← RLS policies & schema conventions
│       ├── cross-tenant-bridge/SKILL.md← Bridge architecture
│       ├── offline-sync/SKILL.md       ← WatermelonDB + conflict resolution
│       ├── file-upload-security/SKILL.md← Quarantine upload model
│       ├── api-versioning/SKILL.md     ← /v1/ prefix, breaking change policy
│       ├── background-jobs/SKILL.md    ← SQS patterns, webhooks, circuit breaker
│       ├── audit-log/SKILL.md          ← 6-category log, hash chain
│       └── i18n/SKILL.md               ← react-i18next, EN+ES, safety strings
│
├── api/
│   └── CLAUDE.md              ← API module context
├── mobile/
│   └── CLAUDE.md              ← Mobile module context
├── web/
│   └── CLAUDE.md              ← Web frontend context
└── billing/
    └── CLAUDE.md              ← Billing module context
```

---

## Key Commands

| Command | When to use |
|---------|-------------|
| `/start` | Beginning of every session |
| `/plan` | Before any task touching >2 files |
| `/scaffold-trade-module [name]` | Add a new trade vertical |
| `/gen-migration [desc]` | Create a new DB migration |
| `/gen-api-endpoint [method] [resource]` | Scaffold a new endpoint |
| `/rls-audit` | Before every PR — catch tenant isolation issues |
| `/provision-tenant` | Build the tenant signup flow |
| `/compact` | At 50% context usage |
| `/model` | Switch to Opus for complex arch work |

## Key Agents

| Agent | Use for | Model |
|-------|---------|-------|
| `rls-agent` | Anything touching tenant isolation | Opus |
| `cross-tenant-agent` | GC↔Sub bridge work | Opus |
| `api-agent` | Backend routes, integrations | Sonnet |
| `mobile-agent` | React Native, offline sync | Sonnet |
| `billing-agent` | Stripe, subscriptions | Sonnet |

---

## Non-Negotiable Rules

1. `withTenantContext()` on EVERY database query
2. `SET LOCAL` only — never `SET SESSION`
3. Sub data NEVER in GC tables (golden rule)
4. All uploads go to quarantine first
5. `/rls-audit` passes before any PR merges
6. `ultrathink` for all security/RLS/cross-tenant decisions

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Database | PostgreSQL 15+ with RLS |
| ORM | Prisma (dual-client pattern) |
| Backend | Node.js + Fastify |
| Web | React + Next.js |
| Mobile | React Native + Expo |
| Offline | WatermelonDB |
| Auth | JWT + Redis blacklist |
| Queue | AWS SQS |
| Storage | DigitalOcean Spaces → AWS S3 at 300+ tenants |
| i18n | react-i18next (EN + ES) |

---

*Project status: Pre-launch. Engineering documents complete. Development not yet started.*
*Target launch: Month 9 from development kickoff.*
