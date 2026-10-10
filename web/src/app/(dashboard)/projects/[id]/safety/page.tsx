'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Badge, Button, Input, Textarea, Select, SlideOver,
  PageHeader, Table, THead, TBody, TR, TH, TD, EmptyState,
} from '@/components/ui';
import { statusLabel } from '@/lib/status';
import { SEVERITY } from '@/lib/colors';

interface Project { id: string; name: string }
interface Incident {
  id: string;
  incident_date: string;
  description: string;
  severity: string;
  status: string;
  version: number;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Incident SEVERITY is a domain scale (DESIGN.md §2.4 / @/lib/colors) — solid chip, not the generic status map. */
function SeverityChip({ severity }: { severity: string }) {
  const color = SEVERITY[severity] ?? SEVERITY.near_miss;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {statusLabel(severity)}
    </span>
  );
}

function IncidentSlideOver({ incident, onClose, onSaved }: {
  incident: Incident; onClose: () => void; onSaved: (i: Incident) => void;
}) {
  const [form, setForm] = useState({
    description: incident.description,
    severity: incident.severity,
    status: incident.status,
    incident_date: incident.incident_date ? incident.incident_date.slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/safety-incidents/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, version: incident.version }),
      });
      const data = await res.json();
      if (res.status === 409) { setError('Incident was updated by someone else — reload.'); return; }
      if (!res.ok) { setError(data?.error?.message ?? 'Save failed'); return; }
      onSaved(data.incident);
    } catch { setError('Network error'); } finally { setSaving(false); }
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      title="Safety Incident"
      width="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>
        )}
        <Input
          label="Incident Date"
          type="date"
          value={form.incident_date}
          onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))}
        />
        <Textarea
          label="Description"
          rows={4}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Severity"
            value={form.severity}
            onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
          >
            <option value="near_miss">Near Miss</option>
            <option value="first_aid">First Aid</option>
            <option value="recordable">Recordable</option>
            <option value="lost_time">Lost Time</option>
            <option value="fatality">Fatality</option>
          </Select>
          <Select
            label="Status"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          >
            <option value="open">Open</option>
            <option value="under_investigation">Under Investigation</option>
            <option value="closed">Closed</option>
          </Select>
        </div>
        <div className="rounded-md border border-status-warning/40 bg-status-warning-bg p-3 text-xs text-status-warning">
          Safety incident records are legally sensitive. Changes are audit-logged.
        </div>
      </div>
    </SlideOver>
  );
}

export default function SafetyPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('safety');

  const [project, setProject] = useState<Project | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);

  const load = useCallback(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/safety-incidents?project_id=${id}&limit=50`).then(r => r.json()).then(d => { if (d.incidents) setIncidents(d.incidents as Incident[]); }),
    ]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/projects" className="hover:text-ink">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
        <span>/</span>
        <span className="text-ink">{t('safety.title')}</span>
      </div>

      <PageHeader
        className="mb-6"
        title={t('safety.title')}
        actions={
          <>
            <Link href={`/projects/${id}/safety/jsa`}>
              <Button variant="secondary">{t('incidents.jsa_records')}</Button>
            </Link>
            <Link href={`/projects/${id}/safety/new`}>
              <Button variant="danger">{t('incidents.report_incident')}</Button>
            </Link>
          </>
        }
      />

      {incidents.length === 0 ? (
        <EmptyState
          title={t('incidents.no_incidents')}
          description={t('incidents.no_incidents_positive')}
        />
      ) : (
        <div className="rounded-lg border border-line bg-surface overflow-hidden">
          <Table>
            <THead>
              <TR className="bg-surface-alt">
                <TH>{t('incidents.date')}</TH>
                <TH>{t('incidents.description')}</TH>
                <TH>{t('incidents.severity')}</TH>
                <TH>{t('incidents.status')}</TH>
              </TR>
            </THead>
            <TBody>
              {incidents.map(inc => (
                <TR key={inc.id} onClick={() => setSelected(inc)} className="cursor-pointer">
                  <TD className="text-muted whitespace-nowrap">{formatDate(inc.incident_date)}</TD>
                  <TD className="max-w-xs truncate">{inc.description}</TD>
                  <TD><SeverityChip severity={inc.severity} /></TD>
                  <TD><Badge status={inc.status} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      {selected && (
        <IncidentSlideOver
          incident={selected}
          onClose={() => setSelected(null)}
          onSaved={updated => { setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i)); setSelected(null); }}
        />
      )}
    </div>
  );
}
