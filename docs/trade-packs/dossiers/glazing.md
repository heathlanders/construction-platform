# Dossier — `glazing` (Glazing / Glass)

> Wave: w10 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/glazing.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `finishes_exterior` · CSI `08 80`
> Aliases: glass, shower_doors, mirrors, window_film

## Scope (2–4 sentences)
Field glazing of glass that is not part of a factory window unit: replacement insulating glass units (IGUs),
interior frameless glass partitions, frameless shower doors/enclosures, wall mirrors, structural glass guards
and railings, and window film. Hand-offs: window units → `windows` (B-WIN-*); storefront and curtain wall →
`curtain_wall`; tile and blocking behind shower hardware → `tile` / `framing`; glass guard engineering → the
railing engineer's stamped shop drawings.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern, 5 recipes.
- Catalog codes already seeded: none for glazing (B-WINDOW / B-WIN-* belong to windows — not duplicated).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| glazing-ufgs-08-81-00 | UFGS 08 81 00 Glass and Glazing (May 2019) | 1 | public_domain | delivery/storage, weather limit (40 °F), measure actual opening, IGU no-nip/no-force, labels, cleaning, warning flags, replace damaged |
| cfr-16-1201 | 16 CFR 1201 architectural glazing safety standard | 1 | public_domain | Category II = shower/tub enclosures, sliding doors; safety glazing QA |
| ecfr-1926-{c,d,e,h,i,l,m,x,z} | 29 CFR 1926 subparts | 1 | public_domain | hazards (1926.95, 1926.20(b), 1926.251(a)(1), 1926.250(a)(1), 1926.501(b)(1)/(c), 1926.1053(b)(1), 1926.452(w), 1926.1153, 1926.300(b), 1926.102(a)(1), 1926.59) |
| glazing-nga-gib | NGA Glass Information Bulletins | 4 | association_public | setting blocks, handling, cleaning concepts (paraphrase) |
| glazing-gana-manual | GANA Glazing Manual | 4 | proprietary_ref_only | reference only — edge clearance / bite / setting blocks concepts |
| icc-pa | IRC R308 / IBC Ch. 24 | 3 | proprietary_ref_only | code refs (section + paraphrase only) |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all assembly costs |

## Work steps (draft → pack recipes)
- `general_glazing` (title_re glaz|glass|IGU|insulating glass|reglaz): field-measure → receive/store/stage →
  prepare frame + set on setting blocks → seal → labels, clean, protect. Gate `final` (IRC R308.1, R308.4; IBC 2406).
- `shower_enclosure` (priority 10): measure after tile + blocking → drill tile wet + mount hardware → set panels,
  hang door → seal outside only, cure. Gate `final` (IRC R308.4.5; IBC 2406.4.5).
- `glass_railing` (priority 10): edge protection + substrate check → anchor shoe/standoffs → set and lock panels →
  cap rail + inspect. Gate `final` (IBC 2407; IRC R308.4.4).
- `mirrors` (priority 5): wall check/layout → J-channel/clips (mechanical support) → mastic spots + set.
- `window_film` (priority 5): glass-to-film compatibility → clean + apply.

## Hazards (draft → pack hazards)
12: glass_cut (1926.95(a)), manual_lift (1926.20(b)), vacuum_cup (1926.251(a)(1)), glass_storage (1926.250(a)(1)),
fall_edge (1926.501(b)(1)), struck_by_glass (1926.501(c)), ladder (1926.1053(b)(1)), scissor_lift (1926.452(w)),
silica_drill (1926.1153), power_tool (1926.300(b)), eye_flying (1926.102(a)(1)), chem_sealant (1926.59).

## QA checklist
16 items (7 safety → ES pending). Measure/order, storage, setting blocks + clearance, IGU not forced, sealant +
weather, safety mark visible, clean/flag, shower hardware + door/seal, guard anchors/panels/cap+height, mirror
mechanical support + mastic, film compatibility.

## Inspection / acceptance checkpoints
- final: safety marks in hazardous locations; shower/tub enclosures safety glass; glass guards per shop drawings
  with top rail where required; engineered drawings on site.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-GLZ-SHWR-FRMLS-EA | Frameless shower door + panel, 3/8 in. tempered | EA | 140000 | 6 | 0 | 0 | platform-baseline, estimate |
| B-GLZ-MIRROR-SF | Wall mirror 1/4 in., channel/clips + mastic | SF | 1200 | 0.15 | 0 | 5 | estimate |
| B-GLZ-IGU-REPL-EA | Replace failed IGU ≈10 SF | EA | 25000 | 1.5 | 0 | 0 | estimate |
| B-GLZ-PART-SF | Interior frameless partition, 1/2 in. tempered | SF | 4500 | 0.35 | 100 | 3 | estimate |
| B-GLZ-RAIL-LF | Structural glass guard, base shoe + cap | LF | 25000 | 1.2 | 0 | 2 | estimate |

## Quantity rules
- `B-GLZ-SHWR-FRMLS-EA` = const × 1 (residential_sf only) — one primary-bath enclosure until counted.
- `B-GLZ-MIRROR-SF` = const × 30 (residential_sf / residential_mf) — ≈30 SF bath mirrors until scheduled.
(No fixture tokens exist for showers/lavatories, so counts can't come from the legend.)

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All 5 assembly costs are platform estimates.
- Vocab: no `vacuum_lifter` / glazing robot equipment type — propose adding.
- Spanish safety text (12 hazards, 7 QA) pending human translation.
- IRC R308.4.4 / R308.4.5 and IBC 2406.4.5 subsection numbers are from the 2018/2021 editions — confirm against the adopted edition.
