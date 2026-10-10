// hazard-suggestions.ts — JSA hazard suggestions from Trade Knowledge Packs (Doc 23, Wave S1).
// Trades active on the JSA day → GET /v1/trades/hazards. The last response per project/day/lang is
// cached in AsyncStorage (opt:hazards:*) so a safety officer with no signal still gets suggestions
// they loaded earlier. Spanish safety text without a professional translation arrives as null and is
// shown in English with an "English only" chip (T-08) — never machine-translated here.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi } from './api';
import type { JsaHazard } from '../models/JsaRecord';

export interface ApiHazard {
  hazard_id: string; trade: string; pack_version: string;
  hazard: string | null; hazard_en: string; controls: string | null; controls_en: string[];
  osha_ref: string; severity: number; severity_label: NonNullable<JsaHazard['severity']>; ppe: string[]; es_pending: boolean;
}
export interface TaskRow { trade_type: string | null; status: string; planned_start: string | null; planned_end: string | null }
export interface SuggestionResult { hazards: ApiHazard[]; trades: string[]; fromCache: boolean }

const MAX_KEYS = 20;

/** Trades working on `day` (YYYY-MM-DD): planned window covers it, or the task is in progress. Pure. */
export function tradesActiveOn(tasks: TaskRow[], day: string): string[] {
  const active = tasks.filter((t) => t.trade_type && (
    t.status === 'in_progress' ||
    (t.planned_start && t.planned_start.slice(0, 10) <= day && (t.planned_end ?? t.planned_start).slice(0, 10) >= day)
  ));
  return [...new Set(active.map((t) => t.trade_type as string))].slice(0, MAX_KEYS);
}

/** Map a suggestion to the JSA hazard shape, keeping provenance. Pure. */
export function toJsaHazard(h: ApiHazard): JsaHazard {
  return {
    description: h.hazard ?? h.hazard_en,
    controls: h.controls ?? h.controls_en.join('; '),
    severity: h.severity_label,
    osha_ref: h.osha_ref, hazard_id: h.hazard_id, pack_version: h.pack_version, source: 'pack', ppe: h.ppe,
  };
}

const cacheKey = (projectId: string, day: string, lang: string) => `opt:hazards:${projectId}:${day}:${lang}`;

export async function loadHazardSuggestions(projectId: string, day: string, lang: 'en' | 'es'): Promise<SuggestionResult> {
  try {
    const tr = await mobileApi<{ schedule_tasks: TaskRow[] }>(`/schedule-tasks?project_id=${projectId}&limit=200`);
    const trades = tradesActiveOn(tr.schedule_tasks ?? [], day);
    let hazards: ApiHazard[] = [];
    if (trades.length > 0) {
      const res = await mobileApi<{ hazards: ApiHazard[] }>(`/trades/hazards?keys=${encodeURIComponent(trades.join(','))}&lang=${lang}`);
      hazards = res.hazards ?? [];
    }
    const result = { hazards, trades, fromCache: false };
    await AsyncStorage.setItem(cacheKey(projectId, day, lang), JSON.stringify(result)).catch(() => {});
    return result;
  } catch (err) {
    const raw = await AsyncStorage.getItem(cacheKey(projectId, day, lang)).catch(() => null);
    if (raw) {
      try { return { ...(JSON.parse(raw) as SuggestionResult), fromCache: true }; } catch { /* fall through */ }
    }
    throw err;
  }
}
