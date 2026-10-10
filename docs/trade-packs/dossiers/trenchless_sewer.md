# Dossier — `trenchless_sewer` (Sewer & Drain — Trenchless / Lining / Jetting)

> Wave: w13 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/trenchless_sewer.ts` · Status: draft
> Taxonomy: category `plumbing_systems` · permit_trade `plumbing` · phase `sitework` · CSI `33 01 30`

## Scope (2–4 sentences)
Rehab or replacement of EXISTING building sewers / laterals and building drains without an open-cut trench:
recorded camera (CCTV) survey, hydro-jet and root cutting, CIPP or fold-and-form relining with connection
reinstatement, and static/pneumatic pipe bursting with HDPE. New open-cut laterals, water services and storm
leads belong to `site_utilities` (P-SU-*); public mains are heavy civil. Pavement restoration over pits reuses
P-SU-ROW-RESTORE-SF.

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: none with P-TS-; P-SU-* (site_utilities) and P-CLEANOUT referenced in notes, not duplicated.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| trenchless_sewer-icc-codenotes-716 | ICC CodeNotes — 2021 IPC 716 / IRC P3010 pipe bursting | 3/4 | association_public | bursting limits, video, HDPE SDR 17, cleanouts, test order |
| trenchless_sewer-icc-codenotes-717 | ICC CodeNotes — 2021 IPC 717 / IRC P3011 relining | 3/4 | association_public | relining limits, pre/post video, defects, data report, certification |
| icc-pa | ICC public access | 3 | proprietary_ref_only | section numbers (716, 717, 312.6, P2503.4, P3010, P3011) |
| trenchless_sewer-niosh-hhe-2018-0009 | NIOSH HHE 2018-0009-3334 (UV CIPP styrene) | 1 | public_domain | styrene controls, ventilation, gloves, respirators, noise |
| trenchless_sewer-epa-832f99032 | EPA 832-F-99-032 Trenchless Sewer Rehabilitation (archived) | 1 | public_domain | method descriptions, bypass, reinstatement |
| ecfr-1926-c/d/e/h/i/p/aa | 29 CFR 1926 subparts | 1 | public_domain | hazard OSHA refs |
| platform-baseline | The Jobsite baseline | — | platform_estimate | all assembly costs |

## Work steps (draft → pack recipes)
- `cipp_relining` (priority 10; CIPP / cured-in-place / trenchless / sewer or lateral lining / fold-and-form):
  survey (717.3, 717.3.1, 717.5) → stop/bypass flow + measure → wet-out + install (717.6, 717.7) → cure (717.7.1)
  → reinstate + cut ends → flush, flow test, post video, certification (717.8, 717.9, IRC P3011.8) **gate: final**.
- `pipe_bursting` (priority 20): survey (716.3, 716.2) → pits (Subpart P) → fuse HDPE + set rig (716.4) → burst/pull
  → tie-in, cleanouts, video then test (716.4, 312.6, IRC P2503.4) **gate: underground** → backfill + records **gate: final**.
- `camera_jetting` (priority 0; sewer camera / CCTV / hydro-jet / root cut): set-up → jet + root cut → recorded survey + report. No gate.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| styrene_vapor | resin/styrene vapor | 1926.55(a) | 3 |
| resin_skin | uncured resin skin/eye | 1926.95(a) | 2 |
| confined_space | manhole / deep pit entry | 1926.1203(a) | 4 |
| sewer_atmosphere | sewer gas in pit | 1926.651(g)(1)(i) | 4 |
| cave_in | pit cave-in (+ ladder 4 ft+) | 1926.652(a)(1) | 4 |
| hot_cure_burns | hot water/steam/fusion plate | 1926.95(a) | 3 |
| air_hose_whip | inversion/cure air hose | 1926.302(b)(7) | 3 |
| jetter_injection | high-pressure jet injection | 1926.28(a) | 3 |
| uv_light | UV light train | 1926.102(a)(1) | 2 |
| winch_cable | bursting cable/rod snap | 1926.251(a)(1) | 4 |
| noise | jetter/compressor/rig | 1926.52(d)(1) | 2 |
| biological | sewage contact | 1926.51(f)(1) | 2 |

## QA checklist
15 items: cleaned before video, pre-video content, defects ruled out, size limits, flow controlled, material
data report, connections reopened, post video after flow test, HDPE SDR 17, cleanouts added, burst video then
test, certification delivered, records to owner, ventilation/styrene (safety), pit protective system (safety).

## Inspection / acceptance checkpoints
- underground (bursting): video reviewed, ≤6 in., HDPE SDR 17 + fittings, cleanouts, test after video approval.
- final (relining): pre-video reviewed before permit, no prohibited defects, data report, post video, certification; pits restored.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| P-TS-CCTV-EA | Lateral camera inspection + report | EA | 1500 | 1.5 | 15000 | 0 | platform estimate |
| P-TS-JET-EA | Hydro-jet + root cutting | EA | 2000 | 2.5 | 20000 | 0 | platform estimate |
| P-TS-CIPP-LAT-LF | CIPP relining 4–6 in. | LF | 4500 | 0.6 | 2500 | 10 | platform estimate |
| P-TS-BURST-LF | Pipe bursting 4–6 in. HDPE SDR 17 | LF | 1200 | 0.5 | 3000 | 5 | platform estimate |
| P-TS-PIT-EA | Launch/receiving pit dig-protect-backfill | EA | 6000 | 6 | 45000 | 0 | platform estimate |

Public municipal bid tabs found (Valley/VRF 2025, Pleasant Grove 2023, Four Rivers 2023) are main-line (8 in.+)
CIPP and reconnection items — not comparable to private 4–6 in. laterals, so not used. EPA 1999 cost table is
1998 main-line dollars — not used.

## Quantity rules
None — this is repair/renovation of existing lines; no blueprint fact signals it and a `const` per building
type would add relining to every new-construction estimate.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- 2021 IPC 717.6 lists only fold-and-form (F1504/F1871); CIPP (F1216/F1743) relies on alternate-method approval or a later edition — confirm 2024 IPC 717.6 text.
- WI SPS 382/384 treatment of relining/bursting not verified (only TOC pages reachable) — no WI refs added.
- Exact 716.x subsection numbers for cleanouts and post-video in 2021 IPC (CodeNotes groups them under 716.4) — verify.
- Equipment vocab lacks sewer jetter, CCTV camera, CIPP boiler/steam/UV unit, bursting rig.
