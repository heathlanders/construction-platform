'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface HomeownerWarranty {
  id: string;
  title: string;
  homeowner_name: string | null;
  effective_date: string;
  status: string;
  coverage_items: CoverageItem[];
}

interface CoverageItem {
  id: string;
  coverage_tier: string;
  description: string;
  duration_months: number;
  expiry_date: string | null;
}

interface HomeownerClaim {
  id: string;
  claim_number: string;
  title: string;
  status: string;
  reported_date: string;
}

const TIER_COLORS: Record<string, string> = {
  workmanship: 'bg-blue-100 text-blue-700',
  systems: 'bg-yellow-100 text-yellow-700',
  structural: 'bg-green-100 text-green-700',
  custom: 'bg-gray-100 text-gray-600',
};

const OPEN_CLAIM_STATUSES = ['submitted', 'under_review', 'sub_notified', 'sub_accepted', 'sub_disputed', 'repair_scheduled'];

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function coverageIndicatorColor(expiry: string | null): string {
  if (!expiry) return 'bg-green-500';
  const ms = new Date(expiry).getTime() - Date.now();
  if (ms < 0) return 'bg-red-500';
  if (ms < 90 * 86400000) return 'bg-yellow-400';
  return 'bg-green-500';
}

export default function HomeownerWarrantyPage() {
  const { t } = useTranslation('warranties');
  const router = useRouter();
  const [warranty, setWarranty] = useState<HomeownerWarranty | null>(null);
  const [claims, setClaims] = useState<HomeownerClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/homeowner/warranty').then(r => r.json()),
      fetch('/api/homeowner/warranty/claims').then(r => r.json()),
    ])
      .then(([wd, cd]) => {
        if (wd.error?.code === 'UNAUTHORIZED') { router.replace('/homeowner/login'); return; }
        if (wd.warranty) setWarranty(wd.warranty as HomeownerWarranty);
        if (cd.claims) setClaims(cd.claims as HomeownerClaim[]);
      })
      .catch(() => setError(t('errors.load_failed')))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="rounded bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>;
  if (!warranty) return <div className="text-center py-16 text-gray-400">{t('errors.load_failed')}</div>;

  const openClaims = claims.filter(c => OPEN_CLAIM_STATUSES.includes(c.status));

  return (
    <div className="space-y-8">
      {/* Warranty header */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('homeowner.your_warranty')}</p>
        <h1 className="text-2xl font-bold text-gray-900">{warranty.title}</h1>
        {warranty.homeowner_name && <p className="text-gray-600 mt-1">{warranty.homeowner_name}</p>}
        <p className="text-sm text-gray-500 mt-1">{t('col.effective_date')}: {formatDate(warranty.effective_date)}</p>
      </div>

      {/* Coverage items grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('homeowner.coverage_items')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {warranty.coverage_items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
              <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${coverageIndicatorColor(item.expiry_date)}`} />
              <div className="flex-1 min-w-0">
                <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium mb-2 ${TIER_COLORS[item.coverage_tier] ?? 'bg-gray-100 text-gray-500'}`}>
                  {t(`tier.${item.coverage_tier}`)}
                </span>
                <p className="text-sm font-medium text-gray-900">{item.description}</p>
                <p className="text-xs text-gray-500 mt-1">{item.duration_months} {t('col.duration').toLowerCase()}</p>
                {item.expiry_date && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(item.expiry_date) < new Date()
                      ? <span className="text-red-600 font-medium">{t('homeowner.coverage_expired')}</span>
                      : `${t('detail.coverage_expires')}: ${formatDate(item.expiry_date)}`
                    }
                  </p>
                )}
              </div>
            </div>
          ))}
          {warranty.coverage_items.length === 0 && (
            <p className="col-span-2 text-sm text-gray-400">{t('detail.no_coverage_items')}</p>
          )}
        </div>
      </div>

      {/* Open claims */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('homeowner.open_claims')}</h2>
          <Link
            href="/homeowner/warranty/claims/new"
            className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            {t('homeowner.submit_claim')}
          </Link>
        </div>
        {openClaims.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-gray-400 text-sm">{t('homeowner.no_claims')}</p>
            <Link href="/homeowner/warranty/claims/new" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              {t('homeowner.submit_claim')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {openClaims.map(c => (
              <Link key={c.id} href={`/homeowner/warranty/claims/${c.id}`} className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{c.title}</p>
                  <span className="text-xs text-gray-500">{formatDate(c.reported_date)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-mono">{c.claim_number}</p>
                <p className="text-xs text-blue-600 mt-1 capitalize">{c.status.replace(/_/g, ' ')}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
