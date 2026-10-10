// Trade Knowledge Pack — abatement (Abatement (Asbestos / Lead / Mold)). Wave 05 — NEW-TRADE pattern
// (no hand recipe). Dossier: docs/trade-packs/dossiers/abatement.md. Sources: 29 CFR 1926.1101 (asbestos)
// + 1926.62 (lead) + 1926 Subparts C/D/E/K/X, 40 CFR 61 Subpart M (asbestos NESHAP), 40 CFR 745 Subpart L
// (lead abatement — distinct from Subpart E RRP), EPA mold remediation guidance, Wisconsin DHS 159
// (asbestos) / DHS 163 (lead) certification + notification, WI DNR NR 447 / ARDN (NESHAP delegate).
//
// Abatement clearance is regulated by state/federal health and environmental agencies, NOT the building
// AHJ — so recipes carry no gating inspections or code refs; hold points live in inspection_checklists
// under descriptive keys.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const neshap = { src: ['abatement-ecfr-40-61m', 'abatement-epa-asbestos-neshap'], confidence: 'verified' as const, last_verified: D };
const leadEpa = { src: ['abatement-ecfr-40-745l', 'abatement-epa-lead-abatement'], confidence: 'verified' as const, last_verified: D };
const mold = { src: ['abatement-epa-mold-commercial', 'abatement-epa-mold-home'], confidence: 'verified' as const, last_verified: D };
const wiAsb = { src: ['abatement-wi-dhs159', 'abatement-wi-dhs-asbestos', 'abatement-wi-dnr-asbestos'], confidence: 'verified' as const, last_verified: D };
const wiLead = { src: ['abatement-wi-dhs163', 'abatement-wi-dhs-lead'], confidence: 'verified' as const, last_verified: D };
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'abatement',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Removes or controls regulated hazardous materials before and during renovation or demolition — asbestos, lead-based paint abatement (not routine lead-safe renovation) and mold — in sealed negative-pressure work areas, with certified crews, agency notices, licensed waste disposal and independent clearance before re-occupancy.',
    summary_es: 'Retira o controla materiales peligrosos regulados antes y durante una remodelación o demolición — asbesto, eliminación de pintura con plomo (no la renovación rutinaria) y moho — en áreas selladas con presión negativa, con cuadrillas certificadas, avisos a las agencias, disposición autorizada de residuos y liberación independiente antes de volver a ocupar.',
    glossary: [
      { term: 'ACM / PACM', term_es: 'MCA / MCAP', def: 'Asbestos-containing material (over 1% asbestos) / presumed ACM — old pipe insulation, sprayed and troweled surfacing treated as asbestos until tested.', def_es: 'Material que contiene asbesto (más de 1 %) / material que se presume que lo contiene hasta que se analice.' },
      { term: 'RACM (friable)', term_es: 'MCA regulado (friable)', def: 'Asbestos material that crumbles by hand pressure, or will once it is cut, sanded or broken — the trigger for NESHAP notification and wetting.', def_es: 'Material con asbesto que se desmorona con la mano, o lo hará al cortarlo, lijarlo o romperlo; activa el aviso NESHAP y el humedecimiento.' },
      { term: 'Regulated area', term_es: 'Área regulada', def: 'Marked-off work area where asbestos or lead work happens; only trained, authorized people with respirators go in.', def_es: 'Área de trabajo delimitada donde se trabaja con asbesto o plomo; solo entra personal capacitado y autorizado con respirador.' },
      { term: 'Negative pressure enclosure (NPE)', term_es: 'Encierro a presión negativa', def: 'Sealed poly enclosure kept below room pressure by HEPA air machines so air leaks in, not out.', def_es: 'Encierro sellado de plástico mantenido a menor presión que el cuarto con extractores HEPA, para que el aire entre y no salga.' },
      { term: 'Critical barrier', term_es: 'Barrera crítica', def: 'Plastic sealed over every opening into the work area — doors, vents, outlets — so dust cannot migrate.', def_es: 'Plástico sellado sobre cada abertura del área de trabajo — puertas, rejillas, contactos — para que el polvo no escape.' },
      { term: 'Decontamination unit', term_es: 'Unidad de descontaminación', def: 'Equipment room, shower and clean room attached to the work area where workers and gear are cleaned on the way out.', def_es: 'Cuarto de equipo, regadera y cuarto limpio conectados al área donde se limpia al personal y al equipo al salir.' },
      { term: 'Glovebag', term_es: 'Bolsa de guantes', def: 'Single-use clear plastic bag with built-in sleeves sealed around a pipe to strip insulation without opening the area.', def_es: 'Bolsa de plástico transparente de un solo uso con mangas integradas que se sella alrededor de la tubería para quitar el aislamiento.' },
      { term: 'Amended water', term_es: 'Agua enmendada', def: 'Water with a surfactant added so it soaks into asbestos material and keeps fibers down.', def_es: 'Agua con surfactante para que penetre el material con asbesto y mantenga las fibras abajo.' },
      { term: 'Clearance testing', term_es: 'Prueba de liberación', def: 'Visual check plus air samples (asbestos) or dust wipes (lead) by an independent party before plastic comes down and people return.', def_es: 'Revisión visual más muestras de aire (asbesto) o de polvo (plomo) por un tercero independiente antes de quitar el plástico y volver a ocupar.' },
      { term: 'Waste shipment record', term_es: 'Manifiesto de residuos', def: 'Paperwork that follows asbestos waste from the job to the approved landfill and comes back signed.', def_es: 'Documento que acompaña los residuos de asbesto desde la obra hasta el relleno autorizado y regresa firmado.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'asbestos_abatement',
      example_title: 'Asbestos abatement — pipe insulation, floor tile and popcorn ceiling',
      when: { title_re: '\\basbestos\\b|\\bACM\\b|\\bTSI\\b|popcorn ceiling|acoustic(?:al)? ceiling texture|\\bvermiculite\\b' },
      priority: 10,
      steps: [
        {
          title: 'Confirm the survey, notices and crew papers',
          instruction: 'Before anyone disturbs material, have the asbestos survey by a certified inspector on site: which materials are ACM, where, and how much. File the state abatement notice (Wisconsin: DHS before set-up; DNR through ARDN when the NESHAP threshold or a demolition applies) and wait out the required lead time. Check that the company and every worker and supervisor hold current certifications, fit tests and medical clearance.',
          detail: 'NESHAP notice is due at least 10 working days ahead once friable (RACM) amounts reach 260 LF on pipes, 160 SF on other components or 35 CF; a demolition needs notice regardless of amount.',
          tools: ['clipboard or tablet'],
          materials: ['asbestos survey report', 'notification copies', 'certification cards', 'fit-test records'],
          safety_ids: ['asbestos_inhalation'],
          qa_ids: ['survey_before_disturbance', 'notifications_filed', 'certs_fit_tests_on_file'],
        },
        {
          title: 'Set the regulated area and containment',
          instruction: 'Post warning signs and limit entry to the regulated area. Shut off and seal HVAC. Seal critical barriers over every door, vent and opening, cover floors and walls with plastic, and attach the decontamination unit. For pipe insulation and ceiling texture (Class I), build a negative pressure enclosure: start HEPA air machines, confirm the enclosure stays negative on a manometer, smoke-test for leaks and lock out or GFCI-protect circuits inside.',
          detail: 'Read and log the manometer at start of every shift and during work. Small pipe runs may use glovebags instead — each bag sealed around the pipe, smoke-tested and used once.',
          tools: ['HEPA negative air machines', 'manometer', 'smoke tubes', 'spray adhesive', 'stapler'],
          materials: ['6-mil poly sheeting', 'duct tape', 'warning signs and barrier tape', 'decon unit', 'glovebags if used'],
          safety_ids: ['asbestos_inhalation', 'electric_shock_wet', 'ladder_fall'],
          qa_ids: ['containment_negative_logged', 'regulated_area_posted'],
        },
        {
          title: 'Wet and remove the material',
          instruction: 'Soak the material with amended water and keep it wet. Remove pipe insulation inside the enclosure or glovebag; remove floor tile and mastic with wet manual methods or approved machines; scrape wetted ceiling texture down onto plastic. Bag waste while still wet — never dry sweep, use compressed air or an unshrouded abrasive saw. Monitor worker exposure daily.',
          tools: ['airless sprayer or garden sprayer', 'scrapers', 'utility knife', 'HEPA vacuum', 'personal air sampling pumps'],
          materials: ['amended water / surfactant', 'labeled 6-mil disposal bags', 'mastic remover if approved'],
          safety_ids: ['asbestos_inhalation', 'asbestos_prohibited_methods', 'respirator_fit', 'ladder_fall', 'chemical_products'],
          qa_ids: ['material_kept_wet', 'exposure_monitoring_daily'],
        },
        {
          title: 'Bag, label and haul the waste',
          instruction: 'Double-bag or wrap all waste and contaminated plastic, label each bag with the asbestos warning and the generator name and job address, and wash bags in the equipment room before they leave. Load a marked, closed vehicle or lined dumpster and send it to an approved landfill with a waste shipment record; keep the signed copy.',
          tools: ['HEPA vacuum', 'sprayer'],
          materials: ['labeled disposal bags', 'generator labels', 'waste shipment record forms'],
          safety_ids: ['asbestos_inhalation', 'decon_takehome'],
          qa_ids: ['waste_labeled_manifested'],
        },
        {
          title: 'Final clean and clearance',
          instruction: 'HEPA-vacuum and wet-wipe every surface, remove the first plastic layer, and lock down any residue with encapsulant. Have an independent inspector do a visual check and clearance air samples. Leave the critical barriers and air machines running until clearance passes; then tear down, bag the last plastic and hand over the clearance report.',
          tools: ['HEPA vacuum', 'sprayer', 'rags and buckets'],
          materials: ['lockdown encapsulant', 'disposal bags'],
          safety_ids: ['asbestos_inhalation', 'decon_takehome', 'chemical_products'],
          qa_ids: ['clearance_independent', 'records_kept'],
        },
      ],
    },
    {
      id: 'lead_paint_abatement',
      example_title: 'Lead-based paint abatement — windows and trim',
      when: { title_re: '\\blead(?:[- ]based)?[- ]paint\\b|\\blead abatement\\b|\\blead hazard reduction\\b|\\bLBP\\b' },
      priority: 10,
      steps: [
        {
          title: 'Confirm it is abatement, not renovation',
          instruction: 'Abatement is work meant to permanently remove lead hazards (removal, replacement, enclosure, encapsulation) — it needs a certified lead abatement firm, supervisor and workers, not just a lead-safe renovator. Have the inspection or risk assessment on site, the occupant protection plan written, and the agency notice filed (EPA or the authorized state; Wisconsin: DHS at least 2 working days before start).',
          detail: 'Routine remodeling that disturbs lead paint falls under the RRP rule (40 CFR 745 Subpart E) instead; a lead-safe renovator runs that work.',
          tools: ['clipboard or tablet'],
          materials: ['lead inspection / risk assessment report', 'occupant protection plan', 'notice copy', 'certification cards'],
          safety_ids: ['lead_exposure'],
          qa_ids: ['survey_before_disturbance', 'notifications_filed', 'certs_fit_tests_on_file'],
        },
        {
          title: 'Protect occupants and contain the work area',
          instruction: 'Move occupants and belongings out of the work area, post warning signs, close and seal HVAC and openings, and lay plastic on floors (and on the ground outside for exterior work). Set up a change area and wash station. Workers start in respirators and protective clothing until the employer’s exposure assessment shows lower protection is enough.',
          tools: ['stapler', 'utility knife', 'HEPA vacuum'],
          materials: ['6-mil poly sheeting', 'tape', 'warning signs', 'disposable coveralls'],
          safety_ids: ['lead_exposure', 'lead_hygiene', 'respirator_fit'],
          qa_ids: ['regulated_area_posted', 'occupant_protection'],
        },
        {
          title: 'Remove, replace, enclose or encapsulate',
          instruction: 'Use the method the abatement plan calls for: replace components, wet-scrape, use chemical strippers, use a HEPA-shrouded sander, or enclose or encapsulate. No open-flame burning, no uncontrolled power sanding or blasting, and keep heat guns below 1100 °F. Bag chips and debris as you go.',
          tools: ['wet scrapers', 'HEPA-shrouded sander', 'heat gun (low temperature)', 'pry bar', 'HEPA vacuum'],
          materials: ['chemical stripper if specified', 'encapsulant or enclosure materials', 'replacement components', 'heavy-duty bags'],
          safety_ids: ['lead_exposure', 'lead_trigger_tasks', 'chemical_products', 'ladder_fall'],
          qa_ids: ['lead_prohibited_methods_avoided', 'exposure_monitoring_daily'],
        },
        {
          title: 'Clean and pass dust clearance',
          instruction: 'HEPA-vacuum, wet-wash and HEPA-vacuum again. Wait at least an hour after final cleaning, then have a certified lead inspector or risk assessor do the visual check and dust-wipe clearance sampling. Re-clean anything that fails before occupants return; give the owner the abatement report.',
          tools: ['HEPA vacuum', 'buckets and mops', 'disposable wipes'],
          materials: ['detergent', 'disposal bags'],
          safety_ids: ['lead_exposure', 'lead_hygiene'],
          qa_ids: ['clearance_independent', 'records_kept'],
        },
      ],
    },
    {
      id: 'mold_remediation',
      example_title: 'Mold remediation — basement walls',
      when: { title_re: '\\bmou?ld\\b|\\bmicrobial\\b|\\bfungal\\b' },
      priority: 10,
      steps: [
        {
          title: 'Find and stop the water first',
          instruction: 'Mold comes back unless the moisture does not. Find the source — leak, condensation, groundwater, flood — and have it fixed. Measure the affected area: small patches (about 10 sq ft or less) are routine; larger areas or heavy water damage get a written remediation plan, containment and an experienced crew.',
          tools: ['moisture meter', 'flashlight', 'camera'],
          materials: ['remediation plan for large areas'],
          safety_ids: ['mold_spores'],
          qa_ids: ['moisture_source_fixed'],
        },
        {
          title: 'Contain and set negative air',
          instruction: 'Sized to the job: cover the area with plastic, seal HVAC returns and openings, and on larger jobs build a containment with a zipper door and run a HEPA air scrubber exhausted to the outside so the area stays negative. Keep occupants out.',
          tools: ['HEPA air scrubber', 'zipper doors', 'stapler'],
          materials: ['6-mil poly sheeting', 'tape'],
          safety_ids: ['mold_spores', 'electric_shock_wet'],
          qa_ids: ['containment_negative_logged'],
        },
        {
          title: 'Remove what cannot be cleaned, clean the rest',
          instruction: 'Bag and discard moldy porous materials — wet drywall, insulation, carpet and pad, ceiling tile. Wet-wipe or scrub hard surfaces with detergent and water, then HEPA-vacuum. Use biocides only if the plan calls for them and never mix products. Bag waste inside the containment.',
          tools: ['utility knife', 'pry bar', 'scrub brushes', 'HEPA vacuum'],
          materials: ['detergent', 'heavy-duty bags', 'biocide only if specified'],
          safety_ids: ['mold_spores', 'respirator_fit', 'chemical_products'],
          qa_ids: ['porous_materials_removed'],
        },
        {
          title: 'Dry, verify and hand back',
          instruction: 'Dry framing and remaining materials with dehumidifiers and air movers until moisture readings reach dry-standard levels. Confirm no visible mold or musty odor remains and the water problem is fixed; where specified, an independent assessor verifies before rebuild. Then reinstall finishes.',
          tools: ['dehumidifier', 'air movers', 'moisture meter'],
          materials: [],
          safety_ids: ['mold_spores', 'electric_shock_wet'],
          qa_ids: ['dry_before_rebuild', 'clearance_independent'],
        },
      ],
    },
  ],
  hazards: [
    { id: 'asbestos_inhalation', hazard: 'Breathing asbestos fibers released while removing or cutting asbestos-containing material', hazard_es: PENDING_ES, controls: ['Keep exposure under the 0.1 f/cc 8-hour limit and the 1 f/cc 30-minute excursion limit', 'Work only inside a marked regulated area under a competent person', 'Use wet methods, HEPA vacuums and prompt bagging of debris'], controls_es: PENDING_ES, osha_ref: '1926.1101(c)', severity: 4, ppe: ['half-face or better respirator with HEPA filters', 'disposable coveralls', 'boot covers'], prov: osha('z') },
    { id: 'asbestos_prohibited_methods', hazard: 'Sending asbestos fibers airborne with dry sweeping, compressed air or unshrouded abrasive saws', hazard_es: PENDING_ES, controls: ['Never dry sweep, shovel dry or blow off asbestos dust', 'No high-speed abrasive saws without point-of-cut ventilation or a HEPA enclosure'], controls_es: PENDING_ES, osha_ref: '1926.1101(g)(3)', severity: 4, prov: osha('z') },
    { id: 'npe_failure', hazard: 'Containment loses negative pressure and fibers escape to occupied areas', hazard_es: PENDING_ES, controls: ['Keep the enclosure negative on a manometer the whole time it is in use', 'Inspect and smoke-test the enclosure before work and at the start of every shift; seal any leak'], controls_es: PENDING_ES, osha_ref: '1926.1101(g)(5)(i)', severity: 4, prov: osha('z') },
    { id: 'decon_takehome', hazard: 'Carrying asbestos or lead dust home on clothing, skin, tools or vehicles', hazard_es: PENDING_ES, controls: ['Exit only through the decontamination area: HEPA-vacuum suits, remove them in the equipment room, shower, dress in the clean room', 'Bag contaminated clothing in sealed, labeled bags'], controls_es: PENDING_ES, osha_ref: '1926.1101(j)', severity: 3, prov: osha('z') },
    { id: 'respirator_fit', hazard: 'Respirator that is the wrong type, not fit-tested or worn with a poor seal', hazard_es: PENDING_ES, controls: ['Written respiratory program; medical clearance and fit test before use', 'Seal-check every time the respirator goes on; change filters as scheduled'], controls_es: PENDING_ES, osha_ref: '1926.1101(h)', severity: 4, ppe: ['fit-tested respirator'], prov: osha('z') },
    { id: 'lead_exposure', hazard: 'Breathing or swallowing lead dust and fume from paint removal', hazard_es: PENDING_ES, controls: ['Keep exposure under 50 µg/m³ as an 8-hour average', 'Assess exposure before work; use wet methods, HEPA-shrouded tools and HEPA cleanup'], controls_es: PENDING_ES, osha_ref: '1926.62(c)', severity: 4, ppe: ['fit-tested respirator', 'disposable coveralls', 'gloves'], prov: osha('d') },
    { id: 'lead_trigger_tasks', hazard: 'High lead exposure from torch cutting, abrasive blasting, power tool cleaning or heat stripping', hazard_es: PENDING_ES, controls: ['Until an exposure assessment shows otherwise, give workers on these tasks respirators, protective clothing, hygiene facilities and blood-lead testing', 'Never open-flame burn lead paint during abatement'], controls_es: PENDING_ES, osha_ref: '1926.62(d)(2)', severity: 4, prov: osha('d') },
    { id: 'lead_hygiene', hazard: 'Swallowing lead from eating, drinking or smoking in the work area', hazard_es: PENDING_ES, controls: ['No food, drink, tobacco or cosmetics in the lead work area', 'Wash hands and face before eating; change out of work clothes before leaving'], controls_es: PENDING_ES, osha_ref: '1926.62(i)', severity: 3, prov: osha('d') },
    { id: 'mold_spores', hazard: 'Breathing mold spores and fragments when removing moldy materials', hazard_es: PENDING_ES, controls: ['Contain the work area and run HEPA air filtration', 'Wear at least an N-95 respirator — larger jobs need higher protection and full coveralls', 'Mist materials lightly before removal to keep dust down'], controls_es: PENDING_ES, osha_ref: '1926.103', severity: 3, ppe: ['N-95 or better respirator', 'non-vented goggles', 'long gloves', 'coveralls'], prov: osha('e') },
    { id: 'chemical_products', hazard: 'Skin, eye and breathing injury from strippers, mastic removers, encapsulants and biocides', hazard_es: PENDING_ES, controls: ['Read the SDS and label before use; ventilate', 'Never mix bleach with ammonia or other cleaners', 'Wear chemical-resistant gloves and eye protection'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 3, ppe: ['nitrile or neoprene gloves', 'goggles'], prov: osha('d') },
    { id: 'electric_shock_wet', hazard: 'Electric shock from cords and circuits in wet containments', hazard_es: PENDING_ES, controls: ['Deactivate circuits inside the enclosure or protect them with GFCI', 'GFCI on every temporary cord and tool; keep cords off wet floors'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 4, prov: osha('k') },
    { id: 'ladder_fall', hazard: 'Fall from ladders or scaffolds on slick plastic while removing ceilings and overhead pipe insulation', hazard_es: PENDING_ES, controls: ['Set ladders on firm, non-slip footing — tape or cover poly where feet land', 'Keep three points of contact; use a rolling scaffold with locked wheels for long ceiling runs'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(6)', severity: 3, prov: osha('x') },
  ],
  qa_checklist: [
    { id: 'survey_before_disturbance', phase: 'site_prep', item: 'Asbestos survey by a certified inspector (and lead inspection or risk assessment for lead work) completed and on site before any material is disturbed; material locations and quantities match the work scope.', item_es: PENDING_ES, safety: true, prov: { src: ['abatement-ecfr-40-61m', 'ecfr-1926-z', 'abatement-wi-dhs159'], confidence: 'verified', last_verified: D } },
    { id: 'notifications_filed', phase: 'site_prep', item: 'Required notices filed and lead time met: NESHAP notice for RACM above threshold or any demolition; Wisconsin DHS asbestos or lead abatement notice; copies on site.', item_es: tr('Avisos requeridos presentados y plazo cumplido: aviso NESHAP para MCA friable sobre el umbral o cualquier demolición; aviso de DHS de Wisconsin para asbesto o plomo; copias en la obra.'), prov: { src: ['abatement-ecfr-40-61m', 'abatement-wi-dhs159', 'abatement-wi-dhs163', 'abatement-wi-dnr-asbestos'], confidence: 'verified', last_verified: D } },
    { id: 'certs_fit_tests_on_file', phase: 'site_prep', item: 'Company certification, each worker’s and supervisor’s current certification card, respirator fit test and medical clearance on file before entry.', item_es: PENDING_ES, safety: true, prov: { src: ['abatement-wi-dhs159', 'abatement-wi-dhs163', 'ecfr-1926-z'], confidence: 'verified', last_verified: D } },
    { id: 'regulated_area_posted', phase: 'site_prep', item: 'Regulated area marked with warning signs and barriers; entry log kept; only authorized, equipped people inside.', item_es: PENDING_ES, safety: true, prov: osha('z') },
    { id: 'containment_negative_logged', phase: 'site_prep', item: 'Critical barriers sealed, HVAC isolated, enclosure smoke-tested and kept negative; manometer readings logged at the start of each shift and during work.', item_es: PENDING_ES, safety: true, prov: osha('z') },
    { id: 'occupant_protection', phase: 'site_prep', item: 'Occupant protection plan followed: occupants and belongings out of the work area, and no access until clearance passes.', item_es: PENDING_ES, safety: true, prov: leadEpa },
    { id: 'material_kept_wet', item: 'Asbestos material adequately wet during removal and kept wet until bagged; no dry sweeping or compressed air.', item_es: PENDING_ES, safety: true, prov: neshap },
    { id: 'exposure_monitoring_daily', item: 'Initial exposure assessment done; personal air samples taken daily for Class I/II asbestos work and as required for lead; results given to workers.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-z', 'ecfr-1926-d'], confidence: 'verified', last_verified: D } },
    { id: 'lead_prohibited_methods_avoided', item: 'No open-flame burning, no uncontrolled machine sanding or blasting, heat guns kept below 1100 °F during lead abatement.', item_es: PENDING_ES, safety: true, prov: leadEpa },
    { id: 'waste_labeled_manifested', item: 'Waste in sealed, labeled leak-tight containers with generator name and job address; hauled in a marked vehicle to an approved landfill with a waste shipment record; signed copy returned.', item_es: PENDING_ES, safety: true, prov: neshap },
    { id: 'moisture_source_fixed', item: 'Mold job: water source identified and repaired before cleanup starts, with readings recorded.', item_es: tr('Trabajo de moho: fuente de agua identificada y reparada antes de empezar la limpieza, con lecturas registradas.'), prov: mold },
    { id: 'porous_materials_removed', item: 'Moldy porous materials (drywall, insulation, carpet, ceiling tile) removed and bagged; hard surfaces cleaned and HEPA-vacuumed.', item_es: tr('Materiales porosos con moho (tablaroca, aislamiento, alfombra, plafón) retirados y embolsados; superficies duras limpiadas y aspiradas con HEPA.'), prov: mold },
    { id: 'dry_before_rebuild', item: 'Framing and remaining materials dry by meter readings before any new finishes are installed.', item_es: tr('Estructura y materiales restantes secos según el medidor antes de instalar acabados nuevos.'), prov: mold },
    { id: 'clearance_independent', item: 'Clearance by an independent party before re-occupancy: visual plus air samples for asbestos, visual plus dust-wipe samples by a certified inspector or risk assessor for lead, post-remediation check for mold.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-z', 'abatement-ecfr-40-745l', 'abatement-epa-mold-commercial'], confidence: 'verified', last_verified: D } },
    { id: 'records_kept', item: 'Project file kept: survey, notices, daily logs, manometer and air-monitoring records, waste shipment records and clearance reports (Wisconsin: at least 3 years).', item_es: tr('Expediente del proyecto guardado: estudio, avisos, bitácoras diarias, registros de manómetro y de monitoreo de aire, manifiestos de residuos e informes de liberación (Wisconsin: al menos 3 años).'), prov: wiAsb },
  ],
  inspection_checklists: {
    asbestos_survey: [
      { item: 'Survey by a certified asbestos inspector covers every material in the work area; bulk-sample lab results attached', item_es: PENDING_ES, ref: '40 CFR 61.145(a)' },
      { item: 'Building owner told the contractor what ACM/PACM is present before work began', item_es: PENDING_ES, ref: '1926.1101(k)(2)' },
      { item: 'NESHAP / state abatement notices filed with the required lead time (WI DHS 159.20; DNR NR 447 via ARDN)', item_es: PENDING_ES, ref: '40 CFR 61.145(b)' },
    ],
    containment_check: [
      { item: 'Regulated area signed and demarcated; competent person on site', item_es: PENDING_ES, ref: '1926.1101(e)' },
      { item: 'Enclosure smoke-tested; manometer shows negative pressure and readings are logged', item_es: PENDING_ES, ref: '1926.1101(g)(5)(i)' },
      { item: 'Decontamination unit attached with equipment room, shower and clean room', item_es: PENDING_ES, ref: '1926.1101(j)' },
      { item: 'Circuits inside the enclosure deactivated or GFCI-protected', item_es: PENDING_ES, ref: '1926.1101(g)(5)(i)' },
    ],
    clearance_air_test: [
      { item: 'Independent inspector visual: no visible debris or residue anywhere in the work area', item_es: PENDING_ES },
      { item: 'Clearance air samples taken with barriers and air machines still in place; results meet the project clearance criterion', item_es: PENDING_ES },
      { item: 'Waste shipment records and disposal receipts on file', item_es: PENDING_ES, ref: '40 CFR 61.150(d)' },
    ],
    lead_clearance_dust_wipe: [
      { item: 'Visual inspection by a certified inspector or risk assessor finds no deteriorated paint, dust or debris', item_es: PENDING_ES, ref: '40 CFR 745.227(e)(8)' },
      { item: 'Dust-wipe samples taken at least 1 hour after final cleaning from sills, troughs and floors; results below clearance levels or area re-cleaned', item_es: PENDING_ES, ref: '40 CFR 745.227(e)(8)' },
      { item: 'Abatement report given to the owner', item_es: PENDING_ES, ref: '40 CFR 745.227(e)(10)' },
    ],
    mold_post_remediation: [
      { item: 'Moisture source fixed and materials dry', item_es: PENDING_ES },
      { item: 'No visible mold, mold-damaged material or musty odor remaining', item_es: PENDING_ES },
      { item: 'Independent assessor verification where the contract requires it', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-ABT-SURVEY-EA', name: 'Pre-renovation asbestos survey, single-family home (certified inspector + lab bulk samples)', name_es: 'Estudio de asbesto previo a la remodelación, casa unifamiliar (inspector certificado + muestras de laboratorio)', unit: 'EA', csi: '02 82 00',
      description: 'Inspector site time and report as labor; ~10 PLM bulk samples as material.',
      material_cost_cents: { v: 25000, prov: est('≈10 PLM bulk samples at lab rates + supplies, national baseline 2026') }, labor_hours_per_unit: { v: 5, prov: est('walk-through, sampling and report writing for a typical house') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('service — no material waste') } },
    { code: 'B-ABT-PIPE-LF', name: 'Asbestos pipe insulation (TSI) removal in containment or glovebag, per LF', name_es: 'Retiro de aislamiento de tubería con asbesto (TSI) en encierro o bolsa de guantes, por pie lineal', unit: 'LF', csi: '02 82 13',
      material_cost_cents: { v: 900, prov: est('poly, glovebags, labeled bags, surfactant, PPE share and landfill disposal per LF, 2026') }, labor_hours_per_unit: { v: 0.35, prov: est('setup share, wet strip, bag, clean — small residential runs') },
      equipment_cost_cents: { v: 300, prov: est('HEPA negative air machine, HEPA vacuum and decon unit rental share') }, waste_pct: { v: 10, prov: est('extra poly and bags') } },
    { code: 'B-ABT-FLOOR-SF', name: 'Asbestos floor tile and mastic removal (Class II), per SF', name_es: 'Retiro de losetas de piso y adhesivo con asbesto (Clase II), por pie cuadrado', unit: 'SF', csi: '02 82 13',
      material_cost_cents: { v: 175, prov: est('poly, bags, mastic remover, PPE share and disposal per SF, 2026') }, labor_hours_per_unit: { v: 0.05, prov: est('wet manual removal of tile and mastic, residential scale') },
      equipment_cost_cents: { v: 50, prov: est('HEPA vacuum and air machine share') }, waste_pct: { v: 5, prov: est('overlap of floor protection') } },
    { code: 'B-ABT-CEIL-SF', name: 'Asbestos textured (popcorn) ceiling removal in negative pressure enclosure, per SF', name_es: 'Retiro de techo texturizado (popcorn) con asbesto en encierro a presión negativa, por pie cuadrado', unit: 'SF', csi: '02 82 13',
      material_cost_cents: { v: 125, prov: est('poly for walls/floors, bags, surfactant, encapsulant, PPE share and disposal per SF, 2026') }, labor_hours_per_unit: { v: 0.045, prov: est('enclosure setup share, wet scrape, bag, lockdown') },
      equipment_cost_cents: { v: 50, prov: est('HEPA air machine, manometer and decon unit share') }, waste_pct: { v: 10, prov: est('extra poly for wall cover and critical barriers') } },
    { code: 'B-ABT-LEAD-SF', name: 'Lead-based paint abatement (strip, replace or encapsulate components), per SF of surface', name_es: 'Eliminación de pintura con plomo (decapado, reemplazo o encapsulado de componentes), por pie cuadrado de superficie', unit: 'SF', csi: '02 83 00',
      description: 'Replacement components (windows, doors) priced separately.',
      material_cost_cents: { v: 250, prov: est('stripper or encapsulant, poly, bags, PPE share and disposal per SF, 2026') }, labor_hours_per_unit: { v: 0.12, prov: est('containment share, wet strip or encapsulate, HEPA clean') },
      equipment_cost_cents: { v: 75, prov: est('HEPA vacuum and HEPA-shrouded tool share') }, waste_pct: { v: 10, prov: est('poly and stripper overage') } },
    { code: 'B-ABT-MOLD-SF', name: 'Mold remediation with containment and negative air, per SF of affected area', name_es: 'Remediación de moho con encierro y aire negativo, por pie cuadrado de área afectada', unit: 'SF', csi: '02 85 00',
      description: 'Removal and cleaning only; rebuild of drywall and finishes priced by those trades.',
      material_cost_cents: { v: 250, prov: est('poly, zipper door share, detergent/antimicrobial, bags and PPE per SF, 2026') }, labor_hours_per_unit: { v: 0.15, prov: est('contain, remove porous materials, clean, HEPA vacuum') },
      equipment_cost_cents: { v: 150, prov: est('HEPA air scrubber, dehumidifier and air mover rental share') }, waste_pct: { v: 10, prov: est('extra poly and bags') } },
  ],
  dependency_hints: [
    { before_phase: 'framing', note: 'Survey and abate asbestos and lead before demolition or any work that disturbs the material; clearance must pass before rebuild trades re-enter.' },
    { before_phase: 'insulation', note: 'Mold remediation follows the repair of the water source and must be dry and verified before insulation and drywall go back.' },
  ],
});
