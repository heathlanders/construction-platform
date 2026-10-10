# Dossier — `panelized_sips` (Panelized / SIPs)

> Wave: w07 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/panelized_sips.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `framing` · CSI `06 12`

## Scope (2–4 sentences)
Receives, stages and sets factory-cut structural insulated panels (and panelized wall sections): sill and
bottom-plate prep, crane/telehandler setting, splines and fastening, continuous seam sealing and SIP tape,
chase access, site-cut openings, roof SIPs over a ridge beam, WRB/drainage plane and same-day roof dry-in.
Does NOT do the foundation, ridge-beam engineering, wiring (electrician pulls wire through the chases),
roofing, cladding or drywall (the drywall installs the thermal barrier).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (recipes `sip_walls`, `sip_roof`).
- Catalog codes already seeded: none for SIPs (`B-FRAME-SF`, `B-SHEATHING-SF`, `B-INSUL-SF` belong to stick framing — not reused).
- Blueprint template tasks hitting this trade: none. `title_re` covers SIP / structural insulated panel / panelized / wall panel(s); the roof recipe (priority 10) covers "roof … SIP/panel" titles.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| panelized_sips-doe-basc-sips | DOE BASC — Structural Insulated Panels (SIPs) resource guide | 1 | gov_open | staging, foundation tolerance, sill/capillary break, seam sealing + tape, lift plates, smoke pencil / blower door, site openings, chases, drainage plane |
| panelized_sips-sipa-install | SIPA — Installation FAQ | 4 | association_public | site modification tools, chases, termites, damaged panels → engineer, unvented roofs |
| panelized_sips-sipa-tech | SIPA — Technical Research bulletins | 4 | association_public | durability/moisture at roof seams, fire safety (thermal barrier) — topic only |
| ecfr-1926-cc / -h / -o / -m / -c / -i / -f / -d | 29 CFR 1926 subparts | 1 | public_domain | hazards (sections verified on ecfr.gov) |
| icc-pa | ICC public access (IRC) | 3 | proprietary_ref_only | R610, R703.2, R703.4, R806.5, R905.1.1, R316.4, N1102.4.1.1/.2 — section + paraphrase only |
| platform-baseline | The Jobsite cost baseline | — | platform_estimate | all assembly costs |

## Work steps (draft → pack recipes)
`sip_walls` (example "Set SIP wall panels"):
1. **Receive, check and stage** — QA panels_dry_flat.
2. **Check deck, set sill/bottom plates** — R610. Gate framing. QA deck_level_square, sill_break_bearing.
3. **Set, spline and fasten** — R610. Gate framing. QA sealant_continuous, fasteners_schedule, plumb_braced, no_unapproved_cuts.
4. **Frame site openings, open chases** — QA openings_framed, chase_holes_aligned.
5. **Drainage plane + opening flashing** — R703.2, R703.4. Gate sheathing. QA wrb_drainage.
6. **Seal/tape seams, foam chases, smoke test** — N1102.4.1.1, R316.4. Gate insulation. QA seams_taped, smoke_test.

`sip_roof` (example "Install SIP roof panels", priority 10):
1. **Set ridge beam** — QA lift_plan. 2. **Lift and fasten roof panels** — Gate framing. 3. **Seal ridge/eaves, dry in** — R905.1.1, R806.5. Gate roof_dry_in.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| crane_fall_zone | struck by hanging panel/beam | 1926.1425(b) | 4 |
| crane_swing | crane swing radius | 1926.1424(a)(2) | 4 |
| power_line | boom/load contacts line | 1926.1408(a) | 4 |
| rigging | rigging failure | 1926.251(a)(1) | 4 |
| forklift | telehandler/forklift tip-over | 1926.602(c)(1)(i) | 4 |
| panel_tip | unbraced panel blows over | 1926.20(b)(1) | 4 |
| fall_edge | deck edge / wall top (residential) | 1926.501(b)(13) | 4 |
| roof_steep | steep SIP roof | 1926.501(b)(11) | 4 |
| roof_holes | skylight/chimney openings | 1926.501(b)(4)(i) | 4 |
| saw_cut | panel saw / beam cutter | 1926.300(b) | 3 |
| foam_fire | foam core ignition | 1926.150(c)(1)(i) | 3 |
| foam_chem | sealant / foam / hot-wire fumes | 1926.59 | 2 |

## QA checklist
15 items (12 translated non-safety, 3 safety: no_unapproved_cuts, lift_plan, thermal_barrier). Air tightness
(continuous sealant, tape, smoke/blower-door) is the critical QA — BASC.

## Inspection / acceptance checkpoints
- framing: layout/openings vs plans (R610), splines/plates/fasteners, point loads + ridge bearing.
- sheathing: WRB + base/opening flashing (R703.2).
- roof_dry_in: roof panels fastened, seams sealed, underlayment (R905.1.1).
- insulation: seams taped/sealed, chases foamed (N1102.4.1.1); thermal barrier planned (R316.4).
- final: blower-door result on file (N1102.4.1.2).

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-SIP-WALL-SF | 6-1/2 in. wall SIP supply + set | SF | 700 | 0.05 | 30 | 3 | platform-baseline, estimate |
| B-SIP-ROOF-SF | 10-1/4 in. roof SIP supply + set | SF | 900 | 0.06 | 70 | 5 | platform-baseline, estimate |
| B-SIP-TAPE-LF | SIP seam tape installed | LF | 70 | 0.015 | 0 | 10 | platform-baseline, estimate |
| B-SIP-SILL-LF | sill sealer + capillary break + sill/bottom plate | LF | 450 | 0.08 | 0 | 8 | platform-baseline, estimate |

## Quantity rules
- `B-SIP-WALL-SF` = area_sf_sum × 0.8 (residential) — one-story 9 ft walls.
- `B-SIP-ROOF-SF` = area_sf_sum × 1.15 (residential_sf) — remove if roof is trussed.
- `B-SIP-TAPE-LF` = area_sf_sum × 0.35 (residential).
- `B-SIP-SILL-LF` = area_sf_sum × 0.09 (residential_sf) — perimeter of ~2,000 SF footprint.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All 4 costs are platform estimates (SIP pricing varies widely by maker/region).
- Area-based quantity rules are crude proxies (floor area → wall/roof area); a SIP takeoff from shop drawings should replace them.
- No public SIPA/APA installation manual with free install specifics was reachable (APA SIP page 404); BASC carries the field detail.
- IRC R610 subsections not cited individually (only the section) — verify subsection refs if deeper detail wanted.
