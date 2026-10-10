// Trade Knowledge Pack — spray_foam (Spray Polyurethane Foam insulation, open/closed cell). Wave 09 —
// NEW-TRADE pattern (no hand recipe; family `building`, gate `insulation`). The `insulation` pack owns the
// generic insulation assemblies (B-INSUL-SF, B-INS-*, incl. B-INS-RIM-LF) — this pack only adds SPF-specific
// assemblies (B-SPF-*) and adds NO quantity rules, so the hand-seeded B-INSUL-SF line is never double-counted.
// Dossier: docs/trade-packs/dossiers/spray_foam.md. Sources: ACC Center for the Polyurethanes Industry (CPI)
// public SPF guidance, EPA Safer Choice SPF pages (archived), NIOSH 96-111, OSHA isocyanates topic,
// 29 CFR 1926 (C, D, E, F, K, L, M, X, AA) + 1910.134 via 1926.103, IRC R316 / R806.5 / N1101.10 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const cpi = { src: ['spray_foam-cpi-health-safety'], confidence: 'verified' as const, last_verified: D };
const cpiBasics = { src: ['spray_foam-cpi-basics'], confidence: 'verified' as const, last_verified: D };
const epa = { src: ['concrete_repair_lifting-epa-spf-health', 'concrete_repair_lifting-epa-spf-tips'], confidence: 'verified' as const, last_verified: D };
const mfr = { src: ['spray_foam-cpi-health-safety', 'spray_foam-cpi-basics'], confidence: 'derived' as const, last_verified: D, note: 'Limits (substrate/ambient temperature, lift thickness, ratio, reentry time) come from the product data sheet of the foam installed.' };
const irc = (note?: string) => ({ src: ['icc-pa'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });

export default definePack({
  key: 'spray_foam',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Spray polyurethane foam (SPF) insulation — two-component open-cell and closed-cell foam sprayed into walls, roof decks, rim joists and crawlspaces to insulate and air seal, including site isolation, ventilation, rig setup, lift control and the thermal/ignition barrier that must cover it.',
    summary_es: 'Aislamiento de espuma de poliuretano en aerosol (SPF) — espuma de dos componentes de celda abierta y celda cerrada aplicada en muros, cubiertas de techo, vigas perimetrales y espacios bajo piso para aislar y sellar el aire, incluyendo aislamiento del área, ventilación, preparación del equipo, control de capas y la barrera térmica o de ignición que debe cubrirla.',
    glossary: [
      { term: 'A-side / B-side', term_es: 'Lado A / Lado B', def: 'The two liquid components: A-side is the isocyanate (MDI), B-side is the polyol resin blend. They react into foam at the gun.', def_es: 'Los dos componentes líquidos: el lado A es el isocianato (MDI), el lado B es la mezcla de resina poliol. Reaccionan y forman espuma en la pistola.' },
      { term: 'Closed-cell foam (ccSPF)', term_es: 'Espuma de celda cerrada (ccSPF)', def: 'Dense, rigid foam (about 2 lb/ft³) with high R-value per inch that also slows vapor; used where space is tight or at rim joists.', def_es: 'Espuma rígida y densa (unas 2 lb/pie³) con alto valor R por pulgada que también frena el vapor; se usa donde falta espacio o en vigas perimetrales.' },
      { term: 'Open-cell foam (ocSPF)', term_es: 'Espuma de celda abierta (ocSPF)', def: 'Light, soft foam (about 0.5 lb/ft³) that fills cavities and seals air but lets vapor pass; lower R-value per inch.', def_es: 'Espuma ligera y blanda (unas 0.5 lb/pie³) que llena cavidades y sella el aire pero deja pasar el vapor; menor valor R por pulgada.' },
      { term: 'Lift (pass)', term_es: 'Capa (pasada)', def: 'One layer of foam sprayed in a single pass. Too thick a lift can overheat, scorch or even ignite.', def_es: 'Una capa de espuma aplicada en una sola pasada. Una capa demasiado gruesa puede sobrecalentarse, quemarse o incluso encenderse.' },
      { term: 'Ratio / off-ratio', term_es: 'Proporción / fuera de proporción', def: 'A and B must mix at the maker’s ratio (usually 1:1 by volume). Off-ratio foam is discolored, brittle or sticky and must be removed.', def_es: 'A y B deben mezclarse en la proporción del fabricante (normalmente 1:1 por volumen). La espuma fuera de proporción queda descolorida, quebradiza o pegajosa y se debe quitar.' },
      { term: 'Proportioner (rig)', term_es: 'Dosificador (equipo)', def: 'Heated pump unit, usually in a trailer, that meters A and B through heated hoses to the spray gun.', def_es: 'Unidad de bombeo con calentador, normalmente en un remolque, que dosifica A y B por mangueras calentadas hasta la pistola.' },
      { term: 'Thermal barrier', term_es: 'Barrera térmica', def: 'Covering such as 1/2 in. gypsum board that separates foam from living space so it does not feed an early fire.', def_es: 'Cubierta como placa de yeso de 1/2 pulg. que separa la espuma del espacio habitable para que no alimente un incendio temprano.' },
      { term: 'Ignition barrier', term_es: 'Barrera de ignición', def: 'Lighter covering or listed coating allowed over foam in attics and crawlspaces entered only for service.', def_es: 'Cubierta más ligera o recubrimiento aprobado que se permite sobre la espuma en áticos y espacios bajo piso a los que solo se entra para servicio.' },
      { term: 'Reentry / reoccupancy time', term_es: 'Tiempo de reingreso / reocupación', def: 'Time after spraying before workers may enter without respirators (reentry) and before residents may return (reoccupancy), set by the supplier.', def_es: 'Tiempo después de aplicar antes de que los trabajadores entren sin respirador (reingreso) y de que los residentes regresen (reocupación), según el proveedor.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'spf_cavity_and_deck',
      example_title: 'Spray foam insulation — exterior walls and roof deck',
      when: { title_re: 'spray[- ]?foam|\\bSPF\\b|closed[- ]cell|open[- ]cell|spray(?:ed)?[- ]polyurethane' },
      steps: [
        {
          title: 'Check rough-ins and the substrate',
          instruction: 'Confirm framing, electrical, plumbing and HVAC rough-in inspections have passed. Check that studs, sheathing and roof deck are clean, dry and frost-free, and that substrate and air temperatures are inside the product data sheet range. Confirm foam type (open or closed cell) and target thickness for each area against the plan or energy report.',
          detail: 'Wet wood or cold sheathing is the most common cause of poor adhesion and pull-away. Use a moisture meter and a surface thermometer, not a guess.',
          tools: ['moisture meter', 'infrared thermometer', 'tape measure', 'flashlight'],
          materials: ['product data sheet and SDS for both A and B side'],
          safety_ids: ['chem_hazcom', 'fall_ceiling', 'ladder'],
          qa_ids: ['rough_ins_passed', 'substrate_dry_temp', 'type_thickness_plan'],
        },
        {
          title: 'Isolate the area and set up ventilation',
          instruction: 'Clear occupants and other trades out of the spray zone and post warning signs at every entry. Shut off the HVAC and seal supply and return openings. Set exhaust fans to pull air from the spray zone to the outdoors, away from intakes and neighbors. Mask windows, doors, floors, electrical boxes and anything the foam should not touch. Write down the supplier’s reentry and reoccupancy times and tell the GC and owner.',
          tools: ['exhaust fans with ducting', 'poly sheeting', 'masking tape', 'warning signs'],
          materials: ['plastic sheeting', 'masking paper', 'tape', 'cardboard covers for boxes'],
          safety_ids: ['isocyanate_inhal', 'ventilation_limits', 'confined_attic'],
          qa_ids: ['zone_isolated', 'reentry_plan', 'masking_done'],
        },
        {
          title: 'Set up the rig and check the mix',
          instruction: 'Inspect drums, hoses and gun before starting. Bring A and B drums, primary heaters and hose heat to the data-sheet temperatures and pressures; recirculate or mix the B side as the maker directs. Spray a test shot on cardboard or scrap and check color, cell structure, rise, tack and adhesion. Fix any off-ratio foam before spraying the building.',
          tools: ['spray foam proportioner with heated hose', 'spray gun', 'drum thermometers', 'pressure gauges'],
          materials: ['A-side (isocyanate) and B-side (resin) drums', 'gun cleaner / grease'],
          safety_ids: ['isocyanate_inhal', 'skin_eye_contact', 'rig_electrical', 'chem_hazcom'],
          qa_ids: ['test_shot_ok'],
        },
        {
          title: 'Spray in controlled lifts to thickness',
          instruction: 'Spray from the bottom up in even passes, never thicker per lift than the data sheet allows; let each lift cool before the next. Seal top plates, rim and penetrations as you go. Keep foam out of electrical boxes and off recessed lights, flues and other heat sources unless they are rated for contact. Check thickness often with a depth gauge so the R-value on the plan is met everywhere.',
          detail: 'Closed-cell lifts are usually limited to about 2 in.; over-thick lifts build heat that can scorch the core or catch fire hours later. Check the product limit before every job.',
          tools: ['spray gun', 'depth probe', 'tape measure'],
          materials: ['open- or closed-cell SPF per plan'],
          safety_ids: ['isocyanate_inhal', 'skin_eye_contact', 'foam_fire', 'scaffold_fall', 'heat_stress'],
          qa_ids: ['lift_limit', 'thickness_min', 'adhesion_no_voids', 'boxes_flues_clear'],
        },
        {
          title: 'Trim, clean up and post the certificate',
          instruction: 'After the foam has cured, trim excess flush with framing where drywall will go and bag the scraps. Ventilate until the reentry time has passed before others come back in. Remove masking, then post the insulation certificate with foam type, installed thickness and R-value, and leave the work open for the insulation inspection.',
          tools: ['foam trim saw or scraper', 'shop vacuum', 'depth probe'],
          materials: ['contractor bags'],
          safety_ids: ['isocyanate_inhal', 'eye_debris', 'ventilation_limits'],
          qa_ids: ['trimmed_flush', 'certificate_posted', 'reentry_kept'],
          gating_inspection_type: 'insulation',
          code_refs: [
            { section: 'N1101.10.1', code_type: 'IRC', note: 'Insulation certificate or marking with type, thickness and R-value' },
            { section: 'R316.3', code_type: 'IRC', note: 'Foam plastic surface-burning characteristics limits' },
          ],
        },
        {
          title: 'Cover the foam with a thermal or ignition barrier',
          instruction: 'In living spaces, keep the foam open only until it is covered by 1/2 in. gypsum board or another approved thermal barrier. In attics and crawlspaces entered only for service, apply the ignition barrier the code or the foam’s evaluation report allows, such as a listed intumescent coating at the specified thickness. Leave no exposed foam unless the product is listed for it.',
          tools: ['airless sprayer (coating)', 'wet-film thickness gauge'],
          materials: ['listed ignition-barrier coating or gypsum board per evaluation report'],
          safety_ids: ['chem_hazcom', 'fall_ceiling', 'ladder'],
          qa_ids: ['barrier_covered'],
          gating_inspection_type: 'final',
          code_refs: [
            { section: 'R316.4', code_type: 'IRC', note: 'Thermal barrier between foam plastic and the interior' },
            { section: 'R316.5.3', code_type: 'IRC', note: 'Attics — ignition barrier option over foam' },
            { section: 'R316.5.4', code_type: 'IRC', note: 'Crawl spaces — ignition barrier option over foam' },
          ],
        },
      ],
    },
    {
      id: 'spf_rim_joist',
      example_title: 'Spray foam rim joists — closed cell',
      when: { title_re: '(?:rim|band)[- ]?joists?[^.]*(?:spray|foam|SPF)|(?:spray|foam|SPF)[^.]*(?:rim|band)[- ]?joists?' },
      priority: 10,
      steps: [
        {
          title: 'Prep the rim and sill area',
          instruction: 'Clean dust and debris from the rim, sill plate and subfloor edge. Check the wood is dry and above the minimum temperature on the data sheet. Mask the basement wall top, wiring and pipes near the bays, and set exhaust to the outdoors.',
          tools: ['shop vacuum', 'moisture meter', 'infrared thermometer', 'exhaust fan'],
          materials: ['masking tape', 'plastic sheeting'],
          safety_ids: ['ventilation_limits', 'chem_hazcom', 'ladder'],
          qa_ids: ['substrate_dry_temp', 'zone_isolated'],
        },
        {
          title: 'Spray closed-cell foam into each bay',
          instruction: 'Spray closed-cell foam to the planned thickness in each joist bay, sealing the rim to the sill, the sill to the foundation and the subfloor edge in one continuous layer. Keep within the per-lift limit and stay at or under the thickness the code allows uncovered at rim joists.',
          tools: ['spray gun', 'depth probe'],
          materials: ['closed-cell SPF'],
          safety_ids: ['isocyanate_inhal', 'skin_eye_contact', 'foam_fire'],
          qa_ids: ['lift_limit', 'thickness_min', 'adhesion_no_voids'],
          code_refs: [{ section: 'R316.5.11', code_type: 'IRC', note: 'Foam at sill plates and headers — limits for leaving it uncovered' }],
        },
        {
          title: 'Verify, label and leave for inspection',
          instruction: 'Probe thickness in several bays, confirm no gaps at corners or around penetrations, and post the certificate. Cover the foam if it is thicker than the uncovered limit or the product requires it.',
          tools: ['depth probe', 'flashlight'],
          materials: [],
          safety_ids: ['eye_debris'],
          qa_ids: ['certificate_posted', 'barrier_covered'],
          gating_inspection_type: 'insulation',
        },
      ],
    },
  ],
  code_refs: {
    insulation: [
      { section: 'N1101.10.1', code_type: 'IRC', note: 'Insulation certificate or marking lists type, installed thickness and R-value', prov: irc('IRC Chapter 11 mirrors IECC R303.1; numbering per 2021 IRC — check adopted edition.') },
      { section: 'N1101.10.1.1', code_type: 'IRC', note: 'Sprayed roof/ceiling insulation — installed thickness verifiable', prov: irc('Mirrors IECC R303.1.1.1; numbering per 2021 IRC.') },
      { section: 'R316.3', code_type: 'IRC', note: 'Foam plastic surface-burning characteristics limits', prov: irc() },
      { section: 'R316.5.11', code_type: 'IRC', note: 'Foam at sill plates and headers may stay uncovered within size limits', prov: irc('2021 IRC numbering; thickness/density limits in the code text — not reproduced.') },
      { section: 'R806.5', code_type: 'IRC', note: 'Unvented attic assemblies — air-impermeable insulation at the roof deck', prov: irc() },
      { section: 'R702.7', code_type: 'IRC', note: 'Vapor retarders — class and placement by climate zone', prov: irc() },
      { section: '2603.4', code_type: 'IBC', note: 'Commercial: thermal barrier between foam plastic and the interior', prov: irc() },
    ],
    final: [
      { section: 'R316.4', code_type: 'IRC', note: 'Thermal barrier between foam plastic and the interior', prov: irc() },
      { section: 'R316.5.3', code_type: 'IRC', note: 'Attics — ignition barrier option over foam plastic', prov: irc('2021 IRC numbering; check adopted edition.') },
      { section: 'R316.5.4', code_type: 'IRC', note: 'Crawl spaces — ignition barrier option over foam plastic', prov: irc('2021 IRC numbering; check adopted edition.') },
      { section: '2603.4.1.6', code_type: 'IBC', note: 'Commercial attics and crawl spaces — ignition barrier option', prov: irc('Check adopted IBC edition numbering.') },
    ],
  },
  equipment: [
    { when: { title_re: 'spray[- ]?foam|\\bSPF\\b|closed[- ]cell|open[- ]cell|polyurethane' }, type: 'generator', reason: 'Power the trailer-mounted proportioner, heaters and hose heat where site power is not enough', optional: true },
    { when: { title_re: 'spray[- ]?foam|\\bSPF\\b|closed[- ]cell|open[- ]cell|polyurethane' }, type: 'air_compressor', reason: 'Gun purge air, drum transfer pumps and supplied-air respirators', optional: true },
    { when: { title_re: 'spray[- ]?foam|\\bSPF\\b|closed[- ]cell|open[- ]cell|polyurethane', building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'scissor_lift', reason: 'Reach high walls and roof decks evenly for consistent lift thickness', optional: true },
  ],
  hazards: [
    { id: 'isocyanate_inhal', hazard: 'Breathing isocyanate (MDI) mist and vapor during and after spraying — can cause asthma, sensitization and lung damage', hazard_es: PENDING_ES, controls: ['Sprayers and helpers wear supplied-air (or the respirator the SDS and exposure assessment require) inside the spray zone', 'Respirator users are medically cleared and fit-tested under a written program', 'Nobody enters without respiratory protection until the reentry time has passed'], controls_es: PENDING_ES, osha_ref: '1926.103', severity: 4, ppe: ['supplied-air or full-face respirator per SDS'], prov: { src: ['ecfr-1926-e', 'spray_foam-ecfr-1910-134', 'concrete_repair_lifting-niosh-96-111', 'concrete_repair_lifting-osha-isocyanates'], confidence: 'verified', last_verified: D } },
    { id: 'ventilation_limits', hazard: 'Chemical vapor building up in the spray zone or drifting into occupied areas, intakes or neighbors', hazard_es: PENDING_ES, controls: ['Run exhaust ventilation from the spray zone to the outdoors during spraying and through the reentry period', 'Shut off and seal HVAC so vapor is not spread through the building'], controls_es: PENDING_ES, osha_ref: '1926.57(a)', severity: 3, prov: { src: ['ecfr-1926-d', 'spray_foam-cpi-health-safety'], confidence: 'verified', last_verified: D } },
    { id: 'skin_eye_contact', hazard: 'Skin and eye contact with A-side, B-side or uncured foam — burns, rash and sensitization', hazard_es: PENDING_ES, controls: ['Wear chemical-resistant gloves and full-body disposable coveralls with hood', 'Full-face respirator or goggles; keep an eyewash station at the rig'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['nitrile gloves', 'disposable coveralls with hood'], prov: { src: ['ecfr-1926-e', 'concrete_repair_lifting-epa-spf-health'], confidence: 'verified', last_verified: D } },
    { id: 'chem_hazcom', hazard: 'Working with SPF chemicals, solvents and coatings without knowing their hazards', hazard_es: PENDING_ES, controls: ['Keep the SDS for both A and B side and any coating on site; train the crew on them', 'Keep drums labeled and closed'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, prov: osha('d') },
    { id: 'eye_debris', hazard: 'Eye injury from foam dust and chips while trimming or cleaning up', hazard_es: PENDING_ES, controls: ['Wear safety glasses or goggles when trimming and scraping foam'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety goggles'], prov: osha('e') },
    { id: 'foam_fire', hazard: 'Fire from over-thick lifts overheating, uncovered foam near heat, or sparks and flame near the spray zone', hazard_es: PENDING_ES, controls: ['Never exceed the data-sheet lift thickness; let lifts cool before the next pass', 'No smoking, welding or open flame near spraying or exposed foam; keep a fire extinguisher at the rig'], controls_es: PENDING_ES, osha_ref: '1926.151(a)(3)', severity: 4, prov: { src: ['ecfr-1926-f', 'spray_foam-cpi-basics'], confidence: 'verified', last_verified: D } },
    { id: 'rig_electrical', hazard: 'Electric shock from the proportioner, heated hoses, generator and extension cords', hazard_es: PENDING_ES, controls: ['GFCI protection on temporary receptacles; inspect cords and hose-heat wiring daily', 'Lock out the rig before servicing heaters or pumps'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'fall_ceiling', hazard: 'Falling through a ceiling between attic joists or trusses while spraying or coating', hazard_es: PENDING_ES, controls: ['Walk only on framing or walk boards', 'Light the attic so the framing is visible'], controls_es: PENDING_ES, osha_ref: '1926.501(a)(2)', severity: 3, prov: osha('m') },
    { id: 'scaffold_fall', hazard: 'Fall from scaffold or lift while spraying high walls and roof decks', hazard_es: PENDING_ES, controls: ['Guardrails or personal fall arrest on scaffolds over 10 ft', 'Keep hoses managed so they cannot pull a worker off the platform'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'ladder', hazard: 'Ladder slip while spraying or masking', hazard_es: PENDING_ES, controls: ['Set ladders on firm footing and keep three points of contact', 'Do not drag hoses up a ladder by hand — stage them first'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'confined_attic', hazard: 'Spraying in tight attics or crawlspaces with poor air and a hard exit', hazard_es: PENDING_ES, controls: ['Have a competent person evaluate the space before entry', 'Keep supplied air, the exit path and a second person outside'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 4, prov: osha('aa') },
    { id: 'heat_stress', hazard: 'Heat stress inside coveralls and hoods in hot attics and buildings', hazard_es: PENDING_ES, controls: ['Schedule hot areas for cooler hours; rotate sprayers and take water breaks', 'Train the crew to recognize heat illness'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'rough_ins_passed', phase: 'insulation', item: 'Framing and MEP rough-in inspections passed before any foam is sprayed.', item_es: { status: 'translated', text: 'Las inspecciones de estructura e instalaciones (MEP) aprobadas antes de aplicar cualquier espuma.' }, prov: irc('Inspection sequence: insulation follows rough-in approvals.') },
    { id: 'substrate_dry_temp', phase: 'insulation', item: 'Substrate clean, dry and frost-free; wood moisture and surface/air temperatures within the product data sheet limits and recorded.', item_es: { status: 'translated', text: 'Sustrato limpio, seco y sin escarcha; humedad de la madera y temperaturas de superficie y aire dentro de los límites de la ficha técnica y registradas.' }, prov: mfr },
    { id: 'type_thickness_plan', phase: 'insulation', item: 'Foam type (open or closed cell) and target thickness for each area match the plan or energy compliance report.', item_es: { status: 'translated', text: 'Tipo de espuma (celda abierta o cerrada) y espesor objetivo de cada área coinciden con el plano o el reporte energético.' }, prov: cpiBasics },
    { id: 'zone_isolated', phase: 'insulation', item: 'Spray zone cleared of occupants and other trades, signs posted, HVAC off and sealed, exhaust running to the outdoors.', item_es: PENDING_ES, safety: true, prov: cpi },
    { id: 'reentry_plan', phase: 'insulation', item: 'Supplier reentry and reoccupancy times written down and given to the GC/owner before spraying.', item_es: PENDING_ES, safety: true, prov: cpi },
    { id: 'masking_done', phase: 'insulation', item: 'Windows, doors, floors, electrical boxes and finished surfaces masked before spraying.', item_es: { status: 'translated', text: 'Ventanas, puertas, pisos, cajas eléctricas y superficies terminadas cubiertas antes de aplicar.' }, prov: mfr },
    { id: 'test_shot_ok', phase: 'insulation', item: 'Test shot sprayed at start-up and after each drum change: uniform color, fine cells, normal rise, good adhesion — no off-ratio foam.', item_es: { status: 'translated', text: 'Disparo de prueba al iniciar y en cada cambio de tambor: color uniforme, celdas finas, expansión normal, buena adherencia — sin espuma fuera de proporción.' }, prov: mfr },
    { id: 'lift_limit', phase: 'insulation', item: 'No single lift thicker than the data-sheet maximum; each lift cooled before the next.', item_es: PENDING_ES, safety: true, prov: mfr },
    { id: 'thickness_min', phase: 'insulation', item: 'Installed thickness probed in several places per area; minimum meets the R-value on the plan everywhere.', item_es: { status: 'translated', text: 'Espesor instalado medido en varios puntos por área; el mínimo cumple el valor R del plano en todas partes.' }, prov: irc('Installed thickness / R-value certificate per N1101.10.1.') },
    { id: 'adhesion_no_voids', phase: 'insulation', item: 'Foam fully bonded to studs, plates and sheathing with no pull-away, voids, gaps at corners or unsealed penetrations.', item_es: { status: 'translated', text: 'Espuma totalmente adherida a montantes, placas y entablado, sin desprendimientos, vacíos, huecos en esquinas ni pasos sin sellar.' }, prov: cpiBasics },
    { id: 'boxes_flues_clear', phase: 'insulation', item: 'Foam kept out of electrical boxes and off non-IC recessed lights, flues and heat sources, with the clearances the listings require.', item_es: PENDING_ES, safety: true, prov: mfr },
    { id: 'trimmed_flush', phase: 'insulation', item: 'Foam trimmed flush with framing where drywall or finishes go; scraps bagged and removed.', item_es: { status: 'translated', text: 'Espuma recortada al ras de la estructura donde va el panel de yeso o acabados; recortes embolsados y retirados.' }, prov: mfr },
    { id: 'certificate_posted', phase: 'insulation', item: 'Insulation certificate posted with foam type, installed thickness and R-value for each area.', item_es: { status: 'translated', text: 'Certificado de aislamiento colocado con tipo de espuma, espesor instalado y valor R de cada área.' }, prov: irc('N1101.10.1') },
    { id: 'reentry_kept', phase: 'insulation', item: 'Nobody re-entered without respiratory protection before the reentry time; occupants stayed out until reoccupancy time.', item_es: PENDING_ES, safety: true, prov: epa },
    { id: 'barrier_covered', phase: 'drywall', item: 'All foam covered by an approved thermal barrier in living spaces or an ignition barrier in service-only attics and crawlspaces, unless listed for exposed use.', item_es: PENDING_ES, safety: true, prov: irc('IRC R316.4 / R316.5 — paraphrased.') },
  ],
  inspection_checklists: {
    insulation: [
      { item: 'Insulation certificate posted with foam type, thickness and R-value', item_es: PENDING_ES, ref: 'N1101.10.1' },
      { item: 'Thickness meets the plan R-value at random probe points', item_es: PENDING_ES, ref: 'N1101.10.1.1' },
      { item: 'Foam continuous at top plates, rim joists and penetrations; no voids or pull-away', item_es: PENDING_ES },
      { item: 'Foam product label / evaluation report on site (surface-burning characteristics)', item_es: PENDING_ES, ref: 'R316.3' },
      { item: 'Unvented attic: air-impermeable foam at the roof deck per the approved design', item_es: PENDING_ES, ref: 'R806.5' },
    ],
    final: [
      { item: 'No exposed foam in living spaces — thermal barrier installed', item_es: PENDING_ES, ref: 'R316.4' },
      { item: 'Attic and crawlspace foam covered by an ignition barrier or listed coating at the specified thickness', item_es: PENDING_ES, ref: 'R316.5.3' },
    ],
  },
  assemblies: [
    { code: 'B-SPF-CC-BF', name: 'Closed-cell spray foam (~2 lb), per board foot (1 SF × 1 in.)', name_es: 'Espuma en aerosol de celda cerrada (~2 lb), por pie tablar (1 pie² × 1 pulg.)', unit: 'BF', csi: '07 21 19',
      description: 'Board foot = SF × inches of thickness. Use for walls, roof decks, crawlspace walls; not with B-INSUL-SF on the same area.',
      material_cost_cents: { v: 60, prov: est('closed-cell chemical set cost per board foot (yield-based), national baseline 2026') }, labor_hours_per_unit: { v: 0.004, prov: est('2-person crew ≈ 500 BF/hr sprayed incl. setup; per-person-hour basis') },
      equipment_cost_cents: { v: 6, prov: est('proportioner rig, hoses, generator day-rate share per BF') }, waste_pct: { v: 10, prov: est('trim-off and overspray') } },
    { code: 'B-SPF-OC-SF', name: 'Open-cell spray foam (~0.5 lb), ~5.5 in. full cavity or roof deck, per SF', name_es: 'Espuma en aerosol de celda abierta (~0.5 lb), ~5.5 pulg. cavidad completa o cubierta, por pie²', unit: 'SF', csi: '07 21 19',
      description: 'Per SF of surface sprayed. Use instead of B-INSUL-SF on the same area.',
      material_cost_cents: { v: 85, prov: est('open-cell chemical ≈ 5.5 board feet per SF, national baseline 2026') }, labor_hours_per_unit: { v: 0.008, prov: est('spray + trim flush per SF, 2-person crew') },
      equipment_cost_cents: { v: 5, prov: est('rig day-rate share per SF') }, waste_pct: { v: 15, prov: est('open-cell trim-off is heavy in stud cavities') } },
    { code: 'B-SPF-IGN-COAT-SF', name: 'Ignition-barrier intumescent coating over spray foam (attic/crawlspace), per SF', name_es: 'Recubrimiento intumescente de barrera de ignición sobre espuma (ático/espacio bajo piso), por pie²', unit: 'SF', csi: '07 81 00',
      material_cost_cents: { v: 45, prov: est('listed intumescent coating at evaluation-report thickness, 2026') }, labor_hours_per_unit: { v: 0.005, prov: est('airless spray one coat incl. wet-film checks') },
      equipment_cost_cents: { v: 2, prov: est('airless sprayer share') }, waste_pct: { v: 10, prov: est('overspray') } },
    { code: 'B-SPF-PREP-EA', name: 'SPF job setup — masking, zone isolation, exhaust ventilation and cleanup, per mobilization', name_es: 'Preparación de trabajo SPF — enmascarado, aislamiento del área, ventilación de extracción y limpieza, por movilización', unit: 'EA', csi: '07 21 19',
      material_cost_cents: { v: 15000, prov: est('poly sheeting, masking paper, tape, signs, bags per dwelling-size job') }, labor_hours_per_unit: { v: 4, prov: est('mask, set fans/ducting, isolate HVAC, demob and clean') },
      equipment_cost_cents: { v: 5000, prov: est('exhaust fan and ducting rental share') }, waste_pct: { v: 0, prov: est('consumables priced as used') } },
  ],
  dependency_hints: [
    { after_trades: ['electrical', 'plumbing', 'hvac', 'framing'], before_phase: 'drywall', note: 'Spray foam goes in after framing and MEP rough-in inspections, and before drywall so the thermal barrier can cover it.' },
  ],
});
