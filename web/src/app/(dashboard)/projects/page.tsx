'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader, Button, Card, Table, THead, TBody, TR, TH, TD, Badge, EmptyState, SkeletonRows } from '@/components/ui';

interface Project {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProjectsPage() {
  const { t } = useTranslation('projects');
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    fetch('/api/projects?limit=50')
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch((err: unknown) => {
        setProjects([]);
        setFetchError(err instanceof Error ? err.message : t('projects.failed_to_load'));
      });
  }, [t]);

  const newBtn = (
    <Link href="/projects/new">
      <Button>+ {t('projects.new_project')}</Button>
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t('projects.title')} actions={newBtn} />

      {fetchError && (
        <Card className="border-status-danger/40 bg-status-danger-bg">
          <p className="text-sm text-status-danger">{fetchError}</p>
        </Card>
      )}

      {projects === null ? (
        <SkeletonRows rows={6} />
      ) : projects.length === 0 && !fetchError ? (
        <EmptyState
          title={t('projects.no_projects')}
          action={<Link href="/projects/new"><Button size="sm">{t('projects.new_project')}</Button></Link>}
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('projects.name')}</TH>
                <TH>{t('projects.status')}</TH>
                <TH>{t('projects.start_date')}</TH>
                <TH>{t('projects.end_date')}</TH>
                <TH>{t('projects.location')}</TH>
              </TR>
            </THead>
            <TBody>
              {projects.map((project) => (
                <TR key={project.id} onClick={() => router.push(`/projects/${project.id}`)} className="cursor-pointer">
                  <TD>
                    <Link href={`/projects/${project.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-brand-600 hover:text-brand-700">
                      {project.name}
                    </Link>
                  </TD>
                  <TD><Badge status={project.status} /></TD>
                  <TD className="text-muted">{formatDate(project.start_date)}</TD>
                  <TD className="text-muted">{formatDate(project.end_date)}</TD>
                  <TD className="text-muted">
                    {project.city && project.state ? `${project.city}, ${project.state}` : '—'}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
