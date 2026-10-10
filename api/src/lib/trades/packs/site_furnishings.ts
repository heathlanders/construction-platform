// Trade Knowledge Pack — site_furnishings (Site Furnishings). Wave 19 — NEW-TRADE pattern.
// Dossier: docs/trade-packs/dossiers/site_furnishings.md. Sources: UFGS 12 93 00 Site Furnishings (Part 3 read in full),
// 2010 ADA Standards 226/302/305/307/403/902/903 (Access Board text + guides), Reliance Foundry bollard install docs,
// City of Boston bike-rack guidelines, UMich bench detail, 29 CFR 1926 (C, D, E, H, I, K, O, P, Z).
// permit_trade null → no gating inspections and no code_refs; owner hold points live in inspection_checklists.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['site_furnishings-ufgs-12-93-00'], confidence: 'verified' as const, last_verified: D };
const ada = { src: ['millwork-access-board-ada'], confidence: 'verified' as const, last_verified: D };
const adaRoute = { src: ['millwork-access-board-ada', 'site_furnishings-ab-routes'], confidence: 'verified' as const, last_verified: D };
const adaProtrude = { src: ['millwork-access-board-ada', 'site_furnishings-ab-protruding'], confidence: 'verified' as const, last_verified: D };
const bollard = { src: ['site_furnishings-rf-bollard-brochure', 'site_furnishings-rf-r1009', 'site_furnishings-ufgs-12-93-00'], confidence: 'verified' as const, last_verified: D };
const bike = { src: ['site_furnishings-boston-bike-racks'], confidence: 'derived' as const, last_verified: D, note: 'City of Boston rules used as a representative local standard; the owner/AHJ standard governs.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const COM = ['commercial', 'industrial'] as const;

export default definePack({
  key: 'site_furnishings',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs exterior site furnishings — benches, bike racks, trash and recycling receptacles, picnic tables, small shelters and bollards — set plumb and true on finished paving or in concrete footings, anchored per the maker, placed so accessible routes, clear floor spaces and cane-detectable edges stay compliant, then tested, cleaned and handed over.',
    summary_es: 'Instala mobiliario exterior — bancas, portabicicletas, botes de basura y reciclaje, mesas de picnic, refugios pequeños y bolardos — a plomo y nivel sobre pavimento terminado o en zapatas de concreto, anclados según el fabricante y ubicados para que las rutas accesibles, los espacios libres y los bordes detectables con bastón sigan cumpliendo; luego se prueban, limpian y entregan.',
    glossary: [
      { term: 'Surface mount', term_es: 'Montaje en superficie', def: 'Furnishing bolted through its base plate or feet onto existing concrete or paving with anchors.', def_es: 'Mobiliario atornillado por su placa base o patas sobre concreto o pavimento existente con anclas.' },
      { term: 'Embedded mount', term_es: 'Montaje empotrado', def: 'Legs or post set into a concrete footing or new slab so the item is cast in place.', def_es: 'Patas o poste colocados en una zapata de concreto o losa nueva para que quede colado en sitio.' },
      { term: 'Expansion anchor', term_es: 'Ancla de expansión', def: 'Metal anchor set in a drilled hole that grips the concrete when tightened or driven.', def_es: 'Ancla metálica colocada en un barreno que se sujeta al concreto al apretarla o golpearla.' },
      { term: 'Adhesive anchor', term_es: 'Ancla adhesiva', def: 'Threaded rod set in a drilled, cleaned hole with epoxy or other adhesive.', def_es: 'Varilla roscada colocada en un barreno limpio con epóxico u otro adhesivo.' },
      { term: 'Receiver', term_es: 'Receptáculo', def: 'Cast-in socket that holds a removable bollard; capped flush when the bollard is out.', def_es: 'Base empotrada que sostiene un bolardo removible; se tapa a ras cuando se quita el bolardo.' },
      { term: 'Pipe sleeve', term_es: 'Camisa de tubo', def: 'Larger pipe cast in concrete that a bollard post sits in, then grouted.', def_es: 'Tubo más grande colado en concreto donde se asienta el poste del bolardo y luego se rellena con grout.' },
      { term: 'Accessible route', term_es: 'Ruta accesible', def: 'Continuous path people using wheelchairs can travel; furniture must not narrow it below its required width.', def_es: 'Camino continuo para personas en silla de ruedas; el mobiliario no debe reducirlo por debajo del ancho requerido.' },
      { term: 'Protruding object', term_es: 'Objeto saliente', def: 'Anything sticking into a walkway between 27 and 80 in. high, where a cane will not find it.', def_es: 'Cualquier cosa que sobresale en un pasillo entre 27 y 80 pulg. de alto, donde un bastón no la detecta.' },
      { term: 'Clear floor space', term_es: 'Espacio libre de piso', def: 'A 30 x 48 in. level area beside a bench or table end for a wheelchair.', def_es: 'Área nivelada de 30 x 48 pulg. junto al extremo de una banca o mesa para una silla de ruedas.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'site_furnishings_install',
      example_title: 'Install site benches, bike racks and trash receptacles',
      when: { title_re: 'site furnish|bench|bike rack|bicycle rack|bike parking|trash|litter|recycl|picnic|shelter|planter' },
      steps: [
        {
          title: 'Check grades and lay out locations and clearances',
          instruction: 'Confirm finished paving and grades under each item are complete before starting. Mark each item from the site plan, then check that it leaves the accessible route at least 36 in. clear, gives a 30 x 48 in. clear space at the end of any accessible bench or table, and keeps out of play-equipment use zones. Hold bike racks back from crosswalks, hydrants, driveways, accessible parking and other furniture by the distances the owner standard sets.',
          detail: 'Benches beside lawn: set back about a foot from the turf edge so mowers do not hit them.',
          tools: ['tape measure', 'chalk line', 'marking paint', 'level'],
          materials: ['layout paint'],
          safety_ids: ['traffic_struck'],
          qa_ids: ['route_clear_width', 'clear_floor_space', 'bike_rack_placement', 'outside_play_zones'],
        },
        {
          title: 'Locate utilities and mark anchor holes',
          instruction: 'Get utility locates before drilling or digging, and check for irrigation, lighting conduit and snowmelt lines in the slab. Set the item in place or use its template to mark anchor holes; keep holes the edge distance the anchor maker calls for from slab edges and joints.',
          tools: ['tape measure', 'marker', 'template from maker'],
          materials: [],
          safety_ids: ['utility_strike'],
          qa_ids: ['anchor_type_per_substrate'],
        },
        {
          title: 'Drill and set anchors',
          instruction: 'Drill to the diameter and depth the anchor maker gives, using a drill with a dust shroud and vacuum. Blow and brush the hole clean, then set expansion anchors or inject adhesive and set rod as the maker directs and let it cure before loading. Use expansion shields or inserts in concrete and toggle or through bolts in masonry; never wood plugs.',
          tools: ['hammer drill with dust shroud and HEPA vacuum', 'hole brush and blower', 'torque wrench', 'adhesive dispenser'],
          materials: ['stainless or galvanized anchors', 'adhesive cartridges'],
          safety_ids: ['silica_drilling', 'adhesive_chem', 'power_tool', 'eye_flying', 'noise'],
          qa_ids: ['anchor_type_per_substrate', 'dissimilar_metals'],
        },
        {
          title: 'Assemble, level and secure each item',
          instruction: 'Assemble with the maker’s parts only, keeping the work out of pedestrian and vehicle paths. Set each item plumb and true, shim only as the maker allows, and tighten fasteners to the maker’s torque. Isolate aluminum from concrete and dissimilar metals from each other. Shelters: fasten clip angles to the concrete with at least two expansion bolts per the spec.',
          tools: ['socket set', 'torque wrench', 'level', 'drill/driver'],
          materials: ['maker hardware kit', 'isolation coating or pads', 'tamper-resistant fasteners'],
          safety_ids: ['heavy_lift', 'material_storage', 'power_tool'],
          qa_ids: ['plumb_true', 'protruding_objects', 'accessible_bench_dims', 'accessible_dining', 'dissimilar_metals'],
        },
        {
          title: 'Test anchorage, clean and hand over',
          instruction: 'Push and pull each item to confirm it is solid; replace any anchor that spins or pulls. Measure installed heights and clearances against the plan and maker’s data and write them up. Touch up damaged finishes and galvanizing, clean off dust and filings, repair damaged paving or turf, and barricade any area not ready for the public.',
          tools: ['tape measure', 'touch-up kit', 'broom and HEPA vacuum'],
          materials: ['touch-up paint', 'zinc-rich repair compound'],
          safety_ids: ['traffic_struck', 'silica_drilling'],
          qa_ids: ['anchor_test', 'cleanup_restore'],
        },
      ],
    },
    {
      id: 'bollard_install',
      example_title: 'Install steel pipe bollards and removable bollards at the drive entrance',
      when: { title_re: 'bollard' },
      priority: 10,
      steps: [
        {
          title: 'Lay out bollards and locate utilities',
          instruction: 'Mark each bollard from the site plan, keeping the accessible route clear width between bollards and the design spacing. Get utility locates and check for buried power, gas, water and lighting conduit before any core or hole. Confirm whether the bollard is impact-protective or decorative — that sets the mount.',
          tools: ['tape measure', 'marking paint', 'string line'],
          materials: ['layout paint'],
          safety_ids: ['utility_strike', 'traffic_struck'],
          qa_ids: ['route_clear_width'],
        },
        {
          title: 'Core or excavate the footing',
          instruction: 'In existing paving, core-drill or saw the slab wet, then auger or dig the footing to the size and depth on the drawing or maker’s sheet. Impact-protective bollards go below frost depth. Keep spoil back from the hole edge and cover or barricade open holes at the end of each shift.',
          tools: ['core drill with water feed', 'walk-behind or hand saw with water', 'auger or post-hole digger', 'shovel'],
          materials: ['water for dust control'],
          safety_ids: ['silica_drilling', 'utility_strike', 'open_hole', 'noise', 'eye_flying'],
          qa_ids: ['bollard_footing'],
        },
        {
          title: 'Set the post, sleeve or receiver and pour',
          instruction: 'Set the pipe, sleeve or receiver on a brace at the height the maker shows, plumb it both ways and brace it. Place concrete of the strength specified; fill sleeves around the post with non-shrink grout or anchoring cement. Set removable-bollard receivers flush with the finished surface so the lid sits level when the bollard is out.',
          detail: 'Steel bollards are heavy — plan the lift with two people or a machine before lowering them in.',
          tools: ['level', 'braces', 'wheelbarrow', 'finishing trowel'],
          materials: ['concrete', 'non-shrink grout', 'sleeves or receivers', 'braces'],
          safety_ids: ['heavy_lift', 'cement_burn', 'material_storage'],
          qa_ids: ['bollard_footing', 'bollard_plumb_grouted', 'receiver_flush'],
        },
        {
          title: 'Finish, test and protect',
          instruction: 'After cure, fill and dome the pipe or fit the cap, install covers, reflective bands or finish as specified, and touch up coatings. Lift out and reset each removable bollard and lock it to prove the receiver and lock work, then leave the lids and keys with the owner. Barricade until the concrete has cured.',
          tools: ['touch-up kit', 'keys/tools for removable bollards'],
          materials: ['bollard covers or caps', 'reflective tape', 'touch-up paint'],
          safety_ids: ['heavy_lift', 'traffic_struck'],
          qa_ids: ['receiver_flush', 'anchor_test', 'cleanup_restore'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'bollard|shelter|picnic' }, step_re: 'core|excavate|footing', type: 'skid_steer', reason: 'Auger bollard and post footings and move spoil', optional: true },
    { when: { title_re: 'bollard|site furnish|bench|bike|trash|picnic|shelter' }, step_re: 'drill|core', type: 'generator', reason: 'Power the core drill, hammer drill and HEPA vacuum where no outlet is near', optional: true },
    { when: { title_re: 'shelter|picnic|site furnish' }, step_re: 'assemble', type: 'forklift', reason: 'Unload and set heavy tables, shelters and receptacles', optional: true },
  ],
  hazards: [
    { id: 'utility_strike', hazard: 'Hitting a buried power, gas or lighting line while coring, drilling or digging footings', hazard_es: PENDING_ES, controls: ['Get utility locates and find the estimated location of underground lines before any hole', 'Check drawings for conduit and snowmelt lines in the slab; hand-dig near marks'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'silica_drilling', hazard: 'Breathing silica dust when coring, sawing or drilling anchor holes in concrete and pavers', hazard_es: PENDING_ES, controls: ['Use drills with a shroud and dust collector, and wet coring and sawing, per the silica Table 1 rows', 'Clean holes with a HEPA vacuum; no dry sweeping or compressed air on the dust'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator when Table 1 requires'], prov: osha('z') },
    { id: 'open_hole', hazard: 'People, spoil or tools falling into open footing holes', hazard_es: PENDING_ES, controls: ['Keep spoil and equipment at least 2 ft back from the hole edge', 'Cover or barricade holes at the end of each shift'], controls_es: PENDING_ES, osha_ref: '1926.651(j)(2)', severity: 2, prov: osha('p') },
    { id: 'heavy_lift', hazard: 'Back strain or crushed hands lifting benches, tables, receptacles and steel bollards', hazard_es: PENDING_ES, controls: ['Two-person or machine lift for heavy items; plan the lift before it starts', 'Keep hands out of pinch points when lowering onto anchors'], controls_es: PENDING_ES, osha_ref: '1926.20(b)', severity: 3, ppe: ['gloves', 'safety boots'], prov: osha('c') },
    { id: 'material_storage', hazard: 'Stacked furnishings or bollards sliding or rolling off a stack', hazard_es: PENDING_ES, controls: ['Stack, block and secure crated and round items so they cannot slide, fall or roll'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 2, prov: osha('h') },
    { id: 'adhesive_chem', hazard: 'Skin and eye contact with epoxy anchor adhesive and grout', hazard_es: PENDING_ES, controls: ['Read the SDS; wear chemical-resistant gloves and eye protection', 'Wash skin promptly; dispose of mixing nozzles as the SDS directs'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d') },
    { id: 'cement_burn', hazard: 'Skin burns from wet concrete and grout setting posts', hazard_es: PENDING_ES, controls: ['Wear waterproof gloves, long sleeves and boots; wash skin promptly if soaked'], controls_es: PENDING_ES, osha_ref: '1926.28(a)', severity: 2, ppe: ['waterproof gloves', 'boots'], prov: osha('c') },
    { id: 'power_tool', hazard: 'Kickback or bind from hammer drills, core drills and saws', hazard_es: PENDING_ES, controls: ['Keep guards in place and use side handles; anchor or brace core drills', 'Inspect tools and use the right bit for the material'], controls_es: PENDING_ES, osha_ref: '1926.300(b)', severity: 3, ppe: ['gloves', 'safety glasses'], prov: osha('i') },
    { id: 'eye_flying', hazard: 'Eye injury from concrete chips and metal filings', hazard_es: PENDING_ES, controls: ['Wear safety glasses or a face shield when drilling, cutting and grinding'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'noise', hazard: 'Hearing damage from core drills, saws and hammer drills', hazard_es: PENDING_ES, controls: ['Wear hearing protection when running saws, core drills and hammer drills'], controls_es: PENDING_ES, osha_ref: '1926.101(a)', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('e') },
    { id: 'traffic_struck', hazard: 'Struck by vehicles or equipment working at drives, parking lots and sidewalks', hazard_es: PENDING_ES, controls: ['Barricade and sign the work area from traffic and pedestrians', 'Use a spotter or working reverse alarm on equipment with an obstructed rear view'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(4)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'cord_shock', hazard: 'Electric shock from cords and generators running drills in wet conditions', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Inspect cords daily and keep them out of water'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
  ],
  qa_checklist: [
    { id: 'route_clear_width', item: 'Installed furnishings and bollards leave the accessible route at least 36 in. clear (32 in. only for short runs up to 24 in. long); the route stays firm, stable and slip resistant.', item_es: { status: 'translated', text: 'El mobiliario y los bolardos instalados dejan la ruta accesible con al menos 36 pulg. libres (32 pulg. solo en tramos de hasta 24 pulg.); la ruta sigue firme, estable y antideslizante.' }, prov: adaRoute },
    { id: 'clear_floor_space', item: 'Every bench or table designated accessible has a level 30 x 48 in. clear space at its end (bench: parallel to the short axis) on the accessible route.', item_es: { status: 'translated', text: 'Cada banca o mesa designada accesible tiene un espacio libre nivelado de 30 x 48 pulg. en su extremo (banca: paralelo al eje corto) sobre la ruta accesible.' }, prov: ada },
    { id: 'protruding_objects', item: 'Nothing with a leading edge between 27 and 80 in. high sticks more than 4 in. into a walkway; post-mounted items overhang 12 in. max; shelter roofs and signs leave 80 in. headroom.', item_es: PENDING_ES, safety: true, prov: adaProtrude },
    { id: 'accessible_bench_dims', item: 'Benches designated accessible: seat 42 in. long min, 20–24 in. deep, top 17–19 in. above the ground, with back support 42 in. long from ≤2 in. to ≥18 in. above the seat, and a slip-resistant seat that sheds water.', item_es: { status: 'translated', text: 'Bancas designadas accesibles: asiento de 42 pulg. de largo mín., 20–24 pulg. de fondo, 17–19 pulg. sobre el suelo, respaldo de 42 pulg. de largo desde ≤2 hasta ≥18 pulg. sobre el asiento, y asiento antideslizante que no acumula agua.' }, prov: ada },
    { id: 'accessible_dining', item: 'Where tables are provided for eating, at least 5% of seating spaces are accessible: top 28–34 in. high with knee and toe clearance and clear floor space for a forward approach.', item_es: { status: 'translated', text: 'Donde hay mesas para comer, al menos 5% de los lugares son accesibles: cubierta a 28–34 pulg. de alto con espacio para rodillas y pies y espacio libre para aproximación frontal.' }, prov: { src: ['millwork-access-board-ada'], confidence: 'derived', last_verified: D, note: 'ADA 226.1/902 dining-surface scoping applied to outdoor tables; confirm with the design — outdoor picnic tables on federal sites follow the ABA outdoor rules.' } },
    { id: 'outside_play_zones', item: 'No furnishing sits inside a play-equipment use zone.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'bike_rack_placement', item: 'Bike racks sit visible and lit near the entrance, keep owner/AHJ clearances from crosswalks, hydrants, drives, accessible parking and furniture; each rack gives two points of frame contact and takes a U-lock around frame and one wheel.', item_es: { status: 'translated', text: 'Los portabicicletas están en un lugar visible e iluminado cerca de la entrada y respetan las distancias del propietario o autoridad a cruces, hidrantes, entradas, estacionamiento accesible, paradas de autobús y otro mobiliario; cada uno da dos puntos de contacto al cuadro y admite un candado en U por el cuadro y una rueda.' }, prov: bike },
    { id: 'anchor_type_per_substrate', item: 'Anchors match the substrate and maker’s data — expansion shields or inserts in concrete, toggle or through bolts in masonry; no wood plugs; drilled holes cleaned before setting.', item_es: { status: 'translated', text: 'Las anclas corresponden a la base y a los datos del fabricante — taquetes de expansión o insertos en concreto, pernos de palanca o pasantes en mampostería; sin tacos de madera; barrenos limpios antes de colocar.' }, prov: ufgs },
    { id: 'plumb_true', item: 'Finished grades and paving were complete before setting; every item is plumb, level and true at the location shown, assembled with the maker’s own parts.', item_es: { status: 'translated', text: 'Niveles y pavimento terminados antes de colocar; cada pieza está a plomo, nivelada y alineada en la ubicación indicada, armada con piezas del propio fabricante.' }, prov: ufgs },
    { id: 'dissimilar_metals', item: 'Aluminum touching concrete and dissimilar metals touching each other are isolated with a coating or pads; exposed fasteners match the finish.', item_es: { status: 'translated', text: 'El aluminio en contacto con concreto y los metales distintos en contacto entre sí están aislados con recubrimiento o almohadillas; la tornillería expuesta coincide con el acabado.' }, prov: ufgs },
    { id: 'bollard_footing', item: 'Impact-protective vs decorative bollard confirmed before choosing the mount; footings match the drawing or maker’s size, depth and concrete strength; impact-protective bollards reach below frost depth.', item_es: PENDING_ES, safety: true, prov: bollard },
    { id: 'bollard_plumb_grouted', item: 'Bollards are plumb both ways, at the shown height, and sleeves are filled with non-shrink grout or anchoring cement.', item_es: { status: 'translated', text: 'Los bolardos están a plomo en ambos sentidos, a la altura indicada, y las camisas están rellenas con grout sin contracción o cemento de anclaje.' }, prov: ufgs },
    { id: 'receiver_flush', item: 'Removable-bollard receivers sit flush with the finished surface, lids close level, and each bollard locks and releases as designed.', item_es: PENDING_ES, safety: true, prov: { src: ['site_furnishings-rf-bollard-brochure'], confidence: 'derived', last_verified: D, note: 'Flush-receiver trip-hazard check derived from the maker’s embedded-receiver method; confirm with the product sheet.' } },
    { id: 'anchor_test', item: 'Each installed item is pushed and pulled to prove it is secure; heights and clearances are measured against the plan and maker; failing items reinstalled and bad anchors replaced, with a written report.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'cleanup_restore', item: 'Furnishings cleaned per the maker, damaged galvanizing or finish repaired, and paving or turf damaged by the work restored.', item_es: { status: 'translated', text: 'Mobiliario limpio según el fabricante, galvanizado o acabado dañado reparado, y pavimento o césped dañado por el trabajo restaurado.' }, prov: ufgs },
  ],
  inspection_checklists: {
    layout_ada_clearance: [
      { item: 'Locations match the site plan; finished grades and paving complete', item_es: { status: 'translated', text: 'Ubicaciones según el plano de sitio; niveles y pavimento terminados' } },
      { item: 'Accessible route keeps 36 in. clear past every item', item_es: { status: 'translated', text: 'La ruta accesible conserva 36 pulg. libres junto a cada pieza' }, ref: 'ADA 2010 403.5.1' },
      { item: '30 x 48 in. clear space at accessible benches and tables', item_es: { status: 'translated', text: 'Espacio libre de 30 x 48 pulg. en bancas y mesas accesibles' }, ref: 'ADA 2010 305.3 / 903.2' },
      { item: 'No protruding objects in walkways; 80 in. headroom kept', item_es: PENDING_ES, ref: 'ADA 2010 307' },
      { item: 'Bike-rack clearances meet the owner/AHJ standard', item_es: { status: 'translated', text: 'Las distancias de los portabicicletas cumplen la norma del propietario o autoridad' } },
    ],
    anchorage_footing: [
      { item: 'Utility locates on file before coring or digging', item_es: PENDING_ES },
      { item: 'Anchor type, size and embedment match the maker’s data', item_es: { status: 'translated', text: 'Tipo, tamaño y empotramiento de anclas según los datos del fabricante' } },
      { item: 'Bollard footing size and depth checked before concrete; impact bollards below frost', item_es: PENDING_ES },
      { item: 'Posts and sleeves plumb and braced; receivers set flush', item_es: { status: 'translated', text: 'Postes y camisas a plomo y apuntalados; receptáculos a ras' } },
    ],
    final_acceptance: [
      { item: 'Every item tested secure; heights and clearances recorded in a written report', item_es: PENDING_ES },
      { item: 'Removable bollards lock and release; keys and lids handed to owner', item_es: { status: 'translated', text: 'Los bolardos removibles cierran y liberan; llaves y tapas entregadas al propietario' } },
      { item: 'Finishes touched up, site cleaned and damaged areas restored', item_es: { status: 'translated', text: 'Acabados retocados, sitio limpio y áreas dañadas restauradas' } },
      { item: 'Maker’s care instructions and warranty handed to owner', item_es: { status: 'translated', text: 'Instrucciones de cuidado y garantía del fabricante entregadas al propietario' } },
    ],
  },
  assemblies: [
    { code: 'G-SFN-BENCH-SM-EA', name: 'Site bench, 6 ft metal with back, surface-mounted on existing concrete (furnished + installed)', name_es: 'Banca de sitio metálica de 6 pies con respaldo, montada sobre concreto existente (suministro e instalación)', unit: 'EA', csi: '12 93 00',
      material_cost_cents: { v: 140000, prov: est('mid-range commercial powder-coated steel bench + 4 stainless anchors, national 2026') }, labor_hours_per_unit: { v: 2.5, prov: est('2-person crew: unload, layout, drill 4 anchors, set, torque') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools') }, waste_pct: { v: 0, prov: est('furnished unit — no waste') } },
    { code: 'G-SFN-BIKERACK-EA', name: 'Bike rack, inverted-U galvanized/powder-coated steel, surface-mounted (2 bikes)', name_es: 'Portabicicletas en U invertida de acero galvanizado o con pintura en polvo, montaje en superficie (2 bicicletas)', unit: 'EA', csi: '12 93 43',
      material_cost_cents: { v: 30000, prov: est('commercial inverted-U rack + anchors, national 2026') }, labor_hours_per_unit: { v: 1.25, prov: est('layout, drill and anchor 2 flanges') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools') }, waste_pct: { v: 0, prov: est('furnished unit') } },
    { code: 'G-SFN-TRASH-EA', name: 'Trash/recycling receptacle, 32 gal steel with liner and lid, surface-mounted', name_es: 'Bote de basura o reciclaje de 32 gal de acero con bolsa interior y tapa, montaje en superficie', unit: 'EA', csi: '12 93 23',
      material_cost_cents: { v: 110000, prov: est('commercial steel receptacle with liner + anchors, national 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('unload, set, anchor') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools') }, waste_pct: { v: 0, prov: est('furnished unit') } },
    { code: 'G-SFN-PICNIC-EA', name: 'Picnic table, 6 ft coated steel, surface-mounted, with accessible wheelchair end', name_es: 'Mesa de picnic de 6 pies de acero recubierto, montaje en superficie, con extremo accesible para silla de ruedas', unit: 'EA', csi: '12 93 00',
      material_cost_cents: { v: 180000, prov: est('commercial coated-steel table + anchors, national 2026') }, labor_hours_per_unit: { v: 3, prov: est('assemble, set, anchor 4 feet') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools') }, waste_pct: { v: 0, prov: est('furnished unit') } },
    { code: 'G-SFN-BOLLARD-RMV-EA', name: 'Removable bollard with locking embedded receiver, cored into existing slab', name_es: 'Bolardo removible con receptáculo empotrado con cerradura, perforado en losa existente', unit: 'EA', csi: '12 93 00',
      description: 'Fixed steel-pipe bollards in a footing are the existing B-MISC-BOLLARD-EA line.',
      material_cost_cents: { v: 75000, prov: est('decorative removable bollard + receiver + grout, national 2026') }, labor_hours_per_unit: { v: 3, prov: est('core, set receiver flush, grout, fit bollard') },
      equipment_cost_cents: { v: 4000, prov: est('core drill rental share') }, waste_pct: { v: 3, prov: est('grout waste') } },
  ],
  quantity_rules: [
    { code: 'G-SFN-BENCH-SM-EA', assumption: 'Two site benches at a commercial entrance plaza — adjust to the site plan count', when: { building_types: [...COM] }, qty: { basis: 'const', mul: 2 } },
    { code: 'G-SFN-BIKERACK-EA', assumption: 'Two inverted-U racks (4 bikes) near the main entrance — size to the local bike-parking requirement', when: { building_types: ['commercial', 'industrial', 'residential_mf'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'G-SFN-TRASH-EA', assumption: 'Two receptacles at the entrance and seating area — adjust to the site plan count', when: { building_types: [...COM] }, qty: { basis: 'const', mul: 2 } },
    { code: 'G-SFN-PICNIC-EA', assumption: 'One accessible picnic table at a multifamily common area — adjust to the amenity plan', when: { building_types: ['residential_mf'] }, qty: { basis: 'const' } },
  ],
  dependency_hints: [
    { after_trades: ['concrete_flatwork', 'asphalt_paving', 'hardscape_pavers'], before_phase: 'punch', note: 'Paving and grades done first; surface-mounted furnishings set on cured paving, then punch.' },
  ],
});
