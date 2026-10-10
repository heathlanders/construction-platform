'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Select, Card } from '@/components/ui';

export default function NewBidPackagePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState('');
  const [due_date, setDueDate] = useState('');
  const [status, setStatus] = useState('draft');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setLoading(true);

    try {
      const res = await fetch('/api/bid-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          title,
          due_date: due_date || undefined,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? 'Failed to create bid package');
        setLoading(false);
        return;
      }

      router.push(`/projects/${id}/estimating`);
    } catch {
      setSubmitError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/projects/${id}/estimating`} className="text-sm text-muted hover:text-ink">
          ← Estimating
        </Link>
        <span className="text-muted">/</span>
        <h1 className="text-xl font-semibold text-ink">New Bid Package</h1>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Bid Package Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter bid package title"
            required
          />

          <Input
            label="Bid Due Date"
            type="date"
            value={due_date}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </Select>

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3">
              <p className="text-sm text-status-danger">{submitError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? 'Creating...' : 'Create Bid Package'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push(`/projects/${id}/estimating`)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
