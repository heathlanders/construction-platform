# Dossier — `final_clean` (Final / Construction Cleaning)

> Wave: w18 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/final_clean.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `punch` · CSI `01 74`

## Scope (2–4 sentences)
Construction cleaning crews: rough/progress clean after drywall, final top-down clean, touch-up clean after
punch repairs, glass cleaning, pressure washing at turnover and the HVAC filter change. Does NOT include
dumpster hauling/debris disposal (`hauling`), floor refinishing (flooring trades), or janitorial service
after occupancy (out of taxonomy scope). No permit path → no gates, no code refs; owner hold points live in
`inspection_checklists` (`rough_clean_release`, `owner_walkthrough`, `turnover`).

## Existing coverage reconciled
- Hand recipe: `lib/task-buildout/nopermit.ts` case `final_clean` (one "Final clean" step) → pack **complements** (`recipes: []`).
- Catalog codes already seeded: `G-CLEAN-SF` (final construction clean, 0037) — seeded on every project by
  `quantities.ts` `seedGeneral` from room area. Not redeclared and not re-seeded by a pack rule.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| final_clean-ufgs-01-78-00 | UFGS 01 78 00 Closeout Submittals §3.8 Cleanup (Aug 2026) | 1 | public_domain | QA, turnover checklist (labels, glass, fixtures, filters, roofs/drains, site, clean-up list) |
| final_clean-gana-01-0300 | GANA GIB 01-0300 Proper Procedures for Cleaning Architectural Glass | 4 | association_public | glass QA (identify coatings, top-down, test area in sun, blade-scraping limits, dry gaskets) |
| final_clean-osha-silica-construction | OSHA Silica — Construction page | 1 | gov_open | silica housekeeping hazard |
| ecfr-1926-c / d / e / h / i / k / l / m / x / z | 29 CFR 1926 subparts | 1 | public_domain | hazards (1926.25, .59, .102, .252, .302(b)(4), .404, .453, .501, .1053, .1153(f)) |
| (ref only, via UFGS) | ASTM E1971, Green Seal GS-37, ISSA/GBAC | 3 | proprietary | not stored |

Verified text: 1926.1153 housekeeping is paragraph **(f)** (not (h)); 1926.302(b)(4) compressed air < 30 psi;
1926.252(a) chute >20 ft, (e) oily rags in covered fire-resistant containers; 1926.453(b)(2)(v) lanyard to boom/basket.

## Work steps (draft → pack recipes)
None — hand recipe "Final clean" stays. Equipment hints added on its step: scissor lift (commercial/industrial/MF),
boom lift (commercial/industrial), both optional.

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| silica_sweep | silica dust from dry sweeping/blowing | wet sweep / HEPA, no compressed air | 1926.1153(f) | 3 |
| chemicals | cleaning chemicals, mixing | SDS, labels, no mixing, ventilate | 1926.59 | 3 |
| eye_splash | splash/debris in eyes | eye protection, goggles for corrosives | 1926.102(a)(1) | 2 |
| ladder | ladder falls | 3 ft extension/secure, 3 points | 1926.1053(b)(1) | 3 |
| aerial_lift | fall from lift | stand on floor, tie off to boom | 1926.453(b)(2)(v) | 4 |
| open_edge | unguarded edges/openings | don't remove rails/covers, fall arrest | 1926.501(b)(1) | 4 |
| compressed_air | air blow-off | <30 psi, chip guard, PPE | 1926.302(b)(4) | 2 |
| debris_trips | debris in passageways | keep clear, containers | 1926.25(a) | 2 |
| oily_rags | fire from rags/solvents | covered fire-resistant cans | 1926.252(e) | 3 |
| debris_drop | debris dropped from floors | chute >20 ft, barricade | 1926.252(a) | 3 |
| shock | floor machines/washers | GFCI, cords dry | 1926.404(b)(1)(ii) | 3 |

## QA checklist
14 items (see pack): top-down sequence, glass type identified, glass test area in sun, blade-scraping limits,
streak-free glass + dry gaskets, labels/residue removed, fixtures sanitary, floors by maker method, HVAC filters,
roofs/drains, site swept + temp facilities out, low-hazard products + SDS (safety), no dry sweeping (safety),
signed clean-up list.

## Inspection / acceptance checkpoints
- rough_clean_release: debris out, HEPA/wet methods, protection kept.
- owner_walkthrough: glass, labels/residue, fixtures/cabinets, floors, fixtures/diffusers.
- turnover: filters replaced + dated, touch-up clean, site/drains, signed clean-up list.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-CLN-ROUGH-SF | Rough clean after drywall | SF | 1 | 0.0025 | 0 | 0 | platform-baseline estimate |
| G-CLN-WINDOW-EA | Residential window glass clean, both sides | EA | 30 | 0.3 | 0 | 0 | platform-baseline estimate |
| G-CLN-GLAZE-SF | Storefront/curtain wall glass, both faces | SF | 2 | 0.012 | 0 | 0 | platform-baseline estimate |
| G-CLN-PWASH-SF | Pressure wash flatwork/entries | SF | 1 | 0.004 | 3 | 0 | platform-baseline estimate |
| G-CLN-FILTER-EA | HVAC filter replacement at turnover | EA | 1800 | 0.25 | 0 | 0 | platform-baseline estimate |

## Quantity rules
- `G-CLN-WINDOW-EA` = windows (residential_sf/mf).
- `G-CLN-GLAZE-SF` = windows × 30 SF (commercial/industrial).
- `G-CLN-ROUGH-SF` = room area sum (commercial/industrial/residential_mf).
- `G-CLN-FILTER-EA` = count of `fau` fixtures.
- `G-CLN-PWASH-SF`: no rule — no reliable flatwork-area fact; priced manually.
- `G-CLEAN-SF`: already seeded by `seedGeneral` — no pack rule.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- vocab: `pressure_washer`, `hepa_vacuum`, `floor_scrubber` equipment types.
- source_doubt: GANA bulletin cited via a distributor mirror (original glasswebsite.com URL dead; glass.org page JS-rendered).
- cost_estimate: all 5 G-CLN-* assemblies.
- es_safety: 11 hazards + 2 safety QA + 1 checklist item pending human translation.
