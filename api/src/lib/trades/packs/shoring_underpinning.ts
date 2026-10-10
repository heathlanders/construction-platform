// Trade Knowledge Pack — shoring_underpinning (Earth Retention / Shoring / Underpinning). Wave 11 —
// NEW-TRADE pattern (not in HAND_RECIPE_KEYS; no blueprint template tasks).
// Dossier: docs/trade-packs/dossiers/shoring_underpinning.md. Sources: 29 CFR 1926 Subpart P
// (1926.651, .652, Appendices C/D/F), 1926.603 (pile driving), 1926.701(c) (stressing), 1926.52,
// 1926.352, 1926.1153; FHWA GEC 7 (soil nail walls) and GEC 4 (ground anchors); WisDOT Standard
// Spec 511 + Average Unit Price List (511.1200); IBC 1804.1 / 1705.6 / 3307.1 (reference only).
// Not here: slab reshoring (formwork B-FORM-SHORE-SF) and residential push/helical piers (foundation_repair B-FDR-*).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const aup = (note: string) => ({ src: ['excavation-wisdot-aup', 'shoring_underpinning-wisdot-ss-511'], confidence: 'derived' as const, last_verified: D, note });
const ibc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const gec7 = { src: ['shoring_underpinning-fhwa-gec7'], confidence: 'verified' as const, last_verified: D };
const gec4 = { src: ['shoring_underpinning-fhwa-gec4'], confidence: 'verified' as const, last_verified: D };
const ss511 = { src: ['shoring_underpinning-wisdot-ss-511'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });

const RETAIN = 'shoring|soldier\\s*pile|lagging|sheet\\s*pil|soil\\s*nail|tie-?backs?|ground\\s+anchor|earth\\s+retention|excavation\\s+support';
const UNDERPIN = 'underpin';
const TRENCH = 'trench\\s+(?:box|shield|shoring)|hydraulic\\s+shor|speed\\s*shor|shield\\s+system';

export default definePack({
  key: 'shoring_underpinning',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Holds back the earth around a deep dig and keeps neighboring buildings standing — engineered soldier pile and lagging, sheet piling, soil nail walls and tiebacks, trench boxes and hydraulic shoring, and underpinning of adjacent footings in short alternating pits — with movement monitoring until the excavation is backfilled.',
    summary_es: 'Contiene la tierra alrededor de una excavación profunda y mantiene en pie los edificios vecinos — pilotes soldado con tablestacado de madera, tablestacas de acero, muros de suelo claveteado y anclajes, cajas de zanja y puntales hidráulicos, y recalce de zapatas vecinas en fosas cortas alternadas — con monitoreo de movimientos hasta rellenar la excavación.',
    glossary: [
      { term: 'Soldier pile and lagging', term_es: 'Pilote soldado con tablestacado', def: 'Steel H-piles set at intervals with timber boards (lagging) placed between them as the dig goes down.', def_es: 'Pilotes de acero H colocados a intervalos con tablones de madera (tablestacado) entre ellos a medida que avanza la excavación.' },
      { term: 'Sheet piling', term_es: 'Tablestaca de acero', def: 'Interlocking steel sheets driven or vibrated into the ground to form a continuous wall.', def_es: 'Planchas de acero entrelazadas hincadas o vibradas en el suelo para formar un muro continuo.' },
      { term: 'Soil nail', term_es: 'Clavo de suelo', def: 'A steel bar grouted into a drilled hole in the dig face; rows of nails plus shotcrete facing hold the soil top-down.', def_es: 'Barra de acero inyectada con lechada en un barreno de la cara excavada; filas de clavos más concreto lanzado sostienen el suelo de arriba hacia abajo.' },
      { term: 'Tieback (ground anchor)', term_es: 'Anclaje (tirante al terreno)', def: 'A grouted strand or bar anchor drilled behind the wall, load-tested and locked off to hold the wall back.', def_es: 'Anclaje de torón o barra inyectado detrás del muro, probado con carga y bloqueado para sostener el muro.' },
      { term: 'Lock-off load', term_es: 'Carga de bloqueo', def: 'The load left in a tieback after testing, held by the wedges or nut against the waler.', def_es: 'La carga que queda en el anclaje después de la prueba, retenida por las cuñas o la tuerca contra la viga de reparto.' },
      { term: 'Proof test', term_es: 'Prueba de comprobación', def: 'A load test with a short hold that shows a production anchor or nail carries its load without excessive creep.', def_es: 'Prueba de carga con una retención corta que muestra que un anclaje o clavo de producción soporta su carga sin fluencia excesiva.' },
      { term: 'Waler', term_es: 'Viga de reparto (larguero)', def: 'Horizontal beam across piles or sheets that spreads tieback or strut load into the wall.', def_es: 'Viga horizontal sobre pilotes o tablestacas que reparte la carga del anclaje o puntal al muro.' },
      { term: 'Underpinning pit', term_es: 'Fosa de recalce', def: 'A short hand-dug section under an existing footing filled with concrete to carry it to deeper bearing.', def_es: 'Sección corta excavada a mano bajo una zapata existente y llenada con concreto para llevarla a un apoyo más profundo.' },
      { term: 'Dry-pack', term_es: 'Mortero seco compactado', def: 'Stiff, low-water mortar rammed into the gap between new underpinning concrete and the old footing.', def_es: 'Mortero rígido con poca agua apisonado en el espacio entre el concreto nuevo del recalce y la zapata existente.' },
      { term: 'Monitoring point', term_es: 'Punto de monitoreo', def: 'A survey target on a wall, neighbor or street read on a schedule to catch movement early.', def_es: 'Un punto topográfico en un muro, edificio vecino o calle que se lee según un programa para detectar movimientos a tiempo.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'earth_retention_system',
      example_title: 'Soldier pile & lagging excavation support with tiebacks',
      when: { title_re: RETAIN },
      priority: 10,
      steps: [
        {
          title: 'Get the sealed shoring design and survey the neighbors',
          instruction: 'Do not start without the engineered shoring drawings on site — any support system outside the OSHA tables or over 20 ft deep needs a registered engineer’s design. Notify adjoining owners, then photo- and video-survey neighboring buildings, walls, streets and utilities and record existing cracks before any work.',
          detail: 'Read the design for the excavation sequence, maximum lift height, anchor/nail rows, test schedule and movement trigger levels. Any change to the sequence goes back to the designer first.',
          tools: ['shoring drawings and specs', 'camera / crack gauges', 'site plan with utility locates'],
          materials: [],
          safety_ids: ['shoring_design', 'utility_strike', 'undermining'],
          qa_ids: ['design_on_site', 'preconstruction_survey', 'locates_confirmed'],
          code_refs: [
            { section: '3307.1', code_type: 'IBC', note: 'Adjoining public and private property kept from damage during construction' },
            { section: '1804.1', code_type: 'IBC', note: 'Excavation may not remove lateral support of a footing without underpinning or protection' },
          ],
        },
        {
          title: 'Set monitoring points and read baselines',
          instruction: 'Have the surveyor install monitoring points on the top of the planned wall line, on neighboring structures and on nearby pavement, plus any inclinometers or crack monitors the design calls for. Take at least two baseline readings before excavation starts.',
          tools: ['total station / level', 'crack monitors', 'inclinometer readout where specified'],
          materials: ['survey targets / monitoring points'],
          safety_ids: ['struck_by_equipment'],
          qa_ids: ['monitoring_baseline'],
        },
        {
          title: 'Install soldier piles or sheets to plan',
          instruction: 'Drill and set soldier piles (concrete or lean-fill the holes as designed) or drive/vibrate sheet piles to the specified tip elevation. Check each pile’s location, plumbness and embedment as it goes in and record it on the pile log.',
          detail: 'Keep everyone out from under the hammer and the leads; use the hammer blocking device whenever someone must work beneath it. Weld only after clearing combustibles from the area.',
          tools: ['drill rig or vibratory / impact hammer', 'crane or excavator for handling', 'level / plumb bob', 'welder for pile caps or extensions'],
          materials: ['steel H-piles or sheet piling', 'concrete / lean fill for drilled holes'],
          safety_ids: ['pile_hammer', 'struck_by_equipment'],
          qa_ids: ['design_on_site'],
        },
        {
          title: 'Excavate in lifts and support each lift right away',
          instruction: 'Dig only the lift height the design allows, then place lagging boards, nails with shotcrete facing, or the tieback row before going deeper. Never dig more than about 2 ft below a row of anchors or struts that is not yet locked off, and pack or grout any voids behind the lagging.',
          detail: 'Soil running or sloughing between piles: stop, place lagging one board at a time and push shingles or plywood into the face. Water seeping through: call the engineer.',
          tools: ['excavator', 'drill rig for nails / anchors', 'grout plant', 'shotcrete rig where specified'],
          materials: ['timber lagging', 'soil nail bars or anchor tendons', 'grout', 'shotcrete with mesh where specified', 'strip drains'],
          safety_ids: ['cave_in', 'loose_face', 'competent_inspection', 'silica'],
          qa_ids: ['lift_height', 'lagging_tight', 'no_overexcavation'],
        },
        {
          title: 'Load-test and lock off anchors and nails',
          instruction: 'Test anchors and nails on the design schedule — performance tests on the first anchors and a small share of the rest, a proof test with a creep hold on every production anchor, proof tests on at least 5% of soil nails — and lock off each accepted anchor at the design load before digging below its row.',
          detail: 'Keep everyone not running the test out from behind the jack, barricade the area, and record every load step and dial-gauge reading on the test form.',
          tools: ['center-hole hydraulic jack and pump', 'calibrated pressure gauge / load cell', 'dial gauges on an independent support'],
          materials: ['anchor wedges / nuts and bearing plates'],
          safety_ids: ['jack_tensioning'],
          qa_ids: ['anchor_tests_logged', 'nail_proof_tests'],
        },
        {
          title: 'Monitor, then remove or abandon as designed',
          instruction: 'Read monitoring points on the design schedule and after heavy rain, and stop excavation and call the engineer if any reading reaches a trigger level. Once the permanent structure supports the ground, remove shoring from the bottom up, backfilling as members come out — or leave it in place only where the design allows.',
          tools: ['total station / level', 'excavator', 'compactor'],
          materials: ['backfill'],
          safety_ids: ['support_removal', 'competent_inspection'],
          qa_ids: ['monitoring_readings', 'removal_with_backfill'],
        },
      ],
    },
    {
      id: 'underpin_adjacent_footing',
      example_title: 'Underpin adjacent building footings',
      when: { title_re: UNDERPIN },
      priority: 30,
      steps: [
        {
          title: 'Confirm the underpinning design, sequence and neighbor survey',
          instruction: 'Get the engineer’s underpinning drawings with the pit widths, depths, bearing elevation and the pit sequence. Survey and photograph the building being underpinned, set monitoring points on it, and confirm the owner was notified before any digging near its footing.',
          tools: ['underpinning drawings', 'camera / crack gauges', 'total station / level'],
          materials: ['monitoring points'],
          safety_ids: ['undermining', 'shoring_design', 'utility_strike'],
          qa_ids: ['design_on_site', 'preconstruction_survey', 'monitoring_baseline'],
          code_refs: [
            { section: '1804.1', code_type: 'IBC', note: 'Footing lateral support protected or footing underpinned before nearby excavation' },
            { section: '3307.1', code_type: 'IBC', note: 'Adjoining owners notified and their property protected from construction damage' },
          ],
        },
        {
          title: 'Dig one pit at a time in the set sequence',
          instruction: 'Dig the approach pit, then hand-excavate under the footing only for the pit width shown — never open pits next to each other at the same time; skip pits per the sequence so the footing always bears on undisturbed soil on both sides. Sheet or lag the pit walls as you go down.',
          tools: ['mini-excavator or hand tools', 'conveyor / bucket for spoil', 'short lagging boards'],
          materials: ['timber lagging / sheeting for pit walls'],
          safety_ids: ['cave_in', 'undermining', 'loose_face', 'competent_inspection'],
          qa_ids: ['pit_sequence', 'lagging_tight'],
        },
        {
          title: 'Get the pit bottom checked before concrete',
          instruction: 'Clean the bottom to firm bearing at the design elevation, pump out water, and have the special inspector or geotechnical engineer verify the bearing soil before any concrete goes in.',
          tools: ['level / grade rod', 'trash pump', 'hand probe'],
          materials: [],
          safety_ids: ['cave_in', 'competent_inspection'],
          qa_ids: ['pit_bearing_verified'],
          gating_inspection_type: 'footing',
          code_refs: [{ section: '1705.6', code_type: 'IBC', note: 'Special inspection of soils and bearing for foundations' }],
        },
        {
          title: 'Pour, cure and dry-pack the pit',
          instruction: 'Place the reinforcing or dowels shown, pour concrete to a few inches below the existing footing, let it cure as specified, then ram stiff dry-pack mortar into the gap until it is fully packed against the old footing.',
          tools: ['concrete chute or pump', 'dry-pack rammer'],
          materials: ['concrete', 'dowels / rebar as designed', 'non-shrink dry-pack mortar'],
          safety_ids: ['silica'],
          qa_ids: ['drypack_full'],
        },
        {
          title: 'Backfill the approach pit and move to the next pit',
          instruction: 'Backfill and compact the approach pit, read the monitoring points, and only start the next pit in the sequence once the previous pit has reached its required cure time.',
          tools: ['plate compactor', 'total station / level'],
          materials: ['backfill'],
          safety_ids: ['support_removal'],
          qa_ids: ['monitoring_readings'],
        },
      ],
    },
    {
      id: 'trench_protective_system',
      example_title: 'Trench box / hydraulic shoring for deep sewer trench',
      when: { title_re: TRENCH },
      priority: 20,
      steps: [
        {
          title: 'Pick the protective system for the soil and depth',
          instruction: 'The competent person classifies the soil and picks the system: timber shoring from the OSHA appendix tables, aluminum hydraulic shoring or a trench shield per the manufacturer’s tabulated data, or an engineer’s design for anything outside those limits or over 20 ft deep. Keep the tabulated data at the trench.',
          tools: ['soil test kit (pocket penetrometer / thumb test)', 'manufacturer tabulated data'],
          materials: [],
          safety_ids: ['shoring_design', 'utility_strike'],
          qa_ids: ['design_on_site', 'locates_confirmed'],
        },
        {
          title: 'Inspect the box or shores before setting',
          instruction: 'Check the shield or hydraulic shores for bent members, cracked welds, leaking cylinders and missing pins. Take damaged equipment out of service until a competent person (or an engineer, if in doubt) clears it.',
          tools: ['inspection checklist'],
          materials: [],
          safety_ids: ['competent_inspection'],
          qa_ids: ['equipment_inspected'],
        },
        {
          title: 'Set protection before anyone enters',
          instruction: 'Install hydraulic shores from the top down without entering unprotected trench, or set the box as the trench is dug. Keep spoil 2 ft back and a ladder within 25 ft of every worker. Nobody rides or stays in the box while it is lifted, moved or set.',
          tools: ['excavator rated to lift the shield', 'shore installation tool', 'ladder'],
          materials: [],
          safety_ids: ['cave_in', 'shield_movement', 'loose_face'],
          qa_ids: ['equipment_inspected'],
        },
        {
          title: 'Remove protection from the bottom up with backfill',
          instruction: 'Backfill and compact as the shores or box come out, releasing shores from the bottom up slowly while watching for signs of movement. Never enter the trench below a removed shore.',
          tools: ['excavator', 'compactor'],
          materials: ['backfill'],
          safety_ids: ['support_removal'],
          qa_ids: ['removal_with_backfill'],
        },
      ],
    },
  ],
  code_refs: {
    footing: [
      { section: '1804.1', code_type: 'IBC', note: 'Excavation near footings — underpin or protect before removing lateral support', prov: ibc },
      { section: '1705.6', code_type: 'IBC', note: 'Special inspection of soils and bearing for foundations', prov: ibc },
      { section: '3307.1', code_type: 'IBC', note: 'Protection of adjoining property during construction', prov: ibc },
    ],
  },
  equipment: [
    { when: { title_re: `${RETAIN}|${UNDERPIN}|${TRENCH}` }, type: 'excavator', reason: 'Dig in lifts, handle lagging, set and pull trench shields' },
    { when: { title_re: 'soldier\\s*pile|sheet\\s*pil' }, type: 'crane', reason: 'Pick and set piles or sheets and the vibratory hammer', optional: true },
    { when: { title_re: 'soil\\s*nail|tie-?backs?|ground\\s+anchor|shotcrete' }, type: 'air_compressor', reason: 'Air for drilling nail and anchor holes and for shotcrete', optional: true },
    { when: { title_re: 'soldier\\s*pile|sheet\\s*pil|waler' }, type: 'welder', reason: 'Weld pile extensions, waler brackets and anchor bearing seats', optional: true },
    { when: { title_re: `${UNDERPIN}|${TRENCH}` }, type: 'compactor', reason: 'Compact backfill in approach pits and trenches as supports come out' },
  ],
  hazards: [
    { id: 'cave_in', hazard: 'Cave-in burying a worker in the excavation, an underpinning pit or a trench before or during support installation', hazard_es: PENDING_ES, controls: ['Protect every worker in an excavation 5 ft or deeper with an adequate protective system unless it is entirely in stable rock', 'Support each lift before digging the next one', 'Never enter an unprotected section to install shores'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, ppe: ['hard hat', 'high-visibility vest', 'steel-toe boots'], prov: osha('p') },
    { id: 'shoring_design', hazard: 'Support system overloaded or used outside its design (wrong soil, depth, surcharge or spacing)', hazard_es: PENDING_ES, controls: ['Use OSHA appendix tables, manufacturer tabulated data or a registered engineer’s design — engineer design required outside the tables and over 20 ft', 'Keep the design or tabulated data at the jobsite', 'Get written approval before deviating from the manufacturer’s limits'], controls_es: PENDING_ES, osha_ref: '1926.652(c)', severity: 4, prov: osha('p') },
    { id: 'undermining', hazard: 'Collapse of an adjoining building, wall or sidewalk when excavation goes below its footing', hazard_es: PENDING_ES, controls: ['Do not dig below a nearby footing unless it is underpinned or otherwise supported, the dig is in stable rock, or a registered engineer approves', 'Follow the pit sequence — never open adjacent pits at once', 'Watch monitoring points and stop at trigger levels'], controls_es: PENDING_ES, osha_ref: '1926.651(i)(2)', severity: 4, prov: osha('p') },
    { id: 'support_removal', hazard: 'Cave-in or being struck by members while shoring is removed', hazard_es: PENDING_ES, controls: ['Remove supports starting at the bottom and release members slowly while watching for movement', 'Backfill as supports are removed', 'Add temporary members before removing any individual member'], controls_es: PENDING_ES, osha_ref: '1926.652(e)(1)', severity: 3, prov: osha('p') },
    { id: 'shield_movement', hazard: 'Worker crushed or exposed while a trench shield is lifted, moved or set', hazard_es: PENDING_ES, controls: ['No one inside a shield while it is installed, removed or moved vertically', 'Install shields so they cannot shift sideways under sudden load', 'Protect workers entering and leaving the shield'], controls_es: PENDING_ES, osha_ref: '1926.652(g)(1)', severity: 4, prov: osha('p') },
    { id: 'loose_face', hazard: 'Soil or rock falling from the open face between lagging boards or from the pit wall', hazard_es: PENDING_ES, controls: ['Scale loose material or install barricades on the face', 'Keep spoil, materials and equipment at least 2 ft from the edge', 'Lag tightly and fill voids as soon as the lift is dug'], controls_es: PENDING_ES, osha_ref: '1926.651(j)(1)', severity: 3, ppe: ['hard hat'], prov: osha('p') },
    { id: 'competent_inspection', hazard: 'Missed warning signs — cracks behind the wall, bulging lagging, seepage, anchor or shore distress', hazard_es: PENDING_ES, controls: ['Competent person inspects the excavation, adjacent areas and support system before each shift, as needed, and after rain', 'Remove workers when signs of failure appear until the condition is fixed'], controls_es: PENDING_ES, osha_ref: '1926.651(k)(1)', severity: 3, prov: osha('p') },
    { id: 'utility_strike', hazard: 'Drilling or driving a pile, nail or anchor into a buried utility', hazard_es: PENDING_ES, controls: ['Locate underground utilities before opening an excavation or drilling', 'Hand-expose lines near pile, nail and anchor locations and check anchor paths under streets'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'pile_hammer', hazard: 'Struck or crushed by a pile hammer, leads or swinging pile', hazard_es: PENDING_ES, controls: ['Place the hammer blocking device in the leads whenever anyone works under the hammer', 'Use stop blocks so the hammer cannot hit the head block', 'Keep workers clear of a pile being picked and stabbed'], controls_es: PENDING_ES, osha_ref: '1926.603(a)(5)', severity: 4, ppe: ['hard hat', 'steel-toe boots'], prov: osha('o') },
    { id: 'jack_tensioning', hazard: 'Struck by a tendon, wedge or jack if an anchor or nail fails during load testing or lock-off', hazard_es: PENDING_ES, controls: ['Only workers essential to the test stand near the jack — never behind it', 'Put up signs and barriers to keep others out of the stressing area'], controls_es: PENDING_ES, osha_ref: '1926.701(c)(1)', severity: 4, ppe: ['face shield', 'hard hat'], prov: osha('q') },
    { id: 'silica', hazard: 'Breathing silica dust from shotcrete, drilling rock or chipping concrete for underpinning', hazard_es: PENDING_ES, controls: ['Use water or dust collection on drilling and chipping', 'Follow the written exposure control plan and use respirators where required'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 3, ppe: ['respirator where required', 'safety glasses'], prov: osha('z') },
    { id: 'struck_by_equipment', hazard: 'Struck by an excavator, drill rig or crane load moving on a tight shoring site', hazard_es: PENDING_ES, controls: ['Barricade the swing radius of cranes and rotating rigs and train crews to stay out of it', 'Use a signal person where the operator’s view is blocked'], controls_es: PENDING_ES, osha_ref: '1926.1424(a)(2)', severity: 3, ppe: ['high-visibility vest'], prov: osha('cc') },
  ],
  qa_checklist: [
    { id: 'design_on_site', item: 'Sealed shoring/underpinning design — or the manufacturer or OSHA tabulated data used — in writing on site, matching the dig depth, soil and surcharge loads present.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-p', 'shoring_underpinning-wisdot-ss-511'], confidence: 'verified', last_verified: D } },
    { id: 'locates_confirmed', item: 'Utilities located and hand-exposed near every pile, nail and anchor location before drilling or driving.', item_es: PENDING_ES, safety: true, prov: osha('p') },
    { id: 'preconstruction_survey', item: 'Preconstruction photo/video survey of adjoining buildings, walls and pavement completed, existing cracks recorded, and owners notified.', item_es: tr('Inspección con fotos y video de edificios, muros y pavimentos vecinos hecha antes de construir, grietas existentes registradas y dueños notificados.'), prov: ibc },
    { id: 'monitoring_baseline', item: 'Monitoring points installed and at least two baseline readings recorded before excavation; trigger levels from the design posted.', item_es: tr('Puntos de monitoreo instalados y al menos dos lecturas base registradas antes de excavar; niveles de alerta del diseño publicados.'), prov: gec4 },
    { id: 'lift_height', item: 'Excavation lifts no deeper than the design allows (soil nails typically 3–5 ft) and each lift supported before the next is dug.', item_es: PENDING_ES, safety: true, prov: gec7 },
    { id: 'lagging_tight', item: 'Lagging placed top-down immediately after each lift, tight to the soil with voids packed or grouted — no running soil between boards.', item_es: tr('Tablestacado colocado de arriba hacia abajo justo después de cada capa, apretado contra el suelo con huecos rellenos — sin suelo escurriendo entre tablones.'), prov: gec4 },
    { id: 'no_overexcavation', item: 'No digging more than about 2 ft below an anchor or strut row until that row is installed and locked off.', item_es: PENDING_ES, safety: true, prov: gec4 },
    { id: 'anchor_tests_logged', item: 'Performance tests on the first anchors and the specified share of the rest, proof test with creep hold on every production anchor, each accepted anchor locked off at design load — all readings on the test form.', item_es: tr('Pruebas de desempeño en los primeros anclajes y en la parte especificada del resto, prueba de comprobación con retención de fluencia en cada anclaje de producción, cada anclaje aceptado bloqueado a la carga de diseño — todas las lecturas en el formato.'), prov: gec4 },
    { id: 'nail_proof_tests', item: 'Soil nail verification tests done before production and proof tests on at least 5% of production nails, picked where drilling or grout take looked unusual.', item_es: tr('Pruebas de verificación de clavos antes de producción y pruebas de comprobación en al menos 5% de los clavos de producción, elegidos donde la perforación o el consumo de lechada fueron inusuales.'), prov: gec7 },
    { id: 'pit_sequence', item: 'Underpinning pits dug one at a time in the engineer’s sequence — no two adjacent pits open together and each pit no wider than shown.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-p', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'Alternating-pit practice that keeps the footing supported while underpinning per 1926.651(i) and IBC 1804.1; pit width and order come from the design.' } },
    { id: 'pit_bearing_verified', item: 'Each underpinning pit bottom clean, dry and at design bearing elevation, verified by the special inspector or geotechnical engineer before concrete.', item_es: tr('Fondo de cada fosa de recalce limpio, seco y a la cota de apoyo de diseño, verificado por el inspector especial o el ingeniero geotécnico antes del concreto.'), prov: ibc },
    { id: 'drypack_full', item: 'Dry-pack rammed solid across the full gap between new concrete and the existing footing after the specified cure — no voids when sounded.', item_es: tr('Mortero seco apisonado sólido en todo el espacio entre el concreto nuevo y la zapata existente después del curado especificado — sin huecos al golpear.'), prov: est('Common underpinning practice; cure time and dry-pack mix come from the design.') },
    { id: 'equipment_inspected', item: 'Shields, hydraulic shores and lagging free of damage; damaged items tagged out until a competent person (or engineer) clears them.', item_es: PENDING_ES, safety: true, prov: osha('p') },
    { id: 'monitoring_readings', item: 'Monitoring readings taken on schedule and after heavy rain, compared to trigger levels, and sent to the engineer; work stopped at any trigger.', item_es: PENDING_ES, safety: true, prov: gec4 },
    { id: 'removal_with_backfill', item: 'Shoring removed from the bottom up with backfill placed and compacted as members come out, or left in place only where the design allows.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-p', 'shoring_underpinning-wisdot-ss-511'], confidence: 'verified', last_verified: D } },
  ],
  inspection_checklists: {
    footing: [
      { item: 'Underpinning pit at design bearing elevation on firm soil; free of water and loose material', item_es: PENDING_ES, ref: '1705.6' },
      { item: 'Pit width and pit order match the underpinning drawings; no adjacent pits open together', item_es: PENDING_ES, ref: '1804.1' },
      { item: 'Pit walls supported and safe for the inspector to enter', item_es: PENDING_ES, ref: '1926.652(a)(1)' },
    ],
    shoring_design_review: [
      { item: 'Sealed shoring design received for each location, with sequence, lift heights and test schedule', item_es: PENDING_ES, ref: '1926.652(c)(4)' },
      { item: 'Adjoining owners notified and preconstruction survey on file', item_es: PENDING_ES, ref: '3307.1' },
    ],
    anchor_testing: [
      { item: 'Performance and proof test records complete; creep within the acceptance limit for each tested anchor', item_es: PENDING_ES },
      { item: 'Each anchor locked off at design load before excavation goes below its row', item_es: PENDING_ES },
      { item: 'Soil nail proof tests cover at least 5% of production nails', item_es: PENDING_ES },
    ],
    movement_monitoring: [
      { item: 'Baseline readings taken before excavation; readings logged on the design schedule', item_es: PENDING_ES },
      { item: 'No reading at or above the trigger level — or the engineer has responded in writing', item_es: PENDING_ES },
      { item: 'Neighboring structures show no new cracks against the preconstruction survey', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-SHO-SPL-SF', name: 'Temporary soldier pile & timber lagging shoring, per SF of exposed wall face', name_es: 'Apuntalamiento temporal con pilotes soldado y tablestacado de madera, por pie cuadrado de cara expuesta', unit: 'SF', csi: '31 41 00',
      description: 'Engineer-designed cantilever soldier pile and lagging, installed and removed; measured as exposed face from ground line to 1 ft above retained grade (WisDOT 511.4). Tiebacks priced separately (B-SHO-TIEBACK-EA).',
      material_cost_cents: { v: 1200, prov: aup('WisDOT 511.1200 Temporary Shoring (structure) FY23/FY24 ≈ $36.93/$36.24 per SF (FY25 $99.19 outlier excluded); ≈ $12 taken as steel pile share + lagging.') },
      labor_hours_per_unit: { v: 0.15, prov: aup('Balance of the ≈ $36.6/SF WisDOT average split between crew time and rig/crane time; includes design + removal per 511.5.') },
      equipment_cost_cents: { v: 1000, prov: aup('Drill rig / crane / excavator share of the WisDOT 511.1200 FY23–24 average.') },
      waste_pct: { v: 5, prov: est('lagging cut-off and breakage') } },
    { code: 'B-SHO-SNAIL-SF', name: 'Soil nail wall with temporary shotcrete facing, per SF of wall face', name_es: 'Muro de suelo claveteado con revestimiento temporal de concreto lanzado, por pie cuadrado de cara', unit: 'SF', csi: '31 32 36',
      description: 'Drilled and grouted soil nails, strip drains, ~4 in. mesh-reinforced shotcrete facing, bearing plates; testing per GEC 7. Permanent CIP facing not included.',
      material_cost_cents: { v: 1100, prov: est('Nail bars, grout, mesh, shotcrete and plates per SF at typical 5 ft × 5 ft nail spacing, national baseline 2026') },
      labor_hours_per_unit: { v: 0.2, prov: est('Drill, grout, place drains and mesh, shoot facing — crew-hours per SF of face') },
      equipment_cost_cents: { v: 900, prov: est('Drill rig, grout plant, shotcrete rig and compressor time share') },
      waste_pct: { v: 10, prov: est('shotcrete rebound and grout loss') } },
    { code: 'B-SHO-TIEBACK-EA', name: 'Tieback ground anchor — drill, grout, test and lock off, each', name_es: 'Anclaje al terreno (tirante) — perforar, inyectar, probar y bloquear, c/u', unit: 'EA', csi: '31 51 00',
      description: 'Temporary strand or bar anchor through the waler, ≈40–60 ft long, including proof/performance testing and lock-off per GEC 4. Waler steel priced with the wall.',
      material_cost_cents: { v: 90000, prov: est('Strand or bar tendon, sheathing, grout, bearing plate and wedges, national baseline 2026') },
      labor_hours_per_unit: { v: 16, prov: est('Drill, install, grout, stress/test and lock off — crew-hours per anchor') },
      equipment_cost_cents: { v: 120000, prov: est('Anchor drill rig, grout plant, stressing jack and gauges time share per anchor') },
      waste_pct: { v: 5, prov: est('tendon tail cut-off and grout loss') } },
    { code: 'B-SHO-TBOX-DAY', name: 'Trench shield (trench box) rental and setting, per day', name_es: 'Caja de zanja (escudo) — renta y colocación, por día', unit: 'DAY', csi: '31 41 33',
      description: 'Steel or aluminum trench shield sized for the trench, delivered, set and moved by the excavating crew. Excavator time is in the excavation line.',
      material_cost_cents: { v: 0, prov: est('rental, no material') },
      labor_hours_per_unit: { v: 0.5, prov: est('Daily share of rigging and repositioning the shield') },
      equipment_cost_cents: { v: 25000, prov: est('Trench shield daily rental incl. delivery share, national baseline 2026') },
      waste_pct: { v: 0, prov: est('rental') } },
    { code: 'B-SHO-UNDERPIN-EA', name: 'Underpinning pit under an existing footing — excavate, pour and dry-pack, each', name_es: 'Fosa de recalce bajo zapata existente — excavar, colar y compactar mortero seco, c/u', unit: 'EA', csi: '31 48 00',
      description: 'One ≈4 ft wide hand-dug pit ≈4–6 ft below the existing footing with lagged walls, dowels, concrete and dry-pack. Engineering, monitoring and special inspection not included.',
      material_cost_cents: { v: 45000, prov: est('≈1.5 CY concrete, dowels, lagging and non-shrink dry-pack per pit, national baseline 2026') },
      labor_hours_per_unit: { v: 20, prov: est('Hand excavation under the footing, lagging, pour and dry-pack — crew-hours per pit') },
      equipment_cost_cents: { v: 15000, prov: est('Mini-excavator / conveyor and small pump share per pit') },
      waste_pct: { v: 10, prov: est('concrete over-pour and dry-pack waste') } },
  ],
  dependency_hints: [
    { after_trades: ['demolition', 'surveying'], before_phase: 'foundation', note: 'Shoring and underpinning go in after demolition and survey layout, ahead of mass excavation below adjacent footings and the new foundation.' },
    { after_trades: ['excavation'], note: 'Shoring removal follows the permanent walls and backfill; trench protection moves with the utility excavation.' },
  ],
});
