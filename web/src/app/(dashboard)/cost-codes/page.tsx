'use client';

import { useState, useEffect, FormEvent } from 'react';
import { PageHeader, Button, Input, Select, Card, Table, THead, TBody, TR, TH, TD, EmptyState, SkeletonRows } from '@/components/ui';

interface CostCode {
  id: string;
  code: string;
  name: string;
  category: string | null;
  created_at: string;
}

const CATEGORIES = ['Labor', 'Materials', 'Equipment', 'Subcontractor', 'Overhead', 'Other'];

export default function CostCodesPage() {
  const [costCodes, setCostCodes] = useState<CostCode[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    void loadCostCodes();
  }, []);

  async function loadCostCodes() {
    try {
      const res = await fetch('/api/cost-codes?limit=100');
      const data = await res.json();
      if (res.ok) setCostCodes(data.cost_codes ?? []);
      else setCostCodes([]);
    } catch {
      setCostCodes([]);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError('');
    if (!code.trim() || !name.trim()) {
      setSubmitError('Code and name are required.');
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch('/api/cost-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), name: name.trim(), category: category || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data?.error?.message ?? 'Failed to create cost code');
        return;
      }
      setCode('');
      setName('');
      setCategory('');
      setShowForm(false);
      await loadCostCodes();
    } catch {
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setFormLoading(false);
    }
  }

  const list = costCodes ?? [];
  const grouped = list.reduce<Record<string, CostCode[]>>((acc, cc) => {
    const key = cc.category ?? 'Uncategorized';
    (acc[key] ??= []).push(cc);
    return acc;
  }, {});
  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Cost Codes"
        subtitle="Used to categorize time entries and budget line items"
        actions={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ New Cost Code'}</Button>}
      />

      {showForm && (
        <Card padding="lg">
          <h2 className="mb-4 text-sm font-semibold text-ink">New Cost Code</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input label="Code *" value={code} onChange={(e) => setCode(e.target.value)} placeholder="03-000" required />
              <div className="sm:col-span-2">
                <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="Concrete" required />
              </div>
            </div>
            <div className="max-w-xs">
              <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">— Select category —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>

            {submitError && (
              <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3">
                <p className="text-sm text-status-danger">{submitError}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" loading={formLoading}>Create Cost Code</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {costCodes === null ? (
        <SkeletonRows rows={5} />
      ) : list.length === 0 ? (
        <EmptyState title="No cost codes defined yet." description="Cost codes help categorize time entries and budget items." />
      ) : (
        <div className="space-y-6">
          {sortedCategories.map((cat) => (
            <Card key={cat} padding="none" className="overflow-hidden">
              <div className="border-b border-line bg-surface-alt px-4 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{cat}</h3>
              </div>
              <Table>
                <THead>
                  <TR>
                    <TH className="w-32">Code</TH>
                    <TH>Name</TH>
                  </TR>
                </THead>
                <TBody>
                  {grouped[cat].sort((a, b) => a.code.localeCompare(b.code)).map((cc) => (
                    <TR key={cc.id}>
                      <TD className="font-mono text-xs font-medium text-muted">{cc.code}</TD>
                      <TD>{cc.name}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
