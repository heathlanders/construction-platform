# Dossier — `home_inspection` (Home / Property Inspection)

> Wave: w21 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/home_inspection.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `inspections` · CSI `01 45`

## Scope (2–4 sentences)
A registered home inspector performs a visual, non-invasive inspection of the readily accessible systems
of a 1–4 unit dwelling and delivers a written report of defects. Not technically exhaustive; no code
compliance opinion, no value/purchase opinion. Ancillary testing (radon, well water, septic, WDI/pests,
asbestos/lead) is out of scope or under a separate credential. Builders use the same checklist for a
new-home pre-closing walk and warranty walk. HUD/FHA "minimum property requirements" are an
appraiser/lender check, not a home inspection — mentioned in prose only.

## Existing coverage reconciled
- Hand recipe: none (not in building.ts / nopermit.ts) → services pack, `recipes: []`.
- Catalog codes already seeded: none; services wave adds no assemblies.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| home_inspection-wi-stat-440-xi | Wis. Stat. ch. 440 subch. XI — Home Inspectors | 1 | gov_open | defect definition, registration, report contents, prohibited opinions |
| home_inspection-wi-sps131 | Wis. Admin. Code ch. SPS 131 (131.31–131.33) | 1 | gov_open | limits, systems list, report contents |
| home_inspection-wi-dsps | DSPS Home Inspector registration page | 1 | gov_open | registration (reference) |
| home_inspection-ashi-sop | ASHI Standard of Practice | 3 | association_public | scope/practice (paraphrase) |
| home_inspection-internachi-sop | InterNACHI SOP | 3 | association_public | non-invasive scope, scope set before inspection |
| ecfr-1926-x / -m / -k / -aa / -z | 29 CFR 1926 X, M, K, AA, Z | 1 | public_domain | hazards |

Note: the brief pointed at "440.97 standards of practice" and "SPS 131–134". Verified: 440.97 is the
definitions section; standards are at 440.975. The rule standards were renumbered from SPS 134 into
SPS 131 by CR 14-010 (2014); chs. SPS 132–134 carry no current home-inspection rules.

## Work steps
None — services pack (no recipes, no gates).

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| ladder_access | Ladder falls (roof/gutter/attic hatch) | 1926.1053(b)(1) | 3 |
| roof_walk | Falls from steep/wet roofs | 1926.501(b)(11) | 4 |
| attic_fall_through | Stepping through ceiling between joists | 1926.501(b)(4)(i) | 3 |
| panel_cover | Shock/arc when removing a dead-front | 1926.416(a)(1) | 4 |
| exposed_live_parts | Unguarded live parts ≥50 V | 1926.403(i)(2)(i) | 3 |
| crawlspace | Confined-space / crawlspace entry | 1926.1203(a) | 3 |
| asbestos_disturb | Disturbing PACM in pre-1981 homes | 1926.1101 | 3 |

Many home inspectors are not "construction" employers; 1926 refs are kept per pack schema.

## QA checklist (deliverables)
- pre-inspection agreement; WI registration + inspector name; report header (address/dates/preparers);
  required vs inspected systems; roof method stated; defects labeled + location + recommendation;
  summary page with statutory statements; photos; no value/purchase/code opinion; on-time delivery.

## Inspection / acceptance checkpoints
- `new_home_pre_closing_walk`: builder/buyer walk, operate doors/windows, fixtures, devices + alarms,
  HVAC + filter, finishes + grading, warranty handover.

## Cost basis / Quantity rules / Components
None (services wave).

## Open questions → REVIEW_QUEUE
- Report delivery 24–48 h is an industry norm, not a WI rule (confidence derived).
- Many states license home inspectors differently; pack is WI-anchored.
