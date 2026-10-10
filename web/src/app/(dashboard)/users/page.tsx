'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { PageHeader, Button, KpiTile, Badge, Card, Table, THead, TBody, TR, TH, TD, EmptyState, SkeletonRows } from '@/components/ui';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
}

interface UsersResponse {
  users: User[];
  pagination: { has_more: boolean; next_cursor: string | null };
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRole(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function UsersPage() {
  const { t } = useTranslation('common');
  const [users, setUsers] = useState<User[] | null>(null);

  useEffect(() => {
    fetch('/api/users?limit=100')
      .then((r) => r.json())
      .then((data: UsersResponse) => setUsers(data.users ?? []))
      .catch(() => setUsers([]));
  }, []);

  const list = users ?? [];
  const activeCount = list.filter((u) => u.status === 'active').length;
  const invitedCount = list.filter((u) => u.status === 'invited').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('users.team_members')}
        actions={<Link href="/users/new"><Button>+ {t('users.invite_member')}</Button></Link>}
      />

      <div className="grid grid-cols-3 gap-4">
        <KpiTile label={t('users.total_users')} value={list.length} />
        <KpiTile label={t('users.active')} value={activeCount} />
        <KpiTile label={t('users.invited')} value={invitedCount} />
      </div>

      {users === null ? (
        <SkeletonRows rows={5} />
      ) : list.length === 0 ? (
        <EmptyState title={t('users.no_members')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('users.name')}</TH>
                <TH>{t('users.email')}</TH>
                <TH>{t('users.role')}</TH>
                <TH>{t('users.status')}</TH>
                <TH>{t('users.last_login')}</TH>
                <TH>{t('users.joined')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.map((user) => (
                <TR key={user.id}>
                  <TD className="font-medium">{user.first_name} {user.last_name}</TD>
                  <TD className="text-muted">{user.email}</TD>
                  <TD className="text-muted">{formatRole(user.role)}</TD>
                  <TD><Badge status={user.status} /></TD>
                  <TD className="text-muted">{user.last_login_at ? formatDate(user.last_login_at) : t('users.never')}</TD>
                  <TD className="text-muted">{formatDate(user.created_at)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
