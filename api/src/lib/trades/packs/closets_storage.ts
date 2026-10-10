// Trade Knowledge Pack — closets_storage (Closets / Storage Systems). Wave 05 — NEW-TRADE pattern (no hand
// recipe). Manufactured systems only: fixed wire shelving, adjustable hang-track/standard systems, laminate/
// melamine closet towers, garage cabinets and overhead garage racks. Site-built shelf + rod stays with
// finish_carpentry (G-FC-CLOSET-SHELF-LF); closet doors belong to doors_hardware.
// permit_trade null → NO gates, NO code_refs; owner/GC checkpoints live in inspection_checklists.
// Dossier: docs/trade-packs/dossiers/closets_storage.md. Sources: ClosetMaid wire kit / ShelfTrack /
// hang track / Impressions instructions, elfa installation guide, Gladiator GearLoft manual,
// IRC R302.5.1 (reference only), 29 CFR 1926 C/D/E/H/I/K/X/Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const wire = (note?: string) => ({ src: ['closets-closetmaid-wire-kit'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const track = (note?: string) => ({ src: ['closets-closetmaid-shelftrack'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const elfa = (note?: string) => ({ src: ['closets-elfa-install'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const lam = (note?: string) => ({ src: ['closets-closetmaid-impressions'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const loft = (note?: string) => ({ src: ['closets-gladiator-gearloft'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const oshaDerived = (sub: string, note: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'derived' as const, last_verified: D, note });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'closets_storage',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs manufactured storage systems: fixed wire shelving in closets, pantries and laundry rooms, adjustable hang-track shelving, laminate/melamine closet towers with rods, drawers and doors, and garage storage — wall cabinets, rails and overhead racks — anchored into framing and kept clear of garage doors, fire doors and appliances.',
    summary_es: 'Instala sistemas de almacenamiento fabricados: repisas de alambre fijas en clósets, alacenas y lavanderías, repisas ajustables de riel colgante, torres de clóset de laminado o melamina con tubos, cajones y puertas, y almacenaje de cochera — gabinetes de pared, rieles y parrillas elevadas — anclados a la estructura y libres de puertas de cochera, puertas cortafuego y aparatos.',
    glossary: [
      { term: 'Wire shelving', term_es: 'Repisa de alambre', def: 'Ventilated steel-wire shelf held by back wall clips and front support brackets.', def_es: 'Repisa ventilada de alambre de acero sostenida por fijadores traseros en el muro y soportes delanteros.' },
      { term: 'Wall clip', term_es: 'Fijador de pared', def: 'Small clip with a drive-pin anchor that holds the back wire of a fixed wire shelf to the wall.', def_es: 'Pequeño fijador con taquete de clavija que sujeta el alambre trasero de una repisa fija al muro.' },
      { term: 'Hang track (top track)', term_es: 'Riel colgante (riel superior)', def: 'Level rail screwed across the wall that the vertical standards hang from.', def_es: 'Riel a nivel atornillado a lo largo del muro del que cuelgan los rieles verticales.' },
      { term: 'Standard', term_es: 'Riel vertical', def: 'Slotted vertical strip hung from the track; brackets clip into it at any height.', def_es: 'Tira vertical ranurada que cuelga del riel; los soportes se enganchan a cualquier altura.' },
      { term: 'End cap', term_es: 'Capuchón', def: 'Plastic cap pushed onto cut or exposed wire ends and rod ends so they do not snag clothes or skin.', def_es: 'Tapa de plástico que se coloca en los extremos cortados o expuestos del alambre y del tubo para que no enganchen ropa ni piel.' },
      { term: 'Tower', term_es: 'Torre', def: 'Floor-standing laminate cabinet unit in a closet system; shelves and rods span between towers.', def_es: 'Mueble de laminado apoyado en el piso dentro de un sistema de clóset; las repisas y tubos van entre torres.' },
      { term: 'Toggle bolt', term_es: 'Taquete de mariposa', def: 'Hollow-wall anchor with spring wings that open behind drywall when no stud is available.', def_es: 'Ancla para muro hueco con alas de resorte que se abren detrás de la tablaroca cuando no hay montante.' },
      { term: 'Overhead garage rack', term_es: 'Parrilla elevada de cochera', def: 'Steel storage platform hung from ceiling joists, rated for a posted maximum load.', def_es: 'Plataforma de acero colgada de las vigas del techo, con una carga máxima indicada.' },
      { term: 'Load rating', term_es: 'Capacidad de carga', def: 'The maximum weight the maker says a shelf, cabinet or rack may hold.', def_es: 'El peso máximo que el fabricante indica que puede soportar una repisa, gabinete o parrilla.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'wire_shelving_closet',
      example_title: 'Install wire shelving in bedroom closets and pantry',
      when: { title_re: '\\bclosets?\\b|\\bpantry\\b|\\blinen\\b|\\bshelv(?:es|ing)\\b|\\bwire shel' },
      steps: [
        {
          title: 'Confirm the layout and find the framing',
          instruction: 'Walk each closet, pantry and laundry with the owner or the closet plan: shelf heights, single vs double hang, rod lengths. Mark studs with a stud finder and scan for wiring, ducts and pipes before marking any hole. Remove old shelving and patch the wall if it is a replacement.',
          tools: ['stud finder', 'tape measure', 'pencil'],
          materials: ['closet plan or layout sheet'],
          safety_ids: ['hidden_utilities', 'stepladder'],
          qa_ids: ['layout_owner', 'framing_located'],
        },
        {
          title: 'Snap level lines and drill the clip holes',
          instruction: 'Draw a level line the full length of each shelf. Mark a back wall clip about 2 in. in from each end and the rest at even spacing no wider than the maker allows. Drill the holes — drill only, never hammer — and set screws into studs where a clip lands on one; use the kit anchors only in hollow wall.',
          tools: ['4 ft level', 'drill/driver', 'drill bits'],
          materials: ['wall clips with anchors', 'pan-head screws for stud locations'],
          safety_ids: ['hidden_utilities', 'drill_tool', 'eye_debris', 'stepladder'],
          qa_ids: ['level_true', 'clip_spacing'],
        },
        {
          title: 'Cut the shelves and add end caps',
          instruction: 'Cut shelves to length with a bolt cutter or hacksaw, staying off the front-lip spacers. Push a cap onto every exposed wire end on both sides, and caps on the ends of any rod.',
          tools: ['bolt cutter or hacksaw', 'tape measure'],
          materials: ['shelf end caps', 'rod caps'],
          safety_ids: ['wire_cut', 'eye_debris'],
          qa_ids: ['end_caps'],
        },
        {
          title: 'Hang shelves and set the support brackets',
          instruction: 'Snap the back wire into the clips, then fasten the front support brackets to the wall at the spacing the maker gives — into studs where possible. Where a shelf meets a side wall, add the end bracket or wall clip so the shelf cannot tip.',
          tools: ['drill/driver', 'level'],
          materials: ['support brackets', 'side-wall brackets', 'screws or anchors per wall type'],
          safety_ids: ['falling_shelf', 'drill_tool', 'stepladder'],
          qa_ids: ['anchored_framing', 'load_rating'],
        },
        {
          title: 'Load test and clean up',
          instruction: 'Press down on each shelf and rod near the middle — nothing should sag, rock or pull from the wall. Remove packaging, vacuum drill dust and walk the owner through what each shelf is rated to hold.',
          tools: ['shop vacuum'],
          materials: [],
          safety_ids: ['falling_shelf', 'housekeeping'],
          qa_ids: ['load_rating', 'clean_turnover'],
        },
      ],
    },
    {
      id: 'manufactured_closet_garage_system',
      priority: 10,
      example_title: 'Install custom laminate closet system and garage storage cabinets',
      when: { title_re: 'laminate|melamine|custom closet|closet system|closet organi[sz]|hang[- ]?track|top track|garage[^.]*(?:storage|cabinet|rack|shelv|organi[sz])|overhead (?:storage|rack)|storage rack|slat ?wall' },
      steps: [
        {
          title: 'Check parts against the design and plan placement',
          instruction: 'Inventory every carton against the design sheet before starting and set damaged parts aside. Tape each wall’s design page to that wall and pre-plan where towers, cabinets and racks land. In a garage, mark the garage door track and opener travel, the house entry door swing and the water heater and furnace service space — nothing goes there.',
          tools: ['tape measure', 'pencil', 'utility knife'],
          materials: ['design layout'],
          safety_ids: ['heavy_lift', 'material_stacks'],
          qa_ids: ['layout_owner', 'garage_clearances', 'egress_firedoor'],
        },
        {
          title: 'Mount the track or ledger level into framing',
          instruction: 'Level the hang track or mounting rail at the height on the plan and mark every hole. Drive screws into studs or the header behind the wallboard; at hollow spots use the anchor the maker supplies for that wall thickness; on concrete or block use the specified masonry anchors.',
          tools: ['level', 'stud finder', 'drill/driver', 'hammer drill (masonry)'],
          materials: ['hang track or mounting rail', 'wood screws', 'hollow-wall anchors', 'masonry anchors'],
          safety_ids: ['hidden_utilities', 'drill_tool', 'silica_drilling', 'eye_debris', 'stepladder'],
          qa_ids: ['framing_located', 'level_true', 'anchored_framing'],
        },
        {
          title: 'Assemble and secure towers, cabinets and standards',
          instruction: 'Assemble towers and cabinets on the floor, then stand and level them and fasten each one to the wall as its instructions direct before loading. Hang standards on the track and screw each one to the wall. Two people lift wall cabinets; support them until every screw is in.',
          tools: ['drill/driver', 'level', 'clamps', 'cabinet jack or helper'],
          materials: ['towers or cabinets', 'standards', 'wall-tie hardware', 'shims'],
          safety_ids: ['heavy_lift', 'falling_shelf', 'drill_tool'],
          qa_ids: ['anchored_framing', 'span_limits', 'level_true'],
        },
        {
          title: 'Hang overhead garage racks from the joists',
          instruction: 'Garage racks only: locate wood joists or rafters (never drywall alone, metal or a suspended ceiling), lag the ceiling brackets at the maker’s spacing, assemble the deck on the floor and lift it with two people. Check clearance under it for the garage door, opener and vehicle roof, and post the rated maximum load on the rack.',
          tools: ['stud finder', 'drill/driver', 'socket wrench', 'stepladder'],
          materials: ['overhead rack kit', 'lag screws per manufacturer'],
          safety_ids: ['overhead_rack', 'heavy_lift', 'stepladder', 'drill_tool'],
          qa_ids: ['overhead_joists', 'load_rating', 'garage_clearances'],
        },
        {
          title: 'Fit rods, shelves, drawers and doors; adjust and clean',
          instruction: 'Cut rods to length, keep shelf and rod spans within the maker’s limit, install drawers and doors, then adjust hinges and slides so reveals are even and nothing rubs. Cap every rod and wire end, clear packaging and walk the owner through load ratings.',
          tools: ['pipe cutter or hacksaw', 'screwdriver', 'shop vacuum'],
          materials: ['closet rods', 'rod caps', 'drawer slides', 'door hinges'],
          safety_ids: ['wire_cut', 'housekeeping'],
          qa_ids: ['doors_drawers', 'end_caps', 'span_limits', 'clean_turnover'],
        },
      ],
    },
  ],
  hazards: [
    { id: 'falling_shelf', hazard: 'Loaded shelf, standard or cabinet pulling out of drywall-only anchors and falling on a worker or occupant (struck-by)', hazard_es: PENDING_ES, controls: ['Fasten into studs, blocking or headers wherever possible; use the maker’s hollow-wall anchor only where no framing exists', 'Secure every standard and tower to the wall before loading; never exceed the posted load', 'Pull-test each shelf before turnover'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, ppe: ['safety-toe boots'], prov: oshaDerived('c', 'No 1926 section covers storage-system anchorage; derived from the duty to train on unsafe conditions plus ClosetMaid/elfa warnings (use correct hardware, standards secured, do not overload).') },
    { id: 'overhead_rack', hazard: 'Overhead garage rack or its load falling from the ceiling when lagged into drywall only or overloaded', hazard_es: PENDING_ES, controls: ['Lag brackets into wood joists or rafters only — never drywall, metal or suspended ceilings', 'Keep bracket span within the maker’s limit and post the maximum load on the rack', 'Keep people out from under the rack while lifting it into place'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 4, ppe: ['hard hat', 'safety-toe boots'], prov: oshaDerived('c', 'General accident-prevention program duty; joist-only, span and load limits per Gladiator GearLoft manual.') },
    { id: 'heavy_lift', hazard: 'Back strain or dropped units lifting garage cabinets, laminate towers and rack decks', hazard_es: PENDING_ES, controls: ['Two people (or a cabinet jack) for wall cabinets, towers and rack decks', 'Remove doors, drawers and shelves before lifting', 'Clear the path before carrying'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, ppe: ['gloves', 'safety-toe boots'], prov: oshaDerived('c', 'No 1926 lifting standard; training duty plus the two-person warning in the Gladiator manual.') },
    { id: 'stepladder', hazard: 'Falls from a stepladder while setting top tracks, upper shelves and ceiling racks', hazard_es: PENDING_ES, controls: ['Never stand on the top step or top cap of a stepladder', 'Set the ladder fully open on a level floor and move it rather than reach'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'drill_tool', hazard: 'Wrist injury or shock from drills and drivers that bind or have damaged cords', hazard_es: PENDING_ES, controls: ['Use double-insulated or grounded tools and keep them in safe condition', 'Brace the drill with both hands for large bits and masonry'], controls_es: PENDING_ES, osha_ref: '1926.302(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'wire_cut', hazard: 'Cuts and flying wire ends when cutting wire shelving or rods with bolt cutters or a hacksaw', hazard_es: PENDING_ES, controls: ['Wear safety glasses and gloves when cutting', 'Hold the offcut so it cannot fly; cap cut ends right away'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses', 'cut-resistant gloves'], prov: osha('e') },
    { id: 'eye_debris', hazard: 'Eye injury from drywall, wood and concrete dust when drilling overhead', hazard_es: PENDING_ES, controls: ['Wear safety glasses whenever drilling, especially overhead'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'hidden_utilities', hazard: 'Drilling into live wiring, water or gas lines hidden in closet and garage walls or ceilings', hazard_es: PENDING_ES, controls: ['Scan the wall or ceiling before marking holes; stay off lines above and below outlets and switches', 'Ask about wiring and plumbing routes before drilling; shut off the circuit when work is near it'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(3)', severity: 4, prov: osha('k', 'Ascertain concealed energized circuits; elfa guide warns not to drill into wires, ducts or plumbing.') },
    { id: 'silica_drilling', hazard: 'Breathing silica dust drilling anchor holes in concrete or block garage walls', hazard_es: PENDING_ES, controls: ['Use a hammer drill with dust extraction or follow a Table 1 control for handheld drills', 'Vacuum dust with a HEPA vacuum; never dry-sweep or blow it off'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 3, ppe: ['safety glasses', 'respirator when Table 1 requires'], prov: osha('z') },
    { id: 'cord_shock', hazard: 'Electric shock from extension cords and chargers in garages and unfinished spaces', hazard_es: PENDING_ES, controls: ['Plug into GFCI-protected receptacles', 'Inspect cords daily and pull damaged ones'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'material_stacks', hazard: 'Stacked cartons of panels and cabinets sliding or tipping in the staging area', hazard_es: PENDING_ES, controls: ['Stack cartons flat on a level floor, heaviest at the bottom', 'Keep stacks out of walkways and door swings'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 2, prov: osha('h') },
    { id: 'housekeeping', hazard: 'Trips and cuts from cardboard, straps and wire offcuts left in tight closets', hazard_es: PENDING_ES, controls: ['Break down packaging and pick up offcuts as you go'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 1, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'layout_owner', item: 'Layout (shelf heights, hang sections, tower and cabinet positions) confirmed with the owner or the design sheet before the first hole is drilled.', item_es: tr('Distribución (alturas de repisa, secciones para colgar, posición de torres y gabinetes) confirmada con el dueño o la hoja de diseño antes del primer barreno.'), prov: elfa('Tape each design page to its wall; refer to the custom space design for placement.') },
    { id: 'framing_located', item: 'Studs, headers and ceiling joists located and marked; wall scanned for wiring, ducts and pipes.', item_es: tr('Montantes, cabezales y vigas del techo localizados y marcados; muro revisado para cables, ductos y tuberías.'), prov: elfa() },
    { id: 'anchored_framing', item: 'Tracks, clips, brackets, standards and towers fastened into studs, blocking or headers with the maker’s screws wherever framing exists; maker’s hollow-wall anchors only where it does not; every standard screwed to the wall.', item_es: PENDING_ES, safety: true, prov: { src: ['closets-closetmaid-shelftrack', 'closets-closetmaid-hangtrack', 'closets-elfa-install'], confidence: 'verified', last_verified: D, note: 'Hardware by wall type; stud installation recommended; standards must be secured to the wall.' } },
    { id: 'clip_spacing', item: 'Fixed wire shelving: back wall clips about 2 in. from each end and spaced no wider than the maker allows (ClosetMaid 12 in. max); support brackets at the maker’s spacing.', item_es: PENDING_ES, safety: true, prov: wire('Clips 2 in. in from each end; never more than 12 in. apart.') },
    { id: 'span_limits', item: 'Standards no more than the maker’s spacing apart and close to each shelf end (ShelfTrack: 24 in. / 4 in.); laminate shelf and rod spans between towers within the maker’s maximum.', item_es: PENDING_ES, safety: true, prov: { src: ['closets-closetmaid-shelftrack', 'closets-closetmaid-impressions'], confidence: 'verified', last_verified: D, note: 'ShelfTrack: ≤24 in. apart, ≤4 in. from shelf end. Impressions: span between towers ≤48 in.' } },
    { id: 'load_rating', item: 'No shelf, cabinet or rack loaded past its rating; overhead racks marked with their maximum load and the owner told the limits.', item_es: PENDING_ES, safety: true, prov: { src: ['closets-closetmaid-hangtrack', 'closets-gladiator-gearloft'], confidence: 'verified', last_verified: D, note: 'Do not overload; GearLoft posts a maximum combined load per rack size.' } },
    { id: 'overhead_joists', item: 'Overhead garage rack brackets lagged into wood joists or rafters (not drywall alone, metal or suspended ceilings) within the maker’s bracket span.', item_es: PENDING_ES, safety: true, prov: loft('Wood joists only; 24 in. max span between brackets.') },
    { id: 'level_true', item: 'Tracks, shelves, towers and cabinets level and plumb; tower tops in one plane.', item_es: tr('Rieles, repisas, torres y gabinetes a nivel y a plomo; partes superiores de las torres en un mismo plano.'), prov: elfa('Level the top track before marking holes.') },
    { id: 'end_caps', item: 'Caps on every cut or exposed wire end and on every closet rod end.', item_es: tr('Capuchones en cada extremo de alambre cortado o expuesto y en cada extremo de tubo.'), prov: track('Shelf caps on cut ends; rod caps keep hangers in place.') },
    { id: 'doors_drawers', item: 'Laminate system doors and drawers aligned with even reveals; slides and hinges adjusted so nothing binds or rubs.', item_es: tr('Puertas y cajones del sistema de laminado alineados con separaciones parejas; correderas y bisagras ajustadas para que nada roce ni se trabe.'), prov: est('Common finish practice; follow the maker’s adjustment instructions.') },
    { id: 'egress_firedoor', item: 'Garage storage does not block the house entry door, its self-closer or latch, an exit path, or the electrical panel.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa'], confidence: 'verified', last_verified: D, note: 'IRC R302.5.1 — garage-to-dwelling door must stay self-closing; reference only, no gate (permit_trade null).' } },
    { id: 'garage_clearances', item: 'Nothing mounted in the travel of the garage door, its tracks or opener; water heater and furnace service space left open; racks clear the door, opener and vehicle roof.', item_es: PENDING_ES, safety: true, prov: loft('Recommended ~80 in. minimum height; check clearance of doors and vehicles under the rack.') },
    { id: 'clean_turnover', item: 'Packaging, offcuts and drill dust removed; walls touched up where old shelving came out.', item_es: tr('Empaques, recortes y polvo de barrenos retirados; muros retocados donde se quitaron repisas viejas.'), prov: elfa('Take out old shelving; patch and repaint walls.') },
  ],
  inspection_checklists: {
    layout_verify: [
      { item: 'Design sheet or owner sign-off on shelf heights, hang sections and cabinet positions', item_es: tr('Hoja de diseño o aprobación del dueño de alturas de repisa, secciones para colgar y posición de gabinetes') },
      { item: 'Paint and flooring done in the space (or sequence agreed)', item_es: tr('Pintura y piso terminados en el espacio (o el orden acordado)') },
      { item: 'Garage: door tracks, opener, entry door, water heater and panel zones marked as no-mount', item_es: PENDING_ES },
    ],
    anchor_check: [
      { item: 'Every track, standard, tower and wall cabinet fastened into framing or with the maker’s anchor for that wall type', item_es: PENDING_ES },
      { item: 'Overhead racks lagged into joists within the maker’s span; load limit posted', item_es: PENDING_ES },
    ],
    final_walkthrough: [
      { item: 'Shelves level, ends capped, nothing sags or rocks under a hand load', item_es: tr('Repisas a nivel, extremos con capuchón, nada se cuelga ni se mueve al cargarlo con la mano') },
      { item: 'Doors and drawers operate freely with even reveals', item_es: tr('Puertas y cajones operan libremente con separaciones parejas') },
      { item: 'Owner shown the load ratings and given the maker’s care sheets', item_es: tr('Se mostró al dueño la capacidad de carga y se entregaron las hojas de cuidado del fabricante') },
      { item: 'Space clean, packaging removed', item_es: tr('Espacio limpio, empaques retirados') },
    ],
  },
  assemblies: [
    { code: 'G-CLS-WIRE-LF', name: 'Fixed wire shelving, 12–16 in. deep, with wall clips and support brackets, per LF of shelf', name_es: 'Repisa de alambre fija de 12 a 16 pulg de fondo, con fijadores y soportes, por pie lineal de repisa', unit: 'LF', csi: '10 56 13',
      material_cost_cents: { v: 900, prov: est('ventilated wire shelf + clips/brackets/caps share, national baseline 2026') }, labor_hours_per_unit: { v: 0.15, prov: est('layout, drill clips, cut, cap and bracket') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools only') }, waste_pct: { v: 8, prov: est('cut-off ends on stock lengths') } },
    { code: 'G-CLS-TRACK-LF', name: 'Adjustable hang-track shelving system (track, standards, brackets, ventilated shelves, rod), per LF of wall', name_es: 'Sistema de repisas ajustables de riel colgante (rieles, soportes, repisas, tubo), por pie lineal de muro', unit: 'LF', csi: '10 56 13',
      material_cost_cents: { v: 3500, prov: est('mid-range track system, two shelves + rod per LF, national baseline 2026') }, labor_hours_per_unit: { v: 0.35, prov: est('track into header/studs, secure standards, set brackets and shelves') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('cut-to-fit shelves and rods') } },
    { code: 'G-CLS-LAM-LF', name: 'Laminate/melamine closet system (towers, shelves, rods, drawers), installed, per LF of wall', name_es: 'Sistema de clóset de laminado o melamina (torres, repisas, tubos, cajones), instalado, por pie lineal de muro', unit: 'LF', csi: '10 56 13',
      material_cost_cents: { v: 12000, prov: est('mid-grade melamine system incl. a drawer bank share, national baseline 2026') }, labor_hours_per_unit: { v: 1.0, prov: est('assemble towers, level, tie to wall, rods/shelves, adjust doors and drawers') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 3, prov: est('trim pieces and rod cuts') } },
    { code: 'G-CLS-GARCAB-LF', name: 'Garage cabinet run (wall cabinets + base or tall units), anchored to framing, per LF of wall', name_es: 'Tramo de gabinetes de cochera (de pared + inferiores o altos), anclados a la estructura, por pie lineal', unit: 'LF', csi: '10 56 13',
      material_cost_cents: { v: 22000, prov: est('mid-range steel/laminate garage cabinets, national baseline 2026') }, labor_hours_per_unit: { v: 0.8, prov: est('assemble, two-person hang on rail, level, anchor, adjust') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-CLS-OHRACK-EA', name: 'Overhead garage storage rack, 4×8 ft, lagged to ceiling joists, each', name_es: 'Parrilla elevada de cochera de 4×8 pies, atornillada a las vigas del techo, c/u', unit: 'EA', csi: '10 56 13',
      material_cost_cents: { v: 22000, prov: est('steel ceiling rack kit, national baseline 2026') }, labor_hours_per_unit: { v: 3.0, prov: est('two installers ~1.5 h: locate joists, lag brackets, assemble deck, lift and connect') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
  ],
  dependency_hints: [
    { after_trades: ['painting', 'flooring_carpet', 'flooring_wood', 'flooring_resilient'], before_phase: 'punch', note: 'Install closet and pantry systems after paint and flooring are finished, before punch and final clean.' },
    { after_trades: ['overhead_doors'], note: 'Garage storage goes in after the garage door, tracks and opener are set so their clearances are known.' },
  ],
});
