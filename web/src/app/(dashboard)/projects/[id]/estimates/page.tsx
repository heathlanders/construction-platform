'use client';

// Priced Estimates — /projects/:id/estimates
// Deterministic assembly-based job estimating (distinct from /estimating = bid packages/takeoff).
// Calls the API through the /api/v1/[...path] catch-all proxy.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Project { id: string; name: string }
interface Estimate {
  id: string; name: string; status: string; mode: string; trade: string | null;
  total_cents: number; subtotal_cents: number; markup_cents: number; created_at: string;
}

const TRADES = ['electrical', 'plumbing', 'mechanical', 'building', 'general'] as const;
const money = (c: number) => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const STATUS_CHIP: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700', final: 'bg-blue-100 text-blue-800',
  sent: 'bg-amber-100 text-amber-800', awarded: 'bg-green-100 text-green-800', lost: 'bg-red-100 text-red-700',
};

export default function EstimatesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('projects');

  const [project, setProject] = useState<Project | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', mode: 'assembly', trade: '', labor_rate: '85', overhead: '10', profit: '10', tax: '0', contingency: '0' });

  const load = () => {
    void fetch(`/api/projects/${id}`).then((r) => r.json()).then((d) => { if (d.project) setProject(d.project); });
    void fetch(`/api/v1/estimates?project_id=${id}&limit=100`).then((r) => r.json()).then((d) => { if (d.estimates) setEstimates(d.estimates); });
  };
  useEffect(load, [id]);

  async function create() {
    if (!form.name.trim()) return;
    setBusy(true);
    const res = await fetch('/api/v1/estimates', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: form.name, project_id: id, mode: form.mode,
        trade: form.trade || undefined,
        labor_rate_cents: Math.round(Number(form.labor_rate) * 100),
        overhead_pct: Number(form.overhead), profit_pct: Number(form.profit),
        tax_pct: Number(form.tax), contingency_pct: Number(form.contingency),
      }),
    });
    setBusy(false);
    if (res.ok) { const d = await res.json(); router.push(`/projects/${id}/estimates/${d.estimate.id}`); }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/projects" className="hover:text-gray-900">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-gray-900">{project?.name ?? '…'}</Link>
        <span>/</span>
        <span className="text-gray-900">{t('estimates.title')}</span>
      </div>

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-gray-900">{t('estimates.title')}</h1>
        <div className="flex items-center gap-3">
          <Link href="/settings/estimating" className="text-sm text-blue-600 hover:text-blue-800">{t('estimates.catalog')} →</Link>
          <button onClick={() => setShowNew((s) => !s)} className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700">+ {t('estimates.new')}</button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">{t('estimates.subtitle')}</p>

      {showNew && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6 grid grid-cols-2 gap-3">
          <label className="col-span-2 text-sm">{t('estimates.name')}
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5" />
          </label>
          <label className="text-sm">{t('estimates.mode')}
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5">
              <option value="assembly">{t('estimates.mode_assembly')}</option>
              <option value="parametric">{t('estimates.mode_parametric')}</option>
            </select>
          </label>
          <label className="text-sm">{t('estimates.trade')}
            <select value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5">
              <option value="">{t('estimates.trade_any')}</option>
              {TRADES.map((tr) => <option key={tr} value={tr}>{tr}</option>)}
            </select>
          </label>
          <label className="text-sm">{t('estimates.labor_rate')}
            <input type="number" value={form.labor_rate} onChange={(e) => setForm({ ...form, labor_rate: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5" />
          </label>
          <div className="grid grid-cols-4 gap-2 col-span-2">
            {(['overhead', 'profit', 'tax', 'contingency'] as const).map((k) => (
              <label key={k} className="text-sm">{t(`estimates.${k}`)}
                <input type="number" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5" />
              </label>
            ))}
          </div>
          <div className="col-span-2 flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="px-3 py-1.5 text-sm rounded border">{t('estimates.cancel')}</button>
            <button onClick={create} disabled={busy || !form.name.trim()} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white disabled:opacity-50">{t('estimates.create')}</button>
          </div>
        </div>
      )}

      {estimates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">{t('estimates.no_estimates')}</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <th className="text-start px-4 py-3 font-medium">{t('estimates.name')}</th>
                <th className="text-start px-4 py-3 font-medium">{t('estimates.status_label')}</th>
                <th className="text-start px-4 py-3 font-medium">{t('estimates.mode')}</th>
                <th className="text-end px-4 py-3 font-medium">{t('estimates.sum_total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estimates.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/projects/${id}/estimates/${e.id}`} className="text-blue-600 hover:text-blue-800">{e.name}</Link>
                  </td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${STATUS_CHIP[e.status] ?? ''}`}>{t(`estimates.status.${e.status}`)}</span></td>
                  <td className="px-4 py-3 text-gray-600">{t(`estimates.mode_${e.mode}`)}</td>
                  <td className="px-4 py-3 text-end font-semibold tabular-nums">{money(e.total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
