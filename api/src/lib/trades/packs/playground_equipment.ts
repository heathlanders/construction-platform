// Trade Knowledge Pack — playground_equipment (Playground Equipment & Safety Surfacing). Wave 17 — NEW-TRADE pattern.
// Dossier: docs/trade-packs/dossiers/playground_equipment.md. Sources: CPSC Public Playground Safety Handbook
// (read in full text), 2010 ADA 240/1008, ASTM F1487/F1292/F1951 + IPEMA (reference only), 29 CFR 1926 (P, D, E, K, I, O, X, C).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const cpsc = { src: ['playground_equipment-cpsc-325'], confidence: 'verified' as const, last_verified: D };
const cpscAstm = { src: ['playground_equipment-cpsc-325', 'playground_equipment-astm-f1292'], confidence: 'verified' as const, last_verified: D };
const ada = { src: ['plumbing-ada-2010'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const ibc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const mfr = { src: ['playground_equipment-cpsc-325'], confidence: 'derived' as const, last_verified: D, note: 'CPSC says assembly, repairs and maintenance follow the manufacturer’s instructions; the specifics come from the maker for the unit installed.' };

export default definePack({
  key: 'playground_equipment',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs commercial and public play structures, swings and other play equipment, plus the impact-absorbing safety surfacing under them — site layout with use zones, utility locates, post footings, assembly to the maker’s instructions, surfacing to the rated fall height, an accessible route, and the safety audit and owner maintenance hand-off.',
    summary_es: 'Instala estructuras de juego comerciales y públicas, columpios y la superficie de seguridad que absorbe impactos — trazado con zonas de uso, localización de servicios, zapatas de postes, ensamblaje según el fabricante, superficie según la altura de caída certificada, ruta accesible, auditoría de seguridad y plan de mantenimiento para el propietario.',
    glossary: [
      { term: 'Use zone', term_es: 'Zona de uso', def: 'The surfaced area under and around a piece of equipment where a child could fall or land; kept clear of anything hard.', def_es: 'Área con superficie de seguridad debajo y alrededor de un equipo donde un niño podría caer o aterrizar; se mantiene libre de objetos duros.' },
      { term: 'Fall height', term_es: 'Altura de caída', def: 'Distance from the highest part children can stand or climb on down to the surfacing below.', def_es: 'Distancia desde la parte más alta donde los niños pueden pararse o trepar hasta la superficie de abajo.' },
      { term: 'Critical height', term_es: 'Altura crítica', def: 'The fall height a surfacing material is tested to protect against, from the maker’s impact test report.', def_es: 'Altura de caída que el material de superficie está probado para proteger, según el informe de ensayo de impacto del fabricante.' },
      { term: 'Engineered wood fiber (EWF)', term_es: 'Fibra de madera de ingeniería (EWF)', def: 'Loose-fill wood product made for playgrounds, different from landscape mulch.', def_es: 'Material suelto de madera hecho para parques infantiles, distinto del mantillo de jardinería.' },
      { term: 'Poured-in-place rubber (PIP)', term_es: 'Caucho vertido en sitio (PIP)', def: 'Seamless rubber surface troweled on site over a base, bound with a urethane binder.', def_es: 'Superficie de caucho continua aplicada en sitio sobre una base, unida con un aglutinante de uretano.' },
      { term: 'Unitary surfacing', term_es: 'Superficie unitaria', def: 'Rubber tiles, mats or poured rubber that come as a solid layer rather than loose material.', def_es: 'Losetas, tapetes o caucho vertido que forman una capa sólida en lugar de material suelto.' },
      { term: 'Footing', term_es: 'Zapata', def: 'Concrete that anchors a post below ground; kept below the surfacing so no one can hit it.', def_es: 'Concreto que ancla un poste bajo tierra; se mantiene debajo de la superficie para que nadie lo golpee.' },
      { term: 'Entrapment', term_es: 'Atrapamiento', def: 'A gap where a child’s head or clothing can get stuck, such as an opening between 3.5 and 9 in.', def_es: 'Espacio donde la cabeza o la ropa de un niño puede quedar atorada, como una abertura de entre 3.5 y 9 pulg.' },
      { term: 'CPSI', term_es: 'CPSI', def: 'Certified Playground Safety Inspector — the person who audits the finished playground.', def_es: 'Inspector certificado de seguridad en parques infantiles — quien audita el parque terminado.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'play_structure_install',
      example_title: 'Install playground equipment and swing set',
      when: { title_re: 'playground|play structure|play equipment|swing' },
      steps: [
        {
          title: 'Lay out the play area and use zones',
          instruction: 'Stake the equipment on the approved plan. Put moving equipment such as swings toward an edge or corner, keep slide exits in an uncongested area, and keep age groups in separate areas. Hold the use zone clear all around each piece: at least 6 ft in most cases, and in front of and behind a single-axis swing at least twice the height from pivot to surface. Never let a swing’s front or rear zone overlap another zone.',
          detail: 'Use zones are minimums from the CPSC Handbook; the maker’s sheet and the project design may call for more.',
          tools: ['tape measure', 'layout stakes and string', 'transit or laser level'],
          materials: ['marking paint', 'stakes'],
          safety_ids: ['utility_strike', 'heavy_lift'],
          qa_ids: ['use_zones_clear', 'age_separation'],
        },
        {
          title: 'Locate utilities and set post footings',
          instruction: 'Call for locates and confirm utility positions before any hole is dug. Dig footings to the depth and size on the maker’s footing sheet and below frost where required, plumb and brace each post, and place concrete. Keep every footing below grade and beneath the finished surfacing so none is left exposed to be hit in a fall. Leave posts braced until the concrete has cured as the maker directs.',
          tools: ['auger or post-hole digger', 'level', 'shovel', 'wheelbarrow'],
          materials: ['concrete', 'braces'],
          safety_ids: ['utility_strike', 'open_hole', 'cement_burn', 'heavy_lift'],
          qa_ids: ['footing_depth_size', 'footings_below_surface'],
          gating_inspection_type: 'footing',
          code_refs: [{ section: '1809', code_type: 'IBC', note: 'Shallow foundations, including frost protection of footings' }],
        },
        {
          title: 'Assemble and anchor the equipment',
          instruction: 'Assemble in the maker’s order with the supplied hardware and the right torque. Check platforms, guardrails and barriers sit at the heights the sheet shows and that no gap forms an entrapment space (between 3.5 and 9 in.). Cap exposed tube ends, round all edges, and keep bolts from sticking out. Hang swings in the bay spacing shown; no more than two single-axis swings per bay.',
          detail: 'Never add or swap parts that are not from the maker. Two people minimum on decks and beams.',
          tools: ['socket and torque wrench set', 'level', 'drill/driver', 'tape measure'],
          materials: ['maker’s hardware kit', 'end caps and plugs'],
          safety_ids: ['heavy_lift', 'overhead_fall', 'power_tool', 'ladder'],
          qa_ids: ['assembly_per_mfr', 'entrapment_openings', 'swing_bays', 'hardware_caps'],
        },
        {
          title: 'Install the safety surfacing and border',
          instruction: 'Build the surfacing to the depth and critical height the plan and the maker’s impact-test data call for, across the whole use zone. Loose-fill goes over a drained base and landscape fabric, installed deeper than the minimum because it compresses at least 25% with use, with a border that holds it in. Mark the minimum fill line on the posts. Rubber systems follow the maker’s base and thickness exactly.',
          tools: ['rake', 'level', 'tape measure', 'wheelbarrow'],
          materials: ['surfacing material', 'edging/border timber', 'landscape fabric', 'compacted stone base'],
          safety_ids: ['back_strain', 'dust_chem', 'eye_flying'],
          qa_ids: ['surfacing_depth', 'critical_height_vs_fall', 'border_containment', 'fill_line_marked'],
        },
        {
          title: 'Check the accessible route and sign off',
          instruction: 'Confirm the accessible route reaches the play components and the surfacing on it is firm and stable per the maker’s accessibility data. Walk the finished area against the maker’s checklist, then have the safety audit done and the findings fixed. Give the owner the installation and maintenance instructions, the surfacing test data and a written inspection and repair log to start.',
          tools: ['tape measure', 'clipboard checklist'],
          materials: [],
          safety_ids: ['back_strain'],
          qa_ids: ['accessible_route', 'cpsi_audit_done', 'owner_handoff'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '240', code_type: 'ADA 2010', note: 'Play areas — scoping for accessible play components' }, { section: '1008', code_type: 'ADA 2010', note: 'Play areas — accessible routes and ground surfaces' }],
        },
      ],
    },
    {
      id: 'safety_surfacing_install',
      example_title: 'Install poured-in-place rubber safety surfacing',
      when: { title_re: 'safety surfacing|poured-in-place|engineered wood fiber|rubber surfacing|playground surfacing' },
      priority: 10,
      steps: [
        {
          title: 'Prepare and drain the base',
          instruction: 'Strip the area and shape it to drain away from the play area. Place and compact the stone base to the thickness the surfacing maker specifies and finish it to the tolerance they give. Never put equipment directly over concrete, asphalt or bare dirt with no surfacing system on it. Where loose-fill goes over a hard surface, add the base layer, geotextile and impact mats the Handbook describes.',
          tools: ['plate compactor', 'rake', 'laser or string level'],
          materials: ['compacted stone base', 'geotextile fabric'],
          safety_ids: ['utility_strike', 'equipment_strike', 'back_strain'],
          qa_ids: ['base_graded', 'drainage_present'],
        },
        {
          title: 'Place the surfacing to thickness',
          instruction: 'Engineered wood fiber: spread in lifts, level it and rake to the design depth with the compression allowance included. Poured-in-place: check weather and surface moisture against the maker’s limits, mix binder and rubber in the specified ratio, trowel the base and wear layers to the thickness required and keep seams clean. Tiles and mats: lay to the pattern and join as the maker directs. Work to the rated thickness at every post.',
          detail: 'Surfacing is only as good as its depth at the posts and under swings; check there first.',
          tools: ['mixer', 'screed/trowels', 'rake', 'tape measure or depth gauge'],
          materials: ['EWF or rubber granules', 'urethane binder', 'tiles or mats if specified'],
          safety_ids: ['dust_chem', 'eye_flying', 'back_strain'],
          qa_ids: ['surfacing_depth', 'critical_height_vs_fall', 'pip_cure_per_mfr'],
        },
        {
          title: 'Set the border, ramps and accessible transitions',
          instruction: 'Install the containment border at the use-zone edge, flush or beveled so it is not a trip hazard and is easy to see. Form the accessible route transition without a sudden change in level. Finish drain outlets and clean the finished area.',
          tools: ['level', 'drill/driver', 'saw'],
          materials: ['border timber or curb', 'fasteners'],
          safety_ids: ['power_tool', 'eye_flying'],
          qa_ids: ['border_containment', 'accessible_route'],
        },
        {
          title: 'Hand over test data and care instructions',
          instruction: 'Give the owner the surfacing impact-test report showing the rated critical height, the cure and care instructions, and the maintenance schedule: fill-level checks for loose-fill and repair guidance for rubber. Keep wet and traffic off rubber until it has cured as the maker says.',
          tools: [],
          materials: [],
          safety_ids: [],
          qa_ids: ['owner_handoff', 'critical_height_vs_fall'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '1008', code_type: 'ADA 2010', note: 'Play areas — ground surfaces in use zones' }],
        },
      ],
    },
  ],
  code_refs: {
    footing: [
      { section: '1809', code_type: 'IBC', note: 'Shallow foundations and frost protection of footings', prov: ibc },
    ],
    final: [
      { section: '240', code_type: 'ADA 2010', note: 'Play areas — accessible play components for children 2 and over', prov: ada },
      { section: '1008', code_type: 'ADA 2010', note: 'Play areas — accessible routes, ground surfaces tested per ASTM F1951 and F1292', prov: ada },
    ],
  },
  equipment: [
    { when: { title_re: 'playground|play structure|play equipment|swing|surfacing' }, step_re: 'footing|surfacing|border', type: 'skid_steer', reason: 'Auger post holes and move and spread surfacing material', optional: true },
    { when: { title_re: 'playground|surfacing|poured-in-place|engineered wood fiber' }, step_re: 'base', type: 'compactor', reason: 'Compact the stone base under surfacing', optional: true },
    { when: { title_re: 'playground|surfacing' }, step_re: 'footing|surfacing', type: 'dump_truck', reason: 'Haul spoils, stone base and surfacing material', optional: true },
  ],
  hazards: [
    { id: 'utility_strike', hazard: 'Striking a buried utility while digging footings or grading', hazard_es: PENDING_ES, controls: ['Get utility locates and find the estimated location of underground lines before digging', 'Hand-dig near marked lines'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'open_hole', hazard: 'Spoil, tools or workers falling into open post holes', hazard_es: PENDING_ES, controls: ['Keep spoil and equipment at least 2 ft from the edge of a hole', 'Backfill, cover or barricade holes at the end of each shift'], controls_es: PENDING_ES, osha_ref: '1926.651(j)(2)', severity: 2, prov: osha('p') },
    { id: 'heavy_lift', hazard: 'Back strain or crush injury lifting posts, decks and beams', hazard_es: PENDING_ES, controls: ['Two-person or mechanical lift for posts, decks and beams', 'Brace posts so they cannot fall while the concrete cures'], controls_es: PENDING_ES, osha_ref: '1926.20(b)', severity: 3, ppe: ['gloves', 'safety boots'], prov: osha('c') },
    { id: 'overhead_fall', hazard: 'Struck by a tool or part dropped while working on an elevated deck or top beam', hazard_es: PENDING_ES, controls: ['Keep people clear below elevated work', 'Tie off or tether tools and use a pouch for hardware'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(2)', severity: 3, ppe: ['hard hat'], prov: osha('c') },
    { id: 'ladder', hazard: 'Ladder slip or overreach assembling decks and beams', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above the landing it reaches', 'Set on firm footing and keep three points of contact'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'cement_burn', hazard: 'Skin burns from wet concrete when setting footings', hazard_es: PENDING_ES, controls: ['Wear waterproof gloves, long sleeves and boots; wash skin promptly if soaked'], controls_es: PENDING_ES, osha_ref: '1926.28(a)', severity: 2, ppe: ['waterproof gloves', 'boots'], prov: osha('c') },
    { id: 'dust_chem', hazard: 'Binder, adhesive or fine rubber and wood dust irritating skin, eyes or lungs', hazard_es: PENDING_ES, controls: ['Read the SDS for binder and primer', 'Use gloves, eye protection and respirator as the SDS directs; ventilate mixing'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 3, ppe: ['nitrile gloves', 'safety glasses', 'respirator when the SDS requires'], prov: osha('d') },
    { id: 'equipment_strike', hazard: 'Struck by a skid steer, dump truck or compactor backing up', hazard_es: PENDING_ES, controls: ['Use a spotter or working reverse alarm on equipment with an obstructed rear view', 'Keep workers out of the swing and backing path'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(4)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'power_tool', hazard: 'Cuts and kickback from saws and drills on timber borders and parts', hazard_es: PENDING_ES, controls: ['Guards in place, work clamped, correct blade for the material'], controls_es: PENDING_ES, osha_ref: '1926.300(b)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'eye_flying', hazard: 'Eye injury from flying chips, rubber granules and wood fiber', hazard_es: PENDING_ES, controls: ['Wear safety glasses when cutting, fastening, raking and spreading material'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'back_strain', hazard: 'Back strain shoveling, raking and trowelling surfacing', hazard_es: PENDING_ES, controls: ['Mechanical delivery to the work, rotate tasks, lift with the legs'], controls_es: PENDING_ES, osha_ref: '1926.20(b)', severity: 2, prov: osha('c') },
    { id: 'cord_shock', hazard: 'Electric shock from temporary power for mixers and tools', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Inspect cords daily'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
  ],
  qa_checklist: [
    { id: 'use_zones_clear', item: 'Use zones are laid out per the maker’s sheet and project design: at least 6 ft clear around most equipment, swings clear twice the pivot height front and rear, and no swing zone overlapping another.', item_es: PENDING_ES, safety: true, prov: cpsc },
    { id: 'age_separation', item: 'Areas for different age groups are separated; moving equipment sits toward an edge and slide exits are in an uncongested spot.', item_es: { status: 'translated', text: 'Las áreas para distintos grupos de edad están separadas; el equipo móvil está hacia un borde y las salidas de toboganes en un lugar sin congestión.' }, prov: cpsc },
    { id: 'footing_depth_size', item: 'Footing diameter, depth and concrete match the maker’s footing sheet and frost depth; posts plumb and braced until cured.', item_es: { status: 'translated', text: 'Diámetro, profundidad y concreto de las zapatas coinciden con la hoja del fabricante y la profundidad de helada; postes aplomados y apuntalados hasta el curado.' }, prov: mfr },
    { id: 'footings_below_surface', item: 'All footings and anchors are below grade and beneath the base of the protective surfacing; none exposed.', item_es: PENDING_ES, safety: true, prov: cpsc },
    { id: 'assembly_per_mfr', item: 'Equipment assembled in the maker’s order with supplied hardware; torque and heights match the instructions; no substituted parts.', item_es: { status: 'translated', text: 'Equipo ensamblado en el orden del fabricante con la herrajería suministrada; torque y alturas según las instrucciones; sin piezas sustituidas.' }, prov: mfr },
    { id: 'entrapment_openings', item: 'No opening in guardrails, barriers or access parts falls between 3.5 and 9 in. where a head could be trapped; no projections that catch clothing.', item_es: PENDING_ES, safety: true, prov: cpsc },
    { id: 'swing_bays', item: 'No more than two single-axis swings hang in each bay; swings are not attached to a composite structure.', item_es: PENDING_ES, safety: true, prov: cpsc },
    { id: 'hardware_caps', item: 'Open tube ends are capped or plugged with caps that need a tool to remove; bolts do not protrude; wood is smooth and corners and metal edges are rounded.', item_es: { status: 'translated', text: 'Extremos de tubo abiertos con tapones que requieren herramienta para quitarse; pernos sin sobresalir; madera lisa y esquinas y bordes metálicos redondeados.' }, prov: cpsc },
    { id: 'base_graded', item: 'Stone base is compacted to the surfacing maker’s thickness and grade tolerance, sloped to drain away from the play area.', item_es: { status: 'translated', text: 'La base de piedra está compactada al espesor y tolerancia de nivel del fabricante, con pendiente para drenar fuera del área de juego.' }, prov: mfr },
    { id: 'drainage_present', item: 'Surfacing area drains; no standing water on or under loose-fill surfacing.', item_es: { status: 'translated', text: 'El área de superficie drena; no hay agua estancada sobre ni bajo la superficie suelta.' }, prov: cpsc },
    { id: 'surfacing_depth', item: 'Surfacing thickness checked at every post and under swings and slide exits; loose-fill installed deeper than the compressed minimum so it still meets it after settling.', item_es: PENDING_ES, safety: true, prov: cpsc },
    { id: 'critical_height_vs_fall', item: 'The surfacing’s tested critical height (maker’s ASTM F1292 report) equals or exceeds the highest fall height of every installed piece.', item_es: PENDING_ES, safety: true, prov: cpscAstm },
    { id: 'border_containment', item: 'Border contains loose-fill, is visible and sits level so it is not a trip hazard.', item_es: { status: 'translated', text: 'El borde contiene el material suelto, es visible y queda a nivel para no causar tropiezos.' }, prov: cpsc },
    { id: 'fill_line_marked', item: 'Minimum fill line is marked on the posts to help the owner keep the depth.', item_es: { status: 'translated', text: 'La línea mínima de relleno está marcada en los postes para ayudar al propietario a mantener la profundidad.' }, prov: cpsc },
    { id: 'pip_cure_per_mfr', item: 'Poured-in-place rubber placed within the maker’s weather and substrate limits, correct binder ratio, and kept off until cured.', item_es: { status: 'translated', text: 'El caucho vertido en sitio se colocó dentro de los límites de clima y base del fabricante, con la proporción de aglutinante correcta, y sin uso hasta curar.' }, prov: mfr },
    { id: 'accessible_route', item: 'An accessible route reaches the play components and the surface on it is firm and stable per the maker’s accessibility data; no sudden changes in level.', item_es: { status: 'translated', text: 'Una ruta accesible llega a los componentes de juego y su superficie es firme y estable según los datos del fabricante; sin cambios bruscos de nivel.' }, prov: { src: ['plumbing-ada-2010', 'playground_equipment-cpsc-325'], confidence: 'verified', last_verified: D } },
    { id: 'cpsi_audit_done', item: 'A safety audit against the CPSC Handbook / ASTM F1487 has been performed by a certified playground safety inspector and findings are closed.', item_es: PENDING_ES, safety: true, prov: { src: ['playground_equipment-cpsc-325', 'playground_equipment-astm-f1487'], confidence: 'derived', last_verified: D, note: 'CPSC recommends a comprehensive inspection program; a CPSI audit at installation is common owner and insurer practice.' } },
    { id: 'owner_handoff', item: 'Owner received installation and maintenance instructions, surfacing test data, and an inspection and repair log to keep.', item_es: { status: 'translated', text: 'El propietario recibió las instrucciones de instalación y mantenimiento, los datos de ensayo de la superficie y un registro de inspección y reparación.' }, prov: cpsc },
  ],
  inspection_checklists: {
    footing: [
      { item: 'Footing size and depth match the maker’s footing sheet and frost depth', item_es: PENDING_ES, ref: '1809' },
      { item: 'Footing top is below finished surfacing and grade', item_es: PENDING_ES },
    ],
    final: [
      { item: 'Accessible route and firm, stable surface to the play components', item_es: PENDING_ES, ref: '1008' },
      { item: 'Surfacing critical height meets the highest fall height on site', item_es: PENDING_ES },
    ],
    cpsi_audit: [
      { item: 'Use zones free of obstacles and not overlapping where the Handbook requires', item_es: PENDING_ES },
      { item: 'Entrapment, protrusion and pinch-point openings checked', item_es: PENDING_ES },
      { item: 'Surfacing depth and critical height checked against fall heights', item_es: PENDING_ES },
      { item: 'Equipment certified to ASTM F1487 where specified; maker’s paperwork on file', item_es: PENDING_ES },
      { item: 'Maintenance plan, inspection log and signage handed to owner', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-PLAY-STRUCT-EA', name: 'Play structure install allowance, mid-size commercial composite (maker structure not included)', name_es: 'Asignación de instalación de estructura de juego comercial mediana (estructura no incluida)', unit: 'EA', csi: '11 68 13',
      description: 'Footings, hardware, assembly labor and anchoring; the equipment kit itself is priced per the maker quote.',
      material_cost_cents: { v: 120000, prov: est('concrete, hardware, caps and misc, national baseline 2026') }, labor_hours_per_unit: { v: 56, prov: est('4-person crew ~2 days incl. footings and assembly') },
      equipment_cost_cents: { v: 25000, prov: est('skid steer with auger half-day') }, waste_pct: { v: 5, prov: est('misc hardware') } },
    { code: 'B-PLAY-SWING-EA', name: 'Swing set install allowance, 2-bay commercial frame', name_es: 'Asignación de instalación de columpio, marco comercial de 2 módulos', unit: 'EA', csi: '11 68 13',
      material_cost_cents: { v: 45000, prov: est('footings concrete, hardware allowance, 2026') }, labor_hours_per_unit: { v: 20, prov: est('footings + frame + seats') },
      equipment_cost_cents: { v: 10000, prov: est('auger rental share') }, waste_pct: { v: 5, prov: est('misc hardware') } },
    { code: 'B-PLAY-EWF-SF', name: 'Engineered wood fiber safety surfacing, 12 in. initial depth, over fabric', name_es: 'Superficie de seguridad de fibra de madera de ingeniería, 12 pulg. de profundidad inicial, sobre tela', unit: 'SF', csi: '32 18 16',
      material_cost_cents: { v: 220, prov: est('≈1 CY per 27 SF at 12 in. + fabric, delivered, 2026') }, labor_hours_per_unit: { v: 0.03, prov: est('spread and level, skid steer assisted') },
      equipment_cost_cents: { v: 25, prov: est('skid steer share') }, waste_pct: { v: 10, prov: est('compaction and spillage') } },
    { code: 'B-PLAY-PIP-SF', name: 'Poured-in-place rubber safety surfacing, 3 in. over stone base', name_es: 'Superficie de seguridad de caucho vertido en sitio, 3 pulg. sobre base de piedra', unit: 'SF', csi: '32 18 16',
      description: 'Rubber and binder only; the compacted stone base is priced separately.',
      material_cost_cents: { v: 1100, prov: est('rubber granules + urethane binder for ~3 in. wear + base layers, 2026') }, labor_hours_per_unit: { v: 0.12, prov: est('crew mixing and troweling') },
      equipment_cost_cents: { v: 80, prov: est('mixer and tools') }, waste_pct: { v: 7, prov: est('mix waste and edges') } },
    { code: 'B-PLAY-BORDER-LF', name: 'Playground surfacing border, treated timber or recycled-plastic curb', name_es: 'Borde de superficie de parque infantil, madera tratada o bordillo de plástico reciclado', unit: 'LF', csi: '32 18 16',
      material_cost_cents: { v: 900, prov: est('timber/curb + stakes, 2026') }, labor_hours_per_unit: { v: 0.12, prov: est('set, level, fasten') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 5, prov: est('cut-offs') } },
  ],
  dependency_hints: [
    { after_trades: ['excavation', 'landscaping'], before_phase: 'punch', note: 'Grade and drainage first; surfacing last, then audit and punch.' },
  ],
});
