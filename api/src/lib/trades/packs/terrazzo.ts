// Trade Knowledge Pack — terrazzo (Terrazzo, CSI 09 66). Wave 15, COMPLEMENT pattern (recipes: []):
// the hand recipe in task-buildout/nopermit.ts (shared flooring case: Prep & acclimate → Install flooring)
// keeps producing the work steps; this pack adds glossary, hazards, QA, owner/architect hold points,
// equipment hints and G-TZ- assemblies. permit_trade null → no gates, no code_refs.
// Covers thin-set epoxy terrazzo, bonded and sand-cushion cementitious terrazzo, precast treads/base.
// Dossier: docs/trade-packs/dossiers/terrazzo.md. Sources: UFGS 09 66 13 / 09 66 16 / 09 66 23,
// NTMA guide spec 09 66 23.16 + system pages + sealer guide, 29 CFR 1926 Subparts C, D, E, F, K, X, Z
// (1926.1153 Table 1 rows (xii) and (xiii)), MPCA slurry guidance.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const v = (src: string[], note?: string) => ({ src, confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ufgsCem = (note?: string) => v(['terrazzo-ufgs-09-66-13'], note);
const ufgsTile = (note?: string) => v(['terrazzo-ufgs-09-66-16'], note);
const ufgsEpoxy = (note?: string) => v(['terrazzo-ufgs-09-66-23'], note);
const ntma = (note?: string) => v(['terrazzo-ntma-epoxy-spec'], note);
const ntmaSys = (note?: string) => v(['terrazzo-ntma-systems'], note);
const sealer = (note?: string) => v(['terrazzo-ntma-sealer-guide'], note);
const osha = (sub: string, note?: string) => v([`ecfr-1926-${sub}`], note);
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'terrazzo',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Poured-in-place and precast terrazzo: marble, glass or granite chips in an epoxy or cement matrix, laid in panels between metal divider strips, then wet-ground, grouted, fine-ground and sealed. Includes thin-set epoxy floors, bonded and sand-cushion cement systems, cove base and precast stair treads.',
    summary_es: 'Terrazo colado en sitio y prefabricado: granos de mármol, vidrio o granito en una matriz de epoxi o cemento, colocados en paños entre tiras divisorias metálicas y luego desbastados en húmedo, resanados, pulidos y sellados. Incluye pisos de epoxi de capa delgada, sistemas de cemento adheridos y sobre cama de arena, zoclo media caña y huellas de escalera prefabricadas.',
    glossary: [
      { term: 'Divider strip', term_es: 'Tira divisoria', def: 'Thin zinc, brass or plastic strip set on edge that forms the panels, separates colors and shows as a line in the finished floor.', def_es: 'Tira delgada de zinc, latón o plástico colocada de canto que forma los paños, separa colores y queda como línea en el piso terminado.' },
      { term: 'Control-joint strip', term_es: 'Tira de junta de control', def: 'Double (back-to-back) strip set right over a slab joint so slab movement does not crack the terrazzo.', def_es: 'Tira doble (espalda con espalda) colocada justo sobre una junta de la losa para que el movimiento de la losa no agriete el terrazo.' },
      { term: 'Matrix', term_es: 'Matriz', def: 'The binder that holds the chips — epoxy resin or portland cement, often pigmented.', def_es: 'El aglutinante que sostiene los granos: resina epoxi o cemento portland, a menudo pigmentado.' },
      { term: 'Thin-set (epoxy) terrazzo', term_es: 'Terrazo de capa delgada (epoxi)', def: 'About 1/4 to 3/8 in. of epoxy terrazzo bonded to the slab; it follows the slab and does not level it.', def_es: 'Unos 1/4 a 3/8 pulg de terrazo epóxico adherido a la losa; sigue la forma de la losa y no la nivela.' },
      { term: 'Sand-cushion terrazzo', term_es: 'Terrazo sobre cama de arena', def: 'Cement terrazzo on a mesh-reinforced underbed that floats on an isolation sheet and sand layer, so small slab movements do not show.', def_es: 'Terrazo de cemento sobre una base reforzada con malla que flota sobre una lámina aislante y una capa de arena, para que los movimientos menores de la losa no se reflejen.' },
      { term: 'Underbed', term_es: 'Cama base (mortero de asiento)', def: 'Sand-cement layer under cement terrazzo topping that holds the strips and brings the floor to height.', def_es: 'Capa de arena y cemento bajo el terrazo de cemento que sostiene las tiras y lleva el piso a su nivel.' },
      { term: 'Grout coat', term_es: 'Capa de resane', def: 'Matching epoxy or cement paste spread after the rough grind to fill pinholes and voids, then ground off.', def_es: 'Pasta de epoxi o cemento del mismo color que se extiende después del primer desbaste para llenar poros y huecos y luego se desbasta.' },
      { term: 'Crack-isolation membrane', term_es: 'Membrana antifisuras', def: 'Flexible layer under epoxy terrazzo over cracks and joints that absorbs some sideways slab movement.', def_es: 'Capa flexible bajo el terrazo epóxico sobre grietas y juntas que absorbe parte del movimiento horizontal de la losa.' },
      { term: 'Mockup', term_es: 'Muestra en sitio (maqueta)', def: 'A finished sample area of the real floor that the owner approves for color, chips and finish before production.', def_es: 'Área de muestra terminada del piso real que el dueño aprueba en color, granos y acabado antes de producción.' },
      { term: 'Slurry', term_es: 'Lodo de desbaste', def: 'Water, ground matrix and stone fines from wet grinding; vacuum it up and dispose of it as directed — never down a drain.', def_es: 'Agua, matriz molida y finos de piedra del desbaste en húmedo; se aspira y se desecha según lo indicado, nunca por un drenaje.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  equipment: [
    { when: { title_re: 'terrazzo' }, type: 'generator', reason: 'Large wet floor grinders and slurry vacuums may need 240/480 V the building cannot supply yet', optional: true },
    { when: { title_re: 'terrazzo', building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'forklift', reason: 'Move pallets of resin, aggregate and precast treads to the work floor', optional: true },
  ],
  hazards: [
    { id: 'silica_floor_grinding', hazard: 'Breathing silica dust when grinding terrazzo, the concrete slab or granite/quartz chips with walk-behind floor grinders', hazard_es: PENDING_ES, controls: ['Grind wet with the machine\'s integrated water feed, or use the dust collection system the grinder maker recommends', 'Run and maintain the grinder per the maker to keep dust down; keep water flowing to the cutting surface'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('z', 'Table 1 (xiii) walk-behind milling machines and floor grinders: no respirator required when the controls are fully implemented.') },
    { id: 'silica_edge_grinding', hazard: 'Breathing silica dust from handheld grinders at walls, cove base, stairs and corners', hazard_es: PENDING_ES, controls: ['Use water feed, or a shroud with a vacuum that gives 25 cfm per inch of wheel diameter and has a 99% filter with filter cleaning', 'Indoors with a shroud and vacuum, wear at least an APF 10 respirator during hand grinding'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['APF 10 respirator (dry, indoors)', 'face shield', 'safety glasses', 'hearing protection'], prov: osha('z', 'Table 1 (xii) handheld grinders for uses other than mortar removal.') },
    { id: 'silica_cleanup', hazard: 'Silica dust put back in the air by dry sweeping dried slurry or blowing off the floor with compressed air', hazard_es: PENDING_ES, controls: ['Clean with a wet vacuum, squeegee or HEPA vacuum — no dry sweeping', 'Never use compressed air to clean floors or clothing'], controls_es: PENDING_ES, osha_ref: '1926.1153(f)', severity: 2, prov: osha('z') },
    { id: 'wet_grinding_shock', hazard: 'Electric shock from grinders, vacuums and cords running in water and slurry', hazard_es: PENDING_ES, controls: ['Plug every tool into GFCI protection (or follow the assured equipment grounding program)', 'Inspect cords and plugs daily; keep connections raised off the wet floor and out of the slurry path'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)(ii)', severity: 3, prov: osha('k') },
    { id: 'epoxy_vapors', hazard: 'Headaches, dizziness and lung irritation from epoxy, primer, membrane and sealer vapors in closed rooms', hazard_es: PENDING_ES, controls: ['Ventilate the area with fans moving fresh air through while mixing, placing and curing', 'Keep vapor levels below exposure limits; use the respirator the SDS lists when ventilation is not enough'], controls_es: PENDING_ES, osha_ref: '1926.57(a)', severity: 3, ppe: ['organic-vapor respirator when the SDS calls for it'], prov: osha('d') },
    { id: 'epoxy_skin', hazard: 'Skin sensitization and burns from epoxy resin and hardener — once sensitized, reactions can be lifelong', hazard_es: PENDING_ES, controls: ['Wear chemical-resistant gloves, long sleeves and eye protection while mixing and troweling', 'Wash skin right away with soap and water — never with solvent; change contaminated clothing', 'Keep SDS on site and train the crew on them'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['nitrile or butyl gloves', 'safety glasses or goggles', 'long sleeves'], prov: v(['ecfr-1926-e', 'ecfr-1926-d'], 'PPE duty 1926.95(a); hazard communication 1926.59.') },
    { id: 'flammable_products', hazard: 'Fire from solvent-borne primers, sealers and cleaners and their vapors', hazard_es: PENDING_ES, controls: ['Store and carry flammable liquids in approved safety cans or the original containers', 'No smoking, open flames or pilot lights in the area while applying and until vapors clear'], controls_es: PENDING_ES, osha_ref: '1926.152(a)(1)', severity: 3, prov: osha('f') },
    { id: 'noise', hazard: 'Hearing damage from floor grinders, edgers and wet vacuums', hazard_es: PENDING_ES, controls: ['Wear hearing protection when running or working near the grinders'], controls_es: PENDING_ES, osha_ref: '1926.52(d)(1)', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('d') },
    { id: 'flying_particles', hazard: 'Eye injury from chips, grit and cut divider-strip pieces', hazard_es: PENDING_ES, controls: ['Wear safety glasses when grinding, cutting strips or chipping', 'Add a face shield for handheld grinding'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses', 'face shield'], prov: osha('e') },
    { id: 'stair_edges', hazard: 'Falls from open stair sides and landings while setting precast or pouring terrazzo treads', hazard_es: PENDING_ES, controls: ['Keep a stairrail on every open side and a handrail on stairways with four or more risers', 'Do not remove rails to work; use temporary rails that clear the work'], controls_es: PENDING_ES, osha_ref: '1926.1052(c)(1)', severity: 3, prov: osha('x') },
    { id: 'slurry_slip_trip', hazard: 'Slipping on wet slurry, grout or sealer and tripping over hoses, cords and strip offcuts', hazard_es: PENDING_ES, controls: ['Pick up slurry as you go with a wet vacuum or squeegee', 'Route hoses and cords along walls, mark wet floors and keep passageways clear of scrap'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, ppe: ['slip-resistant boots'], prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'slab_flatness', phase: 'finishes_interior', item: 'Slab checked before epoxy terrazzo: no more than 1/4 in. from true plane in 10 ft; high spots ground and lows filled with a material the resin maker approves.', item_es: tr('Losa revisada antes del terrazo epóxico: no más de 1/4 pulg fuera de plano en 10 pies; puntos altos desbastados y bajos rellenados con material aprobado por el fabricante de la resina.'), prov: ntma('3.01 A.1 — epoxy follows the slab contour; it does not level it.') },
    { id: 'slab_moisture', phase: 'finishes_interior', item: 'Slab at least 28 days old and moisture tested (in-situ RH probes or calcium chloride) with results within the resin maker\'s limits — or moisture mitigation installed first.', item_es: tr('Losa de al menos 28 días y con prueba de humedad (sondas de HR in situ o cloruro de calcio) con resultados dentro de los límites del fabricante de la resina, o mitigación de humedad instalada antes.'), prov: v(['terrazzo-ntma-epoxy-spec', 'terrazzo-ufgs-09-66-23'], 'NTMA 3.01 B (ASTM F2170 / F1869, ref only); UFGS 09 66 23 3.1 28-day cure.') },
    { id: 'cracks_membrane', item: 'Every slab crack and joint located and marked; crack-isolation membrane installed over them where recommended before priming.', item_es: tr('Cada grieta y junta de la losa ubicada y marcada; membrana antifisuras instalada sobre ellas donde se recomiende antes de imprimar.'), prov: ntma('3.01 A.2, 3.02 D') },
    { id: 'surface_prep', item: 'Slab mechanically abraded, clean and free of curing compound, sealer, paint or grease that would stop the bond.', item_es: tr('Losa preparada mecánicamente, limpia y libre de compuesto de curado, sellador, pintura o grasa que impida la adherencia.'), prov: v(['terrazzo-ntma-epoxy-spec', 'terrazzo-ufgs-09-66-13'], 'NTMA 3.02 B; UFGS 09 66 13 3.2.1 no curing agent on bonded substrates.') },
    { id: 'joint_strips_aligned', item: 'Control-joint strips (back to back) sit directly over every slab control, construction and expansion joint; layout matches the approved strip drawing.', item_es: tr('Las tiras de junta de control (espalda con espalda) quedan directamente sobre cada junta de control, de construcción y de expansión de la losa; el trazo coincide con el plano de tiras aprobado.'), prov: v(['terrazzo-ufgs-09-66-13', 'terrazzo-ntma-systems'], 'UFGS 3.2.2; NTMA epoxy/bonded system pages.') },
    { id: 'strips_set', item: 'Divider strips straight, tight at joints and intersections, set level to finish height and fully bedded (no voids under strips).', item_es: tr('Tiras divisorias rectas, ajustadas en uniones e intersecciones, a nivel de la altura final y totalmente asentadas (sin huecos debajo).'), prov: v(['terrazzo-ufgs-09-66-13', 'terrazzo-ntma-epoxy-spec'], 'UFGS 3.2.2; NTMA 3.03 A.1.c.') },
    { id: 'panel_size', item: 'Cement-terrazzo field panels no larger than the spec allows (UFGS: 6 ft per side; NTMA sand-cushion: dividers 5 ft or less on center).', item_es: tr('Paños de terrazo de cemento no mayores a lo permitido (UFGS: 6 pies por lado; NTMA cama de arena: divisores a 5 pies o menos entre centros).'), prov: v(['terrazzo-ufgs-09-66-13', 'terrazzo-ntma-systems']) },
    { id: 'mockup_approved', item: 'Mockup or approved samples on site; color, chip mix and finish of the production floor match them.', item_es: tr('Muestra en sitio o muestras aprobadas disponibles; el color, la mezcla de granos y el acabado del piso de producción coinciden con ellas.'), prov: ntma('1.05 D mockup 50–100 SF typical; 3.03 E specifier note') },
    { id: 'temperature_held', item: 'Area held at or above the spec minimum temperature (epoxy per NTMA 60 °F; UFGS 50 °F, 2 days before through 7 days after) with ventilation on.', item_es: tr('Área mantenida a la temperatura mínima especificada o más (epoxi según NTMA 60 °F; UFGS 50 °F, 2 días antes hasta 7 días después) con ventilación encendida.'), prov: v(['terrazzo-ntma-epoxy-spec', 'terrazzo-ufgs-09-66-23'], 'NTMA 1.09 B; UFGS 09 66 23 1.6.') },
    { id: 'thickness', item: 'Topping placed to the specified finish thickness (epoxy typically 1/4 or 3/8 in.; cement topping at least 1/2 in. after grinding).', item_es: tr('Capa colocada al espesor final especificado (epoxi normalmente 1/4 o 3/8 pulg; capa de cemento de al menos 1/2 pulg después del desbaste).'), prov: v(['terrazzo-ufgs-09-66-23', 'terrazzo-ufgs-09-66-13']) },
    { id: 'grind_sequence', item: 'Ground wet in sequence — coarse (about 24 grit) then 60/80 grit, grout coat cured, fine grind (120 grit or finer) until all grout film is gone from the surface.', item_es: tr('Desbastado en húmedo en secuencia: grueso (grano 24 aprox.), luego 60/80, capa de resane curada y pulido fino (grano 120 o más fino) hasta quitar toda la película de resane.'), prov: v(['terrazzo-ntma-epoxy-spec', 'terrazzo-ufgs-09-66-13'], 'NTMA 3.03 E; UFGS 3.2.5 (cement grout cured ≥72 h).') },
    { id: 'pinholes_filled', item: 'No open pinholes or voids after the fine grind; cement terrazzo shows at least 70% chips evenly spread; strip tops show as continuous clean lines.', item_es: tr('Sin poros ni huecos abiertos después del pulido fino; el terrazo de cemento muestra al menos 70% de granos bien repartidos; los cantos de las tiras se ven como líneas continuas y limpias.'), prov: ufgsCem('3.2.5 / 3.2.5.3') },
    { id: 'finished_flatness', item: 'Finished cement terrazzo within 1/4 in. in 10 ft; no lippage at strips, base or transitions.', item_es: tr('Terrazo de cemento terminado dentro de 1/4 pulg en 10 pies; sin desniveles en tiras, zoclo ni transiciones.'), prov: ufgsCem('3.2.5.1') },
    { id: 'sealed', item: 'Floor washed with a neutral cleaner, dry, and sealed with the approved sealer; slip resistance data from the sealer supplier on file.', item_es: tr('Piso lavado con limpiador neutro, seco y sellado con el sellador aprobado; datos de resistencia al deslizamiento del proveedor del sellador archivados.'), prov: v(['terrazzo-ufgs-09-66-13', 'terrazzo-ntma-sealer-guide'], 'UFGS 3.3; NTMA sealer guide — COF depends on the sealer.') },
    { id: 'precast_set', item: 'Precast treads and base fully bedded (no hollow sound), joints tight and aligned, abrasive nosing strips where specified; stair kept closed to traffic until the setting material cures.', item_es: PENDING_ES, safety: true, prov: v(['terrazzo-ufgs-09-66-16', 'terrazzo-ntma-epoxy-spec', 'terrazzo-ntma-systems'], 'UFGS 09 66 16 3.5 / 3.1; NTMA 3.04, abrasive strips 3.03 B.4.') },
    { id: 'slurry_disposed', item: 'Grinding slurry vacuumed and settled/solidified for disposal as the GC and local rules require — never poured into floor drains, sinks or storm drains.', item_es: tr('Lodo de desbaste aspirado y decantado o solidificado para desecharlo según lo exijan el contratista general y las normas locales; nunca vertido en coladeras, lavabos ni drenajes pluviales.'), prov: v(['concrete_cutting-mpca-slurry', 'terrazzo-ntma-epoxy-spec'], 'MPCA: keep concrete slurry out of storm drains and surface water; NTMA 1.09 C protect adjacent work from grinding water.') },
  ],
  inspection_checklists: {
    pre_install_substrate_acceptance: [
      { item: 'Slab age (28 days min. for epoxy) and moisture test results meet the resin maker\'s limits', item_es: tr('Edad de la losa (mín. 28 días para epoxi) y resultados de humedad dentro de los límites del fabricante de la resina'), ref: 'UFGS 09 66 23 §3.1' },
      { item: 'Flatness survey: 1/4 in. in 10 ft or better; corrections done by the GC with compatible materials', item_es: tr('Revisión de planicidad: 1/4 pulg en 10 pies o mejor; correcciones hechas por el contratista general con materiales compatibles'), ref: 'NTMA 09 66 23.16 §3.01' },
      { item: 'Cracks and slab joints marked; strip layout drawing reconciled to actual joint locations', item_es: tr('Grietas y juntas de la losa marcadas; plano de tiras ajustado a la ubicación real de las juntas'), ref: 'UFGS 09 66 13 §3.2.2' },
      { item: 'Overhead trades finished, heat/ventilation running, water and power within reach', item_es: tr('Trabajos en altura terminados, calefacción y ventilación funcionando, agua y energía al alcance'), ref: 'NTMA 09 66 23.16 §1.09' },
    ],
    mockup_approval: [
      { item: 'Owner/architect signs off color, chip blend and finish on the mockup or samples before production', item_es: tr('El dueño o arquitecto aprueba color, mezcla de granos y acabado en la muestra antes de producción'), ref: 'NTMA 09 66 23.16 §1.05' },
      { item: 'Divider strip metal, gauge and heavy-top sections match the approved samples', item_es: tr('Metal, calibre y perfiles de canto grueso de las tiras divisorias coinciden con las muestras aprobadas'), ref: 'UFGS 09 66 13 §2.5' },
    ],
    pre_seal_finish_review: [
      { item: 'Fine grind complete: no grout film, open pinholes or grinder swirl; chip exposure matches the mockup', item_es: tr('Pulido fino terminado: sin película de resane, poros abiertos ni marcas circulares; exposición de granos igual a la muestra'), ref: 'UFGS 09 66 13 §3.2.5.3' },
      { item: 'Strip lines continuous; no lippage at base, transitions and stair nosings', item_es: tr('Líneas de tiras continuas; sin desniveles en zoclo, transiciones y narices de escalón') },
      { item: 'Conductive floors only: resistance test scheduled 30–45 days after installation', item_es: tr('Solo pisos conductivos: prueba de resistencia programada 30 a 45 días después de la instalación'), ref: 'UFGS 09 66 23 §3.3' },
    ],
    turnover_protection: [
      { item: 'Sealer applied per its maker; slip-resistance data and maintenance instructions handed over', item_es: tr('Sellador aplicado según su fabricante; datos de resistencia al deslizamiento e instrucciones de mantenimiento entregados'), ref: 'UFGS 09 66 13 §3.3' },
      { item: 'Floor covered with protection the GC maintains until other trades finish', item_es: tr('Piso cubierto con protección que el contratista general mantiene hasta que terminen los demás oficios'), ref: 'NTMA 09 66 23.16 §3.06' },
    ],
  },
  assemblies: [
    { code: 'G-TZ-EPOXY-SF', name: 'Epoxy (thin-set) terrazzo, 3/8 in., marble chip, primed, ground, grouted and sealed, per SF', name_es: 'Terrazo epóxico de capa delgada de 3/8 pulg, grano de mármol, imprimado, desbastado, resanado y sellado, por pie²', unit: 'SF', csi: '09 66 23',
      material_cost_cents: { v: 900, prov: est('epoxy matrix + hardener, marble aggregate, primer, grout and sealer share; glass or specialty aggregate costs more. 2026 national baseline') },
      labor_hours_per_unit: { v: 0.16, prov: est('prep, prime, place, rough grind, grout, fine grind, clean and seal — multi-day crew process') },
      equipment_cost_cents: { v: 150, prov: est('wet floor grinder, edgers, slurry vacuum and diamond/stone wear') },
      waste_pct: { v: 5, prov: est('mix and grind-off losses') } },
    { code: 'G-TZ-DIVIDER-LF', name: 'Terrazzo divider strip, 16-ga zinc, set in epoxy adhesive, per LF', name_es: 'Tira divisoria de terrazo, zinc calibre 16, asentada en adhesivo epóxico, por pie lineal', unit: 'LF', csi: '09 66 23',
      material_cost_cents: { v: 220, prov: est('16-ga zinc L-strip + adhesive; brass or heavy-top strips ≈2–4× — adjust by spec') },
      labor_hours_per_unit: { v: 0.04, prov: est('layout from drawing, cut, bend radii and bed') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') },
      waste_pct: { v: 8, prov: est('offcuts at intersections and radii') } },
    { code: 'G-TZ-MEMB-SF', name: 'Crack-isolation membrane under epoxy terrazzo (flexible epoxy, reinforced), per SF', name_es: 'Membrana antifisuras bajo terrazo epóxico (epoxi flexible reforzada), por pie²', unit: 'SF', csi: '09 66 23',
      material_cost_cents: { v: 260, prov: est('flexible membrane resin + reinforcing fabric; NTMA guide spec carries ~5% of floor area in base bid, rest as unit price') },
      labor_hours_per_unit: { v: 0.02, prov: est('rout/clean crack, apply membrane strip or full field') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') },
      waste_pct: { v: 10, prov: est('mixing and edge losses') } },
    { code: 'G-TZ-TREAD-EA', name: 'Precast epoxy terrazzo stair tread, ~4 ft, with abrasive nosing, set in epoxy adhesive, each', name_es: 'Huella de escalera prefabricada de terrazo epóxico, ~4 pies, con nariz antiderrapante, asentada en adhesivo epóxico, c/u', unit: 'EA', csi: '09 66 23',
      material_cost_cents: { v: 22000, prov: est('fabricated tread with abrasive strips, freight share and adhesive; custom colors vary widely') },
      labor_hours_per_unit: { v: 1.0, prov: est('fit, bed, align, clean joints') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') },
      waste_pct: { v: 0, prov: est('counted, made to measure') } },
    { code: 'G-TZ-REFINISH-SF', name: 'Terrazzo restoration — wet regrind/hone, grout pinholes, clean and reseal existing floor, per SF', name_es: 'Restauración de terrazo: redesbaste en húmedo, resane de poros, limpieza y resellado, por pie²', unit: 'SF', csi: '09 01 66',
      material_cost_cents: { v: 45, prov: est('stripper, grout, cleaner and penetrating sealer share') },
      labor_hours_per_unit: { v: 0.025, prov: est('strip old coating, multi-pass hone, grout, seal; crew ≈600–800 SF/day') },
      equipment_cost_cents: { v: 35, prov: est('grinder/burnisher, slurry vacuum and abrasive wear') },
      waste_pct: { v: 5, prov: est('container and application loss') } },
  ],
  dependency_hints: [
    { after_trades: ['concrete'], note: 'Epoxy terrazzo starts only after the slab has cured at least 28 days and passes moisture and flatness checks.' },
    { after_trades: ['drywall', 'acoustical_ceilings'], note: 'Pour terrazzo after overhead and wall work is done so nothing drops on it; protect finished walls from grinding water.' },
  ],
});
