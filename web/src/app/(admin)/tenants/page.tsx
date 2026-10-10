'use client';

import { useEffect, useState } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  tier: string;
  status: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const TIER_COLORS: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-700',
  professional: 'bg-blue-100 text-blue-700',
  business: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-yellow-100 text-yellow-700',
};

const STATUS_COLORS: Record<string, string> = {
  trial: 'bg-status-warning-bg text-status-warning',
  active: 'bg-status-success-bg text-status-success',
  grace_period: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-status-neutral-bg text-status-neutral',
  suspended: 'bg-status-danger-bg text-status-danger',
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/tenants');
      const data = await res.json() as { tenants?: Tenant[] };
      if (data.tenants) setTenants(data.tenants);
      else setError('Failed to load tenants.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleStatusChange = async (tenant: Tenant) => {
    if (acting) return;
    setActing(tenant.id);
    const newStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
    try {
      await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await load();
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading tenants…</div>;
  }

  if (error) {
    return <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tenants</h1>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-start px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-start px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="text-start px-4 py-3 font-medium text-gray-600">Tier</th>
              <th className="text-start px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-start px-4 py-3 font-medium text-gray-600">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <a href={`/admin/tenants/${tenant.id}`} className="hover:text-blue-600">
                    {tenant.name}
                  </a>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{tenant.slug}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TIER_COLORS[tenant.tier] ?? 'bg-gray-100 text-gray-700'}`}>
                    {tenant.tier}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[tenant.status] ?? 'bg-status-neutral-bg text-status-neutral'}`}>
                    {tenant.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(tenant.created_at)}</td>
                <td className="px-4 py-3 text-end">
                  <button
                    onClick={() => void handleStatusChange(tenant)}
                    disabled={acting === tenant.id}
                    className={[
                      'rounded-md border px-3 py-1 text-xs font-medium disabled:opacity-50',
                      tenant.status === 'suspended'
                        ? 'border-green-300 text-green-700 hover:bg-green-50'
                        : 'border-red-300 text-red-700 hover:bg-red-50',
                    ].join(' ')}
                  >
                    {tenant.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">No tenants found.</div>
        )}
      </div>
    </div>
  );
}
