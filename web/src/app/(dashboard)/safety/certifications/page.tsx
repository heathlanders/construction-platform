'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { PageHeader, Button, Card, EmptyState, Badge, Table, THead, TBody, TR, TH, TD } from '@/components/ui';

interface Cert {
  id: string;
  user_id: string;
  cert_type: string;
  issued_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface User { id: string; first_name: string; last_name: string; email: string }

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000; // 30 days
}

export default function CertificationsPage() {
  const { t } = useTranslation('safety');

  const [certs, setCerts] = useState<Cert[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});

  useEffect(() => {
    void Promise.allSettled([
      fetch('/api/safety-certifications?limit=100').then((r) => r.json()).then((d) => { if (d.certifications) setCerts(d.certifications as Cert[]); }),
      fetch('/api/users?limit=100').then((r) => r.json()).then((d) => {
        if (d.users) setUserMap(Object.fromEntries((d.users as User[]).map((u) => [u.id, u])));
      }),
    ]);
  }, []);

  const expired = certs.filter((c) => isExpired(c.expires_at));
  const expiringSoon = certs.filter((c) => !isExpired(c.expires_at) && isExpiringSoon(c.expires_at));
  const current = certs.filter((c) => !isExpired(c.expires_at) && !isExpiringSoon(c.expires_at));

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/safety" className="hover:text-ink">{t('certifications.back_to_safety')}</Link>
        <span>/</span>
        <span className="text-ink">{t('certifications.title')}</span>
      </div>

      <PageHeader
        title={t('certifications.title')}
        subtitle={t('certifications.subtitle')}
        actions={
          <Link href="/safety/certifications/new">
            <Button size="sm">+ {t('certifications.new')}</Button>
          </Link>
        }
        className="mb-6"
      />

      {expired.length > 0 && (
        <div className="mb-4 rounded-md border border-status-danger/40 bg-status-danger-bg px-4 py-3 text-sm text-status-danger">
          <strong>{expired.length}</strong> {t('certifications.expired_banner', { count: expired.length })}
        </div>
      )}
      {expiringSoon.length > 0 && (
        <div className="mb-4 rounded-md border border-status-warning/40 bg-status-warning-bg px-4 py-3 text-sm text-status-warning">
          <strong>{expiringSoon.length}</strong> {t('certifications.expiring_banner', { count: expiringSoon.length })}
        </div>
      )}

      {certs.length === 0 ? (
        <EmptyState title={t('certifications.no_certs')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR className="bg-surface-alt hover:bg-surface-alt">
                <TH>{t('certifications.worker')}</TH>
                <TH>{t('certifications.cert_type')}</TH>
                <TH>{t('certifications.issued')}</TH>
                <TH>{t('certifications.expires')}</TH>
                <TH>{t('certifications.status_col')}</TH>
              </TR>
            </THead>
            <TBody>
              {[...expired, ...expiringSoon, ...current].map((c) => {
                const user = userMap[c.user_id];
                const exp = isExpired(c.expires_at);
                const soon = isExpiringSoon(c.expires_at);
                return (
                  <TR key={c.id}>
                    <TD>
                      {user ? `${user.first_name} ${user.last_name}` : c.user_id.slice(0, 8) + '…'}
                      {user?.email && <div className="text-xs text-muted">{user.email}</div>}
                    </TD>
                    <TD className="font-medium">{c.cert_type}</TD>
                    <TD className="text-muted">{formatDate(c.issued_at)}</TD>
                    <TD className="text-muted">{formatDate(c.expires_at)}</TD>
                    <TD>
                      {c.expires_at === null ? (
                        <Badge status="inactive">{t('certifications.no_expiry')}</Badge>
                      ) : exp ? (
                        <Badge status="expired">{t('certifications.expired')}</Badge>
                      ) : soon ? (
                        <Badge status="expiring">{t('certifications.expiring_soon')}</Badge>
                      ) : (
                        <Badge status="valid">{t('certifications.current')}</Badge>
                      )}
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
