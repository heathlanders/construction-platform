'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Select,
  Card,
  PageHeader,
  KpiTile,
  StatusPill,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  SlideOver,
  EmptyState,
} from '@/components/ui';

interface WarrantyDashboard {
  active_warranties: number;
  open_claims: number;
  expiring_soon_count: number;
  active_policies: number;
}

interface Warranty {
  id: string;
  title: string;
  status: string;
  effective_date: string;
  homeowner_name: string | null;
  project_id: string;
  project_name: string | null;
  open_claims_count: number;
}

interface Project {
  id: string;
  name: string;
}

interface CoverageTemplate {
  id: string;
  name: string;
  is_system_template: boolean;
}

interface CreateForm {
  project_id: string;
  title: string;
  effective_date: string;
  homeowner_name: string;
  homeowner_email: string;
  homeowner_phone: string;
  homeowner_address: string;
  template_id: string;
}

const EMPTY_FORM: CreateForm = {
  project_id: '',
  title: '',
  effective_date: '',
  homeowner_name: '',
  homeowner_email: '',
  homeowner_phone: '',
  homeowner_address: '',
  template_id: '',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function WarrantiesPage() {
  const { t } = useTranslation('warranties');
  const [dashboard, setDashboard] = useState<WarrantyDashboard | null>(null);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<CoverageTemplate[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [tierBlocked, setTierBlocked] = useState(false);

  const loadWarranties = () => {
    const params = new URLSearchParams({ limit: '100' });
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/builder-warranties?${params.toString()}`)
      .then(r => { if (r.status === 402) { setTierBlocked(true); return null; } return r.json(); })
      .then(d => { if (d?.warranties) setWarranties(d.warranties as Warranty[]); })
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/builder-warranties/dashboard')
      .then(r => { if (r.status === 402) { setTierBlocked(true); return null; } return r.json(); })
      .then(d => { if (d?.dashboard) setDashboard(d.dashboard as WarrantyDashboard); })
      .catch(() => {});
    fetch('/api/projects?limit=100&status=active')
      .then(r => r.json())
      .then(d => { if (d.projects) setProjects(d.projects as Project[]); })
      .catch(() => {});
    fetch('/api/warranty-coverage-templates?limit=100')
      .then(r => r.json())
      .then(d => { if (d.templates) setTemplates(d.templates as CoverageTemplate[]); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadWarranties(); }, [statusFilter]);

  if (tierBlocked) {
    return (
      <EmptyState
        className="py-24"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
        title={t('upgrade_title')}
        description={t('upgrade_message')}
      />
    );
  }

  const filtered = warranties.filter(w =>
    !search ||
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    (w.homeowner_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (w.project_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const createWarranty = async () => {
    if (!form.project_id || !form.title || !form.effective_date) return;
    setSaving(true);
    setCreateError('');
    try {
      const res = await fetch('/api/builder-warranties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: form.project_id,
          title: form.title,
          effective_date: form.effective_date,
          homeowner_name: form.homeowner_name || null,
          homeowner_email: form.homeowner_email || null,
          homeowner_phone: form.homeowner_phone || null,
          homeowner_address: form.homeowner_address || null,
          template_id: form.template_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data?.error?.message ?? t('errors.save_failed')); return; }
      setShowCreate(false);
      setForm(EMPTY_FORM);
      loadWarranties();
    } catch { setCreateError(t('errors.network_error')); } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title={t('page_title')}
        className="mb-6"
        actions={
          <Button onClick={() => { setShowCreate(true); setCreateError(''); setForm(EMPTY_FORM); }}>
            + {t('new_warranty')}
          </Button>
        }
      />

      {/* Summary cards */}
      {dashboard && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiTile label={t('dashboard.active_warranties')} value={dashboard.active_warranties} />
          <KpiTile
            label={t('dashboard.open_claims')}
            value={<span className={dashboard.open_claims > 0 ? 'text-status-warning' : undefined}>{dashboard.open_claims}</span>}
          />
          <KpiTile
            label={t('dashboard.expiring_soon')}
            value={<span className={dashboard.expiring_soon_count > 0 ? 'text-status-warning' : undefined}>{dashboard.expiring_soon_count}</span>}
          />
          <KpiTile label={t('dashboard.active_policies')} value={dashboard.active_policies} />
        </div>
      )}

      {/* Filters + table */}
      <Card padding="none" className="mb-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <Input
            type="text"
            placeholder={t('filter.search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">{t('filter.all_statuses')}</option>
            <option value="draft">{t('status.draft')}</option>
            <option value="active">{t('status.active')}</option>
            <option value="expired">{t('status.expired')}</option>
            <option value="voided">{t('status.voided')}</option>
          </Select>
        </div>

        <Table>
          <THead>
            <TR className="bg-surface-alt hover:bg-surface-alt">
              <TH>{t('col.project')}</TH>
              <TH>{t('col.title')}</TH>
              <TH>{t('col.homeowner')}</TH>
              <TH>{t('col.status')}</TH>
              <TH>{t('col.effective_date')}</TH>
              <TH>{t('col.open_claims')}</TH>
              <TH>{t('col.actions')}</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.length === 0 && (
              <TR>
                <TD colSpan={7} className="px-4 py-8 text-center text-muted">{t('no_warranties')}</TD>
              </TR>
            )}
            {filtered.map(w => (
              <TR
                key={w.id}
                className="cursor-pointer"
                onClick={() => setSelectedWarranty(w)}
              >
                <TD className="text-muted">{w.project_name ?? '—'}</TD>
                <TD className="font-medium text-ink">{w.title}</TD>
                <TD className="text-muted">{w.homeowner_name ?? '—'}</TD>
                <TD><StatusPill status={w.status} label={t(`status.${w.status}`)} /></TD>
                <TD className="text-muted">{formatDate(w.effective_date)}</TD>
                <TD>
                  {w.open_claims_count > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-status-warning-bg text-status-warning text-xs font-bold">
                      {w.open_claims_count}
                    </span>
                  ) : (
                    <span className="text-muted">0</span>
                  )}
                </TD>
                <TD>
                  <Link
                    href={`/warranties/${w.id}`}
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    {t('open_detail')}
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* Quick-view slide-over */}
      <SlideOver
        open={!!selectedWarranty}
        onClose={() => setSelectedWarranty(null)}
        title={selectedWarranty?.title}
      >
        {selectedWarranty && (
          <div className="space-y-5">
            <StatusPill status={selectedWarranty.status} label={t(`status.${selectedWarranty.status}`)} />
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('col.project')}</p>
                <p className="text-sm text-ink">{selectedWarranty.project_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('col.homeowner')}</p>
                <p className="text-sm text-ink">{selectedWarranty.homeowner_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('col.effective_date')}</p>
                <p className="text-sm text-ink">{formatDate(selectedWarranty.effective_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('col.open_claims')}</p>
                <p className="text-sm text-ink">{selectedWarranty.open_claims_count}</p>
              </div>
            </div>
            <Link href={`/warranties/${selectedWarranty.id}`}>
              <Button>{t('open_detail')}</Button>
            </Link>
          </div>
        )}
      </SlideOver>

      {/* Create slide-over */}
      <SlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('new_warranty')}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCreate(false)}
            >
              {t('form.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={createWarranty}
              loading={saving}
              disabled={saving || !form.project_id || !form.title || !form.effective_date}
            >
              {saving ? t('form.creating') : t('form.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {createError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{createError}</div>
          )}

          <Select
            label={t('form.project')}
            value={form.project_id}
            onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
          >
            <option value="">{t('form.select_project')}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>

          <Input
            label={t('form.title')}
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />

          <Input
            label={t('form.effective_date')}
            type="date"
            value={form.effective_date}
            onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))}
          />

          <Input
            label={t('form.homeowner_name')}
            value={form.homeowner_name}
            onChange={e => setForm(f => ({ ...f, homeowner_name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('form.homeowner_email')}
              type="email"
              value={form.homeowner_email}
              onChange={e => setForm(f => ({ ...f, homeowner_email: e.target.value }))}
            />
            <Input
              label={t('form.homeowner_phone')}
              type="tel"
              value={form.homeowner_phone}
              onChange={e => setForm(f => ({ ...f, homeowner_phone: e.target.value }))}
            />
          </div>

          <Input
            label={t('form.homeowner_address')}
            value={form.homeowner_address}
            onChange={e => setForm(f => ({ ...f, homeowner_address: e.target.value }))}
          />

          <Select
            label={t('form.template')}
            value={form.template_id}
            onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}
          >
            <option value="">{t('form.no_template')}</option>
            {templates.map(tmpl => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name}{tmpl.is_system_template ? ` (${t('system_badge')})` : ''}
              </option>
            ))}
          </Select>
        </div>
      </SlideOver>
    </div>
  );
}
