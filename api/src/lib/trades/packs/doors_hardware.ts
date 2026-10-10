// Trade Knowledge Pack — doors_hardware (Interior Doors, Frames & Hardware — Div 08 11 / 08 14 / 08 71).
// Wave 10, COMPLEMENT pattern: the hand recipe in task-buildout/nopermit.ts keeps producing the work step
// ("hardware adjusted to operate smoothly"); this pack adds glossary, hazards, QA, owner / fire-marshal
// hold-point checklists, an equipment hint and the hardware assemblies the catalog lacks. The door unit
// itself stays on the hand-seeded B-DOOR-INT (slab + jamb + passage/privacy hardware) — this pack prices
// only what that line does NOT include (closers, exit devices, metal frames, rated assemblies, ADA levers).
// permit_trade null → no gates, no code_refs; NFPA 80 / IBC 716 / ADA 404 appear only as checklist refs.
// Dossier: docs/trade-packs/dossiers/doors_hardware.md. Sources: UFGS 08 71 00 + 08 11 13, 2010 ADA
// Standards §404, NFPA 80 / BHMA / DHI (reference only), 29 CFR 1926 Subparts C, E, I, J, K, X, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const hw = (note?: string) => ({ src: ['doors_hardware-ufgs-08-71-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const frame = (note?: string) => ({ src: ['doors_hardware-ufgs-08-11-13'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ada = (note: string) => ({ src: ['plumbing-ada-2010'], confidence: 'verified' as const, last_verified: D, note });
const fire = (note: string) => ({ src: ['nfpa-fa', 'doors_hardware-ufgs-08-11-13', 'doors_hardware-ufgs-08-71-00'], confidence: 'verified' as const, last_verified: D, note });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });
const NONRES = ['commercial', 'industrial'] as ('commercial' | 'industrial')[];

export default definePack({
  key: 'doors_hardware',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Interior doors, frames and finish hardware: setting hollow metal or wood frames plumb and anchored, hanging doors to even clearances, installing hinges, locksets, closers, exit devices, stops and kick plates per the hardware schedule, keeping fire-rated openings intact and labeled, and meeting accessible hardware height, force and closing-speed limits.',
    summary_es: 'Puertas interiores, marcos y herrajes: marcos de metal o madera a plomo y anclados, puertas con holguras parejas, bisagras, cerraduras, cierrapuertas, barras antipánico y topes según el programa de herrajes, aberturas cortafuego íntegras y etiquetadas, y herrajes accesibles dentro de los límites de altura, fuerza y velocidad de cierre.',
    glossary: [
      { term: 'Hardware set', term_es: 'Juego de herrajes', def: 'The numbered list of hinges, lock, closer, stops and other pieces that goes on one door type, keyed to the door schedule.', def_es: 'La lista numerada de bisagras, cerradura, cierrapuertas, topes y demás piezas que lleva un tipo de puerta, ligada al programa de puertas.' },
      { term: 'Hollow metal frame', term_es: 'Marco de metal hueco', def: 'Formed steel door frame, welded or knock-down, anchored to the wall and floor; common in commercial work.', def_es: 'Marco de puerta de acero formado, soldado o desarmable, anclado al muro y al piso; común en obra comercial.' },
      { term: 'Fire door assembly', term_es: 'Conjunto de puerta cortafuego', def: 'A labeled door, labeled frame and listed hardware that together carry the opening\'s fire rating; changing any part can void it.', def_es: 'Puerta etiquetada, marco etiquetado y herrajes listados que juntos dan la clasificación contra fuego de la abertura; cambiar cualquier parte puede anularla.' },
      { term: 'Positive latching', term_es: 'Enganche positivo', def: 'A latch bolt that holds the door closed on its own; rated doors must latch every time they close.', def_es: 'Un pestillo que mantiene la puerta cerrada por sí solo; las puertas cortafuego deben engancharse cada vez que cierran.' },
      { term: 'Exit device (panic hardware)', term_es: 'Barra antipánico (dispositivo de salida)', def: 'A push bar across the door that releases the latch with one motion for free egress.', def_es: 'Una barra de empuje a lo ancho de la puerta que libera el pestillo con un solo movimiento para salir libremente.' },
      { term: 'Door closer', term_es: 'Cierrapuertas', def: 'Hydraulic arm and body that closes and latches the door; its sweep and latch speeds are adjustable valves.', def_es: 'Brazo y cuerpo hidráulico que cierra y engancha la puerta; sus velocidades de barrido y de enganche se ajustan con válvulas.' },
      { term: 'Strike', term_es: 'Contrachapa (cerradero)', def: 'The plate on the frame that receives the latch bolt.', def_es: 'La placa en el marco que recibe el pestillo.' },
      { term: 'Lever trim', term_es: 'Manija de palanca', def: 'Lever handle operable without tight grasping or twisting — the accessible choice over a knob.', def_es: 'Manija de palanca que se opera sin apretar fuerte ni girar la muñeca — la opción accesible frente a una perilla.' },
      { term: 'Wall stop / floor stop', term_es: 'Tope de pared / tope de piso', def: 'Bumper that keeps the lever or door edge from hitting the wall; wall stops need blocking behind drywall.', def_es: 'Tope que evita que la manija o el canto de la puerta golpeen el muro; los topes de pared necesitan bloqueo detrás del panel de yeso.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  equipment: [
    { when: { title_re: 'door|frame|hardware' }, type: 'air_compressor', reason: 'Pneumatic finish nailer for door stops and casing on wood frames', optional: true },
  ],
  hazards: [
    { id: 'powder_actuated', hazard: 'Fastener blow-through or ricochet when shooting frame base anchors with a powder-actuated tool', hazard_es: PENDING_ES, controls: ['Only workers trained on that specific tool may use it; keep the training card on site', 'Test the tool each day before loading and tag out a tool that fails', 'Never shoot into brittle, thin or spalled concrete or near an edge; keep others clear of the far side of the wall'], controls_es: PENDING_ES, osha_ref: '1926.302(e)(1)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'silica_drilling', hazard: 'Breathing silica dust while drilling concrete or masonry for frame anchors, thresholds and floor stops', hazard_es: PENDING_ES, controls: ['Use a drill with a dust-collection shroud or a vacuum attached, or drill wet', 'Clean up with a HEPA vacuum, never by dry sweeping or blowing'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['safety glasses', 'respirator when indoors and dust is not controlled'], prov: osha('z', 'Table 1 handheld drill entry — shroud with dust collector or water.') },
    { id: 'nailer', hazard: 'Puncture wounds from pneumatic nailers setting stops and casing', hazard_es: PENDING_ES, controls: ['Keep the muzzle safety device working; never bypass it', 'Keep the free hand off the nailing line; never point the tool at anyone'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(3)', severity: 2, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'chisel_mortise', hazard: 'Hand cuts from chisels and mortising tools when cutting hinge and strike mortises', hazard_es: PENDING_ES, controls: ['Use sharp chisels with sound handles and no mushroomed heads', 'Clamp or wedge the door on a horse; cut away from the body and hands; prefer a hinge-mortise jig'], controls_es: PENDING_ES, osha_ref: '1926.301(a)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('i') },
    { id: 'door_lifting', hazard: 'Back strain or crushed hands carrying and hanging heavy solid-core, steel and fire-rated doors', hazard_es: PENDING_ES, controls: ['Use two people or a door cart for solid-core and steel doors; never carry a rated door alone', 'Keep fingers clear of the hinge and latch edges; set the door on shims, then drive the pins'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, ppe: ['gloves', 'safety shoes'], prov: osha('c', 'General hazard-training duty; handling practice from common door-maker instructions.') },
    { id: 'stepladder', hazard: 'Fall from a stepladder while mounting closers, overhead stops and coordinators at the door head', hazard_es: PENDING_ES, controls: ['Do not stand on the top or top step of a stepladder', 'Set the ladder fully open and locked, out of the door swing; block the door so it cannot be pushed into the ladder'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'frame_welding', hazard: 'Fire and burns from field welding hollow metal frame anchors, splices or floor clips', hazard_es: PENDING_ES, controls: ['Move or protect combustibles before welding; keep a fire extinguisher at the frame', 'Shield the arc from others and keep a fire watch until the metal cools'], controls_es: PENDING_ES, osha_ref: '1926.352(a)', severity: 3, ppe: ['welding helmet', 'leather gloves'], prov: osha('j') },
    { id: 'cord_shock', hazard: 'Electric shock from drills and cords on temporary power, and from cutting into walls with live wiring at electrified hardware', hazard_es: PENDING_ES, controls: ['Use GFCI protection on every temporary receptacle and inspect cords daily', 'Have the electrician de-energize power-transfer hinges, electric strikes and card readers before drilling or connecting'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'eye_injury', hazard: 'Eye injury from metal chips, drill shavings and nails', hazard_es: PENDING_ES, controls: ['Wear safety glasses whenever drilling, cutting, mortising or nailing'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'noise', hazard: 'Hearing damage from hammer drills, powder-actuated tools and compressors in closed corridors', hazard_es: PENDING_ES, controls: ['Wear ear plugs or muffs when hammer drilling or shooting anchors', 'Keep the compressor away from the work room'], controls_es: PENDING_ES, osha_ref: '1926.101(a)', severity: 2, ppe: ['hearing protection'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'schedule_match', phase: 'finishes_interior', item: 'Door, frame and hardware set at every opening match the door schedule and approved hardware submittal (size, handing, rating, finish).', item_es: tr('La puerta, el marco y el juego de herrajes en cada abertura coinciden con el programa de puertas y la propuesta de herrajes aprobada (medida, mano, clasificación, acabado).'), prov: hw('Drawings list hardware set numbers in the door schedule; submittals approved before install.') },
    { id: 'frame_plumb_anchored', phase: 'finishes_interior', item: 'Frames plumb, square and in plane, braced until anchored; jamb anchors built into the wall and base anchors fastened to the floor.', item_es: tr('Marcos a plomo, a escuadra y alineados, apuntalados hasta quedar anclados; anclas de jamba integradas al muro y anclas de base fijadas al piso.'), prov: frame('3.1.1 set frames plumb, aligned and braced; anchor bottoms with expansion bolts or powder-actuated fasteners') },
    { id: 'door_clearances', phase: 'finishes_interior', item: 'Doors hung with even clearances at head, hinge and latch edges and a consistent undercut; no binding or rubbing anywhere in the swing.', item_es: tr('Puertas colgadas con holguras parejas arriba, del lado de bisagras y del pestillo, y un corte inferior uniforme; sin rozar ni trabarse en todo el recorrido.'), prov: frame('3.1.2 hang doors to the clearances of SDI A250.8 (reference).') },
    { id: 'hardware_fastening', phase: 'finishes_interior', item: 'Hardware fastened with full-threaded screws into wood, expansion shields in masonry, toggles in hollow construction and through-bolts where called for; no stripped or missing screws.', item_es: tr('Herrajes fijados con tornillos de rosca completa en madera, taquetes de expansión en mampostería, tornillos de mariposa en construcción hueca y pernos pasantes donde se indique; sin tornillos barridos ni faltantes.'), prov: hw('3.1 fastening by substrate') },
    { id: 'hardware_heights', phase: 'finishes_interior', item: 'Levers, pulls, locks and other operable parts mounted between 34 in. and 48 in. above the finish floor; kick plates on the push side.', item_es: tr('Manijas, jaladeras, cerraduras y demás partes operables montadas entre 34 y 48 pulg sobre el piso terminado; placas de protección del lado de empuje.'), prov: ada('2010 ADA Standards 404.2.7 (34–48 in. AFF); UFGS 08 71 00 3.3 locations per SDI A250.8 (ref), kick plates push side.') },
    { id: 'lever_operable', phase: 'finishes_interior', item: 'Accessible doors have lever or push/pull hardware usable with one hand, without tight grasping, pinching or twisting of the wrist.', item_es: tr('Las puertas accesibles tienen manija de palanca o herraje de empujar/jalar que se usa con una mano, sin apretar fuerte, pellizcar ni girar la muñeca.'), prov: ada('2010 ADA Standards 404.2.7 → 309.4 operable parts.') },
    { id: 'closer_timing', phase: 'finishes_interior', item: 'Closers adjusted so the door takes at least 5 seconds to move from 90° open to 12° from the latch, then latches without slamming.', item_es: tr('Cierrapuertas ajustados para que la puerta tarde al menos 5 segundos en pasar de 90° abierta a 12° del pestillo, y luego enganche sin azotarse.'), prov: ada('2010 ADA Standards 404.2.8.1 closing speed; UFGS 08 71 00 3.5 adjust closers to operate properly.') },
    { id: 'opening_force', phase: 'finishes_interior', item: 'Interior hinged non-rated doors open with no more than 5 lbf continuous push or pull (checked with a gauge); rated doors at the minimum force the authority allows.', item_es: tr('Las puertas interiores abatibles no clasificadas abren con no más de 5 lbf de empuje o jalón continuo (medido con báscula); las puertas clasificadas con la fuerza mínima que permita la autoridad.'), prov: ada('2010 ADA Standards 404.2.9 — 5 lbf interior hinged and sliding/folding; excludes latch-retraction force.') },
    { id: 'clear_width', phase: 'finishes_interior', item: 'Accessible doorways give at least 32 in. clear between the door face and the stop with the door open 90°; no hardware projecting into it below 34 in.', item_es: tr('Las puertas accesibles dejan al menos 32 pulg libres entre la cara de la puerta y el tope con la puerta abierta a 90°; sin herrajes que sobresalgan en ese espacio por debajo de 34 pulg.'), prov: ada('2010 ADA Standards 404.2.3 clear width and projections.') },
    { id: 'bottom_surface', phase: 'finishes_interior', item: 'Push side of swinging doors smooth for the bottom 10 in. across the full width; added kick plates capped with no open cavities.', item_es: tr('El lado de empuje de las puertas abatibles es liso en las 10 pulg inferiores a todo lo ancho; placas de protección añadidas con bordes cerrados, sin cavidades abiertas.'), prov: ada('2010 ADA Standards 404.2.10 door surfaces.') },
    { id: 'fire_door_labels', phase: 'finishes_interior', item: 'Every fire-rated opening has a legible label on door and frame, listed hinges, closer and latching hardware, no field holes or unlisted modifications, and closes and positively latches from full open.', item_es: PENDING_ES, safety: true, prov: fire('NFPA 80 (reference only) install and field inspection; UFGS 08 11 13 3.1.3 and 08 71 00 3.2 require NFPA 80 compliance; IBC 716 (ref).') },
    { id: 'egress_free', phase: 'finishes_interior', item: 'Exit and egress doors open from the egress side with one motion, without a key or special knowledge; exit devices release the latch along the full bar.', item_es: PENDING_ES, safety: true, prov: fire('NFPA 101 / IBC means-of-egress door rules (reference only); UFGS 08 71 00 3.2 exit doors per NFPA 101.') },
    { id: 'stop_blocking', phase: 'finishes_interior', item: 'Wall stops fastened into blocking behind drywall (or floor stops set) at every door that would strike a wall.', item_es: tr('Topes de pared fijados al bloqueo detrás del panel de yeso (o topes de piso colocados) en cada puerta que golpearía un muro.'), prov: hw('Drawings show blocking behind wall stops on wallboard partitions.') },
    { id: 'keys_turnover', phase: 'punch', item: 'Every lock demonstrated with its permanent key, construction cores replaced, keys tagged by door/room and turned over with the keying schedule.', item_es: tr('Cada cerradura probada con su llave definitiva, núcleos de obra reemplazados, llaves etiquetadas por puerta/cuarto y entregadas con el programa de llaves.'), prov: hw('3.4 key tagging; 3.5 demonstrate permanent keys and turn them over') },
    { id: 'hardware_protected', phase: 'punch', item: 'Hardware protected from paint and damage until acceptance; frames free of rust, dents and mastic smears.', item_es: tr('Herrajes protegidos de pintura y daños hasta la entrega; marcos sin óxido, abolladuras ni manchas de adhesivo.'), prov: { src: ['doors_hardware-ufgs-08-71-00', 'doors_hardware-ufgs-08-11-13'], confidence: 'verified', last_verified: D, note: '08 71 00 3.5 protect hardware; 08 11 13 3.2/3.3 repair, wire-brush rust, prime and clean.' } },
  ],
  inspection_checklists: {
    frame_set_check: [
      { item: 'Frame size, handing, throat depth and fire label match the schedule before walls are closed', item_es: tr('Medida, mano, garganta y etiqueta contra fuego del marco coinciden con el programa antes de cerrar los muros') },
      { item: 'Frame plumb, square and braced; spreader left on until anchored', item_es: tr('Marco a plomo, a escuadra y apuntalado; separador colocado hasta anclarlo') },
      { item: 'Jamb and base anchors installed per the frame type; frames grouted where specified', item_es: tr('Anclas de jamba y de base colocadas según el tipo de marco; marcos rellenos de mortero donde se especifique') },
      { item: 'Blocking in place for closers, wall stops and electrified hardware', item_es: tr('Bloqueo colocado para cierrapuertas, topes de pared y herrajes electrificados') },
    ],
    fire_door_inspection: [
      { item: 'Door and frame labels present and legible; rating matches the wall', item_es: PENDING_ES, ref: 'NFPA 80' },
      { item: 'Door closes and positively latches from the full-open position', item_es: PENDING_ES, ref: 'NFPA 80' },
      { item: 'Clearances at head, edges and bottom within the listed limits', item_es: PENDING_ES, ref: 'NFPA 80' },
      { item: 'Only listed hinges, closer and latching hardware; no auxiliary hold-opens, kick-down stops or field-drilled holes', item_es: PENDING_ES, ref: 'NFPA 80' },
      { item: 'Glazing, vision kits and gasketing labeled for the rating; no gaps in smoke seals', item_es: PENDING_ES, ref: 'IBC 716' },
      { item: 'Inspection recorded and reported to the owner (repeated yearly by the owner)', item_es: PENDING_ES, ref: 'NFPA 80' },
    ],
    ada_hardware_check: [
      { item: 'Operable hardware 34–48 in. above finish floor; lever or push/pull, one hand, no twisting', item_es: tr('Herraje operable a 34–48 pulg del piso terminado; palanca o empujar/jalar, una mano, sin girar la muñeca'), ref: 'ADA 404.2.7' },
      { item: 'Clear width at least 32 in. with door open 90°', item_es: tr('Ancho libre de al menos 32 pulg con la puerta abierta a 90°'), ref: 'ADA 404.2.3' },
      { item: 'Closer sweep 90° to 12° takes 5 seconds or more', item_es: tr('El barrido del cierrapuertas de 90° a 12° tarda 5 segundos o más'), ref: 'ADA 404.2.8.1' },
      { item: 'Opening force 5 lbf max on interior non-fire doors (gauge reading recorded)', item_es: tr('Fuerza de apertura máxima de 5 lbf en puertas interiores no cortafuego (lectura de báscula registrada)'), ref: 'ADA 404.2.9' },
      { item: 'Threshold height and bevel within the accessible limits', item_es: tr('Altura y bisel del umbral dentro de los límites accesibles'), ref: 'ADA 404.2.5' },
      { item: 'Push side smooth for the bottom 10 in.', item_es: tr('Lado de empuje liso en las 10 pulg inferiores'), ref: 'ADA 404.2.10' },
    ],
    hardware_turnover: [
      { item: 'Hinges, locks, latches, closers and holders adjusted and operating', item_es: tr('Bisagras, cerraduras, pestillos, cierrapuertas y retenedores ajustados y funcionando') },
      { item: 'Permanent cores installed; every key demonstrated in its lock', item_es: tr('Núcleos definitivos instalados; cada llave probada en su cerradura') },
      { item: 'Keys tagged by door/room and master level, delivered with the keying schedule', item_es: tr('Llaves etiquetadas por puerta/cuarto y nivel maestro, entregadas con el programa de llaves') },
      { item: 'Maker instructions, closer and exit-device templates and warranty papers handed to the owner', item_es: tr('Instrucciones del fabricante, plantillas de cierrapuertas y barras antipánico, y garantías entregadas al dueño') },
      { item: 'Damaged finishes, rust and paint on hardware corrected', item_es: tr('Acabados dañados, óxido y pintura sobre herrajes corregidos') },
    ],
  },
  assemblies: [
    { code: 'G-DHW-HM-FRAME-EA', name: 'Hollow metal door frame, 16 ga, single 3070, set, anchored and braced', name_es: 'Marco de puerta de metal hueco, calibre 16, sencillo 3070, colocado, anclado y apuntalado', unit: 'EA', csi: '08 11 13',
      material_cost_cents: { v: 26000, prov: est('primed 16 ga knock-down or welded frame + jamb/base anchors, national baseline 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('set, plumb, brace and anchor one single frame') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools only') }, waste_pct: { v: 0, prov: est('fabricated to size') } },
    { code: 'G-DHW-FIRE-ASSY-EA', name: 'Fire-rated door assembly 45–90 min — labeled steel door + frame + listed hinges, latch, closer, single 3070', name_es: 'Conjunto cortafuego 45–90 min — puerta y marco de acero etiquetados + herrajes listados, sencilla 3070', unit: 'EA', csi: '08 11 13',
      material_cost_cents: { v: 145000, prov: est('labeled 18 ga door + 16 ga frame + listed hardware set, national baseline 2026; price is per complete opening') }, labor_hours_per_unit: { v: 4.0, prov: est('frame set and anchor, hang, install listed hardware, adjust to latch from full open') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('fabricated to size') } },
    { code: 'G-DHW-CLOSER-EA', name: 'Surface door closer, heavy duty, installed and adjusted (sweep, latch, backcheck)', name_es: 'Cierrapuertas de superficie, uso pesado, instalado y ajustado (barrido, enganche, freno de apertura)', unit: 'EA', csi: '08 71 00',
      material_cost_cents: { v: 19000, prov: est('grade 1 surface closer with arm and drop plate as needed, national baseline 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('template, drill, mount, set arm preload, adjust valves') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('unit item') } },
    { code: 'G-DHW-EXIT-DEVICE-EA', name: 'Rim exit device (panic hardware) with outside trim, installed and adjusted', name_es: 'Barra antipánico de sobreponer con manija exterior, instalada y ajustada', unit: 'EA', csi: '08 71 00',
      material_cost_cents: { v: 52000, prov: est('grade 1 rim exit device + lever/pull trim + strike, national baseline 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('template, drill door and frame, mount bar, strike and trim, adjust') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('unit item') } },
    { code: 'G-DHW-LEVER-RETRO-EA', name: 'Accessible lever lockset retrofit (remove knob set, install lever passage/privacy/entry set, adjust strike)', name_es: 'Reemplazo por cerradura de palanca accesible (retirar perilla, instalar juego de palanca, ajustar contrachapa)', unit: 'EA', csi: '08 71 00',
      material_cost_cents: { v: 9500, prov: est('grade 2 cylindrical lever set, national baseline 2026') }, labor_hours_per_unit: { v: 0.6, prov: est('remove old set, fit lever set to existing bore, re-set strike') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('unit item') } },
  ],
  quantity_rules: [
    { code: 'G-DHW-CLOSER-EA', assumption: 'Commercial/industrial: closers on ≈50% of scheduled doors (corridor, stair, restroom, rated and exterior openings). B-DOOR-INT/EXT carry only basic passage/privacy hardware', when: { building_types: NONRES }, qty: { basis: 'doors', mul: 0.5, round: 'ceil' } },
    { code: 'G-DHW-EXIT-DEVICE-EA', assumption: 'Commercial/industrial: exit devices on ≈10% of scheduled doors (required egress doors from assembly/large occupant loads) — confirm against the life-safety plan', when: { building_types: NONRES }, qty: { basis: 'doors', mul: 0.1, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['drywall'], note: 'Metal frames are set before or with stud walls; doors, closers and finish hardware hang after drywall finish and paint, and final keying happens at punch.' },
  ],
});
