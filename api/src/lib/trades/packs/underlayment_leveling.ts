// Trade Knowledge Pack — underlayment_leveling (Floor Underlayment / Self-Leveling (Gypcrete)). Wave 15 —
// NEW-TRADE pattern (no hand recipe, no template tasks). Dossier: docs/trade-packs/dossiers/underlayment_leveling.md.
// Sources: Maxxon procedures guide + Gyp-Crete product data, ARDEX K 15 product data (manufacturer_public),
// 29 CFR 1926 (C, D, E, F, K, M, Q, Z), IBC 711 / 1206 + IRC Appendix AK (reference only).
// Building family, but no AHJ inspection in the building sequence fits a floor topping honestly → no gates;
// pre-pour and pre-flooring hold points live in inspection_checklists.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const mx = { src: ['underlayment_leveling-maxxon-procedures'], confidence: 'verified' as const, last_verified: D };
const gyp = { src: ['underlayment_leveling-maxxon-procedures', 'underlayment_leveling-maxxon-gypcrete-2000'], confidence: 'verified' as const, last_verified: D };
const rad = { src: ['underlayment_leveling-maxxon-gypcrete-radiant'], confidence: 'verified' as const, last_verified: D };
const slu = { src: ['underlayment_leveling-ardex-k15'], confidence: 'derived' as const, last_verified: D, note: 'Typical of published cementitious self-leveler data — follow the data sheet for the product installed.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });

const GYP = 'gyp(?:sum)?[- ]?crete|gypsum\\s+(?:concrete|underlayment|topping)|poured\\s+underlayment|lightweight\\s+(?:concrete\\s+)?topping';
const SLU = 'self[- ]?level|floor\\s+leveling|level(?:ing)?\\s+(?:compound|underlayment)|skim\\s+(?:coat|fill)';
const MAT = 'sound\\s+(?:control\\s+)?mat|acoustic(?:al)?\\s+(?:mat|underlayment)';

export default definePack({
  key: 'underlayment_leveling',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Pours floor underlayments: pumped gypsum underlayment over wood or concrete decks (often over sound mat or radiant tubing in multifamily floor-ceiling assemblies) and cementitious self-leveling underlayment to flatten floors for finish flooring — including deck prep, priming, isolation strips, pour depth, drying and the moisture test before flooring.',
    summary_es: 'Vacía bases de piso: base de yeso bombeada sobre entrepisos de madera o concreto (a menudo sobre manta acústica o tubería radiante en entrepisos de edificios multifamiliares) y autonivelante cementoso para emparejar pisos antes del acabado — incluye preparación del entrepiso, imprimación, tiras perimetrales, espesor del vaciado, secado y la prueba de humedad antes del piso final.',
    glossary: [
      { term: 'Gypsum underlayment', term_es: 'Base de yeso (gypcrete)', def: 'Pumped gypsum-and-sand topping poured over the subfloor to level it and add mass for sound and fire ratings.', def_es: 'Capa de yeso y arena bombeada sobre el contrapiso para nivelarlo y dar masa para aislamiento acústico y contra fuego.' },
      { term: 'Self-leveling underlayment (SLU)', term_es: 'Autonivelante', def: 'Cement-based pourable mix that flows flat on its own to correct dips before flooring.', def_es: 'Mezcla de cemento que se vacía y se nivela sola para corregir desniveles antes del piso.' },
      { term: 'Sound mat', term_es: 'Manta acústica', def: 'Mat laid on the subfloor under the underlayment to cut impact noise to the unit below.', def_es: 'Manta colocada sobre el contrapiso bajo la base para reducir el ruido de impacto hacia la unidad de abajo.' },
      { term: 'Perimeter isolation strip', term_es: 'Tira de aislamiento perimetral', def: 'Foam strip around walls and penetrations so the topping does not touch the framing and carry sound.', def_es: 'Tira de espuma alrededor de muros y pasos para que la base no toque la estructura y transmita ruido.' },
      { term: 'Primer / sealer', term_es: 'Imprimador / sellador', def: 'Coat on the deck or dried topping that controls absorption and helps bond.', def_es: 'Capa sobre el entrepiso o la base seca que controla la absorción y ayuda a la adherencia.' },
      { term: 'Pour depth', term_es: 'Espesor del vaciado', def: 'Thickness of the topping, set by the rated assembly, the subfloor and any tubing it must cover.', def_es: 'Grosor de la base, definido por el ensamble clasificado, el contrapiso y la tubería que debe cubrir.' },
      { term: 'Gauge rake', term_es: 'Rastrillo calibrador', def: 'Rake with adjustable pins that spreads self-leveler to an even depth.', def_es: 'Rastrillo con pernos ajustables que extiende el autonivelante a un espesor parejo.' },
      { term: 'Moisture test', term_es: 'Prueba de humedad', def: 'Meter or probe reading that proves the topping is dry enough for the flooring.', def_es: 'Lectura con medidor o sonda que demuestra que la base está suficientemente seca para el piso.' },
      { term: 'STC / IIC', term_es: 'STC / IIC', def: 'Ratings for airborne sound (STC) and impact sound (IIC) through a floor-ceiling assembly.', def_es: 'Clasificaciones de ruido aéreo (STC) y ruido de impacto (IIC) a través de un entrepiso.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'gypsum_underlayment',
      example_title: 'Pour gypsum underlayment (Gyp-Crete) — floors 2-4',
      when: { title_re: GYP },
      steps: [
        {
          title: 'Confirm the rated assembly and the building conditions',
          instruction: 'Pull the floor-ceiling assembly from the plans (UL design, STC/IIC) and note the required pour depth, mat and isolation strip. Confirm the building is closed in, interior and subfloor above 50 °F for a day before the pour and kept there until it dries, and that drying air can be held under about 70% RH.',
          tools: ['thermometer / hygrometer', 'tape measure'],
          materials: [],
          safety_ids: ['heater_co'],
          qa_ids: ['assembly_matched', 'temp_rh_held'],
          code_refs: [{ section: '711', code_type: 'IBC', note: 'Floor and roof assemblies — fire-resistance-rated floor construction' }, { section: '1206', code_type: 'IBC', note: 'Sound transmission between dwelling units' }],
        },
        {
          title: 'Prep the deck and set the isolation',
          instruction: 'Broom-clean the subfloor and block or fix soft spots and loose panels — the topping is not structural. Seal gaps and holes so it cannot leak through. Lay sound mat with tight, taped seams where specified, and run the perimeter isolation strip at every wall, column and pipe so the topping never touches framing. Guard every floor opening and shaft before hoses are dragged in.',
          tools: ['broom / shop vac', 'drill/driver', 'utility knife'],
          materials: ['sound mat where specified', 'perimeter isolation strip', 'seam tape', 'caulk or foam for gaps'],
          safety_ids: ['floor_hole', 'trip_hose'],
          qa_ids: ['deck_clean_sound', 'isolation_continuous', 'openings_guarded'],
        },
        {
          title: 'Check radiant tubing and set the depth marks',
          instruction: 'Where radiant tubing or cable is on the deck, confirm it is fastened down, pressure-tested and still holding pressure on a gauge, so a hit during the pour shows. Set depth screeds or marks for the specified thickness — at least 3/4 in. over the top of the tubes, and never thinner than the minimum for the subfloor and joist spacing.',
          tools: ['pressure gauge', 'laser level', 'depth pins'],
          materials: ['tubing clips or staples as needed'],
          safety_ids: ['trip_hose'],
          qa_ids: ['tubing_pressurized', 'depth_marks'],
        },
        {
          title: 'Prime, mix and pump the pour',
          instruction: 'Spray or roll the deck primer if the system calls for it. Batch the gypsum, sand and water at the mixer per the maker’s ratio, pump it to the floor through supported hoses with locked couplings, and screed to the marks one bay at a time. Keep a hose watcher at the pump and keep traffic off fresh areas.',
          detail: 'Wet gypsum mix is caustic to skin and eyes; mixing dry bags and sand makes silica dust — mix outdoors or with dust control.',
          tools: ['mixer-pump unit', 'pump hose', 'screed / darby', 'laser level'],
          materials: ['gypsum underlayment', 'washed sand per maker', 'deck primer if required'],
          safety_ids: ['silica', 'cement_skin', 'eye_splash', 'pump_hose', 'noise', 'lift_bags'],
          qa_ids: ['surface_flat'],
        },
        {
          title: 'Protect it and dry it out',
          instruction: 'Keep everyone off for the first few hours; light trades can return the next day. Lay planks where carts or heavy loads cross. Ventilate, heat and dehumidify so it dries — about a week at 3/4 in., longer when thicker or over radiant. Vent fuel heaters outside and never close the building up with heaters running unvented.',
          tools: ['dehumidifier', 'fans', 'temporary heat'],
          materials: ['plywood or OSB planking for traffic paths'],
          safety_ids: ['heater_co', 'cord_shock'],
          qa_ids: ['heater_vented'],
        },
        {
          title: 'Moisture-test and seal before flooring',
          instruction: 'Before any flooring goes down, test the topping for dryness with the method and limit in the maker’s guide (or the flooring maker’s, whichever is stricter) and record the readings by room. Scrape and vacuum off drywall mud and paint, then apply the specified sealer or primer to the dry surface.',
          tools: ['moisture meter or probe kit', 'scraper', 'shop vac', 'roller / sprayer'],
          materials: ['underlayment sealer / primer'],
          safety_ids: ['chem_primer'],
          qa_ids: ['moisture_logged', 'sealed_before_flooring'],
        },
      ],
    },
    {
      id: 'self_leveling',
      example_title: 'Self-leveling underlayment at tile areas',
      when: { title_re: SLU },
      steps: [
        {
          title: 'Assess and prep the substrate',
          instruction: 'Map the high and low spots with a straightedge or laser and find the flatness the flooring needs. Remove weak toppings, curing compounds, wax and loose material by grinding or shot blasting; leave adhesive residue only if the product allows it. Vacuum clean and test concrete for moisture before you start.',
          tools: ['straightedge', 'laser level', 'grinder with dust shroud and vacuum', 'moisture test kit'],
          materials: [],
          safety_ids: ['silica', 'noise', 'cord_shock'],
          qa_ids: ['substrate_sound', 'moisture_logged'],
        },
        {
          title: 'Dam, isolate and prime',
          instruction: 'Fill cracks and joints, dam floor drains, doorways and floor edges, and keep moving joints open or carried through. Prime with the primer the maker lists for that substrate — porous concrete, wood or non-porous coatings each take a different one — and let it dry to the stated window.',
          tools: ['roller / broom', 'utility knife'],
          materials: ['primer for the substrate type', 'foam dam / weather strip', 'crack filler'],
          safety_ids: ['chem_primer'],
          qa_ids: ['primed_right'],
        },
        {
          title: 'Mix and pour to depth',
          instruction: 'Measure the water for every bag — never add extra to stretch it. Mix with a paddle at the maker’s speed and time, pour in a continuous ribbon or pump it, spread with a gauge rake to depth, and run a spiked roller to release air. Work fast: the mix flows only about ten minutes, so keep a wet edge and enough crew to finish the area.',
          tools: ['mixing drill and paddle', 'measuring bucket', 'gauge rake', 'spiked roller and spiked shoes'],
          materials: ['self-leveling underlayment', 'aggregate only if the data sheet allows it for deep fills'],
          safety_ids: ['silica', 'cement_skin', 'eye_splash', 'lift_bags'],
          qa_ids: ['water_measured', 'surface_flat'],
        },
        {
          title: 'Cure, check flatness and release',
          instruction: 'Keep drafts, direct sun and heat off while it sets. Once walkable, check flatness with a straightedge, grind ridges and patch low spots, and do not set flooring until the maker’s wait time has passed and the moisture reading is within the flooring maker’s limit.',
          tools: ['straightedge', 'rubbing stone or grinder'],
          materials: ['patch compound'],
          safety_ids: ['silica'],
          qa_ids: ['surface_flat', 'moisture_logged'],
        },
      ],
    },
    {
      id: 'sound_mat',
      example_title: 'Install sound mat under gypsum underlayment',
      when: { title_re: MAT },
      priority: 10,
      steps: [
        {
          title: 'Confirm the mat in the rated assembly',
          instruction: 'Match the mat type and thickness to the tested floor-ceiling assembly on the plans (STC/IIC and UL design). A substitute mat or thinner topping can void the rating.',
          tools: [],
          materials: [],
          safety_ids: [],
          qa_ids: ['assembly_matched'],
          code_refs: [{ section: '1206', code_type: 'IBC', note: 'Airborne and impact sound ratings between units' }, { section: 'AK103', code_type: 'IRC', note: 'Structure-borne (impact) sound — appendix, where adopted' }],
        },
        {
          title: 'Lay the mat and the perimeter strip',
          instruction: 'Sweep the deck, roll the mat out with seams butted tight and taped, and cut neatly around pipes and posts. Run the perimeter isolation strip up every wall and penetration so the topping floats. Do not fasten through the mat.',
          tools: ['utility knife', 'broom', 'tape measure'],
          materials: ['sound mat', 'perimeter isolation strip', 'seam tape'],
          safety_ids: ['floor_hole', 'trip_hose'],
          qa_ids: ['isolation_continuous', 'mat_seams'],
        },
        {
          title: 'Protect the mat until the pour',
          instruction: 'Keep traffic and carts off the mat, repair tears before the pour crew arrives, and hand off to the underlayment pour the same day where possible. Walls set later on the topping go on with adhesive, not nails through the mat.',
          tools: [],
          materials: ['repair tape'],
          safety_ids: ['trip_hose'],
          qa_ids: ['mat_seams'],
        },
      ],
    },
  ],
  code_refs: {
    final: [
      { section: '1206.2', code_type: 'IBC', note: 'Airborne sound — STC rating for floor-ceiling assemblies between units', prov: icc },
      { section: '1206.3', code_type: 'IBC', note: 'Structure-borne sound — IIC rating for floor-ceiling assemblies between units', prov: icc },
      { section: '711', code_type: 'IBC', note: 'Fire-resistance-rated floor assemblies built as the listed design', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: GYP, building_types: ['residential_mf', 'commercial'] }, type: 'concrete_pump', reason: 'Truck- or trailer-mounted mixer-pump to place gypsum underlayment on upper floors', optional: true },
    { when: { title_re: `${GYP}|${SLU}` }, type: 'generator', reason: 'Power for mixers and pumps before permanent power is on', optional: true },
  ],
  hazards: [
    { id: 'silica', hazard: 'Respirable crystalline silica from mixing bagged product and sand, and from grinding the substrate', hazard_es: PENDING_ES, controls: ['Mix outdoors or with local exhaust; grind only with a shrouded tool on a dust-collecting vacuum', 'Follow the written exposure control plan; respirator when controls do not keep exposure down'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 3, ppe: ['respirator when required', 'safety glasses'], prov: osha('z') },
    { id: 'dust_general', hazard: 'Nuisance cement and gypsum dust while dumping bags', hazard_es: PENDING_ES, controls: ['Open bags low and slowly; keep dumping downwind of the crew', 'Wet-clean or HEPA-vacuum spills — no dry sweeping'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, prov: osha('d') },
    { id: 'cement_skin', hazard: 'Alkaline burns from wet underlayment on skin and knees', hazard_es: PENDING_ES, controls: ['Wear waterproof gloves, long sleeves and boots; tape cuffs', 'Wash skin right away with clean water; change soaked clothing'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['waterproof gloves', 'rubber boots', 'knee pads'], prov: osha('e') },
    { id: 'eye_splash', hazard: 'Eye injury from splashing mix and blowing dust', hazard_es: PENDING_ES, controls: ['Wear safety goggles while mixing and pouring', 'Keep an eyewash bottle at the mixing station'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 3, ppe: ['goggles'], prov: osha('e') },
    { id: 'pump_hose', hazard: 'Hose whip or burst coupling on the pump line', hazard_es: PENDING_ES, controls: ['Use couplings that lock and cannot separate under pressure', 'Support and secure the line; relieve pressure before opening a clog'], controls_es: PENDING_ES, osha_ref: '1926.702(e)(2)', severity: 3, prov: osha('q') },
    { id: 'floor_hole', hazard: 'Fall through stair openings, shafts and floor holes while dragging hose', hazard_es: PENDING_ES, controls: ['Cover or guardrail every hole more than 6 ft above the level below', 'Mark covers and keep them secured through the pour'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(i)', severity: 4, prov: osha('m') },
    { id: 'trip_hose', hazard: 'Trips over hoses, mat edges and cords on the deck', hazard_es: PENDING_ES, controls: ['Route hoses and cords along walls', 'Keep the work area clear of scraps and empty bags'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, prov: osha('c') },
    { id: 'heater_co', hazard: 'Carbon monoxide from fuel heaters used to dry the floor in a closed building', hazard_es: PENDING_ES, controls: ['Supply fresh air; vent heaters outside or use electric or indirect-fired heat', 'Use CO monitors when fuel heaters run indoors'], controls_es: PENDING_ES, osha_ref: '1926.154(a)(1)', severity: 4, prov: osha('f') },
    { id: 'noise', hazard: 'Noise from the mixer-pump and floor grinders', hazard_es: PENDING_ES, controls: ['Wear hearing protection near the pump and grinders', 'Park the pump away from occupied work areas'], controls_es: PENDING_ES, osha_ref: '1926.52', severity: 2, ppe: ['hearing protection'], prov: osha('d') },
    { id: 'cord_shock', hazard: 'Electric shock from mixers and cords in wet work', hazard_es: PENDING_ES, controls: ['GFCI on every temporary receptacle', 'Keep cord connections off wet floors; remove damaged cords'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'lift_bags', hazard: 'Back strain carrying 50–80 lb bags', hazard_es: PENDING_ES, controls: ['Stage pallets close to the mixer with a pallet jack or forklift', 'Lift with the legs; share heavy loads'], controls_es: PENDING_ES, osha_ref: '1926.20(b)', severity: 2, prov: osha('c') },
    { id: 'chem_primer', hazard: 'Skin and breathing irritation from primers, sealers and moisture-mitigation coatings', hazard_es: PENDING_ES, controls: ['Read the SDS; ventilate the space', 'Wear gloves and eye protection when spraying or rolling'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'assembly_matched', item: 'Mat, topping type and pour depth match the listed fire- and sound-rated floor-ceiling assembly on the plans.', item_es: tr('La manta, el tipo de base y el espesor coinciden con el ensamble de entrepiso clasificado contra fuego y ruido indicado en los planos.'), prov: gyp },
    { id: 'temp_rh_held', item: 'Building and subfloor held above 50 °F from a day before the pour until dry; RH kept under about 70% while drying.', item_es: tr('Edificio y contrapiso mantenidos sobre 50 °F desde un día antes del vaciado hasta que seque; HR por debajo de ~70% durante el secado.'), prov: mx },
    { id: 'deck_clean_sound', item: 'Subfloor broom-clean, soft spots and loose panels fixed before the pour — the topping does not stiffen a weak floor.', item_es: tr('Contrapiso barrido y limpio; puntos blandos y paneles sueltos reparados antes del vaciado — la base no refuerza un piso débil.'), prov: mx },
    { id: 'isolation_continuous', item: 'Perimeter isolation strip continuous at every wall, column and pipe; no topping touching framing.', item_es: tr('Tira perimetral continua en cada muro, columna y tubería; la base no toca la estructura.'), prov: mx },
    { id: 'mat_seams', item: 'Sound mat seams butted tight and taped, tears repaired, no fasteners through the mat.', item_es: tr('Uniones de la manta acústica a tope y encintadas, roturas reparadas, sin sujetadores a través de la manta.'), prov: mx },
    { id: 'tubing_pressurized', item: 'Radiant tubing fastened and holding test pressure on a gauge during the pour.', item_es: tr('Tubería radiante fijada y manteniendo la presión de prueba en el manómetro durante el vaciado.'), prov: { src: ['underlayment_leveling-maxxon-gypcrete-radiant', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'Pressurized-during-pour practice carried over from the hydronic pack; the gauge shows a hit right away.' } },
    { id: 'depth_marks', item: 'Depth marks set for the specified thickness: at least 3/4 in. over radiant tubes and not below the minimum for the subfloor and joist spacing.', item_es: tr('Marcas de espesor colocadas según lo especificado: al menos 3/4 pulg. sobre la tubería radiante y no menos del mínimo para el contrapiso y la separación de vigas.'), prov: { src: ['underlayment_leveling-maxxon-gypcrete-radiant', 'underlayment_leveling-maxxon-procedures'], confidence: 'verified', last_verified: D } },
    { id: 'surface_flat', item: 'Finished surface flat to the tolerance the flooring requires; ridges ground and low spots patched.', item_es: tr('Superficie terminada plana según la tolerancia del piso final; crestas pulidas y partes bajas resanadas.'), prov: slu },
    { id: 'water_measured', item: 'Water measured for every bag of self-leveler; no extra water added.', item_es: tr('Agua medida para cada saco de autonivelante; sin agregar agua de más.'), prov: slu },
    { id: 'substrate_sound', item: 'Substrate sound and clean: weak toppings, curing compounds and dust removed mechanically before priming.', item_es: tr('Sustrato firme y limpio: capas débiles, compuestos de curado y polvo retirados mecánicamente antes de imprimar.'), prov: slu },
    { id: 'primed_right', item: 'Primer matches the substrate (porous concrete, wood or non-porous coating) and is dry to the maker’s window before the pour.', item_es: tr('El imprimador corresponde al sustrato (concreto poroso, madera o recubrimiento no poroso) y está seco según el plazo del fabricante antes del vaciado.'), prov: slu },
    { id: 'openings_guarded', item: 'Every stair opening, shaft and floor hole covered or guardrailed before hoses and crews are on the deck.', item_es: PENDING_ES, safety: true, prov: osha('m') },
    { id: 'heater_vented', item: 'Fuel-fired drying heaters vented outside or replaced with electric/indirect heat; CO monitored where fuel heaters run indoors.', item_es: PENDING_ES, safety: true, prov: osha('f') },
    { id: 'moisture_logged', item: 'Moisture readings taken by the maker’s method and recorded by room; flooring held until within the stricter of the topping or flooring maker’s limit.', item_es: tr('Lecturas de humedad tomadas con el método del fabricante y registradas por cuarto; el piso espera hasta cumplir el límite más estricto entre la base y el piso.'), prov: mx },
    { id: 'sealed_before_flooring', item: 'Dry topping cleaned of drywall mud and paint and sealed or primed before flooring.', item_es: tr('Base seca limpia de pasta de tablaroca y pintura, y sellada o imprimada antes del piso.'), prov: mx },
  ],
  inspection_checklists: {
    pre_pour_holdpoint: [
      { item: 'Rated assembly (UL design, STC/IIC) confirmed and pour depth marked', item_es: tr('Ensamble clasificado (diseño UL, STC/IIC) confirmado y espesor marcado'), ref: 'IBC 1206 / 711' },
      { item: 'Sound mat seams taped and perimeter isolation strip continuous', item_es: tr('Uniones de la manta encintadas y tira perimetral continua') },
      { item: 'Radiant tubing tested and on a gauge; floor openings guarded', item_es: PENDING_ES },
      { item: 'Building above 50 °F and drying plan (heat, ventilation, dehumidification) in place', item_es: tr('Edificio sobre 50 °F y plan de secado (calor, ventilación, deshumidificación) listo') },
    ],
    pre_flooring_release: [
      { item: 'Moisture readings by room within the stricter of the topping or flooring limit', item_es: tr('Lecturas de humedad por cuarto dentro del límite más estricto entre la base y el piso') },
      { item: 'Surface flatness checked; cracks repaired; surface sealed or primed', item_es: tr('Planitud verificada; grietas reparadas; superficie sellada o imprimada') },
      { item: 'Field sound test (FIIC/ASTC) scheduled where the owner or AHJ requires it', item_es: tr('Prueba acústica en campo (FIIC/ASTC) programada donde el propietario o la autoridad la exija'), ref: 'IBC 1206' },
    ],
  },
  assemblies: [
    { code: 'B-UL-GYP-075-SF', name: 'Gypsum underlayment 3/4 in. pumped over wood or concrete deck, applicator installed, per SF', name_es: 'Base de yeso de 3/4 pulg. bombeada sobre entrepiso de madera o concreto, instalada por aplicador, por pie²', unit: 'SF', csi: '03 54 16',
      description: 'Includes deck primer if required. Sound mat and isolation strip are separate lines.',
      material_cost_cents: { v: 95, prov: est('Bagged gypsum underlayment + washed sand at ~3/4 in., national baseline 2026') }, labor_hours_per_unit: { v: 0.012, prov: est('Pump crew of 4–5 placing several thousand SF per day') },
      equipment_cost_cents: { v: 15, prov: est('Mixer-pump unit day rate spread over daily production') }, waste_pct: { v: 5, prov: est('Overfill at low spots and pump washout') } },
    { code: 'B-UL-SLU-SF', name: 'Cementitious self-leveling underlayment, 1/4 in. average, per SF (primer separate)', name_es: 'Autonivelante cementoso, 1/4 pulg. promedio, por pie² (imprimador aparte)', unit: 'SF', csi: '03 54 16',
      material_cost_cents: { v: 165, prov: { src: ['underlayment_leveling-ardex-k15', 'platform-baseline'], confidence: 'estimate', last_verified: D, note: 'Coverage ~30 SF per 55 lb bag at 1/4 in. (published); bag price ~$50 is our estimate.' } }, labor_hours_per_unit: { v: 0.02, prov: est('Mix, pour and gauge-rake with a 3–4 person crew; prep excluded') },
      equipment_cost_cents: { v: 5, prov: est('Mixing drill / pump share') }, waste_pct: { v: 10, prov: est('Bucket and mixer waste, low spots deeper than average') } },
    { code: 'B-UL-PRIMER-SF', name: 'Underlayment primer / sealer, one coat, per SF', name_es: 'Imprimador / sellador para base, una mano, por pie²', unit: 'SF', csi: '03 54 16',
      material_cost_cents: { v: 12, prov: est('Acrylic primer or gypsum sealer, diluted per maker, 2026') }, labor_hours_per_unit: { v: 0.003, prov: est('Spray or roll') },
      equipment_cost_cents: { v: 0, prov: est('Hand tools / sprayer') }, waste_pct: { v: 10, prov: est('Overspray and container waste') } },
    { code: 'B-UL-SOUNDMAT-SF', name: 'Sound control mat under poured underlayment, ~1/4 in., seams taped, per SF', name_es: 'Manta de control acústico bajo base vaciada, ~1/4 pulg., uniones encintadas, por pie²', unit: 'SF', csi: '09 62 19',
      material_cost_cents: { v: 85, prov: est('Entangled-mesh or rubber sound mat ~1/4 in. with seam tape, 2026') }, labor_hours_per_unit: { v: 0.005, prov: est('Roll out, cut, tape') },
      equipment_cost_cents: { v: 0, prov: est('Hand tools only') }, waste_pct: { v: 5, prov: est('Cut-offs at walls and penetrations') } },
    { code: 'B-UL-ISO-STRIP-LF', name: 'Perimeter isolation strip at walls and penetrations, per LF', name_es: 'Tira de aislamiento perimetral en muros y pasos, por pie lineal', unit: 'LF', csi: '09 62 19',
      material_cost_cents: { v: 30, prov: est('Foam isolation strip 1/4 in., national baseline 2026') }, labor_hours_per_unit: { v: 0.01, prov: est('Cut and set along base of wall') },
      equipment_cost_cents: { v: 0, prov: est('Hand tools only') }, waste_pct: { v: 10, prov: est('Corners and laps') } },
  ],
  quantity_rules: [
    { code: 'B-UL-GYP-075-SF', assumption: 'Poured gypsum underlayment on MF wood-frame floors — ≈75% of room area (the slab-on-grade level gets none); adjust to the real level count', when: { building_types: ['residential_mf'] }, qty: { basis: 'area_sf_sum', mul: 0.75, round: 'ceil' } },
    { code: 'B-UL-SOUNDMAT-SF', assumption: 'Sound mat under the underlayment on unit-over-unit floors (≈75% of room area, same as the topping) — confirm against the rated assembly', when: { building_types: ['residential_mf'] }, qty: { basis: 'area_sf_sum', mul: 0.75, round: 'ceil' } },
    { code: 'B-UL-PRIMER-SF', assumption: 'One coat of sealer on the dried topping before flooring (≈75% of room area, same as the topping)', when: { building_types: ['residential_mf'] }, qty: { basis: 'area_sf_sum', mul: 0.75, round: 'ceil' } },
    { code: 'B-UL-ISO-STRIP-LF', assumption: '≈30 LF of perimeter isolation strip per scheduled room (≈40 LF room perimeter × 75% on topped levels)', when: { building_types: ['residential_mf'] }, qty: { basis: 'rooms', mul: 30 } },
  ],
  dependency_hints: [
    { after_trades: ['framing', 'boilers_hydronic', 'plumbing', 'electrical'], note: 'Pour after floor penetrations are in and sealed and radiant tubing is tested; walls are best framed first when a sound mat is used.' },
    { before_phase: 'finishes_interior', note: 'Topping must be dry (moisture-tested) and sealed before tile, wood, resilient or carpet flooring goes down.' },
  ],
});
