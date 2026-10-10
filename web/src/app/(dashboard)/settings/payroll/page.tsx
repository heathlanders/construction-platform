'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QuickBooksConnectButton } from '@/components/integrations/quickbooks-connect-button';
import { GustoConnectButton } from '@/components/integrations/gusto-connect-button';
import { AdpConnectButton } from '@/components/integrations/adp-connect-button';
import { PageHeader, Card, Button, Input, Table, THead, TBody, TR, TH, TD, EmptyState } from '@/components/ui';

interface IntegrationStatus {
  connected: boolean;
  realm_id?: string;
  company_uuid?: string;
  last_sync_at?: string;
}

interface PayrollSettingsRow {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  settings_id?: string;
  employment_type?: string;
  default_hourly_rate_cents?: number;
  overtime_multiplier?: string;
  pay_frequency?: string;
  gusto_employee_id?: string;
  adp_worker_aoid?: string;
}

interface EditState {
  userId: string;
  employment_type: string;
  default_hourly_rate_cents: number;
  overtime_multiplier: number;
  pay_frequency: string;
}

// Get Monday of current week as YYYY-MM-DD
function currentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function formatRate(cents?: number): string {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}/hr`;
}

function formatRole(role: string): string {
  return role.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Compact controls for the inline table editor (tokenized).
const CELL_CONTROL =
  'text-sm rounded border border-line bg-surface text-ink px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500';

export default function PayrollSettingsPage() {
  const { t } = useTranslation('payroll');

  const [qbStatus, setQbStatus] = useState<IntegrationStatus>({ connected: false });
  const [gustoStatus, setGustoStatus] = useState<IntegrationStatus>({ connected: false });
  const [adpStatus, setAdpStatus] = useState<IntegrationStatus>({ connected: false });

  const [settings, setSettings] = useState<PayrollSettingsRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const [weekStart, setWeekStart] = useState(currentWeekMonday());
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    // Load integration statuses in parallel
    fetch('/api/integrations/quickbooks/status').then((r) => r.json()).then(setQbStatus).catch(() => {});
    fetch('/api/integrations/gusto?action=status').then((r) => r.json()).then(setGustoStatus).catch(() => {});
    fetch('/api/integrations/adp?action=status').then((r) => r.json()).then(setAdpStatus).catch(() => {});

    // Load payroll settings
    fetch('/api/payroll-settings')
      .then((r) => r.json())
      .then((data) => setSettings(data.payroll_settings ?? []))
      .catch(() => {});
  }, []);

  function startEdit(row: PayrollSettingsRow) {
    setEditingId(row.user_id);
    setEditState({
      userId: row.user_id,
      employment_type: row.employment_type ?? 'w2',
      default_hourly_rate_cents: row.default_hourly_rate_cents ?? 0,
      overtime_multiplier: parseFloat(row.overtime_multiplier ?? '1.5'),
      pay_frequency: row.pay_frequency ?? 'biweekly',
    });
  }

  async function saveEdit() {
    if (!editState) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/payroll-settings/${editState.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employment_type: editState.employment_type,
          default_hourly_rate_cents: editState.default_hourly_rate_cents,
          overtime_multiplier: editState.overtime_multiplier,
          pay_frequency: editState.pay_frequency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings((prev) =>
          prev.map((row) =>
            row.user_id === editState.userId
              ? { ...row, ...data.payroll_settings }
              : row,
          ),
        );
        setEditingId(null);
        setEditState(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setExportMsg('');
    setExportError('');
    try {
      const res = await fetch('/api/payroll/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: weekStart }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExportError(data?.error?.message ?? t('payroll.export.error_no_timecards'));
      } else {
        setExportMsg(t('payroll.export.success'));
      }
    } catch {
      setExportError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader title={t('payroll.title')} className="mb-6" />

      <div className="max-w-4xl space-y-6">

        {/* ── Section 1: Connected Payroll Systems ── */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-4">
            {t('payroll.integrations.title')}
          </h2>
          <div className="space-y-4 divide-y divide-line">

            {/* QuickBooks */}
            <div className="pt-4 first:pt-0 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">{t('payroll.integrations.quickbooks.title')}</p>
                <p className="text-xs text-muted mt-0.5">{t('payroll.integrations.quickbooks.desc')}</p>
              </div>
              <div className="flex-shrink-0">
                <QuickBooksConnectButton
                  initialConnected={qbStatus.connected}
                  initialRealmId={qbStatus.realm_id}
                />
              </div>
            </div>

            {/* Gusto */}
            <div className="pt-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">{t('payroll.integrations.gusto.title')}</p>
                <p className="text-xs text-muted mt-0.5">{t('payroll.integrations.gusto.desc')}</p>
              </div>
              <div className="flex-shrink-0">
                <GustoConnectButton
                  initialConnected={gustoStatus.connected}
                  initialCompanyUuid={gustoStatus.company_uuid}
                />
              </div>
            </div>

            {/* ADP */}
            <div className="pt-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">{t('payroll.integrations.adp.title')}</p>
                <p className="text-xs text-muted mt-0.5">{t('payroll.integrations.adp.desc')}</p>
              </div>
              <div className="flex-shrink-0">
                <AdpConnectButton initialConnected={adpStatus.connected} />
              </div>
            </div>

          </div>
        </Card>

        {/* ── Section 2: Employee Payroll Settings ── */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-4">
            {t('payroll.settings.title')}
          </h2>

          {settings.length === 0 ? (
            <EmptyState title="No employees found." />
          ) : (
            <Table>
              <THead>
                <TR className="bg-surface-alt">
                  <TH>{t('payroll.settings.employee')}</TH>
                  <TH>{t('payroll.settings.type')}</TH>
                  <TH>{t('payroll.settings.rate')}</TH>
                  <TH>{t('payroll.settings.frequency')}</TH>
                  <TH>{t('payroll.settings.ot_multiplier')}</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {settings.map((row) => {
                  const isEditing = editingId === row.user_id;
                  return (
                    <TR key={row.user_id}>
                      <TD>
                        <p className="font-medium text-ink">{row.first_name} {row.last_name}</p>
                        <p className="text-xs text-muted">{formatRole(row.role)}</p>
                      </TD>
                      <TD>
                        {isEditing ? (
                          <select
                            value={editState!.employment_type}
                            onChange={(e) => setEditState((s) => s && ({ ...s, employment_type: e.target.value }))}
                            className={`${CELL_CONTROL} w-full`}
                          >
                            <option value="w2">{t('payroll.settings.type_w2')}</option>
                            <option value="contractor_1099">{t('payroll.settings.type_1099')}</option>
                          </select>
                        ) : (
                          <span className="text-ink">
                            {row.employment_type === 'contractor_1099'
                              ? t('payroll.settings.type_1099')
                              : row.employment_type === 'w2'
                              ? t('payroll.settings.type_w2')
                              : t('payroll.settings.no_settings')}
                          </span>
                        )}
                      </TD>
                      <TD>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-muted text-xs">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={((editState!.default_hourly_rate_cents ?? 0) / 100).toFixed(2)}
                              onChange={(e) => setEditState((s) => s && ({
                                ...s,
                                default_hourly_rate_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                              }))}
                              className={`${CELL_CONTROL} w-24`}
                            />
                          </div>
                        ) : (
                          <span className="text-ink">{formatRate(row.default_hourly_rate_cents)}</span>
                        )}
                      </TD>
                      <TD>
                        {isEditing ? (
                          <select
                            value={editState!.pay_frequency}
                            onChange={(e) => setEditState((s) => s && ({ ...s, pay_frequency: e.target.value }))}
                            className={`${CELL_CONTROL} w-full`}
                          >
                            <option value="weekly">{t('payroll.settings.freq_weekly')}</option>
                            <option value="biweekly">{t('payroll.settings.freq_biweekly')}</option>
                            <option value="semimonthly">{t('payroll.settings.freq_semimonthly')}</option>
                            <option value="monthly">{t('payroll.settings.freq_monthly')}</option>
                          </select>
                        ) : (
                          <span className="text-ink">{
                            row.pay_frequency === 'weekly' ? t('payroll.settings.freq_weekly') :
                            row.pay_frequency === 'biweekly' ? t('payroll.settings.freq_biweekly') :
                            row.pay_frequency === 'semimonthly' ? t('payroll.settings.freq_semimonthly') :
                            row.pay_frequency === 'monthly' ? t('payroll.settings.freq_monthly') :
                            t('payroll.settings.no_settings')
                          }</span>
                        )}
                      </TD>
                      <TD>
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            value={editState!.overtime_multiplier}
                            onChange={(e) => setEditState((s) => s && ({ ...s, overtime_multiplier: parseFloat(e.target.value || '1.5') }))}
                            className={`${CELL_CONTROL} w-16`}
                          />
                        ) : (
                          <span className="text-ink">{row.overtime_multiplier ? `×${parseFloat(row.overtime_multiplier).toFixed(2)}` : t('payroll.settings.no_settings')}</span>
                        )}
                      </TD>
                      <TD className="text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                            >
                              {saving ? '…' : t('payroll.settings.save')}
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditState(null); }}
                              className="text-xs font-medium text-muted hover:text-ink"
                            >
                              {t('payroll.settings.cancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(row)}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            {t('payroll.settings.edit')}
                          </button>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>

        {/* ── Section 3: CSV Export ── */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-4">
            {t('payroll.export.title')}
          </h2>
          <div className="flex items-end gap-4">
            <Input
              label={t('payroll.export.week_label')}
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
            />
            <Button onClick={handleExport} loading={exporting} disabled={exporting}>
              {exporting ? t('payroll.export.exporting') : t('payroll.export.button')}
            </Button>
          </div>
          {exportMsg && <p className="mt-3 text-sm text-status-success">{exportMsg}</p>}
          {exportError && <p className="mt-3 text-sm text-status-danger">{exportError}</p>}
        </Card>

      </div>
    </div>
  );
}
