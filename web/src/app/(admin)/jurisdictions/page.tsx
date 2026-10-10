'use client';

import { useCallback, useEffect, useState } from 'react';

// ─── types ───────────────────────────────────────────────────────────────────────
interface Ahj {
  ahj_name?: string;
  ahj_level?: string;
  permit_office?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  fee_notes?: string;
}
interface Layer {
  id: string;
  level: string;
  state_code: string | null;
  county_fips: string | null;
  county_name: string | null;
  city_name: string | null;
  ahj: Ahj | null;
  codes: Record<string, unknown> | null;
  notes: string | null;
  source: string | null;
  last_verified: string | null;
}
interface Edition {
  id: string;
  trade: string;
  state_code: string;
  code_type: string;
  code_edition: string | null;
  nec_edition: string | null;
  notes: string | null;
  source: string | null;
  last_verified: string | null;
}

const LEVELS = ['state', 'county', 'city'];
const AHJ_LEVELS = ['national', 'state', 'county', 'city'];
const TRADES = ['electrical', 'plumbing', 'mechanical', 'building'];

function locationKey(l: Layer): string {
  return [l.state_code, l.county_fips ?? l.county_name, l.city_name].filter(Boolean).join(' / ');
}

// ════════════════════════════════════════════════════════════════════════════════
export default function JurisdictionsAdminPage() {
  const [tab, setTab] = useState<'layers' | 'editions'>('layers');
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Jurisdictions &amp; Codes</h1>
      <p className="text-sm text-gray-500 mb-6">
        Super-admin curation of the codes-engine reference data. Every change refreshes the live
        engine cache immediately.
      </p>
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {(['layers', 'editions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'layers' ? 'Jurisdiction Layers' : 'Code Editions'}
          </button>
        ))}
      </div>
      {tab === 'layers' ? <LayersTab /> : <EditionsTab />}
    </div>
  );
}

// ─── slide-over shell ──────────────────────────────────────────────────────────────
function SlideOver({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white shadow-xl flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
const inputCls = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm';

// ════════════════════════ Layers ════════════════════════
function LayersTab() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [fState, setFState] = useState('');
  const [fLevel, setFLevel] = useState('');
  const [selected, setSelected] = useState<Layer | 'new' | null>(null);
  const [validateOut, setValidateOut] = useState<{ ok: boolean; checked: number; bad_rows: { id: string; error: string }[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (fState) qs.set('state', fState);
      if (fLevel) qs.set('level', fLevel);
      const res = await fetch(`/api/admin/jurisdiction-layers?${qs.toString()}`);
      const data = (await res.json()) as { layers?: Layer[]; error?: { message: string } };
      if (data.layers) setLayers(data.layers);
      else setError(data.error?.message ?? 'Failed to load layers.');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [fState, fLevel]);

  useEffect(() => { void load(); }, [load]);

  const runValidate = async () => {
    const res = await fetch('/api/admin/jurisdiction-layers/validate');
    setValidateOut(await res.json());
  };

  if (loading) return <div className="text-sm text-gray-500">Loading layers…</div>;
  if (error) return <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>;

  return (
    <div>
      {warn && <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">{warn}</div>}

      <div className="flex items-center gap-2 mb-4">
        <input value={fState} onChange={(e) => setFState(e.target.value.toUpperCase())} maxLength={2} placeholder="State" className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
        <select value={fLevel} onChange={(e) => setFLevel(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">All levels</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => void runValidate()} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Validate all</button>
        <button onClick={() => setSelected('new')} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">New layer</button>
      </div>

      {validateOut && (
        <div className={`mb-4 rounded-md border p-3 text-sm ${validateOut.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          Checked {validateOut.checked} rows — {validateOut.ok ? 'all valid.' : `${validateOut.bad_rows.length} bad:`}
          {!validateOut.ok && (
            <ul className="mt-1 list-disc pl-5">{validateOut.bad_rows.map((b) => <li key={b.id}><span className="font-mono text-xs">{b.id}</span>: {b.error}</li>)}</ul>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-start px-4 py-3 font-medium text-gray-600">Level</th>
              <th className="text-start px-4 py-3 font-medium text-gray-600">Location</th>
              <th className="text-start px-4 py-3 font-medium text-gray-600">AHJ</th>
              <th className="text-start px-4 py-3 font-medium text-gray-600">Source</th>
              <th className="text-start px-4 py-3 font-medium text-gray-600">Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {layers.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(l)}>
                <td className="px-4 py-3 capitalize">{l.level}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{locationKey(l)}</td>
                <td className="px-4 py-3 text-gray-700">{l.ahj?.ahj_name ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{l.source ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{l.last_verified ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {layers.length === 0 && <div className="p-6 text-center text-sm text-gray-500">No layers found.</div>}
      </div>

      <SlideOver open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <LayerForm
            layer={selected === 'new' ? null : selected}
            onDone={(msg) => { setSelected(null); setWarn(msg ?? ''); void load(); }}
          />
        )}
      </SlideOver>
    </div>
  );
}

function LayerForm({ layer, onDone }: { layer: Layer | null; onDone: (warn?: string) => void }) {
  const a = layer?.ahj ?? {};
  const [level, setLevel] = useState(layer?.level ?? 'city');
  const [stateCode, setStateCode] = useState(layer?.state_code ?? '');
  const [countyFips, setCountyFips] = useState(layer?.county_fips ?? '');
  const [countyName, setCountyName] = useState(layer?.county_name ?? '');
  const [cityName, setCityName] = useState(layer?.city_name ?? '');
  const [notes, setNotes] = useState(layer?.notes ?? '');
  const [ahjName, setAhjName] = useState(a.ahj_name ?? '');
  const [ahjLevel, setAhjLevel] = useState(a.ahj_level ?? 'city');
  const [phone, setPhone] = useState(a.phone ?? '');
  const [email, setEmail] = useState(a.email ?? '');
  const [contactName, setContactName] = useState(a.contact_name ?? '');
  const [address, setAddress] = useState(a.address ?? '');
  const [codesJson, setCodesJson] = useState(layer?.codes ? JSON.stringify(layer.codes, null, 2) : '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    let codes: unknown;
    if (codesJson.trim()) {
      try { codes = JSON.parse(codesJson); } catch { setErr('Codes is not valid JSON.'); return; }
    }
    const ahj = ahjName.trim()
      ? { ahj_name: ahjName, ahj_level: ahjLevel, phone: phone || undefined, email: email || undefined, contact_name: contactName || undefined, address: address || undefined }
      : undefined;
    const body: Record<string, unknown> = {
      level,
      state_code: stateCode || undefined,
      county_fips: countyFips || undefined,
      county_name: countyName || undefined,
      city_name: cityName || undefined,
      notes: notes || undefined,
      ahj,
      codes,
    };
    setBusy(true);
    try {
      const res = layer
        ? await fetch(`/api/admin/jurisdiction-layers/${layer.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/admin/jurisdiction-layers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error?.message ?? 'Save failed.'); return; }
      onDone(data.cache_refreshed === false ? 'Saved, but the engine cache failed to refresh — it will reload on next boot.' : undefined);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!layer) return;
    setBusy(true);
    const res = await fetch(`/api/admin/jurisdiction-layers/${layer.id}`, { method: 'DELETE' });
    const data = await res.json();
    setBusy(false);
    onDone(data.cache_refreshed === false ? 'Deleted, but cache refresh failed.' : undefined);
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{layer ? 'Edit layer' : 'New layer'}</h2>
      {err && <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-700">{err}</div>}

      <Field label="Level"><select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>{LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</select></Field>
      <Field label="State (2-letter)"><input value={stateCode} onChange={(e) => setStateCode(e.target.value.toUpperCase())} maxLength={2} className={inputCls} /></Field>
      {level !== 'state' && <Field label="County FIPS (5 digits)"><input value={countyFips} onChange={(e) => setCountyFips(e.target.value)} className={inputCls} /></Field>}
      {level !== 'state' && <Field label="County name"><input value={countyName} onChange={(e) => setCountyName(e.target.value)} className={inputCls} /></Field>}
      {level === 'city' && <Field label="City name"><input value={cityName} onChange={(e) => setCityName(e.target.value)} className={inputCls} /></Field>}
      <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} /></Field>

      <h3 className="text-sm font-semibold text-gray-800 mt-4 mb-2">AHJ (Authority Having Jurisdiction)</h3>
      <Field label="AHJ name"><input value={ahjName} onChange={(e) => setAhjName(e.target.value)} className={inputCls} /></Field>
      <Field label="AHJ level"><select value={ahjLevel} onChange={(e) => setAhjLevel(e.target.value)} className={inputCls}>{AHJ_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</select></Field>
      <Field label="Contact name"><input value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputCls} /></Field>
      <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></Field>
      <Field label="Email"><input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
      <Field label="Address"><input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} /></Field>

      <h3 className="text-sm font-semibold text-gray-800 mt-4 mb-2">Code overrides (JSON)</h3>
      <p className="text-xs text-gray-500 mb-1">Per-trade overrides incl. <code>sequence_ops</code>. Leave blank for none.</p>
      <textarea value={codesJson} onChange={(e) => setCodesJson(e.target.value)} rows={6} placeholder='{ "electrical": { "amendments_notes": "…" } }' className={`${inputCls} font-mono text-xs`} />

      <div className="mt-5 flex gap-2">
        <button onClick={() => void submit()} disabled={busy} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{layer ? 'Save' : 'Create'}</button>
        {layer && <button onClick={() => void remove()} disabled={busy} className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button>}
      </div>
    </div>
  );
}

// ════════════════════════ Code Editions ════════════════════════
function EditionsTab() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [fState, setFState] = useState('');
  const [fTrade, setFTrade] = useState('');
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (fState) qs.set('state', fState);
      if (fTrade) qs.set('trade', fTrade);
      const res = await fetch(`/api/admin/code-editions?${qs.toString()}`);
      const data = (await res.json()) as { editions?: Edition[]; error?: { message: string } };
      if (data.editions) setEditions(data.editions);
      else setError(data.error?.message ?? 'Failed to load editions.');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [fState, fTrade]);

  useEffect(() => { void load(); }, [load]);

  const del = async (id: string) => {
    const res = await fetch(`/api/admin/code-editions/${id}`, { method: 'DELETE' });
    const data = await res.json();
    setWarn(data.cache_refreshed === false ? 'Deleted, but cache refresh failed.' : '');
    void load();
  };

  if (loading) return <div className="text-sm text-gray-500">Loading editions…</div>;
  if (error) return <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>;

  return (
    <div>
      {warn && <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">{warn}</div>}
      <div className="flex items-center gap-2 mb-4">
        <input value={fState} onChange={(e) => setFState(e.target.value.toUpperCase())} maxLength={2} placeholder="State" className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
        <select value={fTrade} onChange={(e) => setFTrade(e.target.value)} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">All trades</option>
          {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setOpen(true)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Upsert edition</button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-start px-4 py-3 font-medium text-gray-600">Trade</th>
              <th className="text-start px-4 py-3 font-medium text-gray-600">State</th>
              <th className="text-start px-4 py-3 font-medium text-gray-600">Code</th>
              <th className="text-start px-4 py-3 font-medium text-gray-600">Edition</th>
              <th className="text-start px-4 py-3 font-medium text-gray-600">Source</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {editions.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 capitalize">{e.trade}</td>
                <td className="px-4 py-3 font-mono text-xs">{e.state_code}</td>
                <td className="px-4 py-3">{e.code_type}</td>
                <td className="px-4 py-3">{e.code_edition ?? e.nec_edition ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{e.source ?? '—'}</td>
                <td className="px-4 py-3 text-end">
                  <button onClick={() => void del(e.id)} className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {editions.length === 0 && <div className="p-6 text-center text-sm text-gray-500">No editions found.</div>}
      </div>

      <SlideOver open={open} onClose={() => setOpen(false)}>
        <EditionForm onDone={(msg) => { setOpen(false); setWarn(msg ?? ''); void load(); }} />
      </SlideOver>
    </div>
  );
}

function EditionForm({ onDone }: { onDone: (warn?: string) => void }) {
  const [trade, setTrade] = useState('electrical');
  const [stateCode, setStateCode] = useState('');
  const [codeType, setCodeType] = useState('NEC');
  const [codeEdition, setCodeEdition] = useState('');
  const [necEdition, setNecEdition] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    const body = {
      trade, state_code: stateCode, code_type: codeType,
      code_edition: codeEdition || undefined, nec_edition: necEdition || undefined, notes: notes || undefined,
    };
    setBusy(true);
    try {
      const res = await fetch('/api/admin/code-editions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error?.message ?? 'Save failed.'); return; }
      onDone(data.cache_refreshed === false ? 'Saved, but the engine cache failed to refresh — it will reload on next boot.' : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Upsert code edition</h2>
      <p className="text-xs text-gray-500 mb-3">Keyed on (trade, state) — re-submitting the same pair updates it in place.</p>
      {err && <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-700">{err}</div>}
      <Field label="Trade"><select value={trade} onChange={(e) => setTrade(e.target.value)} className={inputCls}>{TRADES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
      <Field label="State (2-letter)"><input value={stateCode} onChange={(e) => setStateCode(e.target.value.toUpperCase())} maxLength={2} className={inputCls} /></Field>
      <Field label="Code type (NEC / IPC / UPC / IMC / UMC / IRC / IBC)"><input value={codeType} onChange={(e) => setCodeType(e.target.value)} className={inputCls} /></Field>
      <Field label="Code edition (year)"><input value={codeEdition} onChange={(e) => setCodeEdition(e.target.value)} className={inputCls} /></Field>
      <Field label="NEC edition (electrical only)"><input value={necEdition} onChange={(e) => setNecEdition(e.target.value)} className={inputCls} /></Field>
      <Field label="Notes / amendments"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} /></Field>
      <p className="text-xs text-gray-400 mb-3">Note: for <code>building</code>, code type is occupancy-derived at resolve time (IRC/IBC) — only edition &amp; notes affect resolution.</p>
      <button onClick={() => void submit()} disabled={busy} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Save</button>
    </div>
  );
}
