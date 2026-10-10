// Trade Knowledge Pack — av_automation (AV / Home & Building Automation). Wave 12 — NEW-TRADE pattern
// (no hand recipe, no template tasks; without this pack the family electrical recipes render
// power-wiring steps). Structured cabling (data drops, media panel, device prewire) belongs to the
// low_voltage pack — this pack covers the AV/automation system on top of it: rack design, speaker /
// display / HDBaseT / control prewire, backing for mounts, trim, rack build, programming, commissioning.
// Dossier: docs/trade-packs/dossiers/av_automation.md. Sources: UFGS 27 41 00 (public domain — Part 3
// execution), NFPA 70 Art. 640 / 725 / 800 (reference only), AVIXA + CEDIA (reference only), a published
// display-mount instruction (SANUS), 29 CFR 1926 (C, E, I, K, L, M, X, Z).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['av_automation-ufgs-27-41-00'], confidence: 'verified' as const, last_verified: D };
const nec = { src: ['nfpa-fa'], confidence: 'verified' as const, last_verified: D };
const mount = { src: ['av_automation-sanus-vlt5'], confidence: 'derived' as const, last_verified: D, note: 'Representative published display-mount instruction — the multiple and fastener schedule vary by product; follow the mount installed.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'av_automation',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Designs, prewires, installs and programs audio-video and automation systems — home theaters, distributed (whole-house) audio, TVs and projectors, conference-room AV, lighting/shade/climate control keypads and touch panels — then commissions the system and trains the owner. Rides on the low-voltage cabling trade for data drops and the media panel; the electrician supplies the power circuits.',
    summary_es: 'Diseña, precablea, instala y programa sistemas de audio, video y automatización (cine en casa, audio distribuido, TV y proyectores, salas de juntas, teclados de luces, cortinas y clima); luego los pone en marcha y capacita al dueño. Datos y panel de medios son de baja tensión; los circuitos de energía, del electricista.',
    glossary: [
      { term: 'Rack elevation', term_es: 'Elevación del rack', def: 'Front-view drawing of the equipment rack showing what goes in each rack space, plus shelves, fans and power.', def_es: 'Dibujo frontal del rack que muestra qué equipo va en cada espacio, más repisas, ventiladores y energía.' },
      { term: 'Rack unit (U)', term_es: 'Unidad de rack (U)', def: 'Standard height of one rack space, 1.75 in.; equipment and racks are sized in U.', def_es: 'Altura estándar de un espacio de rack, 1.75 pulg.; equipos y racks se miden en U.' },
      { term: 'HDBaseT', term_es: 'HDBaseT', def: 'Way to send video, audio, control and sometimes power over one Cat6 cable from the rack to a display.', def_es: 'Forma de enviar video, audio, control y a veces energía por un solo cable Cat6 desde el rack hasta una pantalla.' },
      { term: 'Distributed audio', term_es: 'Audio distribuido', def: 'One amplifier location feeding speakers in many rooms or zones, each with its own volume control.', def_es: 'Un solo lugar de amplificadores que alimenta bocinas en muchos cuartos o zonas, cada una con su propio control de volumen.' },
      { term: 'Pre-construction bracket', term_es: 'Soporte de preconstrucción', def: 'Frame nailed between joists or studs at rough-in that marks and later holds an in-ceiling or in-wall speaker.', def_es: 'Marco clavado entre viguetas o montantes en la obra negra que marca y luego sostiene una bocina empotrada en techo o muro.' },
      { term: 'Backing (blocking)', term_es: 'Refuerzo de madera (bloqueo)', def: 'Solid wood added between studs before drywall so a TV mount, projector or heavy speaker has structure to bolt into.', def_es: 'Madera sólida agregada entre montantes antes del tablaroca para que el soporte de TV, proyector o bocina pesada tenga estructura donde atornillarse.' },
      { term: 'Control processor', term_es: 'Procesador de control', def: 'The automation "brain" in the rack that runs the keypads, touch panels and app and talks to every device.', def_es: 'El "cerebro" de automatización en el rack que maneja teclados, pantallas táctiles y la app y se comunica con cada equipo.' },
      { term: 'DSP', term_es: 'DSP (procesador digital de señal)', def: 'Audio processor that mixes, equalizes and sets levels for microphones and speakers.', def_es: 'Procesador de audio que mezcla, ecualiza y ajusta niveles de micrófonos y bocinas.' },
      { term: 'Wire run list', term_es: 'Lista de cableado', def: 'Spreadsheet of every cable: label, type, from, to — turned over with the as-builts.', def_es: 'Hoja de cálculo de cada cable: etiqueta, tipo, origen y destino — se entrega con los planos finales.' },
    ],
  },
  est_bucket: 'electrical',
  recipes: [
    {
      id: 'av_prewire_rough_in',
      example_title: 'Audio-visual / home automation prewire',
      when: { title_re: 'audio|\\bAV\\b|a/v|home theater|theatre|automation|smart home|distributed audio|conference room|speakers?\\b|prewire|pre-wire' },
      steps: [
        {
          title: 'Confirm the AV design, rack elevation and wire run list',
          instruction: 'Walk the house or space with the AV drawings: mark every TV, projector, screen, speaker, keypad, touch panel and the equipment rack location. Confirm the rack elevation, the power and cooling the rack needs, and that each display location has a data or HDBaseT drop on the low-voltage schedule. Flag any conflict with framing, ducts or lights before you start.',
          detail: 'Hand the electrician the list of dedicated circuits the rack and displays need. Data drops and the media panel are the low-voltage scope; AV adds the speaker, video and control runs.',
          tools: ['tape measure', 'marker or crayon', 'AV drawings and rack elevation', 'stud finder'],
          materials: ['wire run list', 'location labels'],
          safety_ids: ['ladder', 'fall_edge'],
          qa_ids: ['design_confirmed'],
        },
        {
          title: 'Add backing and set speaker and box brackets',
          instruction: 'Before insulation and drywall, add solid wood backing between studs at every TV mount, projector and heavy speaker location, sized for the mount and the display it carries. Nail pre-construction brackets for each in-ceiling and in-wall speaker, keeping them clear of joists, ducts, sprinklers and lights. Set recessed boxes behind each TV and at every keypad and touch panel.',
          detail: 'Photograph each backing location with a tape in the shot — it disappears behind drywall and the trim crew needs it.',
          tools: ['circular saw or miter saw', 'framing hammer or nailer', 'drill/driver', 'level'],
          materials: ['2x lumber backing', 'pre-construction speaker brackets', 'recessed TV/media boxes', 'keypad / touch-panel back boxes'],
          safety_ids: ['ladder', 'power_tool', 'attic_heat', 'eye_cut'],
          qa_ids: ['backing_installed', 'speaker_fire_rated'],
          code_refs: [{ section: '640.25', note: 'Speakers in fire-rated ceilings or walls must be listed for it or set in an enclosure that keeps the rating' }],
        },
        {
          title: 'Pull speaker, video and control cable to the rack',
          instruction: 'Pull every speaker, HDBaseT/video, control and keypad cable home-run to the rack location, unspliced. Use cable rated for the space (plenum above air-handling ceilings). Keep speaker, microphone/line and control runs grouped by signal level and away from power wiring; never share a box or bored hole with power conductors. Label both ends with the wire run list ID as you pull.',
          detail: 'Leave a service loop at the rack and enough slack at each speaker bracket and display box to reach the device. Above open ceilings, support cable from the structure on J-hooks — not on the grid.',
          tools: ['fish tape or glow rods', 'drill with auger bits', 'cable caddy', 'label maker'],
          materials: ['speaker cable (14–16 AWG, CL2/CL3 rated)', 'Cat6 / shielded Cat6 for HDBaseT and control', 'J-hooks', 'grommets and nail plates'],
          safety_ids: ['ladder', 'attic_heat', 'electrical_contact', 'aerial_lift'],
          qa_ids: ['unspliced_labeled', 'signal_separation', 'separation_power'],
          code_refs: [
            { section: '640.6', note: 'Audio cable installed neatly and supported so normal building use does not damage it' },
            { section: '640.9', note: 'Wiring methods for audio equipment wiring' },
            { section: '725', note: 'Power-limited (Class 2/3) speaker and control circuits' },
          ],
        },
        {
          title: 'Protect, firestop and call rough-in',
          instruction: 'Nail plates where cable runs close to the stud face. Seal every penetration of a fire-rated wall or ceiling with a listed firestop system. Check every location against the drawings — backing in, brackets set, every cable labeled — and photograph the walls before the electrical rough-in inspection and before insulation or drywall.',
          tools: ['caulk gun', 'hammer', 'camera / phone', 'flashlight'],
          materials: ['nail plates', 'listed firestop sealant or putty'],
          safety_ids: ['ladder', 'eye_cut'],
          qa_ids: ['backing_installed', 'unspliced_labeled', 'firestop_rated'],
          gating_inspection_type: 'rough_in',
          code_refs: [
            { section: '300.21', note: 'Firestop openings through fire-rated walls and floors' },
            { section: '800.133', note: 'Keep communications cable separated from power conductors' },
          ],
        },
      ],
    },
    {
      id: 'av_trim_commissioning',
      example_title: 'AV trim-out, rack build, programming & commissioning',
      when: { title_re: 'trim|rack|install (tv|display|speaker|projector)|mount|program|commission|calibrat|training|turn ?over|final' },
      priority: 10,
      steps: [
        {
          title: 'Build, ventilate and bond the equipment rack',
          instruction: 'Build the rack to the elevation: equipment fastened in place, blanks in empty spaces, fans or vents so the gear runs cool. Bond the rack with a grounding stud or bar and a jumper to the power strip ground, and confirm the receptacle ground is good before plugging anything in. Land, dress and label every cable at the back of the rack with a service loop.',
          detail: 'Lift heavy amplifiers and rack frames with two people. Set the rack level on its feet and anchor or strap it so it cannot tip.',
          tools: ['drill/driver', 'level', 'cable management tools', 'outlet / ground tester'],
          materials: ['equipment rack, shelves and blanks', 'power conditioner / PDU', 'rack fans', 'bonding jumper and lug', 'hook-and-loop ties'],
          safety_ids: ['heavy_lift', 'electrical_contact', 'lockout', 'cord_shock'],
          qa_ids: ['rack_bonded', 'rack_thermal', 'unspliced_labeled'],
          code_refs: [{ section: '640.21', note: 'Flexible cords allowed for permanently installed racks under the listed conditions' }],
        },
        {
          title: 'Mount displays and projectors into structure',
          instruction: 'Find the backing or stud centers and follow the mount maker\'s instructions: pilot holes to the stated depth, lag bolts into the center of the wood (or the listed masonry anchor), every bolt tight, mount level. Never fasten into drywall alone and confirm the wall and mount are rated for the display. Hang the display with two people and check the bracket locks are engaged before you let go.',
          tools: ['stud finder', 'drill with pilot bits', 'socket wrench', 'level', 'stepladder'],
          materials: ['display mount and lag bolts or listed anchors', 'projector mount and structure adapter', 'short HDMI / HDBaseT receivers'],
          safety_ids: ['heavy_lift', 'ladder', 'power_tool'],
          qa_ids: ['mount_into_structure', 'support_factor'],
        },
        {
          title: 'Trim speakers, keypads and touch panels',
          instruction: 'Cut in and install speakers in their brackets with the maker\'s clamps, connecting each with correct polarity. Install keypads, touch panels and wall plates level and plumb. Where a speaker sits in a fire-rated ceiling, install the listed back can or fire cover before it closes up.',
          tools: ['drywall saw or speaker cut-out tool', 'screwdriver', 'wire stripper', 'stepladder'],
          materials: ['in-ceiling / in-wall speakers', 'fire-rated back cans where required', 'keypads, touch panels, wall plates'],
          safety_ids: ['ladder', 'eye_cut', 'silica'],
          qa_ids: ['speaker_fire_rated', 'av_only_marking'],
          code_refs: [{ section: '640.25', note: 'Listed speaker or enclosure that keeps the fire rating' }],
        },
        {
          title: 'Program the control system and set audio levels',
          instruction: 'Load the control processor, DSP and display settings. Program every keypad, touch panel and app page to the approved scope: power on/off, source select, volume and mute, lights, shades and climate scenes. Set speaker levels and equalization room by room, align each display, and save a default preset.',
          detail: 'Keep testing loud signals short and wear hearing protection when you set levels in a small room near the speakers.',
          tools: ['laptop with programming software', 'sound level meter', 'test signal source'],
          materials: ['control licenses / app accounts as specified'],
          safety_ids: ['noise'],
          qa_ids: ['audio_levels_set', 'functional_test'],
        },
        {
          title: 'Commission, train the owner and hand over',
          instruction: 'Test every source to every display and every zone, button by button on each keypad and touch panel. Fix what fails and re-test. Show the owner how to use the system, then turn over the as-built drawings, wire run list, equipment list with serial numbers and IP addresses, program files, and a short step-by-step user guide before final.',
          tools: ['test sources', 'laptop', 'label maker'],
          materials: ['as-built drawings', 'step-by-step user guide', 'equipment list'],
          safety_ids: ['ladder'],
          qa_ids: ['functional_test', 'closeout_docs'],
          gating_inspection_type: 'final',
          code_refs: [
            { section: '640.5', note: 'Wiring above ceilings must not block access through removable panels' },
            { section: '640.10', note: 'Audio equipment near pools, spas and fountains — power placement and GFCI' },
          ],
        },
      ],
    },
    {
      id: 'conference_room_av',
      example_title: 'Conference room AV system',
      when: { title_re: 'conference|huddle|boardroom|board room|training room|classroom|meeting room' },
      priority: 5,
      steps: [
        {
          title: 'Verify the room design and site conditions',
          instruction: 'Walk the room with the AV drawings: display size and height, camera and microphone positions, table boxes, ceiling speaker layout and the rack or credenza location. Check them against the ceiling grid, lights, diffusers and sprinklers and report conflicts before rough-in.',
          tools: ['tape measure', 'AV drawings', 'laser level'],
          materials: ['equipment list', 'wire run list'],
          safety_ids: ['ladder', 'aerial_lift'],
          qa_ids: ['design_confirmed'],
        },
        {
          title: 'Rough in backing, floor/table boxes and cable',
          instruction: 'Add backing for the display and camera mounts, set wall and floor or table boxes, and pull microphone, line, speaker, HDBaseT and control cable home-run to the rack, grouped by signal level. Support cable above the ceiling on J-hooks or tray from the structure. Firestop rated penetrations and call rough-in.',
          tools: ['drill/driver', 'fish tape', 'rotary hammer for floor boxes', 'scissor lift where ceilings are high'],
          materials: ['2x backing or wall-mount plate', 'floor / table boxes', 'shielded audio and Cat6 cable', 'J-hooks', 'listed firestop'],
          safety_ids: ['ladder', 'aerial_lift', 'silica', 'electrical_contact'],
          qa_ids: ['backing_installed', 'signal_separation', 'unspliced_labeled', 'firestop_rated'],
          gating_inspection_type: 'rough_in',
          code_refs: [{ section: '640.6', note: 'Audio cable supported and protected from damage' }, { section: '300.21', note: 'Firestop fire-rated penetrations' }],
        },
        {
          title: 'Install, program and commission the room',
          instruction: 'Mount the display and camera into structure, trim ceiling speakers and microphones, build the rack or credenza, then program the room control and DSP. Test every input, the video call path and microphone coverage, and mark every AV-over-network jack "AV Only". Train the room\'s users and turn over the user guide before final.',
          tools: ['laptop with programming software', 'sound level meter', 'level', 'socket wrench'],
          materials: ['display and mount', 'camera, microphones, ceiling speakers', 'control processor and touch panel', 'DSP'],
          safety_ids: ['heavy_lift', 'ladder', 'noise', 'lockout'],
          qa_ids: ['mount_into_structure', 'rack_bonded', 'av_only_marking', 'functional_test', 'closeout_docs'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    rough_in: [
      { section: '640.6', note: 'Audio cable installed neatly and supported against damage', prov: nec },
      { section: '640.9', note: 'Wiring methods for audio equipment wiring', prov: nec },
      { section: '640.25', note: 'Speakers in fire-rated assemblies listed or enclosed to keep the rating', prov: nec },
      { section: '725', note: 'Power-limited (Class 2/3) speaker, keypad and control circuits', prov: nec },
      { section: '800.133', note: 'Communications cable separated from power conductors', prov: nec },
      { section: '300.21', note: 'Firestop penetrations of fire-rated assemblies', prov: nec },
    ],
    final: [
      { section: '640.5', note: 'Ceiling access panels kept clear of accumulated wiring', prov: nec },
      { section: '640.10', note: 'Audio equipment near bodies of water — power placement and GFCI', prov: nec },
      { section: '640.21', note: 'Flexible cords for permanently installed equipment racks', prov: nec },
    ],
  },
  equipment: [
    { when: { title_re: 'conference|audio|\\bAV\\b|speaker|projector', building_types: ['commercial', 'industrial'] }, type: 'scissor_lift', reason: 'Hang J-hooks, pull cable and set projectors and ceiling speakers above high ceilings', optional: true },
  ],
  hazards: [
    { id: 'ladder', hazard: 'Fall from a stepladder while setting ceiling speakers, projectors or displays', hazard_es: PENDING_ES, controls: ['Never stand on the top or top step of a stepladder', 'Use a nonconductive (fiberglass) ladder near electrical work', 'Fully open and lock the spreaders on firm, level footing'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'fall_edge', hazard: 'Fall from open floor edges, stair openings or balconies while laying out or pulling cable', hazard_es: PENDING_ES, controls: ['Guardrails, covers or personal fall arrest where the drop is 6 ft or more', 'Keep floor-opening covers in place after pulling through'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness when required'], prov: osha('m') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from a lift basket in high-ceiling rooms', hazard_es: PENDING_ES, controls: ['Wear a harness and lanyard tied to the boom or basket', 'Stand on the basket floor — never on the rails'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'heavy_lift', hazard: 'Back injury, or a display, projector or rack falling, when lifting, hanging or moving heavy AV equipment', hazard_es: PENDING_ES, controls: ['Lift and hang large displays, amplifiers and racks with two or more people', 'Fasten mounts into backing, studs or listed anchors — never drywall alone', 'Check the mount locks are engaged before letting go; anchor racks so they cannot tip'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: { src: ['ecfr-1926-c', 'av_automation-sanus-vlt5'], confidence: 'verified', last_verified: D } },
    { id: 'electrical_contact', hazard: 'Shock from live power in shared walls, boxes and rack receptacles, or drilling into hidden circuits', hazard_es: PENDING_ES, controls: ['Keep out of energized power boxes; have the electrician de-energize and verify', 'Scan walls before drilling or cutting in remodels', 'Never route low-voltage cable through power boxes'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'lockout', hazard: 'A circuit being worked on is switched back on by someone else', hazard_es: PENDING_ES, controls: ['Tag (and lock) the breaker feeding the rack or display location before working on it', 'Only the person who placed the tag removes it'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'cord_shock', hazard: 'Shock from damaged extension cords and tools on temporary power', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Inspect cords daily and remove damaged ones'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'noise', hazard: 'Hearing damage from loud test signals while setting speaker levels', hazard_es: PENDING_ES, controls: ['Keep loud test signals short and at the lowest level that works', 'Wear ear protection when setting levels close to speakers or subwoofers'], controls_es: PENDING_ES, osha_ref: '1926.101(a)', severity: 2, ppe: ['earplugs or earmuffs'], prov: osha('e') },
    { id: 'attic_heat', hazard: 'Heat illness and missteps in hot attics while setting speaker brackets and pulling cable', hazard_es: PENDING_ES, controls: ['Work attics early in the day; take water and set short work periods', 'Walk only on joists or boards — never on the ceiling drywall'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: osha('c') },
    { id: 'silica', hazard: 'Silica dust from coring floor boxes or drilling masonry for mounts and pathways', hazard_es: PENDING_ES, controls: ['Use a shroud with a HEPA vacuum or water to control dust', 'No dry sweeping or compressed air on silica dust'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 3, ppe: ['respirator when required'], prov: osha('z') },
    { id: 'power_tool', hazard: 'Kickback and cuts from drills, augers and saws used for backing and mounts', hazard_es: PENDING_ES, controls: ['Use the side handle on large augers and hole saws', 'Keep guards in place and brace for bind-up'], controls_es: PENDING_ES, osha_ref: '1926.300(b)', severity: 2, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'eye_cut', hazard: 'Eye injuries and cuts from drywall dust when cutting speaker openings and from metal edges', hazard_es: PENDING_ES, controls: ['Wear safety glasses when cutting or drilling overhead', 'Wear cut-resistant gloves around metal studs and sheet metal'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses', 'cut-resistant gloves'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'design_confirmed', item: 'Every device location, rack elevation and wire run list verified in the field and conflicts reported before rough-in.', item_es: tr('Cada ubicación de equipo, elevación del rack y lista de cableado verificadas en sitio y conflictos reportados antes de la obra negra.'), prov: ufgs },
    { id: 'backing_installed', item: 'Solid backing at every TV, projector and heavy-speaker mount location before drywall, photographed with a tape measure for the trim crew.', item_es: PENDING_ES, safety: true, prov: { src: ['av_automation-ufgs-27-41-00', 'av_automation-sanus-vlt5'], confidence: 'derived', last_verified: D, note: 'Backing is how the mount reaches structure; UFGS 3.3 requires supports adequate for the load.' } },
    { id: 'mount_into_structure', item: 'Display mounts lagged into stud centers, backing or listed masonry anchors — never drywall alone — every bolt tight, mount level, bracket locks engaged, and the wall and mount rated for the display per the mount maker.', item_es: PENDING_ES, safety: true, prov: mount },
    { id: 'support_factor', item: 'Projectors, ceiling speakers and other overhead gear supported from structure with fasteners good for at least five times their load.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'speaker_fire_rated', item: 'Speakers in fire-rated ceilings or walls are listed for it or set in a listed back can / enclosure that keeps the rating.', item_es: PENDING_ES, safety: true, prov: nec },
    { id: 'separation_power', item: 'Speaker, video and control cable never shares a box, raceway or bored hole with power conductors.', item_es: PENDING_ES, safety: true, prov: { src: ['nfpa-fa', 'av_automation-ufgs-27-41-00'], confidence: 'verified', last_verified: D } },
    { id: 'signal_separation', item: 'Microphone, line, speaker and control cables routed in separate groups by signal level to avoid hum and crosstalk.', item_es: tr('Cables de micrófono, línea, bocina y control tendidos en grupos separados por nivel de señal para evitar zumbido e interferencia.'), prov: ufgs },
    { id: 'unspliced_labeled', item: 'Runs unspliced, labeled at both ends to match the wire run list, with a service loop at the rack.', item_es: tr('Tendidos sin empalmes, etiquetados en ambos extremos según la lista de cableado, con bucle de servicio en el rack.'), prov: ufgs },
    { id: 'av_only_marking', item: 'Every AV-over-network jack, patch port and cord is a distinct color or marked "AV Only".', item_es: tr('Cada conector, puerto de parcheo y cable de AV por red es de color distinto o está marcado "Solo AV".'), prov: ufgs },
    { id: 'firestop_rated', item: 'Every penetration of a fire-rated wall, floor or ceiling sealed with a listed firestop system.', item_es: PENDING_ES, safety: true, prov: { src: ['nfpa-fa', 'av_automation-ufgs-27-41-00'], confidence: 'verified', last_verified: D } },
    { id: 'rack_bonded', item: 'Rack has a grounding stud or bar bonded to the power strip ground, and the receptacle ground verified before equipment is connected.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'rack_thermal', item: 'Rack ventilated (fans, vents, blanks) so equipment runs at or below about 85°F in steady operation.', item_es: tr('Rack ventilado (ventiladores, rejillas, tapas) para que el equipo opere a unos 85°F o menos de forma continua.'), prov: ufgs },
    { id: 'audio_levels_set', item: 'Speaker levels and EQ set room by room, program and microphone levels separate, default preset saved.', item_es: tr('Niveles y ecualización de bocinas ajustados cuarto por cuarto, niveles de programa y micrófono separados, preajuste por defecto guardado.'), prov: ufgs },
    { id: 'functional_test', item: 'Every source tested to every display and zone, every keypad and touch-panel button tested, displays aligned; failures fixed and re-tested.', item_es: tr('Cada fuente probada en cada pantalla y zona, cada botón de teclado y pantalla táctil probado, pantallas alineadas; fallas corregidas y vueltas a probar.'), prov: ufgs },
    { id: 'closeout_docs', item: 'Owner trained; as-built drawings, wire run list, equipment list with serials and IP addresses, program files and a step-by-step user guide turned over.', item_es: tr('Dueño capacitado; se entregan planos finales, lista de cableado, lista de equipos con números de serie y direcciones IP, archivos de programación y guía de uso paso a paso.'), prov: ufgs },
  ],
  inspection_checklists: {
    rough_in: [
      { item: 'Backing in place at every display, projector and heavy-speaker mount', item_es: PENDING_ES },
      { item: 'Speaker brackets in fire-rated ceilings use listed enclosures or back cans', item_es: PENDING_ES, ref: '640.25' },
      { item: 'Speaker and control cable kept out of power boxes and away from power conductors', item_es: PENDING_ES, ref: '800.133' },
      { item: 'Cable supported from structure and protected (nail plates near stud faces)', item_es: PENDING_ES, ref: '640.6' },
      { item: 'Rated penetrations sealed with a listed firestop system', item_es: PENDING_ES, ref: '300.21' },
    ],
    final: [
      { item: 'Displays, projectors and speakers secured into structure; mount locks engaged', item_es: PENDING_ES },
      { item: 'Rack bonded and fed from its intended receptacle; cords used as allowed for racks', item_es: PENDING_ES, ref: '640.21' },
      { item: 'Ceiling access panels not blocked by AV wiring', item_es: PENDING_ES, ref: '640.5' },
      { item: 'Outdoor / pool-area audio power placed and GFCI-protected as required', item_es: PENDING_ES, ref: '640.10' },
      { item: 'System tested, owner trained, as-builts and user guide on hand', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'E-AV-SPK-PAIR', name: 'In-ceiling / in-wall speaker pair (brackets, ~2×75 ft cable, trim)', name_es: 'Par de bocinas empotradas en techo o muro (soportes, ~2×75 pies de cable, acabado)', unit: 'EA', csi: '27 41 16',
      description: 'Mid-grade pair with pre-construction brackets, speaker cable home-run to the rack, cut-in and trim. Amplifier channel and keypad are separate.',
      material_cost_cents: { v: 32000, prov: est('mid-grade 6.5–8 in. in-ceiling pair ≈$250 + 2 brackets ≈$30 + ≈150 ft 16/2–16/4 CL3 ≈$40, national baseline 2026') }, labor_hours_per_unit: { v: 3, prov: est('brackets + pull at rough, cut-in + connect + trim') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 3, prov: est('cable cut-offs') } },
    { code: 'E-AV-TV-MOUNT', name: 'TV wall mount with backing and recessed media box (display not included)', name_es: 'Soporte de TV en muro con refuerzo y caja de medios empotrada (sin pantalla)', unit: 'EA', csi: '27 41 16',
      description: 'Backing at rough, recessed power/low-voltage media box behind the TV, tilt or articulating mount lagged into structure, hang and dress cables. The power receptacle in the box is the electrician\'s scope.',
      material_cost_cents: { v: 21000, prov: est('tilt/articulating mount ≈$130 + recessed media box ≈$45 + backing lumber + short HDMI ≈$35, national baseline 2026') }, labor_hours_per_unit: { v: 2.5, prov: est('backing at rough + box + mount + hang with two people') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 2, prov: est('backing lumber offcuts') } },
    { code: 'E-AV-RACK', name: 'AV equipment rack build (rack, power conditioner, fans, shelves, bonding — gear excluded)', name_es: 'Armado de rack de equipo AV (rack, acondicionador de energía, ventiladores, repisas, unión a tierra — sin equipos)', unit: 'EA', csi: '27 41 16',
      description: 'Residential 12–24U rack or cabinet built to the elevation: power conditioner/PDU, fans, shelves, blanks, cable management, bonding jumper. Amplifiers, sources and processors priced separately.',
      material_cost_cents: { v: 110000, prov: est('12–24U rack ≈$500 + power conditioner ≈$350 + fans/shelves/blanks/cable management ≈$250, national baseline 2026') }, labor_hours_per_unit: { v: 8, prov: est('assemble, mount gear, land/dress/label cables, bond, power-up check') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('ordered as a kit') } },
    { code: 'E-AV-PROGRAM', name: 'Control system programming, commissioning and owner training (per system)', name_es: 'Programación del sistema de control, puesta en marcha y capacitación al dueño (por sistema)', unit: 'EA', csi: '27 41 16',
      material_cost_cents: { v: 0, prov: est('licenses vary by platform — add as a line when specified') }, labor_hours_per_unit: { v: 16, prov: est('residential automation system: keypads/touch panels/app pages, audio levels, button-by-button test, training, as-builts') },
      equipment_cost_cents: { v: 0, prov: est('laptop + meter, no rental') }, waste_pct: { v: 0, prov: est('labor only') } },
    { code: 'E-AV-CONF-ROOM', name: 'Conference room AV allowance (display, video-bar/camera, mics, ceiling speakers, control, install)', name_es: 'Partida de AV para sala de juntas (pantalla, barra de video/cámara, micrófonos, bocinas de techo, control, instalación)', unit: 'EA', csi: '27 41 16',
      description: 'Mid-size room allowance for budgeting; replace with the AV design quote once drawings exist.',
      material_cost_cents: { v: 1400000, prov: est('≈75 in. commercial display ≈$2.5k + video bar/camera ≈$3k + ceiling mic/speakers ≈$3k + control/DSP/switcher ≈$4k + mounts/cable ≈$1.5k, national baseline 2026') }, labor_hours_per_unit: { v: 32, prov: est('rough-in, mount, trim, rack/credenza, program, commission, train') },
      equipment_cost_cents: { v: 0, prov: est('lift priced separately where needed') }, waste_pct: { v: 2, prov: est('cable cut-offs') } },
  ],
  quantity_rules: [
    { code: 'E-AV-SPK-PAIR', assumption: '≈1 speaker pair per 3 rooms for distributed audio — replace with the AV design', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'rooms', mul: 0.33, round: 'ceil' } },
    { code: 'E-AV-TV-MOUNT', assumption: '≈1 wall-mounted TV per 4 rooms — confirm with the owner', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'rooms', mul: 0.25, round: 'ceil' } },
    { code: 'E-AV-RACK', assumption: 'One AV equipment rack per single-family home with an AV/automation system', when: { building_types: ['residential_sf'] }, qty: { basis: 'const' } },
    { code: 'E-AV-PROGRAM', assumption: 'One control system to program, commission and train per single-family home', when: { building_types: ['residential_sf'] }, qty: { basis: 'const' } },
    { code: 'E-AV-CONF-ROOM', assumption: 'One conference room AV allowance — set the count from the room schedule', when: { building_types: ['commercial'] }, qty: { basis: 'const' } },
  ],
  dependency_hints: [
    { after_trades: ['framing'], before_phase: 'insulation', note: 'AV prewire and backing go in with electrical and low-voltage rough-in, after framing and before insulation and drywall.' },
    { after_trades: ['painting', 'low_voltage'], note: 'AV trim, rack build and programming follow paint and the low-voltage terminations.' },
  ],
});
