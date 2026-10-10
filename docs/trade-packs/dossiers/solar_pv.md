# Dossier — `solar_pv` (Solar PV)

> Wave: w12 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/solar_pv.ts` · Status: draft
> Taxonomy: category `electrical_systems` · permit_trade `electrical` · phase `finishes_exterior` · CSI `26 31`

## Scope (2–4 sentences)
Designs, permits and installs grid-tied PV: residential roof-mount, commercial rooftop and ground-mount —
attachments/foundations, racking, modules, DC wiring + rapid shutdown, inverters, disconnects, utility
interconnection, labels, commissioning through utility permission to operate (PTO). Hand-offs: reroofing
(`roofing`), service/panel upgrades (`electrical`), batteries (`battery_storage`), EVSE (`ev_charging`).

## Existing coverage reconciled
- Hand recipe: none for the trade key; family electrical recipes (`task-buildout/electrical.ts`) are
  phase-keyed building wiring → pack is NEW-TRADE (`title_re` solar / `\bPV\b` / photovoltaic).
- Catalog codes already seeded: `E-PV-PANEL` (0037, module installed incl. racking share) — referenced
  from `quantity_rules`, not redeclared. `E-EVSE` belongs to ev_charging.
- Blueprint template tasks: none with `trade_type: 'solar_pv'`. `build-tasks.ts` emits "Solar PV install on
  Solar Ready zone" (trade `electrical`) when `has_solar_ready` — used as the rooftop recipe's example_title.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| solar_pv-ufgs-26-31-00 | UFGS 26 31 00 Facility-Scale Solar PV Systems (Feb 2026) | 1 | public_domain | steps, QA (de-energized wiring, disconnects, RSD, grounding, roof penetrations, labels, Voc/startup tests) |
| solar_pv-doe-homeowner-guide | DOE SETO Homeowner's Guide to Going Solar | 1 | gov_open | process framing (permit/inspection/utility) |
| solar_pv-irec-mip-2023 | IREC Model Interconnection Procedures 2023 | 4 | association_public | interconnection → PTO sequence |
| solar_pv-nabcep | NABCEP | 4 | association_public | reference only (certified installers / acceptance checks) |
| solar_pv-osha-green-solar | OSHA Green Job Hazards — Solar | 1 | gov_open | hazard families (403 to scripts) |
| nfpa-fa | NFPA 70 (690, 705, 300.5) | 3 | proprietary_ref_only | code refs |
| icc-pa | IRC R324, IBC 3111, IFC 1205 | 3 | proprietary_ref_only | code refs (code_type set) |
| ecfr-1926-c/e/i/k/m/p/x | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
`rooftop_pv` (title_re `solar|\bPV\b|photovoltaic`):
1. Confirm design, permit and utility application — NEC 690.4.
2. Lay out and flash roof attachments — IRC R324.4, R324.6; IBC 3111; IFC 1205.
3. Install rails and set modules — 690.43.
4. Wire DC circuits and rapid shutdown — 690.12, 690.31, 690.11. Gate: rough_in.
5. Set inverter, disconnects and grounding — 690.13, 690.15, 690.47.
6. Make the utility interconnection — 705.12 (load side, bus limits), 705.11 (supply side).
7. Label, commission and get PTO — 690.56, 690.53, 705.10. Gate: final.

`ground_mount_pv` (priority 10; ground-mount / carport / pole-mount / tracker / solar farm):
locate utilities + foundations → racking + modules (690.43) → trench + circuits (300.5, 690.31; gate
rough_in) → grounding + inverter + disconnects (690.47, 690.13) → interconnect, label, commission, PTO
(705.12, 705.10; gate final).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| roof_fall | pitched roof / edge fall | 1926.501(b)(13) | 4 |
| low_slope_edge | flat roof edge | 1926.501(b)(10) | 4 |
| skylight_hole | skylights / openings | 1926.501(b)(4)(i) | 4 |
| ladder | roof access ladder | 1926.1053(b)(1) | 3 |
| falling_objects | modules/tools dropping | 1926.501(c) | 3 |
| dc_shock | modules live in daylight | 1926.416(a)(1) | 4 |
| lockout | unexpected energizing | 1926.417(a) | 4 |
| arc_flash | panel tie-in | 1926.95(a) | 4 |
| heat | hot roofs / frames | 1926.21(b)(2) | 3 |
| utility_strike | ground-mount digging | 1926.651(b)(1) | 4 |
| power_tool | drills / saws | 1926.300(b) | 2 |

## QA checklist
15 items — plan match, attachments in rafters (safety), flashing, pathways clear (safety), clamp torque,
bonding (safety), connectors mated (safety), wire management, RSD installed (safety), disconnect lockable
(safety), interconnect per plan (safety), labels (safety), Voc + startup log, PTO before energizing,
burial depth. Sources: UFGS 26 31 00 §3.1–3.10, NEC (ref).

## Inspection / acceptance checkpoints
- rough_in: attachments/flashing, bonding, wire support + connectors, RSD devices, pathways, open trenches.
- final: plan match, disconnect + RSD switch, interconnection within bus limits, GEC, labels, off until PTO.

## Cost basis (all `estimate`, platform-baseline 2026)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| E-PV-INV-STRING | String inverter ≈7.6 kW | EA | 180000 | 4 | 0 | 0 |
| E-PV-MICROINV | Microinverter per module | EA | 18000 | 0.25 | 0 | 0 |
| E-PV-RSD | Module-level RSD device | EA | 5500 | 0.15 | 0 | 0 |
| E-PV-DISC-LABEL | AC disconnect + interconnect breaker + labels | EA | 35000 | 3 | 0 | 3 |
| E-PV-GROUND-KW | Ground-mount racking + foundations | KW | 35000 | 4 | 5000 | 2 |

No per-module racking/attachment line: existing `E-PV-PANEL` already carries a racking share.

## Quantity rules
- `E-PV-PANEL` = const 18 — residential_sf + `has_solar_ready` (≈7 kW placeholder).
- `E-PV-MICROINV` = const 18 — same scope (MLPE design default).
- `E-PV-DISC-LABEL` = const 1 — residential + `has_solar_ready`; and commercial/industrial.
- `E-PV-INV-STRING` = const 1 — commercial/industrial.

## Blueprint callouts (components)
None this wave (brief). The parser's `has_solar_ready` flag drives quantity rules.

## Open questions → REVIEW_QUEUE
- All 5 new assembly costs are platform estimates.
- `E-PV-PANEL` includes a racking share — confirm whether flashed attachments are inside it.
- Vocab: no post driver / pile driver equipment type (used skid_steer).
- has_solar_ready means a reserved zone, not a sold system — quantities only fire when a solar_pv task exists.
