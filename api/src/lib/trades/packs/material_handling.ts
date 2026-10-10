// Trade Knowledge Pack — material_handling (Material Handling: Conveyors / Cranes / Hoists / Racking).
// Wave 18 — NEW-TRADE pattern (no hand recipe, no template tasks). Dossier: docs/trade-packs/dossiers/material_handling.md.
// Sources: UFGS 41 22 13.14 / 13.15 (bridge cranes, Part 3), 29 CFR 1910.179 (overhead cranes — owner's rule after
// turnover), 29 CFR 1926 (C, D, H, I, J, K, L, M, N, O, Z, CC), IBC 2209 / 1613 and IFC ch. 32 (reference only),
// RMI ANSI MH16.1 and CMAA 70/74 (reference only — no values copied).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const ufgs = { src: ['material_handling-ufgs-41-22-13-14', 'material_handling-ufgs-41-22-13-15'], confidence: 'verified' as const, last_verified: D };
const f179 = { src: ['material_handling-ecfr-1910-179'], confidence: 'verified' as const, last_verified: D };
const rack = { src: ['material_handling-mhi-rmi', 'icc-pa'], confidence: 'derived' as const, last_verified: D, note: 'Common rack-installer practice; follow the rack maker’s drawings and the engineered rack design.' };
const conv = { src: ['ecfr-1926-n'], confidence: 'verified' as const, last_verified: D };

const RACK_RE = 'pallet rack|storage rack|\\bracking\\b|selective rack|drive-?in rack|push-?back rack|cantilever rack|carton flow';
const CRANE_RE = 'bridge crane|overhead crane|gantry crane|jib crane|monorail|crane runway|runway (?:beam|rail)|\\bhoists?\\b';
const CONV_RE = '\\bconveyors?\\b';

export default definePack({
  key: 'material_handling',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs permanent material-handling equipment in warehouses, shops and plants — steel pallet and storage racking with anchors, guards and load plaques; overhead bridge, jib and monorail cranes and hoists on their runways, through the no-load and load tests; and powered or gravity conveyors with guards, stops and lockout — handing off to the owner with test records and manuals.',
    summary_es: 'Instala equipo fijo de manejo de materiales: racks de acero para tarimas con anclajes, protectores y placas de carga; grúas viajeras, grúas pluma y monorrieles con polipastos, hasta las pruebas con carga; y transportadores con guardas, paros y bloqueo — y entrega al dueño los reportes de prueba y manuales.',
    glossary: [
      { term: 'Upright frame', term_es: 'Marco vertical (bastidor)', def: 'The ladder-like end frame of a rack: two columns tied together with bracing, sitting on base plates.', def_es: 'El marco lateral del rack en forma de escalera: dos columnas unidas con riostras, apoyadas en placas base.' },
      { term: 'Beam (load beam)', term_es: 'Viga de carga', def: 'Horizontal member that spans between uprights and carries the pallets; locked in with a safety clip or pin.', def_es: 'Miembro horizontal entre marcos que carga las tarimas; se asegura con un seguro o pasador.' },
      { term: 'Load plaque', term_es: 'Placa de capacidad', def: 'Sign on the rack showing the allowed load per level and per bay for that configuration.', def_es: 'Letrero en el rack que indica la carga permitida por nivel y por sección para esa configuración.' },
      { term: 'Column guard', term_es: 'Protector de columna', def: 'Steel guard bolted to the floor in front of an upright so forklifts hit it instead of the rack.', def_es: 'Protector de acero anclado al piso frente al marco para que el montacargas lo golpee a él y no al rack.' },
      { term: 'Runway', term_es: 'Vía de rodamiento (pista)', def: 'The beams and rails the crane bridge rolls along, carried on the building columns or its own posts.', def_es: 'Las vigas y rieles por donde corre el puente de la grúa, apoyados en las columnas del edificio o en postes propios.' },
      { term: 'Bridge and trolley', term_es: 'Puente y carro', def: 'The bridge spans the runways; the trolley rides on the bridge and carries the hoist.', def_es: 'El puente cruza entre las vías; el carro corre sobre el puente y lleva el polipasto.' },
      { term: 'Rated load', term_es: 'Carga nominal', def: 'The most the crane or hoist is built to lift, marked on the equipment.', def_es: 'La carga máxima que la grúa o el polipasto puede levantar, marcada en el equipo.' },
      { term: 'Load test', term_es: 'Prueba de carga', def: 'Lifting a measured test weight before first use to prove the hoist, brakes, bridge and runway hold it.', def_es: 'Levantar un peso de prueba medido antes del primer uso para comprobar que polipasto, frenos, puente y vía lo soportan.' },
      { term: 'Lockout/tagout (LOTO)', term_es: 'Bloqueo y etiquetado', def: 'Shutting off and locking the power so a conveyor or crane cannot start while someone works on it.', def_es: 'Cortar y bloquear la energía para que un transportador o grúa no arranque mientras alguien trabaja en él.' },
      { term: 'Emergency stop', term_es: 'Paro de emergencia', def: 'Push or pull switch that stops a conveyor at once and keeps it stopped until reset.', def_es: 'Interruptor que detiene el transportador de inmediato y lo mantiene detenido hasta restablecerlo.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'pallet_rack',
      example_title: 'Install selective pallet racking',
      when: { title_re: RACK_RE },
      steps: [
        {
          title: 'Check the layout, slab and approved rack design',
          instruction: 'Get the stamped rack drawings and calculations and any fire-code approval for high-piled storage before work starts. Snap the rack lines and aisle widths from the layout, keep the flue spaces and sprinkler clearances shown, and check the slab for cracks, joints and flatness where base plates will land. Report a layout clash with columns, sprinklers or doors before setting steel.',
          tools: ['chalk line', 'laser level', 'tape measure'],
          materials: ['rack layout drawing', 'marking paint'],
          safety_ids: ['forklift', 'struck_by_stack'],
          qa_ids: ['rack_design_on_site'],
        },
        {
          title: 'Stand the upright frames and set the beams',
          instruction: 'Stand each upright frame on its base plates and brace the first bay before the second is started. Set the beams at the elevations on the drawing, seat every beam connector fully and install the safety lock in each one before loading anything. Work from a lift — never climb the rack.',
          detail: 'Tall frames: two people plus a lift or forklift with a platform designed for people; keep the area below barricaded.',
          tools: ['rubber mallet', 'level', 'tape measure'],
          materials: ['upright frames', 'load beams', 'beam safety locks or pins'],
          safety_ids: ['fall_elevated', 'aerial_lift', 'struck_by_stack', 'forklift'],
          qa_ids: ['beam_locks_installed'],
        },
        {
          title: 'Plumb, shim and anchor the uprights',
          instruction: 'Plumb every frame both ways and shim under the base plates with the maker’s shims only. Drill and set the anchors the rack design calls for — type, size, embedment and count per base plate — using dust control on the drill. Torque or set each anchor per the anchor maker and recheck plumb.',
          tools: ['hammer drill with dust extraction', 'torque wrench', 'level', 'plumb laser'],
          materials: ['post-installed anchors per rack design', 'rack shim plates'],
          safety_ids: ['silica_drill', 'struck_by_stack'],
          qa_ids: ['frames_plumb', 'anchors_per_design'],
          code_refs: [{ section: '2209.1', code_type: 'IBC', note: 'Steel storage racks — designed, anchored and installed per the referenced rack standard' }, { section: '1613.1', code_type: 'IBC', note: 'Seismic design of nonstructural components, incl. storage racks' }],
        },
        {
          title: 'Install decking, guards and load plaques',
          instruction: 'Install wire decks or pallet supports, row spacers, flue keepers and back stops where shown. Bolt column guards and end-of-aisle guards in front of uprights in forklift aisles. Hang a load plaque on each row showing the allowed load per level and per bay for this configuration.',
          tools: ['impact driver', 'hammer drill with dust extraction', 'wrench set'],
          materials: ['wire decks', 'row spacers', 'column guards', 'end-of-aisle guards', 'load plaques'],
          safety_ids: ['silica_drill', 'fall_elevated'],
          qa_ids: ['guards_installed', 'load_plaques_posted'],
        },
        {
          title: 'Walk the rack for final and turn over',
          instruction: 'Walk every row with the owner: frames plumb, every beam locked, anchors in, guards set, plaques posted, flues and aisles clear of debris. Leave the rack drawings and maker’s inspection and damage guidance with the owner, and keep the rows empty until final is signed off.',
          tools: ['level', 'flashlight'],
          materials: [],
          safety_ids: ['struck_by_stack'],
          qa_ids: ['frames_plumb', 'beam_locks_installed', 'load_plaques_posted', 'turnover_docs'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '2209.1', code_type: 'IBC', note: 'Steel storage racks — installation per the approved rack design' }, { section: '3201.1', code_type: 'IFC', note: 'High-piled combustible storage — fire code review where storage height or area triggers it' }],
        },
      ],
    },
    {
      id: 'crane_hoist',
      example_title: 'Install overhead bridge crane and runway',
      when: { title_re: CRANE_RE },
      steps: [
        {
          title: 'Verify the runway support steel and clearances',
          instruction: 'Before the crane is ordered or set, field-measure the runway span, column spacing, rail height and clearances to the roof steel, lights and sprinkler pipe, and confirm the support steel matches the approved crane loads. Report any mismatch to the engineer before installing anything.',
          tools: ['total station or laser', 'tape measure'],
          materials: ['crane and runway submittal drawings'],
          safety_ids: ['fall_elevated', 'aerial_lift'],
          qa_ids: ['field_dims_verified'],
        },
        {
          title: 'Set and align the runway beams and rails',
          instruction: 'Set the runway beams on their brackets, then the rails and end stops. Align span, straightness, elevation and rail-to-rail level to the tolerances on the crane maker’s drawings, and record the survey. Bolt and weld per the drawings; leave connections open for the framing inspection where required.',
          tools: ['total station or laser', 'torque wrench', 'come-along'],
          materials: ['runway beams', 'crane rail and clips', 'end stops', 'high-strength bolts'],
          safety_ids: ['fall_elevated', 'aerial_lift', 'suspended_load', 'rigging', 'hot_work'],
          qa_ids: ['runway_alignment_record'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: '1705.2', code_type: 'IBC', note: 'Special inspection of structural steel bolting and welding where required' }],
        },
        {
          title: 'Set the bridge, trolley and hoist; wire the runway power',
          instruction: 'Lift the bridge onto the runway with a crane, set the trolley and hoist, and align motors, couplings and brakes per the maker. Install the runway conductor bar or festoon, the mainline disconnect and the pendant or radio control. Keep the load clear of people the whole lift.',
          detail: 'Erect under the crane maker’s supervision where the spec or the maker requires it.',
          tools: ['torque wrench', 'multimeter', 'alignment gauges'],
          materials: ['bridge and trolley', 'hoist', 'runway conductor bar or festoon', 'mainline disconnect', 'pendant or radio control'],
          safety_ids: ['suspended_load', 'rigging', 'electrical', 'loto', 'aerial_lift'],
          qa_ids: ['capacity_marked'],
        },
        {
          title: 'Run the no-load operational test',
          instruction: 'Walk the full runway first and check that nothing is in the crane’s path. Run each hook up and down through its full travel at each speed, run the bridge and trolley end to end both ways, and prove the upper limit switch, brakes, end stops and every pendant button. Record motor currents and speeds.',
          tools: ['clamp-on ammeter', 'stopwatch'],
          materials: ['test record forms'],
          safety_ids: ['hoist_clear', 'electrical'],
          qa_ids: ['no_load_test'],
        },
        {
          title: 'Load test, tag and turn over the crane',
          instruction: 'With calibrated test weights, run the rated-load test and the overload test at the percent the maker and the spec call for — never more than the maker allows. Measure the hook throat before and after; a wider throat fails the hook. Prove the brakes hold the load and stop it on loss of power. File the signed test report, mark the rated load on both sides of the bridge, and hand over manuals and training.',
          tools: ['calibrated test weights', 'tram points and caliper', 'clamp-on ammeter'],
          materials: ['load test report', 'capacity markings'],
          safety_ids: ['suspended_load', 'hoist_clear'],
          qa_ids: ['load_test_report', 'hook_tram', 'capacity_marked', 'turnover_docs'],
          gating_inspection_type: 'final',
        },
      ],
    },
    {
      id: 'conveyor',
      example_title: 'Install belt conveyor system',
      when: { title_re: CONV_RE },
      steps: [
        {
          title: 'Lay out the line and set the supports',
          instruction: 'Lay out the conveyor centerline and elevations from the drawings and confirm clearance at doors, aisles and walkways. Set floor supports or ceiling hangers and anchor them as detailed. Where the line crosses over an aisle or work area, plan the under-guard now.',
          tools: ['laser level', 'chalk line', 'hammer drill with dust extraction'],
          materials: ['floor supports or ceiling hangers', 'anchors'],
          safety_ids: ['silica_drill', 'fall_elevated', 'aerial_lift'],
          qa_ids: ['conveyor_guards'],
        },
        {
          title: 'Set, level and align the conveyor sections',
          instruction: 'Set each bed section, bolt the joints and level and square the frame. Track the belt so it runs centered, or check rollers turn freely and sit level on a gravity line. Install transfers and curves per the drawings.',
          tools: ['level', 'framing square', 'wrench set'],
          materials: ['conveyor bed sections', 'belt and pulleys or roller sections', 'splice hardware'],
          safety_ids: ['struck_by_stack', 'forklift'],
          qa_ids: ['conveyor_level_tracking'],
        },
        {
          title: 'Install drives, guards, stops and warning horn',
          instruction: 'Mount drives and guard every pinch point, chain and sprocket. Fit emergency stops at the operator stations and along the line, a start-up warning horn, guards under any section over an aisle, and signs at crossovers. The electrician makes the final power connection.',
          tools: ['wrench set', 'impact driver'],
          materials: ['drive guards', 'emergency stop stations', 'start-up warning horn', 'underside guards', 'crossover signs'],
          safety_ids: ['conveyor_caught', 'electrical'],
          qa_ids: ['conveyor_guards', 'estop_reset'],
        },
        {
          title: 'Test-run under lockout control and turn over',
          instruction: 'Lock out and tag the drive whenever hands are in the conveyor. Clear the line, sound the warning, then run empty and with product; check tracking, every emergency stop and that the line will not restart until the stop is reset. Hand over the lockout points list and manuals.',
          tools: ['lockout kit', 'stopwatch'],
          materials: ['lockout points list', 'O&M manuals'],
          safety_ids: ['loto', 'conveyor_caught'],
          qa_ids: ['estop_reset', 'turnover_docs'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    framing: [
      { section: '1705.2', code_type: 'IBC', note: 'Special inspection of structural steel bolting and welding where required — crane runway steel', prov: icc },
    ],
    final: [
      { section: '2209.1', code_type: 'IBC', note: 'Steel storage racks — designed and installed per the referenced rack standard', prov: icc },
      { section: '1613.1', code_type: 'IBC', note: 'Seismic design of nonstructural components, incl. storage racks', prov: icc },
      { section: '3201.1', code_type: 'IFC', note: 'High-piled combustible storage — fire code review where it applies', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: RACK_RE }, type: 'forklift', reason: 'Move frames and beam bundles and help stand tall frames', optional: true },
    { when: { title_re: RACK_RE }, step_re: 'upright frames and set the beams|decking, guards', type: 'scissor_lift', reason: 'Set upper beam levels and decks without climbing the rack' },
    { when: { title_re: CRANE_RE }, step_re: 'runway beams and rails|bridge, trolley and hoist', type: 'boom_lift', reason: 'Reach the runway brackets, rails and conductor bar' },
    { when: { title_re: CRANE_RE }, step_re: 'bridge, trolley and hoist', type: 'crane', reason: 'Lift the bridge girders onto the runway', optional: true },
    { when: { title_re: CRANE_RE }, step_re: 'runway beams and rails', type: 'welder', reason: 'Field welds on rail clips and runway connections where detailed', optional: true },
    { when: { title_re: CONV_RE }, step_re: 'supports|conveyor sections', type: 'scissor_lift', reason: 'Set ceiling hangers and overhead conveyor sections', optional: true },
  ],
  hazards: [
    { id: 'fall_elevated', hazard: 'Fall while erecting rack, runway steel or overhead conveyor', hazard_es: PENDING_ES, controls: ['Work from a lift or guarded platform; never climb the rack or stand on beams', 'Use personal fall arrest where an edge 6 ft or more above the floor is unprotected'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness when required'], prov: osha('m') },
    { id: 'aerial_lift', hazard: 'Thrown from or tipping an aerial lift near racks and runways', hazard_es: PENDING_ES, controls: ['Wear a harness and lanyard tied off to the boom or basket', 'Stand on the platform floor, never the rails; keep the lift off holes and slab edges'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'struck_by_stack', hazard: 'Rack frames, beams or stacked material tipping or collapsing', hazard_es: PENDING_ES, controls: ['Brace the first bay before standing the next frame', 'Stack and block material bundles so they cannot slide or fall', 'Barricade below overhead work'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 3, ppe: ['hard hat', 'safety-toe boots'], prov: osha('h') },
    { id: 'suspended_load', hazard: 'Struck or crushed by a crane girder, runway beam or test weight being lifted', hazard_es: PENDING_ES, controls: ['Plan lift routes that keep people out from under the load', 'Use tag lines and a signal person; nobody under a raised load'], controls_es: PENDING_ES, osha_ref: '1926.1425(a)', severity: 4, ppe: ['hard hat'], prov: osha('cc') },
    { id: 'rigging', hazard: 'Sling or shackle failure while lifting steel or test weights', hazard_es: PENDING_ES, controls: ['Inspect rigging before each shift and remove anything damaged', 'Never exceed the marked capacity of slings and hardware'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 4, prov: osha('h') },
    { id: 'hoist_clear', hazard: 'Operator caught under the load while running a new hoist', hazard_es: PENDING_ES, controls: ['Run the hoist only where the operator can stand clear of the load', 'Never exceed the working load marked on the hoist'], controls_es: PENDING_ES, osha_ref: '1926.554(a)(4)', severity: 4, prov: osha('n') },
    { id: 'conveyor_caught', hazard: 'Caught in a conveyor belt, roller, chain or pinch point at start-up', hazard_es: PENDING_ES, controls: ['Fit stop switches at the operator station and an audible warning before start-up', 'Guard every pinch point before the first run'], controls_es: PENDING_ES, osha_ref: '1926.555(a)(1)', severity: 4, prov: conv },
    { id: 'loto', hazard: 'Unexpected start-up of a conveyor, hoist or crane during adjustment', hazard_es: PENDING_ES, controls: ['Lock out and tag the disconnect before reaching into equipment', 'Tag controls that are deactivated during the work'], controls_es: PENDING_ES, osha_ref: '1926.417(a)', severity: 4, ppe: ['personal lock and tag'], prov: osha('k') },
    { id: 'forklift', hazard: 'Struck by a forklift moving frames, beams and conveyor sections', hazard_es: PENDING_ES, controls: ['Only trained, evaluated operators drive forklifts', 'Keep a spotter and walkway separation in tight aisles'], controls_es: PENDING_ES, osha_ref: '1926.602(d)', severity: 3, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'silica_drill', hazard: 'Silica dust from drilling anchor holes in the slab', hazard_es: PENDING_ES, controls: ['Drill with a dust shroud and HEPA vacuum or water, per the Table 1 controls', 'No dry sweeping of drill dust'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['safety glasses', 'respirator when required'], prov: osha('z') },
    { id: 'electrical', hazard: 'Shock from runway conductor bar, festoon or control wiring', hazard_es: PENDING_ES, controls: ['Treat runway conductors as live until locked out and tested', 'Keep tools and bodies clear of energized parts'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'hot_work', hazard: 'Fire from welding runway and rail connections overhead', hazard_es: PENDING_ES, controls: ['Keep a charged extinguisher at the weld area', 'Clear or shield combustibles below and watch the area after welding'], controls_es: PENDING_ES, osha_ref: '1926.352(d)', severity: 3, ppe: ['welding helmet', 'FR clothing'], prov: osha('j') },
  ],
  qa_checklist: [
    { id: 'rack_design_on_site', item: 'Stamped rack drawings and calculations (and any required fire-code approval) are on site and match the configuration being built.', item_es: { status: 'translated', text: 'Planos y cálculos sellados del rack (y la aprobación del código de incendios si aplica) en obra y conformes a la configuración que se arma.' }, prov: rack },
    { id: 'beam_locks_installed', item: 'Every beam connector fully seated with its safety lock or pin in place.', item_es: PENDING_ES, safety: true, prov: rack },
    { id: 'frames_plumb', item: 'Upright frames plumb both ways within the rack maker’s tolerance.', item_es: { status: 'translated', text: 'Marcos verticales aplomados en ambos sentidos dentro de la tolerancia del fabricante del rack.' }, prov: rack },
    { id: 'anchors_per_design', item: 'Anchors at every base plate match the rack design for type, size, embedment and count.', item_es: PENDING_ES, safety: true, prov: { src: ['material_handling-mhi-rmi', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'IBC 2209 points to the rack design standard; anchorage comes from the engineered design.' } },
    { id: 'guards_installed', item: 'Column and end-of-aisle guards installed where forklifts travel.', item_es: { status: 'translated', text: 'Protectores de columna y de fin de pasillo instalados donde circulan montacargas.' }, prov: rack },
    { id: 'load_plaques_posted', item: 'Load plaque posted on each row showing allowed load per level and per bay.', item_es: PENDING_ES, safety: true, prov: rack },
    { id: 'field_dims_verified', item: 'Runway span, column spacing, rail height and overhead clearances field-verified before the crane order is finalized.', item_es: { status: 'translated', text: 'Claro de la vía, separación de columnas, altura de riel y espacios libres verificados en campo antes de cerrar el pedido de la grúa.' }, prov: ufgs },
    { id: 'runway_alignment_record', item: 'Runway span, straightness and rail elevation surveyed and recorded within the crane maker’s tolerances.', item_es: { status: 'translated', text: 'Claro, rectitud y elevación de rieles levantados y registrados dentro de las tolerancias del fabricante de la grúa.' }, prov: { src: ['material_handling-ufgs-41-22-13-14', 'material_handling-mhi-cmaa'], confidence: 'derived', last_verified: D } },
    { id: 'no_load_test', item: 'No-load test done: hooks through full travel at each speed, bridge and trolley end to end, brakes and controls proven; currents and speeds recorded.', item_es: { status: 'translated', text: 'Prueba sin carga realizada: ganchos en todo su recorrido a cada velocidad, puente y carro de extremo a extremo, frenos y controles probados; corrientes y velocidades registradas.' }, prov: ufgs },
    { id: 'hook_tram', item: 'Hook throat measured between tram points before and after the load test; no increase.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'load_test_report', item: 'Rated-load and overload tests done with calibrated weights at the percentages the maker and spec allow; signed report on file.', item_es: PENDING_ES, safety: true, prov: { src: ['material_handling-ufgs-41-22-13-14', 'material_handling-ecfr-1910-179'], confidence: 'verified', last_verified: D } },
    { id: 'capacity_marked', item: 'Rated load marked on the crane bridge and on each hoist, readable from the floor.', item_es: PENDING_ES, safety: true, prov: { src: ['material_handling-ecfr-1910-179', 'ecfr-1926-n'], confidence: 'verified', last_verified: D } },
    { id: 'conveyor_level_tracking', item: 'Conveyor beds level and square; belt tracks centered or rollers turn freely.', item_es: { status: 'translated', text: 'Camas del transportador niveladas y a escuadra; la banda corre centrada o los rodillos giran libremente.' }, prov: est('Common conveyor installer acceptance check; follow the maker’s tracking procedure.') },
    { id: 'conveyor_guards', item: 'Pinch points, drives and chains guarded; guards under sections over aisles; crossovers signed.', item_es: PENDING_ES, safety: true, prov: conv },
    { id: 'estop_reset', item: 'Each emergency stop stops the line, and the line will not restart until that stop is reset.', item_es: PENDING_ES, safety: true, prov: conv },
    { id: 'turnover_docs', item: 'Owner received drawings, test reports, lockout points list, O&M manuals and operator training record.', item_es: { status: 'translated', text: 'El dueño recibió planos, reportes de prueba, lista de puntos de bloqueo, manuales de operación y mantenimiento y registro de capacitación.' }, prov: ufgs },
  ],
  inspection_checklists: {
    framing: [
      { item: 'Crane runway beams, brackets and rails installed per the approved drawings; connections open for review', item_es: PENDING_ES, ref: '1705.2' },
      { item: 'Runway alignment survey record available', item_es: { status: 'translated', text: 'Registro de levantamiento de alineación de la vía disponible' } },
      { item: 'Special inspection report for runway bolting and welding where required', item_es: { status: 'translated', text: 'Reporte de inspección especial de pernos y soldaduras de la vía donde se requiera' }, ref: '1705.2' },
    ],
    final: [
      { item: 'Racks match the approved rack design: frames plumb, beams locked, anchors installed', item_es: PENDING_ES, ref: '2209.1' },
      { item: 'Load plaques posted on every rack row', item_es: PENDING_ES, ref: '2209.1' },
      { item: 'High-piled storage approval and flue spaces in place where the fire code official requires them', item_es: PENDING_ES, ref: '3201.1' },
      { item: 'Crane load test report signed and rated load marked on the bridge and hoist', item_es: PENDING_ES },
      { item: 'Conveyor guards, emergency stops and start-up warning working', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-MH-RACK-BAY', name: 'Selective pallet rack bay, 3 beam levels with wire decks, supply + install', name_es: 'Sección de rack selectivo para tarimas, 3 niveles de vigas con parrillas, suministro e instalación', unit: 'EA', csi: '10 56 13',
      description: 'Typical ~8 ft wide x 42 in. deep x 16 ft tall bay (one upright frame share + 3 beam pairs + 6 wire decks); anchors and guards are separate lines.',
      material_cost_cents: { v: 80000, prov: est('frame share + 3 beam pairs + 6 wire decks, new steel, national baseline 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('two-person crew with lift, per bay') },
      equipment_cost_cents: { v: 3000, prov: est('scissor lift / forklift day share per bay') }, waste_pct: { v: 0, prov: est('ordered to the layout') } },
    { code: 'B-MH-RACK-ANCHOR-EA', name: 'Rack base-plate anchor, drilled and set, each', name_es: 'Anclaje de placa base de rack, perforado e instalado, c/u', unit: 'EA', csi: '10 56 13',
      material_cost_cents: { v: 600, prov: est('post-installed concrete anchor, 2026') }, labor_hours_per_unit: { v: 0.15, prov: est('drill with dust extraction, clean, set, torque') },
      equipment_cost_cents: { v: 100, prov: est('hammer drill and HEPA vacuum share') }, waste_pct: { v: 5, prov: est('spares for spun or short anchors') } },
    { code: 'B-MH-COLGUARD-EA', name: 'Rack column guard / upright protector, floor-anchored, each', name_es: 'Protector de columna de rack anclado al piso, c/u', unit: 'EA', csi: '10 56 13',
      material_cost_cents: { v: 9000, prov: est('steel upright protector + anchors, 2026') }, labor_hours_per_unit: { v: 0.5, prov: est('layout, drill and anchor') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('ordered by count') } },
    { code: 'B-MH-MONORAIL-HOIST-EA', name: 'Monorail with 2-ton electric chain hoist and motorized trolley, allowance, each', name_es: 'Monorriel con polipasto eléctrico de cadena de 2 t y carro motorizado, asignación, c/u', unit: 'EA', csi: '41 22 23',
      description: 'Allowance for a short (~30 ft) monorail beam with hoist and trolley; support steel by others.',
      material_cost_cents: { v: 900000, prov: est('hoist + motorized trolley + ~30 LF beam + controls, 2026 allowance') }, labor_hours_per_unit: { v: 24, prov: est('hang beam, set hoist, wire controls, test') },
      equipment_cost_cents: { v: 80000, prov: est('boom lift for the install week') }, waste_pct: { v: 0, prov: est('allowance') } },
    { code: 'B-MH-BRIDGE-CRANE-EA', name: 'Top-running single-girder bridge crane, ~5 ton, with runway rail and electrification, allowance, each', name_es: 'Grúa viajera monoviga de rodamiento superior, ~5 t, con riel de vía y electrificación, asignación, c/u', unit: 'EA', csi: '41 22 13',
      description: 'Allowance — span, lift and service class change price widely; runway support steel by structural.',
      material_cost_cents: { v: 6000000, prov: est('crane, hoist, ~100 LF runway rail, conductor bar, controls — 2026 allowance') }, labor_hours_per_unit: { v: 120, prov: est('runway rail, bridge set, electrification, alignment, testing') },
      equipment_cost_cents: { v: 500000, prov: est('mobile crane day + boom lifts') }, waste_pct: { v: 0, prov: est('allowance') } },
    { code: 'B-MH-CONV-LF', name: 'Powered belt or roller conveyor, per linear foot, supply + install', name_es: 'Transportador motorizado de banda o rodillos, por pie lineal, suministro e instalación', unit: 'LF', csi: '41 21 23',
      material_cost_cents: { v: 35000, prov: est('light-duty powered conveyor incl. supports and share of drive/controls, 2026') }, labor_hours_per_unit: { v: 1, prov: est('set supports, beds, align, guard') },
      equipment_cost_cents: { v: 1000, prov: est('lift share') }, waste_pct: { v: 0, prov: est('ordered to length') } },
    { code: 'B-MH-LOADTEST-EA', name: 'Crane or hoist load test with certified test weights and report, each', name_es: 'Prueba de carga de grúa o polipasto con pesos certificados y reporte, c/u', unit: 'EA', csi: '41 22 13',
      material_cost_cents: { v: 0, prov: est('no material') }, labor_hours_per_unit: { v: 8, prov: est('no-load + rated + overload tests, tram measurement, report') },
      equipment_cost_cents: { v: 250000, prov: est('test weight rental and freight') }, waste_pct: { v: 0, prov: est('service') } },
  ],
  // No quantity rules: no blueprint fact gives a rack layout, crane or conveyor count — add the B-MH-* lines by hand.
  quantity_rules: [],
  dependency_hints: [
    { after_trades: ['concrete', 'structural_steel'], before_phase: 'punch', note: 'Racks anchor to a cured slab and cranes need their runway support steel; set both before fire-protection and final, and load-test cranes before turnover.' },
  ],
});
