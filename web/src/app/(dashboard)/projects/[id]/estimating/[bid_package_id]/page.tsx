'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Input, Select, Card, Table, THead, TBody, TR, TH, TD, EmptyState, SlideOver, useToast, useConfirm } from '@/components/ui';
import { BidAwardActions } from '@/components/bid-award-actions';

interface Project { id: string; name: string }
interface BidPackage {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  created_at: string;
}
interface TakeoffItem {
  id: string;
  description: string;
  quantity: number;
  unit: string | null;
  unit_cost_cents: number;
}
interface VendorBid {
  id: string;
  vendor_id: string;
  status: string;
  total_amount_cents: number;
  submitted_at: string | null;
}

interface Vendor { id: string; name: string; vendor_type: string }

const UNITS = ['EA', 'LF', 'SF', 'SY', 'CY', 'TON', 'LB', 'HR', 'LS', 'GAL'];

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function TakeoffItemSlideOver({
  item,
  onClose,
  onSaved,
}: {
  item: TakeoffItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('projects');
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState({
    description: item.description,
    quantity: String(item.quantity),
    unit: item.unit ?? '',
    unit_cost_cents: String((item.unit_cost_cents / 100).toFixed(2)),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    setError('');
    const body: Record<string, unknown> = {
      description: form.description,
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit || null,
      unit_cost_cents: Math.round(parseFloat(form.unit_cost_cents) * 100) || 0,
      version: (item as TakeoffItem & { version?: number }).version ?? 1,
    };
    const r = await fetch(`/api/takeoff-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (r.status === 409) { setError(t('estimating.conflict', { defaultValue: 'This item was updated by someone else — reload.' })); return; }
    if (!r.ok) { setError(t('estimating.save_failed', { defaultValue: 'Failed to save.' })); return; }
    toast.success(t('estimating.item_saved', { defaultValue: 'Takeoff item saved.' }));
    onSaved();
    onClose();
  }

  async function deleteItem() {
    const ok = await confirm({
      title: t('estimating.delete_takeoff_title', { defaultValue: 'Delete takeoff item' }),
      message: t('estimating.delete_takeoff_msg', { defaultValue: 'Delete this takeoff item?' }),
      confirmLabel: t('estimating.delete', { defaultValue: 'Delete' }),
      tone: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    const r = await fetch(`/api/takeoff-items/${item.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (!r.ok) { setError(t('estimating.delete_failed', { defaultValue: 'Delete failed.' })); return; }
    toast.success(t('estimating.item_deleted', { defaultValue: 'Takeoff item deleted.' }));
    onSaved();
    onClose();
  }

  const total = (parseFloat(form.quantity) || 0) * (parseFloat(form.unit_cost_cents) || 0);

  return (
    <SlideOver
      open
      onClose={onClose}
      title={t('estimating.edit_takeoff', { defaultValue: 'Edit Takeoff Item' })}
      width="max-w-md"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="danger" size="sm" onClick={deleteItem} loading={deleting}>
            {deleting ? t('estimating.deleting', { defaultValue: 'Deleting…' }) : t('estimating.delete', { defaultValue: 'Delete' })}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              {t('estimating.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button size="sm" onClick={save} loading={saving}>
              {saving ? t('estimating.saving', { defaultValue: 'Saving…' }) : t('estimating.save', { defaultValue: 'Save' })}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-status-danger">{error}</p>}
        <Input
          label={t('estimating.description')}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('estimating.quantity')}
            type="number"
            min="0"
            step="0.001"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          />
          <Select
            label={t('estimating.unit')}
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          >
            <option value="">—</option>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </div>
        <Input
          label={t('estimating.unit_cost_dollars', { defaultValue: 'Unit Cost ($)' })}
          type="number"
          min="0"
          step="0.01"
          value={form.unit_cost_cents}
          onChange={(e) => setForm((f) => ({ ...f, unit_cost_cents: e.target.value }))}
        />
        <div className="rounded-md bg-surface-alt px-4 py-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted">{t('estimating.line_total', { defaultValue: 'Line Total' })}</span>
            <span className="font-semibold text-ink">{formatCents(Math.round(total * 100))}</span>
          </div>
        </div>
      </div>
    </SlideOver>
  );
}

export default function BidPackageDetailPage() {
  const { id, bid_package_id } = useParams<{ id: string; bid_package_id: string }>();
  const { t } = useTranslation('projects');

  const [project, setProject] = useState<Project | null>(null);
  const [bidPackage, setBidPackage] = useState<BidPackage | null>(null);
  const [takeoffItems, setTakeoffItems] = useState<TakeoffItem[]>([]);
  const [vendorBids, setVendorBids] = useState<VendorBid[]>([]);
  const [vendorMap, setVendorMap] = useState<Record<string, Vendor>>({});
  const [selectedItem, setSelectedItem] = useState<TakeoffItem | null>(null);

  const load = useCallback(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then((r) => r.json()).then((d) => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/bid-packages/${bid_package_id}`).then((r) => r.json()).then((d) => { if (d.bid_package) setBidPackage(d.bid_package as BidPackage); }),
      fetch(`/api/takeoff-items?bid_package_id=${bid_package_id}&limit=100`).then((r) => r.json()).then((d) => { if (d.takeoff_items) setTakeoffItems(d.takeoff_items as TakeoffItem[]); }),
      Promise.all([
        fetch(`/api/vendor-bids?bid_package_id=${bid_package_id}&limit=100`).then((r) => r.json()),
        fetch('/api/vendors?limit=100').then((r) => r.json()),
      ]).then(([bidsData, vendorsData]) => {
        if (bidsData.vendor_bids) setVendorBids(bidsData.vendor_bids as VendorBid[]);
        if (vendorsData.vendors) setVendorMap(Object.fromEntries((vendorsData.vendors as Vendor[]).map((v) => [v.id, v])));
      }),
    ]);
  }, [id, bid_package_id]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
    {selectedItem && (
      <TakeoffItemSlideOver
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSaved={load}
      />
    )}
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/projects" className="hover:text-ink">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
        <span>/</span>
        <Link href={`/projects/${id}/estimating`} className="hover:text-ink">{t('estimating.title')}</Link>
        <span>/</span>
        <span className="text-ink">{bidPackage?.title ?? '…'}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{bidPackage?.title ?? '…'}</h1>
          <p className="text-sm text-muted mt-1">
            {t('estimating.due_label')} {formatDate(bidPackage?.due_date ?? null)}
          </p>
        </div>
        {bidPackage && <Badge status={bidPackage.status} />}
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Link href={`/projects/${id}/estimating/${bid_package_id}/new-takeoff-item`}>
          <Button>+ {t('estimating.add_takeoff')}</Button>
        </Link>
        <Link href={`/projects/${id}/estimating/${bid_package_id}/new-bid`}>
          <Button variant="secondary">{t('estimating.invite_vendor')}</Button>
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-3">
          {t('estimating.takeoff_items')} ({takeoffItems.length})
        </h2>
        {takeoffItems.length === 0 ? (
          <EmptyState title={t('estimating.no_takeoff')} />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>{t('estimating.description')}</TH>
                  <TH>{t('estimating.quantity')}</TH>
                  <TH>{t('estimating.unit')}</TH>
                  <TH className="text-end">{t('estimating.unit_cost')}</TH>
                  <TH className="text-end">{t('estimating.total')}</TH>
                </TR>
              </THead>
              <TBody>
                {takeoffItems.map((item) => (
                  <TR
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <TD>{item.description}</TD>
                    <TD className="text-muted">{item.quantity}</TD>
                    <TD className="text-muted">{item.unit ?? '—'}</TD>
                    <TD className="text-muted text-end">{formatCents(item.unit_cost_cents)}</TD>
                    <TD className="font-medium text-end">
                      {formatCents(item.unit_cost_cents * item.quantity)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-3">
          {t('estimating.bids')} ({vendorBids.length})
        </h2>
        {vendorBids.length === 0 ? (
          <EmptyState title={t('estimating.no_bids')} />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>{t('estimating.vendor')}</TH>
                  <TH>{t('estimating.status')}</TH>
                  <TH>{t('estimating.submitted_at')}</TH>
                  <TH className="text-end">{t('estimating.bid_total')}</TH>
                  <TH>{t('estimating.actions')}</TH>
                </TR>
              </THead>
              <TBody>
                {vendorBids.map((bid) => (
                  <TR key={bid.id}>
                    <TD>
                      {vendorMap[bid.vendor_id]?.name ?? bid.vendor_id.slice(0, 8) + '…'}
                      {vendorMap[bid.vendor_id] && (
                        <span className="ml-1 text-xs text-muted capitalize">{vendorMap[bid.vendor_id].vendor_type}</span>
                      )}
                    </TD>
                    <TD><Badge status={bid.status} /></TD>
                    <TD className="text-muted">{formatDate(bid.submitted_at)}</TD>
                    <TD className="font-medium text-end">
                      {formatCents(bid.total_amount_cents)}
                    </TD>
                    <TD>
                      <BidAwardActions
                        bidId={bid.id}
                        vendorName={vendorMap[bid.vendor_id]?.name ?? 'Vendor'}
                        totalAmountCents={bid.total_amount_cents}
                        currentStatus={bid.status}
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
    </>
  );
}
