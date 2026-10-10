'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Button, Input, Card, Table, THead, TBody, TR, TH, TD,
  SlideOver, EmptyState, SkeletonRows, useToast, useConfirm,
} from '@/components/ui';

interface Project { id: string; name: string }
interface Milestone {
  id: string;
  title: string;
  due_date: string | null;
  completed_at: string | null;
  schedule_task_id: string | null;
  version: number;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MilestoneSlideOver({ milestone, onClose, onSaved, onDeleted }: {
  milestone: Milestone; onClose: () => void;
  onSaved: (m: Milestone) => void; onDeleted: (id: string) => void;
}) {
  const { t } = useTranslation('projects');
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState({
    title: milestone.title,
    due_date: milestone.due_date ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/milestones/${milestone.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, version: milestone.version }),
    });
    const data = await res.json();
    if (res.status === 409) throw new Error(t('projects.milestones.conflict', { defaultValue: 'Milestone was updated by someone else — reload.' }));
    if (!res.ok) throw new Error(data?.error?.message ?? t('projects.milestones.save_failed', { defaultValue: 'Save failed' }));
    return data.milestone as Milestone;
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      const updated = await patch({ title: form.title, due_date: form.due_date || null });
      onSaved(updated);
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  };

  const markComplete = async () => {
    setCompleting(true); setError('');
    try {
      const updated = await patch({ completed_at: new Date().toISOString() });
      onSaved(updated);
    } catch (e) { setError((e as Error).message); } finally { setCompleting(false); }
  };

  const del = async () => {
    const ok = await confirm({
      title: t('projects.milestones.delete_title', { defaultValue: 'Delete this milestone?' }),
      tone: 'danger',
      confirmLabel: t('projects.milestones.delete', { defaultValue: 'Delete' }),
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await fetch(`/api/milestones/${milestone.id}`, { method: 'DELETE' });
      toast.success(t('projects.milestones.deleted', { defaultValue: 'Deleted' }));
      onDeleted(milestone.id);
    } finally { setDeleting(false); }
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      title={t('projects.milestones.milestone', { defaultValue: 'Milestone' })}
      width="max-w-[420px]"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="sm" onClick={del} disabled={deleting} className="text-status-danger hover:bg-status-danger-bg">
            {deleting ? '…' : t('projects.milestones.delete', { defaultValue: 'Delete' })}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>{t('projects.milestones.cancel', { defaultValue: 'Cancel' })}</Button>
            <Button size="sm" onClick={save} loading={saving} disabled={!form.title.trim()}>{t('projects.milestones.save', { defaultValue: 'Save' })}</Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{error}</div>}

        {milestone.completed_at && (
          <div className="flex items-center gap-2 rounded-md border border-status-success/40 bg-status-success-bg p-3 text-sm text-status-success">
            <span>✓</span>
            <span>{t('projects.milestones.completed', { defaultValue: 'Completed' })} {formatDate(milestone.completed_at)}</span>
          </div>
        )}

        <Input label={t('projects.milestones.milestone_title')} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <Input type="date" label={t('projects.milestones.due_date')} value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />

        {!milestone.completed_at && (
          <Button variant="secondary" className="w-full" onClick={markComplete} loading={completing}>
            {completing ? t('projects.milestones.marking', { defaultValue: 'Marking…' }) : t('projects.milestones.mark_complete', { defaultValue: '✓ Mark Complete' })}
          </Button>
        )}

        <p className="border-t border-line pt-2 text-xs text-muted">{t('projects.milestones.created', { defaultValue: 'Created' })} {formatDate(milestone.created_at)}</p>
      </div>
    </SlideOver>
  );
}

export default function MilestonesPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('projects');

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [selected, setSelected] = useState<Milestone | null>(null);

  const load = useCallback(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/milestones?project_id=${id}&limit=100`).then(r => r.json()).then(d => setMilestones(d.milestones ?? [])),
    ]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted">
          <Link href="/projects" className="hover:text-ink">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
          <span>/</span>
          <span className="text-ink">{t('projects.milestones.title')}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('projects.milestones.title')}</h1>
          <Link href={`/projects/${id}/milestones/new`}><Button>+ {t('projects.milestones.add_milestone')}</Button></Link>
        </div>
      </div>

      {milestones === null ? (
        <SkeletonRows rows={5} />
      ) : milestones.length === 0 ? (
        <EmptyState title={t('projects.milestones.no_milestones')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('projects.milestones.milestone_title')}</TH>
                <TH>{t('projects.milestones.due_date')}</TH>
                <TH>{t('projects.milestones.completed')}</TH>
              </TR>
            </THead>
            <TBody>
              {milestones.map(milestone => (
                <TR key={milestone.id} onClick={() => setSelected(milestone)} className="cursor-pointer">
                  <TD className="font-medium">{milestone.title}</TD>
                  <TD className="text-muted">{formatDate(milestone.due_date)}</TD>
                  <TD>
                    {milestone.completed_at ? (
                      <span className="inline-flex items-center gap-1 text-status-success">
                        <span>✓</span>
                        <span className="text-xs">{formatDate(milestone.completed_at)}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted">{t('projects.milestones.not_completed')}</span>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {selected && (
        <MilestoneSlideOver
          milestone={selected}
          onClose={() => setSelected(null)}
          onSaved={updated => { setMilestones(prev => (prev ?? []).map(m => m.id === updated.id ? updated : m)); setSelected(null); }}
          onDeleted={deletedId => { setMilestones(prev => (prev ?? []).filter(m => m.id !== deletedId)); setSelected(null); }}
        />
      )}
    </div>
  );
}
