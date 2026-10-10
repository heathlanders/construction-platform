'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Select, Textarea, Card } from '@/components/ui';

interface Vendor { id: string; name: string; vendor_type: string; contact_email: string | null }

export default function InviteVendorPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const bidPackageId = params.bid_package_id as string;

  const [vendorId, setVendorId] = useState('');
  const [notes, setNotes] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/vendors?limit=100')
      .then((r) => r.json())
      .then((d) => setVendors(d.vendors ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId) { setError('Please select a vendor.'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/vendor-bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bid_package_id: bidPackageId, vendor_id: vendorId, notes: notes || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error?.message ?? 'Failed to invite vendor.');
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
        <span className="text-ink">Invite Vendor</span>
      </div>

      <h1 className="text-xl font-semibold text-ink mb-6">Invite Vendor to Bid</h1>

      {error && (
        <div className="mb-4 rounded-md border border-status-danger/40 bg-status-danger-bg px-4 py-3 text-sm text-status-danger">{error}</div>
      )}

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            {vendors.length === 0 ? (
              <>
                <label className="block text-sm font-medium text-ink mb-1">Vendor *</label>
                <div className="text-sm text-muted py-2">
                  No vendors on file.{' '}
                  <Link href="/vendors/new" className="text-brand-600 hover:text-brand-700">Add a vendor →</Link>
                </div>
              </>
            ) : (
              <Select
                label="Vendor *"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
              >
                <option value="">— Select vendor —</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}{v.vendor_type ? ` (${v.vendor_type})` : ''}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <Textarea
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Include any specific requirements or instructions for this vendor…"
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} disabled={saving || vendors.length === 0}>
              {saving ? 'Inviting…' : 'Send Invitation'}
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
