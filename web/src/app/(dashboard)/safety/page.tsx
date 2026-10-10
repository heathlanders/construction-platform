'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Badge, PageHeader, EmptyState, Button } from '@/components/ui';

interface Project {
  id: string;
  name: string;
  status: string;
  city: string | null;
  state: string | null;
}

interface ProjectsResponse {
  projects: Project[];
  pagination: { has_more: boolean; next_cursor: string | null };
}

export default function SafetyPage() {
  const { t } = useTranslation('safety');
  const { t: tC } = useTranslation('common');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch('/api/projects?limit=50&status=active')
      .then((r) => r.json())
      .then((data: ProjectsResponse) => setProjects(data.projects ?? []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader
        title={t('safety.title')}
        subtitle={t('safety.select_project')}
        actions={
          <Link
            href="/safety/certifications"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            {t('safety.certifications_link')} →
          </Link>
        }
        className="mb-6"
      />

      {projects.length === 0 ? (
        <EmptyState
          title={tC('common.no_active_projects')}
          action={
            <Link href="/projects/new">
              <Button variant="secondary" size="sm">{tC('common.create_project_link')} →</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}/safety`}
              className="block p-5 bg-surface rounded-lg border border-line hover:border-brand-500 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-ink leading-snug">{p.name}</span>
                <Badge status={p.status} />
              </div>
              {(p.city || p.state) && (
                <p className="mt-1 text-xs text-muted">
                  {[p.city, p.state].filter(Boolean).join(', ')}
                </p>
              )}
              <p className="mt-3 text-xs text-brand-600">{t('safety.view_safety')} →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
