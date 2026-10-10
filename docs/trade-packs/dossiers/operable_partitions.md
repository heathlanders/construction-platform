# Dossier — `operable_partitions` (Operable / Folding Partitions)

> Wave: w16 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/operable_partitions.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `finishes_interior` · CSI `10 22 39`

## Scope (2–4 sentences)
Installs paired-panel acoustic operable walls (ballrooms, conference rooms, classrooms), glass movable walls and
accordion folding doors: plenum sound barrier, overhead track, panels, seals, motorized operator controls, pass
doors, acceptance testing and owner training. Does NOT include the structural support steel/header (misc metals /
framing — UFGS 10 22 39 specifies it separately), electrical power to motorized operators (electrician), or ceilings.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, two recipes.
- Catalog codes already seeded: none with `B-OP-`.
- Blueprint template tasks hitting this trade: none. `title_re` covers operable wall/partition, folding (panel)
  partition, movable wall/partition, glass movable/operable wall; second recipe: accordion door/partition, folding door.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| operable_partitions-ufgs-10-22-39 | UFGS 10 22 39 Folding Panel Partitions (Aug 2020) | 1 | public_domain | steps, QA, acceptance tests |
| operable_partitions-hufcor-docs / -modernfold / -skyfold | Manufacturer documents | 5 | manufacturer_public | panel handling, stack, training |
| operable_partitions-astm-e90 / -e413 / -e336 | Sound transmission lab test, STC rating, field NIC | 3 | proprietary_ref_only | named only |
| icc-pa | IBC 1604.3, 1010.1, 803.1 | 3 | proprietary_ref_only | code refs |
| plumbing-ada-2010 | 2010 ADA Standards §404 | 1 | public_domain | pass-door accessibility |
| ecfr-1926-c/e/h/k/l/m/x/z | 29 CFR 1926 | 1 | gov_open | hazards |

## Work steps (draft → pack recipes)
`operable_wall`: 1 verify support steel/header (gate framing, IBC 1604.3) → 2 plenum sound barrier to deck →
3 hang/level/key track → 4 hang panels, set seals → 5 motorized operator controls (lockout) → 6 operate ≥3×
witnessed, emergency release, light-leak test, pass door egress, owner training (gate final, IBC 1010.1, 803.1, ADA 404).
`accordion_door`: check opening/header/blocking → mount track + hang → adjust/test/egress (gate final, IBC 1010.1).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| scissor_lift | fall from lift/scaffold | 1926.451(g)(1) | 4 |
| aerial_lift | thrown from boom basket | 1926.453(b)(2)(v) | 4 |
| ladder | stepladder top step | 1926.1053(b)(13) | 3 |
| falling_object | dropped tools/track | 1926.501(c) | 3 |
| panel_tip | stored panel tipping | 1926.250(a)(1) | 4 |
| heavy_lift / pinch_point | handling, folding panels | 1926.20(b) | 3 |
| lockout | operator restarts | 1926.417(b) | 3 |
| cord_shock | cords | 1926.404(b)(1) | 3 |
| silica_drill | deck anchors | 1926.1153 | 2 |
| eye_flying / glass_cut | overhead drilling, glass panels | 1926.102(a)(1) / 1926.95(a) | 2–3 |
OSHA paragraphs verified on law.cornell.edu 2026-10-08 (250(a)(1), 501(c), 417(b), 1053(b)(13), 451(g)(1), 453(b)(2)(v)).

## QA checklist
14 items — support verified, track anchorage/level, plenum barrier sealed, seals engaged, stack fits, motor safety
devices, emergency release, 3× operation test, light-leak test, pass door egress, optional field NIC, owner training.

## Inspection / acceptance checkpoints
- framing: support steel/header and track blocking in place before track is hung.
- final: pass/folding door egress, finish flame-spread class, accessible pass door, motorized safety devices.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-OP-ACOUSTIC-SF | paired-panel acoustic wall | SF | 7500 | 0.2 | 150 | 0 | platform estimate |
| B-OP-ACCORDION-SF | accordion door | SF | 2500 | 0.08 | 0 | 0 | platform estimate |
| B-OP-PLENUM-BARRIER-LF | plenum sound barrier ≈4 ft | LF | 3500 | 0.6 | 300 | 10 | platform estimate |
| B-OP-SUPPORT-STEEL-LF | support steel allowance | LF | 9000 | 0.75 | 800 | 5 | platform estimate |
| B-OP-PASS-DOOR-EA | pass door panel | EA | 250000 | 3 | 0 | 0 | platform estimate |

## Quantity rules
None — blueprint facts carry no reliable operable-wall basis (no component token; adding one is out of scope this wave).

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- ASTM E557 (installation practice) cited only through UFGS; store URL not verifiable.
- UFGS 10 22 26 (operable panel partitions) page title not resolvable — not used.
- All B-OP costs are estimates.
- Possible future component token `operable_partition` for blueprint detection.
