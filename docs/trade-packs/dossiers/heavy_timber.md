# Dossier — `heavy_timber` (Heavy Timber / Mass Timber)

> Wave: w07 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/heavy_timber.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `framing` · CSI `06 13`

## Scope (2–4 sentences)
Erects heavy timber and mass timber structure: glulam columns and beams, CLT/NLT/DLT floor, roof and wall
panels, and traditional timber frames (post-and-beam bents). Covers shop-drawing/erection-plan review,
delivery inspection and dry storage, bearing checks, crane setting and temporary bracing, steel and screw
connections, and construction-phase moisture protection until dry-in. Hands off: foundations/embeds
(concrete), connection steel fabrication (structural_steel / misc_metals), enclosure (SIPs, sheathing,
roofing), toppings (concrete), fire protection encapsulation (drywall/fireproofing).

## Existing coverage reconciled
- Hand recipe: none (falls to `building.ts` framing phase branch today) → pack = NEW-TRADE recipes
- Catalog codes already seeded: none for timber/glulam/CLT
- Blueprint template tasks hitting this trade: none → broad `title_re` (mass timber, CLT, glulam, GLT/NLT/DLT,
  heavy timber; timber frame / post-and-beam / bents)

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| heavy_timber-woodworks-moisture | WoodWorks — Mass Timber Moisture Management for Construction | 4 | association_public | MC ranges, storage, protection, MC before cover, trapped water |
| heavy_timber-woodworks-connections | WoodWorks Index of Mass Timber Connections | 4 | association_public | tolerances, shop vs field holes, screw types, jig, countersink, end-grain withdrawal |
| heavy_timber-woodworks-specs | WoodWorks Example Specifications for Mass Timber Panels | 4 | association_public | Part 3 execution topics (handling, storage, anchoring) |
| heavy_timber-woodworks-fire | WoodWorks — Fire Requirements for Mass Timber Elements | 4 | association_public | IBC section map (602.4, 2304.11, 703.2.2, 722) |
| heavy_timber-fpl-wood-handbook | USDA FPL Wood Handbook (FPL-GTR-282) | 1 | public_domain | moisture content / shrinkage basics |
| heavy_timber-apa-prg320 | ANSI/APA PRG 320 | 3 | proprietary_ref_only | CLT product standard name (ref) |
| heavy_timber-apa-glulam | APA — Glulam | 4 | association_public | ANSI A190.1 trademark check |
| ecfr-1926-cc / -h / -m / -l / -i / -j / -d | 29 CFR 1926 | 1 | public_domain | hazards |
| icc-pa | ICC public access (IBC/IRC) | 3 | proprietary_ref_only | code refs (section + paraphrase) |

IBC 2021 section titles cross-checked on UpCodes (2303.1.3, 2303.1.4, 2304.10, 2304.11, 1705.5.3, 602.4.x).
OSHA sections checked on law.cornell.edu (1926.1424, .1425, .1408, .251, .250, .55, .352, .501, .453, .300).

## Work steps (draft → pack recipes)
`mass_timber_erection` (title_re mass timber/CLT/glulam/GLT/NLT/DLT/heavy timber):
1. Review shop drawings, erection plan and lift plan
2. Receive, check and store the timber dry
3. Verify bearings, anchors and column bases
4. Rig and set columns, beams and panels
5. Install connections and structural screws — Gate: framing. IBC 2304.10, 1705.5.3, 602.4
6. Protect from weather and close in

`timber_frame_raising` (priority 10; timber frame / post-and-beam / bents):
1. Check the joinery, sill and anchors — IRC R301.1.3
2. Assemble bents on the deck
3. Raise and brace the bents
4. Set plates, purlins and roof members — Gate: framing. IBC 2304.11
5. Wrap, protect and close in

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| struck_by_load | suspended load / fall zone | 1926.1425 | 4 |
| rigging_failure | slings, shackles, lifting screws; custom lifters proof-tested | 1926.251(a) | 4 |
| swing_radius | crane superstructure pinch/crush | 1926.1424(a) | 4 |
| crane_power_line | power line contact | 1926.1408 | 4 |
| fall_edge | edges ≥6 ft | 1926.501(b)(1) | 4 |
| fall_opening | holes in floor panels | 1926.501(b)(4) | 4 |
| aerial_lift | lift basket | 1926.453(b)(2)(v) | 4 |
| stack_collapse | timber storage | 1926.250(a)(1) | 3 |
| tool_kickback | high-torque drivers | 1926.300(b) | 2 |
| hot_work_fire | welding near timber | 1926.352(a) | 3 |
| wood_dust | cutting/drilling dust | 1926.55(a) | 2 |

## QA checklist
15 items (3 safety): shop drawings, lift plan (safety), delivery/stamps, MC on delivery, dry storage,
bearing tolerance, moisture break at concrete, lifting hardware (safety), plumb + braced (safety),
connections per drawings, screws seated, special inspection, daily protection, MC before cover, no trapped water.

## Inspection / acceptance checkpoints
- framing: members/stamps (2303.1.3/.4), connections exposed (2304.10), special inspection reports
  (1705.5.3), Type IV sizes/protection (602.4), temporary bracing.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-HT-CLT-SF | 5-ply CLT panel set | SF | 2800 | 0.025 | 150 | 2 | platform estimate |
| B-HT-GLULAM-BF | Glulam beam/column set | BF | 750 | 0.02 | 60 | 2 | platform estimate |
| B-HT-CONN-EA | Steel connection w/ fasteners | EA | 35000 | 1.5 | 0 | 0 | platform estimate |
| B-HT-PROTECT-SF | Temporary moisture protection | SF | 120 | 0.006 | 0 | 10 | platform estimate |
| B-HT-TIMBERFRAME-SF | Timber frame shell per floor SF | SF | 4000 | 0.12 | 300 | 5 | platform estimate |

No public unit-price source found for mass timber; all `estimate`.

## Quantity rules
- None. No blueprint fact basis for timber members/panels yet (no `glulam`/`clt_panel` component token);
  `area_sf_sum` scoped to building type would price CLT on every commercial job.

## Blueprint callouts (components)
- None this wave (brief). Candidates for a later wave: `clt_panel` (`\bCLT\b|CROSS[- ]LAMINATED`),
  `glulam_beam` (`GLU[- ]?LAM|\bGLB\b`).

## Open questions → REVIEW_QUEUE
- All 5 assembly costs are platform estimates.
- 11 hazards + 3 safety QA items pending human ES translation.
- Propose components `clt_panel` / `glulam_beam` so quantity rules can seed B-HT-* lines.
- IBC construction-phase fire safety section for Type IV-A/B/C (Ch. 33) not cited — section number unverified.
