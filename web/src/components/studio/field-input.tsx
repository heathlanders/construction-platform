'use client';

// Generic Design Studio field renderer — one component per field TYPE, driven entirely by the
// localized step data from the API. Adding a trade never touches this file (invariant 5).
// Photo fields are rendered by PhotoField (they need the upload flow).

import { useTranslation } from 'react-i18next';
import type { FieldDef, FieldValue } from './types';

interface Props {
  field: FieldDef;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
  /** Provenance badge (e.g. estimated from a photo). */
  note?: string;
}

const inputCls = 'block w-full rounded-md border border-line bg-surface px-3 py-2.5 text-base text-ink focus:outline-none focus:ring-2 focus:ring-brand-500';

function NumberBox({ label, value, onChange, min, max, step, disabled }: {
  label: string; value: unknown; onChange: (n: number | null) => void; min?: number; max?: number; step?: number; disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-muted">
      {label}
      <input
        type="number" inputMode="decimal" min={min} max={max} step={step ?? 'any'} disabled={disabled}
        className={inputCls}
        value={typeof value === 'number' ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    </label>
  );
}

type Area = Record<string, number | string>;

function areaSf(a: Area): number | null {
  const n = (k: string) => (typeof a[k] === 'number' ? (a[k] as number) : 0);
  switch (a.shape) {
    case 'rect': return n('length_ft') * n('width_ft') || null;
    case 'l_shape': return n('a_length_ft') * n('a_width_ft') + n('b_length_ft') * n('b_width_ft') || null;
    case 'circle': return Math.PI * (n('diameter_ft') / 2) ** 2 || null;
    case 'direct_sf': return n('area_sf') || null;
    default: return null;
  }
}

const SHAPE_DIMS: Record<string, string[]> = {
  rect: ['length_ft', 'width_ft'],
  l_shape: ['a_length_ft', 'a_width_ft', 'b_length_ft', 'b_width_ft'],
  circle: ['diameter_ft'],
  direct_sf: ['area_sf'],
};

function AreaInput({ field, value, onChange, disabled }: Props) {
  const { t } = useTranslation('studio');
  const shapes = field.shapes ?? ['rect'];
  const a: Area = (value && typeof value === 'object' ? value : { shape: shapes[0] }) as Area;
  const shape = String(a.shape ?? shapes[0]);
  const set = (k: string, v: number | null) => {
    const next: Area = { ...a, shape };
    if (v === null) delete next[k]; else next[k] = v;
    onChange(next);
  };
  const sf = areaSf(a);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fields.shape')}>
        {shapes.map((s) => (
          <button
            key={s} type="button" role="radio" aria-checked={shape === s} disabled={disabled}
            onClick={() => onChange({ shape: s })}
            className={`rounded-full border px-3 py-1.5 text-sm ${shape === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface text-ink hover:border-brand-500'}`}
          >
            {t(`fields.shape_${s}`)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SHAPE_DIMS[shape]!.map((k) => (
          <NumberBox key={k} label={t(`fields.${k}`)} value={a[k]} min={0} disabled={disabled} onChange={(n) => set(k, n)} />
        ))}
      </div>
      {sf && <p className="text-sm text-muted">{t('fields.area_total', { sf: Math.round(sf) })}</p>}
    </div>
  );
}

function ChoiceInput({ field, value, onChange, disabled }: Props) {
  const opts = field.options ?? [];
  return (
    <div className={`grid gap-2 ${opts.length > 3 ? 'sm:grid-cols-2' : ''}`} role="radiogroup" aria-label={field.label}>
      {opts.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value} type="button" role="radio" aria-checked={on} disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${on ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-line bg-surface hover:border-brand-500'}`}
          >
            {o.swatch && <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-line" style={{ backgroundColor: o.swatch }} aria-hidden="true" />}
            <span>
              <span className="block text-sm font-medium text-ink">{o.label}</span>
              {o.help && <span className="block text-xs text-muted">{o.help}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MultiChoiceInput({ field, value, onChange, disabled }: Props) {
  const sel = Array.isArray(value) ? (value as string[]) : [];
  const cap = field.max_select ?? Infinity;
  return (
    <div className="flex flex-wrap gap-2">
      {(field.options ?? []).map((o) => {
        const on = sel.includes(o.value);
        return (
          <button
            key={o.value} type="button" aria-pressed={on} disabled={disabled || (!on && sel.length >= cap)}
            onClick={() => onChange(on ? sel.filter((x) => x !== o.value) : [...sel, o.value])}
            className={`rounded-full border px-3 py-1.5 text-sm ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface text-ink hover:border-brand-500'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function BooleanInput({ value, onChange, disabled }: Props) {
  const { t } = useTranslation('studio');
  return (
    <div className="flex gap-2">
      {[true, false].map((b) => (
        <button
          key={String(b)} type="button" aria-pressed={value === b} disabled={disabled}
          onClick={() => onChange(b)}
          className={`min-w-20 rounded-md border px-4 py-2 text-sm ${value === b ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface text-ink hover:border-brand-500'}`}
        >
          {b ? t('fields.yes') : t('fields.no')}
        </button>
      ))}
    </div>
  );
}

export function FieldInput(props: Props) {
  const { t } = useTranslation('studio');
  const { field, value, onChange, disabled, note } = props;
  let control: React.ReactNode;
  switch (field.type) {
    case 'area': control = <AreaInput {...props} />; break;
    case 'choice': control = <ChoiceInput {...props} />; break;
    case 'multichoice': control = <MultiChoiceInput {...props} />; break;
    case 'boolean': control = <BooleanInput {...props} />; break;
    case 'text':
      control = (
        <textarea
          className={inputCls} rows={3} maxLength={field.max_len} disabled={disabled}
          value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case 'linear':
      control = <NumberBox label="" value={value} min={field.min_lf} max={field.max_lf} disabled={disabled} onChange={(n) => onChange(n)} />;
      break;
    case 'count':
      control = <NumberBox label="" value={value} min={field.min} max={field.max} step={1} disabled={disabled} onChange={(n) => onChange(n === null ? null : Math.round(n))} />;
      break;
    case 'number':
      control = <NumberBox label="" value={value} min={field.min} max={field.max} step={field.step} disabled={disabled} onChange={(n) => onChange(n)} />;
      break;
    default:
      control = null;
  }
  return (
    <fieldset className="space-y-2">
      <legend className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
        {field.label}
        {!field.required && <span className="text-xs font-normal text-muted">({t('wizard.optional')})</span>}
        {note && <span className="rounded-full bg-status-warning-bg px-2 py-0.5 text-xs font-normal text-status-warning">{note}</span>}
      </legend>
      {field.help && <p className="text-sm text-muted">{field.help}</p>}
      {control}
    </fieldset>
  );
}
