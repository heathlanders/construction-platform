'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface Bundle {
  project: { id: string; name: string; status: string; address: string | null; city: string | null; state: string | null };
  tasks: { id: string; title: string; status: string; planned_end: string | null; percent_complete: number }[];
  documents: { id: string; doc_type: string; title: string; status: string }[];
  rfis: { id: string; number: number; subject: string; status: string; due_date: string | null }[];
}

export default function SubPortalProject() {
  const { t } = useTranslation('connections');
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Bundle | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/v1/sub-portal/projects/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch((s) => setError(s === 403 ? t('sub_portal.portal.error_forbidden') : t('sub_portal.portal.error_project')))
      .finally(() => setLoading(false));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [id]);

  async function respond(rfiId: string) {
    const res = await fetch(`/api/v1/sub-portal/rfis/${rfiId}/respond`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
    });
    if (res.ok) load();
  }

  const rfiStatus = (s: string) => t(`sub_portal.portal.rfi_status_${s}`, { defaultValue: s });
  const taskStatus = (s: string) => t(`sub_portal.portal.task_status_${s}`, { defaultValue: s.replace(/_/g, ' ') });

  if (loading) return <p className="text-sm text-muted">{t('sub_portal.portal.loading')}</p>;
  if (error) return <div className="bg-status-danger-bg border border-status-danger/40 rounded-lg p-6 text-sm text-status-danger">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/sub-portal" className="text-xs text-muted hover:text-ink">← {t('sub_portal.portal.all_projects')}</Link>
        <h1 className="text-xl font-semibold text-ink mt-2">{data.project.name}</h1>
        {(data.project.address || data.project.city) && (
          <p className="text-sm text-muted">{[data.project.address, data.project.city, data.project.state].filter(Boolean).join(', ')}</p>
        )}
      </div>

      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">{t('sub_portal.portal.rfis_title')}</h2>
        {data.rfis.length === 0 ? (
          <p className="text-sm text-muted">{t('sub_portal.portal.none')}</p>
        ) : (
          <div className="space-y-2">
            {data.rfis.map((r) => (
              <div key={r.id} className="bg-surface border border-line rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-ink">#{r.number} — {r.subject}</div>
                  <div className="text-xs text-muted">
                    {rfiStatus(r.status)}{r.due_date ? ` · ${t('sub_portal.portal.due', { date: r.due_date })}` : ''}
                  </div>
                </div>
                {r.status !== 'answered' && r.status !== 'closed' && (
                  <button onClick={() => respond(r.id)} className="text-xs bg-brand-600 text-white rounded-md px-3 py-1.5 hover:bg-brand-700">
                    {t('sub_portal.portal.mark_answered')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">{t('sub_portal.portal.schedule_title')}</h2>
        {data.tasks.length === 0 ? (
          <p className="text-sm text-muted">{t('sub_portal.portal.no_tasks')}</p>
        ) : (
          <div className="space-y-1.5">
            {data.tasks.map((task) => (
              <div key={task.id} className="bg-surface border border-line rounded-md px-3 py-2 flex items-center justify-between text-sm">
                <span className="text-ink">{task.title}</span>
                <span className="text-xs text-muted">{taskStatus(task.status)}{task.planned_end ? ` · ${task.planned_end}` : ''}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">{t('sub_portal.portal.documents_title')}</h2>
        {data.documents.length === 0 ? (
          <p className="text-sm text-muted">{t('sub_portal.portal.no_documents')}</p>
        ) : (
          <div className="space-y-1.5">
            {data.documents.map((d) => (
              <div key={d.id} className="bg-surface border border-line rounded-md px-3 py-2 flex items-center justify-between text-sm">
                <span className="text-ink">{d.title}</span>
                <span className="text-xs text-muted uppercase">{d.doc_type}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
