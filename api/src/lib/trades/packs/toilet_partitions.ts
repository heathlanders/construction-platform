// Trade Knowledge Pack — toilet_partitions (Toilet Partitions & Urinal Screens). Wave 16 — NEW-TRADE pattern
// (not in HAND_RECIPE_KEYS). permit_trade null → NO gates, NO code_refs; ADA 2010 sizes live in step text, QA
// and the owner/GC hold points in inspection_checklists. Restroom accessories (grab bars, dispensers, mirrors)
// on the shared template task belong to the `specialties` pack — this pack covers compartments + screens only.
// Dossier: docs/trade-packs/dossiers/toilet_partitions.md. Sources: UFGS 10 21 13 (Toilet Compartments),
// 2010 ADA Standards (Access Board text — 213.3.1, 404.2, 604.8, 605.3), Bobrick 1540-69 installation
// instructions, 29 CFR 1926 Subparts C, E, H, I, K, X, Z (1926.1153 Table 1 — handheld drills).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['toilet_partitions-ufgs-10-21-13'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ada = (note?: string) => ({ src: ['millwork-access-board-ada', 'plumbing-ada-2010'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const mfr = (note?: string) => ({ src: ['toilet_partitions-bobrick-1540'], confidence: 'derived' as const, last_verified: D, note: note ?? 'From a published manufacturer installation guide — follow the instructions for the system installed.' });
const both = (note?: string) => ({ src: ['toilet_partitions-ufgs-10-21-13', 'toilet_partitions-bobrick-1540'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'toilet_partitions',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs restroom toilet compartments and urinal screens — solid plastic (HDPE), powder-coated or baked-enamel steel, solid phenolic and stainless steel — floor-anchored, overhead-braced or ceiling-hung, laid out to the ADA wheelchair and ambulatory compartment sizes, with self-closing accessible doors, privacy gaps and final hardware adjustment.',
    summary_es: 'Instala compartimentos de inodoro y mamparas de urinario en baños públicos — plástico sólido (HDPE), acero con pintura en polvo o esmalte horneado, fenólico sólido y acero inoxidable — anclados al piso, con riel superior o colgados del techo, trazados según las medidas ADA de compartimentos accesibles y ambulatorios, con puertas accesibles de cierre automático y ajuste final.',
    glossary: [
      { term: 'Pilaster (stile)', term_es: 'Pilastra (poste)', def: 'Vertical post at the front of the compartment that carries the door hinges and the panels.', def_es: 'Poste vertical al frente del compartimento que sostiene las bisagras de la puerta y los paneles.' },
      { term: 'Panel', term_es: 'Panel divisorio', def: 'Side wall between two compartments, held to the wall and pilaster with brackets.', def_es: 'Pared lateral entre dos compartimentos, sujeta al muro y a la pilastra con escuadras.' },
      { term: 'Headrail', term_es: 'Riel superior', def: 'Rail across the top of the pilasters that braces an overhead-braced layout; joints land on a pilaster.', def_es: 'Riel sobre las pilastras que arriostra un sistema con riel superior; las uniones caen sobre una pilastra.' },
      { term: 'Overhead-braced', term_es: 'Con riel superior', def: 'Pilasters anchored to the floor and tied together across the top by the headrail.', def_es: 'Pilastras ancladas al piso y unidas arriba por el riel superior.' },
      { term: 'Ceiling-hung', term_es: 'Colgado del techo', def: 'Pilasters hung from structural steel above the ceiling, leaving the floor clear for cleaning.', def_es: 'Pilastras colgadas de acero estructural sobre el plafón, dejando el piso libre para la limpieza.' },
      { term: 'Shoe', term_es: 'Zapata (cubrebase)', def: 'Metal cover at the bottom (or top) of a pilaster that hides the anchor and leveling hardware.', def_es: 'Cubierta metálica en la base (o arriba) de la pilastra que oculta el anclaje y el herraje de nivelación.' },
      { term: 'Wheelchair accessible compartment', term_es: 'Compartimento accesible para silla de ruedas', def: 'The large ADA stall, 60 in. wide, with grab bars and a self-closing door hinged away from the toilet.', def_es: 'El cubículo ADA grande, de 60 pulg de ancho, con barras de apoyo y puerta de cierre automático alejada del inodoro.' },
      { term: 'Ambulatory compartment', term_es: 'Compartimento ambulatorio', def: 'Narrow ADA stall (35–37 in. wide) with grab bars on both sides, for people who walk with aids.', def_es: 'Cubículo ADA angosto (35 a 37 pulg) con barras a ambos lados, para personas que caminan con ayuda.' },
      { term: 'Sightline gap', term_es: 'Rendija de visibilidad', def: 'Gap between a door and pilaster you can see through; kept tight or covered with a strip for privacy.', def_es: 'Abertura entre puerta y pilastra por la que se ve; se mantiene mínima o se cubre con una tira para privacidad.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'partitions_install',
      example_title: 'Restroom accessories, partitions & casework',
      when: { title_re: '\\b(toilet|restroom|washroom|urinal)\\b.*\\b(partitions?|compartments?|screens?)\\b|\\b(partitions?|compartments?)\\b.*\\b(toilet|restroom|washroom|urinal)\\b' },
      steps: [
        {
          title: 'Verify layout, fixtures and ADA compartment sizes',
          instruction: 'Field-measure each restroom against the shop drawings before ordering or drilling: toilets and urinals on their centerlines, walls plumb, floor level. Confirm the wheelchair compartment is at least 60 in. wide and 56 in. deep (wall-hung toilet) or 59 in. deep (floor-mounted), the door sits within 4 in. of the far wall and swings clear of the required space, and any ambulatory compartment is 35–37 in. wide and 60 in. deep. Report conflicts in writing before work starts.',
          detail: 'Grab bars, paper and napkin dispensers and other accessories go to the specialties installer — mark any panel cutouts and reinforcement they need on the drawings.',
          tools: ['tape measure', 'laser level', 'chalk line'],
          materials: ['approved shop drawings / layout sheets'],
          safety_ids: ['trip_debris'],
          qa_ids: ['field_verify', 'ada_wheelchair_size', 'ada_ambulatory_size', 'ada_door_location'],
        },
        {
          title: 'Confirm backing and overhead support steel',
          instruction: 'Check that solid backing is in the walls where wall brackets and grab bars land. For ceiling-hung systems, confirm the structural support above (by others) is in place and set the ceiling anchors before the finished ceiling goes in. For overhead-braced systems, confirm the floor is sound where the pilasters anchor.',
          tools: ['stud finder', 'tape measure', 'step ladder'],
          materials: ['ceiling anchor kits (threaded rod, nuts, washers)'],
          safety_ids: ['ladder_misuse', 'overhead_load'],
          qa_ids: ['backing_present', 'ceiling_support'],
        },
        {
          title: 'Lay out and drill anchors',
          instruction: 'Snap pilaster and panel centerlines from the layout sheets and mark anchor holes. Drill floor, wall and ceiling anchors to the depth the system calls for — expansion shields at least 2 in. into the slab — and place wall-bracket holes in tile or block joints. Use a drill with a dust shroud and vacuum in concrete, block or tile.',
          tools: ['hammer drill with dust shroud and vacuum', 'masonry and tile bits', 'center punch', 'masking tape'],
          materials: ['floor anchors / expansion shields', 'toggle bolts for hollow walls', 'wall brackets'],
          safety_ids: ['silica_drilling', 'silica_cleanup', 'tool_shock', 'eye_dust', 'noise'],
          qa_ids: ['anchor_rating', 'bracket_joints'],
        },
        {
          title: 'Set pilasters, panels and headrail',
          instruction: 'Set the pilasters on their anchors, then hang panels on continuous full-height wall brackets and panel-to-pilaster brackets. Shim at the wall, then plumb, level and square each opening and lock the leveling hardware, keeping panel-to-wall gaps to 1/2 in. or less. On overhead-braced runs, fasten the headrail to each pilaster face with at least two fasteners and land headrail joints on a pilaster.',
          detail: 'Phenolic and stainless panels are heavy — carry on edge with two people and never lean them against a wall unbraced.',
          tools: ['level', 'drill/driver', 'open-end wrenches', 'hacksaw', 'shims'],
          materials: ['pilasters', 'panels', 'headrail and end caps', 'brackets and through-bolt hardware'],
          safety_ids: ['panel_handling', 'panel_storage', 'ladder_misuse', 'tool_shock'],
          qa_ids: ['plumb_level', 'headrail_joints'],
        },
        {
          title: 'Hang doors and accessible hardware',
          instruction: 'Hang each door on its hinges and set the hinge cam so the door closes or rests where the system intends. Accessible and ambulatory compartment doors must self-close and get a door pull on both sides near the latch, with a latch that works without tight grasping or twisting. Set the keeper so a locked door can still be lifted off from outside in an emergency, and fit a coat hook and bumper on every door.',
          tools: ['drill/driver', 'pin-head security bit', 'level'],
          materials: ['doors', 'hinges', 'latch and keeper', 'door pulls', 'coat hook / bumper'],
          safety_ids: ['panel_handling', 'pinch_points'],
          qa_ids: ['self_closing', 'pulls_both_sides', 'emergency_access'],
        },
        {
          title: 'Final adjustment, privacy and cleanup',
          instruction: 'Tighten all leveling and anchor hardware, then adjust every door for an even edge gap and a consistent rest position. Close up sightline gaps at door edges with the privacy strips or adjustment the system provides. Touch up scratched finish, remove labels, clean with non-acid cleaners only, and leave a punch list for the GC and the specialties installer.',
          tools: ['screwdrivers', 'wrenches', 'HEPA vacuum'],
          materials: ['touch-up paint matching the finish', 'non-acid cleaner'],
          safety_ids: ['silica_cleanup', 'trip_debris'],
          qa_ids: ['door_clearance', 'finish_clean'],
        },
      ],
    },
  ],
  hazards: [
    { id: 'silica_drilling', hazard: 'Breathing respirable silica dust when drilling anchor holes in concrete slabs, block walls or ceramic tile', hazard_es: PENDING_ES,
      controls: ['Use a drill fitted with a commercially available shroud or cowling and a dust-collection vacuum, per the 1926.1153 Table 1 row for handheld drills', 'Run and maintain the tool and vacuum per the maker so dust is captured at the bit'],
      controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['safety glasses'],
      prov: osha('z', 'Table 1 row: handheld and stand-mounted drills — shroud + dust collection, no respirator required when fully implemented.') },
    { id: 'silica_cleanup', hazard: 'Re-spreading silica dust by dry sweeping or brushing drill dust off floors and tile', hazard_es: PENDING_ES,
      controls: ['Clean drill dust with a HEPA vacuum or wet methods', 'No dry sweeping or compressed air on concrete or tile dust'],
      controls_es: PENDING_ES, osha_ref: '1926.1153(f)(1)', severity: 2, prov: osha('z') },
    { id: 'panel_handling', hazard: 'Back strain, crushed fingers and dropped panels or doors when carrying heavy phenolic, steel or plastic panels', hazard_es: PENDING_ES,
      controls: ['Two people for every panel and door; carry on edge with a panel cart where possible', 'Plan the path into the restroom and clear it before carrying'],
      controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, ppe: ['gloves', 'safety-toe boots'],
      prov: osha('c', 'Employer training duty on recognizing and avoiding unsafe conditions; Part 1926 has no specific lifting standard.') },
    { id: 'panel_storage', hazard: 'Stacked or leaning panels sliding or falling over onto workers', hazard_es: PENDING_ES,
      controls: ['Store panels flat on blocking or on edge in a braced rack, never leaning loose against a wall', 'Keep stacks low and secured against sliding'],
      controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 3, prov: osha('h') },
    { id: 'ladder_misuse', hazard: 'Falls from stepladders when setting headrails, ceiling anchors or overhead hardware', hazard_es: PENDING_ES,
      controls: ['Use the stepladder only as designed — fully open and locked, on a level floor', 'Never stand on the top or top step; move the ladder instead of overreaching'],
      controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x', 'Also 1926.1053(b)(4) — ladders used only for their designed purpose.') },
    { id: 'overhead_load', hazard: 'Ceiling-hung pilasters or support steel falling if hung from inadequate framing or loose anchors', hazard_es: PENDING_ES,
      controls: ['Hang only from the structural support shown on the drawings (furnished by others); never from ceiling grid or drywall', 'Fully tighten double nuts and lock washers on every threaded rod before loading'],
      controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: osha('c', 'Training/unsafe-condition duty; support requirements are from the UFGS and manufacturer instructions.') },
    { id: 'tool_shock', hazard: 'Electric shock from damaged or ungrounded drills and extension cords', hazard_es: PENDING_ES,
      controls: ['Use double-insulated or grounded tools only; inspect cords before use', 'Plug in through GFCI protection or an assured grounding program'],
      controls_es: PENDING_ES, osha_ref: '1926.302(a)(1)', severity: 2, prov: { src: ['ecfr-1926-i', 'ecfr-1926-k'], confidence: 'verified', last_verified: D, note: 'Also 1926.404(b)(1) ground-fault protection.' } },
    { id: 'eye_dust', hazard: 'Eye injury from concrete and tile chips while drilling and from metal shavings when cutting headrail', hazard_es: PENDING_ES,
      controls: ['Wear safety glasses with side shields while drilling, cutting or driving fasteners overhead'],
      controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'noise', hazard: 'Hearing loss from hammer drilling in small, hard-surfaced restrooms', hazard_es: PENDING_ES,
      controls: ['Wear hearing protection while hammer drilling; limit continuous drilling time'],
      controls_es: PENDING_ES, osha_ref: '1926.101(a)', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('e') },
    { id: 'pinch_points', hazard: 'Pinched or cut fingers in hinges, door edges and bracket screws while hanging and adjusting doors', hazard_es: PENDING_ES,
      controls: ['Keep fingers off the hinge side while a door swings; support the door until the hinge pin is set', 'Wear gloves when handling sheet-metal brackets and cut headrail'],
      controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, ppe: ['gloves'], prov: osha('c') },
    { id: 'trip_debris', hazard: 'Trips over cartons, offcuts and packing in tight restrooms', hazard_es: PENDING_ES,
      controls: ['Break down cartons and clear offcuts from the room and corridor as work proceeds'],
      controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 1, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'field_verify', phase: 'finishes_interior', item: 'Field measurements, fixture spacing and built-in framing/anchorage checked against the shop drawings before fabrication; conflicts reported in writing.', item_es: tr('Medidas en obra, separación de aparatos y estructura/anclajes empotrados revisados contra los planos de taller antes de fabricar; conflictos reportados por escrito.'), prov: ufgs() },
    { id: 'ada_wheelchair_size', phase: 'finishes_interior', item: 'Wheelchair compartment at least 60 in. wide and 56 in. deep (wall-hung toilet) or 59 in. deep (floor-mounted), with toe clearance 9 in. high × 6 in. deep under the front and one side partition unless the compartment is oversized.', item_es: tr('Compartimento accesible de al menos 60 pulg de ancho y 56 pulg de fondo (inodoro de pared) o 59 pulg (de piso), con espacio para los pies de 9 pulg de alto × 6 pulg de fondo bajo el frente y un lado, salvo compartimento sobredimensionado.'), prov: ada('2010 ADA 604.8.1.1 and 604.8.1.4.') },
    { id: 'ada_ambulatory_size', phase: 'finishes_interior', item: 'Where six or more compartments (or six or more toilets plus urinals) are in the room, one ambulatory compartment 35–37 in. wide and at least 60 in. deep is provided in addition to the wheelchair compartment.', item_es: tr('Donde hay seis o más compartimentos (o seis o más inodoros más urinarios), se agrega un compartimento ambulatorio de 35 a 37 pulg de ancho y al menos 60 pulg de fondo además del accesible.'), prov: ada('2010 ADA 213.3.1 and 604.8.2.1.') },
    { id: 'ada_door_location', phase: 'finishes_interior', item: 'Wheelchair compartment door within 4 in. of the wall farthest from the toilet (or of the front partition if in the side wall), swinging clear of the required space; 42 in. clear at a latch-side approach.', item_es: tr('Puerta del compartimento accesible a no más de 4 pulg del muro más alejado del inodoro (o del frente si está en el lado), sin abrir hacia el espacio requerido y con 42 pulg libres del lado de la cerradura si se aproxima por ese lado.'), prov: ada('2010 ADA 604.8.1.2.') },
    { id: 'backing_present', phase: 'finishes_interior', item: 'Solid backing confirmed in walls at every wall bracket and grab-bar location before the wall finish is closed or before brackets go up.', item_es: tr('Refuerzo sólido confirmado en los muros en cada escuadra y en cada barra de apoyo antes de cerrar el acabado del muro o de colocar las escuadras.'), prov: both() },
    { id: 'ceiling_support', phase: 'finishes_interior', item: 'Ceiling-hung pilasters hung from the structural support shown on the drawings, anchors set before the finished ceiling, all nuts and lock washers tight.', item_es: PENDING_ES, safety: true, prov: both() },
    { id: 'anchor_rating', phase: 'finishes_interior', item: 'Anchors match the substrate (toggle bolts in hollow walls, expansion shields in solid masonry/concrete) at the capacity specified — one federal spec calls for 600 lb per anchor — and floor shields at least 2 in. into the slab.', item_es: PENDING_ES, safety: true, prov: ufgs('UFGS 10 21 13 Part 3 — 1/4-20 screws minimum, ≥600 lb per anchor; floor shields ≥2 in. embedment.') },
    { id: 'bracket_joints', phase: 'finishes_interior', item: 'Wall brackets continuous full height with bolt holes placed in tile or masonry joints, not through the face of the tile.', item_es: tr('Escuadras de muro continuas de altura completa, con perforaciones en las juntas del azulejo o bloque y no en la cara del azulejo.'), prov: ufgs() },
    { id: 'plumb_level', phase: 'finishes_interior', item: 'Partitions rigid, straight, plumb and level, panels centered between fixtures, panel-to-wall gap 1/2 in. max, openings square; leveling hardware locked.', item_es: tr('Mamparas rígidas, rectas, a plomo y a nivel, paneles centrados entre aparatos, aberturas de puerta en escuadra; herraje de nivelación bloqueado.'), prov: both() },
    { id: 'headrail_joints', phase: 'finishes_interior', item: 'Headrail joints located over pilaster centerlines and the headrail fastened to each pilaster face with at least two fasteners.', item_es: tr('Uniones del riel superior sobre el eje de las pilastras y riel fijado a cada cara de pilastra con al menos dos sujetadores.'), prov: both() },
    { id: 'self_closing', phase: 'finishes_interior', item: 'Wheelchair and ambulatory compartment doors self-closing (spring or gravity hinge set per the maker).', item_es: tr('Puertas de compartimentos accesible y ambulatorio con cierre automático (bisagra de resorte o de gravedad ajustada según el fabricante).'), prov: ada('2010 ADA 604.8.1.2 and 604.8.2.2.') },
    { id: 'pulls_both_sides', phase: 'finishes_interior', item: 'Door pull on both sides of accessible and ambulatory doors near the latch, 34–48 in. above the floor; latch usable one-handed without tight grasping or twisting.', item_es: tr('Jaladera en ambos lados de las puertas accesible y ambulatoria cerca de la cerradura, a 34–48 pulg del piso; cerradura operable con una mano sin apretar ni girar la muñeca.'), prov: { src: ['millwork-access-board-ada', 'plumbing-ada-2010', 'toilet_partitions-ufgs-10-21-13'], confidence: 'verified', last_verified: D, note: '2010 ADA 604.8.1.2, 404.2.7, 309.4; UFGS 2.2.10.1.' } },
    { id: 'emergency_access', phase: 'finishes_interior', item: 'Latch keeper set so a locked door can be lifted or opened from outside for emergency access.', item_es: PENDING_ES, safety: true, prov: mfr() },
    { id: 'door_clearance', phase: 'finishes_interior', item: 'Doors adjusted to an even vertical edge gap (about 3/16 in.) and a consistent rest position; each door has hinges, one latch, and a coat hook with bumper.', item_es: tr('Puertas ajustadas con holgura lateral pareja (unos 3/16 pulg) y posición de reposo uniforme; cada puerta con bisagras, una cerradura y gancho con tope.'), prov: ufgs() },
    { id: 'finish_clean', phase: 'finishes_interior', item: 'Finish touched up in matching color, labels removed, cleaned with non-acid cleaners (acid tile cleaners attack stainless hardware).', item_es: tr('Acabado retocado del mismo color, etiquetas retiradas, limpieza con productos sin ácido (los limpiadores ácidos dañan el herraje inoxidable).'), prov: both() },
  ],
  inspection_checklists: {
    layout_verify: [
      { item: 'Fixtures roughed and set on the dimensions shown; shop drawings approved', item_es: tr('Aparatos instalados en las medidas indicadas; planos de taller aprobados') },
      { item: 'Wheelchair and ambulatory compartment sizes and door locations meet 2010 ADA', item_es: tr('Medidas y ubicación de puertas de compartimentos accesible y ambulatorio según ADA 2010'), ref: 'ADA 604.8' },
      { item: 'Accessory cutouts and reinforcement coordinated with the specialties installer', item_es: tr('Cortes y refuerzos para accesorios coordinados con el instalador de especialidades') },
    ],
    support_before_ceiling: [
      { item: 'Structural support for ceiling-hung pilasters installed by others and anchors set before the ceiling closes', item_es: PENDING_ES },
      { item: 'Wall backing in place at brackets and grab bars', item_es: tr('Refuerzo en muros colocado en escuadras y barras de apoyo') },
    ],
    ada_compartment_check: [
      { item: 'Accessible doors self-close, pulls on both sides, latch operable without tight grasp', item_es: tr('Puertas accesibles con cierre automático, jaladeras en ambos lados y cerradura sin necesidad de apretar'), ref: 'ADA 604.8.1.2' },
      { item: 'Toe clearance under front and side partitions where required', item_es: tr('Espacio para los pies bajo las mamparas frontal y lateral donde se requiere'), ref: 'ADA 604.8.1.4' },
      { item: 'Doors do not swing into the required compartment space', item_es: tr('Las puertas no abren hacia el espacio requerido del compartimento') },
    ],
    final_walkthrough: [
      { item: 'Partitions plumb, level, rigid; all leveling and anchor hardware tight', item_es: PENDING_ES },
      { item: 'Doors evenly gapped, rest position consistent, emergency lift-off works', item_es: PENDING_ES },
      { item: 'Finish undamaged or touched up; labels removed; no acid cleaner residue', item_es: tr('Acabado sin daños o retocado; etiquetas retiradas; sin residuos de limpiador ácido') },
    ],
  },
  assemblies: [
    { code: 'G-TP-STD-COMP-EA', name: 'Standard toilet compartment, overhead-braced, powder-coated steel or HDPE, installed, each', name_es: 'Compartimento de inodoro estándar con riel superior, acero con pintura en polvo o HDPE, instalado, c/u', unit: 'EA', csi: '10 21 13',
      material_cost_cents: { v: 85000, prov: est('door + pilaster + panel share + headrail + hardware, mid-range powder-coated steel/HDPE, national baseline 2026; phenolic/stainless run higher') },
      labor_hours_per_unit: { v: 3.0, prov: est('two-person crew, layout + anchors + set + doors + adjust, per compartment in a multi-stall run') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools') }, waste_pct: { v: 0, prov: est('fabricated to size') } },
    { code: 'G-TP-ADA-COMP-EA', name: 'Wheelchair-accessible toilet compartment (60 in. wide), self-closing door, installed, each', name_es: 'Compartimento accesible para silla de ruedas (60 pulg), puerta de cierre automático, instalado, c/u', unit: 'EA', csi: '10 21 13',
      material_cost_cents: { v: 115000, prov: est('wider door/panels, self-closing hinge, pulls both sides; grab bars excluded (specialties)') },
      labor_hours_per_unit: { v: 4.0, prov: est('extra layout checks against ADA dimensions and hardware adjustment') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools') }, waste_pct: { v: 0, prov: est('fabricated to size') } },
    { code: 'G-TP-AMB-COMP-EA', name: 'Ambulatory-accessible toilet compartment (35–37 in. wide), self-closing door, installed, each', name_es: 'Compartimento ambulatorio (35 a 37 pulg), puerta de cierre automático, instalado, c/u', unit: 'EA', csi: '10 21 13',
      material_cost_cents: { v: 95000, prov: est('standard compartment + self-closing hinge and pulls both sides') },
      labor_hours_per_unit: { v: 3.5, prov: est('standard compartment + hardware adjustment') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools') }, waste_pct: { v: 0, prov: est('fabricated to size') } },
    { code: 'G-TP-URINAL-SCRN-EA', name: 'Urinal screen, wall-hung or floor-anchored, installed, each', name_es: 'Mampara de urinario, colgada de muro o anclada al piso, instalada, c/u', unit: 'EA', csi: '10 21 13',
      material_cost_cents: { v: 30000, prov: est('mid-range screen + brackets/post, national baseline 2026') },
      labor_hours_per_unit: { v: 1.0, prov: est('locate backing, set brackets, hang and level') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools') }, waste_pct: { v: 0, prov: est('fabricated to size') } },
    { code: 'G-TP-CEIL-STEEL-EA', name: 'Ceiling-hung partition support steel allowance, per pilaster', name_es: 'Partida de acero de soporte para mamparas colgadas del techo, por pilastra', unit: 'EA', csi: '05 50 00',
      material_cost_cents: { v: 25000, prov: est('share of unistrut/angle support member, threaded rod and anchors per pilaster; structural design by others') },
      labor_hours_per_unit: { v: 1.5, prov: est('set support member above ceiling before ceiling closes') },
      equipment_cost_cents: { v: 0, prov: est('ladders/rolling scaffold in overhead') }, waste_pct: { v: 5, prov: est('strut and rod cutoffs') } },
  ],
  quantity_rules: [
    { code: 'G-TP-ADA-COMP-EA', assumption: 'Commercial building — one wheelchair compartment per restroom, assumed two restrooms; replace with the counts from the restroom plans', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'G-TP-STD-COMP-EA', assumption: 'Commercial building — assumed two standard compartments total; replace with the counts from the restroom plans', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'G-TP-URINAL-SCRN-EA', assumption: 'Commercial building — assumed one urinal screen in the men\'s room; replace with the counts from the restroom plans', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 1 } },
  ],
  equipment: [
    { when: { building_types: ['commercial', 'industrial'], title_re: 'ceiling[- ]hung' }, type: 'scissor_lift', reason: 'Setting ceiling-hung support steel and anchors above a high restroom ceiling', optional: true },
  ],
  dependency_hints: [
    { after_trades: ['tile', 'acoustical_ceilings', 'plumbing'], note: 'Install after wall/floor tile and after fixtures are set; ceiling-hung anchors go in before the ceiling closes.' },
    { before_phase: 'punch', note: 'Partitions in before accessories (grab bars, dispensers) by the specialties installer and before restroom punch.' },
  ],
});
