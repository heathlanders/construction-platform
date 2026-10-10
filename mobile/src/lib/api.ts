import { getToken } from './auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const APP_VERSION = '1.0.0';

/** Error thrown by mobileApi on a non-2xx response. Carries the HTTP status and
 *  parsed body so callers can branch (e.g. 409 VERSION_CONFLICT → conflict flow). */
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function mobileApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // User-Agent required on all requests (CLAUDE.md rule 9)
    'User-Agent': `ConstructionOS-Mobile/${APP_VERSION}`,
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/v1${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
    const message =
      (body as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`;
    throw new ApiError(message, res.status, body);
  }

  return res.json() as Promise<T>;
}

// Thin GET/POST helpers over mobileApi. Some callers pass a `/v1/...` path and some
// pass a bare path; mobileApi already prepends `/v1`, so strip a leading `/v1` here
// to support both conventions. Returns the parsed JSON body.
export function apiGet<T = unknown>(path: string): Promise<T> {
  return mobileApi<T>(path.replace(/^\/v1(?=\/)/, ''), { method: 'GET' });
}

export function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  return mobileApi<T>(path.replace(/^\/v1(?=\/)/, ''), {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Upload a local file (e.g. a captured photo) through the quarantine pipeline and return its
 * file_id once the presigned PUT succeeds. Online-only — no offline queue (Enterprise Plan §B4).
 *   1. POST /v1/files/upload  → { file_id, upload_url }   (JSON, authed)
 *   2. PUT the binary to upload_url (S3/MinIO presigned — no auth header, no /v1 prefix)
 * The background file.scan worker then promotes quarantine → live; the caller attaches file_id
 * to its record (which 409s until the scan completes — caller should retry).
 */
export async function uploadFile(
  localUri: string,
  filename: string,
  projectId?: string,
  category = 'task-photos',
  contentTypeOverride?: string,
): Promise<string> {
  // Read the local file into a blob to learn its real size + content-type.
  const fileResp = await fetch(localUri);
  const blob = await fileResp.blob();
  // Documents (PDF/office) pass their real mimeType in; images fall back to blob.type → image/jpeg.
  const contentType = contentTypeOverride
    ?? (blob.type && blob.type.length > 0 ? blob.type : 'image/jpeg');
  // Preserve any real file extension (plan.pdf, sheet.xlsx); only default to .jpg for an
  // extension-less image capture. The API allowlist (T-28) matches extension ↔ content_type.
  const hasExt = /\.[a-z0-9]{2,5}$/i.test(filename);
  const safeName = hasExt ? filename : `${filename}.jpg`;

  const { file_id, upload_url } = await mobileApi<{ file_id: string; upload_url: string }>(
    '/files/upload',
    {
      method: 'POST',
      body: JSON.stringify({
        filename: safeName,
        content_type: contentType,
        file_size_bytes: blob.size > 0 ? blob.size : 1,
        project_id: projectId || undefined,
        category,
      }),
    },
  );

  const put = await fetch(upload_url, { method: 'PUT', body: blob, headers: { 'Content-Type': contentType } });
  if (!put.ok) throw new Error(`Upload failed (HTTP ${put.status})`);
  return file_id;
}
