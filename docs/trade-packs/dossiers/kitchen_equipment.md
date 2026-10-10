# Dossier — `kitchen_equipment` (Commercial Kitchen Equipment)

> Wave: w13 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/kitchen_equipment.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `finishes_interior` · CSI `11 40`

## Scope (2–4 sentences)
Foodservice equipment contractor: supplies (or receives owner/vendor-furnished), sets, levels, anchors and seals
cooking line, worktables, sinks, dish machines and holding equipment; coordinates the rough-ins other trades make;
runs start-up, manufacturer demos and the health department pre-opening walk. Hand-offs: Type I hood / grease duct →
`kitchen_exhaust`; hood suppression → `fire_protection_special`; walk-in coolers/freezers → `cold_storage`; gas, water,
indirect waste, grease interceptor → plumbing / `gas_piping`; power → electrical; residential appliances → `appliances`.

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern, 2 recipes.
- Catalog codes already seeded: none for this trade (`P-FIX-KSINK` is a residential kitchen sink — not reused).
- Blueprint template tasks hitting this trade: none. `title_re` targets kitchen equipment / foodservice / commercial
  kitchen / dish machine / cook line / warewash.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| kitchen_equipment-fda-food-code-2022 | FDA Food Code 2022 | 1 | public_domain | spacing/sealing (4-402.11/12), certification (4-205.10), dish machine gauges + temps (4-204.115, 4-501.112), test kits (4-302.14), air gap (5-202.13), no direct sewer (5-402.11), grease trap access (5-402.12), handsinks (5-203.11), plans + preoperational inspection (8-201.11, 8-203.10) |
| kitchen_equipment-wi-atcp-75 | Wis. Admin. Code ATCP 75.075 Plan review | 1 | gov_open | plan approval before build/remodel; equipment layout + schedules required |
| kitchen_equipment-nsf-listings | NSF food equipment listing search | 4 | association_public | verifying sanitation listings (NSF/ANSI 2 text itself ref-only) |
| icc-pa | IPC 802.1.1, IFGC 409.5 | 3 | proprietary_ref_only | section + paraphrase only |
| ecfr-1926-c/d/e/f/h/j/k/o | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
Recipe `foodservice_equipment_install` (title_re kitchen equipment|food service|commercial kitchen|dish machine|cook line|warewash):
1. **Check rough-ins against the equipment schedule** — QA plan_approval_on_site, rough_in_match, interceptor_access.
2. **Receive, uncrate and stage** — QA nsf_listed.
3. **Set, level and space each piece** — Food Code 4-402.11/12. QA legs_or_sealed, cleaning_space, level_doors.
4. **Seal joints to walls and adjoining equipment** — QA wall_seal.
5. **Coordinate final utility connections** — IPC 802.1.1, IFGC 409.5, Food Code 5-202.13. QA indirect_waste_air_gap, gas_shutoff_leak, power_per_nameplate.
6. **Start up, demonstrate and pass pre-opening** — Gate `final`. Food Code 8-203.10, 4-205.10.

Recipe `dish_machine` (priority 10; dish machine|dishwasher|warewash): set/level + drain route (5-402.11) → connect hot
water/booster/power → verify gauges + sanitizing temps (4-204.115, 4-501.112), gate `final`.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| heavy_lift | moving heavy equipment | 1926.20(b)(1) | 3 |
| forklift | unloading pallets | 1926.602(d) | 4 |
| rigging | rigging through openings | 1926.251(a)(1) | 3 |
| storage_stack | crates tipping | 1926.250(a)(1) | 3 |
| sharp_edge | sheet-metal/banding cuts | 1926.95(a) | 2 |
| eye_flying | flying chips | 1926.102(a)(1) | 2 |
| electric_live | live junction boxes | 1926.416(a)(1) | 4 |
| lockout_tag | energized during connection | 1926.417(b) | 4 |
| hot_work | welding/grinding stainless | 1926.352(a) | 3 |
| chem_sealant | sealants, cleaners, dish chemicals | 1926.59 | 2 |
| burn_startup | hot surfaces/steam at start-up | 1926.95(a) | 3 |
| fire_startup | first light-off | 1926.150(c)(1) | 3 |

## QA checklist
15 items — see pack (3 safety: air gap, gas shutoff/leak, power per nameplate).

## Inspection / acceptance checkpoints
- `final`: approved layout, gas shutoffs/connectors/restraints, air gaps + backflow, hood approvals before light-off.
- `health_dept_preopening`: legs/sealing, handsinks, warewashing temps, holding temps, grease interceptor / no direct drains.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-KEQ-SET-EA | set/level/anchor one item | EA | 1500 | 3 | 0 | 5 | estimate |
| B-KEQ-WORKTABLE-EA | stainless worktable 30x72 | EA | 60000 | 1.5 | 0 | 0 | estimate |
| B-KEQ-SINK3-EA | 3-compartment sink | EA | 180000 | 3 | 0 | 0 | estimate |
| B-KEQ-SEAL-LF | equipment-to-wall sealing | LF | 150 | 0.08 | 0 | 10 | estimate |
| B-KEQ-STARTUP-EA | start-up + demo per item | EA | 0 | 2 | 0 | 0 | estimate |

## Quantity rules
- commercial only (fires only when the trade is on the schedule): SET ×10, SINK3 ×1, SEAL-LF ×40, STARTUP ×6 — all
  placeholders until the equipment schedule count is confirmed.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- UFGS 11 40 00 page returns 200 but content is script-gated — not used; verify and add if useful.
- IPC 802.1.1 / IFGC 409.5 numbering per 2021 editions — confirm against adopted edition.
- All 5 assembly costs are platform estimates.
- 12 hazards + 3 safety QA items pending human ES translation.
