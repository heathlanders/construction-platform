// Trade Knowledge Pack — masonry (Masonry (Brick / Block / Stone)). Wave 08, COMPLEMENT pattern:
// the hand recipe in task-buildout/building.ts keeps producing the work steps (Lay masonry units →
// Flash, anchor & weep veneer); this pack adds glossary, hazards, QA, inspection checklists, extra
// code refs, equipment hints and assemblies the catalog lacks (adhered stone, flashing/weeps, steel
// lintels, cold-weather protection, final cleaning). B-CMU-SF / B-BRICK-VENEER-SF already exist.
// Dossier: docs/trade-packs/dossiers/masonry.md. Sources: UFGS 04 20 00, BIA TN 1/7B/20/28/31B,
// TMS 402/602 (ref), 29 CFR 1926 Subparts E, I, L, O, Q, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['masonry-ufgs-04-20-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const bia = (tn: string, note?: string) => ({ src: [`masonry-bia-${tn}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const tms = { src: ['masonry-tms-402-602', 'masonry-ufgs-04-20-00'], confidence: 'verified' as const, last_verified: D, note: 'UFGS 3.5.3 points to TMS 402/602 Art. 3.3 F for tolerances; values not reproduced.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'masonry',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Brick, concrete block (CMU) and stone walls and veneers: laying units in mortar, joint reinforcement, rebar and grout in block cells, veneer ties, through-wall flashing and weeps, lintels over openings, cold-weather protection and final cleaning.',
    summary_es: 'Muros y revestimientos de ladrillo, bloque de concreto (CMU) y piedra: colocación de piezas con mortero, refuerzo de junta, varilla y lechada en celdas de bloque, anclajes de revestimiento, tapajuntas pasantes y drenajes, dinteles sobre vanos, protección en clima frío y limpieza final.',
    glossary: [
      { term: 'CMU', term_es: 'Bloque de concreto (CMU)', def: 'Concrete masonry unit — the hollow concrete block used for structural and foundation walls.', def_es: 'Unidad de mampostería de concreto: el bloque hueco que se usa en muros estructurales y de cimentación.' },
      { term: 'Veneer', term_es: 'Revestimiento (chapa)', def: 'A single wythe of brick or stone that covers a wall but does not carry the building; it is tied back to the frame.', def_es: 'Una hoja de ladrillo o piedra que cubre el muro pero no carga el edificio; se ancla a la estructura.' },
      { term: 'Wythe', term_es: 'Hoja', def: 'One continuous vertical layer of masonry, one unit thick.', def_es: 'Una capa vertical continua de mampostería, del espesor de una pieza.' },
      { term: 'Veneer tie (anchor)', term_es: 'Anclaje de revestimiento', def: 'Corrugated or wire tie fastened to the backing and bedded in a mortar joint to hold the veneer to the wall.', def_es: 'Anclaje corrugado o de alambre fijado al respaldo y embebido en la junta de mortero para sujetar el revestimiento.' },
      { term: 'Through-wall flashing', term_es: 'Tapajuntas pasante', def: 'Waterproof sheet that catches water in the cavity and sends it out through the weeps at the wall base and over openings.', def_es: 'Lámina impermeable que recoge el agua de la cámara y la saca por los drenajes en la base del muro y sobre los vanos.' },
      { term: 'Weep', term_es: 'Drenaje (llorón)', def: 'Open head joint or vent just above the flashing that lets water drain out of the cavity.', def_es: 'Junta vertical abierta o rejilla justo encima del tapajuntas que deja salir el agua de la cámara.' },
      { term: 'Lintel', term_es: 'Dintel', def: 'Steel angle, precast or bond-beam member that carries the masonry over a door or window.', def_es: 'Ángulo de acero, pieza prefabricada o viga de bloque que carga la mampostería sobre una puerta o ventana.' },
      { term: 'Bond beam', term_es: 'Viga de amarre', def: 'Course of special block filled with grout and horizontal rebar that ties a block wall together.', def_es: 'Hilada de bloque especial rellena de lechada y varilla horizontal que amarra el muro de bloque.' },
      { term: 'Cleanout', term_es: 'Registro de limpieza', def: 'Opening at the bottom of a grout pour to clear mortar droppings and check the rebar before grouting.', def_es: 'Abertura al pie de un colado de lechada para sacar escombro de mortero y revisar la varilla antes de colar.' },
      { term: 'Tooling', term_es: 'Repasado de juntas', def: 'Striking mortar joints with a jointer when thumbprint hard so they shed water.', def_es: 'Repasar las juntas de mortero con un llaguero cuando están firmes al dedo para que escurran el agua.' },
    ],
  },
  est_bucket: 'building',
  recipes: [],
  code_refs: {
    foundation: [
      { section: 'R404.1', code_type: 'IRC', note: 'Concrete and masonry foundation walls — design, reinforcement, height limits', prov: icc },
    ],
    framing: [
      { section: 'R606', code_type: 'IRC', note: 'General masonry construction — units, mortar, grout, reinforcement', prov: icc },
      { section: '2104', code_type: 'IBC', note: 'Masonry construction — workmanship per TMS 602', prov: icc },
      { section: '1705.4', code_type: 'IBC', note: 'Special inspection of masonry construction', prov: icc },
    ],
    sheathing: [
      { section: 'R703.8', code_type: 'IRC', note: 'Anchored stone and masonry veneer — general', prov: icc },
      { section: 'R703.8.3', code_type: 'IRC', note: 'Lintels over veneer openings', prov: icc },
      { section: 'R703.8.4', code_type: 'IRC', note: 'Veneer anchorage — tie type, size and spacing', prov: icc },
      { section: 'R703.8.5', code_type: 'IRC', note: 'Flashing at veneer bases, supports and openings', prov: icc },
      { section: 'R703.8.6', code_type: 'IRC', note: 'Weepholes above veneer flashing', prov: icc },
      { section: 'R703.12', code_type: 'IRC', note: 'Adhered masonry veneer installation', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: 'masonry|cmu|block|brick|stone|veneer|cladding' }, type: 'telehandler', reason: 'Lift brick and block pallets and mortar tubs onto the scaffold', optional: true },
    { when: { title_re: 'masonry|cmu|block|brick|stone|veneer|cladding', building_types: ['residential_mf', 'commercial', 'industrial'] }, type: 'material_hoist', reason: 'Raise units and mortar to upper scaffold lifts on multi-story walls', optional: true },
    { when: { title_re: 'masonry|cmu|block|brick|stone|veneer|cladding', building_types: ['residential_mf', 'commercial', 'industrial'] }, type: 'forklift', reason: 'Rough-terrain forklift to stage pallets along long wall runs', optional: true },
  ],
  hazards: [
    { id: 'wall_collapse_laz', hazard: 'Wall under construction collapsing onto workers on the unscaffolded side', hazard_es: PENDING_ES, controls: ['Set a limited access zone before the wall starts: wall height plus 4 ft, full wall length, on the unscaffolded side', 'Only the crew building the wall may enter; keep the zone until the wall is supported'], controls_es: PENDING_ES, osha_ref: '1926.706(a)', severity: 4, prov: osha('q') },
    { id: 'wall_bracing', hazard: 'Unbraced block or brick wall over 8 ft blown over by wind', hazard_es: PENDING_ES, controls: ['Brace walls over 8 ft until permanent supports are in place', 'Stop work and clear the area in high wind'], controls_es: PENDING_ES, osha_ref: '1926.706(b)', severity: 4, prov: osha('q') },
    { id: 'rebar_impalement', hazard: 'Impalement on vertical rebar dowels sticking out of footings and block cells', hazard_es: PENDING_ES, controls: ['Cap or cover protruding rebar anyone could fall onto'], controls_es: PENDING_ES, osha_ref: '1926.701(b)', severity: 4, prov: osha('q') },
    { id: 'scaffold_fall', hazard: 'Fall from mason scaffold platforms', hazard_es: PENDING_ES, controls: ['Provide guardrails or personal fall arrest on scaffolds more than 10 ft above the lower level', 'Fully plank working levels'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, ppe: ['harness when guardrails are not in place'], prov: osha('l') },
    { id: 'scaffold_overload', hazard: 'Scaffold collapse from stacked brick, block and mortar tubs', hazard_es: PENDING_ES, controls: ['Never load a scaffold beyond its rated capacity; spread pallets over supports', 'Set legs on base plates and mud sills on firm ground'], controls_es: PENDING_ES, osha_ref: '1926.451(f)(1)', severity: 4, prov: osha('l') },
    { id: 'scaffold_inspect', hazard: 'Damaged or altered scaffold used without a check', hazard_es: PENDING_ES, controls: ['Competent person inspects the scaffold before each shift and after anything that could weaken it', 'Erect, raise and alter scaffold only under competent-person direction'], controls_es: PENDING_ES, osha_ref: '1926.451(f)(3)', severity: 3, prov: osha('l') },
    { id: 'falling_objects', hazard: 'Workers below struck by falling brick, block, tools or mortar', hazard_es: PENDING_ES, controls: ['Install toeboards, screens or debris netting on scaffolds', 'Barricade the area below and wear hard hats'], controls_es: PENDING_ES, osha_ref: '1926.451(h)(1)', severity: 3, ppe: ['hard hat'], prov: osha('l') },
    { id: 'silica_cutting', hazard: 'Breathing crystalline silica dust when cutting or grinding block, brick and stone', hazard_es: PENDING_ES, controls: ['Cut with a water-fed saw or a shrouded tool with dust collection, per the Table 1 controls', 'Never dry-sweep or blow off dust with compressed air'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator when Table 1 requires it', 'safety glasses'], prov: osha('z') },
    { id: 'cement_burns', hazard: 'Skin and eye burns from wet mortar and grout (alkaline cement)', hazard_es: PENDING_ES, controls: ['Wear gloves, long sleeves and eye protection when mixing and laying', 'Wash skin promptly; keep clean water on site for eye flushing'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['alkali-resistant gloves', 'safety glasses'], prov: osha('e') },
    { id: 'mixer_guard', hazard: 'Caught in mortar mixer paddles or drive', hazard_es: PENDING_ES, controls: ['Keep the mixer grate and guards on while running', 'Shut off before reaching in or cleaning'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 3, prov: osha('i') },
    { id: 'forklift', hazard: 'Struck by or tip-over of the forklift or telehandler moving pallets', hazard_es: PENDING_ES, controls: ['Only trained, evaluated operators drive powered industrial trucks', 'Keep people clear of the load path; travel with loads low'], controls_es: PENDING_ES, osha_ref: '1926.602(d)', severity: 4, prov: osha('o') },
    { id: 'eye_chips', hazard: 'Eye injury from flying chips when cutting, chiseling or striking units', hazard_es: PENDING_ES, controls: ['Wear safety glasses or a face shield whenever cutting, splitting or chipping'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses', 'face shield'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'units_dry_unfrozen', item: 'Units, mortar materials and flashing stored off the ground and covered; no units laid wet, frozen or with ice or snow on them.', item_es: tr('Piezas, materiales de mortero y tapajuntas almacenados sobre el suelo y cubiertos; no se colocan piezas mojadas, congeladas o con hielo o nieve.'), prov: bia('tn1') },
    { id: 'joints_full', item: 'Head and bed joints in exterior wythes completely filled; no slushed head joints; joints tooled when thumbprint hard.', item_es: tr('Juntas verticales y horizontales de hojas exteriores totalmente llenas; sin juntas rellenadas a cuchara; juntas repasadas cuando están firmes al dedo.'), prov: bia('tn7b') },
    { id: 'plumb_level', item: 'Courses level, walls plumb and true to line within the TMS 602 tolerances checked with level and line.', item_es: tr('Hiladas a nivel y muros a plomo y en línea dentro de las tolerancias de TMS 602, verificadas con nivel y cordel.'), prov: tms },
    { id: 'rebar_grout', item: 'Vertical rebar in the cells shown on the structural plan, held in position, and cells under lintel bearings and below grade solidly grouted.', item_es: tr('Varilla vertical en las celdas indicadas en el plano estructural, sujeta en posición, y celdas bajo apoyos de dintel y bajo nivel de terreno totalmente rellenas de lechada.'), prov: ufgs('3.4.2 grouting') },
    { id: 'cleanouts', item: 'Cleanouts at the base of tall grout pours; mortar droppings removed and rebar checked before grouting; cleanouts closed after inspection.', item_es: tr('Registros de limpieza al pie de colados altos de lechada; escombro de mortero retirado y varilla revisada antes de colar; registros cerrados después de la inspección.'), prov: ufgs('3.4.2.4.2 cleanouts when grout pour exceeds 5 ft 4 in') },
    { id: 'grout_time', item: 'Site-mixed grout placed within 1-1/2 hours of mixing; no water added to stiff ready-mix; lifts paced so face shells do not blow out.', item_es: tr('Lechada mezclada en obra colocada dentro de 1-1/2 horas; no se agrega agua a la premezclada endurecida; capas espaciadas para que no revienten las caras del bloque.'), prov: ufgs('3.4.2') },
    { id: 'air_space_clear', item: 'Veneer air space at least 1 in. and kept free of mortar droppings; base of cavity clean above the flashing.', item_es: tr('Cámara del revestimiento de al menos 1 pulg y libre de escombro de mortero; base de la cámara limpia sobre el tapajuntas.'), prov: bia('tn28') },
    { id: 'ties_spacing', item: 'Veneer ties fastened into studs or backing at the plan/code spacing, extra ties around openings, and bedded with mortar cover on both sides.', item_es: tr('Anclajes del revestimiento fijados a montantes o respaldo al espaciado del plano o código, anclajes adicionales alrededor de vanos y embebidos con mortero por ambos lados.'), prov: bia('tn28', 'Mortar cover on anchors per BIA TN 7B (5/8 in).') },
    { id: 'flashing_laps', item: 'Through-wall flashing extends past the wall face, laps at least 6 in. and is sealed, has end dams at heads and sills, and is not punctured.', item_es: tr('El tapajuntas pasante sobresale de la cara del muro, traslapa al menos 6 pulg y está sellado, tiene topes en dinteles y alféizares y no está perforado.'), prov: bia('tn7b') },
    { id: 'weeps_open', item: 'Weeps in the course directly above every flashing, open and clear of mortar, at no more than 24 in. on center.', item_es: tr('Drenajes en la hilada justo encima de cada tapajuntas, abiertos y sin mortero, a no más de 24 pulg entre centros.'), prov: bia('tn7b', 'BIA recommends 24 in o.c. for open head joints — closer than typical code maximum.') },
    { id: 'lintel_bearing', item: 'Lintels set in a full mortar bed with the specified end bearing (at least 4 in. on veneer, 8 in. unless noted on CMU) and cells under bearings grouted.', item_es: tr('Dinteles asentados en cama llena de mortero con el apoyo especificado (mínimo 4 pulg en revestimiento, 8 pulg en CMU salvo indicación) y celdas bajo los apoyos rellenas.'), prov: { src: ['masonry-ufgs-04-20-00', 'masonry-bia-tn28', 'masonry-bia-tn31b'], confidence: 'verified', last_verified: D, note: 'UFGS 3.3.8.2 (8 in); BIA TN 28 (4 in on veneer).' } },
    { id: 'cold_weather', item: 'Below 40 °F: mortar materials heated, no antifreeze or calcium chloride admixtures, and new masonry covered and protected for at least 24 hours.', item_es: tr('Por debajo de 40 °F: materiales de mortero calentados, sin aditivos anticongelantes ni cloruro de calcio, y la mampostería nueva cubierta y protegida al menos 24 horas.'), prov: bia('tn1') },
    { id: 'wall_tops_covered', item: 'Tops of unfinished walls covered at end of each day, the cover reaching 2 ft down both sides and held in place.', item_es: tr('Partes superiores de muros sin terminar cubiertas al final de cada día, con la cubierta bajando 2 pies por ambos lados y asegurada.'), prov: ufgs('3.9 protection') },
    { id: 'wall_braced', item: 'Walls over 8 ft braced and the limited access zone kept until the wall is permanently supported; no loads placed on new walls too early.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-q', 'masonry-ufgs-04-20-00'], confidence: 'verified', last_verified: D, note: '1926.706; UFGS 3.2.2 — no uniform loads for 36 h or concentrated loads for 72 h.' } },
    { id: 'cleaning', item: 'Final cleaning method trial-tested on a small area and allowed to dry before the whole wall; wall pre-wet, low water pressure, no unbuffered muriatic acid.', item_es: tr('Método de limpieza final probado en un área pequeña y dejado secar antes de todo el muro; muro humedecido antes, baja presión de agua, sin ácido muriático sin amortiguar.'), prov: bia('tn20') },
  ],
  inspection_checklists: {
    framing: [
      { item: 'Structural masonry: rebar size, spacing, laps and position checked before grouting (pre-grout inspection)', item_es: PENDING_ES, ref: 'R606' },
      { item: 'Cleanouts open and grout spaces clean before the pour', item_es: PENDING_ES },
      { item: 'Bond beams and lintels reinforced and grouted per plan', item_es: PENDING_ES },
      { item: 'Special inspection reports on file where the plans require them', item_es: PENDING_ES, ref: '1705.4' },
    ],
    sheathing: [
      { item: 'Water-resistive barrier behind veneer lapped and intact; penetrations sealed', item_es: PENDING_ES, ref: 'R703.8' },
      { item: 'Base, head and sill flashing with end dams installed before veneer covers it', item_es: PENDING_ES, ref: 'R703.8.5' },
      { item: 'Ties at required spacing and weeps above every flashing course', item_es: PENDING_ES, ref: 'R703.8.4' },
      { item: 'Lintels over openings sized and bearing per plan', item_es: PENDING_ES, ref: 'R703.8.3' },
    ],
    final: [
      { item: 'Weeps open; sealant joints at openings and control joints complete', item_es: PENDING_ES },
      { item: 'Masonry cleaned; no mortar smears, efflorescence or open joints', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-MAS-STONE-ADH-SF', name: 'Adhered manufactured stone veneer on lath and scratch coat, per SF', name_es: 'Revestimiento de piedra manufacturada adherida sobre malla y repello, por pie²', unit: 'SF', csi: '04 73 00',
      material_cost_cents: { v: 950, prov: est('manufactured stone flats + WRB layer, metal lath, scratch and setting mortar, 2026 national baseline') }, labor_hours_per_unit: { v: 0.12, prov: est('lath, scratch coat, back-butter and set units, grout joints') },
      equipment_cost_cents: { v: 0, prov: est('tools only; scaffold carried separately') }, waste_pct: { v: 10, prov: est('cutting and corner pieces') } },
    { code: 'B-MAS-FLASH-WEEP-LF', name: 'Through-wall flashing with end dams, termination bar, weeps and cavity drainage mesh, per LF', name_es: 'Tapajuntas pasante con topes, barra de terminación, drenajes y malla de drenaje de cámara, por pie lineal', unit: 'LF', csi: '07 65 00',
      material_cost_cents: { v: 450, prov: est('self-adhered/composite flashing, drip edge, weep vents, mortar net, sealant share') }, labor_hours_per_unit: { v: 0.06, prov: est('prime, set, lap and seal, install weeps') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('laps and corner pieces') } },
    { code: 'B-MAS-LINTEL-EA', name: 'Steel angle lintel for masonry opening up to ~6 ft, galvanized, set with flashing, each', name_es: 'Dintel de ángulo de acero para vano de mampostería hasta ~6 pies, galvanizado, colocado con tapajuntas, c/u', unit: 'EA', csi: '05 50 00',
      material_cost_cents: { v: 9000, prov: est('galvanized steel angle cut to length, 2026 distributor spot — volatile') }, labor_hours_per_unit: { v: 0.75, prov: est('set in mortar bed, shim, flash over') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('cut to length') } },
    { code: 'B-MAS-COLD-WX-SF', name: 'Cold-weather masonry protection — enclosure, blankets and heat, per SF of wall laid', name_es: 'Protección de mampostería en clima frío — encerramiento, mantas y calefacción, por pie² de muro', unit: 'SF', csi: '01 51 00',
      material_cost_cents: { v: 60, prov: est('poly enclosure and insulating blanket share, heated mortar materials') }, labor_hours_per_unit: { v: 0.01, prov: est('erect/strip enclosure, tend heaters') },
      equipment_cost_cents: { v: 40, prov: est('temporary heater rental and fuel share') }, waste_pct: { v: 0, prov: est('consumables priced per SF') } },
    { code: 'B-MAS-CLEAN-SF', name: 'Final masonry cleaning — trial area, pre-wet, detergent, low-pressure rinse, per SF', name_es: 'Limpieza final de mampostería — área de prueba, humedecido, detergente, enjuague a baja presión, por pie²', unit: 'SF', csi: '04 01 20',
      material_cost_cents: { v: 15, prov: est('proprietary masonry detergent share') }, labor_hours_per_unit: { v: 0.012, prov: est('scrape, pre-wet, apply, rinse') },
      equipment_cost_cents: { v: 5, prov: est('low-pressure washer share') }, waste_pct: { v: 0, prov: est('consumables priced per SF') } },
  ],
  quantity_rules: [
    { code: 'B-MAS-LINTEL-EA', assumption: 'Masonry veneer on plans — one steel lintel per window (add doors and garage openings when the elevations are read)', when: { facts_any: ['masonry_veneer'] }, qty: { basis: 'windows' } },
    { code: 'B-MAS-FLASH-WEEP-LF', assumption: 'Masonry veneer on plans — assume ≈160 LF of base flashing with weeps (typical single-family perimeter) until measured; add head/sill flashing at openings', when: { facts_any: ['masonry_veneer'] }, qty: { basis: 'const', mul: 160 } },
    { code: 'B-MAS-CLEAN-SF', assumption: '≈0.4 SF of veneer per SF of floor (matches the brick-veneer seed) — final cleaning on that area', when: { facts_any: ['masonry_veneer'] }, qty: { basis: 'area_sf_sum', mul: 0.4, round: 'round' } },
  ],
  dependency_hints: [
    { after_trades: ['concrete'], note: 'Masonry starts on a footing or foundation that has passed inspection and gained strength.' },
    { after_trades: ['windows'], note: 'Veneer goes on after windows and the water-resistive barrier are installed so flashing can lap correctly.' },
  ],
});
