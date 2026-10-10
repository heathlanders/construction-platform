'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  tier: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TenantDetail {
  tenant: Tenant;
  subscription?: {
    tier: string;
    status: string;
    current_period_end?: string;
    addon_gc_module?: boolean;
    addon_cross_tenant?: boolean;
  };
  storage_usage?: {
    bytes_used: number;
  };
  recent_audit_events?: Array<{
    id: string;
    action: string;
    actor_email: string;
    category: string;
    created_at: string;
    resource_type?: string;
  }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const STATUS_COLORS: Record<string, string> = {
  trial: 'bg-status-warning-bg text-status-warning',
  active: 'bg-status-success-bg text-status-success',
  grace_period: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-status-neutral-bg text-status-neutral',
  suspended: 'bg-status-danger-bg text-status-danger',
};

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/admin/tenants/${id}`);
      const data = await res.json() as TenantDetail;
      if (data.tenant) setDetail(data);
      else setError('Failed to load tenant.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [id]);

  const handleStatusChange = async () => {
    if (!detail || acting) return;
    setActing(true);
    const newStatus = detail.tenant.status === 'suspended' ? 'active' : 'suspended';
    try {
      await fetch(`/api/admin/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await load();
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;
  if (error) return <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>;
  if (!detail) return null;

  const { tenant, subscription, storage_usage, recent_audit_events } = detail;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/admin/tenants" className="hover:text-gray-900">Tenants</a>
        <span>/</span>
        <span className="text-gray-900">{tenant.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="text-sm text-gray-500 font-mono mt-1">{tenant.slug}</p>
        </div>
        <button
          onClick={() => void handleStatusChange()}
          disabled={acting}
          className={[
            'rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50',
            tenant.status === 'suspended'
              ? 'border-green-300 text-green-700 hover:bg-green-50'
              : 'border-red-300 text-red-700 hover:bg-red-50',
          ].join(' ')}
        >
          {tenant.status === 'suspended' ? 'Reactivate Tenant' : 'Suspend Tenant'}
        </button>
      </div>

      {/* Tenant info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Tenant Info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex gap-4">
            <span className="w-32 text-gray-500">ID</span>
            <span className="font-mono text-xs text-gray-700">{tenant.id}</span>
          </div>
          <div className="flex gap-4">
            <span className="w-32 text-gray-500">Tier</span>
            <span className="capitalize text-gray-900">{tenant.tier}</span>
          </div>
          <div className="flex gap-4">
            <span className="w-32 text-gray-500">Status</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[tenant.status] ?? 'bg-status-neutral-bg text-status-neutral'}`}>
              {tenant.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex gap-4">
            <span className="w-32 text-gray-500">Created</span>
            <span className="text-gray-900">{formatDate(tenant.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Subscription */}
      {subscription && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Subscription</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-4">
              <span className="w-32 text-gray-500">Plan</span>
              <span className="capitalize text-gray-900">{subscription.tier}</span>
            </div>
            <div className="flex gap-4">
              <span className="w-32 text-gray-500">Status</span>
              <span className="capitalize text-gray-900">{subscription.status}</span>
            </div>
            {subscription.current_period_end && (
              <div className="flex gap-4">
                <span className="w-32 text-gray-500">Period End</span>
                <span className="text-gray-900">{formatDate(subscription.current_period_end)}</span>
              </div>
            )}
            <div className="flex gap-4">
              <span className="w-32 text-gray-500">GC Module</span>
              <span className="text-gray-900">{subscription.addon_gc_module ? 'Active' : 'Not active'}</span>
            </div>
            <div className="flex gap-4">
              <span className="w-32 text-gray-500">Cross-Tenant</span>
              <span className="text-gray-900">{subscription.addon_cross_tenant ? 'Active' : 'Not active'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Storage */}
      {storage_usage && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Storage Usage</h2>
          <p className="text-sm text-gray-900">{formatBytes(storage_usage.bytes_used)}</p>
        </div>
      )}

      {/* Recent audit events */}
      {recent_audit_events && recent_audit_events.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Recent Audit Events</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-start px-4 py-3 font-medium text-gray-600">Action</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Actor</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent_audit_events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{event.action}</td>
                  <td className="px-4 py-3 text-gray-600">{event.actor_email}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{event.category}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(event.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
