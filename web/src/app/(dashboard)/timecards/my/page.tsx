'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  PageHeader, Button, Card, Table, THead, TBody, TR, TH, TD, StatusPill, EmptyState,
} from '@/components/ui';

interface TimeEntry {
  id: string;
  date: string;
  hours_worked: number;
  notes: string | null;
  project_name?: string;
}

interface Timecard {
  id: string;
  week_start: string;
  status: string;
  total_hours: number;
  overtime_hours: number;
  submitted_at: string | null;
  rejection_note: string | null;
  version: number;
}

function getMondayOfCurrentWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function MyTimecardsPage() {
  const { t } = useTranslation('field');
  const weekStart = getMondayOfCurrentWeek();
  const [trackingMode, setTrackingMode] = useState<'manual' | 'clock_in_out'>('manual');
  const weekEnd = new Date(weekStart + 'T00:00:00Z');
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const [timecard, setTimecard] = useState<Timecard | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/settings/org')
      .then((r) => r.json())
      .then((d) => setTrackingMode(d.settings?.time_tracking_mode ?? 'manual'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Fetch current week timecard
    fetch(`/api/timecards?week=${encodeURIComponent(weekStart.slice(0, 7) + '-W' + getISOWeek(weekStart))}`)
      .then((r) => r.json())
      .then((d) => setTimecard(d.timecards?.[0] ?? null))
      .catch(() => {});

    // Fetch this week's time entries
    fetch(`/api/time-entries?start=${weekStart}&end=${weekEndStr}&limit=50`)
      .then((r) => r.json())
      .then((d) => setEntries(d.time_entries ?? []))
      .catch(() => {});
  }, [weekStart, weekEndStr]);

  function getISOWeek(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00Z');
    const jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getUTCDay() + 1) / 7);
    return String(weekNum).padStart(2, '0');
  }

  const openOrCreateTimecard = async () => {
    setBusy(true);
    setError('');
    const res = await fetch('/api/timecards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start: weekStart }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setTimecard(data.timecard);
    else setError(data.error?.message ?? 'Error creating timecard');
  };

  const submitTimecard = async () => {
    if (!timecard) return;
    setBusy(true);
    setError('');
    const res = await fetch(`/api/timecards/${timecard.id}?action=submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setTimecard(data.timecard);
    else setError(data.error?.message ?? 'Error submitting timecard');
  };

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours_worked), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('timecards.my_timecards')}
        subtitle={t('timecards.week_of', { date: formatDate(weekStart) })}
        actions={
          <Link href="/timecards" className="text-sm text-brand-600 hover:text-brand-700">
            {t('timecards.review_title')} →
          </Link>
        }
      />

      {error && (
        <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>
      )}

      {/* Clock-in/out mode banner */}
      {trackingMode === 'clock_in_out' && (
        <div className="flex items-center justify-between rounded-md border border-status-info/40 bg-status-info-bg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-status-info">{t('time_punches.clock_mode_enabled', { defaultValue: 'Clock In / Clock Out is enabled' })}</p>
            <p className="mt-0.5 text-xs text-status-info/80">{t('time_punches.clock_mode_hint', { defaultValue: 'Use the clock page to record your time. Hours appear here automatically.' })}</p>
          </div>
          <Button className="whitespace-nowrap" onClick={() => { window.location.href = '/timecards/clock'; }}>
            {t('time_punches.go_to_clock', { defaultValue: 'Go to Clock →' })}
          </Button>
        </div>
      )}

      {/* Timecard status card */}
      <Card padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 text-sm text-muted">{t('timecards.status')}</div>
            {timecard ? (
              <div className="flex items-center gap-3">
                <StatusPill status={timecard.status} label={t(`timecards.status_values.${timecard.status}`)} />
                <span className="text-sm text-ink tabular-nums">
                  {Number(timecard.total_hours).toFixed(1)}h {t('timecards.total_hours').toLowerCase()}
                </span>
                {Number(timecard.overtime_hours) > 0 && (
                  <span className="text-sm font-medium text-status-warning">
                    {t('timecards.ot_notice', { hours: Number(timecard.overtime_hours).toFixed(1) })}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted">{t('timecards.no_timecards')}</span>
            )}
          </div>

          <div className="flex gap-2">
            {!timecard && (
              <Button onClick={openOrCreateTimecard} loading={busy}>
                {t('timecards.open_timecard')}
              </Button>
            )}
            {timecard?.status === 'draft' && (
              <Button onClick={submitTimecard} loading={busy} disabled={totalHours === 0}>
                {t('timecards.submit')}
              </Button>
            )}
          </div>
        </div>

        {timecard?.rejection_note && (
          <div className="mt-3 rounded border border-status-danger/40 bg-status-danger-bg p-3">
            <p className="text-sm font-medium text-status-danger">{t('timecards.rejection_note')}:</p>
            <p className="mt-0.5 text-sm text-status-danger">{timecard.rejection_note}</p>
          </div>
        )}
      </Card>

      {/* Time entries this week */}
      <Card padding="none">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-medium text-ink">{t('timecards.time_entries_this_week')}</h2>
          <Link href="/time-entries/new" className="text-xs text-brand-600 hover:text-brand-700">
            + {t('timecards.go_log_time')}
          </Link>
        </div>
        {entries.length === 0 ? (
          <EmptyState title={t('timecards.no_entries_this_week')} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t('time_entries.date', { defaultValue: 'Date' })}</TH>
                <TH>{t('time_entries.hours', { defaultValue: 'Hours' })}</TH>
                <TH>{t('time_entries.notes', { defaultValue: 'Notes' })}</TH>
              </TR>
            </THead>
            <TBody>
              {entries.map((e) => (
                <TR key={e.id}>
                  <TD className="text-muted">{formatDate(e.date)}</TD>
                  <TD className="font-medium tabular-nums">{Number(e.hours_worked).toFixed(1)}h</TD>
                  <TD className="max-w-xs truncate text-muted">{e.notes ?? '—'}</TD>
                </TR>
              ))}
              <TR className="bg-surface-alt font-medium">
                <TD>{t('common.total', { defaultValue: 'Total' })}</TD>
                <TD className="tabular-nums">{totalHours.toFixed(1)}h</TD>
                <TD />
              </TR>
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
