'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PageHeader, Button, Input, Select, Card, Badge,
  Table, THead, TBody, TR, TH, TD, SlideOver, EmptyState,
} from '@/components/ui';
import { STATUS_SOFT } from '@/lib/status';

interface ChecklistItem {
  id: string;
  description: string;
  response_type: 'ok_defect_na' | 'text' | 'numeric';
  required: boolean;
}

interface InspectionTemplate {
  id: string;
  name: string;
  asset_category: string | null;
  asset_type: string | null;
  inspection_frequency: string;
  is_osha_required: boolean;
  is_dot_required: boolean;
  is_system_template: boolean;
  is_active: boolean;
  checklist_items: ChecklistItem[];
  created_at: string;
}

interface TemplateForm {
  name: string;
  asset_category: string;
  asset_type: string;
  inspection_frequency: string;
  is_osha_required: boolean;
  is_dot_required: boolean;
  items: { description: string; response_type: string; required: boolean }[];
}

const EMPTY_FORM: TemplateForm = {
  name: '',
  asset_category: '',
  asset_type: '',
  inspection_frequency: 'pre_use',
  is_osha_required: false,
  is_dot_required: false,
  items: [{ description: '', response_type: 'ok_defect_na', required: true }],
};

export default function InspectionTemplatesPage() {
  const { t } = useTranslation('assets');
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [viewTemplate, setViewTemplate] = useState<InspectionTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadTemplates = () => {
    fetch('/api/asset-inspection-templates?limit=100')
      .then(r => r.json())
      .then(d => { if (d.templates) setTemplates(d.templates as InspectionTemplate[]); })
      .catch(() => {});
  };

  useEffect(() => { loadTemplates(); }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', response_type: 'ok_defect_na', required: true }] }));
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx: number, field: string, value: string | boolean) =>
    setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));

  const createTemplate = async () => {
    if (!form.name.trim() || form.items.some(i => !i.description.trim())) return;
    setSaving(true); setCreateError('');
    try {
      const res = await fetch('/api/asset-inspection-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          asset_category: form.asset_category || null,
          asset_type: form.asset_type || null,
          inspection_frequency: form.inspection_frequency,
          is_osha_required: form.is_osha_required,
          is_dot_required: form.is_dot_required,
          is_system_template: false,
          checklist_items: form.items.map((item, idx) => ({
            id: `item_${idx + 1}`,
            description: item.description,
            response_type: item.response_type,
            required: item.required,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data?.error?.message ?? t('assets.save_error')); return; }
      setShowCreate(false);
      setForm(EMPTY_FORM);
      loadTemplates();
    } catch { setCreateError(t('assets.network_error')); } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title={t('assets.templates_title')}
        subtitle={t('assets.templates_subtitle')}
        className="mb-6"
        actions={
          <Button onClick={() => { setShowCreate(true); setCreateError(''); setForm(EMPTY_FORM); }}>
            + {t('assets.create_template')}
          </Button>
        }
      />

      <Card padding="none">
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>{t('assets.col_template_name')}</TH>
              <TH>{t('assets.col_category')}</TH>
              <TH>{t('assets.col_frequency')}</TH>
              <TH>{t('assets.col_items')}</TH>
              <TH>{t('assets.col_source')}</TH>
              <TH>{t('assets.col_actions')}</TH>
            </TR>
          </THead>
          <TBody>
            {templates.length === 0 && (
              <TR className="hover:bg-transparent">
                <TD colSpan={6} className="py-8">
                  <EmptyState title={t('assets.no_templates')} />
                </TD>
              </TR>
            )}
            {templates.map(tmpl => (
              <TR key={tmpl.id}>
                <TD>
                  <p className="font-medium text-ink">{tmpl.name}</p>
                  {(tmpl.is_osha_required || tmpl.is_dot_required) && (
                    <div className="flex gap-1 mt-0.5">
                      {tmpl.is_osha_required && <Badge className={STATUS_SOFT.warning}>OSHA</Badge>}
                      {tmpl.is_dot_required && <Badge className={STATUS_SOFT.action}>DOT</Badge>}
                    </div>
                  )}
                </TD>
                <TD className="text-muted capitalize">
                  {tmpl.asset_category?.replace(/_/g, ' ') ?? '—'}
                  {tmpl.asset_type && <span className="text-muted text-xs"> / {tmpl.asset_type}</span>}
                </TD>
                <TD className="text-muted capitalize">{tmpl.inspection_frequency.replace(/_/g, ' ')}</TD>
                <TD className="text-muted">{tmpl.checklist_items.length}</TD>
                <TD>
                  {tmpl.is_system_template ? (
                    <Badge className={STATUS_SOFT.neutral}>{t('assets.system')}</Badge>
                  ) : (
                    <Badge className={STATUS_SOFT.info}>{t('assets.custom')}</Badge>
                  )}
                </TD>
                <TD>
                  <Button variant="ghost" size="sm" className="text-brand-600 hover:text-brand-700 px-0" onClick={() => setViewTemplate(tmpl)}>
                    {tmpl.is_system_template ? t('assets.view_only') : t('assets.view')}
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* View template slide-over */}
      <SlideOver open={!!viewTemplate} onClose={() => setViewTemplate(null)} title={viewTemplate?.name}>
        {viewTemplate && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('assets.col_frequency')}</p>
                <p className="text-ink capitalize">{viewTemplate.inspection_frequency.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{t('assets.col_category')}</p>
                <p className="text-ink capitalize">{viewTemplate.asset_category?.replace(/_/g, ' ') ?? '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">{t('assets.checklist_items')} ({viewTemplate.checklist_items.length})</p>
              <div className="space-y-2">
                {viewTemplate.checklist_items.map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-surface-alt rounded-md">
                    <span className="text-xs text-muted font-mono mt-0.5 w-5">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink">{item.description}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {item.response_type.replace(/_/g, ' ')}
                        {item.required && <span className="ml-1 text-status-danger">*</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Create template slide-over */}
      <SlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('assets.create_template')}
        width="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>{t('assets.cancel')}</Button>
            <Button
              onClick={createTemplate}
              loading={saving}
              disabled={saving || !form.name.trim() || form.items.some(i => !i.description.trim())}
            >
              {t('assets.create_template')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {createError && (
            <div className="rounded border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{createError}</div>
          )}

          <Input
            label={`${t('assets.field_template_name')} *`}
            placeholder="e.g. Forklift Daily Pre-Use Inspection"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('assets.field_category')}
              value={form.asset_category}
              onChange={e => setForm(f => ({ ...f, asset_category: e.target.value }))}
            >
              <option value="">{t('assets.all_categories')}</option>
              <option value="vehicle">{t('category.vehicle')}</option>
              <option value="heavy_equipment">{t('category.heavy_equipment')}</option>
              <option value="trailer">{t('category.trailer')}</option>
              <option value="power_tool">{t('category.power_tool')}</option>
              <option value="safety_equipment">{t('assets.category_safety_equipment')}</option>
            </Select>
            <Select
              label={t('assets.col_frequency')}
              value={form.inspection_frequency}
              onChange={e => setForm(f => ({ ...f, inspection_frequency: e.target.value }))}
            >
              <option value="pre_use">Pre-Use</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </Select>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input type="checkbox" checked={form.is_osha_required}
                onChange={e => setForm(f => ({ ...f, is_osha_required: e.target.checked }))}
                className="rounded border-line text-brand-600" />
              {t('assets.field_osha_required')}
            </label>
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input type="checkbox" checked={form.is_dot_required}
                onChange={e => setForm(f => ({ ...f, is_dot_required: e.target.checked }))}
                className="rounded border-line text-brand-600" />
              {t('assets.field_dot_required')}
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted uppercase tracking-wide">{t('assets.checklist_items')} *</label>
              <Button variant="ghost" size="sm" className="text-brand-600 hover:text-brand-700 px-0" onClick={addItem}>+ {t('assets.add_item')}</Button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-surface-alt rounded-md">
                  <span className="text-xs text-muted font-mono mt-2 w-5 shrink-0">{idx + 1}.</span>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder={t('assets.item_description_placeholder')}
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                    />
                    <div className="flex items-center gap-3">
                      <Select
                        className="text-xs"
                        value={item.response_type}
                        onChange={e => updateItem(idx, 'response_type', e.target.value)}
                      >
                        <option value="ok_defect_na">OK / Defect / N/A</option>
                        <option value="text">Text</option>
                        <option value="numeric">Numeric</option>
                      </Select>
                      <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer whitespace-nowrap">
                        <input type="checkbox" checked={item.required}
                          onChange={e => updateItem(idx, 'required', e.target.checked)}
                          className="rounded border-line text-brand-600" />
                        Required
                      </label>
                    </div>
                  </div>
                  {form.items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="text-muted hover:text-status-danger mt-2 text-lg leading-none shrink-0">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
