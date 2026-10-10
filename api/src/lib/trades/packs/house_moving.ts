// Trade Knowledge Pack — house_moving (Building Moving / House Raising). Wave 07 — NEW-TRADE pattern (no
// hand recipe, no template tasks). Dossier: docs/trade-packs/dossiers/house_moving.md. Sources: FEMA P-312
// Homeowner’s Guide to Retrofitting (elevation §5.2 + relocation §6.1), IASM hiring guide, WisDOT single
// trip building (SB) permit + Wis. Stat. 348.27, 29 CFR 1926 (C, G, I, K, M, O, P, T, Z), IRC R105/R322/R403/
// R404 + IEBC Chapter 14 relocated buildings (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const fema = { src: ['house_moving-fema-p312'], confidence: 'verified' as const, last_verified: D };
const femaD = (note: string) => ({ src: ['house_moving-fema-p312'], confidence: 'derived' as const, last_verified: D, note });
const iasm = { src: ['house_moving-iasm-hiring'], confidence: 'verified' as const, last_verified: D };
const wisdot = { src: ['house_moving-wisdot-osow-sb', 'house_moving-wi-stat-348-27'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'house_moving',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Lifts houses off their foundations on steel beams and unified hydraulic jacks — raising them in place (flood elevation or a new foundation underneath) or hauling them on dollies over a permitted route to a new foundation — with utilities disconnected first, the load on cribbing at every stage, and the house reset, anchored and reconnected.',
    summary_es: 'Levanta casas de su cimentación con vigas de acero y gatos hidráulicos sincronizados — elevándolas en su lugar (contra inundaciones o con cimentación nueva debajo) o llevándolas en carros por una ruta con permiso a una cimentación nueva — desconectando antes los servicios, con la carga sobre encamado en cada etapa, y la casa asentada, anclada y reconectada.',
    glossary: [
      { term: 'Cribbing', term_es: 'Encamado (cribbing)', def: 'Hardwood timbers stacked log-cabin style to hold the house while the jacks are reset or the foundation is built.', def_es: 'Maderos de madera dura apilados en forma de cabaña de troncos que sostienen la casa mientras se reacomodan los gatos o se construye la cimentación.' },
      { term: 'Crib tower', term_es: 'Torre de encamado', def: 'One stacked pile of cribbing under a beam; each lift point has its own tower.', def_es: 'Una pila de encamado bajo una viga; cada punto de levante tiene su propia torre.' },
      { term: 'Main beams / cross beams', term_es: 'Vigas principales / vigas transversales', def: 'Two layers of steel I-beams at right angles that form the cradle the house rides on.', def_es: 'Dos capas de vigas de acero en ángulo recto que forman la cuna sobre la que viaja la casa.' },
      { term: 'Unified hydraulic jacking', term_es: 'Gateo hidráulico sincronizado', def: 'Jacks tied to one control so every lift point rises the same amount at the same time.', def_es: 'Gatos conectados a un solo control para que todos los puntos de levante suban lo mismo al mismo tiempo.' },
      { term: 'Lift point', term_es: 'Punto de levante', def: 'A spot under a beam picked by the mover or engineer where a jack and crib tower carry load.', def_es: 'Un punto bajo una viga elegido por el mover o el ingeniero donde un gato y una torre de encamado cargan peso.' },
      { term: 'Dollies (wheel sets)', term_es: 'Carros (juegos de ruedas)', def: 'Rubber-tired axles set under the beams so the house can be towed to the road and the new site.', def_es: 'Ejes con llantas colocados bajo las vigas para remolcar la casa hasta el camino y al nuevo sitio.' },
      { term: 'Base flood elevation (BFE)', term_es: 'Elevación de inundación base (BFE)', def: 'Flood height with a 1 % chance each year, shown on the flood map; the raise target starts here.', def_es: 'Altura de inundación con 1 % de probabilidad cada año, indicada en el mapa de inundación; la meta de elevación parte de aquí.' },
      { term: 'Freeboard', term_es: 'Bordo libre', def: 'Extra height added above the BFE as a safety margin.', def_es: 'Altura adicional sobre la BFE como margen de seguridad.' },
      { term: 'Flood openings', term_es: 'Aberturas de inundación', def: 'Vents low in the new foundation walls that let floodwater in and out so the walls are not pushed over.', def_es: 'Rejillas bajas en los muros de la cimentación nueva que dejan entrar y salir el agua para que los muros no se vuelquen.' },
      { term: 'Route survey', term_es: 'Estudio de ruta', def: 'Drive of the moving route to find low wires, signals, tight turns, weak bridges and signs to remove.', def_es: 'Recorrido de la ruta para encontrar cables bajos, semáforos, vueltas cerradas, puentes débiles y letreros que retirar.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'raise_in_place',
      example_title: 'Raise house for flood elevation',
      when: { title_re: '\\b(?:rais(?:e|ing) (?:the )?(?:house|home|structure|building)|house rais\\w*|lift(?:ing)? (?:the )?(?:house|home)|house lift\\w*|elevat\\w* (?:the )?(?:house|home|structure))\\b' },
      steps: [
        {
          title: 'Confirm the lift plan, target height and permits',
          instruction: 'Have the engineer’s or mover’s lift plan on site: beam layout, lift points, target finished-floor height and the new foundation design. For a flood raise, the target is the base flood elevation plus the freeboard the community requires (FEMA suggests at least 1 ft). Pull the building and flood permits, get a pre-lift elevation survey, and photograph cracks inside and out before anything moves.',
          detail: 'A slab-on-grade house needs an engineer to decide whether the slab can be lifted with the house or must be left behind.',
          tools: ['laser level and rod', 'tape measure', 'camera'],
          materials: ['stamped lift plan and foundation drawings', 'building and floodplain permits', 'pre-lift elevation survey'],
          safety_ids: ['structure_collapse'],
          qa_ids: ['plan_on_site', 'target_elevation', 'mover_insured'],
          code_refs: [{ section: 'R105.1', code_type: 'IRC', note: 'Permit needed to move or alter a building' }, { section: 'R322.2.1', code_type: 'IRC', note: 'Lowest floor at or above the design flood elevation' }],
        },
        {
          title: 'Disconnect and cap every utility',
          instruction: 'Have the utility companies and licensed trades shut off and disconnect gas, electric service, water, sewer, phone/cable and any fuel oil or propane lines at the building line, and cap them. Disconnect ducts, drains and wiring that pass through the floor into the basement or crawlspace. Confirm in writing that each service is dead before the crew opens the foundation.',
          tools: ['voltage tester', 'pipe wrenches', 'camera'],
          materials: ['pipe caps and plugs', 'utility disconnect confirmations'],
          safety_ids: ['live_utilities', 'buried_utilities'],
          qa_ids: ['utilities_disconnected'],
        },
        {
          title: 'Open the foundation and set the steel and cribbing',
          instruction: 'Cut or knock openings through the foundation wall at the beam locations, wet-cutting concrete for dust. Slide the main steel beams in under the floor framing at right angles to the joists, then the cross beams below them, so the two layers form a cradle. Build a crib tower on firm, level ground at every lift point and set the jacks on blocked bases.',
          detail: 'On a low crawlspace, dig trenches at each beam and pits for the jacks first; keep spoil back from the edge.',
          tools: ['concrete saw or chipping hammer', 'hydraulic jacks', 'skid steer or telehandler', 'level'],
          materials: ['steel main and cross beams', 'hardwood cribbing', 'jack bases and cap blocks'],
          safety_ids: ['silica', 'cribbing_failure', 'crush_under_load', 'cave_in'],
          qa_ids: ['cribbing_built'],
        },
        {
          title: 'Lift with unified jacks, cribbing as you go',
          instruction: 'Raise the house a few inches at a time with all jacks on one unified control so every lift point moves together. After each stroke, build the crib towers up tight under the beams before resetting the jacks. Keep everyone out from under the house unless it is resting on cribbing. Stop and call the engineer at any racking, new cracking or a jack that falls behind.',
          tools: ['unified hydraulic jacking system', 'laser level and rod', 'radios'],
          materials: ['hardwood cribbing', 'lift log sheet'],
          safety_ids: ['jack_overload', 'cribbing_failure', 'crush_under_load', 'structure_collapse'],
          qa_ids: ['lift_monitored', 'cribbing_built'],
        },
        {
          title: 'Build the new foundation under the raised house',
          instruction: 'With the house resting on cribbing, excavate for and pour new or extended footings, then build the foundation walls or piers to the new height as drawn. Get the footing inspection before concrete and the foundation inspection before the house is set down. For a flood raise, place the required flood openings low in the walls and leave sleeves for utilities.',
          detail: 'Flood openings go no higher than 1 ft above the adjacent grade; the permit sets their size and number.',
          tools: ['mini excavator', 'concrete forms', 'level'],
          materials: ['footing and wall concrete or block', 'reinforcing steel', 'flood vents', 'anchor bolts or straps'],
          safety_ids: ['cave_in', 'buried_utilities', 'crush_under_load'],
          qa_ids: ['footing_inspected', 'flood_openings'],
          gating_inspection_type: 'foundation',
          code_refs: [{ section: 'R403.1', code_type: 'IRC', note: 'Footings sized and supported for the loads' }, { section: 'R404.1', code_type: 'IRC', note: 'Concrete and masonry foundation walls' }, { section: 'R322.2.2', code_type: 'IRC', note: 'Enclosed areas below the design flood elevation need flood openings' }],
        },
        {
          title: 'Set down, anchor and reconnect',
          instruction: 'Lower the house evenly onto the new foundation, fasten it with the specified anchors or straps, then pull the beams and fill the beam holes. Have the trades reconnect utilities and raise the meters, furnace, water heater and outdoor units to the flood protection height. Build new steps or stairs to the raised doors, regrade, and get a post-lift elevation certificate before final.',
          tools: ['unified hydraulic jacking system', 'impact wrench', 'laser level'],
          materials: ['anchor bolts, straps and washers', 'mortar or concrete to fill beam holes', 'post-lift elevation certificate'],
          safety_ids: ['crush_under_load', 'fall_raised_floor', 'live_utilities'],
          qa_ids: ['anchored', 'equipment_raised', 'access_rebuilt'],
          gating_inspection_type: 'final',
          code_refs: [{ section: 'R403.1.6', code_type: 'IRC', note: 'Anchor the building to the foundation' }, { section: 'R322.1.6', code_type: 'IRC', note: 'Mechanical, plumbing and electrical kept above flood level' }, { section: 'R322.1.10', code_type: 'IRC', note: 'As-built elevation documentation submitted' }],
        },
      ],
    },
    {
      id: 'relocation',
      example_title: 'House moving to new lot',
      priority: 10,
      when: { title_re: '\\b(?:house mov\\w*|building mov\\w*|structure (?:mov\\w*|relocat\\w*)|relocat\\w* (?:the )?(?:house|home|building|structure)|mov(?:e|ing) (?:the )?(?:house|home|building|structure))\\b' },
      steps: [
        {
          title: 'Survey the route and get every move permit',
          instruction: 'Drive the route with the house’s loaded width, height and length in hand and list every low wire, traffic signal, sign, tree limb, tight turn, culvert and weight-limited bridge. Get the state oversize building permit (in Wisconsin the single trip building permit — one trip, route specified, 5 days), plus permits from every county, town and city crossed. Book the utility crews that will raise or drop lines, police or pilot escorts, and the date with the owner.',
          detail: 'Confirm with the code official that the house can be placed on the new lot and what it must be upgraded to there.',
          tools: ['measuring wheel', 'height pole', 'camera'],
          materials: ['route survey sheet', 'state and local move permits', 'utility line-lift work orders'],
          safety_ids: ['overhead_lines', 'traffic'],
          qa_ids: ['route_surveyed', 'move_permits', 'mover_insured'],
          code_refs: [{ section: 'R105.1', code_type: 'IRC', note: 'Permit needed to move a building' }, { section: '1402.1', code_type: 'IEBC', note: 'Relocated building placed to meet lot location rules' }],
        },
        {
          title: 'Prepare the new site and start the foundation',
          instruction: 'Clear and grade an access road the dollies can travel and turn on. Bring utilities to the new lot. Build the new footings and as much of the foundation as the set-down plan allows, leaving one side open (or the walls low) so the house can be rolled in. Get the footing inspection before concrete.',
          tools: ['excavator', 'skid steer', 'laser level'],
          materials: ['footing concrete and reinforcing', 'gravel for the access road'],
          safety_ids: ['cave_in', 'buried_utilities'],
          qa_ids: ['footing_inspected'],
          gating_inspection_type: 'footing',
          code_refs: [{ section: '1402.2', code_type: 'IEBC', note: 'Foundation of a relocated building meets current code' }],
        },
        {
          title: 'Disconnect, separate and load the house',
          instruction: 'Have the utilities shut off and capped outside the building line and confirmed dead. Open the old foundation, set the main and cross beams, crib every lift point and jack the house free of the foundation with unified jacks. Grade and compact the ground under the house, roll the dollies under the beams, and lower the load onto them.',
          tools: ['unified hydraulic jacking system', 'concrete saw', 'skid steer'],
          materials: ['steel beams', 'hardwood cribbing', 'dolly wheel sets'],
          safety_ids: ['live_utilities', 'silica', 'cribbing_failure', 'jack_overload', 'crush_under_load'],
          qa_ids: ['utilities_disconnected', 'cribbing_built', 'load_secured'],
        },
        {
          title: 'Move the house over the permitted route',
          instruction: 'Tow the house to the road with the wheels blocked at every stop, then hitch it to the truck. Travel only on the permitted route, date and hours, with escorts and flaggers controlling traffic and the utility crews lifting lines ahead. Spotters walk the corners at every turn, wire and limb. Stop and re-check the load and chains at set intervals.',
          tools: ['truck tractor', 'radios', 'wheel chocks'],
          materials: ['move permits in the cab', 'flags, signs and warning lights'],
          safety_ids: ['traffic', 'overhead_lines', 'runaway_load', 'crush_under_load'],
          qa_ids: ['load_secured', 'move_permits'],
        },
        {
          title: 'Set the house on its new foundation',
          instruction: 'Position the house over the new foundation, crib it, and pull the dollies. Jack it to the set height, finish the foundation under it as drawn, and get the foundation inspection. Lower it evenly onto the foundation, anchor it, and pull the beams and fill the beam holes.',
          tools: ['unified hydraulic jacking system', 'laser level', 'impact wrench'],
          materials: ['hardwood cribbing', 'anchor bolts and straps', 'foundation concrete or block'],
          safety_ids: ['cribbing_failure', 'crush_under_load', 'jack_overload'],
          qa_ids: ['anchored', 'lift_monitored'],
          gating_inspection_type: 'foundation',
          code_refs: [{ section: '1402.2.1', code_type: 'IEBC', note: 'Connect the relocated building to its foundation' }, { section: 'R403.1.6', code_type: 'IRC', note: 'Anchor the building to the foundation' }],
        },
        {
          title: 'Reconnect, inspect for damage and restore the old site',
          instruction: 'Have the trades reconnect all utilities and the inspector or engineer check the structure for damage from the move; repair anything they flag. Build steps, backfill and grade the new lot. At the old lot, remove or fill the old foundation, cap abandoned utilities, deal with any septic or fuel tank as required, and grade and seed.',
          tools: ['skid steer', 'excavator', 'camera'],
          materials: ['backfill', 'seed and mulch', 'utility caps'],
          safety_ids: ['live_utilities', 'fall_raised_floor', 'cave_in'],
          qa_ids: ['post_move_inspection', 'access_rebuilt'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '1402.7', code_type: 'IEBC', note: 'Relocated building inspected and repaired after the move' }],
        },
      ],
    },
  ],
  code_refs: {
    footing: [
      { section: 'R403.1', code_type: 'IRC', note: 'Footings sized and supported for the loads', prov: icc },
      { section: '1402.2', code_type: 'IEBC', note: 'Foundation of a relocated building meets current code', prov: icc },
    ],
    foundation: [
      { section: 'R404.1', code_type: 'IRC', note: 'Concrete and masonry foundation walls', prov: icc },
      { section: 'R322.2.2', code_type: 'IRC', note: 'Flood openings in enclosed areas below the design flood elevation', prov: icc },
      { section: '1402.2.1', code_type: 'IEBC', note: 'Relocated building connected to its foundation', prov: icc },
      { section: '1402.6', code_type: 'IEBC', note: 'Relocated building in a flood hazard area', prov: icc },
    ],
    final: [
      { section: 'R322.2.1', code_type: 'IRC', note: 'Lowest floor at or above the design flood elevation', prov: icc },
      { section: 'R322.1.10', code_type: 'IRC', note: 'As-built elevation documentation', prov: icc },
      { section: 'R403.1.6', code_type: 'IRC', note: 'Building anchored to the foundation', prov: icc },
      { section: '1402.7', code_type: 'IEBC', note: 'Post-move inspection and repair of structural damage', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: 'rais|lift|elevat|mov|relocat' }, type: 'skid_steer', reason: 'Carrying cribbing and beams, grading under the house and the dolly access road' },
    { when: { title_re: 'rais|lift|elevat|mov|relocat' }, type: 'excavator', reason: 'Beam trenches and jack pits on low crawlspaces, then excavation for the new footings', optional: true },
    { when: { title_re: 'rais|lift|elevat|mov|relocat' }, type: 'telehandler', reason: 'Placing long steel beams through the foundation openings', optional: true },
    { when: { title_re: 'rais|lift|elevat|mov|relocat' }, type: 'generator', reason: 'Power for the jacking power unit and saws where house power is disconnected', optional: true },
    { when: { title_re: 'mov|relocat' }, type: 'dump_truck', reason: 'Hauling gravel for the access road and old-foundation debris', optional: true },
  ],
  hazards: [
    { id: 'structure_collapse', hazard: 'Unplanned collapse or racking of a weak or damaged structure while it is lifted or moved', hazard_es: PENDING_ES, controls: ['Competent person surveys framing, floors and walls before work and records it', 'Brace weak walls, chimneys and porches or remove them before the lift', 'Follow the engineer’s lift plan; stop at any new cracking or racking'], controls_es: PENDING_ES, osha_ref: '1926.850(a)', severity: 4, prov: osha('t') },
    { id: 'crush_under_load', hazard: 'Being crushed by the house or a beam while working under a structure held on jacks', hazard_es: PENDING_ES, controls: ['Never go under the house unless it rests on blocked or cribbed supports', 'Keep a clear exit path when working under the beams', 'One person signals all jacking moves; everyone else clear'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(3)(i)', severity: 4, ppe: ['hard hat', 'safety-toe boots'], prov: osha('o') },
    { id: 'cribbing_failure', hazard: 'Crib tower shifting, crushing or tipping and dropping the load', hazard_es: PENDING_ES, controls: ['Crib the load at once after every jack stroke', 'Build towers on firm, level, compacted bases with sound hardwood stacked crosswise', 'Keep towers no taller than their base allows; widen or re-base before going higher'], controls_es: PENDING_ES, osha_ref: '1926.305(d)(1)(i)', severity: 4, prov: osha('i') },
    { id: 'jack_overload', hazard: 'Jack overload, slip or kick-out under an uneven load', hazard_es: PENDING_ES, controls: ['Never exceed the jack’s marked rated capacity', 'Block or crib the jack base and put a wood block under the cap', 'Use unified controls so no jack takes more than its share'], controls_es: PENDING_ES, osha_ref: '1926.305(a)(1)', severity: 4, prov: osha('i') },
    { id: 'live_utilities', hazard: 'Fire, explosion or shock from gas, electric or other service lines still live when the house is separated', hazard_es: PENDING_ES, controls: ['Have every service shut off, capped or controlled outside the building line', 'Notify each utility in advance and get confirmation', 'Test wiring dead before cutting'], controls_es: PENDING_ES, osha_ref: '1926.850(c)', severity: 4, prov: osha('t') },
    { id: 'overhead_lines', hazard: 'House roof, beams or crew contacting overhead power lines on the route or site', hazard_es: PENDING_ES, controls: ['Find every overhead line on the route survey', 'Have the utility raise, de-energize or move lines before the house passes', 'Spotters watch roof clearance at every line'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(3)', severity: 4, prov: osha('k') },
    { id: 'buried_utilities', hazard: 'Striking buried gas, electric or water lines digging beam trenches or new footings', hazard_es: PENDING_ES, controls: ['Get utility locates before any digging', 'Hand dig near marked lines'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'cave_in', hazard: 'Cave-in of a beam trench, jack pit or footing excavation next to the old foundation', hazard_es: PENDING_ES, controls: ['Slope, shore or box any excavation 5 ft or deeper', 'Competent person checks excavations daily and after rain', 'Keep spoil and cribbing at least 2 ft back from the edge'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, prov: osha('p') },
    { id: 'traffic', hazard: 'Being struck by traffic while moving or escorting the house on public roads', hazard_es: PENDING_ES, controls: ['Use trained flaggers and signs set up per the MUTCD', 'Move only on the permitted route, date and hours with escorts', 'High-visibility garments for everyone on the road'], controls_es: PENDING_ES, osha_ref: '1926.201(a)', severity: 4, ppe: ['high-visibility vest'], prov: osha('g') },
    { id: 'runaway_load', hazard: 'House on dollies rolling or sliding on a grade', hazard_es: PENDING_ES, controls: ['Chock or block the wheels at every stop', 'Grade the access road; avoid side slopes', 'Set brakes on towing equipment before anyone works near the load'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(3)(ii)', severity: 3, prov: osha('o') },
    { id: 'fall_raised_floor', hazard: 'Falling from doorways and edges of a raised house before stairs are rebuilt', hazard_es: PENDING_ES, controls: ['Barricade or lock exterior doors of a raised house', 'Provide guardrails or temporary stairs where crews work at a raised floor edge 6 ft or higher'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 3, prov: osha('m') },
    { id: 'silica', hazard: 'Respirable silica dust from cutting beam openings in the concrete or block foundation', hazard_es: PENDING_ES, controls: ['Wet-cut or use shrouded tools with a HEPA vacuum', 'Follow the Table 1 controls for the task'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator as required', 'safety glasses'], prov: osha('z') },
  ],
  qa_checklist: [
    { id: 'plan_on_site', item: 'Engineer’s or mover’s lift plan (beam layout, lift points, target height) and the new foundation drawings are on site', item_es: PENDING_ES, safety: true, prov: femaD('Slab-on-grade and complex homes need an engineer per FEMA P-312 §5.2.1; plan-on-site is general practice.') },
    { id: 'mover_insured', item: 'Mover’s certificate of insurance (liability, workers comp, cargo), any required mover license and a written contract with schedule are on file', item_es: tr('El certificado de seguro del mover (responsabilidad, compensación laboral, carga), la licencia de mover requerida y un contrato escrito con calendario están archivados'), prov: iasm },
    { id: 'target_elevation', item: 'Target finished-floor height written down: flood raises at or above BFE plus the required freeboard (at least 1 ft recommended)', item_es: tr('Altura meta del piso terminado anotada: elevaciones contra inundación en o sobre la BFE más el bordo libre requerido (se recomienda al menos 1 pie)'), prov: fema },
    { id: 'utilities_disconnected', item: 'Every utility (gas, electric, water, sewer, fuel, telecom) shut off and capped outside the building line, with written confirmation, before the foundation is opened', item_es: PENDING_ES, safety: true, prov: osha('t') },
    { id: 'cribbing_built', item: 'Crib towers on firm, level bases at every lift point, hardwood stacked crosswise, jacks on blocked bases; load cribbed tight after every stroke', item_es: PENDING_ES, safety: true, prov: osha('i') },
    { id: 'lift_monitored', item: 'Lift done in small even increments on unified controls with a laser level watched; heights logged', item_es: tr('Levante hecho en incrementos pequeños y parejos con control sincronizado vigilando un nivel láser; alturas registradas'), prov: femaD('Unified/synchronized jacking and incremental lifting on cribbing per FEMA P-312 §5.2.1; logging is general practice.') },
    { id: 'footing_inspected', phase: 'foundation', item: 'Footing inspection passed before concrete; foundation inspection passed before set-down', item_es: tr('Inspección de zapatas aprobada antes del concreto; inspección de cimentación aprobada antes de asentar la casa'), prov: icc },
    { id: 'flood_openings', phase: 'foundation', item: 'Flood openings in the new walls match the permit in size and count, bottoms no more than 1 ft above grade', item_es: tr('Las aberturas de inundación en los muros nuevos coinciden con el permiso en tamaño y cantidad, con la base a no más de 1 pie sobre el terreno'), prov: fema },
    { id: 'anchored', item: 'House anchored to the new foundation with the specified bolts or straps; beam holes filled', item_es: tr('Casa anclada a la cimentación nueva con los pernos o flejes especificados; huecos de las vigas rellenados'), prov: icc },
    { id: 'equipment_raised', item: 'Meters, furnace, water heater and outdoor units set at or above the flood protection height (as the utility allows for meters)', item_es: tr('Medidores, calefactor, calentador de agua y unidades exteriores colocados a la altura de protección contra inundación o más arriba (según lo permita la empresa para los medidores)'), prov: fema },
    { id: 'access_rebuilt', item: 'Stairs, landings and railings to every raised door built before occupancy; doors locked or barricaded until then', item_es: PENDING_ES, safety: true, prov: osha('m') },
    { id: 'route_surveyed', item: 'Route survey lists every low wire, signal, sign, turn and weight-limited bridge, with the fix for each', item_es: tr('El estudio de ruta enumera cada cable bajo, semáforo, letrero, vuelta y puente con límite de peso, con la solución para cada uno'), prov: fema },
    { id: 'move_permits', item: 'State oversize building permit and every local road permit for the route are in the truck, with escorts and utility crews booked', item_es: tr('El permiso estatal de edificio sobredimensionado y cada permiso local de la ruta están en el camión, con escoltas y cuadrillas de servicios programadas'), prov: wisdot },
    { id: 'load_secured', item: 'House chained to beams and dollies; wheels chocked at every stop', item_es: PENDING_ES, safety: true, prov: osha('o') },
    { id: 'post_move_inspection', item: 'Structure checked for move damage by the inspector or engineer and repairs made before final', item_es: tr('Estructura revisada por el inspector o ingeniero por daños del traslado y reparaciones hechas antes de la final'), prov: icc },
  ],
  inspection_checklists: {
    move_permit: [
      { item: 'State single trip building permit (or equivalent) issued for the route and dates', item_es: tr('Permiso estatal de viaje único para edificio (o equivalente) emitido para la ruta y fechas'), ref: 'WisDOT SB permit' },
      { item: 'County, town and city road permits for every jurisdiction crossed', item_es: tr('Permisos de caminos del condado, municipio y ciudad para cada jurisdicción cruzada') },
      { item: 'Utility line-lift and signal work scheduled; escorts and flaggers booked', item_es: tr('Elevación de cables y trabajos de semáforos programados; escoltas y abanderados reservados') },
    ],
    footing: [
      { item: 'Footings at the drawn size and depth on undisturbed soil, reinforcing in place', item_es: tr('Zapatas del tamaño y profundidad dibujados sobre suelo no alterado, refuerzo colocado'), ref: 'IRC R403.1' },
    ],
    foundation: [
      { item: 'Walls or piers built to the set height and reinforced as drawn', item_es: tr('Muros o pilares construidos a la altura de asiento y reforzados según los planos'), ref: 'IRC R404.1' },
      { item: 'Flood openings placed per the permit', item_es: tr('Aberturas de inundación colocadas según el permiso'), ref: 'IRC R322.2.2' },
      { item: 'Anchor bolts or straps placed for the house connection', item_es: tr('Pernos de anclaje o flejes colocados para la conexión de la casa'), ref: 'IEBC 1402.2.1' },
    ],
    elevation_certificate: [
      { item: 'Post-construction elevation certificate shows the lowest floor at or above the required height', item_es: tr('El certificado de elevación posterior a la obra muestra el piso más bajo en o sobre la altura requerida'), ref: 'IRC R322.1.10' },
    ],
    final: [
      { item: 'House anchored, beam holes closed, utilities reconnected and tested', item_es: tr('Casa anclada, huecos de vigas cerrados, servicios reconectados y probados') },
      { item: 'Service equipment at or above the flood protection height', item_es: tr('Equipos de servicio a la altura de protección contra inundación o más arriba'), ref: 'IRC R322.1.6' },
      { item: 'Stairs and guards to every exterior door', item_es: tr('Escaleras y barandales en cada puerta exterior') },
      { item: 'Relocated house checked for move damage and repaired', item_es: tr('Casa trasladada revisada por daños del traslado y reparada'), ref: 'IEBC 1402.7' },
    ],
  },
  assemblies: [
    { code: 'B-HMV-RAISE-SF', name: 'Raise house in place on steel and unified jacks, per SF footprint (lift only — new foundation priced separately)', name_es: 'Elevar casa en su lugar con vigas y gatos sincronizados, por pie² de huella (solo levante; cimentación aparte)', unit: 'SF', csi: '02 41 16',
      material_cost_cents: { v: 250, prov: est('Cribbing wear, shims, beam-hole fill and fasteners per SF footprint, national baseline 2026') }, labor_hours_per_unit: { v: 0.1, prov: est('3–4 person moving crew: open foundation, set steel, lift, crib, set down ≈ 150 crew-hr per 1,500 SF') },
      equipment_cost_cents: { v: 500, prov: est('Steel beam set + unified jacking system + skid steer share per SF') }, waste_pct: { v: 0, prov: est('Steel and cribbing are reused') } },
    { code: 'B-HMV-CRIB-EA', name: 'Hardwood crib tower at a lift point (set, raise and strip)', name_es: 'Torre de encamado de madera dura en un punto de levante (colocar, subir y retirar)', unit: 'EA', csi: '02 41 16',
      material_cost_cents: { v: 15000, prov: est('Hardwood cribbing timbers amortized over reuse, national baseline 2026') }, labor_hours_per_unit: { v: 2, prov: est('Base prep, build up through the lift, strip') },
      equipment_cost_cents: { v: 0, prov: est('Hand-built') }, waste_pct: { v: 5, prov: est('Crushed or split timbers replaced') } },
    { code: 'B-HMV-RELOC-MOB-EA', name: 'House relocation — separate, load on dollies, haul (≤5 mi) and set over new foundation', name_es: 'Traslado de casa — separar, cargar en carros, transportar (≤5 mi) y colocar sobre la cimentación nueva', unit: 'EA', csi: '02 41 16',
      material_cost_cents: { v: 60000, prov: est('Chains, blocking, consumables, national baseline 2026') }, labor_hours_per_unit: { v: 90, prov: est('3–4 person crew over ~3 days incl. lift, load, move day and set') },
      equipment_cost_cents: { v: 650000, prov: est('Beams, unified jacks, dolly wheel sets, truck tractor and support equipment per move') }, waste_pct: { v: 0, prov: est('Per move') } },
    { code: 'B-HMV-ROUTE-EA', name: 'Move route allowance — route survey, oversize permits, escorts and utility line lifts', name_es: 'Partida de ruta de traslado — estudio de ruta, permisos de sobredimensión, escoltas y elevación de cables', description: 'Permit fees, escort and utility-company line-lift charges carried in material cost.', unit: 'EA', csi: '01 55 26',
      material_cost_cents: { v: 500000, prov: est('Allowance: state/local permit fees + police/pilot escorts + utility line-lift charges; varies widely by route') }, labor_hours_per_unit: { v: 16, prov: est('Route survey and permit coordination') },
      equipment_cost_cents: { v: 60000, prov: est('Pilot vehicles and signs') }, waste_pct: { v: 0, prov: est('Allowance') } },
    { code: 'B-HMV-UTIL-EA', name: 'Utility disconnect, cap and reconnect coordination for a lifted or moved house', name_es: 'Coordinación de desconexión, taponado y reconexión de servicios para una casa levantada o trasladada', description: 'Utility-company fees and caps carried in material; licensed-trade reconnection labor is priced in the trade lines.', unit: 'EA', csi: '02 41 16',
      material_cost_cents: { v: 120000, prov: est('Utility disconnect/reconnect fees, caps and fittings, national baseline 2026') }, labor_hours_per_unit: { v: 10, prov: est('Scheduling utilities, verifying dead, capping and reopening') },
      equipment_cost_cents: { v: 0, prov: est('None') }, waste_pct: { v: 0, prov: est('Fee') } },
  ],
  quantity_rules: [
    { code: 'B-HMV-RAISE-SF', assumption: 'House raise ≈ room area from the plans (≈ footprint on a one-story house — use the footprint only on two-story plans)', when: { building_types: ['residential_sf'] }, qty: { basis: 'area_sf_sum', mul: 1, round: 'ceil' } },
    { code: 'B-HMV-CRIB-EA', assumption: '≈1 crib tower per 150 SF of room area — the lift plan sets the real lift-point count', when: { building_types: ['residential_sf'] }, qty: { basis: 'area_sf_sum', mul: 1 / 150, round: 'ceil' } },
    { code: 'B-HMV-UTIL-EA', assumption: 'One utility disconnect/reconnect package per single-family house lifted or moved', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 1 } },
  ],
  dependency_hints: [
    { before_phase: 'finishes_exterior', note: 'Finish the lift or move and set-down before exterior stairs, decks, siding repair and final grading.' },
  ],
});
