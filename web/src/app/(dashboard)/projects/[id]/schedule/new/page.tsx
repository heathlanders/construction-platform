'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewScheduleTaskPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('projects');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('not_started');
  const [planned_start, setPlannedStart] = useState('');
  const [planned_end, setPlannedEnd] = useState('');
  const [percent_complete, setPercentComplete] = useState('0');

  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setLoading(true);

    try {
      const res = await fetch('/api/schedule-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          title,
          description: description || undefined,
          status,
          planned_start: planned_start || undefined,
          planned_end: planned_end || undefined,
          percent_complete: parseFloat(percent_complete) || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? t('schedule.failed_to_create'));
        setLoading(false);
        return;
      }

      router.push(`/projects/${id}/schedule`);
    } catch {
      setSubmitError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/projects/${id}/schedule`} className="text-sm text-gray-500 hover:text-gray-900">
          {t('schedule.back')}
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">{t('schedule.form_title')}</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('schedule.task_title_label')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('schedule.task_title_placeholder')}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t('schedule.description_label')}</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={t('schedule.description_placeholder')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t('schedule.status_label')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="not_started">{t('schedule.task_status.not_started')}</option>
              <option value="in_progress">{t('schedule.task_status.in_progress')}</option>
              <option value="complete">{t('schedule.task_status.complete')}</option>
              <option value="on_hold">{t('schedule.task_status.on_hold')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('schedule.planned_start_label')}
              type="date"
              value={planned_start}
              onChange={(e) => setPlannedStart(e.target.value)}
            />
            <Input
              label={t('schedule.planned_end_label')}
              type="date"
              value={planned_end}
              onChange={(e) => setPlannedEnd(e.target.value)}
            />
          </div>

          <Input
            label={t('schedule.percent_complete_label')}
            type="number"
            value={percent_complete}
            onChange={(e) => setPercentComplete(e.target.value)}
            min={0}
            max={100}
            step={1}
          />

          {submitError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? t('schedule.adding') : t('schedule.add_task')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push(`/projects/${id}/schedule`)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
