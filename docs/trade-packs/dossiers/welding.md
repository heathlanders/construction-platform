# Dossier — `welding` (Welding — field / structural)

> Wave: w11 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/welding.ts` · Status: draft
> Taxonomy: category `structural` · permit_trade `building` · phase `framing` · CSI `05 05`

## Scope (2–4 sentences)
Mobile / field welding crew that makes the field welds on structural and miscellaneous steel — moment
connections, CJP and fillet welds, reinforcing plates on existing steel. Owns the WPS paperwork on site,
welder qualifications, hot-work permit and fire watch, fit-up/preheat, welding and repair of rejects.
Does NOT erect or bolt the steel (`structural_steel`), weld shear studs through deck (`metal_decking`),
or perform the special inspection / NDT (owner's testing agency — the crew gives access).

## Existing coverage reconciled
- Hand recipe: none (not in `HAND_RECIPE_KEYS`) → NEW-TRADE pattern.
- Catalog codes already seeded: none with `B-WLD-`.
- Blueprint template tasks hitting this trade: none. Recipe `title_re` `\bweld|field weld|welding`.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-j | 29 CFR 1926 Subpart J — Welding and Cutting (1926.350–.354) | 1 | public_domain | cylinders, arc safety, fire prevention, ventilation, coatings |
| ecfr-1926-r | Subpart R — 1926.760(a)(1) fall protection on steel | 1 | public_domain | fall hazard |
| ecfr-1926-z | 1926.1126 hexavalent chromium | 1 | public_domain | stainless / chromate fume |
| ecfr-1926-e, ecfr-1926-i | eye/face; abrasive wheels 1926.303(b)(1) | 1 | public_domain | radiation PPE, grinder |
| welding-osha-fs3647 | OSHA FS-3647 Controlling Hazardous Fume and Gases during Welding | 1 | public_domain | fume controls |
| welding-osha-topic | OSHA Welding, Cutting, Brazing — Standards | 1 | gov_open | standards index |
| structural_steel-ufgs-05-12-00 | UFGS 05 12 00 Structural Steel §1.5.4.1, 3.4, 3.4.1, 3.5.1, 3.6, 3.7.1 | 1 | public_domain | WPS submittal, welder quals, CWI 100% visual, NDT (UT CJP, MT/PT fillet/PJP), ASNT CP-189 technicians, reject-rate trigger, temp weld removal, touch-up |
| welding-aws-safety | AWS Safety & Health Fact Sheets + ANSI Z49.1:2021 (free) | 4 | association_public | fumes, radiation, Cr/Ni, electrical, fire, confined space |
| welding-aws-d1-1 | AWS D1.1/D1.1M | 3 | proprietary_ref_only | reference only (WPS/preheat/acceptance) |
| welding-nfpa-51b | NFPA 51B | 3 | proprietary_ref_only | hot-work permit / fire watch concept |
| icc-pa | IBC 1704.2, 1705.2.1, 2204.1 | 3 | proprietary_ref_only | special inspection + welding code refs |

UFGS 05 05 23 (Welding, Structural) PDF returned S3 AccessDenied — not used; welding content taken from
UFGS 05 12 00 instead.

## Work steps (draft → pack recipes)
Recipe `field_structural_welding` (`\bweld|field weld|welding`):
1. **Check the WPS, welder papers and consumables** — QA wps_on_site, welder_quals, consumables_stored.
2. **Get the hot work permit and post the fire watch** — 1926.352(a)/(d)/(e), NFPA 51B ref. QA hot_work_permit.
3. **Fit up, clean and preheat the joint** — QA fitup_per_wps, base_metal_clean, preheat_checked.
4. **Weld to the WPS** — QA weld_size_length.
5. **Visual inspection and NDT** — Gate `framing`. Code IBC 1705.2.1, 2204.1. QA cwi_visual, ndt_per_spec, special_insp_reports.
6. **Repair rejects, clean up and close the permit** — QA repairs_retested, temp_welds_removed, field_touch_up, fire_watch_kept.

Recipe `existing_steel_retrofit` (priority 10, existing/repair/retrofit/reinforce/strengthen + weld):
survey steel + coatings (1926.354(a)) → strip coatings, protect occupied building (1926.352(f), 1926.354(c)) →
fit/preheat/weld reinforcement → inspect, repair, restore protection (gate `framing`).

## Hazards (draft → pack hazards)
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| arc_shock | shock from welding circuit | 1926.351(d) | 4 |
| cable_damage | worn cables / bad ground return | 1926.351(b)(4) | 3 |
| fire_hot_work | sparks/slag ignite combustibles | 1926.352(a) | 4 |
| hidden_fire | smoldering fire, far side of walls/floors | 1926.352(e) | 4 |
| fumes | manganese/iron oxide/ozone/CO | 1926.353(e)(1) | 3 |
| coated_metal | galvanized/painted/coated steel | 1926.354(a) | 3 |
| hex_chrome | Cr(VI) from stainless/chromate | 1926.1126(c) | 4 |
| arc_radiation | UV/IR flash, burns | 1926.353(e)(2) | 3 |
| cylinders | oxygen/fuel cylinders | 1926.350(a)(9) | 3 |
| confined_space | welding in tanks/boxes | 1926.353(b)(1) | 4 |
| fall_steel | fall from steel > 15 ft | 1926.760(a)(1) | 4 |
| grinder | wheel burst, flying particles | 1926.303(b)(1) | 3 |

## QA checklist
15 items — see pack (2 safety: hot_work_permit, fire_watch_kept).

## Inspection / acceptance checkpoints
- framing: WPS + welder quals on site; visual log covers all field welds; UT/MT/PT reports with rejects retested; special inspector report, no open discrepancies.

## Cost basis
| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-WLD-FILLET-LF | field fillet 3/16–5/16 | LF | 120 | 0.25 | 150 | 10 | platform-baseline estimate |
| B-WLD-CJP-LF | field CJP groove ≤1 in. | LF | 600 | 1.0 | 500 | 10 | estimate |
| B-WLD-RIG-HR | mobile welder + rig, T&M | HR | 300 | 1.0 | 3500 | 0 | estimate |
| B-WLD-UT-EA | UT per joint by agency | EA | 0 | 0.25 | 15000 | 0 | estimate |
| B-WLD-FIREWATCH-HR | fire watch | HR | 0 | 1.0 | 50 | 0 | estimate |

## Quantity rules
- `B-WLD-FILLET-LF` = area_sf_sum × 0.02 (commercial/industrial) — allowance, replace with weld map.
- `B-WLD-UT-EA` = const 4 (commercial/industrial) — set from NDT schedule.
- `B-WLD-FIREWATCH-HR` = const 16 (commercial/industrial) — set from welding schedule.

## Blueprint callouts (components)
- none this wave.

## Open questions → REVIEW_QUEUE
- All 5 assembly costs are platform estimates.
- UFGS 05 05 23 unreachable (S3 AccessDenied) — content sourced from UFGS 05 12 00.
- Fillet allowance (0.02 LF/SF) is a crude placeholder; area_sf_sum is room area, often 0 on commercial sets.
- Reuses sibling source id `structural_steel-ufgs-05-12-00` — keep it if structural_steel is reworked.
