# Dossier — `low_voltage` (Low Voltage / Structured Cabling)

> Wave: w02 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/low_voltage.ts` · Status: draft
> Taxonomy: category `electrical_systems` · permit_trade `electrical` · phase `rough_in` · CSI `27`

## Scope
Runs, terminates, tests and labels low-voltage cabling: Cat6 data, RG6 coax, Wi-Fi access-point drops, and
prewire for doorbells, cameras, keypads and AV, home-run to a structured media panel (homes) or telecom
room / rack (commercial). Hands off: fire alarm (`fire_alarm`), security monitoring / access-control
programming (`security_access`), AV equipment (`av_automation`), and line-voltage power, including the
receptacle inside the media panel (`electrical`).

## Existing coverage reconciled
- Hand recipe: none. Without the pack, low_voltage tasks fell through to the family `electrical.ts`
  phase recipes (boxes / NM-B / AFCI-GFCI) — wrong work for this trade. Pack = NEW-TRADE pattern.
- Catalog codes already seeded: `E-DATA-DROP` (0030), `E-SEC-CAMERA`, `E-FA-DEVICE` (0037). The pack
  references `E-DATA-DROP` from a quantity rule; it does not redeclare it. `E-SEC-CAMERA` left to `security_access`.
- Blueprint template tasks: "Low-voltage (data, AV, security) rough-in" (residential-sf), "Data, intercom &
  access control rough-in" (residential-mf), "Data, telecom & security system rough-in" (commercial) — all
  matched by `structured_cabling_rough_in`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| low_voltage-ufgs-27-10-00 | UFGS 27 10 00 Building Telecommunications Cabling System (Part 3) | 1 | public_domain | steps, QA numbers (25 lb pull, 4×/20×/10× bend, ½ in untwist, 12 in slack, 4–5 ft supports, 12 in power separation, labeling, testing) |
| nfpa-fa | NFPA 70 (NEC) Arts. 300.21, 725, 770, 800, 820, 840 | 3 | proprietary_ref_only | code refs (section + paraphrase only) |
| low_voltage-tia-568 | ANSI/TIA-568 series | 3 | proprietary_ref_only | concepts: T568A/B scheme, certification |
| low_voltage-panduit-dl, low_voltage-leviton-support | Manufacturer installation instructions | 5 | manufacturer_public | termination / bracket practice |
| ecfr-1926-c/d/e/i/k/l/m/x/z | 29 CFR 1926 | 1 | public_domain | hazards (sections checked on law.cornell.edu mirror) |
| platform-baseline | The Jobsite cost baseline | — | platform_estimate | all assembly costs |

## Work steps
Recipe `structured_cabling_rough_in` (title_re low voltage / data / telecom / cabling / prewire / intercom / access control):
1. **Lay out outlets, panel and pathways** — QA lv_bracket_box, star_home_run.
2. **Bore and set pathways and supports** — NEC 800.24. QA supports_independent, separation_power.
3. **Pull cable home-run to the panel** — NEC 800.113, 800.179. QA cable_rating_space, pull_tension, bend_radius, no_splices, labeled_both_ends.
4. **Secure, protect and leave service loops** — NEC 800.133, 725. Gate rough_in.
5. **Firestop penetrations and call rough-in** — NEC 800.26, 300.21. Gate rough_in. QA firestop_rated.

Recipe `termination_certification` (priority 10; title_re terminat / certif / trim / test / patch panel / jacks / activat):
1. **Set the panel or rack and bond it** — QA bonding.
2. **Terminate jacks and patch panel** — QA untwist_limit, no_splices (fiber detail).
3. **Test and certify every link** — QA tested_certified.
4. **Label, set devices and hand over** — NEC 800.25, 800.100. Gate final.

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| ladder | Stepladder top-step falls | 1926.1053(b)(13) | 3 |
| fall_edge | Open floor / roof edges while routing | 1926.501(b)(1) | 4 |
| aerial_lift | Boom lift basket | 1926.453(b)(2)(v) | 4 |
| electrical_contact | Live power wiring in shared walls / panels | 1926.416(a)(1) | 4 |
| cord_shock | Temporary power cords | 1926.404(b)(1) | 3 |
| attic_heat | Attic heat, stepping through drywall | 1926.21(b)(2) | 3 |
| fiber_shard | Glass slivers / fiber light | 1926.102(a)(1) | 2 |
| eye_cut | Drilling debris, metal studs, tray edges | 1926.95(a) | 2 |
| silica | Coring concrete / block | 1926.1153 | 3 |
| power_tool | Auger / hole-saw kickback | 1926.300(b) | 2 |
| chem | Firestop sealants, lubricants | 1926.59 | 2 |

## QA checklist (15; 4 safety)
lv_bracket_box, star_home_run, cable_rating_space (safety), separation_power (safety), supports_independent,
pull_tension, bend_radius, service_loops, no_splices, labeled_both_ends, untwist_limit, tested_certified,
firestop_rated (safety), bonding (safety), abandoned_removed.

## Inspection / acceptance checkpoints
- rough_in: cable listing per space, separation from power, support from structure, firestop, nail plates + labels.
- final: terminated / labeled / tested with reports, abandoned cable, entrance bonding, rack bonding + firestop labels.

## Cost basis (all `platform-baseline`, confidence estimate, national 2026)
| Code | Item | Unit | Material ¢ | Labor hr | Equip ¢ | Waste % |
|---|---|---|---|---|---|---|
| E-LV-COAX-DROP | RG6 home run + F-connectors + plate | EA | 3000 | 0.5 | 0 | 5 |
| E-LV-MEDIA-PANEL | 28–30 in. enclosure + patch module + splitter | EA | 19500 | 3.0 | 0 | 0 |
| E-LV-CERT-TEST | Copper link certification + report | EA | 0 | 0.15 | 300 | 0 |
| E-LV-WAP | Wi-Fi AP location (Cat6 + jack + bracket) | EA | 4500 | 1.0 | 0 | 5 |
| E-LV-PREWIRE | Device prewire location (cable to bracket) | EA | 2500 | 0.4 | 0 | 5 |

## Quantity rules
- `E-DATA-DROP` = rooms × 1 (existing catalog code).
- `E-LV-COAX-DROP` = ceil(rooms × 0.35) — residential_sf / residential_mf.
- `E-LV-MEDIA-PANEL` = 1 — residential_sf.
- `E-LV-PREWIRE` = 4 (doorbell + 2 cameras + keypad) — residential_sf.
- `E-LV-CERT-TEST` = rooms × 1 — commercial / industrial.
- `E-LV-WAP` = ceil(area_sf_sum / 1,500) — commercial / industrial.

## Blueprint callouts
None this wave (brief).

## Open questions → REVIEW_QUEUE
- NEC Art. 800 numbering moved in 2020/2023 (Arts. 722/724/725 split; 800.24/.25/.26/.100/.113/.133/.179
  checked against 2020/2023 structure from memory, NFPA free access needs login) — verify against the adopted edition.
- Many AHJs issue no low-voltage permit for residential Class 2 / comms work; the rough_in / final gates
  assume the electrical permit covers it.
- BICSI site returns 403 to scripts — not cited.
