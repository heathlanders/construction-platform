'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';

interface Conn { id: string; gc_tenant_id: string; sub_tenant_id: string; status: string }

export default function NewChangeOrderPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('owner_to_gc');
  const [reason_code, setReasonCode] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [shareable, setShareable] = useState<Conn[]>([]);

  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const [meRes, connRes] = await Promise.all([fetch('/api/users/me'), fetch('/api/connections?status=active&limit=100')]);
      const me = await meRes.json() as { user?: { tenant_id: string } };
      const conns = await connRes.json() as { connections?: Conn[] };
      const myId = me.user?.tenant_id;
      if (myId && conns.connections) setShareable(conns.connections.filter(c => c.gc_tenant_id === myId));
    })();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!title.trim()) {
      setSubmitError('Change order title is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/change-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          title,
          description: description || undefined,
          amount_cents: Math.round(parseFloat(amount || '0') * 100),
          direction,
          reason_code: reason_code || undefined,
          connection_id: connectionId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? 'Failed to create change order');
        setLoading(false);
        return;
      }

      router.push(`/projects/${id}/budget`);
    } catch {
      setSubmitError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/projects/${id}/budget`} className="text-sm text-muted hover:text-ink">
          ← Budget
        </Link>
        <span className="text-line">/</span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">New Change Order</h1>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Change Order Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter change order title"
            required
          />

          <Textarea
            label="Description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            placeholder="Optional description"
          />

          <Input
            label="Amount ($) — use negative for deductions"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step={0.01}
            placeholder="0.00"
            required
          />

          <Select label="Direction" value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="owner_to_gc">Owner to GC</option>
            <option value="gc_to_sub">GC to Sub</option>
          </Select>

          <Input
            label="Reason Code"
            value={reason_code}
            onChange={(e) => setReasonCode(e.target.value)}
            placeholder="SCOPE_CHANGE, WEATHER, etc."
          />

          {shareable.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Share with a connected sub</label>
              <select
                value={connectionId}
                onChange={(e) => setConnectionId(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Don&apos;t share</option>
                {shareable.map(c => <option key={c.id} value={c.id}>Sub {c.sub_tenant_id.slice(0, 8)}…</option>)}
              </select>
              <p className="text-xs text-gray-500">Shared change orders appear in the sub&apos;s connection portal; they can approve or reject.</p>
            </div>
          )}

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{submitError}</div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? 'Creating...' : 'Create Change Order'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push(`/projects/${id}/budget`)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
