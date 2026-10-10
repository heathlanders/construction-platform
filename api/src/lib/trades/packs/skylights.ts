// Trade Knowledge Pack — skylights (Skylights). Wave 09 — NEW-TRADE pattern (no hand recipe, no
// template tasks). Dossier: docs/trade-packs/dossiers/skylights.md. Sources: 29 CFR 1926 Subparts M, X,
// L, E, I, K, D, F, C; NIOSH Alert 2004-156 (archived) + WA L&I FACE 71-188 (skylight fall cases);
// VELUX FS deck-mounted install instructions; Solatube 300 DS install instructions; ENERGY STAR
// windows/doors/skylights; IRC R308.6/R802.9/R903.2.1, IBC 2405/910, IECC R402.3/C402.4 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const fallCases = { src: ['ecfr-1926-m', 'skylights-niosh-2004-156', 'skylights-wa-lni-face-71-188'], confidence: 'verified' as const, last_verified: D };
const velux = { src: ['skylights-velux-fs-install'], confidence: 'verified' as const, last_verified: D };
const tdd = { src: ['skylights-solatube-300ds'], confidence: 'verified' as const, last_verified: D };
const mfr = { src: ['skylights-velux-fs-install', 'skylights-solatube-300ds'], confidence: 'derived' as const, last_verified: D, note: 'Common to the published installation instructions — follow the instructions for the unit and flashing kit installed.' };
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

const UNIT_RE = '\\bskylights?\\b|\\broof\\s+windows?\\b';
const TDD_RE = '\\btubular\\s+(?:daylight\\w*|skylights?)\\b|\\bsun\\s*tunnels?\\b|\\bsolar\\s*tubes?\\b|\\bdaylighting\\s+(?:device|system)s?\\b';
const COMM_RE = '\\bsmoke\\s*(?:and\\s+heat\\s+)?vents?\\b|\\b(?:unit|dome|domed|commercial|acrylic)\\s+skylights?\\b';

export default definePack({
  key: 'skylights',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs skylights and roof windows (deck-mounted and curb-mounted), tubular daylighting devices, and commercial unit skylights and smoke vents — framing the roof opening, curbs, flashing kits and underlayment wrap, the light shaft, and the fall protection every roof opening needs until it is covered or screened.',
    summary_es: 'Instala tragaluces y ventanas de techo (montadas en la cubierta o sobre bordillo), tubos de luz natural, y tragaluces comerciales y ventilas de humo — enmarcado del hueco en el techo, bordillos, juegos de tapajuntas y envoltura de base impermeable, el ducto de luz, y la protección contra caídas que requiere cada hueco del techo hasta quedar cubierto o con malla.',
    glossary: [
      { term: 'Deck-mounted skylight', term_es: 'Tragaluz montado en cubierta', def: 'Skylight whose frame fastens straight to the roof deck and is sealed with a matching flashing kit.', def_es: 'Tragaluz cuyo marco se fija directamente a la cubierta del techo y se sella con un juego de tapajuntas compatible.' },
      { term: 'Curb-mounted skylight', term_es: 'Tragaluz sobre bordillo', def: 'Skylight that sits on a raised box (curb) built around the opening; the curb is flashed first.', def_es: 'Tragaluz que se apoya en una caja elevada (bordillo) construida alrededor del hueco; el bordillo se impermeabiliza primero.' },
      { term: 'Curb', term_es: 'Bordillo', def: 'Raised frame around a roof opening that lifts the skylight above the water on the roof.', def_es: 'Marco elevado alrededor de un hueco del techo que levanta el tragaluz sobre el agua del techo.' },
      { term: 'Header', term_es: 'Cabezal', def: 'Framing member across the top and bottom of the opening that carries the cut rafters.', def_es: 'Pieza de estructura en la parte superior e inferior del hueco que carga las vigas cortadas.' },
      { term: 'Trimmer rafter', term_es: 'Viga de refuerzo lateral', def: 'Doubled rafter along each side of the opening that picks up the headers.', def_es: 'Viga doble a cada lado del hueco que recibe los cabezales.' },
      { term: 'Flashing kit', term_es: 'Juego de tapajuntas', def: 'Factory-made sill, step and head pieces sized to the skylight and roofing type.', def_es: 'Piezas de fábrica (alféizar, escalonadas y cabezal) hechas a la medida del tragaluz y del tipo de techo.' },
      { term: 'Light shaft', term_es: 'Ducto de luz', def: 'Framed, insulated and finished passage that carries light from the skylight down to the ceiling.', def_es: 'Pasaje enmarcado, aislado y acabado que lleva la luz del tragaluz hasta el techo interior.' },
      { term: 'Tubular daylighting device (TDD)', term_es: 'Tubo de luz natural', def: 'Small roof dome with a mirror-lined tube that pipes daylight to a ceiling diffuser.', def_es: 'Domo pequeño en el techo con un tubo de interior reflectante que lleva la luz a un difusor en el techo interior.' },
      { term: 'Skylight screen', term_es: 'Malla protectora de tragaluz', def: 'Fixed guard over a skylight that stops a worker from falling through the dome or glass.', def_es: 'Protección fija sobre un tragaluz que impide que un trabajador caiga a través del domo o del vidrio.' },
      { term: 'Smoke vent', term_es: 'Ventila de humo', def: 'Roof hatch-type unit that opens automatically in a fire to let smoke and heat out.', def_es: 'Unidad tipo escotilla en el techo que se abre automáticamente en un incendio para dejar salir humo y calor.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'unit_skylight_residential',
      example_title: 'Install skylights and roof windows',
      when: { title_re: UNIT_RE },
      steps: [
        {
          title: 'Lay out and frame the roof opening',
          instruction: 'Check the unit against the plans and the maker’s rough-opening size and allowed roof pitch; keep the clearances the instructions give from valleys, ridges and walls. Guard the area below, cut the deck, then add headers and double the side rafters before cutting any rafter. Trusses are never cut without an engineer’s repair detail.',
          detail: 'Cover or guard the hole the moment it is cut — it stays a fall hazard until the unit is fastened.',
          tools: ['tape measure', 'framing square', 'circular saw', 'reciprocating saw', 'framing nailer'],
          materials: ['header and trimmer lumber matching the rafters', 'joist hangers or framing connectors', 'nails per the fastening schedule'],
          safety_ids: ['fall_through_opening', 'fall_roof_edge', 'power_tool', 'falling_objects'],
          qa_ids: ['opening_guarded', 'ro_size_pitch', 'headers_doubled'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: 'R802.9', code_type: 'IRC', note: 'Framing of openings in roof and ceiling framing — headers and trimmers' }],
        },
        {
          title: 'Build or set the curb and fasten the unit',
          instruction: 'Deck-mount: set the frame on the deck, square it and fasten with the brackets or screws the maker supplies. Curb-mount: build the curb square and level to the unit size and tall enough for the roof slope, flash it, then set and fasten the unit on it. Open and close any venting sash before flashing.',
          tools: ['level', 'drill/driver', 'caulk gun'],
          materials: ['skylight unit per schedule', 'curb lumber where curb-mounted', 'installation brackets and fasteners'],
          safety_ids: ['fall_through_opening', 'fall_roof_edge', 'glass_cut', 'hoisting'],
          qa_ids: ['unit_square_fastened', 'curb_height'],
          code_refs: [{ section: 'R308.6.8', code_type: 'IRC', note: 'Curbs for skylights on low-slope roofs' }],
        },
        {
          title: 'Wrap with underlayment and install the flashing kit',
          instruction: 'Wrap the frame or curb with the adhesive skylight underlayment so it laps over the roof underlayment shingle-style. Install the flashing kit made for the roofing type: sill piece first, step flashing woven with each course, head piece last, roofing lapped over per the kit. Snap on the cladding so it counter-flashes everything.',
          tools: ['utility knife', 'J-roller', 'hammer', 'tin snips'],
          materials: ['adhesive skylight underlayment', 'flashing kit matched to the roofing material', 'roofing nails'],
          safety_ids: ['fall_roof_edge', 'fall_through_opening', 'ladder'],
          qa_ids: ['underlayment_laps', 'flashing_kit_match'],
          gating_inspection_type: 'roof_dry_in',
          code_refs: [{ section: 'R903.2.1', code_type: 'IRC', note: 'Flashing at roof openings' }],
        },
        {
          title: 'Insulate and air-seal the light shaft',
          instruction: 'Frame the shaft from the skylight to the ceiling opening. Connect the vapor or air barrier to the skylight frame where the roof has one, insulate the shaft walls to the ceiling insulation level the energy plans call for, and seal the joints before drywall.',
          tools: ['framing nailer', 'utility knife', 'stapler'],
          materials: ['shaft framing lumber', 'insulation to the energy plans', 'air-sealing tape or sealant'],
          safety_ids: ['attic_heat', 'power_tool'],
          qa_ids: ['shaft_insulated'],
          gating_inspection_type: 'insulation',
          code_refs: [{ section: 'R402.3', code_type: 'IECC', note: 'Fenestration — skylight U-factor and SHGC per the energy plans' }],
        },
        {
          title: 'Finish the shaft and check the unit',
          instruction: 'Drywall, tape and paint the shaft without getting paint on the gaskets. Confirm the glazing type matches the code and the plans, the energy label is still on the unit, and every operable sash, blind and control works. Clean up and walk the roof once more to clear debris from around the flashing.',
          tools: ['drywall tools', 'paint brush and roller', 'ladder'],
          materials: ['drywall', 'joint compound and tape', 'primer and paint'],
          safety_ids: ['ladder', 'fall_through_opening'],
          qa_ids: ['glazing_type'],
          gating_inspection_type: 'final',
          code_refs: [{ section: 'R308.6', code_type: 'IRC', note: 'Skylights and sloped glazing — glazing type and screens' }],
        },
      ],
    },
    {
      id: 'tubular_daylighting',
      example_title: 'Install tubular daylighting devices (sun tunnels)',
      when: { title_re: TDD_RE },
      priority: 10,
      steps: [
        {
          title: 'Locate the diffuser and dome',
          instruction: 'Mark the ceiling diffuser between joists over the area to light, then find the matching roof spot between rafters, clear of valleys, chimneys, shade and attic obstructions (ducts, flues, pipes, wiring, sprinklers). In the attic stand only on framing — drywall will not hold a person.',
          tools: ['tape measure', 'flashlight', 'keyhole saw'],
          materials: [],
          safety_ids: ['attic_heat', 'attic_fall_ceiling', 'power_tool'],
          qa_ids: ['tdd_flashing_lap'],
        },
        {
          title: 'Cut the roof and set the flashing',
          instruction: 'Cut the round roof hole to the template without cutting rafters. Slide the flashing under the shingle courses above and over the courses below (or set it on the curb on low-slope roofs), seal and screw it per the instructions, then set the dome.',
          tools: ['reciprocating saw', 'flat bar', 'caulk gun', 'drill/driver'],
          materials: ['flashing (shingle or curb cap)', 'sealant', 'flashing screws', 'dome'],
          safety_ids: ['fall_roof_edge', 'fall_through_opening', 'ladder'],
          qa_ids: ['tdd_flashing_lap'],
          gating_inspection_type: 'roof_dry_in',
          code_refs: [{ section: 'R903.2.1', code_type: 'IRC', note: 'Flashing at roof openings' }],
        },
        {
          title: 'Assemble the tube and diffuser',
          instruction: 'Join tube sections with the supplied screws and foil-tape every seam; tape alone does not hold the tube. Support long runs. Keep the protective film on until each piece is in place and keep tube scrap covered — mirrored parts focus sunlight and can start a fire. Install the ceiling ring and diffuser, then clean up all reflective scrap.',
          tools: ['drill/driver', 'tin snips', 'utility knife'],
          materials: ['tube sections', 'foil tape', 'tube screws', 'ceiling ring and diffuser'],
          safety_ids: ['focused_sunlight', 'glass_cut', 'attic_heat'],
          qa_ids: ['tdd_joints', 'reflective_scrap_cleared'],
          gating_inspection_type: 'final',
        },
      ],
    },
    {
      id: 'commercial_unit_skylight',
      example_title: 'Install unit skylights and smoke vents on roof curbs',
      when: { title_re: COMM_RE, building_types: ['commercial', 'industrial', 'residential_mf'] },
      priority: 5,
      steps: [
        {
          title: 'Protect every opening before work starts',
          instruction: 'Walk the roof with the plan and mark every new opening and every existing skylight. Install guardrails, secured and marked covers, or fixed skylight screens before anyone works nearby. A warning line or safety monitor alone is not protection at a skylight.',
          tools: ['tape measure', 'drill/driver'],
          materials: ['skylight screens or plywood covers marked "HOLE" or "COVER"', 'guardrail sections'],
          safety_ids: ['fall_through_opening', 'existing_skylight', 'cover_failure', 'fall_roof_edge'],
          qa_ids: ['opening_guarded', 'cover_marked_secured'],
        },
        {
          title: 'Cut openings and set the curbs',
          instruction: 'Cut the deck to the curb size, frame or support the opening as the structural drawings show, and set the wood or prefabricated metal curb level and square. Coordinate with the roofer so the membrane is turned up the curb and counterflashed before the unit goes on.',
          tools: ['circular saw', 'reciprocating saw', 'drill/driver', 'level'],
          materials: ['curbs per schedule', 'support angles or framing per the structural drawings', 'fasteners'],
          safety_ids: ['fall_through_opening', 'falling_objects', 'power_tool'],
          qa_ids: ['curb_height'],
          gating_inspection_type: 'roof_dry_in',
          code_refs: [{ section: '2405', code_type: 'IBC', note: 'Sloped glazing and skylights — framing, curbs and glazing' }],
        },
        {
          title: 'Set and fasten the units',
          instruction: 'Hoist units to the roof with the lift and set them on the curbs; fasten through the frame at the spacing the maker gives and seal per the instructions. Leave screens on or install them now so the domes are never walked on.',
          tools: ['drill/driver', 'caulk gun'],
          materials: ['unit skylights or smoke vents per schedule', 'frame fasteners', 'sealant'],
          safety_ids: ['fall_through_opening', 'hoisting'],
          qa_ids: ['unit_square_fastened', 'screens_installed'],
        },
        {
          title: 'Test smoke vents and close out',
          instruction: 'Open each smoke vent with its release and confirm it opens fully and resets, with the fire alarm or sprinkler trade where it is tied in. Check glazing labels against the energy and fire documents and leave the release test record for the inspector.',
          tools: ['ladder'],
          materials: ['test record'],
          safety_ids: ['fall_through_opening', 'ladder'],
          qa_ids: ['smoke_vent_test', 'glazing_type'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '910', code_type: 'IBC', note: 'Smoke and heat removal — vents where required' }, { section: 'C402.4', code_type: 'IECC', note: 'Fenestration — skylight area and performance' }],
        },
      ],
    },
  ],
  code_refs: {
    framing: [
      { section: 'R802.9', code_type: 'IRC', note: 'Framing of openings in roof and ceiling framing', prov: icc },
    ],
    roof_dry_in: [
      { section: 'R903.2.1', code_type: 'IRC', note: 'Flashing locations — around roof openings', prov: icc },
      { section: 'R308.6.8', code_type: 'IRC', note: 'Curbs for skylights on low-slope roofs', prov: icc },
      { section: '2405', code_type: 'IBC', note: 'Sloped glazing and skylights', prov: icc },
    ],
    insulation: [
      { section: 'R402.3', code_type: 'IECC', note: 'Fenestration U-factor and SHGC — residential', prov: icc },
    ],
    final: [
      { section: 'R308.6', code_type: 'IRC', note: 'Skylights and sloped glazing — permitted glazing and screens', prov: icc },
      { section: 'C402.4', code_type: 'IECC', note: 'Fenestration — commercial skylight area and performance', prov: icc },
      { section: '910', code_type: 'IBC', note: 'Smoke and heat removal', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: COMM_RE, building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'telehandler', reason: 'Lift curbs, unit skylights and smoke vents to the roof', optional: true },
    { when: { title_re: UNIT_RE }, type: 'air_compressor', reason: 'Pneumatic nailers for header framing and shaft framing', optional: true },
  ],
  hazards: [
    { id: 'fall_through_opening', hazard: 'Fall through an open skylight hole or a skylight dome/glass that cannot hold a person', hazard_es: PENDING_ES, controls: ['Protect any skylight or roof hole more than 6 ft above the lower level with guardrails, a cover or personal fall arrest', 'Never step, sit or lean on a dome, glass or tube top'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(i)', severity: 4, ppe: ['harness when required'], prov: fallCases },
    { id: 'existing_skylight', hazard: 'Fall through existing skylights while working elsewhere on the roof', hazard_es: PENDING_ES, controls: ['Mark and guard or screen every existing skylight before work', 'Do not rely on a warning line or safety monitor alone near skylights'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(i)', severity: 4, prov: fallCases },
    { id: 'cover_failure', hazard: 'Hole cover shifts, is removed or breaks and a worker falls through', hazard_es: PENDING_ES, controls: ['Covers must carry twice the load put on them, be secured against wind and traffic, and be marked "HOLE" or "COVER"'], controls_es: PENDING_ES, osha_ref: '1926.502(i)', severity: 4, prov: osha('m') },
    { id: 'fall_roof_edge', hazard: 'Fall from the roof edge while framing, flashing or carrying units', hazard_es: PENDING_ES, controls: ['Residential: guardrails, safety net or personal fall arrest at 6 ft or more', 'Low-slope roofs: guardrails, nets, fall arrest, or warning line combined with another system as the standard allows'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(13)', severity: 4, ppe: ['harness + lanyard'], prov: osha('m') },
    { id: 'falling_objects', hazard: 'Cut decking, tools or a unit falling through the opening or off the roof onto people below', hazard_es: PENDING_ES, controls: ['Keep people out of the room below while cutting; barricade the drop zone outside', 'Use toeboards or screens and keep material away from edges and holes'], controls_es: PENDING_ES, osha_ref: '1926.501(c)', severity: 3, prov: osha('m') },
    { id: 'ladder', hazard: 'Ladder slip or overreach getting onto the roof or working in the shaft', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above the landing and secure it', 'Hoist units instead of carrying them up the ladder'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'attic_fall_ceiling', hazard: 'Stepping through the ceiling drywall while working in the attic', hazard_es: PENDING_ES, controls: ['Walk only on joists or a laid-down plank platform', 'Light the attic before moving around'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(ii)', severity: 3, prov: { src: ['ecfr-1926-m', 'skylights-solatube-300ds'], confidence: 'verified', last_verified: D } },
    { id: 'attic_heat', hazard: 'Heat stress and poor air in hot attics', hazard_es: PENDING_ES, controls: ['Work attics early in the day, take water and rest breaks, keep a partner within earshot', 'Use a dust mask or respirator in dusty attics'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: { src: ['ecfr-1926-c', 'skylights-solatube-300ds'], confidence: 'derived', last_verified: D, note: 'General hazard-training duty; heat and attic cautions from the TDD instructions.' } },
    { id: 'focused_sunlight', hazard: 'Mirrored tube parts and scrap focus sunlight and start a fire or burn skin', hazard_es: PENDING_ES, controls: ['Keep the protective film on until each part is installed', 'Never leave tubes or foil scrap in the sun or on combustibles; bag scrap right away'], controls_es: PENDING_ES, osha_ref: '1926.150(a)(1)', severity: 3, prov: { src: ['ecfr-1926-f', 'skylights-solatube-300ds'], confidence: 'derived', last_verified: D, note: 'Fire-protection program duty (Subpart F) applied to the sunlight hazard the manufacturer warns about.' } },
    { id: 'glass_cut', hazard: 'Cuts from broken glass, sharp sheet-metal flashing and tube edges', hazard_es: PENDING_ES, controls: ['Wear cut-resistant leather or canvas gloves handling flashing, tubes and glazing'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves', 'safety glasses'], prov: osha('e') },
    { id: 'hoisting', hazard: 'Struck by a load lifted to the roof with a telehandler or hoist', hazard_es: PENDING_ES, controls: ['Only trained operators run the lift; keep people out from under the load', 'Use the attachments and capacity the lift maker rates'], controls_es: PENDING_ES, osha_ref: '1926.602(c)', severity: 3, prov: osha('o') },
    { id: 'power_tool', hazard: 'Saw kickback cutting decking and rafters', hazard_es: PENDING_ES, controls: ['Keep guards in place, set blade depth to the deck, stand to the side of the cut'], controls_es: PENDING_ES, osha_ref: '1926.300(b)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
  ],
  qa_checklist: [
    { id: 'opening_guarded', phase: 'roofing', item: 'Every new opening and existing skylight is guarded, screened or covered before work near it; no reliance on a warning line alone.', item_es: PENDING_ES, safety: true, prov: fallCases },
    { id: 'cover_marked_secured', phase: 'roofing', item: 'Hole covers are strong enough for the load, fastened down and marked "HOLE" or "COVER".', item_es: PENDING_ES, safety: true, prov: osha('m') },
    { id: 'screens_installed', phase: 'roofing', item: 'Fixed skylight screens installed on commercial units where the plans or the owner require them.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'ecfr-1926-m'], confidence: 'verified', last_verified: D } },
    { id: 'ro_size_pitch', phase: 'framing', item: 'Rough opening matches the maker’s size for the unit, the roof pitch is inside the unit’s allowed range, and clearances to valleys, ridges and walls are kept.', item_es: tr('El hueco coincide con la medida del fabricante, la pendiente del techo está dentro del rango permitido de la unidad y se respetan las distancias a limahoyas, cumbreras y muros.'), prov: velux },
    { id: 'headers_doubled', phase: 'framing', item: 'Cut rafters carried by headers at top and bottom and doubled trimmers at each side; no truss cut without an engineer’s detail.', item_es: tr('Vigas cortadas soportadas por cabezales arriba y abajo y vigas dobles a cada lado; ninguna armadura cortada sin detalle de ingeniero.'), prov: icc },
    { id: 'unit_square_fastened', phase: 'roofing', item: 'Unit or curb square and level, fastened with the brackets, screws and spacing in the instructions.', item_es: tr('Unidad o bordillo a escuadra y nivelado, fijado con los soportes, tornillos y separación de las instrucciones.'), prov: mfr },
    { id: 'curb_height', phase: 'roofing', item: 'Curb height suits the roof slope and the code minimum on low-slope roofs; roof membrane turned up the curb and counterflashed before the unit is set.', item_es: tr('La altura del bordillo corresponde a la pendiente y al mínimo del código en techos de baja pendiente; membrana del techo subida por el bordillo y cubierta con contratapajuntas antes de colocar la unidad.'), prov: { src: ['icc-pa', 'skylights-solatube-300ds'], confidence: 'verified', last_verified: D } },
    { id: 'underlayment_laps', phase: 'roofing', item: 'Adhesive skylight underlayment wraps the frame and laps over the roof underlayment so water sheds outward.', item_es: tr('La base impermeable adhesiva envuelve el marco y se traslapa sobre la base del techo para que el agua escurra hacia afuera.'), prov: velux },
    { id: 'flashing_kit_match', phase: 'roofing', item: 'Flashing kit made for the roofing installed in order (sill, step pieces woven with each course, head last); cladding counter-flashes it and the bottom gasket shows over the sill flashing.', item_es: tr('Juego de tapajuntas para el tipo de techo instalado en orden (alféizar, piezas escalonadas por hilera, cabezal al final); el revestimiento lo cubre y el empaque inferior se ve sobre el tapajuntas del alféizar.'), prov: velux },
    { id: 'shaft_insulated', phase: 'insulation', item: 'Light-shaft walls insulated to the energy plans, joints air-sealed, and any roof vapor or air barrier tied to the skylight frame before drywall.', item_es: tr('Paredes del ducto de luz aisladas según los planos de energía, juntas selladas y la barrera de vapor o de aire del techo conectada al marco del tragaluz antes del panel de yeso.'), prov: { src: ['skylights-velux-fs-install', 'icc-pa', 'energy-star-windows'], confidence: 'derived', last_verified: D, note: 'Shaft walls are part of the thermal envelope; level comes from the project energy documents; barrier tie-in from the install instructions.' } },
    { id: 'glazing_type', phase: 'finishes_interior', item: 'Glazing type (laminated, tempered or plastic) matches the plans and the code for skylights over occupied space.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'skylights-velux-fs-install'], confidence: 'verified', last_verified: D } },
    { id: 'tdd_flashing_lap', item: 'TDD placed between framing (no rafter, truss or joist cut), clear of valleys and obstructions; flashing under the shingles above and over those below (or on a counterflashed curb), sealed and screwed.', item_es: tr('Tubo de luz colocado entre la estructura (sin cortar vigas, armaduras ni viguetas), lejos de limahoyas y obstrucciones; tapajuntas bajo las tejas de arriba y sobre las de abajo (o en bordillo con contratapajuntas), sellado y atornillado.'), prov: tdd },
    { id: 'tdd_joints', item: 'Tube joints screwed with the supplied fasteners and every seam foil-taped; long runs supported.', item_es: tr('Uniones del tubo atornilladas con los sujetadores incluidos y cada costura con cinta de aluminio; tramos largos soportados.'), prov: tdd },
    { id: 'reflective_scrap_cleared', item: 'All reflective tube and foil scrap removed from roof and attic at day’s end.', item_es: PENDING_ES, safety: true, prov: tdd },
    { id: 'smoke_vent_test', item: 'Each smoke vent opens fully on its release, resets, and the test is recorded.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa'], confidence: 'derived', last_verified: D, note: 'Operational test follows the vent maker’s instructions and the AHJ’s acceptance practice.' } },
  ],
  inspection_checklists: {
    framing: [
      { item: 'Headers and doubled trimmers frame each skylight opening; no unapproved truss cuts', item_es: PENDING_ES, ref: 'R802.9' },
    ],
    roof_dry_in: [
      { item: 'Skylight underlayment wrapped and lapped over the roof underlayment', item_es: PENDING_ES },
      { item: 'Flashing kit or curb flashing installed and counterflashed; curb height suits the slope', item_es: PENDING_ES, ref: 'R903.2.1' },
      { item: 'Openings and units guarded, screened or covered while the roof is worked', item_es: PENDING_ES },
    ],
    insulation: [
      { item: 'Light shaft insulated and air-sealed; vapor barrier tied to the frame where present', item_es: PENDING_ES, ref: 'R402.3' },
    ],
    final: [
      { item: 'Glazing type and screens meet the skylight glazing requirements', item_es: PENDING_ES, ref: 'R308.6' },
      { item: 'Energy labels on units match the compliance documents', item_es: PENDING_ES },
      { item: 'Smoke vents tested open and reset where required', item_es: PENDING_ES, ref: 'IBC 910' },
    ],
  },
  assemblies: [
    { code: 'B-SKY-DECK-EA', name: 'Deck-mounted fixed skylight ≈2x4 ft with flashing kit and underlayment, supply + install', name_es: 'Tragaluz fijo montado en cubierta ≈2x4 pies con juego de tapajuntas y base impermeable, suministro e instalación', unit: 'EA', csi: '08 62 00',
      description: 'Unit, flashing kit and underlayment set in a framed opening; header framing and light shaft are B-SKY-SHAFT-EA.',
      material_cost_cents: { v: 60000, prov: est('mid-grade laminated-glass deck-mount unit + shingle flashing kit + adhesive underlayment, national baseline 2026') }, labor_hours_per_unit: { v: 6, prov: est('cut deck, set, underlayment, flashing, cladding — two-person crew') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools only') }, waste_pct: { v: 0, prov: est('unit ordered to size') } },
    { code: 'B-SKY-CURB-EA', name: 'Curb-mounted skylight ≈2x4 ft on site-built curb with flashing, supply + install', name_es: 'Tragaluz sobre bordillo ≈2x4 pies en bordillo hecho en obra con tapajuntas, suministro e instalación', unit: 'EA', csi: '08 62 00',
      material_cost_cents: { v: 70000, prov: est('curb-mount unit + curb lumber + step/apron flashing + underlayment, 2026') }, labor_hours_per_unit: { v: 7, prov: est('build curb, flash, set and fasten unit') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('curb lumber and flashing offcuts') } },
    { code: 'B-SKY-TDD-EA', name: 'Tubular daylighting device 10–14 in. with flashing, up to 10 ft tube, supply + install', name_es: 'Tubo de luz natural de 10–14 pulg. con tapajuntas, tubo hasta 10 pies, suministro e instalación', unit: 'EA', csi: '08 62 00',
      material_cost_cents: { v: 45000, prov: est('residential TDD kit + extension tube + diffuser, national baseline 2026') }, labor_hours_per_unit: { v: 3, prov: est('roof and ceiling cut, flash, assemble tube, diffuser') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('kit') } },
    { code: 'B-SKY-SHAFT-EA', name: 'Skylight opening framing + insulated, drywalled and painted light shaft, per unit', name_es: 'Enmarcado del hueco del tragaluz + ducto de luz aislado, con panel de yeso y pintado, por unidad', unit: 'EA', csi: '06 11 00',
      description: 'Headers/trimmers and a shaft up to ~4 ft deep; vaulted ceilings with no shaft need only the framing portion.',
      material_cost_cents: { v: 20000, prov: est('framing lumber, hangers, batt insulation, drywall, compound, paint, 2026') }, labor_hours_per_unit: { v: 10, prov: est('frame opening + shaft, insulate, hang, tape, finish, paint') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 15, prov: est('drywall and lumber offcuts in short pieces') } },
    { code: 'B-SKY-UNIT-COMM-EA', name: 'Commercial unit skylight ≈4x4 ft domed on curb, supply + install', name_es: 'Tragaluz comercial unitario ≈4x4 pies con domo sobre bordillo, suministro e instalación', unit: 'EA', csi: '08 62 00',
      description: 'Unit and setting only; curb, roof membrane flashing and fall screen are separate lines.',
      material_cost_cents: { v: 120000, prov: est('double-dome acrylic or polycarbonate unit skylight with frame, national baseline 2026') }, labor_hours_per_unit: { v: 3, prov: est('hoist, set on curb, fasten and seal — two-person crew') },
      equipment_cost_cents: { v: 10000, prov: est('telehandler day share per unit') }, waste_pct: { v: 0, prov: est('unit ordered to size') } },
    { code: 'B-SKY-SCREEN-EA', name: 'Skylight fall-protection screen ≈4x4 ft, supply + install', name_es: 'Malla de protección contra caídas para tragaluz ≈4x4 pies, suministro e instalación', unit: 'EA', csi: '08 62 00',
      material_cost_cents: { v: 25000, prov: est('galvanized welded-wire or bar screen sized to the curb, 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('position and fasten to curb') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('made to size') } },
  ],
  dependency_hints: [
    { after_trades: ['framing'], before_phase: 'insulation', note: 'Skylight openings are framed and units flashed after roof framing and sheathing, before the shaft is insulated and drywalled.' },
    { after_trades: ['roofing'], note: 'Coordinate with the roofer: flashing kits and curb counterflashing are woven into the roof covering.' },
  ],
});
