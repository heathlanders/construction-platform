// Trade Knowledge Pack — truss_setting (Truss Supply & Setting). Wave 07 — NEW-TRADE pattern
// (truss_setting is not in HAND_RECIPE_KEYS, so these recipes replace the generic building framing
// branch for truss tasks). Dossier: docs/trade-packs/dossiers/truss_setting.md. Sources: UFGS 06 10 00
// (3.1.15 trusses handled/erected/braced per TPI/BCSI), SBCA/TPI BCSI (reference only), MIOSHA fact
// sheet #025 Wood Truss Bracing, OSHA residential truss fact sheet + residential fall guidance,
// 29 CFR 1926 Subparts C, E, H, I, L, M, O, X, CC; IRC R802.10/R802.11, IBC 2303.4 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const bcsi = { src: ['sbca-bcsi', 'ufgs-06-10-00'], confidence: 'verified' as const, last_verified: D, note: 'UFGS 3.1.15 requires trusses be handled, erected and braced per TPI/BCSI; BCSI paraphrased, no tables.' };
const mi = { src: ['truss_setting-miosha-c025'], confidence: 'verified' as const, last_verified: D };
const ufgs = (note?: string) => ({ src: ['ufgs-06-10-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });

const TRUSS_RE = '\\btruss(?:es)?\\b';
// The post-frame variant keys on the title (pole-barn template task wording).
const POST_FRAME_TRUSS_RE = '\\btruss(?:es)?\\b.*\\b(?:columns?|posts?|poles?|post[- ]frame|truss carriers?)\\b';

export default definePack({
  key: 'truss_setting',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Receives, stores, lifts and sets prefabricated wood roof trusses on walls, headers or post-frame columns, installs the temporary and permanent bracing called for on the truss design drawings, and fastens trusses to their bearings with uplift connectors ready for the framing inspection.',
    summary_es: 'Recibe, almacena, levanta y coloca armaduras (trusses) prefabricadas de madera sobre muros, cabezales o columnas de estructura de postes, instala el arriostramiento temporal y permanente indicado en los planos de diseño de las armaduras y las fija a sus apoyos con conectores anti-levantamiento, lista para la inspección de estructura.',
    glossary: [
      { term: 'Truss placement diagram', term_es: 'Diagrama de colocación de armaduras', def: 'Layout sheet from the truss supplier showing where each truss mark goes.', def_es: 'Plano del proveedor que indica dónde va cada armadura según su marca.' },
      { term: 'Truss design drawing', term_es: 'Plano de diseño de la armadura', def: 'Engineered sheet for each truss showing loads, bearings, connector plates and required bracing.', def_es: 'Hoja de ingeniería de cada armadura con cargas, apoyos, placas conectoras y arriostramiento requerido.' },
      { term: 'Top chord / bottom chord', term_es: 'Cuerda superior / cuerda inferior', def: 'The sloped top members and the flat bottom member of a truss.', def_es: 'Las piezas inclinadas de arriba y la pieza horizontal de abajo de la armadura.' },
      { term: 'Web', term_es: 'Diagonal / montante interior (alma)', def: 'Inside members that connect the chords in a triangle pattern.', def_es: 'Piezas interiores que unen las cuerdas formando triángulos.' },
      { term: 'Girder truss', term_es: 'Armadura maestra (girder)', def: 'A multi-ply truss that carries other trusses hung from it with hangers.', def_es: 'Armadura de varias capas que carga otras armaduras colgadas con colgadores.' },
      { term: 'Ground brace', term_es: 'Puntal a tierra', def: 'Brace from the first truss down to the ground or floor that holds the whole set from tipping.', def_es: 'Puntal desde la primera armadura hasta el suelo o piso que impide que todo el conjunto se vuelque.' },
      { term: 'Continuous lateral restraint (CLR)', term_es: 'Restricción lateral continua (CLR)', def: 'Long 2x lumber run across many trusses to keep members from buckling; must be anchored with diagonals.', def_es: 'Madera 2x larga que cruza muchas armaduras para evitar el pandeo; se ancla con diagonales.' },
      { term: 'Hurricane tie', term_es: 'Conector anti-levantamiento', def: 'Metal connector that holds a truss down to its bearing against wind uplift.', def_es: 'Conector metálico que sujeta la armadura a su apoyo contra el levantamiento por viento.' },
      { term: 'Tag line', term_es: 'Cuerda guía', def: 'Rope tied to a hoisted truss so a worker on the ground can steer it without standing under it.', def_es: 'Cuerda atada a la armadura izada para guiarla desde el suelo sin pararse debajo.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'roof_truss_set',
      example_title: 'Roof truss installation',
      when: { title_re: TRUSS_RE },
      steps: [
        {
          title: 'Receive, inspect and store the trusses',
          instruction: 'Check the delivery against the placement diagram and truss marks; count girders and specialty trusses. Reject trusses with broken members or loose plates. Land bundles on level blocking off the ground, keep them braced so they cannot tip, and cover them if they will sit more than a few days. Keep the truss design drawings and bracing sheets on site.',
          tools: ['tape measure', 'utility knife'],
          materials: ['dunnage / blocking', 'tarps'],
          safety_ids: ['bundle_tip', 'fall_zone'],
          qa_ids: ['delivery_check', 'storage_blocked', 'drawings_on_site'],
        },
        {
          title: 'Prepare bearings and mark the layout',
          instruction: 'Confirm the bearing walls and beams are plumb, braced and fastened, and top plates are straight and level. Mark truss locations on both plates from the placement diagram, including girder and drop-top positions. Set up the ground bracing for the first truss before lifting anything.',
          tools: ['tape measure', 'chalk line', 'level', 'string line'],
          materials: ['2x4 bracing lumber', 'stakes or floor cleats'],
          safety_ids: ['fall_residential', 'ladder'],
          qa_ids: ['bearing_ready', 'layout_marked'],
        },
        {
          title: 'Lift and set the first truss, then brace it',
          instruction: 'Rig the truss at the pick points on its design drawing with a spreader bar on long spans; use tag lines and keep everyone except the receivers out from under the load. Set the first truss (often the gable end) on its marks, fasten it to the bearing and tie it to the ground bracing before releasing the rigging.',
          detail: 'Crane or telehandler operator: check power-line clearance, rated capacity at the reach, and the swing radius barricade before the first pick.',
          tools: ['spreader bar', 'slings', 'tag lines', 'framing nailer'],
          materials: ['ground brace lumber', 'nails'],
          safety_ids: ['fall_zone', 'rigging_failure', 'power_line', 'swing_radius', 'lift_overload', 'fall_residential'],
          qa_ids: ['first_truss_braced'],
        },
        {
          title: 'Set the remaining trusses with temporary bracing',
          instruction: 'Set each truss on its mark, plumb it, fasten it to the bearing and brace its top chord to the set before the rigging comes off. Add diagonal braces as the run grows so the set cannot fall like dominoes. Use full-length 2x lumber with two nails at every truss — no short 1x spacers as the only bracing. Stop setting in high wind.',
          tools: ['framing nailer', 'level', 'tape measure', 'tag lines'],
          materials: ['2x4 temporary lateral and diagonal bracing', 'nails'],
          safety_ids: ['truss_collapse', 'fall_residential', 'fall_zone', 'aerial_lift', 'nailer'],
          qa_ids: ['temp_bracing', 'placement_per_layout', 'plumb_straight', 'no_unbraced_loads'],
        },
        {
          title: 'Install permanent bracing, hangers and uplift ties',
          instruction: 'Install the permanent lateral restraint and diagonal bracing at the locations shown on the truss design drawings, gable-end bracing, and girder hangers fastened in every hole. Install an uplift connector at every bearing. Never cut, notch or drill a truss — get a repair detail from the truss designer for any damage. Leave it open for the framing inspection with drawings on site.',
          tools: ['framing nailer', 'palm nailer', 'drill/driver'],
          materials: ['2x permanent bracing lumber', 'girder hangers', 'hurricane ties / uplift connectors', 'connector nails or screws'],
          safety_ids: ['truss_collapse', 'fall_residential', 'ladder', 'nailer'],
          qa_ids: ['permanent_bracing', 'girder_hangers', 'uplift_ties', 'no_alteration'],
          gating_inspection_type: 'framing',
          code_refs: [
            { section: 'R802.10.3', code_type: 'IRC', note: 'Truss bracing per the construction documents or truss design drawings' },
            { section: 'R802.11', code_type: 'IRC', note: 'Roof tie-down — uplift resistance at each truss bearing' },
            { section: 'R802.10.4', code_type: 'IRC', note: 'No cutting or altering trusses without an approved design' },
          ],
        },
      ],
    },
    {
      id: 'post_frame_truss_set',
      example_title: 'Set roof trusses & header beams on columns',
      when: { title_re: POST_FRAME_TRUSS_RE },
      priority: 10,
      steps: [
        {
          title: 'Receive, inspect and store the trusses',
          instruction: 'Check trusses and header (truss carrier) stock against the building plans and truss marks. Reject damaged trusses. Store bundles on level blocking, braced against tipping, and keep the truss design drawings on site.',
          tools: ['tape measure'],
          materials: ['dunnage / blocking', 'tarps'],
          safety_ids: ['bundle_tip', 'fall_zone'],
          qa_ids: ['delivery_check', 'storage_blocked', 'drawings_on_site'],
        },
        {
          title: 'Set headers on the columns',
          instruction: 'Check that columns are plumb, braced and cut to the plan height. Fasten the header or truss-carrier plies to the columns with the fasteners and notching shown on the plans, level along the run, and mark the truss spacing on the header.',
          tools: ['level', 'string line', 'impact driver', 'chainsaw or beam saw'],
          materials: ['header / truss carrier lumber', 'structural screws or bolts per plan'],
          safety_ids: ['fall_residential', 'aerial_lift', 'ladder'],
          qa_ids: ['bearing_ready', 'header_fastened', 'layout_marked'],
        },
        {
          title: 'Lift and set trusses on the headers',
          instruction: 'Rig each truss at its pick points with tag lines and lift with the crane or telehandler; workers receiving the truss work from a lift, not from the header. Set the end truss first and brace it, then set each truss on its mark, fasten it to the header or column per the plans and brace it before releasing the rigging.',
          detail: 'Check power-line clearance, rated capacity at the reach, and the swing radius barricade before the first pick.',
          tools: ['spreader bar', 'slings', 'tag lines', 'impact driver'],
          materials: ['truss-to-header fasteners or brackets per plan', '2x temporary bracing'],
          safety_ids: ['fall_zone', 'rigging_failure', 'power_line', 'swing_radius', 'lift_overload', 'truss_collapse', 'aerial_lift'],
          qa_ids: ['first_truss_braced', 'placement_per_layout', 'temp_bracing', 'plumb_straight'],
        },
        {
          title: 'Brace and tie down before purlins',
          instruction: 'Install the permanent truss bracing and the knee or diagonal braces shown on the plans, and fasten every truss-to-header or truss-to-column connection fully. Do not stack purlins or roof steel on the trusses until the bracing is complete. Leave it open for the framing inspection.',
          tools: ['impact driver', 'framing nailer', 'level'],
          materials: ['2x permanent bracing lumber', 'connectors / structural screws per plan'],
          safety_ids: ['truss_collapse', 'unbraced_loads', 'fall_residential', 'nailer'],
          qa_ids: ['permanent_bracing', 'uplift_ties', 'no_unbraced_loads', 'no_alteration'],
          gating_inspection_type: 'framing',
          code_refs: [
            { section: '2303.4', code_type: 'IBC', note: 'Trusses — design drawings, bracing and installation' },
            { section: 'R802.10.3', code_type: 'IRC', note: 'Truss bracing per the truss design drawings' },
          ],
        },
      ],
    },
  ],
  code_refs: {
    framing: [
      { section: 'R802.10.1', code_type: 'IRC', note: 'Truss design drawings delivered to the job site and available to the inspector', prov: icc },
      { section: 'R802.10.3', code_type: 'IRC', note: 'Trusses braced per the construction documents or truss design drawings', prov: icc },
      { section: 'R802.10.4', code_type: 'IRC', note: 'Truss members not cut, notched or altered without an approved design', prov: icc },
      { section: 'R802.11', code_type: 'IRC', note: 'Roof tie-down — trusses connected to resist uplift', prov: icc },
      { section: '2303.4', code_type: 'IBC', note: 'Trusses — design, drawings, bracing and installation on commercial work', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: TRUSS_RE }, type: 'telehandler', reason: 'Lift truss bundles to the bearing walls and set individual trusses', optional: true },
    { when: { title_re: TRUSS_RE, building_types: ['commercial', 'residential_mf', 'industrial'] }, type: 'crane', reason: 'Set long-span trusses or pre-braced truss sections', optional: true },
    { when: { title_re: POST_FRAME_TRUSS_RE }, type: 'crane', reason: 'Set long-span post-frame trusses onto headers', optional: true },
    { when: { title_re: POST_FRAME_TRUSS_RE }, type: 'boom_lift', reason: 'Receive and fasten trusses at the header without standing on the structure', optional: true },
    { when: { title_re: TRUSS_RE, building_types: ['commercial', 'industrial'] }, type: 'boom_lift', reason: 'Receive and fasten trusses at the bearing without standing on the structure', optional: true },
    { when: { title_re: TRUSS_RE }, type: 'air_compressor', reason: 'Pneumatic nailers for bracing and connectors', optional: true },
  ],
  hazards: [
    { id: 'fall_residential', hazard: 'Fall from top plates, headers or trusses while setting and bracing', hazard_es: PENDING_ES, controls: ['Provide guardrails, nets or personal fall arrest at 6 ft or more; use a written site-specific fall protection plan only if those are infeasible', 'Work from scaffolds, lifts or ladders until a braced multi-truss section gives a safe anchor'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(13)', severity: 4, ppe: ['harness and lanyard when required'], prov: { src: ['ecfr-1926-m', 'truss_setting-osha-fs-trusses', 'truss_setting-osha-res-fall'], confidence: 'verified', last_verified: D } },
    { id: 'truss_collapse', hazard: 'Unbraced trusses falling over like dominoes onto workers', hazard_es: PENDING_ES, controls: ['Brace each truss to the set before releasing the rigging; add diagonals as the run grows', 'Use full-length 2x bracing with two nails per truss; a competent person checks bracing before loading and after wind'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(2)', severity: 4, prov: { src: ['ecfr-1926-c', 'truss_setting-miosha-c025'], confidence: 'verified', last_verified: D, note: 'General competent-person duty; bracing practice per BCSI (reference) as summarized by MIOSHA.' } },
    { id: 'fall_zone', hazard: 'Struck by a truss or bundle being hoisted or landed', hazard_es: PENDING_ES, controls: ['Keep everyone out of the fall zone except workers hooking, guiding or receiving the load', 'Steer loads with tag lines; never ride or stand under a load'], controls_es: PENDING_ES, osha_ref: '1926.1425(b)', severity: 4, ppe: ['hard hat'], prov: osha('cc') },
    { id: 'power_line', hazard: 'Crane or telehandler boom or load contacting overhead power lines', hazard_es: PENDING_ES, controls: ['Identify the work zone and check clearance to power lines before any lift', 'Use a dedicated spotter when equipment may get close to the lines'], controls_es: PENDING_ES, osha_ref: '1926.1408(a)', severity: 4, prov: osha('cc') },
    { id: 'swing_radius', hazard: 'Struck or pinched by the rotating crane superstructure', hazard_es: PENDING_ES, controls: ['Train crew on swing hazard areas and barricade the swing radius', 'Keep the barricade up for the whole lift'], controls_es: PENDING_ES, osha_ref: '1926.1424(a)(2)', severity: 3, prov: osha('cc') },
    { id: 'rigging_failure', hazard: 'Dropped truss from a failed sling, hook or bad pick point', hazard_es: PENDING_ES, controls: ['Inspect slings and rigging before each shift; remove damaged gear', 'Pick at the points on the truss design drawing; use a spreader bar on long spans'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 4, prov: { ...osha('h'), note: 'Pick points/spreader use per BCSI (reference).' } },
    { id: 'lift_overload', hazard: 'Telehandler or forklift tipping from an overloaded or over-reached pick', hazard_es: PENDING_ES, controls: ['Stay within the posted rated capacity for the boom angle and reach', 'Set up on firm, level ground; trained operators only'], controls_es: PENDING_ES, osha_ref: '1926.602(c)(1)(i)', severity: 4, prov: osha('o') },
    { id: 'unbraced_loads', hazard: 'Collapse from stacking sheathing, purlins or roofing on unbraced trusses', hazard_es: PENDING_ES, controls: ['Do not stack any material on trusses until permanent bracing is complete', 'Spread loads over the bearings, never mid-span; never point-load a truss'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(2)(i)', severity: 4, prov: { src: ['ecfr-1926-h', 'truss_setting-miosha-c025'], confidence: 'verified', last_verified: D, note: 'Safe-load limit duty; no point loads per MIOSHA/BCSI.' } },
    { id: 'bundle_tip', hazard: 'Stored truss bundles tipping or sliding onto workers', hazard_es: PENDING_ES, controls: ['Store bundles on level blocking and brace them so they cannot slide or tip'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 3, prov: osha('h') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from an aerial lift basket while receiving trusses', hazard_es: PENDING_ES, controls: ['Wear a harness and lanyard tied to the boom or basket', 'Stand on the basket floor — never on the rails'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'ladder', hazard: 'Ladder slip or overreach while bracing or installing ties', hazard_es: PENDING_ES, controls: ['Extend ladder rails 3 ft above the landing and secure the top', 'Keep three points of contact; move the ladder instead of reaching'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'nailer', hazard: 'Puncture wounds from pneumatic nailers', hazard_es: PENDING_ES, controls: ['Keep the muzzle safety working; never bypass it', 'Never point the tool at anyone; disconnect air before clearing jams'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(3)', severity: 3, ppe: ['safety glasses'], prov: osha('i') },
  ],
  qa_checklist: [
    { id: 'delivery_check', item: 'Delivery matches the placement diagram (marks and counts); no broken chords or webs, missing or loose connector plates.', item_es: tr('La entrega coincide con el diagrama de colocación (marcas y cantidades); sin cuerdas o diagonales rotas ni placas conectoras faltantes o sueltas.'), prov: mi },
    { id: 'storage_blocked', item: 'Trusses stored on level blocking off the ground, braced against tipping and protected from weather.', item_es: tr('Armaduras almacenadas sobre bloques nivelados, separadas del suelo, arriostradas contra vuelco y protegidas de la intemperie.'), prov: bcsi },
    { id: 'drawings_on_site', item: 'Truss design drawings, placement diagram and bracing sheets on site for the crew and inspector.', item_es: tr('Planos de diseño, diagrama de colocación y hojas de arriostramiento de las armaduras en obra para la cuadrilla y el inspector.'), prov: icc },
    { id: 'bearing_ready', item: 'Bearing walls, beams or headers plumb, braced and fastened before trusses are landed on them.', item_es: tr('Muros de apoyo, vigas o cabezales a plomo, arriostrados y fijados antes de colocar las armaduras.'), prov: mi },
    { id: 'layout_marked', item: 'Truss locations marked on both bearings from the placement diagram, including girder and specialty positions.', item_es: tr('Ubicación de cada armadura marcada en ambos apoyos según el diagrama, incluidas las maestras y especiales.'), prov: bcsi },
    { id: 'header_fastened', phase: 'framing', item: 'Post-frame headers / truss carriers fastened to every column with the fasteners and notching shown on the plans.', item_es: tr('Cabezales o portaarmaduras de estructura de postes fijados a cada columna con los sujetadores y muescas del plano.'), prov: ufgs('3.1 — fasten per drawings') },
    { id: 'placement_per_layout', item: 'Each truss sits on its marked location at the drawing spacing, with girders and specialty trusses in the right place and full bearing.', item_es: tr('Cada armadura en su marca con la separación del plano, maestras y especiales en su lugar y con apoyo completo.'), prov: bcsi },
    { id: 'plumb_straight', item: 'Trusses set plumb and straight within the tolerances given in the truss design drawings or bracing guide.', item_es: tr('Armaduras a plomo y rectas dentro de las tolerancias de los planos de diseño o la guía de arriostramiento.'), prov: bcsi },
    { id: 'first_truss_braced', item: 'First truss (or gable end) tied to ground bracing before the next truss is set.', item_es: PENDING_ES, safety: true, prov: bcsi },
    { id: 'temp_bracing', item: 'Temporary lateral and diagonal bracing of full-length 2x lumber, two nails per truss, installed as each truss is set — no 1x spacers as the only bracing.', item_es: PENDING_ES, safety: true, prov: { src: ['truss_setting-miosha-c025', 'sbca-bcsi'], confidence: 'verified', last_verified: D } },
    { id: 'no_unbraced_loads', item: 'No sheathing, purlins or roofing stacked on trusses until bracing is complete; no point loads mid-span.', item_es: PENDING_ES, safety: true, prov: mi },
    { id: 'permanent_bracing', item: 'Permanent lateral restraint and diagonal bracing installed at every location shown on the truss design drawings.', item_es: PENDING_ES, safety: true, prov: bcsi },
    { id: 'no_alteration', item: 'No truss member cut, notched, drilled or repaired in the field without a written repair detail from the truss designer.', item_es: PENDING_ES, safety: true, prov: { src: ['truss_setting-miosha-c025', 'icc-pa'], confidence: 'verified', last_verified: D } },
    { id: 'girder_hangers', item: 'Girder plies fastened together as specified and every hanger nailed or screwed in all required holes.', item_es: tr('Capas de la armadura maestra unidas según lo indicado y cada colgador clavado o atornillado en todos los orificios requeridos.'), prov: ufgs('3.1.14 metal framing anchors') },
    { id: 'uplift_ties', item: 'Uplift connector installed at every truss bearing and fully fastened per the maker.', item_es: tr('Conector anti-levantamiento en cada apoyo de armadura, totalmente fijado según el fabricante.'), prov: ufgs('3.1.14 metal framing anchors') },
  ],
  inspection_checklists: {
    framing: [
      { item: 'Truss design drawings and placement diagram on site', item_es: PENDING_ES, ref: 'R802.10.1' },
      { item: 'Trusses at plan spacing with full bearing; girders and hangers as drawn', item_es: PENDING_ES, ref: 'R802.10' },
      { item: 'Permanent lateral and diagonal bracing at drawing locations', item_es: PENDING_ES, ref: 'R802.10.3' },
      { item: 'No cut, notched or field-altered truss members; repairs have an engineer detail', item_es: PENDING_ES, ref: 'R802.10.4' },
      { item: 'Uplift connectors at every truss bearing', item_es: PENDING_ES, ref: 'R802.11' },
    ],
  },
  assemblies: [
    { code: 'B-TRS-TRUSS-EA', name: 'Wood roof truss, common, ≈24–32 ft span, supply only, each', name_es: 'Armadura de techo de madera común, claro ≈24–32 pies, solo suministro, c/u', unit: 'EA', csi: '06 17 53',
      description: 'Supply only — setting is B-TRS-SET-EA. Remove if your B-FRAME-SF rate already includes roof framing.',
      material_cost_cents: { v: 17500, prov: est('supplier spot pricing for metal-plate-connected common trusses, national baseline 2026 — volatile with lumber') }, labor_hours_per_unit: { v: 0, prov: est('supply only') },
      equipment_cost_cents: { v: 0, prov: est('delivery included in supplier price') }, waste_pct: { v: 0, prov: est('engineered to order') } },
    { code: 'B-TRS-SET-EA', name: 'Set roof truss incl. temporary bracing, per truss', name_es: 'Colocación de armadura de techo con arriostramiento temporal, por armadura', unit: 'EA', csi: '06 17 53',
      description: 'Labor + temporary bracing lumber. Lift equipment is priced by the EQUIP-CRANE / EQUIP-TELEHANDLER day rows.',
      material_cost_cents: { v: 300, prov: est('share of 2x4 temporary bracing + nails per truss') }, labor_hours_per_unit: { v: 0.8, prov: est('4-person crew sets and temp-braces ≈40 trusses/day with a lift') },
      equipment_cost_cents: { v: 0, prov: est('see EQUIP rows') }, waste_pct: { v: 5, prov: est('bracing cut-offs') } },
    { code: 'B-TRS-BRACE-LF', name: 'Permanent truss bracing, 2x4 lateral restraint + diagonals, per LF', name_es: 'Arriostramiento permanente de armaduras, restricción lateral 2x4 y diagonales, por pie lineal', unit: 'LF', csi: '06 17 53',
      material_cost_cents: { v: 75, prov: est('2x4 SPF + nails per LF, national baseline 2026') }, labor_hours_per_unit: { v: 0.015, prov: est('install from inside the truss set') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('lap and end cuts') } },
    { code: 'B-TRS-HANGER-EA', name: 'Truss-to-girder hanger, installed, each', name_es: 'Colgador de armadura a armadura maestra, instalado, c/u', unit: 'EA', csi: '06 05 23',
      material_cost_cents: { v: 3000, prov: est('galvanized truss hanger + specified fasteners') }, labor_hours_per_unit: { v: 0.33, prov: est('position and fasten every hole') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
  ],
  quantity_rules: [
    { code: 'B-TRS-TRUSS-EA', assumption: 'Engineered roof trusses on plans — assume ≈30 trusses (≈60 ft roof at 24 in. o.c.) until the placement diagram is read', when: { facts_any: ['engineered_trusses'] }, qty: { basis: { component: 'engineered_trusses' }, mul: 30 } },
    { code: 'B-TRS-SET-EA', assumption: 'Set ≈30 trusses with temporary bracing until the placement diagram is read', when: { facts_any: ['engineered_trusses'] }, qty: { basis: { component: 'engineered_trusses' }, mul: 30 } },
    { code: 'B-TRS-BRACE-LF', assumption: 'Permanent bracing ≈200 LF (lateral restraint rows + diagonals for a ≈60 ft roof) until the truss drawings are read', when: { facts_any: ['engineered_trusses'] }, qty: { basis: { component: 'engineered_trusses' }, mul: 200 } },
  ],
  dependency_hints: [
    { after_trades: ['framing', 'post_frame'], before_phase: 'roofing', note: 'Trusses set after bearing walls or columns and headers are framed and braced, and before roof sheathing or purlins.' },
  ],
});
