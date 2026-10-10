# Dossier — `equipment_rental` (Equipment Rental)

> Wave: w23 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/equipment_rental.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `01 54`

## Scope (2–4 sentences)
Short-term rental of construction machines (MEWPs, telehandlers, forklifts, skid steers, excavators,
compactors, generators) as seen from the job: receive and check the machine, operate it only with
authorized operators, keep the agreement and insurance current, and call it off-rent. Rented machines are
tracked in the asset module (`company_assets.ownership_type='rented'` + `asset_rental_details`; pre-use
checks as `asset_inspections` type `pre_use`; meters in `asset_meter_readings`). NOT this trade: crane
service with operator (`crane_service`), scaffolding (`scaffolding`), owned-fleet maintenance (asset module).

## Existing coverage reconciled
- Hand recipe: none → services pattern, `recipes: []`; no template tasks.
- Catalog: none added (services wave). `EQUIP-*` day-rate rows already price equipment on estimates.
- Equipment vocab: not used (services rule).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-o | 29 CFR 1926 Subpart O | 1 | public_domain | 600(a)(3), 600(a)(6), 601(b)(4)/(14), 602(a)(9), 602(c)(1)(i), 602(d) |
| ecfr-1926-l | 29 CFR 1926 Subpart L | 1 | public_domain | 1926.453(b)(2)(i)–(vii) aerial lifts |
| equipment_rental-ecfr-1910-178 | 29 CFR 1910.178 | 1 | public_domain | (l) operator training/evaluation, (l)(4)(iii) 3-yr eval, (q)(7) pre-service exam |
| equipment_rental-osha-aerial-fs | OSHA Aerial Lifts fact sheet | 1 | public_domain | framing only (403 to scripts) |
| equipment_rental-ara-rentalu | ARA RentalU | 3 | association_public | MEWP/forklift/driver training exists in rental industry |
| equipment_rental-ansi-a92 | ANSI/SAIA A92.22/.24 | ref | proprietary_ref_only | manual on machine, training/familiarization, periodic inspection (concept) |
| platform-baseline | — | — | platform_estimate | rental-desk practice (walk-around, off-rent, meters, cost coding) |

## Work steps
None — no permit path, no recipes.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| aerial_tip_over | Lift tip-over (outriggers/slope/soft ground) | 1926.453(b)(2)(vii) | 4 |
| power_line_contact | Overhead line contact | 1926.600(a)(6) | 4 |
| platform_fall | Fall/ejection from boom platform | 1926.453(b)(2)(v) | 4 |
| untrained_forklift | Untrained forklift/telehandler operator | 1926.602(d) | 3 |
| trailer_loading | Loading/unloading, couplings | 1926.601(b)(14) | 3 |
| backing_struck | Backing equipment/trucks | 1926.602(a)(9)(ii) | 4 |
| raised_attachment | Crush under raised bucket/blade | 1926.600(a)(3)(i) | 3 |

## QA checklist (deliverables)
Delivery walk-around + photos · pre-use check each shift · manual + decals · operator authorization/training
records · agreement on file · COI · meter/fuel at delivery and pickup · recall/annual-inspection status ·
off-rent number + pickup photos · rental charges cost-coded.

## Inspection / acceptance checkpoints
- delivery_receipt: area/power lines, ticket + photos, manual/alarm, asset entry.
- return_off_rent: staging, off-rent number + meters, return photos.

## Open questions → REVIEW_QUEUE
- americanrental.org is a parked domain; ARA is ararental.org — only RentalU page verified, no public ARA safety guide text used.
- OSHA aerial lift fact sheet 403s to scripts — used for framing only.
- 1926.453 applies to vehicle-mounted/boom platforms; scissor lifts fall under Subpart L scaffold rules (1926.451) — hazards framed for boom lifts.
- Rental-desk practices (walk-around, off-rent, damage waiver) are platform-baseline, no public primary source.
