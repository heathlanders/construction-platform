'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Input, Card } from '@/components/ui';

export default function NewMilestonePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('projects');

  const [title, setTitle] = useState('');
  const [due_date, setDueDate] = useState('');
  const [schedule_task_id, setScheduleTaskId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setLoading(true);

    try {
      const res = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          title,
          due_date: due_date || undefined,
          schedule_task_id: schedule_task_id.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? t('projects.milestones.create_failed', { defaultValue: 'Failed to create milestone.' }));
        setLoading(false);
        return;
      }

      router.push(`/projects/${id}/milestones`);
    } catch {
      setSubmitError(t('projects.milestones.error_retry', { defaultValue: 'An error occurred. Please try again.' }));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/projects/${id}/milestones`} className="text-sm text-muted hover:text-ink">
          ← {t('projects.milestones.title')}
        </Link>
        <span className="text-line">/</span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('projects.milestones.new_milestone')}</h1>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={`${t('projects.milestones.milestone_title')} *`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('projects.milestones.milestone_title')}
            required
          />

          <Input
            label={t('projects.milestones.due_date')}
            type="date"
            value={due_date}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Input
            label={t('projects.milestones.schedule_task_id', { defaultValue: 'Schedule Task ID' })}
            value={schedule_task_id}
            onChange={(e) => setScheduleTaskId(e.target.value)}
            placeholder={t('projects.milestones.schedule_task_id_placeholder', { defaultValue: 'UUID of linked schedule task (optional)' })}
            className="font-mono"
          />

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3">
              <p className="text-sm text-status-danger">{submitError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? '…' : t('projects.milestones.create_milestone')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push(`/projects/${id}/milestones`)}>
              {t('projects.milestones.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
