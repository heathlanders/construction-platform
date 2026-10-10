# Trade Pack Research Procedure

Follow this for **every** trade in a wave. Output = `docs/trade-packs/dossiers/<key>.md` (from
`_DOSSIER_TEMPLATE.md`) then `api/src/lib/trades/packs/<key>.ts`. Budget ~45–90 min per trade.

## 0. Before researching
1. `tradeDef(key)` — note label, category, `permit_trade`, `default_phase`, CSI.
2. Read the wave file's "existing coverage" notes for this trade:
   - hand recipe already in `lib/task-buildout/{building,nopermit,electrical,plumbing,mechanical}.ts`?
     → the pack must **match or exceed** it; set `supersedes_hand: true` only if strictly better and
     update snapshots.
   - existing catalog codes (`grep -rn "'<PREFIX>-" prisma/migrations/*/migration.sql`) → never
     duplicate a code; reference it in `quantity_rules` instead.
   - blueprint templates using this trade (`grep -rn "trade_type: '<key>'" api/src/lib/blueprint-templates`)
     → recipe `Match.title_re` must hit those task titles.
3. If `permit_trade` is non-null, open the family's inspection sequence
   (`api/src/lib/{electrical,plumbing,mechanical,building}-codes/inspection-sequences.ts`) — gating
   inspection types MUST come from that list.

## 1. Source order (stop descending once a section is well-sourced)

### Tier 1 — public domain / government (usable as data, numbers OK)
| Need | Source | Where |
|---|---|---|
| Hazards + OSHA refs (every on-site trade) | 29 CFR 1926 by subpart (C general, D health, E PPE, K electrical, L scaffolds, M fall, N cranes, O equipment, P excavation, Q concrete/masonry, R steel, T demolition, V power line, X ladders, Z toxic) | ecfr.gov → Title 29 Part 1926; OSHA eTools; NIOSH |
| Execution steps + QA (almost every trade) | **UFGS — Unified Facilities Guide Specifications**, section matching the trade's CSI ("Part 3 — Execution", "Quality Control") | wbdg.org/dod/ufgs |
| Envelope / HVAC / insulation install QA | DOE Building America Solution Center; ENERGY STAR Residential checklists | basc.pnnl.gov; energystar.gov |
| Manufactured homes | 24 CFR Part 3285 (Model Installation Standards) | ecfr.gov |
| Pipelines | 49 CFR 192 (gas) / 195 (liquids) | ecfr.gov; phmsa.dot.gov |
| Power line | 29 CFR 1926 Subpart V | ecfr.gov |
| Ground improvement, drilled shafts, MSE, tunneling, marine, dredging | FHWA geotechnical circulars / NHI manuals; USACE Engineer Manuals (EM 1110-series) | fhwa.dot.gov/engineering/geotech; publications.usace.army.mil |
| Highway, bridge, guardrail, signals, striping, paving | State DOT standard specifications — **WisDOT first** (Standard Specifications for Highway and Structure Construction), then TxDOT / Caltrans; FHWA MUTCD (traffic control, marking) | DOT sites; mutcd.fhwa.dot.gov |
| Lead / asbestos / radon / remediation | EPA 40 CFR 745 (RRP), 40 CFR 61 Subpart M (NESHAP), EPA radon guidance; EPA brownfields | ecfr.gov; epa.gov |
| Safe rooms / storm shelters | FEMA P-320, P-361 | fema.gov |
| Accessibility checks | 2010 ADA Standards | ada.gov |
| Playgrounds | CPSC Public Playground Safety Handbook | cpsc.gov |
| Pools / drains | Virginia Graeme Baker Act (CPSC) | cpsc.gov |

### Tier 2 — cost data (public)
| Need | Source |
|---|---|
| Labor wage by trade/state | BLS OEWS (bls.gov/oes) by SOC — 47-2031 carpenters, 47-2111 electricians, 47-2152 plumbers, 47-2181 roofers, 47-2061 laborers, 47-2073 operators, 49-9021 HVAC… |
| Burdened / prevailing rates | SAM.gov Davis-Bacon wage determinations (pick a WI county, building + heavy + residential schedules) |
| Site + heavy civil unit prices | State DOT average unit bid prices / bid tabulations (WisDOT first) |
| Escalation | BLS PPI construction inputs |
| Materials | Manufacturer / distributor published price sheets (record date); big-box list prices as a dated spot sample only |
| Labor hours/unit | `derived` from DOT bid tabs or crew data when possible; otherwise `estimate` with a clear `note`. **Never** copy RSMeans / NECA / MCAA numbers. |

Price convention: **national baseline, cents, FLOOR**, material per unit excludes waste (waste is
`waste_pct`). Record `last_verified` = research date.

### Tier 3 — model codes (reference-only, free read access)
ICC public access (codes.iccsafe.org): IRC, IBC, IPC, IMC, IFGC, IFC, IECC, ISPSC, IEBC.
NFPA free access: 70 (NEC), 13/13R/13D, 72, 96, 101, 780, 17A, 2001, 10, 855 (ESS), 241.
IAPMO UPC/UMC. **Store section number + ≤10-word title + our own paraphrase. No tables, no numbers,
no "shall" sentences.**

### Tier 4 — trade associations (free technical docs; paraphrase + cite)
AWC DCA 6 (decks) · NCMA TEK + ICPI (pavers, SRW) · BIA Technical Notes (brick) · NRMCA CIP series ·
ACI free docs · PCA · NRCA · SPRI · EIMA · NWFA · TCNA-referenced practice · CRI · SMACNA · ACCA (Manual
J/S/D concepts) · NECA NEIS · PHCC · DASMA TDS · FGIA/AAMA · WDMA · MBMA · NFBA (post-frame) · SFIA ·
AWI · GANA · NASTT (trenchless) · NUCA · PHTA (pools) · HPBA/CSIA (chimney) · AISC (free specs) · SJI ·
PTI · ASCC · NAAMM · CISCA · NAIMA · SPFA · AWCI · SSPC (coatings) · ANSI/SAIA (scaffold) · TCIA/ANSI
Z133 (tree) · NADRA. IICRC (restoration) and AARST (radon) = **ref-only**.

### Tier 5 — manufacturer installation instructions
Simpson Strong-Tie, Trex/Azek/TimberTech, GAF/Owens Corning/CertainTeed, James Hardie/LP, Schluter,
Mapei/Laticrete, Carrier/Trane/Mitsubishi, Rheem, Kohler, LiftMaster, Tesla/Enphase, etc. Paraphrase,
cite, `license: manufacturer_public`.

## 2. What to extract (targets)
| Section | Target | Notes |
|---|---|---|
| identity.summary (+ES), glossary 5–12 terms (+ES) | required | plain words a laborer uses |
| recipes | 1–3 recipes, 3–6 steps each — each recipe needs `example_title` (a real task title its `title_re` matches; guard) | ordered field steps; title_re hitting template task titles; facts-parameterized where blueprint facts exist |
| code_refs | per gating inspection | permit trades only; section + paraphrase |
| hazards | 6–12 | each with `osha_ref` (1926.xxx), controls, PPE, severity 1–4 |
| qa_checklist | 8–15 | verifiable, measurable ("joist hangers fully nailed per mfr schedule") |
| inspection_checklists | per inspection (permit) or DOT/owner checkpoint (heavy civil) | |
| assemblies | 3–10 (0 for services) | unit-rate building blocks; code prefix by bucket |
| quantity_rules | 2–6 | only bases the facts actually provide. Quantities evaluate ONLY `when.facts_any` + `when.building_types`. A `const` basis must be scoped by one of them (guard). Never duplicate an existing hand-seeded line (e.g. B-INSUL-SF). |
| equipment | as needed | `type` must be in `lib/task-buildout/equipment-vocab.ts`; propose new vocab in REVIEW_QUEUE, don't invent |
| components | 0–3 | only drawing callouts that reliably appear on plans; include an `example` string |
| dependency_hints | 0–3 | e.g. decks after framing inspection, before final |

Service trades: identity, glossary, deliverables-as-QA, on-site hazards only, no assemblies.
Umbrella trades: identity + glossary; recipes delegate to children (`Match` none) — keep thin.

## 3. Writing rules
- Our words. Short imperative steps a foreman can read on a phone.
- A code ref from a code OTHER than the trade family's (IECC, NFPA 70E, a state code like `WI NR 812` / `WI SPS 383`) sets `code_type` on that ref, or it renders under the family code.
- Every number has `prov`. Confidence: `verified` (directly from a Tier 1–2 source), `derived`
  (computed from public data — say how in `note`), `estimate` (expert baseline — must say so).
- Safety text EN only; ES fields `{ status: 'pending_human_translation' }` (use `PENDING_ES`). Non-safety
  ES written now: summary/glossary/assembly names as strings, non-safety QA as `{ status: 'translated', text }`.
  Mark safety QA items `safety: true`. Never label your own translation `human_translated`.
- No brand endorsement in steps ("per manufacturer instructions", not "use Trex").
- Never invent URLs or section numbers — if unsure, omit and log to REVIEW_QUEUE.

## 4. Finish each trade
1. `npm run pack:check <key>` green.
2. `npm run pack:smoke <key>` output sane (steps render, no `—` placeholders, estimate lines priced).
3. Append to `docs/trade-packs/REVIEW_QUEUE.md`: pending ES safety count, `estimate`-only costs,
   doubts, proposed vocab/inspection additions.
4. Set `status: 'draft'` (only a human sets `reviewed`).
