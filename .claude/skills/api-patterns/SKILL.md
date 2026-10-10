# API Patterns Skill
**Locked decisions: T-01, T-02, T-03, T-04, T-05, T-06**

## T-02: Money in cents (integers only — never float)

All monetary values are stored and transmitted as integer cents.

```typescript
// CORRECT — amounts as cents
const invoice = {
  amount_cents: 150000,  // $1,500.00
};

// WRONG — never use floats
const invoice = {
  amount: 1500.00,  // ❌ NEVER
};

// Display helper (never store the formatted value)
export function formatCents(cents: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

// Parse user input to cents
export function dollarsToCents(dollars: string | number): number {
  return Math.round(Number(dollars) * 100);
}
```

## T-03: UUIDs — never expose integer IDs

All IDs in API responses are UUID v4 strings. Never expose auto-increment integers.

```typescript
// Schema: always gen_random_uuid() default
// API response: always UUID string
// Validation with Zod:
import { z } from 'zod';

const uuidSchema = z.string().uuid();

// Never return integer IDs — every resource has a UUID
interface ApiResource {
  id: string;  // UUID v4 — always a string
}
```

## T-04: ISO 8601 dates — always TIMESTAMPTZ

All dates transmitted as ISO 8601 strings. Never use Unix timestamps in API responses.

```typescript
// CORRECT
const response = {
  created_at: '2026-03-19T14:30:00Z',  // ISO 8601 with Z for UTC
  due_date: '2026-04-01',              // Date-only for date fields
};

// WRONG
const response = {
  created_at: 1742395800,  // ❌ Never Unix timestamps
  due_date: new Date(),    // ❌ Never raw Date objects
};

// Serialization helper
export function toISOString(date: Date): string {
  return date.toISOString();
}
```

## T-05: Pre-signed URLs — download pattern

Upload pattern is in `file-upload-security/SKILL.md`. This covers download.

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// DigitalOcean Spaces / AWS S3 (same API — swap endpoint env var only)
const s3 = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
  },
});

export async function generateDownloadUrl(storagePath: string): Promise<string> {
  // Never expose direct storage URLs
  const command = new GetObjectCommand({
    Bucket: process.env.STORAGE_LIVE_BUCKET!,
    Key: storagePath,
  });

  // 15-minute expiry (T-05)
  return getSignedUrl(s3, command, { expiresIn: 900 });
}

// API endpoint example
// GET /v1/documents/:id/download
// 1. Look up document in DB (withTenantContext — ensures tenant isolation)
// 2. Check user has permission to access document
// 3. Generate pre-signed URL for storagePath
// 4. Return URL — NEVER the raw storage path
```

## T-06: Server-side 409 Conflict for optimistic locking

The mobile offline-sync skill covers client-side handling. This covers the server-side enforcement.

```typescript
// On any UPDATE to a versioned table, include version in WHERE clause.
// The DB trigger increments version automatically — never trust client version increment.

export async function updateProject(
  client: PoolClient,
  id: string,
  data: { name?: string; status?: string },
  clientVersion: number
): Promise<void> {
  const result = await client.query(
    `UPDATE projects
     SET name = COALESCE($1, name),
         status = COALESCE($2, status),
         updated_at = NOW()
     WHERE id = $3
       AND tenant_id = current_setting('app.current_tenant_id')::uuid
       AND version = $4
       AND deleted_at IS NULL
     RETURNING id`,
    [data.name ?? null, data.status ?? null, id, clientVersion]
  );

  if (result.rowCount === 0) {
    // Either not found, or version mismatch (conflict)
    const exists = await client.query(
      `SELECT id, version FROM projects WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (exists.rowCount === 0) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Project not found' };
    }
    // Row exists but version mismatched — concurrent modification detected
    throw {
      statusCode: 409,
      code: 'VERSION_CONFLICT',
      message: 'This record was modified by another user. Please refresh and try again.',
      server_version: exists.rows[0].version,
    };
  }
}

// Error response format for 409:
// {
//   "error": {
//     "code": "VERSION_CONFLICT",
//     "message": "This record was modified by another user. Please refresh and try again.",
//     "server_version": 5
//   }
// }
```

## T-01: Cursor-based pagination (max 100 per page)

```typescript
// Cursor is the last item's created_at + id (opaque to client).

export interface PaginationParams {
  limit?: number;   // max 100
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export function decodeCursor(cursor: string): { createdAt: string; id: string } {
  return JSON.parse(Buffer.from(cursor, 'base64url').toString());
}

export function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt, id })).toString('base64url');
}

// Usage in query — fetch one extra to determine has_more:
// WHERE (created_at, id) < ($cursor_created_at, $cursor_id)
// ORDER BY created_at DESC, id DESC
// LIMIT $limit + 1
```

## Standard error response format (locked)

```typescript
// All errors follow this structure (from api/CLAUDE.md)
interface ApiError {
  error: {
    code: string;      // SNAKE_CASE_CODE
    message: string;   // Human readable
    field?: string;    // Optional — for validation errors
    upgrade_to?: string; // Optional — for 402 tier enforcement errors
  };
}

// HTTP status mapping
// 400 — bad request / validation
// 401 — missing or invalid JWT
// 402 — tier limit reached (see Pricing_Tier_Enforcement_Matrix.md)
// 403 — authenticated but not authorized for this resource
// 404 — resource not found (or tenant-scoped and not visible)
// 409 — version conflict (optimistic locking)
// 422 — file validation failure (T-28)
// 429 — rate limit
// 500 — internal error (never leak stack traces)
```

## URL prefix and User-Agent requirements (T-11)

All endpoints launch under `/v1/`. All clients must send a `User-Agent` header.

```typescript
// Middleware — validate User-Agent presence
export async function requireUserAgent(request: FastifyRequest, reply: FastifyReply) {
  if (!request.headers['user-agent']) {
    return reply.status(400).send({
      error: {
        code: 'MISSING_USER_AGENT',
        message: 'User-Agent header is required on all requests.',
      },
    });
  }
}
```
