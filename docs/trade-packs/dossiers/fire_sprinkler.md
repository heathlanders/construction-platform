# Dossier — `fire_sprinkler` (Fire Sprinkler / Suppression)

> Wave: w13 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/fire_sprinkler.ts` · Status: draft
> Taxonomy: category `plumbing_systems` · permit_trade `plumbing` · phase `rough_in` · CSI `21 13`

## Scope
Automatic water-based sprinkler systems: NFPA 13 wet/dry systems in commercial and industrial buildings, NFPA 13R
in low-rise multifamily, NFPA 13D or IRC P2904 multipurpose systems in dwellings. Covers the private fire service
from the flanged riser stub inward (plus the backflow assembly), riser and FDC, mains/branch lines, hangers and
seismic bracing, testing, head trim and acceptance. Hand-offs: site water utility beyond ~5 ft of the building
(UFGS 33 11 00 scope), fire alarm wiring of flow/tamper switches (`fire_alarm`), fire pumps, special-hazard
systems (`fire_protection_special`), firestopping of rated penetrations (often `firestopping`).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`; only the phase-keyed generic plumbing family recipe) → NEW-TRADE pattern.
- Catalog codes already seeded: `P-SPRINKLER-HEAD` (0037 — head + branch piping share, EA). Not hand-seeded in
  `quantities.ts`; the pack references it from `quantity_rules` (not redeclared).
- Blueprint template tasks: `Fire suppression sprinkler rough-in` (commercial), `Fire suppression sprinkler system
  rough-in` (industrial) — both matched by recipe `sprinkler_system_install`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| fire_sprinkler-ufgs-21-13-13 | UFGS 21 13 13 Wet Pipe Sprinkler Systems (Aug 2020) | 1 | public_domain | steps, QA (Part 3 execution + 3.8 tests) |
| fire_sprinkler-usfa-fa43 | USFA FA-43 Residential Fire Sprinkler Systems (2008) | 1 | public_domain | P-FS-RES-SF cost basis ($1.00–1.50/SF) |
| icc-pa | ICC public access (IBC/IFC/IRC/IPC) | 3 | proprietary_ref_only | IBC 903.3.1.1/.2, 903.4, 912; IFC 901.5; IRC R313, P2904; IPC 608 |
| nfpa-fa + fire_sprinkler-nfpa-13 / -13r / -13d / -24 | NFPA document pages | 3 | proprietary_ref_only | chapter refs only (13 Ch. 6, 17, 18, 27, 28) — no numbers |
| ecfr-1926-{d,e,h,i,j,l,m,p,x,z} | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| platform-baseline | Platform estimate | — | platform_estimate | commercial assemblies |

## Work steps (pack recipes)
`sprinkler_system_install` (template tasks): 1 Shop drawings + hydraulic calcs approved (IBC 903.3.1.1, NFPA 13 Ch. 27) ·
2 Fire service + backflow, flush, underground hydro — gate **underground** (IPC 608, NFPA 13 Ch. 6) ·
3 Riser + FDC + drains/inspector's test (IBC 912, 903.4) · 4 Hang/brace mains & branches, sleeves, groove gauging
(NFPA 13 Ch. 17/18) · 5 Hydro test before concealment — gate **rough_in** (NFPA 13 Ch. 28) ·
6 Trim heads, alarm/main drain tests, certificate — gate **final** (NFPA 13 Ch. 28, IFC 901.5).
`sprinkler_trim_acceptance` (priority 1, trim/final titles): heads → acceptance tests (gate final) → turnover.
`residential_dwelling_sprinkler` (priority 2, residential_sf): design (IRC R313/P2904) → rough-in (gate rough_in) → test/trim/final.

Test pressure/hold time (NFPA 13) intentionally NOT stated as numbers — steps say "the pressure and hold time NFPA 13 and the AHJ set".

## Hazards
aerial_lift 1926.453(b)(2)(v) · fall 1926.501(b)(1) · ladder 1926.1053(b)(1) · trench_cavein 1926.652(a)(1) ·
struck_utility 1926.651(b)(1) · test_pressure 1926.102(a)(1) · hot_work 1926.352(a) · silica 1926.1153(c)(1) ·
power_tools 1926.300(b)(1) · eye_injury 1926.102(a)(1) · manual_handling 1926.250(a)(1) · chemical_exposure 1926.59.

## QA checklist (15)
drawings_approved, underground_flushed, thrust_restraint, backflow_heated, valves_supervised, fdc_drip, hangers_structure,
seismic_bracing, grooves_gauged, penetrations_firestopped, hydro_no_drop, heads_centered_listed, freeze_protected,
alarm_flow_tested, certificate_complete — mostly from UFGS 21 13 13 Part 3.

## Inspection / acceptance checkpoints
- underground: cover/thrust/restraint; flush + hydro witnessed; listed backflow accessible.
- rough_in: matches approved drawings; hangers + bracing + firestopped sleeves; hydro holding.
- final: heads correct + uncovered; waterflow/tamper signals at FACP; FDC + signs; main drain + certificate.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| P-FS-RISER | Wet riser trim package | EA | 450000 | 16 | 0 | 2 | estimate |
| P-FS-MAIN-SF | Feed/cross mains + hangers/bracing per SF floor | SF | 110 | 0.012 | 15 | 5 | estimate |
| P-FS-FDC | FDC + check + drip | EA | 120000 | 6 | 5000 | 2 | estimate |
| P-FS-BACKFLOW | DCDA 4–6 in. | EA | 650000 | 12 | 10000 | 0 | estimate |
| P-FS-TEST-SYS | Flush + hydro + acceptance per system | EA | 30000 | 10 | 15000 | 0 | estimate |
| P-FS-RES-SF | Residential 13D/IRC system per SF | SF | 110 | 0.017 | 0 | 5 | derived — FA-43 $1.00–1.50/SF (2008) escalated to ~$2.50/SF 2026, ~45/55 material/labor at ~$80/hr |

## Quantity rules
- `P-SPRINKLER-HEAD` = area_sf_sum × 0.0077, ceil (≈1 head / 130 SF planning estimate) — commercial/industrial/MF
- `P-FS-MAIN-SF` = area_sf_sum — commercial/industrial/MF
- `P-FS-RISER`, `P-FS-FDC`, `P-FS-BACKFLOW` = 1 each — commercial/industrial/MF
- `P-FS-TEST-SYS` = 1 — all incl. residential_sf
- `P-FS-RES-SF` = area_sf_sum — residential_sf

## Blueprint callouts
None this wave (FP-sheet discipline routing already exists in `extract.ts`).

## Open questions → REVIEW_QUEUE
- NFPA 13 chapter numbers assume the 2019/2022 layout; AHJs on older editions differ.
- Head density 1/130 SF is a planning estimate, not an NFPA spacing value.
- All commercial assembly costs are platform estimates.
- No dry-pipe (air compressor / dry valve) assembly yet; no fire pump (separate scope).
- AFSA site returned 403 to curl — not cited.
