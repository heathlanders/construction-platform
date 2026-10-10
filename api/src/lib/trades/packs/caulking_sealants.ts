// Trade Knowledge Pack — caulking_sealants (Caulking / Joint Sealants). Wave 09 — NEW-TRADE pattern (no hand recipe).
// permit_trade null → NO gates, NO code_refs; owner/spec hold points (joint prep, adhesion pull test) live in
// inspection_checklists. Bucket general → G-SEAL- codes. Existing flatwork / asphalt joint lines
// (B-CFW-JOINTSEAL-LF, B-ASP-CRACKSEAL-LF) belong to those trades and are not redeclared or re-seeded here.
// Firestopping is a separate trade (firestopping). Dossier: docs/trade-packs/dossiers/caulking_sealants.md.
// Sources: UFGS 07 92 00 (Aug 2023), Tremco field adhesion test guidance, SWRI (terminology), ASTM C1193 /
// C1521 (reference only), 29 CFR 1926 Subparts D, E, F, L, M, X, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['caulking_sealants-ufgs-07-92-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const adh = (note?: string) => ({ src: ['caulking_sealants-tremco-adhesion', 'caulking_sealants-ufgs-07-92-00', 'caulking_sealants-astm-c1521'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'caulking_sealants',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Seals the joints that move: exterior perimeter joints at windows, doors, louvers and penetrations, expansion and control joints in masonry, concrete and panels, and interior wet-area and finish joints — joint prep, primer, backer rod, gunning, tooling, cure protection, field adhesion testing, and cut-out and reseal of failed sealant. Firestop sealants are a separate trade.',
    summary_es: 'Sella juntas que se mueven: perímetros exteriores de ventanas, puertas y penetraciones, juntas de expansión y control, y juntas interiores húmedas — preparación, imprimador, cordón de respaldo, aplicación, alisado, curado, prueba de adherencia y resellado de sellador fallado. Los selladores cortafuego son otro oficio.',
    glossary: [
      { term: 'Backer rod', term_es: 'Cordón de respaldo', def: 'Round foam rope pushed into the joint to set the sealant depth and give it a curved back to stretch against.', def_es: 'Cordón redondo de espuma que se mete en la junta para fijar la profundidad del sellador y darle un fondo curvo.' },
      { term: 'Bond breaker', term_es: 'Rompedor de adherencia', def: 'Tape or coating at the back of a shallow joint so the sealant sticks only to the two sides.', def_es: 'Cinta o recubrimiento al fondo de una junta poco profunda para que el sellador solo se pegue a los dos lados.' },
      { term: 'Three-sided adhesion', term_es: 'Adherencia en tres lados', def: 'Sealant stuck to both sides AND the back of the joint — it cannot stretch and tears when the joint opens.', def_es: 'Sellador pegado a ambos lados Y al fondo de la junta; no puede estirarse y se rompe cuando la junta se abre.' },
      { term: 'Width-to-depth ratio', term_es: 'Relación ancho-profundidad', def: 'How deep the sealant bead is compared to how wide the joint is; usually about half as deep as wide, within set limits.', def_es: 'Profundidad del cordón de sellador comparada con el ancho de la junta; normalmente la mitad de profunda que ancha, dentro de límites.' },
      { term: 'Tooling', term_es: 'Alisado (herramentado)', def: 'Pressing and shaping the fresh bead with a spatula so it wets both sides and has a slight concave face.', def_es: 'Presionar y dar forma al cordón fresco con espátula para que moje ambos lados y quede ligeramente cóncavo.' },
      { term: 'Primer', term_es: 'Imprimador', def: 'Liquid brushed on porous or hard-to-bond joint faces so the sealant grips; used only where the maker calls for it.', def_es: 'Líquido aplicado con brocha en caras porosas o difíciles para que el sellador se adhiera; solo donde el fabricante lo pide.' },
      { term: 'Adhesion pull test', term_es: 'Prueba de adherencia (jalón)', def: 'Cut a tab of cured sealant loose from one side and pull it at 90° to see whether the sealant or its bond gives way.', def_es: 'Cortar una lengüeta de sellador curado y jalarla a 90° para ver si falla el sellador o su adherencia.' },
      { term: 'Cohesive vs. adhesive failure', term_es: 'Falla cohesiva vs. adhesiva', def: 'Cohesive = the sealant itself tears (good bond); adhesive = it peels clean off the surface (bad prep or wrong product).', def_es: 'Cohesiva = el sellador mismo se rompe (buena adherencia); adhesiva = se despega limpio de la superficie (mala preparación o producto equivocado).' },
      { term: 'Movement joint', term_es: 'Junta de movimiento', def: 'Expansion, control or perimeter joint built to open and close with heat, cold and settling.', def_es: 'Junta de expansión, control o perímetro hecha para abrirse y cerrarse con el calor, el frío y el asentamiento.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'joint_sealant_install',
      example_title: 'Exterior joint sealants — windows, doors and control joints',
      when: { title_re: 'caulk|sealants?\\b|joint seal|backer rod' },
      steps: [
        {
          title: 'Survey the joints and check the weather',
          instruction: 'Walk every joint on the sealant schedule with the drawings. Measure width and depth, note the two materials on each side, and flag any gap that is too wide for sealant or that hides missing flashing — sealant does not replace flashing or close out-of-tolerance gaps. Seal only when the air is between about 40 and 90 °F, the surfaces are dry and frost-free, and no rain is due before the bead skins.',
          detail: 'Joints in older buildings (sealant placed before 1979) may contain PCBs — have the old sealant tested before anyone cuts it out.',
          tools: ['tape measure', 'joint depth gauge or ruler', 'thermometer', 'marker'],
          materials: [],
          safety_ids: ['ladder', 'pcb_legacy'],
          qa_ids: ['not_in_lieu_of_flashing', 'temp_window', 'joint_ratio'],
        },
        {
          title: 'Clean, mask and prime the joint faces',
          instruction: 'Clean each joint face per the sealant maker for that substrate: wire-brush or grind laitance and loose mortar from masonry and concrete, wipe metal and glass with the maker’s non-staining solvent using two clean cloths, and blow out dust. Mask both edges with tape. Brush primer only onto porous or listed faces, never onto exposed finished surfaces, and let it flash off for the time on the label.',
          tools: ['wire brush', 'clean white cloths', 'solvent can with lid', 'masking tape', 'primer brush', 'compressed air or blower'],
          materials: ['maker-approved cleaning solvent', 'sealant primer (where required)', 'masking tape'],
          safety_ids: ['solvent_vapor', 'solvent_fire', 'hazcom', 'eye_splash', 'silica_grind'],
          qa_ids: ['faces_clean_dry', 'primer_where_required'],
        },
        {
          title: 'Set backer rod or bond breaker to depth',
          instruction: 'Pick a closed-cell or open-cell backer rod about 25% wider than the joint (or as the maker says) and roll it in with a blunt tool to the set depth — never puncture it or stretch it. Where the joint is too shallow for rod, lay bond-breaker tape in the bottom so the sealant bonds only to the two sides, never three.',
          tools: ['blunt roller or depth tool', 'utility knife'],
          materials: ['backer rod sized to the joint', 'bond-breaker tape'],
          safety_ids: ['knife_cut'],
          qa_ids: ['rod_sized_depth', 'no_three_sided'],
        },
        {
          title: 'Gun the sealant and tool it',
          instruction: 'Use the sealant listed for that joint and substrate, inside its shelf life and never thinned. Cut the nozzle to fit the joint, push the bead ahead of the gun so it fills solid with no air pockets, then tool it at once with a dry spatula into a slight concave face that wets both sides. Pull the masking tape within about 10 minutes, before the skin forms.',
          detail: 'Mix multi-component sealants exactly as the maker directs and use them within their pot life.',
          tools: ['caulk gun (manual or bulk)', 'tooling spatula', 'drill mixer for multi-component products'],
          materials: ['joint sealant per schedule (silicone, urethane, hybrid or acrylic)'],
          safety_ids: ['hazcom', 'solvent_vapor', 'ladder', 'scaffold_fall', 'aerial_lift', 'eye_splash'],
          qa_ids: ['full_fill_tooled', 'compatible_product', 'tape_pulled'],
        },
        {
          title: 'Protect the cure and clean up',
          instruction: 'Keep water, dirt, paint and traffic off the joints for the cure time on the label. Wipe smears off metal and glass right away with solvent; on masonry let smears cure, then remove by wire brushing. Close solvent cans, bag rags in a closed metal can, and leave the work clean.',
          tools: ['clean cloths', 'wire brush', 'closed metal waste can'],
          materials: ['maker-approved solvent'],
          safety_ids: ['solvent_fire', 'solvent_vapor'],
          qa_ids: ['clean_no_smears'],
        },
        {
          title: 'Run the field adhesion pull test',
          instruction: 'After full cure, cut across the bead, cut about 3 in. along both bond lines, grab the tab and pull it out at 90°. Write down the location, date, how far it stretched and whether it tore through the sealant (good) or peeled off the face (bad). Test about every 100 ft over the first 1,000 ft, then about once per 1,000 ft or once per floor per elevation. If a test fails, stop, find the cause, cut out the failed run and the joints next to it, then re-clean, reseal and re-test. Patch each test cut with fresh sealant.',
          tools: ['utility knife', 'tape measure', 'camera', 'test log'],
          materials: ['patch sealant matching the joint'],
          safety_ids: ['knife_cut', 'ladder', 'scaffold_fall', 'aerial_lift'],
          qa_ids: ['adhesion_test_rate', 'adhesion_failures_fixed'],
        },
      ],
    },
    {
      id: 'sealant_cut_out_reseal',
      example_title: 'Remove and replace failed exterior sealant',
      priority: 10,
      when: { title_re: '(?:remove|cut[- ]?out|replace|re-?seal|re-?caulk|failed)[^.]*(?:caulk|sealant|joint)|(?:caulk|sealant)[^.]*(?:replace(?:ment)?|removal|cut[- ]?out|repair)' },
      steps: [
        {
          title: 'Test the old sealant and set up',
          instruction: 'Before cutting, confirm whether the old sealant was tested for PCBs or asbestos when the building predates 1980; if it contains either, stop — removal follows the abatement plan, not this procedure. Barricade the ground below and protect windows, finishes and plantings.',
          tools: ['caution tape or cones', 'drop cloths'],
          materials: [],
          safety_ids: ['pcb_legacy', 'falling_objects'],
          qa_ids: ['old_sealant_tested'],
        },
        {
          title: 'Cut out the failed sealant and backer',
          instruction: 'Slice the old bead free along both bond lines with a knife or oscillating tool and pull it out with the backer. Grind or scrape the leftover film off masonry and concrete; never grind metal frames. Remove all of it — new sealant on top of old does not bond.',
          tools: ['utility knife or sealant knife', 'oscillating multi-tool', 'scraper', 'grinder with vacuum shroud (masonry only)'],
          materials: [],
          safety_ids: ['knife_cut', 'silica_grind', 'eye_splash', 'ladder', 'scaffold_fall', 'aerial_lift'],
          qa_ids: ['old_fully_removed'],
        },
        {
          title: 'Prep, rod, seal and tool',
          instruction: 'Clean and prime the faces per the new sealant’s maker, set new backer rod to depth, gun the sealant and tool it the same way as new work. Where old joints are too narrow or too deep for the ratio, re-cut or add backer before sealing.',
          tools: ['caulk gun', 'tooling spatula', 'wire brush', 'blunt roller'],
          materials: ['backer rod', 'primer (where required)', 'joint sealant per schedule'],
          safety_ids: ['solvent_vapor', 'solvent_fire', 'hazcom'],
          qa_ids: ['joint_ratio', 'rod_sized_depth', 'full_fill_tooled', 'compatible_product'],
        },
        {
          title: 'Pull-test and turn over',
          instruction: 'After cure, run adhesion pull tests at the agreed rate, patch the test cuts, then walk the elevation with the owner and haul away the old sealant as the hazard results allow.',
          tools: ['utility knife', 'test log', 'camera'],
          materials: ['patch sealant'],
          safety_ids: ['knife_cut', 'ladder'],
          qa_ids: ['adhesion_test_rate', 'clean_no_smears'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'caulk|sealants?\\b|joint seal|backer rod', building_types: ['commercial', 'residential_mf', 'industrial'] }, type: 'boom_lift', reason: 'Reach upper-floor window and panel joints along the elevation instead of moving ladders', optional: true },
    { when: { title_re: 'caulk|sealants?\\b|joint seal|backer rod', building_types: ['commercial', 'industrial'] }, type: 'scissor_lift', reason: 'Seal interior high joints and lower exterior joints from a stable platform on flat ground', optional: true },
  ],
  hazards: [
    { id: 'ladder', hazard: 'Fall from a ladder while sealing window heads, soffits and upper joints', hazard_es: PENDING_ES, controls: ['Set the ladder on firm level footing at a 4:1 angle and extend it 3 ft past the landing or tie it off', 'Keep three points of contact; move the ladder instead of reaching sideways with the gun'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'scaffold_fall', hazard: 'Fall from scaffold or a swing stage while working joints along an elevation', hazard_es: PENDING_ES, controls: ['Guardrails or personal fall arrest on scaffold platforms more than 10 ft up', 'On suspended (swing-stage) scaffolds use both guardrail and personal fall arrest, tied to an independent lifeline', 'Only trained workers on scaffolds; inspect before each shift'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from a boom lift basket while sealing upper joints', hazard_es: PENDING_ES, controls: ['Wear a harness with lanyard attached to the boom or basket', 'Stand on the basket floor — never climb the rails — and keep clear of overhead lines'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'falling_objects', hazard: 'Struck below by dropped guns, tubes, knives or cut-out sealant', hazard_es: PENDING_ES, controls: ['Barricade the area below overhead work', 'Use tool lanyards or a bucket on lifts and scaffolds; hard hats for the ground crew'], controls_es: PENDING_ES, osha_ref: '1926.501(c)', severity: 3, ppe: ['hard hat'], prov: osha('m') },
    { id: 'hazcom', hazard: 'Skin and eye irritation or sensitization from sealants, primers and isocyanate-containing urethanes', hazard_es: PENDING_ES, controls: ['Read the SDS and label for every sealant and primer; keep SDS on site', 'Wear chemical-resistant gloves; wash hands before eating'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d', '1926.59 adopts 29 CFR 1910.1200 Hazard Communication.') },
    { id: 'solvent_vapor', hazard: 'Breathing solvent and primer vapors in stairwells, interiors and tight spaces', hazard_es: PENDING_ES, controls: ['Open the area or add exhaust fans so vapor does not build up', 'Use the respirator the SDS calls for when ventilation is not enough', 'Keep lids on solvent and primer cans between uses'], controls_es: PENDING_ES, osha_ref: '1926.57(a)', severity: 3, prov: osha('d') },
    { id: 'solvent_fire', hazard: 'Fire from flammable cleaning solvents, primers and solvent-soaked rags', hazard_es: PENDING_ES, controls: ['Keep solvents in approved safety cans; no smoking or open flame nearby', 'Put used rags in a closed metal can and remove them daily', 'Keep a fire extinguisher on the deck or lift'], controls_es: PENDING_ES, osha_ref: '1926.152(a)(1)', severity: 3, prov: osha('f') },
    { id: 'eye_splash', hazard: 'Eye injury from solvent or primer splash, debris and grinding chips overhead', hazard_es: PENDING_ES, controls: ['Wear safety glasses with side shields; goggles when pouring solvent or working overhead'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses', 'splash goggles'], prov: osha('e') },
    { id: 'knife_cut', hazard: 'Hand cuts from utility and sealant knives when cutting out joints and pull-test tabs', hazard_es: PENDING_ES, controls: ['Cut away from the body with a sharp blade; retract or sheath knives when not cutting', 'Wear cut-resistant gloves on the non-knife hand'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('e') },
    { id: 'silica_grind', hazard: 'Breathing silica dust when grinding or cutting masonry and concrete joint faces', hazard_es: PENDING_ES, controls: ['Use a grinder with a shroud and dust-collecting vacuum, or wet methods', 'Follow the employer’s written exposure control plan; respirator where the plan requires it'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator per exposure plan'], prov: osha('z') },
    { id: 'pcb_legacy', hazard: 'Exposure to PCBs or asbestos in old sealant on buildings from before about 1980', hazard_es: PENDING_ES, controls: ['Have suspect old sealant sampled and tested before cutting', 'If positive, removal goes to a qualified abatement contractor under its plan'], controls_es: PENDING_ES, osha_ref: '1926.1101(k)(1)', severity: 4, prov: { src: ['ecfr-1926-z', 'caulking_sealants-ufgs-07-92-00'], confidence: 'verified', last_verified: D, note: '1926.1101(k)(1) — building owner / employer must determine presence of asbestos-containing material before work; UFGS 3.2.5 routes pre-1979 / PCB sealant to removal per 02 84 33.' } },
  ],
  qa_checklist: [
    { id: 'not_in_lieu_of_flashing', phase: 'finishes_exterior', item: 'Sealant is not used in place of flashing, drainage parts or closures, or to close gaps wider than the joint tolerance — those are fixed first.', item_es: tr('No se usa sellador en lugar de tapajuntas, drenajes o cierres, ni para tapar holguras mayores que la tolerancia; eso se corrige primero.'), prov: ufgs('3.4.2 unacceptable sealant use') },
    { id: 'temp_window', item: 'Sealant applied with air at about 40–90 °F (or the maker’s range), on dry, frost-free faces, with no rain before skin-over.', item_es: tr('Sellador aplicado con aire entre ≈40 y 90 °F (o el rango del fabricante), sobre caras secas y sin escarcha, sin lluvia antes de formar piel.'), prov: ufgs('1.5 environmental conditions') },
    { id: 'joint_ratio', item: 'Sealant depth fits the joint width per the spec table — about half the width on nonporous faces over 1/4 in. wide, never deeper than wide; joints over 1 in. wide not sealed with a wet bead.', item_es: tr('La profundidad del sellador corresponde al ancho según la tabla de la especificación: ≈la mitad del ancho en caras no porosas de más de 1/4 pulg., nunca más profundo que ancho; juntas de más de 1 pulg. no se sellan con cordón húmedo.'), prov: ufgs('3.4.1 width-to-depth ratios') },
    { id: 'faces_clean_dry', item: 'Joint faces clean, dry and sound: laitance, loose mortar, coatings and oil removed; metal and glass wiped with the maker’s solvent and dried.', item_es: tr('Caras de la junta limpias, secas y firmes: sin lechada, mortero suelto, recubrimientos ni aceite; metal y vidrio limpiados con el solvente del fabricante y secados.'), prov: ufgs('3.2 surface preparation') },
    { id: 'primer_where_required', item: 'Primer applied only on porous or maker-listed substrates, allowed to flash off, and kept off exposed finished surfaces.', item_es: tr('Imprimador solo en sustratos porosos o indicados por el fabricante, con tiempo de oreo, y fuera de las superficies de acabado expuestas.'), prov: ufgs('3.4.5 primer') },
    { id: 'rod_sized_depth', item: 'Backer rod dry, untorn, slightly oversized for the joint and set at a uniform depth; no punctures.', item_es: tr('Cordón de respaldo seco, sin roturas, un poco más ancho que la junta y colocado a profundidad uniforme; sin perforaciones.'), prov: ufgs('3.4.4 backstops') },
    { id: 'no_three_sided', item: 'Sealant bonds to the two joint sides only — backer rod or bond breaker prevents bond to the back.', item_es: tr('El sellador se adhiere solo a los dos lados de la junta; el cordón o el rompedor de adherencia evitan que se pegue al fondo.'), prov: { src: ['caulking_sealants-ufgs-07-92-00', 'caulking_sealants-astm-c1193'], confidence: 'verified', last_verified: D, note: 'UFGS 3.4.6 bond breaker; ASTM C1193 joint design (reference only).' } },
    { id: 'compatible_product', item: 'Each joint uses the scheduled sealant, compatible with both substrates and any adjacent sealant, within shelf life and not thinned.', item_es: tr('Cada junta usa el sellador indicado, compatible con ambos sustratos y con selladores vecinos, dentro de su vida útil y sin diluir.'), prov: ufgs('3.3, 3.4.7 sealant preparation and application') },
    { id: 'full_fill_tooled', item: 'Bead fills the joint solid with no voids, tooled smooth and slightly concave, wetting both faces; no skips or partial fills.', item_es: tr('El cordón llena la junta sin huecos, alisado y ligeramente cóncavo, mojando ambas caras; sin saltos ni rellenos parciales.'), prov: ufgs('3.4.7 sealants') },
    { id: 'tape_pulled', item: 'Masking tape removed within about 10 minutes of tooling; no tape residue left.', item_es: tr('Cinta de enmascarar retirada dentro de ≈10 minutos después del alisado; sin residuos de cinta.'), prov: ufgs('3.4.3 masking tape') },
    { id: 'clean_no_smears', item: 'Adjacent glass, metal and masonry free of sealant smears and stains at turnover.', item_es: tr('Vidrio, metal y mampostería adyacentes sin manchas ni embarres de sellador al entregar.'), prov: ufgs('3.5 protection and cleaning') },
    { id: 'adhesion_test_rate', item: 'Field adhesion pull tests done after full cure — about one per 100 ft over the first 1,000 ft, then about one per 1,000 ft or per floor per elevation — and logged with location, date, extension and failure mode.', item_es: tr('Pruebas de adherencia en campo después del curado completo: ≈una cada 100 pies en los primeros 1,000 pies, luego ≈una cada 1,000 pies o por piso por fachada, registradas con ubicación, fecha, elongación y tipo de falla.'), prov: adh('Rates from the Tremco guidance; procedure UFGS 3.1 (ASTM C1193 Method A / C1521 Method A, reference only).') },
    { id: 'adhesion_failures_fixed', item: 'Any run that failed adhesion (peeled clean off a face) and the joints next to it were cut out, re-cleaned, resealed and re-tested; every test cut patched and tooled.', item_es: tr('Todo tramo que falló la adherencia (se despegó limpio de una cara) y las juntas vecinas se retiraron, limpiaron, resellaron y probaron de nuevo; cada corte de prueba reparado y alisado.'), prov: adh() },
    { id: 'old_fully_removed', item: 'On reseal work, all old sealant and backer removed and faces cleaned back to sound substrate before new sealant.', item_es: tr('En resellado, todo el sellador y cordón viejos retirados y las caras limpias hasta sustrato firme antes del sellador nuevo.'), prov: ufgs('3.2 — remove existing sealant before resealing') },
    { id: 'old_sealant_tested', item: 'Old sealant on pre-1980 buildings sampled for PCBs / asbestos before cut-out; positive results routed to abatement.', item_es: PENDING_ES, safety: true, prov: ufgs('3.2.5 removing existing hazardous sealants') },
  ],
  inspection_checklists: {
    joint_prep_check: [
      { item: 'Joint widths and depths measured; any joint outside the sealant ratio or tolerance flagged and corrected', item_es: tr('Anchos y profundidades medidos; toda junta fuera de la relación o tolerancia marcada y corregida'), ref: 'UFGS 07 92 00 3.4.1' },
      { item: 'Flashing, sill pans and closures in place before sealant — no sealant used as a substitute', item_es: tr('Tapajuntas, bandejas y cierres colocados antes del sellador; ningún sellador como sustituto'), ref: 'UFGS 07 92 00 3.4.2' },
      { item: 'Faces cleaned per substrate; primer applied where the maker requires it', item_es: tr('Caras limpiadas según el sustrato; imprimador donde el fabricante lo exige'), ref: 'UFGS 07 92 00 3.2, 3.4.5' },
      { item: 'Backer rod or bond breaker in place at the set depth', item_es: tr('Cordón de respaldo o rompedor de adherencia colocado a la profundidad indicada'), ref: 'UFGS 07 92 00 3.4.4, 3.4.6' },
      { item: 'Sealant products and colors match the approved submittal and schedule', item_es: tr('Productos y colores del sellador coinciden con el submittal y la tabla aprobados') },
    ],
    adhesion_test: [
      { item: 'Tests done after full cure on each substrate pair at the agreed rate', item_es: tr('Pruebas hechas después del curado completo en cada par de sustratos a la frecuencia acordada'), ref: 'ASTM C1521 Method A' },
      { item: 'Each test logged: location, date, extension reached, cohesive or adhesive failure', item_es: tr('Cada prueba registrada: ubicación, fecha, elongación alcanzada, falla cohesiva o adhesiva') },
      { item: 'Failed areas cut out, resealed and re-tested; neighboring joints tested', item_es: tr('Áreas falladas retiradas, reselladas y probadas de nuevo; juntas vecinas probadas') },
      { item: 'Test cuts patched and tooled', item_es: tr('Cortes de prueba reparados y alisados') },
    ],
    final_walkthrough: [
      { item: 'Every scheduled joint sealed — no skips at corners, penetrations or louvers', item_es: tr('Todas las juntas de la tabla selladas; sin saltos en esquinas, penetraciones ni rejillas') },
      { item: 'Beads tooled, uniform and free of voids, wrinkles and tape marks', item_es: tr('Cordones alisados, uniformes y sin huecos, arrugas ni marcas de cinta') },
      { item: 'Adjacent finishes clean of smears; adhesion test report turned over', item_es: tr('Acabados adyacentes sin embarres; reporte de pruebas de adherencia entregado') },
    ],
  },
  assemblies: [
    { code: 'G-SEAL-EXT-PERIM-LF', name: 'Exterior perimeter sealant at window/door/louver frames, ≈1/2 in. joint, backer rod + silicone or urethane, per LF', name_es: 'Sellador perimetral exterior en marcos, junta ≈1/2 pulg., cordón + silicón o uretano, por pie lineal', unit: 'LF', csi: '07 92 13',
      material_cost_cents: { v: 110, prov: est('Medium/low-modulus silicone or urethane at ≈1/2 x 1/4 in. bead (~0.2 LF per oz) + backer rod + primer/solvent share, national baseline 2026') },
      labor_hours_per_unit: { v: 0.035, prov: est('Clean, mask, rod, gun and tool from ladder or lift, ≈28 LF/hr') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; lifts priced separately') }, waste_pct: { v: 10, prov: est('nozzle purge, partial tubes, tooling loss') } },
    { code: 'G-SEAL-JOINT-WIDE-LF', name: 'Expansion / control joint sealant, ≈3/4–1 in. wide, primer + backer rod + high-movement sealant, per LF', name_es: 'Sellador de junta de expansión/control, ≈3/4–1 pulg., imprimador + cordón + sellador de alto movimiento, por pie lineal', unit: 'LF', csi: '07 92 13',
      material_cost_cents: { v: 280, prov: est('High-movement silicone/urethane at ≈1 x 1/2 in. bead + large backer rod + primer, national baseline 2026') },
      labor_hours_per_unit: { v: 0.06, prov: est('Grind/clean faces, prime, rod, mix and gun, tool — ≈16 LF/hr') },
      equipment_cost_cents: { v: 5, prov: est('drill mixer / bulk gun share') }, waste_pct: { v: 10, prov: est('mixed-batch pot-life loss') } },
    { code: 'G-SEAL-REMOVE-LF', name: 'Cut out and remove existing sealant and backer, clean joint faces for reseal, per LF', name_es: 'Cortar y retirar sellador y cordón existentes, limpiar caras para resellar, por pie lineal', unit: 'LF', csi: '07 92 00',
      description: 'Non-hazardous sealant only — PCB or asbestos sealant goes to abatement.',
      material_cost_cents: { v: 0, prov: est('no material') },
      labor_hours_per_unit: { v: 0.04, prov: est('Knife/oscillating-tool cut-out, scrape or grind residue, blow out, ≈25 LF/hr') },
      equipment_cost_cents: { v: 10, prov: est('blades, grinder wheels and disposal share') }, waste_pct: { v: 0, prov: est('removal — no waste factor') } },
    { code: 'G-SEAL-ADHTEST-EA', name: 'Field adhesion pull test with patch and logged result, each', name_es: 'Prueba de adherencia en campo con reparación y resultado registrado, c/u', unit: 'EA', csi: '07 92 00',
      material_cost_cents: { v: 100, prov: est('patch sealant + blade share') },
      labor_hours_per_unit: { v: 0.4, prov: est('Access, cut and pull tab, measure, photograph, log, patch and tool') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; lift time in the sealing lines') }, waste_pct: { v: 0, prov: est('per test') } },
  ],
  quantity_rules: [
    { code: 'G-SEAL-EXT-PERIM-LF', assumption: '≈16 LF of exterior perimeter sealant per scheduled window (≈3x5 ft opening) on commercial / multi-family work — single-family window flashing already carries its sealant', when: { building_types: ['commercial', 'residential_mf', 'industrial'] }, qty: { basis: 'windows', mul: 16, round: 'ceil' } },
    { code: 'G-SEAL-EXT-PERIM-LF', assumption: '≈5 LF of exterior perimeter sealant per scheduled door (≈25% of doors are exterior at ≈20 LF each) on commercial / multi-family work', when: { building_types: ['commercial', 'residential_mf', 'industrial'] }, qty: { basis: 'doors', mul: 5, round: 'ceil' } },
    { code: 'G-SEAL-ADHTEST-EA', assumption: 'Field adhesion tests — ≈3 per scheduled window-wall elevation set; assume 8 on a commercial building until the joint total is measured', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 8 } },
  ],
  dependency_hints: [
    { after_trades: ['windows', 'exterior_doors', 'siding', 'masonry', 'metal_panels', 'stucco_eifs'], before_phase: 'punch', note: 'Seal exterior joints after windows, doors and cladding are set and flashed, and before final painting touch-up and punch.' },
  ],
});
