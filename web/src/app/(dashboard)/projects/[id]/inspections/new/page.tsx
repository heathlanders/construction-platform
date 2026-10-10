'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';

export default function NewInspectionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');

  const [title, setTitle] = useState('');
  const [inspection_date, setInspectionDate] = useState(new Date().toISOString().slice(0, 16));
  const [status, setStatus] = useState('scheduled');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setLoading(true);

    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          title,
          inspection_date,
          status,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? t('inspections.failed_to_schedule'));
        setLoading(false);
        return;
      }

      router.push(`/projects/${id}/inspections`);
    } catch {
      setSubmitError(t('inspections.error_retry', { defaultValue: 'An error occurred. Please try again.' }));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/projects/${id}/inspections`} className="text-sm text-muted hover:text-ink">
          {t('inspections.back')}
        </Link>
        <span className="text-line">/</span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('inspections.form_title')}</h1>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('inspections.title_label')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('inspections.title_placeholder')}
            required
          />

          <Input
            label={t('inspections.scheduled_datetime_label')}
            type="datetime-local"
            value={inspection_date}
            onChange={(e) => setInspectionDate(e.target.value)}
            required
          />

          <Select label={t('inspections.status_label')} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="scheduled">{t('inspections.inspection_status.scheduled')}</option>
            <option value="passed">{t('inspections.inspection_status.passed')}</option>
            <option value="failed">{t('inspections.inspection_status.failed')}</option>
            <option value="requires_action">{t('inspections.inspection_status.requires_action')}</option>
          </Select>

          <Textarea
            label={t('inspections.notes_label')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t('inspections.notes_placeholder')}
          />

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3">
              <p className="text-sm text-status-danger">{submitError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? t('inspections.scheduling') : t('inspections.schedule_inspection')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push(`/projects/${id}/inspections`)}>
              {t('inspections.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
