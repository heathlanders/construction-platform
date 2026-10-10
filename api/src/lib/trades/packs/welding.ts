// Trade Knowledge Pack — welding (Field / Structural Welding). Wave 11 — NEW-TRADE pattern (no hand recipe,
// no template tasks). Dossier: docs/trade-packs/dossiers/welding.md. Sources: 29 CFR 1926 Subpart J
// (1926.350–.354), D (1926.55 fumes), E (eye/face), R (1926.760 fall protection), Z (1926.1126 Cr(VI)),
// I (abrasive wheels); OSHA FS-3647 welding fume; UFGS 05 12 00 Part 3 welding + field QC; AWS safety fact
// sheets + Z49.1 (free); AWS D1.1, NFPA 51B, IBC 1704/1705/2204 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const ufgs = { src: ['structural_steel-ufgs-05-12-00'], confidence: 'verified' as const, last_verified: D };
const d11 = { src: ['welding-aws-d1-1', 'structural_steel-ufgs-05-12-00'], confidence: 'derived' as const, last_verified: D, note: 'General AWS D1.1 practice as carried into UFGS 05 12 00 — values come from the approved WPS, not this pack.' };
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const fire = { src: ['ecfr-1926-j', 'welding-nfpa-51b'], confidence: 'verified' as const, last_verified: D };

const WELD_RE = '\\bweld|field weld|welding';
const BIG = ['commercial', 'industrial'] as const;

export default definePack({
  key: 'welding',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Field welding of structural and miscellaneous steel by a mobile welding crew — welding procedure (WPS) and welder qualification, hot-work permit and fire watch, fit-up and preheat, welding to the WPS, visual inspection and NDT by the special inspector, and repair of rejected welds.',
    summary_es: 'Soldadura en campo de acero estructural y misceláneo por una cuadrilla móvil — procedimiento de soldadura (WPS) y calificación del soldador, permiso de trabajo en caliente y vigilancia contra incendios, ajuste y precalentamiento, soldadura según el WPS, inspección visual y ensayos no destructivos por el inspector especial, y reparación de soldaduras rechazadas.',
    glossary: [
      { term: 'WPS (Welding Procedure Specification)', term_es: 'WPS (especificación del procedimiento de soldadura)', def: 'Written recipe for a weld: process, electrode, joint, position, preheat, amps and volts. Weld only to an approved WPS.', def_es: 'Receta escrita de una soldadura: proceso, electrodo, junta, posición, precalentamiento, amperaje y voltaje. Solo se suelda con un WPS aprobado.' },
      { term: 'Welder qualification', term_es: 'Calificación del soldador', def: 'Test record showing the welder passed for that process, position and thickness range.', def_es: 'Registro de prueba que muestra que el soldador aprobó para ese proceso, posición y rango de espesor.' },
      { term: 'Fillet weld', term_es: 'Soldadura de filete', def: 'Triangle-shaped weld in a corner or lap joint; sized by its leg length.', def_es: 'Soldadura de forma triangular en una junta de esquina o traslape; se mide por la longitud de su pierna.' },
      { term: 'CJP groove weld', term_es: 'Soldadura de ranura de penetración completa (CJP)', def: 'Weld that fills the full thickness of the joint; usually needs a backing bar or backgouging and is often ultrasonic tested.', def_es: 'Soldadura que llena todo el espesor de la junta; casi siempre lleva placa de respaldo o ranurado posterior y suele probarse con ultrasonido.' },
      { term: 'Preheat', term_es: 'Precalentamiento', def: 'Heating the steel around the joint before welding to the temperature the WPS lists, to prevent cracking.', def_es: 'Calentar el acero alrededor de la junta antes de soldar a la temperatura del WPS, para evitar grietas.' },
      { term: 'Backgouge', term_es: 'Ranurado posterior', def: 'Removing the root of a groove weld from the back side down to sound metal before welding that side.', def_es: 'Quitar la raíz de una soldadura de ranura desde el lado posterior hasta metal sano antes de soldar ese lado.' },
      { term: 'Undercut', term_es: 'Socavado', def: 'Groove melted into the base metal along the edge of the weld and left unfilled — a common visual reject.', def_es: 'Canal fundido en el metal base a lo largo del borde de la soldadura que queda sin llenar — rechazo visual común.' },
      { term: 'CWI', term_es: 'CWI (inspector de soldadura certificado)', def: 'AWS Certified Welding Inspector who checks welds visually and keeps the inspection log.', def_es: 'Inspector de soldadura certificado por AWS que revisa las soldaduras visualmente y lleva el registro de inspección.' },
      { term: 'NDT (UT / MT / PT)', term_es: 'END (UT / MT / PT)', def: 'Nondestructive testing: ultrasonic (UT) finds flaws inside the weld; magnetic particle (MT) and dye penetrant (PT) find surface cracks.', def_es: 'Ensayos no destructivos: ultrasonido (UT) encuentra defectos dentro de la soldadura; partículas magnéticas (MT) y líquidos penetrantes (PT) encuentran grietas superficiales.' },
      { term: 'Fire watch', term_es: 'Vigilante contra incendios', def: 'Person with an extinguisher whose only job is to watch for sparks and fire during hot work and for a while after.', def_es: 'Persona con extintor cuyo único trabajo es vigilar chispas y fuego durante el trabajo en caliente y un tiempo después.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'field_structural_welding',
      example_title: 'Field weld moment connections at roof beams',
      when: { title_re: WELD_RE },
      steps: [
        {
          title: 'Check the WPS, welder papers and consumables',
          instruction: 'Have the approved WPS for every joint type on site, and a current qualification record for each welder that covers the process, position and thickness. Store low-hydrogen electrodes the way the WPS and electrode maker require and throw out wet or damaged rod. Inspect the machine, cables, leads and holder; ground the machine frame.',
          detail: 'Welding is done to AWS D1.1 (D1.8 where the drawings call for seismic welds) and the project specification — the numbers come from the WPS, not from memory.',
          tools: ['welding machine', 'electrode holder / MIG gun', 'rod oven or sealed electrode container'],
          materials: ['electrodes / wire per WPS', 'shielding gas per WPS'],
          safety_ids: ['arc_shock', 'cable_damage'],
          qa_ids: ['wps_on_site', 'welder_quals', 'consumables_stored'],
        },
        {
          title: 'Get the hot work permit and post the fire watch',
          instruction: 'Get the site hot-work permit before striking an arc. Move combustibles away or cover them with welding blankets, check below and on the far side of walls and floors, keep a charged extinguisher at the work, and post a fire watch whenever normal precautions are not enough. Chain gas cylinders upright, caps on when not in use, and keep them away from sparks.',
          detail: 'NFPA 51B and the site permit set the fire-watch time after the work ends.',
          tools: ['fire extinguisher', 'welding blankets / screens', 'cylinder cart or chain'],
          materials: ['hot-work permit'],
          safety_ids: ['fire_hot_work', 'hidden_fire', 'cylinders'],
          qa_ids: ['hot_work_permit'],
        },
        {
          title: 'Fit up, clean and preheat the joint',
          instruction: 'Check fit-up against the WPS and shop drawings: root opening, bevel, alignment and backing bar. Grind the weld area clean of mill scale, rust, paint, oil and moisture. Preheat to the WPS temperature across the full joint thickness and check it with a temperature crayon or thermometer before and during welding.',
          tools: ['angle grinder', 'fit-up gauge', 'torch or induction heater', 'temperature-indicating crayon'],
          materials: ['backing bar / run-off tabs per WPS'],
          safety_ids: ['grinder', 'coated_metal', 'fall_steel'],
          qa_ids: ['fitup_per_wps', 'base_metal_clean', 'preheat_checked'],
        },
        {
          title: 'Weld to the WPS',
          instruction: 'Weld in the position, sequence and pass count the WPS shows, keeping amps, volts and travel inside its range. Clean slag between passes. Set screens so other trades are shielded from the arc, keep local exhaust at the arc, and keep your head out of the plume.',
          detail: 'Stainless or chromium-coated work makes hexavalent chromium fume — use local exhaust and the respirator the exposure assessment calls for.',
          tools: ['welding machine', 'chipping hammer', 'wire brush', 'fume extractor', 'welding screens'],
          materials: ['electrodes / wire per WPS', 'shielding gas per WPS'],
          safety_ids: ['arc_shock', 'arc_radiation', 'fumes', 'hex_chrome', 'confined_space', 'fall_steel'],
          qa_ids: ['weld_size_length'],
        },
        {
          title: 'Visual inspection and NDT',
          instruction: 'Clean each finished weld and call the CWI and the special inspector. Every weld gets a visual check for size, length, profile, undercut, porosity and cracks. Mark the welds the drawings or spec list for UT (usually CJP groove welds) or MT/PT (fillet and PJP welds) and give the testers access. Keep the weld map and inspection reports for the framing inspection.',
          tools: ['fillet weld gauge', 'flashlight', 'paint marker'],
          materials: [],
          safety_ids: ['fall_steel'],
          qa_ids: ['cwi_visual', 'ndt_per_spec', 'special_insp_reports'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: '1705.2.1', code_type: 'IBC', note: 'Special inspection of structural steel, including field welding' }, { section: '2204.1', code_type: 'IBC', note: 'Welding workmanship and welder qualification per referenced steel standards' }],
        },
        {
          title: 'Repair rejects, clean up and close the permit',
          instruction: 'Grind or gouge out every rejected weld to sound metal, re-weld to the WPS and get it retested. Remove temporary welds, tabs and backing where the drawings require it. Touch up primer or zinc-rich paint over field welds and burn marks. Keep the fire watch until the permit time is up, then close out the hot-work permit.',
          tools: ['angle grinder', 'air-arc gouging torch', 'paint brush'],
          materials: ['primer matching the shop coat', 'zinc-rich repair paint for galvanized steel'],
          safety_ids: ['grinder', 'hidden_fire', 'fumes'],
          qa_ids: ['repairs_retested', 'temp_welds_removed', 'field_touch_up', 'fire_watch_kept'],
        },
      ],
    },
    {
      id: 'existing_steel_retrofit',
      example_title: 'Field weld reinforcing plates to existing beams',
      priority: 10,
      when: { title_re: '\\b(?:existing|repair|retrofit|reinforc|strengthen)\\w*\\b[^.]*\\bweld|\\bweld[^.]*\\b(?:existing|repair|retrofit|reinforc|strengthen)' },
      steps: [
        {
          title: 'Survey the existing steel and coatings',
          instruction: 'Confirm the engineer has accepted the existing steel as weldable and issued a WPS for it. Find out what the coating is: test a coating of unknown flammability before heating it, and treat old paint as lead or chromium until tested. Locate hidden combustibles, wiring and piping behind and below the work.',
          tools: ['scraper', 'flashlight', 'paint test kit'],
          materials: [],
          safety_ids: ['coated_metal', 'hex_chrome', 'hidden_fire'],
          qa_ids: ['wps_on_site', 'welder_quals'],
        },
        {
          title: 'Strip coatings and protect the occupied building',
          instruction: 'Strip paint, fireproofing and coatings back from the weld zone as the coating test and the WPS require; in enclosed spaces strip toxic coatings well back from the heat or use supplied-air respirators. Shut down or cover smoke detectors only under the building’s impairment procedure, cover openings, and take the same fire precautions on the far side of walls and floors.',
          tools: ['needle scaler', 'HEPA vacuum', 'angle grinder'],
          materials: ['welding blankets', 'poly sheeting', 'hot-work permit'],
          safety_ids: ['coated_metal', 'fire_hot_work', 'hidden_fire', 'grinder'],
          qa_ids: ['hot_work_permit', 'base_metal_clean'],
        },
        {
          title: 'Fit, preheat and weld the reinforcement',
          instruction: 'Fit the plates or members to the drawings, clamp them tight, preheat per the WPS and weld in the sequence the engineer gave to limit heat distortion of the loaded member. Keep the fire watch the whole time.',
          tools: ['welding machine', 'clamps', 'torch or induction heater', 'temperature-indicating crayon'],
          materials: ['reinforcing plates / members', 'electrodes / wire per WPS'],
          safety_ids: ['arc_shock', 'arc_radiation', 'fumes', 'fire_hot_work', 'fall_steel'],
          qa_ids: ['fitup_per_wps', 'preheat_checked', 'weld_size_length'],
        },
        {
          title: 'Inspect, repair and restore protection',
          instruction: 'Have the CWI and special inspector check every weld and run any NDT the drawings call for; repair and retest rejects. Then restore primer, fireproofing and finishes, re-enable fire protection, and keep the fire watch until the permit closes.',
          tools: ['fillet weld gauge', 'flashlight'],
          materials: ['primer', 'fireproofing patch material by the fireproofing trade'],
          safety_ids: ['hidden_fire'],
          qa_ids: ['cwi_visual', 'ndt_per_spec', 'repairs_retested', 'field_touch_up', 'fire_watch_kept'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: '1705.2.1', code_type: 'IBC', note: 'Special inspection of structural steel, including field welding' }],
        },
      ],
    },
  ],
  code_refs: {
    framing: [
      { section: '1704.2', code_type: 'IBC', note: 'Special inspections and tests — owner engages an approved agency', prov: icc },
      { section: '1705.2.1', code_type: 'IBC', note: 'Structural steel special inspection, including welding, per the referenced steel standard', prov: icc },
      { section: '2204.1', code_type: 'IBC', note: 'Welding — design, workmanship, inspection and welder qualification per referenced standards', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: WELD_RE }, type: 'welder', reason: 'Engine-driven or plug-in welding machine for field welds' },
    { when: { title_re: WELD_RE }, type: 'generator', reason: 'Power for grinders, fume extractor and induction preheat where there is no site power', optional: true },
    { when: { title_re: WELD_RE, building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'boom_lift', reason: 'Reach connections at beam and column level', optional: true },
    { when: { title_re: WELD_RE, building_types: ['commercial', 'industrial'] }, type: 'scissor_lift', reason: 'Work platform for welds under floors and roof framing', optional: true },
  ],
  hazards: [
    { id: 'arc_shock', hazard: 'Electric shock from the welding circuit — electrode, holder or work lead', hazard_es: PENDING_ES, controls: ['Use insulated holders and dry gloves; never change rod with bare hands or while wet', 'Take the electrode out and park the holder where it cannot touch anyone when you walk away', 'Open the machine switch before moving it or leaving for a long time'], controls_es: PENDING_ES, osha_ref: '1926.351(d)', severity: 4, ppe: ['dry leather welding gloves', 'insulated boots'], prov: osha('j') },
    { id: 'cable_damage', hazard: 'Shock or fire from worn cables, bad splices or poor ground returns', hazard_es: PENDING_ES, controls: ['Do not use cables that need repair; no splices within 10 ft of the holder', 'Clamp the ground lead close to the weld; never use pipelines or conduit as the ground return'], controls_es: PENDING_ES, osha_ref: '1926.351(b)(4)', severity: 3, prov: osha('j') },
    { id: 'fire_hot_work', hazard: 'Fire started by sparks, slag or heat reaching combustibles', hazard_es: PENDING_ES, controls: ['Move the work or the combustibles; cover what cannot move with welding blankets', 'No hot work near flammable paint, vapors or heavy dust', 'Keep a charged extinguisher at the work'], controls_es: PENDING_ES, osha_ref: '1926.352(a)', severity: 4, ppe: ['flame-resistant clothing'], prov: fire },
    { id: 'hidden_fire', hazard: 'Smoldering fire in hidden spaces or on the far side of walls and floors after the work', hazard_es: PENDING_ES, controls: ['Post a fire watch during the work and for the permit time after it ends', 'Take the same precautions on the opposite side of walls, floors and ceilings'], controls_es: PENDING_ES, osha_ref: '1926.352(e)', severity: 4, prov: fire },
    { id: 'fumes', hazard: 'Breathing welding fume and gases (manganese, iron oxide, ozone, carbon monoxide)', hazard_es: PENDING_ES, controls: ['Use local exhaust at the arc or general ventilation; stand upwind outdoors', 'Keep your head out of the plume', 'Wear the respirator the exposure assessment calls for when ventilation is not enough'], controls_es: PENDING_ES, osha_ref: '1926.353(e)(1)', severity: 3, ppe: ['respirator when required'], prov: { src: ['ecfr-1926-j', 'welding-osha-fs3647', 'welding-aws-safety'], confidence: 'verified', last_verified: D } },
    { id: 'coated_metal', hazard: 'Toxic fume or fire from heating galvanized, painted or coated steel (zinc, lead, cadmium)', hazard_es: PENDING_ES, controls: ['Test coatings of unknown flammability before heating', 'Strip the coating back from the weld zone', 'Use local exhaust in enclosed spaces and a respirator in open air'], controls_es: PENDING_ES, osha_ref: '1926.354(a)', severity: 3, ppe: ['respirator'], prov: { src: ['ecfr-1926-j', 'welding-aws-safety'], confidence: 'verified', last_verified: D } },
    { id: 'hex_chrome', hazard: 'Hexavalent chromium fume from welding stainless steel or chromium-coated metal', hazard_es: PENDING_ES, controls: ['Assess exposure before stainless or chromate work', 'Use local exhaust at the arc and the respirator the assessment requires', 'Wash up before eating; no food or drink in the work area'], controls_es: PENDING_ES, osha_ref: '1926.1126(c)', severity: 4, ppe: ['respirator'], prov: { src: ['ecfr-1926-z', 'welding-aws-safety'], confidence: 'verified', last_verified: D } },
    { id: 'arc_radiation', hazard: 'Eye flash and skin burns from arc UV / IR, sparks and spatter', hazard_es: PENDING_ES, controls: ['Welding helmet with the correct filter shade over safety glasses', 'Cover all skin with flame-resistant clothing', 'Set screens so nearby workers are shielded from the arc'], controls_es: PENDING_ES, osha_ref: '1926.353(e)(2)', severity: 3, ppe: ['welding helmet', 'safety glasses', 'FR jacket', 'welding gloves'], prov: { src: ['ecfr-1926-j', 'ecfr-1926-e', 'welding-aws-safety'], confidence: 'verified', last_verified: D } },
    { id: 'cylinders', hazard: 'Cylinder falls, valve break-off or gas leak from oxygen and fuel-gas cylinders', hazard_es: PENDING_ES, controls: ['Keep cylinders upright and chained; caps on when moved or stored', 'Store oxygen away from fuel gas by the required distance or behind a fire barrier', 'Never take oxygen or fuel-gas cylinders into a confined space'], controls_es: PENDING_ES, osha_ref: '1926.350(a)(9)', severity: 3, prov: osha('j') },
    { id: 'confined_space', hazard: 'Fume buildup, oxygen enrichment or entrapment while welding inside tanks, boxes or vaults', hazard_es: PENDING_ES, controls: ['Provide mechanical ventilation or supplied-air respirators', 'Station an attendant outside with a rescue plan', 'Shut off gas outside the space when the torch is not in use'], controls_es: PENDING_ES, osha_ref: '1926.353(b)(1)', severity: 4, ppe: ['supplied-air respirator when required', 'harness + retrieval line'], prov: osha('j') },
    { id: 'fall_steel', hazard: 'Fall from beams, columns or decking while welding connections', hazard_es: PENDING_ES, controls: ['Fall protection on steel above 15 ft (connectors and deckers per the steel erection rules)', 'Weld from a lift or platform where possible; tie off to an anchor the welding cannot damage'], controls_es: PENDING_ES, osha_ref: '1926.760(a)(1)', severity: 4, ppe: ['harness + lanyard'], prov: osha('r') },
    { id: 'grinder', hazard: 'Wheel burst, kickback and flying particles from grinders and gouging', hazard_es: PENDING_ES, controls: ['Keep the guard on and use a wheel rated for the grinder speed', 'Face shield over safety glasses; keep others out of the spark path'], controls_es: PENDING_ES, osha_ref: '1926.303(b)(1)', severity: 3, ppe: ['face shield', 'safety glasses', 'hearing protection'], prov: osha('i') },
  ],
  qa_checklist: [
    { id: 'wps_on_site', item: 'Approved WPS on site for every joint type, prequalified or qualified by test, submitted before welding starts.', item_es: { status: 'translated', text: 'WPS aprobado en obra para cada tipo de junta, precalificado o calificado por prueba, entregado antes de empezar a soldar.' }, prov: ufgs },
    { id: 'welder_quals', item: 'Each welder has a current qualification record covering the process, position and thickness being welded.', item_es: { status: 'translated', text: 'Cada soldador tiene registro de calificación vigente que cubre el proceso, la posición y el espesor que suelda.' }, prov: ufgs },
    { id: 'consumables_stored', item: 'Electrodes and wire match the WPS; low-hydrogen electrodes kept dry in an oven or sealed container per the maker.', item_es: { status: 'translated', text: 'Electrodos y alambre conforme al WPS; electrodos de bajo hidrógeno guardados secos en horno o envase sellado según el fabricante.' }, prov: d11 },
    { id: 'fitup_per_wps', item: 'Fit-up checked before welding: root opening, bevel, alignment and backing match the WPS and shop drawings.', item_es: { status: 'translated', text: 'Ajuste revisado antes de soldar: abertura de raíz, bisel, alineación y respaldo conforme al WPS y planos de taller.' }, prov: d11 },
    { id: 'base_metal_clean', item: 'Weld area dry and free of mill scale, rust, paint, galvanizing, oil and grease as the WPS requires.', item_es: { status: 'translated', text: 'Zona de soldadura seca y libre de cascarilla, óxido, pintura, galvanizado, aceite y grasa según el WPS.' }, prov: d11 },
    { id: 'preheat_checked', item: 'Preheat measured at the WPS temperature before and during welding, including in cold weather.', item_es: { status: 'translated', text: 'Precalentamiento medido a la temperatura del WPS antes y durante la soldadura, incluso en clima frío.' }, prov: d11 },
    { id: 'weld_size_length', item: 'Weld size, length and location match the drawings; checked with a weld gauge.', item_es: { status: 'translated', text: 'Tamaño, longitud y ubicación de la soldadura conforme a los planos; revisado con galga de soldadura.' }, prov: ufgs },
    { id: 'cwi_visual', item: 'A Certified Welding Inspector visually inspected 100 percent of field welds and recorded them in the visual weld inspection log.', item_es: { status: 'translated', text: 'Un inspector de soldadura certificado revisó visualmente el 100 por ciento de las soldaduras de campo y las anotó en el registro de inspección visual.' }, prov: ufgs },
    { id: 'ndt_per_spec', item: 'NDT done at the locations and frequency the drawings or spec list — typically UT on CJP groove welds, MT or PT on fillet and PJP welds — by technicians certified for that method.', item_es: { status: 'translated', text: 'END realizados en las ubicaciones y frecuencia que indican planos o especificación — normalmente UT en soldaduras CJP, MT o PT en filetes y PJP — por técnicos certificados en ese método.' }, prov: ufgs },
    { id: 'repairs_retested', item: 'Every rejected weld removed to sound metal, re-welded to the WPS and retested; extra testing done if a welder’s reject rate trips the spec trigger.', item_es: { status: 'translated', text: 'Cada soldadura rechazada se quitó hasta metal sano, se volvió a soldar según el WPS y se volvió a probar; pruebas adicionales si la tasa de rechazo del soldador activa el criterio de la especificación.' }, prov: ufgs },
    { id: 'temp_welds_removed', item: 'Temporary welds, run-off tabs and backing removed and ground where the drawings require.', item_es: { status: 'translated', text: 'Soldaduras temporales, placas de extensión y respaldos retirados y esmerilados donde lo exigen los planos.' }, prov: ufgs },
    { id: 'field_touch_up', item: 'Field welds and damaged shop coat cleaned and primed; galvanizing damage repaired with zinc-rich paint.', item_es: { status: 'translated', text: 'Soldaduras de campo y pintura de taller dañada limpiadas y con primario; daños al galvanizado reparados con pintura rica en zinc.' }, prov: ufgs },
    { id: 'special_insp_reports', item: 'Special inspection reports for field welding submitted to the building official before the framing is covered.', item_es: { status: 'translated', text: 'Informes de inspección especial de soldadura de campo entregados a la autoridad antes de cubrir la estructura.' }, prov: icc },
    { id: 'hot_work_permit', item: 'Hot-work permit issued and posted before welding; combustibles moved or covered, extinguisher at the work, far side of walls and floors checked.', item_es: PENDING_ES, safety: true, prov: fire },
    { id: 'fire_watch_kept', item: 'Fire watch kept during hot work and for the permit time after; area checked and permit closed out.', item_es: PENDING_ES, safety: true, prov: fire },
  ],
  inspection_checklists: {
    framing: [
      { item: 'Approved WPSs and welder qualification records available on site', item_es: PENDING_ES, ref: 'IBC 2204.1' },
      { item: 'Visual weld inspection log covers all field welds', item_es: PENDING_ES, ref: 'IBC 1705.2.1' },
      { item: 'UT / MT / PT reports for the welds the drawings list, rejects repaired and retested', item_es: PENDING_ES, ref: 'IBC 1705.2.1' },
      { item: 'Special inspector’s report submitted; no open discrepancies before cover', item_es: PENDING_ES, ref: 'IBC 1704.2' },
    ],
  },
  assemblies: [
    { code: 'B-WLD-FILLET-LF', name: 'Field fillet weld 3/16–5/16 in., SMAW / FCAW, out of position, per LF', name_es: 'Soldadura de filete en campo 3/16–5/16 pulg., SMAW / FCAW, fuera de posición, por pie lineal', unit: 'LF', csi: '05 05 23',
      description: 'Weld only — fit-up and erection are carried by the steel trade.',
      material_cost_cents: { v: 120, prov: est('electrode/wire + gas + grinding discs per LF, national baseline 2026') }, labor_hours_per_unit: { v: 0.25, prov: est('field fillet, multi-pass above 1/4 in., incl. cleaning between passes') },
      equipment_cost_cents: { v: 150, prov: est('welding rig share per LF') }, waste_pct: { v: 10, prov: est('stub loss and spatter') } },
    { code: 'B-WLD-CJP-LF', name: 'Field CJP groove weld up to ~1 in. plate, with backing or backgouge, per LF', name_es: 'Soldadura de ranura CJP en campo hasta ~1 pulg. de placa, con respaldo o ranurado posterior, por pie lineal', unit: 'LF', csi: '05 05 23',
      description: 'Includes preheat, backing bar or backgouge and grinding; NDT is B-WLD-UT-EA.',
      material_cost_cents: { v: 600, prov: est('filler metal, gas, backing bar and run-off tabs per LF, 2026') }, labor_hours_per_unit: { v: 1, prov: est('preheat, root, fill and cap passes, backgouge or tab removal') },
      equipment_cost_cents: { v: 500, prov: est('welding rig + preheat torch / induction share') }, waste_pct: { v: 10, prov: est('stub loss and spatter') } },
    { code: 'B-WLD-RIG-HR', name: 'Mobile welder with truck-mounted welding rig, time and material, per hour', name_es: 'Soldador móvil con equipo de soldar montado en camión, por administración, por hora', unit: 'HR', csi: '05 05 00',
      material_cost_cents: { v: 300, prov: est('consumables per rig hour') }, labor_hours_per_unit: { v: 1, prov: est('one welder per rig hour') },
      equipment_cost_cents: { v: 3500, prov: est('engine-driven welder, truck and tools per hour') }, waste_pct: { v: 0, prov: est('time-based line') } },
    { code: 'B-WLD-UT-EA', name: 'Ultrasonic test of a field groove weld by testing agency, per joint', name_es: 'Prueba ultrasónica de soldadura de ranura en campo por laboratorio, por junta', unit: 'EA', csi: '01 45 33',
      description: 'Testing-agency fee carried as equipment; labor = crew giving access and cleaning the weld.',
      material_cost_cents: { v: 0, prov: est('service, no material') }, labor_hours_per_unit: { v: 0.25, prov: est('access, cleaning and standby per joint') },
      equipment_cost_cents: { v: 15000, prov: est('certified UT technician per joint incl. report, national baseline 2026') }, waste_pct: { v: 0, prov: est('service, no material') } },
    { code: 'B-WLD-FIREWATCH-HR', name: 'Hot-work fire watch with extinguisher, per hour', name_es: 'Vigilante contra incendios para trabajo en caliente con extintor, por hora', unit: 'HR', csi: '01 35 23',
      material_cost_cents: { v: 0, prov: est('no material') }, labor_hours_per_unit: { v: 1, prov: est('one dedicated fire watch per hour of hot work plus the post-work watch') },
      equipment_cost_cents: { v: 50, prov: est('extinguisher and welding blanket allowance per hour') }, waste_pct: { v: 0, prov: est('time-based line') } },
  ],
  quantity_rules: [
    { code: 'B-WLD-FILLET-LF', assumption: 'Allowance ≈1 LF of field fillet weld per 50 SF of floor area on a steel-framed building — replace with the weld map / connection count', when: { building_types: [...BIG] }, qty: { basis: 'area_sf_sum', mul: 0.02, round: 'ceil' } },
    { code: 'B-WLD-UT-EA', assumption: 'Allowance of 4 ultrasonic tests on CJP groove welds — set from the NDT schedule on the drawings', when: { building_types: [...BIG] }, qty: { basis: 'const', mul: 4 } },
    { code: 'B-WLD-FIREWATCH-HR', assumption: 'Allowance of 16 fire-watch hours (two days of field welding) — set from the welding schedule', when: { building_types: [...BIG] }, qty: { basis: 'const', mul: 16 } },
  ],
  dependency_hints: [
    { after_trades: ['structural_steel'], before_phase: 'insulation', note: 'Field welding follows steel erection and bolting; welds are inspected and tested before fireproofing, insulation and cover.' },
  ],
});
