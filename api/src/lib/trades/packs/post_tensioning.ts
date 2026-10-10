// Trade Knowledge Pack — post_tensioning (Post-Tensioning). Wave 08 — NEW-TRADE pattern (no hand recipe,
// no template tasks). Dossier: docs/trade-packs/dossiers/post_tensioning.md. Sources: UFGS 03 23 00
// (Stressed Tendon Reinforcing — Part 3 execution), PTI EDC-130 education deck (unbonded/bonded systems),
// PTI field certification program; 29 CFR 1926 (Q 1926.701(c) post-tensioning, 1926.703, M, I, E, D, Z);
// IRC R109.1.1 / R506, IBC 110.3 / 1705.3 / 1808.6.2, ACI 318 ch. 25–26 (reference only).
// PTI M10.3 (Field Procedures Manual) and PTI DC10.5 are sold — cited by name only, nothing copied.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['post_tensioning-ufgs-03-23-00'], confidence: 'verified' as const, last_verified: D };
const pti = { src: ['post_tensioning-pti-edc130'], confidence: 'verified' as const, last_verified: D };
const ufgsPti = { src: ['post_tensioning-ufgs-03-23-00', 'post_tensioning-pti-edc130'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const aci = { src: ['rebar-aci-318'], confidence: 'verified' as const, last_verified: D };

// Any post-tensioning task title. Recipes only run for tasks whose trade is post_tensioning.
const PT = 'post[- ]?tension|\\bP\\.?T\\.? (?:slab|foundation|deck|floor|tendons?)|\\btendons?\\b';
const ELEVATED = '\\b(?:elevated|suspended|podium|transfer|parking (?:deck|garage|structure)|level \\d|(?:2nd|3rd|\\d+th|second|third|upper) floor)\\b';

export default definePack({
  key: 'post_tensioning',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Places, stresses and finishes post-tensioning tendons in concrete — unbonded monostrand slab-on-ground foundations, elevated PT decks and bonded (grouted) multistrand systems — including anchor and chair placement to profile, pre-pour inspection, stressing with elongation records, tail cutting, pocket patching and the no-cut warning for the owner.',
    summary_es: 'Coloca, tensa y termina tendones de postensado — losas sobre terreno con monotorón no adherido, losas elevadas y sistemas adheridos (inyectados) — incluidos anclajes y sillas según el perfil, inspección previa al colado, tensado con registro de elongaciones, corte de colas, resane de cajetines y el aviso de no cortar.',
    glossary: [
      { term: 'Tendon', term_es: 'Tendón', def: 'High-strength steel strand in a greased plastic sheath (unbonded) or a duct (bonded) that is pulled tight after the concrete hardens.', def_es: 'Torón de acero de alta resistencia en funda plástica con grasa (no adherido) o en ducto (adherido) que se tensa después de que el concreto endurece.' },
      { term: 'Live (stressing) end', term_es: 'Extremo activo (de tensado)', def: 'Tendon end where the jack pulls the strand; it gets a pocket former in the edge form.', def_es: 'Extremo del tendón donde el gato jala el torón; lleva un formador de cajetín en la cimbra de borde.' },
      { term: 'Dead (fixed) end', term_es: 'Extremo pasivo (fijo)', def: 'Tendon end with the anchor pre-seated at the plant; it is cast in and never jacked.', def_es: 'Extremo del tendón con el anclaje asentado en planta; queda colado y nunca se tensa con gato.' },
      { term: 'Anchorage', term_es: 'Anclaje', def: 'Cast-iron plate the strand is locked against; it transfers the tendon force into the concrete.', def_es: 'Placa de hierro fundido contra la que se fija el torón; transmite la fuerza del tendón al concreto.' },
      { term: 'Wedges', term_es: 'Cuñas', def: 'Toothed steel pieces that grip the strand in the anchor after the jack releases.', def_es: 'Piezas dentadas de acero que sujetan el torón en el anclaje cuando el gato suelta.' },
      { term: 'Chair', term_es: 'Silla', def: 'Support that holds the tendon at the height shown on the drawings.', def_es: 'Soporte que mantiene el tendón a la altura indicada en los planos.' },
      { term: 'Profile', term_es: 'Perfil', def: 'The up-and-down path of the tendon through the slab (high over supports, low at midspan).', def_es: 'La trayectoria vertical del tendón en la losa (alta sobre apoyos, baja al centro del claro).' },
      { term: 'Elongation', term_es: 'Elongación', def: 'How far the strand stretches when stressed; measured and recorded for every tendon.', def_es: 'Cuánto se estira el torón al tensarse; se mide y registra para cada tendón.' },
      { term: 'Pocket former', term_es: 'Formador de cajetín', def: 'Plastic piece that leaves a recess at the live end so the jack can reach the anchor and the tail can be covered.', def_es: 'Pieza plástica que deja un hueco en el extremo activo para que el gato llegue al anclaje y la cola se pueda cubrir.' },
      { term: 'Encapsulated system', term_es: 'Sistema encapsulado', def: 'Anchors, sleeves and caps sealed to the sheathing so no water reaches the strand.', def_es: 'Anclajes, mangas y tapas selladas a la funda para que el agua no llegue al torón.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'pt_slab_on_grade',
      example_title: 'Post-tensioned slab-on-grade foundation',
      when: { title_re: PT },
      steps: [
        {
          title: 'Check the tendon drawings and the slab layout',
          instruction: 'Keep the approved tendon layout (shop) drawings on site. Check edge forms, beams/ribs, slab thickness, under-slab utilities and the vapor retarder against the plans, and mark the live and dead end of every tendon on the forms before material is spread.',
          tools: ['tendon layout drawings', 'tape measure', 'chalk line', 'marking paint'],
          materials: [],
          safety_ids: ['rebar_impalement'],
          qa_ids: ['shop_drawings_onsite'],
        },
        {
          title: 'Place anchors, tendons and chairs',
          instruction: 'Nail each anchor to the edge form with its pocket former, square to the tendon line. Lay tendons at the drawing spacing, never swapping live and dead ends, set them on chairs at the heights shown, tie them so they cannot float or wander, and keep them straight into the anchors. Tape-repair every torn sheath. No welding near tendons.',
          detail: 'Place the backup bars / hairpins the drawings show at the anchors and around slab corners and re-entrant corners.',
          tools: ['hammer', 'tie wire reel', 'strand cutter', 'tape measure'],
          materials: ['unbonded monostrand tendons', 'anchors + pocket formers', 'chairs', 'tie wire', 'sheathing repair tape', 'backup bars per drawings'],
          safety_ids: ['rebar_impalement', 'material_handling'],
          qa_ids: ['anchors_normal', 'live_dead_ends', 'profile_supported', 'sheathing_intact', 'anchorage_zone_bars'],
        },
        {
          title: 'Pre-pour inspection',
          instruction: 'Call the foundation inspection and any engineer or special-inspector observation the plans require. Correct every item before concrete is ordered, and photograph tendon spacing, anchors and chairs for the record.',
          tools: ['camera', 'tendon layout drawings'],
          materials: [],
          safety_ids: ['rebar_impalement'],
          qa_ids: ['shop_drawings_onsite', 'profile_supported'],
          gating_inspection_type: 'foundation',
          code_refs: [{ section: 'R109.1.1', code_type: 'IRC', note: 'Foundation inspection before concrete is placed' }, { section: '110.3.1', code_type: 'IBC', note: 'Footing and foundation inspection before placing concrete' }, { section: '1808.6.2', code_type: 'IBC', note: 'Slab-on-ground foundations on expansive soil — design method' }],
        },
        {
          title: 'Place and consolidate the concrete',
          instruction: 'Consolidate thoroughly behind and around every anchor — a void there can blow out during stressing. Keep the vibrator head off the sheathing and anchor castings, do not walk the tendons out of position, and have extra cylinders cast so the stressing strength can be confirmed.',
          tools: ['concrete vibrator', 'screed', 'bull float'],
          materials: ['concrete per mix design', 'test cylinders'],
          safety_ids: ['construction_loads', 'cement_contact'],
          qa_ids: ['consolidation_anchors', 'stress_strength_reached'],
        },
        {
          title: 'Stress the tendons and record elongations',
          instruction: 'Stress only after test cylinders show the strength the drawings require. Use a certified crew and a jack and gauge calibrated as a set. Mark each tail before stressing, stress in the drawing sequence, then measure and record every elongation. If force and elongation disagree beyond the specified tolerance, stop and call the engineer.',
          detail: 'Barricade and sign the stressing area; nobody stands behind the jack or in line with the strand.',
          tools: ['monostrand stressing jack', 'hydraulic pump with calibrated gauge', 'elongation ruler', 'paint marker'],
          materials: ['stressing record forms'],
          safety_ids: ['behind_jack', 'stressing_zone', 'hydraulic_hose'],
          qa_ids: ['stress_strength_reached', 'gauge_calibrated', 'elongation_recorded'],
        },
        {
          title: 'Cut tails, seal pockets and post the no-cut warning',
          instruction: 'Cut tails only after the engineer approves the elongation records, leaving the length the system requires past the wedges. Fit the grease caps, clean the pocket and patch it flush with non-shrink grout within a day. Hand the owner the PT warning: no cutting, drilling or coring without a tendon scan.',
          tools: ['abrasive cut-off saw or hydraulic shear', 'wire brush', 'margin trowel'],
          materials: ['encapsulation caps', 'non-shrink grout', 'PT warning stamp or label'],
          safety_ids: ['tail_cutting', 'silica', 'cement_contact'],
          qa_ids: ['tails_after_approval', 'pockets_patched', 'pt_warning_posted'],
        },
      ],
    },
    {
      id: 'pt_elevated_deck',
      example_title: 'Post-tensioned elevated deck — Level 2',
      priority: 10,
      when: { title_re: `(?:${PT})[^.]*${ELEVATED}|${ELEVATED}[^.]*(?:${PT})` },
      steps: [
        {
          title: 'Check drawings, formwork and the shoring plan',
          instruction: 'Keep the approved tendon drawings and the shoring/reshoring plan on site. Confirm the deck forms are complete, edges are guarded and the shoring was inspected before tendon bundles are loaded onto the deck.',
          tools: ['tendon layout drawings', 'shoring plan', 'level'],
          materials: [],
          safety_ids: ['deck_edge', 'construction_loads'],
          qa_ids: ['shop_drawings_onsite'],
        },
        {
          title: 'Place tendons to profile with anchorage-zone steel',
          instruction: 'Spread banded and distributed tendons per the drawings, set chairs so tendons sit high over beams and columns and low at midspan, and tie them every few feet. Set anchors square to the tendon with backup bars and bursting steel at the anchorage zones. Keep live and dead ends as drawn; repair torn sheathing; no welding near tendons.',
          detail: 'Bonded systems: support ducts at the spacing specified, anchor grout vents, and plug duct ends against concrete and water.',
          tools: ['tie wire reel', 'tape measure', 'chair height gauge'],
          materials: ['tendons or ducts + strand', 'anchors + pocket formers', 'chairs and bolsters', 'backup bars / bursting steel', 'sheathing repair tape'],
          safety_ids: ['deck_edge', 'rebar_impalement', 'material_handling'],
          qa_ids: ['anchors_normal', 'live_dead_ends', 'profile_supported', 'sheathing_intact', 'anchorage_zone_bars'],
        },
        {
          title: 'Pre-pour inspection and special inspection',
          instruction: 'Call the structural inspection and the special inspector for the prestressed concrete. Fix profile, spacing and anchorage-zone items before the pour is released, and keep the photos with the stressing records.',
          tools: ['camera', 'tendon layout drawings'],
          materials: [],
          safety_ids: ['deck_edge'],
          qa_ids: ['profile_supported', 'anchorage_zone_bars'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: '1705.3', code_type: 'IBC', note: 'Special inspection of concrete incl. prestressing force and tendon grouting' }, { section: '1901.2', code_type: 'IBC', note: 'Structural concrete designed and built per ACI 318' }, { section: '25.9', code_type: 'ACI 318', note: 'Anchorage zones for post-tensioned tendons' }],
        },
        {
          title: 'Pour, cure and stress',
          instruction: 'Consolidate well behind every anchor without hitting tendons with the vibrator. Stress when the specified transfer strength is reached, with a calibrated jack/gauge set, barricades and nobody behind the jack. Record every elongation and reconcile it with the gauge force.',
          detail: 'Bonded systems: grout the ducts within the specified window after stressing, blow them clear first, pump until uniform grout flows from the far vent, and do not grout when freezing temperatures are expected.',
          tools: ['concrete vibrator', 'stressing jack', 'calibrated pump/gauge', 'grout pump (bonded)'],
          materials: ['concrete per mix design', 'test cylinders', 'PT grout (bonded)'],
          safety_ids: ['behind_jack', 'stressing_zone', 'hydraulic_hose', 'deck_edge'],
          qa_ids: ['consolidation_anchors', 'stress_strength_reached', 'gauge_calibrated', 'elongation_recorded'],
        },
        {
          title: 'Finish pockets, then release shores',
          instruction: 'After the engineer approves the elongations, cut tails, cap and patch the pockets. Remove shores and forms only when the stressing is complete and the plan allows it; reshore as the plan shows. Mark the deck soffit and slab with the PT warning.',
          tools: ['abrasive cut-off saw or hydraulic shear', 'margin trowel'],
          materials: ['encapsulation caps', 'non-shrink grout', 'PT warning labels'],
          safety_ids: ['tail_cutting', 'premature_stripping', 'silica'],
          qa_ids: ['tails_after_approval', 'pockets_patched', 'shores_after_stress', 'pt_warning_posted'],
        },
      ],
    },
    {
      id: 'pt_scan_before_cut',
      example_title: 'Scan and core PT slab for plumbing penetration',
      priority: 20,
      when: { title_re: `(?:${PT})[^.]*\\b(?:cor(?:e|ing)|cut|drill|penetrations?|scan|repair)\\b|\\b(?:cor(?:e|ing)|cut|drill|penetrations?|scan|repair)\\b[^.]*(?:${PT})` },
      steps: [
        {
          title: 'Locate tendons before any cut',
          instruction: 'Pull the tendon drawings, then have the slab scanned (GPR or similar) around each planned core, saw cut or anchor. Mark tendons and a no-cut band on the slab in paint.',
          tools: ['GPR scanner (by scanning firm)', 'marking paint', 'tendon layout drawings'],
          materials: [],
          safety_ids: ['live_tendon_cut'],
          qa_ids: ['scan_before_cut'],
        },
        {
          title: 'Get the cut approved and cut clear of tendons',
          instruction: 'Send the marked locations to the engineer of record when a cut is near a tendon or anchor. Core or cut only where approved, with wet methods or vacuum dust control, and stop at once if steel or grease appears.',
          tools: ['core drill', 'wet saw', 'HEPA vacuum'],
          materials: [],
          safety_ids: ['live_tendon_cut', 'silica'],
          qa_ids: ['scan_before_cut'],
        },
        {
          title: 'Report any hit tendon',
          instruction: 'If a tendon is nicked or cut, clear the area in line with both anchors, do not try to pull or patch it, and call the engineer and a certified PT repair crew.',
          tools: ['barricade tape'],
          materials: [],
          safety_ids: ['live_tendon_cut', 'stressing_zone'],
        },
      ],
    },
  ],
  code_refs: {
    foundation: [
      { section: 'R109.1.1', code_type: 'IRC', note: 'Foundation inspection before concrete is placed', prov: icc },
      { section: 'R506', code_type: 'IRC', note: 'Concrete floors on ground — base, vapor retarder, thickness', prov: icc },
      { section: '110.3.1', code_type: 'IBC', note: 'Footing and foundation inspection before placing concrete', prov: icc },
      { section: '1808.6.2', code_type: 'IBC', note: 'Slab-on-ground foundations on expansive soil — design method', prov: icc },
    ],
    framing: [
      { section: '1705.3', code_type: 'IBC', note: 'Special inspection of concrete incl. prestressing force and tendon grouting', prov: icc },
      { section: '1901.2', code_type: 'IBC', note: 'Structural concrete designed and built per ACI 318', prov: icc },
      { section: '25.9', code_type: 'ACI 318', note: 'Anchorage zones for post-tensioned tendons', prov: aci },
    ],
  },
  equipment: [
    { when: { title_re: PT, building_types: ['commercial', 'residential_mf', 'industrial'] }, type: 'concrete_pump', reason: 'Place deck or large-slab concrete without disturbing tendons', optional: true },
    { when: { title_re: ELEVATED }, type: 'telehandler', reason: 'Lift tendon coils and anchor boxes onto the formed deck', optional: true },
    { when: { title_re: '\\bstress' }, type: 'generator', reason: 'Power the electric stressing pump where site power is not yet available', optional: true },
  ],
  hazards: [
    { id: 'behind_jack', hazard: 'Struck by a strand, wedge or jack if a tendon or anchor fails during stressing', hazard_es: PENDING_ES, controls: ['Only the stressing crew near the jack — nobody behind it or in line with the strand', 'Inspect wedges, jack nose and strand before each pull'], controls_es: PENDING_ES, osha_ref: '1926.701(c)(1)', severity: 4, ppe: ['hard hat', 'safety glasses', 'face shield'], prov: osha('q') },
    { id: 'stressing_zone', hazard: 'Workers walking into the stressing area at the slab edge', hazard_es: PENDING_ES, controls: ['Put up signs and barriers along the stressing edge before stressing starts', 'Keep the area closed until all tendons are seated'], controls_es: PENDING_ES, osha_ref: '1926.701(c)(2)', severity: 4, prov: osha('q') },
    { id: 'rebar_impalement', hazard: 'Impalement on protruding bars, dowels or strand tails', hazard_es: PENDING_ES, controls: ['Cap or guard protruding bars and tails where workers could fall onto them'], controls_es: PENDING_ES, osha_ref: '1926.701(b)', severity: 3, prov: osha('q') },
    { id: 'construction_loads', hazard: 'Overloading green or unstressed concrete with stacked tendons, materials or equipment', hazard_es: PENDING_ES, controls: ['Do not stage loads on the deck unless a qualified structural person says it can carry them', 'Spread tendon bundles; keep pumps and buggies to approved routes'], controls_es: PENDING_ES, osha_ref: '1926.701(a)', severity: 3, prov: osha('q') },
    { id: 'premature_stripping', hazard: 'Deck collapse from removing shores before stressing or before the concrete is strong enough', hazard_es: PENDING_ES, controls: ['Strip forms and shores only when the plans and the engineer allow it', 'Follow the reshoring plan'], controls_es: PENDING_ES, osha_ref: '1926.703(e)(1)', severity: 4, prov: osha('q') },
    { id: 'deck_edge', hazard: 'Fall from the open edge of an elevated deck or through deck openings', hazard_es: PENDING_ES, controls: ['Guardrails, nets or personal fall arrest at edges 6 ft or more above a lower level', 'Cover and mark deck openings'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness when required'], prov: osha('m') },
    { id: 'hydraulic_hose', hazard: 'High-pressure oil injection or whipping hose from the stressing pump', hazard_es: PENDING_ES, controls: ['Never exceed the rated pressure of hoses and fittings', 'Check hoses and couplers before use; never feel for leaks by hand'], controls_es: PENDING_ES, osha_ref: '1926.302(d)(2)', severity: 3, ppe: ['gloves', 'safety glasses'], prov: osha('i') },
    { id: 'tail_cutting', hazard: 'Sparks, hot metal and wheel fragments while cutting strand tails', hazard_es: PENDING_ES, controls: ['Wear eye and face protection when cutting tails', 'Keep the wheel guard on; keep combustibles away from sparks'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses', 'face shield', 'gloves'], prov: osha('e') },
    { id: 'cement_contact', hazard: 'Cement burns to skin and eyes from wet concrete and grout', hazard_es: PENDING_ES, controls: ['Wear waterproof gloves and boots; keep wet concrete off skin', 'Wash skin promptly; eye wash on site'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['waterproof gloves', 'rubber boots', 'safety glasses'], prov: osha('e') },
    { id: 'live_tendon_cut', hazard: 'Sudden energy release from cutting or coring into a stressed tendon', hazard_es: PENDING_ES, controls: ['Scan and mark tendons before any core, cut or anchor in a PT slab', 'Stop and clear the line of the tendon if steel or grease appears'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 4, prov: osha('c') },
    { id: 'silica', hazard: 'Silica dust from grinding pockets, coring or saw cutting', hazard_es: PENDING_ES, controls: ['Use water or a shrouded tool with a vacuum dust collector', 'Use the respirator the exposure-control plan requires'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 3, ppe: ['respirator when required'], prov: osha('z') },
    { id: 'material_handling', hazard: 'Strains and pinch injuries handling tendon coils and anchor boxes', hazard_es: PENDING_ES, controls: ['Unload coils with equipment; two-person carry for long tendons', 'Wear gloves; watch the coil for spring-back when cutting bands'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 2, ppe: ['gloves'], prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'shop_drawings_onsite', item: 'Approved tendon layout drawings on site; tendon count, spacing and stressing sequence match them.', item_es: { status: 'translated', text: 'Planos de taller aprobados de tendones en obra; cantidad, separación y secuencia de tensado coinciden con ellos.' }, prov: ufgs },
    { id: 'anchors_normal', item: 'Anchors fastened tight to the edge form, square to the tendon axis, with pocket formers seated.', item_es: { status: 'translated', text: 'Anclajes firmes contra la cimbra de borde, perpendiculares al eje del tendón, con formadores de cajetín asentados.' }, prov: ufgsPti },
    { id: 'live_dead_ends', item: 'Live and dead ends at the locations shown — never switched in the field.', item_es: { status: 'translated', text: 'Extremos activos y pasivos donde indican los planos — nunca intercambiados en obra.' }, prov: ufgs },
    { id: 'profile_supported', item: 'Tendons on chairs at the drawing heights, tied so they cannot move, unbonded tendons supported at no more than 48 in.', item_es: { status: 'translated', text: 'Tendones sobre sillas a las alturas del plano, amarrados para que no se muevan; tendones no adheridos apoyados a no más de 48 pulg.' }, prov: ufgsPti },
    { id: 'sheathing_intact', item: 'Sheathing checked after placement; every tear or split repaired with tape before the pour.', item_es: { status: 'translated', text: 'Funda revisada después de colocar; cada rotura o corte reparado con cinta antes del colado.' }, prov: ufgs },
    { id: 'anchorage_zone_bars', item: 'Backup bars, hairpins or bursting steel at anchors placed as the drawings show.', item_es: { status: 'translated', text: 'Varillas de respaldo, horquillas o acero contra estallido en los anclajes colocados según los planos.' }, prov: { src: ['post_tensioning-ufgs-03-23-00', 'rebar-aci-318'], confidence: 'derived', last_verified: D, note: 'Anchorage-zone reinforcement is an engineered detail (ACI 318 25.9); check it against the drawings.' } },
    { id: 'consolidation_anchors', item: 'Concrete consolidated behind and around every anchor; no honeycomb visible at the edge after forms are stripped.', item_es: { status: 'translated', text: 'Concreto vibrado detrás y alrededor de cada anclaje; sin oquedades visibles en el borde al descimbrar.' }, prov: pti },
    { id: 'stress_strength_reached', item: 'Cylinder breaks reach the stressing strength on the drawings before any tendon is stressed.', item_es: { status: 'translated', text: 'Los cilindros alcanzan la resistencia de tensado del plano antes de tensar cualquier tendón.' }, prov: ufgs },
    { id: 'gauge_calibrated', item: 'Jack and gauge calibrated as a set within the last 6 months; calibration chart with the crew.', item_es: { status: 'translated', text: 'Gato y manómetro calibrados como juego en los últimos 6 meses; gráfica de calibración con la cuadrilla.' }, prov: ufgs },
    { id: 'elongation_recorded', item: 'Elongation measured and recorded for every tendon; force and elongation agree with the theoretical values within 7% or the engineer is called.', item_es: { status: 'translated', text: 'Elongación medida y registrada en cada tendón; fuerza y elongación coinciden con lo teórico dentro del 7% o se llama al ingeniero.' }, prov: ufgs },
    { id: 'tails_after_approval', item: 'Tails cut only after the stressing records are approved, 1/2–3/4 in. past the wedges, without damaging the tendon or concrete.', item_es: { status: 'translated', text: 'Colas cortadas solo después de aprobar los registros de tensado, a 1/2–3/4 pulg. de las cuñas, sin dañar el tendón ni el concreto.' }, prov: ufgs },
    { id: 'pockets_patched', item: 'Caps installed and pockets cleaned and patched flush with non-shrink grout within one day of cutting tails.', item_es: { status: 'translated', text: 'Tapas instaladas y cajetines limpios y resanados al ras con grout sin contracción dentro de un día del corte de colas.' }, prov: ufgsPti },
    { id: 'shores_after_stress', phase: 'framing', item: 'Elevated decks: shores and forms stay until stressing is complete and the engineer releases them; reshores per plan.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-q', 'post_tensioning-ufgs-03-23-00'], confidence: 'verified', last_verified: D } },
    { id: 'pt_warning_posted', item: 'PT warning (stamp, label or sign) left for the owner: no cutting, coring or drilling without a tendon scan.', item_es: PENDING_ES, safety: true, prov: est('Common industry practice; wording and location set by the engineer or owner.') },
    { id: 'scan_before_cut', item: 'Every core, saw cut or post-installed anchor in a PT slab scanned and marked first; cuts near tendons approved by the engineer.', item_es: PENDING_ES, safety: true, prov: est('Common industry practice for existing post-tensioned slabs.') },
  ],
  inspection_checklists: {
    foundation: [
      { item: 'Tendon count, spacing and live/dead end locations match the approved drawings', item_es: PENDING_ES },
      { item: 'Chairs at drawing heights; tendons tied and supported, sheathing repaired', item_es: PENDING_ES },
      { item: 'Anchors square to the tendon with pocket formers; backup bars at anchors and corners', item_es: PENDING_ES },
      { item: 'Vapor retarder, base and slab/beam dimensions per plans', item_es: PENDING_ES, ref: 'R506' },
    ],
    framing: [
      { item: 'Tendon profile high over supports and low at midspan per drawings', item_es: PENDING_ES },
      { item: 'Anchorage-zone reinforcement in place at every anchor', item_es: PENDING_ES, ref: 'ACI 318 25.9' },
      { item: 'Special inspector present; stressing sequence and records plan on site', item_es: PENDING_ES, ref: '1705.3' },
    ],
    final: [
      { item: 'Stressing records approved by the engineer and on file', item_es: PENDING_ES },
      { item: 'All pockets capped and patched; PT warning posted for the owner', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-PT-SOG-SF', name: 'PT slab-on-ground tendon system adder (tendons, anchors, chairs, placement), per SF', name_es: 'Adicional de sistema de tendones para losa postensada sobre terreno (tendones, anclajes, sillas, colocación), por pie²', unit: 'SF', csi: '03 38 00',
      description: 'Tendons only — slab concrete, base and forms priced by their own lines; stressing and pockets are B-PT-STRESS-EA / B-PT-POCKET-EA.',
      material_cost_cents: { v: 55, prov: est('≈0.5 LF coated 1/2 in. strand per SF (≈4 ft both ways) + anchor/chair share, national baseline 2026') }, labor_hours_per_unit: { v: 0.012, prov: est('3-person crew places ≈2,000 SF residential slab in ≈8 h') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; jack priced in stressing') }, waste_pct: { v: 3, prov: est('tendons fabricated to length') } },
    { code: 'B-PT-ELEV-SF', name: 'Elevated PT deck tendon system (banded + distributed, anchorage-zone steel), per SF', name_es: 'Sistema de tendones para losa elevada postensada (en banda y distribuidos, acero de zona de anclaje), por pie²', unit: 'SF', csi: '03 38 00',
      description: 'Tendon supply, placement, stressing and pocket finishing for a two-way PT deck; concrete, forms, shoring and mild steel priced separately.',
      material_cost_cents: { v: 220, prov: est('two-way PT deck strand + anchors + chairs + anchorage-zone bars, national baseline 2026') }, labor_hours_per_unit: { v: 0.03, prov: est('place to profile, stress and finish pockets on a typical commercial deck') },
      equipment_cost_cents: { v: 15, prov: est('stressing jack/pump + hoisting share per SF') }, waste_pct: { v: 3, prov: est('tendons fabricated to length') } },
    { code: 'B-PT-STRESS-EA', name: 'Stress one tendon — mark, stress, record elongation, cut tail', name_es: 'Tensado de un tendón — marcar, tensar, registrar elongación, cortar cola', unit: 'EA', csi: '03 38 00',
      material_cost_cents: { v: 0, prov: est('records only') }, labor_hours_per_unit: { v: 0.1, prov: est('2-person stressing crew ≈20 tendons/h incl. measuring and tail cutting') },
      equipment_cost_cents: { v: 150, prov: est('monostrand jack + pump + calibrated gauge rental share per tendon') }, waste_pct: { v: 0, prov: est('no consumables') } },
    { code: 'B-PT-POCKET-EA', name: 'Stressing pocket finish — cap, clean and patch with non-shrink grout', name_es: 'Acabado de cajetín de tensado — tapa, limpieza y resane con grout sin contracción', unit: 'EA', csi: '03 38 00',
      material_cost_cents: { v: 150, prov: est('grease cap + ≈0.1 bag non-shrink grout per pocket, 2026') }, labor_hours_per_unit: { v: 0.1, prov: est('clean, cap, pack and strike flush') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 10, prov: est('grout mixed in small batches') } },
    { code: 'B-PT-SCAN-EA', name: 'GPR tendon scan and layout before a core or cut in a PT slab, per location', name_es: 'Escaneo GPR de tendones y trazo antes de una perforación o corte en losa postensada, por ubicación', unit: 'EA', csi: '03 38 00',
      description: 'Subcontracted scanning service; scanning firms usually carry a trip minimum.',
      material_cost_cents: { v: 15000, prov: est('scanning service per location, trip minimum spread over a few locations, 2026') }, labor_hours_per_unit: { v: 0.25, prov: est('site walk, marking and photos by the contractor') },
      equipment_cost_cents: { v: 0, prov: est('scanner owned by the service') }, waste_pct: { v: 0, prov: est('service') } },
  ],
  quantity_rules: [
    { code: 'B-PT-SOG-SF', assumption: 'PT slab-on-ground: tendon system over the plan floor area (sum of room areas) — confirm slab footprint', when: { facts_any: ['slab_on_grade'] }, qty: { basis: 'area_sf_sum', round: 'ceil' } },
    { code: 'B-PT-STRESS-EA', assumption: 'About one tendon per 83 SF of slab (≈4 ft spacing both ways) — replace with the tendon count on the shop drawings', when: { facts_any: ['slab_on_grade'] }, qty: { basis: 'area_sf_sum', mul: 0.012, round: 'ceil' } },
    { code: 'B-PT-POCKET-EA', assumption: 'One stressing pocket per tendon (single-end stressing) — double for tendons stressed at both ends', when: { facts_any: ['slab_on_grade'] }, qty: { basis: 'area_sf_sum', mul: 0.012, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['plumbing', 'electrical', 'formwork'], before_phase: 'framing', note: 'Under-slab utilities and edge forms go in before tendons are laid; the slab is stressed before framing loads it.' },
  ],
});
