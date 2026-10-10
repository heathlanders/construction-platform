// intake/prompt.ts — deterministic image prompt from a spec.
//
// Built ONLY from module-authored data (scene + option/boolean `prompt` fragments). Client free text,
// AI reasons and photo text never reach it (prompt-injection boundary). Same spec ⇒ same prompt, so a
// render can be re-derived from its stored spec_snapshot.

import { handlerFor } from './fields.js';
import { allFields, isFieldVisible } from './spec.js';
import type { SpecValues, TradeIntakeModule } from './types.js';

export const PROMPT_MAX_LEN = 900;
const SAFE_FRAGMENT = /^[A-Za-z0-9 ,.'"()\-/&:%+]*$/;

/** Fragment hygiene shared with the guard tests: printable, single-line, no instructions-looking text. */
export function isSafeFragment(s: string): boolean {
  return SAFE_FRAGMENT.test(s) && s.length <= 200;
}

export function compilePrompt(module: TradeIntakeModule, values: SpecValues): string {
  const byId = new Map(allFields(module.steps).map((x) => [x.field.id, x.field]));
  const parts: string[] = [];
  for (const id of module.prompt.order) {
    const def = byId.get(id);
    const v = values[id];
    if (!def || v === undefined || !isFieldVisible(module.steps, id, values)) continue;
    const frag = handlerFor(def).promptFragment(def, v);
    if (frag && isSafeFragment(frag)) parts.push(frag);
  }
  // One sentence: "<scene>: feature, feature, …. <suffix>" — reads naturally for any trade.
  const scene = module.prompt.scene.replace(/[.:\s]+$/, '');
  const suffix = module.prompt.suffix ?? 'Photorealistic, same camera angle, keep the house, yard and surroundings unchanged.';
  const out = `${parts.length ? `${scene}: ${parts.join(', ')}` : scene}. ${suffix}`.replace(/\s+/g, ' ').trim();
  return out.length > PROMPT_MAX_LEN ? out.slice(0, PROMPT_MAX_LEN) : out;
}
