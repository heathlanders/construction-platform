# Dossier — `security_access` (Security / Access Control / CCTV)

> Wave: w12 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/security_access.ts` · Status: draft
> Taxonomy: category `electrical_systems` · permit_trade `electrical` · phase `rough_in` · CSI `28`

## Scope (2–4 sentences)
Electronic security: card/keypad access control on doors (reader, REX, door contact, electric strike or
lock power), intrusion alarm panels and sensors, and CCTV (cameras + NVR). Coordinates electrified
locks with the door hardware installer so every exit keeps free egress, then programs, acceptance-tests
and trains the owner. Hands off: structured cabling / data drops / media panel (`low_voltage`), fire
alarm (`fire_alarm`), 120 V feeds (electrician), lock hardware supply (`doors_hardware`).

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern; without the pack the electrical family
  recipes rendered power-wiring steps.
- Catalog codes already seeded: `E-SEC-CAMERA` (0037) — referenced from quantity_rules, not redeclared.
  `E-DATA-DROP` / `E-LV-*` belong to low_voltage — not duplicated.
- Blueprint template tasks: `Data, CCTV & access control rough-in` (industrial.ts, rough_in) →
  recipe `security_rough_in` (example_title is this exact title).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| security_access-ufgs-28-10-05 | UFGS 28 10 05 Electronic Security Systems (May 2024) | 1 | public_domain | install steps, bushings, no coax splices, bonding/surge, pre-power checks, EOL/MOV, fail-safe/secure, training |
| security_access-ufgs-28-08-10 | UFGS 28 08 10 ESS Acceptance Testing (Aug 2023) | 1 | public_domain | pre-acceptance + acceptance test, day/night camera views, failure log |
| security_access-ul-294 | UL 294 Access Control System Units | 3 | proprietary_ref_only | listed electric locking hardware (ref) |
| security_access-ul-681 | UL 681 Burglar and Holdup Alarm Systems | 3 | proprietary_ref_only | install standard named by UFGS (ref) |
| icc-pa | ICC public access — IBC 1010.2 | 3 | proprietary_ref_only | egress door operation / special locking |
| nfpa-fa | NFPA free access — NFPA 70 Art. 725/722/300.21, NFPA 101 7.2.1.6 | 3 | proprietary_ref_only | code refs |
| ecfr-1926-c/d/e/i/k/l/m/x/z | 29 CFR 1926 subparts | 1 | public_domain | hazards (incl. 1926.34(a) egress, 1926.417(b) tagging) |

## Work steps (draft → pack recipes)
`security_rough_in` (title_re cctv|camera|access control|security|intrusion…):
1. **Lay out devices and coordinate door hardware** — IBC 1010.2, NFPA 101 7.2.1.6. QA egress_free, lock_fail_mode.
2. **Set boxes, pathways and frame preps** — NEC 300.21. QA conduit_bushed, firestop_rated.
3. **Pull device and composite cable** — NEC Art. 725, Art. 722. Gate rough_in.
4. **Firestop and walk the rough-in** — Gate cover.

`security_trim_commissioning` (priority 10; trim|program|commission|acceptance|test|activat|turnover|training):
1. Mount controllers, power supplies and batteries. 2. Terminate locks, readers, sensors and cameras.
3. Program the system and aim cameras. 4. **Test every door, egress path and camera** — IBC 1010.2, NFPA 101; gate final.
5. Train the owner and hand over — gate final.

## Hazards (draft → pack hazards)
12: ladder 1926.1053(b)(13) · fall_edge 1926.501(b)(1) · aerial_lift 1926.453(b)(2)(v) · electrical_contact
1926.416(a)(1) · lockout_tag 1926.417(b) · cord_shock 1926.404(b)(1) · egress_lock_in 1926.34(a) · attic_heat
1926.21(b)(2) · silica 1926.1153 · power_tool 1926.300(b) · eye_cut 1926.95(a) · chem 1926.59.

## QA checklist
16 items; 7 safety (egress_free, fire_alarm_release, lock_fail_mode, cable_listed_space, separation_power,
firestop_rated, bonding_surge) → ES pending human translation.

## Inspection / acceptance checkpoints
- rough_in: cable listing/separation, firestop, frame preps. cover: boxes + cable labeled before drywall.
- final: free egress (power on/off/system offline), fire alarm release + delayed-egress signage, power supplies, acceptance log.

## Code numbering notes
- IBC door-operation subsections renumber between editions (2021: 1010.2.11 hardware release, 1010.2.12
  sensor release; 2024 per DHI/iDigHardware: 1010.2.10 / 1010.2.11 / 1010.2.12 delayed egress) — pack cites
  the stable parent **1010.2** only.
- NEC 2023 reorganized power-limited circuits: Art. 722 (cables), 724 (Class 1), 725 (Class 2/3). Pack cites
  article level only (Art. 725, Art. 722), no subsection numbers.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| E-SEC-DOOR | access-controlled door (reader/REX/contact/strike/cable) | EA | 110000 | 8 | 0 | 3 | platform-baseline estimate |
| E-SEC-CONTROLLER | 2–4 door panel + lock PSU + batteries | EA | 180000 | 6 | 0 | 0 | estimate |
| E-SEC-INTRUSION-PANEL | panel + keypad + siren + cell communicator | EA | 60000 | 6 | 0 | 0 | estimate |
| E-SEC-SENSOR | wired contact / PIR point | EA | 4500 | 0.75 | 0 | 5 | estimate |
| E-SEC-NVR | 16-ch PoE NVR + storage | EA | 250000 | 4 | 0 | 0 | estimate |

## Quantity rules
- commercial/industrial: E-SEC-CONTROLLER const 1 · E-SEC-DOOR doors × 0.15 ceil · E-SEC-NVR const 1 ·
  E-SEC-CAMERA (existing) area_sf_sum × 0.0002 ceil.
- residential_sf: E-SEC-INTRUSION-PANEL const 1 · E-SEC-SENSOR const 8.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All 5 costs are platform estimates.
- Lock hardware (electrified locksets/maglocks/power transfer hinges) split between this trade and doors_hardware — scope boundary for estimating.
- No vocab additions needed (boom_lift / scissor_lift used).
