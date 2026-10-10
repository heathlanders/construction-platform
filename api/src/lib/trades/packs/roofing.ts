// Trade Knowledge Pack — roofing (Roofing). Wave 01, COMPLEMENT pattern (like concrete.ts): the hand
// recipe in task-buildout/building.ts (roofing branch: dry-in → cover) keeps producing the work steps
// (no recipes here, no supersedes_hand); the pack adds glossary, hazards, QA, inspection checklists,
// code refs and assemblies that complement the seeded B-ROOF-* / B-UNDERLAYMENT-SF rows.
// Dossier: docs/trade-packs/dossiers/roofing.md. Sources: 29 CFR 1926 Subparts M, X, L, K, I, C, H;
// OSHA 3755 Protecting Roofing Workers; UFGS 07 31 13 Asphalt Shingles; Owens Corning Duration install
// instructions; IRC R806/R903/R905/R908 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`, 'osha-3755'], confidence: 'verified' as const, last_verified: D });
const cfr = { src: ['ecfr-1926', 'osha-3755'], confidence: 'verified' as const, last_verified: D };
const ufgs = { src: ['ufgs-07-31-13'], confidence: 'verified' as const, last_verified: D };
const mfr = { src: ['oc-duration-install'], confidence: 'verified' as const, last_verified: D };
const ufgsMfr = { src: ['ufgs-07-31-13', 'oc-duration-install'], confidence: 'verified' as const, last_verified: D };
const irc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'roofing',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Steep-slope roof coverings on wood decks: tear-off, drip edge, ice barrier and underlayment (dry-in), flashing at valleys, walls and penetrations, shingles or metal panels, ridge and hip caps, and roof ventilation.',
    summary_es: 'Cubiertas de techo de pendiente pronunciada sobre cubierta de madera: retiro del techo viejo, borde de goteo, barrera contra hielo y base impermeable (secado), tapajuntas en limahoyas, muros y penetraciones, tejas o paneles metálicos, caballetes y ventilación del techo.',
    glossary: [
      { term: 'Square', term_es: 'Cuadro (100 pie²)', def: '100 square feet of roof surface — how shingles are sold and priced.', def_es: '100 pies cuadrados de techo; así se venden y cotizan las tejas.' },
      { term: 'Underlayment', term_es: 'Base impermeable', def: 'Felt or synthetic sheet laid over the deck under the shingles as a second water barrier.', def_es: 'Lámina de fieltro o sintética sobre la cubierta, debajo de las tejas, como segunda barrera contra el agua.' },
      { term: 'Ice barrier', term_es: 'Barrera contra hielo', def: 'Self-adhering membrane at the eaves that stops water backed up behind ice dams.', def_es: 'Membrana autoadherente en los aleros que detiene el agua represada detrás de las barreras de hielo.' },
      { term: 'Drip edge', term_es: 'Borde de goteo', def: 'Bent metal at eaves and rakes that sheds water off the deck edge and fascia.', def_es: 'Lámina metálica doblada en aleros y tímpanos que desvía el agua del borde de la cubierta y la fascia.' },
      { term: 'Step flashing', term_es: 'Tapajuntas escalonado', def: 'Small bent metal pieces woven with each shingle course where a roof meets a wall.', def_es: 'Piezas metálicas dobladas que se intercalan con cada hilera de tejas donde el techo se une a un muro.' },
      { term: 'Valley', term_es: 'Limahoya', def: 'Inside angle where two roof planes meet and water concentrates.', def_es: 'Ángulo interior donde se unen dos planos del techo y se concentra el agua.' },
      { term: 'Exposure', term_es: 'Exposición', def: 'Part of each shingle left visible to the weather after the next course is laid.', def_es: 'Parte de cada teja que queda a la vista después de colocar la siguiente hilera.' },
      { term: 'Starter strip', term_es: 'Tira de arranque', def: 'First row along eaves and rakes that seals the edge under the first full course.', def_es: 'Primera fila en aleros y tímpanos que sella el borde debajo de la primera hilera completa.' },
      { term: 'Ridge vent', term_es: 'Ventila de cumbrera', def: 'Vent along the ridge that lets warm, moist attic air out.', def_es: 'Ventila a lo largo de la cumbrera que deja salir el aire caliente y húmedo del ático.' },
      { term: 'Tear-off', term_es: 'Retiro de techo viejo', def: 'Removing the old roof covering down to the deck before re-roofing.', def_es: 'Quitar la cubierta vieja hasta la plataforma antes de volver a techar.' },
    ],
  },
  est_bucket: 'building',
  recipes: [],
  code_refs: {
    roof_dry_in: [
      { section: 'R905.1.1', code_type: 'IRC', note: 'Underlayment — type, laps and attachment', prov: irc },
      { section: 'R905.1.2', code_type: 'IRC', note: 'Ice barriers where ice damming is likely', prov: irc },
      { section: 'R905.2.8.5', code_type: 'IRC', note: 'Drip edge at eaves and rakes', prov: irc },
      { section: 'R903.2', code_type: 'IRC', note: 'Flashing at walls, valleys and penetrations', prov: irc },
    ],
    final: [
      { section: 'R905.2', code_type: 'IRC', note: 'Asphalt shingles — slope, fasteners, application', prov: irc },
      { section: 'R806', code_type: 'IRC', note: 'Roof ventilation', prov: irc },
      { section: 'R908', code_type: 'IRC', note: 'Reroofing — recover versus replacement', prov: irc },
    ],
  },
  equipment: [
    { when: { title_re: 'roof|shingle' }, type: 'air_compressor', reason: 'Pneumatic roofing nailers for underlayment caps and shingles', optional: true },
    { when: { title_re: 'roof|shingle', building_types: ['residential_mf', 'commercial', 'industrial'] }, type: 'telehandler', reason: 'Lift pallets of shingles and underlayment to the roof on larger buildings', optional: true },
    { when: { title_re: 'tear[- ]?off|re-?roof' }, type: 'dump_truck', reason: 'Haul tear-off debris when no roll-off container is used', optional: true },
  ],
  hazards: [
    { id: 'fall_steep_roof', hazard: 'Fall from the eave or rake edge of a steep roof', hazard_es: PENDING_ES, controls: ['Use personal fall arrest, guardrails with toeboards, or safety nets at 6 ft or more above the lower level', 'Rig anchors before stepping onto the roof and stay tied off while working'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(11)', severity: 4, ppe: ['full-body harness', 'soft-sole roofing boots'], prov: osha('m') },
    { id: 'fall_low_slope', hazard: 'Fall from the open edge of a low-slope roof section', hazard_es: PENDING_ES, controls: ['Use guardrails, nets or fall arrest — or a warning line plus fall arrest/monitor as the standard allows', 'Keep material and work back from the edge inside the warning line'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(10)', severity: 4, ppe: ['full-body harness'], prov: osha('m') },
    { id: 'fall_residential', hazard: 'Fall while roofing a house at 6 ft or more above the lower level', hazard_es: PENDING_ES, controls: ['Provide guardrails, safety net or personal fall arrest', 'Only use an alternative written fall protection plan where those are proven infeasible'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(13)', severity: 4, ppe: ['full-body harness'], prov: osha('m') },
    { id: 'anchor_failure', hazard: 'Fall arrest anchor or lifeline pulls out of the roof', hazard_es: PENDING_ES, controls: ['Fasten roof anchors into framing per the anchor maker, not into sheathing alone', 'Keep fall arrest anchors separate from anything used to hoist or support loads'], controls_es: PENDING_ES, osha_ref: '1926.502(d)(15)', severity: 4, prov: osha('m') },
    { id: 'holes_skylights', hazard: 'Fall through skylights, deck openings or rotted decking', hazard_es: PENDING_ES, controls: ['Cover or guard skylights and holes; secure and mark covers', 'Replace soft or rotted decking before walking on it'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(i)', severity: 4, prov: osha('m') },
    { id: 'falling_objects', hazard: 'Workers below struck by bundles, tools or debris falling off the roof', hazard_es: PENDING_ES, controls: ['Barricade the drop zone and keep people out of it', 'Use toeboards, screens or roof brackets; keep bundles away from the edge'], controls_es: PENDING_ES, osha_ref: '1926.501(c)', severity: 3, ppe: ['hard hat'], prov: osha('m') },
    { id: 'ladder', hazard: 'Ladder slip or overreach while getting onto the roof or carrying material', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above the landing and secure it top and bottom', 'Hoist bundles with a lift or hoist instead of carrying them up the ladder'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'scaffold_fall', hazard: 'Fall from scaffold or roof-edge work platform', hazard_es: PENDING_ES, controls: ['Provide guardrails or fall arrest on scaffolds more than 10 ft high', 'Have a competent person inspect the scaffold before each shift'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'debris_chute', hazard: 'Tear-off debris thrown from the roof striking people below', hazard_es: PENDING_ES, controls: ['Use an enclosed chute when dropping material more than 20 ft outside the walls', 'Otherwise barricade the drop area and post warning signs'], controls_es: PENDING_ES, osha_ref: '1926.252(a)', severity: 3, prov: cfr },
    { id: 'power_lines', hazard: 'Contact with overhead power lines from ladders, metal flashing or panels', hazard_es: PENDING_ES, controls: ['Locate overhead lines before setting ladders or lifting material', 'Keep ladders, metal and equipment clear; have the utility de-energize or cover lines when needed'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'nailer', hazard: 'Puncture wounds from pneumatic roofing nailers', hazard_es: PENDING_ES, controls: ['Keep the tool secured to the hose and the safety device working', 'Disconnect air before clearing jams; never carry the tool by the hose'], controls_es: PENDING_ES, osha_ref: '1926.302(b)', severity: 3, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'heat_illness', hazard: 'Heat illness working on hot roof surfaces in summer', hazard_es: PENDING_ES, controls: ['Train the crew to recognize heat illness; provide water, shade and rest breaks', 'Start early, acclimatize new workers, and watch each other'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'fall_protection_rigged', phase: 'roofing', item: 'Fall protection (anchors, harnesses, lifelines or guardrails) installed and checked before anyone works at 6 ft or more.', item_es: PENDING_ES, safety: true, prov: osha('m') },
    { id: 'openings_covered', phase: 'roofing', item: 'Skylights and deck openings covered or guarded, covers secured and marked.', item_es: PENDING_ES, safety: true, prov: osha('m') },
    { id: 'deck_sound', phase: 'roofing', item: 'Deck is smooth, dry and firm: no loose or rotted boards, nails driven flush, holes covered.', item_es: tr('Cubierta lisa, seca y firme: sin tablas sueltas ni podridas, clavos al ras y agujeros cubiertos.'), prov: ufgs },
    { id: 'deck_kept_dry', phase: 'roofing', item: 'Deck kept dry before, during and after install — exposed deck dried-in the same day.', item_es: tr('Cubierta protegida del agua antes, durante y después de la instalación; la cubierta expuesta se impermeabiliza el mismo día.'), prov: mfr },
    { id: 'drip_edge_order', phase: 'roofing', item: 'Drip edge on the deck at eaves and over the underlayment at rakes, nailed along its inner edge.', item_es: tr('Borde de goteo sobre la cubierta en los aleros y sobre la base en los tímpanos, clavado por su orilla interior.'), prov: ufgsMfr },
    { id: 'ice_barrier_extent', phase: 'roofing', item: 'Where required, self-adhered ice barrier runs from the eave to at least 24 in. inside the interior wall line.', item_es: tr('Donde se requiera, la barrera autoadherente va del alero hasta al menos 24 pulg. dentro de la línea interior del muro.'), prov: ufgsMfr },
    { id: 'underlayment_laps', phase: 'roofing', item: 'Underlayment laid parallel to the eave starting at the bottom, with laps and cap-nailing per the maker, and turned up walls.', item_es: tr('Base colocada paralela al alero empezando abajo, con traslapes y clavos con arandela según el fabricante, y subida en los muros.'), prov: ufgsMfr },
    { id: 'low_slope_underlay', phase: 'roofing', item: 'On slopes from 2:12 up to 4:12, double-layer underlayment or full self-adhered membrane; no shingles below 2:12.', item_es: tr('En pendientes de 2:12 a menos de 4:12, base doble o membrana autoadherente completa; no tejas por debajo de 2:12.'), prov: ufgsMfr },
    { id: 'nail_zone', phase: 'roofing', item: 'Shingle nails in the maker\'s nailing zone, hidden by the next course, never in or above the sealant strip.', item_es: tr('Clavos de la teja en la zona de clavado del fabricante, ocultos por la siguiente hilera, nunca sobre o arriba de la tira de sellador.'), prov: ufgsMfr },
    { id: 'nail_count_depth', phase: 'roofing', item: 'Nail count per shingle per the maker (more in high-wind areas); nails reach 3/4 in. into the deck or 1/4 in. through it, driven flush.', item_es: tr('Número de clavos por teja según el fabricante (más en zonas de viento fuerte); clavos penetran 3/4 pulg. en la cubierta o 1/4 pulg. a través, al ras.'), prov: mfr },
    { id: 'joint_stagger', phase: 'roofing', item: 'Shingle end joints staggered; joints do not line up vertically more often than every fourth course.', item_es: tr('Juntas de las tejas alternadas; no se alinean verticalmente más seguido que cada cuarta hilera.'), prov: ufgs },
    { id: 'valley_lining', phase: 'roofing', item: 'Valleys lined with a 36 in. self-adhered membrane under the underlayment; no nails within 6 in. of the valley centerline.', item_es: tr('Limahoyas con membrana autoadherente de 36 pulg. bajo la base; sin clavos a menos de 6 pulg. del eje de la limahoya.'), prov: ufgs },
    { id: 'wall_flashing', phase: 'roofing', item: 'Step flashing woven with every course at walls and chimneys, counterflashed; kick-out flashing at the roof-wall bottom.', item_es: tr('Tapajuntas escalonado intercalado con cada hilera en muros y chimeneas, con contra-tapajuntas; desviador al pie del encuentro techo-muro.'), prov: ufgs },
    { id: 'pipe_flashing', phase: 'roofing', item: 'Vent pipe flashings lap over the shingles below and under the shingles above, set in roof cement.', item_es: tr('Tapajuntas de tubos de ventilación traslapan sobre las tejas de abajo y bajo las de arriba, asentados en cemento asfáltico.'), prov: ufgs },
    { id: 'cold_weather_seal', item: 'Below 40°F, handle shingles with care and hand-seal perimeter shingles per the maker.', item_es: tr('Por debajo de 40 °F, manipular las tejas con cuidado y sellar a mano las tejas del perímetro según el fabricante.'), prov: mfr },
  ],
  inspection_checklists: {
    sheathing: [
      { item: 'Roof sheathing nailed to schedule with edge spacing (clips where specified) before underlayment', item_es: PENDING_ES },
    ],
    roof_dry_in: [
      { item: 'Drip edge installed at eaves and rakes in the right lap order', item_es: PENDING_ES, ref: 'R905.2.8.5' },
      { item: 'Ice barrier at eaves where required by the jurisdiction', item_es: PENDING_ES, ref: 'R905.1.2' },
      { item: 'Underlayment type, laps and fastening per maker and code', item_es: PENDING_ES, ref: 'R905.1.1' },
      { item: 'Valley linings, wall step flashing and penetration flashings in place', item_es: PENDING_ES, ref: 'R903.2' },
      { item: 'Fall protection in place for inspector access', item_es: PENDING_ES },
    ],
    final: [
      { item: 'Shingles fastened and aligned per maker; no exposed nails; ridge/hip caps sealed', item_es: PENDING_ES, ref: 'R905.2' },
      { item: 'Ridge and soffit ventilation open and not blocked by insulation', item_es: PENDING_ES, ref: 'R806' },
      { item: 'Kick-out flashing and gutters direct water away from walls', item_es: PENDING_ES },
      { item: 'Tear-off debris and nails cleaned up around the house', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-RF-ICE-WATER-SF', name: 'Self-adhered ice & water barrier (eaves, valleys) per SF', name_es: 'Barrera autoadherente contra hielo y agua (aleros, limahoyas) por pie²', unit: 'SF', csi: '07 31 13',
      material_cost_cents: { v: 60, prov: est('Self-adhered SBS membrane roll ≈2 sq at ≈$110–140, national baseline 2026') }, labor_hours_per_unit: { v: 0.006, prov: est('Peel-and-stick at eaves/valleys ≈1,300 SF per crew-hour-equivalent incl. cutting') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 10, prov: est('end laps + valley cuts') } },
    { code: 'B-RF-DRIP-EDGE-LF', name: 'Metal drip edge at eaves and rakes per LF', name_es: 'Borde de goteo metálico en aleros y tímpanos por pie lineal', unit: 'LF', csi: '07 62 00',
      material_cost_cents: { v: 100, prov: est('Prefinished aluminum/steel drip edge, 10 ft pieces ≈$9–12, national baseline 2026') }, labor_hours_per_unit: { v: 0.02, prov: est('cut, lap and nail ≈50 LF/hr') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('end laps and corner cuts') } },
    { code: 'B-RF-RIDGE-VENT-LF', name: 'Shingle-over ridge vent with cap shingles per LF', name_es: 'Ventila de cumbrera bajo tejas de caballete por pie lineal', unit: 'LF', csi: '07 31 13',
      material_cost_cents: { v: 450, prov: est('Rolled/rigid ridge vent ≈$3/LF + ridge cap shingles ≈$1.5/LF, national baseline 2026') }, labor_hours_per_unit: { v: 0.08, prov: est('cut deck slot, set vent, cap ≈12 LF/hr') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('end cuts') } },
    { code: 'B-RF-TEAROFF-SQ', name: 'Tear-off one layer of asphalt shingles incl. disposal per square', name_es: 'Retiro de una capa de tejas asfálticas incl. desecho por cuadro', unit: 'SQ', csi: '02 41 19',
      material_cost_cents: { v: 0, prov: est('no material') }, labor_hours_per_unit: { v: 1.0, prov: est('strip, clean deck, load debris ≈1 labor-hour per square') },
      equipment_cost_cents: { v: 2500, prov: est('Roll-off container share: ≈$500–600 per 20-yd box holding ≈20–25 squares of one-layer tear-off') }, waste_pct: { v: 0, prov: est('labor/disposal only') } },
    { code: 'B-RF-PIPE-BOOT-EA', name: 'Pipe/vent penetration flashing boot, each', name_es: 'Tapajuntas (bota) para tubo de ventilación, c/u', unit: 'EA', csi: '07 62 00',
      material_cost_cents: { v: 1800, prov: est('Metal-base neoprene/lead pipe flashing ≈$12–25, national baseline 2026') }, labor_hours_per_unit: { v: 0.3, prov: est('cut in, set in roof cement, weave shingles') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('unit item') } },
    { code: 'B-RF-STEP-FLASH-LF', name: 'Step flashing at roof-to-wall intersection per LF', name_es: 'Tapajuntas escalonado en encuentro techo-muro por pie lineal', unit: 'LF', csi: '07 62 00',
      material_cost_cents: { v: 150, prov: est('Prebent galvanized/aluminum step flashing ≈1.5 pieces per LF + membrane strip, national baseline 2026') }, labor_hours_per_unit: { v: 0.06, prov: est('weave with each course incl. kick-out share') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 10, prov: est('trimming and spares') } },
  ],
  quantity_rules: [
    { code: 'B-RF-ICE-WATER-SF', assumption: 'Ice barrier ≈0.3 SF per SF floor area (eave length × ≈6 ft incl. overhang + 24 in. inside the wall) — remove where not required', qty: { basis: 'area_sf_sum', mul: 0.3, round: 'ceil' } },
    { code: 'B-RF-DRIP-EDGE-LF', assumption: 'Drip edge ≈0.1 LF per SF floor area (eaves + rakes perimeter of a simple gable roof)', qty: { basis: 'area_sf_sum', mul: 0.1, round: 'ceil' } },
    { code: 'B-RF-RIDGE-VENT-LF', assumption: 'Ridge vent ≈0.02 LF per SF floor area (single ridge on a simple gable roof)', qty: { basis: 'area_sf_sum', mul: 0.02, round: 'ceil' } },
    { code: 'B-RF-PIPE-BOOT-EA', assumption: '≈1 vent-pipe boot per 700 SF floor area (plumbing vents through the roof)', qty: { basis: 'area_sf_sum', mul: 0.0015, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['framing', 'truss_setting'], before_phase: 'insulation', note: 'Roof dry-in follows framing/sheathing inspection and precedes insulation and drywall so the building stays dry.' },
  ],
});
