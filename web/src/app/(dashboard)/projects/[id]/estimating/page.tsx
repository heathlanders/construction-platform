'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { PageHeader, Button, KpiTile, Card, Table, THead, TBody, TR, TH, TD, EmptyState, Badge } from '@/components/ui';

interface Project { id: string; name: string }
interface BidPackage {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  schedule_task_id: string | null;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EstimatingPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('projects');

  const [project, setProject] = useState<Project | null>(null);
  const [packages, setPackages] = useState<BidPackage[]>([]);

  useEffect(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then((r) => r.json()).then((d) => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/bid-packages?project_id=${id}&limit=100`).then((r) => r.json()).then((d) => { if (d.bid_packages) setPackages(d.bid_packages as BidPackage[]); }),
    ]);
  }, [id]);

  const draftCount = packages.filter((p) => p.status === 'draft').length;
  const openCount = packages.filter((p) => p.status === 'open').length;
  const awardedCount = packages.filter((p) => p.status === 'awarded').length;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/projects" className="hover:text-ink">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
        <span>/</span>
        <span className="text-ink">{t('estimating.title')}</span>
      </div>

      <PageHeader
        title={t('estimating.title')}
        actions={
          <Link href={`/projects/${id}/estimating/new`}>
            <Button>+ {t('estimating.new')}</Button>
          </Link>
        }
        className="mb-6"
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <KpiTile label={t('estimating.pkg_draft')} value={draftCount} />
        <KpiTile label={t('estimating.pkg_open')} value={openCount} />
        <KpiTile label={t('estimating.pkg_awarded')} value={awardedCount} />
      </div>

      {packages.length === 0 ? (
        <EmptyState title={t('estimating.no_packages')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('estimating.title_field')}</TH>
                <TH>{t('estimating.status')}</TH>
                <TH>{t('estimating.due_date')}</TH>
                <TH>{t('estimating.created')}</TH>
              </TR>
            </THead>
            <TBody>
              {packages.map((pkg) => (
                <TR key={pkg.id}>
                  <TD className="font-medium">
                    <Link
                      href={`/projects/${id}/estimating/${pkg.id}`}
                      className="text-brand-600 hover:text-brand-700"
                    >
                      {pkg.title}
                    </Link>
                  </TD>
                  <TD><Badge status={pkg.status} /></TD>
                  <TD className="text-muted">{formatDate(pkg.due_date)}</TD>
                  <TD className="text-muted">{formatDate(pkg.created_at)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
