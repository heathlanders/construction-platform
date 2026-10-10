# Dossier — `hauling` (Hauling / Dumpsters)

> Wave: w06 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/hauling.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `punch` · CSI `01 74 19`

## Scope
Supplies and services roll-off containers (spot, swap, final pull), hauls C&D debris to a licensed
landfill / transfer station / recycler, and delivers aggregate and fill by dump truck. Does NOT demolish
(→ `demolition`), remove asbestos or lead (→ `abatement`), or grade/place fill (→ `excavation`). No AHJ
permit path: the only permit is the municipal right-of-way permit for a container in the street.

## Existing coverage reconciled
- Hand recipe: none — `task-buildout/nopermit.ts` has no `hauling` case (falls to the generic step) → NEW-TRADE pattern, 3 recipes.
- Catalog codes already seeded: none with `G-HAUL-`. `EQUIP-DUMP_TRUCK` (day rate) exists — referenced in the `G-HAUL-LOAD-EA` note, not duplicated. `G-DEMO-SF` / `G-SITE-DEMO-SF` include their own haul-off and are untouched.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-o | 29 CFR 1926 Subpart O — Motor vehicles / mechanized equipment | 1 | public_domain | backing (601(b)(4)), dump body (600(a)(3)(i), 601(b)(10)), power lines (600(a)(6)), cab shield (601(b)(6)), tailgate (601(b)(12)), parking/chocks (600(a)(3)(ii)), lights near highway (600(a)(1)) |
| ecfr-1926-h | Subpart H — Materials handling, storage, disposal | 1 | public_domain | 1926.252 chutes / drop zones / oily waste; 1926.250(a)(1) secured stacking |
| ecfr-1926-g | Subpart G — Signs, signals, barricades | 1 | public_domain | 1926.200(g) traffic control devices per MUTCD |
| ecfr-1926-c | Subpart C — General | 1 | public_domain | 1926.25(a) housekeeping; 1926.21(b)(2) training (lifting, derived) |
| ecfr-1926-z | Subpart Z — Toxic substances | 1 | public_domain | 1926.1101(k) asbestos |
| hauling-ecfr-49-393-i (new) | 49 CFR 393 Subpart I — cargo securement | 1 | public_domain | covered/secured loads (393.100(b)(c)) |
| hauling-wi-dnr-banned (new) | WI DNR — Recyclable materials banned from disposal | 1 | gov_open | prohibited items |
| hauling-wi-dnr-cd-debris (new) | WI DNR — Managing C&D debris | 1 | gov_open | NR 500–538, clean-fill exemption, no burning, separation |
| hauling-wi-dnr-structures (new) | WI DNR — Handling waste from demolished structures | 1 | gov_open | hazardous items first, licensed transporter, Form 4500-113, no burying |
| abatement-wi-dnr-asbestos (existing) | WI DNR asbestos notification | 1 | gov_open | asbestos hazard |
| hauling-epa-cd-materials (new) | EPA — Sustainable management of C&D materials | 1 | gov_open | diversion / recycling streams |
| hauling-madison-sop (new) | City of Madison Street Occupancy Permit | 1 | gov_open | right-of-way dumpster permit (Dane County example) |
| platform-baseline | Platform baseline | — | platform_estimate | all costs |

## Work steps (→ pack recipes)
**roll_off_dumpster_service** (`dumpster|roll-off|waste container|construction waste|waste management`)
1. Size the container and pick the spot — ROW permit, overhead lines. QA container_sized, row_permit, placement_clearance.
2. Protect the surface and set the container — boards, backing alarm/spotter, street marking.
3. Load it right — heavy low, nothing above rim, no hazardous/banned, split recyclables, chute.
4. Swap before it overflows — ~3/4 full, tarp.
5. Final pull, tickets and cleanup.

**debris_haul_off** (`haul-off/away/out|debris removal|junk removal|clean-out|load-out|disposal`)
1. Sort and screen the debris · 2. Load the truck safely · 3. Cover and secure the load · 4. Deliver to the right facility and keep the ticket · 5. Leave the pickup area clean.

**aggregate_fill_delivery** (`deliver … gravel/stone/aggregate/fill/topsoil/sand`)
1. Mark the dump spot and the truck path · 2. Back in, dump and spread · 3. Check the ticket and clean the road.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| backing_truck | Backing roll-off / dump truck | 1926.601(b)(4) | 4 |
| raised_bed | Raised dump body / hoist frame | 1926.600(a)(3)(i) | 4 |
| overhead_lines | Bed/hoist contacting power lines | 1926.600(a)(6) | 4 |
| street_traffic | Container in street | 1926.200(g)(2) | 3 |
| chute_drop | Debris dropped from upper floors | 1926.252(a) | 3 |
| overfill | Overfilled / uncovered load | 1926.250(a)(1) (+49 CFR 393.100, derived) | 3 |
| loader_over_truck | Loading over the cab | 1926.601(b)(6) | 3 |
| tailgate | Tailgate release | 1926.601(b)(12) | 3 |
| rollaway | Parked truck on slope | 1926.600(a)(3)(ii) | 3 |
| hazardous_waste | Asbestos/lead/chemicals in C&D | 1926.1101(k) | 4 |
| manual_handling | Lifting debris | 1926.21(b)(2) (derived) | 2 |
| sharp_debris | Nails, glass, metal | 1926.25(a) | 2 |

## QA checklist
14 items: container_sized, row_permit, placement_clearance*, surface_protected, street_marked*, no_prohibited*,
not_overfilled*, covered_load*, recyclables_split, swap_scheduled, licensed_facility, tickets_kept, delivery_ticket,
site_restored (* = safety, ES pending).

## Inspection / acceptance checkpoints (permit_trade null → descriptive keys)
- `container_placement_check`: ROW permit, clearances, boards, street marking.
- `pre_pull_check`: rim level/weight, no banned items, tarp.
- `disposal_ticket_log`: ticket per haul, recycled vs landfilled tons, WI Form 4500-113 when applicable.

## Cost basis (all `platform-baseline`, confidence `estimate`)
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-HAUL-RO20-EA | 20 yd roll-off per haul | EA | 0 | 0.25 | 42500 | 0 | hauler haul charge excl. tonnage |
| G-HAUL-RO30-EA | 30 yd roll-off per haul | EA | 0 | 0.25 | 50000 | 0 | same |
| G-HAUL-RENT-DAY | Extra rental day | DAY | 0 | 0 | 1000 | 0 | typical extra-day rent |
| G-HAUL-DISP-TON | Tipping fee, mixed C&D | TON | 0 | 0 | 7000 | 0 | carried in equipment column so not taxed as material |
| G-HAUL-LOAD-EA | Dump-truck haul-off, hand loaded | EA | 0 | 2.0 | 17500 | 0 | truck+driver round trip; EQUIP-DUMP_TRUCK for all-day truck |

## Quantity rules
- `G-HAUL-RO30-EA` = const × 2 for `residential_sf` — clearly labeled allowance.
- `G-HAUL-DISP-TON` = const × 6 for `residential_sf` — ~3 t per 30 yd pull; replace with ticket tonnage.

## Blueprint callouts (components)
- None (none this wave; dumpster spots rarely appear on plans).

## Open questions → REVIEW_QUEUE
- All 5 costs are platform estimates; tune with WI hauler quotes and landfill tipping fees.
- No `roll_off_truck` equipment type in vocab — roll-off recipe recommends none; propose vocab add.
- Disposal fee is carried in `equipment_cost_cents` to avoid material tax — confirm convention.
- ROW permit source is a Madison example; other municipalities differ.
- ES pending human translation: 12 hazards (hazard + controls), 5 safety QA items, 5 inspection-checklist items.
