'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { PageHeader, Select, Card, Table, THead, TBody, TR, TH, TD, EmptyState, SkeletonRows } from '@/components/ui';
import { statusClasses } from '@/lib/status';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  last_login_at: string | null;
}

interface Cert {
  id: string;
  user_id: string;
  cert_type: string;
  expires_at: string | null;
}

type CertState = 'expired' | 'expiring' | 'valid' | 'none';

function certStatus(cert: Cert): CertState {
  if (!cert.expires_at) return 'none';
  const exp = new Date(cert.expires_at);
  const now = new Date();
  if (exp < now) return 'expired';
  const thirtyDays = new Date(now.getTime() + 30 * 86400000);
  if (exp < thirtyDays) return 'expiring';
  return 'valid';
}

export default function PeoplePage() {
  const { t } = useTranslation('common');
  const [users, setUsers] = useState<User[] | null>(null);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/people?limit=200').then((r) => r.json()),
      fetch('/api/safety-certifications?limit=100').then((r) => r.json()),
    ]).then(([usersResult, certsResult]) => {
      setUsers(usersResult.status === 'fulfilled' ? (usersResult.value.users ?? []) : []);
      if (certsResult.status === 'fulfilled') setCerts(certsResult.value.certifications ?? []);
    }).catch(() => { setError(t('common.failed_to_load')); setUsers([]); });
  }, [t]);

  const certsByUser = useMemo(() => {
    const map = new Map<string, Cert[]>();
    for (const c of certs) {
      const arr = map.get(c.user_id) ?? [];
      arr.push(c);
      map.set(c.user_id, arr);
    }
    return map;
  }, [certs]);

  const expiringSoon = certs.filter((c) => certStatus(c) === 'expiring');
  const list = users ?? [];
  const filteredUsers = roleFilter ? list.filter((u) => u.role === roleFilter) : list;
  const uniqueRoles = Array.from(new Set(list.map((u) => u.role))).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('people.title')}
        actions={
          <div className="w-48">
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label={t('people.filter_role')}>
              <option value="">{t('people.filter_role')}</option>
              {uniqueRoles.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </Select>
          </div>
        }
      />

      {expiringSoon.length > 0 && (
        <div className="rounded-md border border-status-warning/40 bg-status-warning-bg p-3 text-sm text-status-warning">
          {t('people.expiring_soon_banner', { count: expiringSoon.length })}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>
      )}

      {users === null ? (
        <SkeletonRows rows={5} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState title={t('people.no_people')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('people.name')}</TH>
                <TH>{t('people.role')}</TH>
                <TH>{t('people.certifications')}</TH>
                <TH className="text-right">{t('people.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {filteredUsers.map((user) => {
                const userCerts = certsByUser.get(user.id) ?? [];
                const worst = userCerts.reduce<CertState>((acc, c) => {
                  const s = certStatus(c);
                  if (acc === 'expired' || s === 'expired') return 'expired';
                  if (acc === 'expiring' || s === 'expiring') return 'expiring';
                  if (s === 'valid') return 'valid';
                  return acc;
                }, 'none');

                return (
                  <TR key={user.id}>
                    <TD>
                      <Link href={`/people/${user.id}`} className="font-medium text-brand-600 hover:text-brand-700">
                        {user.first_name} {user.last_name}
                      </Link>
                      <div className="text-xs text-muted">{user.email}</div>
                    </TD>
                    <TD className="capitalize text-muted">{user.role.replace('_', ' ')}</TD>
                    <TD>
                      {userCerts.length === 0 ? (
                        <span className="text-xs text-muted">—</span>
                      ) : (
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusClasses(worst)}`}>
                          {userCerts.length} {t(`people.cert_${worst === 'none' ? 'valid' : worst}`).toLowerCase()}
                        </span>
                      )}
                    </TD>
                    <TD className="text-right">
                      <Link href={`/people/${user.id}`} className="text-xs text-brand-600 hover:underline">{t('people.view_profile')}</Link>
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
