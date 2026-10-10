// Trade Knowledge Pack — stucco_eifs (Stucco / EIFS). Wave 09, COMPLEMENT pattern: the hand recipe in
// task-buildout/building.ts (siding / stucco / EIFS branch: Install WRB & flashing → Install cladding)
// keeps producing the work steps; this pack adds glossary, hazards, QA, lath-inspection checklist,
// stucco/EIFS code refs, equipment hints and the accessory/WRB/EIFS assemblies the catalog lacks
// (B-STUCCO-SF already exists and is hand-seeded from the 'stucco_finish' component).
// Dossier: docs/trade-packs/dossiers/stucco_eifs.md. Sources: UFGS 09 24 23 + 07 24 00, City of
// Bloomington MN three-coat stucco sheet, DOE BASC, EIMA (association), ASTM C926/C1063 (ref only),
// 29 CFR 1926 Subparts D, E, I, L, X, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgsStucco = (note?: string) => ({ src: ['stucco_eifs-ufgs-09-24-23'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ufgsEifs = (note?: string) => ({ src: ['stucco_eifs-ufgs-07-24-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const blm = (note?: string) => ({ src: ['stucco_eifs-bloomington-3coat'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'stucco_eifs',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Exterior cement plaster (three-coat stucco over lath) and EIFS (foam board with a reinforced base coat and finish): the water-resistive barrier and drainage behind it, weep screeds, trim and control joints, the coats themselves, curing and sealant at openings.',
    summary_es: 'Aplanado exterior de cemento (estuco de tres capas sobre malla) y EIFS (placa de espuma con capa base reforzada y acabado): la barrera contra el agua y el drenaje detrás, botaguas inferiores, molduras y juntas de control, las capas, el curado y el sellador en los vanos.',
    glossary: [
      { term: 'Lath', term_es: 'Malla (metal desplegado)', def: 'Metal or wire mesh fastened over the wall that the stucco locks into.', def_es: 'Malla metálica o de alambre fijada al muro donde se agarra el estuco.' },
      { term: 'Scratch coat', term_es: 'Capa de rayado', def: 'First stucco coat pushed through the lath and scored with horizontal grooves for the next coat.', def_es: 'Primera capa de estuco que se empuja a través de la malla y se raya en horizontal para la siguiente capa.' },
      { term: 'Brown coat', term_es: 'Capa café (de nivelación)', def: 'Second coat, rodded straight and floated to make a flat base for the finish.', def_es: 'Segunda capa, reglada y flotada para dejar una base plana para el acabado.' },
      { term: 'Finish coat', term_es: 'Capa de acabado', def: 'Thin top coat that gives the color and texture.', def_es: 'Capa delgada final que da el color y la textura.' },
      { term: 'Weep screed', term_es: 'Botaguas inferior (weep screed)', def: 'Metal or vinyl trim at the bottom of the wall that stops the stucco and lets water behind it drain out.', def_es: 'Moldura metálica o de vinilo al pie del muro que termina el estuco y deja salir el agua de atrás.' },
      { term: 'Control joint', term_es: 'Junta de control', def: 'Trim piece that splits the wall into panels so shrinkage cracks happen in the joint, not the field.', def_es: 'Moldura que divide el muro en paneles para que las grietas por contracción ocurran en la junta y no en el paño.' },
      { term: 'Casing bead', term_es: 'Moldura de remate (casing bead)', def: 'Trim that stops the stucco cleanly at windows, doors and other materials.', def_es: 'Moldura que termina el estuco limpiamente en ventanas, puertas y otros materiales.' },
      { term: 'Fog curing', term_es: 'Curado con niebla', def: 'Spraying a fine mist of water on fresh stucco so it hardens instead of drying out.', def_es: 'Rociar una niebla fina de agua sobre el estuco fresco para que fragüe en vez de secarse.' },
      { term: 'Back-wrap', term_es: 'Envoltura del borde (back-wrap)', def: 'EIFS mesh and base coat wrapped around the edge of the foam board where the system stops.', def_es: 'Malla y capa base del EIFS envueltas alrededor del borde de la placa de espuma donde termina el sistema.' },
      { term: 'Drainage EIFS', term_es: 'EIFS con drenaje', def: 'EIFS with a water barrier and grooved board or spacer behind the foam so water that gets in can drain out.', def_es: 'EIFS con barrera contra el agua y placa ranurada o separador detrás de la espuma para que el agua que entre pueda salir.' },
    ],
  },
  est_bucket: 'building',
  recipes: [],
  code_refs: {
    sheathing: [
      { section: 'R703.2', code_type: 'IRC', note: 'Water-resistive barrier behind exterior wall coverings', prov: icc },
      { section: 'R703.4', code_type: 'IRC', note: 'Flashing at openings, roof-wall intersections and penetrations', prov: icc },
      { section: 'R703.7.1', code_type: 'IRC', note: 'Lath and its attachment for exterior plaster', prov: icc },
      { section: 'R703.7.2.1', code_type: 'IRC', note: 'Weep screed at the foundation plate line, set above grade', prov: icc },
      { section: 'R703.7.3', code_type: 'IRC', note: 'Water-resistive barrier layers required under stucco', prov: icc },
      { section: '2510.6', code_type: 'IBC', note: 'Water-resistive barriers under cement plaster lath', prov: icc },
      { section: '110.3.5', code_type: 'IBC', note: 'Lath inspection before any plaster is applied', prov: icc },
    ],
    final: [
      { section: 'R703.7', code_type: 'IRC', note: 'Exterior plaster (stucco) — materials, coats and application', prov: icc },
      { section: 'R703.9', code_type: 'IRC', note: 'EIFS — installed per the listed manufacturer instructions', prov: icc },
      { section: 'R703.9.2', code_type: 'IRC', note: 'EIFS with drainage over a water-resistive barrier', prov: icc },
      { section: '2512.1.2', code_type: 'IBC', note: 'Weep screeds on exterior plaster walls', prov: icc },
      { section: '1407', code_type: 'IBC', note: 'Exterior insulation and finish systems (EIFS)', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: 'stucco|eifs|plaster|lath' }, type: 'forklift', reason: 'Land pallets of bagged stucco, sand and foam board at the scaffold', optional: true },
    { when: { title_re: 'stucco|eifs|plaster|lath', building_types: ['residential_mf', 'commercial', 'industrial'] }, type: 'boom_lift', reason: 'Reach high walls, parapets and soffits not covered by scaffold', optional: true },
    { when: { title_re: 'stucco|eifs|plaster' }, type: 'air_compressor', reason: 'Spray rig / hopper gun for machine-applied coats and finish texture', optional: true },
  ],
  hazards: [
    { id: 'scaffold_fall', hazard: 'Fall from scaffold platforms while lathing and plastering walls', hazard_es: PENDING_ES, controls: ['Provide guardrails or personal fall arrest on any scaffold more than 10 ft above a lower level', 'Keep guardrails in place; do not stand on rails, buckets or mixer drums to reach'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, ppe: ['harness and lanyard where guardrails are not used'], prov: osha('l') },
    { id: 'scaffold_inspection', hazard: 'Scaffold failure from damaged frames, missing braces or undermined footing', hazard_es: PENDING_ES, controls: ['Have a competent person inspect the scaffold for visible defects before each shift and after any event that could weaken it', 'Tag out and repair or remove damaged parts at once'], controls_es: PENDING_ES, osha_ref: '1926.451(f)(3)', severity: 4, prov: osha('l') },
    { id: 'scaffold_planking', hazard: 'Fall through gaps or broken planks on partly decked scaffold', hazard_es: PENDING_ES, controls: ['Fully plank or deck each working level between the uprights and the guardrail supports', 'Keep platforms clear of mortar build-up and debris'], controls_es: PENDING_ES, osha_ref: '1926.451(b)(1)', severity: 3, prov: osha('l') },
    { id: 'scaffold_power_line', hazard: 'Electrocution when scaffold, lath or metal trim comes near overhead power lines', hazard_es: PENDING_ES, controls: ['Locate power lines before erecting scaffold and keep the required clearance', 'Have the utility de-energize or insulate lines that cannot be cleared'], controls_es: PENDING_ES, osha_ref: '1926.451(f)(6)', severity: 4, prov: osha('l') },
    { id: 'ladder', hazard: 'Ladder slip or overreach while setting trim and patching', hazard_es: PENDING_ES, controls: ['Extend ladder rails 3 ft above the landing and secure the top', 'Keep three points of contact; move the ladder instead of reaching'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'silica_cutting', hazard: 'Breathing silica dust when saw-cutting, grinding or chipping cured stucco', hazard_es: PENDING_ES, controls: ['Use the Table 1 controls for the tool (water delivery or shroud with dust collector) and respirator where listed', 'Otherwise assess and keep exposure below the limit under the alternative method'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator where Table 1 requires it', 'safety glasses'], prov: osha('z') },
    { id: 'silica_cleanup', hazard: 'Silica dust stirred up by dry sweeping or blowing off stucco debris', hazard_es: PENDING_ES, controls: ['Clean up with wet sweeping or a HEPA vacuum, not dry sweeping', 'Do not use compressed air to clean clothing or surfaces'], controls_es: PENDING_ES, osha_ref: '1926.1153(f)(1)', severity: 2, prov: osha('z') },
    { id: 'cement_burn', hazard: 'Chemical burns to skin from wet cement plaster soaking through clothing or gloves', hazard_es: PENDING_ES, controls: ['Wear waterproof gloves with cuffs and long sleeves; change out of plaster-soaked clothing', 'Wash skin that contacts wet plaster right away'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['waterproof gloves', 'long sleeves', 'waterproof boots'], prov: osha('e') },
    { id: 'eye_splash', hazard: 'Eye burns from plaster splash when mixing, spraying or troweling overhead', hazard_es: PENDING_ES, controls: ['Wear safety glasses or goggles while mixing and applying; face shield when spraying', 'Keep an eyewash supply at the mixing station'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 3, ppe: ['goggles', 'face shield when spraying'], prov: osha('e') },
    { id: 'hazcom', hazard: 'Unrecognized chemical hazards in cement, lime, acrylic finishes, adhesives and sealants', hazard_es: PENDING_ES, controls: ['Keep safety data sheets on site and labels on every container', 'Train the crew on the hazards of each product before use'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, prov: osha('d') },
    { id: 'wash_station', hazard: 'Prolonged skin contact with cement because there is nowhere to wash it off', hazard_es: PENDING_ES, controls: ['Provide washing facilities near the work so crews can remove plaster from skin'], controls_es: PENDING_ES, osha_ref: '1926.51(f)(1)', severity: 2, prov: osha('d') },
    { id: 'mixer_guard', hazard: 'Caught in the paddles or drive of a plaster/mortar mixer', hazard_es: PENDING_ES, controls: ['Keep the grate and drive guards in place while the mixer runs', 'Shut off and lock out the mixer before reaching in to clean it'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(2)', severity: 3, prov: osha('i') },
  ],
  qa_checklist: [
    { id: 'penetrations_first', item: 'Vents, hose bibs, lights and other wall penetrations set and flashed before the water-resistive barrier goes on.', item_es: tr('Ventilas, llaves de manguera, luminarias y demás penetraciones colocadas y tapajuntadas antes de poner la barrera contra el agua.'), prov: blm() },
    { id: 'wrb_two_layers', item: 'Under stucco: two layers of Grade D paper (or an approved equivalent WRB) installed shingle-style, laps at least 2 in. horizontal and 6 in. vertical, no tears.', item_es: tr('Bajo el estuco: dos capas de papel Grado D (o barrera equivalente aprobada) traslapadas tipo teja, mínimo 2 pulg horizontal y 6 pulg vertical, sin rasgaduras.'), prov: blm() },
    { id: 'flashing_laps', item: 'Head flashings with end dams over every opening, kick-out diverters at roof-wall ends, and WRB lapped over the flashing flanges.', item_es: tr('Tapajuntas superior con topes en cada vano, desviadores (kick-out) al final de techos contra muro y la barrera traslapada sobre las pestañas de los tapajuntas.'), prov: { ...blm(), src: ['stucco_eifs-bloomington-3coat', 'sid-doe-basc-kickout'] } },
    { id: 'weep_screed', item: 'Weep screed at the base of every stucco wall, at least 4 in. above soil (2 in. above paving), with the WRB lapped over its flange.', item_es: tr('Botaguas inferior al pie de cada muro de estuco, al menos 4 pulg sobre la tierra (2 pulg sobre pavimento), con la barrera traslapada sobre su pestaña.'), prov: blm() },
    { id: 'lath_fastening', item: 'Lath fastened about every 8 in. vertically and 16 in. horizontally into framing, and at every lap with both edges held.', item_es: tr('Malla fijada aproximadamente cada 8 pulg en vertical y 16 pulg en horizontal a la estructura, y en cada traslape sujetando ambos bordes.'), prov: ufgsStucco('3.4.1 steel and wood supports') },
    { id: 'lath_laps', item: 'Lath straight with no buckles, joints staggered, end laps at least 1 in., lath stopped at each control joint and lapped over flashings.', item_es: tr('Malla recta sin abolladuras, juntas alternadas, traslapes de extremo de al menos 1 pulg, malla cortada en cada junta de control y traslapada sobre los tapajuntas.'), prov: ufgsStucco('3.4 lath; 3.4.3 over flashings') },
    { id: 'control_joints', item: 'Control joints at the drawing locations (or panels no larger than about 144 SF and 18 ft), installed before plastering and cleared of stucco before it sets.', item_es: tr('Juntas de control donde indica el plano (o paneles de no más de unos 144 pie² y 18 pies), colocadas antes de aplanar y limpias de estuco antes del fraguado.'), prov: ufgsStucco('3.3 control joints') },
    { id: 'stop_bead_gap', item: 'Casing beads stop the stucco about 3/8 in. from window and door frames, leaving a joint for backer rod and sealant.', item_es: tr('Las molduras de remate terminan el estuco a unos 3/8 pulg de marcos de ventanas y puertas, dejando junta para cordón de respaldo y sellador.'), prov: blm() },
    { id: 'temp_window', item: 'No stucco applied at 40 °F or below, or when the temperature is expected to fall below 40 °F within 48 hours.', item_es: tr('No aplicar estuco a 40 °F o menos, ni si se espera que la temperatura baje de 40 °F dentro de 48 horas.'), prov: ufgsStucco('1.5 environmental requirements') },
    { id: 'coat_cure', item: 'Scratch coat scored horizontally; scratch and brown coats each moist-cured about 72 hours and finish coat about 48 hours, fogged several times a day and shaded in hot, dry wind.', item_es: tr('Capa de rayado rayada en horizontal; las capas de rayado y café se curan húmedas unas 72 horas cada una y el acabado unas 48 horas, con niebla varias veces al día y sombra con viento seco y caliente.'), prov: ufgsStucco('3.8.2–3.8.4, 3.9') },
    { id: 'thickness_flatness', item: 'Three-coat stucco at least 1 in. thick overall; finished wall within about 1/8 in. of a 10 ft straightedge (smooth finishes).', item_es: tr('Estuco de tres capas de al menos 1 pulg de espesor total; muro terminado dentro de unos 1/8 pulg bajo una regla de 10 pies (acabados lisos).'), prov: ufgsStucco('3.8, 3.8.5') },
    { id: 'eifs_boards', item: 'EIFS foam boards long edge horizontal, joints staggered and offset from sheathing joints, corners interlocked, L-shaped pieces at openings, gaps filled and rasped flush, drainage channels aligned.', item_es: tr('Placas de espuma del EIFS con el lado largo horizontal, juntas alternadas y desfasadas de las juntas del entablado, esquinas trabadas, piezas en L en los vanos, huecos rellenos y lijados al ras, canales de drenaje alineados.'), prov: ufgsEifs('3.3.2 insulation board') },
    { id: 'eifs_mesh', item: 'EIFS mesh fully embedded with no pattern showing, diagonal mesh at opening corners, laps about 2.5 in., all terminations back-wrapped; base coat dry 24 h before finish.', item_es: tr('Malla del EIFS completamente embebida sin que se note el patrón, malla diagonal en esquinas de vanos, traslapes de unos 2.5 pulg, todos los bordes envueltos; capa base seca 24 h antes del acabado.'), prov: ufgsEifs('3.3.3, 3.3.4, 3.5.2 checklist') },
    { id: 'eifs_sealant', item: 'EIFS sealant joints at openings at least 1/2 in. wide (3/4 in. at expansion joints), with backer rod and primer, bonded to the base coat — not the finish coat.', item_es: tr('Juntas de sellador del EIFS en vanos de al menos 1/2 pulg (3/4 pulg en juntas de expansión), con cordón de respaldo e imprimador, adheridas a la capa base y no al acabado.'), prov: ufgsEifs('3.4 joint sealing') },
    { id: 'scaffold_ready', item: 'Scaffold fully planked with guardrails and inspected by a competent person before each shift of lathing or plastering.', item_es: PENDING_ES, safety: true, prov: osha('l') },
  ],
  inspection_checklists: {
    sheathing: [
      { item: 'Sheathing complete and gapped at edges; no panel joints aligned with opening corners', item_es: PENDING_ES },
      { item: 'Penetrations, windows and doors flashed into the WRB (head flashing with end dams, pan flashing)', item_es: PENDING_ES, ref: 'R703.4' },
      { item: 'Two-layer WRB (or approved equivalent) continuous to the top plate, lapped shingle-style', item_es: PENDING_ES, ref: 'R703.7.3' },
      { item: 'Weep screed set at the plate line, clear of grade and paving', item_es: PENDING_ES, ref: 'R703.7.2.1' },
      { item: 'Kick-out diverters at roof-wall intersections', item_es: PENDING_ES, ref: 'R703.4' },
      { item: 'Lath, casing beads and control joints installed and fastened — call for lath inspection before scratch coat', item_es: PENDING_ES, ref: 'R703.7.1' },
    ],
    final: [
      { item: 'Stucco complete, cured and free of open cracks; weep screed holes clear', item_es: PENDING_ES, ref: 'R703.7' },
      { item: 'EIFS installed per the listed system instructions with drainage where required', item_es: PENDING_ES, ref: 'R703.9' },
      { item: 'Sealant joints at all openings and dissimilar materials complete', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-STU-WRB2-SF', name: 'Two-layer WRB behind stucco (Grade D x2 or equivalent), per SF wall', name_es: 'Barrera contra el agua de dos capas bajo estuco (Grado D x2 o equivalente), por pie² de muro', unit: 'SF', csi: '07 25 00',
      material_cost_cents: { v: 30, prov: est('two plies of Grade D building paper or one stucco-rated drainable WRB, staples/caps; 2026 national baseline') }, labor_hours_per_unit: { v: 0.008, prov: est('two-person crew hangs ~1,000 SF of two-ply paper per day incl. laps at openings') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 12, prov: est('laps and cut-outs at openings') } },
    { code: 'B-STU-WEEP-LF', name: 'Weep screed at foundation plate line, installed, per LF', name_es: 'Botaguas inferior (weep screed) en la línea de la solera, instalado, por pie lineal', unit: 'LF', csi: '09 22 36',
      material_cost_cents: { v: 120, prov: est('galvanized or vinyl weep screed, 10 ft lengths + fasteners') }, labor_hours_per_unit: { v: 0.03, prov: est('snap level line, fasten, splice and miter corners') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 8, prov: est('corner miters and end cuts') } },
    { code: 'B-STU-CJ-LF', name: 'Stucco control / expansion joint accessory with lath cut, per LF', name_es: 'Junta de control o expansión para estuco con corte de malla, por pie lineal', unit: 'LF', csi: '09 22 36',
      material_cost_cents: { v: 150, prov: est('vinyl or zinc control joint accessory + wire ties') }, labor_hours_per_unit: { v: 0.04, prov: est('layout, cut lath, set and tie joint plumb/level') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 8, prov: est('end cuts at intersections') } },
    { code: 'B-STU-DRAINMAT-SF', name: 'Drainage mat / spacer behind stucco lath, per SF', name_es: 'Manto de drenaje o separador detrás de la malla de estuco, por pie²', unit: 'SF', csi: '07 25 00',
      material_cost_cents: { v: 90, prov: est('entangled-filament drainage mat roll, 2026 distributor spot') }, labor_hours_per_unit: { v: 0.006, prov: est('rolled on over WRB, held by lath fasteners') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 8, prov: est('laps and openings') } },
    { code: 'B-STU-EIFS-SF', name: 'EIFS with drainage (liquid WRB, grooved EPS, mesh base coat, acrylic finish), per SF', name_es: 'EIFS con drenaje (barrera líquida, EPS ranurado, capa base con malla, acabado acrílico), por pie²', unit: 'SF', csi: '07 24 13',
      material_cost_cents: { v: 650, prov: est('system materials for ~1.5 in. EPS drainage EIFS incl. starter track, mesh, base and finish; 2026 national baseline') }, labor_hours_per_unit: { v: 0.09, prov: est('WRB coat, board set and rasp, mesh/base, finish — multi-day sequence') },
      equipment_cost_cents: { v: 15, prov: est('mixer and rasp/tool wear share; scaffold carried separately') }, waste_pct: { v: 10, prov: est('board cut-offs at openings and corners') } },
    { code: 'B-STU-RECOAT-SF', name: 'Stucco recoat: patch cracks and apply acrylic finish coat over existing stucco, per SF', name_es: 'Recubrimiento de estuco: resanar grietas y aplicar acabado acrílico sobre estuco existente, por pie²', unit: 'SF', csi: '09 24 00',
      material_cost_cents: { v: 120, prov: est('bonding primer + acrylic finish + crack patch share') }, labor_hours_per_unit: { v: 0.03, prov: est('wash, patch, prime and texture-match finish') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; scaffold carried separately') }, waste_pct: { v: 8, prov: est('mixing and texture loss') } },
  ],
  quantity_rules: [
    { code: 'B-STU-WRB2-SF', assumption: 'Stucco/EIFS callout — two-layer WRB ≈1.1 SF wall per SF floor (same ratio as B-STUCCO-SF). Drop B-SID-WRB-SF if both appear', when: { facts_any: ['stucco_finish'] }, qty: { basis: 'area_sf_sum', mul: 1.1, round: 'round' } },
    { code: 'B-STU-WEEP-LF', assumption: 'Weep screed ≈ building perimeter ≈0.1 LF per SF floor — measure from the foundation plan', when: { facts_any: ['stucco_finish'] }, qty: { basis: 'area_sf_sum', mul: 0.1, round: 'round' } },
    { code: 'B-STU-CJ-LF', assumption: 'Control joints ≈1 LF per 10 SF of stucco wall (≈0.11 LF per SF floor) — use the elevations when joints are drawn', when: { facts_any: ['stucco_finish'] }, qty: { basis: 'area_sf_sum', mul: 0.11, round: 'round' } },
  ],
  dependency_hints: [
    { after_trades: ['windows', 'exterior_doors'], note: 'Windows and doors set and flashed into the WRB before lath covers the openings.' },
    { after_trades: ['roofing'], note: 'Roof underlayment, step flashing and kick-outs go in before the WRB and lath at roof-wall intersections.' },
  ],
});
