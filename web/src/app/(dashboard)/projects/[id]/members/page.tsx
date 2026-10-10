'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Button, Select, Card, Table, THead, TBody, TR, TH, TD,
  EmptyState, SkeletonRows, useToast, useConfirm,
} from '@/components/ui';

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const ROLES = [
  'owner', 'project_manager', 'estimator', 'foreman',
  'field_tech', 'accountant', 'safety_officer',
];

function formatRole(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProjectMembersPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('projects');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const confirm = useConfirm();

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('field_tech');
  const [submitError, setSubmitError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    void Promise.allSettled([loadMembers(), loadUsers()]).then(() => setLoading(false));
  }, [id]);

  async function loadMembers() {
    try {
      const res = await fetch(`/api/projects/${id}/members`);
      const data = await res.json();
      if (res.ok) setMembers(data.members ?? []);
    } catch { /* non-fatal */ }
  }

  async function loadUsers() {
    try {
      const res = await fetch('/api/users?limit=100');
      const data = await res.json();
      if (res.ok) setUsers(data.users ?? []);
    } catch { /* non-fatal */ }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSubmitError('');
    if (!userId) {
      setSubmitError(t('projects.members_page.select_user_error', { defaultValue: 'Select a user to add.' }));
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data?.error?.message ?? t('projects.members_page.add_failed', { defaultValue: 'Failed to add member' }));
        return;
      }
      setUserId('');
      setRole('field_tech');
      setShowAdd(false);
      await loadMembers();
    } catch {
      setSubmitError(t('projects.members_page.error_retry', { defaultValue: 'An error occurred. Please try again.' }));
    } finally {
      setFormLoading(false);
    }
  }

  // Build a map for display
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const availableUsers = users.filter(
    (u) => !members.some((m) => m.user_id === u.id),
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted">
          <Link href="/projects" className="hover:text-ink">{t('projects.title')}</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:text-ink">Project</Link>
          <span>/</span>
          <span className="text-ink">Members</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('projects.members_page.title')}</h1>
          <Button onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? t('projects.members_page.cancel_add') : '+ ' + t('projects.members_page.add')}
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card padding="lg">
          <h2 className="mb-4 text-sm font-semibold text-ink">{t('projects.members_page.add_team_member')}</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Select
                label={t('projects.members_page.team_member_label')}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              >
                <option value="">{t('projects.members_page.select_member')}</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.email})
                  </option>
                ))}
              </Select>
              {availableUsers.length === 0 && (
                <p className="mt-1 text-xs text-muted">{t('projects.members_page.all_members_added')}</p>
              )}
            </div>

            <Select
              label={t('projects.members_page.project_role_label')}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="max-w-xs"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{formatRole(r)}</option>
              ))}
            </Select>

            {submitError && (
              <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3">
                <p className="text-sm text-status-danger">{submitError}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" loading={formLoading} disabled={availableUsers.length === 0}>
                {formLoading ? t('projects.members_page.adding') : t('projects.members_page.add_to_project')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
                {tc('common.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <SkeletonRows rows={5} />
      ) : members.length === 0 ? (
        <EmptyState title={t('projects.members_page.no_members')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('projects.members_page.name_col')}</TH>
                <TH>{t('projects.members_page.email_col')}</TH>
                <TH>{t('projects.members_page.role_col')}</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {members.map((m) => {
                const u = userMap[m.user_id];
                return (
                  <TR key={m.id}>
                    <TD className="font-medium">
                      {u ? `${u.first_name} ${u.last_name}` : m.user_id.slice(0, 8) + '…'}
                    </TD>
                    <TD className="text-muted">{u?.email ?? '—'}</TD>
                    <TD className="text-muted">{formatRole(m.role)}</TD>
                    <TD className="text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-status-danger hover:bg-status-danger-bg"
                        onClick={async () => {
                          const ok = await confirm({
                            title: t('projects.members_page.remove_confirm'),
                            tone: 'danger',
                            confirmLabel: t('projects.members_page.remove'),
                          });
                          if (!ok) return;
                          await fetch(`/api/projects/${id}/members/${m.id}`, { method: 'DELETE' });
                          toast.success(t('projects.members_page.removed', { defaultValue: 'Removed' }));
                          await loadMembers();
                        }}
                      >
                        {t('projects.members_page.remove')}
                      </Button>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
