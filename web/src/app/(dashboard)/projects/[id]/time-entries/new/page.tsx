'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';

interface User { id: string; email: string; first_name: string; last_name: string; }
interface CostCode { id: string; code: string; name: string; }

export default function NewTimeEntryPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');

  const today = new Date().toISOString().slice(0, 10);

  const [users, setUsers] = useState<User[]>([]);
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [date, setDate] = useState(today);
  const [user_id, setUserId] = useState('');
  const [hours_worked, setHoursWorked] = useState('');
  const [cost_code_id, setCostCodeId] = useState('');
  const [hourly_rate, setHourlyRate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void Promise.allSettled([
      fetch('/api/users?limit=100').then((r) => r.json()).then((d) => { if (d.users) setUsers(d.users as User[]); }),
      fetch('/api/cost-codes?limit=100').then((r) => r.json()).then((d) => { if (d.cost_codes) setCostCodes(d.cost_codes as CostCode[]); }),
    ]);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!user_id) { setSubmitError(t('time_entries.select_worker_error')); return; }
    if (!hours_worked || parseFloat(hours_worked) <= 0) { setSubmitError(t('time_entries.hours_error')); return; }
    setLoading(true);

    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          user_id,
          date,
          hours_worked: parseFloat(hours_worked),
          cost_code_id: cost_code_id || undefined,
          hourly_rate_cents: hourly_rate ? Math.round(parseFloat(hourly_rate) * 100) : undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? t('time_entries.failed_to_log'));
        setLoading(false);
        return;
      }

      router.push(`/projects/${id}/time-entries`);
    } catch {
      setSubmitError(t('time_entries.error_retry', { defaultValue: 'An error occurred. Please try again.' }));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/projects/${id}/time-entries`} className="text-sm text-muted hover:text-ink">
          {t('time_entries.back')}
        </Link>
        <span className="text-line">/</span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('time_entries.form_title')}</h1>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('time_entries.date_label')}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Select label={t('time_entries.worker_label')} value={user_id} onChange={(e) => setUserId(e.target.value)} required>
            <option value="">{t('time_entries.select_worker')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.first_name} {u.last_name} ({u.email})
              </option>
            ))}
          </Select>

          <Input
            label={t('time_entries.hours_worked_label')}
            type="number"
            value={hours_worked}
            onChange={(e) => setHoursWorked(e.target.value)}
            placeholder="8.00"
            min={0.25}
            max={24}
            step={0.25}
            required
          />

          <Select label={t('time_entries.cost_code_label')} value={cost_code_id} onChange={(e) => setCostCodeId(e.target.value)}>
            <option value="">{t('time_entries.no_cost_code')}</option>
            {costCodes.map((cc) => (
              <option key={cc.id} value={cc.id}>{cc.code} — {cc.name}</option>
            ))}
          </Select>

          <Input
            label={t('time_entries.hourly_rate_label')}
            type="number"
            value={hourly_rate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="25.00"
            min={0}
            step={0.01}
          />

          <Textarea
            label={t('time_entries.notes_label')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t('time_entries.notes_placeholder')}
          />

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3">
              <p className="text-sm text-status-danger">{submitError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? t('time_entries.logging') : t('time_entries.log_entry')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push(`/projects/${id}/time-entries`)}>
              {t('time_entries.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
