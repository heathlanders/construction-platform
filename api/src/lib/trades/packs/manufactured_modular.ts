// Trade Knowledge Pack — manufactured_modular (Manufactured / Modular Home Set). Wave 07 — NEW-TRADE
// pattern (no hand recipe, no template tasks). Dossier: docs/trade-packs/dossiers/manufactured_modular.md.
// Sources: 24 CFR 3285 (Model Manufactured Home Installation Standards) + 24 CFR 3286 (installation
// program) — public domain; Wis. Admin. Code SPS 321.40 (WI adopts 3285) and SPS 320 (modular homes under
// the UDC: DSPS insignia, uniform building permit, inspections); IRC (reference only); 29 CFR 1926
// (CC cranes, H rigging, I jacks, M falls, P excavation, K electrical, O vehicles, X ladders, E PPE).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const hud = { src: ['manufactured_modular-ecfr-24-3285'], confidence: 'verified' as const, last_verified: D };
const hudProg = { src: ['manufactured_modular-ecfr-24-3286'], confidence: 'verified' as const, last_verified: D };
const wiUdc = { src: ['manufactured_modular-wi-sps320'], confidence: 'verified' as const, last_verified: D };
const wiMh = { src: ['manufactured_modular-wi-sps321-40'], confidence: 'verified' as const, last_verified: D };
const irc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const mfr = { src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note: 'Common modular-builder set practice — follow the manufacturer’s set manual and approved plans for the actual home.' };

export default definePack({
  key: 'manufactured_modular',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Sets factory-built homes on site: HUD-code manufactured homes installed on footings, piers and ground anchors per 24 CFR 3285 (leveling, anchoring, marriage-line join, utility crossovers, skirting), and state-code modular homes crane-set onto a permanent foundation, stitched at the marriage line and buttoned up for final.',
    summary_es: 'Instala viviendas fabricadas en planta: casas prefabricadas con código HUD sobre zapatas, pilares y anclajes al suelo según 24 CFR 3285 (nivelación, anclaje, unión en la línea de acople, conexiones de servicios entre secciones, faldón), y casas modulares de código estatal colocadas con grúa sobre una cimentación permanente, unidas en la línea de acople y terminadas para la inspección final.',
    glossary: [
      { term: 'Data plate', term_es: 'Placa de datos', def: 'Label inside a HUD home listing its wind, roof-load and thermal zones — the anchoring and pier design must meet these.', def_es: 'Etiqueta dentro de la casa HUD con sus zonas de viento, carga de techo y térmica; el anclaje y los pilares deben cumplirlas.' },
      { term: 'Marriage line (mate line)', term_es: 'Línea de acople', def: 'The joint where two home sections or modules meet and are fastened together.', def_es: 'La junta donde se encuentran dos secciones o módulos de la casa y se fijan entre sí.' },
      { term: 'Pier', term_es: 'Pilar', def: 'Column of concrete block or a listed steel stand that carries the home’s frame or mate line down to a footing.', def_es: 'Columna de bloque de concreto o soporte de acero aprobado que lleva el chasis o la línea de acople hasta una zapata.' },
      { term: 'Ground anchor', term_es: 'Anclaje al suelo', def: 'Listed helix anchor screwed into the soil and strapped to the frame to hold the home against wind.', def_es: 'Anclaje helicoidal aprobado que se atornilla en el suelo y se amarra al chasis para resistir el viento.' },
      { term: 'Stabilizer plate', term_es: 'Placa estabilizadora', def: 'Plate driven beside a ground anchor head so the strap pull does not lever the anchor sideways.', def_es: 'Placa clavada junto a la cabeza del anclaje para que el tirón de la correa no lo mueva de lado.' },
      { term: 'Crossover', term_es: 'Conexión entre secciones', def: 'Water, drain, gas, duct or wiring connection made under or through the marriage line to join the sections.', def_es: 'Conexión de agua, drenaje, gas, ductos o cableado bajo o a través de la línea de acople que une las secciones.' },
      { term: 'Skirting', term_es: 'Faldón', def: 'Weather-resistant panels closing the space between the bottom of the home and the ground, with vents and an access door.', def_es: 'Paneles resistentes a la intemperie que cierran el espacio entre la casa y el suelo, con ventilas y puerta de acceso.' },
      { term: 'Spreader bar', term_es: 'Barra separadora', def: 'Lifting beam that keeps the crane slings vertical so a module is not crushed while it is lifted.', def_es: 'Viga de izaje que mantiene las eslingas verticales para no aplastar el módulo al levantarlo.' },
      { term: 'Close-up (button-up)', term_es: 'Cierre (terminación)', def: 'Finishing the seams after the set: roof ridge, siding, trim, drywall and flooring at the marriage line.', def_es: 'Terminar las juntas después de colocar la casa: cumbrera, revestimiento, molduras, tablaroca y piso en la línea de acople.' },
      { term: 'State insignia', term_es: 'Insignia estatal', def: 'Label showing a modular home was built and inspected to the state code in the factory.', def_es: 'Etiqueta que indica que la casa modular se construyó e inspeccionó en planta según el código estatal.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'hud_manufactured_install',
      example_title: 'Install manufactured home — piers, anchors and crossovers',
      when: { title_re: '\\b(?:manufactured|mobile|hud)[- ](?:code )?homes?\\b|\\bhud[- ]code\\b|\\bsingle[- ]wide\\b|\\bdouble[- ]wide\\b' },
      priority: 10,
      steps: [
        {
          title: 'Check the data plate, soil and site drainage',
          instruction: 'Read the data plate and the installation manual: wind zone, roof-load zone and design loads must fit this site. Find the soil class and bearing capacity (soil test, local records, torque probe or pocket penetrometer), check the flood map, strip organics where footings go, and grade so water runs away from the home. If the crawlspace will be skirted, cover the ground with a vapor retarder lapped at the seams.',
          tools: ['torque probe', 'pocket penetrometer', 'laser level', 'tape measure'],
          materials: ['6-mil polyethylene vapor retarder'],
          safety_ids: ['buried_utility', 'vehicle_backing'],
          qa_ids: ['site_drainage', 'vapor_retarder'],
          code_refs: [{ section: '3285.202', code_type: '24 CFR', note: 'Soil classification and bearing capacity found before foundation work' }, { section: '3285.203', code_type: '24 CFR', note: 'Site graded to drain water away from the home' }, { section: '3285.204', code_type: '24 CFR', note: 'Ground vapor retarder under skirted homes' }],
        },
        {
          title: 'Place footings and set the piers',
          instruction: 'Lay out pier lines from the manual’s blocking diagram: main-rail piers near each end and at the maximum spacing shown, plus mate-line column and perimeter piers at doors and wide openings. Set each footing on undisturbed or compacted soil, below the frost line unless the design is frost-protected. Stack block piers with cells vertical and the long side across the I-beam, capped and shimmed tight.',
          detail: 'Piers taller than the manual allows, or loads beyond its tables, need an engineer’s design.',
          tools: ['laser level', 'string line', 'shovel', 'tape measure'],
          materials: ['listed footing pads or poured concrete pads', 'concrete pier blocks or listed steel piers', 'pier caps', 'hardwood wedge shims'],
          safety_ids: ['jack_crush', 'buried_utility'],
          qa_ids: ['footing_bearing_frost', 'pier_layout'],
          gating_inspection_type: 'footing',
          code_refs: [{ section: '3285.312', code_type: '24 CFR', note: 'Footings — materials, bearing soil, frost protection' }, { section: '3285.310', code_type: '24 CFR', note: 'Pier location and spacing under rails and mate line' }],
        },
        {
          title: 'Jack, level and block the home',
          instruction: 'Raise each section with rated jacks on solid cribbing, then crib or block the load right away — never work under a home held only by jacks. Level it so adjacent piers are within the manual tolerance and every exterior door and window opens without binding. Keep the required clearance between the main frame and the ground.',
          tools: ['rated hydraulic or screw jacks', 'cribbing', 'water level or laser level'],
          materials: ['shims', 'cribbing blocks'],
          safety_ids: ['jack_crush'],
          qa_ids: ['level_tolerance'],
          code_refs: [{ section: '3285.6', code_type: '24 CFR', note: 'Final leveling — close tolerance between piers, doors and windows operate' }, { section: '3285.305', code_type: '24 CFR', note: 'Minimum clearance under the main frame' }],
        },
        {
          title: 'Install ground anchors and straps',
          instruction: 'Use only listed anchors rated for the soil class you found. Install them to full depth (below frost where frost applies), with the stabilizer plate the listing calls for, at the angle and spacing in the manual. Connect frame ties and any sidewall, over-the-roof or mate-line straps, then tension evenly without pulling the home out of level.',
          tools: ['anchor drive tool or auger', 'strap tensioning wrench', 'sledge'],
          materials: ['listed ground anchors', 'stabilizer plates', 'galvanized straps and tensioners', 'strap buckles / frame clamps'],
          safety_ids: ['buried_utility', 'eye_flying'],
          qa_ids: ['anchors_listed_installed'],
          gating_inspection_type: 'foundation',
          code_refs: [{ section: '3285.402', code_type: '24 CFR', note: 'Ground anchors listed and installed per their listing and instructions' }, { section: '3285.404', code_type: '24 CFR', note: 'Anchor augers below frost unless the foundation is frost-protected' }],
        },
        {
          title: 'Join the sections and close up the marriage line',
          instruction: 'Pull the sections tight with the mating gasket in place. Fasten floor, end-wall and ridge connections with the fastener type, length and spacing in the manual; shim any small gaps with lumber and lengthen fasteners to reach the receiving member. Finish the roof ridge, siding and trim at the seam, then remove shipping blocking and finish interior seams.',
          tools: ['come-along or section-pulling tool', 'impact driver', 'nailer', 'drill'],
          materials: ['mating gasket', 'lag screws / structural fasteners per manual', 'ridge cap and shingles', 'siding and trim', 'seam tape and joint compound'],
          safety_ids: ['roof_fall', 'ladder', 'eye_flying'],
          qa_ids: ['mate_line_tight'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: '3285.802', code_type: '24 CFR', note: 'Structural interconnection along the mate line — no gaps after close-up' }, { section: '3285.801', code_type: '24 CFR', note: 'Exterior close-up of roof, siding and trim at the seam' }],
        },
        {
          title: 'Connect crossovers, skirt and call for final',
          instruction: 'Make the water, drain, gas, duct and electrical crossovers per the manual; slope drains, insulate exposed water lines, and leak-test water, drain and gas. Utility service hook-ups go to the licensed trades. Install skirting with vents on opposite sides and an access door at the utility connections, test smoke alarms, and leave the HUD label and data plate in place for the inspector.',
          tools: ['pipe wrenches', 'test gauge', 'drill', 'snips'],
          materials: ['crossover fittings and connectors', 'pipe insulation', 'listed heat tape where needed', 'skirting panels, vents and access door', 'UL 181 duct tape or mastic'],
          safety_ids: ['electric_crossover', 'gas_leak', 'eye_flying'],
          qa_ids: ['drain_crossover', 'gas_tested', 'electric_crossover_done', 'skirting_vents', 'smoke_alarms'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '3285.604', code_type: '24 CFR', note: 'Drain crossovers sloped, supported and leak-tested' }, { section: '3285.505', code_type: '24 CFR', note: 'Crawlspace vents and utility access through skirting' }, { section: '321.40', code_type: 'WI SPS', note: 'Wisconsin adopts the federal installation standards for manufactured homes' }],
        },
      ],
    },
    {
      id: 'modular_crane_set',
      example_title: 'Crane-set modular home on foundation',
      when: { title_re: '\\bmodular\\b|\\bcrane[- ]set\\b|\\bset (?:the )?(?:home|boxes)\\b' },
      steps: [
        {
          title: 'Check the foundation and sill before delivery',
          instruction: 'Measure the foundation against the manufacturer’s foundation plan: length, width, diagonals, level of the top, and mate-line support (beam or posts). Confirm anchor bolts or straps are where the plan shows, the sill plate and sill gasket are down, and the drive, set area and crane pad are firm and clear of overhead lines.',
          tools: ['tape measure', 'laser level', 'string line'],
          materials: ['treated sill plate', 'sill gasket', 'anchor bolts / straps'],
          safety_ids: ['crane_powerline', 'vehicle_backing'],
          qa_ids: ['foundation_to_plan', 'state_label'],
          gating_inspection_type: 'foundation',
          code_refs: [{ section: 'R403.1.6', code_type: 'IRC', note: 'Foundation anchorage of the sill to the foundation' }, { section: '320.13', code_type: 'WI SPS', note: 'Modular homes need state approval, insignia and a building permit' }],
        },
        {
          title: 'Plan the lift and stage the crane',
          instruction: 'Hold a set meeting: module weights and set order, crane size and position, outriggers on mats, power-line clearance, signal person, and tag-line handlers. Inspect every sling, shackle and the spreader bar before the first pick, and barricade the crane swing area.',
          tools: ['tag lines', 'radios', 'barricade tape / cones'],
          materials: ['outrigger mats', 'spreader bar and slings (crane company)'],
          safety_ids: ['crane_powerline', 'crane_swing', 'rigging_failure'],
          qa_ids: ['lift_plan'],
        },
        {
          title: 'Set the modules',
          instruction: 'Pick each module with the spreader bar and guide it with tag lines — nobody under the load or between the module and the foundation edge. Land the first module to the layout lines, then bring the next one tight to the marriage line before releasing the rigging. Fasten each module to the sill as the set manual shows before unhooking.',
          tools: ['tag lines', 'pry bars', 'come-along', 'impact driver'],
          materials: ['sill fasteners / straps per set manual', 'shims'],
          safety_ids: ['crane_load', 'crane_swing', 'roof_fall'],
          qa_ids: ['mate_line_tight'],
        },
        {
          title: 'Stitch the marriage line and raise the roof',
          instruction: 'Bolt or lag the modules together at the floor, rim, end walls and ridge with the fasteners and spacing on the set drawings. Raise any hinged roof sections and frame or brace them as drawn. Shim gaps with lumber, install the marriage-line gasket and leave it open for the framing inspection.',
          tools: ['impact driver', 'drill', 'nailer', 'jacks for hinged roof'],
          materials: ['structural bolts / lag screws', 'marriage-line gasket', 'hinged-roof framing and hardware'],
          safety_ids: ['roof_fall', 'jack_crush', 'ladder'],
          qa_ids: ['mate_line_tight'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: 'R301.1', code_type: 'IRC', note: 'Continuous load path between modules and to the foundation' }, { section: 'R602.3', code_type: 'IRC', note: 'Fastening of wood framing at site connections' }],
        },
        {
          title: 'Button up and call for final',
          instruction: 'Close the roof at the ridge and dry it in the same day, finish siding and trim at the seams, connect the plumbing, duct and wiring crossovers for the licensed trades to finish, then tape and finish interior seams and flooring transitions. Test smoke and CO alarms and leave the state label visible for the inspector.',
          tools: ['nailer', 'drywall tools', 'ladder'],
          materials: ['ridge cap and shingles', 'siding and trim', 'drywall tape and compound', 'flooring transitions'],
          safety_ids: ['roof_fall', 'ladder', 'eye_flying'],
          qa_ids: ['state_label', 'smoke_alarms'],
          gating_inspection_type: 'final',
          code_refs: [{ section: 'R314', code_type: 'IRC', note: 'Smoke alarms located, interconnected and powered' }, { section: 'R315', code_type: 'IRC', note: 'Carbon monoxide alarms where fuel-burning appliances or garages exist' }],
        },
      ],
    },
  ],
  code_refs: {
    footing: [
      { section: '3285.312', code_type: '24 CFR', note: 'Manufactured-home footings: materials, bearing soil, frost protection', prov: hud },
      { section: 'R403.1', code_type: 'IRC', note: 'Footings for a modular home on a permanent foundation', prov: irc },
    ],
    foundation: [
      { section: '3285.310', code_type: '24 CFR', note: 'Pier location and spacing under rails, mate line and openings', prov: hud },
      { section: '3285.402', code_type: '24 CFR', note: 'Ground anchors listed for the soil class and installed per listing', prov: hud },
      { section: 'R403.1.6', code_type: 'IRC', note: 'Sill anchorage to the foundation for modular homes', prov: irc },
    ],
    framing: [
      { section: '3285.802', code_type: '24 CFR', note: 'Mate-line structural interconnection of multi-section homes', prov: hud },
      { section: 'R301.1', code_type: 'IRC', note: 'Complete load path through module connections', prov: irc },
    ],
    final: [
      { section: '3285.505', code_type: '24 CFR', note: 'Crawlspace ventilation and access through skirting', prov: hud },
      { section: '3285.703', code_type: '24 CFR', note: 'Smoke alarms working after installation', prov: hud },
      { section: 'R314', code_type: 'IRC', note: 'Smoke alarms in a modular home', prov: irc },
      { section: '321.40', code_type: 'WI SPS', note: 'Wisconsin installs manufactured homes to the federal standards', prov: wiMh },
    ],
  },
  equipment: [
    { when: { title_re: '\\bmodular\\b|\\bcrane[- ]set\\b|\\bset (?:the )?(?:home|boxes)\\b' }, type: 'crane', reason: 'Lift modules off the carriers and set them on the foundation' },
    { when: { title_re: '\\b(?:manufactured|mobile|hud)[- ](?:code )?homes?\\b|\\bdouble[- ]wide\\b|\\bsingle[- ]wide\\b' }, type: 'skid_steer', reason: 'Grade the pad and move pier blocks and materials into place', optional: true },
    { when: { title_re: '\\bmodular\\b|\\bmanufactured\\b|\\bmobile home\\b' }, type: 'generator', reason: 'Power tools on a site with no temporary service yet', optional: true },
  ],
  hazards: [
    { id: 'crane_load', hazard: 'Struck or crushed by a module while it is lifted or landed', hazard_es: PENDING_ES, controls: ['Nobody in the fall zone of a suspended module except those guiding it', 'Guide with tag lines; never stand between the module and the foundation edge'], controls_es: PENDING_ES, osha_ref: '1926.1425(b)', severity: 4, ppe: ['hard hat', 'safety-toe boots'], prov: osha('cc') },
    { id: 'crane_swing', hazard: 'Struck or pinched by the crane’s rotating upper body', hazard_es: PENDING_ES, controls: ['Barricade the swing radius', 'Keep crew out of the barricaded area while the crane rotates'], controls_es: PENDING_ES, osha_ref: '1926.1424(a)(2)', severity: 3, prov: osha('cc') },
    { id: 'crane_powerline', hazard: 'Electrocution from the crane boom or load contacting overhead power lines', hazard_es: PENDING_ES, controls: ['Identify the work zone and power lines before setup', 'Keep the minimum clearance or have the utility de-energize; use a dedicated spotter'], controls_es: PENDING_ES, osha_ref: '1926.1408', severity: 4, prov: osha('cc') },
    { id: 'rigging_failure', hazard: 'Module drops from a failed sling, shackle or spreader bar', hazard_es: PENDING_ES, controls: ['Inspect rigging before each shift; remove damaged gear', 'Use only rigging marked with its safe working load and never exceed it'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 4, prov: osha('h') },
    { id: 'jack_crush', hazard: 'Crushed under a home or module that slips off a jack', hazard_es: PENDING_ES, controls: ['Set jacks on solid cribbing and use only within their rated capacity', 'Crib or block the load as soon as it is raised; never go under a jacked-only load'], controls_es: PENDING_ES, osha_ref: '1926.305(d)(1)(i)', severity: 4, prov: osha('i') },
    { id: 'roof_fall', hazard: 'Fall from a module roof or open marriage-line edge during the set', hazard_es: PENDING_ES, controls: ['Use guardrails, nets or personal fall arrest at 6 ft or more', 'Plan anchor points before the crew goes on the roof'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(13)', severity: 4, ppe: ['harness + lanyard'], prov: osha('m') },
    { id: 'buried_utility', hazard: 'Striking buried lines while driving anchors or digging footings', hazard_es: PENDING_ES, controls: ['Call for utility locates before digging or driving anchors', 'Hand-dig near marked lines'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 3, prov: osha('p') },
    { id: 'electric_crossover', hazard: 'Electric shock while making the electrical crossover or near the service', hazard_es: PENDING_ES, controls: ['Keep the home disconnected until the crossover is done and checked', 'Lock out the supply before working near live parts'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 3, prov: osha('k') },
    { id: 'gas_leak', hazard: 'Fire or explosion from a leaking gas crossover or connector', hazard_es: PENDING_ES, controls: ['Leak-test the gas system before it is put in service', 'No open flame or sparks while testing; ventilate the crawlspace'], controls_es: PENDING_ES, osha_ref: '1926.151(a)', severity: 4, prov: osha('f') },
    { id: 'vehicle_backing', hazard: 'Struck by the carrier, toter or truck backing on site', hazard_es: PENDING_ES, controls: ['Back up only with a working reverse alarm or a spotter', 'Keep the crew clear of the travel path'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(4)', severity: 3, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'ladder', hazard: 'Ladder fall while closing the ridge or siding seams', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above the landing', 'Firm footing and three points of contact'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'eye_flying', hazard: 'Eye injury from chips, fasteners and debris under the home', hazard_es: PENDING_ES, controls: ['Wear safety glasses while fastening, cutting and working under the floor'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'site_drainage', item: 'Ground slopes away from the home at least 1/2 in. per ft for the first 10 ft, or drains/swales carry water away.', item_es: { status: 'translated', text: 'El terreno baja desde la casa al menos 1/2 pulg. por pie en los primeros 10 pies, o hay drenes/cunetas que alejan el agua.' }, prov: hud },
    { id: 'vapor_retarder', item: 'Skirted crawlspace: 6-mil poly covers the ground, seams lapped at least 12 in., tears repaired.', item_es: { status: 'translated', text: 'Espacio bajo piso con faldón: polietileno de 6 mil cubre el suelo, juntas traslapadas al menos 12 pulg., roturas reparadas.' }, prov: hud },
    { id: 'footing_bearing_frost', item: 'Every pier sits on a footing on undisturbed or compacted soil, below frost depth unless the foundation is designed frost-protected.', item_es: { status: 'translated', text: 'Cada pilar descansa en una zapata sobre suelo inalterado o compactado, bajo la línea de congelamiento salvo diseño protegido contra heladas.' }, prov: hud },
    { id: 'pier_layout', item: 'Main-rail piers within 24 in. of each end and no more than the manual’s maximum spacing; piers at both sides of exterior doors and wide openings; mate-line column piers per diagram.', item_es: { status: 'translated', text: 'Pilares del riel principal a no más de 24 pulg. de cada extremo y con la separación máxima del manual; pilares a ambos lados de puertas exteriores y vanos anchos; pilares de columna en la línea de acople según el diagrama.' }, prov: hud },
    { id: 'level_tolerance', item: 'Home level within 1/4 in. between adjacent piers; all exterior doors and windows open and close without binding.', item_es: { status: 'translated', text: 'Casa nivelada con máximo 1/4 pulg. entre pilares contiguos; todas las puertas y ventanas exteriores abren y cierran sin trabarse.' }, prov: hud },
    { id: 'anchors_listed_installed', item: 'Ground anchors are listed for the recorded soil class, installed to full depth with the required stabilizer plate, at the listed angle of pull and spacing, and every strap is tensioned.', item_es: PENDING_ES, safety: true, prov: { src: ['manufactured_modular-ecfr-24-3285', 'manufactured_modular-ecfr-24-3286'], confidence: 'verified', last_verified: D } },
    { id: 'mate_line_tight', item: 'Marriage line closed with no gaps after close-up; any small pre-close gaps shimmed with lumber and fastened with longer fasteners per the manual.', item_es: { status: 'translated', text: 'Línea de acople cerrada sin huecos tras el cierre; los huecos pequeños previos se calzan con madera y se fijan con sujetadores más largos según el manual.' }, prov: hud },
    { id: 'drain_crossover', item: 'Drain crossover sloped at least 1/4 in. per ft (1/8 in. only with a cleanout at the upper end), supported, and leak-tested.', item_es: { status: 'translated', text: 'Conexión de drenaje con pendiente mínima de 1/4 pulg. por pie (1/8 pulg. solo con registro en el extremo alto), soportada y probada contra fugas.' }, prov: hud },
    { id: 'gas_tested', item: 'Gas crossover connected without tools at the quick-disconnect and the gas system leak-tested before service.', item_es: PENDING_ES, safety: true, prov: hud },
    { id: 'electric_crossover_done', item: 'Electrical crossover completed per the installation instructions and checked before the home is energized.', item_es: PENDING_ES, safety: true, prov: hud },
    { id: 'skirting_vents', item: 'Skirting weather-resistant, not trapping water at the siding; vents on opposite sides sized to the floor area; access opening at least 18 x 24 in. at the utility connections.', item_es: { status: 'translated', text: 'Faldón resistente a la intemperie, sin atrapar agua en el revestimiento; ventilas en lados opuestos según el área de piso; acceso de al menos 18 x 24 pulg. junto a las conexiones de servicios.' }, prov: hud },
    { id: 'smoke_alarms', item: 'Smoke alarms (and CO alarms where required) installed, powered and tested after the set.', item_es: PENDING_ES, safety: true, prov: { src: ['manufactured_modular-ecfr-24-3285', 'icc-pa'], confidence: 'verified', last_verified: D } },
    { id: 'foundation_to_plan', item: 'Modular foundation matches the manufacturer’s foundation plan: dimensions, diagonals within tolerance, top level, mate-line support and anchors placed as shown.', item_es: { status: 'translated', text: 'La cimentación modular coincide con el plano del fabricante: medidas, diagonales dentro de tolerancia, parte superior nivelada, apoyo de la línea de acople y anclajes donde se indican.' }, prov: mfr },
    { id: 'lift_plan', item: 'Lift plan reviewed at the set meeting: module weights, crane position, power-line clearance, signal person and rigging inspection recorded.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-cc'], confidence: 'derived', last_verified: D, note: 'Pre-lift planning items drawn from 1926 Subpart CC (work zone, power lines, signals, keeping clear of the load).' } },
    { id: 'state_label', item: 'Modular home carries the state insignia (or HUD label and data plate for a manufactured home), left visible for the inspector.', item_es: { status: 'translated', text: 'La casa modular tiene la insignia estatal (o etiqueta HUD y placa de datos si es prefabricada), visible para el inspector.' }, prov: wiUdc },
  ],
  inspection_checklists: {
    footing: [
      { item: 'Footings on undisturbed or compacted soil, sized for the soil class, below frost depth or frost-protected', item_es: PENDING_ES, ref: '24 CFR 3285.312' },
      { item: 'Organics removed under footings; site graded to drain', item_es: PENDING_ES, ref: '24 CFR 3285.201' },
    ],
    foundation: [
      { item: 'Pier spacing, heights and construction match the blocking diagram or engineered design', item_es: PENDING_ES, ref: '24 CFR 3285.310' },
      { item: 'Ground anchors listed for the soil class, stabilizer plates installed, straps tensioned', item_es: PENDING_ES, ref: '24 CFR 3286.505(e)' },
      { item: 'Modular: sill anchorage and mate-line support per foundation plan', item_es: PENDING_ES, ref: 'IRC R403.1.6' },
    ],
    framing: [
      { item: 'Mate-line structural connections complete; no gaps; gasket in place', item_es: PENDING_ES, ref: '24 CFR 3285.802' },
      { item: 'Modular: module-to-module and hinged-roof connections per set drawings', item_es: PENDING_ES },
    ],
    final: [
      { item: 'Water, drain, gas, duct and electrical crossovers complete and tested', item_es: PENDING_ES, ref: '24 CFR 3286.505(g)' },
      { item: 'Skirting, crawlspace vents and access opening installed', item_es: PENDING_ES, ref: '24 CFR 3285.505' },
      { item: 'Smoke and CO alarms working; doors and windows operate', item_es: PENDING_ES },
      { item: 'HUD label / data plate or state insignia present', item_es: PENDING_ES, ref: 'WI SPS 320.13' },
    ],
  },
  assemblies: [
    { code: 'B-MOD-CRANE-SET-EA', name: 'Modular home crane set, per module (crane, rigging and set crew)', name_es: 'Colocación con grúa de casa modular, por módulo (grúa, aparejo y cuadrilla)', unit: 'EA', csi: '13 42 00',
      description: 'Set only — foundation, button-up and utility hook-ups are separate.',
      material_cost_cents: { v: 2500, prov: est('sill gasket, shims and sill fasteners per module, 2026') }, labor_hours_per_unit: { v: 6, prov: est('4-person set crew ≈1.5 h per module incl. rigging and fastening to sill') },
      equipment_cost_cents: { v: 130000, prov: est('≈$4,000 crane day incl. spreader bar and travel, ~3 modules per day, 2026') }, waste_pct: { v: 0, prov: est('none') } },
    { code: 'B-MOD-STITCH-LF', name: 'Marriage-line stitch and close-up, per LF of seam (fasteners, gasket, ridge, siding, interior seam)', name_es: 'Unión y cierre de la línea de acople, por pie lineal (sujetadores, empaque, cumbrera, revestimiento, junta interior)', unit: 'LF', csi: '13 42 00',
      material_cost_cents: { v: 1200, prov: est('lags/bolts, gasket, ridge cap, siding/trim pieces, tape and compound per LF of seam, 2026') }, labor_hours_per_unit: { v: 0.6, prov: est('floor, wall, ridge connections plus exterior and interior seam finish') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools only') }, waste_pct: { v: 10, prov: est('trim and siding cut-offs') } },
    { code: 'B-MOD-PIER-EA', name: 'Manufactured-home pier: footing pad, concrete block pier, cap and shims, each', name_es: 'Pilar de casa prefabricada: zapata, pilar de bloque de concreto, tapa y calzas, c/u', unit: 'EA', csi: '13 42 00',
      material_cost_cents: { v: 7500, prov: est('listed footing pad + 2–3 pier blocks + cap + wedge shims, national baseline 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('dig/level pad, stack, cap and shim') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; jacks are crew equipment') }, waste_pct: { v: 5, prov: est('broken block') } },
    { code: 'B-MOD-ANCHOR-EA', name: 'Ground anchor with stabilizer plate, strap and tensioner, each', name_es: 'Anclaje al suelo con placa estabilizadora, correa y tensor, c/u', unit: 'EA', csi: '13 42 00',
      material_cost_cents: { v: 4500, prov: est('listed helix anchor + stabilizer plate + galvanized strap, buckle and tensioner, 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('drive anchor to depth, set plate, attach and tension strap') },
      equipment_cost_cents: { v: 500, prov: est('powered anchor driver rental share') }, waste_pct: { v: 0, prov: est('counted items') } },
    { code: 'B-MOD-SKIRT-LF', name: 'Vinyl skirting with rail, vents and access door, per LF of perimeter', name_es: 'Faldón de vinilo con riel, ventilas y puerta de acceso, por pie lineal de perímetro', unit: 'LF', csi: '13 42 00',
      material_cost_cents: { v: 1100, prov: est('vinyl skirting panels, top/bottom rail, vents, access door share, 2026') }, labor_hours_per_unit: { v: 0.15, prov: est('rail, cut and set panels, vents') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 8, prov: est('panel cut-offs at grade changes') } },
  ],
  quantity_rules: [
    { code: 'B-MOD-PIER-EA', assumption: 'About 1 pier per 40 SF of floor (rails + mate line + perimeter on a typical multi-section home) — replace with the blocking-diagram count', when: { building_types: ['residential_sf'] }, qty: { basis: 'area_sf_sum', mul: 0.025, round: 'ceil' } },
    { code: 'B-MOD-ANCHOR-EA', assumption: 'About 1 ground anchor per 90 SF of floor (wind zone I) — replace with the manual’s anchor schedule for the actual wind zone', when: { building_types: ['residential_sf'] }, qty: { basis: 'area_sf_sum', mul: 0.011, round: 'ceil' } },
    { code: 'B-MOD-STITCH-LF', assumption: 'One 56-ft marriage line (two-section home) — adjust to the actual section count and length', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 56 } },
  ],
  dependency_hints: [
    { after_trades: ['excavation', 'concrete'], before_phase: 'finishes_exterior', note: 'Foundation or footings must be inspected and cured before the home is set; skirting, decks and exterior finishes follow the set.' },
  ],
});
