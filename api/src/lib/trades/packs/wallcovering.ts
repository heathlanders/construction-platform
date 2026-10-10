// Trade Knowledge Pack — wallcovering (Wallcovering). Wave 15 — NEW-TRADE pattern (no hand recipe).
// permit_trade null → NO gating inspections, NO code_refs; owner/GC hold points live in
// inspection_checklists. Interior-finish flame class (IBC 803) appears only as a QA/checklist ref.
// Scope: commercial vinyl (Type II), residential paper / non-woven, wall liner, murals / digital prints,
// removal. FRP panels and wall protection (corner guards, crash rails) belong to `specialties`.
// Dossier: docs/trade-packs/dossiers/wallcovering.md. Sources: UFGS 09 72 00, GA-214 (reference),
// 29 CFR 1926 Subparts C, D, E, K, L, X.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['wallcovering-ufgs-09-72-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'wallcovering',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Hangs wallcoverings — commercial Type II vinyl, residential wallpaper and non-woven papers, wall liners and printed murals — and strips old wallcovering: substrate acceptance, priming, layout to a plumb line, pattern-matched hanging with double-cut seams, adhesive cleanup and attic stock.',
    summary_es: 'Instala recubrimientos de pared — vinil comercial Tipo II, papel tapiz residencial y papeles no tejidos, forros de pared y murales impresos — y retira recubrimientos viejos: aceptación del sustrato, imprimación, trazo a plomo, colocación con casado del patrón y uniones de doble corte, limpieza de adhesivo y material de reserva.',
    glossary: [
      { term: 'Type II vinyl', term_es: 'Vinil Tipo II', def: 'Medium-duty commercial vinyl wallcovering (about 13 oz per square yard or more) used in corridors, offices and hotel rooms.', def_es: 'Recubrimiento de vinil comercial de uso medio (unas 13 onzas por yarda cuadrada o más) usado en pasillos, oficinas y cuartos de hotel.' },
      { term: 'Double-cut seam', term_es: 'Unión de doble corte', def: 'Overlap two strips, cut through both with a straightedge and sharp blade, then peel out the scraps so the edges butt exactly.', def_es: 'Traslapar dos tiras, cortar ambas con regla y navaja afilada y retirar los sobrantes para que las orillas queden a tope exacto.' },
      { term: 'Booking', term_es: 'Reposo (doblado)', def: 'Folding a pasted strip paste-to-paste and letting it rest the time the maker lists so the paper relaxes before hanging.', def_es: 'Doblar una tira engomada, cara engomada contra cara engomada, y dejarla reposar el tiempo que indica el fabricante para que se relaje antes de colocarla.' },
      { term: 'Pattern repeat / drop match', term_es: 'Repetición del patrón / casado desfasado', def: 'The distance before the design repeats; a drop match lines up half a repeat lower on the next strip.', def_es: 'La distancia antes de que el diseño se repita; en el casado desfasado la siguiente tira se alinea media repetición más abajo.' },
      { term: 'Run (dye lot) number', term_es: 'Número de lote (tinte)', def: 'Printing batch code on each roll; strips from different runs can differ in shade and must not share a wall.', def_es: 'Código del lote de impresión en cada rollo; tiras de lotes distintos pueden variar de tono y no deben ir en la misma pared.' },
      { term: 'Wall liner', term_es: 'Forro de pared', def: 'A plain underlay hung first to bridge minor cracks or block joints before the finish wallcovering.', def_es: 'Una capa lisa que se coloca primero para cubrir grietas menores o juntas de block antes del recubrimiento final.' },
      { term: 'Wallcovering primer (sizing)', term_es: 'Imprimador para tapiz (sellador)', def: 'Coat applied before paste so the covering grips, slides into place and can later be stripped without tearing the drywall paper.', def_es: 'Capa que se aplica antes del pegamento para que el recubrimiento agarre, se deslice a su lugar y luego pueda retirarse sin romper el papel de la tablaroca.' },
      { term: 'Level 5 finish', term_es: 'Acabado nivel 5', def: 'Drywall finish with a skim coat over the whole surface; some wallcovering makers require it, others accept Level 4.', def_es: 'Acabado de tablaroca con una capa delgada de compuesto en toda la superficie; algunos fabricantes de tapiz lo exigen, otros aceptan el nivel 4.' },
      { term: 'Reverse hanging', term_es: 'Colocación invertida', def: 'Turning every other strip upside down, required by some solid vinyls to hide shade differences at the seams.', def_es: 'Voltear cada segunda tira de cabeza; algunos viniles lisos lo exigen para ocultar diferencias de tono en las uniones.' },
      { term: 'Attic stock', term_es: 'Material de reserva', def: 'Full rolls of the same pattern and run left with the owner for future repairs.', def_es: 'Rollos completos del mismo patrón y lote que se dejan al dueño para reparaciones futuras.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'hang_wallcovering',
      example_title: 'Install vinyl wallcovering — corridors',
      when: { title_re: 'wall\\s?cover|wall\\s+covering|wallpaper|vinyl\\s+wall|wall\\s+liner|\\bmural' },
      steps: [
        {
          title: 'Accept the substrate',
          instruction: 'Walk every wall with a light raking across it. Drywall must be finished to Level 4 or the Level 5 the wallcovering maker calls for: flat joints, no ridges, no stains that will bleed. Meter plaster, concrete and masonry — do not hang above the moisture limit in the spec. Any wet spot or mold: stop, find the water, and get it fixed before covering it. On the inside face of exterior walls in humid climates, confirm with the GC that a vinyl (vapor-tight) covering is really specified there.',
          tools: ['work light', 'moisture meter', '6 in. knife', 'sanding sponge'],
          materials: ['joint compound for spot fills'],
          safety_ids: ['stepladder', 'mold_dust'],
          qa_ids: ['substrate_finish', 'substrate_moisture', 'exterior_wall_vapor'],
        },
        {
          title: 'Condition the room and prime',
          instruction: 'Keep the room heated (spec minimum, often 60 °F) for 3 days before, during and until the paste dries; store the rolls flat in the same space. Pull cover plates with the circuit off. Roll on the wallcovering primer the maker lists — white pigmented where the wall color varies and the covering is thin or light — and let it dry completely before any paste goes on.',
          tools: ['roller and frame', 'brush', 'screwdriver', 'non-contact voltage tester'],
          materials: ['wallcovering primer / sizing', 'drop cloths'],
          safety_ids: ['live_devices', 'primer_vapor', 'stepladder', 'wet_floor'],
          qa_ids: ['room_conditioned', 'devices_off', 'primer_dry'],
        },
        {
          title: 'Check the rolls and lay out to a plumb line',
          instruction: 'Open the cartons and confirm pattern, color and run number match the schedule — keep one run per wall. Plan seams so none land within a few inches of an inside or outside corner, and start in the least visible corner. Snap or laser a plumb line for the first strip on every wall; never trust the corner. Note the repeat and match type, and whether the maker wants strips reverse-hung.',
          tools: ['laser level or plumb bob', 'tape measure', 'pencil'],
          materials: ['wallcovering per finish schedule'],
          safety_ids: ['stepladder'],
          qa_ids: ['single_run', 'plumb_start'],
        },
        {
          title: 'Paste, hang and double-cut the seams',
          instruction: 'Paste with the adhesive the maker lists (or activate prepasted paper), book for the listed time, then hang to the plumb line with a few inches extra top and bottom. Match the pattern, smooth from the center out, and never stretch the strip. Where the maker calls for it, overlap and double-cut the seams with a fresh blade against a straightedge, pressing lightly so you do not score the drywall face. Roll seams, trim at ceiling and base with a broad knife, and trim around boxes with the power off.',
          detail: 'Change blades often — a dull blade tears wet vinyl. Upper stairwell and atrium walls: scaffold with guardrails or a lift, not a ladder on stair treads.',
          tools: ['paste table', 'pasting machine or roller', 'smoother', 'seam roller', 'straightedge', 'snap-blade knife', 'broad knife', 'sponge and bucket'],
          materials: ['wallcovering adhesive (strippable, per manufacturer)', 'clean water'],
          safety_ids: ['blade_cut', 'adhesive_contact', 'stepladder', 'scaffold_fall', 'aerial_lift', 'live_devices', 'wet_floor'],
          qa_ids: ['pattern_match', 'seams_tight'],
        },
        {
          title: 'Clean, inspect and hand over attic stock',
          instruction: 'Wipe paste off the face and seams right away with clean water or the remover the maker lists, changing the water often. When dry, look down each wall under raking light for open seams, bubbles, lifted edges and shade jumps; fix them before the walkthrough. Reinstall cover plates, bag the scraps, and leave labeled full rolls of each pattern and run for the owner.',
          tools: ['sponge', 'bucket', 'seam roller', 'syringe for adhesive', 'work light'],
          materials: ['seam adhesive', 'cleaner per manufacturer'],
          safety_ids: ['wet_floor', 'adhesive_contact'],
          qa_ids: ['adhesive_clean', 'flat_tight', 'flame_class', 'attic_stock'],
        },
      ],
    },
    {
      id: 'remove_wallcovering',
      example_title: 'Remove existing wallpaper and prep walls',
      when: { title_re: '(?:remov|strip)[^.]*(?:wall\\s?cover|wall\\s+covering|wallpaper)|(?:wall\\s?cover|wall\\s+covering|wallpaper)[^.]*(?:remov|strip)' },
      priority: 10,
      steps: [
        {
          title: 'Test the old covering and protect the room',
          instruction: 'Peel a corner to see whether it is strippable vinyl, peelable or plain paper. If the house was built before 1978 and the wall under it is painted, treat that paint as lead until tested — no dry sanding. Turn off the circuits and pull the cover plates, mask the boxes, and lay absorbent drop cloths and floor protection.',
          tools: ['putty knife', 'screwdriver', 'non-contact voltage tester'],
          materials: ['drop cloths', 'masking tape and plastic'],
          safety_ids: ['live_devices', 'lead_paint', 'wet_floor'],
          qa_ids: ['devices_off'],
        },
        {
          title: 'Strip, wash and repair the wall',
          instruction: 'Dry-strip the face layer where it peels; score paper-faced coverings lightly and soak or steam the backing until it lets go — do not gouge the drywall paper. Wash off every trace of old paste and let the wall dry. Seal any torn drywall face paper with a sealer made for it, skim to the finish level the new covering needs, and prime before rehanging.',
          tools: ['scoring tool', 'wallpaper steamer', 'pump sprayer', 'broad knife', 'sponge and bucket'],
          materials: ['wallpaper remover solution', 'drywall face-paper sealer', 'joint compound', 'wallcovering primer'],
          safety_ids: ['steam_burn', 'blade_cut', 'mold_dust', 'stepladder', 'wet_floor'],
          qa_ids: ['substrate_finish', 'primer_dry'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'wall\\s?cover|wallpaper|vinyl\\s+wall|mural', building_types: ['commercial', 'industrial'] }, type: 'scissor_lift', reason: 'High lobby, atrium and corridor walls above ladder reach', optional: true },
  ],
  hazards: [
    { id: 'stepladder', hazard: 'Falls from stepladders while hanging, trimming at the ceiling or smoothing the top of a strip', hazard_es: PENDING_ES, controls: ['Never stand on the top step or top cap of a stepladder; use a taller ladder or a platform', 'Open the spreaders fully and set the ladder on drop cloths that cannot slide', 'Move the ladder instead of reaching past its rails'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'scaffold_fall', hazard: 'Falls from planks or rolling scaffolds in stairwells, atriums and high walls', hazard_es: PENDING_ES, controls: ['Guardrails or personal fall arrest on any scaffold more than 10 ft up', 'Lock casters and have a competent person check the scaffold before each shift', 'Never set a ladder or plank on stair treads without a level base built for it'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from a boom lift basket while hanging high walls', hazard_es: PENDING_ES, controls: ['Wear a harness with the lanyard tied to the basket anchor', 'Only trained operators run the lift; keep the platform within its load and reach'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['full-body harness', 'lanyard'], prov: osha('l') },
    { id: 'blade_cut', hazard: 'Deep cuts from snap-blade knives and razor blades when trimming and double-cutting', hazard_es: PENDING_ES, controls: ['Cut against a straightedge and keep the free hand behind the blade', 'Snap off dull segments into a closed blade container — never loose on the floor or in the paste bucket', 'Wear cut-resistant gloves on the guide hand'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('e') },
    { id: 'live_devices', hazard: 'Shock from trimming wet wallcovering and metal tools around energized outlets and switches', hazard_es: PENDING_ES, controls: ['Turn off the circuit before removing cover plates or trimming around boxes; test with a voltage tester', 'Keep paste water and wet sponges out of open boxes'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 3, prov: osha('k') },
    { id: 'adhesive_contact', hazard: 'Skin and eye irritation from wallcovering adhesives, primers and mildewcides', hazard_es: PENDING_ES, controls: ['Read the SDS for each paste, primer and remover; keep the SDS on site', 'Wear gloves when mixing and pasting; safety glasses when rolling primer overhead'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d', '1926.59 adopts 29 CFR 1910.1200 Hazard Communication.') },
    { id: 'primer_vapor', hazard: 'Breathing vapors from solvent-based primers, sealers and adhesive removers in closed rooms', hazard_es: PENDING_ES, controls: ['Prefer water-based, low-VOC products where the spec allows', 'Ventilate with fans moving air out of the room; keep lids on', 'Use a respirator per the SDS if ventilation is not enough'], controls_es: PENDING_ES, osha_ref: '1926.57(a)', severity: 2, prov: osha('d') },
    { id: 'steam_burn', hazard: 'Scalds from wallpaper steamer plates, hot water and hoses during removal', hazard_es: PENDING_ES, controls: ['Work the steamer plate at chest height or below; never steam over your head', 'Wear gloves and long sleeves; set the steamer where the hose cannot be tripped over'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['heat-resistant gloves', 'safety glasses'], prov: osha('e') },
    { id: 'mold_dust', hazard: 'Mold spores and dust released when opening damp walls or stripping covering from exterior walls', hazard_es: PENDING_ES, controls: ['Stop and report visible mold; the moisture source must be fixed before new covering goes on', 'Mist before scraping, bag debris, and wear a respirator suited to the exposure'], controls_es: PENDING_ES, osha_ref: '1926.103', severity: 2, ppe: ['respirator (as assessed)', 'gloves'], prov: osha('e', '1926.103 adopts 29 CFR 1910.134 respiratory protection for construction.') },
    { id: 'lead_paint', hazard: 'Lead dust from sanding or scraping old paint under wallpaper in pre-1978 buildings', hazard_es: PENDING_ES, controls: ['Test or presume lead before disturbing painted walls; use lead-safe certified work practices on pre-1978 homes', 'No dry sanding or power sanding without HEPA exhaust; clean with HEPA vacuum and wet wipes'], controls_es: PENDING_ES, osha_ref: '1926.62(d)(1)(i)', severity: 3, prov: osha('d') },
    { id: 'wet_floor', hazard: 'Slips on wet paste, removal solution and loose scrap strips on the floor', hazard_es: PENDING_ES, controls: ['Pick up scrap strips as you go; keep walkways clear', 'Use absorbent drop cloths and wipe paste spills immediately'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'substrate_finish', phase: 'finishes_interior', item: 'Drywall finished to Level 4 per GA-214 (Level 5 where the wallcovering maker requires it); cracks and holes filled, rough spots sanded, no stains that bleed through.', item_es: tr('Tablaroca con acabado nivel 4 según GA-214 (nivel 5 si el fabricante del tapiz lo exige); grietas y agujeros rellenos, partes ásperas lijadas, sin manchas que traspasen.'), prov: { src: ['wallcovering-ufgs-09-72-00', 'ga-214'], confidence: 'verified', last_verified: D, note: 'UFGS 3.2 surface preparation; GA-214 levels of finish (reference only).' } },
    { id: 'substrate_moisture', phase: 'finishes_interior', item: 'New walls dry for 30 days before vinyl; plaster, concrete and masonry read at or below 5% on an electric moisture meter.', item_es: tr('Muros nuevos secos durante 30 días antes del vinil; yeso, concreto y mampostería leen 5% o menos en el medidor eléctrico de humedad.'), prov: ufgs('3.2 surfaces dry ≥30 days; meter ≤5%') },
    { id: 'exterior_wall_vapor', item: 'No vinyl (vapor-tight) wallcovering on the inside face of exterior walls unless the GC/designer confirms it; use a vapor-permeable finish there, especially in hot-humid climates.', item_es: tr('No colocar vinil (impermeable al vapor) en la cara interior de muros exteriores salvo confirmación del contratista o diseñador; usar ahí un acabado permeable al vapor, sobre todo en climas cálidos y húmedos.'), prov: ufgs('2.1 note: moisture accumulates behind wallcovering on exterior walls (mold) — UFC 3-101-01 guidance') },
    { id: 'room_conditioned', item: 'Room held at the spec minimum (often 60 °F) for 72 hours before, during and until the adhesive dries; rolls stored flat at 50 °F or more and 30–60% RH.', item_es: tr('El cuarto se mantiene al mínimo de la especificación (a menudo 60 °F) 72 horas antes, durante y hasta que seque el adhesivo; rollos guardados planos a 50 °F o más y 30–60% de humedad relativa.'), prov: ufgs('1.3 storage; 1.4 environmental requirements') },
    { id: 'devices_off', item: 'Circuits off and tested dead before cover plates come off or trimming around boxes; plates reinstalled at the end.', item_es: PENDING_ES, safety: true, prov: osha('k', '1926.416(a)(1) protection from energized circuits.') },
    { id: 'primer_dry', item: 'Wallcovering primer the maker lists applied to all surfaces (white pigmented where the wall color would show) and fully dry before paste.', item_es: tr('Imprimador para tapiz indicado por el fabricante aplicado en todas las superficies (blanco pigmentado donde se notaría el color del muro) y totalmente seco antes del pegamento.'), prov: ufgs('2.x primer; 3.2 primer fully dry before adhesive') },
    { id: 'single_run', item: 'Pattern, color and run (dye lot) number match the finish schedule; no mixed runs on one wall.', item_es: tr('Patrón, color y número de lote coinciden con el programa de acabados; no se mezclan lotes en una misma pared.'), prov: ufgs('1.3 delivery labeled with dye lot; same lot for extra stock') },
    { id: 'plumb_start', item: 'First strip on each wall hung to a plumb or laser line; strips stay plumb across the wall with no seam within a few inches of a corner.', item_es: tr('La primera tira de cada pared se coloca a una línea de plomo o láser; las tiras siguen a plomo y ninguna unión cae a pocas pulgadas de una esquina.'), prov: ufgs('3.3.1 install per manufacturer printed instructions — plumb start line is standard manufacturer practice') },
    { id: 'pattern_match', item: 'Pattern matches across every seam and around corners at eye level; reverse-hung where the maker requires it.', item_es: tr('El patrón casa en todas las uniones y en las esquinas a la altura de los ojos; colocación invertida donde el fabricante la exige.'), prov: ufgs('3.3.1 accurate pattern matching') },
    { id: 'seams_tight', item: 'Seams tight and flat — no gaps, overlaps, stretching or distortion; double-cut seams did not score the drywall face.', item_es: tr('Uniones cerradas y planas: sin huecos, traslapes, estiramientos ni deformaciones; el doble corte no rayó la cara de la tablaroca.'), prov: ufgs('3.3.1 seam integrity; do not stretch, gap, overlap or distort') },
    { id: 'adhesive_clean', item: 'No adhesive film on the face or seams (check with a raking light after drying); cleaned with water or the maker’s remover.', item_es: tr('Sin película de adhesivo en la cara ni en las uniones (revisar con luz rasante ya seco); limpiado con agua o el removedor del fabricante.'), prov: ufgs('3.3.1 remove glue spillage; 3.4 cleaning') },
    { id: 'flat_tight', item: 'Covering flat and fully bonded — no bubbles, blisters, lifted edges or corners; clean straight trims at ceiling, base, casings and boxes.', item_es: tr('Recubrimiento plano y bien pegado: sin burbujas, ampollas, orillas ni esquinas levantadas; cortes limpios y rectos en techo, zoclo, marcos y cajas.'), prov: ufgs('3.3 installation per manufacturer; 3.4 cleaning') },
    { id: 'flame_class', item: 'Product label or certificate shows the flame-spread class the spec requires (Class A per ASTM E84, or NFPA 265/286 for textile and expanded vinyl) and was installed with the tested adhesive — interior finish per IBC 803.', item_es: PENDING_ES, safety: true, prov: { src: ['wallcovering-ufgs-09-72-00', 'icc-pa'], confidence: 'verified', last_verified: D, note: 'UFGS 2.x Class A / NFPA 286; 3.3.1.1 tested mounting system; IBC 803 (reference only).' } },
    { id: 'mockup', item: 'Commercial work: a mock-up (about 4 × 4 ft with at least one seam) approved for seam quality and finish before full installation.', item_es: tr('Obra comercial: maqueta (unos 4 × 4 pies con al menos una unión) aprobada en calidad de uniones y acabado antes de instalar todo.'), prov: ufgs('mock-up 4 ft × 4 ft including at least one seam') },
    { id: 'attic_stock', phase: 'punch', item: 'Attic stock left on site: full rolls of each pattern and run, about 1 LF per 100 LF installed (or as the spec says), labeled.', item_es: tr('Material de reserva entregado en obra: rollos completos de cada patrón y lote, aproximadamente 1 pie lineal por cada 100 instalados (o lo que diga la especificación), etiquetados.'), prov: ufgs('1.6 extra materials') },
  ],
  inspection_checklists: {
    substrate_acceptance: [
      { item: 'Drywall finish level accepted (Level 4 minimum, Level 5 if the maker requires); patches flat under raking light', item_es: tr('Nivel de acabado de tablaroca aceptado (mínimo nivel 4, nivel 5 si el fabricante lo exige); resanes planos con luz rasante'), ref: 'GA-214; UFGS 09 72 00 3.2' },
      { item: 'Moisture readings recorded for plaster, concrete and masonry; no visible mold or active leaks', item_es: tr('Lecturas de humedad registradas en yeso, concreto y mampostería; sin moho visible ni fugas activas'), ref: 'UFGS 09 72 00 3.2' },
      { item: 'Interior faces of exterior walls checked against the finish schedule — vapor-tight vinyl there confirmed by the designer', item_es: tr('Caras interiores de muros exteriores revisadas contra el programa de acabados; vinil impermeable ahí confirmado por el diseñador'), ref: 'UFGS 09 72 00 2.1 note' },
      { item: 'HVAC running and room at the spec temperature; painting of ceilings and trim complete', item_es: tr('Climatización funcionando y cuarto a la temperatura de la especificación; pintura de techos y molduras terminada'), ref: 'UFGS 09 72 00 1.4' },
    ],
    mockup_approval: [
      { item: 'Mock-up hung with the specified covering, primer and adhesive, including a seam', item_es: tr('Maqueta colocada con el recubrimiento, imprimador y adhesivo especificados, incluyendo una unión'), ref: 'UFGS 09 72 00 mock-up' },
      { item: 'Flame-spread certificate and run numbers on file for each wallcovering type', item_es: PENDING_ES, ref: 'IBC 803; ASTM E84 / NFPA 286' },
    ],
    final_walkthrough: [
      { item: 'Every wall checked under raking light — seams closed, pattern matched, no bubbles, lifted edges or paste film', item_es: tr('Cada pared revisada con luz rasante: uniones cerradas, patrón casado, sin burbujas, orillas levantadas ni película de pegamento') },
      { item: 'Cover plates, hardware and trim reinstalled; no paste on casings, base or floors', item_es: tr('Tapas, herrajes y molduras reinstalados; sin pegamento en marcos, zoclo ni pisos') },
      { item: 'Attic stock and maintenance / cleaning instructions handed to the owner', item_es: tr('Material de reserva e instrucciones de mantenimiento y limpieza entregados al dueño'), ref: 'UFGS 09 72 00 1.6' },
    ],
  },
  assemblies: [
    { code: 'G-WCV-VINYL2-SY', name: 'Type II commercial vinyl wallcovering, 54 in. — paste, hang, double-cut seams, per SY', name_es: 'Vinil comercial Tipo II de 54 pulg. — engomar, colocar y doble corte de uniones, por yarda²', unit: 'SY', csi: '09 72 16',
      material_cost_cents: { v: 1600, prov: est('contract-grade Type II vinyl ~$12–20/SY + strippable clay/acrylic adhesive, 2026 national baseline') },
      labor_hours_per_unit: { v: 0.22, prov: est('two-person crew ≈ 70–75 SY per 8-hr day on open corridor walls incl. trimming and seams') },
      equipment_cost_cents: { v: 10, prov: est('pasting machine / table share') }, waste_pct: { v: 15, prov: est('pattern match, top/bottom trim and openings') } },
    { code: 'G-WCV-RES-SF', name: 'Residential wallpaper or non-woven paper — hang with pattern match, per SF of wall', name_es: 'Papel tapiz residencial o papel no tejido — colocación con casado de patrón, por pie² de muro', unit: 'SF', csi: '09 72 00',
      material_cost_cents: { v: 200, prov: est('mid-range residential paper ~$60–90 per double roll (~56 SF usable) + paste, 2026') },
      labor_hours_per_unit: { v: 0.03, prov: est('≈ one double roll per 1.5–2 hr including layout, trimming around openings and cleanup') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 15, prov: est('pattern repeat and trim loss') } },
    { code: 'G-WCV-PRIMER-SF', name: 'Wallcovering primer / sizing, one coat rolled, per SF', name_es: 'Imprimador para tapiz (sellador), una capa a rodillo, por pie²', unit: 'SF', csi: '09 72 00',
      material_cost_cents: { v: 9, prov: est('wallcovering primer ~$35/gal at ~400 SF/gal, 2026') },
      labor_hours_per_unit: { v: 0.005, prov: est('rolled ≈ 200 SF/hr including cut-in') },
      equipment_cost_cents: { v: 0, prov: est('roller and tray') }, waste_pct: { v: 5, prov: est('tray and roller loss') } },
    { code: 'G-WCV-REMOVE-SF', name: 'Remove existing wallcovering, wash off adhesive, per SF of wall', name_es: 'Retirar recubrimiento existente y lavar el adhesivo, por pie² de muro', unit: 'SF', csi: '09 72 00',
      material_cost_cents: { v: 4, prov: est('remover concentrate, drop cloths and bags, 2026') },
      labor_hours_per_unit: { v: 0.025, prov: est('score/soak or steam, strip and wash ≈ 40 SF/hr; strippable vinyl is faster, painted-over paper slower') },
      equipment_cost_cents: { v: 2, prov: est('steamer day-rate share') }, waste_pct: { v: 0, prov: est('no material installed') } },
  ],
  quantity_rules: [
    { code: 'G-WCV-VINYL2-SY', assumption: '≈10 SY of Type II vinyl per scheduled room (≈one feature wall or a quarter of the room — most rooms are painted) until the finish takeoff is done', when: { building_types: ['commercial'] }, qty: { basis: 'rooms', mul: 10, round: 'ceil' } },
    { code: 'G-WCV-PRIMER-SF', assumption: 'Primer under the vinyl: ≈90 SF per scheduled room (matches the 10 SY vinyl assumption)', when: { building_types: ['commercial'] }, qty: { basis: 'rooms', mul: 90, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['drywall', 'painting'], note: 'Hang after drywall finishing is accepted and ceilings/trim are painted; base and casing touch-up follow.' },
    { before_phase: 'punch', note: 'Seams, cleanup and attic stock done before the punch walkthrough and final clean.' },
  ],
});
