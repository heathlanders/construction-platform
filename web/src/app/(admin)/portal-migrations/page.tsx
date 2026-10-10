'use client';

import { useEffect, useState } from 'react';

interface PortalMigration {
  id: string;
  user_id: string;
  source_tenant_id: string;
  target_tenant_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-status-warning-bg text-status-warning',
  approved: 'bg-status-info-bg text-status-info',
  complete: 'bg-status-success-bg text-status-success',
  failed: 'bg-status-danger-bg text-status-danger',
};

export default function PortalMigrationsPage() {
  const [migrations, setMigrations] = useState<PortalMigration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Initiate form state
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState('');
  const [sourceTenantId, setSourceTenantId] = useState('');
  const [targetTenantId, setTargetTenantId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/admin/portal-migrations');
      const data = await res.json() as { migrations?: PortalMigration[] };
      setMigrations(data.migrations ?? []);
    } catch {
      setError('Failed to load migrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleApprove = async (migrationId: string) => {
    if (acting) return;
    setActing(migrationId);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/portal-migrations/${migrationId}`, { method: 'POST' });
      if (res.ok) {
        setMessage('Migration approved.');
        await load();
      } else {
        setMessage('Failed to approve migration.');
      }
    } finally {
      setActing(null);
    }
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/portal-migrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId.trim(),
          source_tenant_id: sourceTenantId.trim(),
          target_tenant_id: targetTenantId.trim() || undefined,
        }),
      });
      const data = await res.json() as { error?: { message: string } };
      if (!res.ok) {
        setFormError(data.error?.message ?? 'Failed to initiate migration.');
      } else {
        setShowForm(false);
        setUserId('');
        setSourceTenantId('');
        setTargetTenantId('');
        setMessage('Migration initiated.');
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;
  if (error) return <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Portal Migrations</h1>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); }}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Initiate Migration
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleInitiate} className="bg-white rounded-lg border border-gray-200 p-6 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Initiate Portal Migration</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">User ID *</label>
            <input
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID of the sub-portal user"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Source Tenant ID *</label>
            <input
              type="text"
              required
              value={sourceTenantId}
              onChange={(e) => setSourceTenantId(e.target.value)}
              placeholder="UUID of the GC tenant"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Target Tenant ID (optional — leave blank to create new)</label>
            <input
              type="text"
              value={targetTenantId}
              onChange={(e) => setTargetTenantId(e.target.value)}
              placeholder="UUID of existing sub tenant, or leave blank"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Initiating…' : 'Initiate'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {migrations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
          No portal migrations found.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-start px-4 py-3 font-medium text-gray-600">User ID</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Source Tenant</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Target Tenant</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {migrations.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{m.user_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.source_tenant_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.target_tenant_id ? `${m.target_tenant_id.slice(0, 8)}…` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[m.status] ?? 'bg-status-neutral-bg text-status-neutral'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{new Date(m.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-end">
                    {m.status === 'pending' && (
                      <button
                        onClick={() => void handleApprove(m.id)}
                        disabled={acting === m.id}
                        className="rounded-md border border-green-300 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
