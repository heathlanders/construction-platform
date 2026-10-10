// intake/trades/concrete_flatwork.ts — Design Studio intake module: concrete flatwork (patios,
// driveways, walkways, pads). The first shipped trade; everything here is data the shared framework
// turns into the wizard, validator, AI schema, prompt and range.
//
// Pricing model: B-FLATWORK-SF (4" broom) is the baseline; every client choice maps to exactly ONE
// adder line (thickness, reinforcement, finish, color, border, extras) — catalog rows in migrations
// 0037 + 0045. Quantities come from the answers only, never from the render (invariant 1).

import { areaMetrics } from '../fields.js';
import type { QuantityInput } from '../../estimating/types.js';
import type { AreaValue, Derived, RequirementItem, SpecValues, TradeIntakeModule } from '../types.js';

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const r2 = (n: number) => Math.round(n * 100) / 100;

/** #4 rebar @ 18" o.c. each way ≈ 1.33 LF of bar per SF of slab. */
const REBAR_LF_PER_SF = 2 * (12 / 18);
/** Control joints ~10 ft on center each way ≈ area / 5 LF. */
const SAWCUT_SF_PER_LF = 5;
/** One pump day per ~60 CY placed. */
const PUMP_CY_PER_DAY = 60;

function derive(v: SpecValues): Derived {
  const area = v.area as AreaValue | undefined;
  if (!area) return { area_sf: 0, perimeter_lf: 0, concrete_cy: 0, thickness_in: 4 };
  const m = areaMetrics(area);
  const t = Number(str(v.thickness) ?? '4') || 4;
  return {
    area_sf: r2(m.area_sf),
    perimeter_lf: r2(m.perimeter_lf),
    perimeter_estimated: m.perimeter_estimated ? 1 : 0,
    thickness_in: t,
    concrete_cy: r2((m.area_sf * t) / 12 / 27),
  };
}

function scopeToQuantities(v: SpecValues, d: Derived): QuantityInput[] {
  const sf = d.area_sf ?? 0;
  if (sf <= 0) return [];
  const out: QuantityInput[] = [];
  const add = (code: string, quantity: number, ...assumptions: string[]) => {
    if (quantity > 0) out.push({ assembly_code: code, quantity: r2(quantity), assumptions });
  };
  const sizeNote = d.perimeter_estimated ? 'Perimeter estimated from total area (no shape given).' : '';

  // Site prep — by what is there today.
  const existing = str(v.existing_surface);
  if (existing === 'grass_dirt') add('B-FLAT-EXCAV-SF', sf, 'Remove sod/soil ~6" and grade for base.');
  else if (existing) add('G-SITE-DEMO-SF', sf, `Remove existing ${existing.replace('_', ' / ')} up to 6" thick and haul off.`);
  if (str(v.slope) === 'steep') {
    out.push({ assembly_code: 'B-FLAT-EXCAV-SF', quantity: r2(sf * 0.5), assumptions: ['Steep slope: extra cut/fill allowance; contractor to confirm on site.'] });
  }

  // Base + baseline slab.
  if (str(v.base) !== 'existing_ok') add('B-AGG-BASE-SY', sf / 9, '6" compacted aggregate base.');
  add('B-FLATWORK-SF', sf, '4" baseline slab, broom finish, forms included.', ...(sizeNote ? [sizeNote] : []));
  if ((d.thickness_in ?? 4) > 4) add('B-FLAT-THICK-SF-IN', sf * ((d.thickness_in ?? 4) - 4), `${d.thickness_in}" thick slab.`);

  // Reinforcement.
  switch (str(v.reinforcement)) {
    case 'fiber': add('B-FLAT-FIBER-SF', sf); break;
    case 'wire_mesh': add('B-FLAT-MESH-SF', sf); break;
    case 'rebar': add('B-REBAR-LF', sf * REBAR_LF_PER_SF, '#4 rebar at 18" on center each way.'); break;
    default: break;
  }

  // Finish + look.
  const finish = str(v.finish);
  if (finish === 'smooth') add('B-FLAT-TROWEL-SF', sf);
  if (finish === 'stamped') add('B-FLAT-STAMP-SF', sf, 'Includes color hardener and release agent.');
  if (finish === 'exposed') add('B-FLAT-EXPOSED-SF', sf);
  const color = str(v.color);
  if (color && color !== 'natural_gray' && finish !== 'stamped') add('B-FLAT-COLOR-SF', sf, 'Integral color mixed into the concrete.');
  if (str(v.border) && str(v.border) !== 'none') add('B-FLAT-BORDER-LF', d.perimeter_lf ?? 0, 'Border runs the full perimeter.');
  if (sf >= 100) add('B-FLAT-SAWCUT-LF', sf / SAWCUT_SF_PER_LF, 'Control joints ~10 ft on center.');
  if (v.sealer === true) add('B-FLAT-SEAL-SF', sf);

  // Extras.
  add('B-FLAT-STEP-EA', num(v.steps_count), 'Per riser, up to 6 ft wide.');
  if (str(v.drainage) === 'trench_drain') add('B-FLAT-DRAIN-LF', num(v.drain_lf));
  if (str(v.truck_access) === 'no') {
    add('EQUIP-CONCRETE_PUMP', Math.max(1, Math.ceil((d.concrete_cy ?? 0) / PUMP_CY_PER_DAY)), 'Truck cannot reach the pour — pump required.');
  }
  return out;
}

function requirements(v: SpecValues, d: Derived): RequirementItem[] {
  const items: RequirementItem[] = [
    {
      id: 'cure_time', level: 'info', owner: 'client', source: 'concrete_flatwork',
      title: { en: 'Curing time', es: 'Tiempo de curado' },
      body: { en: 'Stay off new concrete for 1–2 days; no vehicles for about 7 days. It reaches full strength in about 28 days.',
        es: 'No pise el concreto nuevo por 1 a 2 días; sin vehículos por unos 7 días. Alcanza su resistencia total en unos 28 días.' },
    },
    {
      id: 'weather_window', level: 'info', owner: 'contractor', source: 'concrete_flatwork',
      title: { en: 'Weather window', es: 'Clima adecuado' },
      body: { en: 'Concrete is poured on dry days above freezing; your date may move for rain or cold.',
        es: 'El concreto se vacía en días secos y sin heladas; la fecha puede cambiar por lluvia o frío.' },
    },
  ];
  const purpose = str(v.purpose);
  if (purpose === 'patio' || purpose === 'walkway') {
    items.push({
      id: 'drain_away', level: 'info', owner: 'contractor', source: 'concrete_flatwork',
      title: { en: 'Slope away from the house', es: 'Pendiente lejos de la casa' },
      body: { en: 'The surface will be sloped slightly so rain drains away from your foundation.',
        es: 'La superficie tendrá una ligera pendiente para que la lluvia se aleje de los cimientos.' },
    });
  }
  if (v.curb_cut === true) {
    items.push({
      id: 'right_of_way', level: 'required', owner: 'contractor', source: 'concrete_flatwork',
      title: { en: 'Street / curb work permit', es: 'Permiso para trabajo en la calle o bordillo' },
      body: { en: 'Changing the curb or the apron at the street usually needs a right-of-way permit from the city.',
        es: 'Modificar el bordillo o la entrada junto a la calle normalmente requiere un permiso municipal de vía pública.' },
    });
  }
  if (str(v.slope) === 'steep') {
    items.push({
      id: 'steep_slope', level: 'likely', owner: 'contractor', source: 'concrete_flatwork',
      title: { en: 'Steep slope check', es: 'Revisión de pendiente pronunciada' },
      body: { en: 'A steep site may need a retaining edge, steps or extra base. Your contractor will check on site.',
        es: 'Un terreno con mucha pendiente puede necesitar un muro de contención, escalones o más base. Su contratista lo revisará.' },
    });
  }
  if ((d.area_sf ?? 0) > 0 && str(v.truck_access) === 'no') {
    items.push({
      id: 'pump_access', level: 'info', owner: 'client', source: 'concrete_flatwork',
      title: { en: 'Room for a pump hose', es: 'Espacio para la manguera de bombeo' },
      body: { en: 'A concrete pump will run a hose to the work area; keep a path clear on pour day.',
        es: 'Una bomba de concreto llevará una manguera al área de trabajo; deje un paso libre el día del vaciado.' },
    });
  }
  return items;
}

const yesNo = (en: string, es: string) => ({ en, es });

export const concreteFlatwork: TradeIntakeModule = {
  trade_key: 'concrete_flatwork',
  intake_version: 2,
  location: 'exterior',
  disturbs_ground: true,
  capabilities: { priced: true, renderable: true, photo_assess: true },
  entry_points: [
    { id: 'flatwork_patio', label: { en: 'New concrete patio', es: 'Patio de concreto nuevo' },
      keywords: { en: ['patio', 'backyard slab', 'outdoor slab'], es: ['patio', 'losa', 'terraza de concreto'] },
      preset: { purpose: 'patio', thickness: '4' } },
    { id: 'flatwork_driveway', label: { en: 'Concrete driveway', es: 'Entrada de concreto para autos' },
      keywords: { en: ['driveway', 'drive', 'parking pad'], es: ['entrada de autos', 'cochera', 'estacionamiento'] },
      preset: { purpose: 'driveway', thickness: '5', reinforcement: 'rebar' } },
    { id: 'flatwork_walkway', label: { en: 'Walkway or sidewalk', es: 'Andador o banqueta' },
      keywords: { en: ['walkway', 'sidewalk', 'path'], es: ['andador', 'banqueta', 'acera', 'camino'] },
      preset: { purpose: 'walkway', thickness: '4' } },
    { id: 'flatwork_pad', label: { en: 'Pad (shed, AC, hot tub)', es: 'Base de concreto (bodega, aire acondicionado, jacuzzi)' },
      keywords: { en: ['pad', 'shed base', 'hot tub pad'], es: ['base', 'plancha', 'base para jacuzzi'] },
      preset: { purpose: 'pad', thickness: '4' } },
  ],
  steps: [
    {
      id: 'project', title: { en: 'Your project', es: 'Su proyecto' },
      fields: [
        { id: 'purpose', type: 'choice', required: true, label: { en: 'What are you building?', es: '¿Qué va a construir?' },
          options: [
            { value: 'patio', label: { en: 'Patio', es: 'Patio' }, prompt: 'a new concrete patio' },
            { value: 'driveway', label: { en: 'Driveway', es: 'Entrada para autos' }, prompt: 'a new concrete driveway' },
            { value: 'walkway', label: { en: 'Walkway / sidewalk', es: 'Andador / banqueta' }, prompt: 'a new concrete walkway' },
            { value: 'pad', label: { en: 'Pad', es: 'Base' }, prompt: 'a new concrete pad' },
          ] },
        { id: 'site_photos', type: 'photo', role: 'work_area', required: true, min: 1, max: 6,
          label: { en: 'Photos of the area', es: 'Fotos del área' },
          help: { en: 'Stand back so the whole area and the house edge are in the picture.',
            es: 'Aléjese para que toda el área y el borde de la casa salgan en la foto.' } },
      ],
    },
    {
      id: 'size', title: { en: 'Size and shape', es: 'Tamaño y forma' },
      intro: { en: 'A tape measure is best. Rough numbers are fine — your contractor will measure before the final price.',
        es: 'Lo mejor es una cinta métrica. Medidas aproximadas están bien; su contratista medirá antes del precio final.' },
      fields: [
        { id: 'area', type: 'area', required: true, shapes: ['rect', 'l_shape', 'circle', 'direct_sf'], min_sf: 16, max_sf: 20_000,
          ai_assessable: true, label: { en: 'Area', es: 'Área' } },
        { id: 'placement', type: 'choice',
          label: { en: 'Where does it go in your photo?', es: '¿Dónde va en su foto?' },
          help: { en: 'This tells the picture where to put it. It does not change the price.',
            es: 'Esto le indica a la imagen dónde ponerlo. No cambia el precio.' },
          options: [
            { value: 'against_house', label: { en: 'Right up against the house', es: 'Pegado a la casa' },
              prompt: 'placed right up against the house wall' },
            { value: 'off_door', label: { en: 'Out from a door (back door, slider)', es: 'Saliendo de una puerta (trasera, corrediza)' },
              prompt: 'starting at the door of the house and extending straight out from it' },
            { value: 'beside_building', label: { en: 'Next to a garage, shed or other building', es: 'Junto a una cochera, bodega u otro edificio' },
              prompt: 'placed beside the building in the photo' },
            { value: 'garage_to_street', label: { en: 'From the garage out to the street', es: 'De la cochera a la calle' },
              prompt: 'running from the garage door out to the street' },
            { value: 'path_between', label: { en: 'A path between two places', es: 'Un camino entre dos lugares' },
              prompt: 'laid out as a narrow path leading from the house toward the yard or sidewalk' },
            { value: 'open_yard', label: { en: 'Out in the yard, not touching a building', es: 'En el jardín, sin tocar ningún edificio' },
              prompt: 'out in the open yard, not touching any building' },
          ] },
      ],
    },
    {
      id: 'site', title: { en: 'What is there today', es: 'Qué hay hoy' },
      fields: [
        { id: 'existing_surface', type: 'choice', required: true, ai_assessable: true,
          label: { en: 'Current surface', es: 'Superficie actual' },
          options: [
            { value: 'grass_dirt', label: { en: 'Grass or dirt', es: 'Pasto o tierra' }, prompt: 'built on part of the existing lawn' },
            { value: 'concrete', label: { en: 'Old concrete (to remove)', es: 'Concreto viejo (a quitar)' },
              prompt: 'replacing the old concrete in exactly the same footprint' },
            { value: 'asphalt', label: { en: 'Asphalt (to remove)', es: 'Asfalto (a quitar)' },
              prompt: 'replacing the old asphalt in exactly the same footprint' },
            { value: 'pavers_gravel', label: { en: 'Pavers or gravel (to remove)', es: 'Adoquines o grava (a quitar)' },
              prompt: 'replacing the old pavers or gravel in exactly the same footprint' },
          ] },
        { id: 'slope', type: 'choice', required: true, ai_assessable: true, default: 'flat',
          label: { en: 'How sloped is the ground?', es: '¿Qué tan inclinado está el terreno?' },
          options: [
            { value: 'flat', label: { en: 'Flat', es: 'Plano' } },
            { value: 'gentle', label: { en: 'Gentle slope', es: 'Pendiente suave' } },
            { value: 'steep', label: { en: 'Steep', es: 'Pronunciado' } },
          ] },
        { id: 'truck_access', type: 'choice', required: true, ai_assessable: true, default: 'yes',
          label: { en: 'Can a concrete truck get within ~20 ft?', es: '¿Puede un camión de concreto acercarse a unos 6 m?' },
          options: [
            { value: 'yes', label: yesNo('Yes', 'Sí') },
            { value: 'no', label: { en: 'No (backyard, tight gate)', es: 'No (patio trasero, portón angosto)' } },
          ] },
      ],
    },
    {
      id: 'structure', title: { en: 'Strength', es: 'Resistencia' },
      intro: { en: 'Not sure? Ask the assistant — driveways usually need more than patios.',
        es: '¿No está seguro? Pregúntele al asistente: las entradas de autos suelen necesitar más que los patios.' },
      fields: [
        { id: 'thickness', type: 'choice', required: true, default: '4', ai_suggestible: true,
          label: { en: 'Thickness', es: 'Grosor' },
          options: [
            { value: '4', label: { en: '4 in (patios, walks)', es: '4 pulg (patios, andadores)' } },
            { value: '5', label: { en: '5 in (cars)', es: '5 pulg (autos)' } },
            { value: '6', label: { en: '6 in (trucks, RVs)', es: '6 pulg (camionetas, casas rodantes)' } },
          ] },
        { id: 'base', type: 'choice', required: true, default: 'gravel',
          label: { en: 'Gravel base', es: 'Base de grava' },
          options: [
            { value: 'gravel', label: { en: 'New compacted gravel base', es: 'Base nueva de grava compactada' } },
            { value: 'existing_ok', label: { en: 'Existing base is good (contractor confirms)', es: 'La base actual sirve (el contratista confirma)' } },
          ] },
        { id: 'reinforcement', type: 'choice', required: true, default: 'wire_mesh', ai_suggestible: true,
          label: { en: 'Reinforcement', es: 'Refuerzo' },
          options: [
            { value: 'fiber', label: { en: 'Fiber mix', es: 'Fibra en la mezcla' } },
            { value: 'wire_mesh', label: { en: 'Wire mesh', es: 'Malla de alambre' } },
            { value: 'rebar', label: { en: 'Steel rebar (strongest)', es: 'Varilla de acero (la más fuerte)' } },
          ] },
      ],
    },
    {
      id: 'look', title: { en: 'Look and finish', es: 'Apariencia y acabado' },
      fields: [
        { id: 'finish', type: 'choice', required: true, default: 'broom', ai_suggestible: true,
          label: { en: 'Finish', es: 'Acabado' },
          options: [
            { value: 'broom', label: { en: 'Broom (non-slip, classic)', es: 'Escobillado (antiderrapante, clásico)' }, prompt: 'broom-finished concrete with a coarse non-slip texture of fine parallel grooves' },
            { value: 'smooth', label: { en: 'Smooth trowel', es: 'Liso a llana' }, prompt: 'smooth troweled concrete' },
            { value: 'stamped', label: { en: 'Stamped pattern', es: 'Estampado' }, prompt: 'decorative stamped concrete' },
            { value: 'exposed', label: { en: 'Exposed aggregate (pebble look)', es: 'Agregado expuesto (aspecto de piedrita)' }, prompt: 'exposed aggregate pebble concrete' },
          ] },
        { id: 'stamp_pattern', type: 'choice', required: true, ai_suggestible: true,
          visible_when: [{ field: 'finish', in: ['stamped'] }],
          label: { en: 'Stamp pattern', es: 'Diseño del estampado' },
          options: [
            { value: 'ashlar_slate', label: { en: 'Slate tile', es: 'Pizarra' }, prompt: 'ashlar slate stamp pattern' },
            { value: 'cobblestone', label: { en: 'Cobblestone', es: 'Adoquín' }, prompt: 'cobblestone stamp pattern' },
            { value: 'flagstone', label: { en: 'Flagstone', es: 'Laja' }, prompt: 'random flagstone stamp pattern' },
            { value: 'wood_plank', label: { en: 'Wood plank', es: 'Tablón de madera' }, prompt: 'wood plank stamp pattern' },
          ] },
        { id: 'color', type: 'choice', required: true, default: 'natural_gray', ai_suggestible: true,
          label: { en: 'Color', es: 'Color' },
          options: [
            { value: 'natural_gray', label: { en: 'Natural gray', es: 'Gris natural' }, swatch: '#b5b3ad', prompt: 'medium natural gray concrete color, not white' },
            { value: 'tan', label: { en: 'Sand / tan', es: 'Arena' }, swatch: '#cdb48f', prompt: 'warm sand tan color' },
            { value: 'terracotta', label: { en: 'Terracotta', es: 'Terracota' }, swatch: '#b4674a', prompt: 'terracotta color' },
            { value: 'brown', label: { en: 'Brown', es: 'Café' }, swatch: '#7b5a43', prompt: 'earth brown color' },
            { value: 'charcoal', label: { en: 'Charcoal', es: 'Carbón' }, swatch: '#4a4a4a', prompt: 'charcoal gray color' },
          ] },
        { id: 'border', type: 'choice', default: 'none', ai_suggestible: true,
          label: { en: 'Border', es: 'Borde' },
          options: [
            { value: 'none', label: { en: 'No border', es: 'Sin borde' } },
            { value: 'stamped_border', label: { en: 'Stamped border', es: 'Borde estampado' }, prompt: 'with a contrasting stamped border' },
            { value: 'smooth_band', label: { en: 'Smooth band', es: 'Franja lisa' }, prompt: 'with a smooth troweled border band' },
          ] },
        { id: 'sealer', type: 'boolean', ai_suggestible: true, prompt_true: 'freshly sealed with a satin sheen',
          label: { en: 'Seal the surface?', es: '¿Sellar la superficie?' },
          help: { en: 'Sealer protects color and resists stains. Recommended for stamped and colored concrete.',
            es: 'El sellador protege el color y resiste manchas. Recomendado para concreto estampado o de color.' } },
      ],
    },
    {
      id: 'extras', title: { en: 'Extras', es: 'Adicionales' },
      fields: [
        { id: 'steps_count', type: 'count', min: 0, max: 12,
          label: { en: 'Concrete steps (number of risers)', es: 'Escalones de concreto (número de peldaños)' } },
        { id: 'drainage', type: 'choice', default: 'slope_only',
          label: { en: 'Drainage', es: 'Drenaje' },
          options: [
            { value: 'slope_only', label: { en: 'Slope only (standard)', es: 'Solo pendiente (estándar)' } },
            { value: 'trench_drain', label: { en: 'Add a channel drain', es: 'Agregar un canal de drenaje' } },
          ] },
        { id: 'drain_lf', type: 'linear', required: true, min_lf: 2, max_lf: 300,
          visible_when: [{ field: 'drainage', in: ['trench_drain'] }],
          label: { en: 'Drain length', es: 'Largo del drenaje' } },
        { id: 'curb_cut', type: 'boolean', visible_when: [{ field: 'purpose', in: ['driveway'] }],
          label: { en: 'Change the curb or apron at the street?', es: '¿Modificar el bordillo o la entrada junto a la calle?' } },
        { id: 'notes', type: 'text', max_len: 1000,
          label: { en: 'Anything else we should know?', es: '¿Algo más que debamos saber?' } },
      ],
    },
  ],
  catalog_codes: [
    'G-SITE-DEMO-SF', 'B-FLAT-EXCAV-SF', 'B-AGG-BASE-SY', 'B-FLATWORK-SF', 'B-FLAT-THICK-SF-IN',
    'B-FLAT-FIBER-SF', 'B-FLAT-MESH-SF', 'B-REBAR-LF', 'B-FLAT-TROWEL-SF', 'B-FLAT-STAMP-SF',
    'B-FLAT-EXPOSED-SF', 'B-FLAT-COLOR-SF', 'B-FLAT-BORDER-LF', 'B-FLAT-SAWCUT-LF', 'B-FLAT-SEAL-SF',
    'B-FLAT-STEP-EA', 'B-FLAT-DRAIN-LF', 'EQUIP-CONCRETE_PUMP',
  ],
  derive,
  scopeToQuantities,
  prompt: {
    scene: 'Edit this photo to show the finished concrete work where it would go',
    // Size + placement first (what the model gets wrong without help), then the look.
    order: ['purpose', 'area', 'placement', 'existing_surface', 'finish', 'stamp_pattern', 'color', 'border', 'sealer'],
    suffix: 'The concrete top is level with the grass, with no raised or exposed slab edge. Only that area changes. Lawn, plants, trees and buildings elsewhere stay as they are. Photorealistic, same camera angle.',
  },
  permit_rule: (v, d) => {
    if (v.curb_cut === true) return 'likely';
    if (str(v.purpose) === 'driveway' || (d.area_sf ?? 0) > 600) return 'depends';
    return 'unlikely';
  },
  requirements,
  ai_hints: 'Concrete flatwork. Driveways are usually 5–6 in thick with rebar or wire mesh; patios and walks 4 in. Stamped and colored concrete is usually sealed. Exposed aggregate and stamped finishes cost more than broom.',
  // v2 added the optional `placement` question (prompt-only, no price change) — v1 answers carry over as-is.
  upgrades: { 1: (old) => old },
  fixtures: [
    { name: 'broom patio 12x16 on grass', version: 2, values: {
      purpose: 'patio', placement: 'beside_building', area: { shape: 'rect', length_ft: 16, width_ft: 12 }, existing_surface: 'grass_dirt',
      slope: 'flat', truck_access: 'yes', thickness: '4', base: 'gravel', reinforcement: 'wire_mesh',
      finish: 'broom', color: 'natural_gray', border: 'none', drainage: 'slope_only',
      site_photos: ['00000000-0000-4000-8000-000000000001'] } },
    { name: 'stamped L driveway replacing asphalt, curb cut', version: 2, values: {
      purpose: 'driveway', placement: 'garage_to_street', area: { shape: 'l_shape', a_length_ft: 40, a_width_ft: 12, b_length_ft: 12, b_width_ft: 10 },
      existing_surface: 'asphalt', slope: 'gentle', truck_access: 'yes', thickness: '5', base: 'gravel',
      reinforcement: 'rebar', finish: 'stamped', stamp_pattern: 'ashlar_slate', color: 'tan', border: 'stamped_border',
      sealer: true, drainage: 'slope_only', curb_cut: true, site_photos: ['00000000-0000-4000-8000-000000000002'] } },
    { name: 'backyard walkway, pump + steps + drain', version: 2, values: {
      purpose: 'walkway', placement: 'path_between', area: { shape: 'direct_sf', area_sf: 180 }, existing_surface: 'pavers_gravel',
      slope: 'steep', truck_access: 'no', thickness: '4', base: 'existing_ok', reinforcement: 'fiber',
      finish: 'exposed', color: 'charcoal', border: 'none', steps_count: 3, drainage: 'trench_drain', drain_lf: 12,
      site_photos: ['00000000-0000-4000-8000-000000000003'] } },
    { name: 'broom patio 12x16 on grass (v1, before placement)', version: 1, values: {
      purpose: 'patio', area: { shape: 'rect', length_ft: 16, width_ft: 12 }, existing_surface: 'grass_dirt',
      slope: 'flat', truck_access: 'yes', thickness: '4', base: 'gravel', reinforcement: 'wire_mesh',
      finish: 'broom', color: 'natural_gray', border: 'none', drainage: 'slope_only',
      site_photos: ['00000000-0000-4000-8000-000000000001'] } },
  ],
};
