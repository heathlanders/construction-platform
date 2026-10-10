# Trade pack agent brief — write ONE Trade Knowledge Pack

> Used by every wave: the wave runner spawns one sub-agent per trade with this brief + a short
> trade-specific note (family, hand recipe or not, assembly code prefix, focus, best sources).

Repo $HOME/construction-platform, the wave branch (feat/trade-packs-wNN) is already checked out.
Do NOT change branches, commit, push, run vitest/ci-local, docker, or prisma. Other agents edit sibling
pack files and other anchors in sources.ts in parallel.

## Read first
1. docs/trade-packs/RESEARCH_PROMPT.md — procedure, source tiers, writing rules. FOLLOW IT.
2. docs/Trade_Knowledge_Packs_v1_0.md §3–4 (schema + licensing).
3. api/src/lib/trades/packs/schema.ts, sources.ts, runtime.ts, guards.ts.
4. Patterns: api/src/lib/trades/packs/windows.ts (NEW-TRADE pattern: recipes with example_title,
   gates, code refs) and api/src/lib/trades/packs/framing.ts (COMPLEMENT pattern: recipes: []).
5. The family hand recipe for your trade: api/src/lib/task-buildout/{electrical,plumbing,mechanical}.ts,
   and api/src/lib/task-buildout/code-refs.ts (family code sections already shown on every task).
6. Your wave file docs/trade-packs/waves/wNN.md (your row + suggested sources).

## Rules
- Inspection gates / code_refs / inspection_checklists keys come ONLY from your family:
  electrical: temporary_power, rough_in, service, cover, final
  plumbing:   underground, rough_in, water_supply, gas_test, final
  mechanical: rough_in, duct_leakage, equipment_set, gas_refrigerant_test, final
  building:   footing, foundation, framing, sheathing, roof_dry_in, insulation, final
  null (no permit — services, heavy civil, many finish trades): NO gates, NO code_refs; DOT/owner hold
  points go in inspection_checklists under descriptive keys (e.g. dot_density_test).
- Code refs: section number + our paraphrase (<=120 chars, never "shall"), prov src ['icc-pa'] (ICC) or
  ['nfpa-fa'] (NFPA 70/54) — proprietary, reference only. A ref from a code other than the family code
  (IECC, NFPA 70E, ADA 2010, state codes) MUST set `code_type`. State codes: code_type is the code
  family WITHOUT the chapter and the section carries it — code_type 'WI SPS' + section '383.43'
  (renders "WI SPS 383.43"), code_type 'WI NR' + section '812.08'.
  Family code types: electrical -> NEC, plumbing -> IPC (or UPC), mechanical -> IMC, building -> IRC/IBC.
  BUILDING family: commercial jobs resolve the family code to IBC, so every IRC section (R301.2, N1102,
  appendix AH105 …) MUST set code_type 'IRC' (guard). Cite IBC sections with code_type 'IBC'.
- Hazards 8-12: osha_ref = a real 29 CFR 1926 section you verified (ecfr.gov or law.cornell.edu
  mirror); hazard_es/controls_es = PENDING_ES.
- QA 10-15: safety-critical items `safety: true` + item_es PENDING_ES; others
  item_es { status: 'translated', text: '<your Spanish>' }. Never label your own Spanish human_translated.
- Glossary 6-10 with term_es/def_es. summary_es must differ from summary.
- Assemblies 2-6 NEW only. Code prefix given in your prompt. Do NOT redeclare anything in
  the existing catalog (list it: `grep -ho "'[EPMBG]-[A-Z0-9-]*'" prisma/migrations/*/migration.sql | sort -u`) — reference existing codes from quantity_rules instead.
  Costs = national baseline cents; no public source -> src ['platform-baseline'], confidence
  'estimate', short note. Never RSMeans/NECA/MCAA/ICC numbers.
- quantity_rules: only bases blueprint facts provide (rooms, windows, doors, panels, area_sf_sum,
  {fixture: <token>}, {component: <token>}, const). Quantities evaluate ONLY when.facts_any (components,
  true flags AND fixture types) and
  when.building_types; a 'const' basis MUST be scoped by one of them. Never duplicate an existing
  hand-seeded line (see api/src/lib/estimating/quantities.ts seedElectrical/seedPlumbing/seedMechanical).
  Fixture tokens available: see FIXTURE_TOKENS in api/src/lib/blueprint-pdf/parse-sheets.ts.
- Equipment types only from api/src/lib/task-buildout/equipment-vocab.ts (pack equipment is ADDED to
  family recommendations). `when.title_re` sees task + step titles together, so a task-title match puts the
  equipment on EVERY step — use `step_re` (step title only) to scope it to one step. NO blueprint components this wave.
- Recipes (new-trade pattern only): each needs `example_title` that its `title_re` matches.
- Sources: verify every URL you cite (curl -sL -o /dev/null -w '%{http_code}' -A 'Mozilla/5.0' URL;
  gov 403 = OK). Add NEW sources in api/src/lib/trades/packs/sources.ts directly below the line
  `// ── wave02:<your key> (add this trade's new sources directly below this line) ──` using the Edit
  tool; if the edit fails because the file changed, re-Read and retry. Prefix new source ids with your
  key (e.g. 'septic-wi-sps383'). Reuse existing ids where they fit — every 29 CFR 1926 subpart has a
  shared id 'ecfr-1926-<subpart>' (add a missing subpart to the shared OSHA block, never a
  trade-prefixed copy). Never invent URLs or sections.

## Write
- api/src/lib/trades/packs/<key>.ts — replace the stub; status 'draft', pack_version '1.0.0'.
- docs/trade-packs/dossiers/<key>.md — from docs/trade-packs/_DOSSIER_TEMPLATE.md.

## Verify (from api/)
- `npm run -s pack:check -- <key>` -> ✓ (ignore cross-pack lines not about your key)
- `npm run -s pack:smoke -- <key>` -> steps render, no '—' placeholders, code refs show the right code type
- `npx tsc --noEmit -p . 2>&1 | grep <key>` -> empty

## Final report (short)
Counts; recipe ids + step titles (if any); new assembly codes with cost/confidence; new source ids;
REVIEW_QUEUE lines exactly as `| <date> | <wave> | <key> | <type> | <item> |` with type in
es_safety, cost_estimate, source_doubt, vocab, scope. Do NOT edit REVIEW_QUEUE.md.
