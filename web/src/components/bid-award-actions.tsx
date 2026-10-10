'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface Props {
  bidId: string;
  vendorName: string;
  totalAmountCents: number;
  currentStatus: string;
}

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function BidAwardActions({ bidId, vendorName, totalAmountCents, currentStatus }: Props) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (currentStatus === 'awarded') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded border border-green-200">
        <span>🔒</span> Awarded
      </span>
    );
  }

  if (currentStatus === 'declined') {
    return (
      <span className="px-2 py-1 text-xs font-medium text-gray-400 bg-gray-50 rounded border border-gray-200">
        Declined
      </span>
    );
  }

  if (currentStatus !== 'submitted') return null;

  async function award() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/vendor-bids/${bidId}/award`, { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? 'Award failed');
      }
      setShowConfirm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
      >
        {t('common.award')}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-full max-w-sm mx-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Award bid to {vendorName}?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Award {formatCents(totalAmountCents)} to {vendorName}. All other submitted bids will be declined.
            </p>
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => { setShowConfirm(false); setError(''); }}
                disabled={loading}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={award}
                disabled={loading}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Awarding…' : t('common.award')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
