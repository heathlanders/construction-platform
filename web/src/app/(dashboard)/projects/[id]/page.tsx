'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Badge, Card, EmptyState, Skeleton } from '@/components/ui';

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  created_at: string;
  updated_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex border-b border-line py-3 last:border-0">
      <dt className="w-40 shrink-0 text-sm font-medium text-muted">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('projects');

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setProject(data.project); })
      .catch(() => {});

    Promise.allSettled([
      fetch(`/api/projects/${id}/members`).then((r) => r.json()),
      fetch('/api/users?limit=100').then((r) => r.json()),
    ]).then(([membersResult, usersResult]) => {
      if (membersResult.status === 'fulfilled') setMembers(membersResult.value.members ?? []);
      if (usersResult.status === 'fulfilled') {
        const users: User[] = usersResult.value.users ?? [];
        setUserMap(Object.fromEntries(users.map((u) => [u.id, u])));
      }
    }).catch(() => {});
  }, [id]);

  if (notFound) {
    return <EmptyState title={t('projects.detail.not_found', { defaultValue: 'Project not found.' })} />;
  }

  if (!project) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
    );
  }

  const location = [project.address, project.city, project.state, project.zip].filter(Boolean).join(', ') || '—';

  const MODULE_LINKS = [
    { label: '🕸 ' + t('overview.title', { defaultValue: 'Overview' }), href: `/projects/${id}/overview`, highlight: true },
    { label: '🗂 ' + t('board.title', { defaultValue: 'Board' }), href: `/projects/${id}/board`, highlight: true },
    { label: '📅 ' + t('timeline.title', { defaultValue: 'Timeline' }), href: `/projects/${id}/timeline`, highlight: true },
    { label: t('projects.detail.modules.schedule'), href: `/projects/${id}/schedule` },
    { label: t('projects.detail.modules.milestones'), href: `/projects/${id}/milestones` },
    { label: t('projects.detail.modules.documents'), href: `/projects/${id}/documents` },
    { label: t('projects.detail.modules.rfis'), href: `/projects/${id}/rfis` },
    { label: t('projects.detail.modules.submittals'), href: `/projects/${id}/submittals` },
    { label: t('projects.detail.modules.daily_reports'), href: `/projects/${id}/daily-reports` },
    { label: t('projects.detail.modules.time_entries'), href: `/projects/${id}/time-entries` },
    { label: t('projects.detail.modules.punch_list'), href: `/projects/${id}/punch-list` },
    { label: t('projects.detail.modules.inspections'), href: `/projects/${id}/inspections` },
    { label: t('projects.detail.modules.budget'), href: `/projects/${id}/budget` },
    { label: t('projects.detail.modules.contracts'), href: `/projects/${id}/contracts` },
    { label: t('projects.detail.modules.estimating'), href: `/projects/${id}/estimating` },
    { label: '💲 Estimates', href: `/projects/${id}/estimates`, highlight: true },
    { label: t('projects.detail.modules.trade_modules'), href: `/projects/${id}/trade` },
    { label: t('projects.detail.modules.safety'), href: `/projects/${id}/safety` },
    { label: t('projects.detail.modules.members'), href: `/projects/${id}/members` },
    { label: '🤝 Sub Portal', href: `/projects/${id}/sub-portal` },
    { label: '📋 Permits', href: `/projects/${id}/permits` },
    { label: '🪵 Concrete', href: `/projects/${id}/concrete` },
    { label: '🏗 Framing', href: `/projects/${id}/framing` },
    { label: '❄️ HVAC', href: `/projects/${id}/hvac` },
    { label: '🏠 Roofing', href: `/projects/${id}/roofing` },
    { label: '🧠 Blueprints', href: `/projects/${id}/blueprints`, highlight: true },
    { label: '🗺 Site Map', href: `/projects/${id}/map` },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-sm text-muted">
            <Link href="/projects" className="hover:text-ink">{t('projects.title')}</Link>
            <span>/</span>
            <span className="truncate text-ink">{project.name}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{project.name}</h1>
        </div>
        <Badge status={project.status} className="mt-1" />
      </div>

      {/* Details card */}
      <Card padding="lg">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">{t('projects.detail.title')}</h2>
        <dl>
          <DetailRow label={t('projects.status')} value={<Badge status={project.status} />} />
          <DetailRow label={t('projects.start_date')} value={formatDate(project.start_date)} />
          <DetailRow label={t('projects.end_date')} value={formatDate(project.end_date)} />
          <DetailRow label={t('projects.location')} value={location} />
          <DetailRow label={t('projects.created')} value={formatDate(project.created_at)} />
        </dl>
      </Card>

      {/* Module tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {MODULE_LINKS.map((link) => {
          const highlight = 'highlight' in link && link.highlight;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                'block rounded-lg border p-4 text-sm font-medium transition-colors',
                highlight
                  ? 'border-brand-500/30 bg-brand-500/10 text-brand-600 hover:border-brand-500 hover:bg-brand-500/15'
                  : 'border-line bg-surface text-ink hover:border-brand-500 hover:text-brand-600',
              ].join(' ')}
            >
              {link.label} →
            </Link>
          );
        })}
      </div>

      {/* Team members */}
      {members.length > 0 && (
        <Card padding="lg">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('projects.detail.team_members')} ({members.length})
          </h2>
          <ul className="divide-y divide-line">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">
                  {userMap[m.user_id]
                    ? `${userMap[m.user_id].first_name} ${userMap[m.user_id].last_name}`
                    : m.user_id.slice(0, 8) + '…'}
                </span>
                <span className="text-xs capitalize text-muted">{m.role.replace('_', ' ')}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
