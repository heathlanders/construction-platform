// Trade Knowledge Pack — flooring_wood (Flooring — Hardwood). Wave 03, COMPLEMENT pattern:
// the shared flooring branch in task-buildout/nopermit.ts keeps producing the work steps (Prep
// substrate → Install flooring → …); this pack adds glossary, hazards (wood dust, finish vapors,
// oily rags, sanders, nailers), QA, owner/QC checkpoints and the hardwood assemblies the catalog lacks.
// permit_trade null → no inspection gates, no code refs. Dossier: docs/trade-packs/dossiers/flooring_wood.md.
// Sources: UFGS 09 64 29, NWFA guidelines (ref only), Shaw hardwood install guidance, NIOSH NPG wood dust,
// 29 CFR 1926 Subparts D, E, F, H, I, K, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['flooring_wood-ufgs-09-64-29'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const shaw = (note?: string) => ({ src: ['flooring_wood-shaw-hardwood-install'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const nwfa = (note: string) => ({ src: ['flooring_wood-nwfa-guidelines'], confidence: 'verified' as const, last_verified: D, note });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'flooring_wood',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Solid and engineered hardwood floors: moisture testing and acclimation, subfloor prep, nail-down, glue-down or floating installation, site sanding and finishing, stair treads and transitions. Base trim and painting belong to other trades.',
    summary_es: 'Pisos de madera maciza y de ingeniería: medición de humedad y aclimatación, preparación del contrapiso, instalación clavada, pegada o flotante, lijado y acabado en sitio, peldaños de escalera y transiciones. El zócalo y la pintura son de otros oficios.',
    glossary: [
      { term: 'Acclimation', term_es: 'Aclimatación', def: 'Letting the flooring and the room reach the moisture level the floor will live at before installing it.', def_es: 'Dejar que la madera y el cuarto lleguen a la humedad en la que vivirá el piso antes de instalarlo.' },
      { term: 'Moisture content (MC)', term_es: 'Contenido de humedad', def: 'Percent of water in the wood or subfloor, read with a moisture meter before installing.', def_es: 'Porcentaje de agua en la madera o el contrapiso, medido con un medidor de humedad antes de instalar.' },
      { term: 'Expansion gap', term_es: 'Junta de expansión', def: 'Space left at walls and fixed objects so the floor can swell without buckling; hidden by base or shoe.', def_es: 'Espacio que se deja en muros y objetos fijos para que el piso se dilate sin levantarse; lo tapa el zócalo.' },
      { term: 'Engineered hardwood', term_es: 'Madera de ingeniería', def: 'Plank with a real-wood wear layer glued over a plywood or core backing; can be nailed, glued or floated.', def_es: 'Tabla con capa de madera real pegada sobre una base de contrachapado; se puede clavar, pegar o dejar flotante.' },
      { term: 'Floating floor', term_es: 'Piso flotante', def: 'Floor joined to itself over an underlayment, not fastened to the subfloor.', def_es: 'Piso unido entre sí sobre una base acústica, sin fijarse al contrapiso.' },
      { term: 'Flooring cleat / nailer', term_es: 'Clavo de piso / clavadora', def: 'Barbed nail driven through the tongue at an angle with a mallet-struck or pneumatic flooring nailer.', def_es: 'Clavo con púas que se clava en ángulo por la lengüeta con una clavadora de piso de mazo o neumática.' },
      { term: 'Racking', term_es: 'Distribución de tablas', def: 'Laying out boards ahead of nailing so end joints are staggered and lengths look random.', def_es: 'Acomodar las tablas antes de clavar para alternar las uniones y que los largos se vean al azar.' },
      { term: 'Chatter marks', term_es: 'Marcas de vibración', def: 'Evenly spaced ridges across the boards left by a drum sander that bounced or had a bad drum.', def_es: 'Rayas parejas a lo ancho de las tablas que deja una lijadora de tambor que rebota o tiene el tambor dañado.' },
      { term: 'Screening (buffing)', term_es: 'Abrasión entre capas', def: 'Lightly abrading a cured finish coat with a buffer and screen so the next coat bonds.', def_es: 'Raspar ligeramente una capa de acabado curada con pulidora y malla para que pegue la siguiente capa.' },
      { term: 'Reducer / T-mold', term_es: 'Reductor / moldura en T', def: 'Transition strip where wood meets a lower floor or another floor of the same height.', def_es: 'Moldura de transición donde la madera se une a un piso más bajo o a otro piso de la misma altura.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  equipment: [
    { when: { title_re: 'hardwood|wood floor|flooring|stair tread' }, type: 'air_compressor', reason: 'Pneumatic flooring nailer / stapler and trim nailers', optional: true },
  ],
  hazards: [
    { id: 'wood_dust', hazard: 'Breathing wood dust from sanding and cutting; NIOSH treats wood dust as a potential occupational carcinogen (nasal cancer)', hazard_es: PENDING_ES,
      controls: ['Sand with dust-containment sanders connected to a HEPA vacuum or dust collector; empty bags often', 'Keep exposure below the OSHA limit; use a NIOSH-approved respirator under a written respiratory program where dust is not controlled', 'Clean with HEPA vacuum, not dry sweeping or compressed air'],
      controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 3, ppe: ['NIOSH-approved respirator (N95 or better) when dust is not controlled', 'safety glasses'],
      prov: { src: ['ecfr-1926-d', 'flooring_wood-niosh-npg-wood-dust', 'ecfr-1926-e'], confidence: 'verified', last_verified: D, note: 'NIOSH NPG: REL Ca TWA 1 mg/m3; respirators per 1926.103 (= 1910.134).' } },
    { id: 'finish_vapors', hazard: 'Breathing solvent and isocyanate vapors from stains, sealers, oil-modified and two-part finishes', hazard_es: PENDING_ES,
      controls: ['Ventilate to the outside with fans while applying and curing; keep vapors out of occupied areas', 'Read the SDS; use organic-vapor respirators where the label or SDS calls for them', 'Keep unprotected people out of the room until the finish cures'],
      controls_es: PENDING_ES, osha_ref: '1926.57(a)', severity: 3, ppe: ['organic-vapor respirator per SDS', 'chemical-resistant gloves'], prov: osha('d') },
    { id: 'finish_fire', hazard: 'Fire or flash from flammable finish and solvent vapors reaching pilot lights, sparks or smoking', hazard_es: PENDING_ES,
      controls: ['Shut off pilot lights and other ignition sources in the area before applying solvent finishes', 'Post and enforce "No Smoking or Open Flame" while finishing', 'Keep flammable finish in approved containers; no more than the day\'s need in the room'],
      controls_es: PENDING_ES, osha_ref: '1926.151(a)(3)', severity: 4, ppe: [], prov: { src: ['ecfr-1926-f'], confidence: 'verified', last_verified: D, note: '1926.151(a) ignition hazards; 1926.152(a) approved containers.' } },
    { id: 'oily_rags', hazard: 'Spontaneous combustion of rags, pads and applicators soaked with oil-based stain or finish', hazard_es: PENDING_ES,
      controls: ['Put used rags and pads in a fire-resistant covered metal container (water-filled) right away', 'Remove the container from the building at the end of each day', 'Never leave wadded rags in a pile, a trash bag or a vehicle'],
      controls_es: PENDING_ES, osha_ref: '1926.252(e)', severity: 4, ppe: [], prov: osha('h') },
    { id: 'sander_dust_fire', hazard: 'Fine sanding dust smoldering in a sander bag or debris pile, especially dust mixed with finish residue', hazard_es: PENDING_ES,
      controls: ['Empty sander bags into a covered metal container outdoors after each use and at day end', 'Never leave a full bag on the sander or inside the house overnight'],
      controls_es: PENDING_ES, osha_ref: '1926.252(e)', severity: 3, ppe: [], prov: osha('h', 'Treated like oily waste under 1926.252(e); industry fire-prevention practice.') },
    { id: 'drum_sander', hazard: 'Caught by the spinning drum or belt of a floor sander, or the sander running away when the drum is lowered', hazard_es: PENDING_ES,
      controls: ['Keep drum and belt guards in place; never reach near the drum while it turns', 'Unplug before changing paper; keep the cord behind you and over the shoulder', 'Lower and raise the drum only while the machine is moving'],
      controls_es: PENDING_ES, osha_ref: '1926.300(b)(2)', severity: 3, ppe: ['close-fitting clothes, no loose sleeves'], prov: osha('i') },
    { id: 'sander_shock', hazard: 'Electric shock from sanders, edgers and buffers on temporary power or damaged cords', hazard_es: PENDING_ES,
      controls: ['Use GFCI protection on 120V 15/20A temporary receptacles', 'Inspect cords and plugs daily; pull damaged ones from service'],
      controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)(ii)', severity: 3, ppe: [], prov: osha('k') },
    { id: 'pneumatic_nailer', hazard: 'Fasteners driven into hands, feet or knees by pneumatic flooring and trim nailers', hazard_es: PENDING_ES,
      controls: ['Keep the muzzle safety device working on nailers above 100 psi; never bypass it', 'Secure the tool to the hose with a positive coupler', 'Keep hands and knees clear of the nailing path'],
      controls_es: PENDING_ES, osha_ref: '1926.302(b)(3)', severity: 2, ppe: ['knee pads', 'safety glasses'], prov: osha('i') },
    { id: 'noise', hazard: 'Hearing loss from drum sanders, edgers, saws and compressors in closed rooms', hazard_es: PENDING_ES,
      controls: ['Use quieter tools where possible and keep compressors outside the room', 'Wear hearing protection when noise exceeds the OSHA table'],
      controls_es: PENDING_ES, osha_ref: '1926.52(a)', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('d') },
    { id: 'eye_injury', hazard: 'Eye injury from flying chips, nails, sanding grit and finish splashes', hazard_es: PENDING_ES,
      controls: ['Wear safety glasses with side protection when cutting, nailing or sanding; goggles when pouring finish'],
      controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses with side shields', 'goggles for finish'], prov: osha('e') },
    { id: 'slab_silica', hazard: 'Respirable silica from grinding or scraping a concrete slab flat before glue-down', hazard_es: PENDING_ES,
      controls: ['Grind with a shroud and HEPA vacuum, or water, as Table 1 of the silica standard specifies', 'Use the respirator Table 1 lists for the task and duration'],
      controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator per Table 1'], prov: osha('z') },
    { id: 'adhesive_skin', hazard: 'Skin and eye contact with urethane adhesives, fillers and finishes', hazard_es: PENDING_ES,
      controls: ['Wear chemical-resistant gloves and eye protection when troweling adhesive or mixing finish', 'Clean skin promptly per the SDS'],
      controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 1, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'storage_conditions', phase: 'finishes_interior', item: 'Flooring delivered in unopened labeled cartons and stored covered and ventilated, in a space at the same temperature and humidity as the rooms it goes in.', item_es: tr('Piso entregado en cajas cerradas y etiquetadas y guardado cubierto y ventilado, en un espacio a la misma temperatura y humedad que los cuartos donde se instala.'), prov: ufgs('§1.5') },
    { id: 'hvac_running', phase: 'finishes_interior', item: 'Permanent heat and A/C (or equivalent) running and room temperature and humidity held at living conditions for several days before, during and after install.', item_es: tr('Calefacción y aire acondicionado funcionando y la temperatura y humedad del cuarto a condiciones de vivienda varios días antes, durante y después de instalar.'), prov: { src: ['flooring_wood-ufgs-09-64-29', 'flooring_wood-shaw-hardwood-install'], confidence: 'verified', last_verified: D, note: 'UFGS §1.6: conditions held from ≥3 days before install; Shaw: HVAC running, 65–75°F, 35–55% RH.' } },
    { id: 'moisture_readings', phase: 'finishes_interior', item: 'Moisture readings of the subfloor and of the flooring recorded before install; the difference is inside the flooring maker\'s and NWFA limits for that plank width.', item_es: tr('Lecturas de humedad del contrapiso y del piso registradas antes de instalar; la diferencia está dentro de los límites del fabricante y de la NWFA para ese ancho de tabla.'), prov: nwfa('NWFA installation guidelines set MC-difference limits by board width — reference only, follow the manufacturer.') },
    { id: 'acclimated', phase: 'finishes_interior', item: 'Flooring acclimated on site per the manufacturer (open or closed cartons as directed) until its moisture content is in range.', item_es: tr('Piso aclimatado en sitio según el fabricante (cajas abiertas o cerradas según indique) hasta que su humedad esté en rango.'), prov: shaw() },
    { id: 'substrate_flat', phase: 'finishes_interior', item: 'Slab or subfloor clean, dry and flat to the manufacturer tolerance (slabs: about 1/8 in. in a 10 ft radius where UFGS applies); high spots ground, low spots filled.', item_es: tr('Losa o contrapiso limpio, seco y plano según la tolerancia del fabricante (losas: unos 1/8 pulg en un radio de 10 pies donde aplica UFGS); puntos altos rebajados, bajos rellenados.'), prov: ufgs('§3.1 slab tolerance; wood subfloor per manufacturer.') },
    { id: 'moisture_barrier', phase: 'finishes_interior', item: 'Vapor retarder or underlayment installed where specified — 6-mil poly or a listed membrane over slabs, laps sealed; floating floors on the maker\'s underlayment.', item_es: tr('Barrera de vapor o base instalada donde se indique — polietileno de 6 mil o membrana aprobada sobre losas, traslapes sellados; pisos flotantes sobre la base del fabricante.'), prov: ufgs('§2.5 moisture barrier 6 mil poly; floating per Shaw.') },
    { id: 'expansion_gap', phase: 'finishes_interior', item: 'Expansion space left at every wall, column, pipe and threshold (at least the floor thickness or the maker\'s figure) and fully covered by base, shoe or transition.', item_es: tr('Espacio de expansión en cada muro, columna, tubo y umbral (al menos el grueso del piso o lo que indique el fabricante) y cubierto por zócalo, cuarto bocel o transición.'), prov: { src: ['flooring_wood-shaw-hardwood-install', 'flooring_wood-ufgs-09-64-29'], confidence: 'verified', last_verified: D, note: 'Shaw: gap ≥ floor thickness; UFGS §3.2 sizes perimeter space by room width.' } },
    { id: 'end_joint_stagger', phase: 'finishes_interior', item: 'End joints staggered at least 6 in. between adjacent rows, at least two boards between joints in line, no H-joints or stair-step patterns; boards pulled from several cartons.', item_es: tr('Uniones de extremo alternadas al menos 6 pulg entre hileras vecinas, al menos dos tablas entre uniones alineadas, sin patrones en H ni escalonados; tablas tomadas de varias cajas.'), prov: { src: ['flooring_wood-ufgs-09-64-29', 'flooring_wood-shaw-hardwood-install'], confidence: 'verified', last_verified: D, note: 'UFGS §3.2 joint stagger; Shaw: work from multiple cartons.' } },
    { id: 'fastening', phase: 'finishes_interior', item: 'Nail-down: fasteners at the maker\'s spacing and size, start/finish rows face-nailed and filled, no split tongues. Glue-down: full adhesive coverage with the listed trowel, boards rolled or weighted.', item_es: tr('Clavado: clavos al espaciado y tamaño del fabricante, primeras y últimas hileras clavadas de cara y resanadas, sin lengüetas rotas. Pegado: adhesivo en toda la superficie con la llana indicada, tablas rodilladas o con peso.'), prov: shaw('Fastener schedule and trowel are product-specific — follow the instructions in the carton.') },
    { id: 'tight_flat_install', phase: 'finishes_interior', item: 'Boards tight with no gaps beyond the maker\'s allowance, no lippage you can catch a fingernail on, no hollow spots under glue-down boards, no squeaks.', item_es: tr('Tablas apretadas sin separaciones mayores a lo permitido, sin desniveles que atoren la uña, sin huecos bajo las tablas pegadas y sin rechinidos.'), prov: nwfa('NWFA acceptance concept: judged standing, normal light — reference only.') },
    { id: 'sanding_sequence', phase: 'finishes_interior', item: 'Site-finished floors sanded in at least three cuts, each with finer grit, edges blended, with no burns, chatter marks, cross-grain scratches or edger swirls visible after the first coat.', item_es: tr('Pisos con acabado en sitio lijados en al menos tres pasadas, cada una con grano más fino, orillas emparejadas, sin quemaduras, marcas de vibración, rayas a contrahilo ni remolinos de orilladora tras la primera capa.'), prov: ufgs('§3.3 sanding') },
    { id: 'seal_after_sanding', phase: 'finishes_interior', item: 'Floor vacuumed and tacked, and the first seal coat applied the same day as final sanding (within about 8 hours) so the grain does not pick up moisture or dirt.', item_es: tr('Piso aspirado y limpiado con trapo, y la primera capa de sellador aplicada el mismo día del lijado final (en unas 8 horas) para que la veta no absorba humedad ni polvo.'), prov: ufgs('§3.3: seal coat within 8 hours of final sanding.') },
    { id: 'finish_coats', phase: 'finishes_interior', item: 'Number of finish coats per spec, each applied after the maker\'s recoat time and screened between coats; final coat free of bubbles, dust nibs, puddles and missed areas.', item_es: tr('Número de capas de acabado según especificación, cada una tras el tiempo de recubrimiento del fabricante y con abrasión entre capas; capa final sin burbujas, polvo, charcos ni áreas sin cubrir.'), prov: nwfa('NWFA sand & finish guidelines + finish maker label — reference only.') },
    { id: 'transitions_trim', phase: 'finishes_interior', item: 'Door jambs and casings undercut, transitions and stair nosings glued and fastened flush and tight, nothing hiding a missing expansion gap.', item_es: tr('Marcos y molduras de puertas recortados por debajo, transiciones y narices de escalón pegadas y fijadas a ras y firmes, nada tapando una junta de expansión faltante.'), prov: shaw('Undercut jambs; transitions per maker.') },
    { id: 'waste_disposal_daily', phase: 'finishes_interior', item: 'Finish rags, pads and sander-bag dust in a covered metal container (water-filled for oil finishes) and out of the building at day end.', item_es: PENDING_ES, safety: true, prov: osha('h', '1926.252(e)') },
  ],
  inspection_checklists: {
    moisture_acclimation: [
      { item: 'Subfloor and flooring moisture readings logged with date, meter and locations', item_es: tr('Lecturas de humedad del contrapiso y del piso anotadas con fecha, medidor y ubicaciones') },
      { item: 'Building enclosed, wet trades dry, HVAC holding living conditions', item_es: tr('Edificio cerrado, trabajos húmedos secos y la climatización manteniendo condiciones de vivienda'), ref: 'UFGS 09 64 29 1.6' },
      { item: 'Acclimation time and method per manufacturer completed', item_es: tr('Tiempo y método de aclimatación del fabricante cumplidos') },
    ],
    subfloor_acceptance: [
      { item: 'Subfloor fastened, no squeaks or loose panels; slab clean, dry and flat to tolerance', item_es: tr('Contrapiso bien fijado, sin rechinidos ni paneles flojos; losa limpia, seca y plana dentro de tolerancia'), ref: 'UFGS 09 64 29 3.1' },
      { item: 'Vapor retarder or underlayment as specified before boards go down', item_es: tr('Barrera de vapor o base según especificación antes de colocar tablas'), ref: 'UFGS 09 64 29 2.5' },
    ],
    sand_finish_review: [
      { item: 'Bare-wood walk with raking light: no chatter, burns, swirls or cross-grain scratches before sealing', item_es: tr('Revisión de madera desnuda con luz rasante: sin marcas de vibración, quemaduras, remolinos ni rayas a contrahilo antes de sellar'), ref: 'UFGS 09 64 29 3.3' },
      { item: 'Stain color sample approved by the owner before full application', item_es: tr('Muestra de color de tinte aprobada por el dueño antes de aplicar en todo el piso') },
      { item: 'Ignition sources off, ventilation running and rags in a covered metal container during finishing', item_es: PENDING_ES },
    ],
    final_walkthrough: [
      { item: 'Finish uniform, cured per the maker before furniture or rugs; floor protected until handover', item_es: tr('Acabado uniforme y curado según el fabricante antes de muebles o tapetes; piso protegido hasta la entrega'), ref: 'UFGS 09 64 29 3.4' },
      { item: 'Expansion gaps covered, transitions and stair nosings tight and flush', item_es: tr('Juntas de expansión cubiertas, transiciones y narices de escalón firmes y a ras') },
      { item: 'Owner given species, finish product and care / recoat instructions', item_es: tr('Se entregó al dueño la especie, el producto de acabado y las instrucciones de cuidado y recubrimiento') },
    ],
  },
  assemblies: [
    { code: 'G-WD-REFINISH-SF', name: 'Sand and refinish existing hardwood, 3 cuts + seal + 2 finish coats, per SF', name_es: 'Lijar y reacabar madera existente, 3 pasadas + sellador + 2 capas de acabado, por pie²', unit: 'SF', csi: '09 64 29',
      material_cost_cents: { v: 45, prov: est('abrasives + filler + waterborne sealer and 2 coats, national baseline 2026') }, labor_hours_per_unit: { v: 0.03, prov: est('sand, edge, screen and coat ≈ 1 tech per ~270 SF over the multi-day cycle') },
      equipment_cost_cents: { v: 15, prov: est('drum sander + edger + buffer rental spread over ~1,000 SF') }, waste_pct: { v: 0, prov: est('finish is consumed by area; spread loss in material cost') } },
    { code: 'G-WD-ENG-GLUE-SF', name: 'Engineered hardwood, glue-down with moisture-control adhesive, per SF', name_es: 'Madera de ingeniería pegada con adhesivo con control de humedad, por pie²', unit: 'SF', csi: '09 64 29',
      material_cost_cents: { v: 700, prov: est('mid-grade engineered plank ~$5.75/SF + urethane moisture-control adhesive ~$1.25/SF, 2026') }, labor_hours_per_unit: { v: 0.035, prov: est('2-person crew ~450 SF/day incl. troweling and rolling') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; floor roller owned') }, waste_pct: { v: 7, prov: est('end cuts and culls, straight lay') } },
    { code: 'G-WD-STAIR-TREAD-EA', name: 'Hardwood stair tread with nosing and riser, fitted and glued, each', name_es: 'Peldaño de madera con nariz y contrahuella, ajustado y pegado, c/u', unit: 'EA', csi: '06 43 13',
      material_cost_cents: { v: 8500, prov: est('oak tread with nosing + riser + adhesive and trim screws, unfinished, 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('scribe, cut, glue and fasten one tread + riser') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('occasional miscut') } },
    { code: 'G-WD-UNDERLAY-SF', name: 'Underlayment / vapor retarder under hardwood (felt, paper or poly), per SF', name_es: 'Base / barrera de vapor bajo piso de madera (fieltro, papel o polietileno), por pie²', unit: 'SF', csi: '09 64 29',
      material_cost_cents: { v: 18, prov: est('asphalt felt, rosin paper or 6-mil poly roll pricing, 2026') }, labor_hours_per_unit: { v: 0.003, prov: est('rolled out and stapled/taped ahead of the boards') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('laps and edge trim') } },
    { code: 'G-WD-FLATPREP-SF', name: 'Subfloor flattening for hardwood — grind/plane highs, fill lows, re-fasten, per SF treated', name_es: 'Nivelación del contrapiso para madera — rebajar altos, rellenar bajos, refijar, por pie² tratado', unit: 'SF', csi: '09 05 61',
      material_cost_cents: { v: 75, prov: est('patch/leveler + primer + screws share per SF treated') }, labor_hours_per_unit: { v: 0.04, prov: est('straightedge check, grind/plane, mix and feather patch') },
      equipment_cost_cents: { v: 5, prov: est('grinder/planer and vacuum wear') }, waste_pct: { v: 10, prov: est('mixed patch loss') } },
    { code: 'G-WD-TRANS-EA', name: 'Hardwood transition (reducer, T-mold or threshold), installed, each', name_es: 'Transición de madera (reductor, moldura en T o umbral), instalada, c/u', unit: 'EA', csi: '09 64 29',
      material_cost_cents: { v: 3500, prov: est('matching hardwood reducer/T-mold ~7 ft + adhesive, 2026') }, labor_hours_per_unit: { v: 0.5, prov: est('cut, fit, glue and pin one doorway') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('offcuts') } },
  ],
  quantity_rules: [
    { code: 'G-FLOOR-HARDWOOD-SF', assumption: 'Hardwood trade on the schedule — assume ≈30% of scheduled room area is wood (living, dining, halls); read the finish schedule', qty: { basis: 'area_sf_sum', mul: 0.3, round: 'ceil' } },
    { code: 'G-WD-UNDERLAY-SF', assumption: 'Underlayment / vapor retarder under the same ≈30% of room area assumed to be hardwood', qty: { basis: 'area_sf_sum', mul: 0.3, round: 'ceil' } },
    { code: 'G-WD-FLATPREP-SF', assumption: 'Flatness prep on ≈10% of the hardwood area (≈3% of room area) — confirm with a straightedge check', qty: { basis: 'area_sf_sum', mul: 0.03, round: 'ceil' } },
    { code: 'G-WD-TRANS-EA', assumption: '≈1 transition per 3 scheduled doors where wood meets tile, carpet or vinyl — count on the finish plan', qty: { basis: 'doors', mul: 0.34, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['drywall', 'painting', 'tile'], note: 'Install wood after drywall mud, primer and tile are done and dry — wet trades raise moisture and damage the finish.' },
    { after_trades: ['hvac'], note: 'HVAC must be running and holding living conditions before wood is delivered for acclimation.' },
  ],
});
