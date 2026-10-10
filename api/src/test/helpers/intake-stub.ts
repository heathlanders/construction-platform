// helpers/intake-stub.ts — a TEST-ONLY intake module (fencing) that exercises every field type, a
// visibility chain, and a v1→v2 upgrade, so the framework + guard suite are proven independently of
// any shipped trade. Not registered — production never sees it.

import type { TradeIntakeModule } from '../../lib/intake/types.js';

export const stubFencing: TradeIntakeModule = {
  trade_key: 'fencing',
  intake_version: 2,
  entry_points: [
    { id: 'stub_privacy_fence', label: { en: 'Privacy fence', es: 'Cerca de privacidad' },
      keywords: { en: ['privacy fence'], es: ['cerca de privacidad'] }, preset: { style: 'privacy' } },
  ],
  location: 'exterior',
  disturbs_ground: true,
  capabilities: { priced: true, renderable: true, photo_assess: true },
  steps: [
    {
      id: 'layout', title: { en: 'Layout', es: 'Trazado' },
      fields: [
        { id: 'run', type: 'linear', required: true, min_lf: 8, max_lf: 2000, ai_assessable: true,
          label: { en: 'Fence length', es: 'Largo de la cerca' } },
        { id: 'yard', type: 'area', shapes: ['rect', 'direct_sf'], min_sf: 50, max_sf: 50_000,
          label: { en: 'Yard size', es: 'Tamaño del patio' } },
        { id: 'gates', type: 'count', min: 0, max: 10, label: { en: 'Gates', es: 'Portones' } },
        { id: 'height', type: 'number', unit: 'ft', min: 3, max: 8, step: 0.5, default: 6,
          label: { en: 'Height', es: 'Altura' } },
      ],
    },
    {
      id: 'style', title: { en: 'Style', es: 'Estilo' },
      fields: [
        { id: 'style', type: 'choice', required: true, ai_suggestible: true, label: { en: 'Style', es: 'Estilo' },
          options: [
            { value: 'privacy', label: { en: 'Privacy', es: 'Privacidad' }, prompt: 'solid wood privacy fence' },
            { value: 'picket', label: { en: 'Picket', es: 'Estacas' }, prompt: 'white picket fence' },
          ] },
        { id: 'stain', type: 'boolean', prompt_true: 'stained dark brown', visible_when: [{ field: 'style', in: ['privacy'] }],
          label: { en: 'Stain it?', es: '¿Teñirla?' } },
        { id: 'extras', type: 'multichoice', ai_suggestible: true, label: { en: 'Extras', es: 'Adicionales' },
          options: [
            { value: 'post_caps', label: { en: 'Post caps', es: 'Tapas de postes' }, prompt: 'decorative post caps' },
            { value: 'lattice', label: { en: 'Lattice top', es: 'Celosía superior' }, prompt: 'lattice top' },
          ] },
        { id: 'photos', type: 'photo', role: 'yard', min: 1, max: 6, label: { en: 'Yard photos', es: 'Fotos del patio' } },
        { id: 'notes', type: 'text', max_len: 300, label: { en: 'Notes', es: 'Notas' } },
      ],
    },
  ],
  catalog_codes: ['B-FENCE-LF', 'B-FENCE-GATE'],
  derive: (v) => ({ run_lf: typeof v.run === 'number' ? v.run : 0 }),
  scopeToQuantities: (v, d) => [
    { assembly_code: 'B-FENCE-LF', quantity: d.run_lf ?? 0, assumptions: ['stub'] },
    { assembly_code: 'B-FENCE-GATE', quantity: typeof v.gates === 'number' ? v.gates : 0 },
  ],
  prompt: { scene: 'A backyard with a new fence', order: ['style', 'stain', 'extras'] },
  permit_rule: (v) => (typeof v.height === 'number' && v.height > 6 ? 'likely' : 'depends'),
  requirements: () => [{
    id: 'property_line', level: 'likely', owner: 'client', source: 'fencing',
    title: { en: 'Know your property line', es: 'Conozca el límite de su propiedad' },
    body: { en: 'Fences must sit on your side of the line.', es: 'La cerca debe quedar de su lado del límite.' },
  }],
  // v1 called the style field `kind`.
  upgrades: { 1: (old) => { const { kind, ...rest } = old as Record<string, never>; return kind ? { ...rest, style: kind } : rest; } },
  fixtures: [
    { name: 'privacy 120ft', version: 2, values: { run: 120, gates: 1, style: 'privacy', stain: true } },
    { name: 'picket 40ft', version: 2, values: { run: 40, gates: 0, style: 'picket', extras: ['post_caps'] } },
    { name: 'tall privacy', version: 2, values: { run: 300, height: 8, gates: 2, style: 'privacy' } },
    { name: 'v1 kind', version: 1, values: { run: 60, kind: 'picket' } },
  ],
};
