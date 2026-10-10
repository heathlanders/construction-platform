# Dossier — `site_utilities` (Site Utilities — Water / Sewer / Storm)

> Wave: w06 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/site_utilities.ts` · Status: draft
> Taxonomy: category `sitework` · permit_trade `plumbing` · phase `site_prep` · CSI `33 10`

## Scope (2–4 sentences)
Private building service lines between the public utilities and the building: water service from the
corporation stop / curb stop, sanitary building sewer (lateral) from the main connection, and storm leads
from roof drains to the storm sewer. Covers trenching, bedding, laying, testing, utility-supervised
connection, backfill, right-of-way restoration and as-builts. Public mains, hydrants and manholes are
heavy-civil / utility scope; interior DWV and distribution belong to `plumbing`; mass grading to `excavation`.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern; the plumbing family phase recipe applies otherwise.
- Catalog codes already seeded: `P-CLEANOUT` (interior access — not duplicated; property-line cleanout is new),
  `P-DWV-PIPE-LF` (interior DWV), `P-IRR-TAP-EA` (irrigation tap off potable). No site-utility codes existed.
- Blueprint template tasks: `Underground utilities (water, sewer, gas, electric)` (residential_mf),
  `Underground utilities (domestic water, fire, sewer, gas, p…)` (commercial), `Utility infrastructure (heavy
  power, water, sewer, gas, fi…)` (industrial) → all hit recipe `utility_services`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| plumbing-wi-sps382 | Wis. Admin. Code ch. SPS 382 (Register Aug 2026) | 1 | gov_open | code refs, QA (depth, separation, tracer, tests, cleanouts, storm) |
| site_utilities-madison-std-spec-part5 | City of Madison Std Specs 2026 Part V | 1 | gov_open | lateral grade 1/4–1/2 in./ft (503.3(c)), locating means in ROW (503.2(f)) |
| site_utilities-madison-std-spec-part7 | City of Madison Std Specs 2026 Part VII | 1 | gov_open | ≥6 ft cover on service laterals, bedding (703.11) |
| site_utilities-ufgs-33-11-00 | UFGS 33 11 00 Water Utility Distribution (Aug 2024) | 1 | public_domain | tracer wire + continuity test, hydrostatic test, disinfection |
| site_utilities-ufgs-33-30-00 | UFGS 33 30 00 Sanitary Sewerage (May 2018) | 1 | public_domain | pipe handling, bedding/backfill, testing concepts |
| site_utilities-mutcd | FHWA MUTCD | 1 | public_domain | work-zone traffic control (via 1926.201(a)) |
| landscaping-diggers-hotline | Diggers Hotline (WI 811) | 1 | gov_open | locates |
| ecfr-1926-p / -aa / -g / -o / -d / -h | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| icc-pa | IPC (ICC public access) | 3 | proprietary_ref_only | 305.4.1, 306.2, 306.3, 312.5, 312.6, 603.2, 704.1 |
| platform-baseline | Platform estimate | — | platform_estimate | all assembly costs |

## Work steps (draft → pack recipes)
Recipes: `utility_services` (combined, template titles), `water_service` (p10), `sanitary_lateral` (p10), `storm_leads` (p20).
1. **Permit, locates and utility coordination** — 811, tap/connection permit, pothole crossings. QA: locates_verified, permit_tap_scheduled.
2. **Dig the trench and protect it** — protective system ≥5 ft, ladder ≥4 ft, spoil 2 ft back. IPC 306.2. QA: protective_system.
3. **Lay the sanitary lateral, cleanouts and tracer wire** — IPC 704.1; SPS 382.30(5)(b), (11)(h), 382.35(3)(b). Gate: underground.
4. **Connect to the public sewer and test** — SPS 382.30(11)(f), 382.21(2)(b); IPC 312.6. Gate: underground.
5. **Lay the water service and curb stop** — IPC 603.2; SPS 382.40(8)(a), (8)(b), (4)(b). Gate: water_supply.
6. **Pressure-test, flush and disinfect** — SPS 382.21(2)(e), 382.40(8)(i); IPC 312.5. Gate: water_supply.
7. **Lay storm leads** — SPS 382.36(4)(b), 382.36(7)(d). Gate: underground.
8. **Backfill, restore and record the as-built** — SPS 382.30(11)(e); IPC 306.3. Gate: final.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| cave_in | Trench cave-in (+ competent-person daily inspection control) | 1926.652(a)(1) | 4 |
| trench_egress | No way out | 1926.651(c)(2) | 3 |
| spoil_edge | Spoil/pipe rolling in | 1926.651(j)(2) | 3 |
| utility_strike | Buried line strike | 1926.651(b)(1) | 4 |
| water_accumulation | Water in trench | 1926.651(h)(1) | 3 |
| sewer_atmosphere | Sewer gas / low O2 next to live sewer | 1926.651(g)(1)(i) | 4 |
| confined_space | Manhole / wet well entry | 1926.1203(a) | 4 |
| traffic_row | Public traffic in ROW (MUTCD flaggers) | 1926.201(a) | 4 |
| falling_loads | Loads / truck spill | 1926.651(e) | 3 |
| equipment_struck | Backing equipment | 1926.602(a)(9)(ii) | 3 |
| biological | Sewage contact | 1926.51(f)(1) | 2 |
| pipe_handling | Pinch/crush lowering pipe | 1926.251(a)(1) | 2 |

## QA checklist
15 items — locates (safety), protective system (safety), permits/tap, frost depth (SPS 382.40(8)(a) + Madison 6 ft),
water/sewer separation (5 ft / 12 in. above / 18 in. below / 6 in. from storm), bedding & initial backfill
(≤1 in. stone, 6 in. lifts), tracer wire + continuity, sewer slope & cleanouts (≤100 ft), sewer leak test
(10 ft head or 3 psi air 15 min), water pressure test (≥ working pressure, potable), flush/disinfect, curb stop
accessible, storm not to sanitary, ROW compaction & patch, as-built recorded.

## Inspection / acceptance checkpoints
- underground: permits + approved main connection; bedding; slope + cleanouts; leak test; tracer; storm separation.
- water_supply: frost depth + separation; curb stop; pressure test; flush/disinfect.
- final: backfill/ROW patch; curb box & cleanout covers to grade; as-built delivered.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| P-SU-WSVC-1IN-LF | 1 in. water service ~6 ft deep | LF | 1400 | 0.25 | 600 | 5 | platform-baseline, estimate |
| P-SU-SEWER-6IN-LF | 6 in. PVC sanitary lateral | LF | 1100 | 0.25 | 600 | 5 | platform-baseline, estimate |
| P-SU-CURBSTOP-EA | Curb stop + box | EA | 32000 | 2 | 0 | 0 | platform-baseline, estimate |
| P-SU-CO-PL-EA | Property-line two-way cleanout | EA | 25000 | 2.5 | 0 | 0 | platform-baseline, estimate |
| P-SU-TAP-ALLOW-EA | Municipal tap/connection fee allowance | EA | 200000 | 2 | 0 | 0 | platform-baseline, estimate (placeholder) |
| P-SU-ROW-RESTORE-SF | Street trench restoration patch | SF | 900 | 0.06 | 400 | 5 | platform-baseline, estimate |

WisDOT / municipal bid tabs: WisDOT has no public average-unit-price item for building service laterals;
Wisconsin municipal bid tabs found (Wausau) were bot-blocked (403) → no `derived` costs this wave.

## Quantity rules
- `P-SU-WSVC-1IN-LF` = const × 60 (residential_sf) — allowance, replace with plan length.
- `P-SU-SEWER-6IN-LF` = const × 60 (residential_sf).
- `P-SU-CURBSTOP-EA` = const (residential_sf) — delete if the utility stubbed it.
- `P-SU-CO-PL-EA` = const (residential_sf).
Only evaluated when `site_utilities` is on the project schedule (seedFromPacks).

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- Storm leader per-LF assembly dropped to respect the 6-assembly cap — add in a follow-up if wanted.
- IPC section numbers (305.4.1, 306.2/306.3, 312.5/312.6, 603.2) could not be opened on codes.iccsafe.org (403); confirmed against secondary sources only.
- Tap fee allowance is a pure placeholder.
