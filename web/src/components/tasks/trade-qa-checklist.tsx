'use client';

// TradeQaChecklist — the trade's QA checklist from its Trade Knowledge Pack (Doc 23, Wave S1).
// GET /api/v1/trades/:trade/knowledge?lang= (static, cached). Items for the task's phase are shown
// first. Spanish safety text that is still waiting for a professional translator comes back as
// null — we then show the English text with an "English only" chip; never English dressed as Spanish.
// Read-only checkboxes for now (persisting completion needs a table — later wave).

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface QaItem { id: string; phase: string | null; item: string | null; item_en: string; es_pending: boolean }
interface Knowledge { key: string; pack_version: string; status: string; qa_checklist: QaItem[] }

export function TradeQaChecklist({ tradeType, phase }: { tradeType: string | null; phase: string | null }) {
  const { t, i18n } = useTranslation('projects');
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en';
  const [k, setK] = useState<Knowledge | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setK(null);
    if (!tradeType) return;
    fetch(`/api/v1/trades/${encodeURIComponent(tradeType)}/knowledge?lang=${lang}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setK(d?.knowledge ?? null))
      .catch(() => setK(null));
  }, [tradeType, lang]);

  if (!k || k.qa_checklist.length === 0) return null;
  const items = [...k.qa_checklist].sort((a, b) => Number(b.phase === phase) - Number(a.phase === phase));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">{t('task_detail.qa_checklist')}</h3>
        {k.status !== 'reviewed' && (
          <span className="text-[10px] text-gray-400" title={t('task_detail.qa_draft_hint')}>{t('task_detail.qa_draft')}</span>
        )}
      </div>
      <ul className="space-y-1.5">
        {items.map((q) => (
          <li key={q.id} className="flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={!!checked[q.id]}
              onChange={(e) => setChecked((c) => ({ ...c, [q.id]: e.target.checked }))}
              aria-label={q.item ?? q.item_en}
            />
            <div className="min-w-0">
              <p className="text-xs text-gray-700">{q.item ?? q.item_en}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {q.phase && q.phase === phase && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px]">{t('task_detail.qa_this_phase')}</span>
                )}
                {lang === 'es' && q.es_pending && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px]" title={t('task_detail.es_pending_hint')}>{t('task_detail.es_pending')}</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-gray-400 mt-1.5">{t('task_detail.qa_not_saved')}</p>
    </div>
  );
}
