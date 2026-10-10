// Trade Knowledge Pack — hauling (Hauling / Dumpsters). Wave 06 — NEW-TRADE pattern: no hand recipe in
// task-buildout/nopermit.ts (hauling falls to the generic no-permit step today).
// Scope: roll-off dumpster service (spot, load, swap, pull), C&D debris haul-off and disposal, and
// aggregate / fill delivery by dump truck. Demolition itself stays with `demolition`; hazardous-material
// removal (asbestos, lead) with `abatement`.
// permit_trade null → NO gates, NO code_refs; owner/GC checkpoints live in inspection_checklists.
// Dossier: docs/trade-packs/dossiers/hauling.md. Sources: 29 CFR 1926 C/D/E/G/H/O/Z, 49 CFR 393 Subpart I,
// WI DNR C&D debris + demolished-structures + landfill-ban pages, EPA C&D materials page, City of Madison
// Street Occupancy Permit (Dane County example).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const oshaDerived = (sub: string, note: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'derived' as const, last_verified: D, note });
const cargo = (note?: string) => ({ src: ['hauling-ecfr-49-393-i'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const dnr = (note?: string) => ({ src: ['hauling-wi-dnr-cd-debris', 'hauling-wi-dnr-structures'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ban = (note?: string) => ({ src: ['hauling-wi-dnr-banned'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'hauling',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Supplies and services roll-off dumpsters, hauls construction and demolition debris to a licensed landfill or recycler, and delivers aggregate and fill by dump truck. Covers container sizing and placement, street permits, safe backing and tipping, loading rules (no hazardous or banned items, nothing above the rim), covered loads, and the disposal tickets the job keeps.',
    summary_es: 'Suministra y da servicio a contenedores roll-off, acarrea escombro de construcción y demolición a sitios con licencia y entrega agregado y relleno en camión de volteo. Incluye tamaño y ubicación del contenedor, permisos de calle, reversa y volteo seguros, reglas de carga, cargas cubiertas y boletos de disposición.',
    glossary: [
      { term: 'Roll-off container', term_es: 'Contenedor roll-off', def: 'Open-top steel dumpster that a hook or cable truck rolls on and off its bed; sized in cubic yards (10, 20, 30, 40).', def_es: 'Contenedor de acero sin tapa que un camión de gancho o cable sube y baja de su plataforma; se mide en yardas cúbicas (10, 20, 30, 40).' },
      { term: 'Swap', term_es: 'Cambio', def: 'Hauler pulls a full container and drops an empty one in the same spot in one trip.', def_es: 'El transportista se lleva un contenedor lleno y deja uno vacío en el mismo lugar en un solo viaje.' },
      { term: 'Pull (haul)', term_es: 'Retiro (viaje)', def: 'One trip taking a full container to the disposal site and back; roll-off pricing is per haul.', def_es: 'Un viaje llevando un contenedor lleno al sitio de disposición y de regreso; el precio del roll-off es por viaje.' },
      { term: 'Tipping fee', term_es: 'Cuota de descarga', def: 'What the landfill or transfer station charges to accept a load, usually per ton by scale weight.', def_es: 'Lo que cobra el relleno sanitario o la estación de transferencia por recibir una carga, normalmente por tonelada pesada en báscula.' },
      { term: 'Scale ticket', term_es: 'Boleto de báscula', def: 'Receipt from the disposal or recycling site showing date, weight and material; the record for diversion reports.', def_es: 'Recibo del sitio de disposición o reciclaje con fecha, peso y material; es el registro para los reportes de desvío.' },
      { term: 'C&D debris', term_es: 'Escombro de construcción y demolición', def: 'Construction and demolition waste — wood, shingles, drywall, concrete, brick, metal; regulated as solid waste.', def_es: 'Desecho de construcción y demolición — madera, tejas, tablaroca, concreto, ladrillo, metal; regulado como residuo sólido.' },
      { term: 'Clean fill', term_es: 'Relleno limpio', def: 'Clean soil, brick, stone, unpainted concrete and untreated wood that state rules exempt from landfill disposal when placed correctly.', def_es: 'Tierra limpia, ladrillo, piedra, concreto sin pintar y madera sin tratar que las reglas estatales exentan del relleno sanitario si se coloca correctamente.' },
      { term: 'Level full', term_es: 'Lleno al ras', def: 'Debris no higher than the container rim — the limit for a container to be hauled.', def_es: 'Escombro no más alto que el borde del contenedor — el límite para que se pueda transportar.' },
      { term: 'Tarp', term_es: 'Lona', def: 'Cover pulled over a container or truck box so nothing blows or falls out on the road.', def_es: 'Cubierta que se jala sobre el contenedor o la caja del camión para que nada vuele ni caiga en el camino.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'roll_off_dumpster_service',
      example_title: 'Roll-off dumpster service — deliver, swap and final pull',
      when: { title_re: 'dumpster|roll[- ]?off|(?:waste|trash|debris|refuse) (?:container|bin)|construction waste|waste management' },
      steps: [
        {
          title: 'Size the container and pick the spot',
          instruction: 'Pick the container size from the scope (heavy concrete and shingles in a small box, bulky framing waste in a large one). Choose a spot the truck can reach in a straight line with room to tip the bed: firm and level, clear of overhead wires, trees and eaves, and not blocking egress or the drive. If the spot is in the street, terrace, sidewalk or alley, apply for the city right-of-way permit a week ahead.',
          tools: ['tape measure', 'marking paint or cones'],
          materials: ['site plan with container spot', 'right-of-way permit (if in the street)'],
          safety_ids: ['overhead_lines', 'street_traffic'],
          qa_ids: ['container_sized', 'row_permit', 'placement_clearance'],
        },
        {
          title: 'Protect the surface and set the container',
          instruction: 'Lay boards or plywood under the rails and rollers on a driveway or pavement. Back the truck in only with the backup alarm working or a spotter in sight of the driver, and keep everyone out of the path and away from the rising bed and cable. Set the container level, then post cones, reflectors or lights if it sits in or near traffic overnight.',
          tools: ['hand signals or radio', 'cones', 'reflective barricades'],
          materials: ['2x lumber or 3/4 in. plywood runners', 'warning lights or reflectors (street placement)'],
          safety_ids: ['backing_truck', 'raised_bed', 'overhead_lines', 'street_traffic'],
          qa_ids: ['surface_protected', 'street_marked'],
        },
        {
          title: 'Load it right',
          instruction: 'Keep heavy debris low and spread the load evenly; break down bulky pieces. Nothing above the rim. Keep out hazardous and banned items: suspect asbestos, lead-painted demolition debris the landfill will not take, paint and solvents, batteries, tires, appliances, electronics, cardboard and yard waste. Separate clean concrete, brick, metal and clean wood into their own container where a recycler takes them. Drop debris from upper floors through an enclosed chute.',
          tools: ['debris chute (upper floors)', 'wheelbarrow', 'pry bar'],
          materials: ['separate containers or bins for recyclables'],
          safety_ids: ['manual_handling', 'sharp_debris', 'chute_drop', 'hazardous_waste', 'overfill'],
          qa_ids: ['no_prohibited', 'not_overfilled', 'recyclables_split'],
        },
        {
          title: 'Swap before it overflows',
          instruction: 'Watch the fill level and call for the swap when the container is about three-quarters full so debris does not pile up around it. Before pickup, knock down anything above the rim, pull out any banned item that got in, and tarp the container when the hauler or the load needs it.',
          tools: ['tarp straps'],
          materials: ['container tarp'],
          safety_ids: ['overfill', 'backing_truck', 'raised_bed'],
          qa_ids: ['swap_scheduled', 'covered_load', 'not_overfilled'],
        },
        {
          title: 'Final pull, tickets and cleanup',
          instruction: 'Schedule the final pull after the last debris-heavy trade. Get the scale ticket for every haul and file it with the job. Check the drive, curb and lawn under the container for damage, pick up spilled debris and nails with a magnet sweeper, and take down the street signs and close the permit.',
          tools: ['magnetic sweeper', 'broom', 'shovel'],
          materials: [],
          safety_ids: ['sharp_debris', 'backing_truck'],
          qa_ids: ['tickets_kept', 'site_restored'],
        },
      ],
    },
    {
      id: 'debris_haul_off',
      priority: 5,
      example_title: 'Haul off demolition debris and dispose at C&D landfill',
      when: { title_re: 'haul[- ]?(?:off|away|out)|debris (?:removal|haul)|(?:waste|junk|trash|rubbish) removal|clean[- ]?out|load[- ]?out|disposal' },
      steps: [
        {
          title: 'Sort and screen the debris',
          instruction: 'Before loading, pull out anything that cannot go to a C&D landfill: suspect asbestos (stop and get it tested), mercury thermostats and lamps, refrigerant appliances, batteries, tires, paint, solvents and oily waste. Split clean concrete, brick, metal and clean wood for recycling or clean fill and keep cardboard and brush out of the trash load.',
          tools: ['gloves', 'separate bins or piles'],
          materials: ['covered metal can for oily rags and solvent waste'],
          safety_ids: ['hazardous_waste', 'sharp_debris', 'manual_handling'],
          qa_ids: ['no_prohibited', 'recyclables_split'],
        },
        {
          title: 'Load the truck safely',
          instruction: 'Load with a skid steer or loader where possible. The driver stays in a cab with a shield or out of reach while a machine loads over the truck; nobody stands between the machine and the truck. Spread the load, keep it below the box sides and do not exceed the truck rating. Chock the wheels and set the brake on any slope.',
          tools: ['skid steer or loader', 'wheel chocks'],
          materials: [],
          safety_ids: ['loader_over_truck', 'backing_truck', 'rollaway', 'manual_handling'],
          qa_ids: ['not_overfilled'],
        },
        {
          title: 'Cover and secure the load',
          instruction: 'Tarp loose or light debris so nothing can blow, spill or fall on the road, and tie down any long pieces that could shift. Check the tailgate latch before leaving.',
          tools: ['tarp system or straps'],
          materials: ['tarp', 'ratchet straps'],
          safety_ids: ['tailgate', 'overfill'],
          qa_ids: ['covered_load'],
        },
        {
          title: 'Deliver to the right facility and keep the ticket',
          instruction: 'Take each load to the site licensed for that material (C&D landfill, recycler or clean-fill site); never bury or burn it on the job. Dump only with the bed clear of overhead wires and everyone clear of the tailgate. Keep the scale ticket for every load.',
          tools: [],
          materials: [],
          safety_ids: ['raised_bed', 'overhead_lines', 'tailgate'],
          qa_ids: ['licensed_facility', 'tickets_kept'],
        },
        {
          title: 'Leave the pickup area clean',
          instruction: 'Sweep up spilled debris and nails where the truck loaded and on the street out front, and clean any mud tracked onto the road.',
          tools: ['broom', 'shovel', 'magnetic sweeper'],
          materials: [],
          safety_ids: ['sharp_debris', 'street_traffic'],
          qa_ids: ['site_restored'],
        },
      ],
    },
    {
      id: 'aggregate_fill_delivery',
      priority: 5,
      example_title: 'Deliver gravel base and fill by dump truck',
      when: { title_re: '(?:deliver(?:y)?|haul[- ]?in|truck(?:ing)?)\\b.*\\b(?:gravel|stone|aggregate|fill|topsoil|sand|base course|breaker run)|(?:gravel|stone|aggregate|fill|topsoil|sand) delivery' },
      steps: [
        {
          title: 'Mark the dump spot and the truck path',
          instruction: 'Mark where each pile goes, away from excavation edges, trees and wires, and check the path can carry a loaded truck without sinking. Look up before tipping: no bed raised under a wire.',
          tools: ['marking paint', 'cones'],
          materials: [],
          safety_ids: ['overhead_lines', 'backing_truck'],
          qa_ids: ['placement_clearance'],
        },
        {
          title: 'Back in, dump and spread',
          instruction: 'Back in with the alarm working or a spotter in sight. Dump on firm level ground with everyone clear of the tailgate, lower the bed fully before moving, and spread the pile in lifts where the plan calls for it.',
          tools: ['hand signals or radio'],
          materials: ['aggregate or fill per the plan'],
          safety_ids: ['backing_truck', 'raised_bed', 'tailgate', 'rollaway'],
          qa_ids: ['delivery_ticket'],
        },
        {
          title: 'Check the ticket and clean the road',
          instruction: 'Match the delivery ticket (material, tons or yards) to the order before signing, keep it with the job, and scrape mud and spilled stone off the road.',
          tools: ['shovel', 'broom'],
          materials: [],
          safety_ids: ['street_traffic'],
          qa_ids: ['delivery_ticket', 'site_restored'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'haul[- ]?(?:off|away|out|in)|debris (?:removal|haul)|load[- ]?out|clean[- ]?out|gravel|\\bfill\\b|aggregate|topsoil' }, type: 'dump_truck', reason: 'Hauls debris loads to the disposal site or delivers aggregate and fill.' },
    { when: { title_re: 'haul[- ]?(?:off|away|out)|debris (?:removal|haul)|load[- ]?out|clean[- ]?out' }, type: 'skid_steer', reason: 'Loads debris piles into the truck or container instead of hand loading.', optional: true },
  ],
  hazards: [
    { id: 'backing_truck', hazard: 'Struck by a backing roll-off or dump truck with a blind rear view in a tight driveway or street', hazard_es: PENDING_ES, controls: ['Back up only with a reverse alarm audible over site noise, or with an observer signalling it is safe', 'Keep the crew and the owner out of the backing path and blind zone', 'Driver stops if the spotter leaves view'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(4)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'raised_bed', hazard: 'Crushed by a raised dump body, roll-off hoist frame or a container sliding off the bed', hazard_es: PENDING_ES, controls: ['Never stand or work under a raised bed or hoist frame unless it is locked on its permanent support', 'Lower the bed fully before moving the truck and when the work is done', 'Stand clear of the cable or hook and the container while it is loaded or unloaded'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(3)(i)', severity: 4, ppe: ['hard hat'], prov: osha('o', '1926.600(a)(3)(i) dump bodies lowered or blocked; 1926.601(b)(10) permanent locking support for dump bodies.') },
    { id: 'overhead_lines', hazard: 'Electrocution when a raised dump bed, roll-off hoist or container contacts an overhead power line', hazard_es: PENDING_ES, controls: ['Look up before tipping; keep the bed, hoist and container at least 10 ft from lines rated 50 kV or less (more for higher voltage)', 'Treat every overhead wire as energized until the utility says otherwise', 'Use a designated observer when the driver cannot judge clearance'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(6)', severity: 4, prov: osha('o') },
    { id: 'street_traffic', hazard: 'Workers or the public struck by traffic around a container placed in the street, terrace or alley', hazard_es: PENDING_ES, controls: ['Mark the container with signs, cones, reflectors or lights per the permit and the MUTCD', 'Use a flagger when the truck blocks a lane while setting or pulling', 'Keep the container off sight lines at drives and corners'], controls_es: PENDING_ES, osha_ref: '1926.200(g)(2)', severity: 3, ppe: ['high-visibility vest'], prov: { src: ['ecfr-1926-g', 'hauling-madison-sop'], confidence: 'verified', last_verified: D } },
    { id: 'chute_drop', hazard: 'Struck by debris thrown from upper floors or the roof into the container', hazard_es: PENDING_ES, controls: ['Use an enclosed chute when dropping material more than 20 ft outside the walls', 'Where debris drops through floor openings, barricade the landing area and post falling-material signs on each level', 'Keep everyone out of the drop zone while debris comes down'], controls_es: PENDING_ES, osha_ref: '1926.252(a)', severity: 3, ppe: ['hard hat'], prov: osha('h', '1926.252(a) enclosed chute; 1926.252(b) barricades and signs for drops through floor holes.') },
    { id: 'overfill', hazard: 'Debris falling from an overfilled container or uncovered truck while it is hauled on public roads', hazard_es: PENDING_ES, controls: ['Load no higher than the rim or box sides', 'Tarp or tie down loose and light loads so nothing leaks, spills, blows or falls off', 'Stack long pieces so they cannot slide out'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 3, prov: { src: ['ecfr-1926-h', 'hauling-ecfr-49-393-i'], confidence: 'derived', last_verified: D, note: 'OSHA secured-stacking duty plus 49 CFR 393.100(b) — cargo secured against leaking, spilling, blowing or falling on public roads.' } },
    { id: 'loader_over_truck', hazard: 'Driver or helper struck by material falling while a loader or excavator loads over the truck', hazard_es: PENDING_ES, controls: ['Driver stays in a cab with a shield or canopy, or out of reach, while a machine loads', 'Nobody between the loader and the truck or beside the box during loading'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(6)', severity: 3, ppe: ['hard hat'], prov: osha('o') },
    { id: 'tailgate', hazard: 'Struck by the swinging tailgate or the load when a dump truck releases', hazard_es: PENDING_ES, controls: ['Trip the tailgate only from a position in the clear', 'Keep everyone away from the rear of the truck while dumping', 'Latch the tailgate before driving'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(12)', severity: 3, prov: osha('o') },
    { id: 'rollaway', hazard: 'Parked truck rolling into workers or the container on a sloped drive', hazard_es: PENDING_ES, controls: ['Set the parking brake every time the truck is parked', 'Chock the wheels on any incline'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(3)(ii)', severity: 3, prov: osha('o') },
    { id: 'hazardous_waste', hazard: 'Exposure to asbestos, lead dust or chemicals hidden in mixed C&D debris', hazard_es: PENDING_ES, controls: ['Do not load debris that may contain asbestos until it has been tested; stop and report suspect material', 'Keep paint, solvents, batteries, mercury devices and refrigerant appliances out of the container', 'Keep oily rags and solvent waste in a covered fire-resistant can until removed'], controls_es: PENDING_ES, osha_ref: '1926.1101(k)', severity: 4, ppe: ['gloves', 'respirator if suspect material is disturbed'], prov: { src: ['ecfr-1926-z', 'hauling-wi-dnr-structures', 'abatement-wi-dnr-asbestos'], confidence: 'verified', last_verified: D } },
    { id: 'manual_handling', hazard: 'Back strain and crushed hands throwing heavy or awkward debris into the container', hazard_es: PENDING_ES, controls: ['Use a machine, dolly or two-person lift for heavy pieces', 'Break debris down to manageable size before carrying', 'Keep hands clear of the container rim and door hinges'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, ppe: ['gloves', 'safety-toe boots'], prov: oshaDerived('c', 'No 1926 lifting standard; training duty to recognize and avoid unsafe conditions.') },
    { id: 'sharp_debris', hazard: 'Cuts and puncture wounds from nails, glass and metal edges in debris', hazard_es: PENDING_ES, controls: ['Keep scrap with protruding nails cleared from walkways', 'Wear cut-resistant gloves and puncture-resistant boots when handling debris'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, ppe: ['cut-resistant gloves', 'safety-toe boots', 'safety glasses'], prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'container_sized', item: 'Container size matches the debris: small containers for heavy concrete, masonry and shingles; weight limit from the hauler noted.', item_es: tr('El tamaño del contenedor corresponde al escombro: contenedores chicos para concreto, mampostería y tejas pesados; límite de peso del transportista anotado.'), prov: est('Common hauler practice — heavy debris reaches the weight limit before the container is full.') },
    { id: 'row_permit', item: 'Right-of-way permit in hand before a container is set in the street, terrace, sidewalk or alley (Madison: Street Occupancy Permit, applied a week ahead).', item_es: tr('Permiso de vía pública en mano antes de colocar un contenedor en la calle, banqueta, franja verde o callejón (Madison: Permiso de Ocupación de Calle, solicitado con una semana de anticipación).'), prov: { src: ['hauling-madison-sop'], confidence: 'verified', last_verified: D, note: 'Madison example; other municipalities have their own permit.' } },
    { id: 'placement_clearance', item: 'Container or dump spot clear of overhead wires, trees and eaves, egress paths and fire hydrants, with straight truck access and room to tip.', item_es: PENDING_ES, safety: true, prov: osha('o', 'Overhead-line clearance per 1926.600(a)(6); rest is hauler practice.') },
    { id: 'surface_protected', item: 'Boards or plywood under the container rails and rollers on driveways and pavement.', item_es: tr('Tablas o triplay bajo los rieles y rodillos del contenedor sobre entradas y pavimento.'), prov: est('Common roll-off practice to prevent drive and pavement damage.') },
    { id: 'street_marked', item: 'Container in or near traffic marked with cones, reflectors or lights per the permit; lit at night.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-g', 'ecfr-1926-o', 'hauling-madison-sop'], confidence: 'verified', last_verified: D, note: '1926.200(g) traffic control devices; 1926.600(a)(1) lights or reflectors on equipment left near a highway at night.' } },
    { id: 'no_prohibited', item: 'No suspect asbestos, hazardous waste or state-banned items in the load (WI: cardboard, containers, electronics, lead-acid batteries, appliances, oil and oil filters, tires, yard waste).', item_es: PENDING_ES, safety: true, prov: { src: ['hauling-wi-dnr-banned', 'hauling-wi-dnr-structures'], confidence: 'verified', last_verified: D } },
    { id: 'not_overfilled', item: 'Debris level with or below the container rim or truck box sides; weight within the hauler limit.', item_es: PENDING_ES, safety: true, prov: cargo('393.100(b) — nothing may spill, blow or fall from the vehicle.') },
    { id: 'covered_load', item: 'Loose or light loads tarped and long pieces tied down before the truck enters a public road.', item_es: PENDING_ES, safety: true, prov: cargo() },
    { id: 'recyclables_split', item: 'Clean concrete, brick, metal, shingles and clean wood separated where a recycler or clean-fill site takes them.', item_es: tr('Concreto limpio, ladrillo, metal, tejas y madera limpia separados donde un reciclador o sitio de relleno limpio los recibe.'), prov: { src: ['hauling-wi-dnr-cd-debris', 'hauling-epa-cd-materials'], confidence: 'verified', last_verified: D } },
    { id: 'swap_scheduled', item: 'Swap called at about three-quarters full so debris never piles beside the container.', item_es: tr('Cambio solicitado cuando el contenedor está a tres cuartos para que el escombro nunca se amontone a un lado.'), prov: est('Hauler scheduling practice; also keeps work areas clear per 1926.25(a).') },
    { id: 'licensed_facility', item: 'Every load goes to a facility licensed for that material (C&D or MSW landfill, recycler, clean-fill site); nothing buried or burned on site.', item_es: tr('Cada carga va a un sitio con licencia para ese material (relleno de construcción o municipal, reciclador, sitio de relleno limpio); nada se entierra ni se quema en la obra.'), prov: dnr() },
    { id: 'tickets_kept', item: 'Scale or disposal ticket saved for every haul (date, facility, weight, material) and filed for diversion or LEED reporting.', item_es: tr('Boleto de báscula o de disposición guardado por cada viaje (fecha, sitio, peso, material) y archivado para reportes de desvío o LEED.'), prov: { src: ['hauling-epa-cd-materials', 'hauling-wi-dnr-structures'], confidence: 'derived', last_verified: D, note: 'Tickets are the record behind diversion reports; WI landfills may also ask for Form 4500-113.' } },
    { id: 'delivery_ticket', item: 'Aggregate and fill delivery tickets match the order (material, tons or yards) before signing.', item_es: tr('Los boletos de entrega de agregado y relleno coinciden con el pedido (material, toneladas o yardas) antes de firmar.'), prov: est('Standard delivery practice.') },
    { id: 'site_restored', item: 'Container spot, drive, curb and street swept of nails and debris and checked for damage after the final pull or delivery.', item_es: tr('Lugar del contenedor, entrada, guarnición y calle barridos de clavos y escombro y revisados por daños después del retiro final o la entrega.'), prov: osha('c', '1926.25(a) debris cleared from work areas and passageways.') },
  ],
  inspection_checklists: {
    container_placement_check: [
      { item: 'Right-of-way permit posted or on file when the container is in the street, terrace, sidewalk or alley', item_es: tr('Permiso de vía pública colocado o archivado cuando el contenedor está en la calle, franja verde, banqueta o callejón') },
      { item: 'Spot clear of overhead wires, egress, hydrants and sight lines', item_es: PENDING_ES },
      { item: 'Boards under the rails and rollers; container level and stable', item_es: tr('Tablas bajo los rieles y rodillos; contenedor a nivel y estable') },
      { item: 'Cones, reflectors or lights in place for street placement', item_es: PENDING_ES, ref: '29 CFR 1926.200(g)' },
    ],
    pre_pull_check: [
      { item: 'Nothing above the rim; load spread and within the weight limit', item_es: PENDING_ES, ref: '49 CFR 393.100' },
      { item: 'No suspect asbestos, hazardous waste or banned items visible in the load', item_es: PENDING_ES },
      { item: 'Tarp on when the hauler or the load requires it', item_es: PENDING_ES },
    ],
    disposal_ticket_log: [
      { item: 'Ticket for every haul with date, facility, weight and material', item_es: tr('Boleto por cada viaje con fecha, sitio, peso y material') },
      { item: 'Recycled or clean-fill tonnage tracked separately from landfilled tonnage', item_es: tr('Toneladas recicladas o de relleno limpio registradas aparte de las enviadas al relleno sanitario') },
      { item: 'Asbestos inspection form available for the landfill when demolition debris is from a nonresidential or >4-unit building (WI Form 4500-113)', item_es: tr('Formulario de inspección de asbesto disponible para el relleno sanitario cuando el escombro de demolición viene de un edificio no residencial o de más de 4 unidades (WI Formulario 4500-113)') },
    ],
  },
  assemblies: [
    { code: 'G-HAUL-RO20-EA', name: 'Roll-off container, 20 yd, per haul (delivery or swap and pull; disposal fee separate)', name_es: 'Contenedor roll-off de 20 yardas, por viaje (entrega o cambio y retiro; cuota de disposición aparte)', unit: 'EA', csi: '01 74 19',
      material_cost_cents: { v: 0, prov: est('service only — no material') }, labor_hours_per_unit: { v: 0.25, prov: est('site crew time to mark the spot, lay boards and meet the driver') },
      equipment_cost_cents: { v: 42500, prov: est('hauler haul charge per 20 yd pull excluding tonnage, national baseline 2026; tune to local hauler') }, waste_pct: { v: 0, prov: est('counted hauls') } },
    { code: 'G-HAUL-RO30-EA', name: 'Roll-off container, 30 yd, per haul (delivery or swap and pull; disposal fee separate)', name_es: 'Contenedor roll-off de 30 yardas, por viaje (entrega o cambio y retiro; cuota de disposición aparte)', unit: 'EA', csi: '01 74 19',
      material_cost_cents: { v: 0, prov: est('service only — no material') }, labor_hours_per_unit: { v: 0.25, prov: est('site crew time to mark the spot, lay boards and meet the driver') },
      equipment_cost_cents: { v: 50000, prov: est('hauler haul charge per 30 yd pull excluding tonnage, national baseline 2026; tune to local hauler') }, waste_pct: { v: 0, prov: est('counted hauls') } },
    { code: 'G-HAUL-RENT-DAY', name: 'Roll-off container rental beyond the included days, per day', name_es: 'Renta de contenedor roll-off después de los días incluidos, por día', unit: 'DAY', csi: '01 74 19',
      material_cost_cents: { v: 0, prov: est('service only') }, labor_hours_per_unit: { v: 0, prov: est('no site labor') },
      equipment_cost_cents: { v: 1000, prov: est('typical extra-day container rent, national baseline 2026') }, waste_pct: { v: 0, prov: est('counted days') } },
    { code: 'G-HAUL-DISP-TON', name: 'Landfill / transfer station disposal (tipping) fee, mixed C&D debris, per ton', name_es: 'Cuota de disposición (descarga) en relleno sanitario o estación de transferencia, escombro mixto, por tonelada', unit: 'TON', csi: '01 74 19',
      material_cost_cents: { v: 0, prov: est('fee carried in the equipment column so it is not taxed as material') }, labor_hours_per_unit: { v: 0, prov: est('no site labor') },
      equipment_cost_cents: { v: 7000, prov: est('mixed C&D tipping fee incl. state surcharges, national baseline 2026; recycled concrete/metal often cheaper or free — use scale tickets') }, waste_pct: { v: 0, prov: est('scale weight') } },
    { code: 'G-HAUL-LOAD-EA', name: 'Debris haul-off by dump truck, hand-loaded, per load (truck trip + loading; disposal fee separate)', name_es: 'Acarreo de escombro en camión de volteo, cargado a mano, por carga (sin cuota de disposición)', unit: 'EA', csi: '01 74 19',
      material_cost_cents: { v: 0, prov: est('service only') }, labor_hours_per_unit: { v: 2.0, prov: est('two laborers about one hour hand-loading a ~10 yd box') },
      equipment_cost_cents: { v: 17500, prov: est('dump truck + driver per round trip to a local landfill, national baseline 2026; for a truck on site all day use EQUIP-DUMP_TRUCK instead') }, waste_pct: { v: 0, prov: est('counted loads') } },
  ],
  quantity_rules: [
    { code: 'G-HAUL-RO30-EA', assumption: 'Allowance: new single-family home: about two 30 yd roll-off pulls of construction waste; adjust to the actual job', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'G-HAUL-DISP-TON', assumption: 'Allowance: about 3 tons of mixed waste per 30 yd pull (2 pulls); replace with scale-ticket tonnage', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 6 } },
  ],
  dependency_hints: [
    { after_trades: ['final_clean'], note: 'Final container pull and site restoration after the last debris-producing trade and final clean.' },
  ],
});
