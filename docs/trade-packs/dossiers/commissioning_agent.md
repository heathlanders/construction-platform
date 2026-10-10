# Dossier — `commissioning_agent` (Commissioning Agent)

> Wave: w21 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/commissioning_agent.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `commissioning` · CSI `01 91`

## Scope (2–4 sentences)
Independent Cx authority (usually owner-hired) who verifies that HVAC, controls, plumbing, electrical
and life-safety systems are installed, started, tested and documented against the Owner's Project
Requirements. Writes/maintains the Cx plan, samples pre-functional checklists, directs functional
performance tests (contractors operate the equipment), runs the issues log, and closes out with
training records, the systems manual, the Cx report and seasonal/warranty review. Does NOT balance
(test_balance), program or point-check controls (controls_bms), or start up equipment (installing trades).

## Existing coverage reconciled
- Hand recipe: none (no-permit service). Pack = new-trade pattern, 1 recipe, no gates, no code_refs.
- `test_balance` (w14) owns TAB; its report is a Cx INPUT (step 3 spot-checks it).
- `controls_bms` (w14) owns programming, point-to-point checkout and trend review; Cx witnesses/samples.
  Pack steps are written from the Cx agent's verification role so they don't repeat those steps.
- Catalog codes: none (services — no assemblies).
- Template tasks: commercial "Building systems commissioning & owner training"; industrial "Facility
  systems commissioning & operator training". Both matched by `title_re` (`commission|\bCx\b|…`).
  residential-mf "HVAC & life-safety systems commissioning" is `trade_type: general` — not this pack.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| commissioning_agent-ufgs-01-91-00 | UFGS 01 91 00 — Commissioning | 1 | public_domain | deliverables, steps, QA (landing page only — body/PDF not script-readable; `derived`) |
| commissioning_agent-wbdg-cx | WBDG Building Commissioning | 4 | association_public | process + deliverables |
| commissioning_agent-gsa-cx-guide | GSA Building Commissioning Guide | 1 | gov_open | roles, issues log, systems manual |
| commissioning_agent-ashrae-g0-s202 | ASHRAE Guideline 0 / Std 202 | 3 | proprietary_ref_only | vocabulary only |
| ecfr-1926-c/e/k/m/x | 29 CFR 1926 | 1 | public_domain | hazards |

IECC C408 (commissioning) is mentioned only as a reference in the turnover checklist text — no code_ref
(permit null; IECC not allowed as family code here).

## Work steps (→ recipe `cx_building_systems`)
1. Confirm the Cx plan, OPR and test scope
2. Verify pre-functional checklists and start-up
3. Confirm prerequisites: TAB report and controls checkout
4. Direct the functional performance tests
5. Track and close the issues log
6. Train operators, deliver the systems manual and Cx report
7. Run seasonal tests and the warranty-period review

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| energized_equipment | Shock/arc flash near open panels | 1926.416(a)(1) | 4 |
| rotating_equipment | Unexpected start during test/inspection | 1926.417(b) | 4 |
| roof_edge | Roof edge / skylight fall at RTUs | 1926.501(b)(1) | 4 |
| ladder_access | Ladder fall above ceilings | 1926.1053(b)(1) | 3 |
| hot_surfaces | Burns from hot piping/boilers | 1926.21(b)(2) | 3 |
| noise | Mechanical room / generator noise | 1926.101(a) | 2 |

## QA checklist (deliverables)
OPR/BoD on file · Cx plan current · pre-functional checklists signed · TAB + controls checkout sampled ·
FPT results recorded · life-safety interlocks witnessed (safety) · issues log closed · training records ·
systems manual · Cx report · seasonal tests + warranty review.

## Inspection / acceptance checkpoints
- `cx_functional_test_readiness`: checklists signed, TAB accepted, script approved.
- `cx_turnover_acceptance`: issues closed/accepted, training + manual + report, energy-code Cx docs (IECC C408 ref).

## Cost basis
None — service trade, no assemblies.

## Open questions → REVIEW_QUEUE
- UFGS 01 91 00 content could not be machine-read (WBDG serves a shell to scripts); deliverable list
  paraphrased from known section structure — human to confirm against the PDF.
- "~10-month" warranty review is common practice, not quoted from a source.
