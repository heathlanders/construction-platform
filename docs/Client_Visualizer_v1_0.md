> **Status:** P1a framework · P1b `concrete_flatwork` (0045) · P2 API (0046) · P3 web · **P4 proposal response + convert (0047) — BUILT 2026-10-06**. Full loop verified live on the local stack (invite → wizard → real Ollama suggestions → render → submit → verify → estimate → real proposal PDF → client accepts → project). Remaining: P0 cloud image provider, tier pricing, tunnel route for remote uploads, P5 more trades. Proposed T-65 (not yet locked).

# Design Studio (Client Project Visualizer) — v1.0 (trade-generic)

Branch: `feat/client-visualizer` (cut from fresh `main` @ a06b71b). Supersedes `.claude/plans/zazzy-kindling-clover.md`.
Proposed locked decision **T-65**. Canonical doc on build: `docs/Client_Visualizer_v1_0.md`.

## Context

Clients can't describe or see the job they want; contractors hand-estimate from vague requests. Feature: a
contractor invites a client → client photographs the space → AI-guided per-trade wizard captures decisions →
AI renders a concept image → deterministic engine turns the answers into a budget range → contractor confirms
and sends a proposal.

**Scope rule (user, 2026-10-06):** v1 ships **concrete_flatwork only**, but the framework is built for **any of
the 127 taxonomy trades**. Adding a trade = one declarative module + a catalog seed migration + fixtures. No new
routes, tables, or web code.

Decisions made:
- Entry: contractor-invited `CLIENT_PORTAL` user (lives in contractor tenant). Marketplace later; model has a `channel` column so it's not blocked.
- Image gen: cloud image-edit API behind a provider interface (env-swapped, like T-26/T-30).
- Client sees a **budget range** only; contractor reviews/adjusts before it becomes a proposal.
- **Only trades with a full module are offered** (no generic fallback intake in v1).
- **Data model = request → many trade scopes from day 1**; v1 UI creates one scope.
- **Each tenant enables the trades it offers**; client picks in plain words from *enabled ∩ registered*.

## Core principle

Image generators can't measure. **The image never drives scope or price.** Structured answers → deterministic
estimating engine. The render is a decision aid, stored paired with the exact spec snapshot that produced it.
AI never writes the spec — it only proposes values the client confirms. AI/photo-derived numbers are tagged
`photo_estimate` (unverified) and widen the range.

## 1. Trade intake framework — `api/src/lib/intake/` (pure, no I/O)

```
intake/
  fields/<type>.ts     field-type library (shared by every trade)
  spec.ts              buildSpecSchema(module), loadSpec(raw) (upgrades)
  ai-schema.ts         compileAiSchema(module, values) → tool schema
  prompt.ts            compilePrompt(module, values) → English image prompt
  requirements.ts      baselineRequirements(...) + module extras
  common-steps.ts      site / photos / timeline-budget (own version)
  registry.ts          Record<trade_key, TradeIntakeModule>
  trades/concrete_flatwork.ts
```

### Module contract (declarative data + a few pure functions)
```ts
type Bi = { en: string; es: string };                       // same convention as taxonomy label/label_es
type Cond = { field: string; in?: unknown[]; not_in?: unknown[]; truthy?: boolean };
interface Option { value: string; label: Bi; help?: Bi; swatch?: string; prompt?: string /* EN fragment */ }
type FieldDef = // common: id, label: Bi, help?, required?, visible_when?: Cond[]
  | { type:'area'; shapes:('rect'|'l_shape'|'circle'|'direct_sf')[]; min_sf; max_sf; ai_assessable? }
  | { type:'linear'; min_lf; max_lf; ai_assessable? } | { type:'count'; min; max; ai_assessable? }
  | { type:'number'; unit:'in'|'ft'|'pct'; min; max; step; default? }
  | { type:'choice'|'multichoice'; options: Option[]; max_select?; ai_assessable?; ai_suggestible? }
  | { type:'boolean'; prompt_true? } | { type:'photo'; role; min; max } | { type:'text'; max_len }
interface StepDef { id; title: Bi; intro?: Bi; fields: FieldDef[]; visible_when?: Cond[] }

interface TradeIntakeModule<S> {
  trade_key: string;                // taxonomy key, not an umbrella
  intake_version: number;
  entry_points: { id; label: Bi; keywords: {en: string[]; es: string[]}; preset: Partial<S> }[]; // Patio/Driveway/Walkway
  location: 'exterior'|'interior'|'either';
  disturbs_ground?: boolean;        // overrides category-derived 811 rule
  capabilities: { priced: boolean; renderable: boolean; photo_assess: boolean };
  steps: StepDef[];                 // wrapped by common steps
  catalog_codes: readonly string[]; // every code scopeToQuantities may emit (guard-tested)
  derive?(v): Record<string, number>;               // area_sf, perimeter_lf, concrete_cy…
  scopeToQuantities(v, d): QuantityInput[];          // leaves `trade` unset on coded lines
  prompt: { scene: string; order: string[]; suffix?: string };
  permit_rule?(v, d): 'likely'|'depends'|'unlikely';
  requirements?(v, d, ctx): RequirementItem[];
  range_policy?: { base_band_pct; unverified_band_pct };
  ai_hints?: string;
  upgrades: Record<number, (old) => unknown>;        // v(n) → v(n+1)
  fixtures: { name; version; values }[];             // ≥3 current + 1 per old version
}
```
- Each field type exports `zod(def)`, `aiSchema(def)`, `summary(def, v, lang)`, `promptFragment(def, v)`. The
  area/shape calculator lives here once.
- **Web is trade-agnostic:** `GET …/studio/trades/:key/intake` returns locale-resolved steps; one React
  component per field type renders them.
- Labels are inline `Bi` (EN+ES) in the module — trade content is data, like taxonomy `label_es`. Web chrome
  goes in `web/locales/{en,es}/studio.json`. Image-prompt fragments stay English.

### Spec + versioning
- Spec JSONB: `{ trade_key, intake_version, values, provenance: { field: client|ai_confirmed|photo_estimate } }`.
- `buildSpecSchema` folds field zods into one object; `visible_when` → superRefine (require visible-required,
  **strip** hidden values — vision.ts strip-don't-reject style).
- Bump `intake_version` on any meaning change; never reuse a field id. `loadSpec` runs upgrades then parses;
  drafts re-save upgraded.
- **Submitted scopes are frozen:** store `spec_snapshot`, `intake_version`, `quantities_snapshot`,
  `summary_snapshot`. Review/proposal read snapshots → old scopes never need old code.

### Trade → estimating bucket
- New `api/src/lib/estimating/trade-bucket.ts`: `estTradeFor(key) = tradeDef(key)?.permit_trade ?? 'general'`.
  Default only (manual lines, placing seed rows).
- **Catalog row's trade wins for coded lines** (`buildEstimateLines` already does `q.trade ?? item.trade`).
  Reason: taxonomy↔bucket isn't consistent today (`gutters` permit_trade null but `B-GUTTER-LF` in `building`).
- Call `loadCatalog(client)` **unfiltered** — flatwork pulls from `building` and `general` (pump, removal).

### AI guide — generated from the step schema (the "AI-guided prompts")
- `compileAiSchema` builds a tool definition from `ai_suggestible`/`ai_assessable` fields (options → enums,
  numbers keep bounds). Output `{ suggestions:[{field, value, confidence, reason: Bi}], next_field? }`.
  Works for every future trade with zero extra code.
- Two calls behind an `LlmProvider` interface (Claude vs local Ollama, env-selected):
  1. **Photo assess** (`photo_assess`): existing surface, slope, rough size.
  2. **Help me decide**: client free text + unanswered fields → suggestions + next question.
- Each suggestion validated against its own field zod; bad ones dropped; any failure → `null`, wizard continues
  (vision.ts pattern). Suggestions render as Accept chips → PATCH with provenance `ai_confirmed`.
- Client text only in the user turn, length-capped; AI `reason` never reaches the image prompt.

### Common steps + baseline requirements
- `common-steps.ts` (versioned as `common_intake_version`): **site** (address → geocode/jurisdiction, property
  type, own/rent, HOA when not interior), **photos** (module's roles; EXIF stripped), **timeline & budget**.
- `baselineRequirements` items `{id, level: required|likely|info, title: Bi, body: Bi, owner, source}`:

| Source | Item |
|---|---|
| `permit_trade != null` | Permit: `module.permit_rule()` (default `depends`) + AHJ contact from `resolveJurisdiction().ahj` if any; "contractor confirms". (`resolveJurisdiction` returns editions+AHJ, not likelihood — rule lives in the module.) |
| `category==='sitework'` or `disturbs_ground` | Call 811 before digging (contractor) |
| exterior + HOA yes/unsure | HOA approval (client) |
| condo/townhome · renter | Association/landlord approval · owner authorization |
| always | Site access/pets, deposit & contract, "concept only — not to scale" |

## 2. concrete_flatwork module (v1)
- Entry points: Patio, Driveway, Walkway/Sidewalk (presets).
- Steps: purpose/use → area (shape calc) → thickness & base (4"/5"/6", gravel base) → reinforcement (none/wire/rebar)
  → finish (broom/smooth/stamped/exposed aggregate) → color → edging/borders → extras (steps count, drainage,
  control joints, sealer) → existing surface + demo (ai_assessable) → slope/access (ai_assessable).
- `derive`: area_sf, perimeter_lf, concrete_cy (with thickness).
- Permit rule: driveway apron / right-of-way → `likely`; else `depends`.
- Extra requirements: cure time & weather window, drainage away from foundation.
- Catalog: reuse `B-FLATWORK-SF`, `B-AGG-BASE-SY`, `B-REBAR-LF`, `B-CONCRETE-CY`, `EQUIP-CONCRETE_PUMP`.
  **New** (migration, sentinel-tenant system rows, `ON CONFLICT` like 0037): exterior removal/haul (existing
  `G-DEMO-SF` is *interior*), forms/edging LF, wire mesh SF, stamped finish + color hardener SF, exposed
  aggregate SF, saw-cut control joints LF, drain LF, sealer SF, concrete steps EA.

## 3. Pricing → range
`loadSpec → derive → scopeToQuantities → buildEstimateLines(loadCatalog merged) → computeTotals`
(`api/src/lib/estimating/{index,math}.ts`, `api/src/services/estimates.ts`). Range = base total ±
`base_band_pct`, plus `unverified_band_pct` when any quantity-driving field is `photo_estimate` or
`measurements_verified=false`. FLOOR cents (T-02). On contractor "Create estimate": draft `estimates` row
(project_id nullable already), lines from `quantities_snapshot`, edited in the existing estimates UI, sent via
existing proposal flow (`lib/estimate-pdf.ts`, `POST /estimates/:id/proposal`). **Client DTOs carry range +
summary only — never catalog costs, markups, or lines.**

## 4. Image rendering
- `api/src/lib/intake/../studio/provider.ts`: `ImageEditProvider.edit({photo, prompt, mask?, n})`. Env
  `STUDIO_ENABLED`, `STUDIO_IMAGE_PROVIDER`, caps. Retries w/ jitter (T-21), Redis circuit breaker (T-22),
  failures surfaced (T-23).
- pg-boss job `studio.render`, `tenant_id` in envelope (T-10), `withTenantContext` (T-42); client polls
  (blueprint progress pattern). Output to live storage; pre-signed URLs only.
- Prompt = `compilePrompt` from option fragments only (no raw client text); provider moderation on.

## 5. Data model — migrations `0045_flatwork_assemblies` (data) + `0046_design_studio`
Verify numbers free first. All tables: RLS enabled+forced WITH CHECK, TEXT+CHECK enums (T-53), universal
columns, `version`.
- `tenant_trade_offerings`: trade_key, enabled, display_order, settings JSONB (min job, renders on/off).
  Partial unique `(tenant_id, trade_key) WHERE deleted_at IS NULL`. App rejects keys without a module.
- `design_requests`: client_user_id, project_id?, `channel` ('contractor_invite'; 'marketplace' later), status
  `draft|submitted|reviewed|converted|declined`, site JSONB, common_values JSONB, common_intake_version,
  estimate_id?, range_low/high_cents (rollup), submitted_at.
- `design_request_scopes`: request_id, trade_key, intake_version, spec JSONB, status `draft|complete|submitted`,
  measurements_verified, range_low/high_cents, quantities_snapshot, summary_snapshot, selected_render_id,
  sort_order. No unique on trade_key (patio + driveway allowed).
- `design_renders`: scope_id, request_id, source_file_id, spec_snapshot, intake_version, prompt, provider,
  model, status `queued|running|succeeded|failed|blocked`, storage_path, error, usage_event_id.
- `ai_usage_events` (append-only, SELECT/INSERT policies only): user_id, feature
  (`studio.render|studio.assess|studio.guide`), provider, model, units, unit_kind, `cost_micro_usd BIGINT`,
  subject_type/id, status. First AI metering in the platform; reusable by blueprint vision later.

## 6. API, auth, confinement
- Contractor (`api/src/routes/v1/studio.ts`, OWNER/PM/ESTIMATOR): offerings CRUD, invite (client name/email,
  optional preselected trade/project), request inbox/detail, verify measurements, create estimate, convert to
  project (existing `POST /v1/projects`), decline.
- Client (`api/src/routes/v1/client-studio.ts` under `/v1/client-portal/studio`): trades picker
  (enabled ∩ registered ∩ priced, keyword + alias match), intake schema, request/scope CRUD, photo upload,
  AI assess/guide, render request/poll, requirements, submit.
- Auth: reuse `CLIENT_PORTAL` (roles stay 9). Add magic-link invite/exchange modeled on `homeowner-auth.ts` +
  `lib/password-reset.ts` (Redis single-use, 7-day TTL).
- `portal-gate.ts`: add POST/PATCH rules for `CLIENT_PORTAL` on `/v1/client-portal/studio` only; rest stays
  GET-only. Update matrix in `api/src/test/security-hardening.test.ts`.
- **No portal role gets `/v1/files/upload`.** Namespace upload endpoint reuses `generateUploadUrl` /
  `file.scan` / `promoteToLive` / `assertStorageQuota` (T-27/T-28 intact). EXIF strip + size/dimension caps.
- Every client query re-derives access via `request.client_user_id = jwt.user_id` (client-portal.ts pattern).
- Cost control: per-scope render + AI-call caps, per-tenant monthly cap, env kill switch; all to `ai_usage_events`.

## 7. Web
- Client `(portal)/portal/studio/**`: plain-words trade picker, generic field-type wizard, AI suggestion chips,
  photo capture (`<input capture>` — no native build), render gallery/refine, requirements checklist, submit.
- Contractor `(dashboard)/client-requests/**` (inbox + review: spec summary, renders, provenance badges,
  verify toggle, Create estimate, Convert, Decline) + `settings/studio` (offered trades from registry, invite
  dialog). Kit `@/components/ui` + `DESIGN.md` tokens; i18n EN+ES chrome (P-09).

## Guard tests (make adding a trade safe) — `api/src/test/intake-registry.test.ts`
1. Module keys ∈ `TRADE_KEYS`, not umbrella; registry key = module key; unique entry-point ids.
2. Every `catalog_codes` entry exists as a live system row (DB).
3. Fuzz ~200 schema-generated valid specs/module: parse ok, `scopeToQuantities` never throws, quantities finite
   ≥0, emitted codes ⊆ `catalog_codes`, prompt under cap + only option fragments.
4. Every `Bi` has non-empty en+es (es≠en unless allowlisted); `studio.json` EN/ES key parity.
5. Step integrity: unique field ids, `visible_when` refs earlier fields + real options, `ai_*` fields bounded,
   `prompt.order` refs real fields.
6. Round-trip fixtures; old-version fixtures upgrade + parse.
7. Capabilities consistent (priced ⇒ codes; renderable ⇒ photo field + scene; photo_assess ⇒ assessable field).
8. Golden pricing snapshot per fixture vs system catalog (catches catalog drift).

## How to add a trade (P5 checklist; goes in doc + new skill)
1. Confirm taxonomy key (never add/rename keys — T-64).
2. Catalog seed migration (bucket via `estTradeFor` unless reason not to).
3. `intake/trades/<key>.ts`: entry points, location, steps from library types, codes, `scopeToQuantities`,
   prompt, permit rule, requirements, `intake_version: 1`, ≥3 fixtures. New field type only if none fits.
4. Register in `registry.ts` → guard tests → review golden snapshot.
5. Renderable: real-photo smoke (5 photos). Tenants enable in settings.
Also replace/annotate `.claude/commands/scaffold-trade-module.md` (it creates per-trade tables — violates
invariant 5) with `/scaffold-intake-module`.

## Phases

| # | Scope | Exit |
|---|---|---|
| P0 | Provider spike: 10 real patio photos × 2–3 image-edit providers (realism, keeps house intact, latency, $/img, moderation) | Provider + cost picked; quality go/no-go |
| P1a | Framework: field library, spec/upgrades, AI-schema + prompt compilers, common steps, baseline reqs, `estTradeFor`, guard tests 1,3–7 on a test-only stub module | Green with stub |
| P1b | `concrete_flatwork` module + `0045_flatwork_assemblies` + range policy | Guards 2,8 green; 5 sample specs → sane ranges |
| P2 | `0046` tables/RLS, offerings, invite+magic link, portal-gate, request/scope/render API, AI guide, render job, metering/caps | Route-chain tests (mocked providers) incl. cross-client isolation |
| P3 | Web client wizard + contractor inbox/settings, EN+ES | Manual E2E on local stack + real-provider smoke |
| P4 | Estimate/proposal from frozen snapshots; client approves proposal in portal (DocuSign later) | Client approves in portal |
| P5 | More trades via checklist; multi-scope UI; marketplace entry | — |

P1a/P1b need no open-question answers — start there in parallel with P0.

## Invariants (T-65)
1. Image never determines scope/price; render paired to spec snapshot.
2. Client DTOs never include cost, catalog, or markup data.
3. No portal role gets general file-upload access.
4. Providers behind interfaces; AI failure never blocks the wizard; all AI spend metered.
5. Adding a trade = one module + catalog rows; no new routes/tables/web code (mirrors T-59/T-64).
6. Offered trades = tenant-enabled ∩ registered module.
7. Spec written only through the schema-derived validator; AI output is suggestions only.

## Reuse (don't rebuild)
`buildEstimateLines`/`computeTotals` (`lib/estimating`), `loadCatalog` (`services/estimates.ts`),
`estimate-pdf.ts` + proposal send, `vision.ts` strip/null pattern, `homeowner-auth.ts` + `password-reset.ts`
magic link, `portal-gate.ts`, storage helpers + `file.scan`, `resolveJurisdiction`, queue envelope + circuit
breaker, `tradeDef`/`TRADE_KEYS` (`lib/trades/taxonomy.ts`).

## Verification
- Unit + guard suite (above); FLOOR-cents range math; prompt sanitization.
- Route chain (vitest, providers + storage mocked, queue spy): invite → exchange → offerings filter → create
  request/scope → upload → AI suggest (accept) → render → submit → contractor create estimate → proposal.
  Client A can't read client B; client can't reach `/v1/files/upload` or `/v1/estimates`; non-module trade
  can't be enabled (400).
- `/rls-audit` on new tables; `scripts/smoke-studio.ts` real-provider smoke (mirror `smoke-vision.ts`);
  manual wizard walk EN+ES on local stack.
- Gate: `scripts/ci-local.sh` (`--report` on final commit).
- Docs: `docs/Client_Visualizer_v1_0.md`, `LOCKED_DECISIONS.md` (T-65), `Schema_Reference.md`,
  `PROJECT_MASTER_REFERENCE.md`, skill `.claude/skills/design-studio/SKILL.md`.

## Open questions (don't block P0/P1)
1. Tier/pricing: included, add-on (like GC $99), or per-render overage? Needed before P2 caps are meaningful.
2. Provider after spike; platform absorbs cost vs pass-through.
3. Client with several contractors = one user per tenant — OK for v1?
4. Dimensions: manual + shape calc in v1; photo-reference measurement later?
5. Legal: render disclaimer + photo consent/privacy copy.


## As built — P2 API (2026-10-06)

**Contractor** (`/v1/studio`, OWNER/PM/ESTIMATOR): `GET /trades` · `PUT /offerings/:trade_key` (400 without a module) ·
`POST /invites` (creates/reuses a `client_portal` user, status `invited`; never another role → 409) ·
`POST /requests/:id/resend-invite` · `GET /requests` (cursor) · `GET /requests/:id` (pricing lines, provenance, render
prompts) · `PATCH /requests/:id/scopes/:sid` (`measurements_verified`, value fixes as provenance `contractor`; refreezes a
submitted scope + rolls up the request range) · `POST /requests/:id/estimate` (draft `estimates` row + lines at the
offering's params; once → 409) · `POST /requests/:id/decline`.

**Client** (`/v1/client-portal/studio`, CLIENT_PORTAL): `POST /auth/exchange` (public; single-use magic link
`client_studio_magic:` 7d → JWT) · `GET /trades` (enabled ∩ registered ∩ priced, `?lang`) · `GET /trades/:key/intake`
(localized steps, no prompt fragments, `features`) · requests list/create/get/patch (common answers + site) · scopes
add/patch/delete (draft only, optimistic `version`, ≤5) · `POST …/uploads` (jpg/png only → quarantine + `file.scan`;
`/v1/files/upload` stays closed) · `POST …/ai/{assess,guide}` (suggestions only, stored server-side) ·
`POST …/suggestions/accept` (applies stored values with recorded provenance) · `POST …/renders` (→ `studio.render`
job) · `PUT …/selected-render` · `POST /requests/:id/submit` (completeness 422 with `missing`, freezes snapshots,
notifies owners/PMs/estimators).

**Portal gate:** CLIENT_PORTAL gains `*` on `/v1/client-portal/studio` only. Mutation-checked: leaking cost totals
into the client DTO, or dropping the `client_user_id` filter, fails `design-studio.test.ts`.

**Env:** `STUDIO_IMAGE_PROVIDER` (`none`|`mock`), `STUDIO_LLM_PROVIDER` (`none`|`mock`|`ollama`, + `STUDIO_OLLAMA_MODEL`,
`STUDIO_LLM_TIMEOUT_MS`), caps `STUDIO_MAX_RENDERS_PER_{SCOPE (6), USER_DAY (20), TENANT_MONTH (200)}` and
`STUDIO_MAX_AI_CALLS_PER_{SCOPE (20), USER_DAY (60), TENANT_MONTH (1000)}`. `none` → 503 and the wizard carries on.
`STUDIO_RENDER_CONCURRENCY` (2; use 1 for a local GPU) — renders run on their own pg-boss queue `studio.render`.

**Known gaps:** no cloud image provider yet (P0); client re-login needs a contractor resend (no self-serve link);
EXIF orientation relies on the web re-encoding photos (server strips metadata only); tier gate undecided.


## As built — P3 web (2026-10-06)

- **Client** (`(portal)` group, CLIENT_PORTAL): `/portal/studio` (my requests + plain-words picker from offered entry
  points) and `/portal/studio/[requestId]` — the **trade-agnostic wizard**: trade steps per scope → pictures → common
  property/timing steps → review/submit. One component per field TYPE (`components/studio/field-input.tsx`), photos via
  `photo-field.tsx` (canvas re-encode = upright + EXIF stripped on the device, ≤2400px JPEG), assistant chips,
  render gallery (polls while queued), range card, checklist. Saves per step (dirty fields only); a server 422
  `missing` jumps to the right step.
- **Sign-in:** `/portal/studio/start?token=` (`(portal-auth)` group, middleware `OPEN_PATHS`) → `POST /api/portal/studio/exchange`
  sets the `platform_token` cookie; single-use, guarded against a double effect.
- **Contractor** (`(dashboard)`, RoleGate owner/PM/estimator): `/client-requests` (inbox + status filters + invite modal),
  `/client-requests/[id]` (answers + provenance badges, photos/pictures + prompt, internal pricing table, client range,
  verify toggle, create estimate → `/estimates/[id]` for project-less estimates, resend, decline), `/settings/studio`
  (one card per registered module: offered toggle + labor/markup params + renders toggle). Sidebar `nav.client_requests`.
- All calls go through the `/api/v1/[...path]` catch-all proxy. Portal header gained Projects / Design Studio links.
- **Provenance `default`** (2026-10-06): intake defaults + entry presets are `default`; the assistant may suggest over
  them but never over a person's answer (found in the live E2E — every suggestion was being suppressed).

**Known gaps:** (1) **local/Stage-0 upload URLs are presigned for `http://minio:9000`** (Docker-internal) — a real browser
can't PUT them; this affects every upload in the app, not just the studio (live E2E routed around it with
`--connect-to`). Fix = a public storage endpoint for presigning (or the DigitalOcean Spaces cutover). (2) No screenshot
pass yet (Playwright MCP was down). (3) Multi-scope requests: data + API + wizard support them; the picker only starts one.


## As built — P4 proposal response + convert (2026-10-06, migration 0047)

- The proposal is the existing estimate proposal PDF — the contractor sends it from the request page (calls
  `POST /v1/estimates/:id/proposal {send, recipient_email}`). `design_requests` gains `proposal_response`
  ('accepted'|'changes_requested'), `proposal_responded_at`, `proposal_note`.
- Client: the request detail carries `proposal` (offer total + 15-min PDF link + current response) once the estimate is
  `sent`/`awarded` with a generated PDF. `POST /v1/client-portal/studio/requests/:id/proposal/respond` (changes need a
  note; answering the same proposal twice → 409). A re-sent proposal (newer `proposal_generated_at`) makes the old
  response stale, so the client answers again. Owners/PMs/estimators are notified.
- Contractor: `POST /v1/studio/requests/:id/convert` (OWNER/PM + project tier limit) → creates the project from the
  request site (or reuses the invited one), links the estimate, adds the client as a project member (read-only client
  portal shows the job), status `converted`, geocode job. Award/budget seeding stays the existing estimate `/award`.
- Tests: `design-studio.test.ts` 35 (P4: no-proposal 409, offer-only proposal DTO, note required, stale-on-resend,
  notifications, convert role gate + links + idempotency).


## P0 readiness — cloud image providers (2026-10-06)

`STUDIO_IMAGE_PROVIDER` now also accepts **`openai`** (`gpt-image-1` image edit; `OPENAI_API_KEY`, `STUDIO_OPENAI_MODEL`,
`STUDIO_OPENAI_SIZE` 1536x1024, `STUDIO_OPENAI_QUALITY` medium, est. `STUDIO_OPENAI_COST_MICRO_USD` 63000) and **`gemini`**
(`gemini-2.5-flash-image`; `GEMINI_API_KEY`, `STUDIO_GEMINI_MODEL`, est. `STUDIO_GEMINI_COST_MICRO_USD` 39000), plus
`STUDIO_IMAGE_TIMEOUT_MS`. Adapters map moderation/safety → `blocked`, never throw (tests: `studio-providers.test.ts`).
Costs are estimates written to `ai_usage_events` until real invoices are known.

**Run the spike:** put ~10 real jpg/png photos in a folder, set the key(s), then
`npx tsx --require dotenv/config src/scripts/studio-provider-spike.ts <dir> [--providers openai,gemini] [--fixture 0|1|2]`
→ `<dir>/spike-*/index.html` (original vs each provider, latency, est. cost) + `results.json`. Uses the exact prompt the
product compiles (one sentence: `scene: feature, feature… . keep-the-house suffix`).


## Testing providers — owner's own testing (2026-10-06)

Plan: `docs/Design_Studio_Testing_Providers_Plan.md`. **Not for clients** — subscription terms + non-commercial weights.

- **`STUDIO_LLM_PROVIDER=claude_bridge`** — assistant + photo check on the owner's Claude subscription via the host bridge
  `ops/claude-bridge/` (systemd `jobsite-claude-bridge`, docker0 `172.17.0.1:8789`, bearer token, `claude -p --tools Read
  --json-schema`). Env `CLAUDE_BRIDGE_URL`, `CLAUDE_BRIDGE_TOKEN`, `STUDIO_LLM_TIMEOUT_MS`. Any non-200 (429 usage limit,
  503 expired login) → no suggestions; wizard carries on. Metered at $0. Verified live through the product 2026-10-06:
  guide 2.9s (Spanish request → bilingual reasons), photo assess 4.2s (`photo_estimate` provenance). Ollama stays selectable.
- **`STUDIO_IMAGE_PROVIDER=comfyui`** — open weights on the host GPU via ComfyUI (`ops/comfyui/`, `jobsite-comfyui` on
  `172.17.0.1:8188`). Workflows = API-format JSON in `api/assets/comfyui/workflows/{flux-kontext,qwen-image-edit}.json`
  with `{{INPUT_IMAGE}}`/`{{PROMPT}}`/`{{SEED}}` placeholders. Env `STUDIO_COMFYUI_URL`, `STUDIO_COMFYUI_WORKFLOW`,
  `STUDIO_IMAGE_TIMEOUT_MS` (~900000 locally).
- **`STUDIO_IMAGE_PROVIDER=replicate`** — same open models hosted (`REPLICATE_API_TOKEN`, `STUDIO_REPLICATE_MODEL` default
  `qwen/qwen-image-edit`, `STUDIO_REPLICATE_IMAGE_FIELD`, `STUDIO_REPLICATE_COST_MICRO_USD` est. 30000). Code + tests only;
  needs the owner's key.
- Spike script accepts `--providers comfyui,replicate,openai,gemini` (comfyui is usable when `STUDIO_COMFYUI_URL` is set).


## Pre-merge hardening (2026-10-07 — review of PR #69)

A high-effort review found 10 issues; all fixed with regression tests (mutation-checked):
- **Magic links single-use under concurrency** — `GETDEL` (client-studio, and the same latent race in homeowner + sub-portal links).
- **AI caps** — per-user/day + per-tenant/month caps on top of per-scope (new scopes no longer reset spend).
  Check-then-call race closed: renders count `design_renders` (the reservation row) under a per-tenant advisory
  lock; assess/guide reserve an atomic Redis in-flight slot (`reserveAiCall`) released after metering.
- **Uploads (whole platform)** — `file.scan` now reads the REAL object: size (re-checks quota, credits real
  bytes), magic bytes per extension, and promotes with a server-chosen Content-Type. Declared size/type are claims.
- **Contractor can't add photo file ids**; client photo URLs only for images that client uploaded.
- **Render queue isolated** — `studio.render` has its own consumer (`DEDICATED_QUEUES` in `lib/queue.ts`); a long
  render no longer blocks file scans/pushes/payroll on the shared `jobs` queue.
- **Convert / create-estimate** — `SELECT … FOR UPDATE` + re-check; a double-click makes one project/estimate.
- **Staff notifications** run after the client's submit/respond commits (savepoint per row) — a failed notification
  can't roll back the submit or send pushes for an uncommitted action.
- **EXIF strip fails closed** (`UnsafeImageError` → 422 / failed render); handles 0xFF fill bytes.
- **Multi-scope estimate** priced at one rate set (T-63 — one burdened rate per estimate); mixed trade settings flagged in the estimate notes.
