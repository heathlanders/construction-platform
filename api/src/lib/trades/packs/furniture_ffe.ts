// Trade Knowledge Pack — furniture_ffe (Furniture / FF&E Installation / Seating). Wave 16 — NEW-TRADE
// pattern (no hand recipe, no template tasks). Covers systems furniture / workstations, freestanding office
// furniture and fixed audience (auditorium) seating, incl. owner-furnished contractor-installed (OFCI) work.
// Hand-offs: hardwired base feeds / power-entry connections are made by a licensed electrician
// (electrical); data cabling by low_voltage; casework by millwork/cabinetry; lab casework by lab_casework.
// permit_trade null → NO gates, NO code_refs; owner/GC checkpoints live in inspection_checklists
// (ADA 2010 + IBC references appear there as `ref` only).
// Dossier: docs/trade-packs/dossiers/furniture_ffe.md. Sources: UFGS 12 59 00 / 12 61 13, 2010 ADA
// Standards (Access Board text), ANSI/BIFMA (reference only), 29 CFR 1926 C/D/E/H/I/K/M/O/X/Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const sys = (note?: string) => ({ src: ['furniture_ffe-ufgs-12-59-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const seat = (note?: string) => ({ src: ['furniture_ffe-ufgs-12-61-13'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ada = (note?: string) => ({ src: ['millwork-access-board-ada'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'furniture_ffe',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Receives, stages and installs furniture, fixtures and equipment (FF&E): systems-furniture workstations and panels, desks, storage and seating, and fixed audience seating in auditoriums and lecture halls — often owner-furnished and contractor-installed. Coordinates the electrician for powered furniture and leaves the space clean and punched out.',
    summary_es: 'Recibe, almacena e instala mobiliario, accesorios y equipo (FF&E): estaciones de trabajo de mobiliario de sistemas y paneles, escritorios, archiveros y sillas, y butacas fijas en auditorios y salas de conferencias — a menudo suministrados por el dueño e instalados por el contratista. Coordina al electricista para el mobiliario con corriente y deja el espacio limpio y con pendientes cerrados.',
    glossary: [
      { term: 'FF&E', term_es: 'FF&E (mobiliario y equipo)', def: 'Furniture, fixtures and equipment — movable items bought for the space, usually outside the building contract.', def_es: 'Mobiliario, accesorios y equipo — artículos movibles comprados para el espacio, normalmente fuera del contrato de obra.' },
      { term: 'OFCI', term_es: 'Suministro del dueño, instalación del contratista', def: 'Owner-furnished, contractor-installed: the owner buys the item, the contractor receives and installs it.', def_es: 'El dueño compra el artículo y el contratista lo recibe e instala.' },
      { term: 'Systems furniture', term_es: 'Mobiliario de sistemas', def: 'Panel- or spine-based workstations whose panels, worksurfaces and storage connect as one system.', def_es: 'Estaciones de trabajo con paneles o columna central cuyos paneles, superficies y archiveros se conectan como un sistema.' },
      { term: 'Base feed (power entry)', term_es: 'Alimentación de base (entrada de corriente)', def: 'Module where building power and data enter the furniture system, at the floor or from a ceiling pole.', def_es: 'Módulo por donde entran la corriente y los datos del edificio al mobiliario, desde el piso o un poste del techo.' },
      { term: 'Whip', term_es: 'Látigo (cable flexible)', def: 'Flexible conduit run from a building junction box or floor box to the furniture base feed.', def_es: 'Tramo de conducto flexible desde la caja del edificio o del piso hasta la alimentación del mobiliario.' },
      { term: 'Standard (seating)', term_es: 'Pata o soporte (butaca)', def: 'Floor- or riser-mounted end frame that carries the seats and backs of fixed audience seating.', def_es: 'Soporte lateral anclado al piso o al escalón que carga los asientos y respaldos de las butacas fijas.' },
      { term: 'Designated aisle seat', term_es: 'Asiento de pasillo designado', def: 'Aisle seat with a folding or retractable armrest and a marker, for people who transfer from a wheelchair.', def_es: 'Asiento de pasillo con descansabrazos abatible o retráctil y una marca, para quien se pasa desde una silla de ruedas.' },
      { term: 'Attic stock', term_es: 'Material de reserva', def: 'Spare parts and finish materials handed to the owner at turnover.', def_es: 'Piezas y acabados de repuesto que se entregan al dueño al cierre.' },
      { term: 'Punch list', term_es: 'Lista de pendientes', def: 'List of damage, missing parts and adjustments to fix before the owner accepts the installation.', def_es: 'Lista de daños, piezas faltantes y ajustes a corregir antes de que el dueño acepte la instalación.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'systems_office_furniture',
      example_title: 'Install systems furniture workstations — Level 2 open office',
      when: { title_re: 'furniture|\\bFF&?E\\b|workstation|cubicle|systems furniture|office systems' },
      steps: [
        {
          title: 'Receive, inventory and record damage',
          instruction: 'Check every carton and crate against the packing list and the order. Photograph and note crushed or damaged cartons on the delivery receipt before the driver leaves, open suspect cartons on the spot, and report damage and shortages to the dealer the same day.',
          tools: ['pallet jack or hand truck', 'utility knife', 'phone camera'],
          materials: ['packing lists and order', 'delivery receipts'],
          safety_ids: ['heavy_lift', 'dock_plate', 'forklift_freight'],
          qa_ids: ['inventory_po'],
        },
        {
          title: 'Stage and protect',
          instruction: 'Stage by floor and area in a dry, ventilated, clean room that can be locked. Stack cartons flat and stable, keep within the posted floor load, keep aisles and exits open, and lay floor and door-frame protection along the delivery path before rolling carts.',
          tools: ['carts and dollies', 'pallet jack'],
          materials: ['floor protection board', 'corner and door-frame guards', 'moving blankets'],
          safety_ids: ['material_stacks', 'floor_load', 'housekeeping'],
          qa_ids: ['storage_conditions'],
        },
        {
          title: 'Lay out and set panels or spines',
          instruction: 'Snap the layout from the furniture plan, checking it against floor boxes, columns and power-pole locations. Set panels or spines level and plumb, connect them with the maker’s connectors, and attach tall panels and tall storage to the building where the plan or the maker calls for it.',
          tools: ['laser level', 'chalk line', 'tape measure', 'drill/driver', 'proprietary furniture tools'],
          materials: ['panels or spines', 'connectors', 'leveling glides', 'wall or floor attachment hardware'],
          safety_ids: ['tip_over', 'heavy_lift', 'power_tool', 'stepladder'],
          qa_ids: ['layout_plan', 'level_aligned', 'tall_units_secured'],
        },
        {
          title: 'Coordinate power and data with the electrician',
          instruction: 'Leave base feeds, power poles and in-panel raceways ready and clear. A licensed electrician makes the hardwired base-feed connection from the building circuit and tests every furniture circuit and receptacle; the data installer pulls cable to the workstation jacks. Do not connect or energize furniture power yourself.',
          tools: ['drill/driver'],
          materials: ['base feed modules', 'in-panel power harnesses', 'cable management'],
          safety_ids: ['live_power'],
          qa_ids: ['electrical_test_record', 'cables_managed'],
        },
        {
          title: 'Hang worksurfaces and storage; set accessible stations',
          instruction: 'Hang worksurfaces, overheads and storage, check every bracket is fully seated and locked, and adjust drawers, doors and height-adjustable bases. Where the plan shows accessible work surfaces for visitors or the public, set them to the accessible height range.',
          tools: ['drill/driver', 'level', 'tape measure'],
          materials: ['worksurfaces', 'brackets', 'pedestals and overhead storage'],
          safety_ids: ['heavy_lift', 'tip_over', 'power_tool'],
          qa_ids: ['brackets_seated', 'accessible_worksurface'],
        },
        {
          title: 'Punch, clean and remove debris',
          instruction: 'Walk every station with the owner or dealer, list damage and missing parts, fix what you can and order the rest. Remove all packaging and pallets from the building, clean and polish the furniture, pull floor protection and hand over keys, spare parts and care manuals.',
          tools: ['shop vacuum', 'cleaning supplies'],
          materials: ['punch list', 'keys, attic stock and care manuals'],
          safety_ids: ['housekeeping'],
          qa_ids: ['punch_closed'],
        },
      ],
    },
    {
      id: 'fixed_audience_seating',
      priority: 10,
      example_title: 'Install fixed auditorium seating',
      when: { title_re: 'fixed seating|auditorium seat|audience seat|theat(?:er|re) seat|lecture hall seat|tiered seating' },
      steps: [
        {
          title: 'Examine floors and risers; verify the layout',
          instruction: 'Before layout, check that floors and risers are finished, clean and true, and that aisle-light and power locations match the approved seating plan. Report wrong riser heights or conditions to the GC and do not start until they are corrected. Receive and store seating dry and warm before installing.',
          tools: ['tape measure', 'level', 'laser level'],
          materials: ['approved dimensioned seating plan'],
          safety_ids: ['riser_edge', 'heavy_lift', 'material_stacks'],
          qa_ids: ['layout_plan', 'storage_conditions'],
        },
        {
          title: 'Lay out standards on radial row lines',
          instruction: 'Mark row lines and each standard from the seating plan: curved rows run on radii from a common center, and aisle-end standards line up from row to row. Keep the wheelchair spaces, companion seats and aisle widths exactly where the plan shows them.',
          tools: ['laser level', 'chalk line', 'tape measure', 'trammel or string line'],
          materials: ['marking paint or pencil'],
          safety_ids: ['riser_edge'],
          qa_ids: ['aisles_clear', 'wheelchair_spaces'],
        },
        {
          title: 'Drill and anchor the standards',
          instruction: 'Drill anchor holes at the marks with dust extraction, set the maker’s anchors and fasten each standard plumb and tight. Stay back from open riser and balcony edges or work behind the guardrail.',
          tools: ['hammer drill with dust extraction', 'torque wrench', 'HEPA vacuum'],
          materials: ['seating standards', 'manufacturer anchors'],
          safety_ids: ['silica_drilling', 'riser_edge', 'power_tool'],
          qa_ids: ['standards_anchored'],
        },
        {
          title: 'Hang seats and backs; aisle lights by the electrician',
          instruction: 'Hang backs and seats per the plan, set the back pitch shown, and check every seat folds up and down freely. Narrow seats go only where they complete a row. Aisle and end-standard lights are wired and tested by the electrician.',
          tools: ['socket set', 'drill/driver'],
          materials: ['seats', 'backs', 'armrests', 'end panels'],
          safety_ids: ['heavy_lift', 'live_power', 'power_tool'],
          qa_ids: ['seats_operate'],
        },
        {
          title: 'Set accessible seating and clear the aisles',
          instruction: 'Check each wheelchair space for clear width and depth, companion seats beside them at the same floor level, and folding armrests plus a marker on the designated aisle seats. Make sure no seat, armrest or wheelchair space sits in the required aisle width.',
          tools: ['tape measure'],
          materials: ['designated aisle seat markers'],
          safety_ids: ['riser_edge'],
          qa_ids: ['wheelchair_spaces', 'aisle_seats_marked', 'aisles_clear'],
        },
        {
          title: 'Number rows and seats, clean and punch',
          instruction: 'Install row letters and seat numbers per the plan, clean and polish all seating, remove packaging and debris from the building, and walk the room with the owner to close the punch list.',
          tools: ['shop vacuum', 'cleaning supplies'],
          materials: ['row and seat number plates', 'punch list'],
          safety_ids: ['housekeeping'],
          qa_ids: ['punch_closed'],
        },
      ],
    },
  ],
  hazards: [
    { id: 'heavy_lift', hazard: 'Back strain, crushed fingers or dropped pieces moving panels, worksurfaces, files and seat standards', hazard_es: PENDING_ES, controls: ['Two people for panels, worksurfaces and tall storage; use carts, dollies and pallet jacks', 'Empty drawers and remove shelves before moving storage units', 'Plan the route and clear it before lifting'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 2, ppe: ['work gloves', 'safety-toe boots'], prov: osha('c', 'General accident-prevention program; no OSHA construction lifting limit exists.') },
    { id: 'tip_over', hazard: 'Tall storage, bookcases or unbraced panels tipping over onto a worker before they are connected or attached', hazard_es: PENDING_ES, controls: ['Connect panels and attach tall units to the building or to each other as the maker and plan direct before loading them', 'Never open more than one loaded drawer during install', 'Brace freestanding panel runs until connected'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 3, prov: { src: ['ecfr-1926-c', 'furniture_ffe-ufgs-12-59-00'], confidence: 'derived', last_verified: D, note: 'UFGS 12 59 00 3.1: attach components to the building where required.' } },
    { id: 'material_stacks', hazard: 'Stacked cartons, crates and pallets sliding or collapsing in staging areas', hazard_es: PENDING_ES, controls: ['Stack cartons flat and interlocked, heaviest at the bottom', 'Keep stacks low and out of aisles, exits and door swings'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 2, prov: osha('h') },
    { id: 'floor_load', hazard: 'Overloading a floor with staged furniture freight', hazard_es: PENDING_ES, controls: ['Stage within the posted safe floor load; ask the GC where it is not posted', 'Spread loads; do not concentrate pallets on one bay'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(2)(i)', severity: 3, prov: osha('h') },
    { id: 'dock_plate', hazard: 'Dock plate slipping or giving way under a loaded pallet jack during unloading', hazard_es: PENDING_ES, controls: ['Use a dock plate rated for the load and secure it in place', 'Chock the truck before rolling onto the plate'], controls_es: PENDING_ES, osha_ref: '1926.250(d)(2)', severity: 3, prov: osha('h') },
    { id: 'forklift_freight', hazard: 'Struck-by or tip-over unloading freight with a forklift', hazard_es: PENDING_ES, controls: ['Only trained operators drive forklifts', 'Stay within the rated capacity posted on the truck', 'Keep people clear of the forks and the load path'], controls_es: PENDING_ES, osha_ref: '1926.602(c)(1)(i)', severity: 3, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'live_power', hazard: 'Electric shock from building circuits at base feeds, power poles and aisle lights', hazard_es: PENDING_ES, controls: ['Furniture installers never make or energize hardwired connections — the licensed electrician does', 'Treat base-feed whips as live until the electrician says they are off and locked out'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: { src: ['ecfr-1926-k', 'furniture_ffe-ufgs-12-59-00'], confidence: 'verified', last_verified: D, note: 'UFGS 12 59 00 3.1: a licensed electrician hardwires the workstations.' } },
    { id: 'power_tool', hazard: 'Shock or wrist injury from drills and drivers with damaged cords or that bind', hazard_es: PENDING_ES, controls: ['Use double-insulated or grounded tools in good condition', 'Plug into GFCI protection', 'Brace drills with both hands for large bits'], controls_es: PENDING_ES, osha_ref: '1926.302(a)(1)', severity: 2, prov: osha('i') },
    { id: 'stepladder', hazard: 'Falls from stepladders hanging overhead storage or reaching panel tops', hazard_es: PENDING_ES, controls: ['Never stand on the top step or top cap', 'Open the ladder fully on a level floor and move it instead of overreaching'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 2, prov: osha('x') },
    { id: 'riser_edge', hazard: 'Falls from open riser, balcony or tiered-seating edges before guardrails are in place', hazard_es: PENDING_ES, controls: ['Keep guardrails in place at balcony and riser edges 6 ft or more above the lower level, or use personal fall arrest', 'Do not work at an open edge to lay out or anchor standards'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['personal fall arrest where no guardrail'], prov: osha('m') },
    { id: 'silica_drilling', hazard: 'Breathing silica dust drilling anchor holes in concrete floors and risers', hazard_es: PENDING_ES, controls: ['Use a hammer drill with dust extraction (Table 1 controls)', 'Clean dust with a HEPA vacuum — never dry sweep or blow off'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['safety glasses'], prov: osha('z') },
    { id: 'housekeeping', hazard: 'Trips and fire load from cardboard, pallets and banding left in work areas and exits', hazard_es: PENDING_ES, controls: ['Break down packaging and remove it daily', 'Keep aisles, stairs and exits clear of debris'], controls_es: PENDING_ES, osha_ref: '1926.250(c)', severity: 2, prov: osha('h') },
  ],
  qa_checklist: [
    { id: 'inventory_po', item: 'Every carton checked against the packing list and order; visible damage noted on the delivery receipt with photos before the driver leaves; shortages and damage reported to the dealer the same day.', item_es: tr('Cada caja revisada contra la lista de empaque y la orden; daños visibles anotados en el recibo con fotos antes de que se vaya el chofer; faltantes y daños reportados al distribuidor el mismo día.'), prov: sys('Deliver in labeled original packaging with item identification and project reference.') },
    { id: 'storage_conditions', item: 'Furniture and seating stored in a dry, ventilated, clean, secure area away from fresh paint, adhesives and other off-gassing sources; seating kept above 60°F for 2 days before install.', item_es: tr('Mobiliario y butacas almacenados en un lugar seco, ventilado, limpio y seguro, lejos de pintura fresca, adhesivos y otras fuentes de vapores; butacas a más de 60°F durante 2 días antes de instalar.'), prov: { src: ['furniture_ffe-ufgs-12-59-00', 'furniture_ffe-ufgs-12-61-13'], confidence: 'verified', last_verified: D } },
    { id: 'layout_plan', item: 'Layout matches the approved furniture or seating plan (station locations, row spacing, row lengths, standard placement, back pitch) and lines up with floor boxes and power poles.', item_es: tr('La distribución coincide con el plano aprobado de mobiliario o butacas (ubicación de estaciones, separación y largo de filas, soportes, inclinación del respaldo) y con las cajas de piso y postes de corriente.'), prov: seat('3.3 install per approved dimensioned seating plans.') },
    { id: 'level_aligned', item: 'Panels, spines and worksurfaces level, plumb, square and aligned with adjoining furniture.', item_es: tr('Paneles, columnas y superficies a nivel, a plomo, a escuadra y alineados con el mobiliario contiguo.'), prov: sys('3.1') },
    { id: 'tall_units_secured', item: 'Tall panels, bookcases and tall storage interconnected or attached to the building wherever the plan or maker requires, before they are loaded.', item_es: PENDING_ES, safety: true, prov: sys('3.1 securely interconnect and attach components to the building where required.') },
    { id: 'brackets_seated', item: 'Every worksurface and overhead bracket fully seated and locked; nothing rocks or drops under a hand load.', item_es: PENDING_ES, safety: true, prov: est('Hand-load check of hung components; follow the maker’s bracket instructions.') },
    { id: 'electrical_test_record', item: 'Licensed electrician’s test record on file for 100% of furniture circuits: phasing at the power entry, receptacle polarity, ground continuity, controlled receptacles working.', item_es: PENDING_ES, safety: true, prov: sys('3.1 electrician tests and documents all furniture electrical circuits and devices.') },
    { id: 'cables_managed', item: 'Power and data cables run inside the furniture raceways; no cords crossing walkways or pinched by drawers.', item_es: PENDING_ES, safety: true, prov: sys('2.13.3 wiring contained within raceways; wires protected from drawer operation.') },
    { id: 'accessible_worksurface', item: 'Where work surfaces serve visitors or the public, at least 5% are 28–34 in. above the floor with knee clearance (2010 ADA 226.1 / 902).', item_es: tr('Donde las superficies de trabajo sirven a visitantes o al público, al menos el 5% están entre 28 y 34 pulg sobre el piso con espacio para las rodillas (ADA 2010 226.1 / 902).'), prov: ada('226.1 at least 5% of work surfaces for other than employees; 902.3 28 in. min / 34 in. max.') },
    { id: 'standards_anchored', item: 'Every seating standard anchored with the maker’s anchors, plumb and tight; no loose or spinning anchors.', item_es: PENDING_ES, safety: true, prov: seat('3.3 install per manufacturer instructions with recommended hardware.') },
    { id: 'seats_operate', item: 'Every seat folds up and down freely; backs set to the plan pitch; narrow seats used only to complete a row.', item_es: tr('Cada asiento sube y baja libremente; respaldos a la inclinación del plano; asientos angostos solo para completar una fila.'), prov: seat('3.2 minimum 20 in. unit only to complete a specific row dimension.') },
    { id: 'wheelchair_spaces', item: 'Wheelchair spaces at least 36 in. wide (33 in. each when two adjoin) and 48 in. deep (60 in. if entered only from the side), on an accessible route, with companion seats beside them at the same floor level.', item_es: PENDING_ES, safety: true, prov: ada('802.1.2, 802.1.3, 802.1.4, 802.3.1') },
    { id: 'aisle_seats_marked', item: 'At least 5% of aisle seats — those closest to accessible routes — have a folding or retractable aisle-side armrest and a sign or marker.', item_es: tr('Al menos el 5% de los asientos de pasillo — los más cercanos a las rutas accesibles — tienen descansabrazos abatible o retráctil del lado del pasillo y un letrero o marca.'), prov: ada('221.4, 802.4.1, 802.4.2') },
    { id: 'aisles_clear', item: 'No seat, armrest, wheelchair space or furniture intrudes into required aisle and exit-path widths shown on the plan.', item_es: PENDING_ES, safety: true, prov: { src: ['millwork-access-board-ada', 'icc-pa'], confidence: 'verified', last_verified: D, note: 'ADA 802.1.5 no overlap of circulation paths; aisle widths per IBC 1029 (reference only).' } },
    { id: 'punch_closed', item: 'Punch list walked with the owner or dealer; damage repaired or replaced, missing parts ordered with dates; furniture cleaned, packaging out of the building, keys, attic stock and care manuals handed over.', item_es: tr('Lista de pendientes revisada con el dueño o distribuidor; daños reparados o reemplazados, piezas faltantes pedidas con fecha; mobiliario limpio, empaque fuera del edificio, llaves, material de reserva y manuales de cuidado entregados.'), prov: { src: ['furniture_ffe-ufgs-12-59-00', 'furniture_ffe-ufgs-12-61-13'], confidence: 'verified', last_verified: D, note: 'Repair defects; replace damaged products that cannot be repaired.' } },
  ],
  inspection_checklists: {
    receiving_inspection: [
      { item: 'Cartons counted against packing lists; damage noted on the delivery receipt with photos', item_es: tr('Cajas contadas contra las listas de empaque; daños anotados en el recibo con fotos') },
      { item: 'Staging room dry, ventilated, secure and within the posted floor load', item_es: PENDING_ES, ref: '29 CFR 1926.250(a)(2)' },
    ],
    layout_verify: [
      { item: 'Furniture or seating plan approved; floor boxes, power poles and aisle-light locations match it', item_es: tr('Plano de mobiliario o butacas aprobado; cajas de piso, postes de corriente y luces de pasillo coinciden con él') },
      { item: 'Paint, ceilings and flooring finished in the area (or sequence agreed with the GC)', item_es: tr('Pintura, plafones y pisos terminados en el área (o el orden acordado con el contratista general)') },
    ],
    electrical_coordination: [
      { item: 'Base feeds and aisle lights connected by a licensed electrician — not the furniture crew', item_es: PENDING_ES },
      { item: 'Electrician’s 100% circuit test record (phasing, polarity, ground continuity) received', item_es: PENDING_ES, ref: 'UFGS 12 59 00 3.1' },
    ],
    accessibility_check: [
      { item: 'Wheelchair spaces, companion seats and dispersion as shown on the plan', item_es: PENDING_ES, ref: '2010 ADA 221.2, 802' },
      { item: 'Designated aisle seats with folding armrests and markers', item_es: tr('Asientos de pasillo designados con descansabrazos abatibles y marcas'), ref: '2010 ADA 221.4, 802.4' },
      { item: 'Accessible work surfaces 28–34 in. high where provided for visitors or the public', item_es: tr('Superficies de trabajo accesibles de 28 a 34 pulg de alto donde se proporcionan para visitantes o el público'), ref: '2010 ADA 226.1, 902' },
    ],
    egress_aisle_check: [
      { item: 'Aisle and cross-aisle widths and row lengths match the approved seating plan; nothing intrudes into exit paths', item_es: PENDING_ES, ref: 'IBC 1029 (assembly seating)' },
      { item: 'Row and seat numbering installed per plan', item_es: tr('Numeración de filas y asientos instalada según el plano') },
    ],
    punch_turnover: [
      { item: 'Punch list closed or open items dated', item_es: tr('Lista de pendientes cerrada o los pendientes con fecha') },
      { item: 'Space clean; packaging, pallets and floor protection removed', item_es: tr('Espacio limpio; empaque, tarimas y protección del piso retirados') },
      { item: 'Keys, attic stock, warranties and care manuals handed to the owner', item_es: tr('Llaves, material de reserva, garantías y manuales de cuidado entregados al dueño') },
    ],
  },
  assemblies: [
    { code: 'G-FFE-WKST-EA', name: 'Systems furniture workstation install (panels/spine, worksurface, storage), owner-furnished, each', name_es: 'Instalación de estación de trabajo de mobiliario de sistemas, suministrada por el dueño, c/u', description: 'Labor-only baseline: the workstation is usually owner-furnished (OFCI); material covers connectors, glides and small hardware only. Add furniture cost separately if contractor-furnished.', unit: 'EA', csi: '12 59 00',
      material_cost_cents: { v: 2500, prov: est('OFCI baseline — attachment hardware and consumables only, national 2026') }, labor_hours_per_unit: { v: 3.0, prov: est('Two-person crew ~1.5 h per typical 6x6 workstation incl. uncrating and adjustment') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-FFE-PWR-EA', name: 'Furniture base-feed power/data connection by licensed electrician (whip + test), each', name_es: 'Conexión de corriente y datos del mobiliario por electricista con licencia (látigo + prueba), c/u', description: 'Electrician coordination line: flexible whip from floor box or junction box to the furniture base feed, connection and circuit test.', unit: 'EA', csi: '26 27 26',
      material_cost_cents: { v: 4500, prov: est('flexible conduit whip, fittings and conductors, national 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('electrician: connect whip at base feed and test circuits') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('conduit and conductor cut-offs') } },
    { code: 'G-FFE-SEAT-EA', name: 'Fixed audience seat installed on standards with floor anchors, each', name_es: 'Butaca fija instalada sobre soportes con anclas al piso, c/u', description: 'Material at a mid-grade upholstered auditorium-seat baseline; set material to 0 when the seating is owner-furnished.', unit: 'EA', csi: '12 61 13',
      material_cost_cents: { v: 32000, prov: est('mid-grade upholstered fixed seat incl. standard share and anchors, national 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('layout, drill and anchor standard share, hang seat and back, adjust') },
      equipment_cost_cents: { v: 0, prov: est('hammer drill with dust extraction only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-FFE-RECV-TRK', name: 'Freight receiving, inventory and staging, per truckload', name_es: 'Recepción, inventario y almacenaje de mercancía, por camión', description: 'Unload, count against packing lists, record damage and stage by area; allowance per 53 ft trailer.', unit: 'TRK', csi: '12 00 00',
      material_cost_cents: { v: 5000, prov: est('floor protection, blankets and banding consumables per load') }, labor_hours_per_unit: { v: 8.0, prov: est('three-person crew ~2.5–3 h per trailer incl. inventory') },
      equipment_cost_cents: { v: 7500, prov: est('pallet jack and dolly share; forklift rental billed separately when no dock') }, waste_pct: { v: 0, prov: est('allowance') } },
    { code: 'G-FFE-MOVE-HR', name: 'Punch, move and reconfiguration coordination, per crew-hour', name_es: 'Pendientes, mudanza y reconfiguración, por hora de cuadrilla', unit: 'HR', csi: '12 00 00',
      material_cost_cents: { v: 0, prov: est('labor-only line') }, labor_hours_per_unit: { v: 2.0, prov: est('two-person crew per clock hour') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('allowance') } },
  ],
  dependency_hints: [
    { after_trades: ['painting', 'flooring_carpet', 'flooring_resilient', 'acoustical_ceilings'], before_phase: 'punch', note: 'Install furniture and seating after paint, ceilings and flooring are finished, before final punch and clean.' },
    { after_trades: ['electrical', 'low_voltage'], note: 'Floor boxes, power poles and data rough-in must be in before workstations are set; the electrician returns to connect base feeds.' },
  ],
});
