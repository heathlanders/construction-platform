// Trade Knowledge Pack — operable_partitions (Operable / Folding Partitions). Wave 16 — NEW-TRADE pattern
// (no hand recipe, no template tasks). Dossier: docs/trade-packs/dossiers/operable_partitions.md.
// Sources: UFGS 10 22 39 (Folding Panel Partitions), manufacturer documents (Hufcor, Modernfold, Skyfold),
// ASTM E90/E413/E336 (reference only), IBC 1604.3/1010.1/803.1 + 2010 ADA 404 (reference only),
// 29 CFR 1926 (C, D, E, H, K, L, M, X).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['operable_partitions-ufgs-10-22-39'], confidence: 'verified' as const, last_verified: D };
const mfr = { src: ['operable_partitions-hufcor-docs', 'operable_partitions-modernfold', 'operable_partitions-skyfold'], confidence: 'derived' as const, last_verified: D, note: 'Common to the manufacturers’ published installation and operation documents — follow the approved shop drawings for the unit installed.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const ada = { src: ['plumbing-ada-2010'], confidence: 'verified' as const, last_verified: D };

export default definePack({
  key: 'operable_partitions',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs operable and folding partitions: paired-panel acoustic walls that divide ballrooms, conference and classrooms, glass movable walls, and accordion folding doors. Covers the overhead track and the sound barrier above it through panel hanging, seals, motorized operators, pass doors, acceptance testing and owner training.',
    summary_es: 'Instala mamparas operables y plegables: muros acústicos de paneles pareados que dividen salones de baile, salas de conferencias y aulas, muros móviles de vidrio y puertas plegables tipo acordeón. Cubre desde el riel superior y la barrera acústica sobre él hasta el colgado de paneles, sellos, operadores motorizados, puertas de paso, pruebas de aceptación y capacitación al dueño.',
    glossary: [
      { term: 'Operable wall', term_es: 'Muro operable', def: 'Movable wall of large hanging panels that closes off part of a room and stacks away when open.', def_es: 'Muro móvil de paneles grandes colgados que divide un salón y se guarda apilado cuando se abre.' },
      { term: 'Paired panels', term_es: 'Paneles pareados', def: 'Panels hinged together in twos that travel and stack as a pair.', def_es: 'Paneles unidos con bisagras de dos en dos que se desplazan y apilan juntos.' },
      { term: 'Stack / stack pocket', term_es: 'Apilado / nicho de apilado', def: 'Where the panels are stored when the wall is open; often a closet with a pocket door.', def_es: 'Lugar donde se guardan los paneles con el muro abierto; a menudo un clóset con puerta de bolsillo.' },
      { term: 'Track and trolleys', term_es: 'Riel y carros', def: 'Overhead rail hung from the support steel; rolling carriers on each panel ride in it.', def_es: 'Riel superior colgado del acero de soporte; los carros con ruedas de cada panel corren dentro de él.' },
      { term: 'Plenum sound barrier', term_es: 'Barrera acústica del plénum', def: 'Barrier above the ceiling from the track to the deck so sound cannot go over the wall.', def_es: 'Barrera sobre el plafón, del riel a la losa, para que el sonido no pase por encima del muro.' },
      { term: 'STC / NIC', term_es: 'STC / NIC', def: 'Lab sound rating of the panel (STC) and the lower rating measured on site between rooms (NIC).', def_es: 'Clasificación acústica de laboratorio del panel (STC) y la clasificación menor medida en obra entre salas (NIC).' },
      { term: 'Pass door', term_es: 'Puerta de paso', def: 'Swinging door built into a panel so people can go through with the wall closed.', def_es: 'Puerta abatible integrada a un panel para pasar con el muro cerrado.' },
      { term: 'Accordion door', term_es: 'Puerta de acordeón', def: 'Folding door of narrow hinged leaves hung from a track that bunches up when opened.', def_es: 'Puerta plegable de hojas angostas con bisagras, colgada de un riel, que se recoge al abrirse.' },
      { term: 'Bottom seal / sweep', term_es: 'Sello inferior / barredor', def: 'Seal at the bottom of each panel that drops to the floor to block sound and light.', def_es: 'Sello en la parte inferior de cada panel que baja al piso para bloquear sonido y luz.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'operable_wall',
      example_title: 'Install operable partition — ballroom divider',
      when: { title_re: 'operable (?:wall|partition)|folding (?:panel )?partition|movable (?:wall|partition)|glass (?:movable|operable) wall' },
      steps: [
        {
          title: 'Verify the support steel or header before track',
          instruction: 'Check the support steel or header against the approved shop drawings: location, elevation, level along the run and the hanger points the track needs. The structural engineer and the partition maker set the deflection limit — get written confirmation it was designed for the panel weight before hanging anything. Report gaps in blocking or bracing now.',
          detail: 'The support structure is not part of this trade’s scope; it is installed by misc metals or framing and must be inspected before the track goes up.',
          tools: ['laser level', 'tape measure', 'flashlight'],
          materials: ['approved shop drawings', 'structural support details'],
          safety_ids: ['aerial_lift', 'scissor_lift', 'ladder'],
          qa_ids: ['support_verified', 'track_elevation'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: '1604.3', code_type: 'IBC', note: 'Serviceability — deflection limits for members carrying the partition load' }],
        },
        {
          title: 'Install the plenum sound barrier to the deck',
          instruction: 'Run the above-track sound barrier from the top of the track to the structure above, full length of the run, sealed at the deck, at penetrations and at both ends. Its sound rating must match the partition or the wall leaks over the top.',
          tools: ['drill/driver', 'caulk gun', 'utility knife'],
          materials: ['plenum barrier (gypsum, mass-loaded vinyl or insulated panel per drawings)', 'acoustical sealant', 'fasteners'],
          safety_ids: ['scissor_lift', 'silica_drill', 'falling_object', 'eye_flying'],
          qa_ids: ['plenum_barrier_sealed'],
        },
        {
          title: 'Hang, level and align the track',
          instruction: 'Hang the track from the support steel with the hanger rods or brackets the drawings show, at the spacing shown. Level it along its full length, key every joint so the sections align, and set switches and curves exactly where the layout shows. Install the ceiling guard or soffit trim.',
          tools: ['laser level', 'drill/driver', 'wrenches', 'band saw or porta-band'],
          materials: ['track sections', 'threaded rod / hanger brackets', 'joint keys', 'soffit trim'],
          safety_ids: ['scissor_lift', 'falling_object', 'eye_flying'],
          qa_ids: ['track_level_aligned', 'track_anchorage'],
        },
        {
          title: 'Hang the panels and set the seals',
          instruction: 'Move panels on the maker’s carts and hang them one at a time from the trolleys — two people minimum, never stand under a panel being lifted. Set the vertical seals between panels, the end closure at the wall jamb and the top and bottom seals; adjust the bottom seal so it seals against the floor in every position. Store panels not yet hung secured upright on carts.',
          detail: 'Panels commonly weigh several hundred pounds each — plan the path from the dock and keep stacked panels blocked so they cannot tip.',
          tools: ['panel carts', 'seal operating handle', 'wrenches', 'level'],
          materials: ['partition panels', 'vertical, top and bottom seals', 'end closure / jamb seal'],
          safety_ids: ['panel_tip', 'heavy_lift', 'pinch_point', 'glass_cut'],
          qa_ids: ['panels_plumb_seals', 'stack_fits'],
        },
        {
          title: 'Connect and set up the motorized operator',
          instruction: 'Where a partition is motorized, the electrician brings power per the electrical drawings and the partition crew finishes the controls: keyed hold-to-run stations on opposite sides at the ends of the run, obstruction sensor, limit switches at fully open and fully closed, interlocks and the emergency manual release. Lock out and tag the operator circuit while working on the drive.',
          tools: ['multimeter', 'lockout kit', 'screwdrivers'],
          materials: ['operator and control stations per manufacturer', 'keys'],
          safety_ids: ['lockout', 'cord_shock', 'pinch_point'],
          qa_ids: ['motor_controls_safety', 'emergency_release'],
        },
        {
          title: 'Test, check the pass door and train the owner',
          instruction: 'With the owner’s representative watching, run the wall from stacked to fully closed at least three times — smooth, quiet, no binding. Test the emergency release and the seals. Darken one side and look for light leaks. Check the pass door swings, latches and opens from both sides without a key, with the exit sign if shown. Train the owner’s staff and hand over keys, handles and the operation manual.',
          tools: ['flashlight', 'force gauge if manual pull force is specified'],
          materials: ['operation and maintenance manual', 'keys and seal handles'],
          safety_ids: ['pinch_point', 'panel_tip'],
          qa_ids: ['operation_test', 'light_leak', 'pass_door_egress', 'owner_training', 'field_sound_test'],
          gating_inspection_type: 'final',
          code_refs: [
            { section: '1010.1', code_type: 'IBC', note: 'Egress doors — size, swing and operation of the pass door' },
            { section: '803.1', code_type: 'IBC', note: 'Interior wall finish — flame spread class of panel facings' },
            { section: '404', code_type: 'ADA 2010', note: 'Accessible doors — clear width, hardware and opening force at the pass door' },
          ],
        },
      ],
    },
    {
      id: 'accordion_door',
      example_title: 'Install accordion door at storage opening',
      when: { title_re: 'accordion (?:door|partition)|folding door' },
      priority: 10,
      steps: [
        {
          title: 'Check the opening, header and track blocking',
          instruction: 'Check the opening width and height against the door schedule, the header is level, and solid blocking is in place for the track fasteners along the full width.',
          tools: ['tape measure', 'level', 'stud finder'],
          materials: ['door schedule', 'approved product data'],
          safety_ids: ['ladder'],
          qa_ids: ['support_verified', 'track_elevation'],
        },
        {
          title: 'Mount the track and hang the door',
          instruction: 'Fasten the track to the header blocking at the spacing in the instructions, level it, hang the door on its carriers, then fasten the stack-side jamb and fit the latch jamb so the lead post meets it squarely.',
          tools: ['drill/driver', 'level', 'hack saw'],
          materials: ['accordion door unit', 'track and fasteners', 'latch and jamb hardware'],
          safety_ids: ['ladder', 'heavy_lift', 'pinch_point', 'eye_flying'],
          qa_ids: ['track_level_aligned', 'track_anchorage'],
        },
        {
          title: 'Adjust, test and check egress',
          instruction: 'Run the door open and closed several times, adjust carriers until it travels without binding, and confirm it latches. Where the door crosses an exit path, confirm it opens from the egress side without a key or special knowledge.',
          tools: ['screwdrivers'],
          materials: [],
          safety_ids: ['pinch_point'],
          qa_ids: ['operation_test', 'pass_door_egress'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '1010.1', code_type: 'IBC', note: 'Egress doors — folding doors in a means of egress' }],
        },
      ],
    },
  ],
  code_refs: {
    framing: [
      { section: '1604.3', code_type: 'IBC', note: 'Serviceability — deflection limits for members carrying the partition load', prov: icc },
    ],
    final: [
      { section: '1010.1', code_type: 'IBC', note: 'Egress doors — size, swing and operation of pass and folding doors', prov: icc },
      { section: '803.1', code_type: 'IBC', note: 'Interior wall finish — flame spread class of panel facings', prov: icc },
      { section: '404', code_type: 'ADA 2010', note: 'Accessible doors — clear width, hardware and opening force', prov: ada },
    ],
  },
  equipment: [
    { when: { title_re: 'operable (?:wall|partition)|folding (?:panel )?partition|movable (?:wall|partition)' }, type: 'scissor_lift', reason: 'Reach the support steel, sound barrier and track at ceiling height' },
    { when: { title_re: 'operable (?:wall|partition)|movable (?:wall|partition)', building_types: ['commercial', 'industrial'] }, type: 'forklift', reason: 'Unload crated partition panels at the dock', optional: true },
  ],
  hazards: [
    { id: 'scissor_lift', hazard: 'Fall from a scissor lift or rolling scaffold while working at the track', hazard_es: PENDING_ES, controls: ['Keep guardrails closed and chained on the platform', 'Never climb the rails or stand on anything placed on the platform'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'aerial_lift', hazard: 'Thrown from a boom lift basket while checking high support steel', hazard_es: PENDING_ES, controls: ['Wear a harness with a lanyard tied off to the boom or basket', 'Stand on the basket floor only'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'ladder', hazard: 'Falling from a stepladder at the header or track', hazard_es: PENDING_ES, controls: ['Do not stand on the top or top step of a stepladder', 'Use a lift for long track runs instead of moving a ladder'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'falling_object', hazard: 'Tools, rod or track sections dropped on workers below', hazard_es: PENDING_ES, controls: ['Barricade the floor under overhead work', 'Tether tools; wear hard hats below'], controls_es: PENDING_ES, osha_ref: '1926.501(c)', severity: 3, ppe: ['hard hat'], prov: osha('m') },
    { id: 'panel_tip', hazard: 'Heavy partition panel tipping over or falling off its cart or trolleys', hazard_es: PENDING_ES, controls: ['Store panels upright on the maker’s carts, blocked or strapped so they cannot slide or fall', 'Never stand on the low side or under a panel being hung'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 4, prov: osha('h') },
    { id: 'heavy_lift', hazard: 'Back strain or crushed hands moving panels and door units', hazard_es: PENDING_ES, controls: ['Two-person minimum or mechanical aid for each panel', 'Plan the path from the dock before moving panels'], controls_es: PENDING_ES, osha_ref: '1926.20(b)', severity: 3, ppe: ['gloves', 'safety-toe boots'], prov: osha('c') },
    { id: 'pinch_point', hazard: 'Fingers caught between folding panels, at hinges or in the stack while testing', hazard_es: PENDING_ES, controls: ['Keep hands off panel edges while the wall moves; clear the path before operating', 'Test motorized walls only with the obstruction sensor working'], controls_es: PENDING_ES, osha_ref: '1926.20(b)', severity: 3, prov: osha('c') },
    { id: 'lockout', hazard: 'Unexpected start of the partition motor during adjustment', hazard_es: PENDING_ES, controls: ['Deenergize the operator circuit and attach tags at every point it can be energized', 'Remove keys from the control stations'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 3, prov: osha('k') },
    { id: 'cord_shock', hazard: 'Electric shock from cords and tools', hazard_es: PENDING_ES, controls: ['GFCI on every temporary receptacle', 'Inspect cords daily'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'silica_drill', hazard: 'Silica dust drilling the concrete deck for barrier or hanger anchors', hazard_es: PENDING_ES, controls: ['Use a drill with dust extraction or wet method per the silica table', 'Keep others clear of the dust'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 2, ppe: ['respirator when required'], prov: osha('z') },
    { id: 'eye_flying', hazard: 'Eye injury from drilling overhead and cutting track or rod', hazard_es: PENDING_ES, controls: ['Wear safety glasses for all overhead drilling and cutting'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'glass_cut', hazard: 'Cuts from glass panels of movable glass walls', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves handling glass panels', 'Use suction lifters rated for the panel'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['cut-resistant gloves'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'support_verified', item: 'Support steel or header located, level and at the elevation on the approved shop drawings, with written confirmation it carries the partition weight within the deflection limit.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'track_elevation', item: 'Opening width and height (or track elevation) checked against the shop drawings before ordering adjustments.', item_es: { status: 'translated', text: 'Ancho y alto del vano (o elevación del riel) verificados contra los planos de taller antes de ajustar.' }, prov: ufgs },
    { id: 'track_anchorage', item: 'Track hangers or fasteners at the size and spacing on the drawings; every hanger tight and plumb.', item_es: PENDING_ES, safety: true, prov: mfr },
    { id: 'track_level_aligned', item: 'Track level over its full length; joints keyed and flush; switches and curves where the layout shows.', item_es: { status: 'translated', text: 'Riel nivelado en toda su longitud; uniones con llave y a ras; cambios y curvas según el trazo.' }, prov: ufgs },
    { id: 'plenum_barrier_sealed', item: 'Above-track sound barrier runs track to deck, full length, sealed at the deck, ends and penetrations, with a rating matching the partition.', item_es: { status: 'translated', text: 'Barrera acústica sobre el riel de riel a losa, a todo lo largo, sellada en losa, extremos y penetraciones, con clasificación igual a la mampara.' }, prov: ufgs },
    { id: 'panels_plumb_seals', item: 'Panels plumb; vertical, top and bottom seals engaged along the whole wall; bottom seal touches the floor everywhere.', item_es: { status: 'translated', text: 'Paneles a plomo; sellos verticales, superiores e inferiores activados en todo el muro; el sello inferior toca el piso en toda su longitud.' }, prov: ufgs },
    { id: 'stack_fits', item: 'Panels stack fully into the stack area or pocket and the pocket door closes.', item_es: { status: 'translated', text: 'Los paneles se apilan por completo en el área o nicho de apilado y la puerta del nicho cierra.' }, prov: mfr },
    { id: 'motor_controls_safety', item: 'Motorized wall: keyed hold-to-run stations, obstruction sensor stops or reverses the wall, limit switches stop it at open and closed.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'emergency_release', item: 'Emergency release lets the wall be moved by hand when the motor fails.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'operation_test', item: 'Wall run from stacked to closed at least three times with the owner’s representative — smooth, quiet, no binding.', item_es: { status: 'translated', text: 'Muro operado de apilado a cerrado al menos tres veces ante el representante del dueño — suave, silencioso, sin atorarse.' }, prov: ufgs },
    { id: 'light_leak', item: 'With one side lit and the other dark, no light shows through or around the closed wall.', item_es: { status: 'translated', text: 'Con un lado iluminado y el otro a oscuras, no pasa luz a través ni alrededor del muro cerrado.' }, prov: ufgs },
    { id: 'pass_door_egress', item: 'Pass door (or folding door in an exit path) opens from the egress side without a key and meets the accessible-door requirements.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'plumbing-ada-2010', 'operable_partitions-ufgs-10-22-39'], confidence: 'verified', last_verified: D } },
    { id: 'field_sound_test', item: 'Where specified, an independent field sound test (NIC) meets the required value; failures adjusted and retested.', item_es: { status: 'translated', text: 'Donde se especifica, una prueba acústica de campo independiente (NIC) cumple el valor requerido; fallas ajustadas y repetidas.' }, prov: { src: ['operable_partitions-ufgs-10-22-39', 'operable_partitions-astm-e336'], confidence: 'verified', last_verified: D } },
    { id: 'owner_training', item: 'Owner staff trained to open, close, seal and stack the wall; keys, handles and O&M manual handed over.', item_es: { status: 'translated', text: 'Personal del dueño capacitado para abrir, cerrar, sellar y apilar el muro; llaves, manijas y manual de operación entregados.' }, prov: mfr },
  ],
  inspection_checklists: {
    framing: [
      { item: 'Partition support steel / header installed per the structural details before track is hung', item_es: PENDING_ES, ref: '1604.3' },
      { item: 'Blocking and bracing for track hangers in place along the full run', item_es: PENDING_ES },
    ],
    final: [
      { item: 'Pass door and folding doors in exit paths open from the egress side without a key', item_es: PENDING_ES, ref: '1010.1' },
      { item: 'Panel facing flame-spread class matches the approved submittal', item_es: PENDING_ES, ref: '803.1' },
      { item: 'Accessible pass door clear width and hardware', item_es: PENDING_ES, ref: 'ADA 404' },
      { item: 'Motorized wall safety devices (obstruction sensor, keyed stations, emergency release) demonstrated', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-OP-ACOUSTIC-SF', name: 'Paired-panel acoustic operable wall, manual, ≈STC 45-50, supply + install (per SF of wall)', name_es: 'Muro operable acústico de paneles pareados, manual, ≈STC 45-50, suministro e instalación (por pie² de muro)', unit: 'SF', csi: '10 22 39',
      description: 'Panels, track, seals and trim. Support steel and plenum barrier priced separately (B-OP-SUPPORT-STEEL-LF, B-OP-PLENUM-BARRIER-LF).',
      material_cost_cents: { v: 7500, prov: est('mid-grade paired-panel acoustic wall installed packages commonly quoted ~$80-120/SF; material share baseline 2026') }, labor_hours_per_unit: { v: 0.2, prov: est('track hang + panel set + seal adjust, crew of 2-3') },
      equipment_cost_cents: { v: 150, prov: est('scissor lift share per SF') }, waste_pct: { v: 0, prov: est('factory-built to size') } },
    { code: 'B-OP-ACCORDION-SF', name: 'Accordion folding door, vinyl-clad, supply + install (per SF of opening)', name_es: 'Puerta plegable de acordeón forrada en vinilo, suministro e instalación (por pie² de vano)', unit: 'SF', csi: '10 22 26',
      material_cost_cents: { v: 2500, prov: est('commercial vinyl-clad accordion door with track and latch, 2026 baseline') }, labor_hours_per_unit: { v: 0.08, prov: est('track mount, hang, jambs, adjust') },
      equipment_cost_cents: { v: 0, prov: est('hand tools and ladder') }, waste_pct: { v: 0, prov: est('ordered to size') } },
    { code: 'B-OP-PLENUM-BARRIER-LF', name: 'Above-track plenum sound barrier, track to deck ≈4 ft high, per LF of track', name_es: 'Barrera acústica del plénum sobre el riel, del riel a la losa ≈4 pies de alto, por pie lineal de riel', unit: 'LF', csi: '09 81 00',
      material_cost_cents: { v: 3500, prov: est('two layers gypsum on studs or mass-loaded barrier + insulation + acoustical sealant, ≈4 ft height') }, labor_hours_per_unit: { v: 0.6, prov: est('frame/hang, seal at deck and penetrations') },
      equipment_cost_cents: { v: 300, prov: est('scissor lift share') }, waste_pct: { v: 10, prov: est('board cut-offs around steel') } },
    { code: 'B-OP-SUPPORT-STEEL-LF', name: 'Partition support steel allowance (beam/channel with hangers), per LF of track', name_es: 'Asignación de acero de soporte de la mampara (viga/canal con colgantes), por pie lineal de riel', unit: 'LF', csi: '05 50 00',
      description: 'Allowance only — size is set by the structural engineer for the actual panel weight and span.',
      material_cost_cents: { v: 9000, prov: est('light W-shape or channel + threaded-rod hangers + bracing, 2026 allowance') }, labor_hours_per_unit: { v: 0.75, prov: est('ironworker set, bolt/weld, brace') },
      equipment_cost_cents: { v: 800, prov: est('lift + welder share') }, waste_pct: { v: 5, prov: est('cut-offs') } },
    { code: 'B-OP-PASS-DOOR-EA', name: 'Pass door in operable wall panel with closer, latch and bottom seal, each', name_es: 'Puerta de paso en panel de muro operable con cierrapuertas, cerradura y sello inferior, c/u', unit: 'EA', csi: '10 22 39',
      material_cost_cents: { v: 250000, prov: est('factory pass-door panel upcharge incl. hardware and exit sign prep, 2026') }, labor_hours_per_unit: { v: 3, prov: est('set, adjust hardware and seal, test') },
      equipment_cost_cents: { v: 0, prov: est('included with wall install') }, waste_pct: { v: 0, prov: est('factory unit') } },
  ],
  dependency_hints: [
    { after_trades: ['structural_steel', 'misc_metals'], before_phase: 'finishes_interior', note: 'Support steel and the plenum barrier must be in before the ceiling closes; panels hang after ceilings and flooring so the bottom seal meets the finished floor.' },
  ],
});
