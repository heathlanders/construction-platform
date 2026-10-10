'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Button,
  Input,
  Textarea,
  Select,
  PageHeader,
  SlideOver,
} from '@/components/ui';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  percent_complete: number;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  assigned_to_user_id: string | null;
  predecessor_task_id: string | null;
  show_in_client_portal: boolean;
  version: number;
}

const COLUMNS = [
  { id: 'not_started', label: 'Not Started' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'on_hold', label: 'On Hold' },
  { id: 'complete', label: 'Complete' },
] as const;

// Board lane accent stripes — the board's intentional status coloring (kept per T5:
// routing through the canonical map would collapse in_progress/on_hold into one hue).
const COL_COLORS: Record<string, string> = {
  not_started: 'border-t-gray-400',
  in_progress: 'border-t-blue-500',
  on_hold: 'border-t-yellow-500',
  complete: 'border-t-green-500',
};

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  complete: 'Complete',
};

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d + 'T00:00:00Z') < new Date();
}

function TaskCard({ task, isDragging, onSelect }: { task: Task; isDragging?: boolean; onSelect?: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overdue = task.status !== 'complete' && isOverdue(task.planned_end);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-surface border border-line rounded-md shadow-sm cursor-grab active:cursor-grabbing select-none"
    >
      <div
        onClick={(e) => { e.stopPropagation(); onSelect?.(task); }}
        className="px-3 py-2.5 cursor-pointer"
      >
        <p className="text-sm font-medium text-ink leading-tight">{task.title}</p>
        <div className="flex items-center justify-between mt-1.5">
          {task.percent_complete > 0 && (
            <span className="text-xs text-muted">{task.percent_complete}%</span>
          )}
          {task.planned_end && (
            <span className={`text-xs ${overdue ? 'text-status-danger font-medium' : 'text-muted'}`}>
              {overdue ? '⚠ ' : ''}{formatDate(task.planned_end)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ id, children, className }: { id: string; children: React.ReactNode; className: string }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} id={id} className={className}>
      {children}
    </div>
  );
}

function TaskDetailPanel({
  task,
  projectId,
  onClose,
  onSaved,
}: {
  task: Task;
  projectId: string;
  onClose: () => void;
  onSaved: (updated: Task) => void;
}) {
  const { t } = useTranslation('projects');
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    percent_complete: task.percent_complete,
    planned_start: task.planned_start ?? '',
    planned_end: task.planned_end ?? '',
    actual_start: task.actual_start ?? '',
    actual_end: task.actual_end ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/schedule-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          status: form.status,
          percent_complete: Number(form.percent_complete),
          planned_start: form.planned_start || null,
          planned_end: form.planned_end || null,
          actual_start: form.actual_start || null,
          actual_end: form.actual_end || null,
          version: task.version,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setError(t('board.conflict', { defaultValue: 'This task was updated by someone else. Reload the board to get the latest version.' }));
        return;
      }
      if (!res.ok) {
        setError(data?.error?.message ?? t('board.save_failed', { defaultValue: 'Failed to save' }));
        return;
      }
      onSaved(data.schedule_task);
      onClose();
    } catch {
      setError(t('board.network_error', { defaultValue: 'Network error — changes not saved' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      title={t('board.task_details', { defaultValue: 'Task Details' })}
      width="max-w-md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('board.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button size="sm" loading={saving} disabled={!form.title.trim()} onClick={handleSave}>
            {t('board.save', { defaultValue: 'Save' })}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>
        )}

        <Input
          label={t('board.title_field', { defaultValue: 'Title' })}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />

        <Textarea
          label={t('board.description', { defaultValue: 'Description' })}
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t('board.no_description', { defaultValue: 'No description' })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t('board.status', { defaultValue: 'Status' })}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
          <Input
            label={t('board.percent_complete', { defaultValue: '% Complete' })}
            type="number"
            min={0}
            max={100}
            value={form.percent_complete}
            onChange={(e) => set('percent_complete', e.target.value)}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-2">{t('board.planned_dates', { defaultValue: 'Planned Dates' })}</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('board.start', { defaultValue: 'Start' })}
              type="date"
              value={form.planned_start}
              onChange={(e) => set('planned_start', e.target.value)}
            />
            <Input
              label={t('board.end', { defaultValue: 'End' })}
              type="date"
              value={form.planned_end}
              onChange={(e) => set('planned_end', e.target.value)}
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-2">{t('board.actual_dates', { defaultValue: 'Actual Dates' })}</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('board.start', { defaultValue: 'Start' })}
              type="date"
              value={form.actual_start}
              onChange={(e) => set('actual_start', e.target.value)}
            />
            <Input
              label={t('board.end', { defaultValue: 'End' })}
              type="date"
              value={form.actual_end}
              onChange={(e) => set('actual_end', e.target.value)}
            />
          </div>
        </div>

        <div className="text-xs text-muted space-y-0.5 pt-2 border-t border-line">
          <p>ID: {task.id}</p>
          {task.assigned_to_user_id && <p>{t('board.assigned_to', { defaultValue: 'Assigned to' })}: {task.assigned_to_user_id}</p>}
        </div>
      </div>
    </SlideOver>
  );
}

export default function BoardPage() {
  const { t } = useTranslation('projects');
  const params = useParams();
  const projectId = params.id as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [swimLane, setSwimLane] = useState(false);
  const [error, setError] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    fetch(`/api/projects/${projectId}/board`)
      .then((r) => r.json())
      .then((d) => setTasks(d.schedule_tasks ?? []))
      .catch(() => setError(t('board.load_failed', { defaultValue: 'Failed to load board' })));
  }, [projectId, t]);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTask(tasks.find((t) => t.id === e.active.id) ?? null);
  };

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const overId = String(over.id);
    const columnId = COLUMNS.find((c) => c.id === overId)?.id
      ?? tasks.find((t) => t.id === overId)?.status;
    if (!columnId) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === columnId) return;

    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: columnId } : t));

    // Persist
    const res = await fetch(`/api/projects/${projectId}/schedule-tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: columnId, version: task.version }),
    });
    if (!res.ok) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
      setError(t('board.update_failed', { defaultValue: 'Failed to update task status' }));
    } else {
      const data = await res.json();
      setTasks((prev) => prev.map((t) => t.id === task.id ? data.schedule_task : t));
    }
  }, [tasks, projectId, t]);

  const tasksByStatus = COLUMNS.reduce<Record<string, Task[]>>((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        className="mb-6"
        title={t('board.title', { defaultValue: 'Board' })}
        subtitle={
          <span className="flex items-center gap-2 text-sm text-muted">
            <Link href={`/projects/${projectId}`} className="hover:text-ink">Project</Link>
            <span>›</span>
            <span>{t('board.title', { defaultValue: 'Board' })}</span>
          </span>
        }
        actions={
          <>
            <button
              onClick={() => setSwimLane(!swimLane)}
              className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${swimLane ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-surface border-line text-muted hover:bg-surface-alt'}`}
            >
              {t('board.swim_lanes', { defaultValue: 'By Assignee' })}
            </button>
            <Link
              href={`/projects/${projectId}/schedule-tasks`}
              className="text-sm text-muted hover:text-ink"
            >
              {t('board.list_view', { defaultValue: 'List View' })} →
            </Link>
          </>
        }
      />

      {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 mb-4 text-sm text-status-danger">{error}</div>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus[col.id] ?? [];
            return (
              <DroppableColumn
                key={col.id}
                id={col.id}
                className={`bg-surface-alt rounded-lg border-t-4 ${COL_COLORS[col.id]} min-h-64`}
              >
                <div className="px-3 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-ink">{col.label}</h3>
                  <span className="text-xs text-muted bg-surface border border-line rounded-full px-2 py-0.5">{colTasks.length}</span>
                </div>
                <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="px-3 pb-3 space-y-2">
                    {colTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onSelect={setSelectedTask} />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="border-2 border-dashed border-line rounded-md h-16 flex items-center justify-center text-xs text-muted">
                        {t('board.drop_here', { defaultValue: 'Drop here' })}
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          projectId={projectId}
          onClose={() => setSelectedTask(null)}
          onSaved={(updated) => {
            setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
