'use client';

// Design Studio wizard — TRADE-AGNOSTIC. Steps come from the API (trade steps per scope → pictures →
// common property/timing steps → review). Each step saves on "Next"; photos and accepted assistant
// suggestions save immediately. The server re-validates everything; this page only renders.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { FieldInput } from '@/components/studio/field-input';
import { PhotoField } from '@/components/studio/photo-field';
import { AiAssistant, ProposalCard, RangeCard, RendersPanel, RequirementsList, type ProposalView } from '@/components/studio/panels';
import {
  apiError, bi, missingInStep, visible,
  type FieldDef, type Intake, type RequestDto, type ScopeDto, type StepDef, type Values,
} from '@/components/studio/types';

const API = '/api/v1/client-portal/studio';

type WizardStep =
  | { kind: 'scope'; scopeId: string; step: StepDef }
  | { kind: 'renders'; scopeId: string }
  | { kind: 'common'; step: StepDef }
  | { kind: 'review' };

export default function StudioWizard() {
  const { requestId } = useParams<{ requestId: string }>();
  const { t, i18n } = useTranslation('studio');
  const lang = i18n.language === 'es' ? 'es' : 'en';
  const [request, setRequest] = useState<RequestDto | null>(null);
  const [proposal, setProposal] = useState<ProposalView | null>(null);
  const [scopes, setScopes] = useState<ScopeDto[]>([]);
  const [intakes, setIntakes] = useState<Record<string, Intake>>({});
  const [idx, setIdx] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, Values>>({}); // scopeId | 'common' → values
  const [dirty, setDirty] = useState<Record<string, Set<string>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [offered, setOffered] = useState<{ trade_key: string; label: string; entry_points: { id: string; label: string }[] }[]>([]);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`${API}/requests/${requestId}`);
    if (!res.ok) { setLoadError(await apiError(res, t('start.error'))); return; }
    const d = await res.json();
    setRequest(d.request);
    setProposal(d.proposal ?? null);
    setScopes(d.scopes);
    fetch(`${API}/trades?lang=${lang}`).then((r) => (r.ok ? r.json() : { trades: [] })).then((x) => setOffered(x.trades ?? [])).catch(() => undefined);
    const keys = [...new Set<string>(d.scopes.map((s: ScopeDto) => s.trade_key))];
    const fetched = await Promise.all(keys.map((k) => fetch(`${API}/trades/${k}/intake?lang=${lang}`).then((r) => (r.ok ? r.json() : null))));
    setIntakes(Object.fromEntries(fetched.filter(Boolean).map((i: Intake) => [i.trade_key, i])));
    setDrafts((prev) => {
      const next: Record<string, Values> = { common: { ...d.request.common_values, ...(prev.common ?? {}) } };
      for (const s of d.scopes as ScopeDto[]) next[s.id] = { ...s.values, ...pick(prev[s.id], dirty[s.id]) };
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, lang, t]);
  useEffect(() => { load(); }, [load]);

  const refreshScopes = useCallback(async () => {
    const res = await fetch(`${API}/requests/${requestId}`);
    if (res.ok) {
      const d = await res.json();
      setScopes(d.scopes);
      setRequest(d.request);
    }
  }, [requestId]);

  const locked = request ? request.status !== 'draft' : true;

  const steps: WizardStep[] = useMemo(() => {
    const out: WizardStep[] = [];
    for (const s of scopes) {
      const intake = intakes[s.trade_key];
      if (!intake) continue;
      for (const step of intake.steps) out.push({ kind: 'scope', scopeId: s.id, step });
      if (intake.features.renders) out.push({ kind: 'renders', scopeId: s.id });
    }
    const first = scopes[0] && intakes[scopes[0].trade_key];
    if (first) for (const step of first.common_steps) out.push({ kind: 'common', step });
    out.push({ kind: 'review' });
    return out;
  }, [scopes, intakes]);

  // Skip steps hidden by their own visibility rule.
  const visibleSteps = steps.filter((s) => s.kind !== 'scope' || visible(s.step.visible_when, drafts[s.scopeId] ?? {}));
  const current = visibleSteps[Math.min(idx, visibleSteps.length - 1)];
  useEffect(() => { if (locked && visibleSteps.length) setIdx(visibleSteps.length - 1); }, [locked, visibleSteps.length]);

  function pick(values: Values | undefined, keys: Set<string> | undefined): Values {
    if (!values || !keys) return {};
    return Object.fromEntries([...keys].filter((k) => k in values).map((k) => [k, values[k]]));
  }

  function setValue(key: string, field: string, v: unknown) {
    setDrafts((d) => ({ ...d, [key]: { ...(d[key] ?? {}), [field]: v } }));
    setDirty((m) => ({ ...m, [key]: new Set([...(m[key] ?? []), field]) }));
  }

  function applyScope(scope: ScopeDto, accepted: string[] = []) {
    setScopes((list) => list.map((s) => (s.id === scope.id ? scope : s)));
    const keep = new Set([...(dirty[scope.id] ?? [])].filter((f) => !accepted.includes(f)));
    setDirty((m) => ({ ...m, [scope.id]: keep }));
    setDrafts((d) => ({ ...d, [scope.id]: { ...scope.values, ...pick(d[scope.id], keep) } }));
  }

  async function patchScope(scopeId: string, values: Values): Promise<boolean> {
    const scope = scopes.find((s) => s.id === scopeId)!;
    const res = await fetch(`${API}/requests/${requestId}/scopes/${scopeId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: scope.version, values }),
    });
    if (!res.ok) {
      if (res.status === 409) await refreshScopes();
      setError(await apiError(res, t('wizard.save_error')));
      return false;
    }
    const d = await res.json();
    setDirty((m) => { const n = new Set(m[scopeId] ?? []); Object.keys(values).forEach((k) => n.delete(k)); return { ...m, [scopeId]: n }; });
    applyScope(d.scope);
    return true;
  }

  async function saveCurrent(): Promise<boolean> {
    if (!current || locked) return true;
    setError('');
    if (current.kind === 'scope') {
      const draft = drafts[current.scopeId] ?? {};
      const changed = [...(dirty[current.scopeId] ?? [])].filter((f) => current.step.fields.some((x) => x.id === f));
      if (!changed.length) return true;
      setSaving(true);
      const ok = await patchScope(current.scopeId, Object.fromEntries(changed.map((f) => [f, draft[f] ?? null])));
      setSaving(false);
      return ok;
    }
    if (current.kind === 'common' && request) {
      const draft = drafts.common ?? {};
      const changed = [...(dirty.common ?? [])];
      if (!changed.length) return true;
      setSaving(true);
      const res = await fetch(`${API}/requests/${requestId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: request.version, common_values: Object.fromEntries(changed.map((f) => [f, draft[f] ?? null])) }),
      });
      setSaving(false);
      if (!res.ok) { setError(await apiError(res, t('wizard.save_error'))); if (res.status === 409) load(); return false; }
      const d = await res.json();
      setRequest(d.request);
      setDirty((m) => ({ ...m, common: new Set() }));
      return true;
    }
    return true;
  }

  async function next() {
    if (!current) return;
    if (current.kind === 'scope' || current.kind === 'common') {
      const values = current.kind === 'scope' ? drafts[current.scopeId] ?? {} : drafts.common ?? {};
      const miss = missingInStep(current.step, values);
      if (miss.length) {
        setError(t('wizard.missing', { fields: miss.map((m) => current.step.fields.find((f) => f.id === m)?.label ?? m).join(', ') }));
        return;
      }
    }
    if (await saveCurrent()) setIdx((i) => Math.min(i + 1, visibleSteps.length - 1));
  }

  async function back() {
    if (await saveCurrent()) setIdx((i) => Math.max(0, i - 1));
  }

  async function submit() {
    if (!request) return;
    setSaving(true); setError('');
    const res = await fetch(`${API}/requests/${requestId}/submit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: request.version }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      const missing: Record<string, string[]> | undefined = d?.error?.missing;
      if (missing) {
        const firstKey = Object.keys(missing)[0]!;
        const field = missing[firstKey]![0];
        const target = visibleSteps.findIndex((s) =>
          (s.kind === 'common' && firstKey === 'request' && s.step.fields.some((f) => f.id === field)) ||
          (s.kind === 'scope' && s.scopeId === firstKey && s.step.fields.some((f) => f.id === field)));
        if (target >= 0) setIdx(target);
      }
      setError(d?.error?.message ?? t('wizard.save_error'));
      return;
    }
    setRequest((await res.json()).request);
    refreshScopes();
  }

  if (loadError) return <div className="rounded-lg border border-status-danger/40 bg-status-danger-bg p-6 text-sm text-status-danger">{loadError}</div>;
  if (!request || !current) return <p className="text-sm text-muted">{t('client.loading')}</p>;

  const scopeOf = (id: string) => scopes.find((s) => s.id === id)!;
  const position = visibleSteps.indexOf(current);
  const mainScope = scopes[0];

  const renderField = (key: string, f: FieldDef, scope?: ScopeDto) => {
    const values = drafts[key] ?? {};
    if (!visible(f.visible_when, values)) return null;
    if (f.type === 'photo' && scope) {
      return (
        <PhotoField
          key={f.id} field={f} photos={scope.photos} disabled={locked}
          value={Array.isArray(values[f.id]) ? (values[f.id] as string[]) : []}
          uploadUrl={`${API}/requests/${requestId}/scopes/${scope.id}/uploads`}
          onChange={async (ids) => { setValue(key, f.id, ids); await patchScope(scope.id, { [f.id]: ids }); }}
        />
      );
    }
    return (
      <FieldInput
        key={f.id} field={f} value={values[f.id]} disabled={locked}
        note={scope?.provenance[f.id] === 'photo_estimate' ? t('ai.estimate_note') : undefined}
        onChange={(v) => setValue(key, f.id, v)}
      />
    );
  };

  const multi = scopes.length > 1;
  const areaLabel = (scopeId: string) => {
    const i = scopes.findIndex((s) => s.id === scopeId);
    const tr = offered.find((o) => o.trade_key === scopes[i]?.trade_key);
    return `${t('wizard.area_n', { n: i + 1 })}${tr ? ` · ${tr.label}` : ''}`;
  };
  const combinedRange = scopes.every((s) => s.range)
    ? { low_cents: scopes.reduce((a, s) => a + s.range!.low_cents, 0), high_cents: scopes.reduce((a, s) => a + s.range!.high_cents, 0) }
    : null;

  async function addArea(tradeKey: string, entryPointId: string) {
    setSaving(true); setError('');
    const res = await fetch(`${API}/requests/${requestId}/scopes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trade_key: tradeKey, entry_point_id: entryPointId }),
    });
    setSaving(false);
    if (!res.ok) { setError(await apiError(res, t('wizard.save_error'))); return; }
    setAdding(false);
    await load();
    // Jump to the new area's first step (it's appended after the existing areas' steps).
    setIdx(Math.max(0, steps.filter((s) => s.kind === 'scope' || s.kind === 'renders').length));
  }

  async function removeArea(scopeId: string) {
    setSaving(true);
    const res = await fetch(`${API}/requests/${requestId}/scopes/${scopeId}`, { method: 'DELETE' });
    setSaving(false);
    if (!res.ok) { setError(await apiError(res, t('wizard.save_error'))); return; }
    await load();
  }

  let body: React.ReactNode;
  if (current.kind === 'scope') {
    const scope = scopeOf(current.scopeId);
    const intake = intakes[scope.trade_key]!;
    const allFields = intake.steps.flatMap((s) => s.fields);
    const hasAi = current.step.fields.some((f) => f.ai_suggestible || f.ai_assessable);
    body = (
      <div className="space-y-6">
        <div>
          {multi && <p className="text-xs font-medium uppercase tracking-wide text-brand-700">{areaLabel(scope.id)}</p>}
          <h2 className="text-lg font-semibold text-ink">{current.step.title}</h2>
          {current.step.intro && <p className="mt-1 text-sm text-muted">{current.step.intro}</p>}
        </div>
        {current.step.fields.map((f) => renderField(scope.id, f, scope))}
        {hasAi && !locked && (
          <AiAssistant
            base={`${API}/requests/${requestId}/scopes/${scope.id}`}
            fields={allFields}
            suggestions={scope.ai_suggestions}
            canGuide={intake.features.ai_guide && current.step.fields.some((f) => f.ai_suggestible)}
            canAssess={intake.features.photo_assess && scope.photos.some((p) => p.status === 'ready') && current.step.fields.some((f) => f.ai_assessable)}
            onScope={(s, accepted) => applyScope(s as ScopeDto, accepted)}
          />
        )}
      </div>
    );
  } else if (current.kind === 'renders') {
    const scope = scopeOf(current.scopeId);
    body = (
      <div className="space-y-4">
        {multi && <p className="text-xs font-medium uppercase tracking-wide text-brand-700">{areaLabel(scope.id)}</p>}
        <h2 className="text-lg font-semibold text-ink">{t('renders.title')}</h2>
        <RendersPanel
          base={`${API}/requests/${requestId}/scopes/${scope.id}`} photos={scope.photos} renders={scope.renders}
          selectedId={scope.selected_render_id} enabled={intakes[scope.trade_key]?.features.renders ?? false} disabled={locked}
          onScope={(s) => applyScope(s as ScopeDto)} refresh={refreshScopes}
        />
      </div>
    );
  } else if (current.kind === 'common') {
    body = (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-ink">{current.step.title}</h2>
        {current.step.fields.map((f) => renderField('common', f))}
      </div>
    );
  } else {
    body = (
      <div className="space-y-6">
        {locked ? (
          <div className="rounded-lg border border-status-success/40 bg-status-success-bg p-4">
            <p className="text-sm font-semibold text-ink">{request.status === 'submitted' ? t('wizard.submitted_title') : t(`status.${request.status}`)}</p>
            <p className="text-sm text-muted">{request.status === 'submitted' ? t('wizard.submitted_body') : request.status === 'converted' ? t('wizard.converted_body') : t('wizard.locked')}</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-ink">{t('wizard.review_title')}</h2>
            <p className="mt-1 text-sm text-muted">{t('wizard.review_intro')}</p>
          </div>
        )}
        {scopes.map((s) => {
          const chosen = s.renders.find((r) => r.id === s.selected_render_id && r.url);
          return (
            <div key={s.id} className="space-y-3 rounded-lg border border-line bg-surface p-4">
              {multi && (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{areaLabel(s.id)}</p>
                  {!locked && scopes.indexOf(s) > 0 && (
                    <button type="button" className="text-xs text-status-danger hover:underline" disabled={saving} onClick={() => removeArea(s.id)}>{t('wizard.remove_area')}</button>
                  )}
                </div>
              )}
              {chosen && <img src={chosen.url!} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />}
              <dl className="divide-y divide-line">
                {s.summary.map((line) => (
                  <div key={line.field} className="flex justify-between gap-4 py-2 text-sm">
                    <dt className="text-muted">{bi(line.label, lang)}</dt>
                    <dd className="text-right font-medium text-ink">{bi(line.value, lang)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
        {!locked && offered.length > 0 && scopes.length < 5 && (
          adding ? (
            <div className="space-y-2 rounded-lg border border-dashed border-line p-4">
              <p className="text-sm text-muted">{t('wizard.add_area_intro')}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {offered.flatMap((o) => o.entry_points.map((e) => (
                  <button key={e.id} type="button" disabled={saving} onClick={() => addArea(o.trade_key, e.id)}
                    className="rounded-lg border border-line bg-surface p-3 text-left text-sm font-medium text-ink hover:border-brand-500 disabled:opacity-50">{e.label}</button>
                )))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>{t('wizard.back')}</Button>
            </div>
          ) : <Button variant="secondary" className="w-full" onClick={() => setAdding(true)}>+ {t('wizard.add_area')}</Button>
        )}
        {proposal && <ProposalCard requestId={requestId} proposal={proposal} onChange={setProposal} />}
        {!locked && <Button size="lg" className="w-full" loading={saving} onClick={submit}>{saving ? t('wizard.submitting') : t('wizard.submit')}</Button>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/portal/studio" className="text-sm text-brand-700 hover:underline">← {t('client.back')}</Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section className="space-y-6">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{t('wizard.step_of', { n: position + 1, total: visibleSteps.length })}</span>
            {saving && <span>{t('wizard.saving')}</span>}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${((position + 1) / visibleSteps.length) * 100}%` }} />
          </div>
          {body}
          {error && <p className="rounded-md bg-status-danger-bg p-3 text-sm text-status-danger" role="alert">{error}</p>}
          <div className="flex justify-between gap-3">
            <Button variant="secondary" onClick={back} disabled={position === 0 || saving}>{t('wizard.back')}</Button>
            {current.kind !== 'review' && <Button onClick={next} loading={saving}>{t('wizard.next')}</Button>}
          </div>
        </section>
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <RangeCard range={locked ? request.range : multi ? combinedRange : mainScope?.range ?? null} />
          {current.kind === 'review' && mainScope && (
            <RequirementsList items={[...new Map(scopes.flatMap((sc) => sc.requirements).map((r) => [r.id, r])).values()]} />
          )}
        </aside>
      </div>
    </div>
  );
}
