// Trade Knowledge Pack — ductwork (Sheet Metal Ductwork). Wave 02 — NEW-TRADE pattern (no hand recipe of
// its own; only the generic mechanical phase recipe). Dossier: docs/trade-packs/dossiers/ductwork.md.
// Sources: UFGS 23 30 00 (HVAC Air Distribution), DOE Job Aid 19-1 (seal ducts with mastic), DOE BASC
// duct sealing/insulating measure guideline, ENERGY STAR National Rater Field Checklist Rev 12 (§6 Duct
// Quality Installation), SMACNA HVAC-DCS (reference only), 29 CFR 1926 (C, D, E, I, K, L, M, X),
// IMC 602–607 / IRC M1601 / IECC R403.3 (reference only).
import { definePack, PENDING_ES } from './schema.js';
import type { PackStepTpl } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['ductwork-ufgs-23-30-00'], confidence: 'verified' as const, last_verified: D };
const doeMastic = { src: ['ductwork-doe-job-aid-19-1'], confidence: 'verified' as const, last_verified: D };
const estar = { src: ['energy-star-rater-checklist'], confidence: 'verified' as const, last_verified: D };
const basc = { src: ['ductwork-basc-seal-insulate', 'doe-basc'], confidence: 'derived' as const, last_verified: D, note: 'Field practice common to the DOE duct sealing / insulating guidance.' };
const smacna = { src: ['ductwork-smacna-dcs', 'ductwork-ufgs-23-30-00'], confidence: 'derived' as const, last_verified: D, note: 'UFGS 23 30 00 §3.2.5 installs and supports metal duct per ANSI/SMACNA 006; spacing values not stored (proprietary).' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };

// ── Shared steps (system recipes) ─────────────────────────────────────────────
const layoutStep: PackStepTpl = {
  title: 'Lay out the duct system from the plans',
  instruction: 'Walk the job with the mechanical plan or duct layout. Mark the plenum, trunk route, branch take-offs, boots and the central return. Keep ducts inside conditioned space where the plans allow, stay clear of flues and vents, and flag any framing that blocks a run before cutting anything.',
  tools: ['tape measure', 'chalk line', 'laser level', 'marker'],
  materials: [],
  safety_ids: ['ladder', 'ceiling_fall_through', 'attic_heat'],
  qa_ids: ['return_path'],
};
const flexStep: PackStepTpl = {
  title: 'Run branches and connect flex runouts and boots',
  instruction: 'Cut take-offs into the trunk and fasten them with at least three screws. Pull flex duct fully stretched; pin the inner core to each collar with a clamp or tie and seal it, then pull the insulation and vapor jacket over and secure it. No kinks, sharp bends, crushed sections or extra coils. Set boots square to the finished ceiling, wall or floor line.',
  tools: ['tin snips', 'hole saw / duct punch', 'drill/driver', 'strap tensioner'],
  materials: ['take-off collars', 'flex duct (listed)', 'duct straps / ties', 'boots', 'sheet metal screws'],
  safety_ids: ['sheet_metal_cut', 'eye_flying', 'ceiling_fall_through', 'fiberglass_irritant'],
  qa_ids: ['flex_stretched', 'flex_core_sealed', 'balancing_dampers'],
  gating_inspection_type: 'rough_in',
};
const sealStep: PackStepTpl = {
  title: 'Seal every joint with mastic or listed tape',
  instruction: 'Clean and dry each joint. Brush mastic over every seam, joint, take-off, boot and plenum connection. Bridge gaps of 1/4 to 3/4 in. with fiberglass mesh pressed into the mastic and finish with mastic at least 1 in. past the mesh. Patch larger holes with screwed sheet metal first. Seal the air handler cabinet holes and the filter slot. No cloth duct tape anywhere.',
  tools: ['mastic brush', 'putty knife', 'utility knife', 'drill/driver'],
  materials: ['duct mastic (UL 181 listed)', 'fiberglass mesh tape', 'UL 181 foil tape', 'sheet metal patch stock'],
  safety_ids: ['chem_mastic', 'sheet_metal_cut', 'attic_heat'],
  qa_ids: ['joints_mastic', 'mastic_over_mesh', 'air_handler_sealed'],
  gating_inspection_type: 'duct_leakage',
  code_refs: [{ section: 'R403.3', note: 'Ducts — sealing, insulation and leakage testing', code_type: 'IECC' }],
};
const finalStep: PackStepTpl = {
  title: 'Set registers, balance dampers and check fire dampers',
  instruction: 'Seal boots to the finished surface with caulk, foam or mastic, then set the registers and grilles. Open every balancing damper, mark the set position, and confirm each room has a return path. Where the plans show fire or smoke dampers, check the damper, its access door and label are in place before the final inspection.',
  tools: ['drill/driver', 'caulk gun', 'flashlight'],
  materials: ['registers / grilles', 'sealant or mastic tape for boots', 'damper labels'],
  safety_ids: ['ladder', 'eye_flying'],
  qa_ids: ['boots_sealed', 'balancing_dampers', 'return_path', 'fire_dampers'],
  gating_inspection_type: 'final',
  code_refs: [{ section: '607', note: 'Ducts and air transfer openings — fire and smoke dampers' }],
};

export default definePack({
  key: 'ductwork',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Builds and installs the air distribution system for heating and cooling — sheet metal trunks and plenums, flex and rigid branch runs, boots, returns and dampers — then seals every joint, insulates ducts outside conditioned space and supports the duct leakage test. Equipment setting, refrigerant lines and startup belong to the HVAC trade.',
    summary_es: 'Fabrica e instala el sistema de distribución de aire para calefacción y enfriamiento — troncales y plenos de lámina, ramales flexibles y rígidos, botas, retornos y compuertas — y luego sella cada unión, aísla los ductos fuera del espacio acondicionado y apoya la prueba de fugas de ductos. Colocar equipos, líneas de refrigerante y el arranque corresponden al oficio de HVAC.',
    glossary: [
      { term: 'Plenum', term_es: 'Pleno', def: 'Box on the furnace or air handler that the supply or return trunk connects to.', def_es: 'Caja en el calefactor o manejadora de aire a la que se conecta la troncal de suministro o retorno.' },
      { term: 'Trunk line', term_es: 'Línea troncal', def: 'Main duct that carries air from the plenum; branches come off it.', def_es: 'Ducto principal que lleva el aire desde el pleno; de él salen los ramales.' },
      { term: 'Take-off', term_es: 'Derivación (take-off)', def: 'Collar cut into the trunk where a branch duct starts.', def_es: 'Collar cortado en la troncal donde empieza un ramal.' },
      { term: 'Boot', term_es: 'Bota', def: 'Fitting at the end of a branch that holds the register at the ceiling, wall or floor.', def_es: 'Pieza al final de un ramal que sostiene la rejilla en el techo, muro o piso.' },
      { term: 'Mastic', term_es: 'Mastique', def: 'Thick paste brushed over duct joints to seal air leaks permanently.', def_es: 'Pasta espesa que se aplica con brocha sobre las uniones del ducto para sellar fugas de aire de forma permanente.' },
      { term: 'Flex duct', term_es: 'Ducto flexible', def: 'Wire-coil duct with an inner core, insulation and outer jacket, used for short branch runs.', def_es: 'Ducto con espiral de alambre, núcleo interior, aislamiento y forro exterior, usado en ramales cortos.' },
      { term: 'Balancing damper', term_es: 'Compuerta de balanceo', def: 'Adjustable blade in a branch used to set how much air each room gets.', def_es: 'Aleta ajustable en un ramal para fijar cuánto aire recibe cada cuarto.' },
      { term: 'Fire damper', term_es: 'Compuerta cortafuego', def: 'Damper that closes automatically when a duct passes through a fire-rated wall or floor.', def_es: 'Compuerta que se cierra automáticamente cuando un ducto atraviesa un muro o piso con clasificación de fuego.' },
      { term: 'Duct leakage test', term_es: 'Prueba de fugas de ductos', def: 'Test that pressurizes the closed duct system with a calibrated fan to measure how much air leaks out.', def_es: 'Prueba que presuriza el sistema de ductos cerrado con un ventilador calibrado para medir cuánto aire se fuga.' },
      { term: 'Return path', term_es: 'Ruta de retorno', def: 'Way for air to get back to the system from a closed room — return duct, transfer grille or jump duct.', def_es: 'Camino para que el aire regrese al sistema desde un cuarto cerrado — ducto de retorno, rejilla de transferencia o ducto puente.' },
    ],
  },
  est_bucket: 'mechanical',
  recipes: [
    {
      id: 'duct_system_residential_sf',
      example_title: 'HVAC ductwork rough-in',
      when: { title_re: '\\bduct(?:s|work)?\\b', building_types: ['residential_sf'] },
      priority: 5,
      steps: [
        layoutStep,
        {
          title: 'Set the plenum and hang the trunk',
          instruction: 'Fasten the supply and return plenums to the equipment openings. Hang the trunk level and straight with straps or hangers fastened to framing (never to other pipes or ducts) and keep it from sagging between supports. Leave room to reach every joint for sealing.',
          tools: ['tin snips', 'crimper', 'hand seamer', 'drill/driver', 'level'],
          materials: ['sheet metal plenums and trunk', 'hanger strap', 'sheet metal screws'],
          safety_ids: ['sheet_metal_cut', 'ladder', 'ceiling_fall_through', 'falling_objects'],
          qa_ids: ['supports_spacing'],
          gating_inspection_type: 'rough_in',
          code_refs: [{ section: 'M1601', note: 'Duct construction — materials and listed ducts', code_type: 'IRC' }, { section: 'M1601.4', note: 'Duct installation, support and protection', code_type: 'IRC' }],
        },
        flexStep,
        { ...sealStep, code_refs: [{ section: 'M1601.4.1', note: 'Joints, seams and connections sealed with listed materials', code_type: 'IRC' }, { section: 'R403.3', note: 'Ducts — sealing, insulation and leakage testing', code_type: 'IECC' }] },
        {
          title: 'Insulate ducts outside conditioned space',
          instruction: 'Wrap every supply and return duct in an attic, crawlspace or garage with duct insulation of the R-value on the energy compliance documents. Keep the vapor jacket continuous and tape every seam; insulation should not be crushed by straps.',
          tools: ['utility knife', 'tape measure', 'stapler'],
          materials: ['foil-faced duct wrap', 'UL 181 foil tape'],
          safety_ids: ['fiberglass_irritant', 'attic_heat', 'ceiling_fall_through'],
          qa_ids: ['insulation_unconditioned', 'garage_penetration'],
          gating_inspection_type: 'rough_in',
          code_refs: [{ section: 'M1601.4', note: 'Duct installation in unconditioned space', code_type: 'IRC' }, { section: 'R403.3', note: 'Duct insulation outside the building thermal envelope', code_type: 'IECC' }],
        },
        { ...finalStep, code_refs: [{ section: 'M1602', note: 'Return air — openings and prohibited sources', code_type: 'IRC' }] },
      ],
    },
    {
      id: 'duct_system',
      example_title: 'HVAC ductwork distribution — all floors',
      when: { title_re: '\\bduct(?:s|work)?\\b' },
      steps: [
        layoutStep,
        {
          title: 'Hang plenums, mains and risers',
          instruction: 'Fasten plenums to the equipment, then hang mains and risers with the hanger type and spacing the duct construction standard and the drawings call for, attached only to structure. Anchor high-velocity risers so they can move with temperature. Keep joints reachable for sealing.',
          tools: ['tin snips', 'hand seamer', 'drill/driver', 'powder-actuated tool', 'level'],
          materials: ['sheet metal duct and fittings', 'hanger rod or strap', 'anchors', 'sheet metal screws'],
          safety_ids: ['sheet_metal_cut', 'scaffold_fall', 'aerial_lift', 'falling_objects', 'powder_actuated'],
          qa_ids: ['supports_spacing'],
          gating_inspection_type: 'rough_in',
          code_refs: [{ section: '603', note: 'Duct construction and installation' }, { section: '603.10', note: 'Duct supports — attached to structure' }],
        },
        { ...flexStep, code_refs: [{ section: '603.6', note: 'Flexible air ducts and connectors — listed, length-limited' }] },
        { ...sealStep, code_refs: [{ section: '603.9', note: 'Joints, seams and connections sealed' }, { section: 'R403.3', note: 'Ducts — sealing, insulation and leakage testing', code_type: 'IECC' }] },
        {
          title: 'Insulate ducts outside conditioned space',
          instruction: 'Insulate supply and return ducts in unconditioned or exterior spaces with the type and R-value on the drawings. Seal every insulation seam so the vapor retarder is continuous on cooling ducts.',
          tools: ['utility knife', 'tape measure', 'pin welder or adhesive applicator'],
          materials: ['duct wrap or liner', 'foil tape', 'insulation pins'],
          safety_ids: ['fiberglass_irritant', 'scaffold_fall', 'aerial_lift'],
          qa_ids: ['insulation_unconditioned'],
          gating_inspection_type: 'rough_in',
          code_refs: [{ section: '604', note: 'Duct and plenum insulation' }],
        },
        finalStep,
      ],
    },
    {
      id: 'duct_leakage_test',
      example_title: 'Duct sealing & leakage test',
      when: { title_re: 'leak(?:age)?\\s*test|duct\\s*(?:blaster|test|tightness|seal(?:ing)?)' },
      priority: 10,
      steps: [
        {
          title: 'Prepare the system for the test',
          instruction: 'Confirm the air handler, every duct, boot and building cavity used as a duct is installed. Remove the filter, then seal each supply and return opening with tape and cardboard or adhesive film. Close or open dampers as the test protocol calls for and note it.',
          tools: ['utility knife', 'flashlight'],
          materials: ['register sealing film or cardboard and tape'],
          safety_ids: ['ladder', 'ceiling_fall_through'],
          qa_ids: ['air_handler_sealed'],
        },
        {
          title: 'Pressurize and read total leakage',
          instruction: 'Connect the calibrated duct tester at the air handler or the central return. Bring the duct system to the test pressure (25 Pa) and record the leakage reading in CFM25. Note the conditioned floor area so the result can be compared with the target.',
          tools: ['calibrated duct tester (fan + manometer)'],
          materials: [],
          safety_ids: ['cord_shock', 'attic_heat'],
          qa_ids: ['leakage_result'],
          gating_inspection_type: 'duct_leakage',
          code_refs: [{ section: 'R403.3', note: 'Duct leakage testing to the adopted energy-code target', code_type: 'IECC' }],
        },
        {
          title: 'Find and fix leaks, then retest',
          instruction: 'If the reading is over the target, hold the duct under pressure and find leaks by feel, smoke pencil or visual check at joints, boots, take-offs and the cabinet. Seal them with mastic and mesh, let it set, and run the test again until it passes.',
          tools: ['smoke pencil', 'mastic brush', 'flashlight'],
          materials: ['duct mastic', 'fiberglass mesh tape'],
          safety_ids: ['chem_mastic', 'attic_heat', 'ceiling_fall_through'],
          qa_ids: ['joints_mastic', 'mastic_over_mesh'],
          gating_inspection_type: 'duct_leakage',
        },
        {
          title: 'Record the result and restore the system',
          instruction: 'Remove all test seals, reinstall the filter and record the final leakage number, test pressure and floor area on the test report for the inspector or energy rater. At final, confirm boots are sealed to the finished surface.',
          tools: ['clipboard or tablet'],
          materials: ['air filter'],
          safety_ids: ['ladder'],
          qa_ids: ['leakage_result', 'boots_sealed'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    rough_in: [
      { section: '603', note: 'Duct construction and installation', prov: icc },
      { section: '603.10', note: 'Duct supports attached to the structure', prov: icc },
      { section: '604', note: 'Duct and plenum insulation', prov: icc },
    ],
    duct_leakage: [
      { section: '603.9', note: 'Joints, seams and connections sealed with listed materials', prov: icc },
      { section: 'R403.3', note: 'Ducts — sealing, insulation and leakage testing', code_type: 'IECC', prov: icc },
    ],
    final: [
      { section: '607', note: 'Ducts and air transfer openings — fire and smoke dampers', prov: icc },
      { section: '607.4', note: 'Damper access and identification', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: '\\bduct', building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'scissor_lift', reason: 'Hang mains and risers at ceiling height without working off ladders' },
    { when: { title_re: '\\bduct', building_types: ['industrial'] }, type: 'boom_lift', reason: 'Reach high-bay duct routes over equipment', optional: true },
    { when: { title_re: '\\bduct', building_types: ['commercial', 'industrial'] }, type: 'material_hoist', reason: 'Lift duct sections to upper floors', optional: true },
  ],
  hazards: [
    { id: 'sheet_metal_cut', hazard: 'Deep cuts from sheet metal edges, snips and screw points', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves and sleeves when handling and cutting duct', 'Deburr or fold cut edges; bend back exposed screw tips where people reach'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves', 'sleeves'], prov: osha('e') },
    { id: 'eye_flying', hazard: 'Eye injury from metal chips, drill shavings and falling debris overhead', hazard_es: PENDING_ES, controls: ['Wear safety glasses while cutting, drilling and working overhead'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'ladder', hazard: 'Ladder slip or overreach while hanging duct or setting registers', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above any landing it is used to reach', 'Keep three points of contact; move the ladder instead of leaning'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'scaffold_fall', hazard: 'Fall from rolling scaffold or platform while hanging mains', hazard_es: PENDING_ES, controls: ['Guardrails or personal fall arrest on scaffolds over 10 ft', 'Lock casters before climbing; fully plank the platform'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from a lift basket while installing high duct', hazard_es: PENDING_ES, controls: ['Wear a harness and lanyard tied to the boom or basket', 'Stand on the platform floor, never on the rails'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'ceiling_fall_through', hazard: 'Falling through the ceiling drywall or an open hatch while working in an attic', hazard_es: PENDING_ES, controls: ['Walk only on joists, trusses or laid-down boards — never on drywall between them', 'Cover or guard open hatches and holes; use fall protection where the drop is over 6 ft'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(i)', severity: 4, prov: osha('m') },
    { id: 'attic_heat', hazard: 'Heat illness working in hot attics and crawlspaces', hazard_es: PENDING_ES, controls: ['Schedule attic work for the cool part of the day and rotate workers', 'Drink water often, take shade breaks and watch each other for heat illness signs'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: { ...osha('c'), confidence: 'derived', note: 'No construction heat standard in 1926; covered by the general hazard-training duty.' } },
    { id: 'fiberglass_irritant', hazard: 'Skin, eye and lung irritation from fiberglass duct wrap, liner and duct board', hazard_es: PENDING_ES, controls: ['Wear long sleeves, gloves and eye protection; cut with a sharp knife, not a saw', 'Use a dust mask or respirator when cutting or working in dusty attics'], controls_es: PENDING_ES, osha_ref: '1926.103', severity: 2, ppe: ['N95 or respirator when needed', 'gloves', 'safety glasses'], prov: osha('e') },
    { id: 'powder_actuated', hazard: 'Struck by a fastener or tool kickback from powder-actuated anchoring', hazard_es: PENDING_ES, controls: ['Only trained, carded operators use the tool; test it each day before loading', 'Never fire into thin or brittle material or near an edge'], controls_es: PENDING_ES, osha_ref: '1926.302(e)(1)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'falling_objects', hazard: 'Struck by duct sections, tools or fasteners dropped from overhead work', hazard_es: PENDING_ES, controls: ['Wear hard hats; barricade the area under overhead work', 'Secure duct sections before releasing them; keep tools tethered at height'], controls_es: PENDING_ES, osha_ref: '1926.100(a)', severity: 3, ppe: ['hard hat'], prov: osha('e') },
    { id: 'chem_mastic', hazard: 'Skin and eye irritation from duct mastic, sealants and adhesives', hazard_es: PENDING_ES, controls: ['Read the SDS; ventilate enclosed spaces', 'Wear gloves and eye protection when brushing mastic'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d') },
    { id: 'cord_shock', hazard: 'Electric shock from cords, drills and the duct tester fan', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Inspect cords daily; keep them off sharp duct edges'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
  ],
  qa_checklist: [
    { id: 'supports_spacing', phase: 'rough_in', item: 'Ducts hung with the hanger type and spacing of the duct construction standard or maker, attached to structure only; no sags and no straps crushing the duct.', item_es: { status: 'translated', text: 'Ductos colgados con el tipo y separación de soportes de la norma de construcción de ductos o del fabricante, fijados solo a la estructura; sin pandeos ni correas que aplasten el ducto.' }, prov: smacna },
    { id: 'joints_mastic', phase: 'rough_in', item: 'Every seam, joint, take-off, boot and plenum connection sealed with mastic or UL 181 tape; no cloth duct tape anywhere.', item_es: { status: 'translated', text: 'Cada costura, unión, derivación, bota y conexión al pleno sellada con mastique o cinta UL 181; nada de cinta de tela en ningún lugar.' }, prov: doeMastic },
    { id: 'mastic_over_mesh', phase: 'rough_in', item: 'Gaps of 1/4–3/4 in. bridged with fiberglass mesh set in mastic, finished with mastic at least 1 in. past the mesh; larger holes patched with fastened sheet metal first.', item_es: { status: 'translated', text: 'Huecos de 1/4 a 3/4 pulg. cubiertos con malla de fibra de vidrio en mastique, terminados con mastique al menos 1 pulg. más allá de la malla; huecos mayores parchados primero con lámina atornillada.' }, prov: doeMastic },
    { id: 'air_handler_sealed', phase: 'rough_in', item: 'Air handler cabinet holes, plenum connections and the filter slot cover sealed, with the filter still easy to change.', item_es: { status: 'translated', text: 'Huecos del gabinete de la manejadora, conexiones al pleno y tapa de la ranura del filtro sellados, y el filtro todavía fácil de cambiar.' }, prov: doeMastic },
    { id: 'flex_stretched', phase: 'rough_in', item: 'Flex duct fully stretched with no kinks, no bends tighter than one duct diameter, no compression in tight cavities and no extra coils or loops.', item_es: { status: 'translated', text: 'Ducto flexible totalmente estirado, sin dobleces, sin curvas más cerradas que un diámetro del ducto, sin compresión en cavidades estrechas y sin espirales o lazos de sobra.' }, prov: estar },
    { id: 'flex_core_sealed', phase: 'rough_in', item: 'Flex inner core clamped or tied to each collar and sealed; insulation and outer jacket pulled over and secured so the vapor jacket is continuous.', item_es: { status: 'translated', text: 'Núcleo interior del flexible sujeto con abrazadera o cincho a cada collar y sellado; aislamiento y forro exterior jalados encima y asegurados para que la barrera de vapor sea continua.' }, prov: ufgs },
    { id: 'insulation_unconditioned', phase: 'rough_in', item: 'All supply and return ducts in unconditioned space insulated to the R-value on the energy documents (ENERGY STAR: at least R-6), jacket seams taped and insulation not crushed.', item_es: { status: 'translated', text: 'Todos los ductos de suministro y retorno en espacio no acondicionado aislados al valor R de los documentos de energía (ENERGY STAR: al menos R-6), costuras del forro encintadas y aislamiento sin aplastar.' }, prov: estar },
    { id: 'return_path', item: 'Each bedroom has a return path or pressure relief — return duct, transfer grille, jump duct or door undercut — as the design calls for.', item_es: { status: 'translated', text: 'Cada dormitorio tiene una ruta de retorno o alivio de presión — ducto de retorno, rejilla de transferencia, ducto puente o puerta recortada — según el diseño.' }, prov: estar },
    { id: 'balancing_dampers', item: 'A manual balancing damper in each branch where the drawings show one, reachable after finishes, with its set position marked.', item_es: { status: 'translated', text: 'Una compuerta de balanceo manual en cada ramal donde los planos la indican, accesible después de los acabados y con su posición marcada.' }, prov: ufgs },
    { id: 'leakage_result', phase: 'inspections', item: 'Measured total duct leakage at or below the target on the energy documents (ENERGY STAR rough-in: the greater of 4 CFM25 per 100 sq ft of floor area or 40 CFM25); signed test report on site.', item_es: { status: 'translated', text: 'Fuga total de ductos medida igual o menor que la meta de los documentos de energía (ENERGY STAR en obra negra: el mayor entre 4 CFM25 por cada 100 pies² de piso o 40 CFM25); reporte de prueba firmado en la obra.' }, prov: estar },
    { id: 'boots_sealed', item: 'Every boot sealed to the finished ceiling, wall or floor with caulk, foam or mastic before registers go on.', item_es: { status: 'translated', text: 'Cada bota sellada al techo, muro o piso terminado con sellador, espuma o mastique antes de colocar las rejillas.' }, prov: estar },
    { id: 'fire_dampers', item: 'Fire and smoke dampers installed at every rated wall or floor penetration shown on the plans, with an access door, a label, and the fusible link or actuator intact.', item_es: PENDING_ES, safety: true, prov: { src: ['ductwork-ufgs-23-30-00', 'icc-pa'], confidence: 'verified', last_verified: D } },
    { id: 'return_air_source', item: 'No return air taken from a garage, a room with fuel-burning appliances, a bathroom or a kitchen.', item_es: PENDING_ES, safety: true, prov: icc },
    { id: 'garage_penetration', item: 'Ducts through the garage-to-house wall or ceiling are sheet steel with no openings into the garage.', item_es: PENDING_ES, safety: true, prov: icc },
  ],
  inspection_checklists: {
    rough_in: [
      { item: 'Ducts supported from structure, straight and not crushed; flex fully stretched', item_es: PENDING_ES, ref: '603.10' },
      { item: 'Ducts and plenums made of listed materials; flex duct and connectors carry a listing label', item_es: PENDING_ES, ref: '603' },
      { item: 'Ducts in unconditioned space insulated with the jacket sealed', item_es: PENDING_ES, ref: '604' },
      { item: 'No return-air openings in garages or rooms with fuel-burning appliances', item_es: PENDING_ES },
    ],
    duct_leakage: [
      { item: 'All joints, seams and connections sealed with mastic or listed tape', item_es: PENDING_ES, ref: '603.9' },
      { item: 'Leakage test report with result, test pressure and floor area meets the energy-code target', item_es: PENDING_ES, ref: 'IECC R403.3' },
    ],
    final: [
      { item: 'Boots sealed to finished surfaces; registers and grilles installed', item_es: PENDING_ES },
      { item: 'Fire and smoke dampers installed with access doors and labels where required', item_es: PENDING_ES, ref: '607.4' },
      { item: 'Balancing dampers accessible; every room has a return path', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'M-DU-LEAK-TEST', name: 'Duct leakage test per system (calibrated duct tester, prep, report)', name_es: 'Prueba de fugas de ductos por sistema (probador calibrado, preparación, reporte)', unit: 'EA', csi: '23 05 93',
      description: 'One total-leakage test at rough-in or final; retests after repairs are extra.',
      material_cost_cents: { v: 500, prov: est('register sealing film / tape, 2026') }, labor_hours_per_unit: { v: 2.5, prov: est('seal openings, set up tester, read, restore, write report') },
      equipment_cost_cents: { v: 4000, prov: est('calibrated duct tester rental or amortized ownership share per test') }, waste_pct: { v: 0, prov: est('consumables only') } },
    { code: 'M-DU-SEAL-SYS', name: 'Duct sealing per system — mastic + mesh at all joints, boots, take-offs, plenums, cabinet', name_es: 'Sellado de ductos por sistema — mastique y malla en todas las uniones, botas, derivaciones, plenos y gabinete', unit: 'EA', csi: '23 31 13',
      description: 'Typical single-family system (~2,000 sq ft); scale for larger systems.',
      material_cost_cents: { v: 7500, prov: est('≈2 gal UL 181 mastic + mesh tape + foil tape, national baseline 2026') }, labor_hours_per_unit: { v: 6, prov: est('brush every joint and boot, patch holes, seal cabinet') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 10, prov: est('mastic left in pails / brush loss') } },
    { code: 'M-DU-RETURN-DROP', name: 'Central return air drop — return box/plenum, filter grille, connection to air handler', name_es: 'Bajante de retorno central — caja de retorno, rejilla con filtro, conexión a la manejadora', unit: 'EA', csi: '23 31 13',
      material_cost_cents: { v: 9000, prov: est('sheet metal return box + filter grille + transition, 2026') }, labor_hours_per_unit: { v: 3, prov: est('frame-in, fabricate, connect, seal') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 10, prov: est('sheet metal drops') } },
    { code: 'M-DU-BAL-DAMPER', name: 'Manual balancing damper in a branch duct, installed', name_es: 'Compuerta de balanceo manual en ramal, instalada', unit: 'EA', csi: '23 33 00',
      material_cost_cents: { v: 1800, prov: est('6–8 in. round volume damper with locking quadrant, 2026') }, labor_hours_per_unit: { v: 0.4, prov: est('cut in, fasten, seal, mark position') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('unit item') } },
    { code: 'M-DU-FIRE-DAMPER', name: 'Fire damper with sleeve and access door at a rated penetration, ≈12x12 in.', name_es: 'Compuerta cortafuego con manga y puerta de acceso en penetración clasificada, ≈12x12 pulg.', unit: 'EA', csi: '23 33 00',
      description: 'Curtain-type fire damper; motorized smoke-fire dampers cost more and need controls wiring by others.',
      material_cost_cents: { v: 28000, prov: est('listed curtain fire damper + sleeve + angles + access door, 2026') }, labor_hours_per_unit: { v: 2.5, prov: est('set sleeve, retaining angles, connect duct, install access door') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('unit item') } },
  ],
  quantity_rules: [
    { code: 'M-DUCT-RUN', assumption: 'One branch run per supply/return register — ≈2 per room, matching the register count (existing catalog assembly)', qty: { basis: 'rooms', mul: 2 } },
    { code: 'M-DU-BAL-DAMPER', assumption: 'One balancing damper per room branch — delete where the design omits them', qty: { basis: 'rooms' } },
    { code: 'M-DU-SEAL-SYS', assumption: 'One duct sealing pass per forced-air system on the plans', qty: { basis: { fixture: 'fau' } } },
    { code: 'M-DU-LEAK-TEST', assumption: 'One duct leakage test per forced-air system on the plans (energy-code / rater test)', qty: { basis: { fixture: 'fau' } } },
    { code: 'M-DU-RETURN-DROP', assumption: 'One central return drop per forced-air system on the plans', qty: { basis: { fixture: 'fau' } } },
  ],
  dependency_hints: [
    { after_trades: ['framing'], note: 'Duct rough-in starts after framing and trusses are complete and the framing inspection has passed.' },
    { before_phase: 'insulation', note: 'Ducts sealed, insulated and leakage-tested at rough-in before ceiling insulation and drywall close them in.' },
  ],
});
