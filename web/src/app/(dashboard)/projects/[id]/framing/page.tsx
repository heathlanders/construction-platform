'use client';

import { Fragment, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Card,
  PageHeader,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
} from '@/components/ui';

interface CorrectionItem {
  id: string;
  description: string;
  location: string | null;
  severity: string;
  status: string;
  version: number;
}

const SEVERITIES = ['minor','major','safety'];
const ITEM_STATUSES = ['open','in_progress','resolved'];
// Severity is a DOMAIN scale (minor/major/safety) — kept as its own scale, colored via
// canonical status TOKENS (not folded into the generic status map).
const SEVERITY_CLASSES: Record<string, string> = {
  minor: 'bg-status-neutral-bg text-status-neutral',
  major: 'bg-status-warning-bg text-status-warning',
  safety: 'bg-status-danger-bg text-status-danger',
};

function FramingCorrections({ inspectionId }: { inspectionId: string }) {
  const [items, setItems] = useState<CorrectionItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`/api/framing-correction-items?framing_inspection_id=${inspectionId}`)
      .then((r) => r.json())
      .then((d) => setItems(d.framing_correction_items ?? []))
      .catch(() => setErr('Failed to load correction items'))
      .finally(() => setLoaded(true));
  }, [inspectionId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setErr('');
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { framing_inspection_id: inspectionId };
    ['description','location','severity','status'].forEach((k) => { const v = fd.get(k) as string; if (v) body[k] = v; });
    const res = await fetch('/api/framing-correction-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { const data = await res.json(); setItems((prev) => [data.framing_correction_item, ...prev]); setShowForm(false); }
    else setErr('Failed to add correction item');
  };

  const setStatus = async (item: CorrectionItem, status: string) => {
    const res = await fetch(`/api/framing-correction-items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, version: item.version }) });
    if (res.ok) { const data = await res.json(); setItems((prev) => prev.map((it) => it.id === item.id ? data.framing_correction_item : it)); }
  };

  return (
    <div className="bg-surface-alt px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">Correction Items</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs font-medium text-brand-600 hover:text-brand-700">+ Add item</button>
      </div>
      {err && <p className="text-xs text-status-danger mb-2">{err}</p>}
      {showForm && (
        <Card padding="sm" className="mb-3 grid grid-cols-4 gap-3">
          <form onSubmit={handleCreate} className="contents">
            <div className="col-span-2">
              <Input label="Description *" type="text" name="description" required placeholder="What needs correcting" />
            </div>
            <Input label="Location" type="text" name="location" placeholder="e.g. NW corner" />
            <Select label="Severity" name="severity">{SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</Select>
            <div className="col-span-4 flex gap-2">
              <Button type="submit" size="sm" loading={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      {loaded && items.length === 0 ? <p className="text-xs text-muted py-2">No correction items.</p> : (
        <Table className="text-xs">
          <THead>
            <tr>
              <TH>Description</TH><TH>Location</TH>
              <TH>Severity</TH><TH>Status</TH><TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {items.map((it) => (
              <TR key={it.id}>
                <TD>{it.description}</TD>
                <TD className="text-muted">{it.location ?? '—'}</TD>
                <TD><Badge className={`capitalize ${SEVERITY_CLASSES[it.severity] ?? 'bg-status-neutral-bg text-status-neutral'}`}>{it.severity}</Badge></TD>
                <TD><Badge status={it.status} className="capitalize">{it.status.replace(/_/g, ' ')}</Badge></TD>
                <TD className="text-right">
                  {it.status !== 'resolved' && (
                    <Select value="" onChange={(e) => e.target.value && setStatus(it, e.target.value)} className="inline-block w-auto px-2 py-1 text-xs">
                      <option value="">Set…</option>
                      {ITEM_STATUSES.filter((s) => s !== it.status).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </Select>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

interface FramingInspection {
  id: string;
  section: string;
  inspection_date: string | null;
  inspector_name: string | null;
  status: string;
  correction_note: string | null;
  notes: string | null;
  version: number;
}

const SECTIONS = ['exterior_walls','roof_trusses','floor_system','sheathing','interior_walls','other'];
const STATUSES = ['pending','passed','failed','requires_correction'];

export default function FramingPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [inspections, setInspections] = useState<FramingInspection[]>([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/framing-inspections?project_id=${projectId}`)
      .then((r) => r.json())
      .then((d) => setInspections(d.framing_inspections ?? []))
      .catch(() => setError('Failed to load framing inspections'));
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { project_id: projectId };
    ['section','inspection_date','inspector_name','status','correction_note','notes'].forEach((k) => {
      const v = fd.get(k) as string;
      if (v) body[k] = v;
    });
    const res = await fetch('/api/framing-inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setInspections((prev) => [data.framing_inspection, ...prev]);
      setShowForm(false);
    } else {
      setError('Failed to create framing inspection');
    }
  };

  return (
    <div>
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Link href={`/projects/${projectId}`} className="hover:text-ink">Project</Link>
          <span>›</span>
          <span>Framing</span>
        </div>
        <PageHeader
          title="Framing Inspections"
          actions={<Button size="sm" onClick={() => setShowForm(!showForm)}>+ Add Inspection</Button>}
        />
      </div>

      {error && (
        <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 mb-4 text-sm text-status-danger">{error}</div>
      )}

      {showForm && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-sm font-semibold text-ink mb-4">New Framing Inspection</h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Section *" name="section" required>
                {SECTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </Select>
              <Select label="Status" name="status">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </Select>
              <Input label="Inspection Date" type="date" name="inspection_date" />
              <Input label="Inspector Name" type="text" name="inspector_name" placeholder="e.g. County Inspector" />
              <div className="col-span-2">
                <Input label="Correction Note" type="text" name="correction_note" placeholder="Required if failed or requires correction" />
              </div>
              <div className="col-span-2">
                <Textarea label="Notes" name="notes" rows={2} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" loading={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {inspections.length === 0 && !showForm ? (
        <EmptyState
          title="No framing inspections recorded"
          description="Add an inspection to get started."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Section</TH>
                <TH>Date</TH>
                <TH>Inspector</TH>
                <TH>Status</TH>
                <TH>Correction</TH>
                <TH />
              </tr>
            </THead>
            <TBody>
              {inspections.map((i) => (
                <Fragment key={i.id}>
                  <TR className="cursor-pointer" onClick={() => setExpanded(expanded === i.id ? null : i.id)}>
                    <TD className="capitalize font-medium">{i.section.replace(/_/g, ' ')}</TD>
                    <TD className="text-muted">{i.inspection_date ?? '—'}</TD>
                    <TD className="text-muted">{i.inspector_name ?? '—'}</TD>
                    <TD>
                      <Badge status={i.status} className="capitalize">{i.status.replace(/_/g, ' ')}</Badge>
                    </TD>
                    <TD className="text-muted text-xs max-w-xs truncate">{i.correction_note ?? '—'}</TD>
                    <TD className="text-right text-muted">{expanded === i.id ? '▾' : '▸'}</TD>
                  </TR>
                  {expanded === i.id && (
                    <tr><td colSpan={6} className="p-0"><FramingCorrections inspectionId={i.id} /></td></tr>
                  )}
                </Fragment>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
