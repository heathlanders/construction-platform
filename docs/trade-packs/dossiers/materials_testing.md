# Dossier — `materials_testing` (Materials Testing)

> Wave: w21 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/materials_testing.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `inspections` · CSI `01 45`

## Scope (2–4 sentences)
An independent testing agency (owner- or GC-hired) samples and tests materials as they go in: fresh
concrete (slump, air, temperature, cylinders), soil/base density by nuclear gauge against a lab Proctor,
asphalt density and cores, and lab breaks. Its product is signed reports and timely notice of failing
results. It does NOT do structural special inspection sign-off (`special_inspection`), soils design or
borings (`geotech`), or the corrective work itself (`concrete`, `excavation`, `asphalt_paving`).

## Existing coverage reconciled
- Hand recipe: none (`nopermit.ts` generic fallback renders one step) → pack adds knowledge only (services wave: no recipes).
- **Field record already exists:** concrete test results (cylinder compressive breaks at 7/28 days, slump,
  air, temperature, auto pass/fail) live in `concrete_test_records` (child of `concrete_pours`,
  migration 0016, `routes/v1/concrete-test-records.ts`, web concrete page + mobile `ConcreteTestsScreen`,
  offline). The pack's QA items describe what a complete report must contain; `breaks_reported` points
  results into that table. No new storage.
- Catalog codes already seeded: none (services → no assemblies).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| materials_testing-wisdot-cmm-815 | WisDOT CMM 815 Density Testing (Apr 2026) | 1 | gov_open | gauge certification, block calibration, seating ≤1/16 in., Proctor ≥5 pts, HMA cores, daily reference record, low-result handling |
| materials_testing-wisdot-cmm-870 | WisDOT CMM 870 Concrete Testing & Acceptance | 1 | gov_open | HTCP-certified testers, qualified lab, point-of-placement sampling, cylinder marking/data card, frequency tied to std spec Table 710-5 |
| materials_testing-ecfr-23-637 | 23 CFR 637 (637.209 lab/personnel qualification) | 1 | public_domain | AASHTO-accredited labs on federal-aid acceptance/IA/dispute testing |
| materials_testing-ecfr-10-30 | 10 CFR 30.3 | 1 | public_domain | gauge licensing (prose only) |
| materials_testing-astm-c31 / c39 / c143 / c231 / c1064 / d6938 / d1557 | ASTM test methods | 3 | proprietary_ref_only | designation only |
| materials_testing-aashto-r18-aap | AASHTO re:source AAP (R 18) | 3 | proprietary_ref_only | lab accreditation reference |
| materials_testing-aci-field-tech | ACI Concrete Field Testing Technician Grade I | 4 | association_public | technician certification |
| ecfr-1926-c / d / g / o / p / z | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps
None — services wave. The generic no-permit fallback step renders for a "Materials Testing" task.

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| trench_density_test | cave-in testing pipe backfill | protective system ≥5 ft, competent-person inspection, ladder ≤25 ft | 1926.652(a)(1) | 4 |
| compaction_struck_by | rollers/compactors on active lift | eye contact, reverse alarm/spotter, hi-vis | 1926.602(a)(9)(ii) | 3 |
| work_zone_traffic | public traffic on open roads/lots | stay inside traffic control, flagger | 1926.201(a) | 4 |
| wet_concrete_burns | alkali burns sampling/casting | gloves, glasses, rinse | 1926.28(a) | 2 |
| nuclear_gauge_radiation | exposure / lost gauge | licensed badged operators, rod locked, secure transport, RSO | 1926.53(a) | 3 |
| coring_silica_dust | dry coring | wet coring, HEPA, exposure plan | 1926.1153(c) | 2 |
| hot_mat_burns | fresh HMA | boots, no kneeling, wait for temp | 1926.28(a) | 2 |

NRC licensing: 1926.53(a) sends radioactive-source use to NRC 10 CFR 20; possession requires an NRC or
Agreement-State license (10 CFR 30.3) — kept in prose, not as an `osha_ref`.

## QA checklist (deliverables)
- [ ] technician certified (ACI Grade I / state HTCP) — ACI, CMM 870.4.1
- [ ] lab accredited for the tests reported (AASHTO R18/AAP) — 23 CFR 637.209
- [ ] slump/air/temp at point of placement, logged to ticket, spec frequency — CMM 870.4.3.1
- [ ] cylinders cast/cured/marked/picked up in window (C31) — CMM 870.4.5
- [ ] break report contents (C39) → concrete_test_records
- [ ] density tied to the correct Proctor (D1557/D698), ≥5-point Proctor — CMM 815.12.2
- [ ] nuclear density report contents + daily standard count — CMM 815.14
- [ ] HMA cores full depth, random, holes filled — CMM 815.13
- [ ] chain of custody / data card with specimens — CMM 870.4.5
- [ ] nonconforming results reported same day, informational retests not averaged — CMM 815.15

## Inspection / acceptance checkpoints
- concrete_field_test_set, soil_density_test, hma_core_density (descriptive keys — no permit family).

## Cost basis
None (services).

## Quantity rules / Blueprint callouts
None.

## Open questions → REVIEW_QUEUE
- es_safety: 7 hazards pending human translation.
- source_doubt: NRC portable-gauge guidance (NUREG-1556 Vol. 1) returns 403 to scripts — not cited; licensing rests on 10 CFR 30.3 + 1926.53.
- source_doubt: WisDOT testing frequencies live in std spec Table 710-5 (referenced from CMM 870) — not transcribed; QA says "at the frequency the spec sets".
- scope: consider linking a future testing-agency report upload to `concrete_test_records` / soil density records (no density table exists today).
