// Trade Knowledge Pack — drywall (Drywall / Gypsum Board). Wave 01, COMPLEMENT pattern: the hand
// recipe in task-buildout/building.ts (drywall/plaster branch) keeps producing the work steps; this
// pack adds glossary, hazards, QA, inspection checklists, code refs and cost adders.
// Dossier: docs/trade-packs/dossiers/drywall.md. Sources: UFGS 09 29 00 (Aug 2024 chg 1), GA-216 /
// GA-214 (concepts, via UFGS), USG Gypsum Construction Handbook, 29 CFR 1926 Subparts C, D, E, H, I,
// K, L, X, Z; IRC R702.3 / R302.6 / R302.7 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['ufgs-09-29-00'], confidence: 'verified' as const, last_verified: D };
const ufgsGa = (ga: 'ga-216' | 'ga-214') => ({ src: ['ufgs-09-29-00', ga], confidence: 'verified' as const, last_verified: D });
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const irc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'drywall',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Hanging and finishing gypsum board on interior walls and ceilings: board selection (regular, fire-rated Type X, moisture/mold-resistant), fastening, corner bead, taping and finishing to the specified level, and texture.',
    summary_es: 'Instalación y acabado de paneles de yeso (tablaroca) en muros y plafones interiores: selección de panel (regular, resistente al fuego Tipo X, resistente a humedad/moho), fijación, esquineros, encintado y acabado al nivel especificado, y textura.',
    glossary: [
      { term: 'Type X board', term_es: 'Panel Tipo X', def: 'Fire-resistant gypsum board with a reinforced core, used in rated walls, ceilings and the garage separation.', def_es: 'Panel de yeso resistente al fuego con núcleo reforzado; se usa en muros y plafones con clasificación y en la separación con la cochera.' },
      { term: 'Moisture-resistant board', term_es: 'Panel resistente a la humedad', def: 'Board with a treated core and facing for damp areas; not a substitute for tile backer inside showers.', def_es: 'Panel con núcleo y cara tratados para zonas húmedas; no sustituye al panel de respaldo para azulejo dentro de regaderas.' },
      { term: 'Level of finish', term_es: 'Nivel de acabado', def: 'Industry scale 0–5 describing how much taping and compound is applied before paint.', def_es: 'Escala de la industria del 0 al 5 que indica cuánta cinta y compuesto se aplica antes de pintar.' },
      { term: 'Skim coat', term_es: 'Capa de alisado', def: 'Thin coat of joint compound over the whole surface — what makes a Level 5 finish.', def_es: 'Capa delgada de compuesto sobre toda la superficie; es lo que da el acabado Nivel 5.' },
      { term: 'Corner bead', term_es: 'Esquinero', def: 'Metal, vinyl or paper-faced trim that protects and straightens outside corners.', def_es: 'Moldura metálica, de vinilo o con papel que protege y endereza las esquinas exteriores.' },
      { term: 'Control joint', term_es: 'Junta de control', def: 'Trim that lets long walls and ceilings move without cracking.', def_es: 'Moldura que permite que muros y plafones largos se muevan sin agrietarse.' },
      { term: 'Screw pop', term_es: 'Tornillo botado', def: 'Fastener head pushing through the finished surface, usually from framing shrinkage or an overdriven screw.', def_es: 'Cabeza de tornillo que sobresale del acabado, por contracción de la madera o tornillo mal apretado.' },
      { term: 'Setting-type compound', term_es: 'Compuesto de fraguado', def: 'Powder compound that hardens chemically (hot mud); required with self-adhering mesh tape.', def_es: 'Compuesto en polvo que endurece por reacción química; obligatorio con cinta de malla autoadherible.' },
      { term: 'Butt joint', term_es: 'Junta de testa', def: 'Joint where two un-tapered board ends meet; harder to hide than a tapered edge joint.', def_es: 'Junta donde se encuentran dos extremos sin rebaje; más difícil de disimular que la junta de borde rebajado.' },
    ],
  },
  est_bucket: 'building',
  recipes: [],
  code_refs: {
    framing: [
      { section: 'R702.3', code_type: 'IRC', note: 'Gypsum board and gypsum panel products — materials and installation', prov: irc },
      { section: 'R702.3.5', code_type: 'IRC', note: 'Application — support spacing and fastening of board', prov: irc },
    ],
    final: [
      { section: 'R302.6', code_type: 'IRC', note: 'Dwelling-garage fire separation', prov: irc },
      { section: 'R302.7', code_type: 'IRC', note: 'Under-stair protection', prov: irc },
    ],
  },
  equipment: [
    { when: { building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'scissor_lift', reason: 'Hang and finish high ceilings and tall walls from a guarded platform instead of stilts or ladders', optional: true },
    { when: { building_types: ['commercial', 'residential_mf'] }, type: 'material_hoist', reason: 'Lift board stock to upper floors on multi-story jobs', optional: true },
    { when: { title_re: 'textur|mud|finish' }, type: 'air_compressor', reason: 'Hopper gun / spray rig for ceiling texture', optional: true },
  ],
  hazards: [
    { id: 'board_stack_tipover', hazard: 'Crushed by stacked or leaning board sheets that slide or tip over', hazard_es: PENDING_ES, controls: ['Store board flat, stacked and blocked so it cannot slide or fall; never stand sheets on edge against a wall without restraint', 'Stay off the low side when moving carts or unbanding stacks'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 4, ppe: ['safety toe boots', 'gloves'], prov: osha('h') },
    { id: 'sheet_lifting', hazard: 'Back and shoulder strains lifting and holding full sheets, especially overhead', hazard_es: PENDING_ES, controls: ['Two-person carry for full sheets; use a panel lift for ceilings', 'Use a dolly or board cart instead of carrying long distances'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 2, prov: osha('c') },
    { id: 'ladder', hazard: 'Fall from a stepladder while hanging or finishing high work', hazard_es: PENDING_ES, controls: ['Never stand on the top or top step of a stepladder', 'Set ladders on stable, level floors and keep three points of contact'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'rolling_scaffold', hazard: 'Mobile (rolling) scaffold rolls or tips while someone is on it', hazard_es: PENDING_ES, controls: ['Lock casters and wheels before climbing', 'Brace the tower plumb and level; move it by pushing near the base, never with anyone riding unless every riding condition is met'], controls_es: PENDING_ES, osha_ref: '1926.452(w)(2)', severity: 3, prov: osha('l') },
    { id: 'scaffold_fall', hazard: 'Fall from a scaffold platform more than 10 ft up', hazard_es: PENDING_ES, controls: ['Guardrails or personal fall arrest on platforms over 10 ft', 'Fully plank the platform; a competent person inspects before each shift', 'Use a ladder or stair for access — not the cross braces'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'stilts', hazard: 'Trips and falls while working on drywall stilts', hazard_es: PENDING_ES, controls: ['Clear scrap, cords and buckets from the floor before stilt work', 'Cover floor openings and stay away from stairs and unguarded edges', 'Inspect straps and springs daily; train before first use'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 3, prov: osha('c') },
    { id: 'sanding_dust', hazard: 'Breathing joint-compound sanding dust (eye, nose and lung irritation)', hazard_es: PENDING_ES, controls: ['Use vacuum-attached sanders or wet sponge sanding', 'Ventilate the area; wear a dust respirator for dry sanding', 'Keep exposure under the nuisance-dust limit'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, ppe: ['N95 respirator', 'safety glasses'], prov: osha('d') },
    { id: 'silica_cement_board', hazard: 'Breathing crystalline silica when power-cutting cement board or fiber-cement board', hazard_es: PENDING_ES, controls: ['Score and snap cement board instead of power-cutting when possible', 'Power-cut fiber-cement board only outdoors with a saw fitted with a dust collector, as listed in Table 1', 'No dry sweeping or compressed air on silica dust — HEPA vacuum or wet methods'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator when Table 1 requires it', 'safety glasses'], prov: osha('z') },
    { id: 'eye_debris', hazard: 'Gypsum chips, compound splatter and dust in the eyes (overhead work especially)', hazard_es: PENDING_ES, controls: ['Wear safety glasses or goggles when cutting, screwing, mudding overhead and sanding'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses', 'goggles for overhead sanding'], prov: osha('e') },
    { id: 'power_tool', hazard: 'Cuts from utility knives, rotary cut-out tools and saws', hazard_es: PENDING_ES, controls: ['Keep guards on saws and cut-out tools; keep tools in safe condition', 'Cut away from the body; retract and store knife blades'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('i') },
    { id: 'cord_shock', hazard: 'Electric shock from screw guns, cords and temporary power', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Inspect cords daily; keep them out of mud buckets and wet areas'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
  ],
  qa_checklist: [
    { id: 'framing_ready', phase: 'drywall', item: 'Framing, furring, blocking and backing (fixtures, grab bars, cabinets, TV mounts) checked straight and in place before any board goes up.', item_es: tr('Estructura, rastreles, bloqueos y refuerzos (muebles de baño, barras de apoyo, gabinetes, soportes de TV) revisados, rectos y en su lugar antes de colocar panel.'), prov: ufgs },
    { id: 'cover_inspection_passed', phase: 'drywall', item: 'Insulation and any required cover inspection passed and signed before walls and ceilings are closed in.', item_es: tr('Inspección de aislamiento y de cubrimiento aprobada y firmada antes de cerrar muros y plafones.'), prov: { src: ['ufgs-09-29-00', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'Sequencing: board covers the work the insulation/framing inspections must see.' } },
    { id: 'conditions_ok', phase: 'drywall', item: 'Building weathertight and kept between 50 °F and 80 °F with ventilation during hanging and finishing; no wet or moldy board installed.', item_es: tr('Edificio cerrado contra la intemperie y entre 10 °C y 27 °C con ventilación durante instalación y acabado; no se instala panel mojado o con moho.'), prov: ufgs },
    { id: 'board_types_match', phase: 'drywall', item: 'Board type and thickness in every area match the drawings — Type X where fire-rated, moisture/mold-resistant in damp areas.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'garage_separation', phase: 'drywall', item: 'Garage-to-dwelling separation built with the board type and thickness the code and plans require, including the ceiling under any habitable room above.', item_es: PENDING_ES, safety: true, prov: irc },
    { id: 'rated_assembly_listing', phase: 'drywall', item: 'Fire-rated walls and ceilings built exactly to the listed design number — same board, layers, fastener type and spacing.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'rated_penetrations', phase: 'drywall', item: 'Joints and every penetration in fire-rated board closed and sealed per the tested system; control joints in rated walls backed with firestop insulation.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'wet_area_board', phase: 'drywall', item: 'Tile areas in tubs and showers use cement backer or glass-mat tile backer; water-resistant board is not installed over a vapor barrier in a tub or shower.', item_es: tr('En tinas y regaderas con azulejo se usa panel de cemento o de fibra de vidrio para azulejo; el panel resistente al agua no se coloca sobre barrera de vapor en tina o regadera.'), prov: { src: ['ufgs-09-29-00', 'icc-pa'], confidence: 'verified', last_verified: D } },
    { id: 'edges_and_joints', phase: 'drywall', item: 'Board ends and edges land on framing (except edges running across it), end joints staggered, panels in light contact — never forced into place.', item_es: tr('Extremos y bordes del panel apoyan sobre la estructura (salvo bordes perpendiculares), juntas de testa alternadas y paneles con contacto ligero, nunca forzados.'), prov: ufgsGa('ga-216') },
    { id: 'fastener_pattern', phase: 'drywall', item: 'Fastener type, length and spacing follow the schedule for the board and framing; heads dimpled just below the face without tearing the paper.', item_es: tr('Tipo, largo y separación de tornillos según la tabla para el panel y la estructura; cabezas apenas hundidas sin romper el papel.'), prov: ufgsGa('ga-216') },
    { id: 'no_screw_pops', phase: 'drywall', item: 'No screw pops, broken-paper fasteners or loose board before taping — reset or add fasteners first.', item_es: tr('Sin tornillos botados, papel roto o paneles flojos antes de encintar; reajustar o agregar tornillos primero.'), prov: { src: ['usg-gch'], confidence: 'derived', last_verified: D, note: 'Paraphrase of manufacturer troubleshooting guidance.' } },
    { id: 'cutouts_tight', phase: 'drywall', item: 'Cut-outs at boxes, pipes and openings are neat and tight; edges at plumbing penetrations treated with moisture-resistant compound.', item_es: tr('Recortes en cajas, tubos y vanos limpios y ajustados; bordes en pasos de plomería tratados con compuesto resistente a la humedad.'), prov: ufgs },
    { id: 'control_joints', phase: 'drywall', item: 'Control joints installed where a wall crosses a structural joint, on long uninterrupted runs, and where ceiling framing changes direction — per the drawings.', item_es: tr('Juntas de control colocadas donde el muro cruza una junta estructural, en tramos largos continuos y donde cambia la dirección de la estructura del plafón, según planos.'), prov: ufgs },
    { id: 'finish_level', phase: 'drywall', item: 'Finish level matches the schedule (e.g. Level 2 under tile, Level 4 for flat paint, Level 5 for gloss or harsh light); checked under raking light.', item_es: tr('El nivel de acabado coincide con lo especificado (p. ej. Nivel 2 bajo azulejo, Nivel 4 para pintura mate, Nivel 5 para brillo o luz rasante); revisado con luz rasante.'), prov: ufgsGa('ga-214') },
    { id: 'mesh_tape_compound', phase: 'drywall', item: 'Self-adhering mesh tape used only with setting-type compound, not with drying-type compound.', item_es: tr('La cinta de malla autoadherible se usa solo con compuesto de fraguado, nunca con compuesto de secado.'), prov: ufgs },
  ],
  inspection_checklists: {
    insulation: [
      { item: 'Insulation inspection passed before any wall or ceiling is boarded over', item_es: PENDING_ES },
      { item: 'Fireblocking and draftstopping in place and visible before cover', item_es: PENDING_ES },
    ],
    framing: [
      { item: 'Where the AHJ inspects board fastening: board hung, fasteners exposed (not taped) and spacing per the schedule', item_es: PENDING_ES, ref: 'R702.3.5' },
      { item: 'Fire-rated board (garage separation, rated walls) identified by its stamp before taping', item_es: PENDING_ES, ref: 'R302.6' },
    ],
    final: [
      { item: 'Garage-to-dwelling separation complete; penetrations sealed; door per plans', item_es: PENDING_ES, ref: 'R302.6' },
      { item: 'Enclosed accessible space under stairs protected on the enclosed side', item_es: PENDING_ES, ref: 'R302.7' },
      { item: 'No open holes in rated walls or ceilings after trim-out', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-DW-TYPEX-SF', name: 'Upgrade to 5/8 in. Type X fire-rated board (adder over standard board) per SF', name_es: 'Cambio a panel de 5/8 pulg. Tipo X resistente al fuego (adicional sobre panel estándar) por pie²', description: 'Adder on top of B-DRYWALL-SF for garage separation, rated walls and ceilings.', unit: 'SF', csi: '09 29 00',
      material_cost_cents: { v: 18, prov: est('Type X 5/8 vs regular 1/2 board price difference, national baseline 2026') }, labor_hours_per_unit: { v: 0.004, prov: est('heavier sheets + tighter fastener schedule on rated work') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('same cut waste as standard board') } },
    { code: 'B-DW-MR-SF', name: 'Upgrade to moisture/mold-resistant board (adder over standard board) per SF', name_es: 'Cambio a panel resistente a humedad/moho (adicional sobre panel estándar) por pie²', description: 'Adder on top of B-DRYWALL-SF for baths, laundry and other damp rooms.', unit: 'SF', csi: '09 29 00',
      material_cost_cents: { v: 22, prov: est('MR/mold-resistant vs regular board price difference, national baseline 2026') }, labor_hours_per_unit: { v: 0.002, prov: est('extra edge sealing at cut-outs') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('same cut waste as standard board') } },
    { code: 'B-DW-L5-SF', name: 'Level 5 skim-coat finish (adder over Level 4) per SF', name_es: 'Acabado Nivel 5 con capa de alisado (adicional sobre Nivel 4) por pie²', unit: 'SF', csi: '09 29 00',
      material_cost_cents: { v: 6, prov: est('thin full-surface compound coat + extra primer, 2026') }, labor_hours_per_unit: { v: 0.012, prov: est('one finisher skims ≈80–100 SF/hr incl. light sand') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('compound left in pans') } },
    { code: 'B-DW-CORNER-LF', name: 'Outside corner bead installed and finished (3 coats) per LF', name_es: 'Esquinero exterior instalado y acabado (3 manos) por pie lineal', unit: 'LF', csi: '09 29 00',
      material_cost_cents: { v: 70, prov: est('metal or paper-faced bead + compound share, 2026') }, labor_hours_per_unit: { v: 0.035, prov: est('set bead plus three finish coats') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('end cuts') } },
    { code: 'B-DW-TEXTURE-SF', name: 'Sprayed ceiling texture (orange peel / knockdown) per SF', name_es: 'Textura rociada en plafón (cáscara de naranja / knockdown) por pie²', unit: 'SF', csi: '09 29 00',
      material_cost_cents: { v: 8, prov: est('texture compound / mix, 2026') }, labor_hours_per_unit: { v: 0.006, prov: est('spray + knockdown incl. masking') },
      equipment_cost_cents: { v: 2, prov: est('hopper gun + compressor share') }, waste_pct: { v: 10, prov: est('overspray and masking loss') } },
  ],
  quantity_rules: [
    { code: 'B-DW-TEXTURE-SF', assumption: 'Textured ceilings ≈ room floor area (from the room schedule) — remove if ceilings are smooth', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'area_sf_sum', mul: 1, round: 'ceil' } },
    { code: 'B-DW-CORNER-LF', assumption: '≈8 LF of outside corner bead per room (openings, soffits, returns)', qty: { basis: 'rooms', mul: 8, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['insulation'], note: 'Board goes up only after the insulation (cover) inspection passes.' },
  ],
});
