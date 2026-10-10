'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Button, Input, Select, Textarea, Card, Badge, Tabs, Spinner,
  Table, THead, TBody, TR, TH, TD, SlideOver,
} from '@/components/ui';
import { STATUS_SOFT, type StatusKey } from '@/lib/status';

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
  vin: string | null;
  color: string | null;
  ownership_type: string;
  status: string;
  condition: string | null;
  home_location: string | null;
  meter_type: string;
  current_meter_reading: number | null;
  requires_operator_cert: boolean;
  required_cert_type: string | null;
  dot_regulated: boolean;
  osha_inspection_required: boolean;
  purchase_date: string | null;
  purchase_price_cents: number | null;
  current_value_cents: number | null;
  notes: string | null;
  version: number;
  created_at: string;
}

interface ServiceRecord {
  id: string;
  service_type: string;
  service_date: string;
  description: string;
  total_cost_cents: number;
  next_service_due_date: string | null;
}

interface Inspection {
  id: string;
  inspection_type: string;
  inspected_at: string;
  result: string;
  out_of_service: boolean;
  notes: string | null;
}

interface Warranty {
  id: string;
  warranty_type: string;
  provider_name: string;
  start_date: string;
  expiry_date: string;
  coverage_description: string | null;
}

interface Registration {
  id: string;
  registration_type: string;
  registration_number: string | null;
  license_plate: string | null;
  expiry_date: string | null;
  state_code: string | null;
}

interface FuelLog {
  id: string;
  log_date: string;
  fuel_type: string;
  gallons: number | null;
  total_cost_cents: number;
}

interface DepreciationSchedule {
  id: string;
  method: string;
  useful_life_years: number;
  salvage_value_cents: number;
  current_book_value_cents: number | null;
}

interface DepreciationEntry {
  id: string;
  period_start: string;
  period_end: string;
  depreciation_amount_cents: number;
  book_value_after_cents: number;
}

interface AssetDocument {
  id: string;
  doc_type: string;
  title: string;
  expiry_date: string | null;
  created_at: string;
}

type TabKey = 'overview' | 'service' | 'inspections' | 'warranties' | 'insurance' | 'registration' | 'fuel' | 'depreciation' | 'documents';

const RESULT_KEY: Record<string, StatusKey> = { pass: 'success', fail: 'danger', conditional: 'warning' };

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCents(cents: number | null) {
  if (cents === null) return '—';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ResultBadge({ result }: { result: string }) {
  return (
    <Badge className={STATUS_SOFT[RESULT_KEY[result] ?? 'neutral']}>
      {result.charAt(0).toUpperCase() + result.slice(1)}
    </Badge>
  );
}

function ExpiryBadge({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted">—</span>;
  const days = Math.floor((new Date(date).getTime() - Date.now()) / 86400000);
  if (days < 0) return <Badge className={STATUS_SOFT.danger}>Expired</Badge>;
  if (days <= 30) return <Badge className={STATUS_SOFT.warning}>Expires {formatDate(date)}</Badge>;
  return <span className="text-sm text-ink">{formatDate(date)}</span>;
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-ink">{value ?? '—'}</p>
    </div>
  );
}

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('assets');
  const [asset, setAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Asset>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tab data
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [depSchedule, setDepSchedule] = useState<DepreciationSchedule | null>(null);
  const [depEntries, setDepEntries] = useState<DepreciationEntry[]>([]);
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [tabLoaded, setTabLoaded] = useState<Set<TabKey>>(new Set(['overview']));
  const [showAddService, setShowAddService] = useState(false);
  const [showAddInspection, setShowAddInspection] = useState(false);

  useEffect(() => {
    fetch(`/api/assets/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.asset) {
          setAsset(d.asset as Asset);
          setForm(d.asset as Asset);
        }
      })
      .catch(() => {});
  }, [id]);

  const loadTab = (tab: TabKey) => {
    if (tabLoaded.has(tab)) return;
    setTabLoaded(prev => new Set([...prev, tab]));

    const subMap: Partial<Record<TabKey, string>> = {
      service: 'service-records',
      inspections: 'inspections',
      warranties: 'warranties',
      registration: 'registrations',
      fuel: 'fuel-logs',
      depreciation: 'depreciation',
      documents: 'documents',
    };
    const sub = subMap[tab];
    if (!sub) return;

    fetch(`/api/assets/${id}/${sub}`)
      .then(r => r.json())
      .then(d => {
        if (tab === 'service' && d.service_records) setServiceRecords(d.service_records as ServiceRecord[]);
        if (tab === 'inspections' && d.inspections) setInspections(d.inspections as Inspection[]);
        if (tab === 'warranties' && d.warranties) setWarranties(d.warranties as Warranty[]);
        if (tab === 'registration' && d.registrations) setRegistrations(d.registrations as Registration[]);
        if (tab === 'fuel' && d.fuel_logs) setFuelLogs(d.fuel_logs as FuelLog[]);
        if (tab === 'depreciation') {
          if (d.schedule) setDepSchedule(d.schedule as DepreciationSchedule);
          if (d.entries) setDepEntries(d.entries as DepreciationEntry[]);
        }
        if (tab === 'documents' && d.documents) setDocuments(d.documents as AssetDocument[]);
      })
      .catch(() => {});
  };

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    loadTab(tab);
  };

  const saveOverview = async () => {
    if (!asset) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          asset_category: form.asset_category,
          ownership_type: form.ownership_type,
          status: form.status,
          condition: form.condition || null,
          make: form.make || null,
          model: form.model || null,
          year: form.year || null,
          serial_number: form.serial_number || null,
          vin: form.vin || null,
          home_location: form.home_location || null,
          notes: form.notes || null,
          version: asset.version,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setError(t('assets.conflict_error')); return; }
      if (!res.ok) { setError(data?.error?.message ?? t('assets.save_error')); return; }
      setAsset(data.asset as Asset);
      setForm(data.asset as Asset);
      setEditing(false);
      setSuccess(t('assets.saved'));
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError(t('assets.network_error')); } finally { setSaving(false); }
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: t('tabs.overview') },
    { key: 'service', label: t('tabs.service') },
    { key: 'inspections', label: t('tabs.inspections') },
    { key: 'warranties', label: t('tabs.warranties') },
    { key: 'insurance', label: t('tabs.insurance') },
    { key: 'registration', label: t('tabs.registration') },
    { key: 'fuel', label: t('tabs.fuel') },
    { key: 'depreciation', label: t('tabs.depreciation') },
    { key: 'documents', label: t('tabs.documents') },
  ];

  if (!asset) return <div className="flex items-center justify-center h-48"><Spinner className="h-6 w-6" /></div>;

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-4">
        <Link href="/assets" className="hover:text-ink">{t('title')}</Link>
        <span>/</span>
        <span className="text-ink">{asset.name}</span>
      </div>

      {/* OOS banner */}
      {asset.status === 'out_of_service' && (
        <div className="rounded-lg border border-status-danger/40 bg-status-danger-bg px-4 py-3 mb-4 text-sm text-status-danger font-medium">
          {t('assets.oos_banner')}
        </div>
      )}

      {/* Header */}
      <Card padding="none" className="mb-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-ink">{asset.name}</h1>
              <Badge status={asset.status} />
            </div>
            <p className="text-xs text-muted mt-0.5">
              {asset.asset_number} · {asset.asset_category.replace(/_/g, ' ')} · {t('assets.added')} {formatDate(asset.created_at)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 overflow-x-auto">
          <Tabs items={TABS} value={activeTab} onChange={k => switchTab(k as TabKey)} />
        </div>

        <div className="px-6 py-5">
          {error && <div className="rounded border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger mb-4">{error}</div>}
          {success && <div className="rounded border border-status-success/40 bg-status-success-bg p-3 text-sm text-status-success mb-4">{success}</div>}

          {/* Overview tab */}
          {activeTab === 'overview' && (
            editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label={t('assets.field_name')} value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <Select label={t('assets.field_status')} value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">{t('status.active')}</option>
                    <option value="in_repair">{t('assets.status_in_repair')}</option>
                    <option value="out_of_service">{t('status.out_of_service')}</option>
                    <option value="reserved">{t('assets.status_reserved')}</option>
                    <option value="decommissioned">{t('status.disposed')}</option>
                    <option value="sold">{t('assets.status_sold')}</option>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label={t('assets.field_make')} value={form.make ?? ''} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} />
                  <Input label={t('assets.field_model')} value={form.model ?? ''} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
                  <Input label={t('assets.field_year')} type="number" value={form.year ?? ''} onChange={e => setForm(f => ({ ...f, year: e.target.value ? parseInt(e.target.value) : undefined }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label={t('assets.field_serial_number')} value={form.serial_number ?? ''} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} />
                  <Input label={t('assets.field_vin')} value={form.vin ?? ''} onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} />
                </div>
                <Input label={t('assets.field_home_location')} value={form.home_location ?? ''} onChange={e => setForm(f => ({ ...f, home_location: e.target.value }))} />
                <Textarea label={t('assets.field_notes')} rows={3} className="resize-none" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                <div className="flex gap-3">
                  <Button onClick={saveOverview} loading={saving} disabled={saving || !form.name?.trim()}>
                    {t('assets.save_changes')}
                  </Button>
                  <Button variant="secondary" onClick={() => { setEditing(false); setForm(asset); setError(''); }}>
                    {t('assets.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                  <FieldRow label={t('assets.field_category')} value={asset.asset_category.replace(/_/g, ' ')} />
                  <FieldRow label={t('assets.field_ownership')} value={asset.ownership_type} />
                  <FieldRow label={t('assets.field_condition')} value={asset.condition} />
                  <FieldRow label={t('assets.field_make')} value={asset.make} />
                  <FieldRow label={t('assets.field_model')} value={asset.model} />
                  <FieldRow label={t('assets.field_year')} value={asset.year?.toString()} />
                  <FieldRow label={t('assets.field_serial_number')} value={asset.serial_number} />
                  <FieldRow label={t('assets.field_vin')} value={asset.vin} />
                  <FieldRow label={t('assets.field_home_location')} value={asset.home_location} />
                  <FieldRow label={t('assets.field_meter_type')} value={asset.meter_type} />
                  <FieldRow label={t('assets.field_meter_reading')} value={asset.current_meter_reading?.toString()} />
                  <FieldRow label={t('assets.field_purchase_date')} value={formatDate(asset.purchase_date)} />
                  <FieldRow label={t('assets.field_purchase_price')} value={formatCents(asset.purchase_price_cents)} />
                  <FieldRow label={t('assets.field_current_value')} value={formatCents(asset.current_value_cents)} />
                  {asset.dot_regulated && <FieldRow label="DOT Regulated" value="Yes" />}
                  {asset.requires_operator_cert && (
                    <FieldRow label={t('assets.field_required_cert')} value={asset.required_cert_type} />
                  )}
                </div>
                {asset.notes && (
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide mb-1">{t('assets.field_notes')}</p>
                    <p className="text-sm text-ink bg-surface-alt rounded-md p-3">{asset.notes}</p>
                  </div>
                )}
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  {t('assets.edit_asset')}
                </Button>
              </div>
            )
          )}

          {/* Service tab */}
          {activeTab === 'service' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted">{serviceRecords.length} {t('assets.service_records')}</p>
                <Button size="sm" onClick={() => setShowAddService(true)}>
                  + {t('assets.add_service_record')}
                </Button>
              </div>
              {serviceRecords.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">{t('assets.no_service_records')}</p>
              ) : (
                <div className="divide-y divide-line">
                  {serviceRecords.map(rec => (
                    <div key={rec.id} className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-ink">{rec.description}</p>
                          <p className="text-xs text-muted mt-0.5 capitalize">{rec.service_type.replace(/_/g, ' ')} · {formatDate(rec.service_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-ink">{formatCents(rec.total_cost_cents)}</p>
                          {rec.next_service_due_date && (
                            <p className="text-xs text-muted">Next: {formatDate(rec.next_service_due_date)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Inspections tab */}
          {activeTab === 'inspections' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted">{inspections.length} {t('assets.inspections')}</p>
                <Button size="sm" onClick={() => setShowAddInspection(true)}>
                  + {t('assets.record_inspection')}
                </Button>
              </div>
              {inspections.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">{t('assets.no_inspections')}</p>
              ) : (
                <div className="divide-y divide-line">
                  {inspections.map(insp => (
                    <div key={insp.id} className="py-3 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink capitalize">{insp.inspection_type.replace(/_/g, ' ')}</p>
                          <ResultBadge result={insp.result} />
                          {insp.out_of_service && (
                            <Badge status="out_of_service">{t('status.out_of_service')}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">{formatDate(insp.inspected_at)}</p>
                        {insp.notes && <p className="text-xs text-muted mt-1">{insp.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Warranties tab */}
          {activeTab === 'warranties' && (
            <div className="space-y-4">
              {warranties.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">{t('assets.no_warranties')}</p>
              ) : (
                <div className="divide-y divide-line">
                  {warranties.map(w => (
                    <div key={w.id} className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-ink">{w.provider_name}</p>
                          <p className="text-xs text-muted mt-0.5 capitalize">{w.warranty_type} · {formatDate(w.start_date)} – {formatDate(w.expiry_date)}</p>
                          {w.coverage_description && <p className="text-xs text-muted mt-1">{w.coverage_description}</p>}
                        </div>
                        <ExpiryBadge date={w.expiry_date} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Insurance tab */}
          {activeTab === 'insurance' && (
            <div className="space-y-4">
              <p className="text-sm text-ink">
                {t('assets.insurance_see_fleet')}{' '}
                <Link href="/assets/insurance" className="text-brand-600 hover:underline">{t('assets.insurance_policies_page')}</Link>
              </p>
            </div>
          )}

          {/* Registration tab */}
          {activeTab === 'registration' && (
            <div className="space-y-4">
              {registrations.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">{t('assets.no_registrations')}</p>
              ) : (
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <TH>{t('assets.col_type')}</TH>
                      <TH>{t('assets.col_number')}</TH>
                      <TH>{t('assets.col_state')}</TH>
                      <TH>{t('assets.col_expiry')}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {registrations.map(reg => (
                      <TR key={reg.id} className="hover:bg-transparent">
                        <TD className="capitalize">{reg.registration_type.replace(/_/g, ' ')}</TD>
                        <TD className="font-mono text-xs">{reg.registration_number ?? reg.license_plate ?? '—'}</TD>
                        <TD>{reg.state_code ?? '—'}</TD>
                        <TD><ExpiryBadge date={reg.expiry_date} /></TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </div>
          )}

          {/* Fuel tab */}
          {activeTab === 'fuel' && (
            <div className="space-y-4">
              {fuelLogs.length > 0 && (
                <div className="grid grid-cols-2 gap-4 bg-surface-alt rounded-lg p-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">{t('assets.fuel_total_cost')}</p>
                    <p className="text-xl font-semibold text-ink mt-1">
                      {formatCents(fuelLogs.reduce((sum, l) => sum + l.total_cost_cents, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">{t('assets.fuel_total_gallons')}</p>
                    <p className="text-xl font-semibold text-ink mt-1">
                      {fuelLogs.reduce((sum, l) => sum + (l.gallons ?? 0), 0).toFixed(1)} gal
                    </p>
                  </div>
                </div>
              )}
              {fuelLogs.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">{t('assets.no_fuel_logs')}</p>
              ) : (
                <div className="divide-y divide-line">
                  {fuelLogs.map(log => (
                    <div key={log.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-ink">{formatDate(log.log_date)}</p>
                        <p className="text-xs text-muted capitalize">{log.fuel_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-ink">{formatCents(log.total_cost_cents)}</p>
                        {log.gallons && <p className="text-xs text-muted">{log.gallons.toFixed(3)} gal</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Depreciation tab */}
          {activeTab === 'depreciation' && (
            <div className="space-y-5">
              {depSchedule ? (
                <>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                    <FieldRow label={t('assets.dep_method')} value={depSchedule.method.replace(/_/g, ' ')} />
                    <FieldRow label={t('assets.dep_useful_life')} value={`${depSchedule.useful_life_years} yrs`} />
                    <FieldRow label={t('assets.dep_salvage_value')} value={formatCents(depSchedule.salvage_value_cents)} />
                    <FieldRow label={t('assets.dep_current_book_value')} value={formatCents(depSchedule.current_book_value_cents)} />
                  </div>
                  {depEntries.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">{t('assets.dep_entries')}</p>
                      <Table>
                        <THead>
                          <TR className="hover:bg-transparent">
                            <TH>{t('assets.col_period')}</TH>
                            <TH className="text-right">{t('assets.col_amount')}</TH>
                            <TH className="text-right">{t('assets.col_book_value')}</TH>
                          </TR>
                        </THead>
                        <TBody>
                          {depEntries.slice(0, 24).map(e => (
                            <TR key={e.id} className="hover:bg-transparent">
                              <TD>{formatDate(e.period_start)} – {formatDate(e.period_end)}</TD>
                              <TD className="text-right">{formatCents(e.depreciation_amount_cents)}</TD>
                              <TD className="text-right">{formatCents(e.book_value_after_cents)}</TD>
                            </TR>
                          ))}
                        </TBody>
                      </Table>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted py-8 text-center">{t('assets.no_depreciation_schedule')}</p>
              )}
            </div>
          )}

          {/* Documents tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {documents.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">{t('assets.no_documents')}</p>
              ) : (
                <div className="divide-y divide-line">
                  {documents.map(doc => (
                    <div key={doc.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-ink">{doc.title}</p>
                        <p className="text-xs text-muted capitalize">{doc.doc_type.replace(/_/g, ' ')} · {formatDate(doc.created_at)}</p>
                      </div>
                      {doc.expiry_date && <ExpiryBadge date={doc.expiry_date} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Add Service Record slide-over */}
      <AddServiceRecordSlideOver
        open={showAddService}
        onClose={() => setShowAddService(false)}
        assetId={id}
        onSaved={() => {
          setTabLoaded(prev => { const s = new Set(prev); s.delete('service'); return s; });
          loadTab('service');
        }}
        t={t}
      />

      {/* Add Inspection slide-over */}
      <AddInspectionSlideOver
        open={showAddInspection}
        onClose={() => setShowAddInspection(false)}
        assetId={id}
        onSaved={() => {
          setTabLoaded(prev => { const s = new Set(prev); s.delete('inspections'); return s; });
          loadTab('inspections');
        }}
        t={t}
      />
    </div>
  );
}

function AddServiceRecordSlideOver({ open, onClose, assetId, onSaved, t }: {
  open: boolean; onClose: () => void; assetId: string; onSaved: () => void;
  t: (key: string) => string;
}) {
  const [form, setForm] = useState({ service_type: 'pm_scheduled', service_date: '', description: '', total_cost_cents: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.service_date || !form.description) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/assets/${assetId}/service-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: form.service_type,
          service_date: form.service_date,
          description: form.description,
          total_cost_cents: form.total_cost_cents ? Math.round(parseFloat(form.total_cost_cents) * 100) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message ?? t('assets.save_error')); return; }
      onSaved();
      onClose();
      setForm({ service_type: 'pm_scheduled', service_date: '', description: '', total_cost_cents: '' });
    } catch { setError(t('assets.network_error')); } finally { setSaving(false); }
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={t('assets.add_service_record')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('assets.cancel')}</Button>
          <Button onClick={submit} loading={saving} disabled={saving || !form.service_date || !form.description}>
            {t('assets.save_service_record')}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && <div className="rounded border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}
        <Select label={t('assets.service_type')} value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}>
          <option value="oil_change">Oil Change</option>
          <option value="tire_rotation">Tire Rotation</option>
          <option value="brake_service">Brake Service</option>
          <option value="filter_replacement">Filter Replacement</option>
          <option value="pm_scheduled">Scheduled PM</option>
          <option value="pm_unscheduled">Unscheduled PM</option>
          <option value="repair">Repair</option>
          <option value="inspection">Inspection</option>
          <option value="other">Other</option>
        </Select>
        <Input label={`${t('assets.service_date')} *`} type="date" value={form.service_date} onChange={e => setForm(f => ({ ...f, service_date: e.target.value }))} />
        <Textarea label={`${t('assets.service_description')} *`} rows={3} className="resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <Input label={t('assets.service_cost')} type="number" step="0.01" min="0" placeholder="0.00" value={form.total_cost_cents} onChange={e => setForm(f => ({ ...f, total_cost_cents: e.target.value }))} />
      </div>
    </SlideOver>
  );
}

function AddInspectionSlideOver({ open, onClose, assetId, onSaved, t }: {
  open: boolean; onClose: () => void; assetId: string; onSaved: () => void;
  t: (key: string) => string;
}) {
  const [form, setForm] = useState({ inspection_type: 'pre_use', inspected_at: '', result: 'pass', notes: '', out_of_service: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.inspected_at) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/assets/${assetId}/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspection_type: form.inspection_type,
          inspected_at: new Date(form.inspected_at).toISOString(),
          result: form.result,
          notes: form.notes || null,
          out_of_service: form.result === 'fail' ? true : form.out_of_service,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message ?? t('assets.save_error')); return; }
      onSaved();
      onClose();
      setForm({ inspection_type: 'pre_use', inspected_at: '', result: 'pass', notes: '', out_of_service: false });
    } catch { setError(t('assets.network_error')); } finally { setSaving(false); }
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={t('assets.record_inspection')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('assets.cancel')}</Button>
          <Button onClick={submit} loading={saving} disabled={saving || !form.inspected_at}>
            {t('assets.save_inspection')}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && <div className="rounded border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <Select label={t('assets.inspection_type')} value={form.inspection_type} onChange={e => setForm(f => ({ ...f, inspection_type: e.target.value }))}>
            <option value="pre_use">Pre-Use</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
            <option value="osha">OSHA</option>
            <option value="dot">DOT</option>
            <option value="return">Return</option>
          </Select>
          <Select label={t('assets.inspection_result')} value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))}>
            <option value="pass">{t('inspection_result.pass')}</option>
            <option value="fail">{t('inspection_result.fail')}</option>
            <option value="conditional">{t('inspection_result.conditional')}</option>
          </Select>
        </div>
        <Input label={`${t('assets.inspected_at')} *`} type="datetime-local" value={form.inspected_at} onChange={e => setForm(f => ({ ...f, inspected_at: e.target.value }))} />
        {form.result === 'fail' && (
          <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">
            {t('assets.inspection_fail_warning')}
          </div>
        )}
        <Textarea label={t('assets.field_notes')} rows={3} className="resize-none" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
    </SlideOver>
  );
}
