'use client';

// Priced Estimate detail — /projects/:id/estimates/:estimateId
// Line-item grid (editable), pricing/markup params, deterministic generate, add manual line,
// convert-to-bid-package, award. Calls the API through the /api/v1/[...path] catch-all proxy.

import { useEffect, useState, useCallback, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';


// Trade Knowledge Pack lines are tagged "[pack <key>@<version> · <confidence>] …" (Doc 23). A line
// priced from an expert estimate gets a "platform baseline — tune to your costs" badge.
const PACK_TAG = /^\[pack [a-z0-9_]+@[\d.]+(?: · (verified|derived|estimate))?\]\s*/;
function isPlatformBaseline(assumptions: string[]): boolean {
  return assumptions.some((a) => PACK_TAG.exec(a)?.[1] === 'estimate');
}
function stripPackTag(a: string): string {
  return a.replace(PACK_TAG, '');
}
interface Estimate {
  id: string; name: string; status: string; mode: string; trade: string | null; project_id: string | null;
  labor_rate_cents: number; overhead_pct: string; profit_pct: string; tax_pct: string; contingency_pct: string;
  material_cents: number; labor_cents: number; equipment_cents: number; subtotal_cents: number; markup_cents: number; total_cents: number;
  version: number; notes: string | null;
}
interface Line {
  id: string; assembly_code: string | null; trade: string | null; description: string; unit: string | null;
  quantity: string; material_unit_cents: number; labor_hours_per_unit: string; equipment_unit_cents: number; waste_pct: string;
  material_cents: number; labor_hours: string; labor_cents: number; equipment_cents: number; extended_cents: number;
  assumptions: string[]; source: string; version: number;
}

const money = (c: number) => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const STATUS_CHIP: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700', final: 'bg-blue-100 text-blue-800',
  sent: 'bg-amber-100 text-amber-800', awarded: 'bg-green-100 text-green-800', lost: 'bg-red-100 text-red-700',
};

export default function EstimateDetailPage() {
  const { id, estimateId } = useParams<{ id?: string; estimateId: string }>();
  // Project-less estimates (e.g. from a Design Studio client request) open at /estimates/:estimateId.
  const backHref = id ? `/projects/${id}/estimates` : '/client-requests';
  const router = useRouter();
  const { t } = useTranslation('projects');

  const [est, setEst] = useState<Estimate | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [buildingSf, setBuildingSf] = useState('2000');
  const [fromTakeoff, setFromTakeoff] = useState(false);
  const [includeEquipment, setIncludeEquipment] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pBusy, setPBusy] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [pMsg, setPMsg] = useState('');
  const locked = est?.status === 'awarded';

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/estimates/${estimateId}`);
    if (res.ok) { const d = await res.json(); setEst(d.estimate); setLines(d.line_items ?? []); }
  }, [estimateId]);
  useEffect(() => { void load(); }, [load]);

  async function generate() {
    setBusy(true);
    await fetch(`/api/v1/estimates/${estimateId}/generate`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ building_sf: Number(buildingSf) || undefined, from_takeoff: fromTakeoff, include_equipment: includeEquipment }),
    });
    setBusy(false); await load();
  }

  async function saveParams(patch: Record<string, unknown>) {
    if (!est) return;
    const res = await fetch(`/api/v1/estimates/${estimateId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...patch, version: est.version }),
    });
    if (res.ok) await load();
  }

  async function saveLine(l: Line, patch: Record<string, unknown>) {
    const res = await fetch(`/api/v1/estimates/${estimateId}/line-items/${l.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...patch, version: l.version }),
    });
    if (res.ok) { setEditId(null); await load(); }
  }
  async function deleteLine(l: Line) {
    await fetch(`/api/v1/estimates/${estimateId}/line-items/${l.id}`, { method: 'DELETE' });
    await load();
  }

  async function award() {
    if (!confirm(t('estimates.confirm_award'))) return;
    setBusy(true);
    await fetch(`/api/v1/estimates/${estimateId}/award`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    setBusy(false); await load();
  }
  async function toBid() {
    setBusy(true);
    const res = await fetch(`/api/v1/estimates/${estimateId}/to-bid-package`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    setBusy(false);
    if (res.ok && id) router.push(`/projects/${id}/estimating`);
  }

  async function downloadProposal() {
    setPBusy(true); setPMsg('');
    const res = await fetch(`/api/v1/estimates/${estimateId}/proposal`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ include_cost_breakdown: true }),
    });
    setPBusy(false);
    if (res.ok) { const d = await res.json(); if (d.download_url) window.open(d.download_url, '_blank'); await load(); }
    else setPMsg(t('estimates.proposal.error'));
  }
  async function sendProposal(email: string, name: string, includeBreakdown: boolean) {
    setPBusy(true); setPMsg('');
    const res = await fetch(`/api/v1/estimates/${estimateId}/proposal`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ send: true, recipient_email: email, recipient_name: name || undefined, include_cost_breakdown: includeBreakdown }),
    });
    setPBusy(false);
    if (res.ok) { const d = await res.json(); setShowSend(false); setPMsg(d.sent ? t('estimates.proposal.sent') : t('estimates.proposal.ready')); await load(); }
    else setPMsg(t('estimates.proposal.error'));
  }

  if (!est) return <div className="max-w-5xl text-sm text-gray-500">…</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href={backHref} className="hover:text-gray-900">{t('estimates.back')}</Link>
        <span>/</span>
        <span className="text-gray-900">{est.name}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">{est.name}</h1>
          <span className={`px-2 py-0.5 rounded text-xs ${STATUS_CHIP[est.status] ?? ''}`}>{t(`estimates.status.${est.status}`)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadProposal} disabled={pBusy} className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50 disabled:opacity-50">⤓ {t('estimates.proposal.download')}</button>
          <button onClick={() => { setShowSend((v) => !v); setPMsg(''); }} disabled={pBusy} className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50 disabled:opacity-50">{t('estimates.proposal.send')}</button>
          {!locked && <button onClick={toBid} disabled={busy} className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50">{t('estimates.to_bid')}</button>}
          {!locked && <button onClick={award} disabled={busy} className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">{t('estimates.award')}</button>}
          {locked && <span className="text-sm text-green-700 font-medium">{t('estimates.awarded_locked')}</span>}
        </div>
      </div>

      {pMsg && <div className="mb-3 text-sm text-gray-600 bg-gray-50 border rounded px-3 py-2">{pMsg}</div>}
      {showSend && <SendProposal t={t} busy={pBusy} onSend={sendProposal} onCancel={() => setShowSend(false)} />}

      {/* Pricing & markups */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('estimates.params')}</p>
        <div className="grid grid-cols-5 gap-3">
          {([['labor_rate', 'labor_rate_cents'], ['overhead', 'overhead_pct'], ['profit', 'profit_pct'], ['tax', 'tax_pct'], ['contingency', 'contingency_pct']] as const).map(([label, field]) => {
            const isRate = field === 'labor_rate_cents';
            const raw = isRate ? (est.labor_rate_cents / 100).toString() : String(est[field]);
            return (
              <label key={field} className="text-xs text-gray-600">{t(`estimates.${label}`)}
                <input type="number" defaultValue={raw} disabled={locked}
                  onBlur={(e) => { const v = Number(e.target.value); void saveParams({ [field]: isRate ? Math.round(v * 100) : v }); }}
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm disabled:bg-gray-50" />
              </label>
            );
          })}
        </div>
      </div>

      {/* Generate controls */}
      {!locked && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {est.mode === 'parametric' && (
            <label className="text-sm text-gray-600">{t('estimates.building_sf')}
              <input type="number" value={buildingSf} onChange={(e) => setBuildingSf(e.target.value)} className="ms-2 w-28 border rounded px-2 py-1.5 text-sm" />
            </label>
          )}
          <label className="text-sm text-gray-600 flex items-center gap-1">
            <input type="checkbox" checked={fromTakeoff} onChange={(e) => setFromTakeoff(e.target.checked)} /> {t('estimates.from_takeoff')}
          </label>
          <label className="text-sm text-gray-600 flex items-center gap-1">
            <input type="checkbox" checked={includeEquipment} onChange={(e) => setIncludeEquipment(e.target.checked)} /> {t('estimates.include_equipment')}
          </label>
          <button onClick={generate} disabled={busy} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {lines.length ? t('estimates.regenerate') : t('estimates.generate')}
          </button>
          <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50">+ {t('estimates.add_line')}</button>
        </div>
      )}

      {/* Line grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 text-xs">
              <th className="text-start px-3 py-2 font-medium">{t('estimates.col_description')}</th>
              <th className="text-end px-2 py-2 font-medium">{t('estimates.col_qty')}</th>
              <th className="text-start px-2 py-2 font-medium">{t('estimates.col_unit')}</th>
              <th className="text-end px-2 py-2 font-medium">{t('estimates.col_material')}</th>
              <th className="text-end px-2 py-2 font-medium">{t('estimates.col_labor')}</th>
              <th className="text-end px-2 py-2 font-medium">{t('estimates.col_equipment')}</th>
              <th className="text-end px-3 py-2 font-medium">{t('estimates.col_extended')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">{t('estimates.no_lines')}</td></tr>}
            {lines.map((l) => (
              <Fragment key={l.id}>
                <tr className={`hover:bg-gray-50 ${!locked ? 'cursor-pointer' : ''}`} onClick={() => !locked && setEditId(editId === l.id ? null : l.id)}>
                  <td className="px-3 py-2">
                    <span className="font-medium">{l.description}</span>
                    {l.assembly_code && <span className="ms-2 text-xs text-gray-400">{l.assembly_code}</span>}
                    {l.source === 'manual' && <span className="ms-2 text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">manual</span>}
                    {isPlatformBaseline(l.assumptions) && (
                      <Link href="/settings/estimating" onClick={(e) => e.stopPropagation()} title={t('estimates.baseline_hint')}
                        className="ms-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 hover:underline">{t('estimates.baseline_badge')}</Link>
                    )}
                    {l.assumptions.length > 0 && <div className="text-xs text-gray-400 mt-0.5">{l.assumptions.map(stripPackTag).join(' · ')}</div>}
                  </td>
                  <td className="px-2 py-2 text-end tabular-nums">{Number(l.quantity)}</td>
                  <td className="px-2 py-2 text-gray-500">{l.unit ?? '—'}</td>
                  <td className="px-2 py-2 text-end tabular-nums">{money(l.material_cents)}</td>
                  <td className="px-2 py-2 text-end tabular-nums">{money(l.labor_cents)}</td>
                  <td className="px-2 py-2 text-end tabular-nums">{money(l.equipment_cents)}</td>
                  <td className="px-3 py-2 text-end font-semibold tabular-nums">{money(l.extended_cents)}</td>
                </tr>
                {editId === l.id && !locked && (
                  <tr className="bg-blue-50/40">
                    <td colSpan={7} className="px-3 py-3">
                      <LineEditor line={l} t={t} onSave={(patch) => saveLine(l, patch)} onDelete={() => deleteLine(l)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 grid grid-cols-2 gap-y-1 text-sm max-w-sm ms-auto">
        <span className="text-gray-500">{t('estimates.sum_material')}</span><span className="text-end tabular-nums">{money(est.material_cents)}</span>
        <span className="text-gray-500">{t('estimates.sum_labor')}</span><span className="text-end tabular-nums">{money(est.labor_cents)}</span>
        <span className="text-gray-500">{t('estimates.sum_equipment')}</span><span className="text-end tabular-nums">{money(est.equipment_cents)}</span>
        <span className="text-gray-700 font-medium border-t pt-1">{t('estimates.sum_subtotal')}</span><span className="text-end tabular-nums font-medium border-t pt-1">{money(est.subtotal_cents)}</span>
        <span className="text-gray-500">{t('estimates.sum_markup')}</span><span className="text-end tabular-nums">{money(est.markup_cents)}</span>
        <span className="text-gray-900 font-bold border-t pt-1">{t('estimates.sum_total')}</span><span className="text-end tabular-nums font-bold border-t pt-1">{money(est.total_cents)}</span>
      </div>

      {showAdd && !locked && <AddLine estimateId={estimateId} t={t} onDone={() => { setShowAdd(false); void load(); }} onCancel={() => setShowAdd(false)} />}
    </div>
  );
}

function SendProposal({ t, busy, onSend, onCancel }: { t: (k: string) => string; busy: boolean; onSend: (email: string, name: string, breakdown: boolean) => void; onCancel: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [breakdown, setBreakdown] = useState(true);
  const valid = /.+@.+\..+/.test(email);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-wrap items-end gap-3">
      <label className="text-xs text-gray-600">{t('estimates.proposal.recipient_email')}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="buyer@example.com" className="mt-1 w-64 border rounded px-2 py-1.5 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.proposal.recipient_name')}
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-48 border rounded px-2 py-1.5 text-sm" />
      </label>
      <label className="text-sm text-gray-600 flex items-center gap-1 pb-1">
        <input type="checkbox" checked={breakdown} onChange={(e) => setBreakdown(e.target.checked)} /> {t('estimates.proposal.include_breakdown')}
      </label>
      <div className="flex gap-2 ms-auto pb-0.5">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded border">{t('estimates.cancel')}</button>
        <button onClick={() => onSend(email, name, breakdown)} disabled={busy || !valid} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white disabled:opacity-50">{t('estimates.proposal.send')}</button>
      </div>
    </div>
  );
}

function LineEditor({ line, t, onSave, onDelete }: { line: Line; t: (k: string) => string; onSave: (p: Record<string, unknown>) => void; onDelete: () => void }) {
  const [f, setF] = useState({
    description: line.description, quantity: String(Number(line.quantity)),
    material_unit: (line.material_unit_cents / 100).toString(), labor_hours_per_unit: String(Number(line.labor_hours_per_unit)),
    equipment_unit: (line.equipment_unit_cents / 100).toString(), waste_pct: String(Number(line.waste_pct)),
  });
  return (
    <div className="grid grid-cols-6 gap-2 items-end">
      <label className="col-span-2 text-xs text-gray-600">{t('estimates.col_description')}
        <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.col_qty')}
        <input type="number" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.col_material_unit')}
        <input type="number" value={f.material_unit} onChange={(e) => setF({ ...f, material_unit: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.col_labor_hpu')}
        <input type="number" value={f.labor_hours_per_unit} onChange={(e) => setF({ ...f, labor_hours_per_unit: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.col_waste')}
        <input type="number" value={f.waste_pct} onChange={(e) => setF({ ...f, waste_pct: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <div className="col-span-6 flex gap-2 justify-end mt-1">
        <button onClick={onDelete} className="px-3 py-1 text-sm rounded border border-red-200 text-red-600 hover:bg-red-50">{t('estimates.delete')}</button>
        <button onClick={() => onSave({
          description: f.description, quantity: Number(f.quantity),
          material_unit_cents: Math.round(Number(f.material_unit) * 100), labor_hours_per_unit: Number(f.labor_hours_per_unit),
          equipment_unit_cents: Math.round(Number(f.equipment_unit) * 100), waste_pct: Number(f.waste_pct),
        })} className="px-3 py-1 text-sm rounded bg-blue-600 text-white">{t('estimates.save')}</button>
      </div>
    </div>
  );
}

function AddLine({ estimateId, t, onDone, onCancel }: { estimateId: string; t: (k: string) => string; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ description: '', quantity: '1', unit: 'EA', material_unit: '0', labor_hours_per_unit: '0', waste_pct: '0' });
  async function submit() {
    if (!f.description.trim()) return;
    const res = await fetch(`/api/v1/estimates/${estimateId}/line-items`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        description: f.description, quantity: Number(f.quantity), unit: f.unit,
        material_unit_cents: Math.round(Number(f.material_unit) * 100), labor_hours_per_unit: Number(f.labor_hours_per_unit), waste_pct: Number(f.waste_pct),
      }),
    });
    if (res.ok) onDone();
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-6 gap-2 items-end">
      <label className="col-span-2 text-xs text-gray-600">{t('estimates.col_description')}
        <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.col_qty')}
        <input type="number" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.col_unit')}
        <input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.col_material_unit')}
        <input type="number" value={f.material_unit} onChange={(e) => setF({ ...f, material_unit: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.col_labor_hpu')}
        <input type="number" value={f.labor_hours_per_unit} onChange={(e) => setF({ ...f, labor_hours_per_unit: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <div className="col-span-6 flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 text-sm rounded border">{t('estimates.cancel')}</button>
        <button onClick={submit} className="px-3 py-1 text-sm rounded bg-blue-600 text-white">{t('estimates.add_line')}</button>
      </div>
    </div>
  );
}
