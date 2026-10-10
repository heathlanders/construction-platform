// Trade Knowledge Pack — scaffolding (Scaffolding). Wave 18 — NEW-TRADE pattern (no hand recipe, 0 template tasks).
// Dossier: docs/trade-packs/dossiers/scaffolding.md. permit_trade null → no gating inspections and no code refs;
// competent-person hold points live in inspection_checklists (post_erection, competent_person_daily,
// suspension_rigging_check, pre_dismantle).
// Sources: 29 CFR 1926 Subpart L — 1926.451 (general), .452(c)/(w) (frame + mobile), .454 (training), public
// Appendices A/D (non-mandatory); Subparts M (PFAS), X (ladders). SAIA / ANSI A10.8 are reference-only and NOT
// used for any value. Color-tag practice (green/yellow/red) is industry practice, not an OSHA requirement.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (...extra: string[]) => ({ src: ['ecfr-1926-l', ...extra], confidence: 'verified' as const, last_verified: D });
const s451 = osha('scaffolding-ecfr-1926-451');
const s452 = osha('scaffolding-ecfr-1926-452');
const s454 = osha('scaffolding-ecfr-1926-454');
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

const ERECT_RE = '\\bscaffold(?:s|ing)?\\b';
const DISMANTLE_RE = '\\b(?:dismantl\\w*|strik(?:e|ing)|take[- ]?down|tear[- ]?down|remov\\w*)\\b.*\\bscaffold|\\bscaffold(?:s|ing)?\\b.*\\b(?:dismantl\\w*|strike|take[- ]?down|tear[- ]?down|removal)\\b';
const SUSPENDED_RE = '\\bswing[- ]?stage|\\bsuspended\\s+(?:scaffold|platform|stage)|\\bsuspension\\s+scaffold|\\bboatswain';

export default definePack({
  key: 'scaffolding',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Erects, tags, maintains and dismantles work scaffolds — frame and system scaffolds on base plates and mudsills, tied to the building above the 4:1 height, fully planked with guardrails and toeboards — plus swing stages and rolling towers, all under a competent person who inspects before every shift.',
    summary_es: 'Arma, etiqueta, mantiene y desarma andamios de trabajo — andamios de marcos y de sistema sobre placas base y durmientes, anclados al edificio por encima de la altura 4:1, con plataformas completas, barandales y rodapiés — además de plataformas colgantes y torres rodantes, todo bajo una persona competente que inspecciona antes de cada turno.',
    glossary: [
      { term: 'Competent person', term_es: 'Persona competente', def: 'Someone who can spot scaffold hazards and has authority to fix them; supervises erection and inspects before each shift.', def_es: 'Persona que identifica peligros del andamio y tiene autoridad para corregirlos; supervisa el armado e inspecciona antes de cada turno.' },
      { term: 'Mudsill', term_es: 'Durmiente', def: 'Wood plank laid under the base plates that spreads the scaffold load on soil or soft ground.', def_es: 'Tablón de madera bajo las placas base que reparte la carga del andamio sobre tierra o suelo blando.' },
      { term: 'Base plate / screw jack', term_es: 'Placa base / gato de tornillo', def: 'Steel foot under each leg; the screw jack adjusts it so the scaffold starts level and plumb.', def_es: 'Pie de acero bajo cada pata; el gato de tornillo lo ajusta para que el andamio arranque nivelado y a plomo.' },
      { term: 'Lift', term_es: 'Nivel (cuerpo)', def: 'One vertical level of frames or standards, usually about 6 ft 6 in. tall.', def_es: 'Un nivel vertical de marcos o verticales, normalmente de unos 6 pies 6 pulgadas.' },
      { term: 'Tie (wall tie)', term_es: 'Amarre (anclaje a muro)', def: 'Connection from the scaffold to the structure that keeps a tall scaffold from tipping.', def_es: 'Conexión del andamio a la estructura que evita que un andamio alto se vuelque.' },
      { term: '4:1 rule', term_es: 'Regla 4:1', def: 'Once a supported scaffold is more than four times as tall as its base is wide, it must be tied, guyed or braced.', def_es: 'Cuando un andamio apoyado es más de cuatro veces más alto que el ancho de su base, se debe amarrar, arriostrar o apuntalar.' },
      { term: 'Cross brace', term_es: 'Cruceta', def: 'Diagonal brace pinned between frames that squares and stiffens them; never a ladder.', def_es: 'Riostra diagonal fijada entre marcos que los escuadra y rigidiza; nunca es escalera.' },
      { term: 'Toeboard', term_es: 'Rodapié', def: 'Low board at the platform edge that keeps tools and material from falling on people below.', def_es: 'Tabla baja en el borde de la plataforma que evita que herramientas y material caigan sobre la gente abajo.' },
      { term: 'Scaffold tag', term_es: 'Etiqueta de andamio', def: 'Card at each access point showing whether the scaffold is safe to use, restricted, or out of service.', def_es: 'Tarjeta en cada acceso que indica si el andamio está listo para usar, restringido o fuera de servicio.' },
      { term: 'Swing stage', term_es: 'Plataforma colgante (andamio suspendido)', def: 'Two-point suspended platform hung on wire ropes from roof outriggers and raised by hoists.', def_es: 'Plataforma suspendida de dos puntos colgada con cables de acero desde vigas en el techo y elevada con malacates.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'frame_scaffold_erect',
      example_title: 'Erect frame scaffold at north elevation',
      when: { title_re: ERECT_RE },
      steps: [
        {
          title: 'Plan the scaffold with the competent person',
          instruction: 'Confirm the scaffold type, height, length, duty rating and number of planked working levels with the trades who will use it. Have a qualified person design it (a registered engineer above 125 ft for frame scaffold). Walk the run: look up for power lines, mark where ties can go into structure, and pick where ladders or stair towers will be.',
          detail: 'Keep the scaffold and anything carried on it at least 10 ft from energized lines up to 50 kV (3 ft for insulated lines under 300 V) unless the utility de-energizes, moves or covers them.',
          tools: ['tape measure', 'site plan', 'manufacturer erection manual'],
          materials: [],
          safety_ids: ['power_line', 'collapse_overload'],
          qa_ids: ['design_and_rating', 'users_trained'],
        },
        {
          title: 'Set base plates, mudsills and screw jacks',
          instruction: 'Clear and compact the ground under every leg. Lay mudsills on soil or soft ground and set a base plate centered under each leg — never set legs on blocks, bricks, buckets or other loose objects. Adjust the screw jacks so the first lift is level and plumb before going higher.',
          tools: ['level', 'hand tamper', 'shovel'],
          materials: ['mudsills (grade-stamped plank)', 'base plates', 'screw jacks'],
          safety_ids: ['foundation_settle', 'manual_handling'],
          qa_ids: ['firm_footing', 'plumb_level_braced'],
        },
        {
          title: 'Erect frames and braces lift by lift',
          instruction: 'Set frames, pin them together with coupling pins (lock with uplift pins where wind or hoisting can lift them) and install every cross brace and horizontal so the tower stays square. Leave the platform below in place until the next frames are set and braced. Plank as you climb and install the access ladder as soon as erection allows. Erectors use fall protection wherever the competent person finds it feasible.',
          tools: ['scaffold wrench or hammer', 'hand line or gin wheel', 'level'],
          materials: ['frames', 'cross braces', 'coupling and uplift pins', 'hook-on ladder or stair tower'],
          safety_ids: ['erector_fall', 'falling_objects', 'access_climbing', 'manual_handling'],
          qa_ids: ['plumb_level_braced', 'access_provided'],
        },
        {
          title: 'Tie the scaffold to the structure',
          instruction: 'Once the height passes four times the base width, tie or brace at the closest horizontal to the 4:1 height, then repeat every 20 ft vertically (scaffolds 3 ft wide or less) or every 26 ft (wider), at each end and no more than 30 ft apart horizontally. Place the top tie no lower than the 4:1 height from the top. Tie at points that carry both inner and outer legs, into structure — never to pipe, conduit or railings.',
          detail: 'Add ties or outriggers wherever a cantilevered bracket, hoist or enclosure puts an off-center or wind load on the scaffold.',
          tools: ['drill', 'wrench'],
          materials: ['wall ties or tie tubes and clamps', 'anchors rated for the base material'],
          safety_ids: ['tip_over', 'erector_fall'],
          qa_ids: ['ties_installed'],
        },
        {
          title: 'Plank, guard and protect the working levels',
          instruction: 'Fully plank each working level, with no more than 1 in. between planks and uprights, at least 18 in. wide, and within 14 in. of the wall unless the front edge is guarded. Each plank laps its support at least 6 in. (or is cleated or hooked) without long unsupported overhang. Install toprails at 38–45 in., midrails, and toeboards; hang debris netting or screens where material could fall on people or the public below.',
          tools: ['tape measure', 'scaffold wrench'],
          materials: ['scaffold plank or decks', 'guardrail posts and rails', 'toeboards', 'debris netting'],
          safety_ids: ['user_fall', 'plank_failure', 'falling_objects'],
          qa_ids: ['platforms_full', 'guardrails_complete', 'falling_object_protection'],
        },
        {
          title: 'Inspect, tag and hand over',
          instruction: 'The competent person walks every level, checks footing, plumb, pins, braces, ties, planks, guardrails and access, then tags each access point as ready for use with its load class and the date. Keep the scaffold tagged out until every item passes. Brief users: no climbing braces, no ladders or boxes on platforms, no loading past the rating, report any change.',
          tools: ['scaffold tags', 'inspection checklist'],
          materials: [],
          safety_ids: ['collapse_overload', 'user_fall', 'weather'],
          qa_ids: ['tagged_before_use', 'users_trained', 'daily_inspection'],
        },
      ],
    },
    {
      id: 'scaffold_dismantle',
      example_title: 'Dismantle scaffold and remove from site',
      priority: 10,
      when: { title_re: DISMANTLE_RE },
      steps: [
        {
          title: 'Clear, tag out and barricade',
          instruction: 'Confirm the trades are finished and have removed their tools and material. Tag every access point out of service and barricade the drop zone below. Check overhead lines again before any long piece is handled.',
          tools: ['scaffold tags', 'barricade tape or fencing'],
          materials: [],
          safety_ids: ['falling_objects', 'power_line'],
          qa_ids: ['dismantle_sequence'],
        },
        {
          title: 'Strip from the top down',
          instruction: 'Work one lift at a time from the top. Remove guardrails and planks only on the level being stripped, keep the planks below in place as a work deck, and leave ties in until the scaffold above them is gone. Lower parts on a hand line or gin wheel — never throw them down.',
          detail: 'Erectors stay tied off wherever the competent person found fall protection feasible during erection.',
          tools: ['scaffold wrench or hammer', 'hand line or gin wheel'],
          materials: [],
          safety_ids: ['erector_fall', 'tip_over', 'falling_objects', 'manual_handling'],
          qa_ids: ['dismantle_sequence'],
        },
        {
          title: 'Sort, inspect and stage for pickup',
          instruction: 'Stack frames, braces and planks by type. Pull bent, cracked or rusted-through components and split or warped planks and mark them out of service. Patch any anchor holes left by ties as the contract requires, and leave the area clean.',
          tools: ['marking paint'],
          materials: ['dunnage', 'banding'],
          safety_ids: ['manual_handling'],
          qa_ids: ['damaged_parts_removed'],
        },
      ],
    },
    {
      id: 'suspended_scaffold_rig',
      example_title: 'Rig swing stage for facade work',
      priority: 20,
      when: { title_re: SUSPENDED_RE },
      steps: [
        {
          title: 'Verify roof anchorage and outrigger setup',
          instruction: 'Have the competent person confirm the roof or parapet can carry the outrigger beams, hooks or clamps before anything is hung. Set outrigger beams square to the building edge with stop bolts at both ends, secure manufacturer counterweights mechanically, and run tiebacks to sound structure — not vents, pipes or conduit.',
          tools: ['wrenches', 'tape measure'],
          materials: ['outrigger beams or parapet clamps', 'manufacturer counterweights', 'tieback wire rope and shackles'],
          safety_ids: ['suspension_failure', 'erector_fall'],
          qa_ids: ['suspension_anchorage', 'ropes_inspected'],
        },
        {
          title: 'Inspect ropes and hoists and assemble the stage',
          instruction: 'Inspect every suspension rope and hoist before the shift: no repaired, kinked, crushed or birdcaged rope, thimble eyes on the load end, and hoist brakes and stops working. Assemble the platform per the manufacturer and test-lift it a foot off the ground with its rated load.',
          tools: ['hoist test cable', 'inspection checklist'],
          materials: ['wire suspension ropes', 'hoists', 'stage sections and stirrups'],
          safety_ids: ['suspension_failure', 'power_line'],
          qa_ids: ['ropes_inspected'],
        },
        {
          title: 'Rig independent lifelines and work the drop',
          instruction: 'Each worker on a two-point stage wears a harness on a rope grab attached to an independent vertical lifeline anchored separately from the suspension ropes, and the stage keeps its guardrails. Tie the stage to the building where the competent person finds sway, barricade the ground below, and stop work in high wind or ice.',
          tools: ['harness and rope grab'],
          materials: ['vertical lifelines', 'lifeline anchors', 'edge protection for ropes'],
          safety_ids: ['user_fall', 'falling_objects', 'weather'],
          qa_ids: ['ropes_inspected', 'daily_inspection'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: ERECT_RE }, step_re: 'base plates|erect frames', type: 'telehandler', reason: 'Lift bundled frames and planks from the truck to each lift on taller scaffolds', optional: true },
    { when: { title_re: DISMANTLE_RE }, step_re: 'sort|stage', type: 'forklift', reason: 'Load stacked frames and plank bundles for return pickup', optional: true },
  ],
  hazards: [
    { id: 'erector_fall', hazard: 'Fall while erecting, altering or dismantling the scaffold before guardrails are in place', hazard_es: PENDING_ES, controls: ['Competent person decides where erector fall protection is feasible; use it wherever it is', 'Install hook-on ladders as soon as erection allows and plank each lift as you go', 'Only trained, experienced erectors chosen by the competent person'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(2)', severity: 4, ppe: ['harness + lanyard where feasible', 'hard hat'], prov: osha('scaffolding-ecfr-1926-451', 'scaffolding-ecfr-1926-l-appendices') },
    { id: 'user_fall', hazard: 'Fall from a working platform more than 10 ft above a lower level', hazard_es: PENDING_ES, controls: ['Toprail 38–45 in. plus midrail on every open side and end before release for use', 'On two-point suspended stages use both guardrail and personal fall arrest on an independent lifeline', 'Keep the platform within 14 in. of the wall or guard the front edge'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, ppe: ['harness + lanyard on suspended scaffolds'], prov: osha('scaffolding-ecfr-1926-451', 'ecfr-1926-m') },
    { id: 'collapse_overload', hazard: 'Scaffold collapse from overloading, missing braces or a damaged component', hazard_es: PENDING_ES, controls: ['Load only to the rated duty — material piles count toward it', 'Remove damaged or weakened parts from service right away', 'Competent person inspects before each shift and after anything that could affect it'], controls_es: PENDING_ES, osha_ref: '1926.451(f)(1)', severity: 4, prov: s451 },
    { id: 'foundation_settle', hazard: 'Leg settles or kicks out from soft ground, missing mudsill or unstable blocking', hazard_es: PENDING_ES, controls: ['Base plate on a mudsill or other firm foundation under every leg', 'Never support legs or planks on bricks, blocks, buckets or barrels', 'Recheck footing after rain, thaw or nearby excavation'], controls_es: PENDING_ES, osha_ref: '1926.451(c)(2)', severity: 4, prov: s451 },
    { id: 'tip_over', hazard: 'Tall scaffold tips or racks when not tied, or when ties are removed too early', hazard_es: PENDING_ES, controls: ['Tie or brace above the 4:1 height-to-base ratio at the required spacing', 'Add ties for cantilevered brackets, hoists, netting or enclosures that catch wind', 'During dismantling, remove ties only as the scaffold above them comes down'], controls_es: PENDING_ES, osha_ref: '1926.451(c)(1)', severity: 4, prov: s451 },
    { id: 'power_line', hazard: 'Electrocution when scaffold parts or material handled on them come near energized lines', hazard_es: PENDING_ES, controls: ['Keep at least 10 ft from lines up to 50 kV (more above 50 kV; 3 ft for insulated lines under 300 V)', 'Get the utility to de-energize, relocate or cover lines before working closer', 'Handle long tubes and planks horizontally near lines'], controls_es: PENDING_ES, osha_ref: '1926.451(f)(6)', severity: 4, prov: s451 },
    { id: 'falling_objects', hazard: 'Tools, planks or debris falling from the scaffold onto workers or the public', hazard_es: PENDING_ES, controls: ['Toeboards, screens, debris netting or a catch platform/canopy as needed', 'Barricade the area below and keep people out during erection and dismantling', 'Use tag lines on loads hoisted near the scaffold; lower parts on a hand line'], controls_es: PENDING_ES, osha_ref: '1926.451(h)(1)', severity: 3, ppe: ['hard hat'], prov: s451 },
    { id: 'plank_failure', hazard: 'Plank breaks, slides off its support or tips at an overhanging end', hazard_es: PENDING_ES, controls: ['Grade-stamped scaffold plank or manufacturer decks only; pull split or warped planks', 'Each end laps its support at least 6 in. or is cleated or hooked; no long unsupported cantilevers', 'Fully plank working levels with gaps no wider than 1 in.'], controls_es: PENDING_ES, osha_ref: '1926.451(b)(4)', severity: 3, prov: osha('scaffolding-ecfr-1926-451', 'scaffolding-ecfr-1926-l-appendices') },
    { id: 'access_climbing', hazard: 'Fall while climbing frames or cross braces instead of a ladder or stair', hazard_es: PENDING_ES, controls: ['Provide a ladder, stair tower or ramp for any platform more than 2 ft above or below access', 'Never climb cross braces; bottom rung no more than 24 in. above the base'], controls_es: PENDING_ES, osha_ref: '1926.451(e)(1)', severity: 3, prov: s451 },
    { id: 'weather', hazard: 'Slip or blow-off from a scaffold covered in snow, ice or during high wind', hazard_es: PENDING_ES, controls: ['No work on snowy or icy platforms except to clear them', 'Stop work in storms or high wind unless the competent person clears it and workers are tied off or behind wind screens'], controls_es: PENDING_ES, osha_ref: '1926.451(f)(8)', severity: 3, prov: s451 },
    { id: 'suspension_failure', hazard: 'Suspended stage drops from a failed rope, anchorage, outrigger or counterweight', hazard_es: PENDING_ES, controls: ['Competent person confirms the roof anchorage before use', 'Inspect ropes before each shift; no repaired rope; manufacturer counterweights secured mechanically', 'Independent lifeline for every worker, anchored apart from the suspension ropes'], controls_es: PENDING_ES, osha_ref: '1926.451(d)(10)', severity: 4, ppe: ['harness + rope grab'], prov: s451 },
    { id: 'manual_handling', hazard: 'Back strain and caught-between injuries handling frames, planks and braces', hazard_es: PENDING_ES, controls: ['Two-person lift for frames and long planks', 'Pass parts hand to hand or on a hand line, not by climbing with them', 'Gloves when handling braces and pins'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 2, ppe: ['gloves'], prov: { src: ['ecfr-1926-c'], confidence: 'derived', last_verified: D, note: '1926.20(b)(1) general accident-prevention program; no 1926 lifting standard exists.' } },
  ],
  qa_checklist: [
    { id: 'design_and_rating', item: 'Scaffold type, duty rating and tie layout set by a qualified person before erection (PE design over 125 ft); overhead-line clearance planned or lines handled by the utility.', item_es: PENDING_ES, safety: true, prov: osha('scaffolding-ecfr-1926-451', 'scaffolding-ecfr-1926-452') },
    { id: 'firm_footing', phase: 'framing', item: 'Every leg on a base plate and mudsill or firm foundation — no blocks, bricks or loose objects; ground level and compacted.', item_es: PENDING_ES, safety: true, prov: s451 },
    { id: 'plumb_level_braced', item: 'Scaffold plumb and level, every cross brace and horizontal installed, frames pinned (uplift pins where needed).', item_es: tr('Andamio a plomo y nivelado, todas las crucetas y horizontales instaladas, marcos con pasadores (pasadores antilevantamiento donde se requieran).'), prov: s452 },
    { id: 'access_provided', item: 'Ladder, stair tower or ramp to every platform more than 2 ft above or below the access point; nobody climbing cross braces.', item_es: PENDING_ES, safety: true, prov: s451 },
    { id: 'ties_installed', item: 'Ties at the 4:1 height, then every 20 ft (≤3 ft wide) or 26 ft (wider) vertically, at each end and ≤30 ft horizontally, into structure.', item_es: PENDING_ES, safety: true, prov: s451 },
    { id: 'platforms_full', item: 'Working levels fully planked (gaps ≤1 in., ≥18 in. wide, ≤14 in. from the wall or edge guarded); plank ends lap supports ≥6 in. or are cleated; no split planks.', item_es: PENDING_ES, safety: true, prov: s451 },
    { id: 'guardrails_complete', item: 'Toprail 38–45 in. and midrail on all open sides and ends before the scaffold is released to other trades.', item_es: PENDING_ES, safety: true, prov: s451 },
    { id: 'falling_object_protection', item: 'Toeboards (at least 3½ in.) on platforms over 10 ft, plus netting, screens or a barricaded drop zone where people pass below.', item_es: PENDING_ES, safety: true, prov: s451 },
    { id: 'tagged_before_use', item: 'Each access point tagged with status, load class, inspector and date before anyone but erectors uses it.', item_es: tr('Cada acceso etiquetado con estado, clase de carga, inspector y fecha antes de que lo use alguien distinto a los armadores.'), prov: { src: ['scaffolding-osha-etool', 'ecfr-1926-l'], confidence: 'derived', last_verified: D, note: 'Tagging is industry practice that records the 1926.451(f)(3) inspection; OSHA does not mandate tags.' } },
    { id: 'users_trained', item: 'Users trained on fall, electrical and falling-object hazards and the load limit; erectors and inspectors trained by a competent person.', item_es: PENDING_ES, safety: true, prov: osha('scaffolding-ecfr-1926-454', 'ecfr-1926-l') },
    { id: 'daily_inspection', item: 'Competent person inspection recorded before each shift and after storms, impacts or alterations.', item_es: PENDING_ES, safety: true, prov: s451 },
    { id: 'suspension_anchorage', item: 'Suspended-scaffold roof supports evaluated by the competent person; outriggers square to the edge with stop bolts, counterweights secured, tiebacks to structure.', item_es: PENDING_ES, safety: true, prov: s451 },
    { id: 'ropes_inspected', item: 'Suspension ropes and hoists inspected before each shift (no repaired rope, thimble eyes, brakes working); each worker on an independent lifeline.', item_es: PENDING_ES, safety: true, prov: s451 },
    { id: 'dismantle_sequence', item: 'Before stripping: tagged out and drop zone barricaded. While stripping: ties removed only as the scaffold above comes down; planks below kept as a work deck.', item_es: PENDING_ES, safety: true, prov: s451 },
    { id: 'damaged_parts_removed', item: 'Bent, cracked or corroded components and damaged planks separated and marked out of service before return.', item_es: tr('Componentes doblados, agrietados o corroídos y tablones dañados separados y marcados fuera de servicio antes de devolverlos.'), prov: s451 },
  ],
  inspection_checklists: {
    post_erection: [
      { item: 'Footing: base plates on mudsills or firm foundation, screw jacks within manufacturer extension', item_es: PENDING_ES, ref: '29 CFR 1926.451(c)(2)' },
      { item: 'Plumb, level, all braces and pins installed', item_es: tr('A plomo, nivelado, todas las crucetas y pasadores instalados'), ref: '29 CFR 1926.452(c)' },
      { item: 'Ties at 4:1 and required spacing; extra ties for brackets, hoists or enclosures', item_es: PENDING_ES, ref: '29 CFR 1926.451(c)(1)' },
      { item: 'Platforms fully planked, guardrails and toeboards on all open sides', item_es: PENDING_ES, ref: '29 CFR 1926.451(b),(g),(h)' },
      { item: 'Safe access to every working level', item_es: PENDING_ES, ref: '29 CFR 1926.451(e)' },
      { item: 'Power-line clearance kept', item_es: PENDING_ES, ref: '29 CFR 1926.451(f)(6)' },
      { item: 'Tag posted at each access point with load class and date', item_es: tr('Etiqueta colocada en cada acceso con clase de carga y fecha') },
    ],
    competent_person_daily: [
      { item: 'No settlement, washout or frost heave under legs', item_es: PENDING_ES, ref: '29 CFR 1926.451(f)(3)' },
      { item: 'No missing or loose ties, braces, guardrails, planks or toeboards', item_es: PENDING_ES, ref: '29 CFR 1926.451(f)(3)' },
      { item: 'Platforms clear of debris, snow and ice; not overloaded', item_es: PENDING_ES, ref: '29 CFR 1926.451(f)(1),(8),(13)' },
      { item: 'No ladders, boxes or barrels used on platforms to gain height', item_es: PENDING_ES, ref: '29 CFR 1926.451(f)(14)-(15)' },
      { item: 'Tag updated or scaffold tagged out', item_es: tr('Etiqueta actualizada o andamio etiquetado fuera de servicio') },
    ],
    suspension_rigging_check: [
      { item: 'Roof supports evaluated; outrigger beams, counterweights and tiebacks secure', item_es: PENDING_ES, ref: '29 CFR 1926.451(d)(3)' },
      { item: 'Suspension ropes and hoists inspected this shift', item_es: PENDING_ES, ref: '29 CFR 1926.451(d)(10)' },
      { item: 'Independent lifelines anchored apart from suspension points', item_es: PENDING_ES, ref: '29 CFR 1926.451(g)(1)(ii)' },
    ],
    pre_dismantle: [
      { item: 'Trades finished and their material removed', item_es: tr('Oficios terminados y su material retirado') },
      { item: 'Scaffold tagged out and drop zone barricaded', item_es: PENDING_ES, ref: '29 CFR 1926.451(h)(2)(i)' },
    ],
  },
  assemblies: [
    { code: 'G-SCAF-FRAME-SF', name: 'Frame scaffold erect and dismantle, per SF of wall face', name_es: 'Armado y desarmado de andamio de marcos, por pie cuadrado de fachada', unit: 'SF', csi: '01 54 23',
      description: 'Labor to erect, plank, tie, tag and later dismantle frame scaffold; rental is G-SCAF-RENT-SFMO.',
      material_cost_cents: { v: 10, prov: est('ties, anchors and consumables per SF of face') }, labor_hours_per_unit: { v: 0.03, prov: est('erect + dismantle crew production for frame scaffold, national baseline') },
      equipment_cost_cents: { v: 15, prov: est('delivery and return trucking spread per SF') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-SCAF-RENT-SFMO', name: 'Frame scaffold rental, per SF of wall face per month', name_es: 'Renta de andamio de marcos, por pie cuadrado de fachada por mes', unit: 'SFMO', csi: '01 54 23',
      material_cost_cents: { v: 0, prov: est('rental only') }, labor_hours_per_unit: { v: 0, prov: est('labor in G-SCAF-FRAME-SF') },
      equipment_cost_cents: { v: 45, prov: est('frames, braces, planks and guardrail rental per SF of face per month, national baseline 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-SCAF-NET-SF', name: 'Debris netting on scaffold face, per SF', name_es: 'Malla contra escombros en la cara del andamio, por pie cuadrado', unit: 'SF', csi: '01 54 23',
      material_cost_cents: { v: 30, prov: est('polyethylene debris netting per SF') }, labor_hours_per_unit: { v: 0.005, prov: est('hang and remove netting') },
      equipment_cost_cents: { v: 0, prov: est('n/a') }, waste_pct: { v: 10, prov: est('laps and cut-off') } },
    { code: 'G-SCAF-ROLL-WK', name: 'Rolling scaffold tower rental, per week', name_es: 'Renta de torre de andamio rodante, por semana', unit: 'WK', csi: '01 54 23',
      material_cost_cents: { v: 0, prov: est('rental only') }, labor_hours_per_unit: { v: 1, prov: est('assemble, inspect and break down once per week of use') },
      equipment_cost_cents: { v: 12000, prov: est('single-bay rolling tower with casters, guardrails and outriggers, weekly rate 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-SCAF-MAST-WK', name: 'Mast climbing work platform allowance, per week', name_es: 'Partida de plataforma de trabajo trepadora de mástil, por semana', unit: 'WK', csi: '01 54 23',
      description: 'Allowance for a rented mast climber incl. prorated install/dismantle; get a supplier quote for real jobs.',
      material_cost_cents: { v: 0, prov: est('rental only') }, labor_hours_per_unit: { v: 4, prov: est('prorated erection, ties, inspection and dismantle per week') },
      equipment_cost_cents: { v: 350000, prov: est('mast climber rental + engineering, weekly allowance, national baseline 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-SCAF-SHED-LF', name: 'Sidewalk shed / covered walkway, per LF (first month)', name_es: 'Cobertizo peatonal / paso cubierto, por pie lineal (primer mes)', unit: 'LF', csi: '01 56 26',
      material_cost_cents: { v: 4000, prov: est('decking, posts, lighting and signage per LF') }, labor_hours_per_unit: { v: 0.8, prov: est('erect and dismantle per LF') },
      equipment_cost_cents: { v: 6000, prov: est('shed system rental, first month per LF') }, waste_pct: { v: 5, prov: est('cut-offs') } },
  ],
  quantity_rules: [
    { code: 'G-SCAF-FRAME-SF', assumption: 'Wall face to scaffold for masonry/stucco cladding ≈ 0.5 × summed floor area (rough); confirm by elevation takeoff', when: { facts_any: ['masonry_veneer', 'stucco_finish'], building_types: ['commercial', 'residential_mf', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.5, round: 'ceil' } },
    { code: 'G-SCAF-RENT-SFMO', assumption: 'Same face area rented for about 2 months of cladding work', when: { facts_any: ['masonry_veneer', 'stucco_finish'], building_types: ['commercial', 'residential_mf', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 1.0, round: 'ceil' } },
    { code: 'G-SCAF-NET-SF', assumption: 'Debris netting over the scaffold face on multifamily/commercial cladding', when: { facts_any: ['masonry_veneer', 'stucco_finish'], building_types: ['commercial', 'residential_mf'] }, qty: { basis: 'area_sf_sum', mul: 0.5, round: 'ceil' } },
  ],
});
