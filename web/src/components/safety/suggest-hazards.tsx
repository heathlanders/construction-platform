'use client';

// SuggestHazards — JSA hazard suggestions from Trade Knowledge Packs (Doc 23, Wave S1).
// Finds the trades of the project's schedule tasks active on the JSA date (planned window or
// in progress), asks GET /api/v1/trades/hazards?keys=…&lang= and lets the user add any hazard to
// the JSA. Added hazards keep provenance (osha_ref, hazard_id, pack_version, source:'pack').
// Spanish safety text without a professional translation comes back null → shown in English with
// an "English only" chip (T-08).

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface SuggestedHazard {
  description: string;
  controls: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  osha_ref?: string;
  hazard_id?: string;
  pack_version?: string;
  source?: 'pack' | 'manual';
  ppe?: string[];
}

interface ApiHazard {
  hazard_id: string; trade: string; pack_version: string;
  hazard: string | null; hazard_en: string; controls: string | null; controls_en: string[];
  osha_ref: string; severity: number; severity_label: SuggestedHazard['severity']; ppe: string[]; es_pending: boolean;
}
interface TaskRow { trade_type: string | null; status: string; planned_start: string | null; planned_end: string | null }

const MAX_KEYS = 20;

/** Trades working on `day` (YYYY-MM-DD): planned window covers it, or the task is in progress. */
export function tradesActiveOn(tasks: TaskRow[], day: string): string[] {
  const active = tasks.filter((t) => t.trade_type && (
    t.status === 'in_progress' ||
    (t.planned_start && t.planned_start.slice(0, 10) <= day && (t.planned_end ?? t.planned_start).slice(0, 10) >= day)
  ));
  return [...new Set(active.map((t) => t.trade_type as string))].slice(0, MAX_KEYS);
}

export function SuggestHazards({ projectId, day, existing, onAdd }: {
  projectId: string; day: string; existing: string[]; onAdd: (h: SuggestedHazard) => void;
}) {
  const { t, i18n } = useTranslation('safety');
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en';
  const [loading, setLoading] = useState(false);
  const [trades, setTrades] = useState<string[] | null>(null);
  const [items, setItems] = useState<ApiHazard[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const tr = await fetch(`/api/v1/schedule-tasks?project_id=${projectId}&limit=200`).then((r) => r.json());
      const keys = tradesActiveOn(tr.schedule_tasks ?? [], day);
      setTrades(keys);
      if (keys.length === 0) { setItems([]); return; }
      const hz = await fetch(`/api/v1/trades/hazards?keys=${encodeURIComponent(keys.join(','))}&lang=${lang}`).then((r) => r.json());
      setItems(hz.hazards ?? []);
    } catch {
      setError(t('jsa.suggest_failed'));
    } finally {
      setLoading(false);
    }
  }

  function add(h: ApiHazard) {
    onAdd({
      description: h.hazard ?? h.hazard_en,
      controls: h.controls ?? h.controls_en.join('; '),
      severity: h.severity_label,
      osha_ref: h.osha_ref, hazard_id: h.hazard_id, pack_version: h.pack_version, source: 'pack', ppe: h.ppe,
    });
  }

  return (
    <div className="rounded-lg border border-line p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted">{t('jsa.suggest_hint')}</p>
        <button type="button" onClick={load} disabled={loading} className="text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50 shrink-0">
          {loading ? t('jsa.suggest_loading') : t('jsa.suggest_hazards')}
        </button>
      </div>
      {error && <p className="text-xs text-status-danger">{error}</p>}
      {trades && trades.length === 0 && <p className="text-xs text-muted">{t('jsa.suggest_no_trades')}</p>}
      {trades && trades.length > 0 && items.length === 0 && !loading && <p className="text-xs text-muted">{t('jsa.suggest_none')}</p>}
      {items.length > 0 && (
        <ul className="space-y-1.5 max-h-80 overflow-y-auto">
          {items.map((h) => {
            const added = existing.includes(h.hazard_id);
            return (
              <li key={h.hazard_id} className="flex items-start justify-between gap-2 rounded border border-line px-2 py-1.5">
                <div className="min-w-0">
                  <p className="text-xs text-ink">{h.hazard ?? h.hazard_en}</p>
                  <p className="text-[10px] text-muted">{h.controls ?? h.controls_en.join('; ')}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-surface-alt text-muted text-[10px]">{h.trade.replace(/_/g, ' ')}</span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-alt text-muted text-[10px]">OSHA {h.osha_ref}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px]">{t(`jsa.severity_${h.severity_label}`)}</span>
                    {lang === 'es' && h.es_pending && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px]" title={t('jsa.es_pending_hint')}>{t('jsa.es_pending')}</span>
                    )}
                  </div>
                </div>
                <button type="button" disabled={added} onClick={() => add(h)} className="text-xs text-brand-600 hover:text-brand-700 font-medium disabled:text-muted shrink-0">
                  {added ? t('jsa.suggest_added') : t('jsa.suggest_add')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
