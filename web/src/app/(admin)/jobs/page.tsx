'use client';

import { useEffect, useState } from 'react';

interface FailedJob {
  id: string;
  job_type: string;
  tenant_id: string;
  created_at: string;
  failure_reason?: string;
  failed_at?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/admin/jobs');
      const data = await res.json() as { jobs?: FailedJob[] };
      setJobs(data.jobs ?? []);
    } catch {
      setError('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleReplay = async (jobId: string) => {
    if (acting) return;
    setActing(jobId);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, { method: 'POST' });
      if (res.ok) {
        setMessage(`Job ${jobId.slice(0, 8)}… re-queued.`);
        await load();
      } else {
        setMessage('Failed to replay job.');
      }
    } finally {
      setActing(null);
    }
  };

  const handleDiscard = async (jobId: string) => {
    if (acting) return;
    setActing(jobId);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage(`Job ${jobId.slice(0, 8)}… discarded.`);
        await load();
      } else {
        setMessage('Failed to discard job.');
      }
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading jobs…</div>;
  if (error) return <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">DLQ Jobs</h1>

      {message && (
        <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
          No failed jobs in the queue.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-start px-4 py-3 font-medium text-gray-600">Job Type</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Tenant ID</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Failure Reason</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{job.job_type}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{job.tenant_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{new Date(job.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{job.failure_reason ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => void handleReplay(job.id)}
                        disabled={acting === job.id}
                        className="rounded-md border border-blue-300 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                      >
                        Replay
                      </button>
                      <button
                        onClick={() => void handleDiscard(job.id)}
                        disabled={acting === job.id}
                        className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Discard
                      </button>
                    </div>
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
