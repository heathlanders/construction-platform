'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select, Card } from '@/components/ui';

export default function NewInvoicePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('connections');

  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('draft');
  const [due_date, setDueDate] = useState('');

  // Bridge-instantiated mirror projects carry connection_id — offer to bill the GC (Doc 07 §5.1).
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [shareWithGc, setShareWithGc] = useState(false);

  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch(`/api/projects/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { project?: { connection_id?: string | null } } | null) => {
        const cid = d?.project?.connection_id ?? null;
        setConnectionId(cid);
        if (cid) setShareWithGc(true);
      })
      .catch(() => {});
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!amount || parseFloat(amount) <= 0) {
      setSubmitError('Amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          amount_cents: Math.round(parseFloat(amount || '0') * 100),
          status,
          due_date: due_date || undefined,
          ...(connectionId && shareWithGc ? { connection_id: connectionId } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? 'Failed to create invoice');
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
        <h1 className="text-2xl font-semibold tracking-tight text-ink">New Invoice</h1>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Amount ($) *"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={0}
            step={0.01}
            placeholder="0.00"
            required
          />

          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="void">Void</option>
          </Select>

          <Input
            label="Due Date"
            type="date"
            value={due_date}
            onChange={(e) => setDueDate(e.target.value)}
          />

          {connectionId && (
            <div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={shareWithGc} onChange={(e) => setShareWithGc(e.target.checked)} />
                {t('invoice.share_with_gc')}
              </label>
              <p className="mt-1 text-xs text-muted">{t('invoice.share_hint')}</p>
            </div>
          )}

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{submitError}</div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? 'Creating...' : 'Create Invoice'}
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
