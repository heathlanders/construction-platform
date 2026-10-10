'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Button, Select, Badge, Card, Table, THead, TBody, TR, TH, TD, EmptyState, Spinner,
} from '@/components/ui';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
}

interface Assignment {
  id: string;
  project_id: string;
  project_name?: string;
  role_on_task: string;
  start_date: string;
  end_date: string;
}

interface Cert {
  id: string;
  cert_type: string;
  issued_at: string | null;
  expires_at: string | null;
}

const USER_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'estimator', label: 'Estimator' },
  { value: 'foreman', label: 'Foreman' },
  { value: 'field_tech', label: 'Field Tech' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'safety_officer', label: 'Safety Officer' },
];

const USER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deactivated', label: 'Deactivated' },
];

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function certBadge(expiresAt: string | null) {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt);
  const now = new Date();
  if (exp < now) return <Badge status="danger">Expired</Badge>;
  if (exp < new Date(now.getTime() + 30 * 86400000)) return <Badge status="warning">Expiring Soon</Badge>;
  return <Badge status="success">Valid</Badge>;
}

export default function PersonProfilePage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState({ role: '', status: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.allSettled([
      fetch(`/api/people/${id}`).then(r => r.json()),
      fetch(`/api/crew-assignments?user_id=${id}&limit=20`).then(r => r.json()),
      fetch(`/api/safety-certifications?user_id=${id}&limit=20`).then(r => r.json()),
    ]).then(([userResult, assignResult, certResult]) => {
      if (userResult.status === 'fulfilled') {
        const u = userResult.value.user ?? null;
        setUser(u);
        if (u) setEditForm({ role: u.role, status: u.status });
      }
      if (assignResult.status === 'fulfilled') setAssignments(assignResult.value.crew_assignments ?? []);
      if (certResult.status === 'fulfilled') setCerts(certResult.value.certifications ?? []);
    }).catch(() => setError(t('common.failed_to_load')));
  }, [id, t]);

  const save = async () => {
    if (!user) return;
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(`/api/people/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editForm.role, status: editForm.status }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data?.error?.message ?? 'Save failed'); return; }
      setUser(data.user as User);
      setEditing(false);
    } catch { setSaveError('Network error'); } finally { setSaving(false); }
  };

  if (error) return <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-4 text-sm text-status-danger">{error}</div>;
  if (!user) return <div className="flex items-center justify-center h-48 text-muted"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/people" className="text-sm text-muted hover:text-ink">← {t('people.title')}</Link>
      </div>

      {/* Header */}
      <Card padding="none" className="px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{user.first_name} {user.last_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm capitalize text-muted">{user.role.replace(/_/g, ' ')}</span>
              <span className="text-muted">·</span>
              <span className="text-sm text-muted">{user.email}</span>
              <span className="text-muted">·</span>
              <Badge status={user.status === 'invited' ? 'info' : user.status}>{user.status}</Badge>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setEditing(!editing); setSaveError(''); }}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {editing && (
          <div className="mt-4 pt-4 border-t border-line space-y-3">
            {saveError && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{saveError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <Select label="Role" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                {USER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
              <Select label="Status" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                {USER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>
            <Button onClick={save} loading={saving}>Save Changes</Button>
          </div>
        )}
      </Card>

      {/* Crew assignments */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-semibold text-ink">{t('people.crew_assignments')}</h2>
        </div>
        {assignments.length === 0 ? (
          <div className="p-5"><EmptyState title={t('people.no_assignments')} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Project</TH>
                <TH>Role</TH>
                <TH>Start</TH>
                <TH>End</TH>
              </TR>
            </THead>
            <TBody>
              {assignments.map(a => (
                <TR key={a.id}>
                  <TD>
                    <Link href={`/projects/${a.project_id}`} className="text-brand-600 hover:underline">
                      {a.project_name ?? a.project_id.slice(0, 8)}
                    </Link>
                  </TD>
                  <TD className="text-ink">{a.role_on_task ?? '—'}</TD>
                  <TD className="text-muted">{formatDate(a.start_date)}</TD>
                  <TD className="text-muted">{formatDate(a.end_date)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {/* Safety certifications */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-semibold text-ink">{t('people.safety_certs')}</h2>
        </div>
        {certs.length === 0 ? (
          <div className="p-5"><EmptyState title={t('people.no_certs')} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Certification</TH>
                <TH>{t('people.issued')}</TH>
                <TH>{t('people.expires')}</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {certs.map(c => (
                <TR key={c.id}>
                  <TD className="font-medium text-ink">{c.cert_type}</TD>
                  <TD className="text-muted">{formatDate(c.issued_at)}</TD>
                  <TD className="text-muted">
                    {c.expires_at ? formatDate(c.expires_at) : <span className="text-muted">{t('people.never_expires')}</span>}
                  </TD>
                  <TD>{certBadge(c.expires_at)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
