'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Project { id: string; name: string; status: string; }

interface ElectricalPanel {
  id: string;
  name: string;
  amperage: number | null;
  voltage: number | null;
  location: string | null;
  notes: string | null;
  version?: number;
  created_at: string;
}

interface PlumbingSystem {
  id: string;
  name: string;
  system_type: string;
  notes: string | null;
  version?: number;
  created_at: string;
}

const PLUMBING_SYSTEM_TYPES = ['supply', 'drain', 'gas', 'fire'];

function PanelSlideOver({
  panel,
  onClose,
  onSaved,
}: {
  panel: ElectricalPanel;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: panel.name,
    amperage: panel.amperage != null ? String(panel.amperage) : '',
    voltage: panel.voltage != null ? String(panel.voltage) : '',
    location: panel.location ?? '',
    notes: panel.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function save() {
    setSaving(true);
    setError('');
    const body: Record<string, unknown> = {
      name: form.name,
      amperage: form.amperage ? parseInt(form.amperage, 10) : null,
      voltage: form.voltage ? parseInt(form.voltage, 10) : null,
      location: form.location || null,
      notes: form.notes || null,
      version: panel.version ?? 1,
    };
    const r = await fetch(`/api/electrical-panels/${panel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (r.status === 409) { setError('This panel was updated by someone else — reload.'); return; }
    if (!r.ok) { setError('Failed to save.'); return; }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-end z-50" onClick={onClose}>
      <div className="w-[420px] h-full bg-white shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Edit Electrical Panel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amperage (A)</label>
              <input
                type="number"
                min="0"
                value={form.amperage}
                onChange={(e) => setForm((f) => ({ ...f, amperage: e.target.value }))}
                placeholder="e.g. 200"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Voltage (V)</label>
              <input
                type="number"
                min="0"
                value={form.voltage}
                onChange={(e) => setForm((f) => ({ ...f, voltage: e.target.value }))}
                placeholder="e.g. 120"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Utility Room"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlumbingSystemSlideOver({
  system,
  onClose,
  onSaved,
}: {
  system: PlumbingSystem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: system.name,
    system_type: system.system_type,
    notes: system.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function save() {
    setSaving(true);
    setError('');
    const body: Record<string, unknown> = {
      name: form.name,
      system_type: form.system_type,
      notes: form.notes || null,
      version: system.version ?? 1,
    };
    const r = await fetch(`/api/plumbing-systems/${system.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (r.status === 409) { setError('This system was updated by someone else — reload.'); return; }
    if (!r.ok) { setError('Failed to save.'); return; }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-end z-50" onClick={onClose}>
      <div className="w-[420px] h-full bg-white shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Edit Plumbing System</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">System Type</label>
            <select
              value={form.system_type}
              onChange={(e) => setForm((f) => ({ ...f, system_type: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PLUMBING_SYSTEM_TYPES.map((st) => (
                <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TradePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('common');
  const { t: tE } = useTranslation('trade-electrical');
  const { t: tP } = useTranslation('trade-plumbing');

  const [project, setProject] = useState<Project | null>(null);
  const [panels, setPanels] = useState<ElectricalPanel[]>([]);
  const [systems, setSystems] = useState<PlumbingSystem[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<ElectricalPanel | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<PlumbingSystem | null>(null);

  const load = useCallback(() => {
    if (!id) return;

    fetch(`/api/projects/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setProject(data.project); })
      .catch(() => setNotFound(true));

    fetch(`/api/electrical-panels?project_id=${id}`)
      .then((r) => r.json())
      .then((data) => setPanels(data.electrical_panels ?? []))
      .catch(() => {});

    fetch(`/api/plumbing-systems?project_id=${id}`)
      .then((r) => r.json())
      .then((data) => setSystems(data.plumbing_systems ?? []))
      .catch(() => {});
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (notFound) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">{t('common.no_results')}</p>
      </div>
    );
  }

  if (!project) {
    return <div className="text-sm text-gray-500 py-8">{t('common.loading')}</div>;
  }

  return (
    <>
      {selectedPanel && (
        <PanelSlideOver
          panel={selectedPanel}
          onClose={() => setSelectedPanel(null)}
          onSaved={load}
        />
      )}
      {selectedSystem && (
        <PlumbingSystemSlideOver
          system={selectedSystem}
          onClose={() => setSelectedSystem(null)}
          onSaved={load}
        />
      )}
      <div className="max-w-6xl">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/projects" className="hover:text-gray-900">{t('nav.projects')}</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:text-gray-900">{project.name}</Link>
          <span>/</span>
          <span className="text-gray-900">{t('trade.modules_title')}</span>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-6">{t('trade.modules_title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Electrical Panels */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{tE('electrical.panels_title')}</h2>
            </div>
            {panels.length === 0 ? (
              <p className="text-gray-500 text-sm px-4 py-8 text-center">{tE('electrical.no_panels')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{tE('electrical.panel_name')}</th>
                    <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{tE('electrical.amperage')}</th>
                    <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{tE('electrical.voltage')}</th>
                    <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{tE('electrical.location')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {panels.map((panel) => (
                    <tr
                      key={panel.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedPanel(panel)}
                    >
                      <td className="px-4 py-3 text-gray-700 font-medium">{panel.name}</td>
                      <td className="px-4 py-3 text-gray-700">{panel.amperage != null ? `${panel.amperage}A` : '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{panel.voltage != null ? `${panel.voltage}V` : '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{panel.location ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Plumbing Systems */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{tP('plumbing.systems_title')}</h2>
            </div>
            {systems.length === 0 ? (
              <p className="text-gray-500 text-sm px-4 py-8 text-center">{tP('plumbing.no_systems')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{tP('plumbing.system_name')}</th>
                    <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{tP('plumbing.system_type')}</th>
                    <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('trade.notes')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {systems.map((system) => (
                    <tr
                      key={system.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedSystem(system)}
                    >
                      <td className="px-4 py-3 text-gray-700 font-medium">{system.name}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {tP(`plumbing.system_types.${system.system_type}`, { defaultValue: system.system_type.charAt(0).toUpperCase() + system.system_type.slice(1) })}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {system.notes
                          ? system.notes.length > 60
                            ? system.notes.slice(0, 60) + '…'
                            : system.notes
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
