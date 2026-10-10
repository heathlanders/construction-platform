// Trade Knowledge Pack — siding (Vinyl / Fiber Cement / Wood). Wave 01: the COMPLEMENT pattern — the
// hand recipe in task-buildout/building.ts (WRB & flashing → install cladding) keeps producing the work
// steps (no recipes here, no supersedes_hand); the pack adds hazards, QA, inspection checklists, code
// refs, glossary and the WRB / flashing / trim / soffit assemblies the catalog lacked.
// Dossier: docs/trade-packs/dossiers/siding.md. Sources: James Hardie HardiePlank instructions, VSI
// Vinyl Siding Installation Manual (2022), DOE BASC (WRB fact sheet, fully flashed openings, kick-out
// flashing), 29 CFR 1926 Subparts D, I, K, L, M, X, Z; IRC R703 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const v = (src: string[], note?: string) => ({ src, confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string) => v([`ecfr-1926-${sub}`]);
const hardie = (note?: string) => v(['sid-hardieplank-install'], note);
const vsi = (note?: string) => v(['sid-vsi-manual'], note);
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const irc = v(['icc-pa']);
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'siding',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Exterior wall cladding — vinyl, fiber cement and wood lap or panel siding — installed over a continuous water-resistive barrier with flashed openings, plus corners, trim, soffit and fascia.',
    summary_es: 'Revestimiento exterior de muros — siding de vinilo, fibrocemento y madera, en tablas traslapadas o paneles — instalado sobre una barrera resistente al agua continua con aberturas tapajuntadas, más esquinas, molduras, plafón de alero y fascia.',
    glossary: [
      { term: 'Water-resistive barrier (WRB)', term_es: 'Barrera resistente al agua (WRB)', def: 'House wrap or felt behind the siding that sheds water that gets past the cladding.', def_es: 'Envoltura (house wrap) o fieltro detrás del siding que desvía el agua que pasa el revestimiento.' },
      { term: 'Shingle lap', term_es: 'Traslape tipo teja', def: 'Upper layer always laps over the lower one so water runs out, never behind.', def_es: 'La capa de arriba siempre traslapa sobre la de abajo para que el agua salga, nunca entre.' },
      { term: 'Sill pan', term_es: 'Charola de antepecho', def: 'Flashing at the bottom of a window or door opening that drains water outward.', def_es: 'Tapajuntas en la parte baja de la abertura de ventana o puerta que drena el agua hacia afuera.' },
      { term: 'Kick-out flashing', term_es: 'Desviador de agua (kick-out)', def: 'Bent flashing where a roof edge dies into a wall; throws water away from the siding.', def_es: 'Tapajuntas doblado donde el borde del techo termina contra un muro; aleja el agua del siding.' },
      { term: 'Starter strip', term_es: 'Tira de arranque', def: 'First piece at the bottom of the wall that locks or tilts the first course.', def_es: 'Primera pieza en la base del muro que sujeta o inclina la primera hilada.' },
      { term: 'J-channel', term_es: 'Canal J', def: 'Vinyl trim that receives panel ends at windows, doors, eaves and walls.', def_es: 'Moldura de vinilo que recibe los extremos de los paneles en ventanas, puertas, aleros y muros.' },
      { term: 'Blind nailing', term_es: 'Clavado oculto', def: 'Nailing at the top of a plank so the next course hides the nail.', def_es: 'Clavar en la parte superior de la tabla para que la siguiente hilada oculte el clavo.' },
      { term: 'Butt joint', term_es: 'Junta a tope', def: 'Where two plank ends meet in the same course.', def_es: 'Donde se juntan los extremos de dos tablas en la misma hilada.' },
      { term: 'Soffit', term_es: 'Plafón de alero', def: 'Underside of the roof overhang; often vented.', def_es: 'Parte inferior del alero del techo; a menudo ventilada.' },
      { term: 'Fascia', term_es: 'Fascia', def: 'Board (or metal cover) on the face of the rafter tails at the eave.', def_es: 'Tabla (o cubierta metálica) en el frente de las colas de vigas en el alero.' },
    ],
  },
  est_bucket: 'building',
  recipes: [],
  code_refs: {
    sheathing: [
      { section: 'R703.1', code_type: 'IRC', note: 'Wall covering acts as a weather-resistant envelope with a drainage path', prov: irc },
      { section: 'R703.2', code_type: 'IRC', note: 'Continuous water-resistive barrier behind the cladding', prov: irc },
      { section: 'R703.4', code_type: 'IRC', note: 'Corrosion-resistant flashing at openings, roof-wall joints and penetrations, lapped shingle-style', prov: irc },
    ],
    final: [
      { section: 'R703.3', code_type: 'IRC', note: 'Siding thickness and fastening per the code table or the maker’s instructions', prov: irc },
      { section: 'R703.5', code_type: 'IRC', note: 'Wood, hardboard and wood structural panel siding', prov: irc },
      { section: 'R703.10', code_type: 'IRC', note: 'Fiber-cement siding — fastening and joint treatment', prov: irc },
      { section: 'R703.11', code_type: 'IRC', note: 'Vinyl siding — installed per the maker’s instructions', prov: irc },
    ],
  },
  equipment: [
    { when: { phase: ['finishes_exterior'] }, type: 'air_compressor', reason: 'Pneumatic siding / coil nailers for lap and trim fastening', optional: true },
    { when: { phase: ['finishes_exterior'], building_types: ['residential_mf', 'commercial', 'industrial'] }, type: 'boom_lift', reason: 'Reach upper courses, soffit and fascia on multi-story walls without long ladders', optional: true },
  ],
  hazards: [
    { id: 'fall_edge', hazard: 'Falls from unprotected wall or roof edges 6 ft or more above a lower level', hazard_es: PENDING_ES, controls: ['Use guardrails, safety nets or personal fall arrest at 6 ft or more', 'Plan anchors before starting gable ends and dormers'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['full-body harness where PFAS is used'], prov: osha('m') },
    { id: 'scaffold_fall', hazard: 'Falls from scaffold or pump-jack platforms more than 10 ft up', hazard_es: PENDING_ES, controls: ['Guardrails or personal fall arrest on every platform over 10 ft', 'Fully plank the working level'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'scaffold_defect', hazard: 'Scaffold failure from damaged parts, missing ties or bad footing', hazard_es: PENDING_ES, controls: ['Competent person inspects the scaffold before each shift and after anything that could damage it', 'Set legs on base plates and mudsills; tie to the structure as required'], controls_es: PENDING_ES, osha_ref: '1926.451(f)(3)', severity: 4, prov: osha('l') },
    { id: 'pump_jack', hazard: 'Pump-jack bracket slip or pole failure', hazard_es: PENDING_ES, controls: ['Use metal brackets with two positive gripping mechanisms', 'Brace poles to the structure and respect the pole height and load limits'], controls_es: PENDING_ES, osha_ref: '1926.452(j)', severity: 3, prov: osha('l') },
    { id: 'ladder', hazard: 'Ladder slipping or tipping while setting starter, trim and gable courses', hazard_es: PENDING_ES, controls: ['Extend side rails 3 ft above the landing and secure the ladder', 'Set on firm level footing; keep three points of contact'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'power_line', hazard: 'Electrocution when a ladder, metal trim coil or long panel contacts an overhead line', hazard_es: PENDING_ES, controls: ['Locate the service drop before staging; keep clear or have the utility cover the line', 'Use nonconductive (fiberglass) ladders near energized equipment'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(12)', severity: 4, prov: osha('x') },
    { id: 'fc_silica', hazard: 'Respirable silica dust from cutting fiber-cement siding and trim', hazard_es: PENDING_ES, controls: ['Cut outdoors with fiber-cement shears, or a saw with a dust collector meeting Table 1 airflow and filter rules', 'Clean up with a HEPA vacuum or wet methods — never dry sweep'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['safety glasses', 'N95 or better when not cutting per Table 1'], prov: v(['ecfr-1926-z', 'sid-hardieplank-install']) },
    { id: 'nailer', hazard: 'Puncture wounds from pneumatic siding and coil nailers', hazard_es: PENDING_ES, controls: ['Keep the muzzle safety device working; never bypass it', 'Disconnect air before clearing jams; never point the tool at anyone'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(3)', severity: 3, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'saw', hazard: 'Cuts and kickback from circular and miter saws', hazard_es: PENDING_ES, controls: ['Keep blade guards in place and support the work', 'Unplug or pull the battery before changing blades'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'cord_shock', hazard: 'Electric shock from cords and tools used outdoors', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Inspect cords daily; remove damaged ones'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'asbestos_siding', hazard: 'Asbestos fibers released when tearing off old cement-asbestos siding or shingles', hazard_es: PENDING_ES, controls: ['Test suspect cement siding before removal', 'If it contains asbestos, remove whole pieces wet, without cutting, breaking or sanding, and bag or wrap them'], controls_es: PENDING_ES, osha_ref: '1926.1101(g)(8)(iii)', severity: 4, prov: osha('z') },
    { id: 'lead_paint', hazard: 'Lead dust from scraping, cutting or tearing off old painted siding and trim', hazard_es: PENDING_ES, controls: ['Assume older paint has lead until tested; use wet methods and HEPA cleanup', 'No eating or smoking in the work area; wash before breaks'], controls_es: PENDING_ES, osha_ref: '1926.62', severity: 3, prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'old_siding_tested', item: 'On re-siding, suspect cement-board siding and old painted surfaces tested for asbestos and lead before tear-off.', item_es: PENDING_ES, safety: true, prov: v(['ecfr-1926-z', 'ecfr-1926-d']) },
    { id: 'scaffold_inspected', item: 'Scaffold or pump jacks inspected by a competent person before each shift; platforms fully planked with guardrails over 10 ft.', item_es: PENDING_ES, safety: true, prov: osha('l') },
    { id: 'fc_cut_dust', item: 'Fiber cement cut outdoors with shears or a dust-collecting saw; cleanup with HEPA vacuum or wet methods, no dry sweeping.', item_es: PENDING_ES, safety: true, prov: v(['sid-hardieplank-install', 'ecfr-1926-z']) },
    { id: 'wrb_lapped', phase: 'finishes_exterior', item: 'WRB installed bottom-up, upper courses lapped over lower, seams lapped and taped per the maker, wrapped past corners.', item_es: tr('WRB instalada de abajo hacia arriba, hiladas superiores traslapadas sobre las inferiores, uniones traslapadas y encintadas según el fabricante, pasando las esquinas.'), prov: v(['sid-doe-basc-wrb'], 'DOE fact sheet: 4–12 in. laps typical; extend 6–36 in. around corners; follow the product instructions.') },
    { id: 'wrb_fastened', phase: 'finishes_exterior', item: 'WRB fastened with cap nails or wide-crown staples at the spacing the maker lists; tears and holes taped.', item_es: tr('WRB fijada con clavos de cabeza plástica o grapas de corona ancha al espaciado del fabricante; roturas y orificios encintados.'), prov: v(['sid-doe-basc-wrb'], '12–18 in. spacing typical per DOE; manufacturer governs.') },
    { id: 'openings_flashed', phase: 'finishes_exterior', item: 'Every window and door opening flashed in order: sill pan, jamb flashing over the pan, head flashing over the jambs, WRB over the head.', item_es: tr('Cada abertura de ventana y puerta tapajuntada en orden: charola de antepecho, jambas sobre la charola, cabezal sobre las jambas, WRB sobre el cabezal.'), prov: v(['doe-basc-win-flashed']) },
    { id: 'kickout_installed', phase: 'finishes_exterior', item: 'Kick-out flashing at every point where a roof edge ends against a wall; step flashing turned up the wall and lapped by the WRB.', item_es: tr('Desviador kick-out en cada punto donde el borde del techo termina contra un muro; tapajuntas escalonado subiendo por el muro y traslapado por la WRB.'), prov: v(['sid-doe-basc-kickout', 'sid-hardieplank-install']) },
    { id: 'clearances', phase: 'finishes_exterior', item: 'Siding clearances kept: about 6 in. above finished grade and 1–2 in. above roofing, decks, paths and driveways (or as the product requires).', item_es: tr('Separaciones del siding respetadas: unas 6 pulg. sobre el nivel de terreno terminado y 1–2 pulg. sobre techos, terrazas, andadores y entradas (o lo que pida el producto).'), prov: hardie('Fiber-cement figures; vinyl/wood follow their own instructions.') },
    { id: 'fc_fastening', phase: 'finishes_exterior', item: 'Fiber-cement planks lapped at least 1-1/4 in., fastened into framing or approved sheathing, heads snug — not overdriven or angled.', item_es: tr('Tablas de fibrocemento traslapadas al menos 1-1/4 pulg., fijadas a la estructura o al entablado aprobado, cabezas al ras — ni hundidas ni inclinadas.'), prov: hardie() },
    { id: 'fc_joints', phase: 'finishes_exterior', item: 'Fiber-cement butt joints in light contact with joint flashing behind them; 1/4 in. gap kept above horizontal flashing and left uncaulked.', item_es: tr('Juntas a tope de fibrocemento en contacto ligero con tapajuntas detrás; separación de 1/4 pulg. sobre tapajuntas horizontales, sin sellador.'), prov: hardie() },
    { id: 'fc_paint', phase: 'finishes_exterior', item: 'Primed fiber cement painted within the window the maker sets (180 days primed / 90 unprimed in the cited edition); no stain.', item_es: tr('Fibrocemento con primario pintado dentro del plazo del fabricante (180 días con primario / 90 sin primario en la edición citada); sin tinte.'), prov: hardie() },
    { id: 'vinyl_nailing', phase: 'finishes_exterior', item: 'Vinyl nailed in the center of the slots, about 1/32 in. (a dime) under the head, max 16 in. apart on horizontal panels; panels slide freely.', item_es: tr('Vinilo clavado al centro de las ranuras, con unos 1/32 pulg. (una moneda) bajo la cabeza, a máx. 16 pulg. en paneles horizontales; los paneles se deslizan libremente.'), prov: vsi() },
    { id: 'vinyl_gaps', phase: 'finishes_exterior', item: 'Vinyl gaps of at least 1/4 in. at receivers and openings (3/8 in. below 40 °F); no caulk at receivers or laps; no face nailing.', item_es: tr('Holgura del vinilo de al menos 1/4 pulg. en receptores y aberturas (3/8 pulg. bajo 40 °F); sin sellador en receptores ni traslapes; sin clavado de cara.'), prov: vsi() },
    { id: 'penetrations_blocked', phase: 'finishes_exterior', item: 'Lights, hose bibs, vents and meters set on mounting blocks or trim rings, flashed into the WRB.', item_es: tr('Lámparas, llaves de manguera, ventilas y medidores montados en bloques o aros de moldura, tapajuntados contra la WRB.'), prov: v(['sid-vsi-manual', 'sid-doe-basc-wrb']) },
    { id: 'courses_true', phase: 'finishes_exterior', item: 'Courses level and aligned across corners and openings; reveal consistent wall to wall.', item_es: tr('Hiladas niveladas y alineadas en esquinas y aberturas; exposición uniforme de muro a muro.'), prov: { src: ['sid-vsi-manual', 'sid-hardie-tips'], confidence: 'derived', last_verified: D, note: 'Workmanship check drawn from both manufacturers’ layout guidance.' } },
  ],
  inspection_checklists: {
    sheathing: [
      { item: 'WRB continuous over sheathing, shingle-lapped, seams taped, no open tears', item_es: PENDING_ES, ref: 'IRC R703.2' },
      { item: 'Window and door openings flashed in shingle order (sill pan, jambs, head)', item_es: PENDING_ES, ref: 'IRC R703.4' },
      { item: 'Step and kick-out flashing in place at roof-wall intersections', item_es: PENDING_ES, ref: 'IRC R703.4' },
      { item: 'Deck ledgers and other penetrations flashed and integrated with the WRB', item_es: PENDING_ES, ref: 'IRC R703.4' },
    ],
    final: [
      { item: 'Siding clearances to grade, roofing, decks and paved surfaces met', item_es: PENDING_ES, ref: 'Maker instructions' },
      { item: 'Fastening matches the maker’s schedule; no overdriven or face nails in vinyl', item_es: PENDING_ES, ref: 'IRC R703.3' },
      { item: 'Trim gaps sealed where required; flashing gaps left open', item_es: PENDING_ES },
      { item: 'Kick-outs visible and draining away from the wall', item_es: PENDING_ES, ref: 'IRC R703.4' },
      { item: 'Vented soffit installed where the attic vent plan calls for it; vents not blocked', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-SID-WRB-SF', name: 'House wrap WRB with taped seams and cap fasteners per SF of wall', name_es: 'Barrera WRB (house wrap) con uniones encintadas y fijación con cabeza plástica por pie² de muro', unit: 'SF', csi: '07 25 00',
      material_cost_cents: { v: 22, prov: est('Wrap roll + seam tape + cap nails, national baseline 2026') }, labor_hours_per_unit: { v: 0.006, prov: est('2-person crew wraps ~2,500 SF/day') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 10, prov: est('laps and cut-outs at openings') } },
    { code: 'B-SID-OPEN-FLASH-EA', name: 'Window/door opening flashing (sill pan, jamb, head tape) each', name_es: 'Tapajuntas de abertura de ventana/puerta (charola, jambas, cabezal) c/u', unit: 'EA', csi: '07 65 00',
      material_cost_cents: { v: 2200, prov: est('flexible flashing tape + sill pan material for a typical 3x5 ft opening') }, labor_hours_per_unit: { v: 0.4, prov: est('cut WRB, pan, jambs, head, tape') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 10, prov: est('tape off-cuts') } },
    { code: 'B-SID-KICKOUT-EA', name: 'Kick-out flashing at roof-wall intersection, each', name_es: 'Desviador kick-out en intersección techo-muro, c/u', unit: 'EA', csi: '07 62 00',
      material_cost_cents: { v: 1500, prov: est('molded or prefabricated metal kick-out + membrane patch') }, labor_hours_per_unit: { v: 0.3, prov: est('set, integrate with step flashing and WRB') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('unit item') } },
    { code: 'B-SID-CORNER-LF', name: 'Siding corners and trim (corner posts / trim boards) per LF', name_es: 'Esquinas y molduras del siding (postes de esquina / tablas de moldura) por pie lineal', unit: 'LF', csi: '07 46 00',
      material_cost_cents: { v: 300, prov: est('vinyl corner post or fiber-cement/engineered trim board, blended 2026') }, labor_hours_per_unit: { v: 0.05, prov: est('cut, flash and fasten trim') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('end cuts and laps') } },
    { code: 'B-SID-SOFFIT-SF', name: 'Vented soffit (vinyl or aluminum) with receiving channels per SF', name_es: 'Plafón de alero ventilado (vinilo o aluminio) con canales receptores por pie²', unit: 'SF', csi: '07 46 00',
      material_cost_cents: { v: 250, prov: est('vented soffit panel + F/J channel share, 2026') }, labor_hours_per_unit: { v: 0.04, prov: est('channel layout + panel install') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('panel cut-offs') } },
    { code: 'B-SID-FASCIA-LF', name: 'Fascia cover (prefinished aluminum/vinyl) per LF', name_es: 'Cubierta de fascia (aluminio/vinilo prepintado) por pie lineal', unit: 'LF', csi: '07 46 00',
      material_cost_cents: { v: 200, prov: est('prefinished fascia cover or brake-formed coil, 2026') }, labor_hours_per_unit: { v: 0.06, prov: est('bend/cut and fasten at eave and rake') },
      equipment_cost_cents: { v: 0, prov: est('brake assumed owned') }, waste_pct: { v: 10, prov: est('laps and miters') } },
  ],
  quantity_rules: [
    { code: 'B-SID-WRB-SF', assumption: '≈1.1 SF exterior wall per SF of floor area (same ratio as the siding seeder) — measure walls to confirm', qty: { basis: 'area_sf_sum', mul: 1.1, round: 'round' } },
    { code: 'B-SID-OPEN-FLASH-EA', assumption: 'One flashing set per scheduled window — add exterior doors by hand', qty: { basis: 'windows', round: 'ceil' } },
    { code: 'B-SID-KICKOUT-EA', assumption: '≈2 roof-wall intersections on a typical house — count from the roof plan', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'B-SID-CORNER-LF', assumption: '≈4 outside corners × 10 ft — add inside corners and trim from elevations', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 40 } },
    { code: 'B-SID-SOFFIT-SF', assumption: '≈0.15 SF soffit per SF floor (perimeter × ~1.5 ft overhang) — adjust for overhang depth', qty: { basis: 'area_sf_sum', mul: 0.15, round: 'round' } },
    { code: 'B-SID-FASCIA-LF', assumption: '≈0.1 LF fascia per SF floor (≈ building perimeter) — add rakes from elevations', qty: { basis: 'area_sf_sum', mul: 0.1, round: 'round' } },
  ],
  dependency_hints: [
    { after_trades: ['windows', 'exterior_doors'], note: 'Windows and doors set and flashed into the WRB before siding covers the opening.' },
    { after_trades: ['roofing'], note: 'Step flashing at roof-wall intersections goes in with roofing; kick-outs and siding lap over it.' },
  ],
});
