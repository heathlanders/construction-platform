# Dossier — `environmental_consulting` (Environmental Consulting / Industrial Hygiene)

> Wave: w22 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/environmental_consulting.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `02 26`

## Scope
Consultant / industrial hygienist hired by the owner or contractor to investigate, sample and report:
Phase I ESA (AAI), Phase II sampling, pre-demolition asbestos/lead surveys, wetland delineation,
worker exposure monitoring (silica, lead, noise). Does NOT remove or clean up — hands off to
`abatement` (asbestos/lead/mold removal) and `environmental_remediation` (USTs, contaminated soil).

## Existing coverage reconciled
- Hand recipe: none (services, no permit) → no recipes, no gates, no code_refs.
- Catalog codes: none (services wave — no assemblies).
- Blueprint template tasks: none.

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| environmental_consulting-ecfr-40-312 | 40 CFR 312 AAI | 1 | public_domain | Phase I timing (312.20), report contents (312.21(c)), EP (312.10), E1527-21 recognized (312.11) |
| environmental_consulting-epa-aai | EPA Brownfields AAI | 1 | gov_open | context |
| environmental_consulting-ecfr-40-61-145 | 40 CFR 61.145 | 1 | public_domain | 61.145(a) thorough inspection incl. Cat I/II nonfriable |
| abatement-wi-dhs159 / -dhs163 / -wi-dhs-asbestos / -wi-dnr-asbestos (reused) | WI DHS / DNR | 1 | gov_open | certified inspector (DHS page: consultants sampling suspect ACM must be certified inspectors) |
| abatement-ecfr-40-745l (reused) | 40 CFR 745 L | 1 | public_domain | lead inspector/risk assessor |
| environmental_consulting-wi-dnr-wetland-delineation / -assurance | WI DNR | 1 | gov_open | professional delineator; DNR-assured skips confirmation |
| environmental_consulting-nist-nvlap | NIST NVLAP | 1 | gov_open | bulk asbestos lab accreditation |
| environmental_consulting-aiha-lap | AIHA-LAP directory | 3 | association_public | IH lab accreditation |
| environmental_consulting-astm-e1527-21 | ASTM E1527-21 | ref | proprietary_ref_only | named only |
| ecfr-1926-d / -p / -z / -aa | 29 CFR 1926 | 1 | public_domain | hazards; 1926.1153(d)(2)(v) lab procedures |

## Hazards
| id | OSHA ref | Sev |
|---|---|---|
| asbestos_bulk_sampling | 1926.1101(g)(1) | 3 |
| lead_sampling | 1926.62(d)(1)(i) | 3 |
| contaminated_site_entry | 1926.65(c)(2) | 3 |
| buried_utilities | 1926.651(b)(1) | 4 |
| test_pit_entry | 1926.652(a)(1) | 4 |
| confined_space_sampling | 1926.1203(a) | 4 |
| silica_coring | 1926.1153(c)(1) | 3 |

All sections text-verified on eCFR 2026-10-08.

## QA checklist (deliverables)
aai_timing, phase_i_report, phase_ii_plan, chain_of_custody, predemo_survey_scope, certified_inspector,
accredited_lab, survey_report_quantities, wetland_delineation, exposure_monitoring_report (safety).

## Inspection / acceptance checkpoints
- pre_demolition_survey (40 CFR 61.145(a), DHS 159)
- phase_i_esa (40 CFR 312.20 / 312.21)

## Cost basis / Quantity rules / Components
None (services wave).

## Open questions → REVIEW_QUEUE
- es_safety: 7 hazards + exposure_monitoring_report QA need human ES.
- source_doubt: phase_ii_plan cites ASTM E1903 by name only in a note (no source entry).
- scope: PCB/mercury/universal-waste survey items mentioned in glossary only; no dedicated QA.
