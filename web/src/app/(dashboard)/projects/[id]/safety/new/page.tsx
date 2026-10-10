'use client';

// Safety incident reporting form — T-40: safety notifications cannot be disabled
// Incident creates a notification for all project Safety Officers and Owners.

import { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Input, Textarea, PageHeader } from '@/components/ui';
import { SEVERITY as SEVERITY_COLORS } from '@/lib/colors';

export default function NewSafetyIncidentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('safety');

  const SEVERITIES = [
    { value: 'near_miss',  label: t('incidents.severity_values.near_miss') },
    { value: 'first_aid',  label: t('incidents.severity_values.first_aid') },
    { value: 'recordable', label: t('incidents.severity_values.recordable') },
    { value: 'lost_time',  label: t('incidents.severity_values.lost_time') },
    { value: 'fatality',   label: t('incidents.severity_values.fatality') },
  ];

  const [incident_date, setIncidentDate] = useState(
    () => new Date().toISOString().slice(0, 16),
  );
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('near_miss');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setSubmitError(t('incidents.description_required'));
      return;
    }
    setLoading(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/safety-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          incident_date,
          description: description.trim(),
          severity,
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? t('incidents.failed_to_report'));
      }

      router.push(`/projects/${id}/safety`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/projects" className="hover:text-ink">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-ink">Project</Link>
        <span>/</span>
        <Link href={`/projects/${id}/safety`} className="hover:text-ink">{t('incidents.back_to_safety')}</Link>
        <span>/</span>
        <span className="text-ink">{t('incidents.report_incident')}</span>
      </div>

      <div className="rounded-lg border border-status-danger/40 bg-status-danger-bg p-4 mb-6">
        <p className="text-sm font-semibold text-status-danger mb-1">{t('incidents.emergency_title')}</p>
        <ul className="text-sm text-status-danger space-y-1 list-disc list-inside">
          <li>{t('incidents.emergency_call_911')}</li>
          <li>{t('incidents.emergency_supervisor')}</li>
          <li>{t('incidents.emergency_no_move')}</li>
        </ul>
      </div>

      <div className="rounded-lg border border-status-warning/40 bg-status-warning-bg p-3 mb-6">
        <p className="text-sm text-status-warning">
          {t('incidents.notification_notice')}
        </p>
      </div>

      <PageHeader className="mb-6" title={t('incidents.form_title')} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t('incidents.incident_date_label')} <span className="text-status-danger">*</span>
          </label>
          <Input
            type="datetime-local"
            value={incident_date}
            onChange={(e) => setIncidentDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            {t('incidents.severity_label')} <span className="text-status-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SEVERITIES.map((sv) => (
              <button
                key={sv.value}
                type="button"
                onClick={() => setSeverity(sv.value)}
                className="px-3 py-1.5 rounded-md text-sm font-medium border-2 transition-colors"
                style={{
                  borderColor: SEVERITY_COLORS[sv.value],
                  backgroundColor: severity === sv.value ? SEVERITY_COLORS[sv.value] : 'transparent',
                  color: severity === sv.value ? 'white' : SEVERITY_COLORS[sv.value],
                }}
              >
                {sv.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t('incidents.description_label')} <span className="text-status-danger">*</span>
          </label>
          <Textarea
            rows={5}
            placeholder={t('incidents.description_placeholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {submitError && (
          <p className="text-sm text-status-danger">{submitError}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="danger" loading={loading}>
            {loading ? t('incidents.reporting') : t('incidents.report_button')}
          </Button>
          <Link href={`/projects/${id}/safety`}>
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
