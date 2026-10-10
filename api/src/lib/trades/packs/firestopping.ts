// Trade Knowledge Pack — firestopping (Firestopping). Wave 10 — NEW-TRADE pattern (no hand recipe, no template tasks).
// Penetration firestop systems, fire-resistive joint systems (head-of-wall) and perimeter fire barriers (curtain-wall
// safing) in fire-resistance-rated walls and floors. Building family. Gate = 'insulation': it is the last building
// inspection before rated walls and ceilings are closed, firestop goes in after the MEP rough-ins it seals, and both
// UFGS 07 84 00 §1.3/§3.3 and IBC 1705.18 require inspection BEFORE concealment. Dossier: docs/trade-packs/dossiers/firestopping.md.
// Sources: UFGS 07 84 00, FCIA suggested 07 84 00 spec (paraphrased), FCIA MOP / UL Product iQ / ASTM E2174 / E2393
// (reference only), IBC 703.7 / 714 / 715 / 1705.18 and IRC R302.4 (reference only), 29 CFR 1926 C, D, E, I, K, L, M, X, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['firestopping-ufgs-07-84-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const fcia = (note?: string) => ({ src: ['firestopping-fcia-spec-07-84-00', 'firestopping-ufgs-07-84-00'], confidence: 'derived' as const, last_verified: D, ...(note ? { note } : {}) });
const insp = { src: ['firestopping-astm-e2174', 'firestopping-astm-e2393', 'firestopping-ufgs-07-84-00'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const icc1705 = { src: ['icc-pa', 'firestopping-icc-sigchanges-1705-18'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });
const MF_COM = ['residential_mf', 'commercial', 'industrial'] as ('residential_mf' | 'commercial' | 'industrial')[];

export default definePack({
  key: 'firestopping',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Restores the fire rating of rated walls and floors where pipes, conduit, cable and ducts pass through them, and seals the rated joints at the head of walls and the gap between floor slabs and curtain walls — survey, listed-system selection, prep, install, labeling, documentation and inspection before anything is covered up.',
    summary_es: 'Restituye la clasificación contra incendios de muros y pisos clasificados donde los atraviesan tuberías, conductos, cables y ductos, y sella las juntas clasificadas en la parte superior de los muros y el espacio entre losas y muros cortina — inspección inicial, selección del sistema listado, preparación, instalación, etiquetado, documentación e inspección antes de cubrir el trabajo.',
    glossary: [
      { term: 'Through-penetration firestop system', term_es: 'Sistema cortafuego de penetración pasante', def: 'The tested combination of sealant, collar, wrap or device plus packing that closes the hole around an item passing through a rated wall or floor.', def_es: 'La combinación probada de sellador, collarín, envoltura o dispositivo con relleno que cierra el hueco alrededor de un elemento que atraviesa un muro o piso clasificado.' },
      { term: 'Listed system', term_es: 'Sistema listado', def: 'A firestop design tested by a lab and published with a system number; it must match the wall, the item and the gap you actually have.', def_es: 'Un diseño cortafuego probado por un laboratorio y publicado con un número de sistema; debe coincidir con el muro, el elemento y el hueco reales.' },
      { term: 'Engineering judgment (EJ)', term_es: 'Juicio de ingeniería (EJ)', def: 'A manufacturer’s written design for a condition no listed system covers; it needs approval before you install it.', def_es: 'Un diseño escrito del fabricante para una condición que ningún sistema listado cubre; requiere aprobación antes de instalarlo.' },
      { term: 'Annular space', term_es: 'Espacio anular', def: 'The gap between the penetrating item and the edge of the hole; the listing gives the smallest and largest gap allowed.', def_es: 'El espacio entre el elemento que atraviesa y el borde del hueco; el listado indica el mínimo y el máximo permitidos.' },
      { term: 'F rating / T rating', term_es: 'Clasificación F / clasificación T', def: 'F = how long the system stops flame passing through; T = how long it keeps the far side from getting too hot. Both are in hours.', def_es: 'F = cuánto tiempo el sistema impide el paso de la llama; T = cuánto tiempo evita que el lado opuesto se caliente demasiado. Ambas en horas.' },
      { term: 'Intumescent', term_es: 'Intumescente', def: 'Material that swells in heat to close the opening, used in collars and wraps for plastic pipe and in cable devices.', def_es: 'Material que se expande con el calor para cerrar la abertura; se usa en collarines y envolturas para tubo plástico y en dispositivos para cables.' },
      { term: 'Head-of-wall joint', term_es: 'Junta en la parte superior del muro', def: 'The rated gap between the top of a wall and the deck above, usually built to move as the floor or roof deflects.', def_es: 'El espacio clasificado entre la parte superior de un muro y la cubierta o losa superior, normalmente hecho para moverse cuando la estructura se flexiona.' },
      { term: 'Perimeter fire barrier (safing)', term_es: 'Barrera perimetral contra incendios (safing)', def: 'Mineral wool and sealant that close the gap between a floor slab edge and the curtain wall.', def_es: 'Lana mineral y sellador que cierran el espacio entre el borde de la losa y el muro cortina.' },
      { term: 'Packing / backer', term_es: 'Relleno / respaldo', def: 'Mineral wool or foam rod pushed into the gap first so the sealant ends up at the depth the listing requires.', def_es: 'Lana mineral o cordón de espuma que se coloca primero en el hueco para que el sellador quede a la profundidad que pide el listado.' },
      { term: 'Firestop label', term_es: 'Etiqueta cortafuego', def: 'Tag fixed next to each installed system with the system number, date and installer so later trades know not to disturb it.', def_es: 'Etiqueta fijada junto a cada sistema instalado con número de sistema, fecha e instalador para que otros oficios no lo alteren.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'penetration_firestop',
      example_title: 'Firestop MEP penetrations in rated walls and floors',
      when: { title_re: 'firestop|fire[- ]?stop|penetration seal|fire caulk' },
      steps: [
        {
          title: 'Survey penetrations and pick the listed system',
          instruction: 'Walk every rated wall and floor shown on the life-safety plan with the MEP trades. For each opening note the assembly and its rating, the item (metal pipe, plastic pipe, conduit, cable bundle, duct, insulated pipe) and its size, and the hole size. Choose a tested and listed system that matches all three; where none fits, get an engineering judgment approved before you start.',
          detail: 'Confirm every pipe, conduit and cable that will pass through is in place first — firestopping around a missing item means doing it twice.',
          tools: ['tape measure', 'flashlight', 'life-safety plan', 'marker or tablet log'],
          materials: [],
          safety_ids: ['ladder', 'lift_fall', 'floor_opening', 'energized'],
          qa_ids: ['listed_system_matches', 'penetrants_complete'],
          code_refs: [{ section: '714.4', code_type: 'IBC', note: 'Penetrations of fire-resistance-rated walls' }, { section: '714.5', code_type: 'IBC', note: 'Penetrations of rated horizontal assemblies (floors)' }, { section: 'R302.4', code_type: 'IRC', note: 'Dwelling unit rated penetrations' }],
        },
        {
          title: 'Prepare the opening',
          instruction: 'Check the annular space against the listing — too small or too big means re-coring, patching or sleeving the hole. Clean dust, oil and loose material off the hole and the item. Cut back pipe insulation that the listing does not allow through, and space multiple items as the listing requires. Install sleeves where the system calls for them.',
          tools: ['rotary hammer with dust shroud and vacuum', 'utility knife', 'wire brush', 'HEPA vacuum'],
          materials: ['sleeves where the listing calls for them', 'patching material for oversized holes'],
          safety_ids: ['silica_drilling', 'eye_flying', 'energized', 'floor_opening'],
          qa_ids: ['annular_space', 'insulation_per_listing'],
        },
        {
          title: 'Install the firestop per the listing',
          instruction: 'Pack mineral wool or backer to the depth the listing shows, then apply the sealant, putty, collar, wrap or device exactly as the system drawing shows — same product, same depth, same bead over the item and onto the wall or floor. Fasten collars with the anchors listed. Tool sealant before it skins so it touches both the item and the hole edge with no voids.',
          detail: 'Floor openings 4 in. or more across must carry the floor load or be covered by a permanent barrier.',
          tools: ['caulk gun or bulk pump', 'putty knife', 'drill/driver', 'depth gauge'],
          materials: ['listed firestop sealant, putty or spray', 'mineral wool packing or backer rod', 'intumescent collars or wraps for plastic pipe', 're-enterable cable devices where specified'],
          safety_ids: ['chem_firestop', 'fiber_irritation', 'ladder', 'lift_fall'],
          qa_ids: ['packing_depth', 'sealant_depth_full', 'collar_fastened', 'floor_void_load'],
        },
        {
          title: 'Label and log every system',
          instruction: 'Fix a firestop label next to each installed system on both sides of a wall and on the reachable side of a floor: warning not to disturb, system number, date and installer. Log the location, system number and F/T rating for each item on the firestop log or marked plan, and stencil rated walls above ceilings as the code requires.',
          tools: ['marker', 'camera or tablet', 'stencil'],
          materials: ['firestop identification labels', 'stencil paint'],
          safety_ids: ['ladder', 'lift_fall'],
          qa_ids: ['label_each_system', 'firestop_log'],
          code_refs: [{ section: '703.7', code_type: 'IBC', note: 'Identify rated walls in concealed spaces with signs or stenciling' }],
        },
        {
          title: 'Hold for inspection before anything is covered',
          instruction: 'Leave every firestop open to view until the building inspector and, where required, the special inspector have seen it. Fix and re-label any rejected item. Only then let drywall, ceilings or shaft walls close in. Repair damage by other trades with the same listed system.',
          tools: ['flashlight', 'firestop log'],
          materials: [],
          safety_ids: ['ladder', 'lift_fall'],
          qa_ids: ['inspected_before_cover', 'special_inspection_done'],
          gating_inspection_type: 'insulation',
          code_refs: [{ section: '1705.18', code_type: 'IBC', note: 'Special inspection of firestops and rated joints where required' }],
        },
      ],
    },
    {
      id: 'joint_perimeter_systems',
      example_title: 'Head-of-wall firestop joints and slab-edge perimeter fire barrier',
      when: { title_re: 'head[- ]of[- ]wall|perimeter fire|safing|slab[- ]edge|joint system' },
      priority: 10,
      steps: [
        {
          title: 'Check the joint against the listing',
          instruction: 'Measure the joint width at each wall top or slab edge and compare it to the listed joint system: wall type, deck or slab type, joint width range and movement rating. Confirm the deflection track or curtain-wall framing is installed the way the listing shows. Note any spot wider than the listing allows.',
          tools: ['tape measure', 'flashlight', 'life-safety plan'],
          materials: [],
          safety_ids: ['lift_fall', 'ladder', 'edge_fall'],
          qa_ids: ['joint_width_in_range', 'listed_system_matches'],
          code_refs: [{ section: '715', code_type: 'IBC', note: 'Fire-resistant joint systems in rated walls and floors' }],
        },
        {
          title: 'Install forming material',
          instruction: 'Cut mineral wool to the listed width and compress it into the joint by the amount the listing shows, flutes of a metal deck included. At slab edges, install the safing supports, impale clips or curtain-wall insulation the system requires, then press the safing tight to the slab and the wall.',
          tools: ['insulation knife', 'tape measure', 'drill/driver'],
          materials: ['mineral wool forming or safing', 'safing clips or supports as listed', 'curtain-wall insulation where listed'],
          safety_ids: ['fiber_irritation', 'lift_fall', 'edge_fall', 'falling_objects'],
          qa_ids: ['forming_compression'],
        },
        {
          title: 'Apply the joint sealant or spray',
          instruction: 'Spray or gun the listed joint material over the forming to the listed thickness and lap onto the wall and deck by the listed amount. Tool it before it skins, fill the deck flutes, and leave no gaps where the wall meets columns or other walls. At slab edges, apply the smoke seal over the safing as the system shows.',
          tools: ['airless spray rig or bulk pump', 'putty knife', 'wet-film gauge'],
          materials: ['listed elastomeric joint spray or sealant', 'smoke seal for perimeter systems'],
          safety_ids: ['chem_firestop', 'lift_fall', 'eye_flying'],
          qa_ids: ['joint_coverage_overlap', 'sealant_depth_full'],
        },
        {
          title: 'Label, log and hold for inspection',
          instruction: 'Label each joint system run with its system number, date and installer, and record the location and length on the firestop log. Leave the joints exposed until the inspector and any special inspector have accepted them; fix rejected areas before ceilings or finishes cover them.',
          tools: ['marker', 'camera or tablet'],
          materials: ['firestop identification labels'],
          safety_ids: ['lift_fall', 'ladder'],
          qa_ids: ['label_each_system', 'firestop_log', 'inspected_before_cover', 'special_inspection_done'],
          gating_inspection_type: 'insulation',
          code_refs: [{ section: '715.4', code_type: 'IBC', note: 'Curtain wall to rated floor intersection — perimeter fire barrier' }, { section: '1705.18', code_type: 'IBC', note: 'Special inspection of rated joints and perimeter barriers where required' }],
        },
      ],
    },
  ],
  code_refs: {
    insulation: [
      { section: '714.4', code_type: 'IBC', note: 'Penetrations of fire-resistance-rated walls — listed systems or allowed alternatives', prov: icc },
      { section: '714.5', code_type: 'IBC', note: 'Penetrations of rated horizontal assemblies, including F and T ratings', prov: icc },
      { section: '715', code_type: 'IBC', note: 'Fire-resistant joint systems — tested and listed for the joint', prov: icc },
      { section: '715.4', code_type: 'IBC', note: 'Curtain wall to rated floor intersections — perimeter fire barrier', prov: icc },
      { section: '1705.18', code_type: 'IBC', note: 'Special inspection of firestops and joints in high-rise, RC III/IV and large Group R', prov: icc1705 },
      { section: 'R302.4', code_type: 'IRC', note: 'Dwelling unit rated penetrations — through and membrane penetrations', prov: icc },
    ],
    final: [
      { section: '703.7', code_type: 'IBC', note: 'Rated walls identified by signs or stenciling in concealed spaces', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: 'firestop|fire[- ]?stop|penetration seal|head[- ]of[- ]wall', building_types: MF_COM }, type: 'scissor_lift', reason: 'Reach penetrations and head-of-wall joints at the deck above ceilings', optional: true },
    { when: { title_re: 'perimeter fire|safing|slab[- ]edge', building_types: ['commercial', 'residential_mf'] }, type: 'boom_lift', reason: 'Work slab-edge safing from outside or over the edge', optional: true },
  ],
  hazards: [
    { id: 'ladder', hazard: 'Fall or overreach from a ladder while sealing overhead penetrations', hazard_es: PENDING_ES, controls: ['Use the right ladder height so you are not standing on the top steps', 'Keep the ladder on firm footing and face it while climbing'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'lift_fall', hazard: 'Fall or crush injury from a scissor or boom lift working at the deck', hazard_es: PENDING_ES, controls: ['Boom lifts: harness and lanyard tied to the basket; stand on the floor of the basket', 'Watch overhead for pipes, trays and deck when raising — crush points at the ceiling'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard (boom lift)'], prov: osha('l') },
    { id: 'floor_opening', hazard: 'Fall through an unprotected core hole, sleeve opening or shaft opening in the floor', hazard_es: PENDING_ES, controls: ['Keep holes covered or guarded until the firestop is installed', 'Covers secured, marked HOLE or COVER, and strong enough for twice the load on them'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(i)', severity: 4, prov: osha('m', 'Cover requirements in 1926.502(i).') },
    { id: 'edge_fall', hazard: 'Fall from the slab edge while installing perimeter safing', hazard_es: PENDING_ES, controls: ['Guardrail at the slab edge or personal fall arrest where the curtain wall is not yet closed', 'Do not remove edge protection without a replacement in place'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness when required'], prov: osha('m') },
    { id: 'falling_objects', hazard: 'Tools and safing material dropped through the slab-edge gap onto people below', hazard_es: PENDING_ES, controls: ['Barricade the area below or use toeboards and tool tethers', 'Keep loose material away from the gap'], controls_es: PENDING_ES, osha_ref: '1926.502(j)', severity: 3, ppe: ['hard hat'], prov: osha('m') },
    { id: 'silica_drilling', hazard: 'Breathing silica dust while coring or enlarging holes in concrete or block', hazard_es: PENDING_ES, controls: ['Use a drill with a dust shroud and a vacuum dust collector that meets the Table 1 airflow and filter rules', 'Clean up with a HEPA vacuum, never by dry sweeping or compressed air'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['safety glasses', 'respirator when Table 1 requires'], prov: osha('z', 'Table 1 entry (vii) handheld and stand-mounted drills.') },
    { id: 'chem_firestop', hazard: 'Skin, eye and breathing irritation from firestop sealants, sprays and putties', hazard_es: PENDING_ES, controls: ['Read the SDS for each product and keep it on site', 'Ventilate enclosed spaces; wear gloves and eye protection when spraying'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d') },
    { id: 'fiber_irritation', hazard: 'Skin, eye and throat irritation from cutting and packing mineral wool', hazard_es: PENDING_ES, controls: ['Wear long sleeves, gloves and eye protection when handling mineral wool', 'Cut with a knife, not a saw, and bag scraps right away'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['gloves', 'long sleeves', 'safety glasses', 'dust mask'], prov: osha('e') },
    { id: 'eye_flying', hazard: 'Eye injury from dust and debris falling while working overhead', hazard_es: PENDING_ES, controls: ['Wear safety glasses or goggles for all overhead work and drilling'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses or goggles'], prov: osha('e') },
    { id: 'energized', hazard: 'Electric shock from energized cables and conduit being firestopped', hazard_es: PENDING_ES, controls: ['Treat cables as live; do not cut, pull or drill near them until the electrician confirms they are de-energized or protected', 'Use non-conductive tools to pack around live cable bundles'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 3, prov: osha('k') },
  ],
  qa_checklist: [
    { id: 'listed_system_matches', item: 'Each firestop matches a tested and listed system (or an approved engineering judgment) for the actual wall or floor, item and hole size; system number recorded.', item_es: tr('Cada sello cortafuego coincide con un sistema probado y listado para el muro o piso real, el tipo y tamaño del elemento y el tamaño del hueco; número de sistema anotado.'), prov: fcia() },
    { id: 'penetrants_complete', item: 'All pipes, conduit and cables passing through are permanently in place before firestop is installed.', item_es: tr('Todas las tuberías, conductos y cables que atraviesan están instalados de forma permanente antes del sello cortafuego.'), prov: fcia() },
    { id: 'annular_space', item: 'Gap around each item is within the listed minimum and maximum; spacing between multiple items meets the listing.', item_es: tr('El espacio alrededor de cada elemento está entre el mínimo y el máximo del listado; la separación entre varios elementos cumple el listado.'), prov: fcia() },
    { id: 'insulation_per_listing', item: 'Pipe and duct insulation passes through only where the listing allows it; otherwise cut back and the listed detail used.', item_es: tr('El aislamiento de tubos y ductos atraviesa solo donde el listado lo permite; si no, se recorta y se usa el detalle listado.'), prov: ufgs('§3.2.1') },
    { id: 'packing_depth', item: 'Packing or backer installed to the depth and compression shown on the listing.', item_es: tr('Relleno o respaldo colocado a la profundidad y compresión que indica el listado.'), prov: fcia() },
    { id: 'sealant_depth_full', item: 'Sealant at the listed depth, fully filling the gap, in contact with the item and both hole edges, tooled smooth with no voids or pinholes.', item_es: tr('Sellador a la profundidad listada, llenando todo el hueco, en contacto con el elemento y los bordes, alisado sin vacíos ni poros.'), prov: fcia() },
    { id: 'collar_fastened', item: 'Collars and wraps on plastic pipe are the listed size and are fastened with the listed anchors on the correct side.', item_es: tr('Collarines y envolturas en tubo plástico son del tamaño listado y están fijados con los anclajes listados en el lado correcto.'), prov: fcia() },
    { id: 'floor_void_load', item: 'Firestopped floor openings 4 in. or more across carry the floor load or are protected by a permanent barrier.', item_es: PENDING_ES, safety: true, prov: ufgs('§3.2') },
    { id: 'joint_width_in_range', item: 'Head-of-wall and slab-edge joint widths fall within the listed range; deflection track installed as the listing shows.', item_es: tr('El ancho de las juntas en la parte superior del muro y en el borde de losa está dentro del rango listado; canal de deflexión instalado según el listado.'), prov: fcia() },
    { id: 'forming_compression', item: 'Mineral wool forming or safing compressed by the listed amount, tight to both sides, deck flutes filled.', item_es: tr('Lana mineral o safing comprimido según el listado, ajustado a ambos lados, con las ondas de la cubierta llenas.'), prov: fcia() },
    { id: 'joint_coverage_overlap', item: 'Joint spray or sealant at the listed thickness and lapped onto wall and deck by the listed amount, continuous at intersections.', item_es: tr('Rociado o sellador de junta al espesor listado y traslapado sobre muro y cubierta según el listado, continuo en las intersecciones.'), prov: fcia() },
    { id: 'label_each_system', item: 'Every installed system labeled near the firestop (both sides of walls) with warning, system number, date and installer.', item_es: tr('Cada sistema instalado está etiquetado junto al sello (ambos lados del muro) con advertencia, número de sistema, fecha e instalador.'), prov: fcia('FCIA identification guidance: label within 6 in. of the system edge.') },
    { id: 'firestop_log', item: 'Firestop log or marked plans list the location, system number and rating for every penetration and joint, ready for closeout.', item_es: tr('El registro o los planos marcados indican ubicación, número de sistema y clasificación de cada penetración y junta, listos para el cierre.'), prov: { src: ['firestopping-ufgs-07-84-00', 'firestopping-fcia-spec-07-84-00'], confidence: 'verified', last_verified: D } },
    { id: 'inspected_before_cover', item: 'No firestop is concealed by drywall, ceilings or shaft walls until it has been inspected and accepted.', item_es: PENDING_ES, safety: true, prov: ufgs('§1.3 and §3.3') },
    { id: 'special_inspection_done', item: 'Where the building needs special inspection of firestops, the special inspector has inspected penetrations and joints to the referenced practices and the report is filed.', item_es: PENDING_ES, safety: true, prov: insp },
  ],
  inspection_checklists: {
    insulation: [
      { item: 'Every penetration of a rated wall or floor is firestopped with a listed system or approved engineering judgment', item_es: PENDING_ES, ref: '714.4 / 714.5' },
      { item: 'Head-of-wall and slab-edge joints are sealed with listed joint or perimeter systems', item_es: PENDING_ES, ref: '715' },
      { item: 'Listing sheets and the firestop log are on site and match what is installed', item_es: PENDING_ES },
      { item: 'Special inspection report available where the building requires it', item_es: PENDING_ES, ref: '1705.18' },
    ],
    final: [
      { item: 'Rated walls in concealed spaces are stenciled or signed', item_es: PENDING_ES, ref: '703.7' },
      { item: 'Firestop labels in place and closeout firestop log delivered to the owner', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-FS-PIPE-SM-EA', name: 'Firestop penetration, pipe or conduit up to 2 in., sealant system, each', name_es: 'Sello cortafuego de penetración, tubo o conducto hasta 2 pulg., sistema de sellador, c/u', unit: 'EA', csi: '07 84 13',
      material_cost_cents: { v: 1200, prov: est('Listed sealant (≈1/4 tube) + mineral wool packing per small penetration, national baseline 2026') }, labor_hours_per_unit: { v: 0.35, prov: est('clean, pack, seal, tool, label one small penetration') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; lift time carried on the job') }, waste_pct: { v: 10, prov: est('partial tubes and packing offcuts') } },
    { code: 'B-FS-PIPE-LG-EA', name: 'Firestop penetration, pipe or duct 3–6 in., incl. intumescent collar or wrap for plastic pipe, each', name_es: 'Sello cortafuego, tubo o ducto de 3–6 pulg., incl. collarín o envoltura intumescente para tubo plástico, c/u', unit: 'EA', csi: '07 84 13',
      material_cost_cents: { v: 5500, prov: est('Intumescent collar or wrap + sealant + packing, average of metallic and plastic pipe, 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('prep, pack, collar/wrap fastening, seal, label') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 5, prov: est('collars are sized per item') } },
    { code: 'B-FS-CABLE-EA', name: 'Firestop cable bundle or sleeve, putty or re-enterable device, each', name_es: 'Sello cortafuego para haz de cables o manga, masilla o dispositivo reutilizable, c/u', unit: 'EA', csi: '07 84 13',
      material_cost_cents: { v: 4500, prov: est('Firestop putty or pre-made cable device per opening, 2026') }, labor_hours_per_unit: { v: 0.5, prov: est('install device or putty around a bundle, label') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 5, prov: est('putty trim') } },
    { code: 'B-FS-HOW-LF', name: 'Head-of-wall fire-resistive joint system, mineral wool + spray or sealant, per LF', name_es: 'Sistema de junta resistente al fuego en parte superior de muro, lana mineral + rociado o sellador, por pie lineal', unit: 'LF', csi: '07 84 43',
      material_cost_cents: { v: 450, prov: est('Mineral wool forming + elastomeric joint spray, both faces of one wall, per LF 2026') }, labor_hours_per_unit: { v: 0.08, prov: est('form and spray from a lift, incl. deck flutes') },
      equipment_cost_cents: { v: 0, prov: est('lift carried on the job; small spray rig owned') }, waste_pct: { v: 10, prov: est('overspray and flute offcuts') } },
    { code: 'B-FS-PERIM-LF', name: 'Perimeter fire barrier at slab edge / curtain wall, safing + smoke seal, per LF', name_es: 'Barrera perimetral contra incendios en borde de losa / muro cortina, safing + sello de humo, por pie lineal', unit: 'LF', csi: '07 84 53',
      material_cost_cents: { v: 900, prov: est('Mineral wool safing + clips + smoke seal per LF, 2026') }, labor_hours_per_unit: { v: 0.15, prov: est('install supports, safing and smoke seal at the slab edge') },
      equipment_cost_cents: { v: 0, prov: est('lift carried on the job') }, waste_pct: { v: 10, prov: est('safing cut-offs') } },
    { code: 'B-FS-LABEL-EA', name: 'Firestop identification label + log entry, per system', name_es: 'Etiqueta de identificación cortafuego + registro, por sistema', unit: 'EA', csi: '07 84 00',
      material_cost_cents: { v: 150, prov: est('Tamper-evident label pair, 2026') }, labor_hours_per_unit: { v: 0.05, prov: est('fix labels both sides and record the system in the log') },
      equipment_cost_cents: { v: 0, prov: est('none') }, waste_pct: { v: 5, prov: est('spoiled labels') } },
  ],
  quantity_rules: [
    { code: 'B-FS-PIPE-SM-EA', assumption: '≈1 small pipe/conduit penetration per 100 SF of floor in rated MF/commercial construction — replace with the penetration survey count', when: { building_types: MF_COM }, qty: { basis: 'area_sf_sum', mul: 0.01, round: 'ceil' } },
    { code: 'B-FS-PIPE-LG-EA', assumption: '≈1 large pipe or duct penetration per 500 SF of floor in rated MF/commercial construction — replace with the survey count', when: { building_types: MF_COM }, qty: { basis: 'area_sf_sum', mul: 0.002, round: 'ceil' } },
    { code: 'B-FS-CABLE-EA', assumption: '≈1 cable bundle or sleeve per 300 SF of floor in rated MF/commercial construction — replace with the survey count', when: { building_types: MF_COM }, qty: { basis: 'area_sf_sum', mul: 0.0033, round: 'ceil' } },
    { code: 'B-FS-HOW-LF', assumption: '≈0.05 LF of rated head-of-wall joint per SF of floor (corridor and demising walls) on MF/commercial — measure the rated wall plan', when: { building_types: ['residential_mf', 'commercial'] }, qty: { basis: 'area_sf_sum', mul: 0.05, round: 'ceil' } },
    { code: 'B-FS-LABEL-EA', assumption: 'One label set per estimated penetration system (≈1.5 per 100 SF) on MF/commercial', when: { building_types: MF_COM }, qty: { basis: 'area_sf_sum', mul: 0.015, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['plumbing', 'electrical', 'hvac', 'ductwork', 'low_voltage', 'fire_sprinkler'], before_phase: 'insulation', note: 'Firestop after the MEP items passing through rated walls and floors are in place, and inspected before walls and ceilings are closed.' },
  ],
});
