'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { Button, Input, PageHeader, Card, EmptyState, SlideOver } from '@/components/ui';

interface ScheduleTask {
  id: string;
  title: string;
  status: string;
  planned_start: string | null;
  planned_end: string | null;
  percent_complete: number;
  predecessor_task_id: string | null;
  version: number;
}

interface Milestone {
  id: string;
  title: string;
  due_date: string | null;
}

// Gantt bar/status coloring — kept per T5 (intentional status hexes for the bars).
const STATUS_COLORS: Record<string, string> = {
  not_started: '#94a3b8',
  in_progress: '#3b82f6',
  on_hold: '#f59e0b',
  complete: '#22c55e',
};

function toGanttTask(t: ScheduleTask, allTasks: ScheduleTask[]): GanttTask | null {
  if (!t.planned_start || !t.planned_end) return null;
  const start = new Date(t.planned_start + 'T00:00:00Z');
  const end = new Date(t.planned_end + 'T23:59:59Z');
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  if (end < start) return null;

  const dependencies: string[] = [];
  if (t.predecessor_task_id) {
    const pred = allTasks.find((x) => x.id === t.predecessor_task_id);
    if (pred && pred.planned_start && pred.planned_end) {
      dependencies.push(t.predecessor_task_id);
    }
  }

  return {
    id: t.id,
    name: t.title,
    start,
    end,
    progress: t.percent_complete,
    type: 'task',
    styles: {
      progressColor: STATUS_COLORS[t.status] ?? '#3b82f6',
      progressSelectedColor: STATUS_COLORS[t.status] ?? '#3b82f6',
      backgroundColor: `${STATUS_COLORS[t.status] ?? '#3b82f6'}33`,
      backgroundSelectedColor: `${STATUS_COLORS[t.status] ?? '#3b82f6'}55`,
    },
    dependencies,
    isDisabled: false,
    project: undefined,
  };
}

function toGanttMilestone(m: Milestone): GanttTask | null {
  if (!m.due_date) return null;
  const date = new Date(m.due_date + 'T00:00:00Z');
  if (isNaN(date.getTime())) return null;
  return {
    id: `milestone-${m.id}`,
    name: m.title,
    start: date,
    end: date,
    progress: 0,
    type: 'milestone',
    styles: {
      progressColor: '#8b5cf6',
      progressSelectedColor: '#8b5cf6',
      backgroundColor: '#8b5cf6',
      backgroundSelectedColor: '#7c3aed',
    },
    dependencies: [],
    isDisabled: false,
    project: undefined,
  };
}

export default function TimelinePage() {
  const { t } = useTranslation('projects');
  const params = useParams();
  const projectId = params.id as string;

  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/timeline`)
      .then((r) => r.json())
      .then((d) => {
        setTasks(d.tasks ?? []);
        setMilestones(d.milestones ?? []);
      })
      .catch(() => setError(t('timeline.load_failed', { defaultValue: 'Failed to load timeline' })));
  }, [projectId, t]);

  const ganttTasks: GanttTask[] = [
    ...tasks.flatMap((t) => {
      const g = toGanttTask(t, tasks);
      return g ? [g] : [];
    }),
    ...milestones.flatMap((m) => {
      const g = toGanttMilestone(m);
      return g ? [g] : [];
    }),
  ];

  const handleTaskChange = useCallback(async (updated: GanttTask) => {
    if (updated.type === 'milestone') return;
    const task = tasks.find((t) => t.id === updated.id);
    if (!task) return;

    const newStart = updated.start.toISOString().slice(0, 10);
    const newEnd = updated.end.toISOString().slice(0, 10);

    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === task.id
      ? { ...t, planned_start: newStart, planned_end: newEnd }
      : t
    ));

    const res = await fetch(`/api/projects/${projectId}/schedule-tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planned_start: newStart, planned_end: newEnd, version: task.version }),
    });
    if (!res.ok) {
      // Rollback
      setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
      setError(t('timeline.update_failed', { defaultValue: 'Failed to update task dates' }));
    }
  }, [tasks, projectId, t]);

  const handleTaskClick = useCallback((ganttTask: GanttTask) => {
    if (ganttTask.type === 'milestone') return;
    const task = tasks.find((t) => t.id === ganttTask.id);
    if (task) setEditingTask(task);
  }, [tasks]);

  const tasksWithoutDates = tasks.filter((t) => !t.planned_start || !t.planned_end);

  return (
    <div>
      <PageHeader
        className="mb-6"
        title={t('timeline.title', { defaultValue: 'Timeline' })}
        subtitle={
          <span className="flex items-center gap-2 text-sm text-muted">
            <Link href={`/projects/${projectId}`} className="hover:text-ink">Project</Link>
            <span>›</span>
            <span>{t('timeline.title', { defaultValue: 'Timeline' })}</span>
          </span>
        }
        actions={
          <>
            {([ViewMode.Day, ViewMode.Week, ViewMode.Month] as ViewMode[]).map((vm) => (
              <button
                key={vm}
                onClick={() => setViewMode(vm)}
                className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
                  viewMode === vm
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'bg-surface border-line text-muted hover:bg-surface-alt'
                }`}
              >
                {vm}
              </button>
            ))}
            <Link
              href={`/projects/${projectId}/board`}
              className="text-sm text-muted hover:text-ink ml-2"
            >
              {t('board.title', { defaultValue: 'Board' })} →
            </Link>
          </>
        }
      />

      {error && (
        <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 mb-4 text-sm text-status-danger">{error}</div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
            {status.replace('_', ' ')}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#8b5cf6' }} />
          {t('timeline.milestone', { defaultValue: 'milestone' })}
        </span>
      </div>

      {ganttTasks.length > 0 ? (
        <Card padding="none" className="overflow-hidden">
          <Gantt
            tasks={ganttTasks}
            viewMode={viewMode}
            onDateChange={handleTaskChange}
            onClick={handleTaskClick}
            listCellWidth="200px"
            columnWidth={viewMode === ViewMode.Day ? 40 : viewMode === ViewMode.Week ? 100 : 160}
            ganttHeight={Math.min(ganttTasks.length * 50 + 60, 600)}
            todayColor="rgba(59,130,246,0.1)"
          />
        </Card>
      ) : (
        <EmptyState
          title={tasks.length === 0
            ? t('timeline.empty', { defaultValue: 'No tasks yet. Add tasks with start and end dates to see the timeline.' })
            : t('timeline.no_dates', { defaultValue: 'No tasks have start/end dates. Edit tasks to add dates.' })}
        />
      )}

      {/* Tasks without dates */}
      {tasksWithoutDates.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted mb-2">
            {tasksWithoutDates.length} {t('timeline.unscheduled', { defaultValue: 'tasks without dates (not shown above)' })}:
          </p>
          <div className="flex flex-wrap gap-2">
            {tasksWithoutDates.map((t) => (
              <span key={t.id} className="text-xs bg-surface-alt text-muted px-2 py-1 rounded">
                {t.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Edit panel */}
      {editingTask && (
        <SlideOver
          open
          onClose={() => setEditingTask(null)}
          width="max-w-md"
          title={t('timeline.edit_task', { defaultValue: 'Edit Task' })}
        >
          <p className="text-sm text-ink font-medium mb-4">{editingTask.title}</p>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const planned_start = fd.get('planned_start') as string;
              const planned_end = fd.get('planned_end') as string;
              const res = await fetch(`/api/projects/${projectId}/schedule-tasks/${editingTask.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planned_start, planned_end, version: editingTask.version }),
              });
              if (res.ok) {
                const data = await res.json();
                setTasks((prev) => prev.map((t) => t.id === editingTask.id ? { ...t, ...data.schedule_task } : t));
                setEditingTask(null);
              } else {
                setError(t('timeline.save_failed', { defaultValue: 'Failed to save' }));
              }
            }}
          >
            <Input
              label={t('timeline.start_date', { defaultValue: 'Start Date' })}
              type="date"
              name="planned_start"
              defaultValue={editingTask.planned_start ?? ''}
            />
            <Input
              label={t('timeline.end_date', { defaultValue: 'End Date' })}
              type="date"
              name="planned_end"
              defaultValue={editingTask.planned_end ?? ''}
            />
            <Button type="submit" className="w-full">
              {t('timeline.save_dates', { defaultValue: 'Save Dates' })}
            </Button>
          </form>
        </SlideOver>
      )}
    </div>
  );
}
