'use client';

import { useState } from 'react';

export function BillingActions() {
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
      setError(err instanceof Error ? err.message : 'Error starting checkout');
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}
      <button
        onClick={startCheckout}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 transition-colors"
      >
        {loading ? 'Redirecting…' : 'Upgrade to Professional — $349/mo'}
      </button>
    </div>
  );
}
