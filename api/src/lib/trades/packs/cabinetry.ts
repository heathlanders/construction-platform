// Trade Knowledge Pack — cabinetry (Cabinet Installation / Casework). Wave 03, COMPLEMENT pattern:
// the hand recipe in task-buildout/nopermit.ts (Field-verify & layout → Install & scribe) keeps
// producing the work steps; this pack adds glossary, hazards, QA, owner/GC checkpoints and the
// assemblies the catalog lacks (vanity, tall cabinet, crown/light rail, hardware, removal).
// permit_trade null → NO gates, NO code_refs; 2010 ADA casework checks live in QA (cited, not code_refs).
// Dossier: docs/trade-packs/dossiers/cabinetry.md. Sources: UFGS 06 41 16.00 10, MasterBrand +
// KraftMaid installation guidance, 2010 ADA Standards, KCMA/AWI (ref only), 29 CFR 1926 C/D/E/H/I/K/X.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['cabinetry-ufgs-06-41-16'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const mb = (note?: string) => ({ src: ['cabinetry-masterbrand-install'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const km = { src: ['cabinetry-kraftmaid-install', 'cabinetry-ufgs-06-41-16'], confidence: 'verified' as const, last_verified: D };
const ada = (note: string) => ({ src: ['plumbing-ada-2010'], confidence: 'verified' as const, last_verified: D, note });
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'cabinetry',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Setting kitchen, bath and laundry cabinets and commercial casework: layout from the floor high point, hanging uppers into framing, leveling and shimming bases, scribing fillers and panels, then crown, toe kick, hardware and door/drawer adjustment. Countertops follow as a separate trade.',
    summary_es: 'Instalación de gabinetes de cocina, baño y lavandería y mobiliario comercial: trazo desde el punto alto del piso, colgar los superiores en la estructura, nivelar y calzar los inferiores, ajustar rellenos y paneles, y luego moldura, zócalo, herrajes y ajuste de puertas y cajones. Las cubiertas las coloca otro oficio.',
    glossary: [
      { term: 'Face frame', term_es: 'Marco frontal', def: 'Solid-wood frame on the front of a framed cabinet; neighboring frames are clamped flush and screwed together.', def_es: 'Marco de madera al frente de un gabinete con marco; los marcos vecinos se prensan a ras y se atornillan entre sí.' },
      { term: 'Frameless cabinet', term_es: 'Gabinete sin marco (europeo)', def: 'Box with no face frame; doors cover the box edges, so boxes are joined through the sides.', def_es: 'Caja sin marco frontal; las puertas cubren los cantos, así que las cajas se unen por los costados.' },
      { term: 'Filler', term_es: 'Relleno', def: 'Strip that closes the gap between a cabinet and a wall or appliance so doors and drawers can open.', def_es: 'Tira que cierra el espacio entre un gabinete y un muro o aparato para que abran puertas y cajones.' },
      { term: 'Scribe', term_es: 'Ajuste al muro (escribado)', def: 'Tracing an uneven wall or floor onto a filler or panel and cutting it so it fits tight.', def_es: 'Trazar la forma de un muro o piso irregular sobre un relleno o panel y cortarlo para que ajuste.' },
      { term: 'Toe kick', term_es: 'Zócalo de gabinete', def: 'Recessed strip at the bottom of base cabinets that leaves room for your feet.', def_es: 'Franja rehundida en la base de los gabinetes inferiores que deja espacio para los pies.' },
      { term: 'Ledger strip', term_es: 'Listón de apoyo', def: 'Straight board screwed level into the studs to hold upper cabinets at height while they are fastened.', def_es: 'Tabla recta atornillada a nivel en los montantes que sostiene los gabinetes superiores mientras se fijan.' },
      { term: 'Cabinet jack', term_es: 'Gato para gabinetes', def: 'Adjustable lift or T-brace that holds an upper cabinet in place during install.', def_es: 'Elevador ajustable o puntal en T que sostiene un gabinete superior durante la instalación.' },
      { term: 'Hanging rail', term_es: 'Riel de colgar', def: 'Solid strip at the top and bottom of a cabinet back that the mounting screws go through.', def_es: 'Tira sólida arriba y abajo del respaldo del gabinete por donde pasan los tornillos de fijación.' },
      { term: 'Reveal', term_es: 'Separación visible (revelado)', def: 'The even gap seen between doors, drawers and the frame; it shows how well the doors are adjusted.', def_es: 'La separación pareja entre puertas, cajones y el marco; muestra qué tan bien están ajustadas las puertas.' },
      { term: 'Light rail', term_es: 'Moldura inferior (riel de luz)', def: 'Trim under upper cabinets that hides under-cabinet lights.', def_es: 'Moldura bajo los gabinetes superiores que oculta la iluminación bajo gabinete.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  hazards: [
    { id: 'upper_cabinet_fall', hazard: 'Upper or tall cabinet falling or tipping onto workers before it is screwed to the framing', hazard_es: PENDING_ES, controls: ['Support uppers on a ledger strip, cabinet jack or T-brace until every screw is in — never hold by hand alone', 'Remove doors, drawers and shelves before lifting; use two people for uppers and tall cabinets', 'Screw tall and pantry cabinets to wall framing before loading them'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, ppe: ['safety-toe boots', 'gloves'], prov: { ...osha('c'), note: 'General duty to train on unsafe conditions; support-until-fastened practice per MasterBrand install guide (T-brace).' } },
    { id: 'cabinet_stacks', hazard: 'Stacked cabinet boxes sliding or toppling in the staging area', hazard_es: PENDING_ES, controls: ['Stack boxes on a level floor, heaviest at the bottom, and limit stack height so they stay stable', 'Keep stacks out of walkways and away from door swings'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 2, prov: osha('h') },
    { id: 'hidden_utilities', hazard: 'Drilling or screwing into live wiring, water or gas lines hidden in the wall behind cabinets', hazard_es: PENDING_ES, controls: ['Mark rough-in locations before walls are closed or scan the wall before drilling', 'Keep screws in stud centers and away from outlet, pipe and vent locations; shut off the circuit when work is near it'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(3)', severity: 4, prov: { ...osha('k'), note: 'Ascertain concealed energized circuits before work; MasterBrand guide warns of utilities behind the wall.' } },
    { id: 'circular_saw', hazard: 'Cuts and kickback from portable circular or track saws cutting fillers and panels', hazard_es: PENDING_ES, controls: ['Keep upper and lower guards working; the lower guard must snap back', 'Clamp the work and support both sides of the cut'], controls_es: PENDING_ES, osha_ref: '1926.304(d)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'table_saw', hazard: 'Hand contact or kickback on a jobsite table saw ripping fillers and scribe strips', hazard_es: PENDING_ES, controls: ['Keep the blade guard, riving knife and anti-kickback device in place', 'Use a push stick on narrow rips; never reach over the blade'], controls_es: PENDING_ES, osha_ref: '1926.304(i)(1)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'pin_nailer', hazard: 'Puncture wounds from pneumatic finish or pin nailers fastening crown, light rail and toe kick', hazard_es: PENDING_ES, controls: ['Keep the muzzle safety device working; never bypass it', 'Keep hands clear of the nail path on thin trim'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(3)', severity: 2, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'stepladder', hazard: 'Falls from a stepladder while setting uppers, crown and light rail', hazard_es: PENDING_ES, controls: ['Never stand on the top step or top cap of a stepladder', 'Set the ladder fully open on a level floor and move it instead of reaching'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'cord_shock', hazard: 'Electric shock from saws, drills and extension cords', hazard_es: PENDING_ES, controls: ['Use GFCI protection on every temporary receptacle', 'Inspect cords daily and pull damaged ones from service'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'eye_injury', hazard: 'Eye injury from chips, sawdust and drill debris', hazard_es: PENDING_ES, controls: ['Wear safety glasses whenever cutting, drilling or nailing'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'wood_dust', hazard: 'Breathing wood, MDF and particleboard dust when cutting panels indoors', hazard_es: PENDING_ES, controls: ['Cut outdoors or use saws with dust extraction', 'Wear a dust respirator for indoor cutting and clean up with a vacuum, not a broom'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, ppe: ['N95 respirator'], prov: osha('d') },
    { id: 'packing_debris', hazard: 'Trips and cuts from cardboard, straps and staples left in the work area', hazard_es: PENDING_ES, controls: ['Break down and remove packaging as cabinets are unboxed', 'Keep aisles and doorways clear during install'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 1, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'conditioned_space', item: 'Building enclosed, wet work done and HVAC running before cabinets arrive; cabinets stored off the floor in a dry, enclosed room and left to acclimate before install.', item_es: tr('Edificio cerrado, trabajos húmedos terminados y climatización funcionando antes de recibir gabinetes; gabinetes guardados sobre el piso en un cuarto seco y cerrado y aclimatados antes de instalar.'), prov: ufgs('1.5 storage, 1.6 environmental limits, 3.1 condition at least 72 h') },
    { id: 'inspect_on_delivery', item: 'Every cabinet checked against the order and for damage on delivery; damaged boxes put back in the carton and reported before install.', item_es: tr('Cada gabinete revisado contra el pedido y por daños al recibirlo; las cajas dañadas se regresan al empaque y se reportan antes de instalar.'), prov: mb('Step 1') },
    { id: 'layout_and_specs', item: 'Layout field-measured against the shop drawings; appliance cut sheets, sink base and plumbing/electrical rough-in locations confirmed before the first cabinet goes up.', item_es: tr('Trazo medido en obra contra los planos de taller; fichas de aparatos, gabinete de fregadero y ubicaciones de instalaciones confirmados antes de colocar el primer gabinete.'), prov: { src: ['cabinetry-ufgs-06-41-16', 'cabinetry-masterbrand-install'], confidence: 'verified', last_verified: D, note: 'UFGS 2.11 verify field measurements; MasterBrand Step 3 confirm the design fits.' } },
    { id: 'reference_lines', item: 'Floor high point found and level reference lines snapped for the top of the base run and the bottom of the uppers on every wall.', item_es: tr('Punto alto del piso localizado y líneas de referencia a nivel trazadas para la parte superior de los inferiores y la parte inferior de los superiores en cada muro.'), prov: mb('Step 2') },
    { id: 'level_plumb', item: 'Cabinets level, plumb and true in line within 1/8 in. in 8 ft, using concealed shims.', item_es: tr('Gabinetes a nivel, a plomo y alineados dentro de 1/8 pulg en 8 pies, con calzas ocultas.'), prov: ufgs('3.1 installation tolerance') },
    { id: 'uppers_into_framing', item: 'Uppers and tall cabinets screwed through the hanging rails into studs, blocking or hanging strips near top and bottom — screws, never nails or drywall-only anchors; masonry gets proper anchors.', item_es: PENDING_ES, safety: true, prov: { src: ['cabinetry-ufgs-06-41-16', 'cabinetry-masterbrand-install'], confidence: 'verified', last_verified: D, note: 'UFGS 3.1 wall fastening (screws into framing/blocking at max 16 in o.c., 1-1/2 in penetration); MasterBrand never use nails.' } },
    { id: 'no_cut_backs', item: 'No wall-cabinet back cut or weakened to clear an obstruction unless extra support is added; cabinets are never left freestanding.', item_es: PENDING_ES, safety: true, prov: { src: ['cabinetry-masterbrand-install', 'cabinetry-kraftmaid-install'], confidence: 'verified', last_verified: D, note: 'MasterBrand: modifying the back weakens the cabinet; installer must compensate.' } },
    { id: 'backs_shimmed', item: 'Cabinet backs shimmed solid at each screw so the back does not bow into wall low spots; screws kept clear of the inside side edges.', item_es: tr('Respaldos calzados firmes en cada tornillo para que no se curven hacia las partes bajas del muro; tornillos alejados de los cantos interiores.'), prov: mb('Steps 7–9') },
    { id: 'face_frames_flush', item: 'Adjacent face frames clamped flush on the face and bottom edge, pre-drilled and screwed together; frameless boxes joined through the sides.', item_es: tr('Marcos frontales vecinos prensados a ras en la cara y el borde inferior, pretaladrados y atornillados; cajas sin marco unidas por los costados.'), prov: mb('Steps 5–6') },
    { id: 'scribe_fillers', item: 'Fillers, end panels and scribe strips cut tight to walls and floor; cut edges refinished and no gaps left open.', item_es: tr('Rellenos, paneles laterales y tiras de ajuste cortados a medida contra muros y piso; cantos cortados con acabado y sin huecos abiertos.'), prov: ufgs('3.1 scribe and refinish cut surfaces') },
    { id: 'doors_drawers', item: 'Doors and drawers fit their openings without binding, reveals even, faces aligned, soft-close and hinges adjusted.', item_es: tr('Puertas y cajones ajustan en sus vanos sin trabarse, separaciones parejas, frentes alineados, cierre suave y bisagras ajustadas.'), prov: km },
    { id: 'toe_kick_trim', item: 'Toe kick continuous and scribed to the floor; crown and light rail tight at miters and aligned across the run.', item_es: tr('Zócalo continuo y ajustado al piso; moldura superior e inferior cerradas en los ingletes y alineadas en todo el tramo.'), prov: est('Common finish practice; not stated in the cited install guides') },
    { id: 'hardware_per_spec', item: 'Pulls and knobs at the specified model and location, set with a template so they line up; hardware tightened, cleaned and lubricated.', item_es: tr('Jaladeras y perillas del modelo y ubicación especificados, colocadas con plantilla para que queden alineadas; herrajes apretados, limpios y lubricados.'), prov: ufgs('3.1 hardware as indicated; 3.2 clean, lubricate and adjust') },
    { id: 'protect_clean', item: 'Finished cabinets protected from later trades; damaged pieces repaired or replaced; exposed and semi-exposed surfaces cleaned at turnover.', item_es: tr('Gabinetes terminados protegidos de los demás oficios; piezas dañadas reparadas o reemplazadas; superficies expuestas y semiexpuestas limpias al entregar.'), prov: ufgs('3.2 adjusting and cleaning') },
    { id: 'ada_casework', item: 'Accessible casework (commercial): work surface 28–34 in. high, knee and toe space under the accessible sink or lavatory, accessible storage within the 15–48 in. reach range.', item_es: tr('Mobiliario accesible (comercial): superficie de trabajo de 28 a 34 pulg de alto, espacio libre para rodillas y pies bajo el fregadero o lavabo accesible, y almacenaje accesible dentro del alcance de 15 a 48 pulg.'), prov: ada('2010 ADA 902.3 work surface height; 606.2 / 306 knee and toe clearance; 308 / 811 reach range for storage') },
  ],
  inspection_checklists: {
    layout_verify: [
      { item: 'Shop drawings or kitchen plan approved and on site; field dimensions match', item_es: tr('Planos de taller o de cocina aprobados y en obra; las medidas de campo coinciden') },
      { item: 'Appliance specs, sink base and rough-in locations checked against the layout', item_es: tr('Especificaciones de aparatos, gabinete de fregadero y ubicaciones de instalaciones revisadas contra el trazo') },
      { item: 'Wall blocking in place behind uppers and tall cabinets; studs marked', item_es: tr('Bloqueo en el muro detrás de superiores y gabinetes altos; montantes marcados') },
      { item: 'Room ready: drywall finished, HVAC on, flooring sequence agreed', item_es: tr('Cuarto listo: tablaroca terminada, climatización encendida y orden del piso acordado') },
    ],
    upper_install_check: [
      { item: 'Every upper and tall cabinet screwed into framing or blocking — no nails, no drywall-only anchors', item_es: PENDING_ES },
      { item: 'Uppers level and on the reference line; ledger or jack removed only after fastening', item_es: PENDING_ES },
    ],
    final_walkthrough: [
      { item: 'Runs level, plumb and aligned; face frames flush; fillers and panels scribed', item_es: tr('Tramos a nivel, a plomo y alineados; marcos a ras; rellenos y paneles ajustados') },
      { item: 'Doors and drawers operate freely with even reveals; hardware complete', item_es: tr('Puertas y cajones operan libremente con separaciones parejas; herrajes completos') },
      { item: 'Toe kick, crown and light rail installed; touch-up done; cabinets clean', item_es: tr('Zócalo, moldura superior e inferior instalados; retoques hechos; gabinetes limpios') },
      { item: 'Ready for countertop template: base tops level and in plane', item_es: tr('Listo para la plantilla de cubierta: partes superiores de los inferiores a nivel y en un mismo plano') },
    ],
    ada_casework_check: [
      { item: 'Accessible work surface and sink height verified with a tape (commercial)', item_es: tr('Altura de superficie de trabajo y fregadero accesibles verificada con cinta (comercial)'), ref: '2010 ADA 902.3 / 606.3' },
      { item: 'Knee and toe clearance clear of cabinet bottoms and exposed pipes protected', item_es: tr('Espacio para rodillas y pies libre de fondos de gabinete y tuberías expuestas protegidas'), ref: '2010 ADA 306 / 606.5' },
    ],
  },
  assemblies: [
    { code: 'G-CB-VANITY-EA', name: 'Bath vanity cabinet, 30–36 in. stock, set, leveled and secured, each', name_es: 'Gabinete de baño (tocador) de línea de 30 a 36 pulg, colocado, nivelado y fijado, c/u', unit: 'EA', csi: '12 35 30',
      material_cost_cents: { v: 35000, prov: est('mid-grade stock vanity box without top, national baseline 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('layout, cut plumbing openings in back, shim, fasten to studs') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-CB-TALL-EA', name: 'Tall pantry or oven cabinet, 84–96 in., set, leveled and anchored to framing, each', name_es: 'Gabinete alto de despensa u horno de 84 a 96 pulg, colocado, nivelado y anclado a la estructura, c/u', unit: 'EA', csi: '12 32 00',
      material_cost_cents: { v: 65000, prov: est('mid-grade framed tall cabinet, national baseline 2026') }, labor_hours_per_unit: { v: 2.0, prov: est('two-person set, shim, scribe and anchor to wall framing') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-CB-CROWN-LF', name: 'Cabinet crown or light rail molding, installed, per LF', name_es: 'Moldura superior o inferior de gabinete, instalada, por pie lineal', unit: 'LF', csi: '06 22 00',
      material_cost_cents: { v: 900, prov: est('pre-finished matching cabinet molding, national baseline 2026') }, labor_hours_per_unit: { v: 0.15, prov: est('cope/miter, glue and pin-nail incl. returns') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 12, prov: est('miter and return offcuts') } },
    { code: 'G-CB-HARDWARE-EA', name: 'Cabinet knob or pull, installed with drilling template, each', name_es: 'Perilla o jaladera de gabinete, instalada con plantilla de taladro, c/u', unit: 'EA', csi: '12 32 00',
      material_cost_cents: { v: 600, prov: est('mid-range builder pull or knob') }, labor_hours_per_unit: { v: 0.1, prov: est('mark with template, drill, fasten, align') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 3, prov: est('spares for misdrills') } },
    { code: 'G-CB-REMOVE-LF', name: 'Existing cabinet removal (base + upper) and disposal, per LF of wall', name_es: 'Retiro de gabinetes existentes (inferiores y superiores) y desecho, por pie lineal de muro', unit: 'LF', csi: '02 41 19',
      material_cost_cents: { v: 0, prov: est('no material') }, labor_hours_per_unit: { v: 0.3, prov: est('disconnect-free removal after plumbing/electrical make-safe; carry out') },
      equipment_cost_cents: { v: 250, prov: est('dumpster / haul-off share per LF') }, waste_pct: { v: 0, prov: est('n/a') } },
  ],
  quantity_rules: [
    { code: 'G-CB-CROWN-LF', assumption: 'Cabinet callout — crown or light rail along the upper run ≈16 LF (matches the G-CAB-UPPER-LF seed; delete if no crown)', when: { facts_any: ['cabinetry'] }, qty: { basis: { component: 'cabinetry' }, mul: 16 } },
    { code: 'G-CB-HARDWARE-EA', assumption: 'Cabinet callout — ≈30 pulls/knobs for a 20 LF base + 16 LF upper kitchen (count doors and drawers on elevations)', when: { facts_any: ['cabinetry'] }, qty: { basis: { component: 'cabinetry' }, mul: 30 } },
    { code: 'G-CB-TALL-EA', assumption: 'Cabinet callout on a single-family plan — assume one pantry/tall cabinet until elevations are read', when: { facts_any: ['cabinetry'], building_types: ['residential_sf'] }, qty: { basis: { component: 'cabinetry' }, mul: 1 } },
    { code: 'G-CB-VANITY-EA', assumption: 'Cabinet callout on a single-family plan — assume two bath vanities until the bath count is confirmed', when: { facts_any: ['cabinetry'], building_types: ['residential_sf'] }, qty: { basis: { component: 'cabinetry' }, mul: 2 } },
  ],
  dependency_hints: [
    { note: 'Cabinets go in after drywall finish (and primer/paint where specified) with HVAC running; plumbing and electrical rough-in must be done and inspected.' },
    { note: 'Base cabinets must be set, level and fastened before the countertop template is taken.' },
  ],
});
