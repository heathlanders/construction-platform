# Trade Knowledge Packs — Specification v1.0
**"The Operating System for Construction" — Per-trade knowledge for all 183 trades**

> **Status:** Wave 0a BUILT (taxonomy 127 → 183 + `heavy_civil`) and **Wave 0b BUILT (2026-10-08)** —
> pack schema/runtime/guards/scripts, every engine wired, `/v1/trades/:key/knowledge` + `/v1/trades/hazards`,
> 183 stub packs, pilots `decks` (new trade) + `concrete` (complement), migration 0048. Waves 1–3 + S1
> (surfacing in web + mobile) BUILT 2026-10-08 — see the ledger for current status. Execution ledger:
> `docs/Trade_Knowledge_Session_Plan.md`. Skill: `.claude/skills/trade-packs/SKILL.md`.
> **Builds on:** Trade Taxonomy (Doc 21, T-64), Task Build-Out Engine (Doc 18), Estimating Engine
> (Doc 19, T-63), Blueprint Intelligence, codes/jurisdiction engine (T-59).
> **Proposed decision T-66** (lock when Wave 0b merges) — see §8.

---

## 1. Why

Before this work, per-trade knowledge was hand-coded inside engine logic files:

| Consumer | Coverage before packs |
|---|---|
| Work-step recipes (`lib/task-buildout/`) | ~28 of 127 trades have dedicated steps; electrical/plumbing/mechanical families none |
| Code refs (`code-refs.ts`) | 4 permit families only |
| Equipment rules | 4 permit families; no-permit trades get **no** equipment |
| Cost catalog (`estimate_assemblies`) | 121 system rows, ~35 trades |
| Quantity seeders (`quantities.ts`) | 5 buckets, heuristic |
| Blueprint component detectors | 27 tokens, 6 for taxonomy trades |
| QA checklists / JSA hazard library | **none** |
| Design Studio intake | 1 trade |

Adding a trade meant editing ~8 logic files. Packs make it **one data file per trade** that every
engine reads through one registry.

## 2. Taxonomy completeness (Wave 0a — done)

Reviewed against CSLB license classes (A/B/B-2/C-2…C-61), NAICS 236/237/238, BLS SOC 47-2000/47-4000/
49-9000 and CSI MasterFormat Div 02–48. 127 → **183 keys**, new category `heavy_civil`.

- **Residential outdoor:** decks, patio_covers_awnings, hardscape_pavers, docks_marine_residential,
  tree_service, gate_operators
- **Remodel / repair:** remodeling, foundation_repair, concrete_repair_lifting, restoration,
  house_moving, manufactured_modular, closets_storage, chimney
- **Structure / envelope:** formwork, underlayment_leveling, pemb, metal_panels
- **Commercial specialties:** specialties (Div 10), operable_partitions, access_flooring, furniture_ffe,
  material_handling, special_construction, fire_protection_special, lightning_protection,
  battery_storage, kitchen_exhaust, trenchless_sewer, rigging_millwright, industrial_coatings
- **Heavy civil:** pipeline, power_line, telecom_outside_plant, directional_drilling, highway_bridge,
  guardrail_barriers, traffic_signals_lighting, marine_dredging, tunneling, rail_track,
  environmental_remediation, ground_improvement
- **Services:** architect, engineering, interior_design, construction_management, estimating_services,
  permit_expediting, home_inspection, environmental_consulting, utility_locating, equipment_rental,
  site_services, safety_consulting, reality_capture

~30 alias-only additions (lead_paint→abatement, locksmith→security_access, backflow→plumbing,
fiber→low_voltage, handyman→remodeling …). `hardscape` moved retaining_walls → hardscape_pavers
(no stored rows used either value — audited 2026-10-08). Out of scope: snow removal, janitorial,
landscape maintenance.

**heavy_civil rules:** `permit_trade: null` (DOT/owner-inspected — avoids false IRC/IBC gating; DOT
checks live in non-gating `inspection_checklists`); estimating bucket `general` (the
`estimate_assemblies.trade` CHECK allows only 5 buckets); catalog prefix `HC-`.

## 3. Pack format

One TypeScript module per trade, validated by zod. Pure data — a pack imports only types and
`sources.ts`; shared logic lives once in `runtime.ts`.

```
api/src/lib/trades/packs/
  schema.ts               zod schema; TradePack = z.infer<typeof TradePackSchema>
  sources.ts              SOURCES registry (id → {title,url,publisher,license,retrieved})
  runtime.ts              packFor, matchStep, renderTemplate, evalQty, resolveHazards, packComponents
  index.ts                GENERATED barrel → PACKS: ReadonlyMap<string, TradePack>
  catalog-manifest.json   GENERATED assembly code → migration name
  <key>.ts                one per trade — `export default definePack({...})`
```

```ts
type Confidence = 'verified' | 'derived' | 'estimate';
interface Prov { src: SourceId[]; confidence: Confidence; last_verified: string; note?: string }
interface Sourced<T> { v: T; prov: Prov }
type I18nText = { text: string; status: 'human_translated' }   // professional translator (safety OK)
  | { text: string; status: 'translated' }                      // pack author — NON-safety only
  | { status: 'pending_human_translation' };

interface TradePack {
  key: string; schema_version: 1; pack_version: string;          // semver
  status: 'stub' | 'draft' | 'reviewed';
  identity: { summary: string; summary_es: string;
              glossary: { term: string; term_es: string; def: string; def_es?: string }[] };
  est_bucket?: 'electrical' | 'plumbing' | 'mechanical' | 'building' | 'general';
  recipes: Recipe[];
  code_refs?: Partial<Record<InspectionType, { section: string; note: string; prov: Prov }[]>>;
  equipment?: { when: Match; type: EquipmentType; reason: string; optional?: boolean }[];
  assemblies?: PackAssembly[];
  quantity_rules?: QtyRule[];
  components?: { token: string; re: string; example: string; vision_hint?: string;
                 task: { title: string; phase: PhaseType; csi: string; days: number } }[];
  qa_checklist?: { id: string; phase?: PhaseType; item: string; item_es: I18nText; prov: Prov }[];
  hazards?: Hazard[];
  inspection_checklists?: Partial<Record<string, { item: string; item_es: I18nText; ref?: string }[]>>;
  dependency_hints?: { after_trades?: string[]; before_phase?: PhaseType; note: string }[];
  intake_hook?: { module_id?: string };
}
interface Match { phase?: PhaseType[]; title_re?: string; facts_any?: string[]; building_types?: BuildingType[] }
interface Recipe { id: string; when: Match; priority?: number; supersedes_hand?: boolean; steps: StepTpl[] }
interface StepTpl { title: string; instruction: string; detail?: string;
  code_refs?: { section: string; note: string }[]; tools: string[]; materials: string[];
  safety_ids: string[]; qa_ids?: string[]; gating_inspection_type?: InspectionType }
interface Hazard { id: string; hazard: string; hazard_es: I18nText; controls: string[]; controls_es: I18nText;
  osha_ref: string; severity: 1 | 2 | 3 | 4; ppe?: string[]; prov: Prov }
interface PackAssembly { code: string; name: string; name_es: string; unit: string; csi: string;
  material_cost_cents: Sourced<number>; labor_hours_per_unit: Sourced<number>;
  equipment_cost_cents: Sourced<number>; waste_pct: Sourced<number> }
type QtyRule = { code: string; assumption: string; when?: Match;
  qty: { basis: 'rooms' | 'windows' | 'doors' | 'panels' | 'area_sf_sum' | 'const'
         | { fixture: string } | { component: string }; mul?: number; add?: number; round?: 'ceil' | 'round' } };
```

- **Templates:** `${ct}` (code family), `${ed}` (edition), `${bt}` (building type), `${facts.*}`
  whitelisted paths. Unresolved placeholder renders as `—`; guard rejects unknown placeholders.
- **Safety written once:** steps reference `safety_ids` → `hazards[]`, so each hazard is authored and
  translated once and reused by steps, the JSA suggestion endpoint, and QA.
- **ES:** `summary_es`, glossary `term_es`, assembly `name_es` required. Safety text (hazards, controls,
  safety QA) is `pending_human_translation` until a human translates (T-08 — never machine-translate).

## 4. Licensing rules (enforced by guards)

| `license` | Examples | What may be stored |
|---|---|---|
| `public_domain` / `gov_open` | eCFR (OSHA 1926, HUD 3285, PHMSA 192/195, EPA 40 CFR), UFGS, FHWA, USACE, BLS, SAM.gov, state DOT, DOE BASC, ENERGY STAR, CPSC, ADA 2010 | Facts, numbers, short quotes (prefer paraphrase) |
| `manufacturer_public` | Published installation instructions | Paraphrase + cite; numbers OK with citation |
| `association_public` | AWC DCA 6, NCMA TEK, BIA Tech Notes, NRMCA CIP, DASMA TDS | Paraphrase + cite |
| `platform_estimate` | Our own expert baseline (`platform-baseline` source) | Numbers allowed, but `confidence` must be `estimate`; UI badges them "platform baseline — tune per tenant" |
| `proprietary_ref_only` | ICC I-codes, NFPA, IAPMO, ASTM, RSMeans, NECA/MCAA labor units, IICRC, AARST | Section numbers, ≤10-word titles, our own paraphrase. **Never** tables or numbers. A cost whose only source is proprietary is rejected. |

## 5. Integration (no rewrite of hand recipes)

Precedence everywhere: **pack (when its Match hits) → existing hand code → generic fallback.** A pack
replaces a hand recipe only with `supersedes_hand: true` and a snapshot update in the same PR.

| Consumer | Change |
|---|---|
| `task-buildout/index.ts` | `packFor(trade)` → `renderPackSteps` before the permit-family switch; shared post-process (renumber, gating validity, equipment). Equipment: on HAND-recipe steps pack equipment is MERGED with the family rules (pack first, dedup by type); on PACK-recipe steps only the pack's own equipment rules apply (family rules are phase-keyed and misfire); also runs on the no-permit path. |
| `task-buildout/code-refs.ts` | `codeRefsFor(..., tradeKey?)` merges pack refs with family `SECTIONS`, dedup by section |
| `estimating/quantities.ts` | `seedFromPacks()` after the bucket seeders; hand seeder wins on the same code; reuses catalog gating |
| `estimating/trade-bucket.ts` | `pack.est_bucket` first |
| `blueprint-pdf/parse-sheets.ts` | export `COMPONENT_PATTERNS = [...CORE, ...packComponents()]`; `COMPONENT_TOKENS` derives → `vision.ts` stays in sync; vision token cap + prompt-length snapshot |
| `blueprint-pdf/build-tasks.ts` | loop pack component tasks via existing `comp()` |
| `task-dependencies/rules.ts` | one generic convergence rule from `dependency_hints`, `isForward` guard kept |
| `routes/v1/trades.ts` | `GET /v1/trades/:key/knowledge?lang=` and `GET /v1/trades/hazards?keys=` (static, ETag = pack_version; pending ES → `null` + `es_pending: true`) |
| Catalog | `scripts/gen-catalog-migration.ts` emits `prisma/migrations/00NN_trade_pack_catalog_wNN` in 0045's style; append-only; corrections = new UPDATE migration |

Surface (Wave S1): task-detail QA checklist (web), JSA "suggest hazards for today's trades" (web +
mobile, pre-fills free-form `jsa_records.hazards` — no migration), estimate "platform baseline" badge
for `estimate`-confidence costs.

## 6. Tooling

| Script (`api/package.json`) | Purpose |
|---|---|
| `pack:new <key>` | scaffold `<key>.ts` (status stub) + dossier from template |
| `pack:check [key]` | zod + guards for one pack (or all), seconds |
| `pack:barrel` | regenerate `packs/index.ts` |
| `pack:smoke <key>` | print built steps for a sample task, seeded estimate lines, knowledge payload |
| `pack:verify-sources` | HEAD-check every SOURCES url; flag 4xx/5xx |
| `gen:catalog-migration -- --wave NN [--apply]` | dry-run SQL / write the wave's catalog migration + manifest |

Guard test `api/src/test/trade-packs.test.ts`: schema; key ∈ taxonomy; gating/code-ref inspection types
exist in the family sequence (none for null-permit trades); equipment ∈ vocab; assembly codes unique
across packs + existing seeds and present in a migration; prefix rule E-/P-/M-/B-/G-/HC-/EQUIP-;
component tokens unique, regex matches its `example`; costs have a non-proprietary source; note length
cap + "shall"-run denylist for proprietary sources; ids resolve; placeholders whitelisted; barrel
matches disk; reviewed packs have no pending safety ES; coverage report printed.

## 7. Source hierarchy
See `docs/trade-packs/RESEARCH_PROMPT.md` (order, URLs, per-group starting points).

## 8. Proposed T-66
**Trade Knowledge Packs are the single source of per-trade knowledge.** Every engine reads trade
knowledge through `lib/trades/packs`; hand recipes remain as fallback until superseded. Packs are
pure data; no runtime AI. Every fact carries provenance (source, confidence, date). Proprietary
standards are reference-only (section numbers + paraphrase). Safety text in Spanish requires human
translation (T-08). Adding a trade never adds tables, routes, or permit paths (T-59/T-64 hold).
