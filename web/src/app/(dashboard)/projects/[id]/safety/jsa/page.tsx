'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Card, PageHeader, EmptyState } from '@/components/ui';

interface Project { id: string; name: string }
interface JsaRecord {
  id: string;
  title: string;
  conducted_at: string;
  attendees: Array<{ user_id: string; name: string; signature_at: string | null }>;
  hazards: Array<{ description: string; controls: string; severity: string }>;
  created_at: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// JSA hazard scale (low/medium/high/critical) is a DOMAIN scale — keep its values/logic.
const SEVERITY_COLORS: Record<string, string> = {
  low:      'bg-status-success-bg text-status-success',
  medium:   'bg-status-warning-bg text-status-warning',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-status-danger-bg text-status-danger',
};

export default function JsaListPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('safety');

  const [project, setProject] = useState<Project | null>(null);
  const [records, setRecords] = useState<JsaRecord[]>([]);

  useEffect(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then((r) => r.json()).then((d) => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/jsa-records?project_id=${id}&limit=50`).then((r) => r.json()).then((d) => { if (d.jsa_records) setRecords(d.jsa_records as JsaRecord[]); }),
    ]);
  }, [id]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/projects" className="hover:text-ink">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
        <span>/</span>
        <Link href={`/projects/${id}/safety`} className="hover:text-ink">{t('safety.title')}</Link>
        <span>/</span>
        <span className="text-ink">{t('jsa.title')}</span>
      </div>

      <PageHeader
        className="mb-6"
        title={t('jsa.full_title')}
        subtitle={t('jsa.pre_task_description', { project: project?.name ?? '…' })}
        actions={
          <Link href={`/projects/${id}/safety/jsa/new`}>
            <Button>+ {t('jsa.new')}</Button>
          </Link>
        }
      />

      {records.length === 0 ? (
        <EmptyState title={t('jsa.no_jsa')} />
      ) : (
        <div className="space-y-4">
          {records.map((r) => (
            <Card key={r.id} padding="lg">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{r.title}</h3>
                  <p className="text-xs text-muted mt-0.5">Conducted {formatDateTime(r.conducted_at)}</p>
                </div>
                <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
              </div>

              {r.hazards && r.hazards.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">{t('jsa.hazards')}</p>
                  <ul className="space-y-1.5">
                    {r.hazards.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`mt-0.5 shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[h.severity] ?? 'bg-status-neutral-bg text-status-neutral'}`}>
                          {h.severity}
                        </span>
                        <div>
                          <span className="text-xs text-ink">{h.description}</span>
                          {h.controls && (
                            <span className="text-xs text-muted"> — {t('jsa.controls')}: {h.controls}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {r.attendees && r.attendees.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">{t('jsa.attendees')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.attendees.map((a, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${a.signature_at ? 'bg-status-success-bg text-status-success' : 'bg-status-neutral-bg text-status-neutral'}`}>
                        {a.name} {a.signature_at ? '✓' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
