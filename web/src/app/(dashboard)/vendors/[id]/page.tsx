'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Select, Textarea, Badge, Card, Spinner, useToast } from '@/components/ui';
import { TradeSelect } from '@/components/vendors/trade-select';

interface Vendor {
  id: string;
  name: string;
  vendor_type: string;
  trade_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_preferred: boolean;
  is_prequalified: boolean;
  performance_notes: string | null;
  version: number;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState<Partial<Vendor>>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/vendors/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.vendor) {
          setVendor(d.vendor as Vendor);
          setForm(d.vendor as Vendor);
        }
      });
  }, [id]);

  const save = async () => {
    if (!vendor) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          vendor_type: form.vendor_type,
          trade_type: form.trade_type || null,
          contact_name: form.contact_name || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          is_preferred: form.is_preferred,
          is_prequalified: form.is_prequalified,
          performance_notes: form.performance_notes || null,
          version: vendor.version,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setError('Vendor was updated by someone else — reload.'); return; }
      if (!res.ok) { setError(data?.error?.message ?? 'Save failed'); return; }
      setVendor(data.vendor as Vendor);
      setForm(data.vendor as Vendor);
      setEditing(false);
      toast.success('Changes saved.');
    } catch { setError('Network error'); } finally { setSaving(false); }
  };

  if (!vendor) return <div className="flex items-center justify-center h-48 text-muted"><Spinner /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/vendors" className="hover:text-ink">Vendors</Link>
        <span>/</span>
        <span className="text-ink">{vendor.name}</span>
      </div>

      <Card padding="none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h1 className="text-lg font-semibold text-ink">{vendor.name}</h1>
            <p className="text-xs text-muted capitalize mt-0.5">{vendor.vendor_type.replace('_', ' ')} · Added {formatDate(vendor.created_at)}</p>
          </div>
          <div className="flex gap-2">
            {vendor.is_preferred && <Badge status="info">Preferred</Badge>}
            {vendor.is_prequalified && <Badge status="success">Prequalified</Badge>}
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}

          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Name" value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <Select label="Type" value={form.vendor_type ?? ''} onChange={e => setForm(f => ({ ...f, vendor_type: e.target.value }))}>
                  <option value="subcontractor">Subcontractor</option>
                  <option value="supplier">Supplier</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-ink">Trade Type</label>
                <TradeSelect
                  value={form.trade_type ?? ''}
                  onChange={(trade) => setForm(f => ({ ...f, trade_type: trade }))}
                  className="block w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input label="Contact Name" value={form.contact_name ?? ''} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
                <Input label="Email" type="email" value={form.contact_email ?? ''} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
                <Input label="Phone" value={form.contact_phone ?? ''} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                  <input type="checkbox" checked={form.is_preferred ?? false}
                    onChange={e => setForm(f => ({ ...f, is_preferred: e.target.checked }))}
                    className="rounded border-line text-brand-600" />
                  Preferred Vendor
                </label>
                <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                  <input type="checkbox" checked={form.is_prequalified ?? false}
                    onChange={e => setForm(f => ({ ...f, is_prequalified: e.target.checked }))}
                    className="rounded border-line text-brand-600" />
                  Prequalified
                </label>
              </div>

              <Textarea label="Performance Notes" rows={4}
                placeholder="Notes on vendor performance, reliability, quality…"
                value={form.performance_notes ?? ''} onChange={e => setForm(f => ({ ...f, performance_notes: e.target.value }))} />

              <div className="flex gap-3">
                <Button onClick={save} loading={saving} disabled={!form.name?.trim()}>Save Changes</Button>
                <Button variant="secondary" onClick={() => { setEditing(false); setForm(vendor); setError(''); }}>Cancel</Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Type</p>
                  <p className="text-ink capitalize">{vendor.vendor_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Trade</p>
                  <p className="text-ink">{vendor.trade_type ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Contact Name</p>
                  <p className="text-ink">{vendor.contact_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Phone</p>
                  <p className="text-ink">{vendor.contact_phone ?? '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Email</p>
                  <p className="text-ink">{vendor.contact_email ?? '—'}</p>
                </div>
              </div>

              {vendor.performance_notes && (
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-1">Performance Notes</p>
                  <p className="text-sm text-ink bg-surface-alt rounded-md p-3">{vendor.performance_notes}</p>
                </div>
              )}

              <Button variant="secondary" onClick={() => setEditing(true)}>Edit Vendor</Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
