'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Invoice {
  id: string;
  amount_cents: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-status-neutral-bg text-status-neutral',
  sent: 'bg-status-info-bg text-status-info',
  paid: 'bg-status-success-bg text-status-success',
  void: 'bg-status-danger-bg text-status-danger',
};

export default function PortalInvoicesPage() {
  const { t, i18n } = useTranslation('portal');
  const params = useParams();
  const projectId = params.id as string;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState('');

  const fmt = (cents: number) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);

  useEffect(() => {
    fetch(`/api/v1/client-portal/projects/${projectId}/invoices`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error.message ?? t('error_invoices'));
        else setInvoices(d.invoices ?? []) /* drafts + cross-tenant invoices already excluded by the API */;
      })
      .catch(() => setError(t('error_invoices')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const total = invoices.reduce((sum, inv) => sum + inv.amount_cents, 0);
  const paid = invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.amount_cents, 0);
  const invoiceStatus = (s: string) => t(`invoice_status_${s}`, { defaultValue: s });

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted mb-4">
        <Link href={`/portal/projects/${projectId}`} className="hover:text-ink">{t('project_breadcrumb')}</Link>
        <span>›</span>
        <span>{t('invoices')}</span>
      </div>
      <h1 className="text-xl font-semibold text-ink mb-6">{t('invoices')}</h1>

      {error && <div className="bg-status-danger-bg border border-status-danger/40 rounded-lg p-4 text-sm text-status-danger mb-4">{error}</div>}

      {invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-surface rounded-lg border border-line p-4">
            <div className="text-xs text-muted mb-1">{t('total_invoiced')}</div>
            <div className="text-lg font-semibold text-ink">{fmt(total)}</div>
          </div>
          <div className="bg-surface rounded-lg border border-line p-4">
            <div className="text-xs text-muted mb-1">{t('total_paid')}</div>
            <div className="text-lg font-semibold text-status-success">{fmt(paid)}</div>
          </div>
        </div>
      )}

      {invoices.length === 0 && !error ? (
        <div className="bg-surface rounded-lg border border-line px-5 py-12 text-center text-muted text-sm">
          {t('no_invoices')}
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-app">
                <th className="text-start px-4 py-3 font-medium text-muted">{t('th_date')}</th>
                <th className="text-end px-4 py-3 font-medium text-muted">{t('th_amount')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted">{t('th_due')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted">{t('th_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-alt">
                  <td className="px-4 py-3 text-muted">
                    {new Date(inv.created_at).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-end font-medium text-ink">{fmt(inv.amount_cents)}</td>
                  <td className="px-4 py-3 text-muted">{inv.due_date ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[inv.status] ?? 'bg-status-neutral-bg text-status-neutral'}`}>
                      {invoiceStatus(inv.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
