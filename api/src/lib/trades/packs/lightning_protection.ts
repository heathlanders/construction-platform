// Trade Knowledge Pack — lightning_protection (Lightning Protection). Wave 12 — NEW-TRADE pattern (no hand
// recipe), permit_trade null → no gating inspections and no code refs; hold points live in
// inspection_checklists. Dossier: docs/trade-packs/dossiers/lightning_protection.md.
// Sources: UFGS 26 41 00 (execution + field QC), NFPA 780 / UL 96A (reference only), LPI technical +
// LPI-IP inspection pages, NWS lightning safety, 811, 29 CFR 1926 (C, E, J, K, L, M, P, X, Z).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['lightning_protection-ufgs-26-41-00'], confidence: 'verified' as const, last_verified: D };
const ufgsStd = { src: ['lightning_protection-ufgs-26-41-00', 'lightning_protection-nfpa-780'], confidence: 'verified' as const, last_verified: D };
const lpi = { src: ['lightning_protection-lpi-technical', 'lightning_protection-lpi-ip'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });

export default definePack({
  key: 'lightning_protection',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Designs and installs lightning protection systems — air terminals, roof and down conductors, grounding electrodes or ground ring, bonding of metal bodies and building systems, and surge-protection coordination — then tests every connection and gets third-party certification (UL Master Label or LPI-IP).',
    summary_es: 'Diseña e instala sistemas de protección contra rayos — puntas captadoras, conductores de techo y de bajada, electrodos de tierra o anillo de tierra, unión equipotencial de cuerpos metálicos y sistemas del edificio, y coordinación con la protección contra sobretensiones — y luego prueba cada conexión y obtiene la certificación de un tercero (UL Master Label o LPI-IP).',
    glossary: [
      { term: 'Air terminal (strike termination device)', term_es: 'Punta captadora (pararrayos)', def: 'Short rod on the roof, ridge or parapet that is meant to receive the lightning strike.', def_es: 'Varilla corta en el techo, cumbrera o pretil diseñada para recibir la descarga del rayo.' },
      { term: 'Main conductor', term_es: 'Conductor principal', def: 'Heavy copper or aluminum cable that links air terminals to each other and to the ground.', def_es: 'Cable grueso de cobre o aluminio que une las puntas captadoras entre sí y con la tierra.' },
      { term: 'Down conductor', term_es: 'Conductor de bajada', def: 'Main conductor running down the outside of the building to a grounding electrode; at least two per system.', def_es: 'Conductor principal que baja por el exterior del edificio hasta un electrodo de tierra; mínimo dos por sistema.' },
      { term: 'Ground rod / ground ring', term_es: 'Varilla de tierra / anillo de tierra', def: 'Driven rods, or a buried bare conductor looped around the building, that spread the strike current into the earth.', def_es: 'Varillas hincadas, o un conductor desnudo enterrado alrededor del edificio, que dispersan la corriente del rayo en la tierra.' },
      { term: 'Bonding', term_es: 'Unión equipotencial', def: 'Connecting nearby metal (vents, rails, piping, the electrical ground) to the system so current does not jump across.', def_es: 'Conectar el metal cercano (ventilas, barandales, tuberías, la tierra eléctrica) al sistema para que la corriente no salte.' },
      { term: 'Side flash', term_es: 'Descarga lateral', def: 'Arc that jumps from a conductor to unbonded metal close to it.', def_es: 'Arco que salta de un conductor a un metal cercano que no está unido.' },
      { term: 'Exothermic weld', term_es: 'Soldadura exotérmica', def: 'Molded powder weld that fuses conductor to rod; used for buried connections.', def_es: 'Soldadura con polvo en molde que funde el conductor con la varilla; se usa en conexiones enterradas.' },
      { term: 'Test well', term_es: 'Registro de prueba', def: 'Small box at grade where a down conductor meets its ground rod so it can be tested later.', def_es: 'Caja pequeña a nivel de suelo donde el conductor de bajada se une a su varilla para poder probarlo después.' },
      { term: 'Master Label / LPI-IP certificate', term_es: 'Master Label / certificado LPI-IP', def: 'Third-party certificate that the finished system was inspected against the installation standard.', def_es: 'Certificado de un tercero que confirma que el sistema terminado fue inspeccionado según la norma de instalación.' },
      { term: 'Surge protective device (SPD)', term_es: 'Dispositivo de protección contra sobretensiones (SPD)', def: 'Device at the electrical service and signal entries that diverts surges to ground; installed by the electrician.', def_es: 'Dispositivo en la acometida eléctrica y en las entradas de señal que desvía las sobretensiones a tierra; lo instala el electricista.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'lps_new_install',
      example_title: 'Install lightning protection system',
      when: { title_re: 'lightning|air terminal|\\bLPS\\b' },
      steps: [
        {
          title: 'Confirm the design and coordinate the roof',
          instruction: 'Check the shop drawings against the installation standard named in the spec (NFPA 780 / UL 96A): zone of protection, air terminal layout, at least two paths to ground, rod locations and every bond. Use only listed LPS parts. Get the roofing maker to approve the attachment method in writing so the roof warranty holds, and plan routes that never fasten to the coping.',
          tools: ['tape measure', 'plan set / shop drawings'],
          materials: ['listed LPS components per submittal'],
          safety_ids: ['roof_edge_low', 'lightning_storm'],
          qa_ids: ['design_listed_parts', 'roof_warranty_ok'],
        },
        {
          title: 'Locate utilities and install the grounding',
          instruction: 'Call 811 and wait for marks before digging or driving rods. Drive each rod straight into undisturbed earth at the depth and distance from the foundation the design shows, outside the roof drip line; bury the ground ring at design depth. Exothermic-weld every buried connection, set test wells where down conductors land, and test each rod before backfill. Leave it open for the ground-system hold point.',
          detail: 'Make resistance tests in dry weather, not within 48 hours after rain, and record soil conditions with the readings.',
          tools: ['rotary hammer with ground-rod driver', 'trencher or shovel', 'exothermic weld molds and handle clamp', 'earth ground tester'],
          materials: ['copper-clad ground rods', 'bare copper ground ring conductor', 'exothermic weld shots', 'test wells'],
          safety_ids: ['underground_utility', 'buried_power', 'exo_weld_fire', 'exo_weld_eye', 'trench_spoil', 'lightning_storm'],
          qa_ids: ['rod_undisturbed_earth', 'buried_exothermic', 'ground_tested_before_cover'],
        },
        {
          title: 'Run the down conductors and guards',
          instruction: 'Run down conductors on the outside where they can be seen for annual inspection, fastened at the spacing the standard calls for, with no sharp bends or upward runs. Guard each one from grade to about 6 ft with Schedule 80 PVC or metal conduit; bond metal conduit at both ends. Land each at its test well.',
          tools: ['drill/driver', 'rotary hammer', 'conductor bender', 'hacksaw'],
          materials: ['main-size conductor', 'conductor fasteners', 'Schedule 80 PVC or metal guard', 'bonding clamps'],
          safety_ids: ['ladder', 'aerial_lift', 'silica_drill', 'lightning_storm'],
          qa_ids: ['two_paths_ground', 'guards_bonded', 'no_sharp_bends'],
        },
        {
          title: 'Set air terminals and roof conductors',
          instruction: 'Mount air terminals on ridges, edges, corners and roof equipment at the spacing the design shows. On membrane roofs use adhesive bases prepared exactly per the roof and adhesive makers; never fasten to the coping or puncture the roof without the roofer’s approved detail. Keep roof conductors running level or downward with smooth bends, and connect every terminal so it has two ways to ground.',
          tools: ['drill/driver', 'conductor bender', 'caulk gun'],
          materials: ['air terminals with bases', 'adhesive cable holders / bases', 'roof conductor', 'splicers and connectors'],
          safety_ids: ['roof_edge_low', 'roof_steep', 'aerial_lift', 'lightning_storm'],
          qa_ids: ['terminal_layout', 'adhesive_bases_ok', 'no_sharp_bends'],
        },
        {
          title: 'Bond metal bodies and building grounds',
          instruction: 'Bond roof-top units, vents, rails, metal fences and gates near the system, and other metal within side-flash distance, as the design shows. Bond the LPS grounding to the electrical, telecom and water-pipe grounding so all share one ground. Confirm the electrician has surge protective devices at the service and signal entries. Never paint an LPS connection.',
          tools: ['wrench set', 'drill/driver', 'wire brush'],
          materials: ['bonding conductor', 'bonding plates and clamps', 'listed connectors'],
          safety_ids: ['energized_bond', 'roof_edge_low', 'lightning_storm'],
          qa_ids: ['common_ground_bonded', 'spd_confirmed', 'connections_unpainted'],
        },
        {
          title: 'Test, document and certify',
          instruction: 'Number every test point on a sketch. Test continuity across every connection and bond and the resistance to ground of the tied-together system, and record each reading. Have the third-party inspector (UL or LPI-IP — not the designer or installer) walk the whole system, fix any findings, and hand over the certificate, test report and record drawings.',
          tools: ['low-resistance ohmmeter', 'earth ground tester', 'camera'],
          materials: ['test forms', 'record drawings'],
          safety_ids: ['roof_edge_low', 'ladder', 'lightning_storm'],
          qa_ids: ['continuity_every_joint', 'test_point_sketch', 'third_party_cert'],
        },
      ],
    },
    {
      id: 'lps_reroof_reinstall',
      example_title: 'Remove and reinstall lightning protection for reroof',
      when: { title_re: '(?:remov|reinstall|re-install|repair|reroof|re-roof|recertif)[^.]*(?:lightning|\\bLPS\\b)|(?:lightning|\\bLPS\\b)[^.]*(?:remov|reinstall|re-install|repair|reroof|re-roof|recertif)' },
      priority: 10,
      steps: [
        {
          title: 'Document and test before removal',
          instruction: 'Photograph and sketch the existing layout, tag each terminal and connection, and test continuity so you know the starting condition. Store removed parts off the roof; replace any damaged parts with listed ones.',
          tools: ['camera', 'low-resistance ohmmeter', 'tags'],
          materials: ['tags', 'test forms'],
          safety_ids: ['roof_edge_low', 'roof_steep', 'lightning_storm'],
          qa_ids: ['test_point_sketch'],
        },
        {
          title: 'Reinstall on the new roof',
          instruction: 'After the new roof is in, reinstall terminals and conductors to the original layout using the attachment detail the new roofing maker approved. Keep every terminal on two paths to ground and restore every bond.',
          tools: ['drill/driver', 'conductor bender', 'caulk gun'],
          materials: ['adhesive cable holders / bases', 'replacement listed components'],
          safety_ids: ['roof_edge_low', 'roof_steep', 'aerial_lift', 'lightning_storm'],
          qa_ids: ['roof_warranty_ok', 'adhesive_bases_ok', 'two_paths_ground'],
        },
        {
          title: 'Retest and recertify',
          instruction: 'Retest continuity at every connection and compare with the before readings, then have the system re-inspected so the existing certification stays valid.',
          tools: ['low-resistance ohmmeter', 'earth ground tester'],
          materials: ['test forms'],
          safety_ids: ['roof_edge_low', 'lightning_storm'],
          qa_ids: ['continuity_every_joint', 'third_party_cert'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'lightning|air terminal|\\bLPS\\b', building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'boom_lift', reason: 'Reach parapets and run down conductors on multi-story walls', optional: true },
    { when: { title_re: 'lightning|\\bLPS\\b|ground ring', building_types: ['commercial', 'industrial'] }, type: 'trencher', reason: 'Cut the shallow trench for a buried ground ring conductor', optional: true },
  ],
  hazards: [
    { id: 'lightning_storm', hazard: 'Lightning strike to workers on a roof, lift or open site during a thunderstorm', hazard_es: PENDING_ES, controls: ['Watch the forecast; stop roof and outdoor work as soon as thunder is heard and move to a building or vehicle', 'Wait 30 minutes after the last thunder before going back up', 'Never handle conductors or terminals while a storm is in the area'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 4, prov: { src: ['ecfr-1926-c', 'lightning_protection-nws-lightning-safety'], confidence: 'verified', last_verified: D } },
    { id: 'roof_edge_low', hazard: 'Fall from a low-slope roof edge while running conductors along parapets and edges', hazard_es: PENDING_ES, controls: ['Use guardrails, safety nets, personal fall arrest, or warning line plus safety monitor as allowed', 'Plan conductor runs so work at the edge is short'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(10)', severity: 4, ppe: ['harness when required'], prov: osha('m') },
    { id: 'roof_steep', hazard: 'Fall from a steep roof while setting ridge terminals', hazard_es: PENDING_ES, controls: ['Guardrails with toeboards, safety nets, or personal fall arrest on steep roofs', 'Use roof brackets or ridge anchors'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(11)', severity: 4, ppe: ['harness + lanyard'], prov: osha('m') },
    { id: 'ladder', hazard: 'Ladder slip or overreach while fastening down conductors', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above the landing it reaches', 'Firm footing, three points of contact, carry tools on a belt'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from an aerial lift basket on wall runs', hazard_es: PENDING_ES, controls: ['Harness and lanyard tied to the boom or basket', 'Stand on the basket floor — never on the rails'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'underground_utility', hazard: 'Striking a buried utility while trenching the ground ring or driving rods', hazard_es: PENDING_ES, controls: ['Call 811 and wait for marks before digging or driving rods', 'Hand-dig near marks; private lines (lighting, sprinkler, gas to outbuildings) are not marked by 811'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: { src: ['ecfr-1926-p', 'concrete_repair_lifting-call811'], confidence: 'verified', last_verified: D } },
    { id: 'buried_power', hazard: 'Shock from driving a rod or bar into an unknown buried power line', hazard_es: PENDING_ES, controls: ['Where buried power locations are unknown, wear insulated gloves when driving rods or using bars', 'Stop and re-locate if the rod meets unexpected resistance near a mark'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(2)', severity: 4, ppe: ['insulated gloves'], prov: osha('k') },
    { id: 'energized_bond', hazard: 'Shock while bonding to the electrical service ground or equipment near live parts', hazard_es: PENDING_ES, controls: ['Bond only at the grounding electrode or bus the design shows; have the electrician open and close panels', 'Keep clear of energized circuits unless they are de-energized or guarded'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'exo_weld_fire', hazard: 'Fire or burns from exothermic weld molten metal and sparks', hazard_es: PENDING_ES, controls: ['Keep a charged fire extinguisher at the weld', 'Dry the mold and conductor first — moisture makes molten metal spatter', 'Clear dry grass and combustibles around the mold'], controls_es: PENDING_ES, osha_ref: '1926.352(d)', severity: 3, ppe: ['leather gloves', 'long sleeves'], prov: osha('j') },
    { id: 'exo_weld_eye', hazard: 'Eye injury from weld flash, spatter and flying chips', hazard_es: PENDING_ES, controls: ['Wear safety glasses with side shields (tinted for the weld flash) when firing molds and drilling'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 3, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'silica_drill', hazard: 'Silica dust when drilling masonry or concrete for conductor fasteners', hazard_es: PENDING_ES, controls: ['Use a drill with dust collection or wet method', 'Follow the employer silica exposure control plan'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 2, ppe: ['respirator when required'], prov: osha('z') },
    { id: 'trench_spoil', hazard: 'Spoil or tools rolling back into the ground-ring trench', hazard_es: PENDING_ES, controls: ['Keep spoil and tools at least 2 ft back from the trench edge'], controls_es: PENDING_ES, osha_ref: '1926.651(j)(2)', severity: 2, prov: osha('p') },
  ],
  qa_checklist: [
    { id: 'design_listed_parts', item: 'Shop drawings approved; air terminals, conductors and fittings are listed LPS components matching the submittal.', item_es: { status: 'translated', text: 'Planos de taller aprobados; puntas, conductores y accesorios son componentes de pararrayos listados y coinciden con lo presentado.' }, prov: { src: ['lightning_protection-ufgs-26-41-00', 'lightning_protection-ul-96a'], confidence: 'verified', last_verified: D } },
    { id: 'roof_warranty_ok', item: 'Roofing maker’s written approval of the attachment method is on file; nothing is fastened to the coping.', item_es: { status: 'translated', text: 'Aprobación escrita del fabricante del techo para el método de fijación archivada; nada está fijado al remate (coping).' }, prov: ufgs },
    { id: 'adhesive_bases_ok', item: 'Adhesive bases set on a surface prepared per the roof and adhesive makers; each base logged as a test point.', item_es: { status: 'translated', text: 'Bases adhesivas sobre superficie preparada según los fabricantes del techo y del adhesivo; cada base registrada como punto de prueba.' }, prov: ufgs },
    { id: 'terminal_layout', item: 'Air terminals at the ridges, edges, corners and roof equipment the design shows, with no gaps against the approved layout.', item_es: { status: 'translated', text: 'Puntas captadoras en cumbreras, bordes, esquinas y equipos de techo según el diseño, sin faltantes respecto al plano aprobado.' }, prov: ufgsStd },
    { id: 'two_paths_ground', item: 'Every air terminal has two paths to ground; the system has at least two down conductors (or approved equivalent).', item_es: { status: 'translated', text: 'Cada punta tiene dos caminos a tierra; el sistema tiene al menos dos conductores de bajada (o equivalente aprobado).' }, prov: ufgsStd },
    { id: 'no_sharp_bends', item: 'Conductors run level or downward with smooth bends; no sharp bends or upward loops against the installation standard.', item_es: { status: 'translated', text: 'Conductores horizontales o en bajada con curvas suaves; sin dobleces agudos ni subidas contrarias a la norma de instalación.' }, prov: { src: ['lightning_protection-nfpa-780'], confidence: 'derived', last_verified: D, note: 'Concept from the installation standard; bend radius values are not reproduced (proprietary).' } },
    { id: 'guards_bonded', item: 'Down conductors guarded from grade to about 6 ft; metal guards bonded to the conductor at both ends.', item_es: { status: 'translated', text: 'Conductores de bajada protegidos desde el suelo hasta unos 6 pies; protecciones metálicas unidas al conductor en ambos extremos.' }, prov: ufgs },
    { id: 'connections_unpainted', item: 'No LPS connection, clamp or fastener is painted.', item_es: { status: 'translated', text: 'Ninguna conexión, abrazadera o sujetador del pararrayos está pintado.' }, prov: ufgs },
    { id: 'rod_undisturbed_earth', item: 'Ground rods driven into undisturbed earth to design depth, at the design distance from the foundation and outside the roof drip line.', item_es: { status: 'translated', text: 'Varillas hincadas en tierra no removida a la profundidad de diseño, a la distancia indicada de la cimentación y fuera de la línea de goteo del techo.' }, prov: ufgs },
    { id: 'buried_exothermic', item: 'All buried connections exothermic-welded; down conductors land on their rods inside test wells.', item_es: { status: 'translated', text: 'Todas las conexiones enterradas con soldadura exotérmica; los conductores de bajada llegan a sus varillas dentro de registros de prueba.' }, prov: ufgs },
    { id: 'ground_tested_before_cover', item: 'Each rod tested before connection and backfill; system resistance to ground measured in dry weather, not within 48 hours after rain, with soil conditions recorded.', item_es: { status: 'translated', text: 'Cada varilla probada antes de conectar y rellenar; resistencia a tierra del sistema medida en tiempo seco, no antes de 48 horas tras lluvia, anotando las condiciones del suelo.' }, prov: ufgs },
    { id: 'common_ground_bonded', phase: 'finishes_exterior', item: 'LPS grounding bonded to the electrical, telecom and water-pipe grounding, and metal within side-flash distance bonded as designed.', item_es: PENDING_ES, safety: true, prov: ufgsStd },
    { id: 'spd_confirmed', item: 'Surge protective devices confirmed at the electrical service and signal entries (electrician scope).', item_es: { status: 'translated', text: 'Dispositivos de protección contra sobretensiones confirmados en la acometida eléctrica y entradas de señal (alcance del electricista).' }, prov: lpi },
    { id: 'continuity_every_joint', item: 'Continuity tested across every connection and bond and each reading recorded against its numbered test point.', item_es: { status: 'translated', text: 'Continuidad probada en cada conexión y unión, y cada lectura registrada en su punto de prueba numerado.' }, prov: ufgs },
    { id: 'test_point_sketch', item: 'Test-point sketch and record drawings delivered with the test report.', item_es: { status: 'translated', text: 'Croquis de puntos de prueba y planos as-built entregados con el reporte de pruebas.' }, prov: ufgs },
    { id: 'third_party_cert', item: 'Third-party inspection (UL or LPI-IP — not the designer or installer) passed and the certificate is handed over.', item_es: { status: 'translated', text: 'Inspección de tercero (UL o LPI-IP — no el diseñador ni el instalador) aprobada y certificado entregado.' }, prov: { src: ['lightning_protection-ufgs-26-41-00', 'lightning_protection-lpi-ip', 'lightning_protection-ul-96a'], confidence: 'verified', last_verified: D } },
  ],
  inspection_checklists: {
    ground_system_concealed_inspection: [
      { item: 'Rod locations, depths and ground-ring route match the approved drawings before backfill', item_es: PENDING_ES },
      { item: 'Buried connections are exothermic welds; test wells set at each down conductor', item_es: PENDING_ES },
      { item: 'Rod and system resistance-to-ground readings recorded (dry weather, soil conditions noted)', item_es: PENDING_ES },
      { item: 'Photos of every buried connection taken before cover', item_es: PENDING_ES },
    ],
    roof_rough_in_inspection: [
      { item: 'Air terminal layout and two-way paths match the approved drawings', item_es: PENDING_ES },
      { item: 'Adhesive bases installed per roof maker; nothing fastened to coping', item_es: PENDING_ES },
      { item: 'Roof-top equipment and metal within side-flash distance bonded', item_es: PENDING_ES },
    ],
    master_label_inspection: [
      { item: 'Third-party inspector (UL Master Label or LPI-IP) walks the complete system', item_es: PENDING_ES, ref: 'UL 96A' },
      { item: 'Continuity readings for every numbered test point and the ground-resistance report available', item_es: PENDING_ES },
      { item: 'Down conductor guards, bonds to building grounding and SPDs verified', item_es: PENDING_ES },
      { item: 'Certificate, test report and record drawings handed to the owner', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'G-LPS-AIR-TERM-EA', name: 'LPS air terminal with base, installed (incl. bonding to roof conductor)', name_es: 'Punta captadora con base, instalada (incluye unión al conductor de techo)', unit: 'EA', csi: '26 41 13',
      material_cost_cents: { v: 4500, prov: est('copper or aluminum air terminal + adhesive or mechanical base + connector, national baseline 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('layout, surface prep, set base, connect') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('counted items') } },
    { code: 'G-LPS-COND-LF', name: 'LPS main conductor (roof or down run) with fasteners, per LF', name_es: 'Conductor principal de pararrayos (techo o bajada) con sujetadores, por pie lineal', unit: 'LF', csi: '26 41 13',
      material_cost_cents: { v: 600, prov: est('Class I copper main-size cable + cable holders every few feet, 2026') }, labor_hours_per_unit: { v: 0.12, prov: est('run, bend and fasten on roof or wall') },
      equipment_cost_cents: { v: 0, prov: est('lift time carried separately (EQUIP)') }, waste_pct: { v: 8, prov: est('bends, laps and offcuts') } },
    { code: 'G-LPS-GROUND-ROD-EA', name: 'LPS ground rod, driven, with exothermic connection and test well', name_es: 'Varilla de tierra para pararrayos, hincada, con conexión exotérmica y registro de prueba', unit: 'EA', csi: '26 41 13',
      material_cost_cents: { v: 9000, prov: est('copper-clad rod + weld shot/mold share + test well, 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('locate, drive, weld, set well, test') },
      equipment_cost_cents: { v: 1500, prov: est('rotary hammer/driver + ground tester day share') }, waste_pct: { v: 0, prov: est('counted items') } },
    { code: 'G-LPS-BOND-EA', name: 'LPS bonding connection to metal body or building ground system', name_es: 'Conexión de unión equipotencial del pararrayos a cuerpo metálico o sistema de tierra del edificio', unit: 'EA', csi: '26 41 13',
      material_cost_cents: { v: 3500, prov: est('bonding plate/clamp + short bonding conductor, 2026') }, labor_hours_per_unit: { v: 0.5, prov: est('prep surface, fasten, test') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('counted items') } },
    { code: 'G-LPS-CERT-EA', name: 'LPS third-party inspection and certification, per structure', name_es: 'Inspección y certificación de tercero del pararrayos, por estructura', unit: 'EA', csi: '26 41 13',
      description: 'Inspector fee in material; labor = installer walk-down, continuity testing and documentation.',
      material_cost_cents: { v: 120000, prov: est('third-party (UL / LPI-IP) inspection fee for a single mid-size structure, 2026 — varies by size and travel') }, labor_hours_per_unit: { v: 4, prov: est('accompany inspector, continuity tests, test-point sketch, report') },
      equipment_cost_cents: { v: 0, prov: est('meters carried with crew') }, waste_pct: { v: 0, prov: est('service item') } },
  ],
  quantity_rules: [
    { code: 'G-LPS-CERT-EA', assumption: 'One certified structure per project when lightning protection is on the schedule — adjust for multi-building sites', when: { building_types: ['commercial', 'industrial', 'residential_mf'] }, qty: { basis: 'const' } },
    { code: 'G-LPS-GROUND-ROD-EA', assumption: 'Starting count of 4 ground rods (one per corner down conductor) until the LPS shop drawings set the real number', when: { building_types: ['commercial', 'industrial', 'residential_mf'] }, qty: { basis: 'const', mul: 4 } },
  ],
  dependency_hints: [
    { after_trades: ['roofing'], before_phase: 'commissioning', note: 'Roof terminals and conductors go on after the roof membrane is complete, and the system is certified before closeout.' },
  ],
});
