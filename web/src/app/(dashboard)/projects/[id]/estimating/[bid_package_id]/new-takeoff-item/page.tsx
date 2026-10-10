'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Select, Card } from '@/components/ui';

const UNITS = ['LF', 'SF', 'EA', 'CY', 'CW', 'LS', 'TON', 'LB', 'GAL', 'HR', 'DAY'];

export default function NewTakeoffItemPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const bidPackageId = params.bid_package_id as string;

  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('EA');
  const [unitCostDollars, setUnitCostDollars] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { setError('Description is required.'); return; }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) { setError('Quantity must be a positive number.'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/takeoff-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          bid_package_id: bidPackageId,
          description: description.trim(),
          quantity: qty,
          unit: unit || null,
          unit_cost_cents: Math.round(parseFloat(unitCostDollars || '0') * 100),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error?.message ?? 'Failed to add takeoff item.');
        return;
      }
      router.push(`/projects/${projectId}/estimating/${bidPackageId}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href={`/projects/${projectId}/estimating/${bidPackageId}`} className="hover:text-ink">
          Bid Package
        </Link>
        <span>/</span>
        <span className="text-ink">Add Takeoff Item</span>
      </div>

      <h1 className="text-xl font-semibold text-ink mb-6">Add Takeoff Item</h1>

      {error && (
        <div className="mb-4 rounded-md border border-status-danger/40 bg-status-danger-bg px-4 py-3 text-sm text-status-danger">{error}</div>
      )}

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Description *"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={'e.g. 3/4" EMT conduit, 1-inch PVC drain pipe'}
            required
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Quantity *"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0.001"
                step="any"
                required
              />
            </div>
            <div className="w-28">
              <Select label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </div>
          </div>

          <Input
            label="Unit Cost ($)"
            type="number"
            value={unitCostDollars}
            onChange={(e) => setUnitCostDollars(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
          />

          {description && quantity && (
            <div className="rounded-md border border-line bg-surface-alt px-4 py-2 text-sm text-muted">
              Total: <span className="font-semibold text-ink">
                ${(parseFloat(quantity || '0') * parseFloat(unitCostDollars || '0')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} disabled={saving}>
              {saving ? 'Adding…' : 'Add Item'}
            </Button>
            <Link href={`/projects/${projectId}/estimating/${bidPackageId}`}>
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
