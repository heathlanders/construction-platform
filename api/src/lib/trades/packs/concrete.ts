// Trade Knowledge Pack — concrete (Footings / Foundations / Slabs). Wave 0b pilot: the COMPLEMENT
// pattern — the hand recipe in task-buildout/building.ts keeps producing the work steps (no recipes
// here, no supersedes_hand); the pack adds QA, hazards, inspection checklists and glossary.
// Dossier: docs/trade-packs/dossiers/concrete.md. Sources: NRMCA CIP series, UFGS 03 30 00,
// 29 CFR 1926 Subparts E, K, O, P, Q, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const cip = (note: string) => ({ src: ['nrmca-cip'], confidence: 'verified' as const, last_verified: D, note });
const ufgs = { src: ['ufgs-03-30-00'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });

export default definePack({
  key: 'concrete',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Cast-in-place concrete for footings, foundation walls and slabs: forms, reinforcement, placement, finishing, testing and curing.',
    summary_es: 'Concreto colado en sitio para zapatas, muros de cimentación y losas: cimbra, refuerzo, colado, acabado, pruebas y curado.',
    glossary: [
      { term: 'Slump', term_es: 'Revenimiento', def: 'Field test of how stiff or wet fresh concrete is.', def_es: 'Prueba en obra de qué tan firme o fluido está el concreto fresco.' },
      { term: 'Cylinder', term_es: 'Cilindro de prueba', def: 'Sample cast at the pour and broken at a lab to check strength.', def_es: 'Muestra colada durante el vaciado que se rompe en laboratorio para verificar resistencia.' },
      { term: 'Cover', term_es: 'Recubrimiento', def: 'Concrete thickness between the rebar and the outside surface.', def_es: 'Espesor de concreto entre la varilla y la superficie exterior.' },
      { term: 'Chair', term_es: 'Silleta', def: 'Support that holds rebar at the right height during the pour.', def_es: 'Soporte que mantiene la varilla a la altura correcta durante el colado.' },
      { term: 'Bleed water', term_es: 'Agua de sangrado', def: 'Water that rises to the surface after placing — wait for it before finishing.', def_es: 'Agua que sube a la superficie después del colado; esperar antes de dar acabado.' },
      { term: 'Cold joint', term_es: 'Junta fría', def: 'Seam where new concrete meets concrete that already set.', def_es: 'Unión donde concreto nuevo se encuentra con concreto ya fraguado.' },
      { term: 'Curing', term_es: 'Curado', def: 'Keeping new concrete moist and warm so it gains strength.', def_es: 'Mantener el concreto nuevo húmedo y templado para que gane resistencia.' },
      { term: 'Delivery ticket', term_es: 'Remisión de entrega', def: 'Ready-mix slip showing the mix, batch time and any water added.', def_es: 'Nota del concreto premezclado con la mezcla, hora de dosificación y agua agregada.' },
    ],
  },
  recipes: [],
  hazards: [
    { id: 'form_collapse', hazard: 'Formwork or shoring collapse during the pour', hazard_es: PENDING_ES, controls: ['Build and brace forms to carry the full concrete load and placement forces', 'Inspect forms and bracing before and during the pour; stop if anything moves'], controls_es: PENDING_ES, osha_ref: '1926.703(a)(1)', severity: 4, prov: osha('q') },
    { id: 'rebar_impalement', hazard: 'Impalement on exposed rebar ends', hazard_es: PENDING_ES, controls: ['Cap or guard all protruding rebar', 'Keep walkways clear of vertical bars'], controls_es: PENDING_ES, osha_ref: '1926.701(b)', severity: 4, prov: osha('q') },
    { id: 'cave_in', hazard: 'Cave-in in footing or foundation excavations', hazard_es: PENDING_ES, controls: ['Slope, bench, shore or shield excavations 5 ft or deeper', 'Keep spoil and the truck back from the edge'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, prov: osha('p') },
    { id: 'truck_backing', hazard: 'Struck by a backing ready-mix truck or pump', hazard_es: PENDING_ES, controls: ['Use a spotter and working backup alarm', 'Stay out of the blind zone behind the truck'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(4)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'pump_line', hazard: 'Pump line whip or blockage blowout', hazard_es: PENDING_ES, controls: ['Support and secure pump discharge lines', 'Never open a pressurized line; follow the pump operator'], controls_es: PENDING_ES, osha_ref: '1926.702(e)', severity: 3, prov: osha('q') },
    { id: 'cement_burns', hazard: 'Chemical burns from wet concrete on skin or eyes', hazard_es: PENDING_ES, controls: ['Wear waterproof gloves, boots and eye protection', 'Wash skin contact right away with clean water'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['waterproof gloves', 'rubber boots', 'safety glasses'], prov: osha('e') },
    { id: 'silica', hazard: 'Silica dust from cutting, grinding or drilling cured concrete', hazard_es: PENDING_ES, controls: ['Use water or vacuum dust control on the tool', 'Follow the Table 1 controls for the task'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 3, ppe: ['respirator when Table 1 requires'], prov: osha('z') },
    { id: 'tool_shock', hazard: 'Shock from vibrators, trowels and cords in wet conditions', hazard_es: PENDING_ES, controls: ['GFCI on every temporary receptacle', 'Keep cord connections out of water'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
  ],
  qa_checklist: [
    { id: 'subgrade_ready', phase: 'foundation', item: 'Subgrade compacted, free of frost, mud and standing water; dry subgrade dampened before placement.', item_es: { status: 'translated', text: 'Subrasante compactada, sin escarcha, lodo ni agua estancada; humedecer la subrasante seca antes de colar.' }, prov: ufgs },
    { id: 'forms_true', phase: 'foundation', item: 'Forms set to line and grade, braced, clean and coated with release agent.', item_es: { status: 'translated', text: 'Cimbra a línea y nivel, apuntalada, limpia y con desmoldante.' }, prov: ufgs },
    { id: 'rebar_cover', phase: 'foundation', item: 'Reinforcement tied and supported on chairs or dobies at the specified cover; inspected before the pour.', item_es: { status: 'translated', text: 'Refuerzo amarrado y sobre silletas con el recubrimiento especificado; inspeccionado antes del colado.' }, prov: ufgs },
    { id: 'embeds_set', phase: 'foundation', item: 'Anchor bolts, hold-downs, sleeves and embeds set and checked against the plan before the pour.', item_es: { status: 'translated', text: 'Anclas, sujetadores, camisas y piezas embebidas colocadas y verificadas contra el plano antes del colado.' }, prov: ufgs },
    { id: 'ticket_check', item: 'Delivery ticket matches the approved mix; batch time recorded.', item_es: { status: 'translated', text: 'La remisión coincide con la mezcla aprobada; hora de dosificación registrada.' }, prov: cip('CIP 9 — low strength causes') },
    { id: 'field_tests', item: 'Slump, air and temperature tested and cylinders cast at the specified frequency.', item_es: { status: 'translated', text: 'Revenimiento, aire y temperatura medidos y cilindros colados con la frecuencia especificada.' }, prov: ufgs },
    { id: 'no_added_water', item: 'No water added beyond what the mix allows; any addition written on the ticket.', item_es: { status: 'translated', text: 'No agregar agua más allá de lo permitido por la mezcla; anotar cualquier adición en la remisión.' }, prov: cip('CIP 9') },
    { id: 'consolidation', item: 'Concrete consolidated with vibrators; no honeycombing at forms after stripping.', item_es: { status: 'translated', text: 'Concreto consolidado con vibrador; sin oquedades al descimbrar.' }, prov: ufgs },
    { id: 'finish_timing', item: 'No finishing while bleed water is on the surface.', item_es: { status: 'translated', text: 'No dar acabado mientras haya agua de sangrado en la superficie.' }, prov: cip('CIP 1 — dusting surfaces') },
    { id: 'curing', item: 'Curing starts right after finishing and the surface stays moist or covered for the specified period.', item_es: { status: 'translated', text: 'El curado inicia justo después del acabado y la superficie se mantiene húmeda o cubierta el periodo especificado.' }, prov: cip('CIP 11 — curing in-place concrete') },
    { id: 'cold_weather', item: 'In cold weather, never place on frozen ground and protect new concrete from freezing.', item_es: { status: 'translated', text: 'En clima frío, nunca colar sobre suelo congelado y proteger el concreto nuevo de la congelación.' }, prov: cip('CIP 27 — cold weather concreting') },
    { id: 'hot_weather', item: 'In hot, dry or windy weather, take steps to prevent plastic shrinkage cracking (shade, windbreaks, evaporation control).', item_es: { status: 'translated', text: 'En clima caluroso, seco o con viento, prevenir fisuras por contracción plástica (sombra, rompevientos, control de evaporación).' }, prov: cip('CIP 5 / CIP 12') },
  ],
  inspection_checklists: {
    footing: [
      { item: 'Excavation to design depth on undisturbed or approved soil, below frost depth', item_es: PENDING_ES },
      { item: 'Rebar size, spacing, laps and cover per plan; chairs in place', item_es: PENDING_ES },
      { item: 'Forms dimensioned and braced; no water or loose soil in the bottom', item_es: PENDING_ES },
    ],
    foundation: [
      { item: 'Wall forms plumb and braced; ties and rebar per plan', item_es: PENDING_ES },
      { item: 'Anchor bolts / hold-downs placed per plan before pour', item_es: PENDING_ES },
      { item: 'Below-slab vapor retarder and insulation per plan (slab pours)', item_es: PENDING_ES },
    ],
  },
});
