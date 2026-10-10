'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui';

interface Project { id: string; name: string }

export default function ProjectDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.project) setProject(d.project as Project); })
      .catch(() => {});
  }, [id]);

  const sections = [
    { label: t('rfis.title'), description: t('documents.rfis_description'), href: `/projects/${id}/rfis` },
    { label: t('submittals.title'), description: t('documents.submittals_description'), href: `/projects/${id}/submittals` },
    { label: t('documents.plans_label'), description: t('documents.plans_description'), href: `/projects/${id}/files` },
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/projects" className="hover:text-ink">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
        <span>/</span>
        <span className="text-ink">{t('documents.title')}</span>
      </div>

      <PageHeader title={t('documents.title')} className="mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block p-5 bg-surface rounded-lg border border-line hover:border-brand-500 hover:shadow-sm transition-all"
          >
            <p className="font-medium text-ink">{s.label}</p>
            <p className="text-sm text-muted mt-1">{s.description}</p>
            <p className="text-xs text-brand-600 mt-3">{t('documents.view_label')} {s.label} →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
