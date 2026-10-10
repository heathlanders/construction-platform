'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Button, Input, Select, StatusPill,
  Card, Table, THead, TBody, TR, TH, TD, SlideOver, EmptyState, SkeletonRows,
} from '@/components/ui';

interface Project { id: string; name: string }
interface Submittal {
  id: string;
  number: number;
  title: string;
  status: string;
  spec_section: string | null;
  version: number;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SUBMITTAL_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'approved_as_noted', label: 'Approved as Noted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'resubmit', label: 'Resubmit Required' },
];

const CHIP = 'text-xs px-3 py-1 rounded-full font-medium hover:opacity-80 transition-opacity';

function SubmittalSlideOver({ submittal, onClose, onSaved }: {
  submittal: Submittal; onClose: () => void; onSaved: (s: Submittal) => void;
}) {
  const [form, setForm] = useState({
    title: submittal.title,
    spec_section: submittal.spec_section ?? '',
    status: submittal.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/submittals/${submittal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          spec_section: form.spec_section || null,
          status: form.status,
          version: submittal.version,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setError('Submittal was updated by someone else — reload.'); return; }
      if (!res.ok) { setError(data?.error?.message ?? 'Save failed'); return; }
      onSaved(data.submittal);
    } catch { setError('Network error'); } finally { setSaving(false); }
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      title={`Submittal #${submittal.number}`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} loading={saving} disabled={!form.title.trim()}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}

        <Input label="Title"
          value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {SUBMITTAL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Input label="Spec Section" placeholder="e.g. 03300"
            value={form.spec_section} onChange={e => setForm(f => ({ ...f, spec_section: e.target.value }))} />
        </div>

        <div className="border-t border-line pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Quick Transitions</p>
          <div className="flex flex-wrap gap-2">
            {form.status === 'draft' && (
              <button onClick={() => setForm(f => ({ ...f, status: 'submitted' }))} className={`${CHIP} bg-status-info-bg text-status-info`}>
                Submit
              </button>
            )}
            {form.status === 'submitted' && (
              <button onClick={() => setForm(f => ({ ...f, status: 'under_review' }))} className={`${CHIP} bg-status-warning-bg text-status-warning`}>
                Start Review
              </button>
            )}
            {form.status === 'under_review' && (<>
              <button onClick={() => setForm(f => ({ ...f, status: 'approved' }))} className={`${CHIP} bg-status-success-bg text-status-success`}>
                Approve
              </button>
              <button onClick={() => setForm(f => ({ ...f, status: 'approved_as_noted' }))} className={`${CHIP} bg-status-success-bg text-status-success`}>
                Approve as Noted
              </button>
              <button onClick={() => setForm(f => ({ ...f, status: 'rejected' }))} className={`${CHIP} bg-status-danger-bg text-status-danger`}>
                Reject
              </button>
              <button onClick={() => setForm(f => ({ ...f, status: 'resubmit' }))} className={`${CHIP} bg-status-warning-bg text-status-warning`}>
                Request Resubmit
              </button>
            </>)}
          </div>
        </div>

        <p className="border-t border-line pt-2 text-xs text-muted">Created {formatDate(submittal.created_at)}</p>
      </div>
    </SlideOver>
  );
}

export default function SubmittalsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');
  const [project, setProject] = useState<Project | null>(null);
  const [submittals, setSubmittals] = useState<Submittal[] | null>(null);
  const [selected, setSelected] = useState<Submittal | null>(null);

  const load = useCallback(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/submittals?project_id=${id}&limit=50`).then(r => r.json()).then(d => setSubmittals(d.submittals ?? [])),
    ]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted">
          <Link href="/projects" className="hover:text-ink">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
          <span>/</span>
          <Link href={`/projects/${id}/documents`} className="hover:text-ink">Documents</Link>
          <span>/</span>
          <span className="text-ink">{t('submittals.title')}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('submittals.title')}</h1>
          <Link href={`/projects/${id}/submittals/new`}><Button>+ {t('submittals.new')}</Button></Link>
        </div>
      </div>

      {submittals === null ? (
        <SkeletonRows rows={5} />
      ) : submittals.length === 0 ? (
        <EmptyState title={t('submittals.no_submittals')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH className="w-16">{t('submittals.number')}</TH>
                <TH>{t('submittals.title_field')}</TH>
                <TH>{t('submittals.status')}</TH>
                <TH>{t('submittals.spec_section')}</TH>
                <TH>{t('submittals.created')}</TH>
              </TR>
            </THead>
            <TBody>
              {submittals.map(s => (
                <TR key={s.id} onClick={() => setSelected(s)} className="cursor-pointer">
                  <TD className="text-muted">{s.number}</TD>
                  <TD className="font-medium">{s.title}</TD>
                  <TD><StatusPill status={s.status} /></TD>
                  <TD className="text-muted">{s.spec_section ?? '—'}</TD>
                  <TD className="text-muted">{formatDate(s.created_at)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {selected && (
        <SubmittalSlideOver
          submittal={selected}
          onClose={() => setSelected(null)}
          onSaved={updated => { setSubmittals(prev => (prev ?? []).map(s => s.id === updated.id ? updated : s)); setSelected(null); }}
        />
      )}
    </div>
  );
}
