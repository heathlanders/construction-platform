// Trade Knowledge Pack — trenchless_sewer (Sewer & Drain — Trenchless / Lining / Jetting).
// Wave 13 — NEW-TRADE pattern (no hand recipe, no template tasks). Dossier: docs/trade-packs/dossiers/trenchless_sewer.md.
// Scope: rehab or replacement of EXISTING building sewers / laterals and building drains without open-cut
// trenching — sewer camera (CCTV) survey, hydro-jet / root cutting, CIPP and fold-and-form relining, and
// static or pneumatic pipe bursting with HDPE. New open-cut laterals are site_utilities (P-SU-*), not this pack.
// Code: 2021 IPC 716 (pipe bursting) + 717 (relining) and the mirrored IRC P3010 / P3011 — sections verified from
// ICC CodeNotes (reference only, paraphrased). CIPP liner standards (ASTM F1216 / F1743) are named, never quoted.
// Safety: 29 CFR 1926 Subparts D, E, H, I, P, AA; NIOSH HHE 2018-0009-3334 (CIPP styrene).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const IRC = 'IRC';
const c716 = { src: ['icc-pa', 'trenchless_sewer-icc-codenotes-716'], confidence: 'verified' as const, last_verified: D };
const c717 = { src: ['icc-pa', 'trenchless_sewer-icc-codenotes-717'], confidence: 'verified' as const, last_verified: D };
const ipc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const niosh = { src: ['trenchless_sewer-niosh-hhe-2018-0009', 'ecfr-1926-d'], confidence: 'verified' as const, last_verified: D };
const epa = { src: ['trenchless_sewer-epa-832f99032'], confidence: 'derived' as const, last_verified: D };
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });

// ── Shared steps ────────────────────────────────────────────────────────────────────────────
const surveyStep = {
  title: 'Locate, clean and record the pre-install video',
  instruction: 'Find the access points (cleanouts, roof vent or a small pit) and call 811 before any digging. Descale, cut roots and jet the line, flush it with water, then run a recorded camera survey from end to end. Say the job address on the video, note every cleanout, fitting and connection, the approximate depth, and the footage at least every 25 ft.',
  detail: 'The code official reviews this video before the permit is issued. If it shows back-grade or flat spots, pipe wall that is gone, or a full separation, that section has to be dug up and repaired — it cannot be lined or burst.',
  tools: ['sewer jetter with root-cutting nozzle', 'recording push or crawler camera with locator sonde', 'locator / receiver'],
  materials: ['USB or cloud storage for the survey video'],
  safety_ids: ['jetter_injection', 'biological', 'noise'],
  qa_ids: ['cleaned_before_video', 'pre_video_survey', 'defects_ruled_out', 'size_limits'],
  code_refs: [
    { section: '717.3', note: 'Pipe descaled, cleaned and flushed, then recorded camera survey before relining' },
    { section: '717.3.1', note: 'Survey video shows the address, cleanouts, fittings, depth and footage marks' },
    { section: '717.5', note: 'Back-grade, missing pipe wall or full separations get dug and repaired, not lined' },
  ],
};

const burstSurveyStep = {
  ...surveyStep,
  detail: 'The code official reviews this video. Bursting is limited to building sewers 6 in. and smaller, replaced at the same nominal size — larger lines need another method.',
  code_refs: [
    { section: '716.3', note: 'Recorded camera survey with cleanout positions and connection depths before bursting' },
    { section: '716.2', note: 'Pipe bursting limited to 6 in. and smaller, same nominal size' },
  ],
};

const bypassStep = {
  title: 'Stop or bypass the flow and measure the run',
  instruction: 'Tell the occupants not to run water or flush until the work is done, or set up bypass pumping around the section. Measure the exact length from access to access with the camera footage counter and confirm the pipe size at both ends before the liner or new pipe is ordered and cut.',
  tools: ['bypass pump and hoses (where flow cannot be stopped)', 'camera footage counter', 'tape measure'],
  materials: ['test / flow-through plugs', 'occupant notice'],
  safety_ids: ['biological', 'sewer_atmosphere'],
  qa_ids: ['flow_controlled'],
};

// ── Recipes ─────────────────────────────────────────────────────────────────────────────────
const cippSteps = [
  surveyStep,
  bypassStep,
  {
    title: 'Wet out the liner and install it',
    instruction: 'Mix only the resin the liner length needs and wet out the tube evenly per the manufacturer, keeping it at the stated temperature. Invert it with air or water, or pull it in and inflate a bladder, from the access point to the far end with no twists. Keep resin off skin and clean up spills and excess right away.',
    detail: 'CIPP liners are made to their own product standards (ASTM F1216 inverted, F1743 pulled in place); fold-and-form liners to ASTM F1504 / F1871. Confirm with the code official which system is approved for the job.',
    tools: ['wet-out table or roller', 'inversion drum or launcher', 'air compressor with pressure gauge', 'calibration bladder'],
    materials: ['liner tube sized to the host pipe', 'resin and hardener (amount per the liner length)', 'chemical-resistant gloves'],
    safety_ids: ['styrene_vapor', 'air_hose_whip', 'confined_space', 'resin_skin'],
    qa_ids: ['material_data_report', 'ventilation_styrene'],
    code_refs: [
      { section: '717.6', note: 'Reline material made to its product standard and third-party certified' },
      { section: '717.7', note: 'Installed per the maker’s instructions, its standards and the plumbing code' },
    ],
  },
  {
    title: 'Cure the liner',
    instruction: 'Cure with hot water, steam, ambient or UV light exactly as the liner system requires, holding pressure for the full time. Log start and end times, temperatures or UV speed and pressure. Ventilate the access points and any building openings near them — styrene odor can drift into the house through floor drains and vents.',
    tools: ['boiler / steam unit or UV light train', 'thermocouples or temperature log', 'blower for the access point'],
    materials: ['cure log sheet'],
    safety_ids: ['hot_cure_burns', 'uv_light', 'styrene_vapor', 'noise'],
    qa_ids: ['material_data_report', 'ventilation_styrene'],
    code_refs: [{ section: '717.7.1', note: 'Installer records the material data report for the code official' }],
  },
  {
    title: 'Open the connections and cut the ends',
    instruction: 'Cool down and release pressure before cutting. Reopen every live branch or connection with the robotic or hand cutter, leaving no lip or coupon in the flow. Trim the liner ends flush at the access points and seal the ends per the system. Grind with the access ventilated.',
    tools: ['robotic or flexible-shaft reinstatement cutter', 'grinder', 'camera'],
    materials: ['end seals / hydrophilic bands per system'],
    safety_ids: ['styrene_vapor', 'confined_space', 'noise'],
    qa_ids: ['connections_reopened'],
  },
  {
    title: 'Flush, flow-test and record the final video',
    instruction: 'Flush the relined pipe and run water through it, then record a full post-install camera survey. Look for wrinkles or fins that catch flow, lifts, open seams and any connection left blocked. Fix defects, then give the code official the post video, the material data report and the written certification.',
    tools: ['recording camera', 'hose'],
    materials: ['installer certification form'],
    safety_ids: ['biological'],
    qa_ids: ['post_video_flow', 'certification_delivered'],
    gating_inspection_type: 'final',
    code_refs: [
      { section: '717.8', note: 'Recorded video after flushing and a water flow test, reviewed for defects' },
      { section: '717.9', note: 'Written certification from the permit holder to the code official' },
      { section: 'P3011.8', note: 'Same post-install video rule for one- and two-family dwellings', code_type: IRC },
    ],
  },
];

const burstSteps = [
  burstSurveyStep,
  {
    title: 'Dig and protect the launch and receiving pits',
    instruction: 'Dig the launch pit at the house end or the street end per plan and a receiving pit at the other, with spoil kept at least 2 ft back. Shore, box or slope any pit 5 ft or deeper before anyone enters, and give a ladder in pits 4 ft or deeper. Expose the old pipe cleanly at both ends.',
    tools: ['mini-excavator', 'trench box or shoring', 'ladder', 'hand shovel'],
    materials: ['plywood / pit cover', 'barricades'],
    safety_ids: ['cave_in', 'sewer_atmosphere'],
    qa_ids: ['protective_system'],
  },
  {
    title: 'Fuse the new HDPE and set the bursting rig',
    instruction: 'Butt-fuse the new HDPE pipe to full length per the fusion procedure and let each joint cool. Set the winch or rod puller in the receiving pit, braced against the pit wall, and run the cable or rods through the old pipe to the bursting head in the launch pit.',
    detail: 'Replacement pipe is HDPE SDR 17 (ASTM F714) with HDPE fittings, the same nominal size as the old pipe, and bursting is limited to 6 in. and smaller.',
    tools: ['butt-fusion machine', 'static or pneumatic bursting rig', 'pipe rollers'],
    materials: ['HDPE SDR 17 pipe', 'HDPE fittings', 'bursting head / expander'],
    safety_ids: ['winch_cable', 'hot_cure_burns'],
    qa_ids: ['hdpe_pipe'],
    code_refs: [{ section: '716.4', note: 'Replacement pipe HDPE SDR 17 with HDPE fittings' }],
  },
  {
    title: 'Burst the old pipe and pull the new line',
    instruction: 'Pull steadily, watching tension, and keep everyone out of the cable line and the receiving pit while it is under load. Stop if the head stalls — do not keep adding pull. Leave enough extra pipe at each end to relax back before tie-in.',
    tools: ['bursting rig', 'radios'],
    materials: [],
    safety_ids: ['winch_cable', 'cave_in', 'noise'],
    qa_ids: [],
  },
  {
    title: 'Tie in, add cleanouts and video before testing',
    instruction: 'Connect each end with approved transition couplings and add a cleanout where the old line had none. Run a recorded camera survey of the new pipe and get the code official’s OK on it, then pressure-test the line as the code requires.',
    tools: ['recording camera', 'test plugs and gauge'],
    materials: ['transition couplings', 'cleanout fitting and riser'],
    safety_ids: ['biological', 'cave_in'],
    qa_ids: ['cleanouts_added', 'burst_video_then_test'],
    gating_inspection_type: 'underground',
    code_refs: [
      { section: '716.4', note: 'Cleanouts added where missing; video approved before pressure test' },
      { section: '312.6', note: 'Gravity sewer test before the line goes into service' },
      { section: 'P2503.4', note: 'Building sewer test for one- and two-family dwellings', code_type: IRC },
    ],
  },
  {
    title: 'Backfill the pits and hand over the records',
    instruction: 'Bed and backfill the pits in lifts, compacting around the new pipe without hitting it. Restore lawn, sidewalk or pavement over the pits. Give the owner the before and after videos and the test result.',
    tools: ['plate or rammer compactor', 'mini-excavator'],
    materials: ['bedding stone', 'granular backfill', 'restoration materials'],
    safety_ids: ['cave_in'],
    qa_ids: ['records_delivered'],
    gating_inspection_type: 'final',
  },
];

const cameraJetSteps = [
  {
    title: 'Set up at the cleanout and protect the house',
    instruction: 'Find the main cleanout or pull the toilet for access. Lay drop cloths, keep a wet vac ready, and tell the occupants not to run water. Check for gas or sewer odor before working in a pit or crawlspace.',
    tools: ['wet vac', 'drop cloths', 'gas monitor (pits and crawlspaces)'],
    materials: ['cleanout cap / gasket'],
    safety_ids: ['biological', 'sewer_atmosphere'],
    qa_ids: [],
  },
  {
    title: 'Jet and cut roots',
    instruction: 'Run the jetter hose in past the first fitting before going to full pressure, and never point the nozzle out of the pipe. Use the root-cutting or descaling head for roots and scale, and work the full length back to the main. Keep the foot pedal or dead-man in control at all times.',
    tools: ['sewer jetter', 'root-cutting / descaling nozzle', 'cable machine (for small lines)'],
    materials: [],
    safety_ids: ['jetter_injection', 'noise', 'biological'],
    qa_ids: ['cleaned_before_video'],
  },
  {
    title: 'Record the camera survey and report',
    instruction: 'Run the camera from the access to the main, saying the address, footage and every fitting, defect and connection. Locate and mark bad spots and the line depth on the surface. Give the owner the video and a written report with what you found and what is recommended.',
    tools: ['recording camera with sonde', 'locator', 'marking paint'],
    materials: ['inspection report form'],
    safety_ids: [],
    qa_ids: ['pre_video_survey', 'records_delivered'],
  },
];

export default definePack({
  key: 'trenchless_sewer',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Fixes or replaces existing building sewers and drains without digging a full trench: camera surveys, hydro-jetting and root cutting, cured-in-place (CIPP) or fold-and-form relining, and pipe bursting with new HDPE — with the before/after videos, test and records the code official needs.',
    summary_es: 'Repara o reemplaza drenajes y laterales existentes sin abrir una zanja completa: inspección con cámara, hidrolavado y corte de raíces, encamisado curado en sitio (CIPP) o de doblar y formar, y reventado de tubería con HDPE nuevo — con los videos de antes y después, la prueba y los registros que pide el inspector.',
    glossary: [
      { term: 'Host pipe', term_es: 'Tubo anfitrión', def: 'The old pipe that gets lined or burst.', def_es: 'El tubo viejo que se encamisa o se revienta.' },
      { term: 'CIPP (cured-in-place pipe)', term_es: 'CIPP (tubería curada en sitio)', def: 'A resin-soaked felt or glass tube put inside the old pipe and hardened there to form a new pipe.', def_es: 'Un tubo de fieltro o fibra de vidrio empapado de resina que se mete dentro del tubo viejo y se endurece ahí para formar un tubo nuevo.' },
      { term: 'Wet-out', term_es: 'Impregnado (wet-out)', def: 'Soaking the liner tube evenly with mixed resin before it goes in the pipe.', def_es: 'Empapar el tubo de encamisado de forma pareja con la resina mezclada antes de meterlo.' },
      { term: 'Inversion', term_es: 'Inversión', def: 'Installing a liner by turning it inside out into the pipe with air or water pressure.', def_es: 'Instalar el encamisado volteándolo al revés dentro del tubo con presión de aire o agua.' },
      { term: 'Reinstatement', term_es: 'Reapertura de conexiones', def: 'Cutting open the branch connections that the liner covered.', def_es: 'Abrir con cortador las conexiones de ramales que el encamisado tapó.' },
      { term: 'Pipe bursting', term_es: 'Reventado de tubería', def: 'Pulling a head through the old pipe that breaks it outward while dragging the new pipe in behind.', def_es: 'Jalar una cabeza por el tubo viejo que lo rompe hacia afuera mientras arrastra el tubo nuevo detrás.' },
      { term: 'Hydro-jetting', term_es: 'Hidrolavado', def: 'Cleaning a sewer with a high-pressure water hose and nozzle.', def_es: 'Limpiar un drenaje con una manguera y boquilla de agua a alta presión.' },
      { term: 'Bypass pumping', term_es: 'Bombeo de desvío', def: 'Pumping sewage around the section being worked on so it stays dry.', def_es: 'Bombear las aguas negras alrededor del tramo en trabajo para que quede seco.' },
      { term: 'Lateral', term_es: 'Lateral', def: 'The building sewer from the house to the public main.', def_es: 'El drenaje del edificio desde la casa hasta el colector público.' },
      { term: 'Sonde', term_es: 'Sonda emisora', def: 'Small transmitter on the camera head that a locator finds from above ground.', def_es: 'Pequeño transmisor en la cabeza de la cámara que un localizador encuentra desde la superficie.' },
    ],
  },
  est_bucket: 'plumbing',
  recipes: [
    {
      id: 'cipp_relining',
      example_title: 'CIPP lateral lining — 4 in. building sewer',
      priority: 10,
      when: { title_re: '\\bcipp\\b|cured[- ]in[- ]place|\\btrenchless\\b|\\b(?:sewer|lateral|drain)\\s+(?:re)?lin(?:ing|er|e)\\b|\\bpipe\\s+(?:re)?lin(?:ing|er)\\b|\\bfold[- ]and[- ]form\\b' },
      steps: cippSteps,
    },
    {
      id: 'pipe_bursting',
      example_title: 'Pipe burst sewer lateral with 6 in. HDPE',
      priority: 20,
      when: { title_re: '\\bpipe[- ]?burst|\\bburst(?:ing)?\\s+(?:the\\s+)?(?:sewer|lateral|pipe|line)' },
      steps: burstSteps,
    },
    {
      id: 'camera_jetting',
      example_title: 'Sewer camera inspection and hydro-jet cleaning',
      when: { title_re: '\\bsewer\\s+(?:camera|video|scope)|\\bcctv\\b|\\bhydro-?jet|\\bjetting\\b|\\broot\\s+cut' },
      steps: cameraJetSteps,
    },
  ],
  code_refs: {
    underground: [
      { section: '716.2', note: 'Pipe bursting for building sewers 6 in. and smaller, same nominal size', prov: c716 },
      { section: '716.3', note: 'Recorded camera survey before bursting', prov: c716 },
      { section: '716.4', note: 'HDPE SDR 17 pipe and fittings; cleanouts added; video before pressure test', prov: c716 },
      { section: '312.6', note: 'Gravity sewer test', prov: ipc },
      { section: 'P3010.2', note: 'Pipe bursting scope for one- and two-family dwellings', code_type: IRC, prov: c716 },
      { section: 'P2503.4', note: 'Building sewer test for one- and two-family dwellings', code_type: IRC, prov: c716 },
    ],
    final: [
      { section: '717.2', note: 'Relining for gravity drainage 4 in. and larger, same nominal size', prov: c717 },
      { section: '717.3', note: 'Clean, descale, flush, then recorded pre-install video', prov: c717 },
      { section: '717.4', note: 'Code official reviews the pre-install video before the permit', prov: c717 },
      { section: '717.5', note: 'Defective sections repaired with new pipe instead of lined', prov: c717 },
      { section: '717.7.1', note: 'Material data report given to the code official', prov: c717 },
      { section: '717.8', note: 'Post-install video after flushing and flow test', prov: c717 },
      { section: '717.9', note: 'Written installation certification from the permit holder', prov: c717 },
      { section: '717.10', note: 'Code official approval after 717.1–717.9 are met', prov: c717 },
      { section: 'P3011.3', note: 'Pre-install cleaning and video for one- and two-family dwellings', code_type: IRC, prov: c717 },
      { section: 'P3011.8', note: 'Post-install video for one- and two-family dwellings', code_type: IRC, prov: c717 },
    ],
  },
  equipment: [
    { when: { title_re: '\\bburst' }, type: 'excavator', reason: 'Dig the launch and receiving pits and handle the HDPE string' },
    { when: { title_re: '\\bburst' }, type: 'dump_truck', reason: 'Haul pit spoil and bring backfill', optional: true },
    { when: { title_re: '\\bcipp\\b|cured[- ]in[- ]place|\\blin(?:ing|er)\\b|fold[- ]and[- ]form|\\bburst' }, type: 'air_compressor', reason: 'Invert or hold pressure on the liner, or drive a pneumatic bursting head' },
    { when: { title_re: '\\bcipp\\b|cured[- ]in[- ]place|\\blin(?:ing|er)\\b' }, type: 'generator', reason: 'Power the UV light train, cutter and cameras at the access point', optional: true },
  ],
  hazards: [
    { id: 'styrene_vapor', hazard: 'Breathing styrene or resin vapor while wetting out, cutting, curing or grinding the liner', hazard_es: PENDING_ES, controls: ['Run a blower on the access point the whole time the liner is open, cut or ground', 'Keep the blower duct short with one bend; take breaks out of the hole', 'Organic-vapor respirator if eyes or throat get irritated or monitoring shows high levels'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 3, ppe: ['organic-vapor respirator (as needed)', 'chemical-resistant gloves'], prov: niosh },
    { id: 'resin_skin', hazard: 'Uncured resin and hardener on skin or in eyes', hazard_es: PENDING_ES, controls: ['Chemical-resistant gloves changed when resin gets on them', 'Safety glasses or face shield when mixing and wetting out', 'Contain and remove excess liner and spills right away'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['chemical-resistant gloves', 'safety glasses'], prov: { src: ['ecfr-1926-e', 'trenchless_sewer-niosh-hhe-2018-0009'], confidence: 'verified', last_verified: D } },
    { id: 'confined_space', hazard: 'Entering a manhole, vault or deep access pit to set or cut the liner', hazard_es: PENDING_ES, controls: ['Competent person classifies the space before work', 'Work from outside with robotic tools when possible', 'Permit entry only with air testing, attendant and rescue in place'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 4, prov: osha('aa') },
    { id: 'sewer_atmosphere', hazard: 'Sewer gas or low oxygen in a pit or crawlspace next to an open sewer', hazard_es: PENDING_ES, controls: ['Test the air before entry where a hazardous atmosphere could exist', 'Ventilate and keep rescue gear ready'], controls_es: PENDING_ES, osha_ref: '1926.651(g)(1)(i)', severity: 4, ppe: ['gas monitor'], prov: osha('p') },
    { id: 'cave_in', hazard: 'Cave-in of a launch or receiving pit', hazard_es: PENDING_ES, controls: ['Box, shoring, slope or bench any pit 5 ft or deeper before entry', 'Keep spoil and pipe at least 2 ft back from the edge', 'Ladder within 25 ft of every worker in pits 4 ft or deeper', 'Competent person inspects each shift and after rain'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, ppe: ['hard hat'], prov: osha('p') },
    { id: 'hot_cure_burns', hazard: 'Burns from hot water, steam lines, the boiler or a hot fusion plate', hazard_es: PENDING_ES, controls: ['Keep people clear of steam and hot-water hoses and fittings', 'Cool down and release pressure before opening the liner end', 'Heat-resistant gloves at the fusion plate and boiler'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['heat-resistant gloves', 'face shield'], prov: osha('e') },
    { id: 'air_hose_whip', hazard: 'Air hose whip or a blown liner end during inversion or curing under pressure', hazard_es: PENDING_ES, controls: ['Safety device at the supply on hoses over 1/2 in. ID', 'Whip checks on couplings; nobody in line with the liner end under pressure'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(7)', severity: 3, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'jetter_injection', hazard: 'High-pressure water jet cutting skin or injecting water when the nozzle comes out of the pipe', hazard_es: PENDING_ES, controls: ['Feed the hose past the first fitting before full pressure', 'Dead-man pedal in control; never point or hold the nozzle out of the pipe', 'Get medical care for any jet injury, even a small one'], controls_es: PENDING_ES, osha_ref: '1926.28(a)', severity: 3, ppe: ['waterproof gloves', 'face shield'], prov: osha('c') },
    { id: 'uv_light', hazard: 'Eye and skin damage from the UV curing light train', hazard_es: PENDING_ES, controls: ['Never look into the light train or open the liner while it is lit', 'UV-rated eye protection near the launch end'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['UV-rated safety glasses'], prov: osha('e') },
    { id: 'winch_cable', hazard: 'Struck by a snapping winch cable or rod while bursting under load', hazard_es: PENDING_ES, controls: ['Inspect cable, rods and shackles every shift', 'Nobody in the cable line or receiving pit while it is under tension'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 4, ppe: ['hard hat'], prov: osha('h') },
    { id: 'noise', hazard: 'Hearing damage from jetter, compressor, boiler and bursting rig noise', hazard_es: PENDING_ES, controls: ['Hearing protection near running equipment', 'Hearing conservation program when exposure is over the limit'], controls_es: PENDING_ES, osha_ref: '1926.52(d)(1)', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('d') },
    { id: 'biological', hazard: 'Sewage contact when opening cleanouts, jetting or cutting the old pipe', hazard_es: PENDING_ES, controls: ['Waterproof gloves and eye protection at open lines', 'Wash before eating; washing facilities on site'], controls_es: PENDING_ES, osha_ref: '1926.51(f)(1)', severity: 2, ppe: ['waterproof gloves', 'safety glasses'], prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'cleaned_before_video', item: 'Line descaled, roots cut, jetted and flushed with water before the survey video is recorded.', item_es: { status: 'translated', text: 'Línea desincrustada, raíces cortadas, hidrolavada y enjuagada con agua antes de grabar el video de inspección.' }, prov: c717 },
    { id: 'pre_video_survey', item: 'Recorded survey shows the address, every cleanout, fitting and connection, approximate depth, and footage at least every 25 ft.', item_es: { status: 'translated', text: 'El video grabado muestra la dirección, cada registro, conexión y ramal, la profundidad aproximada y el metraje al menos cada 25 pies.' }, prov: c717 },
    { id: 'defects_ruled_out', item: 'No back-grade, missing pipe wall or full separation in the section — any found are dug up and repaired with new pipe first.', item_es: { status: 'translated', text: 'Sin contrapendiente, pared de tubo faltante ni separación total en el tramo — lo que se encuentre se excava y se repara con tubo nuevo primero.' }, prov: c717 },
    { id: 'size_limits', item: 'Relining only on gravity drainage 4 in. and larger; bursting only on 6 in. and smaller; new pipe or liner the same nominal size as the old.', item_es: { status: 'translated', text: 'Encamisado solo en drenaje por gravedad de 4 pulg. o más; reventado solo en 6 pulg. o menos; tubo o encamisado nuevo del mismo diámetro nominal que el viejo.' }, prov: { src: ['icc-pa', 'trenchless_sewer-icc-codenotes-716', 'trenchless_sewer-icc-codenotes-717'], confidence: 'verified', last_verified: D } },
    { id: 'flow_controlled', item: 'Occupants notified and flow stopped or bypassed for the whole install and cure.', item_es: { status: 'translated', text: 'Ocupantes avisados y el flujo detenido o desviado durante toda la instalación y el curado.' }, prov: epa },
    { id: 'material_data_report', item: 'Material data report filled in: location, liner and resin type, amount installed and install conditions.', item_es: { status: 'translated', text: 'Reporte de datos del material lleno: ubicación, tipo de encamisado y resina, cantidad instalada y condiciones de instalación.' }, prov: c717 },
    { id: 'connections_reopened', item: 'Every live connection reopened full size, with no lip, coupon or liner flap left in the flow.', item_es: { status: 'translated', text: 'Cada conexión activa reabierta a su tamaño completo, sin borde, recorte ni pedazo de encamisado en el flujo.' }, prov: epa },
    { id: 'post_video_flow', item: 'Post-install video recorded after flushing and a water flow test shows no wrinkles that catch flow, lifts, open seams or blocked connections.', item_es: { status: 'translated', text: 'El video posterior, grabado después de enjuagar y probar con flujo de agua, no muestra arrugas que atrapen flujo, despegues, uniones abiertas ni conexiones tapadas.' }, prov: c717 },
    { id: 'hdpe_pipe', item: 'Burst replacement pipe is HDPE SDR 17 with HDPE fittings and fully cooled butt-fusion joints.', item_es: { status: 'translated', text: 'El tubo de reemplazo por reventado es HDPE SDR 17 con conexiones de HDPE y uniones por termofusión completamente enfriadas.' }, prov: c716 },
    { id: 'cleanouts_added', item: 'A cleanout added where the old line had none.', item_es: { status: 'translated', text: 'Se agregó un registro de limpieza donde la línea vieja no tenía.' }, prov: c716 },
    { id: 'burst_video_then_test', item: 'New burst line video-surveyed and accepted by the code official before it is pressure-tested, and the test passed.', item_es: { status: 'translated', text: 'La línea nueva reventada se inspeccionó con video y la aceptó el inspector antes de la prueba de presión, y la prueba pasó.' }, prov: c716 },
    { id: 'certification_delivered', item: 'Written certification, material data report and post video given to the code official before final.', item_es: { status: 'translated', text: 'Certificación escrita, reporte de datos del material y video posterior entregados al inspector antes de la final.' }, prov: c717 },
    { id: 'records_delivered', item: 'Owner received the before and after videos and the written report.', item_es: { status: 'translated', text: 'El propietario recibió los videos de antes y después y el reporte escrito.' }, prov: est('Industry practice; not a code requirement for camera-only work.') },
    { id: 'ventilation_styrene', item: 'Blower running on the access point whenever the liner is open, cut or ground; building drains and openings near the work checked for styrene odor.', item_es: PENDING_ES, safety: true, prov: niosh },
    { id: 'protective_system', item: 'Pits 5 ft or deeper protected by box, shoring or sloping before entry; ladder in pits 4 ft or deeper.', item_es: PENDING_ES, safety: true, prov: osha('p') },
  ],
  inspection_checklists: {
    underground: [
      { item: 'Pre-install video reviewed; pipe 6 in. or smaller', item_es: PENDING_ES, ref: 'IPC 716.2–716.3' },
      { item: 'HDPE SDR 17 pipe and HDPE fittings used', item_es: PENDING_ES, ref: 'IPC 716.4' },
      { item: 'Cleanouts present; post-install video approved', item_es: PENDING_ES, ref: 'IPC 716.4' },
      { item: 'Pressure test passed after video approval', item_es: PENDING_ES, ref: 'IPC 312' },
    ],
    final: [
      { item: 'Pre-install video reviewed before permit; no prohibited defects', item_es: PENDING_ES, ref: 'IPC 717.4–717.5' },
      { item: 'Material data report submitted', item_es: PENDING_ES, ref: 'IPC 717.7.1' },
      { item: 'Post-install video after flush and flow test shows no defects', item_es: PENDING_ES, ref: 'IPC 717.8' },
      { item: 'Written installation certification received', item_es: PENDING_ES, ref: 'IPC 717.9' },
      { item: 'Burst pits backfilled and surface restored', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'P-TS-CCTV-EA', name: 'Sewer lateral camera inspection with recorded video, locate and report', name_es: 'Inspección con cámara del lateral con video grabado, localización y reporte', unit: 'EA', csi: '33 01 30',
      description: 'One recorded CCTV survey of a building sewer / lateral (up to ~100 ft) with surface locate and written report.',
      material_cost_cents: { v: 1500, prov: est('Report, storage media and marking consumables, 2026 baseline.') },
      labor_hours_per_unit: { v: 1.5, prov: est('One tech: set up, run, locate, write up.') },
      equipment_cost_cents: { v: 15000, prov: est('Recording camera reel + locator day-share; residential service-call pricing.') },
      waste_pct: { v: 0, prov: est('Service item.') } },
    { code: 'P-TS-JET-EA', name: 'Hydro-jet cleaning and root cutting of a sewer lateral', name_es: 'Hidrolavado y corte de raíces de un lateral de drenaje', unit: 'EA', csi: '33 01 30',
      description: 'Jetting with root-cutting / descaling heads of one lateral (up to ~100 ft), flush included. Camera survey is P-TS-CCTV-EA.',
      material_cost_cents: { v: 2000, prov: est('Nozzle and cutter-chain wear, 2026 baseline.') },
      labor_hours_per_unit: { v: 2.5, prov: est('One to two techs: access, jet, root cut, flush.') },
      equipment_cost_cents: { v: 20000, prov: est('Trailer or truck jetter day-share incl. fuel and water.') },
      waste_pct: { v: 0, prov: est('Service item.') } },
    { code: 'P-TS-CIPP-LAT-LF', name: 'CIPP relining of a 4–6 in. building sewer / lateral, per LF', name_es: 'Encamisado CIPP de drenaje / lateral de 4 a 6 pulg., por pie lineal', unit: 'LF', csi: '33 01 30.61',
      description: 'Liner tube, resin, wet-out, install, cure, end seals and reinstatement of connections. Cleaning, camera and access pits are separate lines.',
      material_cost_cents: { v: 4500, prov: est('Felt liner + resin per LF at 4–6 in., 2026 baseline. Municipal main-line CIPP bid tabs are 8 in.+ and not comparable to private laterals.') },
      labor_hours_per_unit: { v: 0.6, prov: est('Two- to three-person crew; ~60–100 LF lateral in a day incl. set-up, cure and reinstatement.') },
      equipment_cost_cents: { v: 2500, prov: est('Inverter/compressor, boiler or UV unit and cutter share per LF.') },
      waste_pct: { v: 10, prov: est('Liner overlength at both ends and resin over-mix.') } },
    { code: 'P-TS-BURST-LF', name: 'Pipe bursting a 4–6 in. building sewer with HDPE SDR 17, per LF', name_es: 'Reventado de drenaje de 4 a 6 pulg. con HDPE SDR 17, por pie lineal', unit: 'LF', csi: '33 01 30.72',
      description: 'HDPE pipe, butt fusion, bursting head pull and tie-in couplings. Pits are P-TS-PIT-EA; camera and test are separate.',
      material_cost_cents: { v: 1200, prov: est('4–6 in. HDPE SDR 17 + couplings per LF, 2026 baseline.') },
      labor_hours_per_unit: { v: 0.5, prov: est('Fuse string, set rig and pull; two- to three-person crew.') },
      equipment_cost_cents: { v: 3000, prov: est('Bursting rig + fusion machine share per LF.') },
      waste_pct: { v: 5, prov: est('Extra pipe left at each end to relax back.') } },
    { code: 'P-TS-PIT-EA', name: 'Launch or receiving pit for trenchless sewer work — dig, protect, backfill, restore', name_es: 'Fosa de entrada o salida para trabajo sin zanja — excavar, proteger, rellenar, restaurar', unit: 'EA', csi: '31 23 16',
      description: 'One access pit up to ~6 ft deep with shoring or box, backfill in lifts and lawn-level restoration. Pavement restoration is P-SU-ROW-RESTORE-SF.',
      material_cost_cents: { v: 6000, prov: est('Bedding, granular backfill and topsoil/seed, 2026 baseline.') },
      labor_hours_per_unit: { v: 6, prov: est('Two people: locate, dig, protect, backfill, restore.') },
      equipment_cost_cents: { v: 45000, prov: est('Mini-excavator + trench box/shoring + compactor, about half a day.') },
      waste_pct: { v: 0, prov: est('Single unit.') } },
  ],
  dependency_hints: [
    { before_phase: 'finishes_exterior', note: 'Line or burst the lateral and backfill the pits before final grading, paving or landscaping over the access points.' },
  ],
});
