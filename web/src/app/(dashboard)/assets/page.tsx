'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  PageHeader, Button, Input, Select, Textarea, Card, Badge, KpiTile,
  Table, THead, TBody, TR, TH, TD, SlideOver, EmptyState,
} from '@/components/ui';

interface Asset {
  id: string;
  asset_number: string;
  name: string;
  asset_category: string;
  asset_type: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  serial_number: string | null;
  ownership_type: string;
  status: string;
  home_location: string | null;
  current_meter_reading: number | null;
  meter_type: string;
  version: number;
  created_at: string;
}

interface DashboardSummary {
  total_assets: number;
  out_of_service_count: number;
  checked_out_count: number;
  expiring_soon_count: number;
  expiring_items: ExpiringItem[];
}

interface ExpiringItem {
  asset_id: string;
  asset_name: string;
  asset_number: string;
  item_type: string;
  expiry_date: string;
  days_remaining: number;
}

interface CreateForm {
  name: string;
  asset_category: string;
  ownership_type: string;
  make: string;
  model: string;
  year: string;
  serial_number: string;
  home_location: string;
  notes: string;
}

const EMPTY_FORM: CreateForm = {
  name: '',
  asset_category: 'vehicle',
  ownership_type: 'owned',
  make: '',
  model: '',
  year: '',
  serial_number: '',
  home_location: '',
  notes: '',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AssetsPage() {
  const { t } = useTranslation('assets');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadAssets = () => {
    const params = new URLSearchParams({ limit: '100' });
    if (categoryFilter) params.set('category', categoryFilter);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/assets?${params.toString()}`)
      .then(r => r.json())
      .then(d => { if (d.assets) setAssets(d.assets as Asset[]); })
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/assets/dashboard')
      .then(r => r.json())
      .then(d => { if (d.dashboard) setDashboard(d.dashboard as DashboardSummary); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadAssets(); }, [categoryFilter, statusFilter]);

  const filtered = assets.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.asset_number.toLowerCase().includes(search.toLowerCase())
  );

  const createAsset = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setCreateError('');
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          asset_category: form.asset_category,
          ownership_type: form.ownership_type,
          make: form.make || null,
          model: form.model || null,
          year: form.year ? parseInt(form.year) : null,
          serial_number: form.serial_number || null,
          home_location: form.home_location || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data?.error?.message ?? t('assets.create_error')); return; }
      setShowCreate(false);
      setForm(EMPTY_FORM);
      loadAssets();
    } catch { setCreateError(t('assets.network_error')); } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title={t('title')}
        className="mb-6"
        actions={
          <Button onClick={() => { setShowCreate(true); setCreateError(''); setForm(EMPTY_FORM); }}>
            + {t('add_asset')}
          </Button>
        }
      />

      {/* Summary cards */}
      {dashboard && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiTile label={t('total_assets')} value={dashboard.total_assets} />
          <KpiTile
            label={t('out_of_service')}
            value={<span className={dashboard.out_of_service_count > 0 ? 'text-status-danger' : ''}>{dashboard.out_of_service_count}</span>}
          />
          <KpiTile label={t('checked_out')} value={dashboard.checked_out_count} />
          <KpiTile
            label={t('expiring_soon')}
            value={<span className={dashboard.expiring_soon_count > 0 ? 'text-status-warning' : ''}>{dashboard.expiring_soon_count}</span>}
          />
        </div>
      )}

      {/* Alert panel */}
      {dashboard && dashboard.expiring_items.length > 0 && (
        <div className="rounded-lg border border-status-warning/40 bg-status-warning-bg p-4 mb-6">
          <h2 className="text-sm font-medium text-status-warning mb-2">{t('expiring_soon')}</h2>
          <ul className="space-y-1">
            {dashboard.expiring_items.slice(0, 5).map(item => (
              <li key={`${item.asset_id}-${item.item_type}`} className="flex items-center justify-between text-sm text-status-warning">
                <span>
                  <Link href={`/assets/${item.asset_id}`} className="font-medium hover:underline">{item.asset_name}</Link>
                  {' '}— {item.item_type.replace(/_/g, ' ')}
                </span>
                <span className="text-xs">{formatDate(item.expiry_date)} ({item.days_remaining}d)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters + table */}
      <Card padding="none" className="mb-4">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-line">
          <div className="flex-1 min-w-[12rem]">
            <Input
              type="text"
              placeholder={t('assets.search_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">{t('assets.all_categories')}</option>
              <option value="vehicle">{t('category.vehicle')}</option>
              <option value="heavy_equipment">{t('category.heavy_equipment')}</option>
              <option value="trailer">{t('category.trailer')}</option>
              <option value="power_tool">{t('category.power_tool')}</option>
              <option value="hand_tool">{t('category.hand_tool')}</option>
              <option value="safety_equipment">{t('assets.category_safety_equipment')}</option>
              <option value="technology">{t('category.technology')}</option>
              <option value="other">{t('category.other')}</option>
            </Select>
          </div>
          <div className="w-48">
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">{t('assets.all_statuses')}</option>
              <option value="active">{t('status.active')}</option>
              <option value="in_repair">{t('assets.status_in_repair')}</option>
              <option value="out_of_service">{t('status.out_of_service')}</option>
              <option value="reserved">{t('assets.status_reserved')}</option>
            </Select>
          </div>
        </div>

        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>{t('assets.col_asset_number')}</TH>
              <TH>{t('assets.col_name')}</TH>
              <TH>{t('assets.col_category')}</TH>
              <TH>{t('assets.col_status')}</TH>
              <TH>{t('assets.col_make_model')}</TH>
              <TH>{t('assets.col_location')}</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.length === 0 && (
              <TR className="hover:bg-transparent">
                <TD colSpan={6} className="py-8">
                  <EmptyState title={t('no_assets')} />
                </TD>
              </TR>
            )}
            {filtered.map(asset => (
              <TR key={asset.id}>
                <TD className="font-mono text-xs text-muted">{asset.asset_number}</TD>
                <TD>
                  <Link href={`/assets/${asset.id}`} className="font-medium text-ink hover:text-brand-600">
                    {asset.name}
                  </Link>
                </TD>
                <TD className="text-muted capitalize">{asset.asset_category.replace(/_/g, ' ')}</TD>
                <TD><Badge status={asset.status} /></TD>
                <TD className="text-muted">
                  {[asset.make, asset.model, asset.year].filter(Boolean).join(' ') || '—'}
                </TD>
                <TD className="text-muted">{asset.home_location ?? '—'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* Create slide-over */}
      <SlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('add_asset')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>{t('assets.cancel')}</Button>
            <Button onClick={createAsset} loading={saving} disabled={saving || !form.name.trim()}>
              {t('add_asset')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {createError && (
            <div className="rounded border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{createError}</div>
          )}

          <Input
            label={`${t('assets.field_name')} *`}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('assets.field_category')}
              value={form.asset_category}
              onChange={e => setForm(f => ({ ...f, asset_category: e.target.value }))}
            >
              <option value="vehicle">{t('category.vehicle')}</option>
              <option value="heavy_equipment">{t('category.heavy_equipment')}</option>
              <option value="trailer">{t('category.trailer')}</option>
              <option value="power_tool">{t('category.power_tool')}</option>
              <option value="hand_tool">{t('category.hand_tool')}</option>
              <option value="safety_equipment">{t('assets.category_safety_equipment')}</option>
              <option value="technology">{t('category.technology')}</option>
              <option value="other">{t('category.other')}</option>
            </Select>
            <Select
              label={t('assets.field_ownership')}
              value={form.ownership_type}
              onChange={e => setForm(f => ({ ...f, ownership_type: e.target.value }))}
            >
              <option value="owned">{t('assets.ownership_owned')}</option>
              <option value="rented">{t('assets.ownership_rented')}</option>
              <option value="leased">{t('assets.ownership_leased')}</option>
              <option value="borrowed">{t('assets.ownership_borrowed')}</option>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label={t('assets.field_make')} value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} />
            <Input label={t('assets.field_model')} value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
            <Input
              label={t('assets.field_year')}
              type="number"
              min={1900}
              max={2100}
              value={form.year}
              onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
            />
          </div>

          <Input
            label={t('assets.field_serial_number')}
            value={form.serial_number}
            onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
          />

          <Input
            label={t('assets.field_home_location')}
            placeholder={t('assets.field_home_location_placeholder')}
            value={form.home_location}
            onChange={e => setForm(f => ({ ...f, home_location: e.target.value }))}
          />

          <Textarea
            label={t('assets.field_notes')}
            rows={3}
            className="resize-none"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </SlideOver>
    </div>
  );
}
