// Trade Knowledge Pack — finish_carpentry (Finish Carpentry / Trim). Wave 03, COMPLEMENT pattern:
// the hand recipe in task-buildout/nopermit.ts keeps producing the work step ("miters tight, fasteners
// set and filled, hardware adjusted"); this pack adds glossary, hazards, QA, owner hold-point
// checklists, equipment hints and trim assemblies the catalog lacks. Interior doors themselves stay on
// the hand-seeded B-DOOR-INT (slab + jamb + hardware) — this pack prices only the casing around them.
// permit_trade null → no gates, no code_refs; IRC stair/guard sections appear only as QA provenance.
// Dossier: docs/trade-packs/dossiers/finish_carpentry.md. Sources: UFGS 06 20 00, ANSI/AWI 0620 (ref),
// JELD-WEN + Masonite prehung interior door instructions, IRC (ref), 29 CFR 1926 Subparts C, D, E, I, K, X.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['finish_carpentry-ufgs-06-20-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const awi = (note: string) => ({ src: ['finish_carpentry-awi-aws', 'finish_carpentry-ufgs-06-20-00'], confidence: 'verified' as const, last_verified: D, note });
const door = (note: string) => ({ src: ['finish_carpentry-jeldwen-jii109', 'finish_carpentry-masonite-prehung'], confidence: 'verified' as const, last_verified: D, note });
const irc = (note: string) => ({ src: ['icc-pa', 'finish_carpentry-ufgs-06-20-00'], confidence: 'verified' as const, last_verified: D, note });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });
const RES = ['residential_sf', 'residential_mf'] as ('residential_sf' | 'residential_mf')[];

export default definePack({
  key: 'finish_carpentry',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Interior trim carpentry: door and window casing, stool and apron, baseboard and shoe, crown, hanging prehung interior doors, site-built closet shelving and rods, and light stair parts such as wall handrails — installed tight, set and filled, ready for paint or stain.',
    summary_es: 'Carpintería de molduras interiores: marcos de puertas y ventanas, repisa y faldón de ventana, zócalo y cuarto bocel, cornisa, colocación de puertas interiores premontadas, repisas y tubos de clóset hechos en obra y piezas ligeras de escalera como pasamanos de pared — instalado ajustado, clavos hundidos y resanados, listo para pintar o teñir.',
    glossary: [
      { term: 'Casing', term_es: 'Marco (moldura de marco)', def: 'Trim that covers the gap between a door or window jamb and the drywall.', def_es: 'Moldura que tapa la junta entre el marco de una puerta o ventana y el panel de yeso.' },
      { term: 'Reveal', term_es: 'Retranqueo (revelado)', def: 'The small, even setback of casing from the face edge of the jamb, usually about 3/16 in.', def_es: 'El pequeño retiro parejo de la moldura respecto al borde del marco, normalmente unos 3/16 pulg.' },
      { term: 'Cope', term_es: 'Empalme contraperfilado', def: 'Cutting one trim piece to the profile of the other so an inside corner stays tight as the wood moves.', def_es: 'Cortar una moldura con la forma del perfil de la otra para que la esquina interior quede ajustada aunque la madera se mueva.' },
      { term: 'Miter', term_es: 'Inglete', def: 'Two pieces cut at matching angles (usually 45°) to meet at an outside corner or casing head.', def_es: 'Dos piezas cortadas a ángulos iguales (normalmente 45°) que se juntan en una esquina exterior o en la cabeza del marco.' },
      { term: 'Stool and apron', term_es: 'Repisa y faldón de ventana', def: 'The interior window shelf (stool) and the flat trim piece under it (apron).', def_es: 'La repisa interior de la ventana y la moldura plana debajo de ella (faldón).' },
      { term: 'Shoe molding', term_es: 'Cuarto bocel (moldura de pie)', def: 'Small molding nailed to the base at the floor to hide gaps; set after finish flooring.', def_es: 'Moldura pequeña clavada al zócalo junto al piso para tapar huecos; se coloca después del piso terminado.' },
      { term: 'Scribe', term_es: 'Trazar y ajustar (escribir)', def: 'Marking and cutting trim to follow an uneven floor or wall so no gap shows.', def_es: 'Marcar y cortar la moldura para seguir un piso o muro desnivelado sin que se vea una abertura.' },
      { term: 'Prehung door', term_es: 'Puerta premontada', def: 'A door already hung on its hinges in its jamb, set into the rough opening as one unit.', def_es: 'Puerta ya colgada en sus bisagras dentro de su marco, que se coloca en el vano como una sola pieza.' },
      { term: 'Paint-grade / stain-grade', term_es: 'Grado pintura / grado tinte', def: 'Paint-grade trim may be MDF or finger-jointed and is caulked; stain-grade is clear solid wood with no caulk or filler showing.', def_es: 'La moldura grado pintura puede ser MDF o madera unida y se sella; la de grado tinte es madera sólida limpia sin sellador ni resane visible.' },
      { term: 'Hook strip', term_es: 'Listón de soporte (de clóset)', def: 'Board fastened to the closet wall that carries the shelf and rod sockets.', def_es: 'Tabla fijada al muro del clóset que sostiene la repisa y los soportes del tubo.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  equipment: [
    { when: { title_re: 'trim|casing|base|crown|millwork|door' }, type: 'air_compressor', reason: 'Pneumatic finish and brad nailers for casing, base and crown', optional: true },
  ],
  hazards: [
    { id: 'miter_saw', hazard: 'Blade contact and kickback at the miter saw or table saw while cutting trim', hazard_es: PENDING_ES, controls: ['Keep the saw guards in place and working; never tie back a guard', 'Hold short pieces with a clamp or hold-down, not fingers near the blade; use a push stick on the table saw', 'Let the blade stop before reaching in to clear offcuts'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'circular_saw', hazard: 'Cuts from portable circular or track saws when ripping shelving or scribing', hazard_es: PENDING_ES, controls: ['Keep upper and lower guards working; the lower guard must return on its own', 'Support the stock so the kerf does not pinch the blade'], controls_es: PENDING_ES, osha_ref: '1926.304(d)', severity: 3, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'woodworking_machines', hazard: 'Unsafe setup of shop or jobsite woodworking machines (table saw, router table)', hazard_es: PENDING_ES, controls: ['Set up and use woodworking machines per the maker and the woodworking machinery safety code', 'Unplug or lock out before changing blades or bits'], controls_es: PENDING_ES, osha_ref: '1926.304(f)', severity: 3, prov: osha('i') },
    { id: 'nailer', hazard: 'Puncture wounds from pneumatic finish and brad nailers, including nails blowing through thin trim', hazard_es: PENDING_ES, controls: ['Keep the muzzle safety device working; never bypass it', 'Keep the free hand away from the nailing line; never point the tool at anyone'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(3)', severity: 3, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'air_hose', hazard: 'Air hose whip or blow-off; blowing dust off with shop air', hazard_es: PENDING_ES, controls: ['Lock tools to the hose with a positive connector', 'Do not clean with compressed air unless reduced below 30 psi with chip guarding and eye protection — vacuum instead'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(4)', severity: 2, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'stepladder', hazard: 'Fall from a stepladder while installing crown, casing heads or closet shelves', hazard_es: PENDING_ES, controls: ['Do not stand on the top or top step of a stepladder', 'Use a ladder tall enough for the work or a rolling platform; move it instead of reaching'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'open_stair', hazard: 'Fall from an unprotected stair side or landing while stair parts and rails are not yet in', hazard_es: PENDING_ES, controls: ['Keep a temporary stair rail and handrail on stairs with four or more risers until the finished rail is installed', 'Reinstall temporary rails at the end of each shift if removed for work'], controls_es: PENDING_ES, osha_ref: '1926.1052(c)(1)', severity: 4, prov: osha('x') },
    { id: 'wood_dust', hazard: 'Breathing wood and MDF dust from cutting and sanding trim', hazard_es: PENDING_ES, controls: ['Cut with dust collection or a shop vacuum attached; cut MDF outdoors or with extraction', 'Clean up with a HEPA vacuum, not a broom; wear a respirator when dust cannot be controlled'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, ppe: ['dust mask or respirator'], prov: osha('d', 'Wood dust is a listed air contaminant; respirator use falls under 1926.103.') },
    { id: 'eye_injury', hazard: 'Eye injury from flying chips, nails and sanding dust', hazard_es: PENDING_ES, controls: ['Wear safety glasses whenever cutting, nailing, sanding or using compressed air'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'noise', hazard: 'Hearing damage from saws, compressors and nailers in closed rooms', hazard_es: PENDING_ES, controls: ['Wear ear plugs or muffs when running saws or near the compressor', 'Place the compressor outside or away from the work room'], controls_es: PENDING_ES, osha_ref: '1926.101(a)', severity: 2, ppe: ['hearing protection'], prov: osha('e') },
    { id: 'door_lifting', hazard: 'Back strain or crushed hands carrying and setting prehung and solid-core doors', hazard_es: PENDING_ES, controls: ['Use two people to carry and set prehung units; lift, do not drag', 'Train crews on safe lifting and keep fingers clear of the hinge and latch edges when setting'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, ppe: ['gloves'], prov: { src: ['ecfr-1926-c', 'finish_carpentry-jeldwen-jii109'], confidence: 'verified', last_verified: D, note: 'General hazard-training duty; two-person handling from the door maker\'s instructions.' } },
    { id: 'cord_shock', hazard: 'Electric shock from saws and cords on temporary power', hazard_es: PENDING_ES, controls: ['Use GFCI protection on every temporary receptacle', 'Inspect cords daily and pull damaged ones from service'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
  ],
  qa_checklist: [
    { id: 'pre_trim_ready', phase: 'finishes_interior', item: 'Drywall finished and primed, wet trades dry and HVAC running before trim is delivered or installed; paint-grade or stain-grade decided for every room.', item_es: tr('Panel de yeso terminado y con primer, oficios húmedos secos y climatización funcionando antes de entregar o instalar la moldura; grado pintura o grado tinte definido para cada cuarto.'), prov: ufgs('1.6 — do not store products in the building until wet trades are dry and humidity is within the maker\'s limits') },
    { id: 'stock_acclimated', phase: 'finishes_interior', item: 'Trim and doors stored flat, dry and off the floor in the rooms where they go, and acclimated before install; no pieces with moisture or mold.', item_es: tr('Molduras y puertas guardadas planas, secas y sin tocar el piso en los cuartos donde van, y aclimatadas antes de instalar; ninguna pieza con humedad o moho.'), prov: door('Doors acclimate 48+ h at room conditions before finishing; UFGS 1.6/2.5 storage and moisture limits.') },
    { id: 'blocking_present', phase: 'finishes_interior', item: 'Backing or blocking in place for crown, handrail brackets, closet hook strips and grab or towel bars before trim starts.', item_es: tr('Respaldo o bloqueo colocado para cornisa, soportes de pasamanos, listones de clóset y barras antes de empezar la moldura.'), prov: ufgs('3.1.7 wall rails on brackets; 3.2 shelf supports') },
    { id: 'door_plumb_gaps', phase: 'finishes_interior', item: 'Interior doors plumb on the hinge side, shimmed behind every nail at hinges and strike, with an even gap at head and latch side; doors stay put when left half open.', item_es: tr('Puertas interiores a plomo del lado de las bisagras, calzadas detrás de cada clavo en bisagras y cerradero, con holgura pareja arriba y del lado del pestillo; la puerta no se mueve sola a medio abrir.'), prov: door('Hinge side plumb, shim behind each nail, adjust frame for equal gap; UFGS 3.1.3 blocking at hinges and strike.') },
    { id: 'door_latch', phase: 'finishes_interior', item: 'Every door latches without slamming and without binding; stops set so the door closes evenly against them.', item_es: tr('Cada puerta engancha sin azotarla y sin rozar; los topes colocados para que la puerta cierre parejo contra ellos.'), prov: door('Stops fitted with door closed; check operation after install.') },
    { id: 'casing_reveal', phase: 'finishes_interior', item: 'Casing reveal is the same all around each opening and matches from opening to opening; casing heads and legs in single lengths.', item_es: tr('El retranqueo del marco es igual alrededor de cada vano y coincide entre vanos; cabeza y lados del marco en piezas de un solo largo.'), prov: ufgs('3.1.2 / 3.8 door and window trim in single lengths') },
    { id: 'tight_joints', phase: 'finishes_interior', item: 'Outside corners mitered and inside corners coped; joints tight with no visible gap and no step between pieces.', item_es: tr('Esquinas exteriores a inglete y esquinas interiores contraperfiladas; juntas ajustadas sin abertura visible y sin escalón entre piezas.'), prov: ufgs('3.1 / 3.8 — miter external corners, cope returns and interior angles') },
    { id: 'nails_set_filled', phase: 'finishes_interior', item: 'Face nails set below the surface and filled; filler matches the finish on stain-grade work; no hammer marks or split ends.', item_es: tr('Clavos de cara hundidos bajo la superficie y resanados; el resane iguala el acabado en trabajo grado tinte; sin marcas de martillo ni puntas rajadas.'), prov: ufgs('3.8 set and stop face nailing with nonstaining putty to match finish') },
    { id: 'base_scribed', phase: 'finishes_interior', item: 'Base fastened into framing, scribed to the floor with no gaps; shoe or one-piece base set after finish flooring is in.', item_es: tr('Zócalo fijado a la estructura y ajustado al piso sin aberturas; el cuarto bocel o zócalo de una pieza se coloca después del piso terminado.'), prov: ufgs('3.1.6 bases — set shoe/one-piece base after finish flooring') },
    { id: 'stool_apron', phase: 'finishes_interior', item: 'Window stool level and notched over the sill; apron centered under it with returns cut to the profile.', item_es: tr('Repisa de ventana a nivel y recortada sobre el antepecho; faldón centrado debajo con retornos cortados al perfil.'), prov: ufgs('3.1.5 window stools and aprons') },
    { id: 'crown_straight', phase: 'finishes_interior', item: 'Crown sits fully on wall and ceiling along its length, nailed into backing, with no open joints at scarfs or corners.', item_es: tr('La cornisa apoya completa en muro y techo a todo lo largo, clavada al respaldo, sin juntas abiertas en empalmes ni esquinas.'), prov: awi('Installation per ANSI/AWI 0620 (reference); UFGS 3.8 straight, plumb, level, closely fitted.') },
    { id: 'caulk_paint_grade', phase: 'finishes_interior', item: 'Paint-grade joints and trim-to-wall gaps caulked with paintable sealant; no caulk on stain-grade work.', item_es: tr('Juntas grado pintura y holguras entre moldura y muro selladas con sellador pintable; sin sellador en trabajo grado tinte.'), prov: awi('Common paint-grade practice; AWI finish standards (reference).') },
    { id: 'closet_shelf_rod', phase: 'finishes_interior', item: 'Closet shelves level on hook strips without sag; rods parallel to the shelf edge with sockets at each end and mid supports on long runs.', item_es: tr('Repisas de clóset a nivel sobre listones sin pandeo; tubos paralelos al borde de la repisa con soportes en cada extremo y apoyos intermedios en tramos largos.'), prov: ufgs('3.2 shelving supports; 3.3 rods with end sockets and intermediate brackets') },
    { id: 'handrail_secure', phase: 'finishes_interior', item: 'Stair handrails continuous at the code height range, graspable, returned to the wall or a post at the ends, and anchored on brackets into blocking; guards and balusters solid with no climbable or oversized openings.', item_es: PENDING_ES, safety: true, prov: irc('IRC R311.7.8 handrails and R312.1 guards (reference only); UFGS 3.1.7 rail brackets and newel anchorage.') },
  ],
  inspection_checklists: {
    pre_trim_check: [
      { item: 'Drywall finished, sanded and primed; wet trades dry and HVAC running', item_es: tr('Panel de yeso terminado, lijado y con primer; oficios húmedos secos y climatización funcionando') },
      { item: 'Trim profiles, species and paint-grade or stain-grade confirmed per room', item_es: tr('Perfiles, especie de madera y grado pintura o tinte confirmados por cuarto') },
      { item: 'Trim and doors on site long enough to acclimate, stored flat and dry', item_es: tr('Molduras y puertas en obra el tiempo suficiente para aclimatarse, guardadas planas y secas') },
      { item: 'Blocking for crown, handrails, closet strips and accessories verified', item_es: tr('Bloqueo para cornisa, pasamanos, listones de clóset y accesorios verificado') },
      { item: 'Flooring sequence agreed — base before or after finish floor, shoe after', item_es: tr('Secuencia de pisos acordada — zócalo antes o después del piso terminado, cuarto bocel después') },
      { item: 'Temporary stair rails in place on open stairs', item_es: PENDING_ES },
    ],
    stair_rail_check: [
      { item: 'Handrail height and continuity checked along the full flight', item_es: PENDING_ES, ref: 'IRC R311.7.8' },
      { item: 'Handrail ends returned to wall or post; brackets into blocking', item_es: PENDING_ES, ref: 'IRC R311.7.8' },
      { item: 'Guards and balusters rigid; opening sizes checked', item_es: PENDING_ES, ref: 'IRC R312.1' },
      { item: 'Newels and posts anchored to stair framing without wobble', item_es: PENDING_ES },
    ],
    final_walkthrough: [
      { item: 'Every door swings, latches and stays put; even gaps; hardware tight', item_es: tr('Cada puerta abre, engancha y se queda en su lugar; holguras parejas; herrajes apretados') },
      { item: 'Miters and copes tight; nails set and filled; no hammer marks or splits', item_es: tr('Ingletes y contraperfiles ajustados; clavos hundidos y resanados; sin marcas ni rajaduras') },
      { item: 'Base scribed to floor; shoe installed; no gaps at casing or corners', item_es: tr('Zócalo ajustado al piso; cuarto bocel instalado; sin aberturas en marcos ni esquinas') },
      { item: 'Paint-grade joints caulked and ready for paint; stain-grade free of filler smears', item_es: tr('Juntas grado pintura selladas y listas para pintar; grado tinte sin manchas de resane') },
      { item: 'Closet shelves and rods level and solid', item_es: tr('Repisas y tubos de clóset a nivel y firmes') },
      { item: 'Scrap, nails and dust cleaned up; touch-up list given to the painter', item_es: tr('Retazos, clavos y polvo limpiados; lista de retoques entregada al pintor') },
    ],
  },
  assemblies: [
    { code: 'G-FC-CASING-EA', name: 'Interior door casing, one side of an opening (2 legs + head), paint-grade, installed', name_es: 'Marco de puerta interior, un lado del vano (2 lados + cabeza), grado pintura, instalado', unit: 'EA', csi: '06 22 00',
      material_cost_cents: { v: 1800, prov: est('~17 LF of 2-1/4 to 3-1/4 in. primed MDF / finger-jointed casing + nails, national baseline 2026') }, labor_hours_per_unit: { v: 0.5, prov: est('mark reveal, cut miters, nail, set — one side of a standard opening') },
      equipment_cost_cents: { v: 0, prov: est('tools only; compressor covered by equipment rules') }, waste_pct: { v: 10, prov: est('miter offcuts and defects') } },
    { code: 'G-FC-WIN-INT-EA', name: 'Interior window trim — stool, apron and casing, per window, paint-grade', name_es: 'Moldura interior de ventana — repisa, faldón y marco, por ventana, grado pintura', unit: 'EA', csi: '06 22 00',
      material_cost_cents: { v: 3500, prov: est('stool stock + apron + ~12 LF casing, primed, national baseline 2026') }, labor_hours_per_unit: { v: 1.25, prov: est('notch and fit stool, return apron, case three sides') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('offcuts') } },
    { code: 'G-FC-BASE-LF', name: 'Baseboard with shoe molding, paint-grade, coped and scribed, per LF', name_es: 'Zócalo con cuarto bocel, grado pintura, contraperfilado y ajustado, por pie lineal', unit: 'LF', csi: '06 22 00',
      material_cost_cents: { v: 180, prov: est('3-1/4 to 5-1/4 in. primed MDF base + shoe + nails, national baseline 2026') }, labor_hours_per_unit: { v: 0.05, prov: est('cope, scribe and nail base, then shoe after flooring') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('cope and corner offcuts') } },
    { code: 'G-FC-CROWN-LF', name: 'Crown molding, paint-grade, up to 4-1/2 in., per LF', name_es: 'Moldura de cornisa, grado pintura, hasta 4-1/2 pulg, por pie lineal', unit: 'LF', csi: '06 22 00',
      material_cost_cents: { v: 250, prov: est('primed MDF / finger-jointed crown + nails + adhesive, national baseline 2026') }, labor_hours_per_unit: { v: 0.09, prov: est('two-person install from ladders, cope inside corners') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 15, prov: est('compound-cut offcuts and test pieces') } },
    { code: 'G-FC-CLOSET-SHELF-LF', name: 'Site-built closet shelf with hook strip and clothes rod, per LF', name_es: 'Repisa de clóset hecha en obra con listón de soporte y tubo para ropa, por pie lineal', unit: 'LF', csi: '06 22 00',
      material_cost_cents: { v: 900, prov: est('1x12 or 3/4 in. shelf + 1x4 hook strip + rod, sockets and mid brackets share, 2026') }, labor_hours_per_unit: { v: 0.15, prov: est('level and fasten strips into studs, cut shelf and rod, set brackets') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 8, prov: est('end cuts') } },
    { code: 'G-FC-HANDRAIL-LF', name: 'Wall-mounted wood stair handrail on brackets with returns, per LF', name_es: 'Pasamanos de madera de escalera sobre soportes de pared con retornos, por pie lineal', unit: 'LF', csi: '06 43 00',
      material_cost_cents: { v: 1200, prov: est('stock wood handrail + brackets every ~4 ft + return fittings share, 2026') }, labor_hours_per_unit: { v: 0.2, prov: est('locate blocking, set brackets on a string line, fit returns') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('return and end cuts') } },
  ],
  quantity_rules: [
    { code: 'G-FC-CASING-EA', assumption: 'Door schedule count × 1.75 casing sides (≈75% interior doors cased both sides + exterior doors cased inside). Door units themselves are on B-DOOR-INT / B-DOOR-EXT', when: { building_types: RES }, qty: { basis: 'doors', mul: 1.75, round: 'ceil' } },
    { code: 'G-FC-WIN-INT-EA', assumption: 'One interior stool/apron/casing set per scheduled window (drywall-return windows: delete). Exterior trim is B-WIN-TRIM-EA', when: { building_types: RES }, qty: { basis: 'windows' } },
    { code: 'G-FC-BASE-LF', assumption: 'Baseboard ≈ 40 LF per scheduled room (perimeter less door openings) until measured; delete in tiled rooms with tile base', when: { building_types: RES }, qty: { basis: 'rooms', mul: 40, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['drywall'], note: 'Trim follows finished, primed drywall; shoe or one-piece base waits for the finish floor, and final paint and caulk touch-up follow trim.' },
  ],
});
