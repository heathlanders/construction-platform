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

interface ConcretePour {
  id: string;
  pour_type: string;
  volume_cy: number | null;
  mix_design: string | null;
  slump_inches: number | null;
  pour_date: string | null;
  status: string;
  notes: string | null;
  version: number;
}

interface TestRecord {
  id: string;
  test_type: string;
  test_date: string | null;
  age_days: number | null;
  specified_value: number | null;
  measured_value: number | null;
  unit: string | null;
  result: string;
  sample_id: string | null;
  lab_name: string | null;
  version: number;
}

// Result values map to canonical status keys (lib/status) for coloring — no per-screen colors.
const RESULT_STATUS: Record<string, string> = { pass: 'passed', fail: 'failed', pending: 'pending' };

const POUR_TYPES = ['slab','footing','wall','column','driveway','other'];
const STATUSES = ['planned','in_progress','complete','failed'];

const TEST_TYPES = ['cylinder_compressive','slump','air_content','temperature','other'];
const TEST_TYPE_LABELS: Record<string, string> = {
  cylinder_compressive: 'Cylinder Break (compressive)',
  slump: 'Slump',
  air_content: 'Air Content',
  temperature: 'Temperature',
  other: 'Other',
};
const TEST_UNIT: Record<string, string> = {
  cylinder_compressive: 'psi',
  slump: 'in',
  air_content: 'pct',
  temperature: 'F',
  other: '',
};

function TestRecords({ pourId }: { pourId: string }) {
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`/api/concrete-test-records?pour_id=${pourId}`)
      .then((r) => r.json())
      .then((d) => setTests(d.concrete_test_records ?? []))
      .catch(() => setErr('Failed to load test records'))
      .finally(() => setLoaded(true));
  }, [pourId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setErr('');
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { pour_id: pourId };
    const testType = fd.get('test_type') as string;
    body.test_type = testType;
    body.unit = (fd.get('unit') as string) || TEST_UNIT[testType] || undefined;
    ['test_date','sample_id','lab_name','result'].forEach((k) => {
      const v = fd.get(k) as string;
      if (v) body[k] = v;
    });
    ['age_days'].forEach((k) => { const v = fd.get(k) as string; if (v) body[k] = parseInt(v, 10); });
    ['specified_value','measured_value'].forEach((k) => { const v = fd.get(k) as string; if (v) body[k] = parseFloat(v); });

    const res = await fetch('/api/concrete-test-records', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setTests((prev) => [data.concrete_test_record, ...prev]);
      setShowForm(false);
    } else {
      setErr('Failed to add test record');
    }
  };

  return (
    <div className="bg-surface-alt px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">Test Records (ACI 318)</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs font-medium text-brand-600 hover:text-brand-700">+ Add test</button>
      </div>
      {err && <p className="text-xs text-status-danger mb-2">{err}</p>}

      {showForm && (
        <Card padding="sm" className="mb-3 grid grid-cols-3 gap-3">
          <form onSubmit={handleCreate} className="contents">
            <Select label="Test Type *" name="test_type" required>
              {TEST_TYPES.map((t) => <option key={t} value={t}>{TEST_TYPE_LABELS[t]}</option>)}
            </Select>
            <Input label="Test Date" type="date" name="test_date" />
            <Input label="Age (days)" type="number" name="age_days" min="0" placeholder="7 / 28" />
            <Input label="Specified" type="number" name="specified_value" step="0.01" min="0" placeholder="e.g. 4000" />
            <Input label="Measured" type="number" name="measured_value" step="0.01" min="0" placeholder="e.g. 4250" />
            <Input label="Unit" type="text" name="unit" placeholder="psi / in / pct / F" />
            <Input label="Sample ID" type="text" name="sample_id" placeholder="cylinder set" />
            <Input label="Lab" type="text" name="lab_name" />
            <Select label="Result (auto for cylinder)" name="result">
              <option value="">— auto —</option>
              <option value="pass">pass</option>
              <option value="fail">fail</option>
              <option value="pending">pending</option>
            </Select>
            <div className="col-span-3 flex gap-2">
              <Button type="submit" size="sm" loading={saving}>{saving ? 'Saving…' : 'Save test'}</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {loaded && tests.length === 0 ? (
        <p className="text-xs text-muted py-2">No test records yet.</p>
      ) : (
        <Table className="text-xs">
          <THead>
            <tr>
              <TH>Type</TH>
              <TH>Date</TH>
              <TH className="text-right">Age</TH>
              <TH className="text-right">Specified</TH>
              <TH className="text-right">Measured</TH>
              <TH>Result</TH>
              <TH>Sample / Lab</TH>
            </tr>
          </THead>
          <TBody>
            {tests.map((t) => (
              <TR key={t.id}>
                <TD>{TEST_TYPE_LABELS[t.test_type] ?? t.test_type}</TD>
                <TD>{t.test_date ?? '—'}</TD>
                <TD className="text-right">{t.age_days != null ? `${t.age_days}d` : '—'}</TD>
                <TD className="text-right">{t.specified_value != null ? `${t.specified_value}${t.unit ? ' ' + t.unit : ''}` : '—'}</TD>
                <TD className="text-right">{t.measured_value != null ? `${t.measured_value}${t.unit ? ' ' + t.unit : ''}` : '—'}</TD>
                <TD><Badge status={RESULT_STATUS[t.result] ?? t.result} className="capitalize">{t.result}</Badge></TD>
                <TD className="text-muted">{[t.sample_id, t.lab_name].filter(Boolean).join(' · ') || '—'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

export default function ConcretePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [pours, setPours] = useState<ConcretePour[]>([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/concrete-pours?project_id=${projectId}`)
      .then((r) => r.json())
      .then((d) => setPours(d.concrete_pours ?? []))
      .catch(() => setError('Failed to load concrete pours'));
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { project_id: projectId };
    ['pour_type','mix_design','pour_date','status','notes'].forEach((k) => {
      const v = fd.get(k) as string;
      if (v) body[k] = v;
    });
    ['volume_cy','slump_inches'].forEach((k) => {
      const v = fd.get(k) as string;
      if (v) body[k] = parseFloat(v);
    });
    const res = await fetch('/api/concrete-pours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setPours((prev) => [data.concrete_pour, ...prev]);
      setShowForm(false);
    } else {
      setError('Failed to create concrete pour');
    }
  };

  return (
    <div>
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Link href={`/projects/${projectId}`} className="hover:text-ink">Project</Link>
          <span>›</span>
          <span>Concrete</span>
        </div>
        <PageHeader
          title="Concrete Pours"
          actions={<Button size="sm" onClick={() => setShowForm(!showForm)}>+ Add Pour</Button>}
        />
      </div>

      {error && (
        <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 mb-4 text-sm text-status-danger">{error}</div>
      )}

      {showForm && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-sm font-semibold text-ink mb-4">New Concrete Pour</h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Pour Type *" name="pour_type" required>
                {POUR_TYPES.map((t) => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </Select>
              <Select label="Status" name="status">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </Select>
              <Input label="Pour Date" type="date" name="pour_date" />
              <Input label="Volume (CY)" type="number" name="volume_cy" step="0.5" min="0" placeholder="e.g. 12.5" />
              <Input label="Mix Design" type="text" name="mix_design" placeholder={'e.g. 4000 PSI, 3/4" aggregate'} />
              <Input label="Slump (inches)" type="number" name="slump_inches" step="0.5" min="0" max="12" placeholder="e.g. 4.0" />
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

      {pours.length === 0 && !showForm ? (
        <EmptyState
          title="No concrete pours recorded"
          description="Add a pour to get started."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Type</TH>
                <TH>Date</TH>
                <TH className="text-right">Volume (CY)</TH>
                <TH>Mix Design</TH>
                <TH className="text-right">Slump</TH>
                <TH>Status</TH>
                <TH />
              </tr>
            </THead>
            <TBody>
              {pours.map((p) => (
                <Fragment key={p.id}>
                  <TR
                    className="cursor-pointer"
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  >
                    <TD className="capitalize font-medium">{p.pour_type.replace('_', ' ')}</TD>
                    <TD className="text-muted">{p.pour_date ?? '—'}</TD>
                    <TD className="text-right">{p.volume_cy ?? '—'}</TD>
                    <TD className="text-muted max-w-xs truncate">{p.mix_design ?? '—'}</TD>
                    <TD className="text-right text-muted">{p.slump_inches != null ? `${p.slump_inches}"` : '—'}</TD>
                    <TD>
                      <Badge status={p.status} className="capitalize">{p.status.replace('_', ' ')}</Badge>
                    </TD>
                    <TD className="text-right text-muted">{expanded === p.id ? '▾' : '▸'}</TD>
                  </TR>
                  {expanded === p.id && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <TestRecords pourId={p.id} />
                      </td>
                    </tr>
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
