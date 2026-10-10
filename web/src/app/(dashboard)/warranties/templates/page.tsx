'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Card,
  PageHeader,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  SlideOver,
  Spinner,
} from '@/components/ui';

interface CoverageTemplate {
  id: string;
  name: string;
  description: string | null;
  is_system_template: boolean;
  items_count: number;
}

interface TemplateItem {
  id: string;
  coverage_tier: string;
  description: string;
  duration_months: number;
  trade_category: string | null;
}

interface ItemForm {
  coverage_tier: string;
  description: string;
  duration_months: string;
  trade_category: string;
}

const EMPTY_ITEM_FORM: ItemForm = { coverage_tier: 'workmanship', description: '', duration_months: '12', trade_category: '' };

// Coverage tier → canonical status state (drives the semantic color via lib/status).
const TIER_STATUS: Record<string, string> = {
  workmanship: 'open',      // info
  systems: 'pending',       // warning
  structural: 'active',     // success
  custom: 'draft',          // neutral
};

function TierBadge({ tier, t }: { tier: string; t: (k: string) => string }) {
  return <Badge status={TIER_STATUS[tier] ?? 'draft'}>{t(`tier.${tier}`)}</Badge>;
}

/** System-template marker (platform-provided, not a domain status). */
function SystemChip({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex text-xs px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 font-medium ${className}`}>
      {label}
    </span>
  );
}

export default function WarrantyTemplatesPage() {
  const { t } = useTranslation('warranties');
  const [templates, setTemplates] = useState<CoverageTemplate[]>([]);
  const [selected, setSelected] = useState<CoverageTemplate | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM_FORM);
  const [editingItem, setEditingItem] = useState<TemplateItem | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState('');

  const loadTemplates = () => {
    fetch('/api/warranty-coverage-templates?limit=100')
      .then(r => r.json())
      .then(d => { if (d.templates) setTemplates(d.templates as CoverageTemplate[]); })
      .catch(() => {});
  };

  useEffect(() => { loadTemplates(); }, []);

  const openTemplate = (tmpl: CoverageTemplate) => {
    setSelected(tmpl);
    setItems([]);
    setLoadingItems(true);
    fetch(`/api/warranty-coverage-templates/${tmpl.id}/items`)
      .then(r => r.json())
      .then(d => { if (d.items) setItems(d.items as TemplateItem[]); })
      .catch(() => {})
      .finally(() => setLoadingItems(false));
  };

  const createTemplate = async () => {
    if (!newName.trim()) return;
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/warranty-coverage-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message ?? t('errors.save_failed')); return; }
      setShowCreate(false);
      setNewName(''); setNewDesc('');
      loadTemplates();
    } catch { setError(t('errors.network_error')); } finally { setSaving(false); }
  };

  const addItem = async () => {
    if (!selected || selected.is_system_template) return;
    if (!itemForm.description || !itemForm.duration_months) return;
    setSavingItem(true); setItemError('');
    try {
      const res = await fetch(`/api/warranty-coverage-templates/${selected.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverage_tier: itemForm.coverage_tier,
          description: itemForm.description,
          duration_months: parseInt(itemForm.duration_months),
          trade_category: itemForm.trade_category || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setItemError(data?.error?.message ?? t('errors.save_failed')); return; }
      setItems(prev => [...prev, data.item as TemplateItem]);
      setItemForm(EMPTY_ITEM_FORM);
    } catch { setItemError(t('errors.network_error')); } finally { setSavingItem(false); }
  };

  const updateItem = async () => {
    if (!selected || !editingItem) return;
    setSavingItem(true); setItemError('');
    try {
      const res = await fetch(`/api/warranty-coverage-templates/${selected.id}/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverage_tier: itemForm.coverage_tier,
          description: itemForm.description,
          duration_months: parseInt(itemForm.duration_months),
          trade_category: itemForm.trade_category || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setItemError(data?.error?.message ?? t('errors.save_failed')); return; }
      setItems(prev => prev.map(i => i.id === editingItem.id ? data.item as TemplateItem : i));
      setEditingItem(null);
      setItemForm(EMPTY_ITEM_FORM);
    } catch { setItemError(t('errors.network_error')); } finally { setSavingItem(false); }
  };

  const removeItem = async (item: TemplateItem) => {
    if (!selected) return;
    await fetch(`/api/warranty-coverage-templates/${selected.id}/items/${item.id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const startEditItem = (item: TemplateItem) => {
    setEditingItem(item);
    setItemForm({
      coverage_tier: item.coverage_tier,
      description: item.description,
      duration_months: String(item.duration_months),
      trade_category: item.trade_category ?? '',
    });
  };

  return (
    <div>
      <PageHeader
        title={t('templates_title')}
        className="mb-6"
        actions={
          <Button onClick={() => { setShowCreate(true); setNewName(''); setNewDesc(''); setError(''); }}>
            + {t('new_template')}
          </Button>
        }
      />

      <Card padding="none" className="overflow-hidden">
        <Table>
          <THead>
            <TR className="bg-surface-alt hover:bg-surface-alt">
              <TH>{t('col.title')}</TH>
              <TH>{t('col.description')}</TH>
              <TH>{t('col.actions')}</TH>
            </TR>
          </THead>
          <TBody>
            {templates.length === 0 && (
              <TR><TD colSpan={3} className="px-4 py-8 text-center text-muted">{t('no_templates')}</TD></TR>
            )}
            {templates.map(tmpl => (
              <TR key={tmpl.id} className="cursor-pointer" onClick={() => openTemplate(tmpl)}>
                <TD className="font-medium text-ink">
                  {tmpl.name}
                  {tmpl.is_system_template && <SystemChip label={t('system_badge')} className="ml-2" />}
                </TD>
                <TD className="text-muted">{tmpl.description ?? '—'}</TD>
                <TD className="text-xs text-brand-600">{t('open_detail')}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* Template detail slide-over */}
      <SlideOver
        open={!!selected}
        onClose={() => { setSelected(null); setEditingItem(null); setItemForm(EMPTY_ITEM_FORM); }}
        width="max-w-lg"
        title={
          selected ? (
            <span className="flex items-center gap-2">
              {selected.name}
              {selected.is_system_template && <SystemChip label={t('system_badge')} />}
            </span>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-5">
            {selected.description && <p className="text-sm text-muted">{selected.description}</p>}

            <div>
              <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">{t('detail.coverage_items')}</h3>
              {loadingItems && (
                <div className="flex items-center gap-2 text-sm text-muted"><Spinner className="h-4 w-4" />{t('homeowner.loading')}</div>
              )}
              {!loadingItems && items.length === 0 && (
                <p className="text-sm text-muted">{t('detail.no_coverage_items')}</p>
              )}
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-md bg-surface-alt border border-line">
                    <div className="flex-1 min-w-0">
                      <TierBadge tier={item.coverage_tier} t={t} />
                      <p className="text-sm text-ink mt-1">{item.description}</p>
                      <p className="text-xs text-muted mt-0.5">{item.duration_months} {t('col.duration').toLowerCase()}</p>
                    </div>
                    {!selected.is_system_template && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEditItem(item)}
                          className="text-xs text-brand-600 hover:underline px-1"
                        >
                          {t('form.edit', { defaultValue: 'Edit' })}
                        </button>
                        <button
                          onClick={() => removeItem(item)}
                          className="text-xs text-status-danger hover:underline px-1"
                        >
                          {t('form.remove_item')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add / edit item form — only for custom templates */}
            {!selected.is_system_template && (
              <div className="border-t border-line pt-4 space-y-3">
                <h3 className="text-xs font-medium text-muted uppercase tracking-wide">
                  {editingItem ? t('form.update_item') : t('form.add_item')}
                </h3>
                {itemError && (
                  <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-2 text-sm text-status-danger">{itemError}</div>
                )}
                <Select
                  label={t('form.coverage_tier')}
                  value={itemForm.coverage_tier}
                  onChange={e => setItemForm(f => ({ ...f, coverage_tier: e.target.value }))}
                >
                  <option value="workmanship">{t('tier.workmanship')}</option>
                  <option value="systems">{t('tier.systems')}</option>
                  <option value="structural">{t('tier.structural')}</option>
                  <option value="custom">{t('tier.custom')}</option>
                </Select>
                <Input
                  label={t('col.description')}
                  value={itemForm.description}
                  onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t('form.duration_months')}
                    type="number"
                    min={1}
                    value={itemForm.duration_months}
                    onChange={e => setItemForm(f => ({ ...f, duration_months: e.target.value }))}
                  />
                  <Select
                    label={t('col.trade_category')}
                    value={itemForm.trade_category}
                    onChange={e => setItemForm(f => ({ ...f, trade_category: e.target.value }))}
                  >
                    <option value="">{t('form.no_template')}</option>
                    {['general','electrical','plumbing','hvac','structural','framing','roofing','other'].map(cat => (
                      <option key={cat} value={cat}>{t(`trade_category.${cat}`)}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={editingItem ? updateItem : addItem}
                    loading={savingItem}
                    disabled={savingItem || !itemForm.description || !itemForm.duration_months}
                  >
                    {savingItem ? t('form.saving') : editingItem ? t('form.update_item') : t('form.add_item')}
                  </Button>
                  {editingItem && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => { setEditingItem(null); setItemForm(EMPTY_ITEM_FORM); }}
                    >
                      {t('form.cancel')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOver>

      {/* Create template slide-over */}
      <SlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('new_template')}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)}>
              {t('form.cancel')}
            </Button>
            <Button size="sm" onClick={createTemplate} loading={saving} disabled={saving || !newName.trim()}>
              {saving ? t('form.saving') : t('form.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>
          )}
          <Input
            label={t('form.name')}
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <Textarea
            label={t('form.template_description')}
            rows={3}
            className="resize-none"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
        </div>
      </SlideOver>
    </div>
  );
}
