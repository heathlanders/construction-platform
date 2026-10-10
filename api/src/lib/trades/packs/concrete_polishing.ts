// Trade Knowledge Pack — concrete_polishing (Concrete Polishing / Staining / Sealing, CSI 03 35). Wave 08,
// NEW-TRADE pattern without a permit path (permit_trade null): no gates, no code_refs — owner hold points
// (mock-up approval, gloss acceptance) live in inspection_checklists. Existing B-FLAT-SEAL-SF (exterior
// flatwork sealer) and G-FLOOR-EPOXY-SF (resinous coating) are NOT redeclared — this pack prices the
// interior mechanical-polish / grind-and-seal / reactive-stain scopes only. Dossier:
// docs/trade-packs/dossiers/concrete_polishing.md. Sources: CPAA DEF-PC-100, APS 03 35 43 owner spec,
// UFGS 03 30 00 (hardener + low-VOC sealer), Brickform acid-stain TIS, ACI 310R + ANSI A326.3 (ref only),
// 29 CFR 1926 (C, D, E, F, K, Z — 1926.1153 Table 1 rows (xii) and (xiii)).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const cpaa = (note?: string) => ({ src: ['concrete_polishing-cpaa-def-pc-100'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const aps = (note?: string) => ({ src: ['concrete_polishing-aps-033543'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const stain = (note?: string) => ({ src: ['concrete_polishing-brickform-acid-stain-tis'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ufgs = (note?: string) => ({ src: ['ufgs-03-30-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'concrete_polishing',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Turning an existing or new interior concrete slab into the finished floor: diamond grinding to the chosen aggregate exposure, densifying, honing and polishing to a gloss level, filling joints, coloring with reactive acid stain or dye, and protecting it with a penetrating guard or sealer. Also covers simple grind-and-seal floors.',
    summary_es: 'Convertir una losa de concreto interior, nueva o existente, en el piso terminado: desbaste con diamante hasta la exposición de agregado elegida, densificado, afinado y pulido al nivel de brillo, relleno de juntas, color con tinte ácido reactivo o colorante, y protección con un sellador penetrante o protector. También incluye pisos sencillos de desbaste y sellado.',
    glossary: [
      { term: 'Aggregate exposure class (A–D)', term_es: 'Clase de exposición de agregado (A–D)', def: 'How deep the floor is ground: A cream (almost no stone showing), B salt-and-pepper (fine sand), C medium stone, D large stone.', def_es: 'Qué tan profundo se desbasta el piso: A crema (casi sin piedra visible), B sal y pimienta (arena fina), C piedra mediana, D piedra grande.' },
      { term: 'Gloss level (1–4)', term_es: 'Nivel de brillo (1–4)', def: 'Finished shine from flat (ground) to satin (honed), semi-polished and highly polished, checked with a gloss meter.', def_es: 'Brillo final desde mate (desbastado) a satinado (afinado), semipulido y muy pulido; se revisa con un medidor de brillo.' },
      { term: 'Metal-bond diamonds', term_es: 'Diamantes de liga metálica', def: 'Coarse grinding tooling that cuts the slab, removes the cream and opens up the stone.', def_es: 'Herramienta de desbaste grueso que corta la losa, quita la capa de lechada y descubre la piedra.' },
      { term: 'Resin-bond diamonds', term_es: 'Diamantes de liga de resina', def: 'Finer tooling used after the metals to hone out scratches and build shine, step by step up the grit scale.', def_es: 'Herramienta más fina usada después de los metálicos para borrar rayas y dar brillo, paso a paso subiendo el grano.' },
      { term: 'Densifier (hardener)', term_es: 'Densificador (endurecedor)', def: 'Water-based silicate liquid that soaks in and reacts with the concrete to harden and tighten the surface; it leaves no film.', def_es: 'Líquido de silicato a base de agua que penetra y reacciona con el concreto para endurecer y cerrar la superficie; no deja película.' },
      { term: 'Guard (stain protector)', term_es: 'Protector (guard)', def: 'Thin penetrating or micro-film sealer burnished in at the end to resist oil and water spots.', def_es: 'Sellador penetrante o de micropelícula delgada que se bruñe al final para resistir manchas de aceite y agua.' },
      { term: 'Reactive (acid) stain', term_es: 'Tinte reactivo (ácido)', def: 'Acidic metallic-salt solution that reacts with the lime in the concrete to make a mottled permanent color; its residue must be neutralized.', def_es: 'Solución ácida de sales metálicas que reacciona con la cal del concreto y da un color moteado permanente; su residuo se debe neutralizar.' },
      { term: 'Dye', term_es: 'Colorante (tinte de dye)', def: 'Water- or solvent-carried color that soaks into a ground floor without reacting; usually applied before densifier, during polishing.', def_es: 'Color en agua o solvente que penetra en el piso desbastado sin reaccionar; se aplica normalmente antes del densificador, durante el pulido.' },
      { term: 'Polyurea joint filler', term_es: 'Relleno de juntas de poliurea', def: 'Two-part semi-rigid filler put in saw-cut control joints, slightly overfilled, then shaved flush.', def_es: 'Relleno semirrígido de dos componentes para juntas de control cortadas con sierra; se sobrellena un poco y luego se rasura a ras.' },
      { term: 'Planetary grinder', term_es: 'Desbastadora planetaria', def: 'Walk-behind floor machine with several rotating heads that grinds and polishes evenly; edges are done with a small hand grinder.', def_es: 'Máquina de piso que se empuja con varios cabezales giratorios para desbastar y pulir parejo; las orillas se hacen con una esmeriladora de mano.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'mechanical_polish',
      example_title: 'Polished concrete floor — grind, densify and polish',
      when: { title_re: 'polish|grind (?:and|&|\\+) seal|densif|sealed concrete|burnish(?:ed)? concrete|concrete (?:floor )?(?:finish|guard|hone|honed)' },
      steps: [
        {
          title: 'Check the slab and approve a mock-up',
          instruction: 'Confirm the slab has cured long enough (the spec often asks 28 days and its design strength) and was hard-troweled. Walk it for cracks, spalls, stains, marker or tape marks and low spots. Grind a mock-up area (about 100 SF) first and get the owner or architect to approve the aggregate exposure before going further, then finish it to the target gloss as the standard for the job.',
          detail: 'Ask the GC to keep tape, markers, red or yellow chalk, wood, drywall and plastic off the slab — they leave permanent marks or shadows in the finish.',
          tools: ['gloss meter', 'straightedge or F-number report', 'hammer', 'camera'],
          materials: ['marking (white or blue chalk only)', 'slab survey form'],
          safety_ids: ['slurry_slip_trip'],
          qa_ids: ['slab_ready', 'mockup_approved', 'slab_protected'],
        },
        {
          title: 'Repair cracks and patch defects',
          instruction: 'Clean out cracks and pits 1/8 in. and wider and fill them with the repair product shown in the mock-up so the repair grinds flush. Remove glue, paint and old coatings with floor-scraping or grinding equipment — not chipping hammers that gouge the slab.',
          tools: ['crack chaser with vacuum', 'margin trowel', 'razor scraper', 'floor scraper'],
          materials: ['semi-rigid crack/patch filler', 'cement-based patch compatible with polishing'],
          safety_ids: ['silica_edge_grinding', 'silica_cleanup', 'chemical_products'],
          qa_ids: ['repairs_flush', 'silica_controls'],
        },
        {
          title: 'Grind with metal diamonds to the approved exposure',
          instruction: 'Grind the field with the planetary grinder, coarse to fine metal-bond diamonds, overlapping passes until the whole floor matches the approved exposure class. Grind edges to within about 1/8 in. of the walls with a small hand grinder so they match the field. Run wet, or dry with the dust collector the machine maker calls for, and HEPA-vacuum between passes indoors.',
          detail: 'On new buildings do the heavy grinding before partition studs go up when the schedule allows, then protect the floor.',
          tools: ['planetary floor grinder', 'edge grinder with shroud', 'HEPA dust extractor', 'metal-bond diamonds'],
          materials: ['diamond tooling', 'floor protection'],
          safety_ids: ['silica_floor_grinding', 'silica_edge_grinding', 'silica_cleanup', 'noise', 'electrical_cords', 'slurry_slip_trip'],
          qa_ids: ['exposure_uniform', 'silica_controls'],
        },
        {
          title: 'Densify, then hone and polish with resin diamonds',
          instruction: 'After the first resin step (or where the densifier maker says), scrub the floor clean and apply silicate densifier evenly until it stops soaking in; keep it wet for the dwell time, then remove the excess so no white residue dries on top. Continue through the resin grit steps, one full pass per grit, until every scratch from the step before is gone and the floor reaches the specified gloss level.',
          detail: 'If the floor gets dye, apply it before the densifier. Check gloss with a meter as you go so you do not stop short of the level.',
          tools: ['planetary floor grinder', 'auto-scrubber or wet vacuum', 'low-pressure sprayer', 'microfiber applicator', 'gloss meter'],
          materials: ['resin-bond diamonds', 'lithium or sodium silicate densifier'],
          safety_ids: ['silica_floor_grinding', 'silica_cleanup', 'chemical_products', 'noise', 'electrical_cords', 'slurry_slip_trip'],
          qa_ids: ['densifier_applied', 'no_scratches', 'gloss_met'],
        },
        {
          title: 'Fill the saw-cut joints',
          instruction: 'Vacuum the saw-cut control joints clean and dry. Fill them with polyurea joint filler, slightly crowned, let it set until dry to the touch, then shave it flush with a razor. Do not fill isolation, expansion or tooled joints — those get a flexible sealant. Mask or wipe overfill quickly so it does not stain the floor.',
          tools: ['joint vacuum', 'dual-cartridge gun or pump', 'razor shaving tool'],
          materials: ['polyurea joint filler'],
          safety_ids: ['chemical_products'],
          qa_ids: ['joints_filled'],
        },
        {
          title: 'Apply guard, burnish and protect the floor',
          instruction: 'Clean the floor with a pH-neutral cleaner, then apply the guard or penetrating sealer thinly and evenly and burnish it with the pad the maker lists. Look for streaks or swirls and fix them. Cover the finished floor with breathable protection board taped to itself — never tape directly to the floor — until the other trades are done.',
          tools: ['high-speed burnisher', 'microfiber applicator', 'auto-scrubber'],
          materials: ['guard or penetrating sealer', 'pH-neutral cleaner', 'burnishing pads', 'breathable floor protection board'],
          safety_ids: ['propane_co', 'lpg_cylinders', 'chemical_products', 'flammable_liquids'],
          qa_ids: ['guard_even', 'slab_protected', 'slip_resistance'],
        },
      ],
    },
    {
      id: 'stain_and_seal',
      example_title: 'Acid stained concrete floor and sealer',
      when: { title_re: 'stain(?:ed)? concrete|concrete stain|acid[- ]?stain|(?:water|solvent)[- ]based stain|concrete dye|dyed concrete|colou?red (?:sealer|concrete floor)' },
      steps: [
        {
          title: 'Open the surface and run a color mock-up',
          instruction: 'Make sure the slab is fully cured, clean and free of sealers, curing compound, oil and paint — anything that blocks the stain. Lightly grind or profile power-troweled slabs so the stain can soak in. Stain a sample on this same slab and get the color approved; stain looks different on every pour.',
          tools: ['planetary grinder or auto-scrubber', 'moisture test kit', 'camera'],
          materials: ['metal-bond diamonds or scrub pads', 'cleaner'],
          safety_ids: ['silica_floor_grinding', 'silica_cleanup', 'noise'],
          qa_ids: ['stain_even', 'mockup_approved'],
        },
        {
          title: 'Apply the stain or dye',
          instruction: 'Mask walls and anything that must stay uncolored. Apply reactive stain with an acid-resistant plastic sprayer and brush, working joint to joint with a wet edge and scrubbing it in; never use metal sprayers or pails. Let it react for the time on the product sheet. For dyes, apply in thin even coats so there are no lap marks or puddles.',
          tools: ['acid-resistant pump sprayer', 'acid-resistant brush', 'plastic tubs'],
          materials: ['reactive stain or dye', 'masking film and tape (on walls only)'],
          safety_ids: ['acid_stain_corrosive', 'chemical_products', 'flammable_liquids'],
          qa_ids: ['stain_even', 'chemical_ppe'],
        },
        {
          title: 'Neutralize and remove the residue',
          instruction: 'Once the reaction time is up, neutralize the dried stain residue with the neutralizer the maker lists, scrub it with a floor machine or stiff brush, and wet-vacuum it up while it is still wet. Rinse and repeat until the rinse water runs clear. Keep rinse water out of drains, landscaping and areas that must stay uncolored.',
          tools: ['rotary floor machine with scrub pads', 'wet vacuum', 'stiff brush', 'pH test strips'],
          materials: ['neutralizer (baking soda or maker product)', 'clean water'],
          safety_ids: ['acid_stain_corrosive', 'slurry_slip_trip', 'electrical_cords'],
          qa_ids: ['residue_removed'],
        },
        {
          title: 'Seal and cure',
          instruction: 'Let the floor dry fully, then apply the sealer or guard in thin coats at the maker\'s coverage; on polished floors use a penetrating guard and burnish. Keep foot traffic off for the time on the sealer sheet and protect the floor from the other trades.',
          tools: ['roller or microfiber applicator', 'low-pressure sprayer', 'burnisher'],
          materials: ['low-VOC penetrating sealer or guard', 'floor protection board'],
          safety_ids: ['chemical_products', 'flammable_liquids', 'propane_co'],
          qa_ids: ['guard_even', 'slab_protected', 'slip_resistance'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'polish|grind|densif|burnish|hone' }, type: 'generator', reason: 'Large planetary grinders and dust extractors often need 240/480 V power the building cannot supply yet', optional: true },
  ],
  hazards: [
    { id: 'silica_floor_grinding', hazard: 'Breathing silica dust from walk-behind floor grinding and honing of concrete', hazard_es: PENDING_ES, controls: ['Use a grinder with integrated water feed, or the dust collection system the grinder maker recommends with its airflow and a 99% filter with filter-cleaning (Table 1 row xiii)', 'Indoors, HEPA-vacuum loose dust between passes', 'Operate and maintain the machine per the maker to keep dust down'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('z', 'Table 1 (xiii) walk-behind milling machines and floor grinders: no respirator required when the controls are fully implemented.') },
    { id: 'silica_edge_grinding', hazard: 'Breathing silica dust from handheld edge and crack grinders', hazard_es: PENDING_ES, controls: ['Use a shroud with a vacuum that gives 25 cfm per inch of wheel diameter and has a 99% filter with cyclonic pre-separator or filter cleaning, or water feed outdoors', 'Indoors or in enclosed areas, wear at least an APF 10 respirator while edge grinding with a shroud'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['APF 10 respirator (indoors)', 'safety glasses', 'face shield', 'hearing protection'], prov: osha('z', 'Table 1 (xii) handheld grinders for uses other than mortar removal.') },
    { id: 'silica_cleanup', hazard: 'Silica dust stirred up by dry sweeping or blowing off floors and joints with compressed air', hazard_es: PENDING_ES, controls: ['Clean with a HEPA vacuum or wet methods — no dry sweeping', 'Do not blow dust off floors, joints or clothing with compressed air unless the dust cloud is captured'], controls_es: PENDING_ES, osha_ref: '1926.1153(f)', severity: 2, prov: osha('z') },
    { id: 'propane_co', hazard: 'Carbon monoxide poisoning from propane burnishers, grinders or engine-driven equipment run indoors', hazard_es: PENDING_ES, controls: ['Prefer electric or battery machines indoors', 'If propane machines are used, keep doors open and run fans to move fresh air through, keep engines tuned, and use a CO monitor', 'Stop work and get to fresh air at headache, dizziness or nausea'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 4, prov: { src: ['ecfr-1926-d', 'restoration-niosh-co'], confidence: 'verified', last_verified: D } },
    { id: 'lpg_cylinders', hazard: 'Fire or explosion from propane cylinders used, changed or stored inside the building', hazard_es: PENDING_ES, controls: ['Bring only the cylinder connected for use indoors; store spares outside', 'Set cylinders on a firm surface, protect hoses and valves from damage and heat, and check connections for leaks', 'Keep a fire extinguisher in the work area'], controls_es: PENDING_ES, osha_ref: '1926.153(h)', severity: 3, prov: osha('f') },
    { id: 'acid_stain_corrosive', hazard: 'Burns to eyes and skin and irritating vapor from acidic reactive stain and its residue', hazard_es: PENDING_ES, controls: ['Read the SDS first; wear goggles, chemical-resistant gloves, boots, apron and the acid-vapor respirator it lists', 'Have eyewash or clean water for flushing right at the work area', 'Use only plastic, acid-resistant sprayers and containers; keep others out until the floor is neutralized'], controls_es: PENDING_ES, osha_ref: '1926.50(g)', severity: 3, ppe: ['goggles', 'chemical-resistant gloves', 'rubber boots', 'apron', 'acid-vapor respirator'], prov: { src: ['ecfr-1926-d', 'concrete_polishing-brickform-acid-stain-tis'], confidence: 'verified', last_verified: D } },
    { id: 'chemical_products', hazard: 'Skin, eye or lung irritation from densifiers, dyes, joint fillers, cleaners and sealers', hazard_es: PENDING_ES, controls: ['Keep SDS for every product on site and train the crew on them', 'Wear the gloves and eye protection the SDS lists; ventilate while applying', 'Keep containers labeled and closed'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['safety glasses', 'nitrile gloves'], prov: osha('d') },
    { id: 'flammable_liquids', hazard: 'Fire from solvent-carried dyes and solvent sealers and their vapors', hazard_es: PENDING_ES, controls: ['Store and carry solvents in approved safety cans or the original containers', 'No smoking, flames or sparking tools while applying; shut off pilot lights and ventilate', 'Prefer water-based or low-VOC products indoors'], controls_es: PENDING_ES, osha_ref: '1926.152(a)(1)', severity: 3, prov: osha('f') },
    { id: 'noise', hazard: 'Hearing damage from grinders, dust extractors and burnishers', hazard_es: PENDING_ES, controls: ['Wear hearing protection when running or working near the machines', 'Keep extractors and generators away from where people work when possible'], controls_es: PENDING_ES, osha_ref: '1926.52(d)(1)', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('d') },
    { id: 'electrical_cords', hazard: 'Shock from damaged cords and connections on wet slurry floors', hazard_es: PENDING_ES, controls: ['Plug 120 V tools into GFCI protection (or follow the assured grounding program)', 'Inspect cords daily, keep connections off wet floors and route cords out of the slurry path'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)(ii)', severity: 3, prov: osha('k') },
    { id: 'slurry_slip_trip', hazard: 'Slipping on wet slurry or densifier and tripping over hoses, cords and protection board', hazard_es: PENDING_ES, controls: ['Pick up slurry as you go with a wet vacuum or squeegee and keep the work area clear', 'Route hoses and cords along walls and mark wet areas'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, ppe: ['slip-resistant boots'], prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'slab_ready', phase: 'finishes_interior', item: 'Slab cured to the spec (often 28 days and design strength) with test breaks available, hard-troweled, and sound — no hollow spots or loose surface.', item_es: tr('Losa curada según la especificación (a menudo 28 días y resistencia de diseño) con resultados de cilindros disponibles, con acabado de llana duro y sana: sin zonas huecas ni superficie suelta.'), prov: aps() },
    { id: 'mockup_approved', item: 'Mock-up (about 100 SF) ground on this slab; owner/architect approved aggregate exposure after the first grind and approved color and gloss before full production.', item_es: tr('Muestra (unos 100 pies²) desbastada en esta losa; el dueño o arquitecto aprobó la exposición de agregado después del primer desbaste y aprobó color y brillo antes de producción.'), prov: { src: ['concrete_polishing-aps-033543', 'concrete_polishing-brickform-acid-stain-tis'], confidence: 'verified', last_verified: D } },
    { id: 'slab_protected', item: 'Slab kept free of tape, markers, colored chalk, wood, drywall and stacked materials; finished floor covered with breathable protection board taped only to itself.', item_es: tr('Losa libre de cinta, marcadores, gis de color, madera, tablaroca y materiales apilados; piso terminado cubierto con tablero de protección transpirable con cinta solo entre tableros.'), prov: aps() },
    { id: 'repairs_flush', item: 'Cracks and pits 1/8 in. and wider filled with the mock-up repair product and ground flush; old adhesive and coatings removed without gouging.', item_es: tr('Grietas y huecos de 1/8 pulg. o más rellenos con el producto de la muestra y desbastados a ras; adhesivos y recubrimientos viejos retirados sin dañar la losa.'), prov: aps() },
    { id: 'exposure_uniform', item: 'Aggregate exposure matches the approved class (A cream to D large stone) consistently across the field, with edges ground to within about 1/8 in. of walls to match.', item_es: tr('La exposición de agregado coincide con la clase aprobada (A crema a D piedra grande) de manera pareja en todo el piso, con orillas desbastadas hasta unos 1/8 pulg. de los muros.'), prov: { src: ['concrete_polishing-cpaa-def-pc-100', 'concrete_polishing-aps-033543'], confidence: 'verified', last_verified: D } },
    { id: 'densifier_applied', item: 'Silicate densifier applied evenly to refusal at the maker\'s step and dwell time; excess removed with no dried white residue.', item_es: tr('Densificador de silicato aplicado parejo hasta saturar en el paso y tiempo que indica el fabricante; excedente retirado sin residuo blanco seco.'), prov: { src: ['concrete_polishing-aps-033543', 'ufgs-03-30-00'], confidence: 'verified', last_verified: D } },
    { id: 'no_scratches', item: 'Each resin grit step run over the whole floor until the scratches from the previous step are gone; no visible swirls or scratches in the finish.', item_es: tr('Cada paso de grano de resina pasado en todo el piso hasta quitar las rayas del paso anterior; sin remolinos ni rayas visibles en el acabado.'), prov: aps() },
    { id: 'gloss_met', item: 'Gloss measured with a 60° meter before the guard, at least one reading per 1,000 SF, meeting the specified level (single readings and average per the spec).', item_es: tr('Brillo medido con medidor de 60° antes del protector, al menos una lectura por cada 1,000 pies², cumpliendo el nivel especificado (lecturas individuales y promedio según la especificación).'), prov: { src: ['concrete_polishing-aps-033543', 'concrete_polishing-cpaa-def-pc-100'], confidence: 'verified', last_verified: D } },
    { id: 'joints_filled', item: 'Saw-cut contraction joints filled with polyurea, crowned and shaved flush, bonded to both sides; isolation/expansion joints left for flexible sealant.', item_es: tr('Juntas de contracción cortadas con sierra rellenas con poliurea, coronadas y rasuradas a ras, adheridas a ambos lados; juntas de aislamiento o expansión dejadas para sellador flexible.'), prov: aps() },
    { id: 'guard_even', item: 'Guard or sealer applied thin and burnished with no streaks, swirls or puddles; sealer VOC meets the spec limit (UFGS caps penetrating sealers at 100 g/L).', item_es: tr('Protector o sellador aplicado delgado y bruñido sin rayas, remolinos ni charcos; los COV del sellador cumplen el límite (UFGS limita los selladores penetrantes a 100 g/L).'), prov: { src: ['concrete_polishing-aps-033543', 'ufgs-03-30-00'], confidence: 'verified', last_verified: D } },
    { id: 'stain_even', item: 'Slab cured and free of curing compound, sealer and oil before staining; stain applied joint to joint with a wet edge, no lap marks or puddles, color matching the approved sample.', item_es: tr('Losa curada y sin compuesto de curado, sellador ni aceite antes del tinte; tinte aplicado de junta a junta con orilla húmeda, sin traslapes ni charcos, color igual a la muestra aprobada.'), prov: stain() },
    { id: 'residue_removed', item: 'Stain residue neutralized and wet-vacuumed until rinse water runs clear and the floor is dry before sealing; rinse water kept out of drains and planting.', item_es: PENDING_ES, safety: true, prov: stain() },
    { id: 'silica_controls', item: 'Floor grinders run wet or with the maker\'s dust collector, edge grinders with shroud and vacuum plus respirators indoors, and cleanup by HEPA vacuum or wet methods (1926.1153 Table 1).', item_es: PENDING_ES, safety: true, prov: osha('z') },
    { id: 'chemical_ppe', item: 'SDS on site for stain, dye, densifier and sealer; eyewash at hand; crew in the goggles, gloves and respirator the SDS lists; no metal containers for acid stain.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-d', 'concrete_polishing-brickform-acid-stain-tis'], confidence: 'verified', last_verified: D } },
    { id: 'slip_resistance', item: 'Where the owner requires it, wet slip resistance of the finished floor checked by the method in the spec (often ANSI A326.3 DCOF) before turnover.', item_es: tr('Donde el dueño lo pida, resistencia al deslizamiento en mojado del piso terminado revisada con el método de la especificación (a menudo ANSI A326.3 DCOF) antes de entregar.'), prov: { src: ['concrete_polishing-tcna-a326-3', 'concrete_polishing-aps-033543'], confidence: 'verified', last_verified: D, note: 'Method reference only; APS cites ANSI B101.1 (wet SCOF), superseded practice — follow the project spec.' } },
  ],
  inspection_checklists: {
    pre_polish_slab_acceptance: [
      { item: 'Slab age and strength confirmed (test breaks); hard-troweled finish; flatness report reviewed if specified', item_es: tr('Edad y resistencia de la losa confirmadas (cilindros); acabado de llana duro; informe de planicidad revisado si se especificó'), ref: 'APS 03 35 43 §3.01' },
      { item: 'Stains, marker, tape residue, cracks and patches photographed and agreed with the GC before grinding', item_es: tr('Manchas, marcador, residuos de cinta, grietas y parches fotografiados y acordados con el contratista general antes de desbastar') },
      { item: 'Power and water available, or generator and dust collection planned', item_es: tr('Energía y agua disponibles, o generador y recolección de polvo planeados') },
    ],
    mockup_exposure_hold: [
      { item: 'Owner/architect approval of aggregate exposure after the first grind of the mock-up — hold before continuing', item_es: tr('Aprobación del dueño o arquitecto de la exposición de agregado después del primer desbaste de la muestra; detenerse antes de continuar'), ref: 'APS 03 35 43 §1.07.B' },
      { item: 'Color (stain/dye) and final gloss of the mock-up approved; mock-up gloss readings recorded as the job standard', item_es: tr('Color (tinte/colorante) y brillo final de la muestra aprobados; lecturas de brillo de la muestra registradas como estándar de la obra') },
    ],
    gloss_acceptance: [
      { item: '60° gloss readings taken before the guard, at least one per 1,000 SF, per section; results given to the owner', item_es: tr('Lecturas de brillo a 60° antes del protector, al menos una por cada 1,000 pies², por sección; resultados entregados al dueño'), ref: 'ASTM D523 (ref)' },
      { item: 'No visible scratches, swirls or uneven exposure; edges and corners match the field', item_es: tr('Sin rayas, remolinos ni exposición dispareja visibles; orillas y esquinas iguales al resto') },
      { item: 'Joints filled flush; guard or sealer even with no streaks', item_es: tr('Juntas rellenas a ras; protector o sellador parejo sin rayas') },
    ],
    turnover: [
      { item: 'Floor protection in place and the GC told: no tape on the floor, no stacked materials, no acids or harsh cleaners', item_es: tr('Protección del piso colocada y el contratista general informado: sin cinta sobre el piso, sin materiales apilados, sin ácidos ni limpiadores agresivos') },
      { item: 'Maintenance instructions (pH-neutral cleaner, guard renewal) given to the owner', item_es: tr('Instrucciones de mantenimiento (limpiador de pH neutro, renovación del protector) entregadas al dueño') },
    ],
  },
  assemblies: [
    { code: 'G-POL-GRIND-SEAL-SF', name: 'Grind and seal concrete floor — light grind (Class A/B), densifier, penetrating sealer, per SF', name_es: 'Desbaste y sellado de piso de concreto: desbaste ligero (clase A/B), densificador y sellador, por pie²', unit: 'SF', csi: '03 35 43',
      material_cost_cents: { v: 30, prov: est('silicate densifier at ≈250–400 SF/gal + penetrating sealer, 2026 distributor baseline') },
      labor_hours_per_unit: { v: 0.01, prov: est('2-person crew ≈1,600 SF/day incl. edges, densify and seal') },
      equipment_cost_cents: { v: 20, prov: est('planetary grinder + dust extractor rental share and diamond wear') }, waste_pct: { v: 10, prov: est('overspray and container loss') } },
    { code: 'G-POL-MECH-L2-SF', name: 'Polished concrete, gloss level 2 (satin/honed ≈400 grit), Class B, densified + guard, per SF', name_es: 'Concreto pulido, brillo nivel 2 (satinado ≈grano 400), clase B, densificado + protector, por pie²', unit: 'SF', csi: '03 35 43',
      material_cost_cents: { v: 40, prov: est('densifier + guard + joint-area patching allowance, 2026 baseline') },
      labor_hours_per_unit: { v: 0.016, prov: est('≈5–6 grit steps; 2-person crew ≈1,000 SF/day incl. edges and cleanup') },
      equipment_cost_cents: { v: 35, prov: est('planetary grinder, edge grinder, HEPA extractor and metal/resin diamond wear') }, waste_pct: { v: 10, prov: est('chemical loss') } },
    { code: 'G-POL-MECH-L3-SF', name: 'Polished concrete, gloss level 3 (semi-polished ≈800+ grit), Class B/C, densified + guard, per SF', name_es: 'Concreto pulido, brillo nivel 3 (semipulido ≈grano 800+), clase B/C, densificado + protector, por pie²', unit: 'SF', csi: '03 35 43',
      material_cost_cents: { v: 45, prov: est('densifier + guard + patching allowance, 2026 baseline') },
      labor_hours_per_unit: { v: 0.022, prov: est('≈6–7 grit steps; 2-person crew ≈730 SF/day incl. edges and cleanup') },
      equipment_cost_cents: { v: 45, prov: est('grinder/extractor rental and added resin steps diamond wear') }, waste_pct: { v: 10, prov: est('chemical loss') } },
    { code: 'G-POL-STAIN-SF', name: 'Interior concrete color — acid stain or dye, neutralized and rinsed (sealer separate), per SF', name_es: 'Color en concreto interior: tinte ácido o colorante, neutralizado y enjuagado (sellador aparte), por pie²', unit: 'SF', csi: '03 35 13',
      material_cost_cents: { v: 30, prov: est('stain at ≈200–300 SF/gal (manufacturer TIS coverage) + neutralizer, 2026 price baseline') },
      labor_hours_per_unit: { v: 0.008, prov: est('masking, apply, react, neutralize and wet-vac ≈2,000 SF/day for a 2-person crew') },
      equipment_cost_cents: { v: 3, prov: est('floor scrubber and wet vac share') }, waste_pct: { v: 10, prov: est('overspray and mixing loss') } },
    { code: 'G-POL-JOINTFILL-LF', name: 'Polyurea joint fill in saw-cut control joints — clean, fill crowned, shave flush, per LF', name_es: 'Relleno de poliurea en juntas de control cortadas: limpiar, rellenar con corona, rasurar a ras, por pie lineal', unit: 'LF', csi: '03 35 43',
      material_cost_cents: { v: 90, prov: est('≈1/8 × 1.5–2 in. saw cut ≈0.012 gal/LF of 2-part polyurea, 2026 distributor baseline') },
      labor_hours_per_unit: { v: 0.025, prov: est('vacuum, fill and shave ≈40 LF/hr') },
      equipment_cost_cents: { v: 3, prov: est('cartridge gun or pump share') }, waste_pct: { v: 15, prov: est('overfill shaved off and mixer tips') } },
  ],
  quantity_rules: [
    { code: 'G-POL-MECH-L2-SF', assumption: '≈60% of industrial floor area left as polished concrete (warehouse/shop) — verify the finish schedule', when: { building_types: ['industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.6, round: 'ceil' } },
    { code: 'G-POL-MECH-L3-SF', assumption: '≈40% of commercial floor area in polished concrete (lobby, sales floor, corridors) — verify the finish schedule', when: { building_types: ['commercial'] }, qty: { basis: 'area_sf_sum', mul: 0.4, round: 'ceil' } },
    { code: 'G-POL-JOINTFILL-LF', assumption: '≈0.08 LF of filled control joint per SF of floor (joints ≈12–15 ft each way on polished areas) — verify the joint plan', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.08, round: 'ceil' } },
    { code: 'G-POL-GRIND-SEAL-SF', assumption: '≈20% of residential floor area as ground-and-sealed concrete (basement, mudroom, garage-level) — verify the finish schedule', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'area_sf_sum', mul: 0.2, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['concrete', 'concrete_flatwork'], note: 'Slab must be placed hard-troweled and cured (often 28 days) before polishing; heavy grinding ideally before interior partitions go up.' },
    { after_trades: ['drywall', 'painting'], before_phase: 'punch', note: 'Final polishing, guard and joint fill go after drywall texture and paint but before casework, base and fixtures.' },
  ],
});
