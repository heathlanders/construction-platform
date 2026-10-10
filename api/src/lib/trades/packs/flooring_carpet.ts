// Trade Knowledge Pack — flooring_carpet (Flooring — Carpet). Wave 03, COMPLEMENT pattern:
// the shared flooring branch in task-buildout/nopermit.ts keeps producing the work steps (prep →
// install); this pack adds glossary, hazards, QA, owner/spec hold points, equipment-free assemblies
// the catalog lacks (carpet tile, stairs, transitions, tear-out, cushion upgrade, slab moisture test)
// and quantity rules. permit_trade null → NO gates, NO code_refs.
// Focus: residential stretch-in broadloom (CRI 105) + commercial glue-down / carpet tile (CRI 104).
// Dossier: docs/trade-packs/dossiers/flooring_carpet.md. Sources: UFGS 09 68 00, CRI 104/105,
// Shaw Floors planning page, 29 CFR 1926 Subparts C, D, E, F, H, I, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['flooring_carpet-ufgs-09-68-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const cri104 = (note?: string) => ({ src: ['flooring_carpet-cri-104'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const cri105 = (note?: string) => ({ src: ['flooring_carpet-cri-105'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const cri = (note?: string) => ({ src: ['flooring_carpet-cri-104', 'flooring_carpet-cri-105'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'flooring_carpet',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Carpet floor covering: subfloor and slab prep, cushion and tack strip, power-stretched wall-to-wall broadloom in homes, glue-down broadloom and carpet tile in commercial space, seams, stairs, transitions and final cleanup.',
    summary_es: 'Recubrimiento de piso con alfombra: preparación del contrapiso y la losa, bajo-alfombra y tira de tachuelas, alfombra de rollo estirada a pared en casas, alfombra pegada y loseta de alfombra en espacios comerciales, costuras, escaleras, transiciones y limpieza final.',
    glossary: [
      { term: 'Broadloom', term_es: 'Alfombra de rollo', def: 'Carpet made in wide rolls, usually 12 ft, cut to fit the room.', def_es: 'Alfombra fabricada en rollos anchos, normalmente de 12 pies, que se corta a la medida del cuarto.' },
      { term: 'Carpet tile', term_es: 'Loseta de alfombra', def: 'Square modular carpet pieces glued or tabbed down in a set pattern; common in offices.', def_es: 'Piezas cuadradas de alfombra modular, pegadas o con adhesivo en lengüetas en un patrón definido; comunes en oficinas.' },
      { term: 'Cushion (pad)', term_es: 'Bajo-alfombra (colchón)', def: 'Layer under stretch-in carpet; type and thickness must meet the carpet maker warranty.', def_es: 'Capa bajo la alfombra estirada; el tipo y grosor deben cumplir la garantía del fabricante de la alfombra.' },
      { term: 'Tack strip (tackless strip)', term_es: 'Tira de tachuelas', def: 'Wood strip with angled pins nailed around the room edge that grips the stretched carpet.', def_es: 'Tira de madera con púas inclinadas, clavada en el perímetro del cuarto, que sujeta la alfombra estirada.' },
      { term: 'Power stretcher', term_es: 'Estirador mecánico', def: 'Lever tool with extension poles that stretches carpet tight wall to wall.', def_es: 'Herramienta de palanca con tubos de extensión que estira la alfombra firme de pared a pared.' },
      { term: 'Knee kicker', term_es: 'Rodillera estiradora', def: 'Short hand tool bumped with the knee to hook carpet onto tack strip in tight spots.', def_es: 'Herramienta corta que se golpea con la rodilla para enganchar la alfombra en la tira de tachuelas en espacios reducidos.' },
      { term: 'Seam sealer', term_es: 'Sellador de costuras', def: 'Adhesive bead on cut carpet edges that stops yarn from fraying at seams.', def_es: 'Cordón de adhesivo en los bordes cortados que evita que el hilo se deshilache en las costuras.' },
      { term: 'Transition molding', term_es: 'Moldura de transición', def: 'Metal or vinyl strip that covers and protects the carpet edge where it meets another floor.', def_es: 'Tira de metal o vinilo que cubre y protege el borde de la alfombra donde se une con otro piso.' },
      { term: 'Dye lot', term_es: 'Lote de tinte', def: 'Production batch; all carpet in one area should come from the same lot so color matches.', def_es: 'Lote de producción; toda la alfombra de un área debe ser del mismo lote para que el color coincida.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  hazards: [
    { id: 'knee_trauma', hazard: 'Knee bursitis and joint damage from repeated knee-kicker strikes and long kneeling', hazard_es: PENDING_ES,
      controls: ['Use the power stretcher for every room stretch; keep the knee kicker for small areas and hooking edges', 'Wear knee pads and rotate kneeling tasks between crew members'], controls_es: PENDING_ES,
      osha_ref: '1926.95(a)', severity: 2, ppe: ['knee pads'], prov: osha('e', 'PPE duty; CRI 105 makes power stretching mandatory, which also limits kicker use.') },
    { id: 'adhesive_vapors', hazard: 'Breathing solvent or adhesive vapors during glue-down, seam sealing and floor prep in closed rooms', hazard_es: PENDING_ES,
      controls: ['Run fresh-air ventilation during install and for the time the adhesive maker lists afterward', 'Read the SDS before use; wear the respirator it calls for when ventilation is not enough'], controls_es: PENDING_ES,
      osha_ref: '1926.57(a)', severity: 3, ppe: ['respirator per SDS'], prov: { src: ['ecfr-1926-d', 'flooring_carpet-ufgs-09-68-00'], confidence: 'verified', last_verified: D, note: 'UFGS 3.4 continues ventilation during and 72 h after install.' } },
    { id: 'flammable_adhesive', hazard: 'Fire or flash from solvent-based adhesive, seam sealer or primer vapors near an ignition source', hazard_es: PENDING_ES,
      controls: ['No smoking or open flame near adhesive work; post the area', 'Shut off pilot lights and keep flammable liquids in approved closed containers'], controls_es: PENDING_ES,
      osha_ref: '1926.151(a)(3)', severity: 3, prov: osha('f') },
    { id: 'knife_cuts', hazard: 'Deep cuts from carpet knives, loop-pile cutters and seam cutters', hazard_es: PENDING_ES,
      controls: ['Change blades often; a dull blade needs more force and slips', 'Cut away from the body and the free hand; retract or cover blades when not cutting'], controls_es: PENDING_ES,
      osha_ref: '1926.301(a)', severity: 3, ppe: ['cut-resistant gloves'], prov: osha('i') },
    { id: 'tack_strip_debris', hazard: 'Punctures from tack strip pins and nails, and trips on scrap, cut-offs and rolled carpet edges', hazard_es: PENDING_ES,
      controls: ['Bag old tack strip and scrap with nails as it comes up; keep walkways and stairs clear', 'Wear gloves when handling tack strip; never kneel on loose strip'], controls_es: PENDING_ES,
      osha_ref: '1926.25(a)', severity: 2, ppe: ['work gloves'], prov: osha('c') },
    { id: 'roll_lifting', hazard: 'Back strain lifting and carrying heavy carpet rolls and cushion bundles, especially up stairs', hazard_es: PENDING_ES,
      controls: ['Use a carpet dolly, roll cart or pole carry with two or more workers', 'Train the crew on team lifts and plan the carry path before moving a roll'], controls_es: PENDING_ES,
      osha_ref: '1926.21(b)(2)', severity: 3, prov: osha('c', 'Training duty; no specific lifting limit in Part 1926.') },
    { id: 'roll_storage', hazard: 'Stacked carpet rolls rolling or sliding off a pile onto a worker', hazard_es: PENDING_ES,
      controls: ['Store rolls flat on a clean level floor, chocked or blocked so they cannot roll', 'Do not stack rolls higher than can be blocked and reached safely'], controls_es: PENDING_ES,
      osha_ref: '1926.250(a)(1)', severity: 3, prov: osha('h') },
    { id: 'stretcher_kickback', hazard: 'Power stretcher head slipping off the carpet or pole kicking back under tension', hazard_es: PENDING_ES,
      controls: ['Inspect the head teeth, poles and lever lock before use; replace worn parts', 'Brace the tail block against a padded wall plate and keep the body out of line with the pole'], controls_es: PENDING_ES,
      osha_ref: '1926.300(a)', severity: 2, prov: osha('i') },
    { id: 'seaming_iron', hazard: 'Burns and shock from hot-melt seaming irons and their cords', hazard_es: PENDING_ES,
      controls: ['Use double-insulated or grounded irons on GFCI-protected power; inspect cords before use', 'Set the iron on its stand, never on the carpet or a worker path'], controls_es: PENDING_ES,
      osha_ref: '1926.302(a)(1)', severity: 2, prov: osha('i') },
    { id: 'old_flooring_asbestos', hazard: 'Asbestos fibers released when scraping old resilient flooring or black cutback adhesive found under old carpet', hazard_es: PENDING_ES,
      controls: ['Treat asphalt or vinyl flooring and mastic installed before 1981 as asbestos unless tested and cleared', 'Stop and call for testing before sanding, grinding or scraping it; do not dry-scrape'], controls_es: PENDING_ES,
      osha_ref: '1926.1101(k)(1)', severity: 4, prov: osha('z') },
    { id: 'slab_grinding_silica', hazard: 'Silica dust when grinding high spots or cutting cured patch on a concrete slab', hazard_es: PENDING_ES,
      controls: ['Use grinders with shroud and HEPA vacuum or wet methods as listed for the task', 'Wear the respirator the task requires; keep others out of the dust area'], controls_es: PENDING_ES,
      osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator', 'safety glasses'], prov: osha('z') },
  ],
  qa_checklist: [
    { id: 'substrate_clean_flat', phase: 'finishes_interior', item: 'Subfloor clean, dry and sound; holes, cracks and ridges patched with a product the carpet or adhesive maker approves; floor swept before install.', item_es: tr('Contrapiso limpio, seco y firme; agujeros, grietas y bordos resanados con un producto aprobado por el fabricante de la alfombra o del adhesivo; piso barrido antes de instalar.'), prov: ufgs('3.1 surface preparation') },
    { id: 'slab_moisture_tested', phase: 'finishes_interior', item: 'Concrete slab moisture (calcium chloride emission and/or in-slab relative humidity) and alkalinity tested before glue-down, results within the carpet and adhesive maker limits, report on file.', item_es: tr('Humedad de la losa de concreto (emisión con cloruro de calcio y/o humedad relativa interna) y alcalinidad probadas antes de pegar; resultados dentro de los límites del fabricante de la alfombra y del adhesivo; informe archivado.'), prov: ufgs('3.2 cites CRI 104/105, ASTM F1869, ASTM F2170; limits are spec/manufacturer values') },
    { id: 'slab_tests_spaced', phase: 'finishes_interior', item: 'Moisture tests spread across each install area at the frequency the spec lists, with at least three per area.', item_es: tr('Pruebas de humedad repartidas en cada área de instalación con la frecuencia que indica la especificación, con al menos tres por área.'), prov: ufgs('3.2 test frequency') },
    { id: 'acclimated', phase: 'finishes_interior', item: 'Carpet, cushion and adhesive acclimated in the conditioned room; room at the temperature and humidity range the install standard and maker list.', item_es: tr('Alfombra, bajo-alfombra y adhesivo aclimatados en el cuarto acondicionado; cuarto dentro del rango de temperatura y humedad que indican la norma de instalación y el fabricante.'), prov: cri105('Product acclimation + site conditions sections') },
    { id: 'cushion_per_warranty', phase: 'finishes_interior', item: 'Cushion type, density and thickness match what the carpet maker warranty requires; residential cushion not thicker than the install standard allows.', item_es: tr('Tipo, densidad y grosor del bajo-alfombra coinciden con lo que exige la garantía del fabricante; el bajo-alfombra residencial no excede el grosor que permite la norma.'), prov: { src: ['flooring_carpet-cri-105', 'flooring_carpet-shaw-plan'], confidence: 'verified', last_verified: D } },
    { id: 'seam_layout', phase: 'finishes_interior', item: 'Seams kept to a minimum, run the length of the room with main traffic, away from pivot points, not across doorways and not facing incoming window light.', item_es: tr('Costuras al mínimo, a lo largo del cuarto en el sentido del tráfico principal, lejos de puntos de giro, no a través de puertas y no de frente a la luz de las ventanas.'), prov: cri('Seams section; UFGS 3.4.1 same rules') },
    { id: 'seams_sealed', phase: 'finishes_interior', item: 'Every seam edge-sealed per the carpet maker; seams tight with no gaps, overlaps or peaking; pile direction the same on both sides.', item_es: tr('Cada costura con los bordes sellados según el fabricante; costuras firmes sin aberturas, traslapes ni levantamientos; dirección del pelo igual en ambos lados.'), prov: cri105('Sealing edges/seams') },
    { id: 'power_stretched', phase: 'finishes_interior', item: 'Wall-to-wall stretch-in carpet power-stretched in the standard sequence and hooked on tack strip — no kicker-only stretches; no wrinkles or ripples.', item_es: tr('Alfombra estirada a pared tensada con estirador mecánico en la secuencia de la norma y enganchada en la tira de tachuelas, no solo con rodillera; sin arrugas ni ondulaciones.'), prov: cri105('Power stretching mandatory') },
    { id: 'tack_strip_set', phase: 'finishes_interior', item: 'Tack strip fastened every few inches along every wall with the gully gap the standard lists, pins toward the wall; doubled where the maker requires.', item_es: tr('Tira de tachuelas fijada a lo largo de cada pared con la separación que indica la norma, púas hacia la pared; doble donde el fabricante lo pide.'), prov: cri105('Tackless strip installation') },
    { id: 'transitions_secured', phase: 'finishes_interior', item: 'Every edge where carpet meets another floor is covered by a secured transition molding (or edge-sealed where none is used); no exposed raw edges.', item_es: tr('Cada borde donde la alfombra se une con otro piso está cubierto con una moldura de transición fija (o sellado donde no se usa moldura); sin bordes crudos expuestos.'), prov: cri105('Transitions to other surfaces') },
    { id: 'stairs_tight', phase: 'finishes_interior', item: 'Stair carpet tight over each nosing with no looseness that can catch a foot; pile running down the stairs; tack strip or adhesive per the standard.', item_es: PENDING_ES, safety: true, prov: cri105('Carpet on stairs') },
    { id: 'tile_pattern', phase: 'finishes_interior', item: 'Carpet tile laid in the specified pattern (monolithic, quarter-turn, ashlar…) with arrows as specified, joints snug, adhesive or tabs per maker and cured before traffic.', item_es: tr('Loseta de alfombra colocada en el patrón especificado (monolítico, cuarto de vuelta, escalonado…), flechas como se especifica, juntas ajustadas, adhesivo o lengüetas según el fabricante y curado antes del tráfico.'), prov: { ...cri104('Modular tile: pattern and method per carpet maker'), src: ['flooring_carpet-ufgs-09-68-00', 'flooring_carpet-cri-104'] } },
    { id: 'same_dye_lot', phase: 'finishes_interior', item: 'All carpet in one area from the same dye lot; attic stock of the same lot left for the owner as the spec lists.', item_es: tr('Toda la alfombra de un área del mismo lote de tinte; material de reserva del mismo lote entregado al dueño según la especificación.'), prov: ufgs('3.7.1 extra materials') },
    { id: 'install_ventilated', phase: 'finishes_interior', item: 'Fresh-air ventilation running during install and after, for the period the spec or adhesive maker requires, before the space is occupied.', item_es: PENDING_ES, safety: true, prov: ufgs('3.4 ventilation during + 72 h after') },
    { id: 'cleaned_protected', phase: 'finishes_interior', item: 'Scraps and adhesive removed from the face, sprouted yarn trimmed, HEPA vacuumed, and finished carpet covered and kept free of traffic for the period specified.', item_es: tr('Retazos y adhesivo retirados de la superficie, hilos sueltos recortados, aspirado con filtro HEPA, y alfombra terminada cubierta y sin tráfico durante el tiempo especificado.'), prov: ufgs('3.5 cleaning and protection') },
  ],
  inspection_checklists: {
    substrate_acceptance: [
      { item: 'Building enclosed and HVAC running at install conditions', item_es: tr('Edificio cerrado y climatización funcionando en las condiciones de instalación'), ref: 'CRI 105 site conditions' },
      { item: 'Slab moisture and alkalinity report reviewed and within limits', item_es: tr('Informe de humedad y alcalinidad de la losa revisado y dentro de límites'), ref: 'UFGS 09 68 00 3.2' },
      { item: 'Old flooring under carpet checked for asbestos before removal', item_es: PENDING_ES },
      { item: 'Subfloor patched, flat, clean and dry', item_es: tr('Contrapiso resanado, plano, limpio y seco'), ref: 'UFGS 09 68 00 3.1' },
    ],
    layout_seam_plan: [
      { item: 'Seam diagram approved: locations, pile direction and pattern match', item_es: tr('Diagrama de costuras aprobado: ubicación, dirección del pelo y coincidencia del patrón'), ref: 'UFGS 09 68 00 3.4' },
      { item: 'Carpet tile pattern and start point agreed with the owner or designer', item_es: tr('Patrón de loseta y punto de inicio acordados con el dueño o diseñador') },
      { item: 'Cushion product matches the carpet warranty', item_es: tr('El bajo-alfombra coincide con la garantía de la alfombra') },
    ],
    final_walkthrough: [
      { item: 'No wrinkles, ripples, visible seams or raveling edges', item_es: tr('Sin arrugas, ondulaciones, costuras visibles ni bordes deshilachados') },
      { item: 'Transitions secured; stair carpet tight at every nosing', item_es: PENDING_ES },
      { item: 'Carpet clean, vacuumed and protected; attic stock delivered', item_es: tr('Alfombra limpia, aspirada y protegida; material de reserva entregado'), ref: 'UFGS 09 68 00 3.5' },
      { item: 'Maintenance instructions and warranty handed to the owner', item_es: tr('Instrucciones de mantenimiento y garantía entregadas al dueño') },
    ],
  },
  assemblies: [
    { code: 'G-CPT-TILE-SF', name: 'Carpet tile, commercial grade, glue-down or tab, per SF', name_es: 'Loseta de alfombra comercial, pegada o con lengüetas, por pie²', unit: 'SF', csi: '09 68 13',
      material_cost_cents: { v: 350, prov: est('mid-grade commercial carpet tile + releasable adhesive or tabs, national baseline 2026') }, labor_hours_per_unit: { v: 0.012, prov: est('one installer ≈ 650 SF/day on open office floor after prep') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('cuts at walls and columns; spec attic stock carried separately') } },
    { code: 'G-CPT-STAIR-EA', name: 'Carpet and cushion on stairs, per step (tread + riser + nosing)', name_es: 'Alfombra y bajo-alfombra en escalera, por escalón (huella + contrahuella + nariz)', unit: 'EA', csi: '09 68 16',
      material_cost_cents: { v: 1500, prov: est('≈0.5 SY carpet + cushion + tack strip/staples per step, mid-grade residential') }, labor_hours_per_unit: { v: 0.35, prov: est('cap-and-band or waterfall step incl. trimming') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 15, prov: est('stair cuts from roll goods waste more than room fills') } },
    { code: 'G-CPT-TRANS-EA', name: 'Carpet transition molding at a doorway, metal or vinyl, each', name_es: 'Moldura de transición de alfombra en puerta, metal o vinilo, c/u', unit: 'EA', csi: '09 68 16',
      material_cost_cents: { v: 1500, prov: est('36 in. metal or vinyl carpet-to-hard-surface transition + fasteners') }, labor_hours_per_unit: { v: 0.25, prov: est('cut, fasten or glue, tuck carpet edge') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-CPT-REMOVE-SY', name: 'Remove existing carpet, cushion and tack strip, bag and haul to on-site container, per SY', name_es: 'Retiro de alfombra, bajo-alfombra y tira de tachuelas existentes, embolsado y acarreo al contenedor, por yarda²', unit: 'SY', csi: '02 41 19',
      material_cost_cents: { v: 0, prov: est('no material') }, labor_hours_per_unit: { v: 0.08, prov: est('cut in strips, roll, pull strip and staples') },
      equipment_cost_cents: { v: 60, prov: est('share of roll-off container and disposal fee per SY') }, waste_pct: { v: 0, prov: est('removal — no waste factor') } },
    { code: 'G-CPT-CUSHION-UPG-SY', name: 'Premium or moisture-barrier carpet cushion upgrade, adder per SY', name_es: 'Mejora de bajo-alfombra premium o con barrera de humedad, adicional por yarda²', unit: 'SY', csi: '09 68 16',
      description: 'Adder on top of G-FLOOR-CARPET-SY (which already includes standard cushion).',
      material_cost_cents: { v: 250, prov: est('price difference standard rebond vs premium / barrier cushion, 2026') }, labor_hours_per_unit: { v: 0, prov: est('no extra labor over standard cushion') },
      equipment_cost_cents: { v: 0, prov: est('none') }, waste_pct: { v: 8, prov: est('matches broadloom cushion waste') } },
    { code: 'G-CPT-MOIST-TEST-EA', name: 'Concrete slab moisture test before carpet, per test location', name_es: 'Prueba de humedad de losa de concreto antes de alfombra, por punto de prueba', unit: 'EA', csi: '09 68 13',
      material_cost_cents: { v: 3500, prov: est('in-slab RH probe sleeve or calcium chloride kit, consumables per test') }, labor_hours_per_unit: { v: 0.75, prov: est('drill/set probe or place dome, return visit to read, report') },
      equipment_cost_cents: { v: 0, prov: est('meter owned by installer') }, waste_pct: { v: 0, prov: est('counted units') } },
  ],
  quantity_rules: [
    { code: 'G-FLOOR-CARPET-SY', assumption: '≈30% of scheduled room area carpeted (bedrooms / living) ÷ 9 SF per SY — confirm the finish schedule', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'area_sf_sum', mul: 0.0333, round: 'ceil' } },
    { code: 'G-CPT-TRANS-EA', assumption: 'About one carpet-to-hard-floor transition for every two scheduled rooms — confirm on the finish plan', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'rooms', mul: 0.5, round: 'ceil' } },
    { code: 'G-CPT-TILE-SF', assumption: '≈35% of scheduled room area in carpet tile (offices / corridors) — confirm the finish schedule', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.35, round: 'ceil' } },
    { code: 'G-CPT-MOIST-TEST-EA', assumption: 'Slab moisture tests for glue-down: 3 minimum + 1 per 1,000 SF of carpet tile area — set to the spec frequency', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.00035, add: 3, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['painting', 'drywall'], note: 'Carpet goes in after painting and other wet or dusty trades are done — UFGS has damaging work finished first.' },
    { before_phase: 'punch', note: 'Carpet is one of the last finishes; protect it until the punch walk and final clean.' },
  ],
});
