'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Textarea,
  EmptyState,
  SkeletonRows,
} from '@/components/ui';
import { STATUS_DOT, statusKey, type StatusKey } from '@/lib/status';

interface Permit {
  id: string;
  project_id: string;
  permit_type: string;
  permit_number: string | null;
  building_type: string;
  state_code: string;
  code_type: string | null;
  code_edition: string | null;
  nec_edition: string | null;
  jurisdiction_notes: string | null;
  ahj_name: string | null;
  ahj_address: string | null;
  ahj_phone: string | null;
  ahj_contact_name: string | null;
  status: string;
  applied_date: string | null;
  approved_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  version: number;
}

interface Inspection {
  id: string;
  sequence_order: number | null;
  inspection_type: string | null;
  title: string;
  inspection_date: string | null;
  inspector_name: string | null;
  status: string;
  result: string | null;
  correction_notice: string | null;
  notes: string | null;
  version: number;
}

interface Project { id: string; name: string }

const PERMIT_TYPE_LABELS: Record<string, string> = {
  electrical: 'Electrical',
  plumbing:   'Plumbing',
  mechanical: 'Mechanical (HVAC)',
  building:   'Building',
};

// Categorical trade colors (not status) — kept as a small per-trade palette.
const PERMIT_TYPE_BADGE: Record<string, string> = {
  electrical: 'bg-amber-50 text-amber-700',
  plumbing:   'bg-sky-50 text-sky-700',
  mechanical: 'bg-teal-50 text-teal-700',
  building:   'bg-stone-100 text-stone-700',
};

// Permit status → canonical status vocabulary (lib/status). `failed_inspection`
// isn't a canonical key, so normalize it to `failed` to keep the danger color.
function permitStatusState(status: string): string {
  return status === 'failed_inspection' ? 'failed' : status;
}

// AHJ result enum → canonical status vocabulary for coloring.
function resultState(result: string): string {
  if (result === 'pass') return 'passed';
  if (result === 'fail') return 'failed';
  if (result === 'partial') return 'requires_action';
  return result;
}

// Trade-neutral code label, with legacy fallback to nec_edition.
function permitCodeLabel(p: Permit): string {
  if (p.code_type && p.code_edition) return `${p.code_type} ${p.code_edition}`;
  if (p.nec_edition) return `NEC ${p.nec_edition}`;
  return '—';
}

// Timeline dot color, routed through the canonical status tokens (@/lib/status).
// Resolved states use statusKey; a scheduled-but-dated milestone reads as info,
// an unscheduled one as neutral — preserving the gray→blue→green/red progression.
function timelineDotKey(insp: Inspection): StatusKey {
  if (insp.status === 'passed' || insp.status === 'failed' || insp.status === 'requires_action') {
    return statusKey(insp.status);
  }
  return insp.inspection_date ? 'info' : 'neutral';
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function InspectionMilestoneCard({
  inspection, index, total, onUpdated,
}: {
  inspection: Inspection;
  index: number;
  total: number;
  onUpdated: (i: Inspection) => void;
}) {
  const { t: tE } = useTranslation('trade-electrical');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    inspection_date: inspection.inspection_date ? inspection.inspection_date.slice(0, 10) : '',
    inspector_name: inspection.inspector_name ?? '',
    result: inspection.result ?? '',
    correction_notice: inspection.correction_notice ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [showCorrection, setShowCorrection] = useState(!!inspection.correction_notice);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/inspections/${inspection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspection_date:   form.inspection_date ? new Date(form.inspection_date).toISOString() : null,
          inspector_name:    form.inspector_name || null,
          result:            form.result || null,
          correction_notice: form.correction_notice || null,
          version:           inspection.version,
        }),
      });
      const data = await res.json();
      if (res.ok) { onUpdated(data.inspection); setEditing(false); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${STATUS_DOT[timelineDotKey(inspection)]}`}>
          {index + 1}
        </div>
        {index < total - 1 && <div className="w-0.5 flex-1 bg-line mt-1" />}
      </div>

      {/* Card */}
      <Card className="flex-1 mb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-ink">
              {/* inspection.title is populated trade-correctly by milestone generation */}
              {inspection.title}
            </p>
            {inspection.result && (
              <Badge status={resultState(inspection.result)} className="mt-1">
                {tE(`electrical.inspection_milestones.result_${inspection.result}`)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge status={inspection.status} className="capitalize">
              {inspection.status.replace(/_/g, ' ')}
            </Badge>
            <button onClick={() => setEditing(!editing)} className="text-xs text-brand-600 hover:text-brand-700">
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>

        <div className="mt-2 flex gap-4 text-xs text-muted">
          <span>📅 {inspection.inspection_date ? formatDate(inspection.inspection_date) : tE('electrical.inspection_milestones.no_date_set')}</span>
          {inspection.inspector_name && <span>👤 {inspection.inspector_name}</span>}
        </div>

        {/* Correction notice (read-only when not editing) */}
        {!editing && inspection.correction_notice && (
          <div className="mt-2 rounded border border-status-danger/40 bg-status-danger-bg p-2 text-xs text-status-danger">
            <span className="font-medium">{tE('electrical.inspection_milestones.correction_notice')}:</span>{' '}
            {inspection.correction_notice}
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div className="mt-3 space-y-3 border-t border-line pt-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={tE('electrical.permits.applied_date')}
                type="date"
                value={form.inspection_date}
                onChange={(e) => setForm({ ...form, inspection_date: e.target.value })}
              />
              <Input
                label={tE('electrical.inspection_milestones.inspector_name')}
                type="text"
                value={form.inspector_name}
                onChange={(e) => setForm({ ...form, inspector_name: e.target.value })}
                placeholder={tE('electrical.inspection_milestones.inspector_name_placeholder')}
              />
            </div>
            <Select
              label={tE('electrical.inspection_milestones.result')}
              value={form.result}
              onChange={(e) => {
                setForm({ ...form, result: e.target.value });
                if (e.target.value === 'fail') setShowCorrection(true);
              }}
            >
              <option value="">— No result yet —</option>
              <option value="pass">{tE('electrical.inspection_milestones.result_pass')}</option>
              <option value="fail">{tE('electrical.inspection_milestones.result_fail')}</option>
              <option value="partial">{tE('electrical.inspection_milestones.result_partial')}</option>
            </Select>
            {(showCorrection || form.result === 'fail') && (
              <Textarea
                label={tE('electrical.inspection_milestones.correction_notice')}
                value={form.correction_notice}
                onChange={(e) => setForm({ ...form, correction_notice: e.target.value })}
                placeholder={tE('electrical.inspection_milestones.correction_notice_placeholder')}
                rows={2}
              />
            )}
            <Button size="sm" onClick={save} loading={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function PermitDetailPage() {
  const { id, permitId } = useParams<{ id: string; permitId: string }>();
  const { t } = useTranslation('common');
  const { t: tE } = useTranslation('trade-electrical');

  const [project, setProject] = useState<Project | null>(null);
  const [permit, setPermit] = useState<Permit | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [regenerating, setRegenerate] = useState(false);
  const [regenerateError, setRegenerateError] = useState('');

  const load = useCallback(() => {
    if (!id || !permitId) return;

    fetch(`/api/projects/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setProject(d.project); });

    fetch(`/api/permits/${permitId}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then((d) => {
        if (!d) return;
        setPermit(d.permit);
        setInspections(d.inspections ?? []);
      })
      .catch(() => setNotFound(true));
  }, [id, permitId]);

  useEffect(() => { load(); }, [load]);

  const regenerateMilestones = async () => {
    setRegenerate(true); setRegenerateError('');
    try {
      const res = await fetch(`/api/permits/${permitId}/generate-milestones`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setRegenerateError(data.error?.message ?? 'Failed'); return; }
      load();
    } finally {
      setRegenerate(false);
    }
  };

  const updateInspection = (updated: Inspection) => {
    setInspections((prev) => prev.map((i) => i.id === updated.id ? updated : i));
  };

  if (notFound) return <EmptyState title="Permit not found" className="mt-8" />;
  if (!permit || !project) return <div className="py-8"><SkeletonRows rows={4} /></div>;

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/projects" className="hover:text-ink">{t('nav.projects')}</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-ink">{project.name}</Link>
        <span>/</span>
        <Link href={`/projects/${id}/permits`} className="hover:text-ink">Permits</Link>
        <span>/</span>
        <span className="text-ink">{permit.permit_number ?? 'Draft Permit'}</span>
      </div>

      {/* Permit summary card */}
      <Card padding="lg" className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide font-medium mb-1">Permit Number</p>
            <p className="text-lg font-semibold text-ink">
              {permit.permit_number ?? <span className="text-muted italic text-base">Pending assignment</span>}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Badge className={`${PERMIT_TYPE_BADGE[permit.permit_type] ?? 'bg-surface-alt text-ink'}`}>
              {PERMIT_TYPE_LABELS[permit.permit_type] ?? permit.permit_type}
            </Badge>
            <Badge status={permitStatusState(permit.status)} className="capitalize">
              {permit.status.replace(/_/g, ' ')}
            </Badge>
            <Badge className="bg-status-info-bg text-status-info">
              {permitCodeLabel(permit)}
            </Badge>
          </div>
        </div>

        {permit.jurisdiction_notes && (
          <p className="mt-2 text-xs text-status-warning bg-status-warning-bg p-2 rounded">{permit.jurisdiction_notes}</p>
        )}

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {permit.ahj_name && (
            <div>
              <p className="text-xs text-muted">{tE('electrical.permits.ahj_name')}</p>
              <p className="text-ink font-medium">{permit.ahj_name}</p>
            </div>
          )}
          {permit.ahj_phone && (
            <div>
              <p className="text-xs text-muted">{tE('electrical.permits.ahj_phone')}</p>
              <p className="text-ink">{permit.ahj_phone}</p>
            </div>
          )}
          {permit.ahj_contact_name && (
            <div>
              <p className="text-xs text-muted">{tE('electrical.permits.ahj_contact')}</p>
              <p className="text-ink">{permit.ahj_contact_name}</p>
            </div>
          )}
          {permit.applied_date && (
            <div>
              <p className="text-xs text-muted">{tE('electrical.permits.applied_date')}</p>
              <p className="text-ink">{formatDate(permit.applied_date)}</p>
            </div>
          )}
          {permit.approved_date && (
            <div>
              <p className="text-xs text-muted">{tE('electrical.permits.approved_date')}</p>
              <p className="text-ink">{formatDate(permit.approved_date)}</p>
            </div>
          )}
          {permit.expiry_date && (
            <div>
              <p className="text-xs text-muted">{tE('electrical.permits.expiry_date')}</p>
              <p className="text-ink">{formatDate(permit.expiry_date)}</p>
            </div>
          )}
        </div>

        {permit.notes && (
          <p className="mt-3 text-sm text-muted border-t border-line pt-3">{permit.notes}</p>
        )}
      </Card>

      {/* Inspection timeline */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">{tE('electrical.inspection_milestones.title')}</h2>
        <div className="flex items-center gap-3">
          {regenerateError && <span className="text-xs text-status-danger">{regenerateError}</span>}
          <button
            onClick={regenerateMilestones}
            disabled={regenerating}
            className="text-xs text-brand-600 hover:text-brand-700 disabled:opacity-50"
          >
            {regenerating ? 'Regenerating…' : tE('electrical.inspection_milestones.regenerate_milestones')}
          </button>
        </div>
      </div>

      {inspections.length === 0 ? (
        <EmptyState
          title="No inspection milestones yet."
          action={
            <Button loading={regenerating} onClick={regenerateMilestones}>
              {tE('electrical.inspection_milestones.generate_milestones')}
            </Button>
          }
        />
      ) : (
        <div>
          {inspections.map((insp, idx) => (
            <InspectionMilestoneCard
              key={insp.id}
              inspection={insp}
              index={idx}
              total={inspections.length}
              onUpdated={updateInspection}
            />
          ))}
        </div>
      )}

      {/* Link to full inspections page */}
      <div className="mt-4 text-center">
        <Link
          href={`/projects/${id}/inspections?permit_id=${permitId}`}
          className="text-sm text-brand-600 hover:text-brand-700"
        >
          View all project inspections →
        </Link>
      </div>
    </div>
  );
}
