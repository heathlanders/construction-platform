'use client';

// Design Studio magic-link landing — exchanges the emailed token for a session, then opens the studio.
// Public (middleware OPEN_PATHS); lives outside the (portal) group so its session gate doesn't bounce us.

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

function NewLinkForm({ tenantSlug }: { tenantSlug: string }) {
  const { t } = useTranslation('studio');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  if (sent) return <p className="mt-4 text-sm text-status-success">{t('start.new_link_sent')}</p>;
  return (
    <form className="mt-4 space-y-2" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      await fetch('/api/portal/studio/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, tenant_slug: tenantSlug }) }).catch(() => undefined);
      setBusy(false); setSent(true);
    }}>
      <p className="text-sm font-medium text-ink">{t('start.new_link_title')}</p>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('start.new_link_email')}
        className="block w-full rounded-md border border-line bg-surface px-3 py-2 text-sm" autoComplete="email" />
      <button type="submit" disabled={busy} className="w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {t('start.new_link_send')}
      </button>
    </form>
  );
}

function Exchange() {
  const { t, i18n } = useTranslation('studio');
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const tenantSlug = params.get('t') ?? '';
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true; // single-use token — never exchange twice (StrictMode double effect)
    fetch('/api/portal/studio/exchange', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async (res) => {
        if (!res.ok) { setError(res.status === 401 ? t('start.invalid') : t('start.error')); return; }
        const d = await res.json();
        if (d.language === 'es' || d.language === 'en') i18n.changeLanguage(d.language);
        router.replace('/portal/studio');
      })
      .catch(() => setError(t('start.error')));
  }, [token, router, t, i18n]);

  if (!token || error) {
    return (
      <>
        <p className="text-sm text-status-danger">{error || t('start.missing_token')}</p>
        {tenantSlug && <NewLinkForm tenantSlug={tenantSlug} />}
      </>
    );
  }
  return <p className="text-sm text-muted">{t('start.signing_in')}</p>;
}

export default function StudioStartPage() {
  const { t } = useTranslation('studio');
  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-6">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-6">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600"><span className="text-sm font-bold text-white">J</span></div>
          <span className="text-sm font-semibold text-ink">{t('brand')}</span>
        </div>
        <Suspense fallback={<p className="text-sm text-muted">{t('start.signing_in')}</p>}>
          <Exchange />
        </Suspense>
      </div>
    </div>
  );
}
