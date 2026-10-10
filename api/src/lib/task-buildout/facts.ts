// task-buildout/facts.ts — aggregate a blueprint analysis into BlueprintFacts the engine can use.
//
// Reads what the extraction actually persists: blueprint_analyses.import_metadata (flags, fixture_types,
// *_extracted counts) + the analysis's proposed-task titles (to recover components + panel amperage that
// aren't stored as structured rows). Defensive — any missing key degrades to the empty default, so
// manual/legacy tasks simply get generic (non-parameterized) steps.

import type { PoolClient } from 'pg';
import { EMPTY_FACTS, type BlueprintFacts } from './types.js';

// Title-scan FALLBACK only — used for manual/legacy analyses whose import_metadata has no
// structured `components` array (extraction-derived analyses now persist components directly).
// Every token here MUST be in the canonical COMPONENT_TOKENS vocabulary (parse-sheets.ts) so the
// engine's component branches actually fire on them. asphalt_shingle/spray_foam were removed —
// no extractor emits them, so their engine branches were dead.
const COMPONENT_KEYWORDS: { re: RegExp; token: string }[] = [
  { re: /truss/i, token: 'engineered_trusses' },
  { re: /\b(i[- ]?joist|tji)\b/i, token: 'i_joists' },
  { re: /\blvl\b|laminated veneer/i, token: 'lvl_beam' },
  { re: /metal roof/i, token: 'metal_roofing' },
  { re: /\bbatt\b/i, token: 'batt_insulation' },
  { re: /concrete footing|footing/i, token: 'concrete_footing' },
];

/** Aggregate facts for an analysis. Returns EMPTY_FACTS if the analysis is absent. */
export async function buildBlueprintFacts(analysisId: string, client: PoolClient): Promise<BlueprintFacts> {
  const { rows } = await client.query(
    `SELECT import_metadata FROM blueprint_analyses WHERE id = $1 AND deleted_at IS NULL`,
    [analysisId],
  );
  if (rows.length === 0) return { ...EMPTY_FACTS };
  const meta = (rows[0].import_metadata ?? {}) as Record<string, unknown>;

  const flags = (meta.flags ?? {}) as BlueprintFacts['flags'];
  const fixtureTypes = Array.isArray(meta.fixture_types) ? (meta.fixture_types as string[]) : [];

  // Prefer the structured facts the extraction persisted (worker writes import_metadata.components
  // and import_metadata.panels). Only when they're absent (manual/legacy analyses) reconstruct
  // from the proposed-task titles as a fallback.
  let components: string[];
  let panels: BlueprintFacts['panels'];
  const metaComponents = Array.isArray(meta.components) ? (meta.components as string[]) : null;
  const metaPanels = Array.isArray(meta.panels) ? (meta.panels as { amperage: number | null }[]) : null;

  if (metaComponents || metaPanels) {
    components = metaComponents ?? [];
    panels = (metaPanels ?? []).map((p) => ({ amperage: p.amperage ?? null, location: null }));
  } else {
    const { rows: taskRows } = await client.query(
      `SELECT title, description FROM blueprint_proposed_tasks WHERE analysis_id = $1`,
      [analysisId],
    );
    const text = taskRows.map((t: { title: string; description: string | null }) =>
      `${t.title} ${t.description ?? ''}`).join('\n');
    components = COMPONENT_KEYWORDS.filter((k) => k.re.test(text)).map((k) => k.token);
    panels = [];
    const ampMatch = text.match(/(\d{2,4})\s*A\b/);
    if (ampMatch) panels.push({ amperage: Number(ampMatch[1]), location: null });
  }

  return {
    panels,
    fixtures: fixtureTypes.map((type) => ({ type, count: null })),
    rooms: [],
    window_count: Number(meta.windows_extracted ?? 0),
    door_count: Number(meta.doors_extracted ?? 0),
    components,
    flags,
  };
}
