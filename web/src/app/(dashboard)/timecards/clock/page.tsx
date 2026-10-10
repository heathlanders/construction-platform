'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  PageHeader, Button, Select, Card, Table, THead, TBody, TR, TH, TD, Spinner,
} from '@/components/ui';

interface TimePunch {
  id: string;
  project_id: string | null;
  cost_code_id: string | null;
  clock_in_at: string;
  clock_out_at: string | null;
  hours_worked: number | null;
  auto_clocked_out: boolean;
  notes: string | null;
  version: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface CostCode {
  id: string;
  code: string;
  name: string;
}

interface WeekSummary {
  [dateKey: string]: number; // date string → hours
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatElapsed(clockInIso: string): string {
  const ms = Date.now() - new Date(clockInIso).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekStartISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return d.toISOString().slice(0, 10);
}

export default function ClockPage() {
  const { t } = useTranslation('field');

  const [activePunch, setActivePunch] = useState<TimePunch | null>(null);
  const [todayPunches, setTodayPunches] = useState<TimePunch[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [weekSummary, setWeekSummary] = useState<WeekSummary>({});

  // Clock-in form state
  const [clockInProject, setClockInProject] = useState('');
  const [clockInCostCode, setClockInCostCode] = useState('');
  const [clockInNotes, setClockInNotes] = useState('');

  // Clock-out form state (only project if not set at clock-in)
  const [clockOutProject, setClockOutProject] = useState('');
  const [clockOutCostCode, setClockOutCostCode] = useState('');
  const [clockOutNotes, setClockOutNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState('');

  // Tick elapsed time every 30 seconds
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (activePunch) {
      setElapsed(formatElapsed(activePunch.clock_in_at));
      timerRef.current = setInterval(() => setElapsed(formatElapsed(activePunch.clock_in_at)), 30000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed('');
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activePunch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [punchesRes, projectsRes, costCodesRes, weekRes] = await Promise.all([
        fetch(`/api/time-punches?date_from=${todayISO()}&date_to=${todayISO()}&limit=50`).then((r) => r.json()),
        fetch('/api/projects?status=active&limit=100').then((r) => r.json()),
        fetch('/api/cost-codes?limit=100').then((r) => r.json()),
        fetch(`/api/time-punches?date_from=${weekStartISO()}&date_to=${todayISO()}&limit=100`).then((r) => r.json()),
      ]);

      const punches: TimePunch[] = punchesRes.time_punches ?? [];
      setTodayPunches(punches.filter((p) => p.clock_out_at !== null));
      const open = punches.find((p) => p.clock_out_at === null) ?? null;
      setActivePunch(open);

      setProjects(projectsRes.projects ?? []);
      setCostCodes(costCodesRes.cost_codes ?? []);

      // Build week summary: date → hours
      const allPunches: TimePunch[] = weekRes.time_punches ?? [];
      const summary: WeekSummary = {};
      for (const p of allPunches) {
        if (p.hours_worked == null) continue;
        const day = p.clock_in_at.slice(0, 10);
        summary[day] = (summary[day] ?? 0) + Number(p.hours_worked);
      }
      setWeekSummary(summary);
    } catch { setError('Failed to load data.'); } finally { setLoading(false); }
  };

  useEffect(() => { void loadData(); }, []);

  // OQ-17 additive half: capture browser GPS at clock-in when granted. Silent best-effort —
  // denial/timeout never blocks the punch (resolves null in ≤4s).
  const captureLocation = (): Promise<{ clock_in_lat: number; clock_in_lng: number } | null> =>
    new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
      const timer = setTimeout(() => resolve(null), 4000);
      navigator.geolocation.getCurrentPosition(
        (pos) => { clearTimeout(timer); resolve({ clock_in_lat: pos.coords.latitude, clock_in_lng: pos.coords.longitude }); },
        () => { clearTimeout(timer); resolve(null); },
        { enableHighAccuracy: true, timeout: 3500, maximumAge: 60000 },
      );
    });

  const clockIn = async () => {
    setActing(true); setError('');
    try {
      const loc = await captureLocation();
      const res = await fetch('/api/time-punches/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: clockInProject || undefined,
          cost_code_id: clockInCostCode || undefined,
          notes: clockInNotes || undefined,
          ...(loc ?? {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error?.code === 'PUNCH_ALREADY_OPEN') {
          setActivePunch(data.existing_punch ?? null);
        } else {
          setError(data?.error?.message ?? 'Clock in failed.');
        }
        return;
      }
      setClockInProject(''); setClockInCostCode(''); setClockInNotes('');
      await loadData();
    } catch { setError('Network error.'); } finally { setActing(false); }
  };

  const clockOut = async () => {
    if (!activePunch) return;
    setActing(true); setError('');
    try {
      const res = await fetch('/api/time-punches/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          punch_id: activePunch.id,
          project_id: clockOutProject || undefined,
          cost_code_id: clockOutCostCode || undefined,
          notes: clockOutNotes || undefined,
          version: activePunch.version,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'Clock out failed.');
        return;
      }
      setClockOutProject(''); setClockOutCostCode(''); setClockOutNotes('');
      await loadData();
    } catch { setError('Network error.'); } finally { setActing(false); }
  };

  const switchProject = async () => {
    // Clock out of current punch, then clock in to new project
    if (!activePunch) return;
    setActing(true); setError('');
    try {
      const outRes = await fetch('/api/time-punches/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          punch_id: activePunch.id,
          version: activePunch.version,
        }),
      });
      if (!outRes.ok) {
        const d = await outRes.json();
        setError(d?.error?.message ?? 'Clock out failed.');
        setActing(false);
        return;
      }
      // Now clock in to new project
      const loc = await captureLocation();
      const inRes = await fetch('/api/time-punches/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: clockInProject || undefined,
          ...(loc ?? {}),
        }),
      });
      if (!inRes.ok) {
        const d = await inRes.json();
        setError(d?.error?.message ?? 'Clock in failed.');
      }
      setClockInProject('');
      await loadData();
    } catch { setError('Network error.'); } finally { setActing(false); }
  };

  const weekTotal = Object.values(weekSummary).reduce((a, b) => a + b, 0);
  const todayTotal = todayPunches.reduce((s, p) => s + Number(p.hours_worked ?? 0), 0);

  const activeProjectName = activePunch?.project_id
    ? projects.find((p) => p.id === activePunch.project_id)?.name ?? activePunch.project_id
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={t('time_punches.my_time', { defaultValue: 'My Time' })}
        subtitle={<Link href="/timecards" className="text-brand-600 hover:text-brand-700">← {t('timecards.title')}</Link>}
      />

      {error && (
        <div className="flex items-center justify-between rounded-md border border-status-danger/40 bg-status-danger-bg px-4 py-3 text-sm text-status-danger">
          <span>{error}</span>
          <button className="underline" onClick={() => setError('')}>{t('common.dismiss', { defaultValue: 'Dismiss' })}</button>
        </div>
      )}

      {/* Clock status card */}
      <Card
        padding="lg"
        className={activePunch ? 'border-2 border-status-success bg-status-success-bg' : 'border-2'}
      >
        {activePunch ? (
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-status-success" />
              <span className="text-sm font-semibold uppercase tracking-wide text-status-success">{t('time_punches.clocked_in', { defaultValue: 'Clocked In' })}</span>
            </div>
            {activeProjectName && (
              <p className="mb-0.5 text-base font-medium text-ink">{activeProjectName}</p>
            )}
            <p className="mb-4 text-sm text-muted">
              {t('time_punches.clocked_in_since', { time: formatTime(activePunch.clock_in_at), duration: elapsed })}
            </p>

            {/* Clock-out project override if needed */}
            {!activePunch.project_id && (
              <div className="mb-4">
                <Select
                  label={`${t('time_punches.project_label')} *`}
                  value={clockOutProject}
                  onChange={(e) => setClockOutProject(e.target.value)}
                >
                  <option value="">{t('time_punches.select_project')}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
            )}

            {/* Switch project */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
                {t('time_punches.switch_project')}
              </label>
              <div className="flex gap-2">
                <Select
                  className="flex-1"
                  value={clockInProject}
                  onChange={(e) => setClockInProject(e.target.value)}
                >
                  <option value="">{t('time_punches.select_project')}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
                <Button variant="secondary" onClick={switchProject} disabled={acting || !clockInProject} className="whitespace-nowrap">
                  {t('time_punches.switch_project')}
                </Button>
              </div>
            </div>

            <Button
              variant="danger"
              onClick={clockOut}
              loading={acting}
              disabled={!activePunch.project_id && !clockOutProject}
              className="w-full"
            >
              {t('time_punches.clock_out')}
            </Button>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
              {t('time_punches.not_clocked_in')}
            </p>

            <div className="mb-4 space-y-3">
              <Select
                label={t('time_punches.project_label')}
                value={clockInProject}
                onChange={(e) => setClockInProject(e.target.value)}
              >
                <option value="">{t('time_punches.select_project')}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>

              <Select
                label={t('time_punches.cost_code_label')}
                value={clockInCostCode}
                onChange={(e) => setClockInCostCode(e.target.value)}
              >
                <option value="">{t('time_punches.select_cost_code')}</option>
                {costCodes.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </Select>
            </div>

            <Button onClick={clockIn} loading={acting} className="w-full">
              {t('time_punches.clock_in')}
            </Button>
          </div>
        )}
      </Card>

      {/* Today's punch history */}
      <Card padding="none">
        <div className="border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold text-ink">{t('time_punches.punch_history_today')}</h2>
        </div>
        {todayPunches.length === 0 && !activePunch ? (
          <p className="px-5 py-4 text-sm text-muted">{t('time_punches.no_punches_today')}</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t('time_punches.project_label')}</TH>
                <TH>{t('time_punches.in_at')}</TH>
                <TH>{t('time_punches.out_at')}</TH>
                <TH className="text-right">{t('time_punches.hours_label')}</TH>
              </TR>
            </THead>
            <TBody>
              {activePunch && (
                <TR className="bg-status-success-bg">
                  <TD>{activeProjectName ?? <span className="text-muted">—</span>}</TD>
                  <TD className="text-muted">{formatTime(activePunch.clock_in_at)}</TD>
                  <TD className="font-medium text-status-success">{elapsed}</TD>
                  <TD className="text-right font-medium text-status-success">{t('time_punches.open')}</TD>
                </TR>
              )}
              {todayPunches.map((p) => {
                const proj = projects.find((pr) => pr.id === p.project_id);
                return (
                  <TR key={p.id}>
                    <TD>{proj?.name ?? <span className="text-muted">—</span>}</TD>
                    <TD className="text-muted">{formatTime(p.clock_in_at)}</TD>
                    <TD className="text-muted">{p.clock_out_at ? formatTime(p.clock_out_at) : '—'}</TD>
                    <TD className="text-right tabular-nums">{Number(p.hours_worked ?? 0).toFixed(2)}h</TD>
                  </TR>
                );
              })}
              {(todayPunches.length > 0 || activePunch) && (
                <TR className="bg-surface-alt font-medium">
                  <TD colSpan={3}>{t('time_punches.today_total', { hours: todayTotal.toFixed(2) })}</TD>
                  <TD />
                </TR>
              )}
            </TBody>
          </Table>
        )}
      </Card>

      {/* Week summary */}
      <Card padding="none">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold text-ink">{t('time_punches.week_summary', { defaultValue: 'Week Summary' })}</h2>
          <span className="text-sm font-medium text-ink tabular-nums">
            {t('time_punches.week_total', { hours: weekTotal.toFixed(1) })}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2 px-5 py-4 text-center text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
            const d = new Date();
            d.setDate(d.getDate() - d.getDay() + i);
            const key = d.toISOString().slice(0, 10);
            const hrs = weekSummary[key] ?? 0;
            const isToday = key === todayISO();
            return (
              <div key={day} className={`rounded-md py-2 ${isToday ? 'border border-brand-100 bg-brand-50' : ''}`}>
                <div className="font-medium text-muted">{day}</div>
                <div className={`mt-1 font-semibold tabular-nums ${hrs > 0 ? 'text-ink' : 'text-muted/50'}`}>
                  {hrs > 0 ? `${hrs.toFixed(1)}h` : '—'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-line px-5 py-3">
          <Link href="/timecards/my" className="text-sm text-brand-600 hover:text-brand-700">
            {t('time_punches.view_full_timecard', { defaultValue: 'View full timecard →' })}
          </Link>
        </div>
      </Card>
    </div>
  );
}
