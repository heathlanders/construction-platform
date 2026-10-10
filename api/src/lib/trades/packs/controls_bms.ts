// Trade Knowledge Pack — controls_bms (Building Controls / BMS — DDC/BACnet building automation,
// sensors, actuators, sequences of operation, checkout and functional testing). Wave 14 — NEW-TRADE
// pattern (no hand recipe; commercial template task 'Building automation & controls rough-in').
// Dossier: docs/trade-packs/dossiers/controls_bms.md. Sources: UFGS 23 09 00 (Instrumentation and
// Control for HVAC, Part 3), PNNL Building Re-Tuning, DOE BTO building controls, 29 CFR 1926
// (C, E, K, L, M, X, Z), IMC 306/606, IECC C403.4 / C408.2, NEC 300.22 / 725 (reference only),
// ASHRAE Guideline 36 + Standard 135 BACnet (named only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['controls_bms-ufgs-23-09-00'], confidence: 'verified' as const, last_verified: D };
const retune = { src: ['controls_bms-pnnl-retuning'], confidence: 'derived' as const, last_verified: D, note: 'Trend-review practice from PNNL Building Re-Tuning; paraphrased.' };
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const nec = { src: ['nfpa-fa'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });

const ROUGH = '\\b(?:building\\s*)?automation\\b|\\bBAS\\b|\\bBMS\\b|\\bEMS\\b|\\bDDC\\b|temperature\\s*controls?|\\bcontrols?\\b';
const CX = 'commission|\\bCx\\b|check-?\\s*out|point[-\\s]*to[-\\s]*point|functional\\s*(?:performance\\s*)?test|\\bFPT\\b|trend|training|sequence\\s*(?:of\\s*operations?\\s*)?(?:test|verif)';
const LIFT = 'rough|install|automation|controls?\\b|sensor|actuator';

export default definePack({
  key: 'controls_bms',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs the building automation system (BAS/BMS): DDC controllers, low-voltage control wiring, sensors, valve and damper actuators and the network to the HVAC equipment — then programs the sequences, checks every point, runs functional tests with the balancer and Cx agent, reviews trends and trains the owner.',
    summary_es: 'Instala el sistema de automatización del edificio (BAS/BMS): controladores DDC, cableado de control de bajo voltaje, sensores, actuadores de válvulas y compuertas y la red hacia los equipos de HVAC; luego programa las secuencias, revisa cada punto, hace pruebas funcionales con el balanceador y el agente Cx, revisa tendencias y capacita al propietario.',
    glossary: [
      { term: 'DDC controller', term_es: 'Controlador DDC', def: 'Digital controller that reads sensors and drives actuators and equipment by its program.', def_es: 'Controlador digital que lee sensores y mueve actuadores y equipos según su programa.' },
      { term: 'Point', term_es: 'Punto', def: 'One input or output wired to a controller — a sensor reading, a start/stop, a valve command.', def_es: 'Una entrada o salida conectada a un controlador: una lectura de sensor, un arranque/paro, una orden a una válvula.' },
      { term: 'Points list', term_es: 'Lista de puntos', def: 'Schedule of every point: name, type (AI/AO/BI/BO), range, alarm and trend settings.', def_es: 'Tabla con cada punto: nombre, tipo (AI/AO/BI/BO), rango, alarmas y tendencias.' },
      { term: 'Sequence of operation', term_es: 'Secuencia de operación', def: 'Written description of how each system must run — start, stop, setpoints, resets and safeties.', def_es: 'Descripción escrita de cómo debe funcionar cada sistema: arranque, paro, puntos de ajuste, reajustes y seguridades.' },
      { term: 'Actuator', term_es: 'Actuador', def: 'Motor that strokes a damper or valve when the controller sends a signal.', def_es: 'Motor que mueve una compuerta o válvula cuando el controlador envía una señal.' },
      { term: 'BACnet', term_es: 'BACnet', def: 'Open communication protocol (ASHRAE 135) so controllers from different makers talk on one network.', def_es: 'Protocolo abierto de comunicación (ASHRAE 135) para que controladores de distintos fabricantes se comuniquen en una red.' },
      { term: 'Point-to-point checkout', term_es: 'Verificación punto por punto', def: 'Proving each point from the field device to the screen: the reading is right and the device moves when commanded.', def_es: 'Comprobar cada punto desde el dispositivo en campo hasta la pantalla: la lectura es correcta y el dispositivo se mueve al ordenarlo.' },
      { term: 'Functional performance test', term_es: 'Prueba funcional de desempeño', def: 'Test that runs a whole system through its sequence and safeties to prove it works as designed.', def_es: 'Prueba que hace pasar todo un sistema por su secuencia y sus seguridades para comprobar que funciona según el diseño.' },
      { term: 'Trend log', term_es: 'Registro de tendencias', def: 'Values the BAS records over time, used to spot hunting, bad schedules and heating and cooling fighting.', def_es: 'Valores que el BAS registra en el tiempo, usados para detectar oscilaciones, horarios errados y calefacción y enfriamiento compitiendo.' },
      { term: 'Graphics', term_es: 'Gráficos', def: 'Operator screens that show each system with live values, setpoints and alarms.', def_es: 'Pantallas del operador que muestran cada sistema con valores en vivo, puntos de ajuste y alarmas.' },
    ],
  },
  est_bucket: 'mechanical',
  recipes: [
    {
      id: 'bas_rough_in',
      example_title: 'Building automation & controls rough-in',
      when: { title_re: ROUGH },
      steps: [
        {
          title: 'Get the controls submittals approved before rough-in',
          instruction: 'Submit and get approved the riser diagram, control schematics, points list, sequences of operation, panel locations and the hardware data sheets. Walk the drawings with the mechanical and electrical foremen: where each panel mounts, which equipment ships with factory controls, who provides 120 V to the panels, and where duct smoke detectors and sensors go.',
          detail: 'Sequences are often written to ASHRAE Guideline 36 and the network to BACnet (ASHRAE 135) — confirm which the specification calls for.',
          code_refs: [{ section: 'C403.4', code_type: 'IECC', note: 'HVAC system controls — thermostatic, off-hour, setback and reset controls the design must provide' }],
          tools: ['approved drawings', 'marker', 'tape measure', 'laser level'],
          materials: [],
          safety_ids: ['ladder'],
          qa_ids: ['submittals_approved'],
        },
        {
          title: 'Mount the controller panels and run the control pathways',
          instruction: 'Mount controller enclosures where they stay reachable for service and clear of equipment access space. Run conduit or plenum-rated cable on supports from structure — never laid on the ceiling grid or tied to other trades\' hangers. Keep Class 2 control cable separated from power conductors, and fill each penetration of a rated wall or floor with the listed firestop system.',
          code_refs: [{ section: '725', code_type: 'NEC', note: 'Class 2 and Class 3 power-limited circuits — wiring methods and separation from power' }, { section: '300.22', code_type: 'NEC', note: 'Wiring in ducts and plenum spaces used for environmental air' }],
          tools: ['scissor lift', 'hammer drill', 'conduit bender', 'band saw', 'fish tape', 'label printer'],
          materials: ['controller enclosures', 'EMT conduit and fittings', 'plenum-rated control cable', 'J-hooks or cable supports', 'listed firestop'],
          safety_ids: ['aerial_lift', 'silica_drill', 'overhead_debris', 'cable_pull_trip'],
          qa_ids: ['panel_access', 'cable_supported', 'class2_separation'],
          gating_inspection_type: 'rough_in',
        },
        {
          title: 'Install sensors, actuators and duct smoke detectors',
          instruction: 'Set space sensors at the mounting height on the drawings, away from supply air, sunlight and heat sources. Install duct temperature and pressure sensors and airflow stations at the locations shown with the straight duct run they need. Mount damper and valve actuators so they stroke the full travel, and install duct smoke detectors with access to test them. Wells in hot water or steam piping go in only with the pipe drained or by the pipefitter.',
          code_refs: [{ section: '606', note: 'Smoke detection systems control — duct smoke detectors and air distribution shutdown' }],
          tools: ['scissor lift', 'drill/driver', 'step drill', 'tin snips', 'multimeter'],
          materials: ['space and duct sensors', 'damper and valve actuators', 'duct smoke detectors and housings', 'immersion wells (by pipefitter)', 'airflow measuring stations'],
          safety_ids: ['aerial_lift', 'ladder', 'sheet_metal_cut', 'hot_pipe'],
          qa_ids: ['sensor_location', 'actuator_stroke_mech', 'smoke_detector_access'],
          gating_inspection_type: 'rough_in',
        },
        {
          title: 'Terminate at the equipment and bring the network up',
          instruction: 'Lock out the equipment before landing wires in starters, VFDs or unit control panels. Terminate each point to the controller per the wiring diagram, tag every wire and device with the point name on the as-builts, and install surge protection where the specification calls for it. Address each controller, bring the network up and confirm every controller reports in. Change all default passwords.',
          code_refs: [{ section: '306', note: 'Access and service space at equipment and its controls' }],
          tools: ['lockout kit', 'multimeter', 'wire strippers', 'laptop with BAS tools', 'label printer'],
          materials: ['wire markers and device tags', 'engraved panel labels', 'surge protectors', 'network cable and switches'],
          safety_ids: ['lockout', 'live_panel', 'roof_edge'],
          qa_ids: ['labels_tags', 'passwords_changed'],
          gating_inspection_type: 'equipment_set',
        },
      ],
    },
    {
      id: 'bas_commissioning',
      example_title: 'Controls checkout, functional testing & owner training',
      when: { title_re: CX },
      priority: 10,
      steps: [
        {
          title: 'Load programming, schedules, alarms and graphics',
          instruction: 'Load the approved sequences into each controller, then set occupancy schedules, setpoints, alarm limits and trend logs per the points list. Build operator graphics showing each system with live values. Tune control loops so they settle without hunting.',
          code_refs: [{ section: 'C403.4.1', code_type: 'IECC', note: 'Thermostatic controls — zone control and setpoint deadband' }],
          tools: ['laptop with BAS programming software', 'approved sequences and points list'],
          materials: [],
          safety_ids: [],
          qa_ids: ['passwords_changed'],
        },
        {
          title: 'Check out every point from the device to the screen',
          instruction: 'Check each sensor against a calibrated test instrument at a low and a high reading and recalibrate or replace any out of tolerance. Command each actuator through its full range and confirm the damper or valve moves the right direction from closed to open. Start and stop each piece of equipment from the BAS and confirm status comes back. Record every point on the checkout sheet.',
          detail: 'Lock out equipment that could start unexpectedly while others work on it; warn other trades before commanding fans and dampers.',
          tools: ['calibrated digital thermometer', 'manometer', 'multimeter', 'laptop with BAS tools', 'radio'],
          materials: ['point-to-point checkout forms'],
          safety_ids: ['lockout', 'aerial_lift', 'ladder'],
          qa_ids: ['p2p_complete', 'sensor_calibration', 'actuator_stroke_mech'],
        },
        {
          title: 'Run the functional tests with the balancer and Cx agent',
          instruction: 'With balancing done, run each system through its sequence with the commissioning agent: occupied and unoccupied modes, economizer, resets, staging and failure modes. Prove the safeties — freeze protection, high static and duct smoke shutdown. Fix and retest every deficiency on the issues log.',
          code_refs: [{ section: 'C408.2', code_type: 'IECC', note: 'Mechanical systems commissioning — functional testing and report' }, { section: '606', note: 'Duct smoke detector shutdown of air distribution' }],
          tools: ['laptop with BAS tools', 'manometer', 'smoke detector test aerosol', 'radio'],
          materials: ['functional test scripts', 'issues log'],
          safety_ids: ['lockout', 'roof_edge', 'ladder'],
          qa_ids: ['safeties_proven', 'fpt_passed'],
          gating_inspection_type: 'final',
        },
        {
          title: 'Review trends, train the owner and turn over',
          instruction: 'Let the system run on its own for the trend period — commonly a week — trending the points marked on the points list, then review the trends for hunting, overrides left on, wrong schedules and heating and cooling fighting each other. Correct and recheck. Train the operators on the graphics, alarms and schedules, and hand over as-built drawings, the points list, sequences, passwords and backups.',
          code_refs: [{ section: 'C408.2', code_type: 'IECC', note: 'Commissioning documentation, operations manuals and system training' }],
          tools: ['laptop with BAS tools'],
          materials: ['as-built drawings', 'O&M manuals', 'program and database backups', 'training sign-in sheet'],
          safety_ids: [],
          qa_ids: ['trend_review', 'turnover_docs'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    rough_in: [
      { section: '725', code_type: 'NEC', note: 'Class 2 and Class 3 power-limited control circuits', prov: nec },
      { section: '300.22', code_type: 'NEC', note: 'Wiring methods in ducts and plenum spaces', prov: nec },
      { section: '606', note: 'Smoke detection systems control — duct detectors', prov: icc },
      { section: 'C403.4', code_type: 'IECC', note: 'HVAC system controls required by the energy code', prov: icc },
    ],
    equipment_set: [
      { section: '306', note: 'Access and service space for equipment and controls', prov: icc },
    ],
    final: [
      { section: 'C408.2', code_type: 'IECC', note: 'Mechanical systems commissioning, functional tests and documentation', prov: icc },
      { section: 'C403.4.1', code_type: 'IECC', note: 'Thermostatic controls and setpoint deadband', prov: icc },
      { section: '606', note: 'Duct smoke detector shutdown verified', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: LIFT, building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'scissor_lift', reason: 'Reach ceiling plenums to run control cable and mount sensors and actuators' },
    { when: { title_re: LIFT, building_types: ['industrial'] }, type: 'boom_lift', reason: 'Reach high-bay sensors, dampers and unit controllers over equipment', optional: true },
  ],
  hazards: [
    { id: 'ladder', hazard: 'Ladder fall while mounting sensors, panels and working above ceilings', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above any landing it is used to reach', 'Keep three points of contact; never stand on the top step or on ceiling grid'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'aerial_lift', hazard: 'Falling or being thrown from a scissor or boom lift while pulling cable overhead', hazard_es: PENDING_ES, controls: ['Wear a harness and lanyard tied to the boom or basket anchor', 'Stand on the platform floor, never on the rails; check overhead for pipe and duct before raising'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'live_panel', hazard: 'Shock or arc flash while landing control wires in energized starters, VFDs or unit control panels', hazard_es: PENDING_ES, controls: ['Work only on de-energized equipment; if work near live parts cannot be avoided, guard them and use insulated tools', 'Only qualified workers open energized panels'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, ppe: ['insulated gloves', 'arc-rated clothing as required'], prov: osha('k') },
    { id: 'lockout', hazard: 'Fan, damper or pump starting unexpectedly while it is being wired or commanded during checkout', hazard_es: PENDING_ES, controls: ['Lock and tag the equipment disconnect before working on it', 'Warn other trades and clear the area before commanding equipment from the BAS'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'silica_drill', hazard: 'Breathing silica dust when drilling concrete for anchors, sleeves and conduit', hazard_es: PENDING_ES, controls: ['Use a drill with a dust-collection shroud and HEPA vacuum, or wet methods', 'Follow the Table 1 control for the task or measure exposure'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator where Table 1 requires'], prov: osha('z') },
    { id: 'overhead_debris', hazard: 'Dust and chips in the eyes when drilling overhead and opening ceilings', hazard_es: PENDING_ES, controls: ['Wear safety glasses or goggles when drilling or working above ceilings'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses or goggles'], prov: osha('e') },
    { id: 'roof_edge', hazard: 'Fall from a roof edge while mounting outdoor sensors or wiring rooftop unit controllers', hazard_es: PENDING_ES, controls: ['Use guardrails or personal fall arrest within 6 ft of an unprotected edge', 'Stay back from skylights and roof openings or cover them'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness + lanyard where required'], prov: osha('m') },
    { id: 'cord_shock', hazard: 'Shock from extension cords and drills used for cable runs on temporary power', hazard_es: PENDING_ES, controls: ['Plug tools into GFCI-protected outlets', 'Inspect cords before use and keep them off sharp duct and conduit edges'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'sheet_metal_cut', hazard: 'Cuts from duct edges and drilled sheet metal when installing duct sensors and actuators', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves when working inside or on ductwork', 'Deburr drilled holes'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('e') },
    { id: 'cable_pull_trip', hazard: 'Tripping over cable reels, pulls and scraps left in corridors and mechanical rooms', hazard_es: PENDING_ES, controls: ['Keep cable reels and scraps out of walkways', 'Clean up offcuts and packaging at the end of each pull'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, prov: osha('c') },
    { id: 'hot_pipe', hazard: 'Burns from hot water or steam lines when installing sensors in wells or working beside piping', hazard_es: PENDING_ES, controls: ['Never open a pressurized hot line — wells go in drained or by the pipefitter', 'Treat insulated piping as hot until confirmed cool'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, ppe: ['gloves'], prov: osha('c', 'General hazard-training duty; no construction-specific rule for hot piping work.') },
  ],
  qa_checklist: [
    { id: 'submittals_approved', item: 'Riser, schematics, points list, sequences and hardware data approved before devices are installed.', item_es: { status: 'translated', text: 'Diagrama de red, esquemas, lista de puntos, secuencias y fichas técnicas aprobados antes de instalar dispositivos.' }, prov: ufgs },
    { id: 'panel_access', phase: 'rough_in', item: 'Controller panels mounted where they can be opened and serviced, not blocking equipment access space; outdoor devices weather-shielded.', item_es: { status: 'translated', text: 'Tableros de control montados donde se puedan abrir y dar servicio, sin bloquear el espacio de acceso a equipos; dispositivos exteriores protegidos de la intemperie.' }, prov: ufgs },
    { id: 'cable_supported', phase: 'rough_in', item: 'Control cable supported from structure (not on the ceiling grid), plenum-rated where open in a plenum, and firestopped at rated penetrations.', item_es: { status: 'translated', text: 'Cable de control soportado de la estructura (no sobre la retícula del plafón), con clasificación plenum donde va expuesto en plenum, y con sello cortafuego en penetraciones clasificadas.' }, prov: { src: ['nfpa-fa', 'controls_bms-ufgs-23-09-00'], confidence: 'derived', last_verified: D, note: 'NEC 300.22 / 725 topics + UFGS installation practice; no code values stored.' } },
    { id: 'class2_separation', phase: 'rough_in', item: 'Class 2 control wiring kept separate from line-voltage conductors in raceways, boxes and panels.', item_es: PENDING_ES, safety: true, prov: nec },
    { id: 'sensor_location', phase: 'rough_in', item: 'Space sensors at the specified height away from supply diffusers, sun and heat; duct sensors and airflow stations where the drawings show.', item_es: { status: 'translated', text: 'Sensores de espacio a la altura especificada, lejos de difusores, sol y calor; sensores de ducto y estaciones de flujo donde indican los planos.' }, prov: ufgs },
    { id: 'actuator_stroke_mech', item: 'Each damper and valve actuator strokes the device fully from closed to open in the correct direction.', item_es: { status: 'translated', text: 'Cada actuador de compuerta y válvula mueve el dispositivo completamente de cerrado a abierto en la dirección correcta.' }, prov: ufgs },
    { id: 'smoke_detector_access', phase: 'rough_in', item: 'Duct smoke detectors installed where required with access to test and clean them, and wired to shut down the air handler.', item_es: PENDING_ES, safety: true, prov: icc },
    { id: 'labels_tags', item: 'Every panel, controller, wire and device labeled or tagged with the identifier on the as-built drawings — no handwritten labels.', item_es: { status: 'translated', text: 'Cada tablero, controlador, cable y dispositivo etiquetado con el identificador de los planos finales (as-built), sin etiquetas escritas a mano.' }, prov: ufgs },
    { id: 'passwords_changed', phase: 'commissioning', item: 'All default passwords changed and the password list turned over to the owner per the cybersecurity requirements.', item_es: { status: 'translated', text: 'Todas las contraseñas de fábrica cambiadas y la lista de contraseñas entregada al propietario según los requisitos de ciberseguridad.' }, prov: ufgs },
    { id: 'sensor_calibration', phase: 'commissioning', item: 'Each sensor checked against a calibrated instrument at a low and a high reading and within tolerance, or recalibrated or replaced.', item_es: { status: 'translated', text: 'Cada sensor comparado con un instrumento calibrado en una lectura baja y una alta y dentro de tolerancia, o recalibrado o reemplazado.' }, prov: ufgs },
    { id: 'p2p_complete', phase: 'commissioning', item: 'Point-to-point checkout sheet complete for every point: reading verified, command verified, status returned.', item_es: { status: 'translated', text: 'Hoja de verificación punto por punto completa para cada punto: lectura verificada, orden verificada, estado de retorno.' }, prov: ufgs },
    { id: 'safeties_proven', phase: 'commissioning', item: 'Freeze protection, high static and duct smoke shutdown each tripped and proven to stop the equipment.', item_es: PENDING_ES, safety: true, prov: { src: ['controls_bms-ufgs-23-09-00', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'UFGS 23 09 00 performance verification + IMC 606 shutdown topic.' } },
    { id: 'fpt_passed', phase: 'commissioning', item: 'Functional tests passed for every system and mode; issues log closed out and signed by the commissioning agent.', item_es: { status: 'translated', text: 'Pruebas funcionales aprobadas para cada sistema y modo; registro de problemas cerrado y firmado por el agente de puesta en servicio.' }, prov: icc },
    { id: 'trend_review', phase: 'commissioning', item: 'Trend period run unattended and reviewed: no hunting, no overrides left on, schedules correct, no simultaneous heating and cooling.', item_es: { status: 'translated', text: 'Periodo de tendencias corrido sin intervención y revisado: sin oscilaciones, sin anulaciones activas, horarios correctos, sin calefacción y enfriamiento simultáneos.' }, prov: retune },
    { id: 'turnover_docs', phase: 'commissioning', item: 'As-builts, points list, sequences, program backups and training records handed to the owner.', item_es: { status: 'translated', text: 'Planos finales, lista de puntos, secuencias, respaldos del programa y registros de capacitación entregados al propietario.' }, prov: ufgs },
  ],
  inspection_checklists: {
    rough_in: [
      { item: 'Control wiring methods suit the space — plenum-rated or in raceway, supported, separated from power', item_es: PENDING_ES, ref: 'NEC 725 / 300.22' },
      { item: 'Duct smoke detectors installed where required and accessible for testing', item_es: PENDING_ES, ref: '606' },
    ],
    equipment_set: [
      { item: 'Unit controllers and control panels keep the required service access at equipment', item_es: PENDING_ES, ref: '306' },
    ],
    final: [
      { item: 'Duct smoke detector shuts down the air handler when tripped', item_es: PENDING_ES, ref: '606' },
      { item: 'Required HVAC controls present and working — zone thermostats, setback/off-hour, economizer', item_es: PENDING_ES, ref: 'IECC C403.4' },
      { item: 'Commissioning report or preliminary report and documentation available where required', item_es: PENDING_ES, ref: 'IECC C408.2' },
    ],
  },
  assemblies: [
    { code: 'M-BAS-DDC-PANEL-EA', name: 'BACnet building controller / DDC panel in enclosure with power supply, mounted and powered from a provided circuit', name_es: 'Controlador de edificio BACnet / tablero DDC en gabinete con fuente de poder, montado y conectado a un circuito provisto', unit: 'EA', csi: '25 14 00',
      description: '120 V branch circuit by the electrician; points priced separately per I/O point.',
      material_cost_cents: { v: 350000, prov: est('network controller + I/O modules + enclosure + power supply, national baseline 2026') }, labor_hours_per_unit: { v: 12, prov: est('mount, wire power and network, address, label') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('factory hardware') } },
    { code: 'M-BAS-POINT-EA', name: 'BAS hardwired I/O point — field device, control cable and termination (average)', name_es: 'Punto E/S cableado del BAS — dispositivo de campo, cable de control y terminación (promedio)', unit: 'EA', csi: '25 30 00',
      description: 'Blended sensor/actuator/relay point with ~75 ft of plenum cable; programming priced by M-BAS-PROG-PT.',
      material_cost_cents: { v: 30000, prov: est('average field device + cable + terminations per point, national baseline 2026') }, labor_hours_per_unit: { v: 3.5, prov: est('cable pull, device mount, terminate, tag') },
      equipment_cost_cents: { v: 1500, prov: est('scissor lift share per point') }, waste_pct: { v: 5, prov: est('cable offcuts') } },
    { code: 'M-BAS-VAV-CTRL-EA', name: 'VAV terminal unit DDC controller with damper actuator, airflow sensor tie-in and space sensor', name_es: 'Controlador DDC de caja VAV con actuador de compuerta, conexión de sensor de flujo y sensor de espacio', unit: 'EA', csi: '25 14 00',
      description: 'Controller scope only — the terminal box itself is M-VAV-BOX.',
      material_cost_cents: { v: 60000, prov: est('VAV controller-actuator + space sensor + cable, national baseline 2026') }, labor_hours_per_unit: { v: 4, prov: est('mount on box, sensor and cable to the zone, terminate, address') },
      equipment_cost_cents: { v: 2000, prov: est('scissor lift share per box') }, waste_pct: { v: 5, prov: est('cable offcuts') } },
    { code: 'M-BAS-PROG-PT', name: 'BAS programming, database, graphics and point-to-point checkout — per point', name_es: 'Programación, base de datos, gráficos y verificación punto por punto del BAS — por punto', unit: 'EA', csi: '25 30 00',
      material_cost_cents: { v: 0, prov: est('labor item') }, labor_hours_per_unit: { v: 1.2, prov: est('programming, graphics and checkout time per point') },
      equipment_cost_cents: { v: 0, prov: est('laptop and software carried in overhead') }, waste_pct: { v: 0, prov: est('labor item') } },
    { code: 'M-BAS-FPT-SYS', name: 'Controls functional performance testing with TAB/Cx — per HVAC system, incl. trend review', name_es: 'Pruebas funcionales de controles con balanceo y puesta en servicio — por sistema de HVAC, incluye revisión de tendencias', unit: 'EA', csi: '25 08 00',
      material_cost_cents: { v: 0, prov: est('labor item') }, labor_hours_per_unit: { v: 10, prov: est('run sequences and safeties, retest deficiencies, trend review per air handler or plant') },
      equipment_cost_cents: { v: 0, prov: est('test instruments carried in overhead') }, waste_pct: { v: 0, prov: est('labor item') } },
  ],
  quantity_rules: [
    { code: 'M-BAS-DDC-PANEL-EA', assumption: 'About one building controller panel per 20,000 SF of commercial or industrial floor — replace with the riser diagram', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.00005, round: 'ceil' } },
    { code: 'M-BAS-POINT-EA', assumption: 'About one hardwired point per 400 SF of commercial floor — replace with the points list', when: { building_types: ['commercial'] }, qty: { basis: 'area_sf_sum', mul: 0.0025, round: 'ceil' } },
    { code: 'M-BAS-POINT-EA', assumption: 'About one hardwired point per 1,500 SF of industrial floor — replace with the points list', when: { building_types: ['industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.00067, round: 'ceil' } },
    { code: 'M-BAS-PROG-PT', assumption: 'Programming and checkout for the same estimated point count (commercial, ≈1 per 400 SF)', when: { building_types: ['commercial'] }, qty: { basis: 'area_sf_sum', mul: 0.0025, round: 'ceil' } },
    { code: 'M-BAS-FPT-SYS', assumption: 'About one air handler or rooftop system per 15,000 SF to functionally test — replace with the equipment schedule', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.0000667, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['hvac', 'ductwork'], note: 'Ductwork, dampers and equipment set before sensors, actuators and unit controllers are installed.' },
    { after_trades: ['test_balance'], note: 'Functional testing and loop tuning follow air and water balancing.' },
    { before_phase: 'drywall', note: 'Control cable and in-wall sensor boxes roughed in before walls and ceilings close.' },
  ],
});
