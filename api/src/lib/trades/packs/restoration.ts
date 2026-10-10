// Trade Knowledge Pack — restoration (Restoration (Water / Fire / Storm Damage)). Wave 05, NEW-TRADE
// pattern: no hand recipe exists, so the pack's three recipes (water mitigation & structural drying,
// fire/smoke cleanup & board-up, storm tarp & board-up) produce the work steps. Scope = the EMERGENCY
// mitigation / tear-out / drying phase only; the rebuild belongs to `remodeling`.
// permit_trade null → NO gates, NO code_refs. Hold points live in inspection_checklists
// (moisture_mapping, drying_goal_verified, final_walkthrough). No quantity rules: blueprint facts carry
// no damage extent (affected SF, wet LF, openings broken) — the estimator enters those.
// IICRC S500/S700/S520 are cited by CONCEPT ONLY (category/class, drying goal, residue type) — no
// numbers or text. Numbers/practices come from EPA (mold guides, Table 1), FEMA 234, OSHA disaster
// cleanup fact sheets, NIOSH (CO) and 29 CFR 1926.
// Dossier: docs/trade-packs/dossiers/restoration.md.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const v = (src: string[], note?: string) => ({ src, confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const der = (src: string[], note: string) => ({ src, confidence: 'derived' as const, last_verified: D, note });
const osha = (sub: string, extra: string[] = [], note?: string) => v([`ecfr-1926-${sub}`, ...extra], note);
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

const EPA_C = 'restoration-epa-mold-commercial';
const EPA_B = 'restoration-epa-mold-brief';
const FEMA = 'restoration-fema-234';
const FS3698 = 'restoration-osha-fs3698';
const FS3713 = 'restoration-osha-fs3713';
const FS3276 = 'restoration-osha-fs3276';
const FS3286 = 'restoration-osha-fs3286';

export default definePack({
  key: 'restoration',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Emergency damage mitigation after water, fire or storm losses: make the building safe, stop further damage (extraction, tarps, board-up), tear out what cannot be saved, clean, and dry the structure to a documented goal with moisture logs and photos for the insurer. The rebuild that follows is remodeling.',
    summary_es: 'Mitigación de emergencia después de daños por agua, fuego o tormenta: hacer seguro el edificio, detener más daño (extracción, lonas, tapiado), retirar lo que no se puede salvar, limpiar y secar la estructura hasta una meta documentada con registros de humedad y fotos para la aseguradora. La reconstrucción posterior corresponde a remodelación.',
    glossary: [
      { term: 'Water category', term_es: 'Categoría del agua', def: 'How dirty the water is: clean (supply line), grey (appliance or toilet overflow without waste) or black (sewage, floodwater) — it decides what must be thrown out.', def_es: 'Qué tan sucia está el agua: limpia (línea de suministro), gris (derrame de aparato o inodoro sin desechos) o negra (aguas negras, inundación); decide qué se debe desechar.' },
      { term: 'Water class', term_es: 'Clase del daño por agua', def: 'How much area and what kinds of materials got wet — it sizes the drying equipment.', def_es: 'Cuánta área y qué tipo de materiales se mojaron; sirve para dimensionar el equipo de secado.' },
      { term: 'Dry standard', term_es: 'Estándar de secado (referencia seca)', def: 'A moisture reading taken on the same kind of material in an unaffected part of the building; the target the wet material must reach.', def_es: 'Una lectura de humedad tomada en el mismo tipo de material en una parte no afectada del edificio; es la meta que debe alcanzar el material mojado.' },
      { term: 'Moisture map', term_es: 'Mapa de humedad', def: 'A sketch of the rooms with numbered reading points and their daily meter readings until everything is dry.', def_es: 'Un croquis de los cuartos con puntos de lectura numerados y sus lecturas diarias del medidor hasta que todo esté seco.' },
      { term: 'Flood cut', term_es: 'Corte de inundación', def: 'A straight horizontal cut through wet drywall above the wet line so the lower part, wet insulation and the wall cavity can be removed and dried.', def_es: 'Un corte horizontal recto en el tablaroca mojado arriba de la línea de humedad para retirar la parte baja, el aislamiento mojado y secar la cavidad del muro.' },
      { term: 'Air mover', term_es: 'Ventilador de secado (air mover)', def: 'A low, high-speed fan aimed across wet surfaces to pull moisture into the air so the dehumidifier can remove it.', def_es: 'Un ventilador bajo de alta velocidad dirigido sobre superficies mojadas para pasar la humedad al aire y que el deshumidificador la retire.' },
      { term: 'LGR dehumidifier', term_es: 'Deshumidificador LGR', def: 'Low-grain refrigerant dehumidifier that keeps pulling water from the air even when the air is already fairly dry.', def_es: 'Deshumidificador refrigerante de bajo grano que sigue sacando agua del aire aun cuando el aire ya está bastante seco.' },
      { term: 'Antimicrobial', term_es: 'Antimicrobiano', def: 'A registered product applied after cleaning where dirty water or growth was present; it never replaces removing contaminated material.', def_es: 'Un producto registrado que se aplica después de limpiar donde hubo agua sucia o crecimiento; nunca sustituye retirar el material contaminado.' },
      { term: 'Board-up', term_es: 'Tapiado', def: 'Plywood screwed over broken windows and doors to keep weather and intruders out until repairs.', def_es: 'Triplay atornillado sobre ventanas y puertas rotas para impedir la entrada del clima y de intrusos hasta la reparación.' },
      { term: 'Pack-out', term_es: 'Empaque y retiro de contenidos (pack-out)', def: 'Listing, photographing, packing and moving the owner’s belongings out of the work area for cleaning or storage.', def_es: 'Listar, fotografiar, empacar y sacar las pertenencias del dueño del área de trabajo para limpieza o almacenaje.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'water_mitigation_drying',
      priority: 1,
      example_title: 'Water damage mitigation & structural drying',
      when: { title_re: '\\bwater\\b|flood|sewage|leak|structural drying|dry[- ]?out|extraction|mitigation' },
      steps: [
        {
          title: 'Make it safe and stop the water',
          instruction: 'Stop or isolate the source (shut the supply valve, tarp the roof, pump-out only after the ground water has dropped). If wiring or outlets were under water, shut the power off at the panel or meter, lock and tag it, and keep it off until an electrician checks it. Look for sagging ceilings and soft floors and brace or keep out. On older homes, find out about asbestos and lead before anything is torn out.',
          detail: 'Drain a sagging wet ceiling from a safe spot with a small hole and a bucket — never stand under it.',
          tools: ['flashlight', 'non-contact voltage tester', 'lockout tags', 'shoring posts or 4x4s'],
          materials: ['plastic sheeting', 'buckets'],
          safety_ids: ['electrical_shock', 'structural_collapse', 'asbestos_disturb', 'lead_paint'],
          qa_ids: ['source_stopped', 'utilities_safe', 'hazmat_survey'],
        },
        {
          title: 'Document, classify and map the moisture',
          instruction: 'Photograph every room before touching anything. Record where the water came from, its category (clean / grey / black) and how much of the building and which materials are wet. Draw a moisture map with numbered reading points on floors, walls and cabinets, and take a dry-standard reading on the same materials in an unaffected room.',
          tools: ['pin moisture meter', 'pinless moisture meter', 'thermo-hygrometer', 'camera or phone', 'thermal camera (optional)'],
          materials: ['moisture map / drying log form'],
          safety_ids: ['contaminated_water', 'mold_spores'],
          qa_ids: ['moisture_map_daily', 'dry_standard_set', 'insurance_docs'],
        },
        {
          title: 'Extract the water and move the contents',
          instruction: 'Pull standing water with an extractor or pump, then extract carpet and pad. List, photograph and move contents out of the wet rooms (or up on blocks); set aside discarded items and a sample of each flooring for the adjuster. Run cords from GFCI-protected outlets and keep connections off the wet floor.',
          tools: ['water extractor or wet vac', 'submersible pump (electric)', 'hand truck', 'furniture blocks'],
          materials: ['contents boxes and wrap', 'GFCI cords', 'contractor bags'],
          safety_ids: ['contaminated_water', 'manual_lifting', 'co_engines'],
          qa_ids: ['contents_inventory', 'insurance_docs'],
        },
        {
          title: 'Remove what cannot be dried or cleaned',
          instruction: 'Decide removal by the water category and the material. After sewage or floodwater, remove soaked drywall, insulation, carpet and pad, and bag them. After clean water, drywall may be dried in place only if it is not swollen and the seams are tight; ceiling tile and wet insulation are always replaced. Make a straight flood cut above the highest wet reading. Set up poly containment and HEPA air filtration where mold is visible over a small patch.',
          detail: 'Mist moldy material lightly before removing it to keep spores down; bag and seal it inside the work area.',
          tools: ['oscillating tool or drywall saw', 'chalk line', 'pry bar', 'HEPA vacuum', 'HEPA air scrubber'],
          materials: ['6-mil poly', 'zipper doors', 'contractor bags', 'duct tape'],
          safety_ids: ['contaminated_water', 'mold_spores', 'asbestos_disturb', 'lead_paint', 'sharp_debris'],
          qa_ids: ['porous_removed_by_category', 'flood_cut_height', 'containment_hepa'],
        },
        {
          title: 'Clean, treat and set the drying equipment',
          instruction: 'Clean exposed framing and hard surfaces with detergent and water; apply an antimicrobial per its label only where dirty water or growth was present. Open wall cavities and cabinet toe kicks, then set air movers across wet surfaces and dehumidifiers sized to the room, with the doors and windows closed. Keep every gas pump, generator and pressure-washer power unit outside, away from doors, windows and vents. Do not run the HVAC if the ducts took water.',
          tools: ['air movers', 'LGR dehumidifiers', 'pump sprayer', 'scrub brushes'],
          materials: ['detergent', 'EPA-registered antimicrobial (where needed)', 'GFCI cords'],
          safety_ids: ['co_engines', 'contaminated_water'],
          qa_ids: ['antimicrobial_where_needed', 'no_engines_indoors', 'hvac_not_run'],
        },
        {
          title: 'Monitor daily and verify the drying goal',
          instruction: 'Read every point on the moisture map at least once a day, log temperature and humidity inside and outside, and move or add equipment where readings are not dropping. Pull equipment only when every affected material reads at or near its dry standard. Hand the final readings and photos to the owner and the rebuild contractor.',
          tools: ['pin moisture meter', 'pinless moisture meter', 'thermo-hygrometer'],
          materials: ['drying log'],
          safety_ids: ['heat_stress'],
          qa_ids: ['moisture_map_daily', 'drying_goal_before_rebuild', 'insurance_docs'],
        },
      ],
    },
    {
      id: 'fire_smoke_cleanup',
      priority: 2,
      example_title: 'Fire/smoke damage cleanup & board-up',
      when: { title_re: '\\bfire\\b|smoke|soot' },
      steps: [
        {
          title: 'Get clearance and secure the building',
          instruction: 'Enter only after the fire department releases the site. Have a competent person check the framing, floors and roof for collapse risk and brace or keep out. Confirm power and gas are off. Board up broken windows and doors and tarp roof openings so weather and intruders stay out.',
          tools: ['flashlight', 'non-contact voltage tester', 'circular saw', 'drill/driver'],
          materials: ['1/2 in. or thicker plywood', '2x4 battens', 'exterior screws', 'tarps'],
          safety_ids: ['structural_collapse', 'electrical_shock', 'sharp_debris', 'roof_fall'],
          qa_ids: ['utilities_safe', 'openings_secured'],
        },
        {
          title: 'Document and survey before tear-out',
          instruction: 'Photograph every room and list the contents room by room. On older homes, sample suspect asbestos materials and test painted surfaces for lead before cutting, scraping or demolishing anything. Note which areas got wet from firefighting water.',
          tools: ['camera or phone', 'moisture meter'],
          materials: ['contents inventory sheets', 'sample bags'],
          safety_ids: ['asbestos_disturb', 'lead_paint', 'fire_debris'],
          qa_ids: ['insurance_docs', 'contents_inventory', 'hazmat_survey'],
        },
        {
          title: 'Remove charred and unsalvageable material',
          instruction: 'Tear out charred framing coverings, insulation, drywall, carpet and anything that cannot be cleaned, working from the least to the most damaged areas. Bag fine ash and debris, wet it lightly to keep dust down, and haul it out. Wear respirators and disposable coveralls the whole time.',
          tools: ['pry bar', 'flat shovel', 'HEPA vacuum', 'wheelbarrow'],
          materials: ['contractor bags', 'disposable coveralls', 'dumpster'],
          safety_ids: ['fire_debris', 'sharp_debris', 'manual_lifting', 'structural_collapse'],
          qa_ids: ['porous_removed_by_category'],
        },
        {
          title: 'Clean soot and smoke residue',
          instruction: 'HEPA-vacuum loose soot first without smearing it, then clean each surface by its residue type (dry, oily or protein) per the cleaning product label. Isolate the area with poly and run HEPA air filtration. Keep the HVAC off until its ducts and coil are cleaned. Odor control comes after the residue is gone.',
          tools: ['HEPA vacuum', 'HEPA air scrubber', 'dry-cleaning sponges', 'sprayer'],
          materials: ['6-mil poly', 'residue-specific cleaners', 'disposable coveralls'],
          safety_ids: ['fire_debris', 'co_engines'],
          qa_ids: ['containment_hepa', 'hvac_not_run', 'no_engines_indoors'],
        },
        {
          title: 'Dry the firefighting water and verify',
          instruction: 'Treat areas soaked by hose water as a water job: extract, set air movers and dehumidifiers, map moisture daily, and do not release the building for rebuild until the readings reach the dry standard.',
          tools: ['air movers', 'LGR dehumidifiers', 'pin moisture meter'],
          materials: ['drying log'],
          safety_ids: ['mold_spores'],
          qa_ids: ['moisture_map_daily', 'drying_goal_before_rebuild'],
        },
      ],
    },
    {
      id: 'storm_tarp_boardup',
      example_title: 'Storm damage tarp & board-up',
      when: { title_re: 'storm|wind|hail|hurricane|tornado|tarp|board[- ]?up|tree (on|through)' },
      steps: [
        {
          title: 'Size up the hazards before you go up',
          instruction: 'Walk the outside first: treat every downed line as live and stay well clear, smell for gas, look for trees or limbs still resting on the roof and for cracked or sagging framing. Do not go on the roof in high wind, lightning or ice. Call the utility for lines and an arborist for trees on the structure.',
          tools: ['binoculars', 'flashlight'],
          materials: ['caution tape'],
          safety_ids: ['electrical_shock', 'structural_collapse', 'heat_stress'],
          qa_ids: ['utilities_safe'],
        },
        {
          title: 'Tarp the damaged roof',
          instruction: 'With fall protection in place, run the tarp from the eave up over the ridge so water sheds over it, extend it past the damage on every side, and fasten it through wood battens (not just nails through the tarp) into the roof framing. Wrap batten ends so wind cannot get under the edge.',
          tools: ['harness and roof anchor', 'ladder', 'drill/driver', 'circular saw'],
          materials: ['reinforced poly tarp', '2x4 or 1x4 battens', 'exterior screws or cap nails'],
          safety_ids: ['roof_fall', 'sharp_debris'],
          qa_ids: ['openings_secured', 'insurance_docs'],
        },
        {
          title: 'Board up broken windows and doors',
          instruction: 'Clear loose glass, then cut plywood to overlap the opening and screw it to the framing, not the trim or sash. Leave one secure entry the owner can use. Photograph each opening before and after.',
          tools: ['circular saw', 'drill/driver', 'tape measure', 'cut-resistant gloves'],
          materials: ['plywood', 'exterior screws', '2x4 cleats where needed'],
          safety_ids: ['sharp_debris', 'manual_lifting'],
          qa_ids: ['openings_secured', 'insurance_docs'],
        },
        {
          title: 'Stop interior water and start drying',
          instruction: 'Extract any water that got in, move contents away from wet areas, and start a moisture map. If drywall, insulation or flooring is wet, continue with the water mitigation and drying steps. Run generators only outdoors, away from openings.',
          tools: ['wet vac', 'moisture meter', 'air movers', 'dehumidifiers'],
          materials: ['contractor bags', 'GFCI cords'],
          safety_ids: ['co_engines', 'contaminated_water'],
          qa_ids: ['source_stopped', 'moisture_map_daily', 'no_engines_indoors'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'storm|hurricane|tornado|flood|fire|water|board[- ]?up|tarp' }, type: 'generator', reason: 'Power drying equipment when utility power is off — run it OUTDOORS only, away from doors, windows and vents (CO)', optional: true },
    { when: { title_re: 'fire|storm|flood|tear[- ]?out|demo' }, type: 'dump_truck', reason: 'Haul wet or burned tear-out debris and storm debris', optional: true },
  ],
  hazards: [
    { id: 'electrical_shock', hazard: 'Electric shock from wiring, outlets or appliances that were under water, downed service lines, or drying-equipment cords on wet floors', hazard_es: PENDING_ES, controls: ['Shut power off at the panel or meter before entering water; lock and tag it out', 'Keep power off until a qualified electrician checks every circuit that was wet', 'Treat downed lines as live and stay clear; call the utility', 'Run drying equipment from GFCI-protected outlets or cords and keep connections off wet floors'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k', [FS3276, FS3698, FS3286], '1926.417 lockout/tagging of de-energized circuits; GFCI for temporary receptacles per 1926.404(b)(1)(ii).') },
    { id: 'contaminated_water', hazard: 'Infection from sewage and floodwater (bacteria, viruses) through cuts, splashes and hand-to-mouth contact', hazard_es: PENDING_ES, controls: ['Assume floodwater is contaminated until shown otherwise', 'Wear waterproof boots, rubber gloves, eye protection and protective clothing; cover cuts', 'Wash hands before eating; keep tetanus shots current and ask the employer about hepatitis B vaccination for sewage work'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['waterproof steel-toe boots', 'rubber gloves', 'goggles', 'disposable coveralls'], prov: osha('e', [FS3698, EPA_C], 'Tetanus within 10 years per OSHA FS-3698; hepatitis B as an employer/occupational-health discussion, not a pack rule.') },
    { id: 'mold_spores', hazard: 'Breathing mold spores and fragments while removing wet, moldy drywall, insulation and carpet', hazard_es: PENDING_ES, controls: ['N95 respirator at minimum; P100 half- or full-face where mold is heavy or dust is high', 'Mist material before removal, bag and seal it inside the work area, HEPA-vacuum after drying', 'Isolate larger areas with poly and seal duct openings'], controls_es: PENDING_ES, osha_ref: '1926.103', severity: 3, ppe: ['N95 or P100 respirator', 'non-vented goggles', 'long gloves'], prov: osha('e', [FS3713, EPA_C], '1926.103 adopts 1910.134 (respirator program, fit testing).') },
    { id: 'asbestos_disturb', hazard: 'Releasing asbestos fibers when tearing out old drywall compound, plaster, flooring, pipe or duct insulation', hazard_es: PENDING_ES, controls: ['Find out if suspect materials contain asbestos before tear-out on older buildings', 'Stop and call a licensed abatement contractor if suspect material is found'], controls_es: PENDING_ES, osha_ref: '1926.1101(k)(1)', severity: 4, prov: osha('z', [FS3698]) },
    { id: 'lead_paint', hazard: 'Lead dust from cutting, sanding or demolishing painted surfaces in pre-1978 homes', hazard_es: PENDING_ES, controls: ['Test painted surfaces or presume lead on pre-1978 homes; use lead-safe work practices', 'Mist and contain, HEPA-vacuum, no dry sweeping; wash before eating'], controls_es: PENDING_ES, osha_ref: '1926.62(d)', severity: 3, prov: osha('d', ['painting-epa-rrp']) },
    { id: 'co_engines', hazard: 'Carbon monoxide poisoning from gas pumps, generators or pressure-washer engines run inside or near openings', hazard_es: PENDING_ES, controls: ['Never run gasoline engines indoors, in basements, crawl spaces or garages — open windows do not make it safe', 'Place power units outside, away from doors, windows and vents; use electric pumps inside', 'Put a battery CO detector in the work area; get to fresh air at headache or dizziness'], controls_es: PENDING_ES, osha_ref: '1926.57(a)', severity: 4, prov: osha('d', ['restoration-niosh-co', FS3286]) },
    { id: 'structural_collapse', hazard: 'Collapse of water-loaded ceilings, burned framing or storm-damaged floors and roofs', hazard_es: PENDING_ES, controls: ['Have a competent person check the structure before work; shore or brace damaged walls and floors', 'Drain sagging ceilings from the side, never from underneath', 'Keep out of areas that have not been checked'], controls_es: PENDING_ES, osha_ref: '1926.850(b)', severity: 4, ppe: ['hard hat'], prov: osha('t', [FS3276, FEMA]) },
    { id: 'fire_debris', hazard: 'Breathing ash, soot and toxic residue from burned plastics, wiring and building materials', hazard_es: PENDING_ES, controls: ['Wear a respirator (P100 or as the hazard assessment requires), goggles and disposable coveralls', 'Wet debris lightly, HEPA-vacuum, and never dry-sweep ash', 'Wash up and change before leaving the site'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 3, ppe: ['P100 respirator', 'goggles', 'disposable coveralls'], prov: osha('d', ['restoration-osha-wildfires']) },
    { id: 'roof_fall', hazard: 'Falling from a storm- or fire-damaged roof while tarping', hazard_es: PENDING_ES, controls: ['Use personal fall arrest or another fall protection system at 6 ft or more', 'Stay off the roof in wind, lightning or ice; avoid weakened decking'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(13)', severity: 4, ppe: ['harness and lanyard'], prov: osha('m', [FS3698]) },
    { id: 'heat_stress', hazard: 'Heat illness working in closed, hot, humid drying zones and on summer storm jobs', hazard_es: PENDING_ES, controls: ['Provide water, shade and rest breaks; rotate workers out of drying zones', 'Train the crew to spot heat illness and act fast'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: { ...osha('c', [FS3276]), confidence: 'derived', note: 'No construction heat standard; employer must train workers to recognize and avoid unsafe conditions.' } },
    { id: 'manual_lifting', hazard: 'Back strain moving water-heavy drywall, carpet, pad and contents', hazard_es: PENDING_ES, controls: ['Cut wet carpet and drywall into small pieces; use carts and team lifts', 'Keep single-person lifts around 50 lb or less'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, prov: { ...osha('c', [FS3276]), confidence: 'derived', note: 'No construction ergonomics standard; 50 lb per person from OSHA FS-3276.' } },
    { id: 'sharp_debris', hazard: 'Cuts and punctures from broken glass, nails in torn-out material and carpet tack strip', hazard_es: PENDING_ES, controls: ['Keep work areas and paths cleared of debris with nails', 'Wear puncture-resistant boots and cut-resistant gloves'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, ppe: ['cut-resistant gloves', 'puncture-resistant boots'], prov: osha('c', [FEMA]) },
  ],
  qa_checklist: [
    { id: 'source_stopped', phase: 'site_prep', item: 'Source of water stopped or controlled on the first visit; the water category (clean / grey / black) and how much and which materials are wet recorded on the job file.', item_es: tr('Fuente del agua detenida o controlada en la primera visita; la categoría del agua (limpia / gris / negra) y cuánto y qué materiales están mojados anotados en el expediente.'), prov: der([EPA_C, 'restoration-iicrc-s500'], 'Fix-the-source-first from EPA; category/class concept from IICRC S500 (reference only).') },
    { id: 'utilities_safe', phase: 'site_prep', item: 'Power off and locked out wherever wiring got wet; gas checked; nothing re-energized until an electrician has checked it.', item_es: PENDING_ES, safety: true, prov: v([FS3276, 'ecfr-1926-k']) },
    { id: 'hazmat_survey', phase: 'site_prep', item: 'On older buildings, asbestos and lead status known (survey, test or presumed) before any tear-out.', item_es: PENDING_ES, safety: true, prov: v(['ecfr-1926-z', 'ecfr-1926-d', 'painting-epa-rrp']) },
    { id: 'moisture_map_daily', phase: 'site_prep', item: 'Moisture map with numbered points made on day one; every point read and logged at least daily with inside/outside temperature and humidity.', item_es: tr('Mapa de humedad con puntos numerados hecho el primer día; cada punto leído y registrado al menos diario con temperatura y humedad interior y exterior.'), prov: der([EPA_C, FEMA, 'restoration-iicrc-s500'], 'Daily monitoring is the industry norm (IICRC concept); humidity monitoring per FEMA 234.') },
    { id: 'dry_standard_set', phase: 'site_prep', item: 'Dry-standard reading taken on each wet material type in an unaffected area of the same building and written on the map.', item_es: tr('Lectura de referencia seca tomada en cada tipo de material mojado en un área no afectada del mismo edificio y anotada en el mapa.'), prov: der(['restoration-iicrc-s500'], 'Concept from IICRC S500 (reference only); no target numbers stored.') },
    { id: 'porous_removed_by_category', phase: 'site_prep', item: 'After sewage or floodwater, soaked drywall, insulation, carpet and pad removed; after clean water, drywall kept only if not swollen with seams intact; wet insulation and ceiling tile always replaced.', item_es: tr('Después de aguas negras o inundación se retiró el tablaroca, aislamiento, alfombra y bajoalfombra empapados; con agua limpia el tablaroca se conserva solo si no está hinchado y las juntas siguen firmes; el aislamiento mojado y el plafón siempre se reemplazan.'), prov: v([EPA_C, FEMA, FS3713]) },
    { id: 'flood_cut_height', phase: 'site_prep', item: 'Flood cut straight and level, above the highest wet reading; wall cavity open and wet insulation out.', item_es: tr('Corte de inundación recto y nivelado, arriba de la lectura húmeda más alta; cavidad del muro abierta y aislamiento mojado retirado.'), prov: der([FEMA], 'FEMA 234 removes the lower 4 ft of wallboard (all of it if water rose above 4 ft) after floodwater.') },
    { id: 'containment_hepa', phase: 'site_prep', item: 'Where mold is visible beyond a small patch (or soot is being cleaned), the area is isolated with poly, ducts sealed, HEPA filtration running, and HEPA-vacuumed after drying.', item_es: tr('Donde hay moho visible más allá de una mancha pequeña (o se limpia hollín), el área está aislada con plástico, ductos sellados, filtración HEPA funcionando y aspirado HEPA después del secado.'), prov: v([FS3713, EPA_C, EPA_B]) },
    { id: 'antimicrobial_where_needed', phase: 'site_prep', item: 'Antimicrobial used per its label only after cleaning and only where dirty water or growth was present — never instead of removing contaminated material.', item_es: tr('El antimicrobiano se aplica según su etiqueta solo después de limpiar y solo donde hubo agua sucia o crecimiento; nunca en lugar de retirar el material contaminado.'), prov: v([EPA_C], 'EPA: biocide is not a routine step; clean the mold off, do not just kill it.') },
    { id: 'no_engines_indoors', phase: 'site_prep', item: 'No gasoline pump, generator or pressure-washer engine inside the building or near doors, windows or vents; battery CO detector in the work area.', item_es: PENDING_ES, safety: true, prov: v(['restoration-niosh-co', FS3286, FS3698]) },
    { id: 'hvac_not_run', phase: 'site_prep', item: 'HVAC left off if ducts took water, soot or mold until the ducts and coil are cleaned.', item_es: tr('El sistema de aire se deja apagado si los ductos recibieron agua, hollín o moho hasta que ductos y serpentín estén limpios.'), prov: v([EPA_B, FEMA]) },
    { id: 'drying_goal_before_rebuild', phase: 'site_prep', item: 'Every affected material reads at or near its dry standard before equipment is pulled; rebuild does not start until the final readings are logged.', item_es: tr('Cada material afectado lee igual o cerca de su referencia seca antes de retirar el equipo; la reconstrucción no empieza hasta registrar las lecturas finales.'), prov: der([FEMA, 'restoration-iicrc-s500'], 'FEMA 234: do not rebuild until the home is completely dry; dry-standard goal concept from IICRC S500.') },
    { id: 'insurance_docs', phase: 'site_prep', item: 'Before / during / after photos, daily moisture logs and daily equipment counts kept; discarded items photographed and listed, with a sample of each flooring kept for the adjuster.', item_es: tr('Fotos de antes, durante y después, registros diarios de humedad y conteo diario de equipos conservados; artículos desechados fotografiados y listados, guardando una muestra de cada piso para el ajustador.'), prov: v([FEMA]) },
    { id: 'contents_inventory', phase: 'site_prep', item: 'Contents moved or packed out are listed and photographed room by room; owner signs the list.', item_es: tr('Los contenidos movidos o empacados se listan y fotografían cuarto por cuarto; el dueño firma la lista.'), prov: est('Common restoration contractor practice; FEMA 234 asks owners to photograph and list losses.') },
    { id: 'openings_secured', phase: 'site_prep', item: 'Tarps run over the ridge and fastened through battens into framing; board-up screwed to framing; no openings left for rain or entry.', item_es: tr('Lonas pasadas sobre la cumbrera y fijadas con listones a la estructura; tapiado atornillado a la estructura; sin aberturas para lluvia o acceso.'), prov: der([FEMA], 'FEMA 234 Step 2: cover holes with boards, tarps or plastic fastened with wood strips.') },
  ],
  inspection_checklists: {
    initial_safety_assessment: [
      { item: 'Power off and locked out where wiring got wet; downed lines reported to the utility', item_es: PENDING_ES, ref: '29 CFR 1926.416 / 1926.417' },
      { item: 'Structure checked by a competent person; damaged floors, ceilings and walls braced or closed off', item_es: PENDING_ES, ref: '29 CFR 1926.850(b)' },
      { item: 'Asbestos / lead status known before tear-out on older buildings', item_es: PENDING_ES, ref: '29 CFR 1926.1101 / 1926.62' },
      { item: 'No fuel-burning engines planned inside; CO detector on site', item_es: PENDING_ES, ref: 'NIOSH CO' },
    ],
    moisture_mapping: [
      { item: 'Source stopped; category and extent of wet materials recorded', item_es: tr('Fuente detenida; categoría y extensión de materiales mojados anotadas') },
      { item: 'Moisture map drawn with numbered points on floors, walls and cabinets', item_es: tr('Mapa de humedad dibujado con puntos numerados en pisos, muros y gabinetes') },
      { item: 'Dry-standard readings taken on unaffected like materials', item_es: tr('Lecturas de referencia seca tomadas en materiales iguales no afectados') },
      { item: 'Photos of every affected room before work starts', item_es: tr('Fotos de cada cuarto afectado antes de empezar el trabajo') },
    ],
    drying_goal_verified: [
      { item: 'All map points read at or near their dry standard on the final visit', item_es: tr('Todos los puntos del mapa leen igual o cerca de su referencia seca en la visita final') },
      { item: 'No visible mold, mold-damaged material or musty odor left', item_es: tr('Sin moho visible, material dañado por moho ni olor a humedad'), ref: 'EPA 402-K-01-001' },
      { item: 'Wall cavities, subfloor and framing checked behind removed finishes', item_es: tr('Cavidades de muros, subpiso y estructura revisados detrás de los acabados retirados') },
      { item: 'Final drying log, equipment days and photos filed for the insurer and the rebuild contractor', item_es: tr('Registro final de secado, días de equipo y fotos archivados para la aseguradora y el contratista de reconstrucción') },
    ],
    final_walkthrough: [
      { item: 'All drying equipment, containment and debris removed; area HEPA-vacuumed', item_es: tr('Todo el equipo de secado, la contención y los escombros retirados; área aspirada con HEPA') },
      { item: 'Tarps and board-up secure for the time until rebuild', item_es: tr('Lonas y tapiado firmes para el tiempo hasta la reconstrucción') },
      { item: 'Utilities restored only after the electrician (and gas utility, if needed) cleared them', item_es: PENDING_ES },
      { item: 'Owner received the contents list, drying log and scope of what must be rebuilt', item_es: tr('El dueño recibió la lista de contenidos, el registro de secado y el alcance de lo que se debe reconstruir') },
    ],
  },
  assemblies: [
    { code: 'G-RST-EXTRACT-SF', name: 'Water extraction — standing water and carpet/pad, per SF', name_es: 'Extracción de agua — agua estancada y alfombra/bajoalfombra, por pie²', unit: 'SF', csi: '02 41',
      material_cost_cents: { v: 0, prov: est('No consumables beyond equipment') },
      labor_hours_per_unit: { v: 0.005, prov: est('Portable or truck-mount extraction, ~200 SF/hr per technician') },
      equipment_cost_cents: { v: 5, prov: est('Extractor day-rate share per SF') },
      waste_pct: { v: 0, prov: est('Area-based service, no waste') } },
    { code: 'G-RST-AIRMOVER-DAY', name: 'Air mover — set, monitor and move, per unit-day', name_es: 'Ventilador de secado — colocar, monitorear y mover, por unidad-día', unit: 'DAY', csi: '02 41',
      material_cost_cents: { v: 0, prov: est('No consumables') },
      labor_hours_per_unit: { v: 0.05, prov: est('Share of the daily monitoring visit per unit') },
      equipment_cost_cents: { v: 2500, prov: est('Typical restoration air-mover day rate, 2026 baseline') },
      waste_pct: { v: 0, prov: est('Counted per day') } },
    { code: 'G-RST-DEHU-DAY', name: 'LGR dehumidifier — set, monitor and empty, per unit-day', name_es: 'Deshumidificador LGR — colocar, monitorear y vaciar, por unidad-día', unit: 'DAY', csi: '02 41',
      material_cost_cents: { v: 0, prov: est('No consumables') },
      labor_hours_per_unit: { v: 0.1, prov: est('Share of the daily monitoring visit, drain hose and filter checks') },
      equipment_cost_cents: { v: 9000, prov: est('Large LGR dehumidifier day rate, 2026 baseline') },
      waste_pct: { v: 0, prov: est('Counted per day') } },
    { code: 'G-RST-FLOODCUT-LF', name: 'Flood cut — remove lower wet drywall and insulation, bag, per LF of wall', name_es: 'Corte de inundación — retirar tablaroca e aislamiento mojados de la parte baja y embolsar, por pie lineal de muro', unit: 'LF', csi: '02 41',
      material_cost_cents: { v: 40, prov: est('Contractor bags and blade wear per LF') },
      labor_hours_per_unit: { v: 0.1, prov: est('Snap line, cut, pull drywall and insulation, remove fasteners, bag — ~10 LF/hr one side up to ~4 ft') },
      equipment_cost_cents: { v: 0, prov: est('Hand and power tools') },
      waste_pct: { v: 0, prov: est('Removal scope; disposal priced separately') } },
    { code: 'G-RST-BOARDUP-EA', name: 'Emergency board-up of a window or door opening, each', name_es: 'Tapiado de emergencia de una ventana o puerta, c/u', unit: 'EA', csi: '02 41',
      material_cost_cents: { v: 6000, prov: est('One sheet of exterior plywood, cleats and screws, 2026 baseline') },
      labor_hours_per_unit: { v: 0.75, prov: est('Clear glass, measure, cut and screw to framing') },
      equipment_cost_cents: { v: 0, prov: est('Hand and power tools') },
      waste_pct: { v: 10, prov: est('Plywood offcuts') } },
    { code: 'G-RST-TARP-SF', name: 'Emergency roof tarp with battens, per SF covered', name_es: 'Lona de emergencia en techo con listones, por pie² cubierto', unit: 'SF', csi: '02 41',
      material_cost_cents: { v: 35, prov: est('Reinforced poly tarp, wood battens and fasteners, 2026 baseline') },
      labor_hours_per_unit: { v: 0.01, prov: est('Two-person crew with fall protection, ~100 SF/hr crew') },
      equipment_cost_cents: { v: 0, prov: est('Ladder and fall protection owned') },
      waste_pct: { v: 15, prov: est('Tarp overlap past the damage and over the ridge') } },
  ],
  dependency_hints: [
    { before_phase: 'drywall', note: 'Mitigation and verified drying come first; rebuild (remodeling) starts only after the drying goal is logged.' },
  ],
});
