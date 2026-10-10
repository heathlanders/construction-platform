'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface Props {
  changeOrderId: string;
  status: string;
}

export function ChangeOrderActions({ changeOrderId, status }: Props) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState('');

  if (status !== 'pending') return null;

  async function act(action: 'approve' | 'reject') {
    setLoading(action);
    setError('');
    try {
      const res = await fetch(`/api/change-orders/${changeOrderId}/${action}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? 'Action failed');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => act('approve')}
        disabled={loading !== null}
        className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 disabled:opacity-50 transition-colors"
      >
        {loading === 'approve' ? '…' : t('common.approve')}
      </button>
      <button
        onClick={() => act('reject')}
        disabled={loading !== null}
        className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 disabled:opacity-50 transition-colors"
      >
        {loading === 'reject' ? '…' : t('common.reject')}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
