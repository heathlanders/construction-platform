// Trade Knowledge Pack — site_utilities (Site Utilities — Water / Sewer / Storm building services).
// Wave 06 — NEW-TRADE pattern (no hand recipe). Dossier: docs/trade-packs/dossiers/site_utilities.md.
// Scope: building service lines from the main / curb stop / property line to the building — water service,
// sanitary building sewer (lateral) and storm leads. Public mains are heavy-civil scope, not this pack.
// Sources: Wis. Admin. Code SPS 382 (382.21 testing, 382.30(11) building sewers, 382.35 cleanouts, 382.36
// storm, 382.40 water services), City of Madison Standard Specifications 2026 Parts V and VII, UFGS 33 11 00 /
// 33 30 00, 29 CFR 1926 (P, AA, G, O, D), IPC (reference only). WI refs carry code_type 'WI SPS'.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const WI = 'WI SPS';
const sps = { src: ['plumbing-wi-sps382'], confidence: 'verified' as const, last_verified: D };
const ipc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const mad5 = { src: ['site_utilities-madison-std-spec-part5'], confidence: 'verified' as const, last_verified: D };
const mad7 = { src: ['site_utilities-madison-std-spec-part7'], confidence: 'verified' as const, last_verified: D };
const ufgsW = (note?: string) => ({ src: ['site_utilities-ufgs-33-11-00'], confidence: 'derived' as const, last_verified: D, ...(note ? { note } : {}) });
const ufgsS = (note?: string) => ({ src: ['site_utilities-ufgs-33-30-00'], confidence: 'derived' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });

// Shared steps
const locateStep = {
  title: 'Permit, locates and utility coordination',
  instruction: 'Confirm the plumbing permit and the municipal connection / tap permit are issued and book the utility for the tap or connection. Call 811 and wait for every locate. Stake the line from the plan, mark where it crosses other utilities, and pothole by hand at each crossing before the machine digs near it.',
  tools: ['paint and stakes', 'tape measure', 'shovel or vacuum excavator for potholing'],
  materials: ['approved site / plumbing plan', 'permits'],
  safety_ids: ['utility_strike'],
  qa_ids: ['locates_verified', 'permit_tap_scheduled'],
};

const trenchStep = {
  title: 'Dig the trench and protect it',
  instruction: 'Dig open trench to the plan depth with spoil kept 2 ft or more back from the edge. Before anyone steps into a trench 5 ft or deeper, put in the protective system (box, shoring, slope or bench) the competent person picked. Put a ladder within 25 ft of every worker in a trench 4 ft or deeper. Re-check the trench every morning and after rain.',
  detail: 'Water services in Wisconsin usually run about 6 ft deep to stay below frost, so these trenches almost always need a trench box or sloping.',
  tools: ['excavator or trencher', 'trench box or shoring', 'ladder', 'laser level'],
  materials: [],
  safety_ids: ['cave_in', 'trench_egress', 'spoil_edge', 'water_accumulation', 'equipment_struck'],
  qa_ids: ['protective_system'],
  code_refs: [{ section: '306.2', note: 'Trenches for building sewers and water service dug and bedded to give continuous support' }],
};

const sewerStep = {
  title: 'Lay the sanitary lateral, cleanouts and tracer wire',
  instruction: 'Bed the pipe on stable, stone-free bedding and lay it from the connection point toward the building at a steady downhill slope — no sags or back-fall. Install the cleanouts the plan shows (one at the property line or building wall, more on long runs). Run insulated tracer wire directly above non-metallic pipe and bring it up in a protected access. Leave it uncovered for the test and inspection.',
  tools: ['laser level or grade rod', 'pipe saw', 'hand tamper'],
  materials: ['PVC sewer pipe and fittings per plan', 'cleanout fittings and frame/cover', 'bedding stone', 'insulated copper tracer wire'],
  safety_ids: ['cave_in', 'pipe_handling', 'biological'],
  qa_ids: ['sewer_slope_cleanouts', 'bedding_backfill', 'tracer_wire'],
  gating_inspection_type: 'underground',
  code_refs: [
    { section: '704.1', note: 'Horizontal drainage piping at a uniform slope' },
    { section: '382.30(5)(b)', note: 'Building sewer pitch per the state pitch table', code_type: WI },
    { section: '382.30(11)(h)', note: 'Non-metallic building sewers to a municipal main need a locating means', code_type: WI },
    { section: '382.35(3)(b)', note: 'Cleanouts or manholes spaced along small building sewers', code_type: WI },
  ],
};

const sewerTestStep = {
  title: 'Connect to the public sewer and test the lateral',
  instruction: 'Make the main connection only at the spot and with the fitting the municipality allows, with its representative present where required. Plug the lateral at the main and run the water or air test the inspector wants; hold it the full time with no drop. Fix any leak and re-test before backfill.',
  detail: 'Never put your head or body into a live sewer or manhole. Test the air before anyone enters an excavation next to a live sewer.',
  tools: ['test plugs', 'air test kit with gauge or water test stand', 'gas monitor'],
  materials: ['saddle or wye per the municipality', 'gaskets / couplings'],
  safety_ids: ['sewer_atmosphere', 'confined_space', 'biological'],
  qa_ids: ['sewer_test'],
  gating_inspection_type: 'underground',
  code_refs: [
    { section: '382.30(11)(f)', note: 'Public sewer connection made as the municipality approves, under its supervision', code_type: WI },
    { section: '382.21(2)(b)', note: 'Sanitary building sewer leak-tested with water head or low-pressure air', code_type: WI },
    { section: '312.6', note: 'Gravity sewer test before the sewer goes into service' },
  ],
};

const waterStep = {
  title: 'Lay the water service and curb stop',
  instruction: 'Lay the service below frost depth on bedding with no rocks against it. Keep it the required distance from the sanitary sewer — sideways, or above it where the lines cross — and never within 6 in. of a storm sewer. Set the curb stop between the main and the property line with its box plumb and to grade, and run tracer wire with plastic pipe. Leave joints open for the pressure test.',
  tools: ['laser level', 'tubing cutter / flaring or compression tools', 'hand tamper'],
  materials: ['water service pipe per the utility (copper or PE)', 'curb stop and curb box', 'bedding sand', 'tracer wire and test station'],
  safety_ids: ['cave_in', 'pipe_handling'],
  qa_ids: ['water_depth_frost', 'water_sewer_separation', 'curb_stop_accessible', 'tracer_wire'],
  gating_inspection_type: 'water_supply',
  code_refs: [
    { section: '603.2', note: 'Water service kept apart from the building sewer unless an exception applies' },
    { section: '382.40(8)(a)', note: 'Water services below the predicted frost depth', code_type: WI },
    { section: '382.40(8)(b)', note: 'Horizontal and crossing separation from sanitary and storm sewers', code_type: WI },
    { section: '382.40(4)(b)', note: 'Curb stop between the corporation cock and the property line', code_type: WI },
  ],
};

const waterTestStep = {
  title: 'Pressure-test, flush and disinfect the service',
  instruction: 'With the inspector present (or with their OK for a written report), hold the service at no less than working pressure using potable water and check every joint. Flush until clear, disinfect new service where the utility or code requires it, and only then let the utility turn the curb stop on for good.',
  tools: ['test pump with gauge', 'hose and flushing fittings'],
  materials: ['potable test water', 'chlorine disinfectant where required'],
  safety_ids: [],
  qa_ids: ['water_pressure_test', 'flush_disinfect'],
  gating_inspection_type: 'water_supply',
  code_refs: [
    { section: '382.21(2)(e)', note: 'Water service inspected before cover and tested at working pressure', code_type: WI },
    { section: '382.40(8)(i)', note: 'New water supply flushed and disinfected before use', code_type: WI },
    { section: '312.5', note: 'Water supply system tested before use' },
  ],
};

const backfillStep = {
  title: 'Backfill, restore and record the as-built',
  instruction: 'Place initial backfill in thin lifts tamped full width over the pipe, then finish backfill in lifts with the compaction the right-of-way permit asks for. Patch any street or sidewalk cut to the municipal detail. Record depths and tie measurements to the curb stop, cleanouts and main connection, and give the as-built to the owner and the utility.',
  tools: ['plate or rammer compactor', 'excavator', 'tape measure / GPS'],
  materials: ['granular backfill', 'base course and asphalt or concrete patch per detail', 'topsoil and seed'],
  safety_ids: ['traffic_row', 'equipment_struck', 'falling_loads'],
  qa_ids: ['bedding_backfill', 'row_compaction', 'asbuilt_recorded'],
  gating_inspection_type: 'final',
  code_refs: [
    { section: '382.30(11)(e)', note: 'Bedding and initial backfill in lifts, tamped full trench width', code_type: WI },
    { section: '306.3', note: 'Backfill placed in layers and compacted without damaging the pipe' },
  ],
};

export default definePack({
  key: 'site_utilities',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs the private building service lines between the public utilities and the building: the water service from the curb stop, the sanitary building sewer (lateral) from the main connection, and storm leads from roof drains to the storm sewer — trench, bed, lay, test, connect with the utility, backfill, restore the right-of-way and record as-builts.',
    summary_es: 'Instala las acometidas privadas entre los servicios públicos y el edificio: la acometida de agua desde la llave de banqueta, el drenaje sanitario del edificio (lateral) desde la conexión al colector, y las bajadas pluviales hasta el drenaje pluvial — zanja, cama, tendido, prueba, conexión con la empresa de servicios, relleno, reparación de la vía pública y planos finales.',
    glossary: [
      { term: 'Water service', term_es: 'Acometida de agua', def: 'Pipe from the public water main (or curb stop) to the building’s main shutoff.', def_es: 'Tubería desde la red pública de agua (o la llave de banqueta) hasta la llave principal del edificio.' },
      { term: 'Corporation stop', term_es: 'Llave de toma (corporation)', def: 'Valve threaded into the water main where the service is tapped; set by or for the utility.', def_es: 'Válvula enroscada en la red de agua donde se hace la toma; la coloca la empresa de agua o se coloca para ella.' },
      { term: 'Curb stop and box', term_es: 'Llave de banqueta y caja', def: 'Buried shutoff valve near the property line with a box to grade so the utility can turn the service off.', def_es: 'Válvula enterrada cerca del lindero con una caja a nivel del suelo para que la empresa de agua pueda cerrar el servicio.' },
      { term: 'Building sewer (lateral)', term_es: 'Drenaje del edificio (lateral)', def: 'Pipe that carries sewage from the building drain outside the foundation to the public sewer.', def_es: 'Tubería que lleva las aguas negras desde el drenaje del edificio, fuera de la cimentación, hasta el colector público.' },
      { term: 'Storm lead', term_es: 'Bajada pluvial', def: 'Pipe that carries roof-drain or downspout water to the storm sewer — never to the sanitary sewer.', def_es: 'Tubería que lleva el agua de los drenes del techo o bajantes al drenaje pluvial — nunca al sanitario.' },
      { term: 'Tracer wire', term_es: 'Cable localizador', def: 'Insulated copper wire laid on top of plastic pipe so the line can be found later with a locator.', def_es: 'Cable de cobre aislado tendido sobre la tubería plástica para poder localizarla después con un detector.' },
      { term: 'Cleanout', term_es: 'Registro de limpieza', def: 'Capped fitting that lets a cleaning cable or camera into the sewer.', def_es: 'Conexión con tapa que permite meter un cable de limpieza o una cámara al drenaje.' },
      { term: 'Wye / saddle connection', term_es: 'Conexión en Y / silleta', def: 'Fitting used to join the lateral to the public sewer main, as the municipality allows.', def_es: 'Conexión que une el lateral al colector público, según lo permita el municipio.' },
      { term: 'Frost depth', term_es: 'Profundidad de congelamiento', def: 'How deep the ground freezes; water services run below it so they do not freeze.', def_es: 'Profundidad a la que se congela el suelo; las acometidas de agua van por debajo para que no se congelen.' },
      { term: 'As-built', term_es: 'Plano final (as-built)', def: 'Drawing with the real depths and tie measurements of what was installed.', def_es: 'Plano con las profundidades y medidas de referencia reales de lo instalado.' },
    ],
  },
  est_bucket: 'plumbing',
  recipes: [
    {
      id: 'utility_services',
      example_title: 'Underground utilities (water, sewer, gas, electric)',
      when: { title_re: '\\b(?:underground|site)\\s+utilit(?:y|ies)\\b|\\butility\\s+(?:infrastructure|services?|connections?)\\b|\\bwater\\s*(?:and|&|/)\\s*sewer\\b' },
      steps: [locateStep, trenchStep, sewerStep, sewerTestStep, waterStep, backfillStep],
    },
    {
      id: 'water_service',
      example_title: 'Install 1 in. water service from curb stop to building',
      priority: 10,
      when: { title_re: '\\bwater\\s+(?:service|lateral)\\b|\\bcurb\\s+(?:stop|box)\\b' },
      steps: [locateStep, trenchStep, waterStep, waterTestStep, backfillStep],
    },
    {
      id: 'sanitary_lateral',
      example_title: 'Sanitary sewer lateral connection to main',
      priority: 10,
      when: { title_re: '\\b(?:sanitary\\s+)?sewer\\s+(?:lateral|connection|service)\\b|\\bbuilding\\s+sewer\\b|\\bsanitary\\s+lateral\\b' },
      steps: [locateStep, trenchStep, sewerStep, sewerTestStep, backfillStep],
    },
    {
      id: 'storm_leads',
      example_title: 'Storm sewer leads — connect roof drain leaders to storm',
      priority: 20,
      when: { title_re: '\\bstorm\\s+(?:sewer|lead|lateral|line|service|connection)s?\\b|\\b(?:roof\\s+drain|downspout)\\s+(?:leaders?|leads?|connections?)\\b' },
      steps: [
        locateStep,
        trenchStep,
        {
          title: 'Lay storm leads to the storm sewer',
          instruction: 'Lay the storm lead at a steady slope to the storm sewer or the outlet the plan shows — never into the sanitary sewer. Connect each roof leader at or above finished grade, with a removable strainer where it drains in at grade. Keep it at least 6 in. from the water service, add cleanouts per plan, and run tracer wire on plastic pipe in the right-of-way.',
          tools: ['laser level', 'pipe saw', 'hand tamper'],
          materials: ['PVC storm pipe and fittings per plan', 'leader adapters / strainers', 'bedding stone', 'tracer wire'],
          safety_ids: ['cave_in', 'pipe_handling'],
          qa_ids: ['storm_not_sanitary', 'sewer_slope_cleanouts', 'tracer_wire'],
          gating_inspection_type: 'underground',
          code_refs: [
            { section: '382.36(4)(b)', note: 'Storm and clear water kept out of the sanitary drain system', code_type: WI },
            { section: '382.36(7)(d)', note: 'Leader joins the storm building sewer at or above finished grade', code_type: WI },
          ],
        },
        backfillStep,
      ],
    },
  ],
  code_refs: {
    underground: [
      { section: '306.2', note: 'Trenching and bedding give the pipe continuous support', prov: ipc },
      { section: '305.4.1', note: 'Building sewer depth below grade', prov: ipc },
      { section: '704.1', note: 'Horizontal drainage piping at uniform slope', prov: ipc },
      { section: '312.6', note: 'Gravity sewer test', prov: ipc },
      { section: '382.30(11)(c)', note: 'Building sewer minimum depth and frost protection', code_type: WI, prov: sps },
      { section: '382.30(11)(e)', note: 'Open trench, stable bedding, initial backfill in tamped lifts', code_type: WI, prov: sps },
      { section: '382.30(11)(f)', note: 'Connection to the public sewer as the municipality approves', code_type: WI, prov: sps },
      { section: '382.30(11)(h)', note: 'Locating means (tracer wire or GPS record) for non-metallic sewers', code_type: WI, prov: sps },
      { section: '382.35(3)(b)', note: 'Cleanout and manhole spacing on sanitary building sewers', code_type: WI, prov: sps },
      { section: '382.21(2)(b)', note: 'Sanitary building sewer water or air leak test', code_type: WI, prov: sps },
      { section: '382.36(4)(b)', note: 'Storm water not connected to the sanitary system', code_type: WI, prov: sps },
    ],
    water_supply: [
      { section: '603.2', note: 'Separation of water service and building sewer', prov: ipc },
      { section: '312.5', note: 'Water supply system test', prov: ipc },
      { section: '382.21(2)(e)', note: 'Water service inspected before cover; tested at working pressure', code_type: WI, prov: sps },
      { section: '382.40(4)(b)', note: 'Corporation cock and curb stop on services from a public main', code_type: WI, prov: sps },
      { section: '382.40(8)(a)', note: 'Water service below the predicted frost depth', code_type: WI, prov: sps },
      { section: '382.40(8)(b)', note: 'Separation from sanitary sewers and storm sewers', code_type: WI, prov: sps },
      { section: '382.40(8)(i)', note: 'Flushing and disinfection before use', code_type: WI, prov: sps },
    ],
    final: [
      { section: '306.3', note: 'Backfill in layers without damaging the pipe', prov: ipc },
      { section: '382.30(11)(e)', note: 'Initial backfill tamped for full trench width and length', code_type: WI, prov: sps },
    ],
  },
  equipment: [
    { when: { title_re: '\\butilit|\\bwater\\s+service|\\bsewer|\\bstorm|\\blateral|\\bcurb\\s+stop' }, type: 'excavator', reason: 'Dig deep service trenches, set the trench box and handle pipe' },
    { when: { title_re: '\\bwater\\s+service|\\butilit' }, type: 'trencher', reason: 'Cut narrow runs for small water services where depth and soil allow', optional: true },
    { when: { title_re: '\\butilit|\\bwater\\s+service|\\bsewer|\\bstorm|\\blateral' }, type: 'compactor', reason: 'Compact backfill in lifts, especially under pavement in the right-of-way' },
    { when: { title_re: '\\butilit|\\bsewer|\\bstorm|\\blateral|\\bwater\\s+service' }, type: 'dump_truck', reason: 'Haul spoil off and bring in bedding and granular backfill', optional: true },
  ],
  hazards: [
    { id: 'cave_in', hazard: 'Trench cave-in burying a worker laying pipe', hazard_es: PENDING_ES, controls: ['Trench box, shoring, sloping or benching in any trench 5 ft or deeper before entry', 'Work only inside the protected zone of the box', 'Competent person inspects the trench and protective system before each shift and after rain'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, ppe: ['hard hat'], prov: osha('p') },
    { id: 'trench_egress', hazard: 'No quick way out of a deep trench', hazard_es: PENDING_ES, controls: ['Ladder, ramp or stair in trenches 4 ft or deeper within 25 ft of every worker'], controls_es: PENDING_ES, osha_ref: '1926.651(c)(2)', severity: 3, prov: osha('p') },
    { id: 'spoil_edge', hazard: 'Spoil, pipe or stone rolling back into the trench', hazard_es: PENDING_ES, controls: ['Keep spoil and materials at least 2 ft back from the edge or use retaining devices'], controls_es: PENDING_ES, osha_ref: '1926.651(j)(2)', severity: 3, ppe: ['hard hat'], prov: osha('p') },
    { id: 'utility_strike', hazard: 'Striking a gas, power or fiber line while digging near the main', hazard_es: PENDING_ES, controls: ['Call 811 and wait for locates', 'Hand-dig or vacuum-excavate to expose lines near the marks'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'water_accumulation', hazard: 'Groundwater or a leaking main flooding the trench and undermining the walls', hazard_es: PENDING_ES, controls: ['Do not work in accumulating water without dewatering and protection', 'Re-inspect after rain or a water release'], controls_es: PENDING_ES, osha_ref: '1926.651(h)(1)', severity: 3, prov: osha('p') },
    { id: 'sewer_atmosphere', hazard: 'Sewer gas or low oxygen in a trench next to a live sewer', hazard_es: PENDING_ES, controls: ['Test the trench air before entry when a hazardous atmosphere could exist', 'Ventilate and keep rescue gear ready'], controls_es: PENDING_ES, osha_ref: '1926.651(g)(1)(i)', severity: 4, ppe: ['gas monitor'], prov: osha('p') },
    { id: 'confined_space', hazard: 'Entering a manhole or wet well at the connection point', hazard_es: PENDING_ES, controls: ['Treat manholes as permit-required confined spaces; work from outside', 'Entry only under a permit program with air testing, attendant and rescue'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 4, prov: osha('aa') },
    { id: 'traffic_row', hazard: 'Struck by public traffic while working in the street or terrace', hazard_es: PENDING_ES, controls: ['Work-zone signs, cones and flaggers set up per the MUTCD', 'High-visibility vests for everyone near traffic'], controls_es: PENDING_ES, osha_ref: '1926.201(a)', severity: 4, ppe: ['high-visibility vest'], prov: { src: ['ecfr-1926-g', 'site_utilities-mutcd'], confidence: 'verified', last_verified: D } },
    { id: 'falling_loads', hazard: 'Hit by pipe, a bucket or spill from a truck being loaded', hazard_es: PENDING_ES, controls: ['Nobody under a load handled by the excavator', 'Stand clear of trucks being loaded or unloaded'], controls_es: PENDING_ES, osha_ref: '1926.651(e)', severity: 3, ppe: ['hard hat'], prov: osha('p') },
    { id: 'equipment_struck', hazard: 'Struck by a backing excavator, compactor or dump truck', hazard_es: PENDING_ES, controls: ['Reverse alarm or spotter on machines with an obstructed rear view', 'Stay out of the swing radius'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 3, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'biological', hazard: 'Sewage contact when cutting into or plugging a live sewer', hazard_es: PENDING_ES, controls: ['Waterproof gloves and eye protection at live connections', 'Wash before eating; washing facilities on site'], controls_es: PENDING_ES, osha_ref: '1926.51(f)(1)', severity: 2, ppe: ['waterproof gloves', 'safety glasses'], prov: osha('d') },
    { id: 'pipe_handling', hazard: 'Hands and feet pinched or crushed lowering pipe and fittings into the trench', hazard_es: PENDING_ES, controls: ['Lower heavy pipe with the machine and rated slings, not by hand', 'Inspect slings every shift'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 2, ppe: ['gloves', 'safety-toe boots'], prov: osha('h') },
  ],
  qa_checklist: [
    { id: 'locates_verified', item: '811 locates received and every crossing utility exposed by hand before machine digging near it.', item_es: PENDING_ES, safety: true, prov: { src: ['landscaping-diggers-hotline', 'ecfr-1926-p'], confidence: 'verified', last_verified: D } },
    { id: 'protective_system', item: 'Protective system chosen by the competent person in place before entry into any trench 5 ft or deeper; ladder within 25 ft.', item_es: PENDING_ES, safety: true, prov: osha('p') },
    { id: 'permit_tap_scheduled', item: 'Plumbing and municipal connection permits on site; tap or main connection scheduled with the utility and made only where it allows.', item_es: { status: 'translated', text: 'Permisos de plomería y de conexión municipal en la obra; toma o conexión al colector programada con la empresa de servicios y hecha solo donde lo permita.' }, prov: sps },
    { id: 'water_depth_frost', item: 'Water service laid below the predicted frost depth — the utility’s cover (about 6 ft in Madison) checked with a grade rod before backfill.', item_es: { status: 'translated', text: 'Acometida de agua tendida bajo la profundidad de congelamiento — cubierta de la empresa de agua (unos 6 pies en Madison) revisada con regla antes del relleno.' }, prov: { src: ['plumbing-wi-sps382', 'site_utilities-madison-std-spec-part7'], confidence: 'verified', last_verified: D, note: 'SPS 382.40(8)(a) below predicted frost depth; Madison Std Spec 703.11 at least 6 ft of cover on service laterals.' } },
    { id: 'water_sewer_separation', item: 'Water service at least 5 ft sideways from the sanitary sewer (or an allowed exception), 12 in. above / 18 in. below it at crossings, and 6 in. or more from any storm sewer.', item_es: { status: 'translated', text: 'Acometida de agua a 5 pies o más del drenaje sanitario (o una excepción permitida), 12 pulg. por encima / 18 pulg. por debajo en los cruces, y a 6 pulg. o más de cualquier drenaje pluvial.' }, prov: sps },
    { id: 'bedding_backfill', item: 'Pipe on stable bedding with no stones over 1 in. against it; initial backfill placed in lifts of 6 in. or less and tamped full trench width.', item_es: { status: 'translated', text: 'Tubo sobre cama estable sin piedras de más de 1 pulg. en contacto; relleno inicial en capas de 6 pulg. o menos, compactado en todo el ancho de la zanja.' }, prov: sps },
    { id: 'tracer_wire', item: 'Insulated copper tracer wire on top of every non-metallic line, brought up at protected access points and continuity-tested before backfill.', item_es: { status: 'translated', text: 'Cable localizador de cobre aislado sobre toda tubería no metálica, subido en accesos protegidos y con prueba de continuidad antes del relleno.' }, prov: { src: ['plumbing-wi-sps382', 'site_utilities-ufgs-33-11-00', 'site_utilities-madison-std-spec-part5'], confidence: 'derived', last_verified: D, note: 'SPS 382.30(11)(h) tracer wire on non-metallic sewers; UFGS 33 11 00 tracer wire + continuity test; Madison 503.2(f) locating means in the ROW.' } },
    { id: 'sewer_slope_cleanouts', item: 'Sewer slope checked with a laser every joint — steady fall, no sags (Madison laterals 1/4 to 1/2 in. per ft); cleanouts where the plan shows and no more than 100 ft apart.', item_es: { status: 'translated', text: 'Pendiente del drenaje revisada con láser en cada unión — caída constante, sin depresiones (laterales de Madison de 1/4 a 1/2 pulg. por pie); registros donde indica el plano y a no más de 100 pies.' }, prov: { src: ['plumbing-wi-sps382', 'site_utilities-madison-std-spec-part5'], confidence: 'verified', last_verified: D, note: 'SPS 382.30(5)(b) pitch table, 382.35(3)(b) cleanout spacing; Madison 503.3(c) lateral grade 1/4–1/2 in./ft.' } },
    { id: 'sewer_test', item: 'Sanitary lateral passed its leak test (10 ft water head or 3 psi air, held 15 min with no drop) before or after cover as the inspector allows.', item_es: { status: 'translated', text: 'El lateral sanitario pasó su prueba de fugas (columna de agua de 10 pies o aire a 3 psi, sostenida 15 min sin caída) antes o después de cubrir según permita el inspector.' }, prov: sps },
    { id: 'water_pressure_test', item: 'Water service held at no less than working pressure with potable water and inspected before it is covered.', item_es: { status: 'translated', text: 'Acometida de agua sostenida a no menos de la presión de trabajo con agua potable e inspeccionada antes de cubrirla.' }, prov: sps },
    { id: 'flush_disinfect', item: 'New service flushed until clear and disinfected where the code or utility requires before it goes into use.', item_es: { status: 'translated', text: 'Acometida nueva purgada hasta salir limpia y desinfectada donde lo exija el código o la empresa de agua antes de usarse.' }, prov: { src: ['plumbing-wi-sps382', 'site_utilities-ufgs-33-11-00'], confidence: 'verified', last_verified: D } },
    { id: 'curb_stop_accessible', item: 'Curb stop between the main and property line, box plumb and set to finished grade, and the valve operable.', item_es: { status: 'translated', text: 'Llave de banqueta entre la red y el lindero, caja a plomo y a nivel de terreno terminado, y la válvula operable.' }, prov: sps },
    { id: 'storm_not_sanitary', item: 'No roof drain, downspout or footing drain tied into the sanitary sewer; storm leaders connect at or above finished grade.', item_es: { status: 'translated', text: 'Ningún dren de techo, bajante o dren de cimentación conectado al drenaje sanitario; las bajadas pluviales se conectan a nivel o por encima del terreno terminado.' }, prov: sps },
    { id: 'row_compaction', item: 'Backfill under street, curb or sidewalk compacted in lifts to the right-of-way permit and the patch built to the municipal detail.', item_es: { status: 'translated', text: 'Relleno bajo calle, guarnición o banqueta compactado en capas según el permiso de vía pública y el parche hecho según el detalle municipal.' }, prov: ufgsS('UFGS 33 30 00 / 33 11 00 backfill and compaction in lifts; restoration detail is the municipality’s.') },
    { id: 'asbuilt_recorded', item: 'As-built with depths and tie measurements to the curb stop, cleanouts and main connection delivered to the owner and the utility.', item_es: { status: 'translated', text: 'Plano final con profundidades y medidas de referencia a la llave de banqueta, registros y conexión al colector entregado al propietario y a la empresa de servicios.' }, prov: ufgsW('UFGS 33 11 00 record drawings; SPS 382.30(11)(h)2 allows a GPS record with the municipality instead of tracer wire.') },
  ],
  inspection_checklists: {
    underground: [
      { item: 'Permits on site; main connection made where and how the municipality approved', item_es: PENDING_ES, ref: 'WI SPS 382.30(11)(f)' },
      { item: 'Bedding stable and stone-free; pipe uncovered for inspection', item_es: PENDING_ES, ref: 'WI SPS 382.30(11)(e)' },
      { item: 'Sewer slope continuous; cleanouts at plan locations and within spacing', item_es: PENDING_ES, ref: 'WI SPS 382.35(3)(b)' },
      { item: 'Sanitary leak test passed (water or air)', item_es: PENDING_ES, ref: 'WI SPS 382.21(2)(b)' },
      { item: 'Tracer wire on non-metallic pipe, continuity tested', item_es: PENDING_ES, ref: 'WI SPS 382.30(11)(h)' },
      { item: 'Storm leads go to storm sewer only', item_es: PENDING_ES, ref: 'WI SPS 382.36(4)(b)' },
    ],
    water_supply: [
      { item: 'Service below frost depth and separated from sanitary and storm sewers', item_es: PENDING_ES, ref: 'WI SPS 382.40(8)' },
      { item: 'Curb stop and box installed between main and property line', item_es: PENDING_ES, ref: 'WI SPS 382.40(4)(b)' },
      { item: 'Pressure test at working pressure with potable water witnessed or reported', item_es: PENDING_ES, ref: 'WI SPS 382.21(2)(e)' },
      { item: 'Flushed and disinfected before turn-on', item_es: PENDING_ES, ref: 'WI SPS 382.40(8)(i)' },
    ],
    final: [
      { item: 'Backfill compacted in lifts; right-of-way patch to municipal detail', item_es: PENDING_ES },
      { item: 'Curb box and cleanout covers to grade and accessible', item_es: PENDING_ES },
      { item: 'As-built with depths and ties delivered to owner and utility', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'P-SU-WSVC-1IN-LF', name: 'Water service, 1 in., trenched ~6 ft deep with bedding and tracer wire, per LF', name_es: 'Acometida de agua de 1 pulg., en zanja de ~6 pies con cama y cable localizador, por pie lineal', unit: 'LF', csi: '33 14 16',
      description: 'Pipe (type K copper or PE per utility), bedding, tracer wire, trench and backfill. Curb stop, tap and street restoration are separate lines.',
      material_cost_cents: { v: 1400, prov: est('1 in. type K copper or PE service + bedding sand + tracer wire per LF, national baseline 2026; copper drives the price.') },
      labor_hours_per_unit: { v: 0.25, prov: est('Two-person crew with machine: dig, protect, bed, lay, backfill at ~6 ft depth.') },
      equipment_cost_cents: { v: 600, prov: est('Excavator + trench box + compactor share per LF.') },
      waste_pct: { v: 5, prov: est('Pipe and bedding over-order.') } },
    { code: 'P-SU-SEWER-6IN-LF', name: 'Sanitary sewer lateral, 6 in. PVC, bedded with tracer wire, per LF', name_es: 'Lateral de drenaje sanitario de 6 pulg. PVC, con cama y cable localizador, por pie lineal', unit: 'LF', csi: '33 31 13',
      description: 'PVC sewer pipe and fittings, bedding stone, tracer wire, trench and backfill. Main connection and cleanouts are separate lines.',
      material_cost_cents: { v: 1100, prov: est('6 in. PVC SDR-35 + bedding stone + tracer wire per LF, national baseline 2026.') },
      labor_hours_per_unit: { v: 0.25, prov: est('Laser-set grade, lay, bed and tamp; trench protection setup included.') },
      equipment_cost_cents: { v: 600, prov: est('Excavator + trench box + compactor share per LF.') },
      waste_pct: { v: 5, prov: est('Pipe and stone over-order.') } },
    { code: 'P-SU-CURBSTOP-EA', name: 'Curb stop and curb box, 1 in., set to grade', name_es: 'Llave de banqueta y caja de 1 pulg., a nivel de terreno', unit: 'EA', csi: '33 12 16',
      material_cost_cents: { v: 32000, prov: est('1 in. curb stop + adjustable curb box (utility-approved pattern), 2026.') },
      labor_hours_per_unit: { v: 2, prov: est('Set valve, connect both sides, plumb box to grade.') },
      equipment_cost_cents: { v: 0, prov: est('Installed in the service trench; machine time in the LF line.') },
      waste_pct: { v: 0, prov: est('Single unit.') } },
    { code: 'P-SU-CO-PL-EA', name: 'Sewer cleanout at property line, two-way, with frame and cover', name_es: 'Registro de limpieza en el lindero, de dos vías, con marco y tapa', unit: 'EA', csi: '33 31 13',
      description: 'Exterior two-way cleanout riser to grade with a traffic-rated or yard frame/cover. Interior cleanouts use P-CLEANOUT.',
      material_cost_cents: { v: 25000, prov: est('Two-way cleanout fitting + riser + frame and cover, 2026.') },
      labor_hours_per_unit: { v: 2.5, prov: est('Set fitting on the lateral, riser to grade, frame bedded.') },
      equipment_cost_cents: { v: 0, prov: est('Hand tools; machine time in the LF line.') },
      waste_pct: { v: 0, prov: est('Single unit.') } },
    { code: 'P-SU-TAP-ALLOW-EA', name: 'Municipal tap / connection fee allowance (water or sewer)', name_es: 'Partida de cuota municipal de toma / conexión (agua o drenaje)', unit: 'EA', csi: '33 10 00',
      description: 'Allowance for the utility’s tap, connection and inspection charges. Replace with the local fee schedule.',
      material_cost_cents: { v: 200000, prov: est('Placeholder allowance — utility tap and connection charges vary widely by municipality; confirm the local fee schedule.') },
      labor_hours_per_unit: { v: 2, prov: est('Coordinate with the utility, attend the tap / connection.') },
      equipment_cost_cents: { v: 0, prov: est('Utility-performed.') },
      waste_pct: { v: 0, prov: est('Allowance.') } },
    { code: 'P-SU-ROW-RESTORE-SF', name: 'Street trench restoration — saw cut, base and asphalt patch, per SF', name_es: 'Reparación de zanja en calle — corte con sierra, base y parche de asfalto, por pie cuadrado', unit: 'SF', csi: '32 01 16',
      description: 'Saw cut, granular base and hot-mix patch to the municipal detail over a utility trench in the street.',
      material_cost_cents: { v: 900, prov: est('Base course + hot-mix asphalt patch per SF, national baseline 2026.') },
      labor_hours_per_unit: { v: 0.06, prov: est('Saw cut, compact base, place and roll patch.') },
      equipment_cost_cents: { v: 400, prov: est('Saw, roller / plate and truck share per SF.') },
      waste_pct: { v: 5, prov: est('Asphalt and base over-order.') } },
  ],
  quantity_rules: [
    { code: 'P-SU-WSVC-1IN-LF', assumption: 'Allow 60 LF of 1 in. water service from the curb stop to a single-family house — replace with the plan length', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 60 } },
    { code: 'P-SU-SEWER-6IN-LF', assumption: 'Allow 60 LF of sanitary lateral from the main connection to a single-family house — replace with the plan length', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 60 } },
    { code: 'P-SU-CURBSTOP-EA', assumption: 'One curb stop and box per single-family water service (delete if the utility already stubbed it)', when: { building_types: ['residential_sf'] }, qty: { basis: 'const' } },
    { code: 'P-SU-CO-PL-EA', assumption: 'One exterior cleanout on the single-family sanitary lateral', when: { building_types: ['residential_sf'] }, qty: { basis: 'const' } },
  ],
  dependency_hints: [
    { after_trades: ['excavation'], note: 'Rough grading and the building pad elevations should be set before the service trenches are dug to final depth.' },
    { before_phase: 'finishes_exterior', note: 'Services in, tested and backfilled before final grading, paving and landscaping over the trench.' },
  ],
});
