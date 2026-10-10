'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { PageHeader, Card, Table, THead, TBody, TR, TH, TD, Badge, EmptyState } from '@/components/ui';
import { STATUS_SOFT, type StatusKey } from '@/lib/status';

interface AuditEntry {
  id: string;
  category: string;
  action: string;
  actor_email: string | null;
  actor_role: string | null;
  resource_type: string | null;
  resource_id: string | null;
  created_at: string;
}

// Audit category → semantic status tone (token-driven, DESIGN.md §2.3).
const CATEGORY_TONE: Record<string, StatusKey> = {
  auth: 'info',
  data: 'neutral',
  access: 'warning',
  admin: 'action',
  billing: 'success',
  cross_tenant: 'danger',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AuditLogPage() {
  const { t } = useTranslation('common');
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/audit-log?limit=50')
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setHasMore(data.pagination?.has_more ?? false);
      })
      .catch(() => setError(true));
  }, []);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/settings" className="hover:text-ink">{t('settings.title')}</Link>
        <span>/</span>
        <span className="text-ink">{t('audit_log.title')}</span>
      </div>

      <PageHeader title={t('audit_log.title')} subtitle={t('audit_log.subtitle')} className="mb-6" />

      {error && (
        <div className="mb-6 rounded-md border border-status-warning/40 bg-status-warning-bg px-4 py-3 text-sm text-status-warning">
          {t('audit_log.load_error')}
        </div>
      )}

      {!error && entries.length === 0 && (
        <EmptyState title={t('audit_log.no_events')} />
      )}

      {entries.length > 0 && (
        <>
          <Card padding="none" className="overflow-hidden">
            <Table>
              <THead>
                <TR className="bg-surface-alt">
                  <TH className="w-40">{t('audit_log.col_timestamp')}</TH>
                  <TH className="w-28">{t('audit_log.col_category')}</TH>
                  <TH>{t('audit_log.col_action')}</TH>
                  <TH>{t('audit_log.col_actor')}</TH>
                  <TH>{t('audit_log.col_resource')}</TH>
                </TR>
              </THead>
              <TBody>
                {entries.map((entry) => (
                  <TR key={entry.id}>
                    <TD className="text-muted text-xs whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </TD>
                    <TD>
                      <Badge className={STATUS_SOFT[CATEGORY_TONE[entry.category] ?? 'neutral']}>
                        {entry.category}
                      </Badge>
                    </TD>
                    <TD className="font-mono text-xs text-ink">{entry.action}</TD>
                    <TD className="text-muted">
                      <div>{entry.actor_email ?? '—'}</div>
                      {entry.actor_role && (
                        <div className="text-xs text-muted">{entry.actor_role.replace(/_/g, ' ')}</div>
                      )}
                    </TD>
                    <TD className="text-muted text-xs">
                      {entry.resource_type ? (
                        <span>
                          {entry.resource_type}
                          {entry.resource_id && (
                            <span className="ml-1 font-mono text-muted">{entry.resource_id.slice(0, 8)}…</span>
                          )}
                        </span>
                      ) : '—'}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
          {hasMore && (
            <p className="mt-4 text-sm text-muted text-center">
              {t('audit_log.showing_recent')}
            </p>
          )}
        </>
      )}
    </div>
  );
}
