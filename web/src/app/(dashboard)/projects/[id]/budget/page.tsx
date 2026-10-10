'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Button, Input, Select, StatusPill, KpiTile,
  Card, Table, THead, TBody, TR, TH, TD, SlideOver, EmptyState, useConfirm,
} from '@/components/ui';
import { ChangeOrderActions } from '@/components/change-order-actions';

interface Project { id: string; name: string }
interface Invoice {
  id: string;
  amount_cents: number;
  status: string;
  due_date: string | null;
  version: number;
  created_at: string;
}
interface ChangeOrder {
  id: string;
  title: string;
  amount_cents: number;
  status: string;
  created_at: string;
}
interface BudgetLineItem {
  id: string;
  description: string;
  budget_cents: number;
  actual_cents: number;
  committed_amount_cents: number;
  projected_final_cents: number;
  cost_code_id: string | null;
  version: number;
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'void', label: 'Void' },
];

const CHIP = 'text-xs px-3 py-1 rounded-full font-medium hover:opacity-80 transition-opacity';

function InvoiceSlideOver({ invoice, onClose, onSaved }: {
  invoice: Invoice; onClose: () => void; onSaved: (i: Invoice) => void;
}) {
  const [form, setForm] = useState({
    amount: String(invoice.amount_cents / 100),
    status: invoice.status,
    due_date: invoice.due_date ? invoice.due_date.slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: Math.round(parseFloat(form.amount) * 100),
          status: form.status,
          due_date: form.due_date || null,
          version: invoice.version,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setError('Invoice was updated by someone else — reload.'); return; }
      if (!res.ok) { setError(data?.error?.message ?? 'Save failed'); return; }
      onSaved(data.invoice);
    } catch { setError('Network error'); } finally { setSaving(false); }
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      title="Invoice"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} loading={saving}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}
        <Input type="number" min="0" step="0.01" label="Amount ($)"
          value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {INVOICE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Input type="date" label="Due Date"
            value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
        </div>
        <div className="border-t border-line pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Quick Transitions</p>
          <div className="flex flex-wrap gap-2">
            {form.status === 'draft' && <button onClick={() => setForm(f => ({ ...f, status: 'sent' }))} className={`${CHIP} bg-status-info-bg text-status-info`}>Mark Sent</button>}
            {form.status === 'sent' && <button onClick={() => setForm(f => ({ ...f, status: 'paid' }))} className={`${CHIP} bg-status-success-bg text-status-success`}>Mark Paid</button>}
            {form.status !== 'void' && <button onClick={() => setForm(f => ({ ...f, status: 'void' }))} className={`${CHIP} bg-status-neutral-bg text-status-neutral`}>Void</button>}
          </div>
        </div>
        <p className="border-t border-line pt-2 text-xs text-muted">Created {formatDate(invoice.created_at)}</p>
      </div>
    </SlideOver>
  );
}

function LineItemSlideOver({ item, onClose, onSaved, onDeleted }: {
  item: BudgetLineItem; onClose: () => void; onSaved: (i: BudgetLineItem) => void; onDeleted: (id: string) => void;
}) {
  const confirm = useConfirm();
  const [form, setForm] = useState({
    description: item.description,
    budget: String(item.budget_cents / 100),
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/budget-line-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description,
          budget_cents: Math.round(parseFloat(form.budget) * 100),
          version: item.version,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setError('Item was updated by someone else — reload.'); return; }
      if (!res.ok) { setError(data?.error?.message ?? 'Save failed'); return; }
      onSaved(data.budget_line_item);
    } catch { setError('Network error'); } finally { setSaving(false); }
  };

  const del = async () => {
    const ok = await confirm({ title: 'Delete this budget line item?', tone: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    setDeleting(true);
    try {
      await fetch(`/api/budget-line-items/${item.id}`, { method: 'DELETE' });
      onDeleted(item.id);
    } finally { setDeleting(false); }
  };

  const variance = item.budget_cents - item.actual_cents;

  return (
    <SlideOver
      open
      onClose={onClose}
      title="Budget Line Item"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="sm" onClick={del} disabled={deleting} className="text-status-danger hover:bg-status-danger-bg">
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={save} loading={saving} disabled={!form.description.trim()}>Save</Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}
        <Input label="Description"
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <Input type="number" min="0" step="0.01" label="Budget ($)"
          value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
        <div className="space-y-2 rounded-md bg-surface-alt p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Actual Cost</span>
            <span className="font-medium text-ink">{formatCurrency(item.actual_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Committed</span>
            <span className="font-medium text-ink">{formatCurrency(item.committed_amount_cents)}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-2">
            <span className="text-ink">Variance</span>
            <span className={`font-bold ${variance < 0 ? 'text-status-danger' : 'text-status-success'}`}>
              {variance < 0 ? '-' : '+'}{formatCurrency(Math.abs(variance))}
            </span>
          </div>
        </div>
      </div>
    </SlideOver>
  );
}

export default function BudgetPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('financial');

  const [project, setProject] = useState<Project | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [budgetLineItems, setBudgetLineItems] = useState<BudgetLineItem[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedLineItem, setSelectedLineItem] = useState<BudgetLineItem | null>(null);

  const load = useCallback(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/invoices?project_id=${id}&limit=50`).then(r => r.json()).then(d => { if (d.invoices) setInvoices(d.invoices as Invoice[]); }),
      fetch(`/api/change-orders?project_id=${id}&limit=50`).then(r => r.json()).then(d => { if (d.change_orders) setChangeOrders(d.change_orders as ChangeOrder[]); }),
      fetch(`/api/budget-line-items?project_id=${id}&limit=100`).then(r => r.json()).then(d => { if (d.budget_line_items) setBudgetLineItems(d.budget_line_items as BudgetLineItem[]); }),
    ]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount_cents, 0);
  const totalBudget = budgetLineItems.reduce((sum, b) => sum + b.budget_cents, 0);
  const totalActual = budgetLineItems.reduce((sum, b) => sum + b.actual_cents, 0);
  const totalCommitted = budgetLineItems.reduce((sum, b) => sum + b.committed_amount_cents, 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted">
          <Link href="/projects" className="hover:text-ink">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
          <span>/</span>
          <span className="text-ink">{t('budget.title')}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('budget.page_title')}</h1>
          <div className="flex items-center gap-2">
            <Link href={`/projects/${id}/budget/new-invoice`}><Button>{t('budget.add_invoice')}</Button></Link>
            <Link href={`/projects/${id}/budget/new-change-order`}><Button variant="secondary">{t('budget.add_change_order')}</Button></Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiTile
          label={t('budget.original_budget')}
          value={formatCurrency(totalBudget)}
          hint={`${budgetLineItems.length} line item${budgetLineItems.length !== 1 ? 's' : ''}`}
        />
        <KpiTile
          label={t('budget.actual_cost')}
          value={<span className={totalActual > totalBudget ? 'text-status-danger' : ''}>{formatCurrency(totalActual)}</span>}
          hint={totalBudget > 0 ? `${Math.round((totalActual / totalBudget) * 100)}% of budget` : '—'}
        />
        <KpiTile label={t('budget.committed')} value={formatCurrency(totalCommitted)} hint={t('budget.in_vendor_bids')} />
        <KpiTile
          label={t('budget.invoiced')}
          value={formatCurrency(totalInvoiced)}
          hint={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`}
        />
      </div>

      {/* Budget Line Items */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">{t('budget.line_items')}</h2>
          <Link href={`/projects/${id}/budget/new-line-item`} className="text-xs font-medium text-brand-600 hover:text-brand-700">
            + {t('budget.new_line_item')}
          </Link>
        </div>
        {budgetLineItems.length === 0 ? (
          <EmptyState title={t('budget.no_line_items')} />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>{t('budget.description')}</TH>
                  <TH className="text-right">{t('budget.budget_col')}</TH>
                  <TH className="text-right">{t('budget.actual_col')}</TH>
                  <TH className="text-right">{t('budget.committed_col')}</TH>
                  <TH className="text-right">{t('budget.variance_col')}</TH>
                </TR>
              </THead>
              <TBody>
                {budgetLineItems.map(item => {
                  const variance = item.budget_cents - item.actual_cents;
                  return (
                    <TR key={item.id} onClick={() => setSelectedLineItem(item)} className="cursor-pointer">
                      <TD className="font-medium">{item.description}</TD>
                      <TD className="text-right text-muted">{formatCurrency(item.budget_cents)}</TD>
                      <TD className="text-right text-muted">{formatCurrency(item.actual_cents)}</TD>
                      <TD className="text-right text-muted">{formatCurrency(item.committed_amount_cents)}</TD>
                      <TD className={`text-right font-medium ${variance < 0 ? 'text-status-danger' : 'text-status-success'}`}>
                        {variance < 0 ? '-' : '+'}{formatCurrency(Math.abs(variance))}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
              <tfoot>
                <tr className="border-t-2 border-line bg-surface-alt font-semibold text-ink">
                  <td className="px-3 py-2.5">{t('budget.total')}</td>
                  <td className="px-3 py-2.5 text-right">{formatCurrency(totalBudget)}</td>
                  <td className="px-3 py-2.5 text-right">{formatCurrency(totalActual)}</td>
                  <td className="px-3 py-2.5 text-right">{formatCurrency(totalCommitted)}</td>
                  <td className={`px-3 py-2.5 text-right ${totalActual > totalBudget ? 'text-status-danger' : 'text-status-success'}`}>
                    {totalActual > totalBudget ? '-' : '+'}{formatCurrency(Math.abs(totalBudget - totalActual))}
                  </td>
                </tr>
              </tfoot>
            </Table>
          </Card>
        )}
      </div>

      {/* Invoices */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink">{t('invoices.title')}</h2>
        {invoices.length === 0 ? (
          <EmptyState title={t('invoices.no_invoices')} />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>{t('invoices.amount')}</TH>
                  <TH>{t('invoices.status')}</TH>
                  <TH>{t('invoices.due_date')}</TH>
                  <TH>{t('invoices.created')}</TH>
                </TR>
              </THead>
              <TBody>
                {invoices.map(inv => (
                  <TR key={inv.id} onClick={() => setSelectedInvoice(inv)} className="cursor-pointer">
                    <TD className="font-medium">{formatCurrency(inv.amount_cents)}</TD>
                    <TD><StatusPill status={inv.status} /></TD>
                    <TD className="text-muted">{formatDate(inv.due_date)}</TD>
                    <TD className="text-muted">{formatDate(inv.created_at)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Change Orders */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink">{t('change_orders.title')}</h2>
        {changeOrders.length === 0 ? (
          <EmptyState title={t('change_orders.no_change_orders')} />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>{t('change_orders.title_field')}</TH>
                  <TH>{t('change_orders.amount')}</TH>
                  <TH>{t('change_orders.status')}</TH>
                  <TH>{t('change_orders.created')}</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {changeOrders.map(co => (
                  <TR key={co.id}>
                    <TD className="font-medium">{co.title}</TD>
                    <TD>{formatCurrency(co.amount_cents)}</TD>
                    <TD><StatusPill status={co.status} /></TD>
                    <TD className="text-muted">{formatDate(co.created_at)}</TD>
                    <TD>
                      <ChangeOrderActions changeOrderId={co.id} status={co.status} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </div>

      {selectedInvoice && (
        <InvoiceSlideOver
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSaved={updated => { setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i)); setSelectedInvoice(null); }}
        />
      )}

      {selectedLineItem && (
        <LineItemSlideOver
          item={selectedLineItem}
          onClose={() => setSelectedLineItem(null)}
          onSaved={updated => { setBudgetLineItems(prev => prev.map(i => i.id === updated.id ? updated : i)); setSelectedLineItem(null); }}
          onDeleted={deletedId => { setBudgetLineItems(prev => prev.filter(i => i.id !== deletedId)); setSelectedLineItem(null); }}
        />
      )}
    </div>
  );
}
