'use client';

// Blueprint Task Review — /projects/:id/blueprints/:analysisId/review
// Shows proposed tasks grouped by phase. User accepts/rejects/edits, then imports.

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { TRADE_BADGE_CLASSES as TRADE_COLORS } from '@/lib/colors';

type ReviewStatus = 'pending' | 'accepted' | 'rejected' | 'modified';

interface ProposedTask {
  id: string;
  title: string;
  description: string | null;
  trade_type: string;
  phase: string;
  csi_division: string;
  estimated_duration_days: number;
  review_status: ReviewStatus;
}

interface Analysis {
  id: string;
  status: string;
  building_type: string;
  extracted_task_count: number;
  import_metadata: {
    trades_found: string[];
    phases_found: string[];
    source?: 'template' | 'text_extraction' | 'ocr_extraction' | 'vision' | 'template_fallback' | 'template_scanned_fallback';
    progress?:
      | { stage: 'extracting' }
      | { stage: 'ocr'; page: number; page_count: number }
      | { stage: 'vision'; page: number; page_count: number }
      | { stage: 'building_tasks' };
    vision?: {
      augmented: boolean;
      model?: string;
      pages_analyzed?: number;
      pages_selected?: number;
    } | null;
    tier_note?: string;
    failure?: { reason?: string } | null;
    sheet_count?: number;
    panels_extracted?: number;
    windows_extracted?: number;
    doors_extracted?: number;
    rooms_extracted?: number;
    fixture_types?: string[];
    components?: string[];
    flags?: Record<string, boolean | string | null>;
    title_block?: {
      drafter_firm?: string | null;
      builder_name?: string | null;
      city?: string | null;
      state?: string | null;
    } | null;
    location_suggestion?: {
      suggested_project_name?: string | null;
      street_address?: string | null;
      lot_number?: string | null;
      city?: string | null;
    } | null;
  } | null;
}

const SOURCE_CHIP_CLS: Record<string, string> = {
  template:                  'bg-slate-100 text-slate-700 border-slate-200',
  text_extraction:           'bg-blue-100 text-blue-800 border-brand-100',
  ocr_extraction:            'bg-teal-100 text-teal-800 border-teal-200',
  vision:                    'bg-violet-100 text-violet-800 border-violet-200',
  template_fallback:         'bg-amber-100 text-amber-800 border-amber-200',
  template_scanned_fallback: 'bg-amber-100 text-amber-800 border-amber-200',
};

// Canonical phase display order (labels come from the overview.phase_labels i18n map).
const PHASE_ORDER = [
  'site_prep', 'foundation', 'framing', 'roofing', 'rough_in', 'inspections',
  'insulation', 'drywall', 'finishes_interior', 'finishes_exterior',
  'sitework', 'commissioning', 'punch',
];


export default function BlueprintReviewPage({
  params,
}: {
  params: { id: string; analysisId: string };
}) {
  const { t } = useTranslation('projects');
  const router = useRouter();
  const { id: projectId, analysisId } = params;

  const [analysis, setAnalysis]   = useState<Analysis | null>(null);
  const [tasks, setTasks]         = useState<ProposedTask[]>([]);
  const [filterTrade, setFilterTrade] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [importing, setImporting] = useState(false);
  const [polling, setPolling]     = useState(false);
  const [failed, setFailed]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [renameEnabled, setRenameEnabled] = useState(false);
  const [projectName, setProjectName]     = useState('');
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editTitle, setEditTitle]         = useState('');
  const [editDesc, setEditDesc]           = useState('');

  // ── Fetch analysis status ───────────────────────────────────────────────────
  const fetchAnalysis = useCallback(async () => {
    const res = await fetch(`/api/v1/blueprints/${analysisId}`);
    if (!res.ok) return;
    const data = await res.json() as { analysis: Analysis };
    setAnalysis(data.analysis);
    return data.analysis.status;
  }, [analysisId]);

  // ── Fetch tasks (follow the cursor — sets >100 tasks must not clip) ─────────
  const fetchTasks = useCallback(async () => {
    const all: ProposedTask[] = [];
    let cursor: string | null = null;
    do {
      const params = new URLSearchParams({ limit: '100' });
      if (filterTrade) params.set('trade_type', filterTrade);
      if (filterPhase) params.set('phase', filterPhase);
      if (cursor) params.set('cursor', cursor);
      const res = await fetch(`/api/v1/blueprints/${analysisId}/tasks?${params}`);
      if (!res.ok) return;
      const data = await res.json() as {
        tasks: ProposedTask[];
        pagination?: { has_more: boolean; next_cursor: string | null };
      };
      all.push(...data.tasks);
      cursor = data.pagination?.has_more ? data.pagination.next_cursor : null;
    } while (cursor);
    setTasks(all);
  }, [analysisId, filterTrade, filterPhase]);

  // ── Poll until review_ready ─────────────────────────────────────────────────
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    async function poll() {
      setPolling(true);
      const status = await fetchAnalysis();
      if (status === 'review_ready' || status === 'imported') {
        setPolling(false);
        await fetchTasks();
      } else if (status === 'failed') {
        setPolling(false);
        setFailed(true);
      } else {
        timerId = setTimeout(poll, 3000);
      }
    }

    void poll();
    return () => clearTimeout(timerId);
  }, [fetchAnalysis, fetchTasks]);

  useEffect(() => {
    if (analysis?.status === 'review_ready' || analysis?.status === 'imported') {
      void fetchTasks();
    }
  }, [analysis?.status, fetchTasks]);

  // ── Initialize rename suggestion from blueprint title block ──────────────────
  const suggestedName = analysis?.import_metadata?.location_suggestion?.suggested_project_name ?? '';
  useEffect(() => {
    if (suggestedName.trim()) {
      setProjectName(suggestedName);
      setRenameEnabled(true);
    } else {
      setRenameEnabled(false);
    }
  }, [suggestedName]);

  // ── Task review actions ─────────────────────────────────────────────────────
  async function updateTask(taskId: string, updates: Partial<ProposedTask>) {
    const res = await fetch(`/api/v1/blueprints/${analysisId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return;
    const data = await res.json() as { task: ProposedTask };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
  }

  function toggleTask(taskId: string, current: ReviewStatus) {
    const next: ReviewStatus = current === 'accepted' ? 'rejected' : 'accepted';
    void updateTask(taskId, { review_status: next });
  }

  function startEdit(task: ProposedTask) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description ?? '');
  }
  async function saveEdit(taskId: string) {
    const title = editTitle.trim();
    if (!title) return;
    await updateTask(taskId, { title, description: editDesc.trim() || null });
    setEditingId(null);
  }

  // Bulk accept/reject via ONE server endpoint (was N parallel PATCHes with swallowed errors).
  async function bulkReview(review_status: 'accepted' | 'rejected') {
    setError(null);
    const res = await fetch(`/api/v1/blueprints/${analysisId}/tasks/bulk-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_status }),  // no task_ids → all currently-pending
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: { message?: string } };
      setError(data.error?.message ?? t('blueprints.import_failed'));
      return;
    }
    // Reflect locally — every pending task takes the new status.
    setTasks((prev) => prev.map((task) => (task.review_status === 'pending' ? { ...task, review_status } : task)));
  }

  async function handleImport() {
    setImporting(true);
    setError(null);
    const body: { project_name?: string } = {};
    if (renameEnabled && projectName.trim()) {
      body.project_name = projectName.trim();
    }
    const res = await fetch(`/api/v1/blueprints/${analysisId}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json() as { error?: { message?: string } };
      setError(data.error?.message ?? t('blueprints.import_failed'));
      setImporting(false);
      return;
    }
    const result = await res.json() as { imported_count: number; dependency_count?: number; step_count?: number };
    const q = new URLSearchParams({
      imported: String(result.imported_count),
      deps: String(result.dependency_count ?? 0),
      steps: String(result.step_count ?? 0),
    });
    router.push(`/projects/${projectId}/schedule?${q}`);
  }

  // Delete a failed/abandoned run and return to the hub to start over.
  async function handleDeleteAndStartOver() {
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/v1/blueprints/${analysisId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: { message?: string } };
      setError(data.error?.message ?? t('blueprints.delete_failed'));
      setDeleting(false);
      return;
    }
    router.push(`/projects/${projectId}/blueprints`);
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const acceptedCount = tasks.filter((t) => t.review_status === 'accepted').length;
  const pendingCount  = tasks.filter((t) => t.review_status === 'pending').length;
  const groupedByPhase = tasks.reduce<Record<string, ProposedTask[]>>((acc, t) => {
    (acc[t.phase] ??= []).push(t);
    return acc;
  }, {});
  const orderedPhases = PHASE_ORDER.filter((p) => groupedByPhase[p]?.length > 0);
  const allTrades = [...new Set(tasks.map((t) => t.trade_type))].sort();
  const allPhases = [...new Set(tasks.map((t) => t.phase))];
  const phaseLabel = (p: string) => t(`overview.phase_labels.${p}`, { defaultValue: p });
  const source = analysis?.import_metadata?.source;
  const isImported = analysis?.status === 'imported';
  const meta = analysis?.import_metadata;
  const activeFlags = meta?.flags ? Object.entries(meta.flags).filter(([, v]) => v === true).map(([k]) => k) : [];
  const tb = meta?.title_block;
  const tbLocation = [tb?.city, tb?.state].filter(Boolean).join(', ');

  // ── Render ────────────────────────────────────────────────────────────────
  if (polling || analysis?.status === 'processing' || analysis?.status === 'pending') {
    const progress = analysis?.import_metadata?.progress;
    let detail: string | null = null;
    let pct: number | null = null;
    if (progress?.stage === 'extracting') {
      detail = t('blueprints.progress_extracting');
    } else if (progress?.stage === 'ocr') {
      detail = progress.page === 0
        ? t('blueprints.progress_ocr_start', { page_count: progress.page_count })
        : t('blueprints.progress_ocr', { page: progress.page, page_count: progress.page_count });
      pct = progress.page_count > 0 ? Math.round((progress.page / progress.page_count) * 100) : null;
    } else if (progress?.stage === 'vision') {
      detail = t('blueprints.progress_vision', { page: progress.page, page_count: progress.page_count });
      pct = progress.page_count > 0 ? Math.round((progress.page / progress.page_count) * 100) : null;
    } else if (progress?.stage === 'building_tasks') {
      detail = t('blueprints.progress_building');
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" aria-live="polite" aria-busy="true">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted">{detail ?? t('blueprints.polling')}</p>
        {pct != null && (
          <div className="w-64">
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted text-center mt-2">{t('blueprints.polling_ocr_note')}</p>
          </div>
        )}
      </div>
    );
  }

  if (failed) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 space-y-4">
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-700">
          {t('blueprints.failed')}
        </div>
        {analysis?.import_metadata?.failure?.reason && (
          <div className="rounded-md bg-surface-alt border border-line p-3 text-sm text-muted">
            {t('blueprints.failed_reason', { reason: analysis.import_metadata.failure.reason })}
          </div>
        )}
        {error && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">{error}</div>
        )}
        <button
          onClick={() => void handleDeleteAndStartOver()}
          disabled={deleting}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? t('blueprints.deleting') : t('blueprints.delete_start_over')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">{t('blueprints.review_title')}</h1>
            {source && SOURCE_CHIP_CLS[source] && (
              <span
                title={t(`blueprints.source.${source}.tip`)}
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${SOURCE_CHIP_CLS[source]}`}
              >
                {t(`blueprints.source.${source}.label`)}
              </span>
            )}
            {meta?.vision?.augmented && (
              <span
                title={t('blueprints.vision_chip.tip')}
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${SOURCE_CHIP_CLS.vision}`}
              >
                {t('blueprints.vision_chip.label')}
              </span>
            )}
          </div>
          <p className="text-muted mt-1">
            {t('blueprints.summary', { total: tasks.length, accepted: acceptedCount, pending: pendingCount })}
            {analysis?.import_metadata?.sheet_count != null &&
              t('blueprints.summary_sheets', { count: analysis.import_metadata.sheet_count })}
          </p>
          {analysis?.import_metadata?.tier_note && (
            <p className="text-amber-700 text-sm mt-2 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 inline-block">
              {analysis.import_metadata.tier_note}
            </p>
          )}
        </div>
        {!isImported && (
          <div className="flex gap-3">
            <button
              onClick={() => void bulkReview('rejected')}
              disabled={pendingCount === 0}
              className="px-4 py-2 text-sm border border-line rounded-lg hover:bg-surface-alt disabled:opacity-40"
            >
              {t('blueprints.reject_all', { count: pendingCount })}
            </button>
            <button
              onClick={() => void bulkReview('accepted')}
              disabled={pendingCount === 0}
              className="px-4 py-2 text-sm border border-line rounded-lg hover:bg-surface-alt disabled:opacity-40"
            >
              {t('blueprints.accept_all', { count: pendingCount })}
            </button>
            <button
              onClick={() => void handleImport()}
              disabled={acceptedCount === 0 || importing}
              className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-40"
            >
              {importing ? t('blueprints.importing') : t('blueprints.import_count', { count: acceptedCount })}
            </button>
          </div>
        )}
      </div>

      {/* Imported — read-only banner (B3.1): controls are locked, tasks already on the schedule. */}
      {isImported && (
        <div className="rounded-md bg-indigo-50 border border-indigo-200 px-4 py-3 mb-6 text-sm text-indigo-800 flex items-center justify-between gap-3">
          <span>{t('blueprints.imported_banner')}</span>
          <button
            onClick={() => router.push(`/projects/${projectId}/schedule`)}
            className="text-indigo-700 underline whitespace-nowrap hover:text-indigo-900"
          >
            {t('blueprints.view_schedule')}
          </button>
        </div>
      )}

      {/* Extraction summary (B3.2) — what the parse actually found, so a PM can sanity-check. */}
      {meta && (source === 'text_extraction' || source === 'ocr_extraction') && (
        <div className="rounded-lg border border-line bg-surface-alt px-4 py-3 mb-6 text-sm">
          <p className="font-medium text-ink mb-2">{t('blueprints.extract.title')}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted">
            {meta.sheet_count != null && <span>{t('blueprints.extract.sheets', { count: meta.sheet_count })}</span>}
            {meta.panels_extracted != null && <span>{t('blueprints.extract.panels', { count: meta.panels_extracted })}</span>}
            {meta.windows_extracted != null && <span>{t('blueprints.extract.windows', { count: meta.windows_extracted })}</span>}
            {meta.doors_extracted != null && <span>{t('blueprints.extract.doors', { count: meta.doors_extracted })}</span>}
            {meta.rooms_extracted != null && <span>{t('blueprints.extract.rooms', { count: meta.rooms_extracted })}</span>}
            {meta.fixture_types?.length ? <span>{t('blueprints.extract.fixtures', { count: meta.fixture_types.length })}</span> : null}
            {meta.components?.length ? <span>{t('blueprints.extract.components', { count: meta.components.length })}</span> : null}
          </div>
          {activeFlags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {activeFlags.map((f) => (
                <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-surface border border-line text-muted">{f}</span>
              ))}
            </div>
          )}
          {(tb?.drafter_firm || tb?.builder_name || tbLocation) && (
            <p className="mt-2 text-xs text-muted">
              {[tb?.drafter_firm, tb?.builder_name, tbLocation].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 mb-6 text-sm text-red-700">{error}</div>
      )}

      {/* Rename project suggestion */}
      {suggestedName.trim() && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={renameEnabled}
              onChange={(e) => setRenameEnabled(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-blue-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-blue-900">
              {t('blueprints.rename_label')}
            </span>
          </label>
          <div className="mt-2 pl-7">
            <input
              type="text"
              value={projectName}
              maxLength={255}
              disabled={!renameEnabled}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full max-w-md border border-brand-100 rounded-md px-3 py-1.5 text-sm bg-surface disabled:bg-surface-alt disabled:text-muted"
            />
            <p className="text-xs text-brand-700 mt-1">{t('blueprints.rename_help')}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterTrade}
          onChange={(e) => setFilterTrade(e.target.value)}
          className="border border-line rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">{t('blueprints.all_trades')}</option>
          {allTrades.map((tr) => <option key={tr} value={tr}>{tr}</option>)}
        </select>
        <select
          value={filterPhase}
          onChange={(e) => setFilterPhase(e.target.value)}
          className="border border-line rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">{t('blueprints.all_phases')}</option>
          {allPhases.map((p) => <option key={p} value={p}>{phaseLabel(p)}</option>)}
        </select>
      </div>

      {/* Task groups */}
      <div className="space-y-8">
        {orderedPhases.map((phase) => (
          <div key={phase}>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
              {phaseLabel(phase)} ({groupedByPhase[phase].length})
            </h2>
            <div className="rounded-lg border border-line divide-y divide-line overflow-hidden">
              {groupedByPhase[phase].map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${
                    task.review_status === 'rejected' ? 'bg-surface-alt opacity-60' :
                    task.review_status === 'accepted' ? 'bg-green-50' : 'bg-surface'
                  }`}
                >
                  {/* Accept toggle */}
                  <button
                    onClick={() => toggleTask(task.id, task.review_status)}
                    disabled={isImported}
                    aria-pressed={task.review_status === 'accepted'}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors disabled:opacity-60 ${
                      task.review_status === 'accepted'
                        ? 'bg-green-600 border-green-600 text-white'
                        : task.review_status === 'rejected'
                        ? 'border-line bg-surface-alt'
                        : 'border-gray-400'
                    }`}
                    title={task.review_status === 'accepted' ? t('blueprints.click_reject') : t('blueprints.click_accept')}
                  >
                    {task.review_status === 'accepted' && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Task info (inline-editable title + description) */}
                  <div className="flex-1 min-w-0">
                    {editingId === task.id ? (
                      <div className="space-y-2">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full border border-line rounded-md px-2 py-1 text-sm"
                          aria-label={t('blueprints.edit_title')}
                        />
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          rows={2}
                          placeholder={t('blueprints.edit_description')}
                          className="w-full border border-line rounded-md px-2 py-1 text-xs"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => void saveEdit(task.id)} className="text-xs px-2 py-1 bg-brand-600 text-white rounded">
                            {t('blueprints.edit_save')}
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 border border-line rounded">
                            {t('blueprints.edit_cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-ink text-sm">{task.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRADE_COLORS[task.trade_type] ?? 'bg-surface-alt text-ink'}`}>
                            {task.trade_type}
                          </span>
                          <span className="text-xs text-muted">{task.csi_division}</span>
                          {!isImported && (
                            <button
                              onClick={() => startEdit(task)}
                              className="text-xs text-muted hover:text-brand-600"
                              title={t('blueprints.edit')}
                            >
                              ✏️
                            </button>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted mt-1">{task.description}</p>
                        )}
                        <p className="text-xs text-muted mt-0.5">
                          {t('blueprints.est_days', { count: task.estimated_duration_days })}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Reject / restore (locked once imported) */}
                  {!isImported && task.review_status !== 'rejected' && (
                    <button
                      onClick={() => void updateTask(task.id, { review_status: 'rejected' })}
                      className="text-muted hover:text-red-500 text-xs flex-shrink-0"
                    >
                      {t('blueprints.remove')}
                    </button>
                  )}
                  {!isImported && task.review_status === 'rejected' && (
                    <button
                      onClick={() => void updateTask(task.id, { review_status: 'pending' })}
                      className="text-muted hover:text-muted text-xs flex-shrink-0"
                    >
                      {t('blueprints.restore')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom import bar */}
      {acceptedCount > 0 && !isImported && (
        <div className="sticky bottom-4 mt-8">
          <div className="bg-surface border border-line rounded-xl shadow-lg px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-ink font-medium">
              {t('blueprints.ready_to_import', { count: acceptedCount })}
            </p>
            <button
              onClick={() => void handleImport()}
              disabled={importing}
              className="bg-brand-600 text-white text-sm px-6 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {importing ? t('blueprints.importing') : t('blueprints.import_to_schedule')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
