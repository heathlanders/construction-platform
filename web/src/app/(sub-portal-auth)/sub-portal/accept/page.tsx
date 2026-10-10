'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

function AcceptForm() {
  const { t } = useTranslation('connections');
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError(t('sub_portal.accept.error_short'));
    if (password !== confirm) return setError(t('sub_portal.accept.error_mismatch'));
    setBusy(true);
    try {
      const res = await fetch('/api/sub-portal/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.error?.message ?? t('sub_portal.accept.error_invalid'));
        setBusy(false);
        return;
      }
      router.push('/sub-portal');
    } catch {
      setError(t('sub_portal.accept.error_generic'));
      setBusy(false);
    }
  }

  if (!token) {
    return <p className="text-sm text-status-danger">{t('sub_portal.accept.missing_token')}</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted">{t('sub_portal.accept.intro')}</p>
      <div>
        <label className="block text-xs font-medium text-muted mb-1">{t('sub_portal.accept.password')}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-line rounded-md px-3 py-2 text-sm" autoComplete="new-password" />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted mb-1">{t('sub_portal.accept.confirm_password')}</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          className="w-full border border-line rounded-md px-3 py-2 text-sm" autoComplete="new-password" />
      </div>
      {error && <p className="text-sm text-status-danger">{error}</p>}
      <button type="submit" disabled={busy}
        className="w-full bg-brand-600 text-white text-sm font-medium rounded-md py-2 hover:bg-brand-700 disabled:opacity-50">
        {busy ? t('sub_portal.accept.submitting') : t('sub_portal.accept.submit')}
      </button>
    </form>
  );
}

function AcceptShell() {
  const { t } = useTranslation('connections');
  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-surface rounded-lg border border-line p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-brand-600 rounded-md flex items-center justify-center">
            <span className="text-white text-sm font-bold">J</span>
          </div>
          <span className="text-sm font-semibold text-ink">{t('sub_portal.accept.brand')}</span>
        </div>
        <Suspense fallback={<p className="text-sm text-muted">{t('sub_portal.portal.loading')}</p>}>
          <AcceptForm />
        </Suspense>
      </div>
    </div>
  );
}

export default function SubPortalAcceptPage() {
  return <AcceptShell />;
}
