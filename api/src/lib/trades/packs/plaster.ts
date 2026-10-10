// Trade Knowledge Pack — plaster (Plaster / Veneer Plaster). Wave 15, COMPLEMENT pattern: the hand
// recipe in task-buildout/building.ts (shared drywall/plaster branch) keeps producing the work steps;
// this pack adds glossary, hazards, QA, inspection checklists, plaster code refs, equipment hints and
// plaster assemblies (veneer adder, three-coat on metal lath, repair, beads/grounds).
// Dossier: docs/trade-packs/dossiers/plaster.md. Sources: UFGS 09 23 00 / 09 26 00 / 09 22 36 (Aug
// 2024), NPS Preservation Brief 21, 29 CFR 1926 Subparts C, D, E, I, K, L, X, Z; IRC R702.2 and IBC
// 110.3.5 / 2507 / 2511 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const gyp = (note?: string) => ({ src: ['plaster-ufgs-09-23-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ven = (note?: string) => ({ src: ['plaster-ufgs-09-26-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const pb21 = (note?: string) => ({ src: ['plaster-nps-pb21'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'plaster',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Interior plaster: one- or two-coat veneer plaster troweled over gypsum base (blueboard), three-coat gypsum plaster over metal lath or masonry, the beads and grounds that set its thickness, and repair of old plaster walls and ceilings.',
    summary_es: 'Aplanado interior de yeso: yeso de capa delgada (veneer) en una o dos manos sobre panel base de yeso (panel azul), aplanado de yeso de tres capas sobre malla metálica o mampostería, los esquineros y maestras que fijan su espesor, y reparación de muros y plafones de yeso antiguos.',
    glossary: [
      { term: 'Veneer plaster', term_es: 'Yeso de capa delgada (veneer)', def: 'Very thin (about 1/16–1/8 in.) hard plaster troweled over special gypsum base in one or two coats.', def_es: 'Yeso duro muy delgado (aprox. 1/16–1/8 pulg) aplicado con llana sobre panel base especial en una o dos manos.' },
      { term: 'Gypsum base (blueboard)', term_es: 'Panel base de yeso (panel azul)', def: 'Gypsum panel with an absorbent face made to bond veneer plaster; not finished with tape and mud like drywall.', def_es: 'Panel de yeso con cara absorbente hecho para adherir el yeso veneer; no se acaba con cinta y compuesto como la tablaroca.' },
      { term: 'Scratch coat', term_es: 'Capa de raspado (primera mano)', def: 'First plaster coat pressed into the lath, then raked so the next coat grips it.', def_es: 'Primera mano de yeso presionada contra la malla y luego rayada para que la siguiente se agarre.' },
      { term: 'Brown coat', term_es: 'Capa café (segunda mano)', def: 'Second coat that brings the plaster out flat to the grounds and screeds.', def_es: 'Segunda mano que lleva el aplanado plano hasta las maestras y reglas.' },
      { term: 'Finish coat (white coat)', term_es: 'Capa de acabado (capa blanca)', def: 'Thin final coat troweled smooth or floated to a sand texture.', def_es: 'Mano final delgada, alisada con llana o flotada a textura de arena.' },
      { term: 'Double back', term_es: 'Doblar mano', def: 'Applying the second coat right away from the same batch while the first is still soft.', def_es: 'Aplicar la segunda mano enseguida, de la misma mezcla, mientras la primera sigue blanda.' },
      { term: 'Grounds', term_es: 'Maestras / guías', def: 'Beads, casings or wood strips set to line that the plasterer screeds to for a true, even thickness.', def_es: 'Esquineros, remates o listones colocados a línea que el yesero usa de guía para un espesor parejo.' },
      { term: 'Plaster keys', term_es: 'Llaves del yeso', def: 'Plaster pushed through gaps in old lath that hardens behind it and holds the wall on; broken keys make ceilings sag.', def_es: 'Yeso que pasó entre las tablillas antiguas y endureció detrás, sosteniendo el aplanado; si se rompen, el plafón se cuelga.' },
      { term: 'Plaster washer', term_es: 'Rondana para yeso', def: 'Thin perforated disc used with a screw to pull loose old plaster back to the lath.', def_es: 'Disco delgado perforado que se usa con un tornillo para volver a sujetar yeso antiguo flojo a la tablilla.' },
      { term: 'Bonding agent', term_es: 'Adherente', def: 'Liquid brushed on old plaster or concrete so new plaster sticks.', def_es: 'Líquido que se aplica sobre yeso viejo o concreto para que el yeso nuevo se adhiera.' },
    ],
  },
  est_bucket: 'building',
  recipes: [],
  code_refs: {
    insulation: [
      { section: '110.3.5', code_type: 'IBC', note: 'Lath and gypsum board/panel inspection before plaster or taping', prov: icc },
      { section: '2507', code_type: 'IBC', note: 'Lathing and plastering — materials and installation', prov: icc },
    ],
    final: [
      { section: 'R702.2.1', code_type: 'IRC', note: 'Gypsum plaster — coats over metal lath and other bases; veneer plaster one thin coat', prov: icc },
      { section: 'R702.2.2', code_type: 'IRC', note: 'Interior cement plaster — coats and moist curing between coats', prov: icc },
      { section: '2511', code_type: 'IBC', note: 'Interior plaster — coats, grounds, masonry/concrete bases and wet areas', prov: icc },
    ],
  },
  equipment: [
    { when: { building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'scissor_lift', reason: 'Plaster high ceilings and tall walls from a guarded platform instead of planks on horses', optional: true },
    { when: { building_types: ['commercial', 'residential_mf'] }, type: 'material_hoist', reason: 'Lift plaster bags, lath and gypsum base to upper floors', optional: true },
  ],
  hazards: [
    { id: 'scaffold_fall', hazard: 'Fall from a scaffold or plank platform while plastering ceilings and upper walls', hazard_es: PENDING_ES, controls: ['Guardrails or personal fall arrest on platforms more than 10 ft up', 'Fully plank platforms; a competent person inspects the scaffold before each shift', 'Climb by ladder or stair access, never the cross braces'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'rolling_scaffold', hazard: 'Rolling scaffold moves or racks while a plasterer is on it', hazard_es: PENDING_ES, controls: ['Lock casters and wheels before anyone climbs on', 'Keep the tower braced, plumb and level; push it from near the base'], controls_es: PENDING_ES, osha_ref: '1926.452(w)(2)', severity: 3, prov: osha('l') },
    { id: 'ladder', hazard: 'Fall from a stepladder while troweling or patching overhead', hazard_es: PENDING_ES, controls: ['Never stand on the top or top step of a stepladder', 'Move the ladder instead of reaching; use a platform for long runs'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'lead_old_plaster', hazard: 'Lead dust when cutting out, sanding or demolishing old painted plaster', hazard_es: PENDING_ES, controls: ['Assume pre-1978 paint on old plaster contains lead until tested; assess exposure before work starts', 'Mist and contain the work area, HEPA-vacuum, no dry sweeping or power sanding without dust collection', 'Follow the lead-safe renovation rule in pre-1978 homes and child-occupied spaces'], controls_es: PENDING_ES, osha_ref: '1926.62(d)(1)(i)', severity: 4, ppe: ['respirator as the exposure assessment requires', 'disposable coveralls'], prov: osha('d') },
    { id: 'asbestos_plaster', hazard: 'Asbestos in old troweled-on plaster, skim coats or textured ceilings disturbed during repair or removal', hazard_es: PENDING_ES, controls: ['Have the owner identify asbestos in troweled or sprayed surfacing before work in older buildings', 'Stop and get the material tested if suspect plaster or texture is found; removal only by trained, licensed abatement crews'], controls_es: PENDING_ES, osha_ref: '1926.1101(k)(1)(i)', severity: 4, prov: osha('z') },
    { id: 'silica_demo', hazard: 'Respirable silica from chipping out sanded base-coat plaster or cutting masonry substrates', hazard_es: PENDING_ES, controls: ['Wet the plaster before chipping; use tools with dust collection', 'Assess exposure when the task is not in the silica Table 1; keep it under the PEL', 'Clean up with HEPA vacuum or wet methods — never compressed air'], controls_es: PENDING_ES, osha_ref: '1926.1153(d)(1)', severity: 3, ppe: ['respirator when the assessment calls for it'], prov: osha('z') },
    { id: 'lime_burns', hazard: 'Skin and eye burns from lime putty and wet plaster', hazard_es: PENDING_ES, controls: ['Wear gloves and long sleeves when mixing and troweling', 'Wash skin promptly; keep eyewash water at the mixing area'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['alkali-resistant gloves', 'long sleeves'], prov: osha('e') },
    { id: 'eye_splash', hazard: 'Plaster splash and dust in the eyes, especially troweling ceilings and dumping bags', hazard_es: PENDING_ES, controls: ['Wear safety glasses or goggles when mixing, troweling overhead and chipping'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety goggles'], prov: osha('e') },
    { id: 'falling_ceiling', hazard: 'Struck by sagging old ceiling plaster that drops during repair', hazard_es: PENDING_ES, controls: ['Shore or support loose ceiling sections before working under them', 'Keep others out of the room below; wear a hard hat'], controls_es: PENDING_ES, osha_ref: '1926.100(a)', severity: 3, ppe: ['hard hat'], prov: osha('e') },
    { id: 'mixer', hazard: 'Hand or clothing caught in a paddle mixer or mortar mixer', hazard_es: PENDING_ES, controls: ['Keep mixer guards in place; never reach into a running drum', 'Hold drill mixers with both hands and let the paddle stop before lifting it out'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 3, prov: osha('i') },
    { id: 'cord_shock', hazard: 'Electric shock from mixers and cords in wet plaster areas', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Keep cords out of water buckets and wet mix; inspect them daily'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'debris', hazard: 'Slips and trips on plaster droppings, broken lath and demolition debris', hazard_es: PENDING_ES, controls: ['Clear droppings and lath with nails from floors and passageways during the shift', 'Bag demolition debris as it is made'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, ppe: ['puncture-resistant boots'], prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'conditions', item: 'Building weathertight and heat running; space held at 55–80 °F for a week before, during and after plastering, with drafts from vents shielded.', item_es: tr('Edificio cerrado y calefacción funcionando; espacio entre 13 y 27 °C una semana antes, durante y después del aplanado, sin corrientes de las rejillas.'), prov: gyp('1.6 / 1.6.1') },
    { id: 'base_fresh', item: 'Gypsum base not faded by sunlight and stored dry; faded or wet board replaced or primed with bonding agent per the maker.', item_es: tr('Panel base no decolorado por el sol y guardado seco; panel decolorado o mojado se cambia o se trata con adherente según el fabricante.'), prov: ven('1.4 / 1.6 sunlight on gypsum base') },
    { id: 'base_installed', item: 'Gypsum base hung in moderate contact without forcing, face flush across joints, end joints staggered at least 16 in.', item_es: tr('Panel base colocado con contacto moderado sin forzar, caras al ras en juntas y juntas de testa alternadas al menos 16 pulg.'), prov: ven('3.2') },
    { id: 'joint_reinforcement', item: 'All flat joints and inside angles reinforced before veneer — mesh strip set in plaster or paper tape in setting compound; no self-adhering fiberglass mesh.', item_es: tr('Todas las juntas planas y ángulos interiores reforzados antes del veneer: malla en yeso o cinta de papel en compuesto de fraguado; sin malla autoadherible de fibra de vidrio.'), prov: ven('3.3') },
    { id: 'grounds_aligned', item: 'Beads, casings and grounds checked straight and plumb before plaster starts; metal lath not continuous behind control joints.', item_es: tr('Esquineros, remates y maestras revisados rectos y a plomo antes de aplanar; la malla metálica no pasa continua detrás de juntas de control.'), prov: gyp('3.1 / 3.2.3') },
    { id: 'substrate_clean', item: 'Bases clean of dust, grease and bond breakers; no plaster over painted, bitumen-coated or frosted surfaces without the specified preparation.', item_es: tr('Bases limpias de polvo, grasa y desmoldantes; no se aplana sobre superficies pintadas, con asfalto o con escarcha sin la preparación especificada.'), prov: gyp('3.1') },
    { id: 'coat_count', item: 'Three coats over metal lath (scratch, brown, finish); two-coat double-up only on masonry or gypsum lath; veneer in one or two thin coats as specified.', item_es: tr('Tres manos sobre malla metálica (raspado, café, acabado); dos manos solo sobre mampostería o lámina de yeso; veneer en una o dos manos delgadas según lo especificado.'), prov: { src: ['plaster-ufgs-09-23-00', 'icc-pa'], confidence: 'verified', last_verified: D, note: 'UFGS 3.2.2 / 3.3.2; matches IRC R702.2.1 (reference).' } },
    { id: 'thickness', item: 'Total thickness meets the spec at grounds — about 5/8 in. over metal lath, masonry or concrete; veneer not under 1/16 in.', item_es: tr('Espesor total según especificación en las maestras: aprox. 5/8 pulg sobre malla metálica, mampostería o concreto; el veneer no menos de 1/16 pulg.'), prov: { src: ['plaster-ufgs-09-23-00', 'plaster-ufgs-09-26-00'], confidence: 'verified', last_verified: D, note: '09 23 00 §3.3.1; 09 26 00 §3.4.' } },
    { id: 'flatness', item: 'Finished plaster true within 1/8 in. in 8 ft — no waves, cracks, blisters, pits or visible day-joint lines.', item_es: tr('Aplanado terminado plano dentro de 1/8 pulg en 8 pies, sin ondas, grietas, ampollas, picaduras ni marcas visibles de unión entre jornadas.'), prov: gyp('3.2.2') },
    { id: 'control_joints', item: 'Plaster stopped at every control and expansion joint; joints at the drawn locations with panels kept to the specified maximum size.', item_es: tr('El aplanado se corta en cada junta de control y expansión; juntas en los lugares del plano y paños dentro del tamaño máximo especificado.'), prov: gyp('3.2.2 / 3.2.3') },
    { id: 'no_retemper', item: 'No water added after the slump is set and no retempering of plaster that has started to set; mixer cleaned between batches.', item_es: tr('No se agrega agua después de fijar el revenimiento ni se remezcla yeso que ya empezó a fraguar; mezcladora limpia entre tandas.'), prov: { src: ['plaster-ufgs-09-23-00', 'plaster-ufgs-09-26-00'], confidence: 'verified', last_verified: D, note: '09 23 00 §3.2.1; 09 26 00 §3.4.1.' } },
    { id: 'repair_match', item: 'Loose old plaster reattached with screws and plaster washers or cut back to sound edges; bonding agent on old edges; patch flush and matching texture.', item_es: tr('Yeso viejo flojo se vuelve a fijar con tornillos y rondanas o se corta hasta bordes sanos; adherente en los bordes viejos; resane al ras y con la misma textura.'), prov: { src: ['plaster-nps-pb21', 'plaster-ufgs-09-23-00'], confidence: 'verified', last_verified: D, note: 'PB21 reattachment and patching; UFGS 09 23 00 §3.5.' } },
    { id: 'no_wet_areas', item: 'Veneer plaster not used inside showers or constantly humid rooms; wet areas get the tile backer or cement system the drawings call for.', item_es: tr('El yeso veneer no se usa dentro de regaderas ni en cuartos siempre húmedos; las zonas mojadas llevan el respaldo para azulejo o sistema de cemento del plano.'), prov: ven('Intro note — not for shower rooms or excessively humid areas') },
    { id: 'hazmat_cleared', item: 'Old plaster and paint in pre-1980 buildings tested or cleared for asbestos and lead before cutting, chipping or demolition begins.', item_es: PENDING_ES, safety: true, prov: pb21('Lead and asbestos warnings; OSHA 1926.62 / 1926.1101 apply.') },
    { id: 'rated_assembly', item: 'Plaster on fire-rated walls and ceilings built to the listed design — same base, lath, plaster type and thickness.', item_es: PENDING_ES, safety: true, prov: gyp('1.7 fire resistive coatings') },
  ],
  inspection_checklists: {
    insulation: [
      { item: 'Insulation and cover inspection passed before lath or gypsum base hides the cavity', item_es: PENDING_ES },
      { item: 'Lath or gypsum base inspected before any plaster goes on, where the AHJ requires it', item_es: PENDING_ES, ref: 'IBC 110.3.5' },
      { item: 'Lath, grounds and beads fastened at the specified spacing; lath lapped and not run through control joints', item_es: PENDING_ES, ref: 'IBC 2507' },
    ],
    final: [
      { item: 'Plaster complete with the required number of coats; no open holes in rated walls or ceilings', item_es: PENDING_ES, ref: 'R702.2.1' },
      { item: 'Wet-area walls built with the system the plans call for — no veneer plaster in showers', item_es: PENDING_ES, ref: 'IBC 2511' },
    ],
  },
  assemblies: [
    { code: 'B-PLA-VENEER-ADD-SF', name: 'Veneer plaster finish on gypsum base instead of tape-and-mud (adder over standard drywall) per SF', name_es: 'Acabado de yeso veneer sobre panel base en lugar de cinta y compuesto (adicional sobre tablaroca estándar) por pie²', description: 'Adder on top of B-DRYWALL-SF: gypsum-base premium + one-coat veneer, net of the taping it replaces.', unit: 'SF', csi: '09 26 00',
      material_cost_cents: { v: 30, prov: est('blueboard premium over regular board + veneer plaster ≈ one 50 lb bag per ~120 SF, less joint compound/tape saved; national baseline 2026') }, labor_hours_per_unit: { v: 0.012, prov: est('veneer crew trowels ~40–50 SF/hr incl. joint treatment, net of taping labor saved') },
      equipment_cost_cents: { v: 1, prov: est('drill mixer share') }, waste_pct: { v: 10, prov: est('set plaster left in tubs') } },
    { code: 'B-PLA-3COAT-SF', name: 'Three-coat gypsum plaster on expanded metal lath (lath, scratch, brown, finish) per SF', name_es: 'Aplanado de yeso de tres capas sobre malla metálica expandida (malla, raspado, café, acabado) por pie²', unit: 'SF', csi: '09 23 00',
      material_cost_cents: { v: 190, prov: est('3.4 lb galvanized diamond lath + fasteners + base-coat and finish plaster for ~5/8 in. total, national baseline 2026') }, labor_hours_per_unit: { v: 0.09, prov: est('lather + plasterer + tender, three coats with cure time between') },
      equipment_cost_cents: { v: 5, prov: est('mortar mixer / plaster pump share') }, waste_pct: { v: 12, prov: est('droppings and lath laps') } },
    { code: 'B-PLA-REPAIR-SF', name: 'Old plaster repair — reattach with washers, cut out loose, bonding agent, base and finish coats to match, per SF patched', name_es: 'Reparación de yeso antiguo: refijar, retirar lo flojo, adherente y manos igualadas, por pie² resanado', unit: 'SF', csi: '09 23 00',
      material_cost_cents: { v: 160, prov: est('screws + plaster washers + bonding agent + base/finish plaster, small-quantity pricing 2026') }, labor_hours_per_unit: { v: 0.3, prov: est('small-area handwork incl. setup, protection and texture match') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; HEPA vac covered by site') }, waste_pct: { v: 20, prov: est('small batches set before use') } },
    { code: 'B-PLA-BEAD-LF', name: 'Plaster corner bead, casing bead or ground set to line, per LF', name_es: 'Esquinero, remate o maestra para yeso colocado a línea, por pie lineal', unit: 'LF', csi: '09 22 36',
      material_cost_cents: { v: 85, prov: est('galvanized expanded-flange bead + fasteners, 2026') }, labor_hours_per_unit: { v: 0.03, prov: est('cut, set plumb and straight, fasten') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('end cuts') } },
  ],
  quantity_rules: [
    { code: 'B-PLA-VENEER-ADD-SF', assumption: 'Plaster scheduled — veneer adder on ≈1 SF per SF floor (ceilings or feature walls). For a whole-house veneer job raise to ≈3.2 SF per SF floor (the B-DRYWALL-SF ratio); keep B-DRYWALL-SF for the board', when: { building_types: ['residential_sf', 'residential_mf', 'commercial'] }, qty: { basis: 'area_sf_sum', mul: 1, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['insulation'], note: 'Lath or gypsum base goes up only after the insulation (cover) inspection passes; plaster after the lath inspection.' },
  ],
});
