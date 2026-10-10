// Trade Knowledge Pack — docks_marine_residential (Docks / Boat Lifts / Shoreline, Residential). Wave 07,
// NEW-TRADE pattern (no hand recipe; not in HAND_RECIPE_KEYS). permit_trade null → NO gates, NO code_refs.
// Regulator hold points (WI DNR pier / riprap exemption checks, USACE federal check) live in
// inspection_checklists under descriptive keys.
// Wisconsin rules: the pier exemption is statutory (Wis. Stat. 30.12(1g)(f)) and the implementing code is
// ch. NR 320 (the 2026 DNR Pier Planner and exemption checklists cite NR 320.04 / 320.09 — the former
// NR 326 pier chapter no longer appears in the NR 300 index). Federal: Rivers and Harbors Act Section 10
// (33 CFR 322) via USACE St. Paul District. Electric shock drowning is NFPA 303 / NEC Art. 555 territory —
// cited reference-only in hazards/QA (no code_refs on a null-permit trade).
// No quantity rules: blueprint facts carry no shoreline, pier length or lift data.
// Dossier: docs/trade-packs/dossiers/docks_marine_residential.md.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const v = (src: string[], note?: string) => ({ src, confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const der = (src: string[], note: string) => ({ src, confidence: 'derived' as const, last_verified: D, note });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

const PIER = ['docks_marine_residential-wi-stat-30-12', 'docks_marine_residential-wi-dnr-pier-planner', 'docks_marine_residential-wi-dnr-pier-exempt'];
const RIP = ['docks_marine_residential-wi-dnr-riprap-exempt', 'docks_marine_residential-wi-nr320'];
const DOCK = 'docks_marine_residential-shoremaster-dock';
const LIFT = 'docks_marine_residential-shoremaster-lift';

export default definePack({
  key: 'docks_marine_residential',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Placing and removing seasonal piers and boat lifts for lake and river homes, and armoring eroding shoreline with riprap — sized and placed to stay inside the state pier and riprap exemptions (or under a DNR / Army Corps permit when they do not).',
    summary_es: 'Colocación y retiro de muelles y elevadores de botes de temporada en casas junto a lagos y ríos, y protección de riberas erosionadas con enrocado, con medidas y ubicación dentro de las exenciones estatales para muelles y enrocado (o con permiso del DNR o del Cuerpo de Ingenieros cuando no aplican).',
    glossary: [
      { term: 'Riparian owner', term_es: 'Propietario ribereño', def: 'The owner of land touching the water; only the riparian may place a pier, though a contractor may install it for them.', def_es: 'El dueño del terreno que colinda con el agua; solo el ribereño puede colocar un muelle, aunque un contratista lo instale por él.' },
      { term: 'Riparian zone', term_es: 'Zona ribereña', def: 'The strip of water in front of the property where the owner may place piers, lifts and moored boats; found by extending lot lines or the coterminous method.', def_es: 'La franja de agua frente a la propiedad donde el dueño puede colocar muelles, elevadores y botes amarrados; se define extendiendo los linderos o con el método coterminal.' },
      { term: 'Ordinary high-water mark (OHWM)', term_es: 'Marca ordinaria de aguas altas (OHWM)', def: 'The line on the bank left by the normal high water level; riprap limits and permits are measured from it.', def_es: 'La línea en la orilla que deja el nivel normal de aguas altas; los límites del enrocado y los permisos se miden desde ahí.' },
      { term: 'Pierhead line', term_es: 'Línea de cabeza de muelle', def: 'A length limit set by the town or lake district; no pier may extend past it.', def_es: 'Un límite de largo fijado por el municipio o el distrito del lago; ningún muelle puede pasarla.' },
      { term: 'Boat slip', term_es: 'Atracadero', def: 'One watercraft docked at the pier, including a boat on a lift; the number allowed depends on shoreline frontage.', def_es: 'Una embarcación atracada en el muelle, incluido un bote en elevador; el número permitido depende del frente de ribera.' },
      { term: 'Loading platform', term_es: 'Plataforma de carga', def: 'The wider part of a pier (T or L) used for loading; its area is limited for an exempt pier.', def_es: 'La parte más ancha del muelle (en T o L) usada para cargar; su área está limitada en un muelle exento.' },
      { term: 'Riprap', term_es: 'Enrocado', def: 'A layer of large clean stone placed on a filter layer along the bank to stop wave and current erosion.', def_es: 'Una capa de piedra grande y limpia colocada sobre una capa filtrante a lo largo de la orilla para frenar la erosión por olas y corriente.' },
      { term: 'Filter layer', term_es: 'Capa filtrante', def: 'Filter fabric or clean gravel under riprap that keeps the bank soil from washing out between the stones.', def_es: 'Geotextil o grava limpia bajo el enrocado que evita que la tierra de la orilla se lave entre las piedras.' },
      { term: 'Electric shock drowning', term_es: 'Ahogamiento por descarga eléctrica', def: 'Paralysis and drowning of a swimmer from current leaking into the water from dock or lift wiring.', def_es: 'Parálisis y ahogamiento de un nadador por corriente que se fuga al agua desde el cableado del muelle o del elevador.' },
      { term: 'Summer low water', term_es: 'Nivel bajo de verano', def: 'The usual late-summer water level; pier length to the 3 ft depth is measured at this level.', def_es: 'El nivel normal del agua a fines del verano; el largo del muelle hasta la profundidad de 3 pies se mide a este nivel.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'seasonal_pier_lift_install',
      example_title: 'Install seasonal pier and boat lift',
      priority: 1,
      when: { title_re: '\\bdocks?\\b|\\bpiers?\\b|boat ?lift|boat hoist|\\bwharf|\\bslip' },
      steps: [
        {
          title: 'Confirm the pier fits the exemption or a permit',
          instruction: 'Before ordering parts, check the layout against the state exemption with the owner: inside the riparian zone, no wider than 6 ft, loading platform within the area limit, out only to the 3 ft summer-low depth (or the depth the lift needs), slip count for the frontage, and inside any town pierhead line. If it does not fit, the owner needs a DNR individual permit — and may need an Army Corps permit — before placement.',
          detail: 'Piers placed before April 2012 keep their size and slips. Check local pier ordinances and shoreland zoning too.',
          tools: ['tape measure', 'property survey or plat'],
          materials: ['DNR Pier Planner and exemption checklist', 'site sketch with riparian zone lines'],
          safety_ids: [],
          qa_ids: ['exemption_check'],
        },
        {
          title: 'Sound the bottom and plan leg lengths',
          instruction: 'From a boat or wading in a life jacket, take water depths every 10 ft along the pier line and at both ends of the lift spot, and note soft or rocky bottom. Pick leg lengths with room for water-level change and waves, and foot pads or screw legs for soft bottom.',
          tools: ['sounding pole or depth finder', 'tape measure', 'boat or waders'],
          materials: ['depth log'],
          safety_ids: ['drowning', 'cold_water'],
          qa_ids: ['depth_soundings', 'pfd_ring_buoy'],
        },
        {
          title: 'Decontaminate and stage the equipment',
          instruction: 'Clean and drain all sections, legs, wheels and boats before they go in this lake — remove plants, mud and animals — per the DNR invasive-species protocol. Stage sections on flat ground near the shore, assembled with panels as the manufacturer directs.',
          tools: ['pressure washer or brushes'],
          materials: [],
          safety_ids: ['pinch_crush'],
          qa_ids: ['equipment_decon'],
        },
        {
          title: 'Set the pier sections and level them',
          instruction: 'Work out from shore one section at a time. Fit foot pads, set the legs, and clip each new frame to a frame that already stands on legs — never to an unsupported end. Level each section with the adjustable legs, keep the frames above wave reach, and fully tighten every bolt. Cap unused leg pockets.',
          detail: 'Floating sections: anchor per the manufacturer; foam floats must be coated or enclosed, drums clean and residue-free.',
          tools: ['wrenches', 'level', 'rubber mallet', 'dock wheels or lift-in cart'],
          materials: ['pier sections', 'legs and foot pads', 'connector hardware', 'leg caps'],
          safety_ids: ['drowning', 'cold_water', 'pinch_crush'],
          qa_ids: ['pier_level_tight'],
        },
        {
          title: 'Set and level the boat lift',
          instruction: 'Assemble the lift on shore, roll or float it into place inside the riparian zone, and set the legs so the boat floats on with the bunks under water and still lifts clear. Level the lift so all four corners are within the manufacturer limit; add deep-water braces on long legs. Keep everyone off, in and under the lift and clear of it in the water while it is first run.',
          detail: 'Electric lifts or dock power: a licensed electrician makes the connection with ground-fault protection; never leave cords in the water.',
          tools: ['level', 'wrenches', 'tape measure'],
          materials: ['boat lift', 'bunks or cradle', 'canopy (seasonal)'],
          safety_ids: ['under_raised_lift', 'electric_shock_drowning', 'drowning'],
          qa_ids: ['lift_level', 'lift_power_safe'],
        },
        {
          title: 'Load-test and hand over',
          instruction: 'Raise the owner\'s boat about a foot, stop and check the lift is stable and level, then lift fully and store over-center. Remove the boat and recheck level. Show the owner how to run it, the capacity, and to recheck level in two weeks; pick up any parts dropped on the bottom.',
          tools: ['level'],
          materials: [],
          safety_ids: ['under_raised_lift'],
          qa_ids: ['lift_level', 'site_clean_bottom'],
        },
      ],
    },
    {
      id: 'shoreline_riprap',
      example_title: 'Install shoreline riprap with filter fabric',
      priority: 2,
      when: { title_re: 'rip ?-?rap|shoreline|seawall|shore protect|bank stabili|armor stone' },
      steps: [
        {
          title: 'Confirm the riprap exemption or permit',
          instruction: 'With the owner, check DNR mapping: riprap exemptions are not available on special-interest or public-rights waters. Check the length limit, that the site is a moderate or high wave-energy site, and the fish-spawning no-work window. If anything fails, the owner applies for a DNR general or individual permit and checks with the Army Corps and county zoning before work.',
          detail: 'Biostabilization (native plants, fiber rolls) is preferred on low-energy shores. Projects of 1 acre or more also need construction stormwater coverage.',
          tools: ['tape measure'],
          materials: ['DNR riprap exemption checklist', 'storm-wave height or erosion intensity worksheet'],
          safety_ids: [],
          qa_ids: ['riprap_exemption'],
        },
        {
          title: 'Lay out, locate and set erosion control',
          instruction: 'Stake the OHWM and the riprap toe and top lines; the toe stays close to the OHWM and the top no higher than the exemption allows. Call 811 and mark private lines. Put silt fence or a sediment log between the work and the water, and plan a single stable access path for the machine.',
          tools: ['stakes', 'string line', 'level or laser'],
          materials: ['silt fence or sediment logs'],
          safety_ids: ['utility_strike', 'equipment_rollover'],
          qa_ids: ['toe_and_top_limits'],
        },
        {
          title: 'Shape the bank and place the filter layer',
          instruction: 'Grade the bank to a smooth, flat-enough slope following the natural shoreline contour, keyed into firm soil at the toe. Remove nothing but what the structure needs. Lay filter fabric with overlaps running downhill (or a clean gravel bedding layer) over the full riprap area, pinned so it cannot shift.',
          tools: ['excavator or skid steer', 'rake', 'fabric pins'],
          materials: ['filter fabric', 'clean-washed gravel bedding'],
          safety_ids: ['equipment_rollover', 'struck_by_equipment'],
          qa_ids: ['filter_layer'],
        },
        {
          title: 'Place the stone',
          instruction: 'Set clean fieldstone or quarry stone of the specified size from the toe up, placing (not dumping from height) so stones interlock without tearing the fabric. Keep the face to the planned slope and follow the shore line. Place no soil or other fill below the OHWM.',
          tools: ['excavator with thumb', 'pry bar'],
          materials: ['riprap stone'],
          safety_ids: ['struck_by_equipment', 'equipment_rollover', 'drowning'],
          qa_ids: ['stone_size', 'toe_and_top_limits'],
        },
        {
          title: 'Revegetate and restore',
          instruction: 'Seed and mulch all exposed soil right away and plant native grasses, shrubs or live stakes on the disturbed bank above storm-wave height. Restore the access path, remove sediment controls once the ground is stable, and decontaminate the machine before it leaves.',
          tools: ['rake', 'spade'],
          materials: ['native seed and plants', 'mulch', 'erosion mat where steep'],
          safety_ids: [],
          qa_ids: ['revegetation', 'equipment_decon'],
        },
      ],
    },
    {
      id: 'seasonal_removal',
      example_title: 'Remove dock and boat lift for winter',
      priority: 3,
      when: { title_re: '(remov|take.?out|winteriz|haul.?out|\\bpull).*(dock|pier|lift|wharf)|(dock|pier|lift|wharf).*(remov|take.?out|winteriz|haul.?out)' },
      steps: [
        {
          title: 'Plan the take-out before freeze-up',
          instruction: 'Schedule removal before ice forms; ice heave wrecks legs and lifts left in the water. Never walk or drive on new or thin ice to reach a pier. Have life jackets, a throw ring and a second person on every take-out.',
          tools: ['throw ring with line'],
          materials: [],
          safety_ids: ['thin_ice', 'cold_water', 'drowning'],
          qa_ids: ['before_freeze', 'pfd_ring_buoy'],
        },
        {
          title: 'Shut off power and lower the lift',
          instruction: 'Remove the boat. Shut off and lock out power to any electric lift, light or dock outlet and tag it. Lower an empty lift, disconnect hydraulics only with no boat and the lift down, and take the canopy off — seasonal shelters must be out by the date the exemption sets.',
          tools: ['lock and tag', 'wrenches'],
          materials: [],
          safety_ids: ['lift_energy', 'electric_shock_drowning', 'under_raised_lift'],
          qa_ids: ['power_locked_out'],
        },
        {
          title: 'Pull the lift and pier sections',
          instruction: 'Roll or float the lift to shore. Take the pier apart from the far end back to shore, unclipping each frame while its own legs still hold it. Retrieve every leg, pad and fallen part from the bottom.',
          tools: ['dock wheels or lift-out cart', 'wrenches', 'winch'],
          materials: [],
          safety_ids: ['pinch_crush', 'drowning', 'cold_water'],
          qa_ids: ['site_clean_bottom'],
        },
        {
          title: 'Inspect and store',
          instruction: 'Check frames, panels, bolts, pivots and cables for wear or damage and list repairs for the owner. Stack panels flat and dry above flood level, store the hydraulic box indoors, and leave the shore ready for spring.',
          tools: ['wrenches'],
          materials: ['blocking for storage'],
          safety_ids: ['pinch_crush'],
          qa_ids: ['before_freeze'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'rip ?-?rap|shoreline|seawall|shore protect|bank stabili|armor stone' }, type: 'excavator', reason: 'Shape the bank and place riprap stone one piece at a time without dumping from height' },
    { when: { title_re: 'rip ?-?rap|shoreline|seawall|shore protect|bank stabili|armor stone' }, type: 'dump_truck', reason: 'Deliver riprap stone and bedding gravel to the shore staging area' },
    { when: { title_re: 'rip ?-?rap|shoreline|seawall|shore protect|bank stabili|armor stone' }, type: 'skid_steer', reason: 'Move stone and fabric rolls from staging to the excavator on tight lake lots', optional: true },
  ],
  hazards: [
    { id: 'drowning', hazard: 'Drowning after falling off a pier, boat or bank, or being swept off footing while wading', hazard_es: PENDING_ES, controls: ['Wear a Coast Guard-approved life jacket or work vest whenever working over or next to the water', 'Inspect vests before and after each use; do not use a damaged one', 'Keep a ring buoy with line ready and a boat available for rescue', 'Never work on the water alone'], controls_es: PENDING_ES, osha_ref: '1926.106(a)', severity: 4, ppe: ['life jacket or buoyant work vest'], prov: v(['ecfr-1926-e']) },
    { id: 'cold_water', hazard: 'Cold-water shock and hypothermia during spring put-in and fall take-out', hazard_es: PENDING_ES, controls: ['Wear a life jacket — cold shock makes even strong swimmers go under', 'Wear waders or a dry or wet suit for long time in cold water and rotate crew out to warm up', 'Train the crew to recognize hypothermia and get a worker out and warm at once'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 4, ppe: ['life jacket', 'waders or immersion suit'], prov: der(['ecfr-1926-c', 'ecfr-1926-e'], '1926 has no cold-water rule; training duty 1926.21(b)(2) with PFD use per 1926.106(a).') },
    { id: 'thin_ice', hazard: 'Breaking through new or thin ice while reaching a pier or lift late in the season', hazard_es: PENDING_ES, controls: ['Remove piers and lifts before freeze-up; do not walk or drive on new ice', 'Keep a ring buoy with at least 90 ft of line on shore whenever work is next to open or iced water', 'Mark any aerator or work holes in the ice'], controls_es: PENDING_ES, osha_ref: '1926.106(c)', severity: 4, ppe: ['life jacket', 'ice picks'], prov: v(['ecfr-1926-e', 'docks_marine_residential-wi-dnr-ice']) },
    { id: 'electric_shock_drowning', hazard: 'Electric shock or electric shock drowning from faulty lift, dock light or outlet wiring leaking current into the water', hazard_es: PENDING_ES, controls: ['Have a licensed electrician wire lifts and dock power with ground-fault protection (NEC Art. 555 / NFPA 303 — reference)', 'Turn power off at shore before anyone enters the water near the dock', 'Never let cords or plugs lie in the water; use ground-fault protected cords for tools'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: der(['ecfr-1926-k', 'nfpa-fa'], 'De-energize/guard per 1926.416(a)(1) and GFCI per 1926.404(b)(1); NEC 555 and NFPA 303 cited reference-only.') },
    { id: 'lift_energy', hazard: 'A lift motor or hydraulic unit started while someone is working on the lift', hazard_es: PENDING_ES, controls: ['Shut off power and lock and tag it at the shore disconnect before service', 'Disconnect hydraulic hoses only with the lift down and no boat on it'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 3, prov: v(['ecfr-1926-k', LIFT]) },
    { id: 'under_raised_lift', hazard: 'Crushed under a raised boat, cradle or a lift that settles or tips on an uneven bottom', hazard_es: PENDING_ES, controls: ['Nobody on, in or under the lift while it moves; keep people in the water well clear', 'Level the lift on a firm bottom and recheck after the first load', 'Never go under a raised boat — the lift is not a work stand; block it if work underneath cannot be avoided'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(3)(i)', severity: 4, prov: v(['ecfr-1926-o', LIFT]) },
    { id: 'pinch_crush', hazard: 'Hands and feet pinched or crushed between dock frames, legs and connectors, or by a section that drops off its supports', hazard_es: PENDING_ES, controls: ['Clip a new frame only to a frame already standing on its legs', 'Use two people or a cart for each section; keep fingers out of connector clips and leg pockets', 'Wear work gloves and non-slip footwear'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['work gloves', 'non-slip footwear', 'safety glasses'], prov: der(['ecfr-1926-e', DOCK], 'PPE duty 1926.95(a); supported-frame rule from manufacturer instructions.') },
    { id: 'equipment_rollover', hazard: 'Excavator or skid steer sliding or tipping into the water from a soft, wet or sloped bank', hazard_es: PENDING_ES, controls: ['Work from a stable, level pad well back from the edge; mat soft ground', 'Set the parking brake and chock or ground the bucket when parked on any slope', 'Wear the seat belt in ROPS-equipped machines'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(3)(ii)', severity: 4, prov: v(['ecfr-1926-o']) },
    { id: 'struck_by_equipment', hazard: 'Workers struck by a swinging or backing machine, or by riprap stone rolling or dropping from the bucket', hazard_es: PENDING_ES, controls: ['Keep ground workers out of the swing radius and below-slope fall line while stone is placed', 'Backing machines have a working alarm or a signal person', 'Place stone — do not drop it from height'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 3, ppe: ['hard hat', 'high-visibility vest', 'steel-toe boots'], prov: v(['ecfr-1926-o']) },
    { id: 'utility_strike', hazard: 'Hitting buried electric, gas or communication lines (including dock and lift feeds) while grading the bank or keying the toe', hazard_es: PENDING_ES, controls: ['Call 811 and wait for marks before digging', 'Mark private shore power and irrigation lines with the owner; hand-dig near marks'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 3, prov: v(['ecfr-1926-p']) },
  ],
  qa_checklist: [
    { id: 'exemption_check', item: 'Pier meets the state exemption: inside the riparian zone, 6 ft max width, platform within the area limit, out to 3 ft summer-low or lift depth, inside any pierhead line, slips within the frontage count — or DNR permit in hand.', item_es: tr('El muelle cumple la exención estatal: dentro de la zona ribereña, máximo 6 pies de ancho, plataforma dentro del límite de área, hasta 3 pies en nivel bajo de verano o la profundidad del elevador, dentro de la línea de cabeza de muelle y atracaderos según el frente — o hay permiso del DNR.'), prov: v([...PIER, 'docks_marine_residential-wi-stat-30-13', 'docks_marine_residential-wi-dnr-pier-faq', 'docks_marine_residential-wi-nr320']) },
    { id: 'depth_soundings', item: 'Depths logged about every 10 ft along the pier line and at both ends of the lift; leg lengths allow for water-level change and waves.', item_es: tr('Profundidades registradas cada 10 pies aproximadamente a lo largo del muelle y en ambos extremos del elevador; el largo de las patas permite cambios de nivel y oleaje.'), prov: v([DOCK, LIFT]) },
    { id: 'pfd_ring_buoy', item: 'Every worker over or next to the water wears an inspected Coast Guard-approved life jacket; a ring buoy with line and a rescue boat are ready.', item_es: PENDING_ES, safety: true, prov: v(['ecfr-1926-e']) },
    { id: 'equipment_decon', item: 'Sections, legs, lifts, boats and machines cleaned and drained of plants, mud and animals before and after use on this waterbody.', item_es: tr('Secciones, patas, elevadores, botes y máquinas limpios y drenados de plantas, lodo y animales antes y después de usarlos en este cuerpo de agua.'), prov: v(['docks_marine_residential-wi-dnr-disinfection', 'docks_marine_residential-wi-dnr-pier-exempt']) },
    { id: 'pier_level_tight', item: 'Pier sections level, every frame clipped to a leg-supported frame, all bolts fully tightened, frames above wave reach, unused leg pockets capped; floats coated or enclosed and water flows freely under the pier.', item_es: tr('Secciones del muelle niveladas, cada marco sujeto a un marco apoyado en patas, todos los pernos bien apretados, marcos fuera del alcance de las olas y huecos de patas sin usar tapados; flotadores recubiertos o encapsulados y el agua pasa libre bajo el muelle.'), prov: v([DOCK, 'docks_marine_residential-wi-dnr-pier-planner']) },
    { id: 'lift_level', item: 'Boat lift on firm bottom with all four corners within the manufacturer\'s level tolerance; deep-water braces fitted on long legs; level rechecked after the first load; stored over-center.', item_es: PENDING_ES, safety: true, prov: v([LIFT]) },
    { id: 'lift_power_safe', item: 'Lift and dock power installed by a licensed electrician with ground-fault protection; no cords in the water; shore disconnect labeled.', item_es: PENDING_ES, safety: true, prov: der(['nfpa-fa', 'ecfr-1926-k'], 'NEC Art. 555 / NFPA 303 concepts, reference only; GFCI for temporary tool power per 1926.404(b)(1).') },
    { id: 'riprap_exemption', item: 'Riprap confirmed exempt (not special-interest or public-rights waters, within length limit, moderate/high energy site, outside the fish-spawning window) or covered by a DNR permit and any Army Corps authorization.', item_es: tr('Enrocado confirmado como exento (no en aguas de interés especial ni de derechos públicos, dentro del límite de largo, sitio de energía media o alta, fuera del periodo de desove) o cubierto por permiso del DNR y autorización del Cuerpo de Ingenieros si aplica.'), prov: v([...RIP, 'docks_marine_residential-wi-dnr-shoreline', 'docks_marine_residential-ecfr-33-322']) },
    { id: 'toe_and_top_limits', item: 'Riprap toe no more than 8 ft waterward of the OHWM and top no higher than 36 in. above it or the storm-wave height, whichever is greater; follows the natural shore line.', item_es: tr('Pie del enrocado a no más de 8 pies hacia el agua desde la OHWM y la parte superior no más de 36 pulgadas sobre ella o la altura de ola de tormenta, lo que sea mayor; sigue la línea natural de la orilla.'), prov: v(RIP) },
    { id: 'stone_size', item: 'Riprap is clean fieldstone or quarry stone between 6 and 48 in., placed to interlock; no soil or other fill below the OHWM.', item_es: tr('El enrocado es piedra de campo o de cantera limpia de entre 6 y 48 pulgadas, colocada para trabarse; sin tierra ni otro relleno bajo la OHWM.'), prov: v(RIP) },
    { id: 'filter_layer', item: 'Filter fabric or clean-washed gravel bedding covers the full riprap area under the stone, untorn and pinned.', item_es: tr('El geotextil o la cama de grava lavada cubre toda el área del enrocado bajo la piedra, sin roturas y fijado.'), prov: v(RIP) },
    { id: 'revegetation', item: 'Exposed soil seeded and mulched right away; disturbed bank above storm-wave height planted with native vegetation.', item_es: tr('Tierra expuesta sembrada y cubierta con mantillo de inmediato; la orilla alterada sobre la altura de ola de tormenta plantada con vegetación nativa.'), prov: v([...RIP, 'docks_marine_residential-wi-dnr-pier-exempt']) },
    { id: 'before_freeze', item: 'Seasonal pier, lift canopy and lift (where ice forms) out of the water before freeze-up; seasonal boat shelters removed by the exemption date.', item_es: tr('Muelle de temporada, toldo y elevador (donde se forma hielo) fuera del agua antes de la congelación; refugios de botes de temporada retirados antes de la fecha de la exención.'), prov: v(['docks_marine_residential-wi-dnr-ice', 'docks_marine_residential-wi-dnr-pier-planner', DOCK]) },
    { id: 'power_locked_out', item: 'Power to lifts, lights and dock outlets shut off, locked and tagged before removal or service.', item_es: PENDING_ES, safety: true, prov: v(['ecfr-1926-k']) },
    { id: 'site_clean_bottom', item: 'All legs, pads, caps, hardware and debris retrieved from the lake bottom and shore.', item_es: tr('Todas las patas, bases, tapas, tornillería y escombros recuperados del fondo del lago y de la orilla.'), prov: v([DOCK]) },
  ],
  inspection_checklists: {
    dnr_pier_exemption_check: [
      { item: 'Pier inside the riparian zone and not interfering with neighbors or public use', item_es: tr('Muelle dentro de la zona ribereña y sin interferir con vecinos ni con el uso público'), ref: 'NR 320.09; Wis. Stat. 30.12(1g)' },
      { item: 'Width, loading-platform area, length and slip count within the exemption', item_es: tr('Ancho, área de plataforma de carga, largo y número de atracaderos dentro de la exención'), ref: 'Wis. Stat. 30.12(1g)(f)' },
      { item: 'Inside any municipal pierhead line and compliant with local pier ordinances', item_es: tr('Dentro de la línea municipal de cabeza de muelle y conforme a las ordenanzas locales'), ref: 'Wis. Stat. 30.13(2)-(3)' },
      { item: 'Any sand/gravel/stone deposit under 2 CY and limited to the structure footprint', item_es: tr('Cualquier depósito de arena, grava o piedra menor de 2 yardas cúbicas y limitado a la huella de la estructura'), ref: 'Wis. Stat. 30.12(1g)(a)' },
      { item: 'Otherwise: DNR individual permit received before placement', item_es: tr('De lo contrario: permiso individual del DNR recibido antes de colocar'), ref: 'DNR ePermitting' },
    ],
    riprap_exemption_check: [
      { item: 'Waterbody not mapped as an Area of Special Natural Resource Interest or Public Rights Feature', item_es: tr('El cuerpo de agua no está mapeado como Área de Interés Especial de Recursos Naturales ni Rasgo de Derechos Públicos'), ref: 'NR 320.04(12)' },
      { item: 'Length within the exemption (200 LF inland / 300 LF Great Lakes for new riprap) and site energy documented', item_es: tr('Largo dentro de la exención (200 pies lineales en aguas interiores / 300 en los Grandes Lagos para enrocado nuevo) y energía del sitio documentada'), ref: 'Wis. Stat. 30.12(1g)(jm)' },
      { item: 'Fish-timing window respected or waiver received', item_es: tr('Periodo de protección de peces respetado o dispensa recibida'), ref: 'DNR riprap exemption checklist' },
      { item: 'Stone size, toe and top limits, filter layer and native revegetation per checklist', item_es: tr('Tamaño de piedra, límites del pie y de la parte superior, capa filtrante y revegetación nativa según la lista'), ref: 'DNR riprap exemption checklist' },
      { item: 'Otherwise: DNR general or individual permit received before work', item_es: tr('De lo contrario: permiso general o individual del DNR recibido antes del trabajo'), ref: 'NR 320' },
    ],
    usace_federal_check: [
      { item: 'Owner confirmed with USACE St. Paul District whether the pier, lift or riprap needs federal authorization (Section 10 / Section 404)', item_es: tr('El dueño confirmó con el Distrito St. Paul del USACE si el muelle, el elevador o el enrocado requieren autorización federal (Sección 10 / Sección 404)'), ref: '33 CFR 322' },
      { item: 'County shoreland zoning and local permits checked', item_es: tr('Zonificación costera del condado y permisos locales revisados') },
    ],
    seasonal_install_handover: [
      { item: 'Crew wore life jackets; ring buoy and rescue boat on site', item_es: PENDING_ES, ref: '29 CFR 1926.106' },
      { item: 'Pier level, bolts tight, frames above waves', item_es: tr('Muelle nivelado, pernos apretados, marcos sobre las olas') },
      { item: 'Lift level, load-tested, stored over-center; owner shown operation and capacity', item_es: PENDING_ES },
      { item: 'Electrical connections made by a licensed electrician with ground-fault protection', item_es: PENDING_ES, ref: 'NFPA 303 / NEC 555 (reference)' },
      { item: 'Equipment decontaminated before and after', item_es: tr('Equipo descontaminado antes y después'), ref: 'NR 40' },
    ],
    fall_removal_check: [
      { item: 'Removal done before freeze-up; nobody on new ice', item_es: PENDING_ES },
      { item: 'Power locked and tagged out before work', item_es: PENDING_ES, ref: '29 CFR 1926.417' },
      { item: 'All parts retrieved from the bottom; sections stored flat and dry', item_es: tr('Todas las piezas recuperadas del fondo; secciones guardadas planas y secas') },
      { item: 'Repair list given to the owner', item_es: tr('Lista de reparaciones entregada al dueño') },
    ],
  },
  assemblies: [
    { code: 'G-DOCK-SECT-LF', name: 'Seasonal sectional pier, aluminum frame with decking, 4 ft wide — supply and install, per LF', name_es: 'Muelle seccional de temporada de aluminio, 4 pies de ancho — suministro e instalación, por pie lineal', unit: 'LF', csi: '35 51 00',
      material_cost_cents: { v: 30000, prov: est('Sections, legs, pads and hardware, residential aluminum sectional pier, 2026 national baseline; decking type swings it widely') },
      labor_hours_per_unit: { v: 0.35, prov: est('2-person crew sets ~40 LF in about 7 crew-hours incl. leveling') },
      equipment_cost_cents: { v: 0, prov: est('hand tools and dock wheels') }, waste_pct: { v: 0, prov: est('manufactured sections') } },
    { code: 'G-DOCK-LIFT-SET-EA', name: 'Boat lift assemble, set and level (lift supplied separately), each', name_es: 'Armado, colocación y nivelación de elevador de botes (elevador suministrado aparte), c/u', unit: 'EA', csi: '35 51 00',
      material_cost_cents: { v: 0, prov: est('lift purchased by owner or priced as a separate line') },
      labor_hours_per_unit: { v: 6, prov: est('2-person crew: shore assembly, float or roll in, level, first load test') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; boat supplied by crew') }, waste_pct: { v: 0, prov: est('counted each') } },
    { code: 'G-DOCK-SVC-INOUT-EA', name: 'Seasonal pier and lift put-in or take-out service (typical 40 ft pier + 1 lift), per visit', name_es: 'Instalación o retiro de temporada de muelle y elevador (muelle de 40 pies + 1 elevador), por visita', unit: 'EA', csi: '35 51 00',
      material_cost_cents: { v: 0, prov: est('no material; repairs priced separately') },
      labor_hours_per_unit: { v: 5, prov: est('2-person crew about 2.5 hours on a typical residential pier and lift') },
      equipment_cost_cents: { v: 5000, prov: est('truck, trailer, work boat or lift-out cart share') }, waste_pct: { v: 0, prov: est('counted each') } },
    { code: 'G-DOCK-RIPRAP-CY', name: 'Shoreline riprap, clean field or quarry stone placed on prepared bank, per CY', name_es: 'Enrocado de ribera, piedra de campo o de cantera limpia colocada sobre la orilla preparada, por yarda cúbica', unit: 'CY', csi: '35 31 19',
      material_cost_cents: { v: 6500, prov: der(['excavation-wisdot-aup'], 'WisDOT AUP 606.0100 Riprap Light in place $100.58/$83.54/$134.48 per CY FY23–25; ~55% assigned to delivered stone. Residential lake-lot access costs more.') },
      labor_hours_per_unit: { v: 0.6, prov: est('operator + laborer placing stone piece by piece at roughly 3–4 CY/hr crew output') },
      equipment_cost_cents: { v: 3000, prov: der(['excavation-wisdot-aup'], 'Excavator with thumb share, from the equipment portion of WisDOT 606.0100 in-place price') },
      waste_pct: { v: 10, prov: est('settling, chinking and over-place') } },
    { code: 'G-DOCK-FILTER-SY', name: 'Riprap filter layer — nonwoven filter fabric pinned under riprap, per SY', name_es: 'Capa filtrante para enrocado — geotextil no tejido fijado bajo el enrocado, por yarda cuadrada', unit: 'SY', csi: '31 32 19',
      material_cost_cents: { v: 250, prov: der(['excavation-wisdot-aup'], 'WisDOT AUP 645.0130 Geotextile Type R $5.10/$2.67/$4.51 per SY in place FY23–25; fabric + pins share') },
      labor_hours_per_unit: { v: 0.02, prov: est('lay and pin roughly 50 SY per crew-hour') },
      equipment_cost_cents: { v: 0, prov: est('hand placed') },
      waste_pct: { v: 15, prov: est('overlaps and trim along the contour') } },
  ],
  dependency_hints: [
    { after_trades: ['erosion_control'], note: 'Shoreline riprap and pier work start only after sediment controls are in place between the work and the water.' },
  ],
});
