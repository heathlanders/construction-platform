// settings/billing/page.tsx — subscription status and upgrade
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BillingActions } from './billing-actions';
import { PageHeader, Card, Badge } from '@/components/ui';
import { STATUS_SOFT, type StatusKey } from '@/lib/status';

interface Subscription {
  tier: string;
  status: string;
  addon_gc_module: boolean;
  addon_cross_tenant: boolean;
  current_period_end: string | null;
  trial_ends_at?: string | null;
}

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  business: 'Business',
  enterprise: 'Enterprise',
};

const TIER_PRICES: Record<string, string> = {
  starter: '$149/mo',
  professional: '$349/mo',
  business: '$749/mo',
  enterprise: '$1,499+/mo',
};

// Billing status → semantic tone (token-driven, DESIGN.md §2.3).
const STATUS_TONE: Record<string, StatusKey> = {
  trial: 'info',
  active: 'success',
  grace_period: 'warning',
  cancelled: 'neutral',
  suspended: 'danger',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function daysRemaining(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const labelKeys: Record<string, string> = {
    trial: 'billing.status.trial',
    active: 'billing.status.active',
    grace_period: 'billing.status.grace_period',
    cancelled: 'billing.status.cancelled',
    suspended: 'billing.status.suspended',
  };

  return (
    <Badge className={STATUS_SOFT[STATUS_TONE[status] ?? 'neutral']}>
      {labelKeys[status] ? t(labelKeys[status]) : status}
    </Badge>
  );
}

export default function BillingPage() {
  const { t } = useTranslation('common');
  const [sub, setSub] = useState<Subscription | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch('/api/billing/subscription')
      .then((r) => r.json())
      .then((data) => setSub(data.subscription ?? null))
      .catch(() => setFetchError(true));
  }, []);

  const isTrial = sub?.status === 'trial';
  const isStarter = sub?.tier === 'starter';
  const showUpgrade = isTrial || isStarter;

  return (
    <div>
      <PageHeader title={t('billing.title')} className="mb-6" />

      <div className="max-w-2xl space-y-6">
        {fetchError && (
          <div className="rounded-md border border-status-warning/40 bg-status-warning-bg px-4 py-3 text-sm text-status-warning">
            {t('billing.load_error')}
          </div>
        )}

        {/* Current plan */}
        {sub && (
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-4">
              {t('billing.current_plan')}
            </h2>

            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-ink">
                    {TIER_LABELS[sub.tier] ?? sub.tier}
                  </span>
                  <StatusBadge status={sub.status} t={t} />
                </div>
                <p className="text-sm text-muted mt-0.5">
                  {TIER_PRICES[sub.tier] ?? ''}
                </p>
              </div>
            </div>

            {/* Trial countdown */}
            {isTrial && sub.current_period_end && (
              <div className="rounded-md border border-status-info/40 bg-status-info-bg px-4 py-3 mb-4">
                <p className="text-sm text-status-info">
                  <strong>{daysRemaining(sub.current_period_end)} {t('billing.days')}</strong> {t('billing.trial_remaining')} {formatDate(sub.current_period_end)}.
                </p>
              </div>
            )}

            {/* Grace period warning */}
            {sub.status === 'grace_period' && sub.current_period_end && (
              <div className="rounded-md border border-status-warning/40 bg-status-warning-bg px-4 py-3 mb-4">
                <p className="text-sm text-status-warning">
                  {t('billing.grace_period_warning')} {formatDate(sub.current_period_end)} {t('billing.grace_period_restriction')}.
                </p>
              </div>
            )}

            {/* Add-ons */}
            <div className="border-t border-line pt-4 space-y-2">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">{t('billing.addons')}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink">{t('billing.gc_module')}</span>
                <span className={sub.addon_gc_module ? 'text-status-success font-medium' : 'text-muted'}>
                  {sub.addon_gc_module ? t('billing.addon_active') : t('billing.addon_not_included')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink">{t('billing.cross_tenant')}</span>
                <span
                  className={sub.addon_cross_tenant ? 'text-status-success font-medium' : 'text-muted'}
                >
                  {sub.addon_cross_tenant ? t('billing.addon_active') : t('billing.addon_not_included')}
                </span>
              </div>
            </div>

            {/* Renewal date */}
            {sub.status === 'active' && sub.current_period_end && (
              <p className="text-xs text-muted mt-4">
                {t('billing.next_renewal')}: {formatDate(sub.current_period_end)}
              </p>
            )}
          </Card>
        )}

        {/* Upgrade prompt */}
        {showUpgrade && (
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-3">
              {t('billing.upgrade_title')}
            </h2>
            <p className="text-sm text-muted mb-4">
              {t('billing.upgrade_desc')}
            </p>
            <BillingActions />
          </Card>
        )}

        {/* Support */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-2">
            {t('billing.need_help')}
          </h2>
          <p className="text-sm text-muted">
            {t('billing.support_text')}{' '}
            <a href="mailto:support@constructionplatform.com" className="text-brand-600 hover:underline">
              support@constructionplatform.com
            </a>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}
