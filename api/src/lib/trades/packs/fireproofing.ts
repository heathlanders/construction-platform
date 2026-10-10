// Trade Knowledge Pack — fireproofing (Spray-Applied Fireproofing). Wave 10 — NEW-TRADE pattern (no hand
// recipe, no template tasks). Dossier: docs/trade-packs/dossiers/fireproofing.md.
// Sources: UFGS 07 81 00 (public domain), NFCA 100 (association), AWCI TM 12-A/12-B + UL certifications
// (reference only), 29 CFR 1926 Subparts C, D, E, I, L, M, Z; IBC 703.2 / 704 / 1705 (reference only).
// IBC special-inspection numbering is cited per the 2021 IBC (1705.15 SFRM, 1705.16 mastic/intumescent);
// the 2018/2015 IBC carry the same provisions as 1705.14 / 1705.15.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['fireproofing-ufgs-07-81-00'], confidence: 'verified' as const, last_verified: D };
const nfca = { src: ['fireproofing-nfca-100'], confidence: 'verified' as const, last_verified: D };
const both = { src: ['fireproofing-ufgs-07-81-00', 'fireproofing-nfca-100'], confidence: 'verified' as const, last_verified: D };
const ul = { src: ['fireproofing-ul-coatings'], confidence: 'derived' as const, last_verified: D, note: 'Paraphrased from UL guidance — the product certification / design listing governs.' };
const awci = { src: ['fireproofing-awci-tm12', 'icc-pa'], confidence: 'derived' as const, last_verified: D, note: 'Test methods are in AWCI TM 12-A/12-B and ASTM E605/E736 (reference only); the special inspector runs them.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };

const BIG: ('commercial' | 'industrial' | 'residential_mf')[] = ['commercial', 'industrial', 'residential_mf'];

export default definePack({
  key: 'fireproofing',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Protects structural steel so it keeps its strength in a fire — spray-applied fire-resistive material (SFRM, cementitious or fibrous) on beams, columns, joists and deck, and thin-film intumescent coatings on exposed steel — applied to the thickness the listed fire-resistance design calls for, tested by a special inspector, and patched after other trades.',
    summary_es: 'Protege el acero estructural contra el fuego — material ignífugo proyectado (SFRM) en vigas, columnas y losa de acero, y recubrimiento intumescente en acero expuesto — al espesor del diseño listado, probado por un inspector especial y parchado después de los otros oficios.',
    glossary: [
      { term: 'SFRM', term_es: 'SFRM (material ignífugo proyectado)', def: 'Spray-applied fire-resistive material: a cement- or fiber-based mix sprayed on steel to insulate it from fire heat.', def_es: 'Material ignífugo aplicado por aspersión: mezcla a base de cemento o fibra rociada sobre el acero para aislarlo del calor del fuego.' },
      { term: 'Intumescent coating', term_es: 'Recubrimiento intumescente', def: 'Paint-like coating that swells into a thick insulating char when heated; used where steel stays exposed.', def_es: 'Recubrimiento tipo pintura que se hincha formando una capa aislante gruesa al calentarse; se usa donde el acero queda a la vista.' },
      { term: 'Design listing (UL design number)', term_es: 'Diseño listado (número de diseño UL)', def: 'The tested fire-resistance design that sets the product, primer and thickness for each member and rating.', def_es: 'El diseño de resistencia al fuego probado que fija el producto, la imprimación y el espesor para cada miembro y clasificación.' },
      { term: 'Hourly rating', term_es: 'Clasificación horaria', def: 'How long (1, 2, 3 hours) the protected member must hold up in the standard fire test.', def_es: 'Cuánto tiempo (1, 2, 3 horas) debe resistir el miembro protegido en la prueba de fuego estándar.' },
      { term: 'Density', term_es: 'Densidad', def: 'Weight per cubic foot of the cured fireproofing; checked by the inspector against the listing and spec.', def_es: 'Peso por pie cúbico del ignífugo curado; el inspector lo compara con el listado y la especificación.' },
      { term: 'Bond (cohesion/adhesion) test', term_es: 'Prueba de adherencia (cohesión/adhesión)', def: 'Pull test that shows the fireproofing sticks to the steel and holds together.', def_es: 'Prueba de tracción que demuestra que el ignífugo se adhiere al acero y se mantiene unido.' },
      { term: 'Flutes', term_es: 'Canales (flautas) de la losa', def: 'The valleys of a metal deck; the listing says whether they must be filled.', def_es: 'Los valles de una losa de acero; el listado indica si deben rellenarse.' },
      { term: 'Dry film thickness (DFT)', term_es: 'Espesor de película seca (DFT)', def: 'Measured thickness of a cured intumescent coat; must meet the listed thickness for the member.', def_es: 'Espesor medido de una capa intumescente curada; debe cumplir el espesor listado para el miembro.' },
      { term: 'Special inspector', term_es: 'Inspector especial', def: 'Independent agency inspector who verifies and tests fireproofing for the building official.', def_es: 'Inspector de una agencia independiente que verifica y prueba el ignífugo para la autoridad de construcción.' },
      { term: 'Overspray', term_es: 'Exceso de aspersión', def: 'Fireproofing that lands where it was not meant to go; masked against and cleaned off right away.', def_es: 'Ignífugo que cae donde no debía; se protege con cubiertas y se limpia de inmediato.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'sfrm_structural_steel',
      example_title: 'Spray-applied fireproofing (SFRM) at structural steel',
      when: { title_re: 'fireproof|\\bSFRM\\b|spray[- ]applied fire|fire[- ]resistive material' },
      steps: [
        {
          title: 'Check the steel, attachments and site conditions',
          instruction: 'Walk the area with the applicator before spraying. Steel must be bare and clean — no oil, loose mill scale, rolling compound or primer unless the design listing allows that primer (or a bond test has proven it). Clips, hangers, sleeves and inserts that pierce the fireproofing go in first; ducts, pipe, conduit and stud framing wait until after. Keep the steel and air at or above 40 °F from 24 hours before until 24 hours after, and sign off the substrate in writing.',
          detail: 'Deck underside: spray only after the roof is tight, rooftop units are set and roof traffic has stopped — traffic and deflection can knock SFRM off the deck.',
          tools: ['flashlight', 'scraper', 'wire brush', 'surface thermometer'],
          materials: ['substrate acceptance form'],
          safety_ids: ['fall_edge', 'scissor_lift'],
          qa_ids: ['steel_clean', 'attachments_first', 'deck_after_roof', 'temp_vent'],
        },
        {
          title: 'Confirm the design and thickness for every member',
          instruction: 'Post the fireproofing schedule on site: each beam, column, joist and deck area tied to its design listing number, hourly rating and required thickness. Check the product on the bags matches the listing, that the bags are dry and in date, and mark any member with no design on the schedule for the engineer before spraying it.',
          tools: ['marked-up drawings', 'tape measure'],
          materials: ['listed fireproofing product', 'bonding adhesive if the listing requires it'],
          safety_ids: ['hazcom'],
          qa_ids: ['design_per_member'],
          code_refs: [
            { section: '703.2', code_type: 'IBC', note: 'Fire-resistance ratings come from tested assemblies or approved calculations' },
            { section: '704', code_type: 'IBC', note: 'Fire-resistance rating of structural members — protection of columns, beams and trusses' },
          ],
        },
        {
          title: 'Mask, mix and spray to thickness',
          instruction: 'Cover windows, finished surfaces and anything not getting fireproofing; tarp exterior openings. Mix and pump per the maker’s instructions, keeping water pressure and volume steady. Build the thickness in passes, fill deck flutes where the design says to, and check thickness with a gauge as you go — full flange and half flange alike. Never tamp the material to reach density.',
          detail: 'In closed rooms keep fans running for at least 4 air changes an hour so the material dries.',
          tools: ['rotor-stator or piston fireproofing pump', 'mixer', 'spray nozzle', 'thickness gauge', 'masking film'],
          materials: ['listed SFRM', 'masking plastic and tape', 'clean water'],
          safety_ids: ['scissor_lift', 'aerial_lift', 'scaffold_fall', 'hose_whip', 'dust_resp', 'overspray_eye', 'slip_rebound'],
          qa_ids: ['flutes_filled', 'thickness_gauge', 'no_tamping', 'temp_vent'],
        },
        {
          title: 'Special inspection: thickness, density and bond',
          instruction: 'Call the special inspector before anything covers the steel — they need open access and should come at least a few working days before ceilings or walls close in. The inspector checks surface condition, thickness on each member type, density and bond in the sampled areas. Add material or strip and respray any failed area, then have it retested. Apply sealer only after testing and repairs are done.',
          detail: 'Gated at the framing (pre-cover) inspection: fireproofing has to be tested and accepted while it is still exposed — once ducts, ceilings or walls go in, failed areas cannot be measured or fixed.',
          tools: ['thickness gauge', 'flashlight'],
          materials: ['repair material same as original', 'sealer if the product requires it'],
          safety_ids: ['scissor_lift', 'fall_edge'],
          qa_ids: ['special_inspection_pass', 'thickness_tolerance'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: '1705.15', code_type: 'IBC', note: 'Special inspection of sprayed fire-resistant materials — surface, thickness, density, bond (1705.14 in IBC 2018)' }],
        },
        {
          title: 'Patch after other trades and clean up',
          instruction: 'After MEP, hangers and framing are in, walk every protected member and patch every scrape, cut and hanger attachment with the same or a listed compatible material to full thickness. Get patches re-inspected before ceilings close. Scrape overspray off surfaces that were not meant to get fireproofing within 24 hours.',
          tools: ['trowel', 'hopper gun or pump', 'scraper', 'thickness gauge'],
          materials: ['listed patching material'],
          safety_ids: ['scissor_lift', 'dust_resp', 'slip_rebound'],
          qa_ids: ['patch_same_material', 'overspray_cleaned'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '704', code_type: 'IBC', note: 'Structural member protection kept intact for the full listed rating' }],
        },
      ],
    },
    {
      id: 'intumescent_coating',
      example_title: 'Intumescent fire-resistive coating at exposed steel',
      when: { title_re: 'intumescent|thin[- ]film fire|mastic fire' },
      priority: 10,
      steps: [
        {
          title: 'Prepare the steel and prime with the listed primer',
          instruction: 'Clean and blast or tool-clean the steel to the surface prep the product calls for. Use only the primer named in the design listing or product certification, at its film thickness; galvanized steel only where the certification allows it. Check the primer is fully cured before the first intumescent coat.',
          tools: ['abrasive blaster or power tool', 'wet/dry film gauge'],
          materials: ['listed primer', 'solvent cleaner'],
          safety_ids: ['vapor_ventilation', 'hazcom', 'overspray_eye'],
          qa_ids: ['primer_listed', 'steel_clean'],
        },
        {
          title: 'Check air, steel and humidity before each coat',
          instruction: 'Measure air temperature, steel temperature, humidity and dew point before every coat and keep them inside the maker’s limits. Do not coat wet steel or steel that is too close to the dew point. Ventilate enclosed areas while coating and curing.',
          tools: ['surface thermometer', 'hygrometer / dew-point meter'],
          materials: ['daily coating log'],
          safety_ids: ['vapor_ventilation'],
          qa_ids: ['temp_vent'],
        },
        {
          title: 'Apply coats to the listed thickness',
          instruction: 'Spray or roll the intumescent in coats, checking wet film thickness on every pass so the cured coat reaches the dry film thickness the listing requires for that member size and rating. Respect the recoat times; keep runs and sags off.',
          tools: ['airless sprayer', 'wet film gauge', 'roller and brush for touch-up'],
          materials: ['listed intumescent coating'],
          safety_ids: ['airless_injection', 'vapor_ventilation', 'dust_resp', 'scissor_lift', 'aerial_lift', 'overspray_eye'],
          qa_ids: ['intumescent_dft'],
        },
        {
          title: 'Special inspection of the coating',
          instruction: 'Before anything covers or finishes the steel, the special inspector checks surface prep, product, application and the measured dry film thickness. Build up any thin area and have it re-read.',
          detail: 'Gated at the framing (pre-cover) inspection so thickness can still be read on the bare coating.',
          tools: ['dry film thickness gauge'],
          materials: [],
          safety_ids: ['scissor_lift', 'fall_edge'],
          qa_ids: ['special_inspection_pass'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: '1705.16', code_type: 'IBC', note: 'Special inspection of mastic and intumescent fire-resistant coatings (1705.15 in IBC 2018)' }],
        },
        {
          title: 'Topcoat, touch up and protect',
          instruction: 'Apply the topcoat the listing allows where the steel is exposed to weather or where the finish is specified. Touch up handling and erection damage with the same system to full thickness and keep other trades from welding, grinding or hanging from coated steel without a repair plan.',
          tools: ['airless sprayer', 'brush', 'dry film thickness gauge'],
          materials: ['listed topcoat', 'listed intumescent for touch-up'],
          safety_ids: ['vapor_ventilation', 'scissor_lift'],
          qa_ids: ['patch_same_material'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '704', code_type: 'IBC', note: 'Structural member protection kept intact for the full listed rating' }],
        },
      ],
    },
    {
      id: 'patch_existing_fireproofing',
      example_title: 'Patch existing fireproofing after renovation',
      when: { title_re: '(?:patch|repair|replace|restor)\\w*[^.]*(?:fireproof|SFRM)|(?:fireproof|SFRM)[^.]*(?:patch|repair|replace|restor)' },
      priority: 20,
      steps: [
        {
          title: 'Test old fireproofing before disturbing it',
          instruction: 'Spray-on fireproofing in older buildings can contain asbestos. Get the owner’s survey or have samples tested before any scraping, cutting or overspray removal; if it is asbestos or untested, stop — only trained, protected crews under an asbestos plan may disturb it.',
          tools: ['sample kit (licensed inspector)'],
          materials: [],
          safety_ids: ['asbestos_existing'],
          qa_ids: ['existing_tested'],
        },
        {
          title: 'Remove loose material and prepare the edges',
          instruction: 'Remove only loose or damaged fireproofing back to sound, well-bonded material, and clean the exposed steel. Find out what product and design the original work used so the patch keeps the rating.',
          tools: ['scraper', 'HEPA vacuum', 'wire brush'],
          materials: ['poly sheeting', 'tape'],
          safety_ids: ['dust_resp', 'scissor_lift', 'overspray_eye'],
          qa_ids: ['steel_clean', 'design_per_member'],
        },
        {
          title: 'Patch to full thickness and get it inspected',
          instruction: 'Hand-trowel or respray with the same material or a listed compatible patching product to the original thickness, check with a gauge, and have the special inspector or the AHJ accept the repair before ceilings close.',
          tools: ['trowel', 'hopper gun', 'thickness gauge'],
          materials: ['listed patching material'],
          safety_ids: ['scissor_lift', 'dust_resp', 'slip_rebound'],
          qa_ids: ['patch_same_material', 'thickness_tolerance'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '704', code_type: 'IBC', note: 'Structural member protection kept intact for the full listed rating' }],
        },
      ],
    },
  ],
  code_refs: {
    framing: [
      { section: '703.2', code_type: 'IBC', note: 'Fire-resistance ratings come from tested assemblies or approved calculations', prov: icc },
      { section: '704', code_type: 'IBC', note: 'Fire-resistance rating of structural members — protection of columns, beams and trusses', prov: icc },
      { section: '1705.15', code_type: 'IBC', note: 'Special inspection of sprayed fire-resistant materials (1705.14 in IBC 2018)', prov: icc },
      { section: '1705.16', code_type: 'IBC', note: 'Special inspection of mastic and intumescent coatings (1705.15 in IBC 2018)', prov: icc },
    ],
    final: [
      { section: '704', code_type: 'IBC', note: 'Structural member protection kept intact after other trades finish', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: 'fireproof|SFRM|spray[- ]applied fire|intumescent' }, type: 'scissor_lift', reason: 'Reach beams, joists and deck underside to spray, gauge and patch' },
    { when: { title_re: 'fireproof|SFRM|spray[- ]applied fire|intumescent', building_types: ['commercial', 'industrial'] }, type: 'boom_lift', reason: 'High bays, sloped or obstructed floors a scissor lift cannot reach', optional: true },
    { when: { title_re: 'fireproof|SFRM|spray[- ]applied fire' }, type: 'air_compressor', reason: 'Atomizing air at the SFRM spray nozzle', optional: true },
    { when: { title_re: 'fireproof|SFRM|spray[- ]applied fire|intumescent' }, type: 'generator', reason: 'Pump and mixer power where site power at the staging area is not ready', optional: true },
  ],
  hazards: [
    { id: 'scissor_lift', hazard: 'Fall, tip-over or crush against steel from a scissor lift', hazard_es: PENDING_ES, controls: ['Keep the guardrails closed and stand on the platform, never on the rails', 'Drive only on level, cleared floors — watch for openings and wet overspray', 'Watch overhead for beams and deck before raising'], controls_es: PENDING_ES, osha_ref: '1926.452(w)', severity: 4, prov: osha('l') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from a boom-lift basket', hazard_es: PENDING_ES, controls: ['Wear a harness and lanyard tied to the boom or basket', 'Stand on the basket floor — never on the rails'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'scaffold_fall', hazard: 'Fall from a rolling scaffold while spraying or patching', hazard_es: PENDING_ES, controls: ['Guardrails or personal fall arrest above 10 ft', 'Lock the casters and fully plank the platform'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'fall_edge', hazard: 'Fall from open floor edges, shafts and deck openings in an unfinished steel frame', hazard_es: PENDING_ES, controls: ['Guardrails, covers or personal fall arrest at any edge 6 ft or more above the level below', 'Keep hole covers marked and in place after moving equipment'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, prov: osha('m') },
    { id: 'dust_resp', hazard: 'Breathing fireproofing dust and spray mist while mixing, spraying and scraping', hazard_es: PENDING_ES, controls: ['Respirator selected under a written respiratory protection program, with fit testing', 'Mix bags downwind and keep the mixer area ventilated'], controls_es: PENDING_ES, osha_ref: '1926.103', severity: 3, ppe: ['respirator per program'], prov: osha('e') },
    { id: 'vapor_ventilation', hazard: 'Solvent or epoxy vapors from intumescent coatings and primers in enclosed areas', hazard_es: PENDING_ES, controls: ['Mechanical ventilation to keep vapors below exposure limits', 'No open flames or sparks near solvent-based coatings'], controls_es: PENDING_ES, osha_ref: '1926.57(a)', severity: 3, ppe: ['organic-vapor respirator when required'], prov: osha('d') },
    { id: 'hazcom', hazard: 'Skin and eye burns from cementitious mixes; skin sensitization from epoxies', hazard_es: PENDING_ES, controls: ['Read the SDS before use and keep it on site', 'Gloves and long sleeves; wash skin right away after contact'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'long sleeves'], prov: osha('d') },
    { id: 'overspray_eye', hazard: 'Eye injury from overhead spray, rebound and falling material', hazard_es: PENDING_ES, controls: ['Wear sealed goggles or a face shield when spraying overhead', 'Keep others out from under the spray area'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 3, ppe: ['goggles', 'face shield'], prov: osha('e') },
    { id: 'hose_whip', hazard: 'Whipping air or material hose if a coupling fails under pressure', hazard_es: PENDING_ES, controls: ['Safety device at the supply to cut pressure if a hose over 1/2 in. fails', 'Whip checks on couplings; inspect hoses every shift'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(7)', severity: 3, prov: osha('i') },
    { id: 'airless_injection', hazard: 'Injection injury from a high-pressure airless spray gun', hazard_es: PENDING_ES, controls: ['Trigger safety on whenever not spraying; tip guard in place', 'Relieve pressure before cleaning or changing the tip — never wipe the tip with a hand'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(8)', severity: 4, prov: osha('i') },
    { id: 'slip_rebound', hazard: 'Slips on wet rebound and overspray on floors and deck', hazard_es: PENDING_ES, controls: ['Scrape up rebound as you go and keep walkways clear'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, prov: osha('c') },
    { id: 'asbestos_existing', hazard: 'Asbestos in older spray-on fireproofing disturbed during repair or tie-in', hazard_es: PENDING_ES, controls: ['Treat older spray-on surfacing as asbestos until the owner’s survey or lab tests clear it', 'Stop work and report; only trained, protected crews under an asbestos plan may disturb it'], controls_es: PENDING_ES, osha_ref: '1926.1101(k)', severity: 4, prov: osha('z') },
  ],
  qa_checklist: [
    { id: 'steel_clean', item: 'Steel free of oil, dirt, loose mill scale, rolling compound and any primer or paint not allowed by the design listing (or proven by a bond test); written substrate acceptance on file.', item_es: { status: 'translated', text: 'Acero libre de aceite, suciedad, cascarilla suelta, compuesto de laminación y cualquier imprimación o pintura no permitida por el diseño listado (o comprobada con prueba de adherencia); aceptación del sustrato por escrito en archivo.' }, prov: both },
    { id: 'primer_listed', item: 'Intumescent work: primer is the one named in the listing at its film thickness; galvanized steel coated only where the certification allows it.', item_es: { status: 'translated', text: 'Trabajo intumescente: la imprimación es la indicada en el listado con su espesor de película; acero galvanizado recubierto solo donde la certificación lo permite.' }, prov: ul },
    { id: 'design_per_member', item: 'Every protected member is on the fireproofing schedule with its design listing number, hourly rating and required thickness; bags match the listed product, dry and in date.', item_es: { status: 'translated', text: 'Cada miembro protegido está en el programa de ignifugado con su número de diseño listado, clasificación horaria y espesor requerido; los sacos coinciden con el producto listado, secos y vigentes.' }, prov: { src: ['fireproofing-ufgs-07-81-00', 'fireproofing-ul-coatings'], confidence: 'verified', last_verified: D } },
    { id: 'attachments_first', item: 'Clips, hangers, sleeves and inserts installed before spraying; ducts, piping, conduit and stud framing held until fireproofing is accepted.', item_es: { status: 'translated', text: 'Clips, colgadores, manguitos e insertos instalados antes de aplicar; ductos, tuberías, conductos y montantes esperan hasta aceptar el ignífugo.' }, prov: both },
    { id: 'deck_after_roof', item: 'Deck underside sprayed only after the roof is tight, rooftop equipment set and construction roof traffic stopped.', item_es: { status: 'translated', text: 'Parte inferior de la losa de acero rociada solo después de que el techo esté hermético, los equipos de techo colocados y el tránsito de obra en el techo detenido.' }, prov: nfca },
    { id: 'temp_vent', item: 'Steel and air at or above 40 °F from 24 h before to 24 h after spraying (or within the coating maker’s limits); enclosed areas ventilated at 4 or more air changes per hour.', item_es: { status: 'translated', text: 'Acero y aire a 40 °F o más desde 24 h antes hasta 24 h después de aplicar (o dentro de los límites del fabricante del recubrimiento); áreas cerradas ventiladas con 4 o más cambios de aire por hora.' }, prov: both },
    { id: 'flutes_filled', item: 'Deck flutes filled or left open exactly as the design listing requires.', item_es: { status: 'translated', text: 'Canales de la losa rellenos o abiertos exactamente como lo exige el diseño listado.' }, prov: nfca },
    { id: 'thickness_gauge', item: 'Sprayers check thickness with a gauge during application on full- and half-flange areas, not just at the end.', item_es: { status: 'translated', text: 'Los aplicadores revisan el espesor con calibrador durante la aplicación en alas completas y medias alas, no solo al final.' }, prov: nfca },
    { id: 'no_tamping', item: 'Material reaches density as sprayed — no tamping or troweling to force density; uniform texture.', item_es: { status: 'translated', text: 'El material alcanza la densidad al rociarse — sin apisonar ni allanar para forzar la densidad; textura uniforme.' }, prov: ufgs },
    { id: 'thickness_tolerance', item: 'Average thickness meets the listed thickness; no single reading below the listed thickness minus 1/4 in. (when 1 in. or more) or minus 25% (when under 1 in.).', item_es: PENDING_ES, safety: true, prov: { src: ['fireproofing-ufgs-07-81-00'], confidence: 'verified', last_verified: D, note: 'UFGS 07 81 00 §3.4.4 tolerance; the project spec or listing may be stricter.' } },
    { id: 'special_inspection_pass', item: 'Special inspector’s report shows thickness, density and bond (or intumescent dry film thickness) passing in every sampled area — at least one area per 10,000 SF of floor or two per floor — before anything covers the steel.', item_es: PENDING_ES, safety: true, prov: { src: ['fireproofing-ufgs-07-81-00', 'fireproofing-awci-tm12'], confidence: 'verified', last_verified: D } },
    { id: 'intumescent_dft', item: 'Intumescent wet film checked every coat and cured dry film thickness meets the listed thickness for each member size and rating.', item_es: { status: 'translated', text: 'Película húmeda del intumescente revisada en cada capa y el espesor de película seca curada cumple el espesor listado para cada tamaño de miembro y clasificación.' }, prov: awci },
    { id: 'patch_same_material', item: 'Every scrape, cut and hanger attachment patched with the same or a listed compatible material to full thickness and re-inspected before ceilings close.', item_es: { status: 'translated', text: 'Cada raspadura, corte y fijación de colgador parchada con el mismo material o uno compatible listado al espesor completo y reinspeccionada antes de cerrar cielos rasos.' }, prov: both },
    { id: 'overspray_cleaned', item: 'Overspray removed from surfaces not meant to be fireproofed within 24 hours; floors scraped clean.', item_es: { status: 'translated', text: 'Exceso de aspersión retirado de superficies que no debían recibir ignífugo dentro de 24 horas; pisos raspados y limpios.' }, prov: both },
    { id: 'existing_tested', item: 'Existing spray-on fireproofing confirmed asbestos-free by survey or lab test before any scraping, cutting or patching.', item_es: PENDING_ES, safety: true, prov: osha('z') },
  ],
  inspection_checklists: {
    framing: [
      { item: 'Special inspector’s fireproofing report on site: thickness, density and bond (or DFT) passing for each member type', item_es: PENDING_ES, ref: '1705.15' },
      { item: 'Fireproofing schedule with design listing numbers and required thicknesses available to the inspector', item_es: PENDING_ES, ref: '703.2' },
      { item: 'Steel still exposed — no ducts, pipe, ceilings or walls covering protected members yet', item_es: PENDING_ES },
      { item: 'Intumescent coatings: primer and coating match the listing; DFT readings logged', item_es: PENDING_ES, ref: '1705.16' },
    ],
    final: [
      { item: 'All damage from other trades patched and re-inspected; no bare steel at hangers or penetrations', item_es: PENDING_ES, ref: '704' },
      { item: 'Special inspection final report submitted to the building official', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-FP-SFRM-1HR-SF', name: 'Spray-applied fireproofing (SFRM), cementitious, ~1-hour beam/deck rating, per SF of steel surface', name_es: 'Ignífugo proyectado (SFRM) cementoso, ~1 hora en viga/losa, por pie² de acero', unit: 'SF', csi: '07 81 00',
      description: 'Medium-density cementitious SFRM at roughly 1/2–3/4 in.; SF = sprayed steel surface, not floor area. Includes masking and gauging.',
      material_cost_cents: { v: 85, prov: est('listed cementitious SFRM at ~1-hr thickness + masking, national baseline 2026') }, labor_hours_per_unit: { v: 0.012, prov: est('3-person pump crew incl. masking, gauging, cleanup') },
      equipment_cost_cents: { v: 10, prov: est('pump/mixer + lift share per SF') }, waste_pct: { v: 15, prov: est('rebound and overspray') } },
    { code: 'B-FP-SFRM-2HR-SF', name: 'Spray-applied fireproofing (SFRM), cementitious, ~2-hour column/beam rating, per SF of steel surface', name_es: 'Ignífugo proyectado (SFRM) cementoso, ~2 horas en columna/viga, por pie² de acero', unit: 'SF', csi: '07 81 00',
      description: 'Thicker build (roughly 1 in. or more); actual thickness comes from the design listing and member size.',
      material_cost_cents: { v: 170, prov: est('listed cementitious SFRM at ~2-hr thickness + masking, 2026') }, labor_hours_per_unit: { v: 0.018, prov: est('more passes and gauging per SF') },
      equipment_cost_cents: { v: 15, prov: est('pump/mixer + lift share per SF') }, waste_pct: { v: 15, prov: est('rebound and overspray') } },
    { code: 'B-FP-INTUM-SF', name: 'Thin-film intumescent fire-resistive coating, ~1-hour, listed primer + coats + topcoat, per SF of steel surface', name_es: 'Recubrimiento intumescente de película delgada, ~1 hora, imprimación + capas + acabado, por pie² de acero', unit: 'SF', csi: '07 81 23',
      material_cost_cents: { v: 450, prov: est('listed primer + intumescent at ~1-hr DFT + topcoat, national baseline 2026') }, labor_hours_per_unit: { v: 0.05, prov: est('prep, multiple coats with film checks, topcoat') },
      equipment_cost_cents: { v: 25, prov: est('airless rig + lift share per SF') }, waste_pct: { v: 10, prov: est('spray loss') } },
    { code: 'B-FP-PATCH-SF', name: 'Fireproofing patch and repair after other trades, per SF', name_es: 'Parche y reparación de ignífugo después de otros oficios, por pie²', unit: 'SF', csi: '07 81 00',
      material_cost_cents: { v: 150, prov: est('listed patching material, small-batch, 2026') }, labor_hours_per_unit: { v: 0.1, prov: est('find, prep, hand-trowel or respray small areas, gauge') },
      equipment_cost_cents: { v: 0, prov: est('hand tools / hopper gun') }, waste_pct: { v: 20, prov: est('small-batch mixing loss') } },
    { code: 'B-FP-TEST-EA', name: 'Fireproofing special-inspection test area (thickness, density, bond), each', name_es: 'Área de prueba de inspección especial de ignífugo (espesor, densidad, adherencia), c/u', unit: 'EA', csi: '01 45 33',
      description: 'Third-party agency test set at one sample area; crew time to attend and repair test spots in labor.',
      material_cost_cents: { v: 0, prov: est('patch material in B-FP-PATCH-SF') }, labor_hours_per_unit: { v: 0.5, prov: est('attend inspector, repair test cut-outs') },
      equipment_cost_cents: { v: 45000, prov: est('testing-agency visit share + lab density/bond per sample area, 2026') }, waste_pct: { v: 0, prov: est('service') } },
  ],
  quantity_rules: [
    { code: 'B-FP-SFRM-1HR-SF', assumption: 'Fireproofed steel surface ≈ 0.5 SF per SF of floor (beams, girders, columns; deck unsprayed) — replace with the steel takeoff and split by rating', when: { building_types: BIG }, qty: { basis: 'area_sf_sum', mul: 0.5, round: 'round' } },
    { code: 'B-FP-TEST-EA', assumption: 'One special-inspection test area per 10,000 SF of floor plus one (spec minimum is also two per floor — check floor count)', when: { building_types: BIG }, qty: { basis: 'area_sf_sum', mul: 0.0001, add: 1, round: 'ceil' } },
    { code: 'B-FP-PATCH-SF', assumption: 'Patch allowance ≈ 1 SF per 100 SF of floor for damage by later trades', when: { building_types: BIG }, qty: { basis: 'area_sf_sum', mul: 0.01, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['structural_steel', 'metal_decking', 'roofing'], before_phase: 'rough_in', note: 'Fireproof after steel, deck and a tight roof, and before ducts, pipe and conduit block the steel.' },
  ],
});
