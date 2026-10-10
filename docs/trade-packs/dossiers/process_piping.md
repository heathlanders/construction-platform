# Dossier — `process_piping` (Process Piping & Compressed Air)

> Wave: w13 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/process_piping.ts` · Status: draft
> Taxonomy: category `plumbing_systems` · permit_trade `plumbing` · phase `rough_in` · CSI `40`

## Scope
Industrial piping that is not building plumbing: compressed-air mains, drops and compressor/receiver hookup,
process and cooling water, chemical lines. Covers layout from P&IDs/line list, supports and slope, joining,
backflow at potable tie-ins, pressure testing, flushing, labeling and turnover. Does NOT cover electrical to the
compressor (electrical), medical gas (`medical_gas`), fuel gas (`gas_piping`), or fire protection.
The IPC does not govern compressed-air or chemical piping; IPC refs are limited to the potable tie-in (backflow),
support and testing. Industrial systems are engineered to ASME B31.3 (or B31.9 for building-services air) — ref only.

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`; plumbing family recipe is generic DWV/supply) → NEW-TRADE pattern.
- Catalog codes already seeded: none `P-PRC-*`.
- Blueprint template tasks: `industrial.ts` — "Compressed air & process piping rough-in" (rough_in) →
  `process_piping_install`; "Process piping & compressed air pressure testing" (commissioning) →
  `process_piping_test_turnover` (priority 1).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| process_piping-ufgs-40-05-13 | UFGS 40 05 13 Pipelines, Liquid Process Piping | 1 | public_domain | supports, vents/drains, identification, hydro + pneumatic test procedure, flushing |
| process_piping-doe-ca-sourcebook | DOE/CAC Improving Compressed Air System Performance, 3rd ed. | 1 | gov_open | header slope, top takeoffs, drain legs, leaks at point of use, condensate separation |
| process_piping-asme-b31-3 | ASME B31.3 Process Piping | 3 | proprietary_ref_only | 345 / 345.4 / 345.5 test paragraph refs |
| process_piping-asme-a13-1 | ASME A13.1 pipe identification | 3 | proprietary_ref_only | labeling QA ref |
| icc-pa | ICC public access (IPC) | 3 | proprietary_ref_only | IPC 608, 308, 312 |
| ecfr-1926-c/d/e/i/j/l/x | 29 CFR 1926 subparts | 1 | public_domain | hazards (1926.21(b)(2), 1926.59, 1926.102(a)(1), 1926.300(b)(1), 1926.302(b)(4)(5)(7), 1926.306(b)(3), 1926.352(a), 1926.453(b)(2)(i), 1926.1053(b)(1)) |

## Work steps
Install (`process_piping_install`): check P&IDs/line list/materials → hang supports, slope headers away from
compressor, vents/drains → join (threaded/welded/press/grooved), drops off top of header, drain legs → backflow at
potable tie-ins, isolation valves [gate rough_in; IPC 608, 308].
Test & turnover (`process_piping_test_turnover`): test plan + boundary + relief valve → pressure test, water by
default, pneumatic only if approved and staged [B31.3 345.4/345.5] → flush/blow down/drain → label (A13.1), valve
tags, turnover package [gate final; IPC 312].

## Hazards
12: pneumatic_test (1926.21(b)(2), sev 4), test_release (1926.302(b)(5)), hose_whip (1926.302(b)(7)), air_blowdown
(1926.302(b)(4)), air_receiver (1926.306(b)(3), sev 4), line_break (1926.21(b)(2), sev 4), chemical_exposure
(1926.59), hot_work (1926.352(a)), aerial_lift (1926.453(b)(2)(i)), ladder (1926.1053(b)(1)), power_threader
(1926.300(b)(1)), eye_injury (1926.102(a)(1)). All ES pending human translation.

## QA checklist
15 items — materials vs line list, support spacing, header slope, vents/drains, top takeoffs, drain legs, joints per
procedure, backflow (safety), test plan (safety), relief on air test (safety), staged pneumatic (safety), test held
(safety), flushed clean, pipe labels (safety), turnover package.

## Inspection / acceptance checkpoints
- rough_in: supports/slope/vents/drains exposed; backflow at potable connections; drops off top with drain legs.
- final: signed test records per line; flushing records; labels + valve tags.

## Cost basis (all platform-baseline estimates, 2026 national)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| P-PRC-AIR-PIPE-LF | 1-1/2 in. aluminum air header w/ supports | LF | 2400 | 0.15 | 150 | 5 |
| P-PRC-AIR-DROP | drop + valve + drain leg + FRL | EA | 22000 | 2.0 | 500 | 5 |
| P-PRC-COMP-SET | compressor + receiver set allowance (install only) | EA | 150000 | 16.0 | 30000 | 0 |
| P-PRC-TEST-SYS | pressure test + flush + records per system | EA | 5000 | 8.0 | 7500 | 0 |
| P-PRC-LABEL | pipe marker w/ flow arrow | EA | 800 | 0.1 | 0 | 5 |

## Quantity rules
- `P-PRC-TEST-SYS` = const × 1 (industrial)
- `P-PRC-COMP-SET` = const × 1 (industrial; remove if owner-installed)
- `P-PRC-AIR-DROP` = const × 6 (industrial; replace with P&ID count)

## Blueprint callouts
None this wave.

## Open questions → REVIEW_QUEUE
- UFGS 22 15 00 (compressed air, low pressure) landing page loads but PDF is bot-blocked and title not confirmable — not cited.
- No 1926 section addresses pressure-test stored energy directly; cited 1926.21(b)(2) (training) — reviewer may prefer another.
- IPC does not cover compressed air/chemical piping; plumbing permit gates may not apply on many industrial jobs (owner/engineer witness).
- Costs all `estimate`.
