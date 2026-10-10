# The Jobsite — Master Project Reference
**The Operating System for Construction**

> **How to use this file:** Single source of truth for navigation. Use the Document Registry to find the right spec. Use the Context Routing Guide to find which doc answers your question. Check Open Questions before re-raising unresolved items.
>
> **Before any architectural decision:** Load `@docs/LOCKED_DECISIONS.md`

---

## Reference Files (load on demand)

| File | Contents | When to load |
|------|----------|--------------|
| `@docs/LOCKED_DECISIONS.md` | All locked decisions (A, P, PR, T-01–T-62) | Before any arch/product/pricing decision |
| `@docs/KEY_NUMBERS.md` | Pricing, revenue targets, unit economics, fundraising, market, timeline, infra costs | Business/planning context |
| `@docs/GLOSSARY.md` | 30+ platform term definitions | When looking up terminology |
| `@docs/CHANGE_LOG.md` | Full change log + session summaries | History/context, onboarding after a gap |

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Product name** | **The Jobsite** — locked (domain `thejobsite.app` registered 2026-06-18). Resolves OQ-01. |
| **Tagline** | The Operating System for Construction |
| **Document set version** | v1.1 |
| **Document set date** | March 2026 |
| **Project status** | Pre-launch — engineering document set complete, development not yet started |
| **Current stage** | Design partner recruitment / pre-seed fundraising |
| **Target launch** | Month 9 from development kickoff |

**One-sentence description:** A multi-tenant SaaS platform that gives every construction company — General Contractor or trade contractor — its own full business environment, and connects GCs and Subs through a governed real-time collaboration bridge that no competitor has.

---

## 2. Document Registry

| # | File | Type | Version | Description |
|---|---|---|---|---|
| 01 | `Platform_PRD_v1_0.docx` | Eng/Product | 1.0 | Full product requirements — features, personas, integrations, non-functional requirements |
| 02 | `Platform_MVP_Scope_v1_0.docx` | Eng/Product | 1.0 | v1.0/v1.1/v2.0 feature bucketing, timeline, Definition of Done |
| 03 | `Platform_Architecture_v1_1.docx` | Engineering | 1.1 | Multi-tenant design, RLS, auth, storage, cross-tenant bridge, all 14 gap resolutions |
| 04 | `Platform_DataModel_v1_0.docx` | Engineering | 1.0 | Full PostgreSQL schema — 10 domains, all tables, 27 indexes, migration strategy |
| 05 | `Platform_API_Spec_v1_0.docx` | Engineering | 1.0 | All endpoints, auth, integrations (QuickBooks, DocuSign, Stripe, Twilio, Maps, Weather) |
| 06 | `Platform_Roles_Permissions_v1_0.docx` | Eng/Product | 1.0 | 9 roles, full permission matrix, Sub Portal access list |
| 07 | `Platform_CrossTenant_Spec_v1_0.docx` | Engineering | 1.0 | Connection model, data governance, shared event bridge — **v1.1 bridge USER-ACCESSIBLE (SHIPPED 2026-07-18, PR #27)**: lifecycle UI, §6 sub-project instantiation, map layer, realtime client. **Spec-gap follow-up SHIPPED 2026-07-18 (migration 0040)**: §5 permissions JSONB + re-consent, §8 closeout (`completed` + reason codes), sub→GC map pins. **§5.1 event-family depth SHIPPED 2026-07-18 (migration 0041)**: invoice workflow (sub-side `invoices.connection_id`, `invoice.submitted/approved/paid`), lien waivers (ledger-only, closeout `open_lien_waivers`), `message.sent`; Pusher realtime LIVE (real creds, web client baked). **§5 final families + §3.3 fuzzy discovery + portal i18n SHIPPED 2026-07-18/19 (PRs #33/#34, migration 0042)** — opt-in discovery directory + EN+ES portals. Ledger: `CrossTenant_v1_1_Session_Plan.md`. Deferred: mobile surface |
| 08 | `Platform_UX_Wireframe_Brief_v1_0.docx` | Design/Eng | 1.0 | Design system, navigation, screen wireframes for all major views |
| 09 | `Platform_Mobile_Spec_v1_0.docx` | Engineering | 1.0 | React Native, offline-first architecture, all field screens, app store |
| 10 | `Platform_Competitive_Analysis_v1_0.docx` | Business | 1.0 | Procore/Buildertrend/eSUB/Fieldwire/Jonas profiles, feature matrix, SWOT |
| 11 | `Platform_Pricing_Billing_v1_0.docx` | Business | 1.0 | 4 tiers, 9 add-ons, unit economics, 5-year ARR projection, trial strategy |
| 12 | `Platform_GTM_Strategy_v1_0.docx` | Business | 1.0 | ICP, 9 channels, content/SEO, design partner program, launch plan |
| 13 | `Platform_Investor_Overview_v1_0.docx` | Business | 1.0 | ⚠️ CONFIDENTIAL — Problem/solution, TAM/SAM/SOM, moat, $2.5M raise |
| 14 | `Asset_Management_v1_0.md` | Engineering | 1.0 | Company Asset Management (EAM) — vehicles, equipment, tools; 25 tables, service records, warranties, insurance, depreciation, compliance. Business+ tier. |
| 15 | `Mobile_Enterprise_Plan_v1_0.md` | Eng/Product | 1.0 | Mobile feature-expansion + test strategy. Role-aware experience, offline/sync hardening (T-14 conflict UI debt), full test pyramid (Jest + Maestro E2E). 4-sprint sequencing. PLANNING — not yet built. |
| 16 | `Codes_Engine_National_Plan_v1_0.md` | Engineering | 1.0 | National scale-out of the jurisdiction/codes engine — Postgres platform-scoped (no-RLS) reference store (`code_editions`, `zip_county`, `counties`, `jurisdiction_layers`; migration 0020), pure-engine loader swap, full US ZIP→county ingest, super-admin curation API+web. Resolves OQ-16. **BUILT — Phases 1–4 done (Sessions 36–38); AHJ/amendment curation is ongoing data-ops.** |
| 17 | `Time_Tracking_Payroll_v1_0.md` | Engineering | 1.0 | Time entries, weekly timecards (draft→submitted→approved/rejected FSM), clock in/out punches, payroll CSV export + QB/Gusto/ADP push. 6 tables (migrations 0005/0007/0011). Two capture modes via `tenant_settings`. No tier gate. T-60/61/62. **BUILT (Sessions 7, 22–26); documented retroactively Session 40.** Mobile = offline time entry only (clock/timecard web-only; conflict-UI debt). |
| 18 | `Task_BuildOut_Engine_v1_0.md` | Engineering | 1.0 | Per-task work-step generation — deterministic per-trade **Task Build-Out Engine** (`lib/task-buildout/`) referencing the blueprint analysis + codes engine → `task_steps` (instruction + code refs + gating inspection + tools/materials/safety/qa). Task detail aggregator with **task-scoped** codes/inspection status, QA proof photos, rich editor (web slide-over + page, mobile). `schedule_tasks` gains native trade/phase/csi. Migrations 0021/0022. No tier gate. **BUILT — Session 41.** |
| 19 | `Estimating_Engine_v1_0.md` | Engineering | 1.0 | Deterministic **sub-level job estimating engine** (`lib/estimating/`) — quantities (blueprint facts / parametric $/SF / takeoff) → assembly expansion (material + labor_hrs×burdened_rate + equipment)×waste → markups (OH/profit/tax/contingency) → bid. Cost catalog (`estimate_assemblies`) w/ seeded system rows + tenant override cascade; `estimates` FSM (draft→final→sent→awarded/lost) + line items w/ assumptions + optimistic lock; convert-to-bid-package + award→budget seed. Web (estimates + catalog editor). Migration 0028. No tier gate. T-63. **BUILT — Session 46.** |
| 20 | `Project_Map_v1_0.md` | Engineering | 1.0 | **Google-Maps-style project map** (web + mobile). `projects` +lat/lng/geocode_status; US Census geocoder + county-centroid fallback (`geocode-worker`, free, no key); **MapLibre GL + OSM tiles** ($0, no client key). Slim bbox `/v1/projects/map`; portfolio map (cluster/split/slide-over/filters/4 layers) + single-project tab + mobile near-me (GPS + directions handoff). Layers: projects / assets (Business+) / jurisdiction / crew (needs punch-GPS, OQ-17 additive). Cross-tenant site layer connection-gated (P-02). No tier gate on map. **Phases 1–3+5 BUILT — Sessions 47–48** (geocoding, web portfolio map, single-project map + pin-drop + mobile directions, asset/crew/jurisdiction layers). Phase 6a punch-GPS + precise crew layer BUILT (0038). Phase 4 mobile near-me (native rebuild) + geofence enforcement/cross-tenant layer remain. |
| 21 | `Trade_Taxonomy_v1_0.md` | Engineering | 1.0 | **Canonical subcontractor trade taxonomy** (T-64) — ~100 trades in 10 categories (`api/src/lib/trades/taxonomy.ts`): key/label/CSI/default_phase/`permit_trade` collapse onto the 4-trade codes engine (T-59 unchanged) + aliases. Data-driven `tradeToPermitTrade()`; `GET /v1/trades` for pickers. 13 legacy blueprint trades = strict subset; unknown free text still → building; `permit_trade: null` = no-permit service trades. **Phases 1–4 BUILT — Session 47** (vendor picker/normalization/filter; build-out recipes incl. `nopermit.ts`; catalog seed migration 0037). Phase 5 ES labels = v1.1. |
| 22 | `Client_Visualizer_v1_0.md` | Engineering | 1.0 | **Design Studio** (proposed T-65) — contractor-invited clients describe a job through an AI-guided, per-trade intake wizard; concept renders (provider interface); deterministic budget range from the estimating engine; contractor verifies → draft estimate. Trade-generic framework `api/src/lib/intake/` (adding a trade = one module + catalog rows). **P1a/P1b/P2 BUILT 2026-10-06** (concrete_flatwork, migrations 0045/0046). P0 provider spike + P3 web remain. |
| 23 | `Trade_Knowledge_Packs_v1_0.md` | Engineering | 1.0 | **Trade Knowledge Packs** (proposed T-66) — one declarative pack per trade (`api/src/lib/trades/packs/<key>.ts`: work steps, code refs, hazards, QA, inspection checklists, cost assemblies, quantity rules, blueprint callouts, provenance) read by every engine. Taxonomy completed against CSLB/NAICS/SOC/CSI: **127 → 183 trades + `heavy_civil` category (Wave 0a, 2026-10-08)**. 23 build waves, ledger `Trade_Knowledge_Session_Plan.md`, procedure `trade-packs/RESEARCH_PROMPT.md`. **Wave 0b BUILT 2026-10-08** — pack infra wired into every engine + knowledge/hazards endpoints + 183 stubs + pilots decks/concrete (migration 0048). |

---

## 3. Context Routing Guide

| Topic / Question Type | Primary Doc | Also Consult |
|---|---|---|
| **What features are in v1.0?** | Doc 02 — MVP Scope | Doc 01 — PRD |
| **What features are deferred?** | Doc 02 — MVP Scope | — |
| **Full feature requirements for [feature]** | Doc 01 — PRD | — |
| **Database schema for [table]** | Doc 04 — Data Model | Doc 03 — Architecture |
| **API endpoint for [action]** | Doc 05 — API Spec | Doc 04 — Data Model |
| **Authentication / JWT** | Doc 03 — Architecture (Sec 3) | Doc 05 — API Spec (Sec 2) |
| **Tenant isolation / RLS** | Doc 03 — Architecture (Sec 1–3) | Doc 04 — Data Model |
| **Prisma + RLS compatibility** | Doc 03 — Architecture (Sec 3.6) | — |
| **withTenantContext safety** | Doc 03 — Architecture (Sec 3.7) | — |
| **Tech stack decisions** | Doc 03 — Architecture | Doc 09 — Mobile Spec (Sec 1, 9) |
| **Offline mode / sync** | Doc 09 — Mobile Spec (Sec 2) | Doc 05 — API Spec (Sec 12) |
| **Offline conflict resolution** | Doc 03 — Architecture (Sec 4.8) | Doc 09 — Mobile Spec |
| **Cross-tenant collaboration** | Doc 07 — Cross-Tenant Spec | Doc 03 — Architecture (Sec 6) |
| **shared_project_events access control** | Doc 03 — Architecture (Sec 6.7) | Doc 07 — Cross-Tenant Spec |
| **Portal user migration** | Doc 03 — Architecture (Sec 6.8) | — |
| **What data is shared cross-tenant?** | Doc 07 — Cross-Tenant Spec (Sec 4–5) | — |
| **User roles and permissions** | Doc 06 — Roles & Permissions | Doc 05 — API Spec |
| **Background job tenant context** | Doc 03 — Architecture (Sec 4.6) | — |
| **API versioning policy** | Doc 03 — Architecture (Sec 4.7) | Doc 05 — API Spec |
| **WebSocket / real-time isolation** | Doc 03 — Architecture (Sec 5.1) | — |
| **Inbound webhooks** | Doc 03 — Architecture (Sec 4.9) | Doc 05 — API Spec |
| **Integration resilience / circuit breaker** | Doc 03 — Architecture (Sec 4.10) | — |
| **File upload security** | Doc 03 — Architecture (Sec 4.11) | — |
| **File download security** | Doc 03 — Architecture (Sec 4.4) | Doc 05 — API Spec |
| **Audit log** | Doc 03 — Architecture (Sec 4.12) | — |
| **Data export / CCPA portability** | Doc 03 — Architecture (Sec 4.13) | — |
| **Push notifications / APNs / FCM** | Doc 03 — Architecture (Sec 4.14) | Doc 05 — API Spec (Sec 10) |
| **Infrastructure by growth stage** | Doc 03 — Architecture (Sec 9.5) | — |
| **QuickBooks integration** | Doc 05 — API Spec (Sec 13) | Doc 03 — Architecture (Sec 4.9, 4.10) |
| **Stripe / billing** | Doc 11 — Pricing & Billing (Sec 3) | Doc 03 — Architecture (Sec 4.9) |
| **Security requirements** | Doc 03 — Architecture (Sec 8) | Doc 09 — Mobile Spec |
| **Performance targets** | Doc 03 — Architecture (Sec 10) | — |
| **Codes/jurisdiction engine (national scale-out)** | Doc 16 — Codes Engine National Plan | `LOCKED_DECISIONS.md` T-59, memory `jurisdiction_engine` |
| **Code editions / AHJ / ZIP→county data storage** | Doc 16 — Codes Engine National Plan | `Schema_Reference.md` Domain 16 (after 0020) |
| **Time entry / daily labor logging** | Doc 17 — Time Tracking & Payroll | `Schema_Reference.md §Domain 7`, skill `time-tracking` |
| **Weekly timecards / approval workflow** | Doc 17 — Time Tracking & Payroll | `LOCKED_DECISIONS.md` T-60 |
| **Clock in/out / time punches / time-tracking mode** | Doc 17 — Time Tracking & Payroll | `LOCKED_DECISIONS.md` T-61, `Schema_Reference.md §Domain 17` |
| **Payroll export / provider sync / pay settings** | Doc 17 — Time Tracking & Payroll | `LOCKED_DECISIONS.md` T-62 |
| **Overtime / job-cost rollup from labor** | Doc 17 — Time Tracking & Payroll | `field-cost-worker.ts`, `budget_line_items` |
| **Task work steps / laborer instructions / build-out engine** | Doc 18 — Task Build-Out Engine | skill `task-buildout`, `lib/task-buildout/` |
| **Task detail / per-task codes / inspection status** | Doc 18 — Task Build-Out Engine | `Schema_Reference.md §Domain 9b`, Doc 16 (codes) |
| **Task QA / proof photos** | Doc 18 — Task Build-Out Engine | skill `file-upload-security`, `schedule_task_photos` |
| **Job estimating / assembly pricing / cost catalog** | Doc 19 — Estimating Engine | skill `estimating`, `lib/estimating/`, `Schema_Reference.md §Domain 18` |
| **Estimate markups / labor burden / bid total** | Doc 19 — Estimating Engine | `LOCKED_DECISIONS.md` T-63 |
| **Estimate → bid package / award → budget seed** | Doc 19 — Estimating Engine | `bid_packages`, `budget_line_items`, `field-cost-worker.ts` |
| **Trade list / subcontractor types / trade classification** | Doc 21 — Trade Taxonomy | `api/src/lib/trades/taxonomy.ts`, `GET /v1/trades` |
| **Trade → permit trade collapse / adding a new trade** | Doc 21 — Trade Taxonomy | `LOCKED_DECISIONS.md` T-59 + T-64, `trade-map.ts` |
| **Project map / portfolio map / near-me** | Doc 20 — Project Map | `projects.lat/lng`, MapLibre + OSM |
| **Geocoding / address → lat/lng / county centroid** | Doc 20 — Project Map | US Census geocoder, `geocode-worker.ts` |
| **Map layers (assets / crew / jurisdiction on map)** | Doc 20 — Project Map | Doc 14 (assets), Doc 17 (crew punch-GPS/OQ-17), `jurisdiction_engine` |
| **Language / i18n requirements** | Doc 01 — PRD (Sec 12) | Doc 09 — Mobile Spec (Sec 11) |
| **Language architecture (technical)** | Doc 03 — Architecture (Sec 12) | Doc 04 — Data Model (Sec 11) |
| **Pricing tiers and costs** | Doc 11 — Pricing & Billing (Sec 1) | `KEY_NUMBERS.md` |
| **Unit economics (CAC, LTV)** | Doc 11 — Pricing & Billing (Sec 3.2) | `KEY_NUMBERS.md` |
| **Competitor analysis** | Doc 10 — Competitive Analysis | — |
| **ICP / target customer** | Doc 12 — GTM (Sec 1) | Doc 01 — PRD (Sec 3) |
| **Launch plan** | Doc 12 — GTM (Sec 4) | — |
| **Investor pitch narrative** | Doc 13 — Investor Overview | Doc 10 — Competitive Analysis |
| **Any locked decision** | `LOCKED_DECISIONS.md` | — |
| **Asset / vehicle / equipment / tool management** | Doc 14 — Asset_Management_v1_0.md | `Schema_Reference.md §Domain 14` |
| **Operator cert enforcement on equipment** | Doc 14 — Asset_Management_v1_0.md | `LOCKED_DECISIONS.md T-57` |
| **Asset depreciation / QuickBooks sync** | Doc 14 — Asset_Management_v1_0.md | Doc 05 — API Spec (QuickBooks) |
| **Fleet insurance / warranty / registration** | Doc 14 — Asset_Management_v1_0.md | — |
| **Pre-use inspection / OSHA compliance** | Doc 14 — Asset_Management_v1_0.md | Doc 06 — Roles |
| **Client project request / visualizer / Design Studio** | Doc 22 — Client Visualizer | `api/src/lib/intake/`, `routes/v1/{studio,client-studio}.ts` |
| **Adding a trade intake module** | Doc 22 — Client Visualizer ("How to add a trade") | Doc 21 (taxonomy), `intake-registry.test.ts` |
| **Adding / deepening a trade (steps, hazards, QA, costs)** | Doc 23 — Trade Knowledge Packs | skill `trade-packs`, `docs/trade-packs/RESEARCH_PROMPT.md` |
| **Trade-pack build progress / next wave** | `Trade_Knowledge_Session_Plan.md` (ledger) | `docs/trade-packs/waves/` |
| **Term definition** | `GLOSSARY.md` | — |
| **Change history / session context** | `CHANGE_LOG.md` | — |

---

## 4. Open Questions

Items not yet formally resolved. When resolved, move to `CHANGE_LOG.md` with the decision and date.

| # | Question | Priority | Status | Owner | Raised |
|---|---|---|---|---|---|
| OQ-01 | **Final product name** | High | **RESOLVED — "The Jobsite" (thejobsite.app registered 2026-06-18). Locked as P-11.** | Founder | Session 1 |
| OQ-02 | **Backend language: Node.js/Fastify vs Go** | High | **RESOLVED — Node.js + Fastify (4.26). Entire API built on it. A-11 updated.** | Engineering | Session 2 |
| OQ-03 | **Cloud provider staging: DigitalOcean confirmed?** | Medium | Open — DO recommended for Stage 1–2, AWS for Stage 3+ | Engineering | Session 6 |
| OQ-04 | **ORM: Prisma confirmed?** | Medium | **RESOLVED — Prisma for schema/migrations + types (19 migrations); raw pg for RLS-scoped runtime queries. Already locked by T-42 + T-50; no new decision needed.** | Engineering | Session 2 |
| OQ-05 | **Real-time WebSocket: Pusher vs Ably** | Medium | **RESOLVED — Pusher at Stage 1–2, native WebSocket at Stage 3+. Locked as A-16.** | Engineering | Session 2 |
| OQ-06 | **Translation management platform: Phrase vs Lokalise vs Crowdin** | Medium | Open | Product | Session 5 |
| OQ-07 | **Self-serve vs sales-assisted for Enterprise tier** | Low | Open | Sales | Session 1 |
| OQ-08 | **Cross-tenant data ownership on tenant cancellation** | Medium | Open — retention policy outlined but not finalized | Legal | Session 1 |
| OQ-09 | **International/GDPR timeline** | Low | Open — US-only at launch | Product | Session 1 |
| OQ-10 | **Pricing for sub-accounts within single tenant** | Low | Open | Product | Session 1 |
| OQ-11 | **Design partner recruitment strategy — where to find first 10** | High | Open | Founder | Session 3 |
| OQ-12 | **Spanish-speaking design partner — need at least 1 for i18n QA** | High | Open | Founder | Session 5 |
| OQ-13 | **Background job infrastructure at Stage 1–2: pg-boss vs alternative** | Medium | **RESOLVED — pg-boss at Stage 1–2, SQS at Stage 3+. Same envelope, swap via env var. Locked as A-14.** | Engineering | Session 6 |
| OQ-14 | **Audit log chain verification: separate table per scope or single chain** | Low | Open — single chain recommended, scope field distinguishes tenant vs platform events | Engineering | Session 6 |
| OQ-15 | **Portal user migration: self-service request form or support ticket?** | Low | Open — currently super admin approval only; self-service intake form recommended for v1.1 | Product | Session 6 |
| OQ-16 | **Codes engine storage backend for national scale** | High | **RESOLVED — Postgres platform-scoped (no-RLS) reference store; pure-engine loader swap; bulk ZIP→county ingest; versioned + manual review. See Doc 16.** | Engineering | Session 36 |
| OQ-17 | **GPS geofence clock-in + crew bulk clock-in** — `.docx` MVP marks both "v1.0 SHIP" but neither is built (clock in/out exists, no GPS capture/enforcement, no foreman→multi-worker punch) | Medium | **Partially resolved Session 48** — GPS *capture* at clock-in is BUILT (additive half: migration 0038, web+mobile capture, precise crew map layer — Doc 20 Phase 6a). Geofence *enforcement* + crew bulk clock-in remain deferred to v1.1. | Product/Eng | Session 40 |

---

*Last updated: June 24, 2026*
*Next review: When any locked decision changes, any document is updated, or any open question is resolved.*
