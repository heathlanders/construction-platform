# Dossier — `truss_setting` (Truss Supply & Setting)

> Wave: w07 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/truss_setting.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `framing` · CSI `06 17 53`

## Scope
Receives, stores, lifts and sets prefabricated metal-plate-connected wood roof trusses on bearing walls,
beams or post-frame headers; installs temporary and permanent truss bracing, girder hangers and uplift
connectors. Does NOT design trusses (truss supplier/engineer), frame the bearing walls (`framing`) or set
post-frame columns (`post_frame`), or install sheathing/purlins/roofing.

## Existing coverage reconciled
- Hand recipe: none (`truss_setting` not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern; pack recipes replace
  the generic building framing branch for these tasks.
- Catalog codes already seeded: `B-FRAME-SF`, `B-FRM-UPLIFT-TIE-EA` (framing pack, already seeded at
  60 ties per `engineered_trusses`), `B-FRM-LVL-LF`, `EQUIP-CRANE`, `EQUIP-TELEHANDLER` — not redeclared;
  no truss supply line existed.
- Blueprint template tasks: `Roof truss installation` (residential-sf.ts) → `roof_truss_set`;
  `Set roof trusses & header beams on columns` (pole-barn.ts) → `post_frame_truss_set` (priority 10).
- Pack `MatchSchema.building_types` lacks `pole_barn`, so the post-frame variant keys on the title
  (truss + columns/posts/poles/post-frame/truss carrier).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ufgs-06-10-00 | UFGS 06 10 00 Rough Carpentry (3.1.14 anchors, 3.1.15 trusses per TPI/BCSI) | 1 | public_domain | steps, QA |
| sbca-bcsi | SBCA/TPI BCSI | 4 | proprietary_ref_only | bracing practice (paraphrase, no tables/numbers) |
| truss_setting-miosha-c025 | MIOSHA Fact Sheet #025 Wood Truss Bracing | 1 | gov_open | bracing shortcuts, no point loads, no altered trusses, 2 nails/truss |
| truss_setting-osha-fs-trusses | OSHA fact sheet — Installing Roof Trusses | 1 | public_domain | fall protection approach |
| truss_setting-osha-res-fall | OSHA Fall Protection in Residential Construction | 1 | public_domain | fall protection |
| ecfr-1926-c/e/h/i/l/m/o/x/cc | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| icc-pa | IRC R802.10.1/.3/.4, R802.11; IBC 2303.4 | 3 | proprietary_ref_only | code refs |

UFGS 06 17 53 (shop-fabricated wood trusses) could not be retrieved (WBDG S3 AccessDenied) — not cited.

## Work steps
Residential (`roof_truss_set`): receive/inspect/store → prepare bearings + layout → lift and set first
truss + ground bracing → set remaining with temporary bracing → permanent bracing, hangers, uplift ties
(gate `framing`; IRC R802.10.3, R802.11, R802.10.4).
Post-frame (`post_frame_truss_set`): receive/store → set headers on columns → lift and set trusses on
headers → brace and tie down before purlins (gate `framing`; IBC 2303.4, IRC R802.10.3).

## Hazards
12: residential fall 1926.501(b)(13), truss domino collapse 1926.20(b)(2), fall zone 1926.1425(b), power
lines 1926.1408(a), swing radius 1926.1424(a)(2), rigging 1926.251(a)(1), lift capacity 1926.602(c)(1)(i),
loads on unbraced trusses 1926.250(a)(2)(i), bundle storage 1926.250(a)(1), aerial lift 1926.453(b)(2)(v),
ladder 1926.1053(b)(1), nailer 1926.302(b)(3). Sections checked on law.cornell.edu (1926.250/251/602/1424/1425).

## QA checklist
15 items; 5 safety (`first_truss_braced`, `temp_bracing`, `no_unbraced_loads`, `permanent_bracing`,
`no_alteration`) pending human ES.

## Inspection checkpoints
- framing: drawings on site, spacing/bearing/girders, permanent bracing, no alterations, uplift connectors.

## Cost basis (all platform-baseline estimates)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-TRS-TRUSS-EA | Common roof truss 24–32 ft, supply | EA | 17500 | 0 | 0 | 0 |
| B-TRS-SET-EA | Set truss + temp bracing | EA | 300 | 0.8 | 0 | 5 |
| B-TRS-BRACE-LF | Permanent 2x4 bracing | LF | 75 | 0.015 | 0 | 10 |
| B-TRS-HANGER-EA | Truss-to-girder hanger | EA | 3000 | 0.33 | 0 | 0 |

## Quantity rules
- `B-TRS-TRUSS-EA` = engineered_trusses × 30; `B-TRS-SET-EA` = × 30; `B-TRS-BRACE-LF` = × 200.
- Uplift ties are left to the framing pack's `B-FRM-UPLIFT-TIE-EA` rule; hangers have no plan fact → manual.

## Blueprint callouts
None this wave (existing core token `engineered_trusses` used).

## Open questions → REVIEW_QUEUE
- Pack Match `building_types` lacks `pole_barn` (vocab).
- All four B-TRS costs are estimates; B-TRS-TRUSS-EA may overlap B-FRAME-SF if that rate includes roof framing.
- Possible overlap with `post_frame` pack on pole-barn truss supply lines.
