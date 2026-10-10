'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewPunchListItemPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due_date, setDueDate] = useState('');
  const [status, setStatus] = useState('open');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setLoading(true);

    try {
      const res = await fetch('/api/punch-list-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          title,
          description: description || undefined,
          due_date: due_date || undefined,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? t('punch_list.failed_to_add'));
        setLoading(false);
        return;
      }

      router.push(`/projects/${id}/punch-list`);
    } catch {
      setSubmitError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/projects/${id}/punch-list`} className="text-sm text-gray-500 hover:text-gray-900">
          {t('punch_list.back')}
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">{t('punch_list.form_title')}</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('punch_list.title_label')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('punch_list.title_placeholder')}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t('punch_list.description_label')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('punch_list.description_placeholder')}
            />
          </div>

          <Input
            label={t('punch_list.due_date_label')}
            type="date"
            value={due_date}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t('punch_list.status_label')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="open">{t('punch_list.item_status.open')}</option>
              <option value="in_progress">{t('punch_list.item_status.in_progress')}</option>
              <option value="complete">{t('punch_list.item_status.complete')}</option>
            </select>
          </div>

          {submitError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? t('punch_list.adding') : t('punch_list.add_item')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push(`/projects/${id}/punch-list`)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
