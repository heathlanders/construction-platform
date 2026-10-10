'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Button, Input, Select, Card, Table, THead, TBody, TR, TH, TD,
  EmptyState, SkeletonRows, useToast, useConfirm,
} from '@/components/ui';

interface Project { id: string; name: string }
interface ProjectMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}
interface CrewAssignment {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  user_email: string;
  user_role: string;
  role_on_task: string | null;
  start_date: string | null;
  end_date: string | null;
  version: number;
}

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CrewAssignmentsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');
  const toast = useToast();
  const confirm = useConfirm();

  const [project, setProject] = useState<Project | null>(null);
  const [assignments, setAssignments] = useState<CrewAssignment[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    user_id: '',
    role_on_task: '',
    start_date: '',
    end_date: '',
  });

  const load = async () => {
    await Promise.allSettled([
      fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/projects/${id}/crew-assignments`).then(r => r.json()).then(d => { if (d.crew_assignments) setAssignments(d.crew_assignments as CrewAssignment[]); }),
      fetch(`/api/projects/${id}/members`).then(r => r.json()).then(d => { if (d.members) setMembers(d.members as ProjectMember[]); }),
    ]);
  };

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [id]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_id || submitting) return;
    setSubmitting(true);
    setError('');
    const res = await fetch(`/api/projects/${id}/crew-assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: form.user_id,
        role_on_task: form.role_on_task || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      }),
    });
    if (res.ok) {
      setForm({ user_id: '', role_on_task: '', start_date: '', end_date: '' });
      setShowForm(false);
      await load();
    } else {
      setError(t('crew_assignments.failed_to_assign'));
    }
    setSubmitting(false);
  };

  const handleRemove = async (assignment: CrewAssignment) => {
    const ok = await confirm({
      title: t('crew_assignments.remove_title', { defaultValue: 'Remove from project?' }),
      message: t('crew_assignments.remove_message', {
        defaultValue: `Remove ${assignment.first_name} ${assignment.last_name} from this project?`,
        name: `${assignment.first_name} ${assignment.last_name}`,
      }),
      tone: 'danger',
      confirmLabel: t('crew_assignments.remove'),
    });
    if (!ok) return;
    const res = await fetch(`/api/projects/${id}/crew-assignments/${assignment.id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      toast.success(t('crew_assignments.removed', { defaultValue: 'Removed' }));
      await load();
    }
  };

  // Filter members not already assigned
  const assignedUserIds = new Set(assignments.map(a => a.user_id));
  const availableMembers = members.filter(m => !assignedUserIds.has(m.user_id));

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted">
          <Link href="/projects" className="hover:text-ink">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
          <span>/</span>
          <span className="text-ink">{t('crew_assignments.title')}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('crew_assignments.title')}</h1>
          <Button onClick={() => setShowForm(!showForm)}>+ {t('crew_assignments.new')}</Button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <Card padding="lg">
          <form onSubmit={handleAssign} className="space-y-4">
            <h2 className="text-sm font-semibold text-ink">{t('crew_assignments.form_title')}</h2>

            <Select
              label={t('crew_assignments.user_label')}
              value={form.user_id}
              onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
              required
            >
              <option value="">{t('crew_assignments.select_user')}</option>
              {availableMembers.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.first_name} {m.last_name} ({m.role})</option>
              ))}
            </Select>

            <Input
              label={t('crew_assignments.role_label')}
              placeholder={t('crew_assignments.role_placeholder')}
              value={form.role_on_task}
              onChange={e => setForm(f => ({ ...f, role_on_task: e.target.value }))}
              maxLength={200}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input type="date" label={t('crew_assignments.start_date_label')} value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              <Input type="date" label={t('crew_assignments.end_date_label')} value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>

            {error && <p className="text-sm text-status-danger">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={!form.user_id || submitting} loading={submitting}>
                {submitting ? t('crew_assignments.assigning') : t('crew_assignments.assign')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                {t('crew_assignments.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Assignments table */}
      {loading ? (
        <SkeletonRows rows={5} />
      ) : assignments.length === 0 ? (
        <EmptyState title={t('crew_assignments.no_assignments')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('crew_assignments.worker')}</TH>
                <TH>{t('crew_assignments.role_on_task')}</TH>
                <TH>{t('crew_assignments.start_date')}</TH>
                <TH>{t('crew_assignments.end_date')}</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {assignments.map(a => (
                <TR key={a.id}>
                  <TD>
                    <div className="font-medium text-ink">{a.first_name} {a.last_name}</div>
                    <div className="text-xs text-muted">{a.user_email}</div>
                  </TD>
                  <TD className="text-muted">{a.role_on_task ?? '—'}</TD>
                  <TD className="text-muted">{fmt(a.start_date)}</TD>
                  <TD className="text-muted">{fmt(a.end_date)}</TD>
                  <TD className="text-end">
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(a)} className="text-status-danger hover:bg-status-danger-bg">
                      {t('crew_assignments.remove')}
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
