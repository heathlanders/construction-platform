'use client';

// Design Studio — contractor review of one client request: answers (with where each came from),
// photos + concept pictures (and their prompts), internal pricing, the range the client sees, the
// checklist, and the actions: verify measurements, create estimate, resend invite, decline.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardHeader, Modal, PageHeader, Table, THead, TBody, TR, TH, TD, Textarea, useToast } from '@/components/ui';
import { RequirementsList } from '@/components/studio/panels';
import { apiError, bi, money, type PhotoDto, type RenderDto, type Requirement } from '@/components/studio/types';

interface Line { assembly_code: string | null; description: string; quantity: number; unit: string | null; extended_cents: number; assumptions: string[] }
interface Scope {
  id: string; trade_key: string; status: string; version: number; measurements_verified: boolean;
  summary: { field: string; label: { en: string; es: string }; value: { en: string; es: string } }[];
  provenance: Record<string, string>;
  range: { low_cents: number; high_cents: number } | null;
  pricing: { totals: { total_cents: number; subtotal_cents: number; markup_cents: number }; lines: Line[]; range: { low_cents: number; high_cents: number; band_pct: number; unverified: boolean } };
  photos: PhotoDto[]; renders: RenderDto[]; selected_render_id: string | null;
  render_prompts: { id: string; prompt?: string; provider?: string; error?: string | null }[];
  requirements: Requirement[];
}
interface Bundle {
  request: { id: string; status: string; title: string | null; site: Record<string, string>; common_values: Record<string, unknown>;
    project_id: string | null; estimate_id: string | null; range_low_cents: number | null; range_high_cents: number | null; submitted_at: string | null; decline_reason: string | null };
  client: { first_name: string; last_name: string; email: string; language_preference: string; status: string };
  common_summary: { field: string; label: { en: string; es: string }; value: { en: string; es: string } }[];
  proposal: { estimate_id: string; total_cents: number; generated_at: string; response: 'accepted' | 'changes_requested' | null; note: string | null } | null;
  scopes: Scope[];
}

const STATUS_TONE: Record<string, string> = { draft: 'draft', submitted: 'submitted', reviewed: 'in_progress', converted: 'completed', declined: 'declined' };
const PROV_TONE: Record<string, string> = {
  client: 'bg-surface-alt text-muted', ai_confirmed: 'bg-status-info-bg text-status-info',
  photo_estimate: 'bg-status-warning-bg text-status-warning', contractor: 'bg-status-success-bg text-status-success',
};

export default function ClientRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation('studio');
  const lang = i18n.language === 'es' ? 'es' : 'en';
  const toast = useToast();
  const [data, setData] = useState<Bundle | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [role, setRole] = useState('');
  useEffect(() => { fetch('/api/auth/me').then((r) => r.json()).then((d) => setRole(String(d.role ?? '').toLowerCase())).catch(() => undefined); }, []);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/studio/requests/${id}`);
    if (!res.ok) { setError(await apiError(res, t('start.error'))); return; }
    setData(await res.json());
  }, [id, t]);
  useEffect(() => { load(); }, [load]);

  async function act(key: string, url: string, init: RequestInit, done: string) {
    setBusy(key);
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
    setBusy('');
    if (!res.ok) { toast.error(await apiError(res, t('start.error'))); return null; }
    toast.success(done);
    await load();
    return res.json().catch(() => ({}));
  }

  const verify = (s: Scope, on: boolean) => act(`verify-${s.id}`, `/api/v1/studio/requests/${id}/scopes/${s.id}`,
    { method: 'PATCH', body: JSON.stringify({ version: s.version, measurements_verified: on }) }, t('settings.saved'));

  if (error) return <div className="rounded-lg border border-status-danger/40 bg-status-danger-bg p-6 text-sm text-status-danger">{error}</div>;
  if (!data) return <p className="text-sm text-muted">{t('client.loading')}</p>;
  const { request: r, client } = data;
  const closed = r.status === 'declined' || r.status === 'converted';

  return (
    <div className="space-y-6">
      <Link href="/client-requests" className="text-sm text-brand-700 hover:underline">← {t('contractor.detail_back')}</Link>
      <PageHeader
        title={`${client.first_name} ${client.last_name}`}
        subtitle={<>{r.title ?? client.email} · <Badge status={STATUS_TONE[r.status] ?? 'draft'}>{t(`status.${r.status}`)}</Badge></>}
        actions={(
          <>
            {r.status === 'draft' && (
              <Button variant="secondary" loading={busy === 'resend'} onClick={() => act('resend', `/api/v1/studio/requests/${id}/resend-invite`, { method: 'POST', body: '{}' }, t('contractor.resent'))}>
                {t('contractor.resend')}
              </Button>
            )}
            {r.estimate_id
              ? <Link href={r.project_id ? `/projects/${r.project_id}/estimates/${r.estimate_id}` : `/estimates/${r.estimate_id}`} className="text-sm font-medium text-brand-700 hover:underline">{t('contractor.open_estimate')}</Link>
              : (r.status === 'submitted' || r.status === 'reviewed') && (
                <Button loading={busy === 'estimate'} onClick={() => act('estimate', `/api/v1/studio/requests/${id}/estimate`, { method: 'POST', body: '{}' }, t('contractor.estimate_created'))}>
                  {t('contractor.create_estimate')}
                </Button>
              )}
            {!closed && <Button variant="ghost" onClick={() => setDeclineOpen(true)}>{t('contractor.decline')}</Button>}
          </>
        )}
      />
      {r.status === 'draft' && <p className="rounded-md bg-status-info-bg p-3 text-sm text-status-info">{t('contractor.not_submitted')}</p>}

      {r.estimate_id && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">{t('contractor_p4.proposal_status')}</p>
              <p className="text-sm text-muted">
                {!data.proposal ? '—'
                  : data.proposal.response === 'accepted' ? t('contractor_p4.proposal_accepted')
                  : data.proposal.response === 'changes_requested' ? t('contractor_p4.proposal_changes')
                  : t('contractor_p4.proposal_awaiting')}
                {data.proposal && ` · ${money(data.proposal.total_cents, lang)}`}
              </p>
              {data.proposal?.note && <p className="mt-1 rounded-md bg-status-info-bg p-2 text-sm text-status-info">“{data.proposal.note}”</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!closed && (
                <Button variant={data.proposal ? 'secondary' : 'primary'} loading={busy === 'proposal'} onClick={() => act('proposal', `/api/v1/estimates/${r.estimate_id}/proposal`,
                  { method: 'POST', body: JSON.stringify({ send: true, recipient_email: client.email, recipient_name: `${client.first_name} ${client.last_name}` }) }, t('contractor_p4.proposal_sent'))}>
                  {data.proposal ? t('contractor_p4.resend_proposal') : t('contractor_p4.send_proposal')}
                </Button>
              )}
              {r.status === 'converted' && r.project_id
                ? <Link href={`/projects/${r.project_id}`} className="text-sm font-medium text-brand-700 hover:underline">{t('contractor_p4.open_project')}</Link>
                : !closed && ['owner', 'project_manager'].includes(role) && (
                  <Button loading={busy === 'convert'} title={t('contractor_p4.convert_hint')} onClick={() => act('convert', `/api/v1/studio/requests/${id}/convert`, { method: 'POST', body: '{}' }, t('contractor_p4.converted'))}>
                    {t('contractor_p4.convert')}
                  </Button>
                )}
            </div>
          </div>
        </Card>
      )}
      {r.decline_reason && <p className="text-sm text-muted">{r.decline_reason}</p>}

      {data.scopes.map((s) => (
        <div key={s.id} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-6">
            <Card>
              <CardHeader title={t('contractor.client_answers')} />
              <dl className="mt-3 divide-y divide-line">
                {s.summary.map((line) => (
                  <div key={line.field} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <dt className="text-muted">{bi(line.label, lang)}</dt>
                    <dd className="flex items-center gap-2 font-medium text-ink">
                      {bi(line.value, lang)}
                      {s.provenance[line.field] && !['client', 'default'].includes(s.provenance[line.field]!) && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-normal ${PROV_TONE[s.provenance[line.field]!] ?? ''}`}>
                          {t(`contractor.provenance_${s.provenance[line.field]}`)}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>

            {(s.photos.length > 0 || s.renders.length > 0) && (
              <Card>
                <CardHeader title={t('contractor.renders')} />
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {s.photos.map((p) => p.url && <img key={p.id} src={p.url} alt="" className="aspect-square rounded-md object-cover" />)}
                  {s.renders.filter((x) => x.url).map((x) => (
                    <img key={x.id} src={x.url!} alt="" className={`aspect-square rounded-md object-cover ${s.selected_render_id === x.id ? 'ring-2 ring-brand-600' : ''}`} />
                  ))}
                </div>
                {s.render_prompts.filter((p) => p.prompt).slice(-1).map((p) => (
                  <p key={p.id} className="mt-3 text-xs text-muted"><span className="font-medium">{t('contractor.prompt')}:</span> {p.prompt}</p>
                ))}
              </Card>
            )}

            <Card>
              <CardHeader title={t('contractor.pricing')} />
              <div className="mt-3 overflow-x-auto">
                <Table>
                  <THead><TR><TH>{t('contractor.line')}</TH><TH className="text-right">{t('contractor.qty')}</TH><TH className="text-right">{t('contractor.amount')}</TH></TR></THead>
                  <TBody>
                    {s.pricing.lines.map((l, i) => (
                      <TR key={i}>
                        <TD>
                          <div className="font-medium text-ink">{l.description}</div>
                          {l.assumptions.length > 0 && <div className="text-xs text-muted">{l.assumptions.join(' ')}</div>}
                        </TD>
                        <TD className="text-right">{l.quantity} {l.unit}</TD>
                        <TD className="text-right">{money(l.extended_cents, lang)}</TD>
                      </TR>
                    ))}
                    <TR><TD className="font-semibold">{t('contractor.total')}</TD><TD /><TD className="text-right font-semibold">{money(s.pricing.totals.total_cents, lang)}</TD></TR>
                  </TBody>
                </Table>
              </div>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{t('contractor.client_range')}</p>
              <p className="mt-1 text-xl font-semibold text-ink">{money(s.pricing.range.low_cents, lang)} – {money(s.pricing.range.high_cents, lang)}</p>
              {s.pricing.range.unverified && <p className="mt-1 text-xs text-status-warning">{t('contractor.unverified')}</p>}
              <label className="mt-4 flex items-start gap-2 text-sm text-ink">
                <input type="checkbox" className="mt-0.5" checked={s.measurements_verified} disabled={closed || busy === `verify-${s.id}`}
                  onChange={(e) => verify(s, e.target.checked)} />
                <span>{t('contractor.verify')}<span className="block text-xs text-muted">{t('contractor.verify_hint')}</span></span>
              </label>
            </Card>
            <Card>
              <CardHeader title={t('contractor.common')} />
              <dl className="mt-2 space-y-1 text-sm">
                {data.common_summary.map((line) => (
                  <div key={line.field} className="flex justify-between gap-3"><dt className="text-muted">{bi(line.label, lang)}</dt><dd className="text-right text-ink">{bi(line.value, lang)}</dd></div>
                ))}
                {Object.values(r.site ?? {}).some(Boolean) && (
                  <div className="flex justify-between gap-2"><dt className="text-muted">{t('contractor.site')}</dt><dd className="text-right text-ink">{[r.site.address, r.site.city, r.site.state, r.site.zip].filter(Boolean).join(', ')}</dd></div>
                )}
              </dl>
            </Card>
            <RequirementsList items={s.requirements} />
          </aside>
        </div>
      ))}

      <Modal open={declineOpen} onClose={() => setDeclineOpen(false)} title={t('contractor.decline')}>
        <div className="space-y-4">
          <Textarea label={t('contractor.decline_reason')} value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeclineOpen(false)}>{t('wizard.back')}</Button>
            <Button variant="danger" loading={busy === 'decline'} onClick={async () => {
              await act('decline', `/api/v1/studio/requests/${id}/decline`, { method: 'POST', body: JSON.stringify(reason ? { reason } : {}) }, t('contractor.declined'));
              setDeclineOpen(false);
            }}>{t('contractor.decline')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
