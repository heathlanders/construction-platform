// Trade Knowledge Pack — gas_piping (Gas Piping). Wave 02 — NEW-TRADE pattern (no hand recipe of its
// own; the plumbing family recipe only adds a generic "Rough fuel-gas piping" step).
// Dossier: docs/trade-packs/dossiers/gas_piping.md. Sources: UFGS 23 11 23, Gastite/FlashShield+ CSST
// Design & Installation Guide, 29 CFR 1926 (C, D, E, F, I, J, P, X, AA), IFGC (ICC public access) and
// NFPA 54 / NFPA 58 — the model codes are reference only (section number + our paraphrase).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['gas_piping-ufgs-23-11-23'], confidence: 'verified' as const, last_verified: D };
const csst = { src: ['gas_piping-gastite-di'], confidence: 'derived' as const, last_verified: D, note: 'From one CSST maker’s published guide; other CSST brands differ — follow the instructions for the product installed.' };
const ifgc = { src: ['icc-pa', 'gas_piping-nfpa-54'], confidence: 'verified' as const, last_verified: D };
const nfpa58 = { src: ['gas_piping-nfpa-58'], confidence: 'verified' as const, last_verified: D };
const osha = (id: string) => ({ src: [id], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const IFGC = 'IFGC';

export default definePack({
  key: 'gas_piping',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Fuel-gas piping inside and to the building — natural gas from the meter or propane from the tank — sized for the appliance load, run in black steel or CSST, bonded, pressure-tested, then connected to each appliance with a shutoff valve and sediment trap, purged and leak-checked.',
    summary_es: 'Tubería de gas combustible hacia y dentro del edificio — gas natural desde el medidor o propano desde el tanque — dimensionada para la carga de los aparatos, en acero negro o CSST, con conexión equipotencial, probada a presión y luego conectada a cada aparato con válvula de cierre y trampa de sedimentos, purgada y revisada contra fugas.',
    glossary: [
      { term: 'CSST', term_es: 'CSST (tubería corrugada de acero inoxidable)', def: 'Corrugated stainless steel tubing — flexible gas pipe with a plastic jacket, run in long lengths with special fittings.', def_es: 'Tubería flexible de acero inoxidable corrugado con forro plástico, instalada en tramos largos con conexiones especiales.' },
      { term: 'Black iron pipe', term_es: 'Tubo de hierro negro', def: 'Threaded steel pipe, the traditional rigid gas piping.', def_es: 'Tubo de acero roscado, la tubería rígida tradicional para gas.' },
      { term: 'Sediment trap (drip leg)', term_es: 'Trampa de sedimentos (pierna de goteo)', def: 'Short capped pipe below the appliance tee that catches dirt and moisture before it reaches the appliance.', def_es: 'Tramo corto tapado bajo la T del aparato que atrapa suciedad y humedad antes de llegar al aparato.' },
      { term: 'Appliance shutoff valve', term_es: 'Válvula de cierre del aparato', def: 'Accessible valve near each appliance that turns off gas to that appliance only.', def_es: 'Válvula accesible cerca de cada aparato que corta el gas solo a ese aparato.' },
      { term: 'Pressure test', term_es: 'Prueba de presión', def: 'Filling the capped piping with air or inert gas and watching a gauge to prove it holds with no drop.', def_es: 'Llenar la tubería tapada con aire o gas inerte y observar el manómetro para probar que no pierde presión.' },
      { term: 'Bonding', term_es: 'Conexión equipotencial', def: 'Wire and clamp that tie the gas piping to the electrical grounding system so it cannot hold a dangerous voltage.', def_es: 'Cable y abrazadera que unen la tubería de gas al sistema de puesta a tierra para que no quede con voltaje peligroso.' },
      { term: 'Striker plate', term_es: 'Placa protectora', def: 'Steel plate over a stud or joist hole that keeps nails and screws from piercing the gas tubing.', def_es: 'Placa de acero sobre el agujero en un montante o vigueta que evita que clavos o tornillos perforen la tubería.' },
      { term: 'Regulator', term_es: 'Regulador', def: 'Device that lowers gas pressure to what the appliances use; propane systems have a first and second stage.', def_es: 'Dispositivo que baja la presión del gas a la que usan los aparatos; el propano usa primera y segunda etapa.' },
      { term: 'Purging', term_es: 'Purga', def: 'Pushing the air out of new piping so the line fills with gas before lighting appliances.', def_es: 'Sacar el aire de la tubería nueva para que se llene de gas antes de encender los aparatos.' },
    ],
  },
  est_bucket: 'plumbing',
  recipes: [
    {
      id: 'gas_branch_piping',
      example_title: 'Rough-in natural gas piping',
      when: { title_re: '\\bgas\\s+(?:pip|line|rough|branch|distribution|manifold)|\\bcsst\\b|\\bfuel[- ]gas\\b|\\bpropane\\s+(?:pip|line)' },
      steps: [
        {
          title: 'Size the system and lay out the runs',
          instruction: 'List every gas appliance with its input rating, find the longest run from the meter or second-stage regulator, and size each section from the sizing tables for that length and load. Plan routes that avoid ducts, chimneys and spots where the pipe could be hit; mark where the manifold, regulators and appliance stubs go.',
          tools: ['tape measure', 'sizing tables / manufacturer sizing guide', 'marker'],
          materials: ['appliance list with input ratings'],
          safety_ids: ['ladder', 'confined_space'],
          qa_ids: ['sized_from_tables', 'listed_materials'],
          code_refs: [{ section: '402', note: 'Pipe sizing — capacity for length and connected load', code_type: IFGC }],
        },
        {
          title: 'Run and support the piping',
          instruction: 'Install the piping along the planned routes: thread and dope black pipe with a gas-rated compound, or make CSST fittings with the maker’s tools and end prep. Support at the spacing the code or maker sets, keep unions and fittings accessible, and cap every open outlet the same day.',
          tools: ['pipe threader', 'pipe wrenches', 'pipe cutter', 'CSST cutter + fitting tools', 'drill with bits'],
          materials: ['black steel pipe + malleable fittings or listed CSST + fittings', 'gas-rated pipe compound / tape', 'pipe hangers and straps', 'caps and plugs'],
          safety_ids: ['power_threader', 'cutting_oil', 'eye_injury', 'ladder', 'confined_space'],
          qa_ids: ['supports_spacing', 'outlets_capped', 'drip_leg_regulator'],
          code_refs: [{ section: '404', note: 'Piping system installation', code_type: IFGC }],
        },
        {
          title: 'Protect, shield and bond',
          instruction: 'Where tubing passes through studs or joists, add listed striker plates (or conduit where the maker calls for it) so a nail or screw cannot reach it. Keep piping out of harm’s way from vehicles and equipment. Bond the CSST system with the clamp and conductor size the maker and code call for, at the meter side or first manifold. Leave everything exposed for the rough-in inspection.',
          tools: ['hammer', 'wrench', 'wire stripper'],
          materials: ['listed striker plates', 'steel conduit where required', 'bonding clamp', 'bonding conductor'],
          safety_ids: ['ladder', 'eye_injury'],
          qa_ids: ['striker_plates', 'physical_protection', 'csst_bonded'],
          gating_inspection_type: 'rough_in',
          code_refs: [
            { section: '404', note: 'Protection of piping against physical damage', code_type: IFGC },
            { section: '310', note: 'Electrical bonding of gas piping, incl. CSST', code_type: IFGC },
          ],
        },
        {
          title: 'Pressure-test the piping',
          instruction: 'Isolate or remove regulators and appliances, cap every outlet, then pressurize with air or inert gas, never oxygen or the fuel gas itself. Hold the test at the pressure and for the time the code and AHJ require, reading a gauge suited to that range. Record start and end readings and leave the test on the gauge for the inspector.',
          tools: ['test gauge', 'test tree / fill fitting', 'air compressor or nitrogen bottle with regulator', 'leak-detection solution'],
          materials: ['caps and plugs', 'test tag'],
          safety_ids: ['test_pressure', 'gas_ignition'],
          qa_ids: ['test_held', 'regulators_isolated'],
          gating_inspection_type: 'gas_test',
          code_refs: [{ section: '406', note: 'Inspection, testing and purging of piping', code_type: IFGC }],
        },
      ],
    },
    {
      id: 'appliance_connection_final',
      example_title: 'Gas appliance connections and final',
      priority: 1,
      when: { title_re: '\\bgas\\b.*\\b(?:appliance|connect|hook[- ]?up|trim|final|start[- ]?up|light[- ]?off)|\\b(?:appliance|range|dryer|furnace|water heater|fireplace)s?\\s+gas\\b' },
      steps: [
        {
          title: 'Install shutoff, sediment trap and connector',
          instruction: 'At each appliance, install an accessible shutoff valve in the same room and close to the appliance, then a tee with a capped sediment trap ahead of the appliance inlet. Connect fixed appliances with rigid pipe or CSST; movable ones (range, dryer) with a listed flexible connector that is not kinked, stretched, or run through a wall or floor.',
          tools: ['pipe wrenches', 'adjustable wrench', 'pipe threader'],
          materials: ['gas ball valve', 'tee + nipple + cap (sediment trap)', 'listed appliance connector', 'gas-rated pipe compound'],
          safety_ids: ['gas_ignition', 'ladder', 'eye_injury'],
          qa_ids: ['shutoff_near_appliance', 'sediment_trap', 'connector_listed'],
          code_refs: [
            { section: '409', note: 'Shutoff valves — appliance valve location and access', code_type: IFGC },
            { section: '408', note: 'Drips and sediment traps', code_type: IFGC },
            { section: '411', note: 'Appliance connections', code_type: IFGC },
          ],
        },
        {
          title: 'Turn on gas, purge and leak-check',
          instruction: 'With the meter or tank set and the system approved, open gas slowly. Purge air from each line to the outdoors or a well-ventilated spot with no ignition sources nearby, using a gas detector to know when gas arrives. Check every new joint with a non-corrosive leak-check solution or electronic detector; fix any bubble before going further.',
          tools: ['combustible gas detector', 'non-corrosive leak-check solution', 'adjustable wrench'],
          materials: ['leak-check solution'],
          safety_ids: ['purge_release', 'gas_ignition', 'confined_space'],
          qa_ids: ['purged_safely', 'leak_check_connections'],
          code_refs: [{ section: '406', note: 'Purging and leak checking before placing in operation', code_type: IFGC }],
        },
        {
          title: 'Light off and hand over for final',
          instruction: 'Light each appliance per its instructions and confirm a steady flame and correct operation. Check that unused outlets stay capped, labels and valve handles are in place, and piping outside is painted or protected. Walk the inspector through the system at the final.',
          tools: ['manometer', 'gas detector'],
          materials: ['pipe paint or protective coating (exterior)', 'identification labels where required'],
          safety_ids: ['gas_ignition', 'purge_release'],
          qa_ids: ['outlets_capped', 'physical_protection'],
          gating_inspection_type: 'final',
        },
      ],
    },
    {
      id: 'propane_tank_service',
      example_title: 'Set propane tank and service line',
      priority: 2,
      when: { title_re: '\\bpropane\\s+(?:tank|service|supply)|\\b(?:lp[- ]?gas|lpg)\\s+(?:tank|container|service)' },
      steps: [
        {
          title: 'Locate the tank and dig the service trench',
          instruction: 'Place the tank where the gas supplier and the LP-gas code allow: clear of building openings, air intakes and ignition sources, and reachable by the delivery truck. Call for utility locates, then trench the service line to the required cover depth; slope or shore any trench 5 ft or deeper.',
          tools: ['tape measure', 'shovel', 'locator paint'],
          materials: ['tank pad or blocks per supplier'],
          safety_ids: ['struck_utility', 'trench_cavein', 'lpg_container'],
          qa_ids: ['propane_clearances'],
          code_refs: [{ section: 'Ch. 6', note: 'Installation of LP-gas systems — container location', code_type: 'NFPA 58' }],
        },
        {
          title: 'Lay the service line and set regulators',
          instruction: 'Lay listed underground gas pipe or coated tubing in the trench with tracer wire, transition above grade with a listed riser, and keep it from sharp rock. Set the first-stage regulator at the tank and the second-stage regulator at the building with vents pointed down and protected. Leave the trench open for the underground inspection.',
          tools: ['pipe wrenches', 'tubing cutter', 'wire stripper'],
          materials: ['underground-rated gas pipe or coated tubing', 'tracer wire', 'listed anodeless riser', 'first-stage and second-stage regulators'],
          safety_ids: ['trench_cavein', 'lpg_container', 'eye_injury'],
          qa_ids: ['drip_leg_regulator'],
          gating_inspection_type: 'underground',
          code_refs: [{ section: '404', note: 'Underground piping — cover, protection and tracer', code_type: IFGC }],
        },
        {
          title: 'Test, backfill and hand off to the supplier',
          instruction: 'Pressure-test the service line with the regulators isolated and record the readings. After approval, backfill with clean fill and warning tape above the pipe. The gas supplier fills the tank, runs its own leak check and turns on service.',
          tools: ['test gauge', 'compactor (light)'],
          materials: ['clean backfill', 'warning tape'],
          safety_ids: ['test_pressure', 'trench_cavein'],
          qa_ids: ['test_held', 'regulators_isolated'],
          gating_inspection_type: 'gas_test',
          code_refs: [{ section: '406', note: 'Testing of piping', code_type: IFGC }],
        },
      ],
    },
  ],
  code_refs: {
    rough_in: [
      { section: '402', note: 'Pipe sizing for length and connected load', code_type: IFGC, prov: ifgc },
      { section: '404', note: 'Piping installation and protection', code_type: IFGC, prov: ifgc },
      { section: '310', note: 'Electrical bonding of gas piping, incl. CSST', code_type: IFGC, prov: ifgc },
    ],
    gas_test: [{ section: '406', note: 'Inspection, testing and purging', code_type: IFGC, prov: ifgc }],
    underground: [{ section: '404', note: 'Underground piping', code_type: IFGC, prov: ifgc }],
    final: [
      { section: '409', note: 'Appliance shutoff valves', code_type: IFGC, prov: ifgc },
      { section: '408', note: 'Sediment traps', code_type: IFGC, prov: ifgc },
      { section: '411', note: 'Appliance connections', code_type: IFGC, prov: ifgc },
    ],
  },
  equipment: [
    { when: { title_re: 'propane|lp[- ]?gas|lpg|service line' }, type: 'trencher', reason: 'Trench the underground service line from the tank or meter', optional: true },
    { when: { building_types: ['commercial', 'industrial'] }, type: 'welder', reason: 'Welded steel gas piping on larger commercial mains', optional: true },
  ],
  hazards: [
    { id: 'gas_ignition', hazard: 'Fire or explosion from gas released near an ignition source', hazard_es: PENDING_ES, controls: ['No smoking or open flame where gas may be released; post the area', 'Shut and lock the supply valve before opening a live line; keep a fire extinguisher at hand'], controls_es: PENDING_ES, osha_ref: '1926.151(a)(3)', severity: 4, prov: osha('ecfr-1926-f') },
    { id: 'purge_release', hazard: 'Flammable or oxygen-displacing gas building up while purging new lines', hazard_es: PENDING_ES, controls: ['Purge to the outdoors or a well-ventilated area, never into a closed room or crawlspace', 'Watch a combustible gas detector; stop when gas arrives'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 4, prov: osha('ecfr-1926-d') },
    { id: 'hot_work', hazard: 'Fire from brazing, cutting or welding gas pipe', hazard_es: PENDING_ES, controls: ['Move or shield combustibles away from the work before torching', 'Keep a fire watch and an extinguisher ready'], controls_es: PENDING_ES, osha_ref: '1926.352(a)', severity: 3, ppe: ['welding gloves', 'face shield'], prov: osha('ecfr-1926-j') },
    { id: 'test_pressure', hazard: 'Fitting or cap blowing off under test pressure', hazard_es: PENDING_ES, controls: ['Use only air or inert gas — never oxygen — and a regulator on any bottle', 'Stand clear of caps and unions while pressurizing; isolate regulators and appliances'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 3, ppe: ['safety glasses'], prov: osha('ecfr-1926-e') },
    { id: 'lpg_container', hazard: 'Leak or fire from improperly handled or stored propane containers', hazard_es: PENDING_ES, controls: ['Never store propane containers inside a building', 'Use only approved containers, valves and regulators; keep them upright and protected'], controls_es: PENDING_ES, osha_ref: '1926.153(j)', severity: 4, prov: osha('ecfr-1926-f') },
    { id: 'trench_cavein', hazard: 'Cave-in while working in the service-line trench', hazard_es: PENDING_ES, controls: ['Slope, bench or shore trenches 5 ft or deeper', 'Keep spoil and equipment back from the edge'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, prov: osha('ecfr-1926-p') },
    { id: 'struck_utility', hazard: 'Striking a buried gas, electric or water line while digging', hazard_es: PENDING_ES, controls: ['Have utilities located and marked before digging', 'Hand-dig near the marks'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('ecfr-1926-p') },
    { id: 'confined_space', hazard: 'Bad air or entrapment in crawlspaces and tight attics while running pipe', hazard_es: PENDING_ES, controls: ['Have a competent person evaluate crawlspaces before entry', 'Never purge or test with gas inside a crawlspace; keep a second person outside'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 3, prov: osha('ecfr-1926-aa') },
    { id: 'power_threader', hazard: 'Hands or clothing caught in a power pipe threader', hazard_es: PENDING_ES, controls: ['Keep guards in place and use the foot switch', 'No gloves, loose sleeves or jewelry near the rotating chuck'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 3, prov: osha('ecfr-1926-i') },
    { id: 'cutting_oil', hazard: 'Skin and eye irritation from threading oil and pipe compounds', hazard_es: PENDING_ES, controls: ['Read the safety data sheet; wear gloves and eye protection', 'Wash hands before eating'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['gloves', 'safety glasses'], prov: osha('ecfr-1926-d') },
    { id: 'eye_injury', hazard: 'Metal chips and burrs from cutting, reaming and drilling', hazard_es: PENDING_ES, controls: ['Wear safety glasses when cutting, reaming or drilling', 'Deburr pipe ends with the reamer, not by hand'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('ecfr-1926-e') },
    { id: 'ladder', hazard: 'Fall from a ladder while running pipe overhead', hazard_es: PENDING_ES, controls: ['Extend ladders 3 ft above the landing and set them on firm footing', 'Keep three points of contact; do not overreach'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('ecfr-1926-x') },
  ],
  qa_checklist: [
    { id: 'sized_from_tables', phase: 'rough_in', item: 'Every pipe section sized from the code or maker’s sizing tables for its length and the total connected appliance load.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'gas_piping-gastite-di'], confidence: 'verified', last_verified: D } },
    { id: 'listed_materials', item: 'Pipe, tubing and fittings are approved for fuel gas; CSST installed by a person trained on that brand.', item_es: { status: 'translated', text: 'Tubos, tubería y conexiones aprobados para gas combustible; CSST instalado por personal capacitado en esa marca.' }, prov: csst },
    { id: 'supports_spacing', item: 'Piping supported at the spacing the code or maker sets, with no sagging runs.', item_es: { status: 'translated', text: 'Tubería soportada a la separación que fija el código o el fabricante, sin tramos colgados.' }, prov: ufgs },
    { id: 'striker_plates', item: 'Listed striker plates (or conduit where required) at every stud, joist or plate the CSST passes through.', item_es: PENDING_ES, safety: true, prov: csst },
    { id: 'physical_protection', item: 'Piping kept out of ducts and chimneys and protected where vehicles, equipment or digging could hit it; exterior steel coated.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'gas_piping-ufgs-23-11-23'], confidence: 'verified', last_verified: D } },
    { id: 'csst_bonded', item: 'CSST system bonded to the grounding electrode system with the clamp and conductor the maker and code require.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'gas_piping-gastite-di'], confidence: 'verified', last_verified: D, note: 'Some arc-resistant CSST jackets carry no extra maker bond requirement — check the product and the AHJ.' } },
    { id: 'outlets_capped', item: 'Every unused outlet capped or plugged gas-tight; no open pipe ends left at day’s end.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'regulators_isolated', item: 'Regulators and appliances isolated or removed before the pressure test.', item_es: PENDING_ES, safety: true, prov: csst },
    { id: 'test_held', phase: 'inspections', item: 'Pressure test held at the required pressure for the required time on a suitable gauge with no drop; readings recorded.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'gas_piping-ufgs-23-11-23'], confidence: 'verified', last_verified: D } },
    { id: 'shutoff_near_appliance', item: 'Accessible shutoff valve for each appliance in the same room and within reach of it (IFGC 409 sets the distance).', item_es: PENDING_ES, safety: true, prov: ifgc },
    { id: 'sediment_trap', item: 'Sediment trap (tee with capped nipple) installed ahead of each appliance inlet that needs one.', item_es: { status: 'translated', text: 'Trampa de sedimentos (T con niple tapado) instalada antes de la entrada de cada aparato que la requiera.' }, prov: ifgc },
    { id: 'drip_leg_regulator', item: 'Shutoff valve and drip leg on the inlet side of each line regulator; regulator vent directed away and protected.', item_es: { status: 'translated', text: 'Válvula de cierre y pierna de goteo en la entrada de cada regulador de línea; ventilación del regulador dirigida hacia afuera y protegida.' }, prov: csst },
    { id: 'connector_listed', item: 'Flexible appliance connectors listed, not kinked or stretched, and not passing through walls, floors or cabinets.', item_es: PENDING_ES, safety: true, prov: ifgc },
    { id: 'purged_safely', item: 'New lines purged to the outdoors or a ventilated area with no ignition sources, using a gas detector.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'gas_piping-gastite-di'], confidence: 'verified', last_verified: D } },
    { id: 'leak_check_connections', item: 'Every appliance connection leak-checked with a non-corrosive solution or electronic detector after gas-on; no bubbles.', item_es: PENDING_ES, safety: true, prov: csst },
    { id: 'propane_clearances', phase: 'site_prep', item: 'Propane tank set at the code distances from building openings, air intakes and ignition sources, on a firm base the supplier accepts.', item_es: PENDING_ES, safety: true, prov: nfpa58 },
  ],
  inspection_checklists: {
    underground: [
      { item: 'Service line at required cover depth, with tracer wire and listed riser', item_es: PENDING_ES, ref: 'IFGC 404' },
      { item: 'Trench open and bedding free of sharp rock', item_es: PENDING_ES },
    ],
    rough_in: [
      { item: 'Pipe sizes match the sizing plan for length and load', item_es: PENDING_ES, ref: 'IFGC 402' },
      { item: 'Supports, striker plates and physical protection in place', item_es: PENDING_ES, ref: 'IFGC 404' },
      { item: 'CSST bonding conductor and clamp installed', item_es: PENDING_ES, ref: 'IFGC 310' },
    ],
    gas_test: [
      { item: 'Test gauge on the system, holding at the required pressure and time', item_es: PENDING_ES, ref: 'IFGC 406' },
      { item: 'Regulators and appliances isolated; all outlets capped', item_es: PENDING_ES },
    ],
    final: [
      { item: 'Shutoff valve and sediment trap at each appliance', item_es: PENDING_ES, ref: 'IFGC 408/409' },
      { item: 'Appliance connectors listed and correctly installed; joints leak-checked', item_es: PENDING_ES, ref: 'IFGC 411' },
      { item: 'Unused outlets capped; exterior piping protected', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'P-GAS-APPL-CONN', name: 'Gas appliance connection — shutoff valve, sediment trap, listed connector, each', name_es: 'Conexión de aparato a gas — válvula de cierre, trampa de sedimentos, conector certificado, c/u', unit: 'EA', csi: '23 11 23',
      material_cost_cents: { v: 7000, prov: est('ball valve + tee/nipple/cap + listed flex connector, national baseline 2026') }, labor_hours_per_unit: { v: 1.0, prov: est('one appliance hookup incl. leak check') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('fittings') } },
    { code: 'P-GAS-TEST-SYS', name: 'Gas piping pressure test and inspection, per system', name_es: 'Prueba de presión e inspección de tubería de gas, por sistema', unit: 'EA', csi: '23 11 23',
      material_cost_cents: { v: 1500, prov: est('caps/plugs, test fitting, gauge wear share') }, labor_hours_per_unit: { v: 2.0, prov: est('isolate, cap, pressurize, hold, meet inspector') },
      equipment_cost_cents: { v: 1000, prov: est('compressor or nitrogen bottle share') }, waste_pct: { v: 0, prov: est('none') } },
    { code: 'P-GAS-CSST-BOND', name: 'CSST bonding — clamp and bonding conductor to the grounding system, each', name_es: 'Conexión equipotencial de CSST — abrazadera y conductor al sistema de tierra, c/u', unit: 'EA', csi: '23 11 23',
      material_cost_cents: { v: 4000, prov: est('listed bonding clamp + ~25 ft copper conductor, 2026') }, labor_hours_per_unit: { v: 1.0, prov: est('route conductor, make both terminations') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('conductor offcuts') } },
    { code: 'P-GAS-REG-LINE', name: 'Line / second-stage gas regulator with inlet shutoff and drip leg, each', name_es: 'Regulador de línea / segunda etapa con válvula de entrada y pierna de goteo, c/u', unit: 'EA', csi: '23 11 23',
      material_cost_cents: { v: 9000, prov: est('regulator + valve + drip-leg fittings, national baseline 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('set, pipe and vent the regulator') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('fittings') } },
    { code: 'P-GAS-PROPANE-TANK', name: 'Propane tank set — aboveground ~500 gal, pad, first-stage regulator, each', name_es: 'Instalación de tanque de propano — superficie ~500 gal, base, regulador de primera etapa, c/u', unit: 'EA', csi: '23 11 23',
      material_cost_cents: { v: 250000, prov: est('purchased 500-gal tank + pad + first-stage regulator; many owners lease from the supplier instead') }, labor_hours_per_unit: { v: 4.0, prov: est('pad prep, set, regulator and riser') },
      equipment_cost_cents: { v: 15000, prov: est('boom/crane truck share for setting the tank') }, waste_pct: { v: 0, prov: est('none') } },
  ],
  quantity_rules: [
    { code: 'P-GAS-TEST-SYS', assumption: 'Gas noted on plans — one pressure test for the building gas system', when: { facts_any: ['has_natural_gas', 'has_propane_gas'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'P-GAS-CSST-BOND', assumption: 'Gas noted on plans — assume CSST distribution needing one bond (remove if black iron only)', when: { facts_any: ['has_natural_gas', 'has_propane_gas'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'P-GAS-APPL-CONN', assumption: 'Gas water heater — one appliance connection per water heater shown', when: { facts_any: ['has_natural_gas', 'has_propane_gas'] }, qty: { basis: { fixture: 'water_heater' } } },
    { code: 'P-GAS-APPL-CONN', assumption: 'Gas furnace (FAU) — one appliance connection per forced-air unit shown', when: { facts_any: ['has_natural_gas', 'has_propane_gas'] }, qty: { basis: { fixture: 'fau' } } },
    { code: 'P-GAS-PROPANE-TANK', assumption: 'Propane noted on plans for a single-family home — one tank set (often supplier-leased; remove if so)', when: { facts_any: ['has_propane_gas'], building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 1 } },
  ],
  dependency_hints: [
    { after_trades: ['framing'], before_phase: 'insulation', note: 'Gas rough-in, bonding and the pressure test happen after framing and before walls are insulated or closed.' },
  ],
});
