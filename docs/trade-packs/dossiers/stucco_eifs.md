# Dossier — `stucco_eifs` (Stucco / EIFS)

> Wave: w09 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/stucco_eifs.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `finishes_exterior` · CSI `09 24`

## Scope
Exterior portland-cement plaster (three-coat stucco over lath, incl. the two-layer WRB, weep screed,
casing beads and control joints) and EIFS (foam board, reinforced base coat, finish, sealant at
openings). Hands off: windows/doors (set and flashed before lath), roofing (step/kick-out flashing),
caulking_sealants (non-EIFS joints), painting (elastomeric coatings beyond a stucco recoat).

## Existing coverage reconciled
- Hand recipe: `task-buildout/building.ts` siding/stucco/EIFS branch (Install WRB & flashing → Install stucco/EIFS, gate final) → pack **complements** (`recipes: []`).
- Catalog codes already seeded: `B-STUCCO-SF` (hand-seeded in `quantities.ts` from component `stucco_finish`, area × 1.1) — not redeclared; siding pack's `B-SID-WRB-SF` noted in the WRB assumption.
- Blueprint template tasks: none tagged `stucco_eifs`; component `stucco_finish` (`STUCCO|EIFS`) scopes quantity rules.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| stucco_eifs-ufgs-09-24-23 | UFGS 09 24 23 Cement Stucco | 1 | public_domain | lath, control joints, coats, cure, tolerance, temperature |
| stucco_eifs-ufgs-07-24-00 | UFGS 07 24 00 EIFS | 1 | public_domain | EIFS boards, mesh, back-wrap, sealant, checklist |
| stucco_eifs-bloomington-3coat | City of Bloomington MN three-coat stucco sheet | 1 | gov_open | WRB two layers + laps, weep screed clearance, flashing sequence, lath inspection |
| stucco_eifs-basc-drainmat | DOE BASC stucco drainage mat | 1 | gov_open | drainage gap concept |
| sid-doe-basc-kickout | DOE BASC kick-out flashing | 1 | gov_open | kick-out QA |
| stucco_eifs-eima-tech | EIMA technical resources | 4 | association_public | EIFS drainage concepts |
| stucco_eifs-astm-c926-c1063 | ASTM C926 / C1063 | 3 | proprietary_ref_only | reference only |
| icc-pa | ICC public access | 3 | proprietary_ref_only | IRC R703.x, IBC 110.3.5 / 1407 / 2510.6 / 2512.1.2 |
| ecfr-1926-{d,e,i,l,x,z} | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps
Hand recipe kept. Pack adds code refs under `sheathing` (WRB, flashing, lath, weep screed, IBC lath inspection) and `final` (plaster, EIFS).

## Hazards
scaffold_fall 1926.451(g)(1) · scaffold_inspection 1926.451(f)(3) · scaffold_planking 1926.451(b)(1) ·
scaffold_power_line 1926.451(f)(6) · ladder 1926.1053(b)(1) · silica_cutting 1926.1153(c)(1) ·
silica_cleanup 1926.1153(f)(1) · cement_burn 1926.95(a) · eye_splash 1926.102(a)(1) · hazcom 1926.59 ·
wash_station 1926.51(f)(1) · mixer_guard 1926.300(b)(2). All verified on law.cornell.edu mirror of eCFR.

## QA checklist
15 items (see pack): penetrations first, two-layer WRB laps, flashing/kick-outs, weep screed 4 in./2 in.,
lath fastening 8/16 in., lath laps, control joints ≤144 SF/18 ft, 3/8 in. stop-bead gap, 40 °F/48 h,
72/72/48 h cure, 1 in. thickness + 1/8 in. in 10 ft, EIFS boards, EIFS mesh/back-wrap, EIFS sealant
to base coat, scaffold ready (safety).

## Inspection / acceptance checkpoints
- sheathing (lath inspection, before scratch coat): sheathing gaps, flashing, WRB, weep screed, kick-outs, lath/trim.
- final: stucco cured/uncracked, EIFS per listing, sealant complete.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-STU-WRB2-SF | Two-layer WRB | SF | 30 | 0.008 | 0 | 12 | platform estimate |
| B-STU-WEEP-LF | Weep screed | LF | 120 | 0.03 | 0 | 8 | platform estimate |
| B-STU-CJ-LF | Control joint | LF | 150 | 0.04 | 0 | 8 | platform estimate |
| B-STU-DRAINMAT-SF | Drainage mat | SF | 90 | 0.006 | 0 | 8 | platform estimate |
| B-STU-EIFS-SF | Drainage EIFS system | SF | 650 | 0.09 | 15 | 10 | platform estimate |
| B-STU-RECOAT-SF | Patch + acrylic recoat | SF | 120 | 0.03 | 0 | 8 | platform estimate |

## Quantity rules (all scoped by component `stucco_finish`)
- `B-STU-WRB2-SF` = area_sf_sum × 1.1
- `B-STU-WEEP-LF` = area_sf_sum × 0.1 (≈ perimeter)
- `B-STU-CJ-LF` = area_sf_sum × 0.11 (≈1 LF per 10 SF wall)

## Blueprint callouts
None new (existing `stucco_finish`).

## Open questions → REVIEW_QUEUE
- All 6 costs `estimate`.
- IRC section numbers R703.7.2.1 / R703.7.3 / R703.9.2 and IBC 110.3.5 / 2510.6 / 2512.1.2 / 1407 — confirm against the adopted edition (numbering shifts between editions).
- `stucco_finish` cannot tell stucco from EIFS — EIFS/drain-mat/recoat lines are not auto-seeded.
- Vocab: no `scaffold` / `plaster_pump` equipment types.
