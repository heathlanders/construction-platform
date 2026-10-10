# Dossier — `av_automation` (AV / Home Automation)

> Wave: w12 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/av_automation.ts` · Status: draft
> Taxonomy: category `electrical_systems` · permit_trade `electrical` · phase `finishes_interior` · CSI `27 41`

## Scope (2–4 sentences)
Designs, prewires, installs and programs audio-video and automation systems: home theater, distributed
audio, TVs/projectors, conference-room AV, lighting/shade/climate keypads and touch panels; then
commissions and trains the owner. Structured cabling (data drops, media panel, device prewire, cert
testing) is the `low_voltage` pack; line-voltage circuits for the rack and displays are the electrician's.
Fire alarm, security and BMS are their own trades.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern; without the pack the electrical family recipe rendered power-wiring steps.
- Catalog codes already seeded: none `E-AV-*`. `E-DATA-DROP`, `E-LV-PREWIRE`, `E-LV-MEDIA-PANEL`, `E-LV-COAX-DROP`, `E-LV-WAP` belong to low_voltage — not duplicated or re-quantified here.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| av_automation-ufgs-27-41-00 | UFGS 27 41 00 Audio-Visual Systems (Feb 2026) | 1 | public_domain | steps, QA (3.1–3.13): supports ×5, rack thermal 85°F, rack bonding, signal-level separation, "AV Only", labeling, testing, commissioning, training, closeout |
| av_automation-sanus-vlt5 | SANUS VLT5 install manual | 5 | manufacturer_public | display mount: stud centers / masonry only, never drywall alone, wall rated 5× TV+mount, lags tight, locks engaged, two-person lift |
| av_automation-avixa-standards | AVIXA standards | 4 | proprietary_ref_only | named only (rack build, labeling, verification, audio coverage) |
| av_automation-cedia | CEDIA | 4 | proprietary_ref_only | named only (residential practice) |
| nfpa-fa | NFPA 70 Art. 640 (640.5, 640.6, 640.9, 640.10, 640.21, 640.25), 725, 800.133, 300.21 | 3 | proprietary_ref_only | code refs (paraphrase) |
| ecfr-1926-c/e/i/k/l/m/x/z | 29 CFR 1926 | 1 | public_domain | hazards (1926.21(b)(2), 1926.101(a), 1926.102(a)(1), 1926.300(b), 1926.404(b)(1), 1926.416(a)(1), 1926.417(b), 1926.453(b)(2)(v), 1926.501(b)(1), 1926.1053(b)(13), 1926.1153) |

Note: the requested "UFGS 27 41 16" does not exist as a UFGS — 27 41 16 is a DHA criteria section; UFGS 27 41 00 is the public DoD AV spec and is used instead.

## Work steps (draft → pack recipes)
- `av_prewire_rough_in` (title_re audio/AV/home theater/automation/smart home/distributed audio/conference room/speaker/prewire): confirm design + rack elevation → backing + speaker/box brackets (640.25) → pull speaker/video/control home-run (640.6, 640.9, 725) → protect, firestop, rough-in gate (300.21, 800.133).
- `av_trim_commissioning` (priority 10; trim/rack/mount/program/commission/training/final): rack build + bond (640.21) → mount displays into structure → trim speakers/keypads (640.25) → program + levels → commission, train, hand over — final gate (640.5, 640.10).
- `conference_room_av` (priority 5; conference/huddle/boardroom/classroom/meeting): verify room → rough-in (gate rough_in) → install/program/commission (gate final).

## Hazards
ladder (X), fall_edge (M), aerial_lift (L), heavy_lift (C 1926.21(b)(2) + mount instructions), electrical_contact, lockout (1926.417(b)), cord_shock (K), noise (1926.101(a)), attic_heat (C), silica (Z), power_tool (I), eye_cut (E). 12, all ES pending.

## QA checklist
15 items; 7 safety (backing, mount into structure, support ×5, fire-rated speakers, separation from power, firestop, rack bonding) — ES pending; 8 non-safety translated.

## Inspection / acceptance checkpoints
- rough_in: backing, rated-ceiling speaker enclosures, power separation, support/protection, firestop.
- final: mounts secured/locked, rack bonding + cords, ceiling access, pool-area audio GFCI, test/training/docs.

## Cost basis (all platform-baseline estimates, 2026 national)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| E-AV-SPK-PAIR | In-ceiling/in-wall speaker pair | EA | 32000 | 3 | 0 | 3 |
| E-AV-TV-MOUNT | TV mount + backing + recessed box | EA | 21000 | 2.5 | 0 | 2 |
| E-AV-RACK | Rack build (gear excluded) | EA | 110000 | 8 | 0 | 0 |
| E-AV-PROGRAM | Programming, commissioning, training | EA | 0 | 16 | 0 | 0 |
| E-AV-CONF-ROOM | Conference room AV allowance | EA | 1400000 | 32 | 0 | 2 |

## Quantity rules
- `E-AV-SPK-PAIR` = rooms × 0.33 ceil (residential_sf/mf)
- `E-AV-TV-MOUNT` = rooms × 0.25 ceil (residential_sf/mf)
- `E-AV-RACK`, `E-AV-PROGRAM` = const 1 (residential_sf)
- `E-AV-CONF-ROOM` = const 1 (commercial)

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- 12 hazards + 7 safety QA need human ES.
- All 5 costs are estimates; the conference-room allowance varies widely.
- NEC 2023 reorganized Class 2 into Arts. 722/724/725 — `725` cited generically as low_voltage does.
- Section 640.22 (rack wiring) not cited — could not verify wording.
