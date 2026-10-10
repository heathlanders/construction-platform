'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Input,
  Textarea,
  Select,
  PageHeader,
  Card,
  EmptyState,
  SlideOver,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from '@/components/ui';

interface Project { id: string; name: string }
interface ScheduleTask {
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
  version?: number;
  created_at: string;
}

const TASK_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'on_hold', label: 'On Hold' },
];

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDateInput(d: string | null) {
  if (!d) return '';
  return d.slice(0, 10);
}

function TaskSlideOver({
  task,
  onClose,
  onSaved,
}: {
  task: ScheduleTask;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('projects');
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    percent_complete: String(task.percent_complete),
    planned_start: toDateInput(task.planned_start),
    planned_end: toDateInput(task.planned_end),
    actual_start: toDateInput(task.actual_start),
    actual_end: toDateInput(task.actual_end),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true);
    setError('');
    const body: Record<string, unknown> = {
      title: form.title,
      description: form.description || null,
      status: form.status,
      percent_complete: parseFloat(form.percent_complete) || 0,
      planned_start: form.planned_start || null,
      planned_end: form.planned_end || null,
      actual_start: form.actual_start || null,
      actual_end: form.actual_end || null,
      version: task.version ?? 1,
    };
    const r = await fetch(`/api/schedule-tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (r.status === 409) { setError(t('schedule.conflict', { defaultValue: 'This task was updated by someone else — reload.' })); return; }
    if (!r.ok) { setError(t('schedule.save_failed', { defaultValue: 'Failed to save.' })); return; }
    onSaved();
    onClose();
  }

  return (
    <SlideOver
      open
      onClose={onClose}
      title={t('schedule.edit_task', { defaultValue: 'Edit Schedule Task' })}
      width="max-w-md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('schedule.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button size="sm" loading={saving} onClick={save}>
            {t('schedule.save', { defaultValue: 'Save' })}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-status-danger/40 bg-status-danger-bg px-3 py-2 text-sm text-status-danger">{error}</p>
        )}
        <Input
          label={t('schedule.task_title', { defaultValue: 'Title' })}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <Textarea
          label={t('schedule.description', { defaultValue: 'Description' })}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t('schedule.status', { defaultValue: 'Status' })}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Input
            label={t('schedule.percent_complete', { defaultValue: '% Complete' })}
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.percent_complete}
            onChange={(e) => setForm((f) => ({ ...f, percent_complete: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('schedule.planned_start', { defaultValue: 'Planned Start' })}
            type="date"
            value={form.planned_start}
            onChange={(e) => setForm((f) => ({ ...f, planned_start: e.target.value }))}
          />
          <Input
            label={t('schedule.planned_end', { defaultValue: 'Planned End' })}
            type="date"
            value={form.planned_end}
            onChange={(e) => setForm((f) => ({ ...f, planned_end: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('schedule.actual_start', { defaultValue: 'Actual Start' })}
            type="date"
            value={form.actual_start}
            onChange={(e) => setForm((f) => ({ ...f, actual_start: e.target.value }))}
          />
          <Input
            label={t('schedule.actual_end', { defaultValue: 'Actual End' })}
            type="date"
            value={form.actual_end}
            onChange={(e) => setForm((f) => ({ ...f, actual_end: e.target.value }))}
          />
        </div>
        {/* Quick transitions */}
        <div className="pt-2 border-t border-line">
          <p className="text-xs font-medium text-muted mb-2">{t('schedule.quick_transitions', { defaultValue: 'Quick Transitions' })}</p>
          <div className="flex flex-wrap gap-2">
            {form.status === 'not_started' && (
              <button
                onClick={() => setForm((f) => ({ ...f, status: 'in_progress', actual_start: f.actual_start || new Date().toISOString().slice(0, 10) }))}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-status-info-bg text-status-info hover:opacity-80"
              >
                {t('schedule.start_task', { defaultValue: 'Start Task' })}
              </button>
            )}
            {form.status === 'in_progress' && (
              <button
                onClick={() => setForm((f) => ({ ...f, status: 'complete', percent_complete: '100', actual_end: f.actual_end || new Date().toISOString().slice(0, 10) }))}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-status-success-bg text-status-success hover:opacity-80"
              >
                {t('schedule.mark_complete', { defaultValue: 'Mark Complete' })}
              </button>
            )}
            {(form.status === 'in_progress' || form.status === 'not_started') && (
              <button
                onClick={() => setForm((f) => ({ ...f, status: 'on_hold' }))}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-status-warning-bg text-status-warning hover:opacity-80"
              >
                {t('schedule.put_on_hold', { defaultValue: 'Put On Hold' })}
              </button>
            )}
            {form.status === 'on_hold' && (
              <button
                onClick={() => setForm((f) => ({ ...f, status: 'in_progress' }))}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-status-info-bg text-status-info hover:opacity-80"
              >
                {t('schedule.resume', { defaultValue: 'Resume' })}
              </button>
            )}
          </div>
        </div>
      </div>
    </SlideOver>
  );
}

export default function SchedulePage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { t } = useTranslation('projects');

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [selected, setSelected] = useState<ScheduleTask | null>(null);

  // Post-import toast (B3.3): the review page redirects here with ?imported=&deps=&steps=.
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    const imported = searchParams.get('imported');
    if (imported) {
      setToast(t('schedule.imported_toast', {
        count: Number(imported),
        deps: Number(searchParams.get('deps') ?? 0),
        steps: Number(searchParams.get('steps') ?? 0),
      }));
      const timer = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, t]);

  const load = useCallback(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then((r) => r.json()).then((d) => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/schedule-tasks?project_id=${id}&limit=200`).then((r) => r.json()).then((d) => { if (d.schedule_tasks) setTasks(d.schedule_tasks as ScheduleTask[]); }),
    ]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      {selected && (
        <TaskSlideOver
          task={selected}
          onClose={() => setSelected(null)}
          onSaved={load}
        />
      )}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 max-w-sm rounded-lg bg-green-600 text-white text-sm px-4 py-3 shadow-lg flex items-start gap-3"
          role="status"
          aria-live="polite"
        >
          <span className="flex-1">{toast}</span>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white leading-none">×</button>
        </div>
      )}
      <div className="max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-muted mb-6">
          <Link href="/projects" className="hover:text-ink">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
          <span>/</span>
          <span className="text-ink">{t('schedule.title')}</span>
        </div>

        <PageHeader
          className="mb-6"
          title={t('schedule.title')}
          actions={
            <Link
              href={`/projects/${id}/schedule/new`}
              className="inline-flex items-center rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              + {t('schedule.new')}
            </Link>
          }
        />

        {tasks.length === 0 ? (
          <EmptyState title={t('schedule.no_tasks')} />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <Table>
              <THead>
                <TR className="bg-surface-alt">
                  <TH>{t('schedule.task_title')}</TH>
                  <TH>{t('schedule.status')}</TH>
                  <TH>{t('schedule.progress')}</TH>
                  <TH>{t('schedule.planned_start')}</TH>
                  <TH>{t('schedule.planned_end')}</TH>
                </TR>
              </THead>
              <TBody>
                {tasks.map((task) => (
                  <TR
                    key={task.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(task)}
                  >
                    <TD className="font-medium text-ink">{task.title}</TD>
                    <TD><Badge status={task.status} /></TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-surface-alt rounded-full h-1.5">
                          <div
                            className="bg-brand-600 h-1.5 rounded-full"
                            style={{ width: `${task.percent_complete}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted">{task.percent_complete.toFixed(0)}%</span>
                      </div>
                    </TD>
                    <TD className="text-muted">{formatDate(task.planned_start)}</TD>
                    <TD className="text-muted">{formatDate(task.planned_end)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </div>
    </>
  );
}
