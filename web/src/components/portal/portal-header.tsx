'use client';

// Shared header for the two external portal shells (sub-portal + client portal).
// Client component so the server layouts can stay server-rendered while the
// chrome strings run through i18n (T-09 locale resolution via the root provider).

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function PortalHeader({ variant }: { variant: 'sub' | 'client' }) {
  const { t } = useTranslation(variant === 'sub' ? 'connections' : 'portal');
  const title = variant === 'sub' ? t('sub_portal.portal.title') : t('title');
  const signOut = variant === 'sub' ? t('sub_portal.portal.sign_out') : t('sign_out');
  const { t: ts } = useTranslation('studio');

  return (
    <header className="bg-surface border-b border-line">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-8 h-8 shrink-0 bg-brand-600 rounded-md flex items-center justify-center">
            <span className="text-white text-sm font-bold">{variant === 'sub' ? 'J' : 'C'}</span>
          </div>
          <span className="hidden text-sm font-semibold text-ink sm:inline">{title}</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 whitespace-nowrap text-sm">
          {variant === 'client' && (
            <nav className="flex items-center gap-3 sm:gap-4">
              <Link href="/portal" className="text-muted hover:text-ink">{t('your_projects')}</Link>
              <Link href="/portal/studio" className="text-muted hover:text-ink">{ts('brand')}</Link>
            </nav>
          )}
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-sm text-muted hover:text-ink">{signOut}</button>
          </form>
        </div>
      </div>
    </header>
  );
}
