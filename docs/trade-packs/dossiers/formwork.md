# Dossier — `formwork` (Concrete Formwork / ICF)

> Wave: w08 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/formwork.ts` · Status: draft
> Taxonomy: category `concrete_masonry` · permit_trade `building` · phase `foundation` · CSI `03 10`

## Scope (2–4 sentences)
Builds and strips the forms for cast-in-place concrete: footing side forms, foundation/wall forms
(job-built or panel systems), shoring and reshoring for elevated slabs and decks, and stay-in-place
insulating concrete form (ICF) walls including bucks, bracing/alignment and the pour watch. Hands off:
excavation to `excavation`, bar placement to `rebar`, concrete supply/placing/finishing to `concrete`,
pumping to `concrete_pumping`, post-tensioning to `post_tensioning`, waterproofing/dampproofing to
`waterproofing`, framing on the finished wall to `framing`.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → pack recipes produce the work steps (new-trade pattern).
  The building family's foundation-phase recipe in `building.ts` still covers "form foundation walls"
  generically for `concrete`/`general` tasks; this pack applies only to tasks tagged `formwork`.
- Catalog codes already seeded: `B-FOOTING` (LF, likely includes forming), `B-CONCRETE-CY`, `B-REBAR-LF`
  — not redeclared. New codes use `B-FORM-`.
- Blueprint template tasks hitting this trade: none (0). Recipes match `form(work|s|ing)`, footing/footer,
  `ICF` / insulated(ing) concrete form, shore/shoring/reshore/elevated slab.
- Components: no new tokens; quantity rules use core `foundation_wall` and `concrete_footing`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| formwork-ecfr-1926-703 | 29 CFR 1926.703 cast-in-place concrete | 1 | public_domain | shoring/stripping/reshoring steps, hazards, safety QA |
| ecfr-1926-{c,d,e,i,l,m,p,q} | 29 CFR 1926 subparts | 1 | public_domain | hazards (1926.25(a), .59, .95(a), .300(b), .451(g)(1), .501(b)(5), .651(j)(2), .701(b)) |
| ufgs-03-30-00 | UFGS 03 30 00 Cast-in-Place Concrete §3.3 Formwork | 1 | public_domain | wall-form steps + QA (mortar-tight, clean-outs, release agent off rebar, wedges, embeds, ACI 117 tolerances, removal, reshoring). UFGS 03 11 13.00 10 is superseded into 03 30 00 — no standalone 03 11 13 PDF exists. |
| formwork-aci-347 | ACI PRC-347 Guide to Formwork | 3 | proprietary_ref_only | reference only |
| formwork-nudura-manual | Nudura ICF Installation Manual | 5 | manufacturer_public | ICF first course, bucks, alignment system, pre/post-pour checklists, ≤4 ft lift/hr, vibrator size, blow-out kit |
| formwork-buildblock-mix | BuildBlock ICF concrete design mix | 5 | manufacturer_public | ICF mix/slump, no water on site, hose reducer |
| formwork-foxblocks-guides | Fox Blocks guides & checklists | 5 | manufacturer_public | cross-check: follow the form maker's guide + evaluation report |
| formwork-icfma | ICFMA | 4 | association_public | orientation |
| icc-pa | IRC R403.1, R404.1.3, R608, R316.4 | 3 | proprietary_ref_only | code refs (section + paraphrase) |
| platform-baseline | Platform cost baseline | — | platform_estimate | all 5 assembly costs |

## Work steps (draft → pack recipes)
**wall_forms** (`\bform(work|s|ing)?\b`, priority 0)
1. Check the drawings and the footing — QA drawings_on_site, footing_ready.
2. Set the first face, ties and rebar — QA ties_per_layout.
3. Close, brace and align the forms — QA bracing_plumb, embeds_located.
4. Clean out and pass the foundation inspection — Gate: foundation. Code IRC R404.1.3. QA forms_clean_tight.
5. Watch the forms during the pour — QA pour_watch.
6. Strip, patch and clean up — QA strip_strength, ties_per_layout.

**footing_forms** (footing/footer, priority 10)
1. Lay out the footing from the batter boards — QA footing_line_grade.
2. Set and stake the side forms.
3. Set dowels and embeds, clean and inspect — Gate: footing. Code IRC R403.1.
4. Strip the footing forms — QA footing_ready.

**icf_walls** (ICF / insulated concrete form, priority 20)
1. Check the footing and set the first course. 2. Stack the courses, rebar and openings.
3. Install the alignment system and walk plank. 4. Pre-pour check and foundation inspection — Gate:
foundation. Code IRC R404.1.3, R608. 5. Place the concrete in lifts (≤ ~4 ft/hr, small vibrator).
6. Straighten, screed and protect the wall.

**shoring_reshore** (shore/shoring/reshore/elevated slab, priority 15) — no gate (elevated slabs are
not in the building inspection sequence): check drawings + equipment → set sills/shores/deck →
inspect before/during/after placement → strip and reshore.

## Hazards (draft → pack hazards)
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| form_collapse | Form blow-out / collapse | design + brace for loads, form watcher, blow-out kit | 1926.703(a)(1) | 4 |
| shore_failure | Shoring collapse | inspect before/during/after; sills, contact, no eccentric loads | 1926.703(b)(3) | 4 |
| early_strip | Stripping too early | strip at plan conditions/tests; reshore | 1926.703(e)(1) | 4 |
| rebar_overturn | Vertical rebar tipping | support/guy | 1926.703(d)(1) | 3 |
| impalement | Protruding rebar | cap/cover | 1926.701(b) | 4 |
| fall_formface | Fall from form face | PFAS / positioning ≥ 6 ft | 1926.501(b)(5) | 4 |
| walk_plank_fall | Fall from catwalk/bracket scaffold | guardrail/PFAS > 10 ft | 1926.451(g)(1) | 4 |
| excavation_edge | Material into excavation | keep 2 ft back | 1926.651(j)(2) | 3 |
| nail_debris | Nails in stripped lumber | clear as stripped | 1926.25(a) | 2 |
| cement_burn | Wet concrete burns | gloves, boots, eye protection | 1926.95(a) | 3 |
| release_agent | Release agent chemicals | SDS, ventilation, PPE | 1926.59 | 2 |
| power_tool | Saw / nailer injuries | guards, nailer safety | 1926.300(b) | 3 |

## QA checklist
15 items: drawings_on_site*, footing_line_grade, footing_ready, ties_per_layout, bracing_plumb*,
embeds_located, forms_clean_tight, pour_watch*, shoring_inspected*, strip_strength*, icf_first_course,
icf_bucks, icf_prepour, icf_pour_rate, icf_final_alignment (* = safety, ES pending).

## Inspection / acceptance checkpoints
- footing: forms to line/grade/width, bearing soil, dowels/anchors set (IRC R403.1).
- foundation: braced/plumb/thickness, ties, rebar + laps + lintels (ICF per evaluation report), embeds/bucks,
  instructions on site (IRC R404.1.3 / R608).
- final: ICF foam covered by thermal barrier (IRC R316.4).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-FORM-WALL-SFCA | Wall forms, form-strip-clean | SFCA | 150 | 0.10 | 25 | 5 | estimate — panel/plywood amortized + ties + release |
| B-FORM-FTG-LF | Footing side forms both sides | LF | 120 | 0.08 | 0 | 10 | estimate — 2x boards reused 3–4× |
| B-FORM-ICF-SF | ICF wall supply/stack/brace | SF | 500 | 0.08 | 30 | 5 | estimate — ~5.3 SF block ≈ $25–28 |
| B-FORM-BUCK-EA | Opening buck | EA | 6000 | 1.0 | 0 | 10 | estimate |
| B-FORM-SHORE-SF | Elevated slab shoring + deck | SF | 250 | 0.09 | 40 | 3 | estimate |

## Quantity rules
- `B-FORM-WALL-SFCA` = component `foundation_wall` × 2,560 (≈160 LF × 8 ft × 2 faces), residential_sf only.
- `B-FORM-FTG-LF` = component `concrete_footing` × 160, residential_sf only (drop if B-FOOTING carries forming).

## Blueprint callouts (components)
- None new. An `icf_wall` token (e.g. "ICF WALL", "INSULATED CONCRETE FORM") would let ICF quantities seed
  — proposed for a later wave.

## Open questions → REVIEW_QUEUE
- IRC ICF section number: R608 (2012+); the brief said R611 (2009 IRC). Confirm against the adopted edition.
- DOE BASC has no findable ICF guide page (several URLs 404) — not cited.
- B-FOOTING likely already includes forming; estimator must not price both.
- No `vibrator` in equipment vocab (ICF/walls consolidation) — proposal.
