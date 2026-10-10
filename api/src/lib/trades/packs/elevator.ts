// Trade Knowledge Pack — elevator (Elevator / Escalator / Conveying). Wave 14 — NEW-TRADE pattern (no hand recipe,
// no template tasks). Dossier: docs/trade-packs/dossiers/elevator.md.
// Sources: Wis. Admin. Code ch. SPS 318 (adopts ASME A17.1 / A18.1 by reference — conveyance approval, acceptance
// inspection, permit to operate), WI DSPS conveyance program page, 29 CFR 1926 (C, D, H, J, K, M, N, AA),
// IBC ch. 30 + IRC R321 (reference only). ASME A17.1 / A18.1 are proprietary — referenced, never quoted.
// The state conveyance acceptance inspection is NOT a building-permit inspection: it lives in
// inspection_checklists.state_conveyance_acceptance, never as a gate.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const sps = { src: ['elevator-wi-sps318'], confidence: 'verified' as const, last_verified: D };
const dsps = { src: ['elevator-wi-sps318', 'elevator-wi-dsps-conveyance'], confidence: 'verified' as const, last_verified: D };
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const practice = (note: string) => ({ src: ['elevator-wi-sps318', 'icc-pa'], confidence: 'derived' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

const ELV_RE = '\\b(?:elevators?|lula|dumbwaiters?|hoistways?|conveyances?|wheelchair lifts?|platform lifts?|stair(?:way)? ?(?:chair ?)?lifts?)\\b';

export default definePack({
  key: 'elevator',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Elevators and other conveyances — hydraulic and MRL traction elevators, LULA and residential elevators, wheelchair platform lifts, stair chairlifts and dumbwaiters. Covers GC prep (pit, hoistway, controller space, power, phone, fire recall), guarding hoistway openings, install by a licensed mechanic, state acceptance inspection and permit to operate.',
    summary_es: 'Elevadores y otros transportes verticales — hidráulicos y de tracción MRL, LULA y residenciales, plataformas para sillas de ruedas, salvaescaleras y montaplatos. Incluye la preparación del GC (fosa, cubo, controlador, energía, teléfono, retorno de bomberos), protección de aberturas, instalación por mecánico con licencia, inspección estatal y permiso de operación.',
    glossary: [
      { term: 'Hoistway', term_es: 'Cubo del elevador', def: 'The vertical shaft the car travels in, from the pit floor to the top of the shaft.', def_es: 'El ducto vertical por donde viaja la cabina, desde el piso de la fosa hasta lo alto del ducto.' },
      { term: 'Pit', term_es: 'Fosa', def: 'The part of the hoistway below the lowest landing; holds buffers and, for hydraulic units, the cylinder.', def_es: 'La parte del cubo debajo del piso más bajo; aloja los amortiguadores y, en unidades hidráulicas, el cilindro.' },
      { term: 'Overhead', term_es: 'Sobrerrecorrido superior', def: 'Clear height from the top landing floor to the underside of the hoistway ceiling.', def_es: 'Altura libre desde el piso del último nivel hasta la parte inferior del techo del cubo.' },
      { term: 'Machine-room-less (MRL)', term_es: 'Sin cuarto de máquinas (MRL)', def: 'Traction elevator whose machine sits in the hoistway; the controller goes in a closet near the top landing.', def_es: 'Elevador de tracción con la máquina dentro del cubo; el controlador va en un gabinete cerca del último nivel.' },
      { term: 'LULA', term_es: 'LULA (uso y aplicación limitados)', def: 'Limited-use/limited-application elevator — small, slow passenger unit used in low-rise buildings.', def_es: 'Elevador de uso y aplicación limitados — unidad de pasajeros pequeña y lenta para edificios bajos.' },
      { term: 'Vertical platform lift (VPL)', term_es: 'Plataforma elevadora vertical (VPL)', def: 'Open or enclosed platform that lifts a wheelchair user a short height between levels.', def_es: 'Plataforma abierta o cerrada que eleva a un usuario de silla de ruedas una altura corta entre niveles.' },
      { term: 'Fire service recall (Phase I)', term_es: 'Retorno de servicio de bomberos (Fase I)', def: 'Automatic return of the car to a designated landing when the fire alarm detects smoke at a lobby, machine room or hoistway.', def_es: 'Regreso automático de la cabina a un nivel designado cuando la alarma detecta humo en un vestíbulo, cuarto de máquinas o cubo.' },
      { term: 'Shunt trip', term_es: 'Disparo en derivación (shunt trip)', def: 'Breaker that cuts power to the elevator before sprinklers discharge in the machine room or hoistway.', def_es: 'Interruptor que corta la energía del elevador antes de que descarguen los rociadores en el cuarto de máquinas o el cubo.' },
      { term: 'Acceptance inspection', term_es: 'Inspección de aceptación', def: 'State or agent-municipality inspection and witnessed tests that must pass before the conveyance can carry the public.', def_es: 'Inspección y pruebas presenciadas por el estado o municipio agente que deben aprobarse antes de que el equipo transporte al público.' },
      { term: 'Permit to operate', term_es: 'Permiso de operación', def: 'Yearly certificate issued after acceptance, posted in the car or machine space.', def_es: 'Certificado anual emitido después de la aceptación, colocado en la cabina o en el espacio de la máquina.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'hoistway_pit_prep',
      example_title: 'Elevator pit and hoistway prep',
      when: { title_re: '\\b(?:elevator|lift|hoistway)\\b[^.]*\\b(?:pit|shaft|hoistway|rough|prep)\\b|\\bhoistway\\b' },
      priority: 10,
      steps: [
        {
          title: 'Confirm the approved conveyance layout',
          instruction: 'Get the elevator supplier’s approved layout drawing before forming anything: pit depth, hoistway width and depth, overhead, door openings, rail bracket points, sump, controller or machine room location, and the electrical, phone and fire-alarm points. Confirm the conveyance approval (the state permit) is issued — installation cannot start without it.',
          tools: ['tape measure', 'plan set'],
          materials: [],
          safety_ids: [],
          qa_ids: ['layout_approved'],
          code_refs: [{ section: '318.1007(1)', code_type: 'WI SPS', note: 'Conveyance approval needed before installing or altering an elevator or lift' }],
        },
        {
          title: 'Build and waterproof the pit',
          instruction: 'Excavate and pour the pit to the layout depth with the sump pit, drain or sump pump the drawings call for, and waterproof the walls and floor so the pit stays dry. Set the pit ladder and buffer pads where shown. For a hydraulic unit, coordinate the cylinder hole or casing before the slab goes in. Cover or barricade the pit as soon as it is open.',
          detail: 'A wet pit fails the acceptance inspection and rusts the buffers — fix leaks before the mechanic arrives.',
          tools: ['level', 'laser level', 'tape measure'],
          materials: ['pit concrete + reinforcing', 'waterproofing membrane or crystalline coating', 'sump pit liner', 'pit ladder'],
          safety_ids: ['pit_confined', 'shaft_fall', 'falling_objects'],
          qa_ids: ['pit_depth_level', 'pit_dry_sump'],
          gating_inspection_type: 'foundation',
          code_refs: [{ section: '3001', code_type: 'IBC', note: 'Elevators and conveying systems — built to the adopted ASME A17.1 / A18.1' }],
        },
        {
          title: 'Build the hoistway plumb, to size and rated',
          instruction: 'Frame or lay up the hoistway to the layout size and keep it plumb top to bottom — rails need it. Add blocking or embeds at every rail bracket point, rate the enclosure and door frames as the plans require, and leave nothing in the shaft that does not serve the elevator (no pipes, ducts or unrelated wiring). Guard every landing opening as it is formed.',
          tools: ['plumb bob or laser', 'level', 'tape measure'],
          materials: ['rated shaft wall or masonry', 'rail bracket blocking or embed plates', 'temporary landing guardrails'],
          safety_ids: ['shaft_fall', 'falling_objects', 'scaffold_shaft'],
          qa_ids: ['hoistway_plumb_size', 'shaft_clear', 'rated_enclosure'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: '3002', code_type: 'IBC', note: 'Hoistway enclosures — fire-resistance rating and opening protection' }, { section: 'R321', code_type: 'IRC', note: 'Elevators and platform lifts in dwellings — ASME A17.1 / A18.1' }],
        },
        {
          title: 'Rough in power, lighting, phone and fire recall',
          instruction: 'Run the dedicated elevator disconnect, car light circuit, pit and machine-space lighting and receptacle, and the phone or emergency communication line to the controller location. Have the fire alarm installer land the recall initiating devices and relay at the controller, and coordinate sprinklers and the shunt trip in the hoistway and machine room. Ventilate and condition the machine room or controller closet as specified.',
          tools: ['tape measure', 'plan set'],
          materials: ['disconnect + feeder per electrical plans', 'lighting + receptacles', 'communication line', 'fire alarm relay interface'],
          safety_ids: ['shock'],
          qa_ids: ['power_disconnect', 'recall_interface', 'emergency_comm'],
          code_refs: [{ section: '3003', code_type: 'IBC', note: 'Emergency operations — standby power and fire service recall' }, { section: '3005', code_type: 'IBC', note: 'Machine rooms and control spaces' }],
        },
      ],
    },
    {
      id: 'elevator_install',
      example_title: 'Install hydraulic passenger elevator',
      when: { title_re: '\\b(?:elevators?|lula|dumbwaiters?)\\b' },
      steps: [
        {
          title: 'Hand the hoistway over to the elevator mechanic',
          instruction: 'Walk the pit, hoistway and controller space with the licensed elevator mechanic and fix anything off the layout before they start. Keep landing openings barricaded the whole time the shaft is open, and keep other trades out of the hoistway unless the mechanic allows it.',
          tools: ['tape measure', 'flashlight'],
          materials: ['landing barricades or gates'],
          safety_ids: ['shaft_fall', 'hoist_area', 'falling_objects', 'construction_hoist'],
          qa_ids: ['layout_approved', 'landing_guards'],
        },
        {
          title: 'Set rails, machine or jack, and the car',
          instruction: 'The mechanic sets rail brackets and rails plumb, then the hydraulic jack and power unit or the MRL machine, the car sling and platform, counterweight and ropes or belts. Rig only from rated lifting points with inspected slings and chain hoists, and keep everyone out from under a suspended load.',
          detail: 'Welding at rail brackets: fire watch and a hot-work check, especially in a hoistway that acts like a chimney.',
          tools: ['chain hoist', 'rail gauge', 'plumb lines or laser', 'welder'],
          materials: ['guide rails + brackets', 'jack + power unit or traction machine', 'car + sling', 'counterweight + ropes or belts'],
          safety_ids: ['rigging', 'overhead_hoist', 'hot_work', 'shaft_fall', 'falling_objects'],
          qa_ids: ['rails_plumb'],
        },
        {
          title: 'Install doors, fixtures and controls',
          instruction: 'Hang the hoistway and car doors, set door interlocks and restrictors, mount hall and car fixtures, and wire the controller. Lock out and tag the elevator disconnect whenever wiring or working in the pit or on the car top.',
          tools: ['multimeter', 'lockout kit', 'drill/driver'],
          materials: ['hoistway + car doors', 'hall and car fixtures', 'controller + wiring'],
          safety_ids: ['lockout', 'shock', 'moving_car'],
          qa_ids: ['door_interlocks', 'running_clearances'],
        },
        {
          title: 'Test, pass the state acceptance inspection and post the permit',
          instruction: 'The mechanic runs the acceptance tests — load, buffers, safeties or pressure relief, door interlocks, recall and emergency communication — with the licensed elevator inspector witnessing. The unit stays out of public service until the state or agent municipality authorizes it and issues the permit to operate. Hold the building final until then if the elevator is part of the accessible route.',
          tools: ['test weights', 'multimeter'],
          materials: ['state test forms'],
          safety_ids: ['moving_car', 'lockout'],
          qa_ids: ['acceptance_passed', 'permit_posted', 'recall_tested'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '318.170810', code_type: 'WI SPS', note: 'Acceptance inspection by a licensed inspector; not in service until authorized' }, { section: '318.1011', code_type: 'WI SPS', note: 'Permit to operate issued after the acceptance inspection' }],
        },
        {
          title: 'Turn over to the owner',
          instruction: 'Hand over keys (fire service, independent, access), the maintenance control program, wiring diagrams and the as-built layout. Train the owner on recall, the emergency phone and who to call for maintenance; post the registration number where the rules require.',
          tools: [],
          materials: ['keys', 'O&M binder'],
          safety_ids: [],
          qa_ids: ['owner_turnover'],
        },
      ],
    },
    {
      id: 'platform_lift',
      example_title: 'Install vertical wheelchair platform lift',
      when: { title_re: '\\b(?:wheelchair lifts?|platform lifts?|vpl|stair(?:way)? ?(?:chair ?)?lifts?|inclined lift)\\b' },
      priority: 5,
      steps: [
        {
          title: 'Check the approval and the landing conditions',
          instruction: 'Confirm the lift is on the approved plans and has its state approval. Check the pit or recess depth, the runway size, the landing gate or door locations, the level of the upper landing and the clear floor space at each landing against the maker’s layout.',
          tools: ['tape measure', 'level'],
          materials: [],
          safety_ids: ['shaft_fall'],
          qa_ids: ['layout_approved', 'pit_depth_level'],
          code_refs: [{ section: '318.1007(1)', code_type: 'WI SPS', note: 'Approval before installing a platform lift or stairway chairlift' }],
        },
        {
          title: 'Prepare the base, wall and power',
          instruction: 'Pour or level the base slab or pit, add blocking in the wall for the mast or rail anchors, and run the dedicated circuit to the lift location. Guard the upper landing edge until the lift and its gate are in.',
          tools: ['level', 'drill/driver'],
          materials: ['base concrete or leveling', 'wall blocking', 'dedicated circuit per plans'],
          safety_ids: ['shaft_fall', 'shock'],
          qa_ids: ['power_disconnect'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: 'R321', code_type: 'IRC', note: 'Platform lifts in dwellings — ASME A18.1' }],
        },
        {
          title: 'Install the lift, gates and controls',
          instruction: 'Set and anchor the mast, runway or rail, mount the platform, enclosure and landing gates or doors with their interlocks, and wire the call and car controls at accessible heights. Lock out power while working under the platform.',
          tools: ['drill/driver', 'level', 'lockout kit'],
          materials: ['lift unit', 'landing gates or doors', 'anchors per maker'],
          safety_ids: ['lockout', 'moving_car', 'rigging'],
          qa_ids: ['door_interlocks'],
        },
        {
          title: 'Test, inspect and train',
          instruction: 'Run the maker’s tests — rated load, obstruction sensing, gate interlocks, emergency lowering and battery lowering if fitted — then have the licensed inspector perform the acceptance inspection. Train the owner on daily use and emergency lowering.',
          tools: ['test weights'],
          materials: [],
          safety_ids: ['moving_car'],
          qa_ids: ['acceptance_passed', 'owner_turnover'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '318.1810', code_type: 'WI SPS', note: 'Routine, periodic and acceptance inspections of platform lifts' }],
        },
      ],
    },
  ],
  code_refs: {
    foundation: [
      { section: '3001', code_type: 'IBC', note: 'Elevators and conveying systems — design and install per the adopted ASME A17.1 / A18.1', prov: icc },
    ],
    framing: [
      { section: '3002', code_type: 'IBC', note: 'Hoistway enclosures — rating, opening protection, shaft limits', prov: icc },
      { section: 'R321', code_type: 'IRC', note: 'Elevators and platform lifts in dwellings', prov: icc },
    ],
    final: [
      { section: '3003', code_type: 'IBC', note: 'Emergency operations — fire service recall and standby power', prov: icc },
      { section: '3005', code_type: 'IBC', note: 'Machine rooms and control spaces', prov: icc },
      { section: '318.1011', code_type: 'WI SPS', note: 'Permit to operate after the conveyance acceptance inspection', prov: sps },
    ],
  },
  equipment: [
    { when: { title_re: ELV_RE }, type: 'welder', reason: 'Rail bracket and machine-beam welding in the hoistway', optional: true },
    { when: { title_re: '\\b(?:elevators?|lula)\\b', building_types: ['commercial', 'residential_mf', 'industrial'] }, type: 'forklift', reason: 'Unload and stage rails, jack, machine and car components', optional: true },
    { when: { title_re: '\\b(?:hydraulic|holed|in-ground)\\b[^.]*\\belevator\\b', building_types: ['commercial', 'residential_mf', 'industrial'] }, type: 'crane', reason: 'Set the hydraulic cylinder into its casing when the jack cannot be lowered by hand rigging', optional: true },
  ],
  hazards: [
    { id: 'shaft_fall', hazard: 'Fall into the hoistway or pit through an open landing opening', hazard_es: PENDING_ES, controls: ['Barricade every landing opening full width as soon as it exists; keep it closed when no one is working there', 'Anyone leaning into the shaft or working at an unguarded opening uses personal fall arrest'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(14)', severity: 4, ppe: ['harness + lanyard when guards are off'], prov: osha('m') },
    { id: 'hoist_area', hazard: 'Fall while landing materials at a hoistway opening with the guard removed', hazard_es: PENDING_ES, controls: ['Remove a guard only for the moment of landing a load', 'Tie off to a personal fall arrest system before reaching into the opening'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(3)', severity: 4, ppe: ['harness + lanyard'], prov: osha('m') },
    { id: 'falling_objects', hazard: 'Struck by tools or material dropped down the shaft', hazard_es: PENDING_ES, controls: ['Hard hats for everyone in the pit or hoistway', 'Toeboards or screens at landings; nobody works below someone else in the shaft'], controls_es: PENDING_ES, osha_ref: '1926.501(c)', severity: 4, ppe: ['hard hat'], prov: osha('m') },
    { id: 'scaffold_shaft', hazard: 'Fall from a hoistway work platform or car top', hazard_es: PENDING_ES, controls: ['Use a full-body harness — body belts are not acceptable for fall arrest', 'Anchor to a point rated for the fall arrest load'], controls_es: PENDING_ES, osha_ref: '1926.502(d)', severity: 4, ppe: ['full-body harness'], prov: osha('m') },
    { id: 'pit_confined', hazard: 'Bad air, water or entrapment in a deep or flooded pit', hazard_es: PENDING_ES, controls: ['A competent person evaluates the pit as a confined space before work and tests the air if needed', 'Pump out water and lock out the sump pump before entering'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 3, prov: osha('aa') },
    { id: 'rigging', hazard: 'Dropped rail, jack or machine from failed rigging', hazard_es: PENDING_ES, controls: ['Inspect slings, shackles and hooks every shift; pull damaged gear', 'Keep everyone clear below a suspended load'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 4, ppe: ['hard hat', 'gloves'], prov: osha('h') },
    { id: 'overhead_hoist', hazard: 'Chain hoist or support beam overloaded during installation', hazard_es: PENDING_ES, controls: ['Know the marked safe working load of the hoist and the support beam; never exceed it', 'Use the rated lifting point or beam shown on the layout'], controls_es: PENDING_ES, osha_ref: '1926.554(a)(1)', severity: 4, prov: osha('n') },
    { id: 'construction_hoist', hazard: 'Riding or loading an elevator or material hoist used for construction before it is approved', hazard_es: PENDING_ES, controls: ['Follow the maker’s load and speed limits and post them on the car', 'No riders on a material hoist; temporary construction use only after the inspector allows it'], controls_es: PENDING_ES, osha_ref: '1926.552(a)(1)', severity: 4, prov: osha('n') },
    { id: 'lockout', hazard: 'Car or doors move while someone is in the pit, on the car top or wiring the controller', hazard_es: PENDING_ES, controls: ['Lock and tag the elevator disconnect at every point it can be energized', 'Verify the car will not run before entering the pit or car top'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'shock', hazard: 'Electric shock at the controller, disconnect or temporary power', hazard_es: PENDING_ES, controls: ['De-energize or guard live parts before working near them', 'GFCI-protect temporary cords and lights in the pit'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'moving_car', hazard: 'Caught between a moving car or counterweight and the shaft wall during adjustment and testing', hazard_es: PENDING_ES, controls: ['Only the mechanic runs the car; use inspection-speed operation from the car top', 'Agree on a clear signal and stand-clear zone before every test run'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 4, prov: osha('c') },
    { id: 'hot_work', hazard: 'Fire from welding or cutting at rail brackets and machine beams', hazard_es: PENDING_ES, controls: ['Clear or cover combustibles in the shaft and pit before welding', 'Keep a fire watch and an extinguisher at the work'], controls_es: PENDING_ES, osha_ref: '1926.352(a)', severity: 3, ppe: ['welding helmet', 'leather gloves'], prov: osha('j') },
  ],
  qa_checklist: [
    { id: 'layout_approved', item: 'Supplier layout drawing approved and on site; state conveyance approval (permit) issued before installation starts.', item_es: tr('Plano de distribución del proveedor aprobado y en obra; aprobación estatal del equipo (permiso) emitida antes de iniciar la instalación.'), prov: sps },
    { id: 'pit_depth_level', item: 'Pit depth and floor level match the layout; buffer pad and pit ladder locations as shown.', item_es: tr('Profundidad de la fosa y nivel del piso según el plano; ubicación de base de amortiguadores y escalera de fosa como se indica.'), prov: practice('Pit depth and clearances come from the approved layout, which SPS 318.1007 requires with the plan submittal.') },
    { id: 'pit_dry_sump', item: 'Pit waterproofed and dry; sump pit, drain or pump installed as the drawings show.', item_es: tr('Fosa impermeabilizada y seca; sumidero, drenaje o bomba instalados según los planos.'), prov: practice('Water in the pit is a common acceptance finding; sump/drain requirement per the adopted ASME A17.1 and the approved layout.') },
    { id: 'hoistway_plumb_size', item: 'Hoistway plumb and to layout width and depth top to bottom; rail bracket blocking or embeds at every bracket point.', item_es: tr('Cubo a plomo y con el ancho y fondo del plano de arriba a abajo; refuerzo o placas embebidas en cada punto de soporte de rieles.'), prov: practice('Rail installation tolerance depends on a plumb hoistway; bracket points come from the supplier layout.') },
    { id: 'shaft_clear', item: 'No pipes, ducts or wiring in the hoistway or machine space that do not serve the elevator.', item_es: tr('Sin tuberías, ductos ni cableado en el cubo o espacio de máquinas que no sirvan al elevador.'), prov: practice('Foreign equipment in hoistways and machine spaces is restricted by the adopted elevator code; verify with the inspector.') },
    { id: 'rated_enclosure', item: 'Hoistway enclosure, penetrations and door frames carry the fire-resistance rating shown on the plans.', item_es: tr('Cerramiento del cubo, penetraciones y marcos de puertas con la resistencia al fuego indicada en los planos.'), prov: icc },
    { id: 'power_disconnect', item: 'Dedicated, lockable elevator disconnect, car-light circuit and pit/machine-space light and receptacle in place before the mechanic starts.', item_es: tr('Desconectador dedicado y bloqueable del elevador, circuito de luz de cabina y luz y receptáculo en fosa y espacio de máquinas listos antes de que empiece el mecánico.'), prov: practice('Typical supplier pre-installation requirements; circuit details per the electrical plans and NEC Art. 620 (reference only).') },
    { id: 'rails_plumb', item: 'Guide rails plumb and gauged within the supplier tolerance; brackets fully fastened or welded.', item_es: tr('Rieles guía a plomo y calibrados dentro de la tolerancia del proveedor; soportes totalmente fijados o soldados.'), prov: practice('Installer’s rail alignment check; tolerance from the supplier installation manual.') },
    { id: 'running_clearances', item: 'Car-to-sill and door running clearances checked by the mechanic and recorded.', item_es: tr('Holguras de funcionamiento cabina–umbral y de puertas revisadas por el mecánico y registradas.'), prov: practice('Clearances per the adopted ASME A17.1; recorded on the acceptance test forms.') },
    { id: 'owner_turnover', item: 'Keys, maintenance control program, wiring diagrams and as-built layout handed to the owner; owner trained.', item_es: tr('Llaves, programa de control de mantenimiento, diagramas eléctricos y plano final entregados al propietario; propietario capacitado.'), prov: practice('Maintenance control program per the adopted ASME A17.1 (SPS 318.17086 adds state rules).') },
    { id: 'landing_guards', item: 'Every open landing has a full-width barricade or gate, closed whenever no one is working at it.', item_es: PENDING_ES, safety: true, prov: osha('m') },
    { id: 'door_interlocks', item: 'Hoistway door and gate interlocks keep the car from running with a door open, and doors cannot open without the car at the landing.', item_es: PENDING_ES, safety: true, prov: practice('Interlock function is an acceptance test item under the adopted ASME A17.1 / A18.1.') },
    { id: 'recall_interface', item: 'Fire alarm recall relays and sprinkler shunt trip wired to the controller per the approved sequence.', item_es: PENDING_ES, safety: true, prov: icc },
    { id: 'recall_tested', item: 'Phase I fire service recall and emergency communication tested and working at acceptance.', item_es: PENDING_ES, safety: true, prov: icc },
    { id: 'emergency_comm', item: 'Two-way emergency communication line in place and reaching a staffed location.', item_es: PENDING_ES, safety: true, prov: icc },
    { id: 'acceptance_passed', item: 'Acceptance inspection passed by a licensed elevator inspector and results recorded on the state forms; unit not used by the public before authorization.', item_es: PENDING_ES, safety: true, prov: sps },
    { id: 'permit_posted', item: 'Permit to operate and registration number posted where the state requires.', item_es: tr('Permiso de operación y número de registro colocados donde lo exige el estado.'), prov: sps },
  ],
  inspection_checklists: {
    foundation: [
      { item: 'Pit depth, sump and waterproofing match the approved elevator layout', item_es: PENDING_ES, ref: '3001' },
      { item: 'Pit open edges barricaded or covered', item_es: PENDING_ES },
    ],
    framing: [
      { item: 'Hoistway enclosure built to the fire-resistance rating on the plans', item_es: PENDING_ES, ref: '3002' },
      { item: 'Rail bracket blocking/embeds installed; no foreign piping or ducts in the shaft', item_es: PENDING_ES },
    ],
    final: [
      { item: 'State permit to operate issued (or written authorization) before occupancy depends on the elevator', item_es: PENDING_ES, ref: 'WI SPS 318.1011' },
      { item: 'Fire alarm recall and shunt trip verified with the fire alarm acceptance test', item_es: PENDING_ES, ref: '3003' },
    ],
    state_conveyance_acceptance: [
      { item: 'Conveyance approval (state permit) on file; installation matches the approved plans', item_es: PENDING_ES, ref: 'WI SPS 318.1007' },
      { item: 'Acceptance tests performed and witnessed by a licensed elevator inspector; results on state forms', item_es: PENDING_ES, ref: 'WI SPS 318.170810' },
      { item: 'Unit not placed in service until the state or agent municipality authorizes it', item_es: PENDING_ES, ref: 'WI SPS 318.170810' },
      { item: 'Registration number posted; permit to operate issued (not required for elevators serving a single dwelling unit)', item_es: PENDING_ES, ref: 'WI SPS 318.1011' },
    ],
  },
  assemblies: [
    { code: 'B-ELV-HYD-2STOP-EA', name: 'Hydraulic passenger elevator, 2-stop, 2,500 lb, installed (elevator subcontract allowance)', name_es: 'Elevador hidráulico de pasajeros, 2 paradas, 2,500 lb, instalado (asignación de subcontrato)', unit: 'EA', csi: '14 24 00',
      description: 'Elevator contractor scope only: jack, power unit, rails, car, doors, controller, testing. GC pit, hoistway, power and fire-alarm interface priced separately.',
      material_cost_cents: { v: 5_500_000, prov: est('Allowance for a 2-stop holeless/roped hydraulic passenger unit, national baseline 2026 — replace with the elevator quote') }, labor_hours_per_unit: { v: 240, prov: est('Two-person mechanic crew ≈3 weeks incl. adjusting and acceptance testing') },
      equipment_cost_cents: { v: 150_000, prov: est('Chain hoists, rail gauges, welder, forklift share') }, waste_pct: { v: 0, prov: est('engineered package — no waste') } },
    { code: 'B-ELV-MRL-STOP-EA', name: 'MRL traction elevator, per stop (machine-room-less, 3,500 lb class), installed', name_es: 'Elevador de tracción MRL, por parada (sin cuarto de máquinas, clase 3,500 lb), instalado', unit: 'EA', csi: '14 21 00',
      description: 'Per-stop allowance: multiply by the number of stops served. Covers machine, rails, car, doors, controller and testing.',
      material_cost_cents: { v: 3_000_000, prov: est('Per-stop allowance for a low/mid-rise MRL traction unit, national baseline 2026 — replace with the elevator quote') }, labor_hours_per_unit: { v: 110, prov: est('Mechanic crew hours per stop incl. adjusting share') },
      equipment_cost_cents: { v: 60_000, prov: est('Hoisting and rail setting tools share per stop') }, waste_pct: { v: 0, prov: est('engineered package') } },
    { code: 'B-ELV-RES-EA', name: 'Residential elevator, 2-stop, installed', name_es: 'Elevador residencial, 2 paradas, instalado', unit: 'EA', csi: '14 28 00',
      description: 'Private-residence elevator (cable/chain drive or hydraulic). Shaft framing and power by others.',
      material_cost_cents: { v: 2_800_000, prov: est('Allowance for a 2-stop private-residence elevator, national baseline 2026') }, labor_hours_per_unit: { v: 80, prov: est('Two-person crew ≈1 week incl. testing') },
      equipment_cost_cents: { v: 40_000, prov: est('Hoist and tools share') }, waste_pct: { v: 0, prov: est('engineered package') } },
    { code: 'B-ELV-VPL-EA', name: 'Vertical wheelchair platform lift, up to ~6 ft rise, installed', name_es: 'Plataforma elevadora vertical para sillas de ruedas, hasta ~6 pies de elevación, instalada', unit: 'EA', csi: '14 42 00',
      material_cost_cents: { v: 1_600_000, prov: est('Allowance for an enclosed-runway VPL with landing gate, national baseline 2026') }, labor_hours_per_unit: { v: 32, prov: est('Two-person crew ≈2 days incl. anchoring, wiring and testing') },
      equipment_cost_cents: { v: 15_000, prov: est('Tools and lifting aid share') }, waste_pct: { v: 0, prov: est('engineered package') } },
    { code: 'B-ELV-PIT-EA', name: 'Elevator pit prep by GC — sump pit, pit ladder, waterproofing, pit light + receptacle', name_es: 'Preparación de fosa del elevador por el GC — sumidero, escalera de fosa, impermeabilización, luz y receptáculo de fosa', unit: 'EA', csi: '14 20 00',
      description: 'GC items the elevator contractor excludes; pit concrete and excavation priced with the foundation.',
      material_cost_cents: { v: 250_000, prov: est('Sump liner, galvanized pit ladder, waterproofing, light/receptacle materials, 2026') }, labor_hours_per_unit: { v: 18, prov: est('Carpenter/laborer + electrician hours') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('membrane laps') } },
  ],
  quantity_rules: [
    { code: 'B-ELV-HYD-2STOP-EA', assumption: 'Elevator trade on the schedule of a commercial/multifamily project — assume one 2-stop hydraulic unit until the elevator quote and stop count are in', when: { building_types: ['commercial', 'residential_mf', 'industrial'] }, qty: { basis: 'const' } },
    { code: 'B-ELV-RES-EA', assumption: 'Elevator trade on a single-family project — assume one 2-stop residential elevator until confirmed', when: { building_types: ['residential_sf'] }, qty: { basis: 'const' } },
    { code: 'B-ELV-PIT-EA', assumption: 'One elevator pit prepared by the GC — remove if the unit needs no pit (some residential or platform lifts)', when: { building_types: ['commercial', 'residential_mf', 'industrial', 'residential_sf'] }, qty: { basis: 'const' } },
  ],
  dependency_hints: [
    { after_trades: ['framing', 'masonry', 'concrete'], before_phase: 'commissioning', note: 'Rails go in a finished, plumb hoistway; acceptance has to pass before commissioning/closeout and occupancy.' },
    { after_trades: ['fire_alarm', 'electrical'], before_phase: 'commissioning', note: 'Recall relays, shunt trip and the elevator disconnect must be live before the acceptance test.' },
  ],
});
