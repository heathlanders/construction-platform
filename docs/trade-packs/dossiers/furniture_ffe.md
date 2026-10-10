# Dossier — `furniture_ffe` (Furniture / FF&E Installation / Seating)

> Wave: w16 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/furniture_ffe.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `null` · phase `finishes_interior` · CSI `12`

## Scope (2–4 sentences)
Receives, inventories, stages and installs furniture, fixtures and equipment: systems-furniture workstations
(panels/spines, worksurfaces, storage), freestanding office furniture and fixed audience (auditorium/lecture)
seating — frequently owner-furnished, contractor-installed (OFCI). Does NOT make hardwired power connections
(licensed electrician — `electrical`), pull data cable (`low_voltage`), or build casework (`millwork`,
`cabinetry`, `lab_casework`). No AHJ permit path → no gates, no code_refs; owner/GC checkpoints in
`inspection_checklists`.

## Existing coverage reconciled
- Hand recipe: none (not in HAND_RECIPE_KEYS) → NEW-TRADE pattern, 2 recipes.
- Catalog codes already seeded: none with `G-FFE-` (grep of prisma/migrations).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| furniture_ffe-ufgs-12-59-00 | UFGS 12 59 00 Systems Furniture (Aug 2026) | 1 | public_domain | delivery/storage, install (level/plumb/attach), electrician hardwire + 100% circuit test, cleaning |
| furniture_ffe-ufgs-12-61-13 | UFGS 12 61 13 Upholstered Audience Seating (Aug 2020) | 1 | public_domain | examine floors/risers, radial standards layout, 20 in. seat rule, storage ≥60°F, cleaning |
| millwork-access-board-ada (reused) | 2010 ADA Standards text (Access Board) | 1 | public_domain | 221.4, 226.1, 802.1.2–802.1.5, 802.3.1, 802.4, 902.3 |
| furniture_ffe-bifma-ref | ANSI/BIFMA X5.5/X5.6/X5.9 | 3 | proprietary_ref_only | named only (site 403) |
| icc-pa (reused) | IBC 1029 assembly aisles | 3 | proprietary_ref_only | checklist ref only |
| ecfr-1926-c/e/h/i/k/m/o/x/z (shared) | 29 CFR 1926 | 1 | public_domain | hazards (1926.250 + 1926.602 text checked on law.cornell.edu) |
| platform-baseline | — | — | platform_estimate | all costs |

Not used: 16 CFR 1261 (STURDY Act) — clothing storage units, not office FF&E. Hussey Seating downloads page
and Steelcase spec guide — reachable but no specific installation data was extracted; omitted.

## Work steps (draft → pack recipes)
`systems_office_furniture` (title_re furniture / FF&E / workstation / cubicle / systems furniture / office systems):
1. Receive, inventory and record damage — QA inventory_po.
2. Stage and protect — QA storage_conditions.
3. Lay out and set panels or spines — QA layout_plan, level_aligned, tall_units_secured.
4. Coordinate power and data with the electrician — QA electrical_test_record, cables_managed.
5. Hang worksurfaces and storage; set accessible stations — QA brackets_seated, accessible_worksurface.
6. Punch, clean and remove debris — QA punch_closed.

`fixed_audience_seating` (priority 10; fixed seating / auditorium / audience / theater / lecture hall / tiered seating):
1. Examine floors and risers; verify the layout. 2. Lay out standards on radial row lines. 3. Drill and anchor
the standards. 4. Hang seats and backs; aisle lights by the electrician. 5. Set accessible seating and clear the
aisles. 6. Number rows and seats, clean and punch.

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| heavy_lift | manual handling of panels/standards | 1926.20(b)(1) | 2 |
| tip_over | tall storage / unbraced panels tipping | 1926.20(b)(1) | 3 |
| material_stacks | stacked cartons collapsing | 1926.250(a)(1) | 2 |
| floor_load | overloading floor with staged freight | 1926.250(a)(2)(i) | 3 |
| dock_plate | dock plate slipping under pallet jack | 1926.250(d)(2) | 3 |
| forklift_freight | forklift unloading | 1926.602(c)(1)(i) | 3 |
| live_power | base feeds / aisle lights | 1926.416(a)(1) | 4 |
| power_tool | drills/drivers | 1926.302(a)(1) | 2 |
| stepladder | top-step falls | 1926.1053(b)(13) | 2 |
| riser_edge | open riser/balcony edges | 1926.501(b)(1) | 4 |
| silica_drilling | concrete anchor drilling | 1926.1153(c)(1) | 3 |
| housekeeping | packaging debris in exits | 1926.250(c) | 2 |

## QA checklist
15 items — see pack (7 safety, ES pending).

## Inspection / acceptance checkpoints
receiving_inspection · layout_verify · electrical_coordination · accessibility_check (ADA 221/226/802/902) ·
egress_aisle_check (IBC 1029 ref) · punch_turnover.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| G-FFE-WKST-EA | systems workstation install (OFCI) | EA | 2500 | 3.0 | 0 | 0 | estimate — material = hardware only, furniture owner-furnished |
| G-FFE-PWR-EA | base-feed whip + connection + test (electrician) | EA | 4500 | 0.75 | 0 | 5 | estimate |
| G-FFE-SEAT-EA | fixed audience seat on anchored standards | EA | 32000 | 0.75 | 0 | 0 | estimate — mid-grade furnished seat; zero material if OFCI |
| G-FFE-RECV-TRK | receiving/inventory/staging per truckload | TRK | 5000 | 8.0 | 7500 | 0 | estimate |
| G-FFE-MOVE-HR | punch/move/reconfiguration per crew-hour | HR | 0 | 2.0 | 0 | 0 | estimate |

## Quantity rules
None — blueprint facts carry no furniture counts; a const allowance would add a line to every commercial estimate.

## Blueprint callouts (components)
None this wave.

## Open questions → REVIEW_QUEUE
- All 5 costs are platform estimates; OFCI vs furnished material basis needs owner review.
- Equipment vocab lacks pallet_jack / dolly (forklift rule dropped — task-level match attached it to every step).
- BIFMA site unreachable to scripts (reference only).
