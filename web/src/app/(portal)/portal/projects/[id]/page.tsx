'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Project {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
}

interface Milestone {
  id: string;
  title: string;
  due_date: string | null;
  completed_at: string | null;
}

interface ScheduleTask {
  id: string;
  title: string;
  status: string;
  planned_end: string | null;
  show_in_client_portal: boolean;
}

const TASK_STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-status-neutral-bg text-status-neutral',
  in_progress: 'bg-status-info-bg text-status-info',
  on_hold: 'bg-status-warning-bg text-status-warning',
  complete: 'bg-status-success-bg text-status-success',
};

export default function PortalProjectPage() {
  const { t, i18n } = useTranslation('portal');
  const params = useParams();
  const projectId = params.id as string;

  const [data, setData] = useState<{ project: Project; milestones: Milestone[]; tasks: ScheduleTask[] } | null>(null);
  const [error, setError] = useState('');

  function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00Z').toLocaleDateString(i18n.language, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  useEffect(() => {
    fetch(`/api/portal/projects/${projectId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(setData)
      .catch(() => setError(t('error_project')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const statusLabel = (s: string) => t(`project_status_${s}`, { defaultValue: s.replace(/_/g, ' ') });
  const taskStatusLabel = (s: string) => t(`task_status_${s}`, { defaultValue: s.replace(/_/g, ' ') });

  if (error) {
    return <div className="bg-status-danger-bg border border-status-danger/40 rounded-lg p-6 text-sm text-status-danger">{error}</div>;
  }

  if (!data) {
    return <div className="text-sm text-muted py-8 text-center">{t('loading')}</div>;
  }

  const { project, milestones, tasks } = data;
  const visibleTasks = tasks; // already limited to client-visible tasks by the API
  const completedMilestones = milestones.filter((m) => m.completed_at);
  const milestoneProgress = milestones.length > 0 ? Math.round((completedMilestones.length / milestones.length) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">{project.name}</h1>
        <p className="text-sm text-muted mt-1">
          {[project.address, project.city, project.state].filter(Boolean).join(', ') || t('no_address')}
        </p>
      </div>

      {/* Status + dates */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface rounded-lg border border-line p-4">
          <div className="text-xs text-muted mb-1">{t('status')}</div>
          <div className="text-sm font-semibold text-ink">{statusLabel(project.status)}</div>
        </div>
        <div className="bg-surface rounded-lg border border-line p-4">
          <div className="text-xs text-muted mb-1">{t('start_date')}</div>
          <div className="text-sm font-semibold text-ink">{formatDate(project.start_date)}</div>
        </div>
        <div className="bg-surface rounded-lg border border-line p-4">
          <div className="text-xs text-muted mb-1">{t('est_completion')}</div>
          <div className="text-sm font-semibold text-ink">{formatDate(project.end_date)}</div>
        </div>
      </div>

      {/* Milestone progress */}
      {milestones.length > 0 && (
        <div className="bg-surface rounded-lg border border-line p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink">{t('milestone_progress')}</h2>
            <span className="text-xs text-muted">{t('milestone_count', { done: completedMilestones.length, total: milestones.length })}</span>
          </div>
          <div className="w-full bg-surface-alt rounded-full h-2.5 mb-4">
            <div
              className="bg-brand-600 h-2.5 rounded-full transition-all"
              style={{ width: `${milestoneProgress}%` }}
            />
          </div>
          <div className="space-y-2">
            {milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${m.completed_at ? 'bg-status-success' : 'bg-surface-alt'}`}>
                  {m.completed_at && <span className="text-white">✓</span>}
                </span>
                <span className={`text-sm ${m.completed_at ? 'text-muted line-through' : 'text-ink'}`}>{m.title}</span>
                {m.due_date && !m.completed_at && (
                  <span className="text-xs text-muted ml-auto">{t('due', { date: formatDate(m.due_date) })}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visible tasks */}
      {visibleTasks.length > 0 && (
        <div className="bg-surface rounded-lg border border-line p-5 mb-6">
          <h2 className="text-sm font-semibold text-ink mb-3">{t('schedule')}</h2>
          <div className="space-y-2">
            {visibleTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                <span className="text-sm text-ink">{task.title}</span>
                <div className="flex items-center gap-3">
                  {task.planned_end && (
                    <span className="text-xs text-muted">{formatDate(task.planned_end)}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded ${TASK_STATUS_COLORS[task.status] ?? 'bg-status-neutral-bg text-status-neutral'}`}>
                    {taskStatusLabel(task.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          href={`/portal/projects/${projectId}/invoices`}
          className="text-sm bg-surface border border-line text-muted px-4 py-2 rounded-md hover:border-brand-500/50 hover:text-brand-700 transition-colors"
        >
          {t('view_invoices')} →
        </Link>
      </div>
    </div>
  );
}
