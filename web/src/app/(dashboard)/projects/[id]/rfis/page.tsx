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
interface User { id: string; first_name: string; last_name: string }
interface RFI {
  id: string;
  number: number;
  subject: string;
  status: string;
  due_date: string | null;
  assignee_id: string | null;
  version: number;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const RFI_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'answered', label: 'Answered' },
  { value: 'closed', label: 'Closed' },
];

const CHIP = 'text-xs px-3 py-1 rounded-full font-medium hover:opacity-80 transition-opacity';

function RfiSlideOver({ rfi, users, onClose, onSaved }: {
  rfi: RFI; users: User[]; onClose: () => void; onSaved: (r: RFI) => void;
}) {
  const [form, setForm] = useState({
    subject: rfi.subject,
    status: rfi.status,
    due_date: rfi.due_date ? rfi.due_date.slice(0, 10) : '',
    assignee_id: rfi.assignee_id ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/rfis/${rfi.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject,
          status: form.status,
          due_date: form.due_date || null,
          assignee_id: form.assignee_id || null,
          version: rfi.version,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setError('RFI was updated by someone else — reload.'); return; }
      if (!res.ok) { setError(data?.error?.message ?? 'Save failed'); return; }
      onSaved(data.rfi);
    } catch { setError('Network error'); } finally { setSaving(false); }
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      title={`RFI #${rfi.number}`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} loading={saving} disabled={!form.subject.trim()}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}

        <Input label="Subject"
          value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {RFI_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Input type="date" label="Due Date"
            value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
        </div>

        <Select label="Assignee" value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
          <option value="">Unassigned</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
        </Select>

        <div className="border-t border-line pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Quick Transitions</p>
          <div className="flex flex-wrap gap-2">
            {form.status === 'draft' && (
              <button onClick={() => setForm(f => ({ ...f, status: 'open' }))} className={`${CHIP} bg-status-info-bg text-status-info`}>
                Mark Open
              </button>
            )}
            {form.status === 'open' && (
              <button onClick={() => setForm(f => ({ ...f, status: 'answered' }))} className={`${CHIP} bg-status-success-bg text-status-success`}>
                Mark Answered
              </button>
            )}
            {(form.status === 'open' || form.status === 'answered') && (
              <button onClick={() => setForm(f => ({ ...f, status: 'closed' }))} className={`${CHIP} bg-status-neutral-bg text-status-neutral`}>
                Close RFI
              </button>
            )}
          </div>
        </div>

        <p className="border-t border-line pt-2 text-xs text-muted">Created {formatDate(rfi.created_at)}</p>
      </div>
    </SlideOver>
  );
}

export default function RFIsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');
  const [project, setProject] = useState<Project | null>(null);
  const [rfis, setRfis] = useState<RFI[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<RFI | null>(null);

  const load = useCallback(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/rfis?project_id=${id}&limit=50`).then(r => r.json()).then(d => setRfis(d.rfis ?? [])),
      fetch('/api/people?limit=100').then(r => r.json()).then(d => { if (d.users) setUsers(d.users as User[]); }),
    ]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const userMap = Object.fromEntries(users.map(u => [u.id, `${u.first_name} ${u.last_name}`]));

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
          <span className="text-ink">{t('rfis.title')}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('rfis.title')}</h1>
          <Link href={`/projects/${id}/rfis/new`}><Button>+ {t('rfis.new')}</Button></Link>
        </div>
      </div>

      {rfis === null ? (
        <SkeletonRows rows={5} />
      ) : rfis.length === 0 ? (
        <EmptyState title={t('rfis.no_rfis')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH className="w-16">{t('rfis.number')}</TH>
                <TH>{t('rfis.subject')}</TH>
                <TH>{t('rfis.status')}</TH>
                <TH>{t('rfis.due_date')}</TH>
                <TH>Assignee</TH>
              </TR>
            </THead>
            <TBody>
              {rfis.map(rfi => (
                <TR key={rfi.id} onClick={() => setSelected(rfi)} className="cursor-pointer">
                  <TD className="text-muted">{rfi.number}</TD>
                  <TD className="font-medium">{rfi.subject}</TD>
                  <TD><StatusPill status={rfi.status} /></TD>
                  <TD className="text-muted">{formatDate(rfi.due_date)}</TD>
                  <TD className="text-muted">{rfi.assignee_id ? (userMap[rfi.assignee_id] ?? '—') : '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {selected && (
        <RfiSlideOver
          rfi={selected}
          users={users}
          onClose={() => setSelected(null)}
          onSaved={updated => { setRfis(prev => (prev ?? []).map(r => r.id === updated.id ? updated : r)); setSelected(null); }}
        />
      )}
    </div>
  );
}
