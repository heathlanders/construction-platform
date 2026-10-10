// Trade Knowledge Pack — rigging_millwright (Rigging / Millwright / Machinery Moving). Wave 18 — NEW-TRADE
// pattern (no hand recipe, no template tasks). Dossier: docs/trade-packs/dossiers/rigging_millwright.md.
// permit_trade null → no gating inspections and no code refs; owner/engineer hold points live in
// inspection_checklists (lift_plan_review, pre_move_check, final_alignment, grout_acceptance).
// Sources: 29 CFR 1926.251 (Subpart H rigging), 1926.305 (Subpart I jacks), 1926.250 (floor load limits),
// 1926.602(c) (Subpart O industrial trucks), 1926.417 (Subpart K lockout/tagging), 1926 Subpart CC
// (1926.1408 power lines, 1926.1417(o) load weight, 1926.1419 signals, 1926.1425 fall zone), Subparts E/M;
// ASME B30.1 / B30.9 / B30.26 (reference only); manufacturer epoxy-grout literature (paraphrased).
// NOTE: 1926.1400(c) excludes hydraulic gantries, plain forklifts and come-alongs/chainfalls from Subpart CC —
// 1926.251 still governs the rigging on those moves.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string, ...extra: string[]) => ({ src: [`ecfr-1926-${sub}`, ...extra], confidence: 'verified' as const, last_verified: D });
const rig = { src: ['rigging_millwright-ecfr-1926-251', 'ecfr-1926-h'], confidence: 'verified' as const, last_verified: D };
const jack = { src: ['rigging_millwright-ecfr-1926-305', 'ecfr-1926-i'], confidence: 'verified' as const, last_verified: D };
const fallzone = { src: ['rigging_millwright-ecfr-1926-1425', 'ecfr-1926-cc'], confidence: 'verified' as const, last_verified: D };
const asme = (...ids: string[]) => ({ src: ids.map((i) => `rigging_millwright-asme-${i}`), confidence: 'derived' as const, last_verified: D, note: 'Practice described in our own words; the ASME standard is reference-only and governs details.' });
const grout = { src: ['rigging_millwright-itw-chockfast'], confidence: 'derived' as const, last_verified: D, note: 'General epoxy/nonshrink machinery-grout practice; the data sheet of the product used governs mix, pour depth, temperature and cure.' };
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });

const MOVE_RE = '\\bmillwright\\b|\\bmachinery\\s+(?:mov\\w*|set\\w*|rigging|install\\w*)\\b|\\b(?:machine|machinery|equipment|press|skid)\\b[^.]*\\b(?:relocat\\w*|skat\\w*|rig(?:ging)?\\s+(?:in|out))\\b';
const ALIGN_RE = '\\b(?:laser|shaft|precision)\\s+align\\w*|\\bgrout\\w*\\b[^.]*\\b(?:base\\s*plates?|sole\\s*plates?|skid|machine\\w*|equipment)\\b|\\b(?:base\\s*plates?|sole\\s*plates?)\\b[^.]*\\bgrout\\w*';
const LIFT_RE = '\\b(?:critical|tandem|crane|engineered)\\s+(?:pick|lift)\\b|\\b(?:lift|rigging)\\s+plan\\b';

export default definePack({
  key: 'rigging_millwright',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Moves, sets, levels and aligns industrial machinery and heavy equipment — planning the load path and floor capacity, locking out existing machines, rigging and jacking onto skates, crane lifts under a lift plan, precision shaft alignment, and grouting baseplates.',
    summary_es: 'Mueve, coloca, nivela y alinea maquinaria industrial y equipo pesado — planifica la ruta de la carga y la capacidad del piso, bloquea las máquinas existentes, aparejos y gatos para montar en patines, izajes con grúa según un plan de izaje, alineación de precisión de ejes y relleno con grout de placas base.',
    glossary: [
      { term: 'Center of gravity (CG)', term_es: 'Centro de gravedad (CG)', def: 'The balance point of the load; the hook must be directly over it or the load tilts when it leaves the ground.', def_es: 'El punto de equilibrio de la carga; el gancho debe quedar justo encima o la carga se inclina al despegar.' },
      { term: 'Working load limit (WLL)', term_es: 'Límite de carga de trabajo (WLL)', def: 'The most a sling or piece of hardware is rated to hold, shown on its tag.', def_es: 'Lo máximo que una eslinga o accesorio puede sostener según su etiqueta.' },
      { term: 'Machinery skates', term_es: 'Patines para maquinaria', def: 'Low roller dollies placed under a machine so it can be pushed or towed across a floor.', def_es: 'Carros bajos de rodillos que se ponen bajo una máquina para empujarla o remolcarla por el piso.' },
      { term: 'Cribbing', term_es: 'Encamado (cribbing)', def: 'Stacked timber blocks that hold a raised load so it cannot drop if a jack fails.', def_es: 'Bloques de madera apilados que sostienen una carga levantada para que no caiga si falla un gato.' },
      { term: 'Lift plan', term_es: 'Plan de izaje', def: 'Written plan for a crane pick: load weight and CG, crane and configuration, rigging, radius, ground and power-line checks.', def_es: 'Plan escrito para un izaje con grúa: peso y CG de la carga, grúa y configuración, aparejos, radio, revisión del terreno y líneas eléctricas.' },
      { term: 'Fall zone', term_es: 'Zona de caída', def: 'The area where a load could land if it dropped; only the people hooking or landing it may be there.', def_es: 'El área donde caería una carga si se soltara; solo pueden estar ahí quienes la enganchan o la reciben.' },
      { term: 'Soft foot', term_es: 'Pata coja (soft foot)', def: 'A machine foot that does not sit flat on its base; it twists the frame when bolted and spoils alignment.', def_es: 'Una pata de la máquina que no asienta plana; tuerce el bastidor al apretarla y arruina la alineación.' },
      { term: 'Shaft alignment', term_es: 'Alineación de ejes', def: 'Lining up the driver and driven shafts (motor to pump, for example) so they turn on one center line.', def_es: 'Alinear los ejes del motor y del equipo accionado (motor y bomba, por ejemplo) para que giren sobre una misma línea de centro.' },
      { term: 'Baseplate grout', term_es: 'Grout de placa base', def: 'Nonshrink cement or epoxy grout poured under a machine base to give full, permanent bearing on the foundation.', def_es: 'Grout de cemento sin contracción o epóxico vertido bajo la base de la máquina para dar apoyo completo y permanente sobre la cimentación.' },
      { term: 'Tag line', term_es: 'Cuerda guía', def: 'Rope tied to a hoisted load so a worker can steer it from outside the fall zone.', def_es: 'Cuerda atada a la carga izada para que un trabajador la guíe desde fuera de la zona de caída.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'machinery_move_set',
      example_title: 'Machinery moving — relocate press to Bay 3',
      when: { title_re: MOVE_RE },
      steps: [
        {
          title: 'Walk the path and check floor capacity',
          instruction: 'Get the machine weight and center of gravity from the maker’s data or by calculation — never guess. Walk the whole route to the new spot: door widths, overhead clearance, ramps, trenches, floor joints and elevated slabs. Compare the machine weight on skates or forklift wheels with the posted floor load limit; where the route crosses a suspended slab or a trench cover, get the owner’s engineer to confirm it or plate it.',
          tools: ['tape measure', 'laser distance meter', 'flashlight'],
          materials: ['steel plates or timber mats for weak spots', 'cones and barricade tape'],
          safety_ids: ['floor_overload', 'load_unknown'],
          qa_ids: ['weight_cg_known', 'floor_capacity_checked'],
        },
        {
          title: 'Lock out and disconnect the existing machine',
          instruction: 'Have the owner’s electrician and pipefitter lock and tag every energy source — power, air, hydraulic, steam, gas — and verify zero energy by trying the start control. Drain fluids, bleed accumulators and secure loose parts, doors and tooling so nothing shifts during the move.',
          tools: ['locks and tags', 'voltage tester (electrician)', 'drain pans'],
          materials: ['tie-downs', 'absorbent pads'],
          safety_ids: ['stored_energy', 'pinch_crush'],
          qa_ids: ['loto_verified'],
        },
        {
          title: 'Jack, crib and set the skates',
          instruction: 'Jack at the maker’s lifting points with jacks rated above the share of load they carry, on cribbed bases, with a wood cap block where the jack head could slip. Raise a little at a time and crib right behind the lift so the load is always supported. Set the skates under solid frame points, square to the travel direction, then lower onto them evenly.',
          tools: ['hydraulic toe jacks', 'machinery skates', 'pry bars', 'level'],
          materials: ['hardwood cribbing', 'cap blocks', 'shims'],
          safety_ids: ['jack_drop', 'pinch_crush'],
          qa_ids: ['jack_rating_cribbing'],
        },
        {
          title: 'Move the machine along the planned route',
          instruction: 'Push or tow slowly with a forklift or winch through rated rigging, with a person on each corner watching the skates and one person giving signals. Keep everyone out of the line between the machine and walls or columns. Stop and re-crib before any slope, joint or turn the plan did not cover.',
          tools: ['forklift or electric tugger', 'come-along', 'radios'],
          materials: ['rated slings and shackles'],
          safety_ids: ['forklift_tip', 'pinch_crush', 'rigging_failure'],
          qa_ids: ['rigging_inspected', 'signals_agreed'],
        },
        {
          title: 'Set, level and anchor in the new position',
          instruction: 'Jack off the skates onto the layout marks, check location against the drawing and rough-level the machine on its feet or leveling pads. Install anchors only as the maker or engineer specifies. Leave locks in place until the owner signs off the new hookup.',
          tools: ['precision level', 'chalk line', 'hammer drill', 'torque wrench'],
          materials: ['anchors per maker', 'leveling pads or shims'],
          safety_ids: ['jack_drop', 'pinch_crush', 'stored_energy'],
          qa_ids: ['location_level', 'anchors_torqued'],
        },
      ],
    },
    {
      id: 'precision_alignment_grout',
      example_title: 'Laser alignment and grouting — pump baseplate',
      priority: 10,
      when: { title_re: ALIGN_RE },
      steps: [
        {
          title: 'Prepare the foundation and anchor bolts',
          instruction: 'Confirm the foundation concrete has reached the strength the engineer specifies. Chip off laitance to sound, rough concrete, blow it clean, and check anchor bolt location and projection against the base. Clean bolt sleeves and wrap bolts where the grout must not bond.',
          tools: ['chipping hammer', 'wire brush', 'tape measure'],
          materials: ['bolt sleeve filler or wrap'],
          safety_ids: ['silica_dust', 'pinch_crush'],
        },
        {
          title: 'Set and level the baseplate',
          instruction: 'Set the baseplate on its jack screws or shim packs at the bolt locations and level it to the maker’s tolerance in both directions. Check every foot for soft foot with a feeler gauge and correct it before any alignment.',
          tools: ['precision machinist level', 'feeler gauges', 'jack screws'],
          materials: ['stainless shim packs'],
          safety_ids: ['pinch_crush', 'jack_drop'],
          qa_ids: ['soft_foot'],
        },
        {
          title: 'Rough and final shaft alignment',
          instruction: 'With the drive locked out, mount a laser or dial-indicator system on the coupling halves and move the driver until offset and angle in both planes are within the maker’s tolerance, allowing for the thermal growth the maker lists. Record as-found and as-left readings.',
          tools: ['laser shaft alignment system or dial indicators', 'feeler gauges', 'torque wrench'],
          materials: ['shims'],
          safety_ids: ['stored_energy', 'pinch_crush'],
          qa_ids: ['loto_verified', 'alignment_recorded'],
        },
        {
          title: 'Form and pour the grout',
          instruction: 'Build tight, sealed forms with a head box on the pour side. Mix and place nonshrink cement or epoxy grout exactly as its data sheet says for temperature, pour depth and working time. Pour from one side only so air is pushed out, and keep pouring until grout rises on the far side — no rodding that traps air under the plate.',
          tools: ['mixing drill and paddle', 'head box', 'thermometer'],
          materials: ['nonshrink cement or epoxy machinery grout', 'form lumber and sealant'],
          safety_ids: ['grout_chem'],
          qa_ids: ['grout_full_bearing'],
        },
        {
          title: 'Torque anchors and re-check alignment',
          instruction: 'After the grout cures for the time on its data sheet, back off or remove jack screws as the maker directs, torque the anchor bolts in sequence, and re-check soft foot and shaft alignment. Sound the base for voids and hand the final readings to the owner.',
          tools: ['torque wrench', 'laser alignment system', 'hammer for sounding'],
          materials: [],
          safety_ids: ['stored_energy'],
          qa_ids: ['anchors_torqued', 'alignment_recorded', 'grout_full_bearing'],
        },
      ],
    },
    {
      id: 'critical_lift',
      example_title: 'Critical lift — set rooftop chiller per lift plan',
      priority: 20,
      when: { title_re: LIFT_RE },
      steps: [
        {
          title: 'Write and review the lift plan',
          instruction: 'Write the lift plan: verified load weight and CG, crane model and configuration, radius and capacity from the load chart, rigging weight included, ground bearing under outriggers, and every power line within the working radius. Review it with the operator, the rigger and the owner before the crane arrives.',
          tools: ['crane load chart', 'site plan', 'tape measure'],
          materials: ['lift plan form'],
          safety_ids: ['load_unknown', 'power_line'],
          qa_ids: ['lift_plan_signed', 'weight_cg_known', 'power_line_zone'],
        },
        {
          title: 'Select and inspect the rigging',
          instruction: 'Choose slings and hardware with a rated load above each leg’s share at the planned sling angle. A competent person inspects every sling, shackle and below-the-hook device for tags, cuts, kinks, broken wires and heat damage before the shift; remove anything bad from service. Pad every sharp edge.',
          tools: ['sling angle chart', 'tape measure'],
          materials: ['rated slings', 'shackles', 'spreader or lifting beam', 'edge protectors'],
          safety_ids: ['rigging_failure', 'sling_cut'],
          qa_ids: ['rigging_inspected'],
        },
        {
          title: 'Set up the fall zone and signals',
          instruction: 'Barricade the fall zone and the swing radius. Name one qualified signal person and agree the hand or radio signals with the operator. Tie tag lines to the load so nobody has to stand under it.',
          tools: ['radios', 'barricade tape and cones'],
          materials: ['tag lines'],
          safety_ids: ['suspended_load', 'power_line'],
          qa_ids: ['fall_zone_barricaded', 'signals_agreed'],
        },
        {
          title: 'Make a test pick, then lift and land',
          instruction: 'Take up slack slowly, lift a few inches and hold: check the load is level, the rigging is seated and the crane is stable. Lift smoothly without jerking or shock loading. Keep hands out from between sling and load. Only the people receiving the load go near it as it lands; land it on cribbing or its supports before unhooking.',
          tools: ['radios', 'tag lines'],
          materials: ['cribbing'],
          safety_ids: ['suspended_load', 'pinch_crush', 'rigging_failure'],
          qa_ids: ['test_lift'],
        },
        {
          title: 'Unhook and clear the rigging',
          instruction: 'Unhook only after the load is fully supported — never drag a sling out from under a resting load. Re-inspect the rigging, tag anything damaged out of service, and remove idle rigging from the work area.',
          tools: [],
          materials: [],
          safety_ids: ['rigging_failure', 'pinch_crush'],
          qa_ids: ['rigging_inspected'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: MOVE_RE }, step_re: '\\bmove\\b', type: 'forklift', reason: 'Tow or push the machine on skates along the planned route', optional: true },
    { when: { title_re: LIFT_RE }, step_re: '\\blift and land\\b', type: 'crane', reason: 'Crane sized from the lift plan load chart for the pick' },
  ],
  hazards: [
    { id: 'rigging_failure', hazard: 'Load drops when a damaged, unmarked or overloaded sling or rigging hardware fails', hazard_es: PENDING_ES, controls: ['Competent person inspects all rigging before each shift and removes defective gear', 'Use only gear with a legible rated-load tag and never exceed it at the actual sling angle', 'No shock loading; balance basket hitches'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 4, ppe: ['hard hat', 'steel-toe boots'], prov: rig },
    { id: 'sling_cut', hazard: 'Sling cut through on a sharp load edge and the load falls', hazard_es: PENDING_ES, controls: ['Pad or protect slings at every sharp edge', 'Never shorten a sling with knots or bolts'], controls_es: PENDING_ES, osha_ref: '1926.251(c)(9)', severity: 4, prov: rig },
    { id: 'pinch_crush', hazard: 'Hands or feet caught between sling and load, between load and cribbing, or between the machine and a wall or column', hazard_es: PENDING_ES, controls: ['Keep hands out from between the sling and the load while it tightens', 'Use push sticks and tag lines instead of hands', 'Stand clear of the line between a moving machine and fixed objects'], controls_es: PENDING_ES, osha_ref: '1926.251(c)(10)', severity: 3, ppe: ['work gloves', 'steel-toe boots'], prov: rig },
    { id: 'suspended_load', hazard: 'Struck or crushed by a hoisted load while standing in the fall zone', hazard_es: PENDING_ES, controls: ['Barricade the fall zone; only workers hooking, guiding or landing the load may enter', 'Rig against shifting and use self-closing hook latches; rigging done by a qualified rigger', 'Use tag lines and a qualified signal person when the operator cannot see the load'], controls_es: PENDING_ES, osha_ref: '1926.1425(b)', severity: 4, ppe: ['hard hat', 'high-visibility vest'], prov: { src: ['rigging_millwright-ecfr-1926-1425', 'ecfr-1926-cc'], confidence: 'verified', last_verified: D } },
    { id: 'load_unknown', hazard: 'Crane or rigging overloaded because the load weight or center of gravity was guessed', hazard_es: PENDING_ES, controls: ['Get the weight from the manufacturer or a recognized calculation and give it to the operator before the lift', 'Find the CG and put the hook over it; make a short test lift'], controls_es: PENDING_ES, osha_ref: '1926.1417(o)(3)', severity: 4, prov: osha('cc') },
    { id: 'power_line', hazard: 'Electrocution when the crane, load line or load comes near an overhead power line', hazard_es: PENDING_ES, controls: ['Identify the work zone and every power line within the crane’s maximum working radius', 'Keep 20 ft clearance or have the utility de-energize and ground the line', 'Use a dedicated spotter and warning lines when clearance is tight'], controls_es: PENDING_ES, osha_ref: '1926.1408(a)(2)', severity: 4, prov: osha('cc') },
    { id: 'jack_drop', hazard: 'Machine falls when a jack slips, kicks out or fails during jacking', hazard_es: PENDING_ES, controls: ['Use jacks with a marked rating above their share of the load', 'Crib the jack base and use a wood cap block where the head can slip', 'Crib or block the load as soon as it is raised; never work under a load on jacks alone'], controls_es: PENDING_ES, osha_ref: '1926.305(d)(1)(i)', severity: 4, prov: jack },
    { id: 'floor_overload', hazard: 'Floor, slab, trench cover or ramp collapses under the concentrated wheel or skate load', hazard_es: PENDING_ES, controls: ['Compare the load with the posted floor limit before the move', 'Have the engineer confirm suspended slabs and covers; spread loads with plates or mats'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(2)(i)', severity: 4, prov: osha('h') },
    { id: 'forklift_tip', hazard: 'Forklift tips or drops the load when overloaded or used beyond its rating to push or lift machinery', hazard_es: PENDING_ES, controls: ['Stay within the capacity posted on the truck for the load center used', 'No fork extensions or attachments without the maker’s rating; trained operators only'], controls_es: PENDING_ES, osha_ref: '1926.602(c)(1)(i)', severity: 4, prov: osha('o') },
    { id: 'stored_energy', hazard: 'Unexpected start-up or release of electrical, air, hydraulic or spring energy in the machine being moved or aligned', hazard_es: PENDING_ES, controls: ['Lock and tag every energy source at every point it can be energized', 'Bleed accumulators and air lines; verify zero energy before touching the machine'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'grout_chem', hazard: 'Skin and eye burns or sensitization from cement or epoxy grout components', hazard_es: PENDING_ES, controls: ['Wear eye protection and chemical-resistant gloves while mixing and placing', 'Follow the product safety data sheet; wash skin right away after contact'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['safety glasses', 'nitrile gloves'], prov: osha('e', 'rigging_millwright-itw-chockfast') },
    { id: 'silica_dust', hazard: 'Breathing silica dust while chipping concrete foundations for grout', hazard_es: PENDING_ES, controls: ['Use chipping tools with water or a shroud and HEPA vacuum', 'Wear a respirator where the controls are not enough'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)', severity: 3, ppe: ['respirator as required', 'safety glasses'], prov: osha('z') },
  ],
  qa_checklist: [
    { id: 'weight_cg_known', item: 'Load weight and center of gravity come from the manufacturer or a recognized calculation and are written on the move or lift plan.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'floor_capacity_checked', item: 'Floor capacity along the route checked against the load; suspended slabs and covers confirmed by the engineer or plated.', item_es: PENDING_ES, safety: true, prov: osha('h') },
    { id: 'loto_verified', item: 'Every energy source locked and tagged by the owner’s crafts and zero energy verified before work on the machine.', item_es: PENDING_ES, safety: true, prov: osha('k') },
    { id: 'jack_rating_cribbing', item: 'Jacks rated above their share of the load, bases cribbed, and the load cribbed behind every lift.', item_es: PENDING_ES, safety: true, prov: jack },
    { id: 'rigging_inspected', item: 'All slings and hardware inspected by a competent person this shift, tagged with a legible rated load and padded at sharp edges; defective gear removed.', item_es: PENDING_ES, safety: true, prov: rig },
    { id: 'signals_agreed', item: 'One signal person named and hand or radio signals agreed with the operator before the move or lift.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'lift_plan_signed', item: 'Lift plan reviewed and signed by the lift director, operator and rigger before the crane is set up.', item_es: PENDING_ES, safety: true, prov: asme('b30-9', 'b30-26') },
    { id: 'power_line_zone', item: 'Power lines within the crane’s working radius identified and 20 ft clearance (or de-energizing) arranged.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'fall_zone_barricaded', item: 'Fall zone and swing radius barricaded; tag lines attached.', item_es: PENDING_ES, safety: true, prov: fallzone },
    { id: 'test_lift', item: 'Test lift made a few inches off the ground and held to check balance, rigging seat and crane stability.', item_es: PENDING_ES, safety: true, prov: asme('b30-9') },
    { id: 'location_level', item: 'Machine set on the layout marks within the drawing tolerance and level to the maker’s requirement.', item_es: { status: 'translated', text: 'Máquina colocada sobre las marcas de trazo dentro de la tolerancia del plano y nivelada según el fabricante.' }, prov: asme('b30-1') },
    { id: 'soft_foot', item: 'Baseplate level to the maker’s tolerance and soft foot checked at every foot with a feeler gauge and corrected before alignment.', item_es: { status: 'translated', text: 'Placa base nivelada según la tolerancia del fabricante y pata coja revisada en cada pata con calibrador de lainas y corregida antes de alinear.' }, prov: est('Common millwright practice; maker’s tolerance governs.') },
    { id: 'alignment_recorded', item: 'As-found and as-left shaft alignment readings (offset and angle, both planes) recorded and within the maker’s tolerance.', item_es: { status: 'translated', text: 'Lecturas de alineación de ejes inicial y final (desplazamiento y ángulo, ambos planos) registradas y dentro de la tolerancia del fabricante.' }, prov: est('Common millwright practice; maker’s tolerance governs.') },
    { id: 'grout_full_bearing', item: 'Grout placed within its data sheet limits, poured from one side until it rose on the far side; base sounded after cure with no voids.', item_es: { status: 'translated', text: 'Grout colocado dentro de los límites de su ficha técnica, vaciado por un lado hasta salir por el opuesto; base sondeada tras el curado sin huecos.' }, prov: grout },
    { id: 'anchors_torqued', item: 'Anchor bolts torqued in sequence to the maker’s or engineer’s value after the grout cured.', item_es: { status: 'translated', text: 'Pernos de anclaje apretados en secuencia al valor del fabricante o ingeniero después del curado del grout.' }, prov: grout },
  ],
  inspection_checklists: {
    pre_move_check: [
      { item: 'Machine weight and CG documented; jacks, skates and rigging rated above their share', item_es: PENDING_ES, ref: '29 CFR 1926.305(a)(1)' },
      { item: 'Route floor capacity confirmed; weak spots plated or engineered', item_es: PENDING_ES, ref: '29 CFR 1926.250(a)(2)' },
      { item: 'All energy sources locked and tagged; zero energy verified', item_es: PENDING_ES, ref: '29 CFR 1926.417(b)' },
    ],
    lift_plan_review: [
      { item: 'Lift plan reviewed and signed by owner, operator, rigger and lift director', item_es: PENDING_ES },
      { item: 'Load weight verified and given to the operator; capacity checked on the load chart at the planned radius', item_es: PENDING_ES, ref: '29 CFR 1926.1417(o)(3)' },
      { item: 'Power lines within the work zone addressed (20 ft or de-energized)', item_es: PENDING_ES, ref: '29 CFR 1926.1408(a)(2)' },
      { item: 'Signal person qualified and signals agreed; fall zone barricaded', item_es: PENDING_ES, ref: '29 CFR 1926.1419' },
    ],
    final_alignment: [
      { item: 'Soft foot corrected and anchor bolts torqued before final readings', item_es: { status: 'translated', text: 'Pata coja corregida y anclas apretadas antes de las lecturas finales' } },
      { item: 'Final shaft alignment readings within the maker’s tolerance, signed by the owner', item_es: { status: 'translated', text: 'Lecturas finales de alineación dentro de la tolerancia del fabricante, firmadas por el propietario' } },
    ],
    grout_acceptance: [
      { item: 'Grout product, batch numbers and placement temperatures recorded', item_es: { status: 'translated', text: 'Producto de grout, números de lote y temperaturas de colocación registrados' } },
      { item: 'Base sounded after cure — no voids; forms removed and edges finished', item_es: { status: 'translated', text: 'Base sondeada tras el curado — sin huecos; cimbras retiradas y bordes terminados' } },
    ],
  },
  assemblies: [
    { code: 'G-RIG-MOVE-EA', name: 'Machinery move within a building, per piece (up to ~10 tons, jack and skate)', name_es: 'Movimiento de maquinaria dentro de un edificio, por pieza (hasta ~10 toneladas, con gatos y patines)', unit: 'EA', csi: '41 22 00',
      description: 'Rigging crew jacks, skates, moves and sets one machine along a planned in-plant route; disconnect/reconnect by others.',
      material_cost_cents: { v: 5000, prov: est('cribbing, shims, tie-downs consumed per move') }, labor_hours_per_unit: { v: 24, prov: est('3-person rigging crew, one 8-h shift per typical machine') },
      equipment_cost_cents: { v: 60000, prov: est('skates, toe jacks and forklift/tugger allocation per move, 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-RIG-CREW-DAY', name: 'Rigging crew with jack and skate set, per day', name_es: 'Cuadrilla de maniobras con juego de gatos y patines, por día', unit: 'DAY', csi: '41 22 00',
      description: 'Daily rate for open-ended rigging work: 3-person crew plus a machinery skate and hydraulic jack set.',
      material_cost_cents: { v: 2500, prov: est('consumables per day') }, labor_hours_per_unit: { v: 24, prov: est('3 riggers × 8 h') },
      equipment_cost_cents: { v: 35000, prov: est('skate + jack set + rigging gear day rental, 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-RIG-ALIGN-EA', name: 'Precision laser shaft alignment, per coupled machine', name_es: 'Alineación láser de precisión de ejes, por máquina acoplada', unit: 'EA', csi: '01 75 00',
      material_cost_cents: { v: 3000, prov: est('stainless shim stock per machine') }, labor_hours_per_unit: { v: 6, prov: est('millwright: soft foot, rough and final laser alignment with records') },
      equipment_cost_cents: { v: 15000, prov: est('laser alignment system day allocation, 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-RIG-GROUT-CF', name: 'Machinery baseplate epoxy grout, formed and placed, per CF', name_es: 'Grout epóxico bajo placa base de maquinaria, cimbrado y colocado, por pie cúbico', unit: 'CF', csi: '03 62 00',
      description: 'Foundation chip/prep, forms, mix and place epoxy machinery grout; use a cement nonshrink grout line instead where specified.',
      material_cost_cents: { v: 25000, prov: est('epoxy machinery grout per CF, national distributor baseline 2026') }, labor_hours_per_unit: { v: 3, prov: est('chip, form, mix and pour, per CF') },
      equipment_cost_cents: { v: 1000, prov: est('mixer/chipping tool allocation') }, waste_pct: { v: 10, prov: est('mixing and form loss') } },
    { code: 'G-RIG-LIFTPLAN-EA', name: 'Critical lift plan and rigging engineering, per lift', name_es: 'Plan de izaje crítico e ingeniería de aparejos, por izaje', unit: 'EA', csi: '01 54 19',
      description: 'Written lift plan with crane selection, load chart check, rigging design, ground bearing and power-line review; engineer stamp where required.',
      material_cost_cents: { v: 0, prov: est('no materials') }, labor_hours_per_unit: { v: 8, prov: est('lift director / rigging engineer time per plan') },
      equipment_cost_cents: { v: 0, prov: est('n/a') }, waste_pct: { v: 0, prov: est('n/a') } },
  ],
  quantity_rules: [
    { code: 'G-RIG-LIFTPLAN-EA', assumption: 'One critical lift plan on an industrial project with rigging scope — add one per separate engineered pick', when: { building_types: ['industrial'] }, qty: { basis: 'const' } },
    { code: 'G-RIG-CREW-DAY', assumption: 'Two rigging crew days to receive, set and level equipment on an industrial project — adjust to the equipment list', when: { building_types: ['industrial'] }, qty: { basis: 'const', mul: 2 } },
  ],
  dependency_hints: [
    { after_trades: ['concrete'], note: 'Machine setting and grouting follow foundation concrete reaching its specified strength.' },
    { before_phase: 'commissioning', note: 'Final alignment and grout acceptance come before mechanical/electrical hookup and commissioning.' },
  ],
});
