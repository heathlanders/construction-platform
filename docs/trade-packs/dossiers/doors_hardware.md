# Dossier — `doors_hardware` (Interior Doors & Hardware)

> Wave: w10 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/doors_hardware.ts` · Status: draft
> Taxonomy: category `interior` · permit_trade `null` · phase `finishes_interior` · CSI `08 14 00` (also 08 11 13, 08 71 00)

## Scope (2–4 sentences)
Sets interior hollow metal and wood frames, hangs interior doors, and installs finish hardware (hinges,
locksets, closers, exit devices, stops, kick plates) to the hardware schedule, keeping fire-rated
openings listed and accessible hardware within ADA limits. Does NOT include exterior entrances /
storefronts (`exterior_doors`, `glazing`), overhead doors, electrified access control wiring
(`security_access` / `low_voltage`), casing and trim (`finish_carpentry`) or restroom accessories and
partitions (`specialties`, `toilet_partitions`) — the industrial template title bundles accessories but
the pack does not cover them.

## Existing coverage reconciled
- Hand recipe: `task-buildout/nopermit.ts` case `doors_hardware` (shared with finish_carpentry /
  window_treatments) → pack **complements** (`recipes: []`); key is in `HAND_RECIPE_KEYS`.
- Catalog codes already seeded: `B-DOOR-INT` (slab + jamb + hardware, 08 14 00), `B-DOOR-EXT` — both
  hand-seeded from `facts.door_count` in `quantities.ts`. Not redeclared; pack lines add only what they
  exclude (closers, exit devices), and only on commercial/industrial.
- Blueprint template tasks: `industrial.ts` "Interior doors, hardware & restroom accessories".

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| doors_hardware-ufgs-08-71-00 | UFGS 08 71 00 Door Hardware | 1 | public_domain | fastening, locations, keys, field QC |
| doors_hardware-ufgs-08-11-13 | UFGS 08 11 13 Steel Doors and Frames | 1 | public_domain | frame setting, clearances, fire doors, protection |
| plumbing-ada-2010 (reused) | 2010 ADA Standards | 1 | public_domain | 404.2.3/.5/.7/.8.1/.9/.10 numbers |
| nfpa-fa (reused) | NFPA 80 / 101 | ref | proprietary_ref_only | fire door + egress checklist refs only |
| icc-pa (via ref string) | IBC 716 | ref | proprietary_ref_only | checklist ref only |
| doors_hardware-dhi | DHI | ref | proprietary_ref_only | hardware-set practice (no content) |
| doors_hardware-bhma | BHMA A156 | ref | proprietary_ref_only | product grades named only |
| ecfr-1926-c/e/i/j/k/x/z | 29 CFR 1926 | 1 | public_domain | hazards (verified on law.cornell.edu) |

## Work steps
Hand recipe stays (single step, "hardware adjusted to operate smoothly"). No pack recipe.

## Hazards
| id | OSHA ref | Sev |
|---|---|---|
| powder_actuated | 1926.302(e)(1) | 3 |
| silica_drilling | 1926.1153(c)(1) | 3 |
| nailer | 1926.302(b)(3) | 2 |
| chisel_mortise | 1926.301(a) | 2 |
| door_lifting | 1926.21(b)(2) | 2 |
| stepladder | 1926.1053(b)(13) | 3 |
| frame_welding | 1926.352(a) | 3 |
| cord_shock | 1926.404(b)(1) | 3 |
| eye_injury | 1926.102(a)(1) | 2 |
| noise | 1926.101(a) | 2 |

## QA checklist
15 items — schedule match, frame plumb/anchored, clearances, fastening by substrate, 34–48 in.
hardware height, lever operability, closer ≥5 s 90°→12°, ≤5 lbf opening force, 32 in. clear width,
10 in. smooth bottom, fire door labels/latching (safety), free egress (safety), stop blocking, keys
turnover, protection.

## Inspection / acceptance checkpoints
- `frame_set_check` (before walls close) · `fire_door_inspection` (NFPA 80 acceptance, IBC 716 refs)
  · `ada_hardware_check` (ADA 404.2.x refs) · `hardware_turnover` (keys, adjustment, O&M).

## Cost basis (all platform-baseline estimates, 2026)
| Code | Unit | Material ¢ | Labor hr | Basis |
|---|---|---|---|---|
| G-DHW-HM-FRAME-EA | EA | 26000 | 1.5 | 16 ga 3070 frame + anchors |
| G-DHW-FIRE-ASSY-EA | EA | 145000 | 4.0 | labeled door + frame + listed set |
| G-DHW-CLOSER-EA | EA | 19000 | 0.75 | grade 1 surface closer |
| G-DHW-EXIT-DEVICE-EA | EA | 52000 | 1.5 | grade 1 rim device + trim |
| G-DHW-LEVER-RETRO-EA | EA | 9500 | 0.6 | grade 2 lever set retrofit |

## Quantity rules
- `G-DHW-CLOSER-EA` = doors × 0.5 (ceil), commercial/industrial only.
- `G-DHW-EXIT-DEVICE-EA` = doors × 0.1 (ceil), commercial/industrial only.
- Frame / fire assembly / lever retrofit are manual-add (would double count B-DOOR-INT's jamb).

## Open questions → REVIEW_QUEUE
- All 5 costs are estimates. Closer 50% / exit 10% ratios are heuristics.
- Fire-door + egress Spanish safety text pending human translation.
- B-DOOR-INT on commercial jobs prices a wood slab; a metal-frame commercial opening is underpriced —
  consider a commercial door-unit row (scope question, not this pack).
