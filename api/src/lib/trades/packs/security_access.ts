// Trade Knowledge Pack — security_access (Security / Access Control / CCTV / intrusion). Wave 12 —
// NEW-TRADE pattern (no hand recipe; without this pack the family electrical recipes render power-wiring
// steps). Structured cabling (data drops, media panel, cert testing) is the low_voltage pack — not here.
// Dossier: docs/trade-packs/dossiers/security_access.md. Sources: UFGS 28 10 05 + 28 08 10 (public
// domain), IBC 1010.2 + NFPA 101 7.2.1.6 + NFPA 70 Art. 725/722 + UL 294/681 (reference only),
// 29 CFR 1926 (C, E, I, K, L, M, X, Z).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['security_access-ufgs-28-10-05'], confidence: 'verified' as const, last_verified: D };
const sat = { src: ['security_access-ufgs-28-08-10'], confidence: 'verified' as const, last_verified: D };
const nec = { src: ['nfpa-fa'], confidence: 'verified' as const, last_verified: D };
const egress = { src: ['icc-pa', 'nfpa-fa', 'security_access-ul-294'], confidence: 'verified' as const, last_verified: D, note: 'IBC 1010.2 door-operation subsections (hardware release, sensor release, delayed egress) renumber between editions — cite the adopted edition.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'security_access',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs electronic security: card or keypad access control on doors (readers, request-to-exit, door contacts, electrified locks), intrusion alarm panels and sensors, and CCTV cameras with a video recorder. Coordinates locks with the door hardware installer so exits always open, then programs, tests and trains the owner. Data cabling and fire alarm belong to their own trades.',
    summary_es: 'Instala seguridad electrónica: control de acceso en puertas (lectores, salida REX, contactos, cerraduras eléctricas), alarmas contra intrusos y cámaras CCTV con grabador. Coordina las cerraduras con el instalador de herrajes para que las salidas siempre abran; luego programa, prueba y capacita al dueño. Cableado de datos y alarma contra incendio son de otros oficios.',
    glossary: [
      { term: 'Access control panel (controller)', term_es: 'Panel de control de acceso (controlador)', def: 'Box that decides who gets in: reads the credential, checks the schedule and unlocks the door.', def_es: 'Caja que decide quién entra: lee la credencial, revisa el horario y desbloquea la puerta.' },
      { term: 'Request-to-exit (REX)', term_es: 'Solicitud de salida (REX)', def: 'Motion sensor or push button on the inside that tells the system someone is leaving so it does not alarm.', def_es: 'Sensor de movimiento o botón en el lado interior que avisa al sistema que alguien sale, para que no suene la alarma.' },
      { term: 'Door position switch (door contact)', term_es: 'Interruptor de posición de puerta (contacto)', def: 'Magnet switch in the frame that reports the door open, closed, forced or held open.', def_es: 'Interruptor magnético en el marco que reporta la puerta abierta, cerrada, forzada o retenida abierta.' },
      { term: 'Fail-safe / fail-secure', term_es: 'Falla segura (abre) / falla asegurada (cierra)', def: 'What an electric lock does when power is lost: fail-safe unlocks, fail-secure stays locked from outside.', def_es: 'Lo que hace una cerradura eléctrica sin energía: falla segura desbloquea, falla asegurada sigue cerrada desde afuera.' },
      { term: 'Electric strike', term_es: 'Contrachapa eléctrica', def: 'Frame-mounted keeper that releases the latch when powered or unpowered, depending on type.', def_es: 'Contrachapa en el marco que libera el pestillo al recibir o perder energía, según el tipo.' },
      { term: 'Magnetic lock (maglock)', term_es: 'Cerradura magnética', def: 'Electromagnet on the frame holding a steel plate on the door; it releases the instant power is cut.', def_es: 'Electroimán en el marco que sujeta una placa de acero en la puerta; suelta en cuanto se corta la energía.' },
      { term: 'Delayed egress', term_es: 'Salida retardada', def: 'Listed lock that holds the door a short, code-limited time with an alarm and sign before it releases.', def_es: 'Cerradura aprobada que retiene la puerta un tiempo corto, limitado por código, con alarma y letrero antes de soltar.' },
      { term: 'NVR (network video recorder)', term_es: 'NVR (grabador de video en red)', def: 'Recorder that stores the video from IP cameras and lets the owner view it live or play it back.', def_es: 'Grabador que almacena el video de las cámaras IP y permite verlo en vivo o reproducirlo.' },
      { term: 'End-of-line resistor (EOL)', term_es: 'Resistencia de fin de línea (EOL)', def: 'Resistor at the last device on a zone so the panel can tell a cut or shorted wire from a normal state.', def_es: 'Resistencia en el último dispositivo de una zona para que el panel distinga un cable cortado o en corto del estado normal.' },
    ],
  },
  est_bucket: 'electrical',
  recipes: [
    {
      id: 'security_rough_in',
      example_title: 'Data, CCTV & access control rough-in',
      when: { title_re: 'cctv|camera|surveillance|video|access control|card reader|security|intrusion|burglar|electrified (lock|hardware)|mag ?lock' },
      steps: [
        {
          title: 'Lay out devices and coordinate door hardware',
          instruction: 'Walk the security drawings: mark every reader, keypad, request-to-exit, door contact, motion sensor, camera and panel location. For each controlled door, agree with the door hardware installer which electric lock it gets, whether it fails safe or secure, and where the power transfer hinge or raceway runs through the frame. Every exit door must still open from inside with one motion — free egress with the power off, during a fire alarm and with the system down.',
          detail: 'Sensor-release, delayed-egress and maglock doors are special locking arrangements; confirm the fire alarm tie-in and the code section for the edition the AHJ uses before ordering hardware.',
          tools: ['tape measure', 'marker', 'door hardware schedule', 'security drawings'],
          materials: ['device back boxes or low-voltage brackets', 'frame and door preps per the hardware schedule'],
          safety_ids: ['ladder', 'egress_lock_in'],
          qa_ids: ['egress_free', 'lock_fail_mode'],
          code_refs: [
            { section: '1010.2', code_type: 'IBC', note: 'Door operation: hardware release, sensor release and delayed egress locking arrangements' },
            { section: '7.2.1.6', code_type: 'NFPA 101', note: 'Special locking arrangements — delayed-egress and sensor-release electrical locks' },
          ],
        },
        {
          title: 'Set boxes, pathways and frame preps',
          instruction: 'Set back boxes at reader, keypad and REX heights and at camera and panel locations. Run conduit or bore pathways from each door to its controller. Use bushed conduit ends; no conductor may be exposed outside a device or box. Sleeve every fire-rated wall or floor crossing. Outside, set camera poles on their foundations and drive the ground rod before the pole goes up.',
          tools: ['drill with auger bits', 'rotary hammer', 'conduit bender', 'stepladder'],
          materials: ['EMT or flexible conduit', 'insulated bushings', 'sleeves at rated penetrations', 'camera pole base and ground rod where shown'],
          safety_ids: ['ladder', 'power_tool', 'silica', 'eye_cut', 'electrical_contact', 'fall_edge'],
          qa_ids: ['conduit_bushed', 'firestop_rated'],
          code_refs: [{ section: '300.21', note: 'Firestop openings through fire-rated walls and floors' }],
        },
        {
          title: 'Pull device and composite cable',
          instruction: 'Pull a home run from each door, sensor and camera to its controller, panel or switch. Use cable listed for the space (plenum above air-handling ceilings). Keep Class 2 security wiring out of power boxes and raceways. Do not splice coax or camera cable. Label both ends with the door or device ID and leave a service loop at each device and panel.',
          tools: ['fish tape or glow rods', 'pull string', 'label maker'],
          materials: ['composite access control cable (reader, lock, REX, contact)', 'alarm cable', 'Cat6 or coax to cameras', 'cable straps rated for low-voltage'],
          safety_ids: ['ladder', 'attic_heat', 'aerial_lift', 'electrical_contact'],
          qa_ids: ['cable_listed_space', 'separation_power', 'labeled_both_ends'],
          gating_inspection_type: 'rough_in',
          code_refs: [
            { section: 'Art. 725', note: 'Class 2 and Class 3 power-limited circuits — separation from power wiring' },
            { section: 'Art. 722', note: 'Power-limited cable listing and use by space (2023 NEC; earlier editions in Art. 725)' },
          ],
        },
        {
          title: 'Firestop and walk the rough-in',
          instruction: 'Seal every rated penetration with a listed firestop system that matches the sleeve and cable fill. Walk every door and device against the drawings — box set, cable in, labeled — before the electrical rough-in inspection and before drywall covers the frames.',
          tools: ['caulk gun', 'flashlight', 'device schedule'],
          materials: ['listed firestop sealant or putty', 'firestop identification labels'],
          safety_ids: ['chem', 'ladder'],
          qa_ids: ['firestop_rated', 'labeled_both_ends'],
          gating_inspection_type: 'cover',
        },
      ],
    },
    {
      id: 'security_trim_commissioning',
      example_title: 'Access control & CCTV trim-out, programming and acceptance test',
      priority: 10,
      when: { title_re: 'trim|program|commission|acceptance|\\btest(ing)?\\b|activat|turn ?over|training' },
      steps: [
        {
          title: 'Mount controllers, power supplies and batteries',
          instruction: 'Mount controllers, intrusion panel and lock power supplies in their enclosures; enter enclosures from the bottom where possible. Have the electrician land the dedicated 120 V circuit, locked out and tagged until you are ready. Bond enclosures, fit standby batteries sized by the battery calculation, and check output voltage at the power supply before any lock is connected.',
          tools: ['drill/driver', 'level', 'multimeter', 'torque screwdriver'],
          materials: ['access controller and enclosure', 'lock power supply with battery backup', 'sealed standby batteries', 'surge protection where shown'],
          safety_ids: ['lockout_tag', 'electrical_contact', 'power_tool'],
          qa_ids: ['bonding_surge', 'battery_calc'],
        },
        {
          title: 'Terminate locks, readers, sensors and cameras',
          instruction: 'Connect readers, REX devices, door contacts and electric locks with the end-of-line resistors the panel needs and a surge suppressor across each lock coil if the lock lacks one. Mount sensors and aim them away from heat sources and moving equipment. Mount cameras plumb on solid backing, seal exterior housings, and add surge protection on exterior camera runs.',
          tools: ['screwdriver set', 'wire strippers', 'multimeter', 'camera setup laptop or monitor'],
          materials: ['end-of-line resistors', 'lock surge suppressors (MOV or diode)', 'weatherproof camera housings and mounts', 'outdoor-rated sealant'],
          safety_ids: ['ladder', 'aerial_lift', 'fall_edge'],
          qa_ids: ['eol_supervision', 'camera_mount_seal'],
        },
        {
          title: 'Program the system and aim cameras',
          instruction: 'Load doors, schedules, access groups and users from the owner\'s list; set door-held and forced alarms. Program intrusion zones and the monitoring communicator. Aim and focus each camera, set recording and retention to the storage calculation, and change every default password.',
          tools: ['programming laptop', 'monitor or tablet for camera aiming'],
          materials: ['owner door/user list', 'video storage calculation'],
          safety_ids: ['ladder', 'aerial_lift'],
          qa_ids: ['camera_view_day_night', 'defaults_changed'],
        },
        {
          title: 'Test every door, egress path and camera',
          instruction: 'Test every device against a written test log: valid and invalid credential, REX, forced and held door, tamper, and every intrusion zone. On every locked exit, prove free egress with the system powered, with power cut and during a fire alarm signal. Check each camera view in daylight and at night. Fix, re-test and log the cause of every failure.',
          tools: ['test log', 'test credentials', 'flashlight', 'two-way radios'],
          materials: ['test log sheets'],
          safety_ids: ['egress_lock_in'],
          qa_ids: ['egress_free', 'fire_alarm_release', 'functional_test_log', 'camera_view_day_night'],
          gating_inspection_type: 'final',
          code_refs: [
            { section: '1010.2', code_type: 'IBC', note: 'Electric locks release on power loss and fire alarm; listed hardware' },
            { section: '7.2.1.6', code_type: 'NFPA 101', note: 'Delayed-egress and sensor-release locking conditions and signage' },
          ],
        },
        {
          title: 'Train the owner and hand over',
          instruction: 'Train the owner\'s administrators and operators on adding users, viewing alarms and playing back video. Turn over as-built drawings with door and device IDs, the programming backup, passwords in a sealed envelope, battery and storage calculations, test logs and warranty information.',
          tools: ['programming laptop'],
          materials: ['as-built drawings', 'O&M manuals', 'programming backup'],
          safety_ids: [],
          qa_ids: ['turnover_docs'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    rough_in: [
      { section: 'Art. 725', note: 'Class 2 and Class 3 power-limited circuits (readers, sensors, lock circuits)', prov: nec },
      { section: 'Art. 722', note: 'Power-limited cable listing and use by space (2023 NEC reorganization)', prov: nec },
      { section: '300.21', note: 'Firestop penetrations of fire-rated assemblies', prov: nec },
      { section: '1010.2', code_type: 'IBC', note: 'Door operation and special locking arrangements on egress doors', prov: egress },
    ],
    final: [
      { section: '1010.2', code_type: 'IBC', note: 'Electric locks: listed, release on power loss and fire alarm, one-motion egress', prov: egress },
      { section: '7.2.1.6', code_type: 'NFPA 101', note: 'Special locking arrangements — delayed egress and sensor release', prov: egress },
      { section: 'Art. 725', note: 'Power-limited circuit sources and wiring complete and separated', prov: nec },
    ],
  },
  equipment: [
    { when: { title_re: 'cctv|camera|surveillance|security', building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'boom_lift', reason: 'Reach exterior cameras on upper walls, soffits and poles', optional: true },
    { when: { title_re: 'cctv|camera|access control|security', building_types: ['commercial', 'industrial'] }, type: 'scissor_lift', reason: 'Run pathways and mount ceiling cameras and sensors in high open ceilings', optional: true },
  ],
  hazards: [
    { id: 'ladder', hazard: 'Fall from a stepladder while mounting cameras, sensors and readers', hazard_es: PENDING_ES, controls: ['Never stand on the top or top step of a stepladder', 'Use a nonconductive (fiberglass) ladder near electrical work', 'Fully open and lock the spreaders on firm, level footing'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'fall_edge', hazard: 'Fall from roof edges, parapets or floor openings while mounting exterior cameras or routing cable', hazard_es: PENDING_ES, controls: ['Guardrails, covers or personal fall arrest where the drop is 6 ft or more', 'Keep floor-opening covers in place after pulling through'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness when required'], prov: osha('m') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from a boom lift basket at exterior camera and pole locations', hazard_es: PENDING_ES, controls: ['Wear a harness and lanyard tied to the boom or basket', 'Stand on the basket floor — never on the rails'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'electrical_contact', hazard: 'Shock from live power wiring in shared walls and frames, or drilling into hidden circuits', hazard_es: PENDING_ES, controls: ['Keep out of energized power boxes and panels; have the electrician de-energize and verify', 'Scan walls and frames before drilling in occupied buildings', 'Never route security cable through power boxes'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'lockout_tag', hazard: 'Shock when the 120 V feed to a power supply or controller is energized while you work in the enclosure', hazard_es: PENDING_ES, controls: ['Have the circuit de-energized, made inoperative and tagged at the panel before opening the enclosure', 'Verify dead with a tester before touching the input terminals'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'cord_shock', hazard: 'Shock from damaged extension cords and tools on temporary power', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Inspect cords daily and remove damaged ones'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'egress_lock_in', hazard: 'Workers or occupants trapped behind a door locked by new or partly programmed electric hardware', hazard_es: PENDING_ES, controls: ['Never leave an egress door locked against exit while the system is being installed or tested', 'Prove free egress from inside on every controlled door before leaving it powered', 'Keep a person and a radio at the door during lock and fire-alarm release tests'], controls_es: PENDING_ES, osha_ref: '1926.34(a)', severity: 4, prov: osha('c') },
    { id: 'attic_heat', hazard: 'Heat illness and missteps in hot attics and above-ceiling spaces', hazard_es: PENDING_ES, controls: ['Work attics early in the day; take water and set short work periods', 'Walk only on joists or boards — never on the ceiling drywall'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: osha('c') },
    { id: 'silica', hazard: 'Silica dust from drilling or coring concrete and block for conduit, poles and anchors', hazard_es: PENDING_ES, controls: ['Use a drill shroud with a HEPA vacuum or water to control dust', 'No dry sweeping or compressed air on silica dust'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 3, ppe: ['respirator when required'], prov: osha('z') },
    { id: 'power_tool', hazard: 'Kickback and cuts from drills, hole saws and frame-prep tools', hazard_es: PENDING_ES, controls: ['Use the side handle on large bits and hole saws', 'Keep guards in place and brace for bind-up'], controls_es: PENDING_ES, osha_ref: '1926.300(b)', severity: 2, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'eye_cut', hazard: 'Eye injuries and cuts from drilling debris, metal frames and cable edges', hazard_es: PENDING_ES, controls: ['Wear safety glasses when drilling overhead or into frames', 'Wear cut-resistant gloves around metal frames and sheet metal'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['safety glasses', 'cut-resistant gloves'], prov: osha('e') },
    { id: 'chem', hazard: 'Skin and breathing irritation from firestop sealants and housing sealants', hazard_es: PENDING_ES, controls: ['Read the SDS and ventilate', 'Wear gloves when applying firestop'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves'], prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'egress_free', item: 'Every controlled exit door opens from the inside with one motion — with the system on, with power cut, and with the system offline. No key, card or special knowledge needed to leave.', item_es: PENDING_ES, safety: true, prov: egress },
    { id: 'fire_alarm_release', item: 'Where the building has a fire alarm, it unlocks every electrically locked egress door it is required to release, and the doors stay unlocked until the alarm is reset.', item_es: PENDING_ES, safety: true, prov: egress },
    { id: 'lock_fail_mode', item: 'Each lock\'s fail-safe or fail-secure mode matches the hardware schedule and the egress plan agreed with the AHJ; lock hardware listed per the code.', item_es: PENDING_ES, safety: true, prov: { src: ['security_access-ufgs-28-10-05', 'icc-pa', 'security_access-ul-294'], confidence: 'verified', last_verified: D } },
    { id: 'conduit_bushed', item: 'Conduit and armored cable ends terminate in the device box with insulated bushings; no conductor exposed outside a device or box.', item_es: tr('Los extremos de tubo y cable armado terminan en la caja del dispositivo con bujes aislados; ningún conductor expuesto fuera de un dispositivo o caja.'), prov: ufgs },
    { id: 'cable_listed_space', item: 'Cable listing mark suits the space: plenum above air-handling ceilings, riser in vertical shafts.', item_es: PENDING_ES, safety: true, prov: nec },
    { id: 'separation_power', item: 'Class 2 security wiring kept out of power boxes and raceways unless a listed barrier separates it.', item_es: PENDING_ES, safety: true, prov: nec },
    { id: 'labeled_both_ends', item: 'Every cable labeled at both ends with the door or device ID shown on the drawings; service loop left at each device and panel.', item_es: tr('Cada cable etiquetado en ambos extremos con el número de puerta o dispositivo del plano; bucle de servicio en cada dispositivo y panel.'), prov: ufgs },
    { id: 'firestop_rated', item: 'Every penetration of a fire-rated wall, floor or ceiling sealed with a listed firestop system that matches the sleeve and cable fill.', item_es: PENDING_ES, safety: true, prov: { src: ['nfpa-fa', 'security_access-ufgs-28-10-05'], confidence: 'verified', last_verified: D } },
    { id: 'bonding_surge', item: 'Enclosures and camera poles bonded and grounded; surge protection installed on exterior camera runs and field boxes.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'battery_calc', item: 'Standby batteries match the battery-capacity calculation; power supply output voltage checked before locks were connected.', item_es: tr('Las baterías de respaldo coinciden con el cálculo de capacidad; voltaje de salida de la fuente revisado antes de conectar las cerraduras.'), prov: ufgs },
    { id: 'eol_supervision', item: 'End-of-line resistors installed where the panel requires them, so a cut or shorted wire reports as trouble, not normal; tamper switches reporting.', item_es: tr('Resistencias de fin de línea instaladas donde el panel las requiere, para que un cable cortado o en corto se reporte como falla y no como normal; interruptores de sabotaje reportando.'), prov: ufgs },
    { id: 'camera_mount_seal', item: 'Cameras mounted plumb on solid backing; exterior housings and entries sealed against water; coax and camera cable unspliced.', item_es: tr('Cámaras montadas a plomo sobre respaldo firme; carcasas exteriores y entradas selladas contra el agua; coaxial y cable de cámara sin empalmes.'), prov: ufgs },
    { id: 'camera_view_day_night', item: 'Each camera\'s field of view, focus and recording checked in daylight and at night against the owner\'s coverage list.', item_es: tr('Campo de visión, enfoque y grabación de cada cámara revisados de día y de noche contra la lista de cobertura del dueño.'), prov: sat },
    { id: 'defaults_changed', item: 'Every default password on controllers, cameras and the recorder changed; credentials handed to the owner.', item_es: tr('Todas las contraseñas de fábrica de controladores, cámaras y grabador cambiadas; credenciales entregadas al dueño.'), prov: { src: ['security_access-ufgs-28-10-05'], confidence: 'derived', last_verified: D, note: 'From the UFGS software/cybersecurity coordination note; common manufacturer guidance.' } },
    { id: 'functional_test_log', item: 'Every reader, REX, door contact, lock, sensor and zone tested against a written log; each failure recorded with cause, fix and re-test.', item_es: tr('Cada lector, REX, contacto de puerta, cerradura, sensor y zona probado contra un registro escrito; cada falla anotada con causa, corrección y nueva prueba.'), prov: sat },
    { id: 'turnover_docs', item: 'As-built drawings with door/device IDs, programming backup, battery and storage calculations, test logs and training record delivered.', item_es: tr('Entregados planos finales con números de puerta/dispositivo, respaldo de programación, cálculos de batería y almacenamiento, registros de prueba y constancia de capacitación.'), prov: ufgs },
  ],
  inspection_checklists: {
    rough_in: [
      { item: 'Cable listing suits each space; security wiring separated from power', item_es: PENDING_ES, ref: 'NEC Art. 725' },
      { item: 'Rated penetrations sealed with a listed firestop system', item_es: PENDING_ES, ref: 'NEC 300.21' },
      { item: 'Frame preps and power transfer paths match the door hardware schedule', item_es: tr('Preparaciones de marco y pasos de energía coinciden con el plan de herrajes') },
    ],
    cover: [
      { item: 'Device boxes and cable in place and labeled at every door before drywall', item_es: tr('Cajas de dispositivo y cable en su lugar y etiquetados en cada puerta antes del tablaroca') },
    ],
    final: [
      { item: 'Free one-motion egress on every locked exit with power on, power off and system offline', item_es: PENDING_ES, ref: 'IBC 1010.2' },
      { item: 'Fire alarm releases required electric locks; delayed-egress signage and alarm in place', item_es: PENDING_ES, ref: 'NFPA 101 7.2.1.6' },
      { item: 'Power supplies on dedicated circuits, enclosures bonded, batteries installed', item_es: PENDING_ES },
      { item: 'Acceptance test log complete; as-builts and training delivered', item_es: tr('Registro de prueba de aceptación completo; planos finales y capacitación entregados') },
    ],
  },
  assemblies: [
    { code: 'E-SEC-DOOR', name: 'Access-controlled door (reader, REX, door contact, electric strike, composite cable)', name_es: 'Puerta con control de acceso (lector, REX, contacto de puerta, contrachapa eléctrica, cable compuesto)', unit: 'EA', csi: '28 13 00',
      description: 'Per door: proximity reader, REX motion sensor, door contact, electric strike and ~150 ft composite cable. Electrified locksets, maglocks and power transfer hinges by the door hardware supplier are extra.',
      material_cost_cents: { v: 110000, prov: est('reader + REX + contact + electric strike + ~150 ft composite cable, national baseline 2026') }, labor_hours_per_unit: { v: 8, prov: est('box, pull, frame prep coordination, terminate, test one door') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; lifts are separate lines') }, waste_pct: { v: 3, prov: est('cable cut-offs') } },
    { code: 'E-SEC-CONTROLLER', name: 'Access control panel (2–4 door) with lock power supply and battery backup', name_es: 'Panel de control de acceso (2–4 puertas) con fuente para cerraduras y batería de respaldo', unit: 'EA', csi: '28 13 00',
      description: 'Controller, enclosure, 12/24 VDC lock power supply, standby batteries. The 120 V feed is the electrician\'s scope; software licenses excluded.',
      material_cost_cents: { v: 180000, prov: est('2–4 door controller + enclosure + power supply + batteries, national baseline 2026') }, labor_hours_per_unit: { v: 6, prov: est('mount, wire, power up, initial programming') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('equipment item') } },
    { code: 'E-SEC-INTRUSION-PANEL', name: 'Intrusion alarm panel with keypad, siren and cellular communicator', name_es: 'Panel de alarma contra intrusos con teclado, sirena y comunicador celular', unit: 'EA', csi: '28 16 00',
      material_cost_cents: { v: 60000, prov: est('hardwired panel + keypad + interior siren + cellular communicator + battery, national baseline 2026') }, labor_hours_per_unit: { v: 6, prov: est('mount, wire keypad and siren, program zones and monitoring') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('equipment item') } },
    { code: 'E-SEC-SENSOR', name: 'Intrusion sensor point (door/window contact or motion detector, wired)', name_es: 'Punto de sensor de intrusión (contacto de puerta/ventana o detector de movimiento, cableado)', unit: 'EA', csi: '28 16 00',
      material_cost_cents: { v: 4500, prov: est('contact or PIR detector + ~60 ft alarm cable, national baseline 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('pull, mount, terminate, walk-test') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('cable cut-offs') } },
    { code: 'E-SEC-NVR', name: 'Network video recorder (16-channel, PoE, storage)', name_es: 'Grabador de video en red (16 canales, PoE, almacenamiento)', unit: 'EA', csi: '28 23 00',
      description: 'Recorder with PoE ports and hard drives sized to the retention calculation; cameras are E-SEC-CAMERA.',
      material_cost_cents: { v: 250000, prov: est('16-channel PoE NVR + surveillance drives, national baseline 2026') }, labor_hours_per_unit: { v: 4, prov: est('rack or shelf mount, connect, configure recording and remote view') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('equipment item') } },
  ],
  quantity_rules: [
    { code: 'E-SEC-CONTROLLER', assumption: 'One access control panel (2–4 doors) — confirm door count on the security drawings', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const' } },
    { code: 'E-SEC-DOOR', assumption: '≈15% of scheduled doors are card-controlled (exterior and secure rooms) — confirm on the security drawings', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'doors', mul: 0.15, round: 'ceil' } },
    { code: 'E-SEC-NVR', assumption: 'One video recorder for the camera system', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const' } },
    { code: 'E-SEC-CAMERA', assumption: '≈1 camera per 5,000 SF of scheduled room area (existing catalog assembly) — replace with the owner\'s coverage list', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.0002, round: 'ceil' } },
    { code: 'E-SEC-INTRUSION-PANEL', assumption: 'One alarm panel per home', when: { building_types: ['residential_sf'] }, qty: { basis: 'const' } },
    { code: 'E-SEC-SENSOR', assumption: 'Typical home: 6 door/window contacts + 2 motion detectors — confirm with the owner', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 8 } },
  ],
  dependency_hints: [
    { after_trades: ['framing'], before_phase: 'drywall', note: 'Security rough-in runs with electrical and low-voltage rough-in, after framing and frames are set, before drywall closes the walls.' },
    { after_trades: ['doors_hardware', 'fire_alarm'], note: 'Lock termination and egress testing follow door hardware install and need the fire alarm release in place.' },
  ],
});
