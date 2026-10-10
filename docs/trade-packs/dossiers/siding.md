# Dossier — `siding` (Siding (Vinyl / Fiber Cement / Wood))

> Wave: w01 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/siding.ts` · Status: draft
> Taxonomy: category `envelope` · permit_trade `building` · phase `finishes_exterior` · CSI `07 46`

## Scope
Exterior wall cladding — vinyl, fiber-cement and wood lap/panel siding — over a continuous
water-resistive barrier (WRB), with flashed openings, roof-wall kick-outs, corners/trim, soffit and
fascia covers. Hand-offs: windows/doors set their units (siding integrates the flashing), roofing installs
step flashing, stucco/EIFS and masonry veneer are separate trades.

## Existing coverage reconciled
- Hand recipe: `task-buildout/building.ts` siding/stucco/EIFS branch (WRB & flashing → install cladding,
  gate `final`) → **pack complements** (`recipes: []`, no supersede). Pack adds hazards, QA, sheathing +
  final checklists, R703 code refs, glossary, equipment hints and assemblies.
- Catalog codes already seeded: `B-SIDING-SF`, `B-SIDING-FC-SF`, `B-STUCCO-SF` → not duplicated. New
  `B-SID-*` codes cover what they leave out (WRB, opening flashing, kick-outs, corners/trim, soffit, fascia).
- Blueprint template tasks: "Siding & exterior cladding" (res SF), "Exterior cladding (siding, stucco, or
  veneer)" (MF), "Metal wall panel system" (industrial), "Install metal wall panels" (pole barn) — all
  served by the hand recipe. Metal panel tasks reuse this trade key; pack QA is vinyl/fiber-cement/wood
  focused (see open questions).

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| sid-hardieplank-install | HardiePlank Lap Siding Installation Instructions (HS0920 10/10, FL13192 filing) | 5 | manufacturer_public | clearances, overlap, fastening, joint flashing, paint window, silica cutting |
| sid-hardie-tips | Tips for Installing James Hardie Lap Siding | 5 | manufacturer_public | course layout QA |
| sid-vsi-manual | VSI Vinyl Siding Installation Manual (2022) | 4 | association_public | vinyl nailing, gaps, laps, no face nail/caulk, penetration blocks |
| sid-doe-basc-wrb | DOE Technology Fact Sheet — Weather-Resistive Barriers | 1 | gov_open | WRB laps (4–12 in. typical), corner wrap, fastener spacing (12–18 in. typical) |
| doe-basc-win-flashed | BASC — Fully flashed window and door openings (added by windows) | 1 | gov_open | opening flashing sequence |
| sid-doe-basc-kickout | BASC — Step and kick-out flashing at roof-wall intersections | 1 | gov_open | kick-out QA |
| ecfr-1926-l/m/x/i/k/z/d | 29 CFR 1926 Subparts L, M, X, I, K, Z, D | 1 | public_domain | hazards (refs verified on ecfr.gov 2026-10-08) |
| icc-pa | IRC R703 (reference only) | 3 | proprietary_ref_only | code_refs: R703.1/.2/.3/.4/.5/.10/.11 — section + paraphrase |
| platform-baseline | The Jobsite national cost baseline | — | platform_estimate | all assembly numbers |

## Work steps
None — hand recipe retained (complement pattern).

## Hazards
| id | Hazard | Controls | OSHA ref | Sev |
|---|---|---|---|---|
| fall_edge | Wall/roof edge ≥6 ft | guardrail / net / PFAS | 1926.501(b)(1) | 4 |
| scaffold_fall | Scaffold/pump-jack platform >10 ft | guardrails or PFAS, full planking | 1926.451(g)(1) | 4 |
| scaffold_defect | Scaffold failure | competent-person inspection each shift; base plates, ties | 1926.451(f)(3) | 4 |
| pump_jack | Pump-jack bracket/pole failure | metal brackets w/ 2 grips; braced poles | 1926.452(j) | 3 |
| ladder | Ladder slip/tip | 3 ft extension, secured, firm footing | 1926.1053(b)(1) | 3 |
| power_line | Ladder/coil/panel contacts overhead line | locate drop, keep clear, fiberglass ladders | 1926.1053(b)(12) | 4 |
| fc_silica | Silica from cutting fiber cement | shears or Table 1 dust-collecting saw outdoors; HEPA/wet cleanup | 1926.1153(c)(1) (Table 1 item iii) | 3 |
| nailer | Pneumatic nailer punctures | muzzle safety device; disconnect to clear | 1926.302(b)(3) | 3 |
| saw | Saw cuts/kickback | guards, support work | 1926.300(b)(1) | 3 |
| cord_shock | Shock outdoors | GFCI, cord inspection | 1926.404(b)(1) | 3 |
| asbestos_siding | Tear-off of cement-asbestos siding | test; remove whole, wet, no cutting | 1926.1101(g)(8)(iii) | 4 |
| lead_paint | Lead dust from old paint | assume lead; wet + HEPA; hygiene | 1926.62 | 3 |

## QA checklist (15)
- [ ] Old siding/paint tested for asbestos & lead before tear-off (safety) — 1926.1101 / 1926.62
- [ ] Scaffold inspected each shift; planked + guardrails >10 ft (safety) — 1926.451
- [ ] Fiber cement cut with shears/dust-collecting saw; HEPA/wet cleanup (safety) — Hardie / 1926.1153
- [ ] WRB bottom-up, shingle-lapped, taped, wrapped past corners — DOE WRB
- [ ] WRB fastened with cap nails / wide-crown staples per maker — DOE WRB
- [ ] Openings flashed: pan → jambs → head → WRB over head — BASC
- [ ] Kick-outs at roof-wall ends; step flashing lapped by WRB — BASC / Hardie
- [ ] Clearances: ~6 in. to grade, 1–2 in. to roofing/decks/paths — Hardie
- [ ] Fiber cement ≥1-1/4 in. lap, snug heads not overdriven — Hardie
- [ ] Fiber cement butt-joint flashing; 1/4 in. uncaulked gap above horizontal flashing — Hardie
- [ ] Primed fiber cement painted within maker window; no stain — Hardie
- [ ] Vinyl nailed center of slot, ~1/32 in. under head, ≤16 in. o.c. — VSI
- [ ] Vinyl ≥1/4 in. gaps (3/8 in. <40 °F); no caulk at receivers/laps; no face nails — VSI
- [ ] Fixtures/vents on mounting blocks flashed to WRB — VSI / DOE
- [ ] Courses level and aligned — derived (VSI + Hardie)

## Inspection / acceptance checkpoints
- `sheathing`: WRB continuous/lapped/taped; openings flashed in order; step + kick-out flashing; ledgers/penetrations integrated.
- `final`: clearances; fastening per schedule (no face nails in vinyl); trim sealed / flashing gaps open; kick-outs draining; vented soffit unblocked.

## Cost basis
All numbers `platform-baseline`, confidence `estimate` (no public unit-price source for residential siding accessories). National baseline, cents, 2026.

| Code | Item | Unit | Material ¢ | Labor hr/unit | Equip ¢ | Waste % | Basis |
|---|---|---|---|---|---|---|---|
| B-SID-WRB-SF | House wrap + tape + cap fasteners | SF | 22 | 0.006 | 0 | 10 | roll ≈ $0.15/SF + tape/caps; 2-person crew ~2,500 SF/day |
| B-SID-OPEN-FLASH-EA | Opening flashing set | EA | 2200 | 0.4 | 0 | 10 | tape + pan for ~3x5 ft opening |
| B-SID-KICKOUT-EA | Kick-out flashing | EA | 1500 | 0.3 | 0 | 0 | prefab kick-out + membrane |
| B-SID-CORNER-LF | Corners / trim | LF | 300 | 0.05 | 0 | 10 | vinyl post or trim board, blended |
| B-SID-SOFFIT-SF | Vented soffit + channel | SF | 250 | 0.04 | 0 | 10 | panel + channel share |
| B-SID-FASCIA-LF | Fascia cover | LF | 200 | 0.06 | 0 | 10 | prefinished cover / coil |

## Quantity rules
- `B-SID-WRB-SF` = area_sf_sum × 1.1 — wall ≈ 1.1 × floor (matches existing B-SIDING-SF seeder)
- `B-SID-OPEN-FLASH-EA` = windows × 1 — doors added by hand
- `B-SID-KICKOUT-EA` = const × 2
- `B-SID-CORNER-LF` = const × 40 (4 corners × 10 ft)
- `B-SID-SOFFIT-SF` = area_sf_sum × 0.15
- `B-SID-FASCIA-LF` = area_sf_sum × 0.1

## Blueprint callouts (components)
None this wave (core tokens `vinyl_siding`, `house_wrap`, `metal_siding` already exist in parse-sheets).

## Open questions → REVIEW_QUEUE
- 12 hazards + 3 safety QA items pending human Spanish translation; inspection checklist items PENDING_ES (9).
- All 6 `B-SID-*` costs are `estimate` only.
- Hardie instructions cited are the 2010 edition on file with Florida; reviewer should confirm current HZ5/HZ10 figures (clearances, overlap, paint window).
- Metal wall panel tasks (industrial, pole barn) carry trade `siding`; pack QA doesn't cover metal panels — consider a metal-panel recipe/QA in a later wave or retag to a `metal_wall_panels`-type key.
- IRC R703 section numbering checked against 2018/2021 references (R703.2 WRB, R703.4 flashing, R703.10 fiber cement, R703.11 vinyl); reviewer to confirm against the AHJ edition.
- LP SmartSide instructions: lpcorp.com product-literature deep links 404'd; not cited.
