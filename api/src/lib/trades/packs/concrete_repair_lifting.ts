// Trade Knowledge Pack — concrete_repair_lifting (Concrete Repair / Lifting — mudjacking, polyurethane foam
// lifting, crack and spall repair, resurfacing). Wave 05, NEW-TRADE pattern without a permit path
// (permit_trade null): no gates, no code_refs — owner hold points live in inspection_checklists.
// Existing B-CFW-JOINTSEAL-LF (joint sealing) and B-FLAT-SEAL-SF (sealer) are referenced in the steps,
// never redeclared. Dossier: docs/trade-packs/dossiers/concrete_repair_lifting.md. Sources: UFGS 03 01 00,
// MoDOT slab stabilization tech brief + EPG 771.1, City of Regina slab-jacking spec, Alchatek AP Lift TDS,
// EPA / NIOSH / OSHA isocyanate guidance, NRMCA CIP 4, ICRI (ref), 29 CFR 1926 (C, D, E, I, K, Z).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['concrete_repair_lifting-ufgs-03-01-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const lift = (note?: string) => ({ src: ['concrete_repair_lifting-alchatek-aplift435-tds', 'concrete_repair_lifting-modot-slabstab-tb', 'concrete_repair_lifting-regina-2780'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const mud = (note?: string) => ({ src: ['concrete_repair_lifting-modot-epg-771-1', 'concrete_repair_lifting-regina-2780'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const iso = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`, 'concrete_repair_lifting-epa-spf-health', 'concrete_repair_lifting-niosh-96-111', 'concrete_repair_lifting-osha-isocyanates'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'concrete_repair_lifting',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Raising and re-supporting settled concrete slabs — walks, driveways, patios, steps, garage and pool decks — by mudjacking (cement grout) or polyurethane foam injection, plus crack routing and sealing, spall and partial-depth patching, and thin resurfacing overlays. Finds and fixes the cause of settlement before lifting.',
    summary_es: 'Levantar y volver a apoyar losas de concreto hundidas — banquetas, entradas de auto, patios, escalones, cocheras y andadores de alberca — con inyección de lechada de cemento (mudjacking) o espuma de poliuretano, además de sellado de grietas, parcheo de desconchados y reparaciones parciales, y recubrimientos delgados. Primero se busca y corrige la causa del hundimiento.',
    glossary: [
      { term: 'Mudjacking (slabjacking)', term_es: 'Mudjacking (levantamiento con lechada)', def: 'Pumping a cement-and-soil or cement-and-sand grout under a sunken slab through drilled holes to fill voids and raise it.', def_es: 'Bombear lechada de cemento con tierra o arena bajo una losa hundida por perforaciones para llenar huecos y levantarla.' },
      { term: 'Polyjacking (foam lifting)', term_es: 'Polyjacking (levantamiento con espuma)', def: 'Injecting two-part expanding polyurethane foam under a slab through small holes; the foam fills voids and lifts the slab as it expands.', def_es: 'Inyectar espuma de poliuretano expansiva de dos componentes bajo la losa por perforaciones pequeñas; la espuma llena huecos y levanta la losa al expandirse.' },
      { term: 'Injection port', term_es: 'Puerto de inyección', def: 'Small fitting set in a drilled hole that the injection gun or grout nozzle connects to.', def_es: 'Conector pequeño colocado en la perforación al que se conecta la pistola o la boquilla de lechada.' },
      { term: 'Dial indicator', term_es: 'Indicador de carátula', def: 'Gauge on a stand or crane that shows how far the slab has moved while you inject, so you stop before over-lifting.', def_es: 'Medidor sobre un soporte que muestra cuánto se ha movido la losa mientras se inyecta, para detenerse antes de levantar de más.' },
      { term: 'Void', term_es: 'Hueco (vacío)', def: 'Empty space under a slab where soil washed out or settled.', def_es: 'Espacio vacío bajo una losa donde la tierra se lavó o se asentó.' },
      { term: 'Spall', term_es: 'Desconchado', def: 'Piece of the concrete surface that has chipped or flaked off, often from freeze-thaw, deicers or rusting steel.', def_es: 'Parte de la superficie de concreto que se desprendió o descascaró, muchas veces por hielo-deshielo, sales o acero oxidado.' },
      { term: 'Delamination', term_es: 'Delaminación', def: 'Hidden layer of loose concrete that sounds hollow when tapped with a hammer or dragged chain.', def_es: 'Capa oculta de concreto suelto que suena hueca al golpearla con martillo o arrastrar una cadena.' },
      { term: 'Active crack', term_es: 'Grieta activa', def: 'Crack that still opens and closes with temperature or movement; it needs a flexible sealant, not rigid epoxy.', def_es: 'Grieta que todavía abre y cierra con la temperatura o el movimiento; necesita sellador flexible, no epóxico rígido.' },
      { term: 'Resurfacer (overlay)', term_es: 'Recubrimiento (resurfacer)', def: 'Thin polymer-modified cement topping troweled or squeegeed over sound, cleaned concrete to renew a worn surface.', def_es: 'Capa delgada de cemento modificado con polímero aplicada con llana o jalador sobre concreto sano y limpio para renovar una superficie gastada.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'slab_lifting',
      example_title: 'Slab lifting — polyurethane foam injection or mudjacking',
      when: { title_re: 'mud ?jack|slab ?jack|poly ?jack|polyurethane (?:foam )?(?:lift|inject)|foam (?:lift|inject)|concrete (?:lift|level|rais)|slab (?:lift|level|rais|stabiliz)|(?:lift|level|rais)(?:ing)? (?:the )?(?:sunken |settled )?(?:slab|walk|sidewalk|driveway|patio|steps?|stoop)|void fill' },
      steps: [
        {
          title: 'Survey the slab and fix the cause',
          instruction: 'Walk the job with the owner before drilling. Photograph and note every existing crack, measure how far each slab dropped, and agree on target heights. Find why it sank — downspouts, poor grading, washed-out fill, a leaking pipe — and get that fixed or scheduled, or it will sink again. Do not lift slabs that are shattered into small pieces; replace those instead.',
          detail: 'Sound the slab with a hammer for hollow areas. Note door thresholds, steps, foundation walls and drains the slab will move toward.',
          tools: ['camera', 'level or laser', 'tape', 'hammer'],
          materials: ['marking crayon', 'job survey form'],
          safety_ids: ['housekeeping_trips'],
          qa_ids: ['cause_identified', 'slab_condition'],
        },
        {
          title: 'Locate utilities and plan the hole pattern',
          instruction: 'Call 811 a few business days ahead and ask the owner about private lines — sprinkler pipe, landscape wiring, gas to a grill, sewer lateral, radiant tubing or plumbing under garage and basement slabs. Lay out injection holes per the foam or grout maker: foam usually on a 3–4 ft grid with small holes; mudjacking uses fewer, larger holes. Keep holes off joints, cracks and slab edges.',
          tools: ['tape', 'chalk line', 'utility locator (if available)'],
          materials: ['marking paint'],
          safety_ids: ['buried_utilities'],
          qa_ids: ['utilities_located', 'hole_layout'],
        },
        {
          title: 'Drill holes and set up lift monitoring',
          instruction: 'Drill straight down through the slab only — not deep into the base — using a rotary hammer with a dust shroud and vacuum. Protect walls, siding and nearby surfaces with plastic. Set dial indicators or a laser on each slab you lift and on the house or adjoining slab so you can see movement as it happens.',
          tools: ['rotary hammer with dust shroud', 'HEPA dust extractor', 'dial indicators or laser level'],
          materials: ['injection ports', 'plastic sheeting', 'surface release / flush'],
          safety_ids: ['silica_drilling', 'silica_cleanup', 'noise', 'pressurized_hose'],
          qa_ids: ['silica_controls', 'hole_layout'],
        },
        {
          title: 'Inject and lift in small, controlled steps',
          instruction: 'Start at the lowest point and inject in short shots, moving hole to hole so the slab rises evenly. Watch the gauges the whole time and stop at the agreed height — never pump past it. With mudjacking, use a thin grout and raise no more than about 1/4 in. at a time. Watch for foam or grout coming out of joints, cracks, drains or into a basement or crawlspace, and stop if it does. Do not over-pressure the gun.',
          detail: 'Foam: read the TDS and SDS first, keep others away from the gun, and purge the gun often so material does not cure inside it.',
          tools: ['injection gun or grout nozzle', 'proportioning rig or grout pump', 'dial indicators'],
          materials: ['two-part lifting foam or cement grout'],
          safety_ids: ['isocyanate_inhalation', 'isocyanate_skin', 'chemical_eye', 'pressurized_hose', 'cement_grout'],
          qa_ids: ['isocyanate_controls', 'lift_monitored', 'voids_filled', 'structure_clear'],
        },
        {
          title: 'Patch holes, seal joints and restore drainage',
          instruction: 'Pull the ports and fill every hole flush with a fast-setting cement patch, brushed or tinted to blend with the slab. Clean foam and grout off the surface. Seal the joint along the house and between slabs with backer rod and sealant so water can no longer wash out the base. Make sure the lifted slab and the ground beside it slope water away from the house.',
          tools: ['trowel', 'brush', 'caulk gun', 'level'],
          materials: ['fast-setting patch mortar', 'backer rod', 'self-leveling joint sealant'],
          safety_ids: ['cement_grout', 'housekeeping_trips'],
          qa_ids: ['holes_patched', 'joints_sealed', 'drainage_restored'],
        },
      ],
    },
    {
      id: 'crack_spall_repair',
      example_title: 'Concrete crack/spall repair & resurfacing',
      when: { title_re: 'crack (?:repair|seal|fill|rout|inject)|spall|resurfac|\\boverlay\\b|concrete (?:repair|patch|restor)|patch(?:ing)? (?:the )?(?:concrete|slab|walk|driveway)|partial[- ]depth' },
      steps: [
        {
          title: 'Assess cracks and sound for loose concrete',
          instruction: 'Tap the slab with a hammer or drag a chain and mark every hollow-sounding area. Decide for each crack whether it is still moving (active) or dormant: active cracks get a flexible sealant, dormant ones can take a rigid filler. Mark spall repairs as squares or rectangles that reach sound concrete. Note the cause — settlement, rusting steel, deicers — so the fix lasts.',
          tools: ['hammer or chain', 'crack gauge', 'marking crayon'],
          materials: ['marking paint'],
          safety_ids: ['housekeeping_trips'],
          qa_ids: ['crack_classified'],
        },
        {
          title: 'Cut out, chip and prepare the repair areas',
          instruction: 'Saw-cut the outline of each patch 1/2–3/4 in. deep with straight sides — no feathered edges. Chip out to sound concrete inside the cut and expose any rusted bar all the way around until it is clean. Rout deteriorated crack faces into a V-groove. Blow-clean only with a vacuum or water, never dry compressed air. Roughen the surface to the profile the repair product calls for.',
          tools: ['walk-behind or handheld saw with water feed', 'chipping hammer', 'grinder with shroud and vacuum', 'crack chaser'],
          materials: ['saw blades', 'cup wheels'],
          safety_ids: ['silica_grinding', 'silica_cleanup', 'noise', 'chemical_eye'],
          qa_ids: ['silica_controls', 'spall_prep'],
        },
        {
          title: 'Fill cracks and patch spalls',
          instruction: 'Bring the patch area to saturated-surface-dry or apply the bonding agent the repair maker calls for. Place repair mortar, pack it tight against the cut edges, strike off and finish to match the surrounding texture. Seal active cracks with backer rod and flexible sealant; fill dormant cracks with the specified filler. Cure as the product sheet says and keep traffic off until it has gained strength.',
          tools: ['margin trowel', 'float', 'broom', 'caulk gun', 'mixing drill'],
          materials: ['repair mortar', 'bonding agent', 'crack filler or flexible sealant', 'backer rod', 'curing compound'],
          safety_ids: ['cement_grout'],
          qa_ids: ['patch_overlay_cure'],
        },
        {
          title: 'Resurface worn concrete (when specified)',
          instruction: 'Lift or level any settled slabs and finish all patching first. Pressure-wash or grind the whole surface clean and sound, and dampen it without leaving puddles. Mark every existing control joint. Apply the resurfacer within the maker\'s temperature range and thickness, broom-finish for grip, and cut or tape the existing joints through the new layer so cracks do not reflect randomly. Cure and protect from rain and traffic.',
          tools: ['pressure washer', 'floor grinder with dust collection', 'squeegee or trowel', 'broom'],
          materials: ['polymer-modified resurfacer', 'joint tape or edging tool'],
          safety_ids: ['silica_grinding', 'silica_cleanup', 'noise', 'cement_grout'],
          qa_ids: ['silica_controls', 'patch_overlay_cure'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'mud ?jack|slab ?jack|chip|spall|partial[- ]depth' }, type: 'air_compressor', reason: 'Runs pneumatic grout pumps and chipping hammers', optional: true },
    { when: { title_re: 'poly ?jack|polyurethane|foam (?:lift|inject)|resurfac' }, type: 'generator', reason: 'Powers heated proportioning rigs, grinders and dust extractors where house power is not available', optional: true },
  ],
  hazards: [
    { id: 'silica_drilling', hazard: 'Breathing silica dust from drilling injection holes through concrete', hazard_es: PENDING_ES, controls: ['Use a drill with a dust shroud and a vacuum dust collector that meets the Table 1 airflow and filter requirements', 'Keep the shroud on and the vacuum filter clean; operate the tool per the maker'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['safety glasses'], prov: osha('z', 'Table 1 entry (vii): handheld and stand-mounted drills incl. rotary hammers.') },
    { id: 'silica_grinding', hazard: 'Breathing silica dust from grinding, saw-cutting or chasing cracks', hazard_es: PENDING_ES, controls: ['Use grinders and saws with integrated water feed or a shroud and dust collector per Table 1', 'Wear the respirator Table 1 requires for the tool, location and time on task'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator (as Table 1 requires)', 'safety glasses', 'hearing protection'], prov: osha('z', 'Table 1 entries (xii) handheld grinders and (xiii) walk-behind floor grinders.') },
    { id: 'silica_cleanup', hazard: 'Silica dust stirred up by dry sweeping or blowing off slabs and holes with compressed air', hazard_es: PENDING_ES, controls: ['Clean up with a HEPA vacuum or wet methods — no dry sweeping', 'Do not blow dust off with compressed air'], controls_es: PENDING_ES, osha_ref: '1926.1153(f)(1)', severity: 2, prov: osha('z') },
    { id: 'isocyanate_inhalation', hazard: 'Breathing isocyanate vapor or mist from two-part polyurethane lifting foam, which can cause asthma and lifelong sensitization', hazard_es: PENDING_ES, controls: ['Read the SDS and use the respirator it calls for, with medical clearance and a fit test', 'Keep the owner, family and pets away from the injection area and out of basements or crawlspaces under the work', 'Work with the wind at your back; never inject inside closed rooms without the ventilation the SDS requires'], controls_es: PENDING_ES, osha_ref: '1926.103', severity: 3, ppe: ['respirator per SDS'], prov: iso('e', '1926.103 adopts 29 CFR 1910.134. EPA spray-foam guidance applied by analogy to low-pressure injection foam.') },
    { id: 'isocyanate_skin', hazard: 'Skin contact with the isocyanate (A side) or uncured foam causing irritation and sensitization', hazard_es: PENDING_ES, controls: ['Keep the SDS for both components on site and train the crew on them', 'Wear chemical-resistant gloves and long sleeves when handling drums, lines and the gun; wash skin right away after contact'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 3, ppe: ['chemical-resistant gloves', 'long sleeves'], prov: iso('d', '1926.59 adopts 29 CFR 1910.1200 Hazard Communication.') },
    { id: 'chemical_eye', hazard: 'Foam, grout, sealant or chips spraying into the eyes from a hole blow-back, a burst line or chipping', hazard_es: PENDING_ES, controls: ['Wear safety glasses or goggles while drilling, chipping and injecting; add a face shield when standing over the gun', 'Never look down an injection hole while pumping'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 3, ppe: ['safety goggles', 'face shield'], prov: osha('e') },
    { id: 'pressurized_hose', hazard: 'Air, grout or heated chemical lines whipping or bursting under pressure', hazard_es: PENDING_ES, controls: ['Fit air hoses over 1/2 in. with a safety device at the supply that cuts pressure if the hose fails; use whip checks at couplings', 'Inspect hoses and fittings daily; tag and remove any damaged line', 'Relieve pressure before disconnecting'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(7)', severity: 3, prov: { src: ['ecfr-1926-i', 'ecfr-1926-c', 'concrete_repair_lifting-alchatek-aplift435-tds'], confidence: 'verified', last_verified: D, note: '1926.302(b)(7) covers compressed-air hoses; damaged equipment tagged out under 1926.20(b)(3); foam rig lines per maker.' } },
    { id: 'buried_utilities', hazard: 'Drilling or driving probes into buried electric lines, gas pipe or water and sewer lines under or beside the slab', hazard_es: PENDING_ES, controls: ['Call 811 and confirm marks before drilling; ask the owner about private lines 811 does not mark', 'Stay off marked lines; on garage and basement slabs check for plumbing and radiant tubing first'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(3)', severity: 4, prov: { src: ['ecfr-1926-k', 'concrete_repair_lifting-call811', 'concrete_repair_lifting-alchatek-aplift435-tds'], confidence: 'verified', last_verified: D } },
    { id: 'noise', hazard: 'Hearing damage from rotary hammers, chipping hammers, saws, grinders and pump engines', hazard_es: PENDING_ES, controls: ['Wear hearing protection when noise cannot be reduced', 'Keep pump engines and compressors away from where the crew works'], controls_es: PENDING_ES, osha_ref: '1926.101(a)', severity: 2, ppe: ['hearing protection'], prov: osha('e') },
    { id: 'cement_grout', hazard: 'Chemical burns and irritation from wet cement grout, patch mortar and resurfacer on skin', hazard_es: PENDING_ES, controls: ['Wear waterproof gloves, long sleeves and boots when mixing and placing grout or mortar', 'Wash off wet cement promptly; do not kneel in wet material'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['waterproof gloves', 'safety glasses'], prov: osha('e') },
    { id: 'housekeeping_trips', hazard: 'Tripping over hoses, cords, open holes and cured foam debris on walks and driveways', hazard_es: PENDING_ES, controls: ['Route hoses along edges and keep the work area clear', 'Fill or cover open holes before leaving and remove foam scrap daily'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 1, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'cause_identified', phase: 'sitework', item: 'Cause of settlement found and fixed or scheduled before lifting — downspouts extended, grading corrected, washout or leaking pipe repaired.', item_es: tr('Causa del hundimiento encontrada y corregida o programada antes de levantar: bajantes extendidas, nivelación corregida, deslave o tubería con fuga reparados.'), prov: { src: ['concrete_repair_lifting-nrmca-cip4', 'concrete_repair_lifting-alchatek-aplift435-tds'], confidence: 'verified', last_verified: D, note: 'CIP 4: subgrade settlement and drainage cause cracking; TDS: review soils before lifting.' } },
    { id: 'slab_condition', item: 'Slab judged sound enough to lift (not shattered into small pieces); existing cracks photographed and agreed with the owner before work.', item_es: tr('Losa evaluada como suficientemente sana para levantar (no quebrada en pedazos pequeños); grietas existentes fotografiadas y acordadas con el dueño antes del trabajo.'), prov: lift('Regina 3.1.2 pre-work condition survey with the owner') },
    { id: 'utilities_located', item: '811 locate confirmed and private lines (sprinklers, wiring, gas, sewer lateral, radiant or under-slab plumbing) checked before drilling.', item_es: PENDING_ES, safety: true, prov: { src: ['concrete_repair_lifting-call811', 'concrete_repair_lifting-alchatek-aplift435-tds'], confidence: 'verified', last_verified: D } },
    { id: 'hole_layout', item: 'Injection holes on the maker\'s pattern (foam typically 3–4 ft grid), drilled straight through the slab only, kept off joints, cracks and edges, with little breakout at the bottom.', item_es: tr('Perforaciones según el patrón del fabricante (espuma normalmente a cada 3–4 pies), hechas rectas solo a través de la losa, lejos de juntas, grietas y bordes, con poco desprendimiento abajo.'), prov: lift('TDS 3–4 ft grid; MoDOT holes through slab only; Regina vertical holes, minimal breakout') },
    { id: 'lift_monitored', item: 'Every slab lifted with gauges or laser watched during injection; final height within about 1/8 in. of target, no over-lift, mudjacked slabs raised no more than about 1/4 in. per pass.', item_es: tr('Cada losa levantada vigilando medidores o láser durante la inyección; altura final a 1/8 pulg. aprox. de la meta, sin levantar de más; con mudjacking no más de 1/4 pulg. por pasada.'), prov: { src: ['concrete_repair_lifting-alchatek-aplift435-tds', 'concrete_repair_lifting-modot-epg-771-1', 'concrete_repair_lifting-regina-2780'], confidence: 'verified', last_verified: D, note: 'TDS dial indicators to prevent over-lift; EPG ≤1/4 in. at a time; Regina within 5 mm (≈3/16 in.) of target — 1/8 in. is our tighter residential default.' } },
    { id: 'voids_filled', item: 'Voids filled under the whole slab — tap test sounds solid after lifting and material showed at adjacent holes or joints; no rocking slabs.', item_es: tr('Huecos llenos bajo toda la losa: la prueba con martillo suena sólida después de levantar y el material salió en perforaciones o juntas vecinas; ninguna losa se mece.'), prov: lift('MoDOT: material seeping from adjacent joints shows voids filled') },
    { id: 'structure_clear', item: 'Lifted slab not jammed against the foundation, steps or door thresholds; no foam or grout in basements, crawlspaces, window wells, drains or sewer cleanouts.', item_es: tr('La losa levantada no queda apretada contra la cimentación, escalones o umbrales; sin espuma ni lechada en sótanos, espacios de acceso, pozos de ventana, drenajes ni registros.'), prov: mud('EPG: watch for blowouts; Regina 3.1.10 replace slabs damaged by excess force') },
    { id: 'holes_patched', item: 'Every injection hole filled flush with fast-setting cement patch, finished and color-blended to the slab; surface cleaned of foam and grout.', item_es: tr('Cada perforación rellena a ras con parche de cemento de fraguado rápido, terminada y del color de la losa; superficie limpia de espuma y lechada.'), prov: lift('TDS: fill holes with fast-setting cement; Regina 3.1.9 sealed flush') },
    { id: 'joints_sealed', item: 'Joints between lifted slabs and along the house sealed with backer rod and sealant after lifting so water cannot wash out the base again.', item_es: tr('Juntas entre losas levantadas y junto a la casa selladas con cordón de respaldo y sellador después de levantar, para que el agua no vuelva a lavar la base.'), prov: { src: ['concrete_flatwork-nrmca-cip6', 'concrete_repair_lifting-nrmca-cip4'], confidence: 'verified', last_verified: D } },
    { id: 'drainage_restored', item: 'Finished slabs and adjoining grade slope water away from the house; no new low spots or trip edges between slabs.', item_es: tr('Losas terminadas y terreno junto a ellas con pendiente que aleja el agua de la casa; sin nuevos puntos bajos ni escalones entre losas.'), prov: lift('Regina 3.1.4 match adjacent drainage, elevation and cross slope') },
    { id: 'silica_controls', item: 'Drilling, sawing and grinding done with the Table 1 controls (shroud and vacuum or water feed) and required respirators; cleanup by HEPA vacuum or wet methods.', item_es: PENDING_ES, safety: true, prov: osha('z') },
    { id: 'isocyanate_controls', item: 'Foam SDS on site, crew wearing the PPE it lists, and owners, children and pets kept clear of the injection area and spaces below it.', item_es: PENDING_ES, safety: true, prov: { src: ['concrete_repair_lifting-epa-spf-tips', 'concrete_repair_lifting-osha-isocyanates', 'ecfr-1926-d'], confidence: 'verified', last_verified: D } },
    { id: 'crack_classified', item: 'Each crack classed active or dormant before repair; active cracks get flexible sealant, not rigid epoxy or cement filler.', item_es: tr('Cada grieta clasificada como activa o inactiva antes de reparar; las activas llevan sellador flexible, no epóxico rígido ni relleno de cemento.'), prov: ufgs('No rigid epoxy in active cracks') },
    { id: 'spall_prep', item: 'Patch outlines saw-cut 1/2–3/4 in. deep with square edges (no feathered edges), loose concrete removed to sound concrete, rusted bar cleaned all around, surface roughened to the product profile.', item_es: tr('Contornos de parches cortados con sierra de 1/2 a 3/4 pulg. de profundidad con bordes rectos (sin bordes en pluma), concreto suelto retirado hasta concreto sano, varilla oxidada limpia todo alrededor y superficie con el perfil que pide el producto.'), prov: { src: ['concrete_repair_lifting-ufgs-03-01-00', 'concrete_repair_lifting-icri-guidelines'], confidence: 'verified', last_verified: D, note: 'UFGS 03 01 00 3.3: perimeter saw cut 0.50–0.75 in., remove to sound concrete; ICRI surface profile concept (ref only).' } },
    { id: 'patch_overlay_cure', item: 'Patches and resurfacer placed within the maker\'s temperature range on a damp (not wet) surface, existing control joints carried through the overlay, texture matched, and cured before traffic.', item_es: tr('Parches y recubrimiento colocados dentro del rango de temperatura del fabricante sobre superficie húmeda (sin charcos), juntas de control existentes llevadas a través del recubrimiento, textura igualada y curado antes del tránsito.'), prov: ufgs('Application temperature per manufacturer; joint continuity per CIP 6 concept') },
  ],
  inspection_checklists: {
    pre_lift_survey: [
      { item: 'Existing cracks, chips and heights photographed and recorded with the owner; target heights agreed', item_es: tr('Grietas, desportillados y alturas existentes fotografiados y registrados con el dueño; alturas meta acordadas') },
      { item: 'Cause of settlement identified and the fix (downspouts, grading, leak repair) agreed and scheduled', item_es: tr('Causa del hundimiento identificada y la corrección (bajantes, nivelación, reparación de fugas) acordada y programada') },
      { item: '811 ticket confirmed and owner asked about private lines under or beside the slab', item_es: PENDING_ES },
      { item: 'Slabs too broken to lift flagged for replacement instead', item_es: tr('Losas demasiado rotas para levantar marcadas para reemplazo') },
    ],
    repair_prep_hold: [
      { item: 'Patch outlines saw-cut square and all loose concrete removed — inspect before mortar is placed', item_es: tr('Contornos de parches cortados en escuadra y todo el concreto suelto retirado; revisar antes de colocar mortero'), ref: 'UFGS 03 01 00 3.3' },
      { item: 'Surface profile and cleanliness match the repair or resurfacer product sheet', item_es: tr('Perfil y limpieza de la superficie de acuerdo con la ficha del producto de reparación o recubrimiento') },
      { item: 'Weather window and surface temperature within the product range for placing and curing', item_es: tr('Ventana de clima y temperatura de superficie dentro del rango del producto para colocar y curar') },
    ],
    final_walkthrough: [
      { item: 'Slabs at agreed heights, no rocking, no trip edges between slabs', item_es: tr('Losas a las alturas acordadas, sin mecerse y sin escalones entre losas') },
      { item: 'Holes patched flush and blended; foam and grout cleaned off all surfaces', item_es: tr('Perforaciones parchadas a ras y del mismo tono; espuma y lechada limpias de todas las superficies') },
      { item: 'Joints sealed and water drains away from the house (hose test where in doubt)', item_es: tr('Juntas selladas y el agua escurre lejos de la casa (prueba con manguera si hay duda)') },
      { item: 'Basement, crawlspace, window wells and drains checked for foam or grout intrusion', item_es: tr('Sótano, espacio de acceso, pozos de ventana y drenajes revisados por entrada de espuma o lechada') },
      { item: 'Owner told cure times before vehicle traffic and given the before/after records', item_es: tr('Se informó al dueño el tiempo de curado antes del tránsito de vehículos y se le entregaron los registros de antes y después') },
    ],
  },
  assemblies: [
    { code: 'G-CRL-POLYLIFT-SF', name: 'Polyurethane foam slab lift and void fill, per SF of slab lifted (holes counted separately)', name_es: 'Levantamiento de losa y relleno de huecos con espuma de poliuretano, por pie² de losa levantada (perforaciones aparte)', unit: 'SF', csi: '03 01 30',
      material_cost_cents: { v: 250, prov: est('≈0.5 lb two-part lifting foam per SF at a typical residential void and lift, ~$5/lb delivered, 2026 baseline — consumption varies with soil and void size (TDS)') },
      labor_hours_per_unit: { v: 0.045, prov: est('2-person crew lifting ≈350 SF of walks/driveway per day incl. setup and monitoring') },
      equipment_cost_cents: { v: 100, prov: est('heated proportioning rig/trailer day-rate share over ≈350 SF/day') }, waste_pct: { v: 10, prov: est('purge and flush loss') } },
    { code: 'G-CRL-MUDJACK-SF', name: 'Mudjacking (cement-grout slab lift and void fill), per SF of slab lifted (holes counted separately)', name_es: 'Mudjacking (levantar losa y rellenar huecos con lechada de cemento), por pie² de losa (perforaciones aparte)', unit: 'SF', csi: '03 01 30',
      material_cost_cents: { v: 60, prov: est('cement + sand/topsoil/limestone grout at ≈0.1 CF per SF, 2026 baseline') },
      labor_hours_per_unit: { v: 0.05, prov: est('2–3 person crew lifting ≈400 SF per day incl. mixing, pumping and cleanup') },
      equipment_cost_cents: { v: 50, prov: est('grout pump/mixer trailer day-rate share') }, waste_pct: { v: 15, prov: est('mixing loss and blowouts') } },
    { code: 'G-CRL-INJHOLE-EA', name: 'Injection hole — drill through slab, set port, remove and patch flush with color-blended cement, each', name_es: 'Perforación de inyección: perforar la losa, colocar puerto, retirarlo y parchar a ras con cemento del mismo tono, c/u', unit: 'EA', csi: '03 01 30',
      material_cost_cents: { v: 150, prov: est('port + fast-setting patch mortar + bit wear per hole, 2026') },
      labor_hours_per_unit: { v: 0.15, prov: est('drill with shroud/vacuum, set port, pull port, pack and finish patch') },
      equipment_cost_cents: { v: 25, prov: est('rotary hammer and HEPA extractor share') }, waste_pct: { v: 10, prov: est('patch mix loss') } },
    { code: 'G-CRL-CRACK-LF', name: 'Crack rout and seal — chase/clean crack, backer rod where needed, flexible sealant or crack filler, per LF', name_es: 'Sellado de grieta: abrir y limpiar, cordón de respaldo si hace falta, sellador flexible o relleno, por pie lineal', unit: 'LF', csi: '03 01 30',
      material_cost_cents: { v: 80, prov: est('polyurethane/self-leveling sealant or crack filler + backer rod for a ≈1/4–1/2 in. routed crack, 2026') },
      labor_hours_per_unit: { v: 0.06, prov: est('crack chaser with vacuum, clean, rod and tool sealant, ≈16 LF/hr') },
      equipment_cost_cents: { v: 5, prov: est('crack chaser and vacuum share') }, waste_pct: { v: 10, prov: est('tooling and cartridge loss') } },
    { code: 'G-CRL-SPALL-SF', name: 'Spall / partial-depth patch — saw-cut outline, chip to sound, bond, repair mortar ≈1 in. avg., per SF', name_es: 'Parche de desconchado: cortar contorno, picar hasta concreto sano, adherente y mortero de ≈1 pulg. promedio, por pie²', unit: 'SF', csi: '03 01 30',
      material_cost_cents: { v: 600, prov: est('polymer-modified repair mortar ≈0.1 CF per SF at 1 in. avg. + bonding agent, 2026') },
      labor_hours_per_unit: { v: 0.5, prov: est('saw-cut, chip, clean, place, finish and cure small patches — small areas run slow') },
      equipment_cost_cents: { v: 50, prov: est('saw, chipping hammer and compressor share') }, waste_pct: { v: 15, prov: est('small-batch mixing loss') } },
    { code: 'G-CRL-RESURF-SF', name: 'Resurfacing overlay — profile, polymer-modified resurfacer ≈1/8–1/4 in., broom finish, joints kept, per SF', name_es: 'Recubrimiento: perfilar, resurfacer con polímero de ≈1/8–1/4 pulg., acabado escobillado, juntas respetadas, por pie²', unit: 'SF', csi: '03 01 30',
      material_cost_cents: { v: 150, prov: est('bagged polymer-modified resurfacer at ≈1/8–1/4 in., 2026 retail/distributor') },
      labor_hours_per_unit: { v: 0.04, prov: est('pressure wash or grind, apply, broom and re-cut joints, ≈200 SF per person-day incl. prep') },
      equipment_cost_cents: { v: 15, prov: est('pressure washer / grinder share') }, waste_pct: { v: 10, prov: est('mixing loss') } },
  ],
  dependency_hints: [
    { after_trades: ['gutters', 'plumbing'], note: 'Fix downspout discharge, grading and any leaking pipe under the slab before lifting, or the slab will settle again.' },
    { before_phase: 'punch', note: 'Lift and level slabs before patching, resurfacing and final joint sealing; resurfacing goes on only after all lifting is done.' },
  ],
});
