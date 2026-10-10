// Trade Knowledge Pack — environmental_remediation (Environmental Remediation (Soil / Groundwater / UST)).
// Wave 19 — NEW-TRADE pattern (no hand recipe). Dossier: docs/trade-packs/dossiers/environmental_remediation.md.
// Sources: 40 CFR 280 Subparts F/G (UST release response + closure), 40 CFR 261.4(b)(10) + Part 262
// (waste status / manifests), 29 CFR 1926.65 HAZWOPER (Subpart D) + Subparts P (excavation), AA (confined
// space), F (fire), H (rigging), WI ATCP 93.560–93.585 (DATCP tank closure), WI NR 700 series (DNR
// remediation: NR 706, 718, 726) and NR 141 (monitoring wells).
//
// heavy_civil → permit_trade null: no gating inspections, no code refs. Regulator hold points (closure
// notice, closure inspection, closure site assessment, manifests, confirmation samples, case closure)
// live in inspection_checklists under descriptive keys.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const ust = { src: ['environmental_remediation-ecfr-40-280g', 'environmental_remediation-wi-atcp93'], confidence: 'verified' as const, last_verified: D };
const release = { src: ['environmental_remediation-ecfr-40-280f', 'environmental_remediation-wi-atcp93', 'environmental_remediation-wi-nr706'], confidence: 'verified' as const, last_verified: D };
const waste = { src: ['environmental_remediation-ecfr-40-261-4', 'environmental_remediation-ecfr-40-262', 'environmental_remediation-wi-nr718'], confidence: 'verified' as const, last_verified: D };
const nr700 = { src: ['environmental_remediation-wi-nr700', 'environmental_remediation-wi-nr726'], confidence: 'verified' as const, last_verified: D };
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'environmental_remediation',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Removes leaking or retired underground storage tanks (UST) and cleans up contaminated soil and groundwater under state and EPA oversight — tank closure with notices and certified removers, field-screened excavation, profiled disposal with manifests, confirmation sampling, monitoring wells, and a regulator closure letter at the end.',
    summary_es: 'Retira tanques de almacenamiento subterráneo (UST) con fugas o fuera de servicio y limpia suelo y agua subterránea contaminados bajo supervisión estatal y de la EPA — cierre del tanque con avisos y removedores certificados, excavación con monitoreo en campo, disposición con perfil y manifiestos, muestreo de confirmación, pozos de monitoreo y una carta de cierre del regulador al final.',
    glossary: [
      { term: 'UST', term_es: 'Tanque subterráneo (UST)', def: 'Underground storage tank and its piping — gasoline, diesel, heating oil or a hazardous liquid, mostly or fully buried.', def_es: 'Tanque de almacenamiento subterráneo y su tubería — gasolina, diésel, aceite de calefacción o un líquido peligroso, enterrado total o casi totalmente.' },
      { term: 'Permanent closure', term_es: 'Cierre permanente', def: 'Taking a tank out of service for good: empty and clean it, then remove it (normal) or, with approval, fill it in place with inert solid.', def_es: 'Sacar un tanque de servicio definitivamente: vaciarlo y limpiarlo, y luego retirarlo (lo normal) o, con aprobación, rellenarlo en su lugar con sólido inerte.' },
      { term: 'Inerting', term_es: 'Inertización', def: 'Pushing the flammable vapor out of an empty tank (dry ice, nitrogen or per the closure standard) so it cannot ignite while it is cut or lifted.', def_es: 'Desplazar el vapor inflamable de un tanque vacío (hielo seco, nitrógeno o según la norma de cierre) para que no se encienda al cortarlo o levantarlo.' },
      { term: 'LEL', term_es: 'LIE (límite inferior de explosividad)', def: 'Lower explosive limit — the lowest vapor level that can burn. The meter reads it as a percent of LEL.', def_es: 'Límite inferior de explosividad — el nivel más bajo de vapor que puede arder. El medidor lo muestra como porcentaje del LIE.' },
      { term: 'PID screening', term_es: 'Monitoreo con PID', def: 'Field check of soil vapors with a photoionization detector to tell clean soil from contaminated soil as you dig.', def_es: 'Revisión en campo de los vapores del suelo con un detector de fotoionización para separar suelo limpio de suelo contaminado al excavar.' },
      { term: 'Confirmation sample', term_es: 'Muestra de confirmación', def: 'Soil sample from the floor and walls of the dig, sent to a certified lab, to show the cleanup reached its limits.', def_es: 'Muestra de suelo del fondo y las paredes de la excavación, enviada a un laboratorio certificado, que demuestra que la limpieza llegó a sus límites.' },
      { term: 'Waste profile / manifest', term_es: 'Perfil de residuo / manifiesto', def: 'Landfill approval paperwork for the soil and the shipping paper that follows each load; hazardous waste uses the EPA uniform manifest.', def_es: 'Documentos de aprobación del relleno sanitario para el suelo y el papel de embarque que acompaña cada carga; los residuos peligrosos usan el manifiesto uniforme de la EPA.' },
      { term: 'Exclusion zone', term_es: 'Zona de exclusión', def: 'The marked contaminated work area; only trained people in the right PPE go in, and leave through decontamination.', def_es: 'El área de trabajo contaminada y marcada; solo entra personal capacitado con el EPP correcto y sale por la descontaminación.' },
      { term: 'Monitoring well', term_es: 'Pozo de monitoreo', def: 'Small cased well with a screen and seal used to sample groundwater and measure its level over time.', def_es: 'Pozo pequeño con ademe, rejilla y sello que se usa para muestrear el agua subterránea y medir su nivel con el tiempo.' },
      { term: 'Case closure', term_es: 'Cierre del caso', def: 'The regulator’s letter that the cleanup is done; it may carry continuing obligations such as a cap or groundwater use limits.', def_es: 'La carta del regulador que da por terminada la limpieza; puede incluir obligaciones continuas como una cubierta o límites al uso del agua subterránea.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'ust_removal_closure',
      example_title: 'UST removal and closure — 4,000 gal gasoline tank',
      when: { title_re: '\\bUSTs?\\b|underground (?:storage|fuel|oil|heating oil) tank|\\btank (?:pull|removal|closure)\\b|heating oil tank' },
      priority: 10,
      steps: [
        {
          title: 'File the closure notice and line up certified people',
          instruction: 'Confirm the owner has filed the closure notice with the tank regulator and the lead time is met (Wisconsin: DATCP form TR-WM-121 at least 5 business days ahead; federal default is 30 days). Book the certified tank remover and the certified tank-system inspector. Write the site health and safety plan, call in utility locates, and plan where the tank, piping and any dirty soil will go.',
          detail: 'Closing in place (filling with inert solid) needs written department approval for a listed reason such as undermining a building; otherwise the tank and piping come out.',
          tools: ['tablet or clipboard', 'site map'],
          materials: ['closure notice copy', 'certifications', 'site health and safety plan', 'utility locate ticket'],
          safety_ids: ['utility_strike', 'hazwoper_training'],
          qa_ids: ['closure_notice_filed', 'certified_crew', 'hasp_on_site'],
        },
        {
          title: 'Empty, clean and inert the tank',
          instruction: 'Pump out all product and sludge with a vacuum truck and keep the waste paperwork. Bond and ground hoses and equipment, keep ignition sources and smoking away, and run the LEL meter at the fill and vent openings. Inert or vent the tank by the closure standard named in the plan until the meter shows it is safe to cut or lift. Do not enter the tank — clean it from outside.',
          detail: 'The UST rule points to API RP 1604, API Std 2015 / RP 2016 and NFPA 326 for cleaning and closure methods; follow the one in the plan.',
          tools: ['vacuum truck', 'LEL / oxygen meter', 'bonding and grounding cables', 'non-sparking hand tools'],
          materials: ['dry ice or nitrogen if specified', 'drums for residue', 'absorbent pads'],
          safety_ids: ['flammable_vapor_ignition', 'tank_entry', 'vapor_exposure'],
          qa_ids: ['lel_logged', 'tank_emptied_cleaned'],
        },
        {
          title: 'Dig out and lift the tank and piping',
          instruction: 'Excavate around the tank with a cave-in protective system or proper slopes, keep spoil and equipment at least 2 ft back from the edge, and test the air before anyone enters a dig over 4 ft. Screen the soil with the PID as it comes out; keep clean and dirty soil in separate piles on and under plastic. Rig the tank with inspected slings, lift it out, and chock it on site. Leave the basin and trenches open and the tank on site until the inspector releases them.',
          tools: ['excavator', 'PID meter', 'LEL / oxygen meter', 'inspected slings and shackles'],
          materials: ['6-mil poly for stockpiles', 'wheel chocks or cribbing', 'caution tape'],
          safety_ids: ['cave_in', 'excavation_atmosphere', 'spoil_edge', 'rigging_struck', 'equipment_edge'],
          qa_ids: ['soil_segregated_screened', 'basin_open_until_inspection'],
        },
        {
          title: 'Closure inspection and site assessment samples',
          instruction: 'With the inspector on site, show the tank, piping and open basin. Have the environmental consultant take the closure site-assessment samples where a release is most likely — under the tank ends, under fill pipes and dispensers, along the piping run — and log the PID readings. The certified remover fills out the closure assessment report for the inspector. Tag, clean and send the tank for scrap.',
          tools: ['PID meter', 'sampling tools', 'camera'],
          materials: ['lab sample jars and coolers', 'chain-of-custody forms', 'closure assessment report form'],
          safety_ids: ['vapor_exposure', 'cave_in'],
          qa_ids: ['closure_samples_taken'],
        },
        {
          title: 'Report any release, then backfill and file',
          instruction: 'If soil is stained, smells, or there is free product, stop and have the owner report the release to the state right away (Wisconsin DNR immediately; federal rule within 24 hours) — cleanup then runs under corrective action. Backfill with clean fill in compacted lifts only after the inspector approves. Make sure the revised tank registration and closure report are filed (Wisconsin: within 21 business days) and keep the assessment results at least 3 years.',
          tools: ['excavator', 'plate compactor'],
          materials: ['clean granular fill', 'closure report copies'],
          safety_ids: ['cave_in', 'equipment_edge'],
          qa_ids: ['release_reported', 'closure_records_filed'],
        },
      ],
    },
    {
      id: 'contaminated_soil_excavation',
      example_title: 'Contaminated soil excavation and disposal — former tank basin',
      when: { title_re: 'contaminated soil|impacted soil|soil remediation|remedial excavation|source removal|petroleum[- ]impacted|soil (?:excavation and )?disposal' },
      priority: 10,
      steps: [
        {
          title: 'Set site control and the safety plan',
          instruction: 'Walk the approved remedial work plan and the site safety plan with the crew. Mark the exclusion zone, decontamination area and clean support zone; set the buddy system and emergency contacts. Everyone working in the dirty zone needs current HAZWOPER training and medical clearance. Take air readings at first entry to pick the right PPE.',
          tools: ['PID meter', 'LEL / oxygen meter', 'barricades and signs'],
          materials: ['remedial work plan', 'site safety plan', 'decon station supplies'],
          safety_ids: ['hazwoper_training', 'vapor_exposure', 'decon_spread'],
          qa_ids: ['hasp_on_site'],
        },
        {
          title: 'Excavate to the approved limits with field screening',
          instruction: 'Dig to the limits shown on the plan, guided by the consultant’s PID readings. Use a protective system or slopes, keep spoil 2 ft back, and test the air in deep cuts. Load contaminated soil straight to trucks or stockpile it on and under plastic; keep clean overburden separate. Pump any water in the hole to tanks for testing — never to the street or a storm drain.',
          tools: ['excavator', 'PID meter', 'trash pump'],
          materials: ['6-mil poly', 'frac tank or poly tank for water'],
          safety_ids: ['cave_in', 'excavation_atmosphere', 'spoil_edge', 'water_in_excavation', 'equipment_edge'],
          qa_ids: ['soil_segregated_screened', 'water_contained'],
        },
        {
          title: 'Load, document and haul each truck',
          instruction: 'Ship only to the facility that approved the waste profile. Tarp every load, brush or wash tires at the exit, and send the right paper with each truck — a bill of lading or the landfill’s form for non-hazardous petroleum soil, the EPA uniform manifest for hazardous waste. Collect weigh tickets and signed copies for every load.',
          tools: ['excavator or loader', 'pressure washer or brushes'],
          materials: ['waste profile approval', 'manifests or bills of lading', 'truck tarps'],
          safety_ids: ['decon_spread', 'equipment_edge'],
          qa_ids: ['loads_manifested'],
        },
        {
          title: 'Take confirmation samples',
          instruction: 'When the PID says the dig is clean, the consultant samples the floor and each sidewall at the spacing in the work plan, labels the jars, and ships them on ice to a certified lab under chain of custody. Hold the excavation open until results meet the cleanup standard or the plan says to dig further.',
          tools: ['sampling trowels', 'PID meter', 'GPS or tape for locations'],
          materials: ['lab jars and coolers', 'chain-of-custody forms'],
          safety_ids: ['cave_in', 'vapor_exposure'],
          qa_ids: ['confirmation_samples_lab'],
        },
        {
          title: 'Backfill and hand over the records',
          instruction: 'Backfill with documented clean fill in compacted lifts, restore the surface, and decontaminate equipment before it leaves. Give the consultant the weigh tickets, manifests, sample maps and photos for the remedial action report and the case closure request.',
          tools: ['excavator', 'plate compactor', 'pressure washer'],
          materials: ['clean fill with source documentation'],
          safety_ids: ['decon_spread', 'cave_in'],
          qa_ids: ['records_to_consultant'],
        },
      ],
    },
    {
      id: 'groundwater_monitoring_well',
      example_title: 'Install groundwater monitoring wells MW-1 to MW-4',
      when: { title_re: 'monitoring wells?|\\bMW-\\d|groundwater (?:well|sampling)' },
      priority: 10,
      steps: [
        {
          title: 'Locate wells and clear utilities',
          instruction: 'Stake the well locations from the consultant’s investigation plan, call in utility locates, and hand-clear or vacuum the top few feet at each spot. Set up a drill area with the cuttings drums and decon pad.',
          tools: ['utility locate ticket', 'hand auger or vacuum excavator'],
          materials: ['drums for cuttings', 'poly sheeting'],
          safety_ids: ['utility_strike', 'hazwoper_training'],
          qa_ids: ['hasp_on_site'],
        },
        {
          title: 'Drill, log and build the well',
          instruction: 'Drill to the planned depth while the consultant logs the soil and PID readings. Set the screen and casing, place the filter sand around the screen, then the seal and grout by tremie as the state well rule requires. Finish with a locking cap and flush-mount or stick-up cover.',
          tools: ['drill rig', 'PID meter', 'tremie pipe'],
          materials: ['well screen and riser casing', 'filter sand', 'bentonite seal', 'grout', 'locking cap and cover'],
          safety_ids: ['vapor_exposure', 'decon_spread'],
          qa_ids: ['well_built_to_rule'],
        },
        {
          title: 'Develop, survey and record the well',
          instruction: 'Develop each well until the water runs clear, contain the purge water in drums, and survey the top of casing. Turn in the boring log and well construction form, and keep the cuttings and water drums labeled until test results set their disposal.',
          tools: ['development pump or bailer', 'water level meter', 'survey level'],
          materials: ['labeled drums', 'well construction and development forms'],
          safety_ids: ['decon_spread'],
          qa_ids: ['records_to_consultant'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: '\\bUSTs?\\b|underground (?:storage|fuel|oil|heating oil) tank|tank (?:pull|removal|closure)|heating oil tank|contaminated soil|impacted soil|soil remediation|remedial excavation|source removal' }, step_re: 'dig out|excavate|backfill|load', type: 'excavator', reason: 'Excavate around the tank or to the remedial limits, lift the tank, load trucks and place backfill' },
    { when: { title_re: 'contaminated soil|impacted soil|soil remediation|remedial excavation|source removal|petroleum[- ]impacted' }, step_re: 'haul|load', type: 'dump_truck', reason: 'Haul profiled contaminated soil to the approved landfill' },
    { when: { title_re: '\\bUSTs?\\b|underground (?:storage|fuel|oil|heating oil) tank|tank (?:pull|removal|closure)|heating oil tank|contaminated soil|remedial excavation' }, step_re: 'backfill', type: 'compactor', reason: 'Compact backfill in lifts after the inspector or the sample results release the excavation' },
  ],
  hazards: [
    { id: 'hazwoper_training', hazard: 'Untrained workers entering a contaminated cleanup site and being exposed to hazardous substances', hazard_es: PENDING_ES, controls: ['General site workers have 40 hours of HAZWOPER instruction plus 3 days supervised field time, with annual refreshers', 'Written site safety and health plan, site control and medical surveillance in place before work starts'], controls_es: PENDING_ES, osha_ref: '1926.65(e)(3)(i)', severity: 3, prov: osha('d') },
    { id: 'vapor_exposure', hazard: 'Breathing petroleum or solvent vapors (benzene and others) from tanks, soil and groundwater', hazard_es: PENDING_ES, controls: ['Monitor the air at first entry and as work changes to pick PPE and controls', 'Work upwind; use ventilation or respirators per the site safety plan'], controls_es: PENDING_ES, osha_ref: '1926.65(h)(2)', severity: 3, ppe: ['air-purifying respirator with organic vapor cartridges when the plan calls for it', 'nitrile gloves', 'chemical-resistant boots'], prov: osha('d') },
    { id: 'flammable_vapor_ignition', hazard: 'Fire or explosion from flammable vapor in a tank, its piping or the excavation', hazard_es: PENDING_ES, controls: ['No smoking or open flame near the work; post signs', 'Bond and ground pump-out equipment; use non-sparking tools', 'Keep the tank atmosphere inerted or vented and verified on the LEL meter before cutting or lifting'], controls_es: PENDING_ES, osha_ref: '1926.151(a)(3)', severity: 4, ppe: ['flame-resistant clothing where specified'], prov: osha('f') },
    { id: 'excavation_atmosphere', hazard: 'Low oxygen or flammable vapor collecting in a contaminated excavation', hazard_es: PENDING_ES, controls: ['Test the air before entry into any dig over 4 ft where a hazardous atmosphere could exist', 'Ventilate to keep flammable gas below 20% of the LEL; re-test as often as needed'], controls_es: PENDING_ES, osha_ref: '1926.651(g)(1)', severity: 4, prov: osha('p') },
    { id: 'cave_in', hazard: 'Excavation wall collapse — soils around old tanks are loose backfill and often wet', hazard_es: PENDING_ES, controls: ['Protective system (sloping, shoring or a trench box) for every excavation 5 ft or deeper unless in stable rock', 'Competent person inspects the excavation daily and after rain'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, prov: osha('p') },
    { id: 'spoil_edge', hazard: 'Spoil piles, stockpiles or equipment falling or rolling into the excavation', hazard_es: PENDING_ES, controls: ['Keep spoil, stockpiles and equipment at least 2 ft from the edge, or use retaining devices'], controls_es: PENDING_ES, osha_ref: '1926.651(j)(2)', severity: 3, prov: osha('p') },
    { id: 'water_in_excavation', hazard: 'Working in an excavation where contaminated groundwater is collecting', hazard_es: PENDING_ES, controls: ['No work in accumulating water unless the competent person sets precautions and pumping is watched', 'Treat pumped water as contaminated until tested'], controls_es: PENDING_ES, osha_ref: '1926.651(h)(1)', severity: 3, prov: osha('p') },
    { id: 'tank_entry', hazard: 'Entering a tank — toxic, oxygen-poor or explosive atmosphere in a permit-required confined space', hazard_es: PENDING_ES, controls: ['Clean from outside; do not enter a tank', 'If entry cannot be avoided, the competent person classifies it as a permit space and a full permit, attendant and rescue plan are required'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 4, prov: osha('aa') },
    { id: 'rigging_struck', hazard: 'Struck or crushed by a tank swinging or falling during the lift', hazard_es: PENDING_ES, controls: ['Inspect slings and hardware before each shift; remove damaged gear', 'Keep everyone out from under and beside the load; use a tag line'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 4, prov: osha('h') },
    { id: 'utility_strike', hazard: 'Hitting buried electric, gas or product lines while digging or drilling', hazard_es: PENDING_ES, controls: ['Locate utilities before opening the ground; hand-dig or vacuum near marks', 'Treat abandoned product lines as live until drained and confirmed'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'equipment_edge', hazard: 'Excavator or trucks working near the edge of the dig without a clear view', hazard_es: PENDING_ES, controls: ['Use barricades, stop logs or a signal person when the operator cannot see the edge', 'Grade away from the excavation where possible'], controls_es: PENDING_ES, osha_ref: '1926.651(f)', severity: 3, prov: osha('p') },
    { id: 'decon_spread', hazard: 'Carrying contamination off the site on boots, clothing, tools or truck tires', hazard_es: PENDING_ES, controls: ['Everyone and every piece of equipment leaving the dirty zone is decontaminated or the gear is disposed of', 'Contain decon water and used PPE for disposal'], controls_es: PENDING_ES, osha_ref: '1926.65(k)(2)(iii)', severity: 2, prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'closure_notice_filed', phase: 'site_prep', item: 'Tank closure notice filed and lead time met (WI: TR-WM-121, 5 business days; federal default 30 days); any date change requested at least 1 business day before the original date.', item_es: tr('Aviso de cierre del tanque presentado y plazo cumplido (WI: TR-WM-121, 5 días hábiles; federal, 30 días por defecto); cualquier cambio de fecha pedido al menos 1 día hábil antes de la fecha original.'), prov: ust },
    { id: 'certified_crew', phase: 'site_prep', item: 'Tank cleaners and removers hold current state certification; crew in the contaminated zone has current HAZWOPER training and medical clearance.', item_es: PENDING_ES, safety: true, prov: { src: ['environmental_remediation-wi-atcp93', 'ecfr-1926-d'], confidence: 'verified', last_verified: D } },
    { id: 'hasp_on_site', phase: 'site_prep', item: 'Site-specific health and safety plan on site and briefed; exclusion, decon and support zones marked; only trained people in the right PPE inside the exclusion zone.', item_es: PENDING_ES, safety: true, prov: osha('d') },
    { id: 'lel_logged', item: 'LEL and oxygen readings at the tank and in the excavation logged before cutting, lifting or entry, and repeated while work goes on.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-p', 'environmental_remediation-ecfr-40-280f'], confidence: 'verified', last_verified: D } },
    { id: 'tank_emptied_cleaned', item: 'All liquid and sludge removed from the tank and piping before closure; residue disposal paperwork kept.', item_es: tr('Todo el líquido y lodo retirado del tanque y la tubería antes del cierre; documentos de disposición de residuos guardados.'), prov: ust },
    { id: 'soil_segregated_screened', item: 'Excavated soil screened with the PID and kept in separate clean and contaminated piles; contaminated stockpiles placed on and covered with plastic.', item_es: tr('Suelo excavado revisado con el PID y separado en pilas limpias y contaminadas; pilas contaminadas sobre plástico y cubiertas.'), prov: waste },
    { id: 'basin_open_until_inspection', item: 'Tank basin and piping trenches left open and the tank kept on site until the tank inspector approves backfill and removal.', item_es: tr('Fosa del tanque y zanjas de tubería abiertas y el tanque en la obra hasta que el inspector apruebe el relleno y el retiro.'), prov: ust },
    { id: 'closure_samples_taken', item: 'Closure site-assessment samples taken where a release is most likely (tank ends, fill pipe, dispensers, piping run) and the closure assessment report filled out by the certified remover.', item_es: tr('Muestras de evaluación de cierre tomadas donde es más probable una fuga (extremos del tanque, tubo de llenado, dispensadores, tubería) y el informe de cierre llenado por el removedor certificado.'), prov: ust },
    { id: 'release_reported', item: 'Any sign of a release (stained or odorous soil, free product, sheen) reported to the state right away — WI DNR immediately, federal within 24 hours — and corrective action started.', item_es: tr('Cualquier señal de fuga (suelo manchado o con olor, producto libre, brillo) reportada al estado de inmediato — DNR de WI inmediatamente, federal en 24 horas — e iniciada la acción correctiva.'), prov: release },
    { id: 'water_contained', item: 'Water pumped from the excavation held in tanks until tested and disposed of or discharged under approval; none to streets or storm drains.', item_es: tr('Agua bombeada de la excavación guardada en tanques hasta analizarla y disponerla o descargarla con aprobación; nada a calles ni drenajes pluviales.'), prov: nr700 },
    { id: 'loads_manifested', item: 'Every load goes only to the facility that approved the profile, tarped, with a manifest or bill of lading and a weigh ticket; signed copies returned.', item_es: tr('Cada carga va solo a la instalación que aprobó el perfil, cubierta con lona, con manifiesto o conocimiento de embarque y boleta de báscula; copias firmadas devueltas.'), prov: waste },
    { id: 'confirmation_samples_lab', item: 'Confirmation samples from the floor and each sidewall at the work-plan spacing, sent to a certified lab under chain of custody; dig held open until results meet the cleanup standard.', item_es: tr('Muestras de confirmación del fondo y de cada pared con la separación del plan, enviadas a un laboratorio certificado con cadena de custodia; excavación abierta hasta que los resultados cumplan la norma.'), prov: nr700 },
    { id: 'well_built_to_rule', item: 'Monitoring well built per the state well rule: screen and casing at planned depth, filter sand, bentonite seal and grout placed by tremie, locking cap; boring log and construction form completed.', item_es: tr('Pozo de monitoreo construido según la norma estatal: rejilla y ademe a la profundidad del plan, arena filtrante, sello de bentonita y lechada colocados con tubo tremie, tapa con candado; registro de perforación y formulario completos.'), prov: { src: ['environmental_remediation-wi-nr141'], confidence: 'verified', last_verified: D } },
    { id: 'closure_records_filed', item: 'Revised tank registration and closure assessment report filed (WI: within 21 business days); site-assessment results kept at least 3 years.', item_es: tr('Registro revisado del tanque e informe de evaluación de cierre presentados (WI: en 21 días hábiles); resultados de la evaluación guardados al menos 3 años.'), prov: ust },
    { id: 'records_to_consultant', item: 'Weigh tickets, manifests, sample maps, logs and photos handed to the consultant for the remedial action report and case closure request.', item_es: tr('Boletas de báscula, manifiestos, mapas de muestreo, registros y fotos entregados al consultor para el informe de remediación y la solicitud de cierre del caso.'), prov: nr700 },
  ],
  inspection_checklists: {
    ust_closure_notification: [
      { item: 'Closure notice filed with the tank regulator and lead time met; inspector and certified remover scheduled', item_es: tr('Aviso de cierre presentado al regulador de tanques y plazo cumplido; inspector y removedor certificado programados'), ref: 'WI ATCP 93.560(1)' },
      { item: 'Federal notice to the implementing agency at least 30 days before permanent closure, unless the agency sets another period', item_es: tr('Aviso federal a la agencia al menos 30 días antes del cierre permanente, salvo que la agencia fije otro plazo'), ref: '40 CFR 280.71(a)' },
      { item: 'Close-in-place request approved in writing, if the tank will not be removed', item_es: tr('Solicitud de cierre en sitio aprobada por escrito, si el tanque no se retira'), ref: 'WI ATCP 93.560(2)(e)' },
    ],
    ust_closure_inspection: [
      { item: 'Tank and piping emptied of liquids and sludge and cleaned', item_es: tr('Tanque y tubería vaciados de líquidos y lodos y limpios'), ref: '40 CFR 280.71(b)' },
      { item: 'Basin and piping trenches still open and tank still on site when the inspector arrives', item_es: tr('Fosa y zanjas de tubería aún abiertas y el tanque aún en la obra cuando llega el inspector'), ref: 'WI ATCP 93.560(2)(am)' },
      { item: 'Closure assessment report (TR-WM-140) filled out by the certified remover and given to the inspector', item_es: tr('Informe de evaluación de cierre (TR-WM-140) llenado por el removedor certificado y entregado al inspector'), ref: 'WI ATCP 93.560(2)(f)' },
    ],
    closure_site_assessment: [
      { item: 'Samples taken where contamination is most likely, considering the product, backfill and depth to groundwater', item_es: tr('Muestras tomadas donde es más probable la contaminación, según el producto, el relleno y la profundidad del agua subterránea'), ref: '40 CFR 280.72(a)' },
      { item: 'Assessment done after notice and before backfill or close-in-place', item_es: tr('Evaluación hecha después del aviso y antes del relleno o del cierre en sitio'), ref: 'WI ATCP 93.560(3)' },
      { item: 'Any release found reported to DNR and corrective action started', item_es: tr('Cualquier fuga encontrada reportada al DNR e iniciada la acción correctiva'), ref: 'WI ATCP 93.585(2)' },
    ],
    waste_manifest: [
      { item: 'Waste profile approved by the receiving facility before the first load', item_es: tr('Perfil del residuo aprobado por la instalación receptora antes de la primera carga') },
      { item: 'Hazardous loads shipped on the EPA uniform manifest; petroleum UST soils excluded under 261.4(b)(10) go on the landfill’s non-hazardous paperwork', item_es: tr('Cargas peligrosas enviadas con el manifiesto uniforme de la EPA; suelos de UST excluidos por 261.4(b)(10) van con los papeles no peligrosos del relleno'), ref: '40 CFR 262.20' },
      { item: 'Excavated contaminated soil stored on and under cover until shipped', item_es: tr('Suelo contaminado excavado almacenado sobre y bajo cubierta hasta su envío'), ref: 'WI NR 718.05' },
      { item: 'Signed manifests and weigh tickets returned for every load', item_es: tr('Manifiestos firmados y boletas de báscula devueltos por cada carga') },
    ],
    confirmation_sampling: [
      { item: 'Floor and sidewall samples at the work-plan spacing, located on a map', item_es: tr('Muestras de fondo y paredes con la separación del plan, ubicadas en un mapa') },
      { item: 'Chain of custody complete; samples on ice to a certified lab within hold times', item_es: tr('Cadena de custodia completa; muestras en hielo a un laboratorio certificado dentro de los tiempos de retención') },
      { item: 'Results compared with the soil cleanup standards before backfill', item_es: tr('Resultados comparados con las normas de limpieza de suelo antes del relleno'), ref: 'WI NR 720' },
    ],
    regulator_case_closure: [
      { item: 'Remedial action documentation (tickets, manifests, sample results, well logs) delivered to the consultant', item_es: tr('Documentación de la remediación (boletas, manifiestos, resultados, registros de pozos) entregada al consultor'), ref: 'WI NR 724' },
      { item: 'Case closure request submitted and regulator closure letter received; continuing obligations noted for the owner', item_es: tr('Solicitud de cierre del caso presentada y carta de cierre del regulador recibida; obligaciones continuas anotadas para el propietario'), ref: 'WI NR 726.05' },
      { item: 'Monitoring wells abandoned per the state well rule once the case closes, unless kept by approval', item_es: tr('Pozos de monitoreo sellados según la norma estatal al cerrar el caso, salvo que se conserven con aprobación'), ref: 'WI NR 141.25' },
    ],
  },
  assemblies: [
    { code: 'HC-REM-HASP-EA', name: 'Site-specific health and safety plan for a remediation or tank closure job', name_es: 'Plan de salud y seguridad específico del sitio para un trabajo de remediación o cierre de tanque', unit: 'EA', csi: '01 35 29',
      material_cost_cents: { v: 0, prov: est('document only') }, labor_hours_per_unit: { v: 12, prov: est('safety professional writing, review and crew briefing for a small to mid site') },
      equipment_cost_cents: { v: 0, prov: est('none') }, waste_pct: { v: 0, prov: est('service') } },
    { code: 'HC-REM-UST-SM-EA', name: 'UST removal and closure, up to 4,000 gal (pump-out, clean, inert, lift, scrap; excludes contaminated soil)', name_es: 'Retiro y cierre de UST de hasta 4,000 gal (bombeo, limpieza, inertización, izaje, chatarra; sin suelo contaminado)', unit: 'EA', csi: '02 65 00',
      description: 'Includes certified remover crew and residue disposal; closure sampling and soil disposal priced separately.',
      material_cost_cents: { v: 90000, prov: est('residue/sludge disposal, inerting media, tank scrap and cleaning supplies, 2026 national baseline') }, labor_hours_per_unit: { v: 24, prov: est('3-person certified crew, one day including pump-out, excavation and backfill') },
      equipment_cost_cents: { v: 150000, prov: est('vacuum truck, excavator and LEL/PID meters for one day') }, waste_pct: { v: 0, prov: est('per-tank unit') } },
    { code: 'HC-REM-UST-LG-EA', name: 'UST removal and closure, 6,000–12,000 gal (pump-out, clean, inert, lift, scrap; excludes contaminated soil)', name_es: 'Retiro y cierre de UST de 6,000 a 12,000 gal (bombeo, limpieza, inertización, izaje, chatarra; sin suelo contaminado)', unit: 'EA', csi: '02 65 00',
      description: 'Commercial fuel tank; shoring, pavement removal and soil disposal priced separately.',
      material_cost_cents: { v: 250000, prov: est('larger residue volume, inerting media, scrap and cleaning, 2026 national baseline') }, labor_hours_per_unit: { v: 48, prov: est('3-person certified crew, about two days') },
      equipment_cost_cents: { v: 350000, prov: est('vacuum truck, large excavator and meters for two days') }, waste_pct: { v: 0, prov: est('per-tank unit') } },
    { code: 'HC-REM-SOIL-EXC-CY', name: 'Contaminated soil excavation with PID screening, segregation and truck loading', name_es: 'Excavación de suelo contaminado con monitoreo PID, separación y carga de camiones', unit: 'CY', csi: '02 61 13',
      material_cost_cents: { v: 150, prov: est('stockpile poly and decon supplies per CY') }, labor_hours_per_unit: { v: 0.12, prov: est('operator, laborer and screening share at slower remedial production') },
      equipment_cost_cents: { v: 650, prov: est('excavator and PID share per CY') }, waste_pct: { v: 0, prov: est('quantity is in-place volume') } },
    { code: 'HC-REM-SOIL-DISP-TON', name: 'Petroleum-contaminated soil transport and landfill disposal (non-hazardous, profiled), per ton', name_es: 'Transporte y disposición en relleno sanitario de suelo contaminado con petróleo (no peligroso, con perfil), por tonelada', unit: 'TON', csi: '02 61 13',
      description: 'Special-waste tipping fee plus haul up to ~30 miles; hazardous waste disposal priced separately. Not the C&D debris rate (G-HAUL-DISP-TON).',
      material_cost_cents: { v: 5500, prov: est('special-waste landfill tipping and profile fees, 2026 national baseline') }, labor_hours_per_unit: { v: 0, prov: est('driver in haul rate') },
      equipment_cost_cents: { v: 2000, prov: est('tri-axle or end-dump haul per ton, ~30-mile round trip') }, waste_pct: { v: 0, prov: est('paid on scale weight') } },
    { code: 'HC-REM-SAMPLE-EA', name: 'Confirmation or closure soil sample — collection and certified lab analysis (petroleum list)', name_es: 'Muestra de suelo de confirmación o de cierre — toma y análisis en laboratorio certificado (lista de petróleo)', unit: 'EA', csi: '02 21 00',
      material_cost_cents: { v: 25000, prov: est('lab analysis for petroleum VOCs/PAHs and lead plus jars and shipping, 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('field technician collection, logging and chain of custody') },
      equipment_cost_cents: { v: 1500, prov: est('PID and sampling tool share') }, waste_pct: { v: 0, prov: est('per sample') } },
    { code: 'HC-REM-MW-EA', name: 'Groundwater monitoring well, 2-in, to about 20 ft — drill, construct, develop', name_es: 'Pozo de monitoreo de agua subterránea de 2 pulg, hasta unos 20 pies — perforar, construir, desarrollar', unit: 'EA', csi: '33 21 00',
      material_cost_cents: { v: 60000, prov: est('PVC screen and riser, filter sand, bentonite, grout, cover and lock, cuttings drums') }, labor_hours_per_unit: { v: 8, prov: est('driller and helper share plus development') },
      equipment_cost_cents: { v: 120000, prov: est('hollow-stem auger or direct-push rig share per well') }, waste_pct: { v: 5, prov: est('casing cut-offs and sand overage') } },
  ],
  quantity_rules: [
    { code: 'HC-REM-HASP-EA', assumption: 'One site-specific health and safety plan per commercial or industrial remediation job', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'HC-REM-SAMPLE-EA', assumption: 'Placeholder of 5 confirmation samples (floor + 4 walls) — replace with the work-plan count', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 5 } },
    { code: 'HC-REM-UST-SM-EA', assumption: 'One small UST (heating oil) removal on a single-family remediation job — confirm the tank survey', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 1 } },
  ],
  dependency_hints: [
    { after_trades: ['utility_locating'], note: 'Utility locates and the closure notice come before any tank or soil excavation.' },
    { before_phase: 'foundation', note: 'Tank closure, contaminated soil removal and confirmation results (or regulator approval) before foundations or utilities go into the area.' },
  ],
});
