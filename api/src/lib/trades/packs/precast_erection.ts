// Trade Knowledge Pack — precast_erection (Precast / Tilt-Up Concrete Erection). Wave 11 — NEW-TRADE
// pattern (no hand recipe, no template tasks). Dossier: docs/trade-packs/dossiers/precast_erection.md.
// Sources: 29 CFR 1926.704 (precast concrete), 1926.701, 1926.501(b)(12), Subpart CC (cranes), H, J, Z;
// UFGS 03 41 33 (Precast Structural Pretensioned Concrete) + UFGS 03 47 13 (Tilt-Up Concrete), Part 3;
// PCI + TCA and ICC IBC (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgsPc = { src: ['precast_erection-ufgs-03-41-33'], confidence: 'verified' as const, last_verified: D };
const ufgsTu = { src: ['precast_erection-ufgs-03-47-13'], confidence: 'verified' as const, last_verified: D };
const o704 = { src: ['precast_erection-ecfr-1926-704'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };

export default definePack({
  key: 'precast_erection',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Erects plant-made precast concrete — hollowcore planks, double tees, beams, columns and wall panels — and site-cast tilt-up wall panels: bearing pads and shims, crane lift planning, setting to tolerance, temporary bracing until permanent connections are made, welded or grouted connections, keyway and joint grouting, and patching lifting points.',
    summary_es: 'Monta concreto prefabricado (losas alveolares, dobles T, vigas, columnas, paneles) y paneles tilt-up colados en obra: almohadillas y calzas, plan de izaje con grúa, colocación a tolerancia, arriostramiento temporal hasta las conexiones permanentes, conexiones soldadas o con mortero, relleno de juntas y resane de puntos de izaje.',
    glossary: [
      { term: 'Hollowcore plank', term_es: 'Losa alveolar', def: 'Precast prestressed floor or roof slab with round voids running its full length, usually 4 ft wide.', def_es: 'Losa prefabricada pretensada de piso o techo con huecos redondos a todo lo largo, normalmente de 4 pies de ancho.' },
      { term: 'Double tee', term_es: 'Doble T', def: 'Precast floor or roof member with a flat top flange and two stems underneath, common in parking decks.', def_es: 'Elemento prefabricado de piso o techo con un ala superior plana y dos almas abajo, común en estacionamientos.' },
      { term: 'Tilt-up panel', term_es: 'Panel tilt-up (de volteo)', def: 'Concrete wall panel cast flat on the building slab, then tilted up by crane and braced in place.', def_es: 'Panel de muro de concreto colado plano sobre la losa del edificio, luego levantado con grúa y arriostrado en su lugar.' },
      { term: 'Bearing pad', term_es: 'Almohadilla de apoyo', def: 'Elastomeric or plastic pad under a member end that spreads its load and lets it move slightly.', def_es: 'Almohadilla elastomérica o plástica bajo el extremo de un elemento que reparte la carga y permite un leve movimiento.' },
      { term: 'Lifting insert', term_es: 'Inserto de izaje', def: 'Anchor cast into the concrete that the crane rigging clips onto to lift the piece.', def_es: 'Anclaje colado en el concreto donde se engancha el aparejo de la grúa para levantar la pieza.' },
      { term: 'Keyway', term_es: 'Llave de cortante (junta)', def: 'Shaped joint between planks that is filled with grout so the planks act together.', def_es: 'Junta perfilada entre losas que se rellena con mortero para que trabajen juntas.' },
      { term: 'Bond breaker', term_es: 'Desmoldante (rompe-adherencia)', def: 'Liquid coating on the casting slab that keeps a tilt-up panel from sticking to it.', def_es: 'Recubrimiento líquido sobre la losa de colado que evita que el panel tilt-up se pegue.' },
      { term: 'Pipe brace', term_es: 'Puntal de tubo', def: 'Adjustable diagonal brace bolted to the panel and slab that holds a panel plumb until the structure ties it in.', def_es: 'Puntal diagonal ajustable atornillado al panel y a la losa que lo mantiene a plomo hasta que la estructura lo amarra.' },
      { term: 'Weld plate (embed)', term_es: 'Placa de soldar (embebida)', def: 'Steel plate cast into a precast piece that is welded to a matching plate to make the connection.', def_es: 'Placa de acero colada en la pieza prefabricada que se suelda a otra placa para formar la conexión.' },
      { term: 'Dry pack', term_es: 'Mortero seco compactado', def: 'Stiff non-shrink grout rammed into a gap such as under a panel base or a lifting pocket.', def_es: 'Mortero sin contracción de consistencia seca apisonado en un hueco, como bajo la base del panel o en un hueco de izaje.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'precast_erection',
      example_title: 'Erect precast hollowcore planks',
      when: { title_re: 'precast|hollow[- ]?core|double[- ]?tees?|wall\\s+panels?\\s+erect|erect\\w*\\s+(?:precast|wall\\s+panels?)' },
      steps: [
        {
          title: 'Verify bearings, embeds and piece strength',
          instruction: 'Check bearing walls, beams, ledges and embedded plates or anchor bolts against the erection drawings for location and elevation, and report misplaced items before the crane arrives. Get written word that the precast pieces have reached the strength the drawings require and that the supporting structure can take the loads.',
          tools: ['erection drawings', 'tape measure', 'transit or laser level'],
          materials: [],
          safety_ids: ['impalement'],
          qa_ids: ['bearing_survey', 'piece_strength', 'construction_loads'],
        },
        {
          title: 'Plan the picks and set up the crane',
          instruction: 'Walk the site with the crane operator: firm, drained, level ground for outriggers, power-line distances, delivery route and a pick sequence that keeps loads off people. Barricade the swing radius. Inspect slings, shackles and spreader bars and check every lifting insert type against the shop drawings.',
          tools: ['lift plan', 'tag lines', 'spreader bar', 'barricade tape'],
          materials: ['cribbing / outrigger mats'],
          safety_ids: ['crane_ground', 'power_line', 'swing_radius', 'rigging'],
          qa_ids: ['lift_plan', 'rigging_rated'],
        },
        {
          title: 'Set bearing pads, shims and pieces',
          instruction: 'Place bearing pads or shim stacks in the exact spots shown, on clean bearing. Lift each piece by its designed inserts only, land it on the pads with full seat — at least the end bearing the drawings call for — and butt planks or tees tight end to end and side to side. Keep everyone not needed for the set out from under the load.',
          detail: 'Erectors working 6 ft or more above a lower level need guardrails, nets or personal fall arrest unless a written fall protection plan applies.',
          tools: ['crane', 'pry bars', 'tag lines', 'level'],
          materials: ['bearing pads', 'shim packs'],
          safety_ids: ['under_load', 'lifting_inserts', 'lifting_hardware', 'fall_6ft'],
          qa_ids: ['bearing_pads', 'end_bearing', 'tolerances'],
        },
        {
          title: 'Brace, connect and weld',
          instruction: 'Brace walls, columns and panels as soon as they are set and before the crane releases them; leave bracing until every permanent connection is complete. Make welded connections with clean plates and the specified electrode, check weld size and length, and grind out cracked or porous welds. Protect nearby materials from sparks and keep a fire watch.',
          tools: ['welder', 'grinder', 'weld gauge', 'impact wrench', 'boom lift'],
          materials: ['connection plates / angles', 'electrodes', 'bolts', 'temporary braces'],
          safety_ids: ['overturn', 'fall_6ft', 'weld_fire'],
          qa_ids: ['temp_bracing', 'weld_quality'],
          gating_inspection_type: 'framing',
          code_refs: [
            { section: '1705.3', code_type: 'IBC', note: 'Special inspection of concrete construction, including erection of precast members' },
            { section: '1705.2', code_type: 'IBC', note: 'Special inspection of steel connections and welding where required' },
            { section: '1901.2', code_type: 'IBC', note: 'Structural concrete designed and built per ACI 318' },
          ],
        },
        {
          title: 'Grout keyways and joints, touch up',
          instruction: 'After pieces are set and connected, form and fill keyways, column bases and connection pockets solid with the specified grout, finish flush with the slab top and keep it damp at least a day. Do not core or cut planks unless the supplier approved the location — never cut strands. Wire-brush and prime weld plates and sweep the deck for the next trade.',
          tools: ['grout pump or buckets', 'trowels', 'wire brush', 'concrete saw'],
          materials: ['non-shrink grout', 'cement grout', 'joint tape / backer', 'touch-up primer'],
          safety_ids: ['silica', 'fall_6ft'],
          qa_ids: ['keyway_grout', 'field_cuts', 'touch_up'],
          gating_inspection_type: 'final',
        },
      ],
    },
    {
      id: 'tilt_up',
      example_title: 'Cast and erect tilt-up wall panels',
      priority: 10,
      when: { title_re: 'tilt[- ]?up' },
      steps: [
        {
          title: 'Prepare the casting slab',
          instruction: 'Clean the slab where each panel will be cast, keep panels off floor joints where possible, caulk joints and patch openings in the casting area. Lay out panel edges, openings and reveals from the panel drawings and build edge forms.',
          tools: ['chalk line', 'tape measure', 'saw', 'caulk gun'],
          materials: ['edge form lumber', 'joint caulk / patch'],
          safety_ids: ['impalement'],
          qa_ids: ['bearing_survey'],
        },
        {
          title: 'Apply bond breaker, set rebar and inserts',
          instruction: 'Spray bond breaker on the casting slab before any steel goes down, and re-coat scuffed spots without coating the bars. Place rebar on plastic or plastic-tipped chairs, then set lifting inserts, brace inserts and weld embeds exactly where the panel engineer’s layout shows. Cap or bend protruding bar ends.',
          tools: ['pump sprayer', 'rebar tier', 'tape measure'],
          materials: ['bond breaker', 'rebar and chairs', 'lifting inserts', 'brace inserts', 'weld embeds'],
          safety_ids: ['impalement', 'lifting_inserts'],
          qa_ids: ['insert_layout'],
        },
        {
          title: 'Cast and cure the panels',
          instruction: 'Pour and vibrate each panel full depth without moving inserts or bars, finish the faces as specified, then cure them. Make test cylinders with each pour — panels do not lift until the cylinders show the strength on the drawings.',
          tools: ['vibrator', 'screed', 'trowels', 'cylinder molds'],
          materials: ['concrete', 'curing compound or wet curing'],
          safety_ids: ['silica'],
          qa_ids: ['piece_strength'],
        },
        {
          title: 'Lift, set and brace panels',
          instruction: 'Set the leveling shims or mortar pads at each panel base. Rig to the inserts with the engineered spreader and sheave setup, tilt the panel, swing it onto its base, plumb it and attach the braces before the crane lets go. Keep everyone out of the panel’s fall zone during the tilt.',
          detail: 'Never leave a panel hanging or unbraced in wind; check brace bolts and deadmen after storms.',
          tools: ['crane', 'spreader bars / sheaves', 'adjustable pipe braces', 'level / plumb laser'],
          materials: ['leveling shims or setting pads', 'brace anchors'],
          safety_ids: ['overturn', 'under_load', 'lifting_inserts', 'lifting_hardware', 'swing_radius', 'crane_ground'],
          qa_ids: ['temp_bracing', 'tolerances', 'rigging_rated'],
          gating_inspection_type: 'framing',
          code_refs: [
            { section: '1705.3', code_type: 'IBC', note: 'Special inspection of concrete construction, including erection of precast members' },
            { section: '1901.2', code_type: 'IBC', note: 'Structural concrete designed and built per ACI 318' },
          ],
        },
        {
          title: 'Connect, grout and remove braces',
          instruction: 'Weld or bolt panel connections, dry-pack the panel bases and pour any closure strips. Remove braces only after the roof deck and other permanent lateral connections the engineer lists are complete and inspected. Dry-pack lifting holes and patch the faces to match.',
          tools: ['welder', 'grinder', 'impact wrench', 'boom lift'],
          materials: ['non-shrink dry-pack grout', 'connection hardware', 'patching mortar'],
          safety_ids: ['overturn', 'fall_6ft', 'weld_fire'],
          qa_ids: ['brace_removal', 'weld_quality', 'keyway_grout'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    framing: [
      { section: '1705.3', code_type: 'IBC', note: 'Special inspection of concrete construction, including erection of precast members', prov: icc },
      { section: '1705.2', code_type: 'IBC', note: 'Special inspection of steel connections and welding where required', prov: icc },
      { section: '1901.2', code_type: 'IBC', note: 'Structural concrete designed and built per ACI 318', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: 'precast|hollow[- ]?core|double[- ]?tees?|tilt[- ]?up|wall\\s+panels?' }, type: 'crane', reason: 'Lift and set precast members and tilt panels into place', optional: false },
    { when: { title_re: 'precast|hollow[- ]?core|double[- ]?tees?|tilt[- ]?up|wall\\s+panels?' }, type: 'boom_lift', reason: 'Reach connections and brace tops at height' },
    { when: { title_re: 'precast|tilt[- ]?up|connect|weld' }, type: 'welder', reason: 'Field-weld embed plates and connection hardware' },
    { when: { title_re: 'tilt[- ]?up' }, type: 'telehandler', reason: 'Place braces, rebar bundles and forms around the casting slab', optional: true },
  ],
  hazards: [
    { id: 'overturn', hazard: 'Wall panel, column or tilt-up panel tips over or collapses before permanent connections', hazard_es: PENDING_ES, controls: ['Brace or support every piece before the crane releases it', 'Leave bracing until permanent connections and the lateral system are complete', 'Stop work and re-check braces in high wind'], controls_es: PENDING_ES, osha_ref: '1926.704(a)', severity: 4, prov: o704 },
    { id: 'lifting_inserts', hazard: 'Lifting insert pulls out of the concrete during a pick', hazard_es: PENDING_ES, controls: ['Use only the inserts designed for the piece, at the engineer’s locations', 'Tilt-up inserts rated at least 2× and other precast inserts at least 4× the maximum load', 'Do not lift before the concrete reaches the lifting strength'], controls_es: PENDING_ES, osha_ref: '1926.704(b)', severity: 4, prov: o704 },
    { id: 'lifting_hardware', hazard: 'Clutch, shackle or spreader fails under load', hazard_es: PENDING_ES, controls: ['Lifting hardware rated at least 5× the maximum intended load', 'Match clutches to the insert system; inspect before each use'], controls_es: PENDING_ES, osha_ref: '1926.704(d)', severity: 4, prov: o704 },
    { id: 'under_load', hazard: 'Struck or crushed under a member being lifted or tilted', hazard_es: PENDING_ES, controls: ['Only the erectors needed for the set stand under or near a lifted or tilting member', 'Use tag lines; mark the panel fall zone and keep it clear'], controls_es: PENDING_ES, osha_ref: '1926.704(e)', severity: 4, ppe: ['hard hat', 'high-visibility vest'], prov: o704 },
    { id: 'fall_6ft', hazard: 'Fall from deck edges, open plank bays or panel tops while erecting or grouting', hazard_es: PENDING_ES, controls: ['At 6 ft or more use guardrails, safety nets or personal fall arrest', 'Where infeasible, follow a written site-specific fall protection plan'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(12)', severity: 4, ppe: ['full-body harness', 'self-retracting lifeline'], prov: osha('m') },
    { id: 'swing_radius', hazard: 'Caught or struck by the crane’s rotating superstructure', hazard_es: PENDING_ES, controls: ['Barricade the counterweight swing area', 'Tell the operator before entering any area out of view'], controls_es: PENDING_ES, osha_ref: '1926.1424(a)(2)', severity: 4, prov: osha('cc') },
    { id: 'power_line', hazard: 'Crane boom, load line or panel contacts overhead power lines', hazard_es: PENDING_ES, controls: ['Identify the work zone and power-line distances before setup', 'De-energize, keep clearance or use a dedicated spotter'], controls_es: PENDING_ES, osha_ref: '1926.1408(a)', severity: 4, prov: osha('cc') },
    { id: 'crane_ground', hazard: 'Crane tips when outriggers sink on soft or unlevel ground near the slab edge', hazard_es: PENDING_ES, controls: ['Set up only on firm, drained, graded ground with mats or cribbing as needed', 'Keep outriggers away from fresh backfill and slab edges'], controls_es: PENDING_ES, osha_ref: '1926.1402(b)', severity: 4, prov: osha('cc') },
    { id: 'rigging', hazard: 'Defective slings or rigging drop a load', hazard_es: PENDING_ES, controls: ['Inspect rigging before each shift and remove defective gear', 'Use only tagged rigging within its rated load'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 4, prov: osha('h') },
    { id: 'impalement', hazard: 'Falling onto protruding rebar or dowels at bearings and casting beds', hazard_es: PENDING_ES, controls: ['Cap or guard protruding bars that someone could fall on'], controls_es: PENDING_ES, osha_ref: '1926.701(b)', severity: 3, prov: osha('q') },
    { id: 'weld_fire', hazard: 'Sparks and slag from connection welding start a fire', hazard_es: PENDING_ES, controls: ['Move or shield combustibles before welding', 'Keep an extinguisher and a fire watch at the work'], controls_es: PENDING_ES, osha_ref: '1926.352(a)', severity: 3, ppe: ['welding helmet', 'leather gloves'], prov: osha('j') },
    { id: 'silica', hazard: 'Breathing silica dust while cutting, coring or grinding concrete', hazard_es: PENDING_ES, controls: ['Use saws and grinders with water or dust collection per the OSHA silica table', 'Wear the respirator the table calls for indoors or for long tasks'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator as required', 'safety glasses'], prov: osha('z') },
  ],
  qa_checklist: [
    { id: 'bearing_survey', item: 'Bearing surfaces, footings, ledges, embeds and anchor bolts checked for level and location against the erection drawings; misplaced items resolved with the engineer before setting.', item_es: { status: 'translated', text: 'Superficies de apoyo, zapatas, ménsulas, embebidos y pernos de anclaje revisados en nivel y ubicación contra los planos de montaje; elementos mal ubicados resueltos con el ingeniero antes de colocar.' }, prov: { src: ['precast_erection-ufgs-03-41-33', 'precast_erection-ufgs-03-47-13'], confidence: 'verified', last_verified: D } },
    { id: 'piece_strength', item: 'Precast pieces and tilt-up panels reached the specified strength before lifting (plant records or field cylinder breaks on file).', item_es: { status: 'translated', text: 'Las piezas prefabricadas y paneles tilt-up alcanzaron la resistencia especificada antes del izaje (registros de planta o ensayos de cilindros en obra archivados).' }, prov: { src: ['precast_erection-ufgs-03-41-33', 'precast_erection-ufgs-03-47-13'], confidence: 'verified', last_verified: D } },
    { id: 'construction_loads', item: 'A qualified structural designer confirmed the supporting structure can carry erection and stacking loads.', item_es: PENDING_ES, safety: true, prov: osha('q') },
    { id: 'lift_plan', item: 'Written lift plan with crane location, ground support, pick weights and swing area barricades reviewed before the first pick.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'rigging_rated', item: 'Inserts, clutches and spreaders match the shop drawings and are rated for the pick; rigging inspected that shift.', item_es: PENDING_ES, safety: true, prov: o704 },
    { id: 'bearing_pads', item: 'Bearing pads in the positions shown, giving uniform bearing, and still in place after the piece is set.', item_es: { status: 'translated', text: 'Almohadillas de apoyo en las posiciones indicadas, con apoyo uniforme y aún en su lugar después de colocar la pieza.' }, prov: ufgsPc },
    { id: 'end_bearing', item: 'Slab members land with at least the end bearing on the drawings (not less than 3 in.) and are butted tight end to end and side to side.', item_es: { status: 'translated', text: 'Las losas apoyan con al menos el apoyo de extremo de los planos (no menos de 3 pulg.) y quedan juntas a tope en extremos y costados.' }, prov: ufgsPc },
    { id: 'tolerances', item: 'Members within the erection tolerances on the drawings for location, plumb and elevation; adjacent planks flush.', item_es: { status: 'translated', text: 'Elementos dentro de las tolerancias de montaje de los planos en ubicación, plomo y elevación; losas contiguas al ras.' }, prov: { src: ['precast_erection-ufgs-03-41-33', 'precast_erection-ufgs-03-47-13'], confidence: 'verified', last_verified: D } },
    { id: 'temp_bracing', item: 'Every wall unit, column and tilt-up panel braced before crane release; braces stay until permanent connections are complete.', item_es: PENDING_ES, safety: true, prov: o704 },
    { id: 'weld_quality', item: 'Connection welds on clean plates, correct size and length; cracked, porous or undersized welds repaired; special inspection signed where required.', item_es: { status: 'translated', text: 'Soldaduras de conexión sobre placas limpias, con tamaño y longitud correctos; soldaduras agrietadas, porosas o pequeñas reparadas; inspección especial firmada donde se requiera.' }, prov: { src: ['precast_erection-ufgs-03-41-33', 'precast_erection-ufgs-03-47-13'], confidence: 'verified', last_verified: D } },
    { id: 'keyway_grout', item: 'Keyways, joints, panel bases and connection pockets filled solid, finished flush and kept damp at least 24 hours; lifting holes dry-packed.', item_es: { status: 'translated', text: 'Llaves de cortante, juntas, bases de panel y huecos de conexión rellenos por completo, al ras y mantenidos húmedos al menos 24 horas; huecos de izaje rellenos con mortero seco.' }, prov: { src: ['precast_erection-ufgs-03-41-33', 'precast_erection-ufgs-03-47-13'], confidence: 'verified', last_verified: D } },
    { id: 'field_cuts', item: 'Field openings and cores only at supplier-approved locations; no prestressing strands cut; larger openings framed with headers.', item_es: { status: 'translated', text: 'Aberturas y perforaciones en obra solo en ubicaciones aprobadas por el proveedor; sin cortar torones de presfuerzo; aberturas grandes con cabezales.' }, prov: ufgsPc },
    { id: 'touch_up', item: 'Weld plates and scarred steel supports wire-brushed and touch-up primed; deck swept for the next trade.', item_es: { status: 'translated', text: 'Placas de soldar y apoyos de acero raspados cepillados y retocados con primario; losa barrida para el siguiente oficio.' }, prov: ufgsPc },
    { id: 'insert_layout', item: 'Bond breaker applied before rebar and re-coated where scuffed; rebar on plastic chairs; lifting, brace and weld inserts at the panel engineer’s locations.', item_es: { status: 'translated', text: 'Desmoldante aplicado antes del acero y repasado donde se rayó; varillas sobre silletas plásticas; insertos de izaje, puntales y soldadura en las ubicaciones del ingeniero de paneles.' }, prov: ufgsTu },
    { id: 'brace_removal', item: 'Tilt-up braces stay until the roof diaphragm and permanent panel connections listed by the engineer are complete and inspected.', item_es: PENDING_ES, safety: true, prov: { src: ['precast_erection-ufgs-03-47-13', 'precast_erection-ecfr-1926-704'], confidence: 'verified', last_verified: D } },
  ],
  inspection_checklists: {
    framing: [
      { item: 'Approved erection / panel drawings and lift plan on site', item_es: PENDING_ES },
      { item: 'Bearing lengths, connections and welds checked by the special inspector where required', item_es: PENDING_ES, ref: '1705.3' },
      { item: 'Temporary bracing in place on all panels and columns not yet permanently connected', item_es: PENDING_ES },
    ],
    final: [
      { item: 'Keyways, panel bases and connection pockets grouted; lifting holes patched', item_es: PENDING_ES },
      { item: 'Tilt-up braces removed only after roof diaphragm and lateral connections approved', item_es: PENDING_ES },
      { item: 'Special inspection final report and precast supplier certifications on file', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-PCE-WALL-SF', name: 'Erect precast concrete wall panel (install only, incl. shims, pads, connections), per SF wall', name_es: 'Montaje de panel de muro prefabricado (solo instalación, con calzas, almohadillas y conexiones), por pie²', unit: 'SF', csi: '03 41 00',
      description: 'Erection labor, crane time and connection hardware. Panel supply is the precaster quote.',
      material_cost_cents: { v: 60, prov: est('shims, bearing pads, connection angles and grout incidentals spread per SF, 2026') }, labor_hours_per_unit: { v: 0.02, prov: est('≈5-person erection crew setting ~2,000–2,500 SF of wall panel per day') },
      equipment_cost_cents: { v: 150, prov: est('mobile crane day rate spread over a typical day of picks') }, waste_pct: { v: 0, prov: est('pieces fabricated to size') } },
    { code: 'B-PCE-HOLLOWCORE-SF', name: 'Precast hollowcore plank, 8 in., furnished and erected, per SF', name_es: 'Losa alveolar prefabricada de 8 pulg., suministrada y montada, por pie²', unit: 'SF', csi: '03 41 13',
      material_cost_cents: { v: 1100, prov: est('delivered 8 in. hollowcore plank, regional plant pricing varies widely — tune per quote') }, labor_hours_per_unit: { v: 0.012, prov: est('erection crew setting ~3,500–4,500 SF of plank per day') },
      equipment_cost_cents: { v: 90, prov: est('crane time spread per SF of plank') }, waste_pct: { v: 0, prov: est('planks cut to length at the plant') } },
    { code: 'B-PCE-KEYWAY-LF', name: 'Grout plank keyway / joint, per LF', name_es: 'Relleno con mortero de llave de cortante / junta de losa, por pie lineal', unit: 'LF', csi: '03 41 13',
      material_cost_cents: { v: 120, prov: est('cement or non-shrink grout per LF of 8 in. keyway, 2026') }, labor_hours_per_unit: { v: 0.025, prov: est('two-person grout crew filling and finishing keyways') },
      equipment_cost_cents: { v: 10, prov: est('mixer / grout pump spread per LF') }, waste_pct: { v: 10, prov: est('spillage and mixing loss') } },
    { code: 'B-PCE-BRACE-EA', name: 'Tilt-up panel pipe brace, rented, installed and removed, each', name_es: 'Puntal de tubo para panel tilt-up, rentado, instalado y retirado, cada uno', unit: 'EA', csi: '03 47 13',
      material_cost_cents: { v: 1500, prov: est('brace anchors and bolts consumed per brace') }, labor_hours_per_unit: { v: 0.75, prov: est('attach at the lift, check, and remove after the roof diaphragm is complete') },
      equipment_cost_cents: { v: 6000, prov: est('brace rental for a typical 4–8 week duration') }, waste_pct: { v: 0, prov: est('counted per brace') } },
    { code: 'B-PCE-WELD-EA', name: 'Precast connection field weld (plate or angle to embed), each', name_es: 'Soldadura de conexión prefabricada en obra (placa o ángulo a embebido), cada una', unit: 'EA', csi: '03 41 00',
      material_cost_cents: { v: 1800, prov: est('loose connection plate or angle plus electrodes, 2026') }, labor_hours_per_unit: { v: 1, prov: est('fit-up, weld, clean and prime one connection from a lift') },
      equipment_cost_cents: { v: 600, prov: est('welder plus aerial-lift time per connection') }, waste_pct: { v: 0, prov: est('counted per connection') } },
  ],
  quantity_rules: [
    // Removed at wave review: total floor area includes slab-on-grade levels, so plank area cannot be
    // derived from blueprint facts yet (a one-story building has no hollowcore at all).

  ],
  dependency_hints: [
    { after_trades: ['concrete', 'rebar'], note: 'Precast erection starts after bearing walls, footings and embeds are in place and the supporting concrete has strength; tilt-up waits on the cured floor slab.' },  ],
});
