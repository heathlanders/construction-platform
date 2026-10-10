// Trade Knowledge Pack — test_balance (Testing, Adjusting & Balancing — HVAC air and hydronic systems).
// Wave 14 — NEW-TRADE pattern (not in HAND_RECIPE_KEYS). Template tasks: commercial 'HVAC test, adjust &
// balance (TAB)' and industrial 'HVAC & ventilation test, adjust & balance' (phase commissioning).
// Dossier: docs/trade-packs/dossiers/test_balance.md. Sources: UFGS 23 05 93 (May 2025), PNNL Building
// Re-Tuning (outdoor-air concept), 29 CFR 1926 (C, D, E, I, K, L, M, X, AA), IECC C408.2.2 / C403.12.2.3
// and IMC 403.3 / 603.9 (reference only), AABC / NEBB / TABB procedural standards (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['test_balance-ufgs-23-05-93'], confidence: 'verified' as const, last_verified: D };
const pnnl = { src: ['test_balance-pnnl-retuning'], confidence: 'derived' as const, last_verified: D, note: 'Outdoor-air / economizer verification concept from PNNL re-tuning; paraphrased.' };
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });

const TITLE = 'test(?:ing)?,?\\s*adjust(?:ing)?,?\\s*(?:&|and)\\s*balanc|\\bTAB\\b|air\\s*balanc|hvac\\s*balanc';
const DALT = 'duct\\s*(?:air\\s*)?leak(?:age)?\\s*test|\\bDALT\\b';
const HYD = 'hydronic\\s*(?:system\\s*)?balanc|water\\s*balanc|balanc\\w*\\s*(?:the\\s*)?(?:chilled|heating|hot)[-\\s]*water';
const COMMERCIAL = ['commercial', 'industrial', 'residential_mf'] as const;

export default definePack({
  key: 'test_balance',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Independent testing, adjusting and balancing (TAB) of HVAC systems at commissioning: checks the systems are ready, witnesses duct leakage tests, measures and sets airflow at every fan, terminal and outlet, balances hydronic flow at pumps and coils, verifies outdoor air, marks every setting and issues a certified TAB report.',
    summary_es: 'Prueba, ajuste y balanceo (TAB) independiente de los sistemas HVAC durante la puesta en marcha: revisa que los sistemas estén listos, presencia las pruebas de fuga de ductos, mide y ajusta el flujo de aire en cada ventilador, terminal y salida, balancea el flujo hidrónico en bombas y serpentines, verifica el aire exterior, marca cada ajuste y entrega un reporte TAB certificado.',
    glossary: [
      { term: 'TAB', term_es: 'TAB (prueba, ajuste y balanceo)', def: 'Testing, adjusting and balancing — measuring air and water flows and setting dampers, valves and fan or pump speeds until they match the design.', def_es: 'Prueba, ajuste y balanceo — medir los flujos de aire y agua y ajustar compuertas, válvulas y velocidades de ventiladores o bombas hasta que coincidan con el diseño.' },
      { term: 'Proportional balancing', term_es: 'Balanceo proporcional', def: 'Setting each branch so every outlet gets the same share of its design flow, keeping one path fully open so the fan or pump does not waste energy.', def_es: 'Ajustar cada ramal para que cada salida reciba la misma proporción de su flujo de diseño, dejando un camino totalmente abierto para que el ventilador o la bomba no desperdicie energía.' },
      { term: 'Duct traverse', term_es: 'Recorrido (traverse) de ducto', def: 'A grid of pitot-tube velocity readings across a duct used to find the total airflow in that duct.', def_es: 'Una cuadrícula de lecturas de velocidad con tubo pitot a lo ancho de un ducto para calcular el flujo total de aire.' },
      { term: 'Flow hood (capture hood)', term_es: 'Campana de medición de flujo', def: 'A fabric hood held over a grille or diffuser that reads the airflow coming out of it directly.', def_es: 'Una campana de tela que se coloca sobre una rejilla o difusor y lee directamente el flujo de aire que sale.' },
      { term: 'DALT', term_es: 'DALT (prueba de fuga de aire en ductos)', def: 'Duct air leakage test — capping a duct section, pressurizing it with a test fan and measuring how much air leaks out.', def_es: 'Prueba de fuga de aire en ductos — se tapa un tramo, se presuriza con un ventilador de prueba y se mide cuánto aire se escapa.' },
      { term: 'Balancing valve', term_es: 'Válvula de balanceo', def: 'A valve on a hydronic branch with test ports and a memory stop, used to measure and set water flow to a coil.', def_es: 'Válvula en un ramal hidrónico con puertos de prueba y tope de memoria, usada para medir y ajustar el flujo de agua a un serpentín.' },
      { term: 'Memory stop', term_es: 'Tope de memoria', def: 'An adjustable stop on a balancing valve that lets it be closed for service and reopened to the balanced setting.', def_es: 'Un tope ajustable en la válvula de balanceo que permite cerrarla para servicio y volver a abrirla en la posición balanceada.' },
      { term: 'Static pressure profile', term_es: 'Perfil de presión estática', def: 'Pressure readings before and after each fan, coil, filter and damper that show where the system loses pressure.', def_es: 'Lecturas de presión antes y después de cada ventilador, serpentín, filtro y compuerta que muestran dónde pierde presión el sistema.' },
      { term: 'P/T port', term_es: 'Puerto P/T', def: 'Small self-sealing fitting in the pipe where a gauge or thermometer probe is inserted to read pressure or temperature.', def_es: 'Pequeño accesorio autosellante en la tubería donde se inserta un manómetro o termómetro para leer presión o temperatura.' },
      { term: 'Certified TAB report', term_es: 'Reporte TAB certificado', def: 'The signed report listing design and measured flows, settings and deficiencies for every system, issued by a certified TAB firm.', def_es: 'El reporte firmado con los flujos de diseño y medidos, los ajustes y las deficiencias de cada sistema, emitido por una empresa TAB certificada.' },
    ],
  },
  est_bucket: 'mechanical',
  recipes: [
    {
      id: 'tab_hvac_systems',
      example_title: 'HVAC test, adjust & balance (TAB)',
      when: { title_re: TITLE },
      steps: [
        {
          title: 'Review the design and confirm the systems are ready',
          instruction: 'Read the mechanical drawings, equipment schedules, controls sequences and approved submittals, and list every fan, terminal, outlet, pump and coil to be balanced with its design flow. Walk the job with the mechanical and controls contractors and check the pre-TAB list: equipment started up with the start-up forms done, new filters in, strainers cleaned, fire and balancing dampers open, test ports installed, controls running, and the building closed in. Write up anything not ready before field work starts.',
          detail: 'Balancing a system that is not finished wastes the crew’s days — the readings have to be repeated after the fix.',
          code_refs: [{ section: 'C408.2', note: 'Mechanical systems commissioning and completion requirements', code_type: 'IECC' }],
          tools: ['approved drawings and submittals', 'flashlight', 'ladder', 'pre-TAB checklist'],
          materials: [],
          safety_ids: ['ladder', 'rotating_parts', 'confined_space'],
          qa_ids: ['pre_tab_ready', 'instruments_calibrated'],
          gating_inspection_type: 'equipment_set',
        },
        {
          title: 'Witness or run the duct leakage tests',
          instruction: 'Where the project requires duct leakage testing, test the selected duct sections before they are insulated or closed in. Cap the open ends, connect the test fan to the section, bring it to the test pressure for its pressure class, and record the measured leakage against the allowed amount. If a section fails, stop, have the sheet metal crew seal it, and retest.',
          code_refs: [{ section: 'C403.12.2.3', note: 'High-pressure duct systems — leakage testing of representative sections', code_type: 'IECC' }, { section: '603.9', note: 'Duct joints, seams and connections sealed' }],
          tools: ['duct leakage test rig (fan + orifice)', 'digital manometer', 'end caps and tape'],
          materials: ['temporary duct caps', 'test report form'],
          safety_ids: ['aerial_lift', 'ladder', 'cut_hands'],
          qa_ids: ['dalt_before_cover'],
          gating_inspection_type: 'duct_leakage',
        },
        {
          title: 'Balance the air systems',
          instruction: 'Set each air handler or rooftop unit to full design airflow. Take a pitot traverse in the main ducts and a static pressure profile across the fan, coils and filters. Read every grille and diffuser with a flow hood, then set the branch and outlet dampers proportionally, leaving at least one path fully open. Adjust fan speed — drive setting or sheave — to bring the total to design, without going over the motor’s rated amps or the fan’s rated speed.',
          detail: 'Use the drive or sheave to make up the last of the airflow, not a choked discharge damper — it wastes fan energy.',
          code_refs: [{ section: 'C408.2.2.1', note: 'Air system balancing — minimize throttling, then set fan speed', code_type: 'IECC' }],
          tools: ['flow hood', 'pitot tube and digital manometer', 'tachometer', 'clamp-on ammeter', 'drill with step bit'],
          materials: ['duct test-port plugs', 'balancing log sheets'],
          safety_ids: ['rotating_parts', 'lockout', 'energized_readings', 'ladder', 'aerial_lift', 'roof_edge', 'noise'],
          qa_ids: ['air_within_tolerance', 'one_path_open', 'motor_limits'],
        },
        {
          title: 'Balance the hydronic systems',
          instruction: 'With the pumps running and the system full, filled and vented, open one path fully from each pump to a terminal and back. Read flow at every balancing valve and flow station, then set the valves proportionally to the design flow at each coil. Set the pump speed or trim to hit the design total, read pump pressures at the test ports, and lock each valve’s memory stop.',
          code_refs: [{ section: 'C408.2.2.2', note: 'Hydronic system balancing — minimize throttling, then set pump speed', code_type: 'IECC' }],
          tools: ['differential pressure meter for balancing valves', 'P/T gauge and thermometer probe', 'clamp-on ammeter'],
          materials: ['balancing log sheets'],
          safety_ids: ['hot_surfaces', 'rotating_parts', 'energized_readings', 'noise'],
          qa_ids: ['water_within_tolerance', 'memory_stops'],
        },
        {
          title: 'Verify outdoor air and building pressure',
          instruction: 'Measure the outdoor air and exhaust at each unit at minimum and full outdoor-air positions and compare them with the design ventilation rates. Check the economizer damper moves the way the sequence says. With doors and windows closed, read the building pressure against outdoors and note any space that is badly positive or negative.',
          code_refs: [{ section: '403.3', note: 'Outdoor air ventilation and exhaust airflow rates' }],
          tools: ['flow hood or pitot tube', 'digital manometer', 'thermometer'],
          materials: [],
          safety_ids: ['roof_edge', 'rotating_parts', 'ladder'],
          qa_ids: ['outdoor_air_verified', 'building_pressure'],
        },
        {
          title: 'Mark settings, report and punch with the controls contractor',
          instruction: 'Permanently mark every damper and valve setting, secure damper handles, set memory stops, and label each drive with its final speed. Mark the duct test ports. Write up deficiencies in writing as soon as they are found and work them off with the mechanical and controls contractors. Issue the certified TAB report with design and measured values, then repeat readings for the inspector or owner on the sample they choose.',
          code_refs: [{ section: 'C408.2.2', note: 'Systems adjusting and balancing — report of design and measured flows', code_type: 'IECC' }],
          tools: ['paint marker or tags', 'label maker', 'flow hood', 'laptop'],
          materials: ['permanent marking tags', 'certified TAB report'],
          safety_ids: ['ladder', 'aerial_lift'],
          qa_ids: ['settings_marked', 'deficiencies_logged', 'report_certified'],
          gating_inspection_type: 'final',
        },
      ],
    },
    {
      id: 'tab_duct_leakage',
      example_title: 'Duct air leakage test (DALT)',
      when: { title_re: DALT },
      priority: 10,
      steps: [
        {
          title: 'Check the duct is ready to test',
          instruction: 'Confirm the selected duct sections are installed, sealed and supported but still exposed — no insulation, wrap or ceiling over them. Get the duct layout with the sections marked and agree the test pressure for each pressure class.',
          tools: ['duct layout drawings', 'flashlight', 'ladder'],
          materials: [],
          safety_ids: ['ladder', 'aerial_lift'],
          qa_ids: ['dalt_before_cover'],
        },
        {
          title: 'Cap, pressurize and measure',
          instruction: 'Cap every open end of the section, connect the test fan, and bring the duct to the test pressure. Record the leakage flow and compare it to the allowed leakage for the section. Do not let anyone seal the selected sections between selection and the reading.',
          code_refs: [{ section: 'C403.12.2.3', note: 'High-pressure duct leakage testing of representative sections', code_type: 'IECC' }],
          tools: ['duct leakage test rig (fan + orifice)', 'digital manometer'],
          materials: ['temporary duct caps', 'duct tape'],
          safety_ids: ['aerial_lift', 'cut_hands', 'energized_readings'],
          qa_ids: ['dalt_before_cover'],
          gating_inspection_type: 'duct_leakage',
        },
        {
          title: 'Seal failures, retest and report',
          instruction: 'If a section fails, stop testing that system, have the sheet metal crew find and seal the leaks, and test again. Issue the leakage report with the section, pressure, measured and allowed leakage before insulation is released.',
          tools: ['smoke pencil', 'digital manometer'],
          materials: ['test report form'],
          safety_ids: ['ladder'],
          qa_ids: ['report_certified'],
          gating_inspection_type: 'duct_leakage',
        },
      ],
    },
    {
      id: 'tab_hydronic',
      example_title: 'Hydronic system balancing',
      when: { title_re: HYD },
      priority: 10,
      steps: [
        {
          title: 'Confirm the water system is ready',
          instruction: 'Check the system is filled, vented and flushed, strainer screens are clean, pumps have been started up and rotate the right way, and P/T ports are in at each pump, coil, heat exchanger, chiller and boiler.',
          tools: ['flashlight', 'P/T gauge'],
          materials: [],
          safety_ids: ['hot_surfaces', 'rotating_parts'],
          qa_ids: ['pre_tab_ready'],
          gating_inspection_type: 'equipment_set',
        },
        {
          title: 'Read and set flow at every balancing valve',
          instruction: 'Open one full path from each pump to a terminal and back. Read the flow at every balancing valve and flow station, set them proportionally to design, then set the pump speed or impeller trim so the total matches the design.',
          code_refs: [{ section: 'C408.2.2.2', note: 'Hydronic system balancing — minimize throttling, then set pump speed', code_type: 'IECC' }],
          tools: ['differential pressure meter for balancing valves', 'clamp-on ammeter'],
          materials: ['balancing log sheets'],
          safety_ids: ['hot_surfaces', 'energized_readings', 'noise'],
          qa_ids: ['water_within_tolerance'],
        },
        {
          title: 'Lock settings and record',
          instruction: 'Set the memory stop on each balancing valve, mark the setting, label drives with their final speed, and enter design and measured flows for every coil and pump in the TAB report.',
          tools: ['paint marker or tags', 'laptop'],
          materials: ['permanent marking tags'],
          safety_ids: ['hot_surfaces'],
          qa_ids: ['memory_stops', 'settings_marked'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    duct_leakage: [
      { section: 'C403.12.2.3', note: 'High-pressure duct systems — leakage test of representative sections', code_type: 'IECC', prov: { ...icc, note: '2021 IECC numbering (C403.11.2.3 in 2018).' } },
    ],
    equipment_set: [
      { section: 'C408.2', note: 'Mechanical systems commissioning and completion requirements', code_type: 'IECC', prov: icc },
    ],
    final: [
      { section: 'C408.2.2.1', note: 'Air system balancing — throttling minimized, then fan speed set', code_type: 'IECC', prov: icc },
      { section: 'C408.2.2.2', note: 'Hydronic system balancing — throttling minimized, then pump speed set', code_type: 'IECC', prov: icc },
      { section: '403.3', note: 'Outdoor air ventilation and exhaust airflow rates', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: `${TITLE}|${DALT}`, building_types: [...COMMERCIAL] }, type: 'scissor_lift', reason: 'Reach ceiling diffusers, VAV boxes and duct traverse ports in high open ceilings', optional: true },
  ],
  hazards: [
    { id: 'ladder', hazard: 'Ladder fall while reading ceiling diffusers and setting dampers above ceilings', hazard_es: PENDING_ES, controls: ['Use a ladder rated for the load with the flow hood; keep three points of contact', 'Do not stand on the top step or reach out past the side rails — move the ladder'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'aerial_lift', hazard: 'Falling or being caught in a lift while reading high outlets and duct ports', hazard_es: PENDING_ES, controls: ['Wear a harness and lanyard tied to the platform anchor', 'Watch overhead for duct, sprinkler pipe and structure when raising the platform'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'roof_edge', hazard: 'Fall from the roof edge while reading rooftop units, exhaust fans and outdoor air intakes', hazard_es: PENDING_ES, controls: ['Stay inside guardrails or warning lines, or use personal fall arrest near unprotected edges', 'Stay off skylights and covered openings'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness + lanyard where required'], prov: osha('m') },
    { id: 'rotating_parts', hazard: 'Caught in fan belts, sheaves, couplings or a fan wheel while taking speed readings or changing sheaves', hazard_es: PENDING_ES, controls: ['Keep belt and coupling guards on while running; read speed through the guard opening', 'Lock out the unit before opening a fan section or changing a sheave'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(2)', severity: 4, prov: osha('i') },
    { id: 'lockout', hazard: 'Unit restarts by the controls while hands are in the fan or damper section', hazard_es: PENDING_ES, controls: ['Open, lock and tag the disconnect before reaching into a unit', 'Tell the controls contractor before overriding or locking out any unit'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'energized_readings', hazard: 'Shock or arc flash while taking amp and voltage readings in live starters, drives and disconnects', hazard_es: PENDING_ES, controls: ['Only qualified workers take live readings; use rated meters and insulated probes', 'Wear arc-rated face and hand protection when panels are open and energized'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, ppe: ['arc-rated face shield', 'voltage-rated gloves'], prov: osha('k', 'Live-work PPE follows NFPA 70E (reference only).') },
    { id: 'hot_surfaces', hazard: 'Burns from hot water and steam piping, P/T ports and boiler surfaces', hazard_es: PENDING_ES, controls: ['Wear gloves and eye protection when inserting probes in hot ports', 'Let hot water bleed slowly at a port; never open a port facing your face'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['heat-resistant gloves', 'safety glasses'], prov: osha('e') },
    { id: 'noise', hazard: 'Hearing loss from long hours in mechanical rooms beside running fans, pumps and chillers', hazard_es: PENDING_ES, controls: ['Wear hearing protection in mechanical rooms and at running units', 'Limit time next to the loudest equipment'], controls_es: PENDING_ES, osha_ref: '1926.52(d)(1)', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('d') },
    { id: 'confined_space', hazard: 'Entering plenums, large ducts or tunnels with poor air or limited exits', hazard_es: PENDING_ES, controls: ['Have the competent person decide whether a plenum or tunnel is a permit space before entry', 'Lock out fans serving the plenum and keep a second person outside'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 4, prov: osha('aa') },
    { id: 'cut_hands', hazard: 'Cuts from duct edges and drilling test ports in sheet metal', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves when drilling ports and handling duct caps', 'Deburr drilled ports and plug them when done'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves', 'safety glasses'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'instruments_calibrated', item: 'Every instrument used carries a NIST-traceable calibration dated within the last year; certificates in the report.', item_es: { status: 'translated', text: 'Cada instrumento usado tiene calibración trazable a NIST con fecha del último año; certificados incluidos en el reporte.' }, prov: ufgs },
    { id: 'pre_tab_ready', item: 'Pre-TAB checklist signed: equipment start-up done, new filters, clean strainers, dampers open, P/T and duct test ports installed, controls running.', item_es: { status: 'translated', text: 'Lista previa al TAB firmada: arranque de equipos hecho, filtros nuevos, coladores limpios, compuertas abiertas, puertos P/T y de prueba en ductos instalados, controles funcionando.' }, prov: ufgs },
    { id: 'dalt_before_cover', phase: 'rough_in', item: 'Duct leakage tested on the selected sections at their pressure class before insulation or ceilings cover them; failures sealed and retested.', item_es: { status: 'translated', text: 'Fuga de ductos probada en los tramos seleccionados a su clase de presión antes de aislarlos o cubrirlos con plafón; fallas selladas y vueltas a probar.' }, prov: ufgs },
    { id: 'air_within_tolerance', phase: 'commissioning', item: 'Measured airflow at each fan, terminal and outlet within the specified tolerance of design (typically ±5–10%).', item_es: { status: 'translated', text: 'Flujo de aire medido en cada ventilador, terminal y salida dentro de la tolerancia especificada del diseño (normalmente ±5–10%).' }, prov: ufgs },
    { id: 'one_path_open', phase: 'commissioning', item: 'At least one fully open path from fan to outlet; total flow set by fan speed, not by a choked discharge damper.', item_es: { status: 'translated', text: 'Al menos un camino totalmente abierto del ventilador a una salida; flujo total ajustado con la velocidad del ventilador, no con una compuerta de descarga estrangulada.' }, prov: { src: ['test_balance-ufgs-23-05-93', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'UFGS 3.2.4.2 + IECC C408.2.2.1 topic.' } },
    { id: 'motor_limits', phase: 'commissioning', item: 'No fan or pump left running above its rated speed or full-load amps in any mode; readings recorded.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'water_within_tolerance', phase: 'commissioning', item: 'Measured water flow at every coil and pump within the specified tolerance; flow read at every balancing valve.', item_es: { status: 'translated', text: 'Flujo de agua medido en cada serpentín y bomba dentro de la tolerancia especificada; flujo leído en cada válvula de balanceo.' }, prov: ufgs },
    { id: 'memory_stops', phase: 'commissioning', item: 'Memory stops set on every balancing valve and damper handles secured at the balanced position.', item_es: { status: 'translated', text: 'Topes de memoria fijados en cada válvula de balanceo y manijas de compuertas aseguradas en la posición balanceada.' }, prov: ufgs },
    { id: 'outdoor_air_verified', phase: 'commissioning', item: 'Outdoor air at each unit measured at minimum and full positions and meets the design ventilation rate; economizer moves per sequence.', item_es: PENDING_ES, safety: true, prov: { src: ['test_balance-ufgs-23-05-93', 'test_balance-pnnl-retuning'], confidence: 'derived', last_verified: D, note: 'UFGS 3.2.2 OA tolerance note + PNNL re-tuning OA/economizer checks.' } },
    { id: 'building_pressure', phase: 'commissioning', item: 'Building pressure read against outdoors with doors and windows closed; badly positive or negative spaces reported.', item_es: { status: 'translated', text: 'Presión del edificio medida contra el exterior con puertas y ventanas cerradas; espacios muy positivos o negativos reportados.' }, prov: ufgs },
    { id: 'settings_marked', phase: 'commissioning', item: 'Every damper and valve setting permanently marked, drives labeled with final speed, duct test ports marked and plugged.', item_es: { status: 'translated', text: 'Cada ajuste de compuerta y válvula marcado permanentemente, variadores etiquetados con su velocidad final, puertos de prueba en ductos marcados y tapados.' }, prov: ufgs },
    { id: 'deficiencies_logged', phase: 'commissioning', item: 'Deficiencies found during balancing reported in writing to the contractor and owner and tracked to close-out.', item_es: { status: 'translated', text: 'Deficiencias encontradas durante el balanceo reportadas por escrito al contratista y al dueño y seguidas hasta su cierre.' }, prov: ufgs },
    { id: 'report_certified', phase: 'commissioning', item: 'Certified TAB report issued with design and measured values for every system, signed by the certified TAB supervisor; field spot-check passed.', item_es: { status: 'translated', text: 'Reporte TAB certificado entregado con valores de diseño y medidos de cada sistema, firmado por el supervisor TAB certificado; verificación en campo aprobada.' }, prov: { src: ['test_balance-ufgs-23-05-93', 'test_balance-tabb'], confidence: 'derived', last_verified: D, note: 'UFGS 3.2.8–3.2.9; certification by AABC/NEBB/TABB (reference only).' } },
  ],
  inspection_checklists: {
    duct_leakage: [
      { item: 'Duct leakage report for the selected high-pressure sections, tested before concealment', item_es: PENDING_ES, ref: 'IECC C403.12.2.3' },
    ],
    equipment_set: [
      { item: 'Equipment started up and controls operating before balancing begins', item_es: PENDING_ES, ref: 'IECC C408.2' },
    ],
    final: [
      { item: 'Air and hydronic balancing report on file with design and measured flows', item_es: PENDING_ES, ref: 'IECC C408.2.2' },
      { item: 'Outdoor air rates at each unit meet the design ventilation rates', item_es: PENDING_ES, ref: 'IMC 403.3' },
      { item: 'Balancing devices marked and memory stops set', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'M-TAB-OUTLET-EA', name: 'Air balance per terminal outlet (grille, register or diffuser) — read and set', name_es: 'Balanceo de aire por salida terminal (rejilla, registro o difusor) — medir y ajustar', unit: 'EA', csi: '23 05 93',
      material_cost_cents: { v: 0, prov: est('labor item; no materials') }, labor_hours_per_unit: { v: 0.3, prov: est('flow-hood reading, damper set, re-read, log — national baseline 2026') },
      equipment_cost_cents: { v: 200, prov: est('calibrated flow hood + lift share per outlet') }, waste_pct: { v: 0, prov: est('labor item') } },
    { code: 'M-TAB-AHU-EA', name: 'Air-handling unit / RTU balance — static profile, fan speed set, OA/EA verified', name_es: 'Balanceo de manejadora de aire / unidad de techo — perfil estático, velocidad del ventilador, aire exterior y extracción', unit: 'EA', csi: '23 05 93',
      material_cost_cents: { v: 0, prov: est('labor item; sheave changes by mechanical contractor') }, labor_hours_per_unit: { v: 6, prov: est('static profile, traverse setup, fan speed, OA/EA readings, report entry') },
      equipment_cost_cents: { v: 2500, prov: est('instrument kit share per unit') }, waste_pct: { v: 0, prov: est('labor item') } },
    { code: 'M-TAB-TRAVERSE-EA', name: 'Pitot-tube duct traverse, ports drilled and plugged', name_es: 'Recorrido de ducto con tubo pitot, puertos perforados y tapados', unit: 'EA', csi: '23 05 93',
      material_cost_cents: { v: 300, prov: est('test-port plugs') }, labor_hours_per_unit: { v: 1.5, prov: est('drill ports, read grid, compute, plug') },
      equipment_cost_cents: { v: 500, prov: est('pitot tube + manometer + lift share') }, waste_pct: { v: 0, prov: est('labor item') } },
    { code: 'M-TAB-HYD-TERM-EA', name: 'Hydronic balance per terminal coil or balancing valve — read and set', name_es: 'Balanceo hidrónico por serpentín terminal o válvula de balanceo — medir y ajustar', unit: 'EA', csi: '23 05 93',
      material_cost_cents: { v: 0, prov: est('labor item') }, labor_hours_per_unit: { v: 0.75, prov: est('connect meter, read, set, memory stop, log') },
      equipment_cost_cents: { v: 300, prov: est('differential pressure meter share') }, waste_pct: { v: 0, prov: est('labor item') } },
    { code: 'M-TAB-REPORT-EA', name: 'Certified TAB report, pre-TAB review and field acceptance re-test — per project', name_es: 'Reporte TAB certificado, revisión previa y re-prueba de aceptación en campo — por proyecto', unit: 'EA', csi: '23 05 93',
      material_cost_cents: { v: 0, prov: est('labor item') }, labor_hours_per_unit: { v: 24, prov: est('design review, pre-TAB walk, report assembly, certification, spot-check visit') },
      equipment_cost_cents: { v: 0, prov: est('office work') }, waste_pct: { v: 0, prov: est('labor item') } },
  ],
  quantity_rules: [
    { code: 'M-TAB-OUTLET-EA', assumption: '≈1 supply, return or exhaust outlet per 170 SF of floor area — replace with the diffuser count from the drawings', when: { building_types: [...COMMERCIAL] }, qty: { basis: 'area_sf_sum', mul: 0.006, round: 'ceil' } },
    { code: 'M-TAB-AHU-EA', assumption: '≈1 air handler or rooftop unit per 10,000 SF — replace with the equipment schedule count', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.0001, round: 'ceil' } },
    { code: 'M-TAB-TRAVERSE-EA', assumption: '≈3 main-duct traverses (supply, return, outdoor air) per air handler', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.0003, round: 'ceil' } },
    { code: 'M-TAB-REPORT-EA', assumption: 'One certified TAB report per project', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 1 } },
  ],
  dependency_hints: [
    { after_trades: ['ductwork', 'hvac', 'controls_bms'], note: 'Balancing starts after ducts are sealed and leak-tested, equipment is started up and the controls are running.' },
    { before_phase: 'punch', note: 'Certified TAB report and field spot-check done before final punch and occupancy.' },
  ],
});
