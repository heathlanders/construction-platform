'use client';

// Blueprint Intelligence Hub — /projects/:id/blueprints
// Allows PM/Owner to start a template-based or PDF-based task analysis.

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const BUILDING_TYPES = [
  'residential_sf', 'residential_mf', 'commercial', 'industrial', 'pole_barn',
] as const;

type BuildingType = (typeof BUILDING_TYPES)[number];

// A scan-passed plan file — the blueprint on-ramp reads the `files` table
// (upload → quarantine → scan → live), not the orphaned `documents` table.
interface PlanFile {
  id: string;
  filename: string;
  status: string;
}

interface AnalysisSummary {
  id: string;
  status: 'pending' | 'processing' | 'review_ready' | 'imported' | 'failed';
  building_type: string;
  document_id: string | null;
  extracted_task_count: number | null;
  source: string | null;
  created_at: string;
}

const STATUS_CHIP: Record<AnalysisSummary['status'], string> = {
  pending:      'bg-slate-100 text-slate-700',
  processing:   'bg-blue-100 text-blue-800',
  review_ready: 'bg-green-100 text-green-800',
  imported:     'bg-indigo-100 text-indigo-800',
  failed:       'bg-red-100 text-red-800',
};

export default function BlueprintsPage({ params }: { params: { id: string } }) {
  const { t } = useTranslation('projects');
  const router = useRouter();
  const projectId = params.id;

  const [buildingType, setBuildingType] = useState<BuildingType>('residential_sf');
  const [documentId, setDocumentId]     = useState<string>('');
  const [files, setFiles]               = useState<PlanFile[] | null>(null);
  const [analyses, setAnalyses]         = useState<AnalysisSummary[] | null>(null);
  const [canWrite, setCanWrite]         = useState(false);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [uploadNote, setUploadNote]     = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadAnalyses() {
    try {
      const res = await fetch(`/api/v1/blueprints?project_id=${projectId}&limit=20`);
      if (!res.ok) { setAnalyses([]); return; }
      const data = await res.json() as { analyses: AnalysisSummary[] };
      setAnalyses(data.analyses);
    } catch {
      setAnalyses([]);
    }
  }

  // Scan-passed PDF plan files for the picker (files table, status='ready').
  async function loadFiles(): Promise<PlanFile[]> {
    try {
      const res = await fetch(`/api/files?project_id=${projectId}&status=ready&limit=100`);
      if (!res.ok) { setFiles([]); return []; }
      const data = await res.json() as { files: PlanFile[] };
      const pdfs = (data.files ?? [])
        .filter((f) => f.filename.toLowerCase().endsWith('.pdf'))
        .sort((a, b) => a.filename.localeCompare(b.filename));
      setFiles(pdfs);
      return pdfs;
    } catch {
      setFiles([]);
      return [];
    }
  }

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) void loadFiles();
    void loadAnalyses();
    // Client role for the delete affordance only — the API enforces regardless.
    void fetch('/api/auth/me').then(async (r) => {
      if (!r.ok || cancelled) return;
      const me = await r.json() as { role: string };
      if (!cancelled) setCanWrite(['owner', 'project_manager'].includes(me.role.toLowerCase()));
    }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleDeleteAnalysis(id: string) {
    if (!window.confirm(t('blueprints.history_delete_confirm'))) return;
    setDeletingId(id);
    setError(null);
    const res = await fetch(`/api/v1/blueprints/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: { message?: string } };
      setError(data.error?.message ?? t('blueprints.delete_failed'));
    } else {
      setAnalyses((prev) => (prev ?? []).filter((a) => a.id !== id));
    }
    setDeletingId(null);
  }

  // Re-analyze from history: re-run the same document + building type as a fresh analysis.
  async function handleReanalyze(a: AnalysisSummary) {
    setError(null);
    const body: Record<string, string> = { project_id: projectId, building_type: a.building_type };
    if (a.document_id) body.document_id = a.document_id;
    const res = await fetch('/api/v1/blueprints/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: { message?: string } };
      setError(data.error?.message ?? t('blueprints.error_unknown'));
      return;
    }
    const { analysis } = await res.json() as { analysis: { id: string } };
    router.push(`/projects/${projectId}/blueprints/${analysis.id}/review`);
  }

  async function handleStartAnalysis(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, string> = { project_id: projectId, building_type: buildingType };
      if (documentId) body.document_id = documentId;

      const res = await fetch('/api/v1/blueprints/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: { message?: string } };
        throw new Error(data.error?.message ?? 'Request failed');
      }

      const { analysis } = await res.json() as { analysis: { id: string } };
      router.push(`/projects/${projectId}/blueprints/${analysis.id}/review`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('blueprints.error_unknown'));
      setSubmitting(false);
    }
  }

  // Inline plan upload: quarantine PUT → scan → live. The file appears in the picker
  // once the scan promotes it to 'ready' (we poll the files list briefly).
  async function handleUploadPlan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadNote(null);
    setError(null);
    try {
      const initRes = await fetch('/api/files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          filename: file.name,
          content_type: file.type || 'application/pdf',
          file_size_bytes: file.size,
        }),
      });
      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(err.error?.message ?? t('blueprints.upload_failed'));
      }
      const { upload_url, file_id } = await initRes.json() as { upload_url: string; file_id: string };
      const putRes = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/pdf' },
        body: file,
      });
      if (!putRes.ok) throw new Error(t('blueprints.upload_failed'));

      setUploadNote(t('blueprints.upload_scanning'));
      // Poll the files list until the scan promotes this file to 'ready' (or give up).
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const pdfs = await loadFiles();
        if (pdfs.some((f) => f.id === file_id)) {
          setDocumentId(file_id);
          setUploadNote(null);
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('blueprints.upload_failed'));
      setUploadNote(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handlePreviewTemplate() {
    const res = await fetch(`/api/v1/blueprints/templates/${buildingType}`);
    const data = await res.json() as { total_tasks: number; label: string };
    alert(t('blueprints.preview_result', { label: data.label, count: data.total_tasks }));
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-ink mb-2">{t('blueprints.title')}</h1>
      <p className="text-muted mb-8">{t('blueprints.intro')}</p>

      <form onSubmit={handleStartAnalysis} className="space-y-6">
        {/* Building type selection */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            {t('blueprints.building_type')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {BUILDING_TYPES.map((bt) => (
              <button
                key={bt}
                type="button"
                onClick={() => setBuildingType(bt)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  buildingType === bt
                    ? 'border-brand-600 bg-brand-50 text-blue-900'
                    : 'border-line hover:border-line text-ink'
                }`}
              >
                <span className="font-medium text-sm">{t(`blueprints.building_types.${bt}`)}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handlePreviewTemplate}
            className="mt-2 text-sm text-brand-600 hover:underline"
          >
            {t('blueprints.preview_template')}
          </button>
        </div>

        {/* Optional blueprint document */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t('blueprints.document')}{' '}
            <span className="text-muted font-normal">{t('blueprints.document_optional')}</span>
          </label>
          {files === null ? (
            <p className="text-sm text-muted">{t('blueprints.document_loading')}</p>
          ) : files.length === 0 ? (
            <p className="text-sm text-muted rounded-md border border-line bg-surface-alt px-3 py-2">
              {t('blueprints.document_empty')}
            </p>
          ) : (
            <select
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm focus:ring-brand-500 focus:border-blue-500"
            >
              <option value="">{t('blueprints.document_none')}</option>
              {files.map((f) => (
                <option key={f.id} value={f.id}>{f.filename}</option>
              ))}
            </select>
          )}

          {/* Inline upload — the on-ramp. Uploads a plan PDF into the scan pipeline. */}
          <div className="mt-2 flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              disabled={uploading}
              onChange={handleUploadPlan}
              className="text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-surface-alt file:text-ink hover:file:bg-surface-alt disabled:opacity-50"
            />
            {uploading && <span className="text-xs text-brand-600">{t('blueprints.uploading')}</span>}
          </div>
          {uploadNote && <p className="mt-1 text-xs text-amber-600">{uploadNote}</p>}
          <p className="mt-1 text-xs text-muted">{t('blueprints.document_help')}</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          {submitting ? t('blueprints.generating') : t('blueprints.generate')}
        </button>
      </form>

      {/* Previous analyses */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold text-ink mb-3">{t('blueprints.history_title')}</h2>
        {analyses === null ? (
          <p className="text-sm text-muted">{t('blueprints.document_loading')}</p>
        ) : analyses.length === 0 ? (
          <p className="text-sm text-muted">{t('blueprints.history_empty')}</p>
        ) : (
          <div className="rounded-lg border border-line divide-y divide-line overflow-hidden">
            {analyses.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 bg-surface">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_CHIP[a.status]}`}>
                  {t(`blueprints.history_status.${a.status}`)}
                </span>
                <div className="flex-1 min-w-0 text-sm text-ink">
                  <span className="font-medium">{t(`blueprints.building_types.${a.building_type}`, { defaultValue: a.building_type })}</span>
                  {a.source && <span className="text-muted"> · {t(`blueprints.source.${a.source}.label`, { defaultValue: a.source })}</span>}
                  {a.extracted_task_count != null && (
                    <span className="text-muted"> · {t('blueprints.history_tasks', { count: a.extracted_task_count })}</span>
                  )}
                  <span className="text-muted"> · {new Date(a.created_at).toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/projects/${projectId}/blueprints/${a.id}/review`)}
                  className="text-sm text-brand-600 hover:underline flex-shrink-0"
                >
                  {t('blueprints.history_open')}
                </button>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => void handleReanalyze(a)}
                    className="text-sm text-muted hover:text-brand-600 flex-shrink-0"
                    title={t('blueprints.history_reanalyze_help')}
                  >
                    {t('blueprints.history_reanalyze')}
                  </button>
                )}
                {canWrite && a.status !== 'imported' && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteAnalysis(a.id)}
                    disabled={deletingId === a.id}
                    className="text-sm text-muted hover:text-red-600 disabled:opacity-50 flex-shrink-0"
                  >
                    {deletingId === a.id ? t('blueprints.history_deleting') : t('blueprints.history_delete')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 rounded-lg bg-surface-alt border border-line p-5">
        <h2 className="text-sm font-semibold text-ink mb-2">{t('blueprints.how_title')}</h2>
        <ol className="space-y-2 text-sm text-muted list-decimal list-inside">
          <li>{t('blueprints.how_1')}</li>
          <li>{t('blueprints.how_2')}</li>
          <li>{t('blueprints.how_3')}</li>
          <li>{t('blueprints.how_4')}</li>
        </ol>
      </div>
    </div>
  );
}
