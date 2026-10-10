'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface Props {
  tier: string;
  status: string;
  userCount: number;
  userLimit: number;
  projectCount: number;
  projectLimit: number;
}

export function UpgradePrompt({ tier, status, userCount, userLimit, projectCount, projectLimit }: Props) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function startCheckout() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'professional', billing_period: 'monthly' }),
      });
      const data = (await res.json()) as { checkout_url?: string; error?: { message?: string } };
      if (!res.ok) throw new Error(data.error?.message ?? 'Could not start checkout');
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setLoading(false);
    }
  }

  const isTrial = status === 'trial';
  const tierLabel = isTrial ? 'Free Trial (Professional)' : 'Starter';

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            {isTrial ? t('billing.trial_active') : t('billing.on_starter')}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            {t('billing.current_plan_label', { tier: tierLabel })}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-amber-800">
              {t('billing.users_count', { count: userCount, limit: userLimit })}
            </span>
            <span className="text-xs text-amber-800">
              {t('billing.projects_count', { count: projectCount, limit: projectLimit })}
            </span>
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
        <button
          onClick={startCheckout}
          disabled={loading}
          className="shrink-0 px-3 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md disabled:opacity-50 transition-colors"
        >
          {loading ? t('billing.redirecting') : t('billing.upgrade_button')}
        </button>
      </div>
    </div>
  );
}
