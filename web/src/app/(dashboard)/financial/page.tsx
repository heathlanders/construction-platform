'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { PageHeader, Badge, EmptyState, Button, SkeletonRows } from '@/components/ui';

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

export default function FinancialPage() {
  const { t } = useTranslation('financial');
  const { t: tC } = useTranslation('common');
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    fetch('/api/projects?limit=50&status=active')
      .then((r) => r.json())
      .then((data: ProjectsResponse) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={t('financial.title')} subtitle={t('financial.select_project')} />

      {projects === null ? (
        <SkeletonRows rows={4} />
      ) : projects.length === 0 ? (
        <EmptyState
          title={tC('common.no_active_projects')}
          action={<Link href="/projects/new"><Button size="sm">{tC('common.create_project_link')}</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}/budget`}
              className="block rounded-lg border border-line bg-surface p-5 transition-colors hover:border-brand-500"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium leading-snug text-ink">{p.name}</span>
                <Badge status={p.status} />
              </div>
              {(p.city || p.state) && (
                <p className="mt-1 text-xs text-muted">{[p.city, p.state].filter(Boolean).join(', ')}</p>
              )}
              <p className="mt-3 text-xs text-brand-600">{t('financial.view_budget')} →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
