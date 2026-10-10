# File Upload Security Skill
**Locked decisions: T-27, T-28, T-29, T-30**

## Quarantine model (mandatory for ALL uploads)
No file goes directly to live storage. Every upload follows this flow:

```
User uploads → Quarantine bucket → Triple validation → Live storage
                                  ↓ (fails any check)
                                  Reject + notify user
```

## Triple validation (T-27)
1. **MIME type validation** — check actual file bytes, not just Content-Type header
2. **Malware scan** — ClamAV or cloud AV service scans quarantine bucket
3. **File structure validation** — verify file is well-formed for its type (not just a renamed .exe)

Only after ALL THREE pass does the file move to live storage.

## Per-type size limits (T-28)
```typescript
const FILE_SIZE_LIMITS = {
  image:    10 * 1024 * 1024,   //  10MB
  document: 50 * 1024 * 1024,   //  50MB
  video:   500 * 1024 * 1024,   // 500MB
  cad:     200 * 1024 * 1024,   // 200MB
};
```

## Per-tier storage quotas (T-29, T-30)
Enforce at upload time — reject if tenant is over quota.
Track usage in `tenant_storage_usage` table (updated on upload + delete).

## Live storage path structure (A-06)
```
/{tenant_id}/live/projects/{project_id}/{category}/{filename}
/{tenant_id}/live/company/{category}/{filename}
```
Never expose direct storage URLs. Always use pre-signed URLs with short TTL.

## Pre-signed URL pattern
```typescript
// Generate pre-signed URL for upload
const uploadUrl = await storage.presignedPutObject(
  'quarantine-bucket',
  `${tenantId}/${uuid()}/${sanitizedFilename}`,
  300  // 5 minute TTL
);

// Generate pre-signed URL for download (live storage only)
const downloadUrl = await storage.presignedGetObject(
  'live-bucket',
  `${tenantId}/live/${path}`,
  3600  // 1 hour TTL
);
```

## Quarantine bucket configuration
- NEVER publicly accessible
- Auto-delete objects after 24 hours (lifecycle rule)
- Separate from live bucket with no cross-bucket access for application code

## Scan worker checks the REAL object (2026-10-07)
The presigned quarantine PUT binds neither Content-Length nor Content-Type, so the declared filename /
content_type / file_size_bytes are **claims**. `handleFileScan` reads the object (`inspectQuarantineObject`):
empty or over the extension's size limit → reject; leading bytes must match the extension
(`magicMatches`, `lib/upload-validation.ts`; txt/csv/CAD have no reliable signature and pass); if the real size
exceeds the declared one the storage quota is re-checked; `files.file_size_bytes` + `tenant_storage_usage` get the
REAL size; `promoteToLive` sets a server-chosen Content-Type (`serveContentType`) so an upload can't be served as
HTML. Tests: `api/src/test/upload-content-checks.test.ts`.
