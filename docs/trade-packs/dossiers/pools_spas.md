# Dossier — `pools_spas` (Pools / Spas)

> Wave: w17 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/pools_spas.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `sitework` · CSI `13 11`

## Scope
Residential in-ground pools and spas: permit/layout, excavation, steel + plumbing + bonding, vinyl-liner or fiberglass shell set, equipment pad, drain-cover and barrier checks, fill, startup, owner orientation. NOT: gunite/shotcrete shell (shotcrete pack `pool_shell`, B-SHOT-*), barrier fence/gate (fencing pack `pool_barrier_fence`, B-FNC-POOLGATE-HW-EA), pool electrical hookup (electrician), decking/coping beyond coordination.

## Existing coverage reconciled
- Hand recipe: none → NEW-TRADE pack, 3 recipes (priority: prefab shell 10 > equipment/startup 5 > layout/dig/steel 0).
- Catalog codes already seeded: B-SHOT-*, B-FNC-POOLGATE-HW-EA (not duplicated).
- Blueprint template tasks: none.

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| pools_spas-15usc8003 | 15 USC 8003 VGB Act drain cover standard | 1 | public_domain | drain-cover QA |
| pools_spas-cfr-16-1450 | 16 CFR 1450 | 1 | public_domain | drain cover conformity |
| fencing-cpsc-362 | CPSC Pub 362 barriers | 1 | public_domain | barrier/alarm QA |
| ecfr-1926-p/m/e/k/q/d/z/cc/c | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| pools_spas-phta-standards | PHTA / ANSI standards | 4 | proprietary_ref_only | named only |
| icc-pa / nfpa-fa | ISPSC 305 / NEC 680.26 | 3 | proprietary_ref_only | code refs |

## Work steps
Recipe `pool_layout_dig_steel` (3): permit/layout/locate; excavate + guard open dig; steel/plumbing/bonding [gate foundation, NEC 680.26].
Recipe `pool_shell_prefab` (3): base; set shell/liner; plumb/bond/backfill [gate foundation].
Recipe `pool_equipment_startup` (4): pad + equipment; deck/coping/barrier coordination (ISPSC 305.2); fill/startup/chemistry; final + owner orientation [gate final, ISPSC 305.3, NEC 680.26].

## Hazards
12 (cave-in, utility, overhead lines, dig-edge fall/public entry, drowning, struck-by, crane pick, rebar, shock, chemicals, silica, dig egress) — refs 1926.652(a)(1), .651(c)(2)/(b)(1)/(e), .1408(a), .501(b)(7), .106(a), .1419(a), .701(b), .404(b)(1), .59, .1153.

## QA / checkpoints
19 QA items (8 safety); inspection checklists for `foundation` (pre-cover steel/bonding/drain) and `final` (barrier, gate, alarms, bonding).

## Cost basis
All six B-POOL-* assemblies are `platform-baseline` estimates (vinyl package, fiberglass set, equipment pad, VGB drain set, bonding set, safety cover).

## Quantity rules
None — blueprint facts have no pool token/fixture; adding one needs a component (not this wave).

## Open questions → REVIEW_QUEUE
- ISPSC/NEC section numbering by edition; IRC Appendix AG not cited (could not verify numbering).
- Pre-pour bonding inspection mapped to building gate `foundation`.
