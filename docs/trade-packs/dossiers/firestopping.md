# Dossier — `firestopping` (Firestopping)

> Wave: w10 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/firestopping.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `framing` · CSI `07 84`

## Scope (2–4 sentences)
Restores the rating of fire-resistance-rated walls and floors: through- and membrane-penetration firestop
systems around pipe, conduit, cable and duct; fire-resistive joint systems at the head of rated walls; and
perimeter fire barriers (safing + smoke seal) at slab edge / curtain wall. Owns system selection from
listings, prep, install, labeling, the firestop log and the hold-for-inspection before concealment.
Hand-offs: fireblocking/draftstopping in wood framing to `framing`; weather sealants to `caulking_sealants`;
sprayed fire-resistive material on steel to `fireproofing`; fire dampers to `ductwork`; the rated assemblies
themselves to `drywall`/`masonry`/`metal_stud_framing`.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern; pack recipes produce the steps.
- Catalog codes already seeded: none with `B-FS-`. Adds 6 `B-FS-*` codes.
- Blueprint template tasks hitting this trade: none. title_re covers "firestop", "fire stop", "penetration
  seal", "fire caulk"; joint recipe (priority 10) covers "head-of-wall", "perimeter fire", "safing",
  "slab edge", "joint system".

## Gate choice (reasoning)
`insulation`. The building sequence (footing → … → insulation → final) has no dedicated above-ceiling/
cover inspection; `insulation` is the last AHJ inspection before rated walls and ceilings close. Firestop
comes after the MEP rough-ins whose items it seals (UFGS 07 84 00 §1.3: firestop pipes before insulating;
inspect before enclosing), and IBC 1705.18 special inspection must happen before concealment. `framing`
would be too early (penetrants not yet in place). Marking/label/log items sit under `final` (IBC 703.7).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| firestopping-ufgs-07-84-00 | UFGS 07 84 00 Firestopping (05/10, Chg 1 08/13) | 1 | public_domain | sequencing, locations, floor-void load rule, insulated pipes, cable devices, inspect-before-cover, record listing numbers |
| firestopping-fcia-spec-07-84-00 | FCIA suggested 07 84 00 spec (2019) | 4 | association_public | execution steps (paraphrased), joint/perimeter install, labeling, closeout log |
| firestopping-fcia-mop | FCIA Firestop Manual of Practice | 4 | proprietary_ref_only | reference only |
| firestopping-ul-productiq | UL Product iQ firestop listings | 3 | proprietary_ref_only | reference only — listing numbers never copied |
| firestopping-astm-e2174 / -e2393 | ASTM on-site inspection practices | 3 | proprietary_ref_only | special-inspection QA reference |
| firestopping-icc-sigchanges-1705-18 | ICC 2021 Sig Changes IBC 1705.18 | 3 | proprietary_ref_only | confirms 1705.18 scope |
| icc-pa | ICC public access | 3 | proprietary_ref_only | IBC 703.7, 714.4, 714.5, 715, 715.4, 1705.18; IRC R302.4 |
| ecfr-1926-{c,d,e,k,l,m,x,z} | 29 CFR 1926 | 1 | public_domain | hazards |
| platform-baseline | platform estimate | — | platform_estimate | all costs |

## Work steps (→ pack recipes)
`penetration_firestop`: survey + pick listed system (IBC 714.4/714.5, IRC R302.4) → prepare opening →
install per listing → label and log (IBC 703.7) → hold for inspection [gate insulation] (IBC 1705.18).
`joint_perimeter_systems`: check joint vs listing (IBC 715) → forming → joint spray/sealant → label, log,
hold [gate insulation] (IBC 715.4, 1705.18).

## Hazards
ladder 1926.1053(b)(1) · lift_fall 1926.453(b)(2)(v) · floor_opening 1926.501(b)(4)(i) · edge_fall
1926.501(b)(1) · falling_objects 1926.502(j) · silica_drilling 1926.1153(c)(1) · chem_firestop 1926.59 ·
fiber_irritation 1926.95(a) · eye_flying 1926.102(a)(1) · energized 1926.416(a)(1). All verified on
law.cornell.edu / eCFR. ES pending human translation.

## QA checklist
15 items — listing match (incl. EJ), penetrants complete, annular space, insulation per listing, packing
depth, sealant depth/contact, collars, floor-void load (safety), joint width, forming compression, joint
overlap, labels, firestop log, inspected before cover (safety), special inspection (safety).

## Inspection / acceptance checkpoints
- insulation: penetrations firestopped with listed systems/EJ; joints sealed; listings + log on site; special inspection report where required.
- final: rated walls stenciled in concealed spaces; labels + closeout log delivered.

## Cost basis (all `platform-baseline`, confidence estimate)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-FS-PIPE-SM-EA | Pipe/conduit ≤2 in. sealant system | EA | 1200 | 0.35 | 0 | 10 |
| B-FS-PIPE-LG-EA | Pipe/duct 3–6 in. incl. collar/wrap | EA | 5500 | 0.75 | 0 | 5 |
| B-FS-CABLE-EA | Cable bundle / sleeve, putty or device | EA | 4500 | 0.5 | 0 | 5 |
| B-FS-HOW-LF | Head-of-wall joint, mineral wool + spray | LF | 450 | 0.08 | 0 | 10 |
| B-FS-PERIM-LF | Slab-edge perimeter fire barrier | LF | 900 | 0.15 | 0 | 10 |
| B-FS-LABEL-EA | Label + log entry per system | EA | 150 | 0.05 | 0 | 5 |

## Quantity rules (MF/commercial/industrial only — area_sf_sum)
- B-FS-PIPE-SM-EA = area × 0.01 · B-FS-PIPE-LG-EA = area × 0.002 · B-FS-CABLE-EA = area × 0.0033 ·
  B-FS-HOW-LF = area × 0.05 (MF/commercial) · B-FS-LABEL-EA = area × 0.015. All are placeholders until the
  penetration survey; B-FS-PERIM-LF has no blueprint basis (measure slab-edge perimeter).

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All 6 costs are estimates.
- No building inspection type for "above-ceiling / pre-cover"; gate = insulation (vocab proposal).
- IBC section numbers verified for 2021 (1705.18; 715 title changed to "Joints and Voids" in 2024 IBC).
- Density rules (penetrations per SF) are rough; confirm against real survey counts.
