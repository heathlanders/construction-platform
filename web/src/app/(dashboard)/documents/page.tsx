import Link from 'next/link';
import { serverApi } from '@/lib/api';
import { PageHeader, Badge, EmptyState } from '@/components/ui';

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

export default async function DocumentsPage() {
  let projects: Project[] = [];

  try {
    const data = await serverApi<ProjectsResponse>('/projects?limit=50');
    projects = data.projects;
  } catch {
    // Non-fatal
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" subtitle="Select a project to view RFIs, submittals, and documents." />

      {projects.length === 0 ? (
        <EmptyState title="No projects found." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}/documents`}
              className="block rounded-lg border border-line bg-surface p-5 transition-colors hover:border-brand-500"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium leading-snug text-ink">{p.name}</span>
                <Badge status={p.status} />
              </div>
              {(p.city || p.state) && (
                <p className="mt-1 text-xs text-muted">{[p.city, p.state].filter(Boolean).join(', ')}</p>
              )}
              <p className="mt-3 text-xs text-brand-600">View documents →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
