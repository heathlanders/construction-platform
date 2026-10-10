# Dossier — `special_construction` (Special Construction)

> Wave: w17 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/special_construction.ts` · Status: draft
> Taxonomy: category `specialty` · permit_trade `building` · phase `framing` · CSI 13

## Scope
Storm shelters / safe rooms (FEMA P-320 residential, P-361 community, ICC 500), glazed greenhouses and fabric / tension structures, and modular cleanrooms (ISO 14644 classes). Steel building erection is in `pemb`; factory-built housing in `manufactured_modular`; cold rooms in `cold_storage`; sound-isolation rooms and vaults are not covered (thin sources; log below).

## Existing coverage reconciled
- Hand recipe: none → pack is NEW-TRADE (no overlap with pemb or manufactured_modular).
- Catalog codes already seeded: none for these scopes (`B-SCN-*` prefix is free).
- Blueprint template tasks hitting this trade: none.

## Sources used
| id | Title | Tier | License | Used for |
|---|---|---|---|---|
| special_construction-fema-safe-rooms | FEMA P-320 / P-361 safe rooms | 1 | gov_open | concept-level safe-room practice (curl 403 — not machine-verified) |
| special_construction-icc-500 | ICC 500 storm shelters | 3 | proprietary_ref_only | reference only |
| special_construction-ngma | NGMA | 4 | association_public | greenhouse practice (reference) |
| special_construction-iso-14644 | ISO 14644-1/-3 cleanrooms | 3 | proprietary_ref_only | reference only |
| ecfr-1926-{m,x,h,cc,d,e,j,k,z,c} | 29 CFR 1926 subparts | 1 | public_domain | hazards |
| icc-pa | IBC 312, 423, 803, 1809; IRC R323 | 3 | proprietary_ref_only | code refs |

## Work steps
Recipes `safe_room` (5 steps; gates foundation, framing, final), `greenhouse_fabric` (4; footing, framing, final), `cleanroom` (4; framing, final).

## Hazards
14 hazards, OSHA refs: 1926.501(b)(1), .501(b)(4), .1053(b)(1), .251(a)(1), .1408(a), .20(b), .95(a), .102(a)(1), .1153(c), .28(a), .351, .59, .453(b)(2)(v), .404(b)(1).

## Cost basis
All `estimate` / platform-baseline: B-SCN-SAFEROOM-EA, B-SCN-SHELTER-STEEL-EA, B-SCN-GREENHOUSE-SF, B-SCN-CLEANROOM-SF, B-SCN-CERT-EA.

## Quantity rules
None — blueprint facts do not carry safe-room, greenhouse or cleanroom tokens; a const rule would misfire on every commercial job.

## Doubts
- FEMA pages 403 to curl; content summarised from general knowledge of P-320/P-361.
- Sound-isolation rooms / vaults not researched.
