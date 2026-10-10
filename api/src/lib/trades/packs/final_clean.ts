// Trade Knowledge Pack — final_clean (Final / Construction Cleaning). Wave 18, COMPLEMENT pattern:
// the hand recipe in task-buildout/nopermit.ts ('Final clean') keeps producing the work step; this pack
// adds glossary, hazards, QA, owner hold-point checklists (no permit path), lift equipment hints and
// assemblies the catalog lacks. G-CLEAN-SF (final clean per SF) already exists and is seeded by
// quantities.ts seedGeneral on every project — never redeclared or re-seeded here.
// Dossier: docs/trade-packs/dossiers/final_clean.md. Sources: UFGS 01 78 00 §3.8, GANA GIB 01-0300,
// 29 CFR 1926 Subparts C, D, E, H, I, K, L, M, X, Z (1926.1153(f) silica housekeeping).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['final_clean-ufgs-01-78-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const gana = (note?: string) => ({ src: ['final_clean-gana-01-0300'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const silica = { src: ['ecfr-1926-z', 'final_clean-osha-silica-construction'], confidence: 'verified' as const, last_verified: D };
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'final_clean',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Construction cleaning from rough clean after drywall through final clean and turnover: debris removal, dust control, glass and frame cleaning, label and residue removal, fixtures and floors, HVAC filter change and the owner walkthrough punch.',
    summary_es: 'Limpieza de obra desde la limpieza gruesa después del tablaroca hasta la limpieza final y entrega: retiro de escombro, control de polvo, limpieza de vidrios y marcos, retiro de etiquetas y residuos, muebles sanitarios y pisos, cambio de filtros de climatización y recorrido final con el propietario.',
    glossary: [
      { term: 'Rough clean', term_es: 'Limpieza gruesa', def: 'Mid-job pass that removes debris, scrap and heavy dust so finish trades can start.', def_es: 'Pasada a mitad de obra que retira escombro, sobrantes y polvo grueso para que entren los oficios de acabado.' },
      { term: 'Final clean', term_es: 'Limpieza final', def: 'Top-down detailed clean that leaves every surface ready for the owner to move in.', def_es: 'Limpieza detallada de arriba hacia abajo que deja cada superficie lista para que el propietario se mude.' },
      { term: 'Touch-up clean', term_es: 'Limpieza de retoque', def: 'Quick re-clean after punch-list repairs, just before the owner walkthrough.', def_es: 'Re-limpieza rápida después de las reparaciones de la lista de pendientes, justo antes del recorrido con el propietario.' },
      { term: 'Broom clean', term_es: 'Barrido limpio', def: 'Floors swept or vacuumed free of debris and loose dust, with no waste left on site.', def_es: 'Pisos barridos o aspirados sin escombro ni polvo suelto, sin desperdicio en la obra.' },
      { term: 'HEPA vacuum', term_es: 'Aspiradora HEPA', def: 'Vacuum with a high-efficiency filter that traps fine dust such as silica instead of blowing it back out.', def_es: 'Aspiradora con filtro de alta eficiencia que atrapa polvo fino como la sílice en lugar de expulsarlo.' },
      { term: 'Coated glass', term_es: 'Vidrio con recubrimiento', def: 'Glass with a reflective or low-e film on a surface; it scratches easily and is never scraped.', def_es: 'Vidrio con una película reflejante o de baja emisividad en una cara; se raya fácilmente y nunca se raspa.' },
      { term: 'Squeegee', term_es: 'Jalador (escurridor)', def: 'Rubber-blade tool that pulls cleaning solution off glass in one pass.', def_es: 'Herramienta con hoja de hule que retira la solución de limpieza del vidrio en una pasada.' },
      { term: 'SDS', term_es: 'Hoja de datos de seguridad (SDS)', def: 'Safety Data Sheet — the maker’s sheet for each cleaning chemical: hazards, PPE and first aid.', def_es: 'Hoja de datos de seguridad del fabricante para cada químico de limpieza: peligros, equipo de protección y primeros auxilios.' },
      { term: 'Owner walkthrough', term_es: 'Recorrido con el propietario', def: 'Final room-by-room review with the owner that produces the last punch list before turnover.', def_es: 'Revisión final cuarto por cuarto con el propietario que genera la última lista de pendientes antes de la entrega.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  equipment: [
    { when: { title_re: 'clean', building_types: ['commercial', 'industrial', 'residential_mf'] }, step_re: 'clean', type: 'scissor_lift', reason: 'Reach high interior glass, light fixtures and ceilings without ladders', optional: true },
    { when: { title_re: 'clean', building_types: ['commercial', 'industrial'] }, step_re: 'clean', type: 'boom_lift', reason: 'Clean exterior storefront and upper-level glass where no permanent access exists', optional: true },
  ],
  hazards: [
    { id: 'silica_sweep', hazard: 'Breathing respirable silica dust stirred up by dry sweeping or blowing off concrete, drywall and masonry dust', hazard_es: PENDING_ES, controls: ['Do not dry sweep or dry brush silica-bearing dust; wet sweep or use a HEPA vacuum', 'Do not clean surfaces or clothing with compressed air unless the dust cloud is captured by ventilation or no other method works'], controls_es: PENDING_ES, osha_ref: '1926.1153(f)', severity: 3, ppe: ['respirator where required by the exposure plan'], prov: silica },
    { id: 'chemicals', hazard: 'Skin, eye and lung injury from cleaning chemicals (acids, solvents, strippers), including mixing incompatible products', hazard_es: PENDING_ES, controls: ['Keep the SDS for every product on site and read the label before use', 'Never mix products; use only labeled containers and ventilate the area'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 3, ppe: ['chemical-resistant gloves', 'safety glasses or goggles'], prov: osha('d', '1926.59 adopts the 29 CFR 1910.1200 hazard communication standard for construction.') },
    { id: 'eye_splash', hazard: 'Chemical splash or debris in the eyes while scraping, spraying or working overhead', hazard_es: PENDING_ES, controls: ['Wear eye protection when spraying, scraping or cleaning above head height', 'Use goggles or a face shield with corrosive products'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses', 'goggles or face shield for corrosives'], prov: osha('e') },
    { id: 'ladder', hazard: 'Falls from ladders while cleaning high glass, fixtures and trim', hazard_es: PENDING_ES, controls: ['Extend ladder rails 3 ft above any landing or secure the top', 'Keep three points of contact; move the ladder instead of reaching'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'aerial_lift', hazard: 'Fall or ejection from a lift used to clean high glass and fixtures', hazard_es: PENDING_ES, controls: ['Stand on the basket floor — never on the rails, a ladder or a bucket', 'Wear a harness with the lanyard tied off to the boom or basket'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness and lanyard in boom lifts'], prov: osha('l') },
    { id: 'open_edge', hazard: 'Falls through openings or from unguarded edges while cleaning balconies, mezzanines and open shafts', hazard_es: PENDING_ES, controls: ['Do not remove guardrails or hole covers to clean; ask the superintendent first', 'Use fall arrest at 6 ft or more where guardrails are down'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, prov: osha('m') },
    { id: 'compressed_air', hazard: 'Air injection and flying particles from blowing off surfaces with compressed air', hazard_es: PENDING_ES, controls: ['Only use compressed air reduced below 30 psi, with chip guarding and PPE', 'Never point an air nozzle at a person or at your own skin'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(4)', severity: 2, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'debris_trips', hazard: 'Trips and punctures from scrap, nails and rubbish in rooms, halls and stairs', hazard_es: PENDING_ES, controls: ['Keep debris cleared from work areas, passageways and stairs', 'Collect waste in containers; cover containers for oily rags and hazardous waste'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, ppe: ['puncture-resistant boots'], prov: osha('c') },
    { id: 'oily_rags', hazard: 'Fire from solvent-soaked rags and flammable cleaners left in open piles', hazard_es: PENDING_ES, controls: ['Keep solvent waste and oily rags in fire-resistant covered containers until removed from site', 'Remove combustible debris at regular intervals'], controls_es: PENDING_ES, osha_ref: '1926.252(e)', severity: 3, prov: osha('h') },
    { id: 'debris_drop', hazard: 'Struck by debris thrown or dropped from upper floors during cleanout', hazard_es: PENDING_ES, controls: ['Use an enclosed chute when dropping debris more than 20 ft outside the building', 'Barricade and sign the landing area below any floor opening used for debris'], controls_es: PENDING_ES, osha_ref: '1926.252(a)', severity: 3, ppe: ['hard hat'], prov: osha('h') },
    { id: 'shock', hazard: 'Electric shock from floor machines, pressure washers and wet cords', hazard_es: PENDING_ES, controls: ['Plug every machine into GFCI-protected outlets', 'Keep cords out of water and pull damaged cords from service'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)(ii)', severity: 3, prov: osha('k') },
  ],
  qa_checklist: [
    { id: 'top_down', item: 'Cleaning sequenced top-down and room by room so finished lower surfaces are not re-soiled.', item_es: tr('Limpieza en secuencia de arriba hacia abajo y cuarto por cuarto para no ensuciar de nuevo las superficies inferiores ya terminadas.'), prov: gana('Top-down sequence stated for glass; applied to the whole clean.') },
    { id: 'glass_type_known', item: 'Coated, tinted and reflective glass identified and exposed coated faces marked before any glass is cleaned.', item_es: tr('Vidrio con recubrimiento, entintado y reflejante identificado, y caras con recubrimiento expuestas marcadas antes de limpiar cualquier vidrio.'), prov: gana() },
    { id: 'glass_test_area', item: 'One small window or area test-cleaned and inspected in direct sunlight for scratches before full glass cleaning.', item_es: tr('Una ventana o área pequeña limpiada de prueba e inspeccionada bajo luz solar directa en busca de rayones antes de limpiar todo el vidrio.'), prov: gana() },
    { id: 'no_blade_scraping', item: 'No blade scraping of glass beyond small spots on non-coated glass with a new 1 in. blade, one direction only; stubborn stains referred to the glass supplier.', item_es: tr('Sin raspado de vidrio con navaja salvo puntos pequeños en vidrio sin recubrimiento con navaja nueva de 1 pulg, en una sola dirección; manchas difíciles se consultan con el proveedor del vidrio.'), prov: gana() },
    { id: 'glass_streak_free', item: 'Interior and exterior glass exposed to view clean and streak-free; gaskets, sealants and frames dried of solution.', item_es: tr('Vidrio interior y exterior a la vista limpio y sin rayas; empaques, selladores y marcos secos de solución.'), prov: gana() },
    { id: 'labels_removed', item: 'Temporary labels, protective films, stickers, paint, mortar and adhesive residue removed from all finished surfaces.', item_es: tr('Etiquetas temporales, películas protectoras, calcomanías, pintura, mortero y residuos de adhesivo retirados de todas las superficies terminadas.'), prov: ufgs() },
    { id: 'fixtures_sanitary', item: 'Plumbing fixtures, appliances, cabinets and equipment cleaned to a sanitary condition inside and out.', item_es: tr('Muebles sanitarios, electrodomésticos, gabinetes y equipos limpios en condición sanitaria por dentro y por fuera.'), prov: ufgs() },
    { id: 'floors_by_type', item: 'Floors cleaned by the method the flooring maker allows; carpet vacuumed; no abrasive pads or strippers on finished floors.', item_es: tr('Pisos limpiados con el método que permite el fabricante del piso; alfombra aspirada; sin fibras abrasivas ni removedores sobre pisos terminados.'), prov: ufgs('§3.8 vacuum carpeted and soft surfaces; floor-finish method per flooring maker (platform practice).') },
    { id: 'hvac_filters', item: 'HVAC filters cleaned or replaced after the final clean and before turnover; supply registers and returns wiped free of dust.', item_es: tr('Filtros de climatización limpiados o reemplazados después de la limpieza final y antes de la entrega; rejillas de suministro y retorno sin polvo.'), prov: ufgs() },
    { id: 'roof_drains_clear', item: 'Roofs, gutters, downspouts and site drains cleared of construction debris.', item_es: tr('Techos, canalones, bajantes y drenajes del sitio libres de escombro de obra.'), prov: ufgs() },
    { id: 'site_swept', item: 'Paved areas swept, landscaped areas raked, and all waste, surplus and temporary facilities removed from the site.', item_es: tr('Áreas pavimentadas barridas, áreas verdes rastrilladas, y todo desperdicio, sobrante e instalación temporal retirado del sitio.'), prov: ufgs() },
    { id: 'products_low_hazard', item: 'Cleaning products are low-hazard general-purpose types; an SDS is on site for every product used.', item_es: PENDING_ES, safety: true, prov: { src: ['final_clean-ufgs-01-78-00', 'ecfr-1926-d'], confidence: 'verified' as const, last_verified: D, note: 'UFGS 3.8 nonhazardous products; 1926.59 SDS availability.' } },
    { id: 'no_dry_sweep', item: 'Silica-bearing dust removed by wet sweeping or HEPA vacuum — no dry sweeping or compressed-air blowing.', item_es: PENDING_ES, safety: true, prov: silica },
    { id: 'cleanup_list', item: 'Signed list of completed clean-up items, by room, handed to the superintendent before the owner walkthrough.', item_es: tr('Lista firmada de las tareas de limpieza terminadas, por cuarto, entregada al superintendente antes del recorrido con el propietario.'), prov: ufgs() },
  ],
  inspection_checklists: {
    rough_clean_release: [
      { item: 'Scrap, drywall offcuts and packaging removed from every room, hall and stair', item_es: tr('Sobrantes, recortes de tablaroca y empaques retirados de cada cuarto, pasillo y escalera'), ref: '29 CFR 1926.25(a)' },
      { item: 'Dust removed by HEPA vacuum or wet methods; no dry sweeping', item_es: PENDING_ES, ref: '29 CFR 1926.1153(f)' },
      { item: 'Floor and fixture protection still in place where finish trades work next', item_es: tr('Protección de pisos y muebles sanitarios aún colocada donde trabajan después los oficios de acabado') },
    ],
    owner_walkthrough: [
      { item: 'Glass, frames and sills clean inside and out with no scratches from cleaning', item_es: tr('Vidrios, marcos y repisas limpios por dentro y por fuera sin rayones por la limpieza'), ref: 'GANA 01-0300' },
      { item: 'No labels, films, paint spatter or adhesive residue on finished surfaces', item_es: tr('Sin etiquetas, películas, salpicaduras de pintura ni residuos de adhesivo en superficies terminadas'), ref: 'UFGS 01 78 00 §3.8' },
      { item: 'Fixtures, appliances, cabinet interiors and drawers clean', item_es: tr('Muebles sanitarios, electrodomésticos, interiores de gabinetes y cajones limpios') },
      { item: 'Floors clean and undamaged; carpet vacuumed', item_es: tr('Pisos limpios y sin daños; alfombra aspirada') },
      { item: 'Light fixtures, diffusers and returns free of dust and dead insects', item_es: tr('Luminarias, difusores y rejillas de retorno sin polvo ni insectos muertos') },
    ],
    turnover: [
      { item: 'HVAC filters replaced after final clean; replacement date written on the filter frame', item_es: tr('Filtros de climatización reemplazados después de la limpieza final; fecha de cambio escrita en el marco del filtro'), ref: 'UFGS 01 78 00 §3.8' },
      { item: 'Touch-up clean done after punch repairs', item_es: tr('Limpieza de retoque hecha después de las reparaciones de pendientes') },
      { item: 'Site, gutters and drains clear; dumpsters, toilets and temporary facilities gone', item_es: tr('Sitio, canalones y drenajes despejados; contenedores, sanitarios portátiles e instalaciones temporales retirados') },
      { item: 'Completed clean-up list signed and filed with closeout documents', item_es: tr('Lista de limpieza terminada firmada y archivada con los documentos de cierre') },
    ],
  },
  assemblies: [
    { code: 'G-CLN-ROUGH-SF', name: 'Rough / progress clean after drywall (debris out, HEPA vacuum), per SF floor', name_es: 'Limpieza gruesa / de avance después del tablaroca (retiro de escombro, aspirado HEPA), por pie² de piso', unit: 'SF', csi: '01 74 13',
      material_cost_cents: { v: 1, prov: est('bags, HEPA filters and consumables share') }, labor_hours_per_unit: { v: 0.0025, prov: est('one laborer ≈400 SF/hr for a debris + vacuum pass') },
      equipment_cost_cents: { v: 0, prov: est('HEPA vacuums owned; waste hauling priced by the hauling trade') }, waste_pct: { v: 0, prov: est('no material waste') } },
    { code: 'G-CLN-WINDOW-EA', name: 'Construction clean of a residential window or door glass, both sides, incl. frame and track, each', name_es: 'Limpieza de obra de vidrio de ventana o puerta residencial, ambas caras, con marco y riel, c/u', unit: 'EA', csi: '01 74 23',
      material_cost_cents: { v: 30, prov: est('solution, towels and squeegee wear') }, labor_hours_per_unit: { v: 0.3, prov: est('pre-soak, wash, squeegee, spot-remove paint and labels, wipe track ≈15–20 min') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-CLN-GLAZE-SF', name: 'Construction clean of storefront / curtain wall glass, both faces, per SF of glass', name_es: 'Limpieza de obra de vidrio de fachada comercial / muro cortina, ambas caras, por pie² de vidrio', unit: 'SF', csi: '01 74 23',
      material_cost_cents: { v: 2, prov: est('solution and pads') }, labor_hours_per_unit: { v: 0.012, prov: est('≈80 SF/hr both faces from floor or lift; heavy residue slower') },
      equipment_cost_cents: { v: 0, prov: est('lifts recommended by equipment rules and priced as EQUIP lines') }, waste_pct: { v: 0, prov: est('no material waste') } },
    { code: 'G-CLN-PWASH-SF', name: 'Pressure wash exterior flatwork and entries at turnover, per SF', name_es: 'Lavado a presión de banquetas, entradas y losas exteriores en la entrega, por pie²', unit: 'SF', csi: '01 74 23',
      material_cost_cents: { v: 1, prov: est('detergent') }, labor_hours_per_unit: { v: 0.004, prov: est('≈250 SF/hr with a surface cleaner') },
      equipment_cost_cents: { v: 3, prov: est('pressure washer + surface cleaner rental spread per SF') }, waste_pct: { v: 0, prov: est('no material waste') } },
    { code: 'G-CLN-FILTER-EA', name: 'HVAC filter replacement at turnover (after final clean), per air handler / furnace', name_es: 'Cambio de filtro de climatización en la entrega (después de la limpieza final), por manejadora / calefactor', unit: 'EA', csi: '01 74 23',
      material_cost_cents: { v: 1800, prov: est('pleated MERV-rated filter, national retail baseline 2026') }, labor_hours_per_unit: { v: 0.25, prov: est('locate, swap, date the frame, wipe the return grille') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
  ],
  quantity_rules: [
    { code: 'G-CLN-WINDOW-EA', assumption: 'Residential — one construction clean per scheduled window (both sides); add patio doors by hand', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'windows' } },
    { code: 'G-CLN-GLAZE-SF', assumption: 'Commercial — ≈30 SF of glass per scheduled window/storefront unit until the glazing elevations are measured', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'windows', mul: 30, round: 'ceil' } },
    { code: 'G-CLN-ROUGH-SF', assumption: 'One rough clean pass after drywall over the scheduled room area (final clean G-CLEAN-SF is seeded separately)', when: { building_types: ['commercial', 'industrial', 'residential_mf'] }, qty: { basis: 'area_sf_sum', round: 'ceil' } },
    { code: 'G-CLN-FILTER-EA', assumption: 'One filter change per forced-air unit shown on the plans', when: { facts_any: ['fau'] }, qty: { basis: { fixture: 'fau' } } },
  ],
  dependency_hints: [
    { after_trades: ['painting', 'flooring_carpet', 'flooring_wood', 'flooring_resilient', 'tile'], note: 'Final clean follows the last finish trades so dust and residue are not left behind.' },
  ],
});
