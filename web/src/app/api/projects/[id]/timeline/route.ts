import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const [tasksRes, milestonesRes] = await Promise.all([
    fetch(`${API_URL}/v1/schedule-tasks?project_id=${params.id}&limit=200`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
    }),
    fetch(`${API_URL}/v1/milestones?project_id=${params.id}&limit=50`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
    }),
  ]);

  const [tasks, milestones] = await Promise.all([tasksRes.json(), milestonesRes.json()]);
  return NextResponse.json({ tasks: tasks.schedule_tasks ?? [], milestones: milestones.milestones ?? [] });
}
