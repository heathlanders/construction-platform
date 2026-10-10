import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string; photoId: string } }
) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const apiRes = await fetch(`${API_URL}/v1/schedule-tasks/${params.taskId}/photos/${params.photoId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ConstructionPlatform-Web/0.1.0',
    },
  });
  if (apiRes.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(await apiRes.json(), { status: apiRes.status });
}
