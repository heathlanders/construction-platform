// Trade Knowledge Pack — painting (Painting). Wave 03, COMPLEMENT pattern: the hand recipe in
// task-buildout/nopermit.ts keeps producing the work steps (Prep & prime → Apply finish coats); this
// pack adds glossary, hazards (lead / RRP, solvent vapors, fire, ladders, scaffolds), QA, owner
// walkthrough checklists, equipment hints and assemblies the catalog lacks. permit_trade null → NO
// gates, NO code_refs. Existing G-PAINT-SF / G-PAINT-EXT-SF are referenced, never redeclared.
// Dossier: docs/trade-packs/dossiers/painting.md. Sources: UFGS 09 90 00, EPA RRP (40 CFR 745
// Subpart E), 29 CFR 1926 Subparts C, D, E, F, K, L, X, manufacturer product data sheets, PCA (ref).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['painting-ufgs-09-90-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const rrp = (note?: string) => ({ src: ['painting-ecfr-40-745e', 'painting-epa-rrp'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const pds = (note: string) => ({ src: ['painting-sw-paintdocs', 'painting-ufgs-09-90-00'], confidence: 'verified' as const, last_verified: D, note });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'painting',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Interior and exterior painting and staining for new work and repaints: surface prep, patching, caulking, priming, finish coats, trim, doors, cabinets and wood stain — including lead-safe work practices on homes built before 1978.',
    summary_es: 'Pintura y tinte de interiores y exteriores en obra nueva y repintado: preparación de superficies, resanes, sellado, imprimación, capas de acabado, molduras, puertas, gabinetes y tinte de madera — incluidas prácticas seguras con plomo en casas construidas antes de 1978.',
    glossary: [
      { term: 'Primer', term_es: 'Imprimador (sellador)', def: 'First coat that seals new drywall, bare wood or patches so the finish coats bond and look even.', def_es: 'Primera capa que sella tablaroca nueva, madera desnuda o resanes para que el acabado adhiera y se vea parejo.' },
      { term: 'Sheen', term_es: 'Brillo (acabado)', def: 'How shiny the dry paint is — flat, eggshell, satin, semi-gloss or gloss.', def_es: 'Qué tan brillante queda la pintura seca: mate, cascarón, satinado, semibrillante o brillante.' },
      { term: 'Cut in', term_es: 'Recortar (perfilar)', def: 'Brushing a clean line along corners, ceilings and trim before rolling the wall.', def_es: 'Pintar con brocha una línea limpia en esquinas, techos y molduras antes de pasar el rodillo.' },
      { term: 'Holiday', term_es: 'Falla (zona sin cubrir)', def: 'A missed or thin spot where the coat did not cover.', def_es: 'Un punto omitido o delgado donde la capa no cubrió.' },
      { term: 'Wet edge', term_es: 'Borde húmedo', def: 'Keeping the edge of the fresh paint wet while you work so lap marks do not show.', def_es: 'Mantener húmedo el borde de la pintura fresca mientras se trabaja para que no se noten las marcas de traslape.' },
      { term: 'Spread rate', term_es: 'Rendimiento', def: 'Square feet one gallon covers at the thickness the product data sheet calls for.', def_es: 'Pies cuadrados que cubre un galón con el espesor que indica la ficha técnica del producto.' },
      { term: 'Dew point', term_es: 'Punto de rocío', def: 'Temperature at which moisture condenses on a surface; exterior coats need the surface warmer than it.', def_es: 'Temperatura a la que la humedad se condensa en una superficie; en exteriores la superficie debe estar más caliente que ese punto.' },
      { term: 'RRP', term_es: 'RRP (renovación segura con plomo)', def: 'EPA Renovation, Repair and Painting rule — lead-safe certified firm and work practices on pre-1978 homes and child-occupied facilities.', def_es: 'Regla de la EPA de Renovación, Reparación y Pintura: empresa certificada y prácticas seguras con plomo en viviendas anteriores a 1978 y lugares con niños.' },
      { term: 'Cleaning verification card', term_es: 'Tarjeta de verificación de limpieza', def: 'EPA card a certified renovator compares wet cleaning cloths against to confirm lead dust cleanup.', def_es: 'Tarjeta de la EPA con la que el renovador certificado compara los paños húmedos para confirmar la limpieza del polvo de plomo.' },
      { term: 'Back-roll', term_es: 'Repasar con rodillo', def: 'Rolling over freshly sprayed paint to work it into the surface and even the texture.', def_es: 'Pasar el rodillo sobre pintura recién rociada para meterla en la superficie y emparejar la textura.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  equipment: [
    { when: { title_re: 'exterior|siding|fascia|soffit|trim', building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'boom_lift', reason: 'Reach upper exterior walls, fascia and soffits on multi-story buildings', optional: true },
    { when: { title_re: 'paint|coat|ceiling', building_types: ['commercial', 'industrial'] }, type: 'scissor_lift', reason: 'High interior walls, ceilings and open structure in commercial spaces', optional: true },
  ],
  hazards: [
    { id: 'lead_dust', hazard: 'Lead dust and chips from sanding, scraping or cutting old paint (pre-1978 homes, older steel)', hazard_es: PENDING_ES, controls: ['Assume or test for lead before disturbing old paint; use an EPA lead-safe certified firm and certified renovator on pre-1978 homes', 'Assess worker lead exposure before the task; mist and hand-scrape, use HEPA-shrouded tools', 'Never open-flame burn, or power sand/grind without HEPA exhaust'], controls_es: PENDING_ES, osha_ref: '1926.62(d)(1)(i)', severity: 4, ppe: ['respirator (as assessed)', 'disposable coveralls', 'gloves'], prov: { src: ['ecfr-1926-d', 'painting-ecfr-40-745e'], confidence: 'verified', last_verified: D, note: 'OSHA exposure assessment; open-flame and un-shrouded power removal prohibited under 40 CFR 745.85(a)(3).' } },
    { id: 'lead_housekeeping', hazard: 'Spreading lead dust to occupants, vehicles and workers’ homes', hazard_es: PENDING_ES, controls: ['Contain the work area with plastic and keep occupants and pets out; post warning signs', 'Clean with HEPA vacuum and wet wipes — no dry sweeping or compressed air', 'Remove coveralls and wash before leaving; no eating, drinking or smoking in the work area'], controls_es: PENDING_ES, osha_ref: '1926.62(h)(2)', severity: 3, prov: { src: ['ecfr-1926-d', 'painting-ecfr-40-745e', 'painting-epa-rrp-steps'], confidence: 'verified', last_verified: D } },
    { id: 'solvent_vapor', hazard: 'Breathing solvent vapors from oil-based paints, lacquers, strippers and thinners in closed rooms', hazard_es: PENDING_ES, controls: ['Use low-VOC water-based products where the spec allows', 'Ventilate with fans moving fresh air through the room and out; keep containers closed', 'If ventilation cannot keep vapors down, use respirators per the product SDS'], controls_es: PENDING_ES, osha_ref: '1926.55(b)', severity: 3, prov: osha('d') },
    { id: 'spray_mist', hazard: 'Paint mist and vapor buildup when spraying, especially in small or enclosed spaces', hazard_es: PENDING_ES, controls: ['Run exhaust ventilation that pulls overspray away from the sprayer and out of the building', 'Wear a respirator and eye protection when spraying any coating; mask off the area'], controls_es: PENDING_ES, osha_ref: '1926.57(a)', severity: 3, ppe: ['respirator', 'safety glasses or goggles'], prov: osha('d', 'UFGS 09 90 00 also requires respirators and protective clothing for spraying and oil-based paints.') },
    { id: 'respirator_program', hazard: 'Wrong or poorly fitted respirator gives no real protection', hazard_es: PENDING_ES, controls: ['Use the respirator type the exposure needs, with medical clearance and a fit test', 'Change cartridges on schedule; store respirators clean'], controls_es: PENDING_ES, osha_ref: '1926.103', severity: 3, prov: osha('e', '1926.103 adopts 29 CFR 1910.134 for construction.') },
    { id: 'flammable_storage', hazard: 'Fire from flammable paints and thinners stored or handled in open or unapproved containers', hazard_es: PENDING_ES, controls: ['Keep flammable liquids in approved containers or safety cans; small amounts out on the job', 'Keep a fire extinguisher near the paint storage and mixing area'], controls_es: PENDING_ES, osha_ref: '1926.152(a)(1)', severity: 3, prov: osha('f') },
    { id: 'ignition_sources', hazard: 'Solvent vapors ignited by smoking, pilot lights or sparks while spraying or using thinners', hazard_es: PENDING_ES, controls: ['No smoking or open flame near solvent work; post signs', 'Shut off pilot lights and keep heaters away when spraying solvent-based coatings'], controls_es: PENDING_ES, osha_ref: '1926.151(a)(3)', severity: 4, prov: osha('f') },
    { id: 'oily_rags', hazard: 'Rags soaked in oil-based stain or finish catching fire on their own', hazard_es: PENDING_ES, controls: ['Lay rags flat to dry outside or put them in a water-filled closed metal can', 'Remove rags and debris from the building at the end of each day'], controls_es: PENDING_ES, osha_ref: '1926.25(b)', severity: 3, prov: osha('c') },
    { id: 'chemical_contact', hazard: 'Skin and eye contact with paints, strippers, cleaners and caulks', hazard_es: PENDING_ES, controls: ['Read the SDS and label before use; keep SDS on site', 'Wear chemical gloves and eye protection when mixing, pouring, stripping or working overhead'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['chemical gloves', 'safety glasses'], prov: osha('d', '1926.59 adopts 29 CFR 1910.1200 Hazard Communication.') },
    { id: 'eye_splash', hazard: 'Paint, solvent or spray splashing into the eyes, especially when rolling or spraying overhead', hazard_es: PENDING_ES, controls: ['Wear safety glasses or goggles when rolling ceilings, spraying or handling solvents'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses or goggles'], prov: osha('e') },
    { id: 'ladder', hazard: 'Falls from ladders while cutting in, reaching high walls or exterior trim', hazard_es: PENDING_ES, controls: ['Extend ladder rails 3 ft above the landing or secure the top', 'Keep three points of contact; move the ladder instead of reaching'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'scaffold_fall', hazard: 'Falls from scaffolds or planks over 10 ft on exterior walls and stairwells', hazard_es: PENDING_ES, controls: ['Use guardrails or personal fall arrest on scaffolds more than 10 ft up', 'Have a competent person inspect the scaffold before each shift'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
  ],
  qa_checklist: [
    { id: 'lead_status_known', phase: 'finishes_interior', item: 'Lead status of existing paint known before any prep on pre-1978 work (test report or presumed lead); RRP firm and renovator certificates on site.', item_es: PENDING_ES, safety: true, prov: rrp('745.85(a) certified firm and renovator') },
    { id: 'rrp_containment', item: 'RRP containment in place before disturbing paint: work area isolated, plastic 6 ft beyond interior work (10 ft ground cover outside), HVAC covered, warning signs posted.', item_es: PENDING_ES, safety: true, prov: rrp('745.85(a)(1)–(2)') },
    { id: 'rrp_cleaning_verification', item: 'Interior lead work passes visual inspection and cleaning verification (wet cloth matches the EPA card, or re-clean) before containment comes down.', item_es: PENDING_ES, safety: true, prov: rrp('745.85(b) post-renovation cleaning verification') },
    { id: 'surface_prep', phase: 'finishes_interior', item: 'Surfaces clean, dry and dull; loose paint scraped, holes and cracks patched and sanded flush, gaps caulked — patches invisible under a raking light.', item_es: tr('Superficies limpias, secas y sin brillo; pintura suelta raspada, agujeros y grietas resanados y lijados a ras, juntas selladas; resanes invisibles con luz rasante.'), prov: ufgs('3.6.2.1–3.6.2.2 cleaning and repair of minor defects') },
    { id: 'moisture_ok', item: 'Substrate moisture checked before coating: wood at or below 12% by meter, new plaster at or below 8% and aged 30 days, masonry and concrete cured 30 days.', item_es: tr('Humedad del sustrato revisada antes de pintar: madera a 12% o menos con medidor, yeso nuevo a 8% o menos y con 30 días de edad, mampostería y concreto curados 30 días.'), prov: ufgs('3.6.2.3 plaster; 3.7.1(c) wood; masonry cure 30 days') },
    { id: 'weather_window', phase: 'finishes_exterior', item: 'Exterior coats applied only when air and surface are 50–95 °F (or the product data sheet range), at least 5 °F above dew point, and no rain before the coat sets.', item_es: tr('Capas exteriores aplicadas solo con aire y superficie entre 50 y 95 °F (o el rango de la ficha técnica), al menos 5 °F sobre el punto de rocío y sin lluvia antes de que la capa fragüe.'), prov: ufgs('1.10.1 coatings application conditions') },
    { id: 'primer_new_work', item: 'New drywall, bare wood, patches and stain-prone areas primed with the primer the system calls for before finish coats; knots and tannin bleed sealed.', item_es: tr('Tablaroca nueva, madera desnuda, resanes y zonas con manchas imprimadas con el imprimador del sistema antes del acabado; nudos y sangrado de taninos sellados.'), prov: ufgs('3.7.1(d) prime wood; paint tables prime new gypsum board') },
    { id: 'film_build', item: 'Each coat applied at the product data sheet spread rate (spot-check wet film gauge); minimum two finish coats unless the spec says otherwise.', item_es: tr('Cada capa aplicada al rendimiento de la ficha técnica (verificar con medidor de película húmeda); mínimo dos capas de acabado salvo que la especificación diga otra cosa.'), prov: pds('UFGS minimum dry film per coat; spread rate per product data sheet') },
    { id: 'recoat_time', item: 'Recoat and cure times on the product data sheet respected; no topcoat over tacky or damp paint.', item_es: tr('Se respetan los tiempos de repintado y curado de la ficha técnica; no se aplica acabado sobre pintura pegajosa o húmeda.'), prov: pds('Recoat window per manufacturer; UFGS 3.x application') },
    { id: 'uniform_finish', item: 'Finished surfaces uniform — no holidays, runs, sags, lap marks, brush marks, roller lint or texture differences; each coat a visibly different shade from the last.', item_es: tr('Superficies terminadas uniformes: sin fallas, chorreados, colgaduras, marcas de traslape, de brocha, pelusa de rodillo ni diferencias de textura; cada capa de tono visiblemente distinto a la anterior.'), prov: ufgs('Application: uniform film free of runs, laps, brush marks; successive coats tinted') },
    { id: 'color_sheen_match', item: 'Color and sheen in every room match the approved sample or color schedule; drawdown or mock-up signed off before full application.', item_es: tr('El color y el brillo de cada cuarto coinciden con la muestra aprobada o el programa de colores; muestra o maqueta aprobada antes de aplicar en todo.'), prov: ufgs('Samples approved before application') },
    { id: 'cut_lines', item: 'Cut lines straight and crisp at ceilings, trim, hardware and color changes; no paint on hardware, fixtures, glass or adjacent finishes.', item_es: tr('Líneas de recorte rectas y limpias en techos, molduras, herrajes y cambios de color; sin pintura en herrajes, accesorios, vidrios ni acabados vecinos.'), prov: ufgs('Protection of adjacent surfaces; remove hardware before painting') },
    { id: 'edges_covered', item: 'Edges, corners, door tops and bottoms and cabinet edges coated to the same build as adjacent faces.', item_es: tr('Bordes, esquinas, cantos superior e inferior de puertas y orillas de gabinetes pintados con el mismo espesor que las caras vecinas.'), prov: ufgs('Application (e): edges and corners same film thickness') },
    { id: 'touch_up', phase: 'punch', item: 'Punch-list touch-up blends in with the original finish (same product, batch and applicator); damage repainted wall to wall where touch-up would flash.', item_es: tr('Los retoques de la lista de pendientes se confunden con el acabado original (mismo producto, lote y aplicador); daños repintados de esquina a esquina si el retoque se nota.'), prov: { src: ['painting-ufgs-09-90-00', 'painting-pca-standards'], confidence: 'verified', last_verified: D, note: 'UFGS touch-up before subsequent coats; PCA touch-up standard (reference only).' } },
    { id: 'waste_cleanup', item: 'Paint waste, rinse water and empty containers handled per the SDS and local rules — no wash-out into storm drains or septic systems.', item_es: tr('Residuos de pintura, agua de enjuague y envases vacíos manejados según la hoja de seguridad y las reglas locales; no lavar herramientas en drenajes pluviales ni sépticos.'), prov: ufgs('Waste management and disposal of coating materials') },
  ],
  inspection_checklists: {
    pre_paint_walkthrough: [
      { item: 'Drywall finish level and patches accepted before primer goes on', item_es: tr('Nivel de acabado de tablaroca y resanes aceptados antes de imprimar') },
      { item: 'Color schedule, sheen and approved samples on site; owner signed the color selections', item_es: tr('Programa de colores, brillo y muestras aprobadas en obra; el dueño firmó la selección de colores') },
      { item: 'Floors, cabinets, fixtures and windows protected; hardware and cover plates removed', item_es: tr('Pisos, gabinetes, accesorios y ventanas protegidos; herrajes y tapas retirados') },
      { item: 'Pre-1978 building: lead test or presumption recorded, Renovate Right pamphlet given to the owner, RRP containment set', item_es: PENDING_ES, ref: '40 CFR 745.84–745.85' },
    ],
    lead_safe_cleaning_verification: [
      { item: 'Containment intact until cleanup ends; debris bagged and sealed', item_es: PENDING_ES, ref: '40 CFR 745.85(a)' },
      { item: 'HEPA vacuum and wet wipe of all horizontal surfaces, then visual inspection by the certified renovator', item_es: PENDING_ES, ref: '40 CFR 745.85(b)' },
      { item: 'Wet cleaning cloth per surface compared to the EPA verification card; re-clean any area that fails', item_es: PENDING_ES, ref: '40 CFR 745.85(b)' },
      { item: 'RRP records kept: certifications, pamphlet receipt and cleaning verification results', item_es: PENDING_ES, ref: '40 CFR 745.86' },
    ],
    final_walkthrough: [
      { item: 'Every room checked under normal and raking light — no holidays, runs, lap marks or bleed-through', item_es: tr('Cada cuarto revisado con luz normal y rasante: sin fallas, chorreados, marcas de traslape ni manchas que traspasen') },
      { item: 'Color and sheen match the schedule room by room', item_es: tr('Color y brillo coinciden con el programa cuarto por cuarto') },
      { item: 'Hardware and cover plates reinstalled; no paint on glass, hardware, flooring or fixtures', item_es: tr('Herrajes y tapas reinstalados; sin pintura en vidrios, herrajes, pisos ni accesorios') },
      { item: 'Touch-up paint labeled with product, color and room left for the owner', item_es: tr('Pintura de retoque etiquetada con producto, color y cuarto entregada al dueño') },
    ],
  },
  assemblies: [
    { code: 'G-PNT-RRP-SETUP-EA', name: 'Lead-safe (RRP) setup, containment and cleaning verification, per room', name_es: 'Preparación segura con plomo (RRP), contención y verificación de limpieza, por cuarto', unit: 'EA', csi: '09 91 23',
      material_cost_cents: { v: 6500, prov: est('6-mil poly, tape, signs, disposable coveralls, HEPA bags, wet wipes and verification cloths per room, 2026 baseline') },
      labor_hours_per_unit: { v: 3, prov: est('set containment, misting/hand-scraping overhead, HEPA + wet clean, cleaning verification and teardown for a typical room') },
      equipment_cost_cents: { v: 2000, prov: est('HEPA vacuum day-rate share') }, waste_pct: { v: 0, prov: est('consumable kit counted per room') } },
    { code: 'G-PNT-TRIM-EXT-LF', name: 'Exterior trim, fascia or window casing — prep, prime spots, 2 coats, per LF', name_es: 'Molduras exteriores, fascia o marcos de ventana: preparación, imprimación puntual y 2 capas, por pie lineal', unit: 'LF', csi: '09 91 13',
      material_cost_cents: { v: 45, prov: est('exterior acrylic trim paint + caulk + spot primer at ~6 in. wide trim, 2026') },
      labor_hours_per_unit: { v: 0.04, prov: est('scrape, caulk, spot-prime and two brushed coats from a ladder, ~25 LF/hr') },
      equipment_cost_cents: { v: 0, prov: est('ladders and hand tools only; lifts via equipment rules') }, waste_pct: { v: 10, prov: est('cut-in loss and touch-up') } },
    { code: 'G-PNT-INT-TRIM-LF', name: 'Interior baseboard or casing — fill, caulk, 2 coats enamel, per LF', name_es: 'Zoclo o marco interior: resanar, sellar y 2 capas de esmalte, por pie lineal', unit: 'LF', csi: '09 91 23',
      material_cost_cents: { v: 20, prov: est('semi-gloss acrylic enamel + caulk + filler per LF of 3–4 in. trim, 2026') },
      labor_hours_per_unit: { v: 0.03, prov: est('fill nail holes, caulk joints, two brushed coats, ~35 LF/hr') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 10, prov: est('cut-in loss') } },
    { code: 'G-PNT-DOOR-EA', name: 'Door slab and frame, both sides — prime as needed + 2 coats enamel, each', name_es: 'Hoja y marco de puerta, ambos lados: imprimación según se requiera + 2 capas de esmalte, c/u', unit: 'EA', csi: '09 91 23',
      material_cost_cents: { v: 900, prov: est('≈0.3 gal enamel + primer per slab and frame both sides, 2026') },
      labor_hours_per_unit: { v: 1.25, prov: est('remove hardware, sand, prime, two coats both sides incl. edges, reinstall') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; sprayer optional') }, waste_pct: { v: 10, prov: est('brush and roller loss') } },
    { code: 'G-PNT-CAB-REFIN-LF', name: 'Cabinet refinish — degrease, scuff, bonding primer, 2 coats enamel, per LF of cabinet run', name_es: 'Repintado de gabinetes: desengrasar, lijar, imprimador de adherencia y 2 capas de esmalte, por pie lineal de gabinete', unit: 'LF', csi: '09 93 00',
      material_cost_cents: { v: 1500, prov: est('degreaser, bonding primer, cabinet-grade enamel, sandpaper and masking per LF (doors, drawer fronts, face frame), 2026') },
      labor_hours_per_unit: { v: 1.5, prov: est('remove/label doors and hardware, clean, scuff, prime, two sprayed or brushed coats, reinstall') },
      equipment_cost_cents: { v: 150, prov: est('sprayer and spray-tent share') }, waste_pct: { v: 15, prov: est('spray overspray loss') } },
    { code: 'G-PNT-STAIN-EXT-SF', name: 'Deck or fence — clean, brighten and one coat penetrating stain, per SF', name_es: 'Terraza o cerca: limpiar, aclarar y una capa de tinte penetrante, por pie²', unit: 'SF', csi: '09 93 00',
      material_cost_cents: { v: 30, prov: est('semi-transparent stain at ~150 SF/gal + wood cleaner/brightener, 2026') },
      labor_hours_per_unit: { v: 0.012, prov: est('wash, brighten, dry, then pad/brush or spray and back-brush, ~80 SF/hr') },
      equipment_cost_cents: { v: 4, prov: est('pressure washer day-rate share') }, waste_pct: { v: 10, prov: est('absorption variance on weathered wood') } },
  ],
  quantity_rules: [
    { code: 'G-PNT-DOOR-EA', assumption: 'Door schedule count — every door painted both sides with its frame (delete prefinished doors)', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'doors', round: 'ceil' } },
    { code: 'G-PNT-INT-TRIM-LF', assumption: '≈40 LF of baseboard and casing per scheduled room until the trim takeoff is done', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'rooms', mul: 40, round: 'ceil' } },
    { code: 'G-PNT-TRIM-EXT-LF', assumption: '≈14 LF of exterior casing per scheduled window (3×4 ft unit) — delete if windows are clad/prefinished', when: { building_types: ['residential_sf'] }, qty: { basis: 'windows', mul: 14, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['drywall'], note: 'Prime and paint after drywall finishing is accepted; trim and cabinets are often installed between prime and final coat.' },
    { before_phase: 'punch', note: 'Final coats and touch-up finish before punch walkthrough and final clean.' },
  ],
});
