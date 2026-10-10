'use client';

// TaskDetailPanel — rich task view/editor shared by the Project Overview slide-over and the
// dedicated task detail page. Fetches /api/projects/:id/schedule-tasks/:taskId/detail (task +
// resolved codes + live inspection status + dependencies + QA photos), renders an editable form
// (OWNER/PM), a Codes & Compliance panel, a QA photo gallery (field roles upload), and deps.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { groupByCategory, tradeDisplayLabel, useTradeTaxonomy } from '@/components/trades/use-trade-taxonomy';
import { TradeQaChecklist } from './trade-qa-checklist';

const PHASE_ORDER = [
  'site_prep', 'foundation', 'framing', 'roofing', 'rough_in', 'inspections',
  'insulation', 'drywall', 'finishes_interior', 'finishes_exterior', 'sitework', 'commissioning', 'punch',
];
const EDIT_ROLES = ['owner', 'project_manager'];
const PHOTO_ROLES = ['owner', 'project_manager', 'foreman', 'field_tech', 'safety_officer'];

const INSP_DOT: Record<string, string> = {
  passed: '#22c55e', failed: '#ef4444', requires_action: '#f59e0b',
  scheduled: '#3b82f6', not_created: '#cbd5e1',
};

interface Member { user_id: string; first_name: string; last_name: string; }
interface ComplianceStep {
  inspection_type: string; title: string; code_hint: string | null; csi_division: string;
  required: boolean; status: string; result: string | null; inspection_date: string | null;
  inspector_name: string | null; permit_id: string | null;
}
interface CodeRef { code_type: string; section: string; note?: string }
interface EquipmentNeed { type: string; category: string; reason: string; optional?: boolean }
interface TaskEquip extends EquipmentNeed { owned_count?: number; available_count?: number; asset_ids?: string[] }
interface WorkStep {
  id: string; step_order: number; title: string; instruction: string; detail: string | null;
  code_refs: CodeRef[]; tools: string[]; materials: string[]; safety: string[]; equipment?: EquipmentNeed[];
  gating_inspection_type: string | null; qa_check: string | null;
}
interface Codes {
  permit_trade: string; code_type: string; code_edition: string | null; nec_edition: string | null;
  jurisdiction_notes: string | null;
  ahj: { ahj_name: string; ahj_level: string; phone?: string } | null;
  compliance: ComplianceStep[]; task_code_refs: CodeRef[]; has_permit: boolean; task_scoped: boolean;
}
interface DepEdge { id: string; task_id: string; title: string; status: string; origin: string; }
interface Photo {
  id: string; caption: string | null; photo_type: string; download_url: string | null;
  first_name: string | null; last_name: string | null; uploaded_by: string | null;
}
interface TaskRow {
  id: string; project_id: string; title: string; description: string | null; status: string;
  percent_complete: number; planned_start: string | null; planned_end: string | null;
  actual_start: string | null; actual_end: string | null; assigned_to_user_id: string | null;
  trade_type: string | null; phase: string | null; csi_division: string | null;
  sort_order: number | null; version: number;
}
interface Detail {
  task: TaskRow; codes: Codes | null; steps: WorkStep[]; task_equipment: TaskEquip[];
  predecessors: DepEdge[]; successors: DepEdge[]; photos: Photo[];
}

export default function TaskDetailPanel({
  projectId, taskId, role, onSaved, variant = 'slideover',
}: {
  projectId: string; taskId: string; role?: string;
  onSaved?: () => void; variant?: 'slideover' | 'page';
}) {
  const { t, i18n } = useTranslation('projects');
  const taxonomy = useTradeTaxonomy();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState<string | undefined>(role);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canEdit = !!myRole && EDIT_ROLES.includes(myRole.toLowerCase());
  const canPhoto = !!myRole && PHOTO_ROLES.includes(myRole.toLowerCase());
  const isManager = !!myRole && EDIT_ROLES.includes(myRole.toLowerCase());

  const load = useCallback(() => {
    fetch(`/api/projects/${projectId}/schedule-tasks/${taskId}/detail`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error.message ?? 'Failed to load'); else setDetail(d); })
      .catch(() => setError(t('task_detail.load_failed', { defaultValue: 'Failed to load task' })));
  }, [projectId, taskId, t]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch(`/api/projects/${projectId}/members`).then((r) => r.json()).then((d) => setMembers(d.members ?? [])).catch(() => {});
  }, [projectId]);
  useEffect(() => {
    if (role) return;
    fetch('/api/auth/me').then((r) => r.json()).then((d) => { if (d.role) setMyRole(d.role); }).catch(() => {});
  }, [role]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detail) return;
    setSaving(true); setError('');
    const fd = new FormData(e.currentTarget);
    const body = {
      status: fd.get('status'),
      percent_complete: Number(fd.get('percent_complete') ?? 0),
      description: (fd.get('description') as string) || null,
      planned_start: (fd.get('planned_start') as string) || null,
      planned_end: (fd.get('planned_end') as string) || null,
      actual_start: (fd.get('actual_start') as string) || null,
      actual_end: (fd.get('actual_end') as string) || null,
      assigned_to_user_id: (fd.get('assigned_to_user_id') as string) || null,
      trade_type: (fd.get('trade_type') as string) || null,
      phase: (fd.get('phase') as string) || null,
      sort_order: fd.get('sort_order') === '' || fd.get('sort_order') == null ? null : Number(fd.get('sort_order')),
      version: detail.task.version,
    };
    const res = await fetch(`/api/projects/${projectId}/schedule-tasks/${taskId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) { load(); onSaved?.(); }
    else if (res.status === 409) setError(t('task_detail.conflict', { defaultValue: 'This task was updated elsewhere — reload.' }));
    else setError(t('task_detail.save_failed', { defaultValue: 'Failed to save' }));
  }

  async function rebuildSteps() {
    setRebuilding(true); setError('');
    const res = await fetch(`/api/projects/${projectId}/schedule-tasks/${taskId}/build-steps`, { method: 'POST' });
    setRebuilding(false);
    if (res.ok) load();
    else setError(t('task_detail.rebuild_failed', { defaultValue: 'Failed to rebuild steps' }));
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const up = await fetch('/api/files/upload-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, content_type: file.type, file_size_bytes: file.size, project_id: projectId, category: 'task-photos' }),
      }).then((r) => r.json());
      if (!up.upload_url) { setError(up.error?.message ?? 'Upload failed'); setUploading(false); return; }
      await fetch(up.upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      // Scan→live is async; retry the attach until the file is ready (409 FILE_NOT_READY).
      for (let i = 0; i < 12; i++) {
        const res = await fetch(`/api/projects/${projectId}/schedule-tasks/${taskId}/photos`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_id: up.file_id, photo_type: 'proof' }),
        });
        if (res.ok) { load(); break; }
        if (res.status === 409) { await new Promise((r) => setTimeout(r, 1500)); continue; }
        const err = await res.json(); setError(err.error?.message ?? 'Failed to attach photo'); break;
      }
    } catch { setError(t('task_detail.upload_failed', { defaultValue: 'Photo upload failed' })); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function deletePhoto(photoId: string) {
    const res = await fetch(`/api/projects/${projectId}/schedule-tasks/${taskId}/photos/${photoId}`, { method: 'DELETE' });
    if (res.status === 204) load(); else setError(t('task_detail.photo_delete_failed', { defaultValue: 'Failed to delete photo' }));
  }

  if (!detail) {
    return <div className="p-6 text-sm text-gray-400">{error || t('task_detail.loading', { defaultValue: 'Loading…' })}</div>;
  }
  const { task, codes, steps, task_equipment: taskEquipment = [], predecessors, successors, photos } = detail;
  const equipLabel = (ty: string) => t(`task_detail.equipment_types.${ty}`, { defaultValue: ty.replace(/_/g, ' ') });
  const phaseLabel = (p: string | null) => t(`overview.phase_labels.${p ?? 'unassigned'}`, { defaultValue: p ?? 'unassigned' });
  // Taxonomy label (English data, like task titles) → legacy i18n key → raw key.
  const tradeLabel = (tr: string | null) => {
    const tax = tr ? taxonomy.find((x) => x.key === tr) : null;
    if (tax) return tradeDisplayLabel(tax, i18n.language);
    return t(`task_detail.trade_labels.${tr ?? 'general'}`, { defaultValue: tr ?? 'general' });
  };
  // T-64: options come from the full taxonomy. If the task's current trade isn't in it (free
  // text / taxonomy not yet loaded), keep it as an extra option so a save can never silently
  // clobber the stored trade (the old 13-key hardcoded list did exactly that).
  const currentTradeUnknown = !!task.trade_type && !taxonomy.some((x) => x.key === task.trade_type);

  return (
    <div className={variant === 'page' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-5'}>
      {/* ── Header ── */}
      <div className={variant === 'page' ? 'lg:col-span-2' : ''}>
        <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
        <div className="flex items-center gap-2 mt-1 text-xs">
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase tracking-wide">{tradeLabel(task.trade_type)}</span>
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">{phaseLabel(task.phase)}</span>
          {task.csi_division && <span className="text-gray-400">{task.csi_division}</span>}
        </div>
        {error && <div className="mt-2 rounded bg-red-50 border border-red-200 p-2 text-xs text-red-700">{error}</div>}
      </div>

      {/* ── Editable details ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">{t('task_detail.details', { defaultValue: 'Details' })}</h3>
        <form onSubmit={save} className="space-y-3">
          <fieldset disabled={!canEdit} className="space-y-3 disabled:opacity-70">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('overview.status', { defaultValue: 'Status' })}</label>
              <select name="status" defaultValue={task.status} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                {['not_started', 'in_progress', 'on_hold', 'complete'].map((s) => (
                  <option key={s} value={s}>{t(`overview.status_labels.${s}`, { defaultValue: s.replace('_', ' ') })}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('task_detail.percent', { defaultValue: '% Complete' })}</label>
                <input type="number" name="percent_complete" min={0} max={100} defaultValue={task.percent_complete} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('task_detail.assignee', { defaultValue: 'Assignee' })}</label>
                <select name="assigned_to_user_id" defaultValue={task.assigned_to_user_id ?? ''} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="">{t('task_detail.unassigned', { defaultValue: 'Unassigned' })}</option>
                  {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.first_name} {m.last_name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('overview.start', { defaultValue: 'Planned Start' })}</label>
                <input type="date" name="planned_start" defaultValue={task.planned_start ?? ''} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('overview.end', { defaultValue: 'Planned End' })}</label>
                <input type="date" name="planned_end" defaultValue={task.planned_end ?? ''} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('task_detail.actual_start', { defaultValue: 'Actual Start' })}</label>
                <input type="date" name="actual_start" defaultValue={task.actual_start ?? ''} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('task_detail.actual_end', { defaultValue: 'Actual End' })}</label>
                <input type="date" name="actual_end" defaultValue={task.actual_end ?? ''} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('task_detail.trade', { defaultValue: 'Trade' })}</label>
                <select name="trade_type" defaultValue={task.trade_type ?? ''} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="">{t('task_detail.none', { defaultValue: 'None' })}</option>
                  {currentTradeUnknown && <option value={task.trade_type!}>{tradeLabel(task.trade_type)}</option>}
                  {groupByCategory(taxonomy).map((g) => (
                    <optgroup key={g.category} label={t(`task_detail.trade_categories.${g.category}`, { defaultValue: g.category.replace(/_/g, ' ') })}>
                      {g.trades.map((tr) => <option key={tr.key} value={tr.key}>{tradeDisplayLabel(tr, i18n.language)}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('task_detail.phase', { defaultValue: 'Phase' })}</label>
                <select name="phase" defaultValue={task.phase ?? ''} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="">{t('task_detail.none', { defaultValue: 'None' })}</option>
                  {PHASE_ORDER.map((p) => <option key={p} value={p}>{phaseLabel(p)}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('task_detail.sort_order', { defaultValue: 'Order in phase' })}</label>
                <input type="number" name="sort_order" defaultValue={task.sort_order ?? ''} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                <p className="text-[10px] text-gray-400 mt-0.5">{t('task_detail.sort_order_hint', { defaultValue: 'Lower = earlier. Recompute on the Overview to re-wire dependencies.' })}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('task_detail.description', { defaultValue: 'Description' })}</label>
              <textarea name="description" defaultValue={task.description ?? ''} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>
            {canEdit && (
              <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {saving ? t('task_detail.saving', { defaultValue: 'Saving…' }) : t('overview.save', { defaultValue: 'Save' })}
              </button>
            )}
            {!canEdit && <p className="text-xs text-gray-400">{t('task_detail.read_only', { defaultValue: 'You have read-only access to this task.' })}</p>}
          </fieldset>
        </form>
      </div>

      {/* ── Work Steps + Codes & Compliance + Photos + Dependencies ── */}
      <div className="space-y-5">
        {/* Work Steps (laborer-facing) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">{t('task_detail.work_steps', { defaultValue: 'Work Steps' })}</h3>
            {canEdit && (
              <button onClick={rebuildSteps} disabled={rebuilding} className="text-xs text-blue-600 hover:underline disabled:opacity-50">
                {rebuilding ? t('task_detail.rebuilding', { defaultValue: 'Rebuilding…' }) : t('task_detail.rebuild_steps', { defaultValue: 'Rebuild steps' })}
              </button>
            )}
          </div>
          {steps.length === 0 ? (
            <p className="text-xs text-gray-400">{t('task_detail.no_steps', { defaultValue: 'No work steps yet. Set a trade and rebuild to generate them.' })}</p>
          ) : (
            <ol className="space-y-3">
              {steps.map((s) => (
                <li key={s.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-gray-400">{s.step_order}.</span>
                    <span className="text-sm font-medium text-gray-800">{s.title}</span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1 ml-5">{s.instruction}</p>
                  {s.detail && <p className="text-xs text-gray-500 mt-1 ml-5">{s.detail}</p>}
                  <div className="ml-5 mt-2 space-y-1">
                    {s.code_refs.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.code_refs.map((r, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px]" title={r.note ?? ''}>{r.code_type} {r.section}</span>
                        ))}
                      </div>
                    )}
                    {s.gating_inspection_type && (
                      <div className="text-[10px] text-gray-500">
                        {t('task_detail.signs_off', { defaultValue: 'Inspection:' })} <span className="font-medium">{s.gating_inspection_type.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {(s.equipment?.length ?? 0) > 0 && <div className="text-[10px] text-sky-700"><span className="font-medium">{t('task_detail.equipment', { defaultValue: 'Equipment' })}:</span> {s.equipment!.map((e) => equipLabel(e.type) + (e.optional ? '*' : '')).join(', ')}</div>}
                    {s.tools.length > 0 && <div className="text-[10px] text-gray-500"><span className="font-medium">{t('task_detail.tools', { defaultValue: 'Tools' })}:</span> {s.tools.join(', ')}</div>}
                    {s.materials.length > 0 && <div className="text-[10px] text-gray-500"><span className="font-medium">{t('task_detail.materials', { defaultValue: 'Materials' })}:</span> {s.materials.join(', ')}</div>}
                    {s.safety.length > 0 && <div className="text-[10px] text-amber-700"><span className="font-medium">{t('task_detail.safety', { defaultValue: 'Safety' })}:</span> {s.safety.join('; ')}</div>}
                    {s.qa_check && <div className="text-[10px] text-emerald-700"><span className="font-medium">{t('task_detail.qa', { defaultValue: 'QA' })}:</span> {s.qa_check}</div>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Trade QA checklist (Trade Knowledge Pack) */}
        <TradeQaChecklist tradeType={task.trade_type ?? null} phase={task.phase ?? null} />

        {/* Equipment (union across steps; owned/available shown for Business+) */}
        {taskEquipment.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('task_detail.equipment', { defaultValue: 'Equipment' })}</h3>
            <ul className="space-y-1.5">
              {taskEquipment.map((e) => (
                <li key={e.type} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-800">
                      {equipLabel(e.type)}
                      {e.optional && <span className="ml-1 text-[10px] text-gray-400">{t('task_detail.equipment_optional', { defaultValue: '(optional)' })}</span>}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">{e.reason}</div>
                  </div>
                  {e.owned_count !== undefined && (
                    e.available_count && e.available_count > 0
                      ? <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px]">{t('task_detail.equipment_available', { defaultValue: '{{n}} available', n: e.available_count })}</span>
                      : e.owned_count > 0
                        ? <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px]">{t('task_detail.equipment_owned_none_free', { defaultValue: '{{n}} owned, none free', n: e.owned_count })}</span>
                        : <span className="shrink-0 px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">{t('task_detail.equipment_none_owned', { defaultValue: 'not in fleet' })}</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-gray-400 mt-1">{t('task_detail.equipment_hint', { defaultValue: 'Suggested to work efficiently. * = optional. Availability shown on Business plans.' })}</p>
          </div>
        )}

        {/* Codes & Compliance */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('task_detail.codes', { defaultValue: 'Codes & Compliance' })}</h3>
          {codes ? (
            <div className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium">
                  {codes.code_type} {codes.code_edition ?? codes.nec_edition ?? ''}
                </span>
                {codes.has_permit && (
                  <Link href={`/projects/${projectId}/permits`} className="text-xs text-blue-600 hover:underline">
                    {t('task_detail.view_permit', { defaultValue: 'View permit →' })}
                  </Link>
                )}
              </div>
              {codes.ahj && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">{codes.ahj.ahj_name}</span>
                  {' · '}{t(`task_detail.ahj_level_${codes.ahj.ahj_level}`, { defaultValue: codes.ahj.ahj_level })}
                  {codes.ahj.phone ? ` · ${codes.ahj.phone}` : ''}
                </div>
              )}
              {codes.jurisdiction_notes && <p className="text-xs text-gray-500 italic">{codes.jurisdiction_notes}</p>}
              {codes.task_code_refs?.length > 0 && (
                <div className="pt-1">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">{t('task_detail.task_code_refs', { defaultValue: 'Code references for this task' })}</div>
                  <div className="flex flex-wrap gap-1">
                    {codes.task_code_refs.map((r, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px]" title={r.note ?? ''}>{r.code_type} {r.section}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-1">
                <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">{codes.task_scoped ? t('task_detail.required_inspections', { defaultValue: 'Required inspection(s) for this task' }) : t('task_detail.inspections', { defaultValue: 'Inspection sequence' })}</div>
                <ul className="space-y-1.5">
                  {codes.compliance.map((c) => (
                    <li key={c.inspection_type} className="flex items-start gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: INSP_DOT[c.status] ?? '#cbd5e1' }} />
                      <span className="flex-1">
                        <span className="text-gray-800">{c.title}</span>
                        {!c.required && <span className="text-gray-400"> ({t('task_detail.optional', { defaultValue: 'optional' })})</span>}
                        <span className="text-gray-400"> · {t(`task_detail.inspection_status_labels.${c.status}`, { defaultValue: c.status.replace('_', ' ') })}</span>
                        {c.inspector_name && <span className="text-gray-400"> · {c.inspector_name}</span>}
                        {c.inspection_date && <span className="text-gray-400"> · {String(c.inspection_date).slice(0, 10)}</span>}
                        {c.code_hint && <span className="block text-gray-400">{c.code_hint}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">{t('task_detail.no_codes', { defaultValue: 'Set a trade to see applicable codes and inspections.' })}</p>
          )}
        </div>

        {/* QA Photos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">{t('task_detail.photos', { defaultValue: 'QA / Proof Photos' })}</h3>
            {canPhoto && (
              <label className="text-xs text-blue-600 hover:underline cursor-pointer">
                {uploading ? t('task_detail.uploading', { defaultValue: 'Uploading…' }) : t('task_detail.add_photo', { defaultValue: '+ Add photo' })}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} disabled={uploading} />
              </label>
            )}
          </div>
          {photos.length === 0 ? (
            <p className="text-xs text-gray-400">{t('task_detail.no_photos', { defaultValue: 'No photos yet.' })}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p) => (
                <div key={p.id} className="relative group">
                  {p.download_url
                    ? <a href={p.download_url} target="_blank" rel="noopener noreferrer"><img src={p.download_url} alt={p.caption ?? 'photo'} className="w-full h-20 object-cover rounded border border-gray-200" /></a>
                    : <div className="w-full h-20 rounded border border-gray-200 bg-gray-50" />}
                  {(isManager || (myRole && p.uploaded_by)) && (
                    <button onClick={() => deletePhoto(p.id)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 text-xs leading-none opacity-0 group-hover:opacity-100">×</button>
                  )}
                  {p.first_name && <div className="text-[9px] text-gray-400 truncate mt-0.5">{p.first_name} {p.last_name}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dependencies */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('task_detail.dependencies', { defaultValue: 'Dependencies' })}</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">{t('task_detail.predecessors', { defaultValue: 'Prerequisites' })}</div>
              {predecessors.length === 0 ? <p className="text-gray-400">—</p> : predecessors.map((d) => (
                <div key={d.id} className="text-gray-700 truncate">• {d.title}</div>
              ))}
            </div>
            <div>
              <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">{t('task_detail.successors', { defaultValue: 'Unblocks' })}</div>
              {successors.length === 0 ? <p className="text-gray-400">—</p> : successors.map((d) => (
                <div key={d.id} className="text-gray-700 truncate">• {d.title}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
