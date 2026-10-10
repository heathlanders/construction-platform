'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { PageHeader, Button, Input, Card, Table, THead, TBody, TR, TH, TD, StatusPill, EmptyState, SkeletonRows } from '@/components/ui';

interface Timecard {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  week_start: string;
  status: string;
  total_hours: number;
  overtime_hours: number;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_note: string | null;
  version: number;
}

function formatWeek(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export default function ReviewClient() {
  const { t } = useTranslation('field');
  const [timecards, setTimecards] = useState<Timecard[] | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    fetch('/api/timecards?status=submitted&limit=50')
      .then((r) => r.json())
      .then((d) => setTimecards(d.timecards ?? []))
      .catch(() => { setError(t('timecards.no_timecards')); setTimecards([]); });
  };

  useEffect(load, [t]);

  const approve = async (tc: Timecard) => {
    setBusy(tc.id);
    const res = await fetch(`/api/timecards/${tc.id}?action=approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: tc.version }),
    });
    setBusy('');
    if (res.ok) load();
    else setError((await res.json()).error?.message ?? 'Error');
  };

  const reject = async (tc: Timecard) => {
    if (!rejectNote.trim()) return;
    setBusy(tc.id);
    const res = await fetch(`/api/timecards/${tc.id}?action=reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: tc.version, rejection_note: rejectNote }),
    });
    setBusy('');
    if (res.ok) { setRejectingId(null); setRejectNote(''); load(); }
    else setError((await res.json()).error?.message ?? 'Error');
  };

  const tabCls = (active: boolean) =>
    `-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${active ? 'border-brand-600 text-ink' : 'border-transparent text-muted hover:text-ink'}`;

  const list = timecards ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t('timecards.title')} />

      <div className="flex gap-1 border-b border-line">
        <span className={tabCls(true)}>{t('timecards.review_title')}</span>
        <Link href="/timecards/board" className={tabCls(false)}>{t('board.title')}</Link>
        <Link href="/timecards/clock" className={tabCls(false)}>{t('timecards.my_timecards')}</Link>
      </div>

      {error && (
        <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>
      )}

      {timecards === null ? (
        <SkeletonRows rows={4} />
      ) : list.length === 0 ? (
        <EmptyState title={t('timecards.no_pending')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('timecards.submitted_by')}</TH>
                <TH>{t('timecards.week_of', { date: '' }).replace(' ', '')}</TH>
                <TH>{t('timecards.total_hours')}</TH>
                <TH>{t('timecards.overtime_hours')}</TH>
                <TH>{t('timecards.status')}</TH>
                <TH className="text-right"> </TH>
              </TR>
            </THead>
            <TBody>
              {list.map((tc) => (
                <>
                  <TR key={tc.id}>
                    <TD>
                      <div className="font-medium">{tc.first_name} {tc.last_name}</div>
                      <div className="text-xs text-muted">{tc.email}</div>
                    </TD>
                    <TD className="text-muted">{formatWeek(tc.week_start)}</TD>
                    <TD className="font-medium tabular-nums">{Number(tc.total_hours).toFixed(1)}h</TD>
                    <TD>
                      {Number(tc.overtime_hours) > 0 ? (
                        <span className="font-medium text-status-warning tabular-nums">{Number(tc.overtime_hours).toFixed(1)}h OT</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TD>
                    <TD><StatusPill status={tc.status} label={t(`timecards.status_values.${tc.status}`)} /></TD>
                    <TD className="text-right">
                      {tc.status === 'submitted' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" onClick={() => approve(tc)} loading={busy === tc.id}>{t('timecards.approve')}</Button>
                          <Button size="sm" variant="secondary" onClick={() => { setRejectingId(tc.id); setRejectNote(''); }} className="text-status-danger">{t('timecards.reject')}</Button>
                        </div>
                      )}
                    </TD>
                  </TR>
                  {rejectingId === tc.id && (
                    <TR key={`${tc.id}-reject`}>
                      <TD colSpan={6} className="bg-status-danger-bg">
                        <label className="mb-1 block text-xs font-medium text-status-danger">{t('timecards.reject_note_label')}</label>
                        <div className="flex gap-2">
                          <Input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder={t('timecards.reject_note_placeholder')} className="flex-1" />
                          <Button size="sm" variant="danger" onClick={() => reject(tc)} loading={busy === tc.id} disabled={!rejectNote.trim()}>{t('timecards.reject')}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
                        </div>
                      </TD>
                    </TR>
                  )}
                </>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
