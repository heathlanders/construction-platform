'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Select, Card } from '@/components/ui';

interface CostCode { id: string; code: string; name: string; }

export default function NewBudgetLineItemPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [description, setDescription] = useState('');
  const [budget_cents, setBudgetCents] = useState('');
  const [cost_code_id, setCostCodeId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch('/api/cost-codes?limit=100').then((r) => r.json()).then((d) => { if (d.cost_codes) setCostCodes(d.cost_codes as CostCode[]); });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const budgetValue = Math.round(parseFloat(budget_cents || '0') * 100);
    if (!description.trim()) {
      setSubmitError('Description is required.');
      return;
    }
    setLoading(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/budget-line-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          description: description.trim(),
          budget_cents: budgetValue,
          cost_code_id: cost_code_id || undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? 'Failed to create budget line item');
      }

      router.push(`/projects/${id}/budget`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link href="/projects" className="hover:text-ink">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-ink">Project</Link>
        <span>/</span>
        <Link href={`/projects/${id}/budget`} className="hover:text-ink">Budget</Link>
        <span>/</span>
        <span className="text-ink">New Line Item</span>
      </div>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">Add Budget Line Item</h1>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="text"
            label="Description *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Concrete Foundations, Electrical Rough-In"
            required
          />

          <Select label="Cost Code" value={cost_code_id} onChange={(e) => setCostCodeId(e.target.value)}>
            <option value="">— No cost code —</option>
            {costCodes.map((cc) => (
              <option key={cc.id} value={cc.id}>{cc.code} — {cc.name}</option>
            ))}
          </Select>

          <div>
            <Input
              type="number"
              label="Budget Amount ($)"
              value={budget_cents}
              onChange={(e) => setBudgetCents(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            <p className="mt-1 text-xs text-muted">Leave blank to start at $0</p>
          </div>

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{submitError}</div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? 'Adding…' : 'Add Line Item'}
            </Button>
            <Link href={`/projects/${id}/budget`}>
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
