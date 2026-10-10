// Trade Knowledge Pack — pipeline (Pipeline (Oil / Gas Transmission)).
// Wave 20, NEW-TRADE pattern: no hand recipe and no template tasks. heavy_civil → permit_trade null:
// no AHJ gates and no code_refs. Operator / PHMSA hold points (welding procedure + welder
// qualification, NDT of girth welds, coating holiday inspection, lowering-in, pressure test,
// as-built) live in descriptive inspection_checklists keys. Federal rules: 49 CFR 192 (gas) and
// 195 (hazardous liquid), verified on eCFR 2026-10-07. API 1104 / NACE are proprietary → cited by
// name only, no numbers. No public unit-price source → every cost is a platform-baseline estimate.
// No quantity_rules: building blueprints carry no pipeline facts.
// Dossier: docs/trade-packs/dossiers/pipeline.md.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const src = (id: string | string[], note?: string) => ({ src: Array.isArray(id) ? id : [id], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, extra: string[] = []) => src([`ecfr-1926-${sub}`, ...extra]);
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

const G192E = 'pipeline-ecfr-49-192-e';
const G192G = 'pipeline-ecfr-49-192-g';
const G192I = 'pipeline-ecfr-49-192-i';
const G192J = 'pipeline-ecfr-49-192-j';
const L195D = 'pipeline-ecfr-49-195-d';
const L195E = 'pipeline-ecfr-49-195-e';
const L195H = 'pipeline-ecfr-49-195-h';

export default definePack({
  key: 'pipeline',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Cross-country oil and gas transmission pipeline construction (49 CFR 192 / 195): clear and grade the right-of-way, dig the ditch, string, bend and weld the pipe, X-ray the welds, coat the joints, lower in and backfill to cover, then hydrotest, tie in and record as-builts — with the operator\'s inspectors accepting each hold point.',
    summary_es: 'Construcción de ductos de transmisión de petróleo y gas (49 CFR 192 / 195): desmontar y nivelar el derecho de vía, excavar la zanja, tender, doblar y soldar la tubería, radiografiar las soldaduras, recubrir juntas, bajar y rellenar, y luego prueba hidrostática, interconexiones y as-built, con aceptación del operador en cada punto.',
    glossary: [
      { term: 'Right-of-way (ROW)', term_es: 'Derecho de vía (DDV)', def: 'The strip of land the pipeline is built in, cleared and graded so the spread can work and travel along it.', def_es: 'La franja de terreno donde se construye el ducto, desmontada y nivelada para que la cuadrilla pueda trabajar y circular a lo largo.' },
      { term: 'Spread', term_es: 'Frente de obra (spread)', def: 'The whole moving construction crew and equipment train that builds one section of line, crew by crew.', def_es: 'Todo el tren de cuadrillas y equipo que avanza construyendo un tramo del ducto, una cuadrilla tras otra.' },
      { term: 'Stringing', term_es: 'Tendido de tubería', def: 'Hauling the pipe joints out and laying them end to end on skids alongside the ditch.', def_es: 'Acarrear los tramos de tubo y colocarlos uno tras otro sobre polines a lo largo de la zanja.' },
      { term: 'Girth weld', term_es: 'Soldadura circunferencial', def: 'The butt weld all the way around the pipe joining two joints together.', def_es: 'La soldadura a tope alrededor de todo el tubo que une dos tramos.' },
      { term: 'WPS / welder qualification', term_es: 'WPS / calificación de soldador', def: 'The written, tested welding procedure the operator approved, and the test each welder passed to weld under it.', def_es: 'El procedimiento de soldadura escrito y probado que aprobó el operador, y la prueba que cada soldador aprobó para soldar con él.' },
      { term: 'NDT / X-ray', term_es: 'END / radiografía', def: 'Nondestructive testing of the finished weld — usually radiography — read against the acceptance standard.', def_es: 'Ensayo no destructivo de la soldadura terminada — por lo general radiografía — evaluada contra el criterio de aceptación.' },
      { term: 'Field joint coating', term_es: 'Recubrimiento de junta de campo', def: 'Coating applied over the bare band at each girth weld after blasting, to match the mill coating.', def_es: 'Recubrimiento que se aplica sobre la franja desnuda de cada soldadura después de limpiar con chorro, para igualar el recubrimiento de fábrica.' },
      { term: 'Holiday (jeep) test', term_es: 'Prueba de holiday (jeep)', def: 'Running a high-voltage detector over the coating so it sparks at any pinhole or bare spot that must be repaired.', def_es: 'Pasar un detector de alto voltaje sobre el recubrimiento para que chispee en cualquier poro o punto desnudo que se debe reparar.' },
      { term: 'Lowering-in', term_es: 'Bajado de tubería', def: 'Lifting the welded, coated string with sidebooms and setting it in the bottom of the ditch.', def_es: 'Levantar la sarta soldada y recubierta con tiendetubos (sidebooms) y asentarla en el fondo de la zanja.' },
      { term: 'Hydrostatic test', term_es: 'Prueba hidrostática', def: 'Filling the finished line with water and holding it above operating pressure for a set time to prove strength and find leaks.', def_es: 'Llenar el ducto terminado con agua y mantenerlo por encima de la presión de operación durante un tiempo fijo para probar su resistencia y detectar fugas.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'mainline_spread',
      example_title: 'Mainline pipeline construction — ROW, ditch, weld, coat, lower-in and backfill',
      when: { title_re: '\\b(?:main\\s*line|mainline|pipeline|transmission\\s+line|gathering\\s+line|lateral)\\b(?![^—]*\\b(?:hydro|pressure\\s+test|tie-?in))|\\bright[-\\s]of[-\\s]way\\b|\\bROW\\b|\\blowering[-\\s]in\\b|\\bstring(?:ing)?\\s+(?:and|&)\\s+weld' },
      steps: [
        {
          title: 'Clear and grade the right-of-way and install erosion controls',
          instruction: 'Confirm one-call (811) tickets and expose and mark every foreign line crossing before equipment moves. Stake the ROW limits, then clear and grade only inside them, keeping topsoil segregated where the permits require it. Install silt fence, breakers and crossing mats before working near wetlands or streams.',
          tools: ['survey stakes and flagging', 'utility locator', 'one-call tickets'],
          materials: ['silt fence and erosion control devices', 'timber crossing mats'],
          safety_ids: ['equipment_struck_by', 'overhead_power_lines'],
        },
        {
          title: 'Dig the ditch to depth and protect the crew',
          instruction: 'Dig the ditch to the depth that gives the required cover over the pipe, with a smooth, rock-free bottom. Keep spoil at least 2 ft back from the edge. Nobody enters a ditch 5 ft or deeper unless it is sloped, benched, shored or shielded and a competent person has inspected it that day; put a ladder within 25 ft of anyone in a ditch 4 ft or deeper.',
          detail: 'Minimum cover (gas, 49 CFR 192.327): Class 1 — 30 in. normal soil / 18 in. rock; Class 2–4 and road or rail drainage ditches — 36 in. / 24 in. Liquids (195.248): 36 in. in populated areas and road/rail drainage ditches, 30 in. elsewhere (normal excavation), always below cultivation.',
          tools: ['excavator or wheel ditcher', 'grade rod or laser', 'trench box / shoring'],
          materials: ['ladders', 'sandbags or trench breakers'],
          safety_ids: ['trench_cave_in', 'trench_spoil_edge', 'equipment_struck_by'],
          qa_ids: ['ditch_depth_cover'],
        },
        {
          title: 'String, bend and line up the pipe',
          instruction: 'Unload and string the joints on padded skids along the ditch, chocked so they cannot roll. Look over every joint for dents, gouges, arc burns and coating damage before it is used, and set aside any that need repair. Make field bends smooth and buckle-free with the long seam near the neutral axis, then line up joints with a clamp so the bevels are clean and aligned for the root bead.',
          tools: ['pipe-handling equipment with vacuum lifter or padded hooks', 'bending machine and mandrel', 'internal or external line-up clamp', 'bevel gauge'],
          materials: ['padded skids and chocks', 'bevel protectors'],
          safety_ids: ['pipe_rolling', 'sideboom_load'],
          qa_ids: ['pipe_inspected_at_site', 'field_bends_smooth'],
        },
        {
          title: 'Weld the girth welds and X-ray them',
          instruction: 'Weld only to the qualified welding procedure, with welders qualified on it and current on the process. Clean the bevels, hold alignment through the root bead, preheat when the procedure calls for it, and shelter the weld from wind and rain. A qualified inspector visually checks every weld; radiograph the operator\'s selected welds (all of them at road, rail and river crossings and tie-ins) and cut out or repair rejected welds under a qualified repair procedure.',
          detail: 'Gas (192.243): at least 10% of each day\'s field butt welds in Class 1, 15% in Class 2, 100% in Class 3–4 and road/rail/major river crossings, 100% at tie-ins, plus a daily sample of each welder. Liquids (195.234): at least 10% of each welder\'s daily welds, 100% at water, road/rail and populated locations and tie-ins. Acceptance per API 1104 — its Appendix A may not accept cracks.',
          tools: ['engine-driven welding machines', 'preheat torches or induction coils', 'welding shelters', 'radiography crawler or source (licensed NDT crew)'],
          materials: ['electrodes / wire per the procedure', 'grinding discs', 'radiographic film or digital plates'],
          safety_ids: ['welding_fire', 'welding_fumes', 'radiation_exposure', 'equipment_struck_by'],
          qa_ids: ['wps_and_welder_qualified', 'weld_visual_inspected', 'ndt_percentage_met', 'weld_repairs_qualified'],
        },
        {
          title: 'Coat the field joints and holiday-test the string',
          instruction: 'Blast each weld band to the cleanliness and profile the coating maker specifies and apply the field joint coating within its weather and temperature window. Just before lowering-in, run the holiday detector over the whole string at the voltage the operator sets, mark every spark and repair it, and retest the repair.',
          tools: ['abrasive blast unit and compressor', 'coating application kit', 'holiday (jeep) detector', 'dry-film thickness gauge'],
          materials: ['field joint coating (FBE, liquid epoxy or shrink sleeve)', 'coating repair material', 'blast abrasive'],
          safety_ids: ['welding_fumes', 'equipment_struck_by'],
          qa_ids: ['field_joint_coating', 'holiday_test_before_lowering'],
        },
        {
          title: 'Lower in, pad and backfill to cover',
          instruction: 'Check the ditch bottom is clean of rocks and water and the string is holiday-free, then lower it in with sidebooms spaced so the pipe sits on the bottom without stress, keeping everyone out of the ditch and from under the pipe. Pad around the pipe with rock-free material, backfill so the pipe has firm support and the coating is not damaged, restore the crown, and record as-built locations of welds and crossings.',
          detail: '192.319 / 195.252: backfill provides firm support and keeps equipment and backfill material from damaging pipe or coating. On new gas transmission projects with 1,000 ft or more of continuous backfill, the operator runs a DCVG/ACVG coating survey within 6 months of in-service (192.319(d)).',
          tools: ['sidebooms with cradles or belts', 'padding machine', 'dozer', 'GPS rover for as-built shots'],
          materials: ['select padding / screened backfill', 'trench breakers', 'warning tape'],
          safety_ids: ['sideboom_load', 'trench_cave_in', 'overhead_power_lines', 'equipment_struck_by'],
          qa_ids: ['lowering_in_fit', 'backfill_padding', 'as_built_recorded'],
        },
      ],
    },
    {
      id: 'hydrotest_tie_in',
      priority: 1,
      example_title: 'Pipeline hydrostatic test and tie-in',
      when: { title_re: '\\bhydro(?:static)?[-\\s]?test|\\bpressure\\s+test|\\btie-?ins?\\b|\\bgolden\\s+weld' },
      steps: [
        {
          title: 'Prepare the test section and the test plan',
          instruction: 'Follow the operator\'s written test plan: section limits, test medium, test pressure and hold time, water source and discharge permits, and elevation profile. Install test heads rated above the test pressure, a calibrated deadweight or chart recorder, and pressure and temperature instruments. Clean and gauge the line with pigs before filling.',
          detail: 'Gas: 192.505 — lines to run at 30% SMYS or more are strength tested for at least 8 h; within 300 ft of an occupied building in Class 1/2 the test is hydrostatic to at least 125% of MOP. 192.507 — below 30% SMYS and 100 psig or more, at least 1 h. Liquids: 195.304 — at least 125% of MOP for 4 continuous hours (plus 4 h at 110% if not walked for leaks); water is the default medium (195.306).',
          tools: ['test heads and manifold', 'calibrated deadweight tester / chart recorder', 'fill and pressurizing pumps', 'cleaning and gauging pigs'],
          materials: ['test water', 'test head fittings'],
          safety_ids: ['test_stored_energy', 'equipment_struck_by'],
          qa_ids: ['test_record_complete'],
        },
        {
          title: 'Fill, pressurize and hold the test',
          instruction: 'Fill slowly and vent out the air, then raise pressure in stages to the test pressure. Clear and barricade the test area — nobody stands in front of test heads or near exposed pipe while it is above operating pressure. Hold for the required time, log pressure and temperature, and walk or patrol the line for leaks. Any drop not explained by temperature is a failure to find and fix.',
          tools: ['pressurizing pump', 'chart recorder', 'radios', 'barricades and signs'],
          materials: ['test logs and charts'],
          safety_ids: ['test_stored_energy'],
          qa_ids: ['test_pressure_and_duration', 'test_record_complete'],
        },
        {
          title: 'Dewater, dry and make the tie-ins',
          instruction: 'Depressurize in a controlled way, push the water out with pigs to the permitted discharge, and dry the line to the operator\'s dew point. For tie-ins to an existing line, follow the operator\'s isolation, purge and gas-monitoring procedure, test the excavation atmosphere before entry, keep fire watch and extinguishers ready, and weld only under the qualified procedure. X-ray every tie-in weld.',
          detail: 'Tie-in joints are excepted from the section test but non-welded joints are leak tested at operating pressure (192.503(d)); 100% NDT at tie-ins under 192.243(d)(4) and 195.234(g).',
          tools: ['dewatering pigs and launcher/receiver', 'gas detector (LEL / H2S / O2)', 'fire extinguishers', 'welding rig'],
          materials: ['tie-in fittings', 'field joint coating'],
          safety_ids: ['tie_in_atmosphere', 'welding_fire', 'trench_cave_in', 'radiation_exposure'],
          qa_ids: ['tie_in_welds_x_rayed', 'as_built_recorded'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'pipeline|mainline|main line|transmission line|gathering line|lateral|right[- ]of[- ]way|ROW|lowering' }, step_re: 'ditch', type: 'excavator', reason: 'Excavator (or wheel ditcher) to dig the ditch to cover depth.' },
    { when: { title_re: 'pipeline|mainline|main line|transmission line|gathering line|lateral|right[- ]of[- ]way|ROW|lowering' }, step_re: 'ditch', type: 'trencher', reason: 'Wheel ditcher for long runs in suitable soil.', optional: true },
    { when: { title_re: 'pipeline|mainline|main line|transmission line|gathering line|lateral|right[- ]of[- ]way|ROW|lowering' }, step_re: 'lower in', type: 'crane', reason: 'Sideboom tractors (sideboom cranes, 1926.1440) to lower the string into the ditch; no sideboom vocab type yet.' },
    { when: { title_re: 'pipeline|mainline|main line|transmission line|gathering line|lateral|right[- ]of[- ]way|ROW|lowering|tie-?in' }, step_re: 'weld|tie-ins', type: 'welder', reason: 'Engine-driven welding rigs for girth and tie-in welds.' },
    { when: { title_re: 'pipeline|mainline|main line|transmission line|gathering line|lateral|right[- ]of[- ]way|ROW|lowering' }, step_re: 'coat', type: 'air_compressor', reason: 'Compressor for abrasive blasting of the field joints.' },
  ],
  hazards: [
    { id: 'trench_cave_in', hazard: 'Cave-in of the pipeline ditch or bell holes while workers are inside for welding, coating repair, tie-ins or cleanup', hazard_es: PENDING_ES, controls: ['Slope, bench, shore or shield any ditch 5 ft or deeper before anyone enters', 'Competent person inspects the ditch daily, after rain and after any change in conditions', 'Keep sidebooms and other heavy loads back from the ditch wall'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, ppe: ['hard hat'], prov: osha('p') },
    { id: 'trench_spoil_edge', hazard: 'Spoil, rocks or equipment rolling into the ditch, or no quick way out of it', hazard_es: PENDING_ES, controls: ['Keep spoil and equipment at least 2 ft back from the edge or use retaining devices', 'Ladder or ramp within 25 ft of lateral travel in ditches 4 ft or deeper'], controls_es: PENDING_ES, osha_ref: '1926.651(j)(2)', severity: 3, ppe: ['hard hat'], prov: osha('p') },
    { id: 'sideboom_load', hazard: 'Struck or crushed by pipe swinging or dropping from sideboom tractors during handling and lowering-in, or a sideboom tipping over', hazard_es: PENDING_ES, controls: ['Operate sideboom cranes within their load ratings and the crane rules that apply to them; coordinate several sidebooms with one signal person', 'Nobody between the pipe and the ditch or under the suspended string; use tag lines', 'Inspect slings, belts and cradles before each shift'], controls_es: PENDING_ES, osha_ref: '1926.1440(a)', severity: 4, ppe: ['hard hat', 'gloves', 'safety-toe boots'], prov: osha('cc', ['pipeline-ecfr-1926-1440']) },
    { id: 'pipe_rolling', hazard: 'Pipe joints rolling off skids, stacks or trailers while unloading and stringing', hazard_es: PENDING_ES, controls: ['Chock and block every joint on skids and in stacks so it cannot roll or slide', 'Stand clear of the roll path when releasing binders or hooks'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 3, ppe: ['gloves', 'safety-toe boots'], prov: osha('h') },
    { id: 'equipment_struck_by', hazard: 'Struck or run over by dozers, excavators, pipe trucks and sidebooms working along a narrow right-of-way', hazard_es: PENDING_ES, controls: ['Working reverse alarms or a spotter on every machine with an obstructed rear view', 'Keep ground crews out of travel lanes; make eye contact with the operator before approaching'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 4, ppe: ['high-visibility apparel', 'hard hat'], prov: osha('o') },
    { id: 'overhead_power_lines', hazard: 'Sideboom, excavator boom or load contacting overhead power lines crossing the right-of-way', hazard_es: PENDING_ES, controls: ['Identify the work zone and every line the boom or load could get within 20 ft of before work starts', 'Use the clearance, de-energizing or encroachment-prevention option the crane rules require; post a dedicated spotter'], controls_es: PENDING_ES, osha_ref: '1926.1408(a)', severity: 4, prov: osha('cc') },
    { id: 'welding_fire', hazard: 'Fire from welding, cutting and preheat sparks in ROW brush or near flammable material, including hot tie-ins', hazard_es: PENDING_ES, controls: ['Clear or protect combustibles around the weld; keep a charged extinguisher at each welding station', 'Assign a fire watch during and after hot work where normal precautions are not enough'], controls_es: PENDING_ES, osha_ref: '1926.352(d)', severity: 3, ppe: ['FR clothing', 'welding hood and gloves'], prov: osha('j') },
    { id: 'welding_fumes', hazard: 'Welding fumes and fumes from burning through or heating coated pipe', hazard_es: PENDING_ES, controls: ['Test unknown coatings for flammability and strip them back from the heated area', 'Work upwind and use local exhaust or respirators where fumes cannot be kept out of the breathing zone'], controls_es: PENDING_ES, osha_ref: '1926.354(c)(2)', severity: 2, ppe: ['respirator where required', 'welding hood'], prov: osha('j') },
    { id: 'radiation_exposure', hazard: 'Exposure to ionizing radiation from radiographic sources or X-ray crawlers used to inspect girth welds', hazard_es: PENDING_ES, controls: ['Only licensed radiographers or competent persons under the licensee\'s supervision run the source', 'Rope off and post the exposure area; everyone else stays outside it until the radiographer clears it'], controls_es: PENDING_ES, osha_ref: '1926.53(b)', severity: 4, ppe: ['dosimeter (radiography crew)'], prov: osha('d') },
    { id: 'test_stored_energy', hazard: 'Sudden release of stored energy if a test head, fitting or pipe fails under hydrostatic or pneumatic test pressure', hazard_es: PENDING_ES, controls: ['Train the crew on the test plan and the hazards of stored pressure; restrict the area while pressure is above operating', 'Use test heads and fittings rated above the test pressure; never stand in front of test heads or tighten fittings under pressure', 'Depressurize in a controlled way before any repair'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 4, ppe: ['safety glasses', 'hard hat'], prov: osha('c', [G192J]) },
    { id: 'tie_in_atmosphere', hazard: 'Flammable gas, hydrogen sulfide or low oxygen in bell holes and ditches at tie-ins to existing lines', hazard_es: PENDING_ES, controls: ['Test the excavation atmosphere for oxygen, flammables and H2S before entry deeper than 4 ft and monitor continuously during the tie-in', 'Follow the operator\'s isolation and purge procedure; keep rescue equipment ready'], controls_es: PENDING_ES, osha_ref: '1926.651(g)(1)(i)', severity: 4, ppe: ['personal gas monitor', 'FR clothing'], prov: osha('p', ['ecfr-1926-d']) },
  ],
  qa_checklist: [
    { id: 'wps_and_welder_qualified', item: 'Welding procedure qualified and recorded, and each welder qualified on it and current on the process (used it within 6 months) before welding starts.', item_es: tr('Procedimiento de soldadura calificado y registrado, y cada soldador calificado en él y vigente en el proceso (usado en los últimos 6 meses) antes de empezar a soldar.'), prov: src([G192E, L195D], '192.225, 192.227, 192.229; 195.214, 195.222') },
    { id: 'pipe_inspected_at_site', item: 'Every joint visually inspected at the installation site; dents with gouges or arc burns, or over the depth limit, cut out as a cylinder — never patched or pounded out.', item_es: tr('Cada tramo inspeccionado visualmente en el sitio de instalación; abolladuras con rayones o quemaduras de arco, o que exceden la profundidad límite, se cortan como cilindro — nunca se parchan ni se enderezan a golpes.'), prov: src(G192G, '192.307, 192.309') },
    { id: 'field_bends_smooth', item: 'Field bends smooth, free of buckles and cracks, with the long seam near the neutral axis; no wrinkle bends on pipe run at 30% SMYS or more.', item_es: tr('Dobleces de campo lisos, sin pandeos ni grietas, con la costura longitudinal cerca del eje neutro; sin dobleces arrugados en tubería que opere al 30% del SMYS o más.'), prov: src(G192G, '192.313, 192.315') },
    { id: 'weld_visual_inspected', item: 'Every girth weld visually inspected by a qualified inspector and accepted against API 1104; cracks are never accepted under Appendix A.', item_es: tr('Cada soldadura circunferencial inspeccionada visualmente por un inspector calificado y aceptada contra API 1104; nunca se aceptan grietas bajo el Apéndice A.'), prov: src([G192E, L195D], '192.241, 195.228') },
    { id: 'ndt_percentage_met', item: 'Daily NDT met the required share of welds for the class location (100% at road, rail and river crossings and tie-ins) and included each welder\'s work; NDT log by station kept.', item_es: tr('El END diario cumplió el porcentaje requerido de soldaduras para la clase de localización (100% en cruces de caminos, vías férreas, ríos e interconexiones) e incluyó trabajo de cada soldador; bitácora de END por cadenamiento conservada.'), prov: src([G192E, L195D], '192.243(d)-(f), 195.234') },
    { id: 'weld_repairs_qualified', item: 'Rejected welds removed or repaired to sound metal under a qualified repair procedure and re-inspected; welds with a crack over 8% of the weld length cut out.', item_es: tr('Soldaduras rechazadas retiradas o reparadas hasta metal sano con un procedimiento de reparación calificado y reinspeccionadas; soldaduras con grieta mayor al 8% de su longitud se cortan.'), prov: src(G192E, '192.245') },
    { id: 'field_joint_coating', item: 'Field joints blasted to the specified cleanliness and profile and coated within the coating maker\'s temperature and humidity window; thickness checked.', item_es: tr('Juntas de campo limpiadas con chorro a la limpieza y perfil especificados y recubiertas dentro del rango de temperatura y humedad del fabricante; espesor verificado.'), prov: src(G192I, '192.461(a)') },
    { id: 'holiday_test_before_lowering', item: 'Whole string holiday-tested just before lowering-in; every holiday marked, repaired and retested.', item_es: tr('Toda la sarta probada contra holidays justo antes del bajado; cada falla marcada, reparada y vuelta a probar.'), prov: src([G192I, L195H], '192.461(c), 195.561') },
    { id: 'ditch_depth_cover', item: 'Ditch depth gives at least the minimum cover for the class location and crossing (e.g. gas Class 1: 30 in. soil / 18 in. rock; road/rail drainage ditches: 36 in.).', item_es: tr('La profundidad de zanja da al menos la cobertura mínima para la clase de localización y el cruce (p. ej. gas clase 1: 30 pulg en suelo / 18 pulg en roca; cunetas de caminos y vías férreas: 36 pulg).'), prov: src([G192G, L195D], '192.327(a), 195.248(a)') },
    { id: 'lowering_in_fit', item: 'Ditch bottom free of rocks and debris; pipe lowered so it fits the ditch without added stress and rests on the bottom, with no coating damage from cradles or supports.', item_es: tr('Fondo de zanja libre de piedras y escombros; tubo bajado de forma que se ajuste a la zanja sin esfuerzos adicionales y descanse en el fondo, sin daño al recubrimiento por cunas o soportes.'), prov: src([G192G, G192I, L195D], '192.319(a), 192.461(d), 195.246(a)') },
    { id: 'backfill_padding', item: 'Padding and backfill give firm support under the pipe and keep rocks and equipment off the pipe and coating; crown restored.', item_es: tr('El acolchado y el relleno dan apoyo firme bajo el tubo y mantienen las piedras y el equipo lejos del tubo y del recubrimiento; corona restituida.'), prov: src([G192G, L195D], '192.319(b), 195.252') },
    { id: 'test_pressure_and_duration', item: 'Test held at or above the required pressure for the full required time (gas ≥30% SMYS: 8 h; liquids: 125% MOP for 4 h) with no unexplained pressure loss and no leaks.', item_es: PENDING_ES, safety: true, prov: src([G192J, L195E], '192.505(c), 195.304') },
    { id: 'test_record_complete', item: 'Test record complete: who tested, medium, pressure, duration, charts, instrument calibration data, elevation profile, temperature and any leaks or failures with their disposition.', item_es: tr('Registro de prueba completo: quién la hizo, medio, presión, duración, gráficas, datos de calibración de instrumentos, perfil de elevación, temperatura y cualquier fuga o falla con su resolución.'), prov: src([G192J, L195E], '192.517(a), 195.310') },
    { id: 'tie_in_welds_x_rayed', item: 'Every tie-in girth weld nondestructively tested over its full circumference; non-welded tie-in joints leak tested at operating pressure.', item_es: tr('Cada soldadura de interconexión con ensayo no destructivo en toda su circunferencia; uniones de interconexión no soldadas probadas contra fugas a la presión de operación.'), prov: src([G192E, G192J, L195D], '192.243(d)(4), 192.503(d), 195.234(g)') },
    { id: 'as_built_recorded', item: 'As-built survey records weld numbers, NDT results, crossings, depth of cover and fittings by station.', item_es: tr('El levantamiento as-built registra números de soldadura, resultados de END, cruces, profundidad de cobertura y accesorios por cadenamiento.'), prov: src(G192E, '192.243(f) record by milepost/station') },
  ],
  inspection_checklists: {
    welding_qualification: [
      { item: 'Qualified welding procedure (WPS) on site with its qualifying test record', item_es: tr('Procedimiento de soldadura calificado (WPS) en la obra con el registro de su prueba de calificación'), ref: '49 CFR 192.225 / 195.214' },
      { item: 'Each welder\'s qualification record matches the procedure, process and position', item_es: tr('El registro de calificación de cada soldador coincide con el procedimiento, proceso y posición'), ref: '49 CFR 192.227 / 195.222' },
      { item: 'Welders current on the process (within the 6-month limit)', item_es: tr('Soldadores vigentes en el proceso (dentro del límite de 6 meses)'), ref: '49 CFR 192.229 / 195.222(b)' },
      { item: 'Weather shelters and preheat equipment available', item_es: tr('Refugios contra el clima y equipo de precalentamiento disponibles'), ref: '49 CFR 192.231' },
    ],
    weld_ndt_radiography: [
      { item: 'Written NDT procedure and qualified technicians; radiation area roped off and posted', item_es: PENDING_ES, ref: '49 CFR 192.243(b) / 195.234(b)' },
      { item: 'Day\'s weld count and NDT count meet the required percentage for the location', item_es: tr('El conteo diario de soldaduras y de END cumple el porcentaje requerido para la localización'), ref: '49 CFR 192.243(d) / 195.234(d)-(e)' },
      { item: 'Each welder\'s work sampled that day', item_es: tr('Se muestreó el trabajo de cada soldador ese día'), ref: '49 CFR 192.243(e)' },
      { item: 'Rejects logged with disposition (repair or cut-out) and repairs re-shot', item_es: tr('Rechazos registrados con su resolución (reparación o corte) y reparaciones radiografiadas de nuevo'), ref: '49 CFR 192.245' },
    ],
    coating_holiday_test: [
      { item: 'Field joints blasted and coated per the coating procedure; thickness readings logged', item_es: tr('Juntas de campo limpiadas con chorro y recubiertas según el procedimiento; lecturas de espesor registradas'), ref: '49 CFR 192.461(a)' },
      { item: 'Holiday detector voltage set and checked as the operator requires', item_es: tr('Voltaje del detector de holidays ajustado y verificado según lo requiere el operador') },
      { item: 'Full string jeeped just before lowering-in; holidays repaired and retested', item_es: tr('Toda la sarta probada con jeep justo antes del bajado; holidays reparados y vueltos a probar'), ref: '49 CFR 192.461(c) / 195.561' },
    ],
    lowering_in_inspection: [
      { item: 'Ditch at depth for required cover, bottom clean and dewatered', item_es: tr('Zanja a la profundidad para la cobertura requerida, fondo limpio y sin agua'), ref: '49 CFR 192.327 / 195.248' },
      { item: 'Sideboom spacing and lift plan reviewed; nobody in the ditch or under the string', item_es: PENDING_ES },
      { item: 'Pipe fits the ditch without stress; coating undamaged after lowering', item_es: tr('El tubo se ajusta a la zanja sin esfuerzos; recubrimiento sin daño después del bajado'), ref: '49 CFR 192.319(a) / 195.246' },
      { item: 'Padding placed before general backfill; depth of cover confirmed', item_es: tr('Acolchado colocado antes del relleno general; profundidad de cobertura confirmada'), ref: '49 CFR 192.319(b) / 195.252' },
    ],
    hydrostatic_pressure_test: [
      { item: 'Written test plan approved: section limits, medium, test pressure, hold time, discharge permit', item_es: tr('Plan de prueba escrito aprobado: límites de la sección, medio, presión de prueba, tiempo de sostenimiento, permiso de descarga'), ref: '49 CFR 192.503 / 195.302' },
      { item: 'Test area cleared and barricaded while above operating pressure', item_es: PENDING_ES },
      { item: 'Required pressure held for the full duration with no unexplained loss', item_es: tr('Presión requerida sostenida durante todo el tiempo sin pérdidas sin explicación'), ref: '49 CFR 192.505 / 192.507 / 195.304' },
      { item: 'Charts, calibration data and test record signed and filed', item_es: tr('Gráficas, datos de calibración y registro de prueba firmados y archivados'), ref: '49 CFR 192.517 / 195.310' },
    ],
    tie_in_and_as_built: [
      { item: 'Isolation, purge and atmosphere-testing procedure followed at tie-ins to live lines', item_es: PENDING_ES },
      { item: 'All tie-in welds 100% NDT and coated', item_es: tr('Todas las soldaduras de interconexión con 100% de END y recubiertas'), ref: '49 CFR 192.243(d)(4) / 195.234(g)' },
      { item: 'As-built survey of welds, crossings, fittings and cover submitted', item_es: tr('Levantamiento as-built de soldaduras, cruces, accesorios y cobertura entregado') },
    ],
  },
  assemblies: [
    { code: 'HC-PIPE-ROW-CLEAR-AC', name: 'Pipeline right-of-way clearing, grading and erosion controls, per acre', name_es: 'Desmonte, nivelación y control de erosión del derecho de vía del ducto, por acre', unit: 'AC', csi: '31 10 00',
      material_cost_cents: { v: 60000, prov: est('silt fence, breakers and mats spread over the acre; no public unit-price source') },
      labor_hours_per_unit: { v: 30, prov: est('clearing + grading crew hours per acre of open-country ROW') },
      equipment_cost_cents: { v: 550000, prov: est('dozers, excavator with thumb, mulcher/chipper share per acre') },
      waste_pct: { v: 0, prov: est('area item') } },
    { code: 'HC-PIPE-DITCH-LF', name: 'Pipeline ditch excavation for 24-inch pipe at 36-inch cover, normal soil, per LF', name_es: 'Excavación de zanja para tubo de 24 pulg con cobertura de 36 pulg, suelo normal, por pie lineal', unit: 'LF', csi: '31 23 16',
      material_cost_cents: { v: 0, prov: est('excavation only') },
      labor_hours_per_unit: { v: 0.06, prov: est('operator + grade checker; ≈0.8 CY/LF ditch') },
      equipment_cost_cents: { v: 700, prov: est('excavator or wheel ditcher hourly cost spread over production') },
      waste_pct: { v: 0, prov: est('excavation only') } },
    { code: 'HC-PIPE-STRING-WELD-24-LF', name: 'String, bend, line up and weld 24-inch steel line pipe (owner-furnished pipe), per LF', name_es: 'Tender, doblar, alinear y soldar tubería de acero de 24 pulg (tubería suministrada por el dueño), por pie lineal', unit: 'LF', csi: '33 52 13',
      material_cost_cents: { v: 300, prov: est('welding consumables, bevel protectors, skids; line pipe excluded (usually owner-furnished)') },
      labor_hours_per_unit: { v: 0.3, prov: est('stringing, bending and welding crews\' share of a mainline spread') },
      equipment_cost_cents: { v: 1500, prov: est('pipe trucks, bending machine, sidebooms, welding rigs') },
      waste_pct: { v: 2, prov: est('cut-outs and pup losses') } },
    { code: 'HC-PIPE-FJC-24-EA', name: 'Field joint coating, 24-inch girth weld — blast, coat and holiday test, per joint', name_es: 'Recubrimiento de junta de campo, soldadura de 24 pulg — chorro, recubrimiento y prueba de holiday, por junta', unit: 'EA', csi: '09 96 00',
      material_cost_cents: { v: 15000, prov: est('liquid epoxy or shrink sleeve kit plus abrasive') },
      labor_hours_per_unit: { v: 1.5, prov: est('blaster + coater per joint') },
      equipment_cost_cents: { v: 4000, prov: est('blast rig, compressor, holiday detector share') },
      waste_pct: { v: 5, prov: est('mixed-coating pot life losses') } },
    { code: 'HC-PIPE-XRAY-WELD-EA', name: 'Radiographic inspection of a girth weld (NDT crew), per weld', name_es: 'Inspección radiográfica de una soldadura circunferencial (cuadrilla de END), por soldadura', unit: 'EA', csi: '01 45 23',
      material_cost_cents: { v: 2000, prov: est('film or digital plate and processing per shot') },
      labor_hours_per_unit: { v: 1, prov: est('two-person radiography crew, ≈30 min per weld') },
      equipment_cost_cents: { v: 9000, prov: est('crawler / source and truck per weld') },
      waste_pct: { v: 0, prov: est('service item') } },
    { code: 'HC-PIPE-HYDROTEST-LF', name: 'Hydrostatic test of pipeline section — fill, test, dewater and dry, per LF', name_es: 'Prueba hidrostática de un tramo de ducto — llenado, prueba, desagüe y secado, por pie lineal', unit: 'LF', csi: '33 52 13',
      material_cost_cents: { v: 50, prov: est('test water and fittings spread over the section') },
      labor_hours_per_unit: { v: 0.02, prov: est('test crew hours over a multi-mile section') },
      equipment_cost_cents: { v: 250, prov: est('pumps, test heads, pigs, recorder') },
      waste_pct: { v: 0, prov: est('service item') } },
    { code: 'HC-PIPE-PAD-BACKFILL-LF', name: 'Lower-in, pad and backfill 24-inch pipeline, per LF', name_es: 'Bajado, acolchado y relleno de ducto de 24 pulg, por pie lineal', unit: 'LF', csi: '31 23 23',
      material_cost_cents: { v: 0, prov: est('native spoil screened by padding machine; imported padding priced separately') },
      labor_hours_per_unit: { v: 0.05, prov: est('lowering-in and backfill crews\' share') },
      equipment_cost_cents: { v: 600, prov: est('sidebooms, padding machine and dozer') },
      waste_pct: { v: 0, prov: est('earthwork') } },
  ],
  dependency_hints: [
    { after_trades: ['surveying', 'utility_locating', 'erosion_control'], note: 'ROW staking, foreign-line locates and perimeter erosion controls come before clearing and ditching.' },
    { after_trades: ['directional_drilling'], note: 'HDD crossings are pulled and tested before the mainline tie-ins on either side.' },
  ],
});
