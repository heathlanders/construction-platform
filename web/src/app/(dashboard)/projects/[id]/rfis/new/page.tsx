'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Input, Card } from '@/components/ui';

interface Conn { id: string; gc_tenant_id: string; sub_tenant_id: string; status: string }

export default function NewRFIPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');

  const [subject, setSubject] = useState('');
  const [due_date, setDueDate] = useState('');
  const [assignee_id, setAssigneeId] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [shareable, setShareable] = useState<Conn[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  // Connections where THIS tenant is the GC and the link is active — the only RFIs it can share out.
  useEffect(() => {
    void (async () => {
      const [meRes, connRes] = await Promise.all([
        fetch('/api/users/me'), fetch('/api/connections?status=active&limit=100'),
      ]);
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
      const res = await fetch('/api/rfis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          subject,
          due_date: due_date || undefined,
          assignee_id: assignee_id || undefined,
          connection_id: connectionId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error?.message ?? t('rfis.failed_to_create'));
        setLoading(false);
        return;
      }

      router.push(`/projects/${id}/rfis`);
    } catch {
      setSubmitError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/projects/${id}/rfis`} className="text-sm text-muted hover:text-ink">
          {t('rfis.back')}
        </Link>
        <span className="text-line">/</span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('rfis.form_title')}</h1>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('rfis.subject_label')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('rfis.subject_placeholder')}
            required
          />

          <Input
            label={t('rfis.due_date_label')}
            type="date"
            value={due_date}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Input
            label={t('rfis.assignee_label')}
            value={assignee_id}
            onChange={(e) => setAssigneeId(e.target.value)}
            placeholder={t('rfis.assignee_placeholder')}
          />

          {shareable.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('rfis.share_label')}</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={connectionId}
                onChange={(e) => setConnectionId(e.target.value)}
              >
                <option value="">{t('rfis.share_none')}</option>
                {shareable.map(c => (
                  <option key={c.id} value={c.id}>{t('rfis.share_option', { id: c.sub_tenant_id.slice(0, 8) })}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">{t('rfis.share_hint')}</p>
            </div>
          )}

          {submitError && (
            <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 text-sm text-status-danger">{submitError}</div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? t('rfis.creating') : t('rfis.create_rfi')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push(`/projects/${id}/rfis`)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
