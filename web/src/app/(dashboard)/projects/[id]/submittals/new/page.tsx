'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select, Card } from '@/components/ui';

interface Conn { id: string; gc_tenant_id: string; sub_tenant_id: string; status: string }

export default function NewSubmittalPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');

  const [title, setTitle] = useState('');
  const [spec_section, setSpecSection] = useState('');
  const [status, setStatus] = useState('draft');
  const [connectionId, setConnectionId] = useState('');
  const [shareable, setShareable] = useState<Conn[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const [meRes, connRes] = await Promise.all([fetch('/api/users/me'), fetch('/api/connections?status=active&limit=100')]);
      const me = await meRes.json() as { user?: { tenant_id: string } };
      const conns = await connRes.json() as { connections?: Conn[] };
      const myId = me.user?.tenant_id;
      if (myId && conns.connections) setShareable(conns.connections.filter(c => c.gc_tenant_id === myId));
    })();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setLoading(true);

    try {
      const res = await fetch('/api/submittals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          title,
          spec_section: spec_section || undefined,
          status,
          connection_id: connectionId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? t('submittals.failed_to_create'));
        setLoading(false);
        return;
      }

      router.push(`/projects/${id}/submittals`);
    } catch {
      setSubmitError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/projects/${id}/submittals`} className="text-sm text-muted hover:text-ink">
          {t('submittals.back')}
        </Link>
        <span className="text-line">/</span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('submittals.form_title')}</h1>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('submittals.title_label')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('submittals.title_placeholder')}
            required
          />

          <Input
            label={t('submittals.spec_section_label')}
            value={spec_section}
            onChange={(e) => setSpecSection(e.target.value)}
            placeholder={t('submittals.spec_section_placeholder')}
          />

          <Select label={t('submittals.status_label')} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">{t('submittals.submittal_status.draft')}</option>
            <option value="submitted">{t('submittals.submittal_status.submitted')}</option>
            <option value="under_review">{t('submittals.submittal_status.under_review')}</option>
            <option value="approved">{t('submittals.submittal_status.approved')}</option>
            <option value="approved_as_noted">{t('submittals.submittal_status.approved_as_noted')}</option>
            <option value="rejected">{t('submittals.submittal_status.rejected')}</option>
            <option value="resubmit">{t('submittals.submittal_status.resubmit')}</option>
          </Select>

          {shareable.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">{t('rfis.share_label')}</label>
              <select
                value={connectionId}
                onChange={(e) => setConnectionId(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('rfis.share_none')}</option>
                {shareable.map(c => <option key={c.id} value={c.id}>{t('rfis.share_option', { id: c.sub_tenant_id.slice(0, 8) })}</option>)}
              </select>
              <p className="text-xs text-gray-500">{t('rfis.share_hint')}</p>
            </div>
          )}

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{submitError}</div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? t('submittals.creating') : t('submittals.create_submittal')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push(`/projects/${id}/submittals`)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
