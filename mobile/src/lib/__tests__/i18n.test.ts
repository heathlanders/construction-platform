// i18n key-integrity test — Mobile Enterprise Plan §C1.
//
// WHY THIS EXISTS: the first mobile build crashed at bundle load because an augmentation block
// wrote a key onto an undefined parent (`projects.actions.x = …` where `projects.actions` is
// undefined) — a TypeError thrown at top-level module eval, below the React ErrorBoundary, NOT
// caught by `expo export`. See the i18n skill. Importing the module here re-runs that exact
// top-level code, so a re-introduction of the flat-vs-nested bug fails CI before it ships.

import i18n from '../i18n';

// Must match the `ns` array in lib/i18n.ts init.
const NAMESPACES = [
  'common', 'projects', 'field', 'safety', 'rfi', 'documents', 'notifications',
  'trade-electrical', 'trade-plumbing', 'warranties', 'permits', 'structural',
  'tasks', 'settings', 'inspections', 'safety_certs', 'submittals', 'milestones', 'jsa',
  'whatsnew', 'crew', 'notif_prefs', 'profile', 'nearme', 'connections',
];

function flatten(obj: unknown, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries((obj ?? {}) as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

describe('i18n resource integrity', () => {
  it('module loaded without throwing (flat-key augmentation guard)', () => {
    // If the module threw at eval, the import above fails the whole file. This also asserts the
    // instance initialised.
    expect(i18n).toBeDefined();
    expect(typeof (i18n as any).getResourceBundle).toBe('function');
  });

  it.each(NAMESPACES)('namespace "%s" exists in both en and es', (ns) => {
    expect((i18n as any).getResourceBundle('en', ns)).toBeDefined();
    expect((i18n as any).getResourceBundle('es', ns)).toBeDefined();
  });

  it.each(NAMESPACES)('namespace "%s" has an ES translation for every EN key', (ns) => {
    const en = flatten((i18n as any).getResourceBundle('en', ns));
    const es = flatten((i18n as any).getResourceBundle('es', ns));
    const missing = Object.keys(en).filter((k) => !(k in es));
    expect(missing).toEqual([]);
  });

  it('the historically-crashing flat keys resolve (projects actions.*)', () => {
    const en = (i18n as any).getResourceBundle('en', 'projects');
    for (const k of ['actions.permits', 'actions.structural', 'actions.tasks', 'actions.inspections']) {
      expect(en[k]).toBeTruthy();
    }
  });
});
