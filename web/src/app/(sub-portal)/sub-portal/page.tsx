'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Project {
  id: string;
  name: string;
  status: string;
  city: string | null;
  state: string | null;
}

export default function SubPortalHome() {
  const { t } = useTranslation('connections');
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/sub-portal/projects')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setError(t('sub_portal.portal.error_projects')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel = (s: string) => t(`sub_portal.portal.project_status_${s}`, { defaultValue: s.replace(/_/g, ' ') });

  if (loading) return <p className="text-sm text-muted">{t('sub_portal.portal.loading')}</p>;
  if (error) return <div className="bg-status-danger-bg border border-status-danger/40 rounded-lg p-6 text-sm text-status-danger">{error}</div>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink mb-6">{t('sub_portal.portal.your_projects')}</h1>
      {projects.length === 0 ? (
        <div className="bg-surface rounded-lg border border-line px-5 py-12 text-center text-muted text-sm">
          {t('sub_portal.portal.no_projects')}
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/sub-portal/projects/${p.id}`}
              className="block bg-surface rounded-lg border border-line p-4 hover:border-brand-500/50 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-ink">{p.name}</div>
                  {(p.city || p.state) && <div className="text-xs text-muted">{[p.city, p.state].filter(Boolean).join(', ')}</div>}
                </div>
                <span className="text-xs text-muted">{statusLabel(p.status)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
