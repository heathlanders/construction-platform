import Link from 'next/link';
import { getSession } from '@/lib/session';
import TaskDetailPanel from '@/components/tasks/task-detail-panel';
import { Card } from '@/components/ui';

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string; taskId: string };
}) {
  const session = await getSession();
  const { id: projectId, taskId } = params;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted mb-4">
        <Link href={`/projects/${projectId}`} className="hover:text-ink">Project</Link>
        <span>›</span>
        <Link href={`/projects/${projectId}/overview`} className="hover:text-ink">Overview</Link>
        <span>›</span>
        <span>Task</span>
      </div>
      <Card padding="lg">
        <TaskDetailPanel
          projectId={projectId}
          taskId={taskId}
          role={session?.role}
          variant="page"
        />
      </Card>
    </div>
  );
}
