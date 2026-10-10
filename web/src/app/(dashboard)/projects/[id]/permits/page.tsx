'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Select,
  Input,
  Textarea,
  SlideOver,
  PageHeader,
  Card,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
  SkeletonRows,
} from '@/components/ui';

interface Project {
  id: string;
  name: string;
  state: string | null;
  city?: string | null;
  zip?: string | null;
  county_fips?: string | null;
  county_name?: string | null;
}

// Matched AHJ from the jurisdiction engine (/api/jurisdictions/resolve).
interface ResolvedAhj {
  ahj_name: string;
  ahj_level: string;
  permit_office?: string | null;
  phone?: string | null;
  address?: string | null;
  contact_name?: string | null;
}

interface Permit {
  id: string;
  permit_type: string;
  permit_number: string | null;
  building_type: string;
  state_code: string;
  code_type: string | null;
  code_edition: string | null;
  nec_edition: string | null;
  jurisdiction_notes: string | null;
  ahj_name: string | null;
  status: string;
  applied_date: string | null;
  approved_date: string | null;
  version: number;
  created_at: string;
}

// Normalized jurisdiction display, independent of trade-specific response shape.
interface JurisdictionView {
  state_name: string;
  code_label: string;   // e.g. "NEC 2020", "UPC 2021", "IMC 2021"
  notes: string | null;
}

// Trade registry — one entry per permit_type. codesPath maps to the read-only codes proxy.
const PERMIT_TYPES = [
  { value: 'electrical', label: 'Electrical',        codesPath: 'electrical-codes' },
  { value: 'plumbing',   label: 'Plumbing',          codesPath: 'plumbing-codes' },
  { value: 'mechanical', label: 'Mechanical (HVAC)', codesPath: 'mechanical-codes' },
  { value: 'building',   label: 'Building',          codesPath: 'building-codes' },
] as const;

type PermitTypeValue = (typeof PERMIT_TYPES)[number]['value'];

const PERMIT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PERMIT_TYPES.map((p) => [p.value, p.label]),
);

// Categorical trade colors (not status) — kept as a small per-trade palette.
const PERMIT_TYPE_BADGE: Record<string, string> = {
  electrical: 'bg-amber-50 text-amber-700',
  plumbing:   'bg-sky-50 text-sky-700',
  mechanical: 'bg-teal-50 text-teal-700',
  building:   'bg-stone-100 text-stone-700',
};

const BUILDING_TYPE_LABELS: Record<string, string> = {
  residential_sf: 'Residential — Single Family',
  residential_mf: 'Residential — Multi-Family',
  commercial:     'Commercial',
  industrial:     'Industrial',
};

// Permit status → canonical status vocabulary (lib/status). `failed_inspection`
// isn't a canonical key, so normalize it to `failed` to keep the danger color.
function permitStatusState(status: string): string {
  return status === 'failed_inspection' ? 'failed' : status;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Code label for a permit row, trade-neutral with legacy fallback to nec_edition.
function permitCodeLabel(p: Permit): string {
  if (p.code_type && p.code_edition) return `${p.code_type} ${p.code_edition}`;
  if (p.nec_edition) return `NEC ${p.nec_edition}`;
  return '—';
}

// Fetch + normalize the governing code for a state under a given permit type.
async function fetchJurisdiction(
  permitType: PermitTypeValue,
  state: string,
): Promise<JurisdictionView | null> {
  const entry = PERMIT_TYPES.find((p) => p.value === permitType)!;
  try {
    const res = await fetch(`/api/${entry.codesPath}/jurisdiction/${state}`);
    if (!res.ok) return null;
    const data = await res.json();
    const j = data.jurisdiction;
    if (!j) return null;
    let code_label: string;
    if (permitType === 'electrical') {
      code_label = j.nec_label ?? `NEC ${j.nec_edition ?? ''}`.trim();
    } else if (permitType === 'building') {
      // Building family (IRC/IBC) depends on occupancy, not the state — show ICC + edition.
      code_label = `ICC ${j.edition ?? ''}`.trim();
    } else {
      code_label = `${j.code_family ?? ''} ${j.edition ?? ''}`.trim();
    }
    return { state_name: j.state_name, code_label, notes: j.notes ?? null };
  } catch {
    return null;
  }
}

function NewPermitSlideOver({
  projectId, projectState, projectCity, projectCountyFips, onClose, onCreated,
}: {
  projectId: string;
  projectState: string | null;
  projectCity: string | null;
  projectCountyFips: string | null;
  onClose: () => void;
  onCreated: (p: Permit) => void;
}) {
  const { t: tE } = useTranslation('trade-electrical');
  const [form, setForm] = useState({
    permit_type: 'electrical' as PermitTypeValue,
    building_type: '',
    permit_number: '',
    ahj_name: '',
    ahj_address: '',
    ahj_phone: '',
    ahj_contact_name: '',
    applied_date: '',
    notes: '',
    auto_generate_milestones: true,
  });
  const [jurisdiction, setJurisdiction] = useState<JurisdictionView | null>(null);
  const [ahj, setAhj] = useState<ResolvedAhj | null>(null);
  // Track the AHJ name we auto-filled, so user edits are never overwritten.
  const [autoFilledAhjName, setAutoFilledAhjName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Re-resolve jurisdiction whenever the selected trade (or state) changes.
  useEffect(() => {
    if (!projectState) { setJurisdiction(null); return; }
    let active = true;
    fetchJurisdiction(form.permit_type, projectState).then((j) => { if (active) setJurisdiction(j); });
    return () => { active = false; };
  }, [form.permit_type, projectState]);

  // Resolve the matched AHJ (city/county) from the jurisdiction engine and autofill the AHJ
  // fields when the user hasn't typed their own. Independent of trade — AHJ is geo-only.
  useEffect(() => {
    if (!projectState) { setAhj(null); return; }
    let active = true;
    const params = new URLSearchParams({ state: projectState });
    if (projectCity) params.set('city', projectCity);
    if (projectCountyFips) params.set('county_fips', projectCountyFips);
    fetch(`/api/jurisdictions/ahj?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        const a: ResolvedAhj | null = data?.ahj ?? null;
        setAhj(a);
        if (a) {
          setForm((f) => {
            const next = { ...f };
            // Only prefill blank fields or ones we previously auto-filled.
            if (!f.ahj_name || f.ahj_name === autoFilledAhjName) next.ahj_name = a.ahj_name;
            if (!f.ahj_phone) next.ahj_phone = a.phone ?? '';
            if (!f.ahj_address) next.ahj_address = a.address ?? '';
            if (!f.ahj_contact_name) next.ahj_contact_name = a.contact_name ?? '';
            return next;
          });
          setAutoFilledAhjName(a.ahj_name);
        }
      })
      .catch(() => { if (active) setAhj(null); });
    return () => { active = false; };
    // autoFilledAhjName intentionally omitted — prefill should run on geo change, not on its own writes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectState, projectCity, projectCountyFips]);

  const save = async () => {
    if (!form.building_type) { setError('Building type is required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/permits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id:               projectId,
          permit_type:              form.permit_type,
          building_type:            form.building_type,
          permit_number:            form.permit_number || undefined,
          ahj_name:                 form.ahj_name || undefined,
          ahj_address:              form.ahj_address || undefined,
          ahj_phone:                form.ahj_phone || undefined,
          ahj_contact_name:         form.ahj_contact_name || undefined,
          applied_date:             form.applied_date || undefined,
          notes:                    form.notes || undefined,
          auto_generate_milestones: form.auto_generate_milestones,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message ?? tE('electrical.permits.failed_to_save')); return; }
      onCreated(data.permit);
    } catch {
      setError(tE('electrical.permits.failed_to_save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      title={tE('electrical.permits.form_title')}
      footer={
        <Button onClick={save} loading={saving} className="w-full">
          {saving ? tE('electrical.permits.saving') : tE('electrical.permits.save_permit')}
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Jurisdiction info box — reflects the selected trade's governing model code */}
        {jurisdiction && (
          <div className="rounded-md border border-status-info/30 bg-status-info-bg p-3 text-xs text-status-info">
            <span className="font-medium">{tE('electrical.permits.jurisdiction_label')}:</span>{' '}
            {jurisdiction.code_label} — {jurisdiction.state_name}
            {jurisdiction.notes && (
              <p className="mt-1 text-status-info/80">{jurisdiction.notes}</p>
            )}
          </div>
        )}

        {/* Matched AHJ box — sub-state Authority Having Jurisdiction (auto-filled below) */}
        {ahj && (
          <div className="rounded-md border border-status-success/30 bg-status-success-bg p-3 text-xs text-status-success">
            <span className="font-medium">AHJ ({ahj.ahj_level}):</span> {ahj.ahj_name}
            {ahj.permit_office && <p className="mt-0.5 text-status-success/80">{ahj.permit_office}</p>}
            {(ahj.phone || ahj.address) && (
              <p className="mt-0.5 text-status-success/80">{[ahj.phone, ahj.address].filter(Boolean).join(' · ')}</p>
            )}
            <p className="mt-1 text-status-success/70">AHJ contact fields below were pre-filled — edit as needed.</p>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-status-danger/40 bg-status-danger-bg px-3 py-2 text-sm text-status-danger">
            {error}
          </div>
        )}

        {/* Trade / permit type */}
        <Select
          label="Trade *"
          value={form.permit_type}
          onChange={(e) => setForm({ ...form, permit_type: e.target.value as PermitTypeValue })}
        >
          {PERMIT_TYPES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </Select>

        <Select
          label={`${tE('electrical.permits.building_type_label')} *`}
          value={form.building_type}
          onChange={(e) => setForm({ ...form, building_type: e.target.value })}
        >
          <option value="">{tE('electrical.permits.select_building_type')}</option>
          {Object.entries(BUILDING_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>

        <Input
          label={tE('electrical.permits.permit_number')}
          type="text"
          value={form.permit_number}
          onChange={(e) => setForm({ ...form, permit_number: e.target.value })}
          placeholder={tE('electrical.permits.permit_number_placeholder')}
        />

        <Input
          label={tE('electrical.permits.ahj_name')}
          type="text"
          value={form.ahj_name}
          onChange={(e) => setForm({ ...form, ahj_name: e.target.value })}
          placeholder="e.g. City of Madison Building Inspection"
        />

        <Input
          label={tE('electrical.permits.ahj_phone')}
          type="tel"
          value={form.ahj_phone}
          onChange={(e) => setForm({ ...form, ahj_phone: e.target.value })}
        />

        <Input
          label={tE('electrical.permits.ahj_contact')}
          type="text"
          value={form.ahj_contact_name}
          onChange={(e) => setForm({ ...form, ahj_contact_name: e.target.value })}
        />

        <Input
          label={tE('electrical.permits.applied_date')}
          type="date"
          value={form.applied_date}
          onChange={(e) => setForm({ ...form, applied_date: e.target.value })}
        />

        <Textarea
          label={tE('electrical.permits.notes')}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
        />

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.auto_generate_milestones}
            onChange={(e) => setForm({ ...form, auto_generate_milestones: e.target.checked })}
            className="mt-0.5"
          />
          <div>
            <span className="text-sm font-medium text-ink">{tE('electrical.permits.auto_generate_milestones')}</span>
            <p className="text-xs text-muted mt-0.5">{tE('electrical.permits.auto_generate_milestones_hint')}</p>
          </div>
        </label>
      </div>
    </SlideOver>
  );
}

export default function PermitsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('common');
  const { t: tE } = useTranslation('trade-electrical');

  const [project, setProject] = useState<Project | null>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [tradeFilter, setTradeFilter] = useState<string>('');
  const [showNew, setShowNew] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/projects/${id}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then((data) => { if (data) setProject(data.project); })
      .catch(() => setNotFound(true));

    fetch(`/api/permits?project_id=${id}`)
      .then((r) => r.json())
      .then((data) => setPermits(data.permits ?? []))
      .catch(() => {});
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (notFound) return <EmptyState title={t('common.no_results')} className="mt-8" />;
  if (!project) return <div className="py-8"><SkeletonRows rows={5} /></div>;

  const visiblePermits = tradeFilter ? permits.filter((p) => p.permit_type === tradeFilter) : permits;

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/projects" className="hover:text-ink">{t('nav.projects')}</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-ink">{project.name}</Link>
        <span>/</span>
        <Link href={`/projects/${id}/trade`} className="hover:text-ink">{t('trade.modules_title')}</Link>
        <span>/</span>
        <span className="text-ink">Permits</span>
      </div>

      <PageHeader
        title="Permits"
        className="mb-6"
        actions={
          <Button onClick={() => setShowNew(true)}>{tE('electrical.permits.new_permit')}</Button>
        }
      />

      {/* Trade filter */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setTradeFilter('')}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            tradeFilter === ''
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-line bg-surface text-muted hover:border-brand-500'
          }`}
        >
          All
        </button>
        {PERMIT_TYPES.map((p) => (
          <button
            key={p.value}
            onClick={() => setTradeFilter(p.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              tradeFilter === p.value
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-line bg-surface text-muted hover:border-brand-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Permit table */}
      {visiblePermits.length === 0 ? (
        <EmptyState title={tE('electrical.permits.no_permits')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR className="bg-surface-alt">
                <TH>{tE('electrical.permits.permit_number')}</TH>
                <TH>Trade</TH>
                <TH>Building Type</TH>
                <TH>Code</TH>
                <TH>Status</TH>
                <TH>{tE('electrical.permits.ahj_name')}</TH>
                <TH>{tE('electrical.permits.applied_date')}</TH>
              </TR>
            </THead>
            <TBody>
              {visiblePermits.map((permit) => (
                <TR
                  key={permit.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/projects/${id}/permits/${permit.id}`)}
                >
                  <TD className="font-medium text-brand-600">
                    {permit.permit_number ?? <span className="text-muted italic">Pending</span>}
                  </TD>
                  <TD>
                    <Badge className={`${PERMIT_TYPE_BADGE[permit.permit_type] ?? 'bg-surface-alt text-ink'}`}>
                      {PERMIT_TYPE_LABELS[permit.permit_type] ?? permit.permit_type}
                    </Badge>
                  </TD>
                  <TD className="text-ink">{BUILDING_TYPE_LABELS[permit.building_type] ?? permit.building_type}</TD>
                  <TD>
                    <Badge className="bg-status-info-bg text-status-info">
                      {permitCodeLabel(permit)}
                    </Badge>
                  </TD>
                  <TD>
                    <Badge status={permitStatusState(permit.status)} className="capitalize">
                      {permit.status.replace(/_/g, ' ')}
                    </Badge>
                  </TD>
                  <TD className="text-ink">{permit.ahj_name ?? '—'}</TD>
                  <TD className="text-muted">{formatDate(permit.applied_date)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {showNew && (
        <NewPermitSlideOver
          projectId={id}
          projectState={project.state}
          projectCity={project.city ?? null}
          projectCountyFips={project.county_fips ?? null}
          onClose={() => setShowNew(false)}
          onCreated={(p) => {
            setShowNew(false);
            router.push(`/projects/${id}/permits/${p.id}`);
          }}
        />
      )}
    </div>
  );
}
