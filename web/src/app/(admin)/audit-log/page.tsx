'use client';

import { useEffect, useState } from 'react';

interface AuditEvent {
  id: string;
  action: string;
  actor_email: string;
  actor_role?: string;
  category: string;
  resource_type?: string;
  resource_id?: string;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  auth: 'bg-blue-100 text-blue-700',
  data: 'bg-gray-100 text-gray-700',
  access: 'bg-purple-100 text-purple-700',
  admin: 'bg-orange-100 text-orange-700',
  billing: 'bg-green-100 text-green-700',
  cross_tenant: 'bg-yellow-100 text-yellow-700',
};

export default function AdminAuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/audit-log?tenant_id=PLATFORM&limit=50')
      .then((r) => r.json())
      .then((data: { events?: AuditEvent[] }) => {
        setEvents(data.events ?? []);
      })
      .catch(() => setError('Failed to load audit log.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading audit log…</div>;
  if (error) return <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500">Platform-scope admin events. Append-only — 7-year retention.</p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
          No platform audit events recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-start px-4 py-3 font-medium text-gray-600">Timestamp</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Action</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Actor</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {new Date(event.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[event.category] ?? 'bg-gray-100 text-gray-700'}`}>
                      {event.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{event.action}</td>
                  <td className="px-4 py-3 text-gray-600">{event.actor_email}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {event.resource_type ?? '—'}
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
