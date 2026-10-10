# Dossier — `signage` (Signage)

> Wave: w16 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/signage.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `finishes_exterior` · CSI `10 14`

## Scope (2–4 sentences)
Furnishes and installs interior ADA room-identification and wayfinding signs, exterior wall signs / channel letters,
and freestanding monument and pylon signs including their engineered footings. Owns the local sign permit, layout,
anchorage and the sign's own listing. Hand-offs: the sign branch circuit and disconnect wiring are the electrician's
(the pack calls them out because they gate the final); blocking is framing/drywall; site concrete beyond the sign pier is concrete.

## Existing coverage reconciled
- Hand recipe: none → pack is a NEW trade (3 recipes, title-matched).
- Catalog codes already seeded: none with `B-SGN-`.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| signage-access-board-ch7 | Access Board Guide, Ch. 7 Signs | 1 | public_domain | tactile/braille/height/location, QA |
| plumbing-ada-2010 | 2010 ADA Standards (DOJ) | 1 | public_domain | 216.2 / 703 refs |
| signage-ufgs-10-14-00-10 | UFGS 10 14 00.10 Exterior Signage (Aug 2026) | 1 | public_domain | wind design, foundation embed, anchorage, protection/cleaning |
| signage-ufgs-10-14-00-20 | UFGS 10 14 00.20 Interior Signage (Aug 2020) | 1 | public_domain | placement schedule, blocking, finish-first, glass back-up plates |
| signage-madison-sign-permit | City of Madison — Sign Permits | 2 | gov_open | local permit checklist (example) |
| signage-ul-48 | UL 48 Electric Signs | ref | proprietary_ref_only | listing concept only |
| icc-pa | ICC codes | ref | proprietary_ref_only | IBC 3107, 1807.3, Appendix H109 |
| nfpa-fa | NFPA 70 | ref | proprietary_ref_only | NEC 600.3/600.4/600.5/600.6 |
| concrete_repair_lifting-call811 | 811 Before You Dig | 2 | association_public | locate QA |
| ecfr-1926-{c,e,i,k,l,m,p,q,x,z,cc} | 29 CFR 1926 | 1 | public_domain | hazards |

## Work steps (draft → pack recipes)
**interior_ada_signs** (priority 10): schedule check → layout latch side, 48–60 in. to baselines (ADA 703.4.1/703.4.2) → mount after finishes, anchorage by substrate → tactile/braille/visual check + photos (gate final; ADA 216.2, 703.3, 703.5).
**freestanding_monument_pylon** (priority 20): permit + stamped wind drawings (IBC 3107) → 811 + layout → drill/pour pier with anchor template (gate footing; IBC 1807.3, H109) → set with crane/lift, disconnect within sight (NEC 600.6, 600.3) → final + day/night photos (gate final; NEC 600.4).
**building_wall_signs** (default): permit/backing/sign circuit (NEC 600.5) → paper pattern → anchor + seal penetrations → listed sign, disconnect, test (NEC 600.3/600.6) → clean, final, photos (gate final; IBC 3107).
Gates used: footing, final only (no framing gate — blocking is verified as QA, not a sign inspection).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| aerial_lift | fall/ejection from lift | 1926.453(b)(2)(v) | 4 |
| ladder | ladder slip | 1926.1053(b)(1) | 3 |
| fall_edge | roof edge at parapet signs | 1926.501(b)(1) | 4 |
| crane_swing | crane swing radius | 1926.1424(a)(2) | 4 |
| power_line | overhead lines | 1926.1408(a) | 4 |
| struck_utility | buried utilities | 1926.651(b)(1) | 4 |
| excavation_edge | fall into footing hole | 1926.501(b)(7)(ii) | 3 |
| rebar_impale | exposed rebar | 1926.701(b) | 3 |
| shock_loto | sign circuit shock | 1926.417(a) | 4 |
| gfci_cords | cords outdoors | 1926.404(b)(1) | 3 |
| eye_flying | drilling chips | 1926.102(a)(1) | 2 |
| silica_drill | silica from anchor drilling | 1926.1153(c) | 2 |

## QA checklist
15 items — schedule match, tactile height, latch-side location, braille/contrast, blocking, plumb/true, anchorage by substrate,
sealed penetrations, photo record, permit on file (non-safety, translated ES); locates, wind design, footing+anchor template,
disconnect in sight, listing label (safety, ES pending).

## Inspection / acceptance checkpoints
- sign_permit (local, not an AHJ building gate): permit issued, dimensioned drawings with supports/footings, site plan, owner acknowledgement / licensed installer.
- footing: depth/diameter per drawing, cage + anchor template + conduit before pour.
- final: plumb/anchored per permit, listed + disconnect, ADA room signs tactile at 48–60 in.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-SGN-ADA-EA | ADA room ID sign | EA | 8,500 | 0.35 | 0 | 2 | platform-baseline estimate |
| B-SGN-WAYF-EA | wayfinding/directory sign | EA | 45,000 | 1.5 | 0 | 0 | estimate |
| B-SGN-CHANNEL-EA | channel letters ≈25 LF allowance | EA | 900,000 | 24 | 60,000 | 0 | estimate, boom lift 1.5 d |
| B-SGN-MONUMENT-EA | monument sign allowance | EA | 1,200,000 | 32 | 80,000 | 3 | estimate |
| B-SGN-FTG-EA | drilled sign pier | EA | 350,000 | 16 | 250,000 | 8 | estimate, ≈3 ft × 8 ft pier |

## Quantity rules
- `B-SGN-ADA-EA` = rooms × 1, only commercial / residential_mf / industrial — conservative, confirm vs signage schedule.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- Spanish safety text (hazards, safety QA, checklists) pending human translation.
- All 5 B-SGN costs are platform estimates; channel letter / monument are allowances.
- IBC Appendix H section numbering (H109 ground signs) and adoption vary — verify per jurisdiction.
- `sign_permit` checklist key is a local (zoning) hold point, not an AHJ building-permit inspection.
