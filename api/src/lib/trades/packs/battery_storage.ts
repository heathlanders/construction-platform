// Trade Knowledge Pack — battery_storage (Battery Energy Storage (ESS)). Wave 12 — NEW-TRADE pattern
// (no hand recipe, no template tasks; without this pack the family electrical recipes render generic
// branch-circuit steps). Dossier: docs/trade-packs/dossiers/battery_storage.md. Sources: DOE/PNNL/Sandia
// ESS compliance guide + plan-review checklist (public), manufacturer installation instructions
// (Tesla, Enphase), IRC R328 / IFC 1207 / NFPA 855 / UL 9540 / NFPA 70 Arts. 480, 705, 706
// (reference only), 29 CFR 1926 (C, E, F, I, K incl. 1926.441, X, Z).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const nec = { src: ['nfpa-fa'], confidence: 'verified' as const, last_verified: D };
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const n855 = { src: ['battery_storage-nfpa-855'], confidence: 'verified' as const, last_verified: D };
const doe = { src: ['battery_storage-doe-compliance-guide', 'battery_storage-osti-plan-review'], confidence: 'derived' as const, last_verified: D, note: 'Paraphrased from the DOE/PNNL/Sandia documentation-and-validation approach for ESS.' };
const mfr = { src: ['battery_storage-tesla-library', 'battery_storage-enphase-iqb5-qig'], confidence: 'derived' as const, last_verified: D, note: 'Common to the published installation instructions — follow the instructions for the unit installed.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'battery_storage',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs listed battery energy storage systems (ESS) — home batteries with a backup gateway and backup-loads panel, and small commercial battery cabinets — then wires, labels, commissions and hands them over, checking siting, vehicle protection, disconnects and working space. PV, service upgrades and generators are other trades.',
    summary_es: 'Instala sistemas de almacenamiento en baterías (ESS) aprobados — baterías residenciales con gateway de respaldo y tablero de cargas respaldadas, y gabinetes comerciales pequeños — y los cablea, etiqueta, pone en marcha y entrega, revisando ubicación, protección contra vehículos y desconectadores. Solar, acometida y generadores son otros oficios.',
    glossary: [
      { term: 'Energy storage system (ESS)', term_es: 'Sistema de almacenamiento de energía (ESS)', def: 'Battery plus its inverter and controls, listed as one system, that stores power and gives it back.', def_es: 'Batería con su inversor y controles, aprobada como un solo sistema, que guarda energía y la devuelve.' },
      { term: 'Backup gateway', term_es: 'Gateway de respaldo', def: 'Box at the service that senses an outage, isolates the house from the grid and lets the battery run the loads.', def_es: 'Caja junto a la acometida que detecta el apagón, aísla la casa de la red y deja que la batería alimente las cargas.' },
      { term: 'Backup (critical) loads panel', term_es: 'Tablero de cargas críticas', def: 'Subpanel holding only the circuits the battery keeps powered during an outage.', def_es: 'Subtablero con solo los circuitos que la batería mantiene encendidos durante un apagón.' },
      { term: 'Islanding', term_es: 'Operación en isla', def: 'The house running on battery power while cut off from the utility grid.', def_es: 'La casa funcionando con la batería mientras está separada de la red eléctrica.' },
      { term: 'Commissioning', term_es: 'Puesta en marcha', def: 'Setting up, testing and registering the system in the maker\'s app before handing it over.', def_es: 'Configurar, probar y registrar el sistema en la aplicación del fabricante antes de entregarlo.' },
      { term: 'Thermal runaway', term_es: 'Fuga térmica', def: 'A damaged or faulty cell overheating and spreading heat to the next cells — can lead to fire or toxic gas.', def_es: 'Una celda dañada o defectuosa se sobrecalienta y pasa el calor a las siguientes — puede causar incendio o gas tóxico.' },
      { term: 'Impact protection', term_es: 'Protección contra impacto', def: 'Bollards or a barrier that keep a car from hitting a battery in a garage or driveway.', def_es: 'Bolardos o barrera que impiden que un auto golpee una batería en un garaje o entrada.' },
      { term: 'Nameplate kWh', term_es: 'kWh de placa', def: 'Energy rating printed on the unit; codes limit how many kWh can go in each kind of space.', def_es: 'Capacidad de energía impresa en la unidad; los códigos limitan cuántos kWh caben en cada tipo de espacio.' },
      { term: 'Permission to operate (PTO)', term_es: 'Permiso para operar (PTO)', def: 'Utility approval to run a grid-connected system after the inspection.', def_es: 'Aprobación de la compañía eléctrica para operar un sistema conectado a la red después de la inspección.' },
    ],
  },
  est_bucket: 'electrical',
  recipes: [
    {
      id: 'ess_install',
      example_title: 'Install battery energy storage system (ESS) and backup gateway',
      when: { title_re: 'battery|\\bESS\\b|energy storage|powerwall' },
      steps: [
        {
          title: 'Confirm the unit, its listing and the location',
          instruction: 'Check the approved plans against the delivered unit: model, listing label for the complete system, nameplate kWh and how many units go in each space. Mark the spot: an allowed location (garage, utility room, basement or outside wall), never a bedroom or a closet that opens into one, away from doors and windows when outside, and with the clear space in front the maker requires. Check the "energize by" date on the box.',
          detail: 'Residential ESS siting is set by the adopted residential code (or the fire code for larger and commercial systems); count kWh per space before you mount anything.',
          tools: ['tape measure', 'level', 'stud finder'],
          materials: ['approved plans and spec sheet', 'manufacturer installation manual'],
          safety_ids: ['heavy_lift'],
          qa_ids: ['listed_system', 'location_allowed', 'kwh_per_space', 'clearance_front'],
          code_refs: [
            { section: 'R328.2', code_type: 'IRC', note: 'ESS listed and labeled as a complete system' },
            { section: 'R328.4', code_type: 'IRC', note: 'Allowed ESS locations; never in or opening into sleeping rooms' },
            { section: '1207', code_type: 'IFC', note: 'Electrical energy storage systems — larger and commercial installs' },
            { section: '855', code_type: 'NFPA', note: 'Stationary ESS installation standard referenced by the fire code' },
          ],
        },
        {
          title: 'Mount the battery and protect it from vehicles',
          instruction: 'Fasten the bracket into blocked studs or masonry, or set the floor stand on a level pad, with the fastener size and count the instructions call for. Lift the unit with two people or a lift, hang it, and lock it to the bracket. If it sits where a car could hit it — in the parking path of a garage or beside a driveway — install bollards or a listed barrier before the unit goes live.',
          detail: 'Coring or drilling concrete for a floor stand or bollards raises silica dust; use a shroud with a vacuum or water.',
          tools: ['drill/driver', 'rotary hammer', 'torque wrench', 'level', 'battery lift or dolly'],
          materials: ['wall bracket or floor stand', 'lag screws or anchors per manual', 'bollards or barrier where exposed to vehicles'],
          safety_ids: ['heavy_lift', 'silica', 'eye_flying', 'power_tool', 'ladder'],
          qa_ids: ['mount_structure', 'impact_protection'],
          code_refs: [{ section: 'R328.8', code_type: 'IRC', note: 'Vehicle impact protection for ESS in a garage driving path' }],
        },
        {
          title: 'Wire the battery, gateway and backup-loads panel',
          instruction: 'With the main breaker off and locked, set the backup gateway at the service and the backup-loads panel. Move the circuits the owner chose into the backup panel. Run the battery circuit with the conductor size and breaker on the maker\'s diagram, connect communication wiring between battery and gateway, and bond every enclosure. Keep the battery\'s own switch OFF — the battery is live inside even when every breaker is open.',
          detail: 'Make the utility-side connection the plans show (load-side breaker or supply-side tap) and keep working space clear in front of every panel and disconnect.',
          tools: ['insulated hand tools', 'voltage tester', 'torque screwdriver', 'wire stripper', 'lockout kit'],
          materials: ['backup gateway / automatic disconnect', 'backup-loads subpanel', 'copper conductors rated per manual', 'raceway and fittings', 'communication cable'],
          safety_ids: ['live_dc', 'loto', 'arc_flash', 'cord_shock'],
          qa_ids: ['circuits_moved', 'torque_marked', 'disconnect_accessible', 'working_space'],
          gating_inspection_type: 'rough_in',
          code_refs: [
            { section: '706', note: 'Energy storage systems' },
            { section: '706.15', note: 'ESS disconnecting means — location, control and marking' },
            { section: '705.12', note: 'Load-side source connections at the panel' },
            { section: '480', note: 'Storage batteries' },
          ],
        },
        {
          title: 'Label the system and add fire detection',
          instruction: 'Put the maker\'s and code-required placards on the service, gateway, backup panel and every disconnect: what is backed up, where the ESS disconnect is, and how to shut the system down. Confirm the room or garage with the battery has a smoke alarm, or a listed heat alarm tied into the smoke alarms where a smoke alarm cannot go.',
          tools: ['label maker', 'drill/driver'],
          materials: ['engraved or UV-rated placards', 'directory labels', 'listed heat alarm where required'],
          safety_ids: ['ladder'],
          qa_ids: ['placards', 'fire_detection'],
          code_refs: [{ section: 'R328.7', code_type: 'IRC', note: 'Smoke or interconnected heat alarm where the ESS is installed' }],
        },
        {
          title: 'Commission, test backup and hand over',
          instruction: 'Turn on the battery switch and commission it in the maker\'s app: firmware, grid profile, backup reserve and the owner\'s account. Pull the main (or simulate an outage) and confirm the backup loads stay on and the house isolates from the grid, then restore. Give the owner the shutdown steps and manual, and send the utility notification or interconnection paperwork the plans call for. Do not leave the system exporting before the utility says it can.',
          tools: ['phone or tablet with installer app', 'clamp meter', 'voltage tester'],
          materials: ['owner manual and shutdown sheet', 'commissioning report'],
          safety_ids: ['live_dc', 'arc_flash'],
          qa_ids: ['backup_test', 'commissioning_record', 'utility_notified'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '706.7', note: 'ESS commissioning and maintenance' }, { section: '110.26', note: 'Working space about electrical equipment' }],
        },
      ],
    },
  ],
  code_refs: {
    rough_in: [
      { section: '706', note: 'Energy storage systems', prov: nec },
      { section: '706.15', note: 'ESS disconnecting means — location, control and marking', prov: nec },
      { section: '480', note: 'Storage batteries', prov: nec },
      { section: 'R328.4', code_type: 'IRC', note: 'Allowed ESS locations in dwellings', prov: icc },
      { section: 'R328.8', code_type: 'IRC', note: 'Impact protection where vehicles can strike the ESS', prov: icc },
      { section: '1207', code_type: 'IFC', note: 'Electrical energy storage systems', prov: icc },
      { section: '855', code_type: 'NFPA', note: 'Installation of stationary energy storage systems', prov: n855 },
    ],
    service: [
      { section: '705.12', note: 'Load-side source connections', prov: nec },
      { section: '705', note: 'Interconnected electric power production sources', prov: nec },
    ],
    final: [
      { section: '706.7', note: 'ESS commissioning and maintenance', prov: nec },
      { section: '110.26', note: 'Working space about electrical equipment', prov: nec },
      { section: 'R328.2', code_type: 'IRC', note: 'ESS listed and labeled as a complete system', prov: icc },
      { section: 'R328.7', code_type: 'IRC', note: 'Fire detection where ESS is installed', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: 'battery|\\bESS\\b|energy storage|BESS', building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'forklift', reason: 'Set heavy commercial battery cabinets on their pads', optional: true },
  ],
  hazards: [
    { id: 'live_dc', hazard: 'Shock from battery terminals and DC wiring that stay energized even with every breaker open', hazard_es: PENDING_ES, controls: ['Treat the battery and its DC wiring as live at all times', 'Keep the unit\'s own switch off until commissioning and test before touching', 'Use insulated tools and never open a battery enclosure the maker seals'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, ppe: ['voltage-rated gloves', 'safety glasses'], prov: osha('k') },
    { id: 'loto', hazard: 'Unexpected re-energizing of the service, gateway or backup panel while wiring', hazard_es: PENDING_ES, controls: ['Open, lock and tag the main and every source — utility, battery, PV — before working', 'Verify dead with a tested meter at the point of work'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'arc_flash', hazard: 'Arc flash or burns when landing conductors in an energized service or gateway', hazard_es: PENDING_ES, controls: ['Work de-energized; if the utility side cannot be killed, keep clear of it and protect it from contact', 'Keep metal jewelry off and tools insulated'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(3)', severity: 4, ppe: ['arc-rated clothing when required', 'face shield'], prov: osha('k') },
    { id: 'thermal_fire', hazard: 'Fire or toxic gas from a damaged, dropped or overheating battery module', hazard_es: PENDING_ES, controls: ['Inspect units on delivery; quarantine any dented, swollen or wet unit and call the maker', 'Keep a fire extinguisher at the work area and know the shutdown steps', 'Evacuate and call the fire department for smoke, hissing or heat from a battery'], controls_es: PENDING_ES, osha_ref: '1926.150(a)(1)', severity: 4, prov: osha('f') },
    { id: 'electrolyte', hazard: 'Chemical burns from electrolyte in a damaged or vented battery', hazard_es: PENDING_ES, controls: ['Provide face shield, apron and rubber gloves when handling batteries that can leak', 'Have eyewash or drench water within 25 ft of battery handling'], controls_es: PENDING_ES, osha_ref: '1926.441(a)(5)', severity: 3, ppe: ['face shield', 'rubber gloves', 'apron'], prov: osha('k') },
    { id: 'battery_gas', hazard: 'Explosive gas build-up from vented (flooded lead-acid) batteries', hazard_es: PENDING_ES, controls: ['Ventilate battery rooms and enclosures so gas cannot collect', 'No open flame or sparks near vented batteries'], controls_es: PENDING_ES, osha_ref: '1926.441(a)(2)', severity: 3, prov: osha('k') },
    { id: 'heavy_lift', hazard: 'Back strain or crush injury lifting a battery that can weigh well over 100 lb', hazard_es: PENDING_ES, controls: ['Two-person lift or a battery lift/dolly; never lift alone', 'Plan the path and keep feet clear when hanging the unit on its bracket'], controls_es: PENDING_ES, osha_ref: '1926.20(b)', severity: 3, ppe: ['safety-toe boots'], prov: osha('c') },
    { id: 'silica', hazard: 'Silica dust from drilling or coring concrete for floor stands and bollards', hazard_es: PENDING_ES, controls: ['Use a drill shroud with a HEPA vacuum or water', 'No dry sweeping or compressed air on the dust'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 3, ppe: ['respirator when required'], prov: osha('z') },
    { id: 'ladder', hazard: 'Ladder fall while mounting gateways and running raceway high on a wall', hazard_es: PENDING_ES, controls: ['Use a nonconductive ladder on firm, level footing', 'Keep three points of contact'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'cord_shock', hazard: 'Shock from damaged cords and tools on temporary power', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Inspect cords daily and remove damaged ones'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'eye_flying', hazard: 'Eye injury from drilling debris and wire clippings', hazard_es: PENDING_ES, controls: ['Wear safety glasses while drilling, cutting and terminating'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'power_tool', hazard: 'Kickback and cuts from rotary hammers and drills', hazard_es: PENDING_ES, controls: ['Use the side handle and brace for bind-up', 'Keep guards in place'], controls_es: PENDING_ES, osha_ref: '1926.300(b)', severity: 2, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
  ],
  qa_checklist: [
    { id: 'listed_system', item: 'Battery, inverter and gateway carry the listing label for the complete ESS and match the model on the approved plans.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'battery_storage-ul-9540'], confidence: 'verified', last_verified: D } },
    { id: 'location_allowed', item: 'Unit sits in an allowed location — not in or opening into a sleeping room, and clear of doors and windows when on an outside wall.', item_es: PENDING_ES, safety: true, prov: icc },
    { id: 'kwh_per_space', item: 'Total nameplate kWh in each room, garage or outside wall is within what the adopted code and plans allow.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'battery_storage-nfpa-855'], confidence: 'verified', last_verified: D } },
    { id: 'clearance_front', item: 'Clear space in front of the unit and its disconnect meets the maker\'s instructions and the electrical working-space rule.', item_es: tr('El espacio libre frente a la unidad y su desconectador cumple las instrucciones del fabricante y la regla de espacio de trabajo eléctrico.'), prov: mfr },
    { id: 'mount_structure', item: 'Bracket or stand fastened into blocked studs, masonry or a level pad with the fastener size and count the manual lists; unit locked to the bracket.', item_es: tr('Soporte o base fijado a montantes bloqueados, mampostería o losa nivelada con el tamaño y número de sujetadores del manual; unidad trabada al soporte.'), prov: mfr },
    { id: 'impact_protection', item: 'Any unit in a garage driving path or beside a driveway has bollards or a listed barrier installed before it is energized.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'battery_storage-enphase-iqb5-qig'], confidence: 'verified', last_verified: D } },
    { id: 'circuits_moved', item: 'Only the owner-selected circuits are in the backup-loads panel and the panel directory matches them.', item_es: tr('Solo los circuitos elegidos por el propietario están en el tablero de cargas respaldadas y el directorio del tablero coincide.'), prov: mfr },
    { id: 'torque_marked', item: 'Every battery, gateway and panel termination torqued to the maker\'s value and marked.', item_es: tr('Cada terminal de la batería, gateway y tablero apretada al torque del fabricante y marcada.'), prov: mfr },
    { id: 'disconnect_accessible', item: 'ESS disconnect is readily accessible (or remotely controlled where the plans allow) and its location is marked at the service.', item_es: PENDING_ES, safety: true, prov: nec },
    { id: 'working_space', item: 'Working space in front of the service, gateway and backup panel kept clear — no battery or storage blocking it.', item_es: tr('El espacio de trabajo frente a la acometida, el gateway y el tablero de respaldo queda libre — sin batería ni objetos que lo bloqueen.'), prov: nec },
    { id: 'placards', item: 'Shutdown, disconnect-location and backed-up-loads placards installed at the service, gateway, backup panel and each disconnect.', item_es: PENDING_ES, safety: true, prov: { src: ['nfpa-fa', 'battery_storage-osti-plan-review'], confidence: 'verified', last_verified: D } },
    { id: 'fire_detection', item: 'Room or garage with the ESS has a working smoke alarm, or a listed heat alarm interconnected with the smoke alarms where a smoke alarm cannot go.', item_es: PENDING_ES, safety: true, prov: icc },
    { id: 'backup_test', item: 'Simulated outage: the house isolates from the grid, backup loads stay powered, and normal operation returns when the main is restored.', item_es: tr('Apagón simulado: la casa se aísla de la red, las cargas respaldadas siguen encendidas y todo vuelve a la normalidad al restablecer el principal.'), prov: mfr },
    { id: 'commissioning_record', item: 'Commissioning report saved with firmware version, grid profile, backup reserve and serial numbers, and handed to the owner with the shutdown steps and manual.', item_es: tr('Reporte de puesta en marcha guardado con versión de firmware, perfil de red, reserva de respaldo y números de serie, y entregado al propietario con los pasos de apagado y el manual.'), prov: doe },
    { id: 'utility_notified', item: 'Utility notification or interconnection paperwork sent; export not enabled before the utility allows it.', item_es: tr('Notificación o trámite de interconexión enviado a la compañía eléctrica; no se habilita la exportación antes de su permiso.'), prov: doe },
  ],
  inspection_checklists: {
    rough_in: [
      { item: 'Listed ESS model and kWh match the approved plans', item_es: PENDING_ES, ref: 'R328.2' },
      { item: 'Location allowed; not in or opening into a sleeping room', item_es: PENDING_ES, ref: 'R328.4' },
      { item: 'Impact protection in place where a vehicle could strike the unit', item_es: PENDING_ES, ref: 'R328.8' },
      { item: 'Conductors, overcurrent devices and raceway per the maker\'s diagram; enclosures bonded', item_es: PENDING_ES, ref: '706' },
    ],
    service: [
      { item: 'Utility connection made as the plans show (load-side breaker or supply-side tap)', item_es: PENDING_ES, ref: '705.12' },
      { item: 'Backup gateway / transfer equipment listed and installed per instructions', item_es: PENDING_ES },
    ],
    final: [
      { item: 'ESS disconnect readily accessible and its location marked at the service', item_es: PENDING_ES, ref: '706.15' },
      { item: 'Shutdown and backed-up-loads placards installed', item_es: PENDING_ES },
      { item: 'Smoke or interconnected heat alarm in the ESS room or garage', item_es: PENDING_ES, ref: 'R328.7' },
      { item: 'Working space clear in front of all equipment; commissioning report on site', item_es: PENDING_ES, ref: '110.26' },
    ],
  },
  assemblies: [
    { code: 'E-ESS-BATT-RES-EA', name: 'Residential battery ESS ≈13.5 kWh, battery unit INCLUDED — mount, wire and connect', name_es: 'Batería residencial ESS ≈13.5 kWh, unidad INCLUIDA — montaje, cableado y conexión', unit: 'EA', csi: '26 33 53',
      description: 'Includes the battery unit, bracket/stand, battery circuit and raceway. Gateway, backup panel, commissioning and bollards are separate lines.',
      material_cost_cents: { v: 950000, prov: est('≈13.5 kWh integrated home battery at installer cost + bracket, conductors, raceway; national baseline 2026, varies widely by brand') }, labor_hours_per_unit: { v: 8, prov: est('two-person mount + battery circuit and communication wiring') },
      equipment_cost_cents: { v: 0, prov: est('battery dolly owned') }, waste_pct: { v: 2, prov: est('wire and raceway cut-offs only') } },
    { code: 'E-ESS-GATEWAY-EA', name: 'Backup gateway / automatic grid disconnect at the service, supply + install', name_es: 'Gateway de respaldo / desconexión automática de la red en la acometida, suministro e instalación', unit: 'EA', csi: '26 36 00',
      material_cost_cents: { v: 120000, prov: est('backup gateway or system controller + feeder conductors and fittings, national baseline 2026') }, labor_hours_per_unit: { v: 5, prov: est('set enclosure, reroute service conductors, land feeders and CTs') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 3, prov: est('conductor cut-offs') } },
    { code: 'E-ESS-LOADS-MOVE-EA', name: 'Move circuits to a backup-loads panel (per panel, ≈8 circuits) — panel itself is E-SUBPANEL-100', name_es: 'Trasladar circuitos al tablero de cargas respaldadas (por tablero, ≈8 circuitos) — el tablero es E-SUBPANEL-100', unit: 'EA', csi: '26 24 16',
      material_cost_cents: { v: 15000, prov: est('splice kits, short extensions, nipple, directory labels') }, labor_hours_per_unit: { v: 4, prov: est('≈30 min per circuit moved + directory') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('wire cut-offs') } },
    { code: 'E-ESS-COMMISSION-EA', name: 'ESS commissioning, backup test, placards and utility paperwork, per system', name_es: 'Puesta en marcha del ESS, prueba de respaldo, placas y trámite con la compañía eléctrica, por sistema', unit: 'EA', csi: '26 08 00',
      material_cost_cents: { v: 6000, prov: est('engraved/UV placard set + directory labels') }, labor_hours_per_unit: { v: 3, prov: est('app commissioning, outage test, labeling, owner walk-through, utility form') },
      equipment_cost_cents: { v: 0, prov: est('phone/tablet + meters owned') }, waste_pct: { v: 0, prov: est('no bulk materials') } },
  ],
  quantity_rules: [
    { code: 'E-ESS-BATT-RES-EA', assumption: 'ESS shown on the plans — assume one home battery until the plan count and kWh are confirmed', when: { facts_any: ['has_ess'], building_types: ['residential_sf'] }, qty: { basis: 'const' } },
    { code: 'E-ESS-GATEWAY-EA', assumption: 'One backup gateway per home with an ESS', when: { facts_any: ['has_ess'], building_types: ['residential_sf'] }, qty: { basis: 'const' } },
    { code: 'E-SUBPANEL-100', assumption: 'Backup-loads subpanel for a partial-home backup (existing catalog assembly) — remove for whole-home backup', when: { facts_any: ['has_ess'], building_types: ['residential_sf'] }, qty: { basis: 'const' } },
    { code: 'E-ESS-LOADS-MOVE-EA', assumption: 'Move ≈8 owner-selected circuits into the backup-loads panel — remove for whole-home backup', when: { facts_any: ['has_ess'], building_types: ['residential_sf'] }, qty: { basis: 'const' } },
    { code: 'E-ESS-COMMISSION-EA', assumption: 'Commissioning, backup test and placards per ESS', when: { facts_any: ['has_ess'], building_types: ['residential_sf'] }, qty: { basis: 'const' } },
  ],
  dependency_hints: [
    { after_trades: ['electrical'], before_phase: 'commissioning', note: 'ESS wiring follows the service and panel work; commissioning and the backup test come after final electrical, before utility PTO.' },
  ],
});
