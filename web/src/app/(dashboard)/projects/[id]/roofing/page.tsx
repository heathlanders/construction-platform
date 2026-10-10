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

interface RoofingQaRecord {
  id: string;
  qa_type: string;
  inspection_date: string | null;
  result: string;
  measured_value: number | null;
  unit: string | null;
  inspector_name: string | null;
  version: number;
}

const QA_TYPES = ['deck','underlayment_dry_in','flashing','seam_weld','fastener_pull','water_test','manufacturer_warranty','final','other'];
const QA_TYPE_LABELS: Record<string, string> = {
  deck: 'Deck', underlayment_dry_in: 'Underlayment / Dry-In', flashing: 'Flashing', seam_weld: 'Seam Weld',
  fastener_pull: 'Fastener Pull', water_test: 'Water Test', manufacturer_warranty: 'Mfr. Warranty', final: 'Final', other: 'Other',
};
// Result values map to canonical status keys (lib/status) for coloring — no per-screen colors.
const RESULT_STATUS: Record<string, string> = { pass: 'passed', fail: 'failed', pending: 'pending' };

function RoofingQa({ systemId }: { systemId: string }) {
  const [recs, setRecs] = useState<RoofingQaRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`/api/roofing-qa-records?roofing_system_id=${systemId}`)
      .then((r) => r.json())
      .then((d) => setRecs(d.roofing_qa_records ?? []))
      .catch(() => setErr('Failed to load QA records'))
      .finally(() => setLoaded(true));
  }, [systemId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setErr('');
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { roofing_system_id: systemId };
    ['qa_type','inspection_date','result','unit','inspector_name'].forEach((k) => { const v = fd.get(k) as string; if (v) body[k] = v; });
    const mv = fd.get('measured_value') as string; if (mv) body.measured_value = parseFloat(mv);
    const res = await fetch('/api/roofing-qa-records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { const data = await res.json(); setRecs((prev) => [data.roofing_qa_record, ...prev]); setShowForm(false); }
    else setErr('Failed to add QA record');
  };

  return (
    <div className="bg-surface-alt px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">QA / Inspection Records</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs font-medium text-brand-600 hover:text-brand-700">+ Add QA record</button>
      </div>
      {err && <p className="text-xs text-status-danger mb-2">{err}</p>}
      {showForm && (
        <Card padding="sm" className="mb-3 grid grid-cols-3 gap-3">
          <form onSubmit={handleCreate} className="contents">
            <Select label="QA Type *" name="qa_type" required>
              {QA_TYPES.map((t) => <option key={t} value={t}>{QA_TYPE_LABELS[t]}</option>)}
            </Select>
            <Input label="Date" type="date" name="inspection_date" />
            <Select label="Result" name="result" defaultValue="pending">
              <option value="pending">pending</option><option value="pass">pass</option><option value="fail">fail</option>
            </Select>
            <Input label="Measured" type="number" name="measured_value" step="0.01" placeholder="e.g. 250" />
            <Input label="Unit" type="text" name="unit" placeholder="lbf / count" />
            <Input label="Inspector" type="text" name="inspector_name" />
            <div className="col-span-3 flex gap-2">
              <Button type="submit" size="sm" loading={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      {loaded && recs.length === 0 ? <p className="text-xs text-muted py-2">No QA records yet.</p> : (
        <Table className="text-xs">
          <THead>
            <tr>
              <TH>Type</TH><TH>Date</TH>
              <TH className="text-right">Measured</TH><TH>Result</TH><TH>Inspector</TH>
            </tr>
          </THead>
          <TBody>
            {recs.map((rec) => (
              <TR key={rec.id}>
                <TD>{QA_TYPE_LABELS[rec.qa_type] ?? rec.qa_type}</TD>
                <TD>{rec.inspection_date ?? '—'}</TD>
                <TD className="text-right">{rec.measured_value != null ? `${rec.measured_value}${rec.unit ? ' ' + rec.unit : ''}` : '—'}</TD>
                <TD><Badge status={RESULT_STATUS[rec.result] ?? rec.result} className="capitalize">{rec.result}</Badge></TD>
                <TD className="text-muted">{rec.inspector_name ?? '—'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

interface RoofingSystem {
  id: string;
  roof_type: string;
  total_squares: number | null;
  underlayment_type: string | null;
  manufacturer: string | null;
  product_line: string | null;
  color: string | null;
  warranty_years: number | null;
  install_date: string | null;
  status: string;
  permit_number: string | null;
  notes: string | null;
  version: number;
}

const ROOF_TYPES = ['asphalt_shingle','metal','flat_tpo','flat_epdm','tile','cedar_shake','other'];
const STATUSES = ['planned','tear_off','decking','underlayment','installed','inspected','complete'];

export default function RoofingPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [roofs, setRoofs] = useState<RoofingSystem[]>([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/roofing-systems?project_id=${projectId}`)
      .then((r) => r.json())
      .then((d) => setRoofs(d.roofing_systems ?? []))
      .catch(() => setError('Failed to load roofing systems'));
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { project_id: projectId };
    ['roof_type','underlayment_type','manufacturer','product_line','color','install_date','status','permit_number','notes'].forEach((k) => {
      const v = fd.get(k) as string;
      if (v) body[k] = v;
    });
    ['total_squares','warranty_years'].forEach((k) => {
      const v = fd.get(k) as string;
      if (v) body[k] = k === 'warranty_years' ? parseInt(v) : parseFloat(v);
    });
    const res = await fetch('/api/roofing-systems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setRoofs((prev) => [data.roofing_system, ...prev]);
      setShowForm(false);
    } else {
      setError('Failed to create roofing system');
    }
  };

  return (
    <div>
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Link href={`/projects/${projectId}`} className="hover:text-ink">Project</Link>
          <span>›</span>
          <span>Roofing</span>
        </div>
        <PageHeader
          title="Roofing Systems"
          actions={<Button size="sm" onClick={() => setShowForm(!showForm)}>+ Add Roof</Button>}
        />
      </div>

      {error && (
        <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 mb-4 text-sm text-status-danger">{error}</div>
      )}

      {showForm && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-sm font-semibold text-ink mb-4">New Roofing System</h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Roof Type *" name="roof_type" required>
                {ROOF_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </Select>
              <Select label="Status" name="status">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </Select>
              <Input label="Total Squares" type="number" name="total_squares" step="0.5" min="0" placeholder="e.g. 24.5" />
              <Input label="Warranty (years)" type="number" name="warranty_years" min="0" max="100" placeholder="e.g. 25" />
              <Input label="Manufacturer" type="text" name="manufacturer" placeholder="e.g. Owens Corning, GAF" />
              <Input label="Product Line" type="text" name="product_line" placeholder="e.g. Duration, Timberline HDZ" />
              <Input label="Color" type="text" name="color" placeholder="e.g. Driftwood, Charcoal" />
              <Input label="Underlayment" type="text" name="underlayment_type" placeholder="e.g. Synthetic felt" />
              <Input label="Install Date" type="date" name="install_date" />
              <Input label="Permit Number" type="text" name="permit_number" />
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

      {roofs.length === 0 && !showForm ? (
        <EmptyState
          title="No roofing systems recorded"
          description="Add a roof to get started."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Type</TH>
                <TH>Product</TH>
                <TH className="text-right">Squares</TH>
                <TH>Color</TH>
                <TH className="text-right">Warranty</TH>
                <TH>Status</TH>
                <TH />
              </tr>
            </THead>
            <TBody>
              {roofs.map((r) => (
                <Fragment key={r.id}>
                  <TR className="cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                    <TD className="capitalize font-medium">{r.roof_type.replace(/_/g, ' ')}</TD>
                    <TD>{[r.manufacturer, r.product_line].filter(Boolean).join(' — ') || '—'}</TD>
                    <TD className="text-right text-muted">{r.total_squares ?? '—'}</TD>
                    <TD className="text-muted">{r.color ?? '—'}</TD>
                    <TD className="text-right text-muted">{r.warranty_years != null ? `${r.warranty_years} yr` : '—'}</TD>
                    <TD>
                      <Badge status={r.status} className="capitalize">{r.status.replace(/_/g, ' ')}</Badge>
                    </TD>
                    <TD className="text-right text-muted">{expanded === r.id ? '▾' : '▸'}</TD>
                  </TR>
                  {expanded === r.id && (
                    <tr><td colSpan={7} className="p-0"><RoofingQa systemId={r.id} /></td></tr>
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
