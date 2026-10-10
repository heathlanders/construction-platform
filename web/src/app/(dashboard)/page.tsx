'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Card, CardHeader, PageHeader, Button, KpiTile, StatusPill, ProgressBar, EmptyState, SkeletonRows, Skeleton } from '@/components/ui';
import { BarChart } from '@/components/charts';

interface KPIs {
  active_projects: number;
  open_punch_items: number;
  pending_timecards: number;
  overdue_tasks: number;
}

interface RecentProject {
  id: string;
  name: string;
  status: string;
  updated_at: string;
  budget_cents: number;
  actual_cents: number;
  crew_count: number;
  budget_pct_used: number;
}

interface ActivityItem {
  id: string;
  action: string;
  category: string;
  actor_email: string;
  resource_type: string;
  created_at: string;
}

interface DashboardSummary {
  kpis: KPIs;
  recent_projects: RecentProject[];
  activity: ActivityItem[];
}

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function shortName(name: string) {
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
}

export default function DashboardHome() {
  const { t } = useTranslation('common');
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d: DashboardSummary) => setData(d))
      .catch(() => setError(t('common.failed_to_load')));
  }, [t]);

  const header = (
    <PageHeader
      title={t('dashboard.title')}
      actions={
        <Link href="/projects/new">
          <Button>+ {t('dashboard.new_project')}</Button>
        </Link>
      }
    />
  );

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <Card className="border-status-danger/40 bg-status-danger-bg">
          <p className="text-sm text-status-danger">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        {header}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <SkeletonRows rows={4} />
      </div>
    );
  }

  const { kpis, recent_projects, activity } = data;
  const chartData = recent_projects
    .filter((p) => p.budget_cents > 0)
    .slice(0, 6)
    .map((p) => ({ label: shortName(p.name), value: p.budget_pct_used }));

  return (
    <div className="space-y-6">
      {header}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/projects"><KpiTile label={t('dashboard.active_projects')} value={kpis.active_projects} className="h-full transition-colors hover:border-brand-500" /></Link>
        <Link href="/projects"><KpiTile label={t('dashboard.open_punch_items')} value={kpis.open_punch_items} delta={kpis.open_punch_items > 0 ? t('dashboard.open') : undefined} deltaTone="flat" className="h-full transition-colors hover:border-brand-500" /></Link>
        <Link href="/timecards"><KpiTile label={t('dashboard.pending_timecards')} value={kpis.pending_timecards} delta={kpis.pending_timecards > 0 ? t('dashboard.open') : undefined} deltaTone="flat" className="h-full transition-colors hover:border-brand-500" /></Link>
        <Link href="/projects"><KpiTile label={t('dashboard.overdue_tasks')} value={kpis.overdue_tasks} delta={kpis.overdue_tasks > 0 ? t('dashboard.overdue_tasks') : undefined} deltaTone={kpis.overdue_tasks > 0 ? 'down' : 'up'} className="h-full transition-colors hover:border-brand-500" /></Link>
      </div>

      {/* Budget chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader title={t('dashboard.budget_used_by_project')} subtitle={t('dashboard.percent_of_budget')} />
          <div className="mt-3">
            <BarChart data={chartData} ariaLabel={t('dashboard.budget_used_by_project')} />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active projects */}
        <Card padding="none" className="lg:col-span-2">
          <CardHeader
            title={t('dashboard.active_projects_section')}
            action={<Link href="/projects" className="text-xs font-medium text-brand-600 hover:underline">{t('dashboard.view_all')}</Link>}
            className="px-5 py-4"
          />
          {recent_projects.length === 0 ? (
            <div className="px-5 pb-6">
              <EmptyState title={t('dashboard.no_active_projects')} />
            </div>
          ) : (
            <div className="divide-y divide-line border-t border-line">
              {recent_projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-alt/60">
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{p.name}</span>
                    <div className="mt-1 flex items-center gap-3">
                      <StatusPill status={p.status} />
                      <span className="text-xs text-muted">{p.crew_count} {t('dashboard.crew')}</span>
                      <span className="text-xs text-muted">{timeAgo(p.updated_at)}</span>
                    </div>
                    {p.budget_cents > 0 && (
                      <div className="mt-2 max-w-xs">
                        <div className="flex justify-between text-xs text-muted">
                          <span className="tabular-nums">{formatCents(p.actual_cents)} / {formatCents(p.budget_cents)}</span>
                          <span className="tabular-nums">{p.budget_pct_used}%</span>
                        </div>
                        <ProgressBar value={p.budget_pct_used} status={p.budget_pct_used >= 100 ? 'overdue' : p.budget_pct_used >= 80 ? 'pending' : 'active'} className="mt-1" />
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted">{t('dashboard.open')} →</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Activity feed */}
        <Card padding="none">
          <CardHeader title={t('dashboard.recent_activity')} className="px-5 py-4" />
          {activity.length === 0 ? (
            <div className="px-5 pb-6"><EmptyState title={t('dashboard.no_activity')} /></div>
          ) : (
            <div className="max-h-96 divide-y divide-line overflow-y-auto border-t border-line">
              {activity.map((item) => (
                <div key={item.id} className="px-5 py-3">
                  <p className="truncate text-xs font-medium text-ink">{item.action}</p>
                  <p className="truncate text-xs text-muted">{item.actor_email}</p>
                  <p className="mt-0.5 text-xs text-muted">{timeAgo(item.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        {[
          { href: '/timecards', label: t('dashboard.review_timecards') },
          { href: '/people', label: t('dashboard.manage_people') },
          { href: '/reports/profitability', label: t('dashboard.profitability_report') },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="inline-flex items-center rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:bg-surface-alt">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
