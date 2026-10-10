# Dossier — `battery_storage` (Battery Energy Storage (ESS))

> Wave: w12 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/battery_storage.ts` · Status: draft
> Taxonomy: category `electrical_systems` · permit_trade `electrical` · phase `rough_in` · CSI `26 33`

## Scope (2–4 sentences)
Installs listed battery energy storage systems: residential wall/floor batteries (Powerwall / Enphase IQ class)
with a backup gateway and backup-loads panel, and small commercial battery cabinets. Covers siting checks,
mounting, vehicle impact protection, wiring, labeling, commissioning, backup test and utility notification.
PV arrays (`solar_pv`), service upgrades (`electrical`), generators (`generators`) and bollard supply
(`B-MISC-BOLLARD-EA`, misc metals) are hand-offs.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → pack is a NEW-TRADE recipe (`ess_install`, title_re `battery|\bESS\b|energy storage|powerwall`).
- Catalog codes already seeded: `E-SUBPANEL-100` (referenced for the backup-loads panel), `B-MISC-BOLLARD-EA` (bollards — referenced in text, not re-declared). No ESS codes existed.
- Blueprint template tasks hitting this trade: none. Blueprint flag `has_ess` (parse-sheets.ts) drives quantity rules.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| battery_storage-doe-compliance-guide | DOE/PNNL/Sandia ESS Guide for Compliance with Safety Codes and Standards (2016) | 1 | gov_open | documentation/commissioning approach |
| battery_storage-osti-plan-review | ESS Safety: Plan Review and Inspection Checklist (OSTI 1365458) | 1 | gov_open | inspection/placard items |
| battery_storage-nfpa-855 | NFPA 855 | 3 | proprietary_ref_only | ref only |
| battery_storage-ul-9540 | UL 9540 / 9540A overview | 3 | proprietary_ref_only | listing ref |
| icc-pa | IRC R328.2/.4/.7/.8, IFC 1207 | 3 | proprietary_ref_only | siting, impact, fire detection refs |
| nfpa-fa | NEC 110.26, 480, 705, 705.12, 706, 706.7, 706.15 | 3 | proprietary_ref_only | wiring/disconnect/commissioning refs |
| battery_storage-tesla-library | Tesla Energy Library | 5 | manufacturer_public | install practice |
| battery_storage-enphase-iqb5-qig | Enphase IQ Battery 5 Quick Install Guide (distributor mirror) | 5 | manufacturer_public | two-person lift, blocked studs, 36 in. front clearance, vehicle path, DC switch/app commissioning |
| ecfr-1926-c/e/f/i/k/x/z | 29 CFR 1926 (incl. 1926.441 batteries) | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
1. **Confirm the unit, its listing and the location** — listing, kWh per space, allowed location, front clearance. Code: IRC R328.2, R328.4; IFC 1207; NFPA 855.
2. **Mount the battery and protect it from vehicles** — blocked studs/masonry/pad, two-person lift, bollards in driving path. Code: IRC R328.8.
3. **Wire the battery, gateway and backup-loads panel** — LOTO, circuits moved, maker diagram, bonding. Gate: rough_in. Code: NEC 706, 706.15, 705.12, 480.
4. **Label the system and add fire detection** — placards; smoke/heat alarm. Code: IRC R328.7.
5. **Commission, test backup and hand over** — app commissioning, outage test, utility paperwork. Gate: final. Code: NEC 706.7, 110.26.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| live_dc | battery always energized | 1926.416(a)(1) | 4 |
| loto | re-energizing | 1926.417(b) | 4 |
| arc_flash | landing conductors near energized service | 1926.416(a)(3) | 4 |
| thermal_fire | damaged module fire/toxic gas | 1926.150(a)(1) | 4 |
| electrolyte | chemical burns | 1926.441(a)(5) | 3 |
| battery_gas | vented-battery gas | 1926.441(a)(2) | 3 |
| heavy_lift | 100+ lb units | 1926.20(b) | 3 |
| silica | coring for stands/bollards | 1926.1153 | 3 |
| ladder | 1926.1053(b)(1) | 3 |
| cord_shock | 1926.404(b)(1) | 3 |
| eye_flying | 1926.102(a)(1) | 2 |
| power_tool | 1926.300(b) | 2 |

## QA checklist
15 items — listing, location, kWh per space, clearance, mount, impact protection, circuits moved, torque,
disconnect accessible, working space, placards, fire detection, backup test, commissioning record, utility notified.
7 safety items pending human ES.

## Inspection / acceptance checkpoints
- rough_in: listing/kWh, location, impact protection, wiring per diagram + bonding
- service: utility connection per plans, gateway listed
- final: disconnect accessible + marked, placards, fire detection, working space, commissioning report

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| E-ESS-BATT-RES-EA | ≈13.5 kWh home battery, **unit included**, mount + battery circuit | EA | 950000 | 8 | 0 | 2 | platform estimate 2026 |
| E-ESS-GATEWAY-EA | backup gateway at service | EA | 120000 | 5 | 0 | 3 | platform estimate |
| E-ESS-LOADS-MOVE-EA | move ≈8 circuits to backup panel (panel = E-SUBPANEL-100) | EA | 15000 | 4 | 0 | 5 | platform estimate |
| E-ESS-COMMISSION-EA | commissioning, backup test, placards, utility paperwork | EA | 6000 | 3 | 0 | 0 | platform estimate |

## Quantity rules
All scoped `facts_any: ['has_ess']` + `residential_sf`, const 1: E-ESS-BATT-RES-EA, E-ESS-GATEWAY-EA, E-SUBPANEL-100 (existing), E-ESS-LOADS-MOVE-EA, E-ESS-COMMISSION-EA.

## Blueprint callouts (components)
- none this wave (flag `has_ess` already exists).

## Open questions → REVIEW_QUEUE
- 12 hazards + 7 safety QA + inspection checklist items need human ES.
- All 4 costs `estimate`; battery material varies widely by brand.
- `has_ess` regex `\bESS\b` may fire on unrelated text — quantities are assumptions to confirm.
- Enphase source is a distributor mirror (enphase.com 403s scripts); Tesla source is the library index.
- Commercial BESS (cabinet/container) has no own recipe or assembly; only forklift equipment hint.
