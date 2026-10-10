'use client';

// Estimating Cost Catalog editor — /settings/estimating
// Lists system + tenant assemblies per trade; create/edit/delete tenant assemblies (system read-only).
// Calls the API through the /api/v1/[...path] catch-all proxy.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Assembly {
  id: string; trade: string; code: string; name: string; unit: string; csi_division: string | null;
  material_cost_cents: number; labor_hours_per_unit: string; equipment_cost_cents: number; waste_pct: string;
  is_system: boolean; is_active: boolean; version: number;
}

interface Suggestion {
  trade: string; code: string;
  suggested_material_cents: number | null; suggested_labor_hours_per_unit: number | null;
  material_sample_size: number; labor_sample_size: number;
}

const TRADES = ['electrical', 'plumbing', 'mechanical', 'building', 'general'] as const;
const money = (c: number) => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const emptyForm = { trade: 'electrical', code: '', name: '', unit: 'EA', material_cost: '0', labor_hours_per_unit: '0', equipment_cost: '0', waste_pct: '0' };

export default function EstimatingCatalogPage() {
  const { t } = useTranslation('projects');
  const [trade, setTrade] = useState<string>('electrical');
  const [rows, setRows] = useState<Assembly[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});

  const load = () => {
    void fetch(`/api/v1/estimate-assemblies?trade=${trade}`).then((r) => r.json()).then((d) => setRows(d.assemblies ?? []));
    void fetch(`/api/v1/estimate-assemblies/suggestions?trade=${trade}`).then((r) => r.json()).then((d) => {
      const map: Record<string, Suggestion> = {};
      for (const s of (d.suggestions ?? []) as Suggestion[]) map[s.code] = s;
      setSuggestions(map);
    });
  };
  useEffect(load, [trade]);

  // Apply the tenant's actuals suggestion to the catalog. Tenant row → PATCH; system row → create an override.
  async function applySuggestion(a: Assembly, s: Suggestion) {
    const material = s.suggested_material_cents ?? a.material_cost_cents;
    const labor = s.suggested_labor_hours_per_unit ?? Number(a.labor_hours_per_unit);
    const res = a.is_system
      ? await fetch('/api/v1/estimate-assemblies', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            trade: a.trade, code: a.code, name: a.name, unit: a.unit,
            material_cost_cents: material, labor_hours_per_unit: labor,
            equipment_cost_cents: a.equipment_cost_cents, waste_pct: Number(a.waste_pct),
          }),
        })
      : await fetch(`/api/v1/estimate-assemblies/${a.id}`, {
          method: 'PATCH', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ material_cost_cents: material, labor_hours_per_unit: labor, version: a.version }),
        });
    if (res.ok) load();
  }

  async function create() {
    if (!form.code.trim() || !form.name.trim()) return;
    const res = await fetch('/api/v1/estimate-assemblies', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        trade: form.trade, code: form.code, name: form.name, unit: form.unit,
        material_cost_cents: Math.round(Number(form.material_cost) * 100),
        labor_hours_per_unit: Number(form.labor_hours_per_unit),
        equipment_cost_cents: Math.round(Number(form.equipment_cost) * 100),
        waste_pct: Number(form.waste_pct),
      }),
    });
    if (res.ok) { setShowNew(false); setForm({ ...emptyForm, trade }); if (form.trade === trade) load(); else setTrade(form.trade); }
    else if (res.status === 409) alert(`Code "${form.code}" already exists for ${form.trade}.`);
  }

  async function saveEdit(a: Assembly, patch: Record<string, unknown>) {
    const res = await fetch(`/api/v1/estimate-assemblies/${a.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...patch, version: a.version }),
    });
    if (res.ok) { setEditId(null); load(); }
  }
  async function del(a: Assembly) {
    if (!confirm(`Delete ${a.code}?`)) return;
    await fetch(`/api/v1/estimate-assemblies/${a.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/settings" className="hover:text-gray-900">Settings</Link>
        <span>/</span><span className="text-gray-900">{t('estimates.catalog_title')}</span>
      </div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-gray-900">{t('estimates.catalog_title')}</h1>
        <button onClick={() => { setForm({ ...emptyForm, trade }); setShowNew((s) => !s); }} className="px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700">+ {t('estimates.add_assembly')}</button>
      </div>
      <p className="text-sm text-gray-500 mb-5">{t('estimates.catalog_subtitle')}</p>

      <div className="flex gap-2 mb-4">
        {TRADES.map((tr) => (
          <button key={tr} onClick={() => setTrade(tr)} className={`px-3 py-1.5 text-sm rounded-full border ${trade === tr ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}>{tr}</button>
        ))}
      </div>

      {showNew && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-5 grid grid-cols-4 gap-3">
          <label className="text-xs text-gray-600">{t('estimates.trade')}
            <select value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm">
              {TRADES.map((tr) => <option key={tr} value={tr}>{tr}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-600">{t('estimates.col_code')}
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm" />
          </label>
          <label className="col-span-2 text-xs text-gray-600">{t('estimates.col_name')}
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs text-gray-600">{t('estimates.col_unit')}
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs text-gray-600">{t('estimates.col_material_unit')}
            <input type="number" value={form.material_cost} onChange={(e) => setForm({ ...form, material_cost: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs text-gray-600">{t('estimates.col_labor_hpu')}
            <input type="number" value={form.labor_hours_per_unit} onChange={(e) => setForm({ ...form, labor_hours_per_unit: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs text-gray-600">{t('estimates.col_waste')}
            <input type="number" value={form.waste_pct} onChange={(e) => setForm({ ...form, waste_pct: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm" />
          </label>
          <div className="col-span-4 flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="px-3 py-1.5 text-sm rounded border">{t('estimates.cancel')}</button>
            <button onClick={create} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white">{t('estimates.create')}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 text-xs">
              <th className="text-start px-3 py-2 font-medium">{t('estimates.col_code')}</th>
              <th className="text-start px-3 py-2 font-medium">{t('estimates.col_name')}</th>
              <th className="text-start px-2 py-2 font-medium">{t('estimates.col_unit')}</th>
              <th className="text-end px-2 py-2 font-medium">{t('estimates.col_material_unit')}</th>
              <th className="text-end px-2 py-2 font-medium">{t('estimates.col_labor_hpu')}</th>
              <th className="text-end px-2 py-2 font-medium">{t('estimates.col_waste')}</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs">{a.code}</td>
                <td className="px-3 py-2">
                  {a.name}
                  <span className={`ms-2 text-xs px-1.5 py-0.5 rounded ${a.is_system ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'}`}>{a.is_system ? t('estimates.tag_system') : t('estimates.tag_yours')}</span>
                  {suggestions[a.code] && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-amber-700">
                      <span title={t('estimates.actuals_hint_title')}>
                        📊 {t('estimates.actuals_hint')}:{' '}
                        {suggestions[a.code].suggested_material_cents != null && (
                          <span className="tabular-nums">{money(suggestions[a.code].suggested_material_cents!)} ({t('estimates.samples', { n: suggestions[a.code].material_sample_size })})</span>
                        )}
                        {suggestions[a.code].suggested_labor_hours_per_unit != null && (
                          <span className="tabular-nums ms-1">· {suggestions[a.code].suggested_labor_hours_per_unit} {t('estimates.hpu_short')} ({t('estimates.samples', { n: suggestions[a.code].labor_sample_size })})</span>
                        )}
                      </span>
                      <button onClick={() => applySuggestion(a, suggestions[a.code])} className="text-blue-600 hover:underline">{t('estimates.apply_actuals')}</button>
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 text-gray-500">{a.unit}</td>
                <td className="px-2 py-2 text-end tabular-nums">{money(a.material_cost_cents)}</td>
                <td className="px-2 py-2 text-end tabular-nums">{Number(a.labor_hours_per_unit)}</td>
                <td className="px-2 py-2 text-end tabular-nums">{Number(a.waste_pct)}%</td>
                <td className="px-2 py-2 text-end">
                  {!a.is_system && <button onClick={() => setEditId(editId === a.id ? null : a.id)} className="text-blue-600 text-xs hover:underline me-2">edit</button>}
                  {!a.is_system && <button onClick={() => del(a)} className="text-red-600 text-xs hover:underline">del</button>}
                  {a.is_system && <span className="text-xs text-gray-300" title={t('estimates.system_readonly')}>🔒</span>}
                </td>
              </tr>
            ))}
            {rows.filter((a) => a.id === editId).map((a) => (
              <tr key={a.id + '-edit'} className="bg-blue-50/40">
                <td colSpan={7} className="px-3 py-3">
                  <AssemblyEditor a={a} t={t} onSave={(patch) => saveEdit(a, patch)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssemblyEditor({ a, t, onSave }: { a: Assembly; t: (k: string) => string; onSave: (p: Record<string, unknown>) => void }) {
  const [f, setF] = useState({
    name: a.name, material_cost: (a.material_cost_cents / 100).toString(),
    labor_hours_per_unit: String(Number(a.labor_hours_per_unit)),
    equipment_cost: (a.equipment_cost_cents / 100).toString(), waste_pct: String(Number(a.waste_pct)),
  });
  return (
    <div className="grid grid-cols-5 gap-2 items-end">
      <label className="text-xs text-gray-600">{t('estimates.col_name')}
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.col_material_unit')}
        <input type="number" value={f.material_cost} onChange={(e) => setF({ ...f, material_cost: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.col_labor_hpu')}
        <input type="number" value={f.labor_hours_per_unit} onChange={(e) => setF({ ...f, labor_hours_per_unit: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.col_equipment_unit')}
        <input type="number" value={f.equipment_cost} onChange={(e) => setF({ ...f, equipment_cost: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-xs text-gray-600">{t('estimates.col_waste')}
        <input type="number" value={f.waste_pct} onChange={(e) => setF({ ...f, waste_pct: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
      </label>
      <div className="col-span-5 flex justify-end">
        <button onClick={() => onSave({
          name: f.name, material_cost_cents: Math.round(Number(f.material_cost) * 100),
          labor_hours_per_unit: Number(f.labor_hours_per_unit),
          equipment_cost_cents: Math.round(Number(f.equipment_cost) * 100), waste_pct: Number(f.waste_pct),
        })} className="px-3 py-1 text-sm rounded bg-blue-600 text-white">{t('estimates.save')}</button>
      </div>
    </div>
  );
}
