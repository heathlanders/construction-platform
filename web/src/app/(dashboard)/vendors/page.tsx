'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageHeader, Button, KpiTile, Card, Table, THead, TBody, TR, TH, TD, EmptyState, SkeletonRows } from '@/components/ui';
import { useTradeTaxonomy } from '@/components/vendors/trade-select';
import { tradeDisplayLabel } from '@/components/trades/use-trade-taxonomy';

interface Vendor {
  id: string;
  name: string;
  vendor_type: string;
  trade_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_preferred: boolean;
  is_prequalified: boolean;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function VendorsList() {
  const { t, i18n } = useTranslation('financial');
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type') ?? '';
  const tradeFilter = searchParams.get('trade') ?? '';
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const taxonomy = useTradeTaxonomy();

  // key → display label (language-aware, T-64); unknown free-text trades render as stored.
  const tradeLabel = useMemo(() => {
    const m = new Map(taxonomy.map((tr) => [tr.key, tradeDisplayLabel(tr, i18n.language)]));
    return (key: string | null) => (key ? m.get(key) ?? key : '—');
  }, [taxonomy, i18n.language]);

  useEffect(() => {
    const params = new URLSearchParams({ limit: '100' });
    if (typeFilter) params.set('vendor_type', typeFilter);
    if (tradeFilter) params.set('trade_type', tradeFilter);
    setVendors(null);
    fetch(`/api/vendors?${params}`)
      .then((r) => r.json())
      .then((data) => setVendors(data.vendors ?? []))
      .catch(() => setVendors([]));
  }, [typeFilter, tradeFilter]);

  const setTrade = (trade: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (trade) params.set('trade', trade); else params.delete('trade');
    router.replace(`/vendors?${params}`);
  };

  const list = vendors ?? [];
  const preferredCount = list.filter((v) => v.is_preferred).length;
  const prequalifiedCount = list.filter((v) => v.is_prequalified).length;

  const tradeQs = tradeFilter ? `&trade=${encodeURIComponent(tradeFilter)}` : '';
  const filterTabs = [
    { label: t('vendors.filter_all'), href: `/vendors?${tradeQs.slice(1)}`, active: !typeFilter },
    { label: t('vendors.filter_subcontractors'), href: `/vendors?type=subcontractor${tradeQs}`, active: typeFilter === 'subcontractor' },
    { label: t('vendors.filter_suppliers'), href: `/vendors?type=supplier${tradeQs}`, active: typeFilter === 'supplier' },
    { label: t('vendors.filter_equipment'), href: `/vendors?type=equipment${tradeQs}`, active: typeFilter === 'equipment' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('vendors.title')}
        actions={<Link href="/vendors/new"><Button>+ {t('vendors.add_vendor')}</Button></Link>}
      />

      <div className="flex items-center justify-between border-b border-line">
        <div className="flex items-center gap-1">
          {filterTabs.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab.active
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-muted hover:border-line hover:text-ink'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        {/* Trade filter (T-64 taxonomy) */}
        <select
          value={tradeFilter}
          onChange={(e) => setTrade(e.target.value)}
          className="mb-2 rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">{t('vendors.trade_filter_all')}</option>
          {taxonomy.map((tr) => (
            <option key={tr.key} value={tr.key}>{tradeDisplayLabel(tr, i18n.language)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiTile label={t('vendors.total_vendors')} value={list.length} />
        <KpiTile label={t('vendors.preferred')} value={preferredCount} />
        <KpiTile label={t('vendors.prequalified')} value={prequalifiedCount} />
      </div>

      {vendors === null ? (
        <SkeletonRows rows={5} />
      ) : list.length === 0 ? (
        <EmptyState title={t('vendors.no_vendors')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('vendors.name')}</TH>
                <TH>{t('vendors.type')}</TH>
                <TH>{t('vendors.trade')}</TH>
                <TH>{t('vendors.contact')}</TH>
                <TH>{t('vendors.preferred')}</TH>
                <TH>{t('vendors.prequalified')}</TH>
                <TH>{t('vendors.created')}</TH>
              </TR>
            </THead>
            <TBody>
              {list.map((vendor) => (
                <TR key={vendor.id} onClick={() => router.push(`/vendors/${vendor.id}`)} className="cursor-pointer">
                  <TD className="font-medium">{vendor.name}</TD>
                  <TD className="text-muted">{capitalize(vendor.vendor_type)}</TD>
                  <TD className="text-muted">{tradeLabel(vendor.trade_type)}</TD>
                  <TD className="text-muted">{vendor.contact_email ?? vendor.contact_name ?? '—'}</TD>
                  <TD className="text-muted">{vendor.is_preferred ? '✓' : '—'}</TD>
                  <TD className="text-muted">{vendor.is_prequalified ? '✓' : '—'}</TD>
                  <TD className="text-muted">{formatDate(vendor.created_at)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export default function VendorsPage() {
  return (
    <Suspense>
      <VendorsList />
    </Suspense>
  );
}
