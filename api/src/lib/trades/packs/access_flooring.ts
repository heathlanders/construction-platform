// Trade Knowledge Pack — access_flooring (Raised Access Flooring). Wave 15 — NEW-TRADE pattern (no hand recipe,
// no template tasks). Dossier: docs/trade-packs/dossiers/access_flooring.md. Sources: UFGS 09 69 13 Rigid Grid Access
// Flooring (execution, tolerances, grounding, air leakage, ramps), CISCA Recommended Test Procedures (reference only),
// Tate FAQ (manufacturer), 29 CFR 1926 (C, D, E, H, I, K, M, Z), IBC 1012/1015/1607, NEC 645, IMC 602 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['access_flooring-ufgs-09-69-13'], confidence: 'verified' as const, last_verified: D };
const ufgsCisca = { src: ['access_flooring-ufgs-09-69-13', 'access_flooring-cisca'], confidence: 'verified' as const, last_verified: D, note: 'Test method is CISCA (reference only); acceptance limits are the project spec.' };
const mfr = { src: ['access_flooring-tate-faq', 'access_flooring-ufgs-09-69-13'], confidence: 'derived' as const, last_verified: D, note: 'Common to manufacturer instructions and UFGS 09 69 13 — follow the instructions for the system installed.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const nfpa = { src: ['nfpa-fa'], confidence: 'verified' as const, last_verified: D };

const TITLE_RE = 'access\\s*floor|raised\\s*(?:access\\s*)?floor|computer\\s*(?:room\\s*)?floor|under\\s*-?floor\\s*air';

export default definePack({
  key: 'access_flooring',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs raised access floors for data centers, computer rooms and open offices — slab prep and sealing, pedestal grid, stringers, removable floor panels, cutouts and airflow panels, ramps, steps and edge closures, grounding of the metal understructure, and the load, levelness, air-leakage and resistance checks. The cabling, power and air that run underneath belong to other trades.',
    summary_es: 'Instala pisos técnicos elevados en centros de datos y oficinas — losa sellada, pedestales, largueros, paneles, recortes, paneles perforados, rampas y cierres de borde, puesta a tierra y pruebas de carga, nivel, fuga de aire y resistencia. Cableado, energía y aire bajo el piso son de otros oficios.',
    glossary: [
      { term: 'Pedestal', term_es: 'Pedestal', def: 'Adjustable steel post glued or bolted to the slab that holds up the panels at the floor height.', def_es: 'Poste de acero ajustable pegado o anclado a la losa que sostiene los paneles a la altura del piso.' },
      { term: 'Stringer', term_es: 'Larguero', def: 'Metal bar that locks across pedestal heads to stiffen the grid and keep it from racking.', def_es: 'Barra metálica que se traba entre las cabezas de los pedestales para rigidizar la retícula.' },
      { term: 'Floor panel', term_es: 'Panel de piso', def: 'Removable square tile (usually 24 in.) that sits on the pedestals and lifts out with a suction lifter.', def_es: 'Placa cuadrada removible (normalmente de 24 pulg.) que se apoya en los pedestales y se levanta con ventosa.' },
      { term: 'Perforated panel', term_es: 'Panel perforado', def: 'Panel with holes or a grille that lets conditioned air up from the underfloor plenum.', def_es: 'Panel con agujeros o rejilla que deja subir el aire acondicionado desde el pleno bajo el piso.' },
      { term: 'Cutout and grommet', term_es: 'Recorte y pasacables', def: 'Hole cut in a panel for cables, finished with edge trim and a brush or seal grommet.', def_es: 'Agujero cortado en un panel para cables, terminado con moldura de borde y pasacables de cepillo o sello.' },
      { term: 'Underfloor plenum', term_es: 'Pleno bajo el piso', def: 'The air space between slab and panels when it is used to deliver or return air.', def_es: 'El espacio de aire entre la losa y los paneles cuando se usa para suministrar o retornar aire.' },
      { term: 'Finished floor height', term_es: 'Altura de piso terminado', def: 'Height from the slab to the top of the panels, set by the drawings.', def_es: 'Altura desde la losa hasta la cara superior de los paneles, según los planos.' },
      { term: 'Rolling load', term_es: 'Carga rodante', def: 'Weight a panel can take from a wheeled cart or rack rolling across it.', def_es: 'Peso que un panel soporta cuando un carro o rack con ruedas pasa sobre él.' },
      { term: 'Fascia / edge closure', term_es: 'Fascia / cierre de borde', def: 'Plate that covers the open side of the floor at a drop, ramp or step.', def_es: 'Placa que cubre el costado abierto del piso en un desnivel, rampa o escalón.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'raised_access_floor',
      example_title: 'Install raised access floor system',
      when: { title_re: TITLE_RE },
      steps: [
        {
          title: 'Condition the room, clean and seal the slab',
          instruction: 'Start only when the room is closed in and held at the temperature and humidity the spec calls for, and keep it there through install. Clear all debris, vacuum the slab dust-free, and apply the dust/vapor sealer only if it is compatible with the pedestal adhesive — otherwise seal after the pedestals cure.',
          detail: 'Grind high spots or patch low spots only where the pedestal adjustment range cannot take up the slab.',
          tools: ['HEPA vacuum', 'roller', 'moisture/temperature meter'],
          materials: ['slab sealer compatible with pedestal adhesive'],
          safety_ids: ['silica_dust', 'chem_adhesive'],
          qa_ids: ['room_conditioned', 'slab_clean_sealed'],
        },
        {
          title: 'Lay out the grid and set the pedestals',
          instruction: 'Snap the two control lines from the approved layout drawing, square to each other, and set the grid so cut panels land at the walls, not in the middle. Glue or anchor each pedestal base in full contact with the slab, set it plumb, and run heights to the finished floor elevation with a laser; lock every height adjustment.',
          detail: 'Use expansion anchors instead of adhesive, and add bracing, where the seismic design or floor height calls for it.',
          tools: ['rotary laser', 'chalk line', 'tape measure', 'hammer drill with dust shroud'],
          materials: ['pedestals', 'pedestal adhesive', 'expansion anchors where required', 'seismic bracing where required'],
          safety_ids: ['silica_dust', 'chem_adhesive', 'eye_flying'],
          qa_ids: ['pedestal_plumb_contact', 'pedestal_anchor_seismic'],
        },
        {
          title: 'Install stringers and auxiliary framing',
          instruction: 'Lock stringers onto the pedestal heads in straight parallel lines at the set elevation. Add extra pedestals or framing at columns, along ramps, at open ends of the floor and under panels that will be cut heavily, and tie it to the main grid.',
          tools: ['drill/driver', 'level', 'rotary laser'],
          materials: ['stringers', 'stringer screws', 'auxiliary pedestals and framing'],
          safety_ids: ['open_floor', 'eye_flying'],
          qa_ids: ['stringers_locked'],
        },
        {
          title: 'Lay panels, cutouts and airflow panels',
          instruction: 'Set panels from the control lines out, seated on the heads with no rock. Fasten perimeter panels and panels at columns, steps and ramps so the edge is rigid. Cut panels with a dust-controlled saw, seal or finish the cut edges, put edge trim on every cable cutout and seal cutouts with grommets where the floor is a plenum. Place perforated panels only where the airflow drawing shows them. Cover any open panel position and keep it marked.',
          tools: ['suction panel lifter', 'track or band saw with dust collection', 'straightedge', 'feeler gauge'],
          materials: ['floor panels', 'perforated airflow panels', 'cutout edge trim', 'brush or seal grommets', 'cut-edge sealant'],
          safety_ids: ['open_floor', 'cover_secure', 'panel_handling', 'silica_dust', 'saw_cut'],
          qa_ids: ['floor_level', 'perimeter_fastened', 'cutouts_trimmed', 'perf_per_plan'],
        },
        {
          title: 'Build ramps, steps, closures and guards',
          instruction: 'Fasten ramps and steps to the floor system and to the slab, no steeper than the drawings and the code allow, with a non-slip surface and handrails where required. Close every exposed floor edge with fascia, and install guards wherever the open side of the floor drops more than the code limit.',
          tools: ['drill/driver', 'level', 'tape measure', 'digital angle finder'],
          materials: ['ramp and step units', 'non-slip surface', 'handrails', 'fascia / edge closure plates', 'guards'],
          safety_ids: ['open_floor', 'saw_cut'],
          qa_ids: ['ramp_slope_rails', 'edge_closed'],
          code_refs: [
            { section: '1012', code_type: 'IBC', note: 'Ramps — slope, landings, handrails and edge protection' },
            { section: '1015', code_type: 'IBC', note: 'Guards at open-sided walking surfaces' },
          ],
        },
        {
          title: 'Ground, test and protect the floor',
          instruction: 'Bond the pedestal grid to the building grounding system as the electrical drawings show and check panel-to-pedestal and stringer-to-pedestal resistance. Run the acceptance tests the spec calls for (load and rolling load, levelness, and plenum air leakage when the space is a plenum). Vacuum the underfloor clean, close plenum penetrations, then lay protective runways before any racks or heavy equipment roll in.',
          tools: ['resistance meter', 'straightedge', 'HEPA vacuum', 'suction panel lifter'],
          materials: ['grounding conductor and pedestal clamps', 'hardboard or plywood runways', 'plenum penetration sealant'],
          safety_ids: ['live_circuit', 'cord_shock', 'floor_overload', 'open_floor'],
          qa_ids: ['grounding_resistance', 'acceptance_tests', 'plenum_leakage', 'protection_runways'],
          gating_inspection_type: 'final',
          code_refs: [
            { section: '1607.1', code_type: 'IBC', note: 'Live loads — access floor systems for office versus computer use' },
            { section: '645.5', code_type: 'NEC', note: 'IT equipment rooms — supply circuits and cables under raised floors' },
            { section: '602.2', code_type: 'IMC', note: 'Plenums — materials exposed in an underfloor air space' },
          ],
        },
      ],
    },
  ],
  code_refs: {
    final: [
      { section: '1012', code_type: 'IBC', note: 'Ramps — slope, landings, handrails and edge protection', prov: icc },
      { section: '1015', code_type: 'IBC', note: 'Guards where an open side of a walking surface drops off', prov: icc },
      { section: '1607.1', code_type: 'IBC', note: 'Live loads — access floor systems for office versus computer use', prov: icc },
      { section: '645.5', code_type: 'NEC', note: 'IT equipment rooms — supply circuits and cables under raised floors', prov: nfpa },
      { section: '602.2', code_type: 'IMC', note: 'Plenums — materials exposed in an underfloor air space', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: TITLE_RE, building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'forklift', reason: 'Unload and stage pallets of floor panels and pedestals', optional: true },
  ],
  hazards: [
    { id: 'open_floor', hazard: 'Stepping into an open panel position or off the unfinished floor edge', hazard_es: PENDING_ES, controls: ['Cover every open panel position or barricade it before walking away', 'Keep the work edge of the floor flagged until panels and closures are in'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(ii)', severity: 3, prov: osha('m') },
    { id: 'cover_secure', hazard: 'Temporary cover over an open panel slides or tips', hazard_es: PENDING_ES, controls: ['Secure covers so feet, carts and equipment cannot shift them', 'Mark covers "HOLE" or "COVER" or color-code them', 'Size covers to carry twice the load that may cross them'], controls_es: PENDING_ES, osha_ref: '1926.502(i)(3)', severity: 3, prov: osha('m') },
    { id: 'panel_handling', hazard: 'Pinched fingers and back strain lifting heavy steel or concrete-filled panels', hazard_es: PENDING_ES, controls: ['Use the suction lifter, never fingers under the edge', 'Lift with legs and carry one panel at a time'], controls_es: PENDING_ES, osha_ref: '1926.20(b)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('c') },
    { id: 'stacked_material', hazard: 'Pallets of panels and pedestals sliding or toppling', hazard_es: PENDING_ES, controls: ['Stack panels flat and interlocked on solid ground', 'Do not stack above the height the supplier allows'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 3, prov: osha('h') },
    { id: 'floor_overload', hazard: 'Panel or pedestal failure under racks, lifts or stored material beyond the rated load', hazard_es: PENDING_ES, controls: ['Know the panel concentrated and rolling load rating before any move-in', 'Roll heavy loads only on protective runways; never stage pallets on the finished floor'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(2)(i)', severity: 3, prov: osha('h') },
    { id: 'silica_dust', hazard: 'Silica dust from drilling anchors in the slab and cutting cementitious panels', hazard_es: PENDING_ES, controls: ['Use drills and saws with shrouds and dust collection', 'Follow the Table 1 controls for the task, or monitor exposure'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator when Table 1 requires'], prov: osha('z') },
    { id: 'saw_cut', hazard: 'Saw cuts while cutting panels and closures', hazard_es: PENDING_ES, controls: ['Keep guards in place and clamp or support the panel', 'Unplug before changing blades'], controls_es: PENDING_ES, osha_ref: '1926.300(b)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'eye_flying', hazard: 'Eye injury from drilling chips and cut debris', hazard_es: PENDING_ES, controls: ['Wear safety glasses while drilling, cutting and fastening'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'chem_adhesive', hazard: 'Skin and breathing irritation from pedestal adhesive and slab sealer', hazard_es: PENDING_ES, controls: ['Read the SDS and ventilate the room', 'Wear gloves and eye protection'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d') },
    { id: 'live_circuit', hazard: 'Shock from energized power whips or cables already under the floor in occupied rooms', hazard_es: PENDING_ES, controls: ['Treat underfloor power as live until it is de-energized and verified', 'Do not cut panels or drill near cables without knowing where they run'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'cord_shock', hazard: 'Electric shock from saw and drill cords', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Inspect cords daily; remove damaged ones'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
  ],
  qa_checklist: [
    { id: 'room_conditioned', item: 'Room enclosed and held at the specified temperature and humidity for 24 hours before and during install.', item_es: { status: 'translated', text: 'Sala cerrada y mantenida a la temperatura y humedad especificadas 24 horas antes y durante la instalación.' }, prov: ufgs },
    { id: 'slab_clean_sealed', item: 'Slab free of debris and dust; sealer applied and compatible with the pedestal adhesive (or applied after pedestals cure).', item_es: { status: 'translated', text: 'Losa sin escombros ni polvo; sellador aplicado y compatible con el adhesivo de los pedestales (o aplicado después del curado).' }, prov: ufgs },
    { id: 'pedestal_plumb_contact', item: 'Pedestals on the layout grid, plumb, base plates in full contact with the slab, and every height adjustment locked.', item_es: { status: 'translated', text: 'Pedestales en la retícula del plano, aplomados, placas base en contacto pleno con la losa y cada ajuste de altura trabado.' }, prov: ufgs },
    { id: 'pedestal_anchor_seismic', item: 'Pedestals glued or anchored and braced exactly as the approved (seismic) design requires.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'stringers_locked', item: 'Stringers interlocked with pedestal heads in straight parallel lines; extra framing at columns, ramps, open ends and heavily cut panels.', item_es: { status: 'translated', text: 'Largueros trabados a las cabezas de pedestal en líneas rectas y paralelas; estructura adicional en columnas, rampas, bordes abiertos y paneles muy recortados.' }, prov: ufgs },
    { id: 'floor_level', item: 'Finished floor level within the spec (UFGS default: 0.060 in. in 10 ft, 0.030 in. across panel joints); no rocking panels.', item_es: { status: 'translated', text: 'Piso terminado nivelado dentro de la especificación (UFGS: 0.060 pulg. en 10 pies, 0.030 pulg. entre paneles); ningún panel cojea.' }, prov: ufgs },
    { id: 'perimeter_fastened', item: 'Perimeter panels and panels at columns, steps and ramps fastened to the understructure.', item_es: { status: 'translated', text: 'Paneles perimetrales y junto a columnas, escalones y rampas fijados a la estructura inferior.' }, prov: ufgs },
    { id: 'cutouts_trimmed', item: 'Cut panel edges sealed or finished; every cable cutout has edge trim, and plenum cutouts are closed with grommets.', item_es: { status: 'translated', text: 'Bordes cortados sellados o terminados; cada recorte tiene moldura y los recortes en pleno se cierran con pasacables.' }, prov: ufgs },
    { id: 'perf_per_plan', item: 'Perforated airflow panels only where the airflow drawing shows them; dampers set as directed.', item_es: { status: 'translated', text: 'Paneles perforados solo donde los muestra el plano de flujo de aire; compuertas ajustadas según indicación.' }, prov: mfr },
    { id: 'ramp_slope_rails', item: 'Ramps and steps fastened, no steeper than approved, non-slip surface, handrails where required.', item_es: PENDING_ES, safety: true, prov: { src: ['access_flooring-ufgs-09-69-13', 'icc-pa'], confidence: 'verified', last_verified: D } },
    { id: 'edge_closed', item: 'Every exposed floor edge closed with fascia; guards installed where the drop requires them.', item_es: PENDING_ES, safety: true, prov: { src: ['access_flooring-ufgs-09-69-13', 'icc-pa'], confidence: 'verified', last_verified: D } },
    { id: 'grounding_resistance', item: 'Pedestal grid bonded to the building ground; panel-to-pedestal and stringer joint resistance under 10 ohms; floor surface resistance within the spec range.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'acceptance_tests', item: 'Acceptance load tests done at the spec frequency, witnessed, and reports on file.', item_es: { status: 'translated', text: 'Pruebas de carga de aceptación realizadas con la frecuencia especificada, atestiguadas y con informes archivados.' }, prov: ufgsCisca },
    { id: 'plenum_leakage', item: 'Underfloor vacuumed clean; where it is an air plenum, joints and perimeter pass the air-leakage test and penetrations are sealed.', item_es: { status: 'translated', text: 'Bajo piso aspirado y limpio; si es pleno de aire, juntas y perímetro aprueban la prueba de fuga y las penetraciones están selladas.' }, prov: ufgsCisca },
    { id: 'protection_runways', item: 'Finished floor covered and runways laid before heavy equipment rolls in; loads kept within the panel rating.', item_es: PENDING_ES, safety: true, prov: ufgs },
  ],
  inspection_checklists: {
    final: [
      { item: 'Ramps meet the approved slope with handrails and non-slip surface', item_es: PENDING_ES, ref: 'IBC 1012' },
      { item: 'Guards installed at open floor edges where required; fascia closes every exposed edge', item_es: PENDING_ES, ref: 'IBC 1015' },
      { item: 'Panel load rating documented for the room use (office or computer)', item_es: PENDING_ES, ref: 'IBC 1607.1' },
      { item: 'Understructure bonded to the building grounding system; resistance test report available', item_es: PENDING_ES, ref: 'NEC 645.5' },
      { item: 'Underfloor plenum: penetrations sealed and materials suitable for a plenum', item_es: PENDING_ES, ref: 'IMC 602.2' },
    ],
  },
  assemblies: [
    { code: 'B-AF-SYS-SF', name: 'Raised access floor, stringered steel cementitious-fill 24 in. panels, 12–24 in. finished height, supply + install', name_es: 'Piso técnico elevado con largueros, paneles de acero rellenos de 24 pulg., altura 12–24 pulg., suministro e instalación', unit: 'SF', csi: '09 69 13',
      material_cost_cents: { v: 1800, prov: est('panels + pedestals + stringers + adhesive, national baseline 2026; HPL or bare finish, standard load grade') }, labor_hours_per_unit: { v: 0.07, prov: est('layout, pedestals, stringers, panels, leveling per SF for a typical crew') },
      equipment_cost_cents: { v: 10, prov: est('laser, lifters, saw share') }, waste_pct: { v: 3, prov: est('perimeter cut panels and spares') } },
    { code: 'B-AF-PERF-EA', name: 'Perforated airflow panel with damper, 24x24 in., add-in over a solid panel', name_es: 'Panel perforado de flujo de aire con compuerta, 24x24 pulg., adicional sobre panel sólido', unit: 'EA', csi: '09 69 13',
      material_cost_cents: { v: 20000, prov: est('steel perforated panel + damper upcharge over a solid panel, 2026') }, labor_hours_per_unit: { v: 0.25, prov: est('swap and set damper') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('ordered to count') } },
    { code: 'B-AF-CUTOUT-EA', name: 'Panel cutout with edge trim and brush/seal grommet, each', name_es: 'Recorte de panel con moldura de borde y pasacables de cepillo/sello, c/u', unit: 'EA', csi: '09 69 13',
      material_cost_cents: { v: 3500, prov: est('edge trim + brush grommet, 2026') }, labor_hours_per_unit: { v: 0.4, prov: est('mark, cut with dust collection, seal edge, trim, set grommet') },
      equipment_cost_cents: { v: 0, prov: est('saw share in system rate') }, waste_pct: { v: 5, prov: est('trim offcuts') } },
    { code: 'B-AF-RAMP-LF', name: 'Access floor ramp with non-slip surface, handrails and side closures, per LF of run', name_es: 'Rampa de piso técnico con superficie antideslizante, pasamanos y cierres laterales, por pie lineal de recorrido', unit: 'LF', csi: '09 69 13',
      description: 'Run length; about 1 ft of run per inch of floor height at the steepest allowed slope.',
      material_cost_cents: { v: 25000, prov: est('ramp framing + panels + non-slip surface + rails + fascia, per LF run, 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('frame, deck, rails, closures per LF') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('cut offs') } },
    { code: 'B-AF-GRND-SF', name: 'Access floor understructure grounding grid and bonding to building ground, per SF of floor', name_es: 'Puesta a tierra de la estructura del piso técnico y unión a la tierra del edificio, por pie cuadrado de piso', unit: 'SF', csi: '26 05 26',
      material_cost_cents: { v: 30, prov: est('bare copper conductor + pedestal clamps on a grid, 2026') }, labor_hours_per_unit: { v: 0.006, prov: est('run conductor, clamp pedestals, test resistance') },
      equipment_cost_cents: { v: 0, prov: est('meter share') }, waste_pct: { v: 5, prov: est('conductor tails') } },
  ],
  quantity_rules: [
    { code: 'B-AF-SYS-SF', assumption: '≈15% of commercial/industrial floor area is raised access floor (computer/server rooms) — set from the floor plan', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.15, round: 'ceil' } },
    { code: 'B-AF-GRND-SF', assumption: 'Grounding grid under the same raised-floor area (≈15% of floor area) — set from the floor plan', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.15, round: 'ceil' } },
    { code: 'B-AF-PERF-EA', assumption: '≈1 perforated panel per 60 SF of raised floor (cold aisles / diffusers) — set from the airflow drawing', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.0025, round: 'ceil' } },
    { code: 'B-AF-CUTOUT-EA', assumption: '≈1 cable cutout per 100 SF of raised floor — set from the equipment layout', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.0015, round: 'ceil' } },
    { code: 'B-AF-RAMP-LF', assumption: 'One ramp of ≈12 LF run at the room entry — confirm floor height and door count', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 12 } },
  ],
  dependency_hints: [
    { after_trades: ['drywall', 'painting'], before_phase: 'commissioning', note: 'Raised floor goes in after the room is closed in, painted and conditioned; underfloor power, cabling and air follow before final panels and commissioning.' },
  ],
});
