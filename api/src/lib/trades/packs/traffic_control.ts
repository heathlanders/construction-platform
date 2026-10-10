// Trade Knowledge Pack — traffic_control (Traffic Control / work-zone temporary traffic control).
// Wave 18, NEW-TRADE pattern: no hand recipe and no template tasks. permit_trade is null → no AHJ gates
// and no code_refs; the hold points (municipal right-of-way / street-use permit, TCP approval, the
// after-setup and daily device review, teardown) live in descriptive inspection_checklists keys.
// Section numbers are FHWA MUTCD 11th Edition (Dec 2023) Part 6 — note the 11th edition renumbered
// Part 6: tapers are 6B.08, flaggers are Chapter 6D, high-visibility apparel 6C.05, channelizing
// devices 6K, arrow boards 6L.06, typical applications Chapter 6P. Pavement striping is pavement_marking
// (G-STRIPE-*), never redeclared here.
// Dossier: docs/trade-packs/dossiers/traffic_control.md. Sources: MUTCD 11th ed. Part 6, WisDOT WMUTCD +
// Standard Spec 643 + Average Unit Price List, City of Madison right-of-way permits, 29 CFR 1926
// Subparts C, D, G, O.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const src = (id: string | string[], note?: string) => ({ src: Array.isArray(id) ? id : [id], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const mutcd = (note?: string) => src('asphalt_paving-mutcd-part6', note);
const ss643 = (note?: string) => src('traffic_control-wisdot-ss-643', note);
const osha = (sub: string, extra: string[] = []) => src([`ecfr-1926-${sub}`, ...extra]);
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const estAup = (note: string) => ({ src: ['platform-baseline', 'excavation-wisdot-aup'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'traffic_control',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Work-zone temporary traffic control: getting the street-use permit and traffic control plan approved, then setting, checking, maintaining and removing signs, cones, drums, arrow boards and flaggers so drivers, bikes and pedestrians pass the work safely (MUTCD Part 6).',
    summary_es: 'Control temporal de tráfico en zonas de trabajo: obtener el permiso de uso de la vía y la aprobación del plan de control de tráfico, y luego colocar, revisar, mantener y retirar señales, conos, tambos, tableros de flecha y banderilleros para que autos, bicicletas y peatones pasen la obra con seguridad (MUTCD Parte 6).',
    glossary: [
      { term: 'Traffic control plan (TCP)', term_es: 'Plan de control de tráfico (TCP)', def: 'Drawing or typical-application sheet showing every sign, device and flagger for the work zone; the road owner approves it before you occupy the road.', def_es: 'Plano u hoja de aplicación típica que muestra cada señal, dispositivo y banderillero de la zona de trabajo; el dueño de la vía lo aprueba antes de ocupar la calle.' },
      { term: 'Advance warning area', term_es: 'Área de advertencia previa', def: 'Stretch of road ahead of the work where the warning signs tell drivers what is coming; ROAD WORK AHEAD is the first sign they see.', def_es: 'Tramo antes de la obra donde las señales de advertencia avisan a los conductores lo que viene; ROAD WORK AHEAD (obras adelante) es la primera señal que ven.' },
      { term: 'Taper', term_es: 'Transición (taper)', def: 'Diagonal line of cones or drums that moves traffic out of the closed lane; its length depends on speed and lane width.', def_es: 'Línea diagonal de conos o tambos que saca el tráfico del carril cerrado; su largo depende de la velocidad y del ancho del carril.' },
      { term: 'Buffer space', term_es: 'Espacio de amortiguamiento', def: 'Empty area between the taper and the work that gives a runaway car room to stop; no workers, trucks or material in it.', def_es: 'Área vacía entre la transición y el trabajo que le da espacio para frenar a un auto fuera de control; sin trabajadores, camiones ni material.' },
      { term: 'Channelizing device', term_es: 'Dispositivo de canalización', def: 'Cone, tubular marker, drum, vertical panel or barricade used to guide traffic around the work.', def_es: 'Cono, poste tubular, tambo, panel vertical o barricada que guía el tráfico alrededor de la obra.' },
      { term: 'Arrow board', term_es: 'Tablero de flecha', def: 'Trailer- or truck-mounted lighted panel that flashes an arrow or chevron to tell drivers which way to merge.', def_es: 'Panel luminoso en remolque o camión que muestra una flecha o chevrón intermitente para indicar hacia dónde incorporarse.' },
      { term: 'Flagger', term_es: 'Banderillero', def: 'Trained worker who stops and releases traffic with a STOP/SLOW paddle, usually for one-lane, two-way traffic.', def_es: 'Trabajador capacitado que detiene y da paso al tráfico con una paleta STOP/SLOW (alto/despacio), normalmente en tráfico de un carril en dos sentidos.' },
      { term: 'Shadow vehicle / TMA', term_es: 'Vehículo de protección / atenuador (TMA)', def: 'Truck parked or driven behind the crew, often with a truck-mounted crash attenuator, to take a hit from an errant car.', def_es: 'Camión estacionado o en marcha detrás de la cuadrilla, a menudo con atenuador de impacto montado, para recibir el golpe de un auto fuera de control.' },
      { term: 'High-visibility safety apparel', term_es: 'Ropa de alta visibilidad', def: 'Fluorescent vest, shirt or jacket with reflective stripes; Class 2 or 3 in a work zone, Class 3 for flaggers at night.', def_es: 'Chaleco, camisa o chamarra fluorescente con franjas reflejantes; Clase 2 o 3 en zona de trabajo, Clase 3 para banderilleros de noche.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'lane_closure',
      example_title: 'Set up lane closure and work-zone traffic control',
      when: { title_re: '\\b(?:lane|shoulder|road|street|sidewalk)\\s+clos(?:ure|ed|ing)\\b|\\bwork[- ]zone\\b|\\btraffic\\s+control\\b|maintenance\\s+of\\s+traffic|\\bMOT\\b|\\bTTC\\b' },
      steps: [
        {
          title: 'Confirm the permit and traffic control plan',
          instruction: 'Before any device goes on the street, have the approved right-of-way / street-use permit and the approved traffic control plan (TCP) on the truck. Check the allowed hours, which lanes or sidewalk may close, and any detour or pedestrian route the plan requires. Walk or drive the site and confirm the plan still fits: driveways, bus stops, sight distance, speed limit.',
          detail: 'Changes in the field need the road owner\'s OK before you set them up. The TCP can be a project drawing or a standard typical application (MUTCD Chapter 6P) the owner accepts.',
          tools: ['approved TCP and permit', 'measuring wheel', 'phone/radio'],
          materials: [],
          safety_ids: ['passing_traffic', 'untrained_crew'],
          qa_ids: ['permit_tcp_on_site', 'ped_route_kept'],
        },
        {
          title: 'Load and check the devices before leaving the yard',
          instruction: 'Load the signs, stands, cones, drums, barricades, arrow board and lights the plan calls for, plus spares. Reject devices with dirty, torn or faded reflective sheeting, cracked bases or bent stands; drums with open tops or ballast on top; cones too short for the speed or for night work.',
          tools: ['device checklist'],
          materials: ['warning signs and stands per TCP', 'cones/drums/barricades per TCP', 'sandbag ballast', 'warning lights'],
          safety_ids: ['manual_lifting', 'untrained_crew'],
          qa_ids: ['device_condition', 'cone_drum_spec'],
        },
        {
          title: 'Place the advance warning signs, first sign farthest away',
          instruction: 'Park the truck on the shoulder with beacons on. Set the signs in the order drivers meet them, starting with ROAD WORK AHEAD farthest upstream, at the spacing on the plan. Face each sign squarely to traffic, clear of parked cars and trees, and cover or remove any permanent sign that conflicts with the work zone.',
          tools: ['truck with flashing beacons', 'measuring wheel'],
          materials: ['W20 series warning signs and stands', 'sign covers'],
          safety_ids: ['passing_traffic', 'setup_in_live_lane', 'work_truck_backing'],
          qa_ids: ['sign_sequence_spacing'],
        },
        {
          title: 'Set the taper, buffer and channelizing line',
          instruction: 'Working from the shoulder with traffic coming toward you, place the merging taper at the plan length, then the buffer, then the tangent devices along the work space. Keep device spacing at no more than the speed limit in feet on the taper and twice that on the tangent. Set the arrow board on the shoulder or in the closed lane at the start of the taper, and add the downstream taper where traffic returns.',
          detail: 'Taper length L (feet): speed 40 mph or less, L = W × S² ÷ 60; 45 mph or more, L = W × S (W = offset in feet, S = speed in mph). Merging taper at least L, shifting about L/2, shoulder about L/3.',
          tools: ['measuring wheel', 'truck with flashing beacons'],
          materials: ['cones or drums', 'arrow board', 'warning lights for night work'],
          safety_ids: ['setup_in_live_lane', 'passing_traffic', 'work_truck_backing'],
          qa_ids: ['taper_length', 'device_spacing', 'buffer_clear', 'arrow_board_use'],
        },
        {
          title: 'Drive through it, then check it every shift',
          instruction: 'Drive the zone from each approaching direction right after setup and fix anything a driver cannot read or follow. Re-check at the start of every shift, after storms or crashes, and at night if the zone stays up after dark. Reset knocked-over devices right away and log every check.',
          tools: ['inspection log', 'flashlight'],
          materials: ['spare cones/drums', 'replacement sheeting or signs'],
          safety_ids: ['passing_traffic', 'night_visibility'],
          qa_ids: ['daily_log', 'device_condition'],
        },
        {
          title: 'Remove the zone in reverse order',
          instruction: 'When the lane can reopen, clear workers, equipment and material from the road first. Pick up devices starting at the downstream end and work back toward the first sign, with the truck shadowing the crew. Uncover the permanent signs, remove any temporary markings, and tell the road owner the lane is open.',
          tools: ['truck with flashing beacons'],
          materials: [],
          safety_ids: ['setup_in_live_lane', 'work_truck_backing', 'manual_lifting'],
          qa_ids: ['teardown_complete'],
        },
      ],
    },
    {
      id: 'flagging_operation',
      example_title: 'Flagging operation — one-lane two-way traffic',
      priority: 10,
      when: { title_re: '\\bflagg(?:er|ers|ing)\\b|one[- ]lane,?\\s+two[- ]way|\\bpilot\\s+car\\b' },
      steps: [
        {
          title: 'Brief the flaggers and pick the stations',
          instruction: 'Use only trained flaggers. Agree on radio or hand signals between the two ends, who controls the release, and what to do if a driver will not stop. Choose each station where approaching drivers can see the flagger in time to stop, ahead of the work, with an escape route off the road.',
          tools: ['two-way radios', 'approved TCP'],
          materials: [],
          safety_ids: ['flagger_struck', 'untrained_crew'],
          qa_ids: ['flagger_trained', 'flagger_station'],
        },
        {
          title: 'Set the flagger signs and the one-lane taper',
          instruction: 'Place the advance warning signs, including the flagger symbol sign, ahead of each station per the plan. Close the lane with a short taper (50–100 ft, devices about 20 ft apart) and a matching downstream taper. Light each station if flagging continues after dark.',
          tools: ['measuring wheel', 'truck with flashing beacons'],
          materials: ['ROAD WORK AHEAD and flagger symbol signs', 'cones or drums', 'station lighting for night work'],
          safety_ids: ['setup_in_live_lane', 'night_visibility'],
          qa_ids: ['sign_sequence_spacing', 'taper_length'],
        },
        {
          title: 'Flag traffic with the STOP/SLOW paddle',
          instruction: 'Wear Class 2 or 3 apparel (Class 3 at night). Stand on the shoulder or in the closed lane, alone, facing traffic. To stop: STOP face toward traffic, arm out, free palm raised. To release: turn to SLOW and wave traffic on with the free hand. Step into the open lane only after traffic has stopped, and warn the crew of an out-of-control vehicle.',
          tools: ['STOP/SLOW paddle', 'two-way radio', 'air horn or whistle'],
          materials: [],
          safety_ids: ['flagger_struck', 'heat_stress', 'night_visibility'],
          qa_ids: ['flagger_apparel', 'paddle_signals'],
        },
        {
          title: 'Relieve flaggers and shut down the operation',
          instruction: 'Rotate or break flaggers so attention stays sharp, and hand off the paddle at the station without a gap in control. When work ends, release the last queue, remove the flagger signs (or cover them) so drivers are not told to expect a flagger who is not there, then remove the taper.',
          tools: ['two-way radio'],
          materials: [],
          safety_ids: ['flagger_struck', 'heat_stress'],
          qa_ids: ['teardown_complete'],
        },
      ],
    },
  ],
  hazards: [
    { id: 'passing_traffic', hazard: 'Struck by passing traffic that enters the work zone — distracted, speeding or impaired drivers, or a closure drivers cannot see in time', hazard_es: PENDING_ES, controls: ['Set every sign and device on the approved TCP before work starts; keep the buffer empty', 'Face traffic when you can and never turn your back to a live lane without a lookout', 'Use a shadow vehicle or barrier where the plan calls for one; keep vehicles and material out of the clear zone'], controls_es: PENDING_ES, osha_ref: '1926.200(g)(2)', severity: 4, ppe: ['high-visibility apparel Class 2 or 3', 'hard hat'], prov: osha('g', ['asphalt_paving-mutcd-part6']) },
    { id: 'setup_in_live_lane', hazard: 'Struck while placing or picking up cones, drums and signs next to moving traffic, before the zone protects anyone', hazard_es: PENDING_ES, controls: ['Set up and take down from the shoulder or behind the truck with beacons on, in the order the plan gives', 'Have a lookout watch approaching traffic during setup in a live lane', 'Never stand in the open lane to place a device; reach or move the truck'], controls_es: PENDING_ES, osha_ref: '1926.200(g)(1)', severity: 4, ppe: ['high-visibility apparel Class 2 or 3'], prov: osha('g', ['asphalt_paving-mutcd-part6']) },
    { id: 'flagger_struck', hazard: 'Flagger hit by a driver who does not stop, cannot see the flagger in time, or comes from an unexpected direction', hazard_es: PENDING_ES, controls: ['Use trained flaggers with a STOP/SLOW paddle per MUTCD Part 6 — never hand signals alone', 'Place stations where drivers can see and stop in time, with advance signs and an escape route', 'Flagger stands alone, away from equipment, and only enters the lane after traffic has stopped'], controls_es: PENDING_ES, osha_ref: '1926.201(a)', severity: 4, ppe: ['high-visibility apparel Class 2 (Class 3 at night)', 'hard hat'], prov: osha('g', ['asphalt_paving-mutcd-part6']) },
    { id: 'work_truck_backing', hazard: 'Run over by the traffic control truck or a work truck backing inside the closed lane', hazard_es: PENDING_ES, controls: ['Back only with a working reverse alarm or an observer signaling', 'Plan setups so trucks drive forward through the zone and backing is minimized'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(4)', severity: 4, ppe: ['high-visibility apparel'], prov: osha('o', ['asphalt_paving-mutcd-part6']) },
    { id: 'equipment_reverse', hazard: 'Struck by rollers, loaders or other earthmoving equipment reversing inside the work space next to the taper crew', hazard_es: PENDING_ES, controls: ['Machines run with working reverse alarms or a signal person', 'Separate walking crews from moving equipment in the activity area'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 3, ppe: ['high-visibility apparel'], prov: osha('o') },
    { id: 'night_visibility', hazard: 'Workers, flaggers and devices hard to see at night, in rain or fog, raising struck-by risk', hazard_es: PENDING_ES, controls: ['Light the work area and flagger stations; aim lights so they do not glare into drivers\' eyes', 'Use retroreflective devices (28 in. or taller cones at night) and warning lights where the plan calls for them', 'Wear Class 3 apparel at night'], controls_es: PENDING_ES, osha_ref: '1926.56(a)', severity: 3, ppe: ['Class 3 high-visibility apparel'], prov: osha('d', ['asphalt_paving-mutcd-part6']) },
    { id: 'unattended_equipment', hazard: 'Drivers striking an arrow board, trailer or truck left beside the road overnight without lights or reflectors', hazard_es: PENDING_ES, controls: ['Mark unattended equipment near a live road with lights, reflectors or lighted barricades', 'Move stored devices and trailers off the shoulder when not in use'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(1)', severity: 3, prov: osha('o', ['traffic_control-wisdot-ss-643']) },
    { id: 'untrained_crew', hazard: 'Wrong or missing devices because the person setting up or supervising the zone is not trained in TTC', hazard_es: PENDING_ES, controls: ['Train every worker to recognize work-zone hazards; assign a trained person to own the zone and halt work until it is fixed', 'Brief the crew on the TCP and their role before setup'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: osha('c', ['asphalt_paving-mutcd-part6']) },
    { id: 'heat_stress', hazard: 'Heat illness for flaggers and setup crews standing on hot pavement in full sun for hours', hazard_es: PENDING_ES, controls: ['Keep cool drinking water at each station and rotate flaggers to shade', 'Build up new workers gradually; watch for confusion, cramps or stopped sweating and call 911 for heat stroke'], controls_es: PENDING_ES, osha_ref: '1926.51(a)(1)', severity: 3, prov: osha('d') },
    { id: 'manual_lifting', hazard: 'Back strain and pinched fingers lifting sign stands, drums, sandbags and arrow-board hitches on and off the truck', hazard_es: PENDING_ES, controls: ['Lift with two people or use a truck with a lift gate or device racks', 'Keep fingers clear of folding stands and trailer couplers; wear gloves'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, ppe: ['work gloves'], prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'permit_tcp_on_site', item: 'Approved right-of-way / street-use permit and approved traffic control plan on site before any device is set; work kept within the permitted hours and lanes.', item_es: PENDING_ES, safety: true, prov: src(['traffic_control-madison-row-permits', 'asphalt_paving-mutcd-part6'], 'MUTCD 6B.01 — TTC plan approved by the road owner; local permit') },
    { id: 'ped_route_kept', item: 'Closed sidewalks have an accessible, signed detour or protected walkway the TCP shows; pedestrians are never pushed into the live lane.', item_es: PENDING_ES, safety: true, prov: mutcd('MUTCD 6B.01 ¶11, 6C.02–6C.03') },
    { id: 'sign_sequence_spacing', item: 'ROAD WORK AHEAD is the first sign drivers see; signs at the TCP spacing (MUTCD Table 6B-1 minimums run from 100 ft on low-speed urban streets to 500 ft on rural roads); each sign legible and facing traffic.', item_es: PENDING_ES, safety: true, prov: mutcd('MUTCD 6H.02, Table 6B-1') },
    { id: 'taper_length', item: 'Merging taper at least L (L = W × S² ÷ 60 at 40 mph or less; L = W × S at 45 mph or more); shifting taper about L/2; one-lane two-way and downstream tapers 50–100 ft.', item_es: PENDING_ES, safety: true, prov: mutcd('MUTCD 6B.08, Tables 6B-3 and 6B-4') },
    { id: 'device_spacing', item: 'Channelizing devices no farther apart in feet than the speed limit (mph) on the taper and twice the speed limit on the tangent.', item_es: PENDING_ES, safety: true, prov: mutcd('MUTCD 6K.01 ¶4') },
    { id: 'buffer_clear', item: 'No work, parked vehicles, equipment or stored material inside the buffer space.', item_es: PENDING_ES, safety: true, prov: mutcd('MUTCD 6B.06 ¶7') },
    { id: 'cone_drum_spec', item: 'Cones at least 18 in. for daytime low-speed work and 28 in. at night or on high-speed roads, with white reflective bands; drums at least 36 in. tall, closed tops, no ballast on top.', item_es: tr('Conos de al menos 18 pulg para trabajo de día a baja velocidad y 28 pulg de noche o en vías rápidas, con franjas blancas reflejantes; tambos de al menos 36 pulg de alto, tapa cerrada y sin lastre encima.'), prov: mutcd('MUTCD 6K.03, 6K.06') },
    { id: 'device_condition', item: 'Signs and devices clean, legible and retroreflective; devices with torn or faded sheeting or broken bases replaced (no worse than the ATSSA "marginal" level on WisDOT work).', item_es: tr('Señales y dispositivos limpios, legibles y reflejantes; se reemplazan los que tengan lámina rota o descolorida o base dañada (nunca peor que el nivel "marginal" de ATSSA en obras de WisDOT).'), prov: src(['asphalt_paving-mutcd-part6', 'traffic_control-wisdot-ss-643'], 'MUTCD 6F.03, 6K.01 ¶14–15; WisDOT 643.3.1(6)') },
    { id: 'arrow_board_use', item: 'Arrow board (when used) on the shoulder or in the closed lane at the taper, delineated, in arrow or chevron mode for a lane closure, dimmed at night, and removed or shielded when not in use.', item_es: tr('Tablero de flecha (si se usa) en el acotamiento o en el carril cerrado al inicio de la transición, delimitado, en modo flecha o chevrón para cierre de carril, atenuado de noche y retirado o protegido cuando no se usa.'), prov: src(['asphalt_paving-mutcd-part6', 'traffic_control-wisdot-ss-643'], 'MUTCD 6L.06; WisDOT 643.3.3') },
    { id: 'daily_log', item: 'Zone driven from every approach right after setup, then checked and logged at the start of each shift and at night when it stays up after dark; damaged or knocked-over devices restored promptly (WisDOT: within 2 hours).', item_es: PENDING_ES, safety: true, prov: src(['asphalt_paving-mutcd-part6', 'traffic_control-wisdot-ss-643'], 'MUTCD 6A.02 D; WisDOT 643.3.1(5), (8)') },
    { id: 'flagger_trained', item: 'Every flagger trained in flagging and public contact and able to show they can stop traffic, signal clearly and react to danger.', item_es: PENDING_ES, safety: true, prov: osha('g', ['asphalt_paving-mutcd-part6']) },
    { id: 'flagger_station', item: 'Each flagger station preceded by advance warning signs, placed where drivers have room to stop, with an escape route, and lit at night.', item_es: PENDING_ES, safety: true, prov: mutcd('MUTCD 6D.06') },
    { id: 'flagger_apparel', item: 'All workers in the zone in Class 2 or 3 high-visibility apparel; flaggers in Class 3 at night.', item_es: PENDING_ES, safety: true, prov: mutcd('MUTCD 6C.05 — ANSI/ISEA 107 performance classes (reference only)') },
    { id: 'paddle_signals', item: 'Flaggers use the STOP/SLOW paddle (or flag/AFAD) with the MUTCD stop, proceed and slow motions; no hand-only signals.', item_es: PENDING_ES, safety: true, prov: mutcd('MUTCD 6D.05') },
    { id: 'teardown_complete', item: 'All temporary devices removed when the lane reopens and from the project when not needed for 14 days; temporary markings not left more than 14 days after final surface; road owner told the lane is open.', item_es: tr('Todos los dispositivos temporales se retiran al reabrir el carril y de la obra cuando no se necesiten por 14 días; las marcas temporales no quedan más de 14 días después de la superficie final; se avisa al dueño de la vía que el carril está abierto.'), prov: src(['traffic_control-wisdot-ss-643', 'asphalt_paving-mutcd-part6'], 'WisDOT 643.3.1(1), 643.3.8; MUTCD 6J.02 ¶2') },
  ],
  inspection_checklists: {
    row_street_use_permit: [
      { item: 'Right-of-way / street-use permit issued by the municipality or road owner for the dates and lanes being closed', item_es: tr('Permiso de uso de la vía o del derecho de vía emitido por el municipio o dueño de la vía para las fechas y carriles a cerrar'), ref: 'local permit' },
      { item: 'Contractor prequalified or licensed for right-of-way work where the city requires it', item_es: tr('Contratista precalificado o con licencia para trabajar en el derecho de vía donde la ciudad lo exige') },
      { item: 'Allowed work hours, peak-hour restrictions and notification requirements noted on the crew sheet', item_es: tr('Horario permitido, restricciones en horas pico y avisos requeridos anotados en la hoja de la cuadrilla') },
      { item: 'One-call (811) ticket in place if any sign post or device base is driven or dug in', item_es: PENDING_ES },
    ],
    tcp_approval: [
      { item: 'TCP prepared by a person trained in TTC and approved by the road owner', item_es: tr('TCP preparado por una persona capacitada en control temporal de tráfico y aprobado por el dueño de la vía'), ref: 'MUTCD 6B.01' },
      { item: 'Plan shows sign sequence and spacing, taper lengths, device type and spacing, buffer, arrow board and flagger stations', item_es: tr('El plano muestra secuencia y espaciamiento de señales, largo de transiciones, tipo y espaciamiento de dispositivos, amortiguamiento, tablero de flecha y puestos de banderilleros'), ref: 'MUTCD 6B.08, 6K.01' },
      { item: 'Pedestrian, bicycle, transit stop and driveway access maintained or detoured', item_es: tr('Acceso de peatones, bicicletas, paradas de transporte y entradas de auto mantenido o con desvío'), ref: 'MUTCD 6B.01, 6C.02' },
      { item: 'Night work: lighting, Class 3 apparel and retroreflective/lighted devices on the plan', item_es: PENDING_ES, ref: 'MUTCD 6A.05, 6C.05' },
    ],
    daily_device_inspection: [
      { item: 'Zone reviewed from the approaching-traffic direction right after setup and at the start of each shift', item_es: PENDING_ES, ref: 'WisDOT 643.3.1(5)' },
      { item: 'Every device on the TCP present, upright, in position and spaced correctly', item_es: tr('Cada dispositivo del TCP presente, de pie, en su lugar y con el espaciamiento correcto') },
      { item: 'Signs clean, legible, retroreflective and not blocked by parked cars, trees or equipment', item_es: tr('Señales limpias, legibles, reflejantes y sin obstrucción por autos estacionados, árboles o equipo'), ref: 'MUTCD 6F.03' },
      { item: 'Arrow board and warning lights working; arrow board dimmed at night', item_es: tr('Tablero de flecha y luces de advertencia funcionando; tablero atenuado de noche'), ref: 'WisDOT 643.3.3' },
      { item: 'Buffer space empty; no material or vehicles in the clear zone', item_es: PENDING_ES, ref: 'MUTCD 6B.06' },
      { item: 'Night check done when the zone stays up after dark', item_es: tr('Revisión nocturna hecha cuando la zona queda puesta después de oscurecer'), ref: 'MUTCD 6A.02' },
      { item: 'Deficiencies, time found and time fixed written in the log', item_es: tr('Deficiencias, hora en que se encontraron y hora en que se corrigieron anotadas en la bitácora') },
    ],
    teardown_restoration: [
      { item: 'Workers, equipment and material off the road before devices come down', item_es: PENDING_ES },
      { item: 'Devices removed downstream end first, working back to the first sign', item_es: tr('Dispositivos retirados empezando por el extremo final, de regreso hacia la primera señal') },
      { item: 'Permanent signs uncovered; temporary markings removed; sign-base holes repaired', item_es: tr('Señales permanentes destapadas; marcas temporales retiradas; hoyos de bases de señales reparados'), ref: 'WisDOT 643.3.4' },
      { item: 'Road owner or permit office notified that the lane or sidewalk is open', item_es: tr('Se avisó al dueño de la vía u oficina de permisos que el carril o la banqueta está abierto') },
    ],
  },
  assemblies: [
    { code: 'G-TC-FLAGGER-HR', name: 'Certified flagger with paddle, radio and Class 2/3 apparel, per hour', name_es: 'Banderillero certificado con paleta, radio y ropa Clase 2/3, por hora', unit: 'HR', csi: '01 55 26',
      material_cost_cents: { v: 0, prov: est('no material') },
      labor_hours_per_unit: { v: 1, prov: est('one flagger-hour; set the estimate labor rate to a flagger/laborer burdened rate') },
      equipment_cost_cents: { v: 100, prov: est('paddle, radio, apparel and air horn wear per hour') },
      waste_pct: { v: 0, prov: est('labor item') } },
    { code: 'G-TC-SIGN-PKG-DAY', name: 'Advance warning sign package — three signs on portable stands with flags, per day', name_es: 'Paquete de señales de advertencia previa — tres señales en bases portátiles con banderas, por día', unit: 'DAY', csi: '01 55 26',
      material_cost_cents: { v: 0, prov: est('rented or owned devices — carried as equipment') },
      labor_hours_per_unit: { v: 0, prov: est('placement carried in G-TC-LANE-CLOSE-EA') },
      equipment_cost_cents: { v: 2400, prov: estAup('short-term rental ≈$8 per sign-day; WisDOT 643.0900 Traffic Control Signs averages only $0.35–0.46 per sign-day on long state contracts (FY2023–25), so small jobs run far higher') },
      waste_pct: { v: 0, prov: est('rental item') } },
    { code: 'G-TC-ARROW-DAY', name: 'Arrow board, trailer-mounted (solar), per day', name_es: 'Tablero de flecha en remolque (solar), por día', unit: 'DAY', csi: '01 55 26',
      material_cost_cents: { v: 0, prov: est('rental item') },
      labor_hours_per_unit: { v: 0, prov: est('placement carried in G-TC-LANE-CLOSE-EA') },
      equipment_cost_cents: { v: 7500, prov: estAup('short-term rental ≈$60–100/day; WisDOT 643.0800 Traffic Control Arrow Boards averages $9.58–10.48/day on long state contracts (FY2023–25) as the floor') },
      waste_pct: { v: 0, prov: est('rental item') } },
    { code: 'G-TC-DEVICE-DAY', name: 'Channelizing device (drum, 42 in. cone or Type II/III barricade) with ballast, each per day', name_es: 'Dispositivo de canalización (tambo, cono de 42 pulg o barricada tipo II/III) con lastre, cada uno por día', unit: 'DAY', csi: '01 55 26',
      material_cost_cents: { v: 0, prov: est('rental item') },
      labor_hours_per_unit: { v: 0, prov: est('placement carried in G-TC-LANE-CLOSE-EA') },
      equipment_cost_cents: { v: 125, prov: estAup('short-term rental ≈$1–1.50 per device-day; WisDOT 643.0300 Drums $0.19–0.24 and 643.1070 42-in. Cones $0.16–0.20 per day on long state contracts (FY2023–25)') },
      waste_pct: { v: 2, prov: est('devices damaged or lost in the zone') } },
    { code: 'G-TC-LANE-CLOSE-EA', name: 'Lane or shoulder closure — set up, daily review and remove, two-person crew with beacon truck, each', name_es: 'Cierre de carril o acotamiento — colocación, revisión diaria y retiro, cuadrilla de dos con camión con torreta, cada uno', unit: 'EA', csi: '01 55 26',
      material_cost_cents: { v: 0, prov: est('devices priced per day in G-TC-SIGN-PKG-DAY / G-TC-DEVICE-DAY / G-TC-ARROW-DAY') },
      labor_hours_per_unit: { v: 4, prov: est('≈1 h setup + 1 h removal × 2 workers for a short urban closure; longer tapers and high-speed roads take more') },
      equipment_cost_cents: { v: 8000, prov: est('traffic control truck with beacons/arrow and haul of devices, half-day share, 2026') },
      waste_pct: { v: 0, prov: est('labor/equipment item') } },
    { code: 'G-TC-TCP-EA', name: 'Traffic control plan — site-specific drawing or typical-application package, prepared and submitted for approval, each', name_es: 'Plan de control de tráfico — plano o paquete de aplicación típica, entregado para aprobación, cada uno', unit: 'EA', csi: '01 55 26',
      material_cost_cents: { v: 45000, prov: est('subcontracted TCP drafting/submittal fee for a single-location urban closure; multi-phase or highway plans cost several times more') },
      labor_hours_per_unit: { v: 1, prov: est('foreman review, permit application and coordination') },
      equipment_cost_cents: { v: 0, prov: est('none') },
      waste_pct: { v: 0, prov: est('service item') } },
  ],
  quantity_rules: [
    { code: 'G-TC-TCP-EA', assumption: 'One traffic control plan for a street or driveway-apron closure on a multifamily, commercial or industrial site — delete if the work stays on private property', when: { building_types: ['residential_mf', 'commercial', 'industrial'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'G-TC-LANE-CLOSE-EA', assumption: 'Two lane or shoulder closures (utility connections and apron/curb work) — set to the number of separate closures in the schedule', when: { building_types: ['residential_mf', 'commercial', 'industrial'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'G-TC-SIGN-PKG-DAY', assumption: 'One advance warning sign package per closure for ≈5 working days total — set to the actual closure days', when: { building_types: ['residential_mf', 'commercial', 'industrial'] }, qty: { basis: 'const', mul: 5 } },
    { code: 'G-TC-DEVICE-DAY', assumption: '≈20 drums/cones for a short urban taper + tangent over ≈5 days (100 device-days) — recount from the TCP', when: { building_types: ['residential_mf', 'commercial', 'industrial'] }, qty: { basis: 'const', mul: 100 } },
    { code: 'G-TC-FLAGGER-HR', assumption: 'Two flaggers × 8 h for one day of one-lane, two-way work (e.g. a utility tie-in) — delete if no flagging is needed', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 16 } },
  ],
  dependency_hints: [
    { before_phase: 'sitework', note: 'Permit, approved traffic control plan and the zone set up before utility connections, aprons, curb or paving work in or next to the public road.' },
  ],
});
