'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Input, Textarea, Card } from '@/components/ui';

export default function NewDailyReportPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');

  const today = new Date().toISOString().slice(0, 10);

  const [report_date, setReportDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [conditions, setConditions] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setLoading(true);

    try {
      const res = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          report_date,
          notes: notes || undefined,
          weather: conditions ? { conditions } : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? 'Failed to add daily report');
        setLoading(false);
        return;
      }

      router.push(`/projects/${id}/daily-reports`);
    } catch {
      setSubmitError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/projects/${id}/daily-reports`} className="text-sm text-muted hover:text-ink">
          {t('daily_reports.back')}
        </Link>
        <span className="text-line">/</span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('daily_reports.form_title')}</h1>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('daily_reports.report_date_label')}
            type="date"
            value={report_date}
            onChange={(e) => setReportDate(e.target.value)}
            required
          />

          <Input
            label={t('daily_reports.weather_conditions_label')}
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder={t('daily_reports.weather_conditions_placeholder')}
          />

          <Textarea
            label={t('daily_reports.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={t('daily_reports.notes_placeholder')}
          />

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{submitError}</div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? t('daily_reports.adding') : t('daily_reports.add_report')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push(`/projects/${id}/daily-reports`)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
