'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { z } from 'zod';
import { Button, Input, Select, Card, PageHeader } from '@/components/ui';

const PROJECT_STATUSES = ['active', 'on_hold', 'completed', 'cancelled'] as const;

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Project name must be 200 characters or less'),
  status: z.enum(PROJECT_STATUSES).default('active'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zip: z.string().optional(),
  county_fips: z.string().regex(/^\d{5}$/, 'County FIPS is 5 digits').optional().or(z.literal('')),
  county_name: z.string().optional(),
});

type FormErrors = Partial<Record<keyof z.infer<typeof CreateProjectSchema>, string>>;

export default function NewProjectPage() {
  const router = useRouter();
  const { t } = useTranslation('projects');
  const { t: tc } = useTranslation('common');

  const [form, setForm] = useState({
    name: '',
    status: 'active' as const,
    start_date: '',
    end_date: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    county_fips: '',
    county_name: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const parsed = CreateProjectSchema.safeParse({
      ...form,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      zip: form.zip || undefined,
      county_fips: form.county_fips || undefined,
      county_name: form.county_name || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? t('projects.failed_to_load'));
        setLoading(false);
        return;
      }

      router.push(`/projects/${data.project.id}`);
    } catch {
      setSubmitError(tc('common.error'));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link href="/projects" className="text-sm text-muted hover:text-ink">
        ← {t('projects.title')}
      </Link>
      <PageHeader title={t('projects.new_project')} className="mt-2 mb-6" />

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('form.project_name_label')}
            value={form.name}
            onChange={set('name')}
            placeholder="Enter project name"
            error={errors.name}
            required
          />

          <Select label={t('form.status_label')} value={form.status} onChange={set('status')}>
            <option value="active">{t('form.status_options.active')}</option>
            <option value="on_hold">{t('form.status_options.on_hold')}</option>
            <option value="completed">{t('form.status_options.completed')}</option>
            <option value="cancelled">{t('form.status_options.cancelled')}</option>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input label={t('projects.start_date')} type="date" value={form.start_date} onChange={set('start_date')} />
            <Input label={t('projects.end_date')} type="date" value={form.end_date} onChange={set('end_date')} />
          </div>

          <Input
            label={t('form.street_address')}
            value={form.address}
            onChange={set('address')}
            placeholder="123 Main St"
          />

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Input label={t('form.city')} value={form.city} onChange={set('city')} placeholder="Springfield" />
            </div>
            <div className="col-span-1">
              <Input label={t('form.state')} value={form.state} onChange={set('state')} placeholder="CA" maxLength={2} />
            </div>
            <div className="col-span-1">
              <Input label={t('form.zip')} value={form.zip} onChange={set('zip')} placeholder="90210" />
            </div>
          </div>

          {/* Optional county override — drives the jurisdiction/AHJ engine. Leave blank to
              derive from ZIP. County FIPS is the 5-digit code (e.g. 55025 = Dane County, WI). */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Input label={t('form.county_fips_label', { defaultValue: 'County FIPS (optional)' })} value={form.county_fips} onChange={set('county_fips')} placeholder="55025" maxLength={5} error={errors.county_fips} />
            </div>
            <div className="col-span-2">
              <Input label={t('form.county_name_label', { defaultValue: 'County name (optional)' })} value={form.county_name} onChange={set('county_name')} placeholder="Dane" />
            </div>
          </div>

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3">
              <p className="text-sm text-status-danger">{submitError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? t('form.creating') : t('form.create_project')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push('/projects')}>
              {tc('common.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
