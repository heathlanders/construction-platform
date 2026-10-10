// Trade Knowledge Pack — pest_control (Pest Control / Termite Pretreatment). Wave 18 — NEW-TRADE pattern: no hand
// recipe (falls to the generic no-permit step today), zero blueprint template tasks.
// Scope: pre-construction subterranean termite soil pretreatment before the slab pour and along the foundation,
// termite bait / monitoring station systems, borate wood treatment on framing, and rodent exclusion at penetrations.
// Fumigation, wildlife removal and ongoing service contracts are out of scope.
// permit_trade null → NO gates, NO code_refs. IRC R318 (protection against subterranean termites) is a building-code
// topic; it appears only as a section number + paraphrase in inspection_checklists and the dossier.
// Dossier: docs/trade-packs/dossiers/pest_control.md. Sources: EPA termite fact sheet + PRN 96-7 termiticide labeling,
// FIFRA §12 (7 USC 136j), 40 CFR 156, Wis. Admin. Code ATCP 29, NPIC, 29 CFR 1926 C/D/E/K/Z/AA.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const oshaDerived = (sub: string, note: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'derived' as const, last_verified: D, note });
const prn = (note?: string) => ({ src: ['pest_control-epa-prn96-7'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const label = (note?: string) => ({ src: ['pest_control-fifra-136j', 'pest_control-epa-labels'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const wi = (note?: string) => ({ src: ['pest_control-wi-atcp29'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const epa = (note?: string) => ({ src: ['pest_control-epa-termites'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'pest_control',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Licensed pest-control work on a building job: termite soil pretreat under the slab and along the foundation, bait and monitoring stations, borate spray on framing, and sealing gaps against rodents. The label is the law for rate, weather limits, PPE and reentry; the applicator must be state-licensed for termite control and leave a record and certificate.',
    summary_es: 'Control de plagas con licencia en una obra: pretratamiento de termitas bajo la losa y en la cimentación, estaciones de cebo y monitoreo, borato en la estructura y sellado contra roedores. La etiqueta es la ley para dosis, clima, protección y reingreso; el aplicador necesita licencia estatal de termitas y deja registro y certificado.',
    glossary: [
      { term: 'Termiticide', term_es: 'Termiticida', def: 'A pesticide registered by EPA specifically for preventing or controlling termites; only products labeled for that use protect the structure.', def_es: 'Pesticida registrado por la EPA específicamente para prevenir o controlar termitas; solo los productos con esa indicación en la etiqueta protegen la estructura.' },
      { term: 'Pretreat (pre-construction treatment)', term_es: 'Pretratamiento (tratamiento antes de construir)', def: 'Soil treatment made before the finished grade and slab are installed; the label rate may never be reduced for a pretreat.', def_es: 'Tratamiento del suelo antes de instalar el nivel final y la losa; en un pretratamiento nunca se puede reducir la dosis de la etiqueta.' },
      { term: 'Horizontal barrier', term_es: 'Barrera horizontal', def: 'Termiticide spread evenly over the compacted fill under a slab, porch or garage floor.', def_es: 'Termiticida aplicado parejo sobre el relleno compactado bajo una losa, porche o piso de cochera.' },
      { term: 'Vertical barrier', term_es: 'Barrera vertical', def: 'Termiticide placed in a trench or rodded into the soil along foundation walls, piers and pipes.', def_es: 'Termiticida colocado en una zanja o inyectado con varilla en el suelo a lo largo de muros de cimentación, pilares y tubos.' },
      { term: 'Trench and rod', term_es: 'Zanja y varilla', def: 'Digging a shallow trench at the foundation and injecting through a hollow rod in the trench bottom so the barrier is continuous to the needed depth.', def_es: 'Excavar una zanja poco profunda junto a la cimentación e inyectar con una varilla hueca en el fondo para que la barrera sea continua a la profundidad necesaria.' },
      { term: 'Bait station', term_es: 'Estación de cebo', def: 'In-ground plastic housing holding a cellulose bait with a slow-acting insecticide or a monitor; spaced around the building and checked on a schedule.', def_es: 'Caja de plástico enterrada con un cebo de celulosa con insecticida de acción lenta o un monitor; se distribuye alrededor del edificio y se revisa según un calendario.' },
      { term: 'Borate treatment', term_es: 'Tratamiento con borato', def: 'Water-based borate solution sprayed on exposed framing during new construction to protect the wood.', def_es: 'Solución de borato a base de agua rociada sobre la estructura de madera expuesta durante la construcción para proteger la madera.' },
      { term: 'Reentry interval', term_es: 'Intervalo de reingreso', def: 'Time the label requires before people go back into a treated area.', def_es: 'Tiempo que exige la etiqueta antes de que las personas regresen a un área tratada.' },
      { term: 'EPA registration number', term_es: 'Número de registro de la EPA', def: 'Number printed on every pesticide label that identifies the exact product; it goes on the treatment record.', def_es: 'Número impreso en cada etiqueta de pesticida que identifica el producto exacto; se anota en el registro del tratamiento.' },
      { term: 'Treatment certificate', term_es: 'Certificado de tratamiento', def: 'Paper the applicator gives the builder showing what was treated, with which product, at what rate and on what date; lenders and inspectors may ask for it.', def_es: 'Documento que el aplicador entrega al constructor con lo tratado, el producto, la dosis y la fecha; los prestamistas e inspectores pueden pedirlo.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'termite_soil_pretreat',
      example_title: 'Termite pretreat — soil treatment before slab pour',
      when: { title_re: 'termit(?:e|icide)|pre-?treat|soil (?:poison|treatment)' },
      steps: [
        {
          title: 'Schedule the pretreat and notify the crew',
          instruction: 'Set the pretreat after under-slab plumbing, fill and compaction are done and before the vapor retarder and slab pour. Confirm the applicator holds a state commercial applicator license certified for termite control. The applicator tells the superintendent the treatment time and areas so the crew can be moved out until the treated soil has absorbed the product. Locate any well, cistern, footing drain or sump that discharges near the treated zone.',
          tools: ['site plan', 'phone or radio'],
          materials: ['product label and safety data sheet on site', 'applicator license copy'],
          safety_ids: ['chemical_exposure', 'bystander_exposure', 'water_contamination'],
          qa_ids: ['license_verified', 'label_on_site', 'crew_notified', 'wells_located'],
        },
        {
          title: 'Check soil and weather before mixing',
          instruction: 'Do not treat soil that is saturated or frozen, and do not treat while it is raining. Walk the pad: fill graded and compacted, no wood forms or scraps left buried, standing water drained. Mix only the amount the label calls for the measured area, in the tank with the backflow device on the fill hose.',
          tools: ['tape measure', 'calibrated sprayer or treating rig', 'measuring container'],
          materials: ['labeled termiticide', 'water'],
          safety_ids: ['chemical_exposure', 'spill', 'water_contamination'],
          qa_ids: ['soil_condition', 'mix_per_label'],
        },
        {
          title: 'Apply the horizontal barrier under the slab',
          instruction: 'Spread the emulsion evenly over all fill under the slab, porch and garage floor at the full label volume and concentration — a pretreat may never go below label rate. Hit the soil around every plumbing and conduit penetration, along interior footings and at expansion joints. Keep spray off the footing drain, sump pit and any open water.',
          tools: ['treating wand or fan nozzle', 'hose reel'],
          materials: ['mixed termiticide emulsion'],
          safety_ids: ['chemical_exposure', 'spill', 'water_contamination', 'heat_stress'],
          qa_ids: ['full_label_rate', 'penetrations_treated'],
        },
        {
          title: 'Treat the foundation perimeter',
          instruction: 'Trench along the foundation walls, piers and pipes and rod into the trench bottom, holes no farther apart than the label allows, so the vertical barrier is continuous; mix the emulsion into the soil as it goes back in. Where the foundation is deep, treat as the backfill is placed. Call before digging and locate buried electric lines before rodding.',
          tools: ['trenching shovel', 'treating rod', 'hose reel'],
          materials: ['mixed termiticide emulsion'],
          safety_ids: ['chemical_exposure', 'buried_utilities', 'spill', 'manual_handling'],
          qa_ids: ['perimeter_continuous'],
        },
        {
          title: 'Cover, record and certify',
          instruction: 'Keep people off the treated soil until it has absorbed. If the slab is not poured the same day and rain is coming, cover the treated area as the label directs. Do not disturb the barrier: any later digging through it gets re-treated. Record the application the same day and give the builder the treatment certificate and the customer information sheet.',
          tools: ['camera'],
          materials: ['polyethylene cover if the label requires it', 'treatment certificate', 'application record'],
          safety_ids: ['bystander_exposure', 'water_contamination'],
          qa_ids: ['barrier_protected', 'record_completed', 'certificate_delivered'],
        },
      ],
    },
    {
      id: 'termite_bait_borate',
      priority: 5,
      example_title: 'Install termite bait stations and borate wood treatment',
      when: { title_re: 'bait (?:station|system)|termite (?:bait|monitor)|borate|wood treatment|wood[- ]?destroying' },
      steps: [
        {
          title: 'Confirm the system and the license',
          instruction: 'Confirm which system the plans or the owner chose — bait stations, borate wood treatment, or both — and that the applicator is licensed for termite control (and wood preservation for borate). Keep the product labels on site.',
          tools: [],
          materials: ['product labels', 'applicator license copy'],
          safety_ids: ['chemical_exposure'],
          qa_ids: ['license_verified', 'label_on_site'],
        },
        {
          title: 'Spray borate on the framing',
          instruction: 'Before the walls are closed and while the wood is dry, spray the borate solution on sill plates, bottom plates, studs and sheathing to the height the label calls for. Keep it off finished surfaces and out of the rain until it dries. Keep other trades out of the room while spraying.',
          tools: ['low-pressure sprayer'],
          materials: ['labeled borate concentrate', 'water'],
          safety_ids: ['chemical_exposure', 'bystander_exposure', 'confined_crawl'],
          qa_ids: ['borate_coverage'],
        },
        {
          title: 'Set the bait or monitoring stations',
          instruction: 'After final grade and landscaping, dig the station holes at the spacing the system label gives around the foundation, set each station flush with grade and fill with monitor or bait. Locate buried electric, gas and irrigation lines before digging. Record each station on a site sketch.',
          tools: ['station auger or post-hole digger', 'shovel', 'locator flags'],
          materials: ['bait or monitoring stations', 'bait cartridges'],
          safety_ids: ['buried_utilities', 'manual_handling', 'chemical_exposure'],
          qa_ids: ['stations_mapped'],
        },
        {
          title: 'Close out and hand over the service record',
          instruction: 'Give the owner the station map, the product names and EPA registration numbers, the inspection schedule and any warranty. Record the application the same day.',
          tools: [],
          materials: ['station map', 'application record', 'service agreement'],
          safety_ids: [],
          qa_ids: ['record_completed', 'certificate_delivered'],
        },
      ],
    },
    {
      id: 'rodent_exclusion',
      priority: 5,
      example_title: 'Rodent exclusion — seal utility penetrations',
      when: { title_re: 'rodent|exclusion|pest (?:proof|seal|control)' },
      steps: [
        {
          title: 'Find the openings',
          instruction: 'Walk the foundation, sill, crawl space and garage door seals and mark every gap where pipes, wires, vents and siding meet the building. Treat a crawl space as a possible confined space until it is checked.',
          tools: ['flashlight', 'marking tape'],
          materials: [],
          safety_ids: ['confined_crawl', 'sharp_edges'],
          qa_ids: ['openings_sealed'],
        },
        {
          title: 'Seal with rodent-proof material',
          instruction: 'Pack gaps with metal mesh, sheet metal or mortar and finish with sealant; foam or caulk alone gets chewed through. Fit screens on vents and a sweep or seal on doors. Keep any rodenticide in tamper-resistant stations used exactly as labeled.',
          tools: ['tin snips', 'caulk gun', 'putty knife'],
          materials: ['metal mesh or hardware cloth', 'sheet metal', 'sealant or mortar', 'vent screens'],
          safety_ids: ['sharp_edges', 'chemical_exposure'],
          qa_ids: ['openings_sealed'],
        },
      ],
    },
  ],
  hazards: [
    { id: 'chemical_exposure', hazard: 'Skin, eye or breathing exposure to termiticide or borate concentrate while mixing, loading and spraying', hazard_es: PENDING_ES, controls: ['Read the label and safety data sheet before mixing; follow the label PPE exactly', 'Mix outdoors or with good ventilation; never mix by hand or siphon by mouth', 'Wash hands and face before eating, drinking or smoking; change out of contaminated clothing'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 3, ppe: ['chemical-resistant gloves', 'protective eyewear', 'long sleeves and long pants', 'chemical-resistant footwear'], prov: { src: ['ecfr-1926-d', 'pest_control-epa-prn96-7'], confidence: 'verified', last_verified: D, note: '1926.59 hazard communication; label PPE by toxicity category per PRN 96-7.' } },
    { id: 'respiratory', hazard: 'Inhaling spray mist or vapor when treating in a crawl space, basement or other poorly ventilated space or when rodding sub-slab', hazard_es: PENDING_ES, controls: ['Wear the respirator type the label names when working in a non-ventilated space', 'Use respirators only under a written program with fit testing and medical clearance', 'Shut off the building air handling while treating a crawl space'], controls_es: PENDING_ES, osha_ref: '1926.103', severity: 3, ppe: ['NIOSH-approved respirator per the label'], prov: { src: ['ecfr-1926-e', 'pest_control-epa-prn96-7'], confidence: 'verified', last_verified: D } },
    { id: 'eye_splash', hazard: 'Concentrate splashing into the eyes when opening, pouring or when a hose fitting lets go under pressure', hazard_es: PENDING_ES, controls: ['Wear goggles or a face shield while mixing and loading', 'Keep clean water or an eyewash on the rig for immediate flushing', 'Check hose fittings and relieve pressure before disconnecting'], controls_es: PENDING_ES, osha_ref: '1926.50(g)', severity: 3, ppe: ['goggles or face shield'], prov: osha('d', '1926.50(g) quick-drench / eye-flush facilities where injurious corrosive materials may contact eyes or body.') },
    { id: 'bystander_exposure', hazard: 'Other trades walking, working or eating on freshly treated soil or in a sprayed room before the reentry time', hazard_es: PENDING_ES, controls: ['Notify the superintendent before each application so workers leave the treated area', 'Flag or rope off treated areas until the product has absorbed or dried', 'Post the reentry time from the label'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, prov: { src: ['ecfr-1926-c', 'pest_control-epa-prn96-7'], confidence: 'derived', last_verified: D, note: 'PRN 96-7 requires the applicator to notify the GC to clear workers until absorbed; OSHA training duty to avoid unsafe conditions.' } },
    { id: 'wash_facility', hazard: 'Pesticide left on skin for hours because there is no place to wash on site', hazard_es: PENDING_ES, controls: ['Provide water, soap and towels near the mixing area', 'Wash before breaks and at the end of the job'], controls_es: PENDING_ES, osha_ref: '1926.51(f)(1)', severity: 2, ppe: [], prov: osha('d', '1926.51(f)(1) washing facilities for employees applying insecticides.') },
    { id: 'water_contamination', hazard: 'Termiticide reaching a drinking-water well, cistern, footing drain, sump or storm inlet', hazard_es: PENDING_ES, controls: ['Locate wells, cisterns and drains before treating and follow the label well and drain restrictions', 'Use a backflow device or air gap when filling the tank from a hose', 'Do not treat saturated soil or in the rain'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 3, prov: { src: ['pest_control-epa-prn96-7', 'pest_control-epa-termites', 'ecfr-1926-d'], confidence: 'derived', last_verified: D, note: 'Environmental hazard (EPA: improper barrier treatment can contaminate nearby wells); OSHA ref = hazcom for the product SDS.' } },
    { id: 'spill', hazard: 'Spill of concentrate or tank mix in the truck, on the pad or on the street', hazard_es: PENDING_ES, controls: ['Carry absorbent and a spill kit on the rig', 'Secure containers upright and closed in transport', 'Contain, absorb and bag spilled material and report as the label and state rules require'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['chemical-resistant gloves'], prov: osha('d') },
    { id: 'buried_utilities', hazard: 'Shock or gas release from striking buried electric, gas or irrigation lines while trenching, rodding or augering station holes', hazard_es: PENDING_ES, controls: ['Call the one-call center and wait for locates before digging', 'Hand-dig near marked lines', 'Ask the GC about private lines the locate service does not mark'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(3)', severity: 4, prov: osha('k') },
    { id: 'confined_crawl', hazard: 'Low oxygen, vapor build-up or entrapment while treating or sealing in a crawl space', hazard_es: PENDING_ES, controls: ['Have a competent person evaluate the crawl space before entry', 'Ventilate and keep a second person outside', 'Follow the permit-space procedure if the space qualifies'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 3, prov: osha('aa') },
    { id: 'heat_stress', hazard: 'Heat illness from working in impermeable chemical PPE on an open pad in summer', hazard_es: PENDING_ES, controls: ['Schedule treatment early in the day in hot weather', 'Drink water often and take shaded breaks', 'Watch each other for signs of heat illness'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, prov: oshaDerived('c', 'No 1926 heat standard; training duty to recognize and avoid unsafe conditions.') },
    { id: 'manual_handling', hazard: 'Back strain carrying full jugs, hose reels and digging trenches or station holes', hazard_es: PENDING_ES, controls: ['Use a hose reel on the rig instead of dragging full hoses', 'Two-person lift or a dolly for full containers', 'Rotate digging tasks'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 1, ppe: ['gloves'], prov: oshaDerived('c', 'No 1926 lifting standard; training duty.') },
    { id: 'sharp_edges', hazard: 'Cuts from sheet metal, hardware cloth and protruding nails while sealing openings', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves when cutting mesh and metal', 'Clear scrap with nails from the work area'], controls_es: PENDING_ES, osha_ref: '1926.28(a)', severity: 1, ppe: ['cut-resistant gloves', 'safety glasses'], prov: osha('c', '1926.28(a) appropriate PPE where hazards exist.') },
  ],
  qa_checklist: [
    { id: 'license_verified', item: 'Applicator holds a current state commercial applicator license certified for termite control (WI: ATCP 29.25 license, ATCP 29.31(14) category) and the firm holds a business license.', item_es: tr('El aplicador tiene licencia estatal vigente de aplicador comercial certificado en control de termitas (WI: licencia ATCP 29.25, categoría ATCP 29.31(14)) y la empresa tiene licencia de negocio.'), prov: wi() },
    { id: 'label_on_site', item: 'Product label and safety data sheet on site; product is labeled for subterranean termite pre-construction use.', item_es: PENDING_ES, safety: true, prov: label() },
    { id: 'crew_notified', item: 'Superintendent notified before application; workers cleared from the treated area until the product has absorbed.', item_es: PENDING_ES, safety: true, prov: prn() },
    { id: 'wells_located', item: 'Wells, cisterns, footing drains and sumps near the structure located and the label restrictions for them followed.', item_es: PENDING_ES, safety: true, prov: prn() },
    { id: 'soil_condition', item: 'Soil not saturated or frozen and no rain falling at the time of treatment.', item_es: tr('El suelo no está saturado ni congelado y no está lloviendo al momento del tratamiento.'), prov: prn() },
    { id: 'mix_per_label', item: 'Tank mix concentration and total volume match the label for the measured area.', item_es: tr('La concentración de la mezcla y el volumen total coinciden con la etiqueta para el área medida.'), prov: label() },
    { id: 'full_label_rate', item: 'Pretreat applied at no less than the label dosage and concentration over the whole slab area.', item_es: tr('El pretratamiento se aplicó con no menos de la dosis y concentración de la etiqueta en toda el área de la losa.'), prov: prn() },
    { id: 'penetrations_treated', item: 'Soil around every plumbing and conduit penetration and along interior footings treated.', item_es: tr('Se trató el suelo alrededor de cada penetración de plomería y tubería eléctrica y a lo largo de las zapatas interiores.'), prov: est('Common pretreat practice — penetrations are where termites enter through a slab.') },
    { id: 'perimeter_continuous', item: 'Vertical barrier along foundation walls, piers and pipes continuous, with rod spacing within the label limit.', item_es: tr('Barrera vertical continua a lo largo de muros de cimentación, pilares y tubos, con separación de varillas dentro del límite de la etiqueta.'), prov: prn() },
    { id: 'barrier_protected', item: 'Treated soil covered as the label requires if the pour is delayed; any later excavation through the barrier re-treated.', item_es: tr('Suelo tratado cubierto como lo exige la etiqueta si se retrasa el colado; cualquier excavación posterior a través de la barrera se vuelve a tratar.'), prov: prn('Retreatment allowed where the barrier is disrupted by construction or excavation.') },
    { id: 'record_completed', item: 'Application record completed the same day and kept at least 2 years (applicator, site, date and time, product, EPA reg. no., amount).', item_es: tr('Registro de aplicación completado el mismo día y guardado al menos 2 años (aplicador, sitio, fecha y hora, producto, número de registro EPA, cantidad).'), prov: wi('ATCP 29.21(1)–(2).') },
    { id: 'certificate_delivered', item: 'Customer information sheet and treatment certificate delivered to the builder, including the label post-application precautions.', item_es: tr('Hoja de información al cliente y certificado de tratamiento entregados al constructor, incluyendo las precauciones posteriores a la aplicación de la etiqueta.'), prov: wi('ATCP 29.22.') },
    { id: 'borate_coverage', item: 'Borate applied to dry wood on all required framing members before walls are closed in.', item_es: tr('Borato aplicado sobre madera seca en todos los elementos de estructura requeridos antes de cerrar los muros.'), prov: epa('EPA: borates commonly sprayed during new construction.') },
    { id: 'stations_mapped', item: 'Every bait or monitoring station set flush with grade at label spacing and shown on a site map.', item_es: tr('Cada estación de cebo o monitoreo colocada al ras del suelo con la separación de la etiqueta y marcada en un plano del sitio.'), prov: est('Bait-system installation practice; spacing comes from each system label.') },
    { id: 'openings_sealed', item: 'Openings sealed with metal mesh, sheet metal or mortar plus sealant; vents screened.', item_es: tr('Huecos sellados con malla metálica, lámina o mortero más sellador; ventilas con malla.'), prov: est('Rodent exclusion practice — soft sealants alone are chewed through.') },
  ],
  inspection_checklists: {
    pretreat_certificate: [
      { item: 'Certificate on file before the slab pour inspection or closing: product name, EPA reg. no., rate, area treated, date, applicator name and license number', item_es: tr('Certificado archivado antes de la inspección del colado o del cierre: nombre del producto, número de registro EPA, dosis, área tratada, fecha, nombre y número de licencia del aplicador') },
      { item: 'Treatment method matches what the code allows where the building official requires termite protection (soil termiticide, bait system, treated wood or physical barrier)', item_es: tr('El método de tratamiento coincide con lo que el código permite donde el funcionario de construcción exige protección contra termitas (termiticida en suelo, sistema de cebo, madera tratada o barrera física)'), ref: 'IRC R318.1' },
      { item: 'Soil treatment done per the termiticide label concentration, rate and method', item_es: tr('Tratamiento del suelo hecho según la concentración, dosis y método de la etiqueta del termiticida'), ref: 'IRC R318.1.1' },
    ],
    pre_pour_check: [
      { item: 'Treated area not disturbed after treatment; any cut-in trench re-treated', item_es: tr('Área tratada sin alterar después del tratamiento; cualquier zanja abierta después se volvió a tratar') },
      { item: 'Treated soil covered before rain when the pour is delayed, as the label directs', item_es: tr('Suelo tratado cubierto antes de la lluvia cuando se retrasa el colado, como indica la etiqueta') },
      { item: 'Workers kept off treated soil until absorbed', item_es: PENDING_ES },
    ],
    applicator_records: [
      { item: 'Application record completed the same day and kept 2 years', item_es: tr('Registro de aplicación completado el mismo día y guardado 2 años'), ref: 'Wis. Admin. Code ATCP 29.21' },
      { item: 'Customer information sheet given with label post-application precautions', item_es: tr('Hoja de información al cliente entregada con las precauciones posteriores a la aplicación de la etiqueta'), ref: 'Wis. Admin. Code ATCP 29.22' },
    ],
  },
  assemblies: [
    { code: 'G-PEST-SOIL-SF', name: 'Termite pretreat, liquid termiticide horizontal barrier under slab, per SF of slab', name_es: 'Pretratamiento contra termitas, barrera horizontal de termiticida líquido bajo losa, por pie cuadrado de losa', unit: 'SF', csi: '31 31 16',
      material_cost_cents: { v: 5, prov: est('diluted termiticide emulsion per SF at label volume, national baseline 2026') }, labor_hours_per_unit: { v: 0.001, prov: est('one technician treats ~1,000 SF of pad per hour including setup') },
      equipment_cost_cents: { v: 1, prov: est('treating rig, pump and hose reel allowance') }, waste_pct: { v: 5, prov: est('tank rinse and hose residue') } },
    { code: 'G-PEST-PERIM-LF', name: 'Termite vertical barrier, trench and rod along foundation, per LF', name_es: 'Barrera vertical contra termitas, zanja y varilla a lo largo de la cimentación, por pie lineal', unit: 'LF', csi: '31 31 16',
      material_cost_cents: { v: 40, prov: est('termiticide emulsion per LF of foundation at label volume, national baseline 2026') }, labor_hours_per_unit: { v: 0.03, prov: est('trenching, rodding and backfilling ~33 LF per hour') },
      equipment_cost_cents: { v: 2, prov: est('treating rig allowance') }, waste_pct: { v: 5, prov: est('tank rinse and hose residue') } },
    { code: 'G-PEST-BAIT-EA', name: 'Termite bait / monitoring station, in-ground, installed, each', name_es: 'Estación de cebo o monitoreo de termitas, enterrada, instalada, cada una', unit: 'EA', csi: '31 31 16',
      material_cost_cents: { v: 2500, prov: est('station housing + initial monitor or bait cartridge, national baseline 2026; ongoing service contract excluded') }, labor_hours_per_unit: { v: 0.25, prov: est('auger hole, set flush, map') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-PEST-BORATE-SF', name: 'Borate wood treatment, spray applied to exposed framing, per SF of floor area', name_es: 'Tratamiento de madera con borato, aplicado por aspersión a la estructura expuesta, por pie cuadrado de piso', unit: 'SF', csi: '06 05 73',
      material_cost_cents: { v: 4, prov: est('borate concentrate per SF of floor for sills, plates and lower studs, national baseline 2026') }, labor_hours_per_unit: { v: 0.002, prov: est('one technician sprays ~500 SF of floor area per hour') },
      equipment_cost_cents: { v: 0, prov: est('hand sprayer') }, waste_pct: { v: 10, prov: est('overspray') } },
    { code: 'G-PEST-EXCL-EA', name: 'Rodent exclusion, seal one penetration or gap with metal mesh and sealant, each', name_es: 'Exclusión de roedores, sellar una penetración o hueco con malla metálica y sellador, cada uno', unit: 'EA', csi: '10 81 00',
      material_cost_cents: { v: 300, prov: est('mesh, sealant or mortar per opening, national baseline 2026') }, labor_hours_per_unit: { v: 0.25, prov: est('cut, pack and seal one opening') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 10, prov: est('mesh offcuts') } },
    { code: 'G-PEST-MOB-EA', name: 'Termite treatment service call — mobilization, records and treatment certificate, each', name_es: 'Visita de servicio de tratamiento contra termitas — movilización, registros y certificado de tratamiento, cada una', unit: 'EA', csi: '31 31 16',
      material_cost_cents: { v: 0, prov: est('service only') }, labor_hours_per_unit: { v: 1.0, prov: est('travel, setup, records and certificate') },
      equipment_cost_cents: { v: 2500, prov: est('treating truck trip charge, national baseline 2026') }, waste_pct: { v: 0, prov: est('counted visits') } },
  ],
  quantity_rules: [
    { code: 'G-PEST-SOIL-SF', assumption: 'Slab pretreat ≈ 60% of total room area on a single-family home (ground-floor footprint; two-story houses smaller) — replace with the measured slab area', when: { building_types: ['residential_sf'] }, qty: { basis: 'area_sf_sum', mul: 0.6, round: 'ceil' } },
    { code: 'G-PEST-MOB-EA', assumption: 'One pretreat service call with certificate per single-family home', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 1 } },
  ],
  dependency_hints: [
    { after_trades: ['excavation'], note: 'Soil pretreat after excavation, under-slab fill and compaction; before the vapor retarder and slab pour.' },
  ],
});
