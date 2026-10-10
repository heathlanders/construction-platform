# Dossier — `sheet_metal_flashing` (Sheet Metal / Flashing)

> Wave: w09 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/sheet_metal_flashing.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `roofing` · CSI `07 62`

## Scope (2–4 sentences)
Architectural sheet-metal work: parapet copings, low-slope roof-edge metal / gravel stops, counterflashing and
reglets over the roofer's base flashing, scuppers and conductor heads, crickets, Z/transition flashing, and the
steel trim package on post-frame buildings. NOT here (hand-offs): asphalt-shingle drip edge, step flashing and pipe
boots (roofing pack), siding corners/kick-outs (siding), window/door flashing (windows), masonry through-wall
flashing (masonry), gutters and downspouts (gutters), metal wall/roof panels themselves (metal_panels / pemb / post_frame).

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pattern (3 recipes).
- Catalog codes already seeded and NOT repeated: B-RF-DRIP-EDGE-LF, B-RF-STEP-FLASH-LF, B-RF-PIPE-BOOT-EA,
  B-SID-KICKOUT-EA, B-SID-CORNER-LF, B-WIN-FLASH-EA, B-MAS-FLASH-WEEP-LF, B-GUT-DS-LF.
- Blueprint template tasks: `Corner, base & eave trim` (pole-barn.ts, finishes_exterior) → recipe `post_frame_steel_trim`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| gutters-ufgs-07-60-00 | UFGS 07 60 00 Flashing and Sheet Metal (reused) | 1 | public_domain | steps + QA: nailing/cleats, expansion joints, base/counterflashing laps, reglets, gravel stops, scuppers, coping, dissimilar metals, cleaning |
| gutters-smacna-asmm | SMACNA Architectural Sheet Metal Manual (reused) | 3 | ref only | coping concept |
| nrca-ref | NRCA (reused) | 3 | ref only | background |
| sheet_metal_flashing-spri-es1 | ANSI/SPRI/FM 4435/ES-1 | 3 | ref only | tested edge-system requirement |
| icc-pa | IBC 1503.2/1503.3/1503.4/1504.5/1404.4, IRC R903.2/R903.2.1/R703.4 | 3 | ref only | code refs |
| sheet_metal_flashing-everlast-pf-guide | Everlast post-frame application guide | 5 | mfr | trim set, closures + butyl, snips/nibbler, filings, wind, metal compatibility |
| sheet_metal_flashing-mcelroy-pf-trim | McElroy post-frame trim index | 5 | mfr | trim piece names |
| sheet_metal_flashing-wsmr-base-trim | Western States base-trim how-to | 5 | mfr | base trim first, corner notching, 3 in. laps, ~12 in. screws, film removal |
| sid-doe-basc-kickout, pemb-ufgs-13-34-19 | DOE BASC roof-wall flashing; UFGS 13 34 19 (reused) | 1 | gov | shingle laps; swarf cleanup |
| ecfr-1926-m/x/l/e/c/z/j/k | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (→ pack recipes)
- `post_frame_steel_trim` (priority 10): layout → base trim first → closures + opening trim → eave/gable/corner trim → clean/touch up [final].
- `low_slope_edge_coping_scupper` (priority 20): nailers + ES-1 system → edge metal [roof_dry_in, IBC 1504.5/1503.2] → coping [roof_dry_in, IBC 1503.3] → scuppers (IBC 1503.4) → clean/walk [final].
- `counterflashing_transitions` (fallback): plan laps → crickets [roof_dry_in] → counterflashing [roof_dry_in] → Z-flashing [sheathing] → check/hand off [final].

## Hazards
12: low-slope edge 1926.501(b)(10), residential roofing 1926.501(b)(13), unprotected edge 1926.501(b)(1), ladder
1926.1053(b)(1), scaffold 1926.451(g)(1), aerial lift 1926.453(b)(2)(v), cuts 1926.95(a), eyes 1926.102(a)(1), wind on
long sheets 1926.20(b)(1), silica from reglet grinding 1926.1153, hot work 1926.352(a), power lines 1926.416(a)(1).

## QA checklist
15 items — laps, counterflash overlap, reglet seal, cleats/no face fasteners, expansion joints, ES-1 system (safety),
coping slope/drips, scupper projection, dissimilar metals, post-frame base first, trim laps, closures, fasteners in ribs,
filings cleaned, finish.

## Inspection / acceptance checkpoints
- sheathing: Z/transition flashing behind WRB; receivers before cladding.
- roof_dry_in: tested edge system; counterflashing over base flashing; crickets; parapets coped.
- final: scuppers draining; post-frame trim complete; filings cleaned.

## Cost basis (all platform-baseline estimates, 2026)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| B-SMF-COPING-LF | Prefinished steel coping on cleats | LF | 1600 | 0.25 | 50 | 8 |
| B-SMF-EDGE-LF | Tested low-slope edge metal / gravel stop | LF | 1100 | 0.15 | 30 | 8 |
| B-SMF-CTRFLASH-LF | Two-piece counterflashing + reglet/receiver | LF | 700 | 0.2 | 0 | 10 |
| B-SMF-SCUPPER-EA | Scupper liner + conductor head | EA | 30000 | 3 | 0 | 5 |
| B-SMF-PF-TRIM-LF | Post-frame trim package (avg per LF of trim) | LF | 350 | 0.06 | 15 | 10 |

## Quantity rules
- `B-SMF-PF-TRIM-LF` = area_sf_sum × 0.23 (pole_barn) — base + eave + gables + corners + door trim on a ~40x60.
- `B-SMF-SCUPPER-EA` = const 2 (commercial, industrial) — overflow scuppers until the drainage plan is read.
- No edge/coping rule: roofing pack seeds B-RF-DRIP-EDGE-LF on every building type; a second perimeter line would double-count.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- IBC crickets/saddles section number differs by edition (1503.5 vs 1503.6) — omitted.
- Roofing pack's drip-edge quantity rule has no building_types; on commercial low-slope jobs it should be edge metal (B-SMF-EDGE-LF) instead.
- Post-frame trim may overlap a future metal_panels / post_frame trim line — confirm single owner.
