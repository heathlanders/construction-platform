// Catch-all proxy for /api/v1/* → API server /v1/*.
// Mirrors the per-resource proxy pattern (cookie platform_token → Bearer) but covers
// every /v1 endpoint the client calls directly under /api/v1 (e.g. the Blueprint review
// page: GET/PATCH/POST /api/v1/blueprints/:id[/tasks[/:tid]|/import]).
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

async function proxy(req: NextRequest, path: string[]) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const target = `${API_URL}/v1/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'ConstructionPlatform-Web/0.1.0',
  };

  const method = req.method.toUpperCase();
  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await req.text();
    const ct = req.headers.get('content-type');
    if (ct) headers['Content-Type'] = ct;
  }

  const apiRes = await fetch(target, { method, headers, body });

  // Pass through status + body; tolerate empty/non-JSON responses.
  const text = await apiRes.text();
  const contentType = apiRes.headers.get('content-type') ?? '';
  if (!text) return new NextResponse(null, { status: apiRes.status });
  if (contentType.includes('application/json')) {
    return new NextResponse(text, { status: apiRes.status, headers: { 'content-type': 'application/json' } });
  }
  return new NextResponse(text, { status: apiRes.status, headers: { 'content-type': contentType || 'text/plain' } });
}

type Ctx = { params: { path: string[] } };
export const GET = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const POST = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const PATCH = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const PUT = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const DELETE = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
