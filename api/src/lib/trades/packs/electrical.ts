// Trade Knowledge Pack — electrical (Electrical). Wave 02, COMPLEMENT pattern: the hand recipe in
// task-buildout/electrical.ts keeps producing the work steps (temp power → boxes & conductors →
// pre-cover → service → trim & AFCI/GFCI verification); this pack adds glossary, hazards, QA,
// inspection checklists, extra NEC/IRC code refs, equipment hints and assemblies the catalog lacks
// (AFCI/GFCI breakers, whole-house SPD, 240 V appliance circuit, temporary power pole).
// Dossier: docs/trade-packs/dossiers/electrical.md. Sources: UFGS 26 20 00, 29 CFR 1926 Subparts
// E, K, M, P, X; NFPA 70 (NEC) and NFPA 70E reference only; NECA NEIS reference; ESFi.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['electrical-ufgs-26-20-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const nec = { src: ['nfpa-fa'], confidence: 'verified' as const, last_verified: D };
const necEd = (note: string) => ({ ...nec, note });
const irc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'electrical',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Building wiring from the service to the last device: temporary jobsite power, service entrance and panels, grounding and bonding, branch circuits, boxes and cable, AFCI/GFCI protection, smoke/CO alarm circuits, and the trim-out and testing that close it out.',
    summary_es: 'Instalación eléctrica del edificio desde la acometida hasta el último dispositivo: energía temporal de obra, acometida y tableros, puesta a tierra y equipotencialidad, circuitos derivados, cajas y cable, protección AFCI/GFCI, circuitos de alarmas de humo/CO, y el acabado y las pruebas finales.',
    glossary: [
      { term: 'GFCI', term_es: 'Interruptor de falla a tierra (GFCI)', def: 'Device that cuts power in a fraction of a second when current leaks to ground — protects people from shock in wet areas.', def_es: 'Dispositivo que corta la energía en fracciones de segundo cuando la corriente se fuga a tierra; protege a las personas contra descargas en zonas húmedas.' },
      { term: 'AFCI', term_es: 'Interruptor de falla de arco (AFCI)', def: 'Breaker or device that trips on dangerous arcing in damaged cords or loose connections — prevents wiring fires.', def_es: 'Interruptor o dispositivo que se dispara ante arcos peligrosos en cables dañados o conexiones flojas; previene incendios del cableado.' },
      { term: 'Home run', term_es: 'Retorno al tablero (home run)', def: 'The cable run from the first box of a circuit back to its breaker in the panel.', def_es: 'El tramo de cable desde la primera caja de un circuito hasta su interruptor en el tablero.' },
      { term: 'Box fill', term_es: 'Llenado de caja', def: 'How many conductors, devices and clamps a box may hold for its volume — overfilled boxes overheat.', def_es: 'Cuántos conductores, dispositivos y abrazaderas caben en una caja según su volumen; una caja sobrellenada se calienta.' },
      { term: 'Equipment grounding conductor', term_es: 'Conductor de puesta a tierra de equipos', def: 'The bare or green wire that gives fault current a safe path back so the breaker trips.', def_es: 'El cable desnudo o verde que da a la corriente de falla un camino seguro de regreso para que el interruptor se dispare.' },
      { term: 'Bonding', term_es: 'Equipotencialidad (unión)', def: 'Connecting metal parts and piping together so they cannot sit at different voltages.', def_es: 'Unir partes metálicas y tuberías para que no queden a voltajes distintos.' },
      { term: 'Panel directory', term_es: 'Directorio del tablero', def: 'The typed list inside the panel door saying what each breaker feeds.', def_es: 'La lista impresa dentro de la puerta del tablero que indica qué alimenta cada interruptor.' },
      { term: 'Nail plate', term_es: 'Placa protectora (nail plate)', def: 'Steel plate over a stud or joist where a cable passes close to the face, so drywall screws and nails cannot hit it.', def_es: 'Placa de acero sobre un montante o vigueta donde pasa un cable cerca de la cara, para que tornillos y clavos del panel de yeso no lo perforen.' },
      { term: 'Working space', term_es: 'Espacio de trabajo', def: 'The clear area kept in front of a panel so an electrician can work on it safely — no shelves, water heaters or storage.', def_es: 'El área libre frente a un tablero para que un electricista trabaje con seguridad; sin repisas, calentadores ni almacenamiento.' },
      { term: 'Dedicated circuit', term_es: 'Circuito dedicado', def: 'A branch circuit that feeds only one appliance, such as a range, dryer or dishwasher.', def_es: 'Un circuito derivado que alimenta un solo aparato, como estufa, secadora o lavavajillas.' },
    ],
  },
  est_bucket: 'electrical',
  recipes: [],
  code_refs: {
    temporary_power: [
      { section: '590.6', note: 'GFCI protection for temporary-wiring receptacles used by personnel', prov: nec },
      { section: '590.4', note: 'Temporary services, feeders and branch circuits — methods and protection', prov: nec },
      { section: '590.3', note: 'Time limits — temporary wiring removed when the work is done', prov: nec },
    ],
    rough_in: [
      { section: '314.16', note: 'Box volume must cover the counted conductors, devices and fittings', prov: nec },
      { section: '334.30', note: 'Securing and supporting NM cable along and through framing', prov: nec },
      { section: '240.4(D)', note: 'Small conductors limited to their breaker size (#14 on 15 A, #12 on 20 A)', prov: nec },
      { section: '210.11(C)', note: 'Required kitchen small-appliance, laundry and bathroom branch circuits', prov: nec },
      { section: '404.2(C)', note: 'Neutral brought to switch locations', prov: nec },
      { section: 'R314.4', note: 'Smoke alarms interconnected so one sounding sets off all', code_type: 'IRC', prov: irc },
    ],
    service: [
      { section: '110.26', note: 'Clear working space and headroom in front of panels and service gear', prov: nec },
      { section: '408.4', note: 'Every circuit legibly identified on a panel directory', prov: nec },
      { section: '110.14(D)', note: 'Terminals tightened to the listed torque with a calibrated tool', prov: necEd('Torque requirement placement varies by NEC edition; check the AHJ-adopted edition.') },
      { section: '250.50', note: 'Grounding electrodes present on the premises bonded into one system', prov: nec },
      { section: '250.104', note: 'Bonding of metal water piping and other metal piping systems', prov: nec },
      { section: '230.67', note: 'Surge protective device for dwelling-unit services', prov: necEd('Added in the 2020 NEC; not required where an older edition is adopted.') },
    ],
    cover: [
      { section: '300.4(D)', note: 'Cables run parallel to framing kept back from the edge or covered by steel plates', prov: nec },
      { section: '314.20', note: 'Boxes set flush or within the allowed setback of the finished wall', prov: nec },
    ],
    final: [
      { section: '406.12', note: 'Tamper-resistant receptacles in dwelling units', prov: nec },
      { section: '210.70', note: 'Required lighting outlets and switch control', prov: nec },
      { section: '408.4', note: 'Panel directory complete and matches the finished circuits', prov: nec },
    ],
  },
  equipment: [
    { when: { title_re: 'underground|under-slab|lateral|trench|site lighting|parking lot' }, type: 'trencher', reason: 'Trench underground service laterals, feeders and site-lighting conduit', optional: true },
    { when: { title_re: 'site lighting|parking lot|pole', building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'boom_lift', reason: 'Set pole heads and aim site lighting', optional: true },
  ],
  hazards: [
    { id: 'live_contact', hazard: 'Electric shock or electrocution from contact with energized conductors, panels or existing circuits', hazard_es: PENDING_ES, controls: ['De-energize and verify dead with a tested meter before touching any conductor', 'Where de-energizing is not possible, guard or insulate live parts and let only qualified workers near them', 'Locate concealed live circuits before cutting into existing walls'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, ppe: ['insulated gloves rated for the voltage', 'safety glasses'], prov: osha('k') },
    { id: 'lockout', hazard: 'Circuit re-energized by someone else while work is in progress', hazard_es: PENDING_ES, controls: ['Lock and tag the breaker or disconnect at every point the circuit can be energized', 'Tags name the circuit being worked on; only the worker who placed a lock removes it'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'arc_flash', hazard: 'Arc flash or arc blast when working on or near energized panels and service equipment', hazard_es: PENDING_ES, controls: ['Work de-energized whenever possible; energized work only with a documented risk assessment per NFPA 70E (reference)', 'Wear arc-rated clothing and face protection selected for the equipment', 'Keep the boundary clear of anyone not doing the work'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 4, ppe: ['arc-rated clothing', 'arc-rated face shield', 'voltage-rated gloves'], prov: { src: ['ecfr-1926-e', 'electrical-nfpa-70e'], confidence: 'verified', last_verified: D, note: 'OSHA general PPE duty; arc-flash method per NFPA 70E (reference only — no category values copied).' } },
    { id: 'temp_power_gfci', hazard: 'Shock from cords and tools on temporary jobsite power', hazard_es: PENDING_ES, controls: ['GFCI-protect every 120 V 15/20 A temporary receptacle, or run an assured equipment grounding conductor program', 'Test GFCIs before use each day'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)(ii)', severity: 3, prov: osha('k') },
    { id: 'damaged_cords', hazard: 'Worn or frayed extension cords; cords stapled or hung from nails', hazard_es: PENDING_ES, controls: ['Pull worn or frayed cords out of service', 'Never staple cords or hang them from nails or wire', 'Keep walkways clear of cords'], controls_es: PENDING_ES, osha_ref: '1926.416(e)(1)', severity: 3, prov: osha('k') },
    { id: 'open_panel', hazard: 'Workers walking through or reaching into the space in front of an open, energized panel', hazard_es: PENDING_ES, controls: ['Barricade the working space while covers are off and parts are exposed', 'Reinstall dead-fronts and covers before leaving the panel'], controls_es: PENDING_ES, osha_ref: '1926.416(b)(1)', severity: 3, prov: osha('k') },
    { id: 'conductive_ladder', hazard: 'Metal ladder contacting energized equipment or wiring', hazard_es: PENDING_ES, controls: ['Use ladders with nonconductive side rails (fiberglass) for electrical work', 'Inspect ladders before use; tag out damaged ones'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(12)', severity: 3, prov: osha('x') },
    { id: 'fall_attic_roof', hazard: 'Fall from upper floors, roof edges or through attic ceilings while pulling cable or mounting fixtures', hazard_es: PENDING_ES, controls: ['Use guardrails, nets or personal fall arrest at 6 ft or more above a lower level', 'Walk attics on framing or boards — never on ceiling drywall'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(13)', severity: 4, ppe: ['harness and lanyard when required'], prov: osha('m') },
    { id: 'underground_utilities', hazard: 'Striking a buried utility while trenching for a service lateral or site feeder', hazard_es: PENDING_ES, controls: ['Call 811 and mark existing utilities before digging', 'Hand-dig near marked lines'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'eye_injury', hazard: 'Eye injury from drilling, chips, wire ends and overhead debris', hazard_es: PENDING_ES, controls: ['Wear safety glasses when drilling, cutting cable or working overhead'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'box_fill', phase: 'rough_in', item: 'Each box is large enough for its counted conductors, devices and clamps; boxes secured to framing and set to finished-wall depth.', item_es: tr('Cada caja tiene volumen para los conductores, dispositivos y abrazaderas contados; cajas fijas a la estructura y a la profundidad del muro terminado.'), prov: ufgs('3.1.9 — box volume per NFPA 70') },
    { id: 'wire_vs_breaker', item: 'Conductor size matches its breaker on every circuit (no #14 on a 20 A breaker); appliance circuits match the nameplate.', item_es: PENDING_ES, safety: true, prov: nec },
    { id: 'cable_support', phase: 'rough_in', item: 'NM cable bored through framing near the center, stapled within the required distance of boxes and at the required spacing; no notched framing.', item_es: tr('Cable NM pasado por perforaciones cerca del centro de la estructura, engrapado a la distancia requerida de las cajas y al espaciado requerido; sin muescas en la estructura.'), prov: ufgs('3.1.11 NM cable installation') },
    { id: 'nail_plates', phase: 'rough_in', item: 'Steel nail plates installed wherever a cable or raceway is closer to the framing face than allowed; grommets at metal studs.', item_es: tr('Placas de acero instaladas donde un cable o tubo queda más cerca de la cara de la estructura de lo permitido; arandelas protectoras en montantes metálicos.'), prov: ufgs('3.1.11 — grommets at metal studs; NEC 300.4 (ref)') },
    { id: 'grounds_made_up', phase: 'rough_in', item: 'Equipment grounding conductors spliced and bonded in every box; metal boxes bonded.', item_es: PENDING_ES, safety: true, prov: ufgs('3.1.18 grounding and bonding') },
    { id: 'gec_bonding', item: 'Grounding electrode conductor connected to the rods/electrodes and metal water piping bonded; buried connections made by listed compression or exothermic connectors.', item_es: PENDING_ES, safety: true, prov: ufgs('3.1.18 and 3.1.18.2 grounding connections') },
    { id: 'torque', item: 'Every breaker, lug and neutral/ground terminal tightened to the label torque with a calibrated torque tool; values recorded.', item_es: tr('Cada interruptor, zapata y terminal de neutro/tierra apretado al torque de la etiqueta con una herramienta calibrada; valores registrados.'), prov: necEd('NEC 110.14(D) (ref) — use the equipment label torque') },
    { id: 'working_clearance', item: 'Clear working space and headroom in front of every panel; no storage, shelves or other equipment in it.', item_es: PENDING_ES, safety: true, prov: osha('k', '1926.403(i)(1)(i) working clearances; NEC 110.26 (ref)') },
    { id: 'panel_directory', item: 'Panel directory typed, complete and matching the actual circuits; device plates labeled with panel-circuit where specified.', item_es: tr('Directorio del tablero impreso, completo y coincidente con los circuitos reales; placas de dispositivos rotuladas con tablero-circuito donde se especifique.'), prov: ufgs('3.1.16.1 circuit identification') },
    { id: 'afci_gfci_test', phase: 'finishes_interior', item: 'Every AFCI and GFCI device trips and resets with a tester; line/load not reversed (test with a plug-in load).', item_es: PENDING_ES, safety: true, prov: ufgs('3.5.4 / 3.5.5 ground-fault and arc-fault receptacle tests') },
    { id: 'smoke_co_interconnect', item: 'Smoke and CO alarms on a permanent circuit with battery backup, interconnected so one sets off all.', item_es: PENDING_ES, safety: true, prov: { ...irc, note: 'IRC R314.4 interconnection (ref)' } },
    { id: 'tamper_resistant', phase: 'finishes_interior', item: 'Tamper-resistant receptacles installed in dwelling units; weather-resistant in-use covers outdoors.', item_es: PENDING_ES, safety: true, prov: nec },
    { id: 'plates_tight', phase: 'finishes_interior', item: 'Device plates tight to the finished wall, aligned and gasketed in wet locations; no open boxes or missing blanks.', item_es: tr('Placas de dispositivos ajustadas al muro terminado, alineadas y con empaque en lugares húmedos; sin cajas abiertas ni tapas faltantes.'), prov: ufgs('3.1.16 covers and device plates') },
    { id: 'polarity_operation', phase: 'finishes_interior', item: 'Correct polarity and ground at every receptacle; each switch and device operated several times.', item_es: tr('Polaridad y tierra correctas en cada receptáculo; cada interruptor y dispositivo accionado varias veces.'), prov: ufgs('3.5.1 devices subject to manual operation') },
  ],
  inspection_checklists: {
    temporary_power: [
      { item: 'Temp pole or panel braced, grounded with a ground rod, meter base set to utility spec', item_es: PENDING_ES, ref: '590.4' },
      { item: 'All 120 V 15/20 A temporary receptacles GFCI-protected and tested', item_es: PENDING_ES, ref: '590.6' },
      { item: 'Weatherproof in-use covers; cords not run through doorways or pinch points', item_es: PENDING_ES },
    ],
    rough_in: [
      { item: 'Boxes at plan locations and heights; box fill within limits', item_es: PENDING_ES, ref: '314.16' },
      { item: 'Cable supported and secured; bored holes, no over-notched framing', item_es: PENDING_ES, ref: '334.30' },
      { item: 'Required kitchen, laundry and bath circuits present; conductor sizes match breakers', item_es: PENDING_ES, ref: '210.11(C)' },
      { item: 'Grounds made up in every box; neutral at switch locations', item_es: PENDING_ES, ref: '404.2(C)' },
      { item: 'Smoke/CO alarm boxes placed and interconnect conductor run', item_es: PENDING_ES, ref: 'R314.4' },
      { item: 'Fire-rated penetrations sealed', item_es: PENDING_ES },
    ],
    service: [
      { item: 'Service conductors, meter base and panel rating match the approved load', item_es: PENDING_ES, ref: '230' },
      { item: 'Grounding electrode system complete; water and gas piping bonded', item_es: PENDING_ES, ref: '250.50' },
      { item: 'Neutral bonded at the service only; separated in subpanels', item_es: PENDING_ES, ref: '250' },
      { item: 'Working space and headroom clear in front of panel', item_es: PENDING_ES, ref: '110.26' },
      { item: 'Terminations torqued; SPD installed where required', item_es: PENDING_ES, ref: '230.67' },
    ],
    cover: [
      { item: 'Nail plates on every cable near the framing face', item_es: PENDING_ES, ref: '300.4(D)' },
      { item: 'Rough-in corrections cleared; no splices outside boxes', item_es: PENDING_ES },
      { item: 'Boxes will finish flush with the wall surface', item_es: PENDING_ES, ref: '314.20' },
    ],
    final: [
      { item: 'AFCI and GFCI protection at all required locations, tested', item_es: PENDING_ES, ref: '210.12' },
      { item: 'Tamper-resistant and weather-resistant receptacles where required', item_es: PENDING_ES, ref: '406.12' },
      { item: 'Smoke/CO alarms powered, interconnected and tested', item_es: PENDING_ES, ref: 'R314.4' },
      { item: 'All plates, blanks and dead-fronts installed; panel directory complete', item_es: PENDING_ES, ref: '408.4' },
      { item: 'Lighting outlets and switches at required locations', item_es: PENDING_ES, ref: '210.70' },
    ],
  },
  assemblies: [
    { code: 'E-EL-AFCI-BRKR-EA', name: 'AFCI / dual-function breaker in place of a standard breaker (incremental), each', name_es: 'Interruptor AFCI / de doble función en lugar de uno estándar (incremental), c/u', unit: 'EA', csi: '26 24 16',
      material_cost_cents: { v: 4500, prov: est('AFCI/dual-function breaker street price minus standard breaker, national baseline 2026') }, labor_hours_per_unit: { v: 0.1, prov: est('swap at panel make-up + test') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'E-EL-GFCI-BRKR-EA', name: 'GFCI breaker for a dedicated circuit (dishwasher, outdoor, pool equipment), incremental, each', name_es: 'Interruptor GFCI para circuito dedicado (lavavajillas, exterior, equipo de piscina), incremental, c/u', unit: 'EA', csi: '26 24 16',
      material_cost_cents: { v: 4000, prov: est('GFCI breaker street price minus standard breaker, 2026') }, labor_hours_per_unit: { v: 0.1, prov: est('install at panel, land pigtail neutral, test') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'E-EL-SPD-EA', name: 'Whole-house surge protective device (Type 2) at the service panel, with 2-pole breaker, each', name_es: 'Supresor de picos para toda la casa (Tipo 2) en el tablero principal, con interruptor de 2 polos, c/u', unit: 'EA', csi: '26 43 13',
      material_cost_cents: { v: 12000, prov: est('residential Type 2 SPD + 2-pole breaker, distributor spot, 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('mount, short leads, land and verify indicator') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'E-EL-240V-CIRCUIT-EA', name: '240 V dedicated appliance circuit, 30–50 A (range / dryer), avg 40 ft, with breaker and receptacle, each', name_es: 'Circuito dedicado de 240 V para aparato, 30–50 A (estufa / secadora), prom. 40 pies, con interruptor y receptáculo, c/u', unit: 'EA', csi: '26 05 19',
      material_cost_cents: { v: 18500, prov: est('≈40 ft 10/3–6/3 NM + 2-pole breaker + receptacle/box, national baseline 2026 — copper volatile') }, labor_hours_per_unit: { v: 2.5, prov: est('pull home run, set box, terminate both ends') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('cable ends and loops') } },
    { code: 'E-EL-TEMP-POLE-EA', name: 'Temporary power pole: set, ground, GFCI distribution, inspection and removal, each', name_es: 'Poste de energía temporal: instalación, tierra, distribución GFCI, inspección y retiro, c/u', unit: 'EA', csi: '01 51 13',
      material_cost_cents: { v: 40000, prov: est('pole/meter socket/GFCI panel share (often rented) + ground rod + wire, 2026') }, labor_hours_per_unit: { v: 4, prov: est('set, ground, coordinate utility, remove at permanent power') },
      equipment_cost_cents: { v: 0, prov: est('auger/post-hole tools only; rental captured in material') }, waste_pct: { v: 0, prov: est('counted units') } },
  ],
  quantity_rules: [
    { code: 'E-EL-AFCI-BRKR-EA', assumption: 'Dwelling — AFCI upgrade on the ≈1.5 branch circuits/room seeded by E-CIRCUIT-20; delete if your circuit rate already prices AFCI breakers', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'rooms', mul: 1.5, round: 'round' } },
    { code: 'E-RECEP-GFCI', assumption: 'GFCI symbol on the legend — assume ≈6 GFCI receptacles (kitchen counter, baths, garage, exterior) in addition to standard duplexes until counted', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: { fixture: 'gfci_outlet' }, mul: 6 } },
    { code: 'E-EL-GFCI-BRKR-EA', assumption: 'Kitchen with disposal on plans — dishwasher/disposal circuit GFCI-protected at the breaker', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: { fixture: 'garbage_disposal' }, mul: 1 } },
    { code: 'E-EL-SPD-EA', assumption: 'Single-family dwelling service — one whole-house SPD where the 2020+ NEC is adopted; delete under older editions', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'E-EL-240V-CIRCUIT-EA', assumption: 'Single-family — electric range and dryer circuits (2); delete any that are gas', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'E-EL-TEMP-POLE-EA', assumption: 'New single-family build — one temporary power pole until permanent service is energized', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 1 } },
  ],
  dependency_hints: [
    { after_trades: ['framing'], note: 'Electrical rough-in starts after framing (and roof dry-in) so boxes and cable go into finished framing.' },
    { before_phase: 'insulation', note: 'Electrical rough-in and cover inspections must pass before insulation and drywall close the walls.' },
  ],
});
