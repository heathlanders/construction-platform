'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Project {
  id: string;
  name: string;
  status: string;
  address: string | null;
  city: string | null;
  state: string | null;
}

export default function PortalIndexPage() {
  const { t } = useTranslation('portal');
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/client-portal/projects')
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setError(t('error_projects')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel = (s: string) => t(`project_status_${s}`, { defaultValue: s.replace(/_/g, ' ') });

  if (error) {
    return <div className="bg-status-danger-bg border border-status-danger/40 rounded-lg p-6 text-sm text-status-danger">{error}</div>;
  }

  if (projects.length === 1) {
    // Single project — redirect automatically handled by client
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted mb-4">{t('taking_you')}</p>
        <Link href={`/portal/projects/${projects[0].id}`} className="text-brand-600 text-sm hover:underline">
          {projects[0].name}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink mb-6">{t('your_projects')}</h1>
      {projects.length === 0 ? (
        <div className="bg-surface rounded-lg border border-line px-5 py-12 text-center text-muted text-sm">
          {t('no_projects')}
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/portal/projects/${p.id}`}
              className="block bg-surface rounded-lg border border-line p-4 hover:border-brand-500/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-ink">{p.name}</div>
                  {(p.city || p.state) && (
                    <div className="text-xs text-muted mt-0.5">{[p.city, p.state].filter(Boolean).join(', ')}</div>
                  )}
                </div>
                <span className="text-xs bg-surface-alt text-muted px-2 py-0.5 rounded">
                  {statusLabel(p.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
