// upload-content-checks.test.ts — the scan worker checks the REAL object, not the client's claims.
// The presigned quarantine PUT binds neither length nor type, so a client can declare "photo.jpg,
// image/jpeg, 1 byte" and upload anything. T-28 (magic bytes) + T-29 (real size, quota) live here.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';

vi.mock('../lib/queue.js', () => ({ sendJob: vi.fn().mockResolvedValue('job-id') }));
const inspect = vi.fn();
const promote = vi.fn().mockResolvedValue(undefined);
vi.mock('../lib/storage.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/storage.js')>()),
  inspectQuarantineObject: (...a: unknown[]) => inspect(...a),
  promoteToLive: (...a: unknown[]) => promote(...a),
}));

import { testPool } from './setup.js';
import { magicMatches, maxSizeForExt, serveContentType } from '../lib/upload-validation.js';
import { handleFileScan } from '../workers/file-scan-worker.js';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const HTML = Buffer.from('<html><script>alert(1)</script>');

describe('pure checks', () => {
  it('matches magic bytes to the extension', () => {
    expect(magicMatches('a.jpg', JPEG)).toBe(true);
    expect(magicMatches('a.JPEG', JPEG)).toBe(true);
    expect(magicMatches('a.png', PNG)).toBe(true);
    expect(magicMatches('a.jpg', HTML)).toBe(false);
    expect(magicMatches('a.png', JPEG)).toBe(false);
    expect(magicMatches('a.pdf', Buffer.concat([Buffer.from('\n\n'), Buffer.from('%PDF-1.7')]))).toBe(true);
    expect(magicMatches('a.pdf', HTML)).toBe(false);
    expect(magicMatches('a.docx', Buffer.from([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
    expect(magicMatches('a.heic', Buffer.from('\0\0\0\x18ftypheic'))).toBe(true);
    expect(magicMatches('notes.txt', HTML)).toBe(true); // no reliable signature — other checks apply
  });

  it('size limit is the largest category allowing the extension (pdf is also a plan)', () => {
    expect(maxSizeForExt('a.jpg')).toBe(25 * 1024 * 1024);
    expect(maxSizeForExt('a.pdf')).toBe(250 * 1024 * 1024);
    expect(maxSizeForExt('a.exe')).toBeNull();
  });

  it('serves a type chosen from the extension, never HTML', () => {
    expect(serveContentType('a.jpg')).toBe('image/jpeg');
    expect(serveContentType('a.txt')).toBe('text/plain; charset=utf-8');
    expect(serveContentType('a.dwg')).toBe('application/octet-stream');
  });
});

describe('handleFileScan', () => {
  const tenantId = randomUUID();
  const userId = randomUUID();

  beforeAll(async () => {
    delete process.env.CLOUDMERSIVE_API_KEY; // the malware scan is a separate step — tested on its own
    await testPool.query(`INSERT INTO tenants (id,name,slug,tier,status) VALUES ($1,'Scan Co',$2,'starter','active')`, [tenantId, `scan-${tenantId.slice(0, 8)}`]);
    await testPool.query(`INSERT INTO tenant_subscriptions (tenant_id,tier,status) VALUES ($1,'starter','active')`, [tenantId]);
    await testPool.query(
      `INSERT INTO users (id,tenant_id,email,password_hash,first_name,last_name,role,status) VALUES ($1,$2,$3,'x','S','C','owner','active')`,
      [userId, tenantId, `scan-${userId.slice(0, 8)}@ex.com`]);
  });

  afterAll(async () => {
    for (const t of ['files', 'audit_log', 'tenant_storage_usage', 'users', 'tenant_subscriptions']) {
      await testPool.query(`DELETE FROM ${t} WHERE tenant_id = $1`, [tenantId]);
    }
    await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
  });

  async function scan(filename: string, declared: number, real: { size: number; head: Buffer }) {
    const { rows: [f] } = await testPool.query(
      `INSERT INTO files (tenant_id, filename, content_type, file_size_bytes, category, quarantine_path, storage_path, status, created_by)
       VALUES ($1,$2,'image/jpeg',$3,'image',$4,$5,'scanning',$6) RETURNING id`,
      [tenantId, filename, declared, `${tenantId}/q/${filename}`, `${tenantId}/live/x/${filename}`, userId]);
    inspect.mockResolvedValueOnce(real);
    promote.mockClear();
    await handleFileScan(tenantId, {
      file_id: f.id, quarantine_path: `${tenantId}/q/${filename}`, live_path: `${tenantId}/live/x/${filename}`,
      filename, content_type: 'image/jpeg', file_size_bytes: declared,
    });
    const { rows: [after] } = await testPool.query(`SELECT status, file_size_bytes FROM files WHERE id = $1`, [f.id]);
    return after as { status: string; file_size_bytes: number };
  }

  const usage = async () =>
    Number((await testPool.query(`SELECT bytes_used FROM tenant_storage_usage WHERE tenant_id = $1`, [tenantId])).rows[0]?.bytes_used ?? 0);

  it('rejects a "jpg" whose bytes are not a JPEG', async () => {
    expect((await scan('photo.jpg', 100, { size: 100, head: HTML })).status).toBe('rejected');
    expect(promote).not.toHaveBeenCalled();
  });

  it('rejects an object larger than the type allows, whatever was declared', async () => {
    expect((await scan('big.jpg', 1, { size: 26 * 1024 * 1024, head: JPEG })).status).toBe('rejected');
  });

  it('rejects an empty object', async () => {
    expect((await scan('empty.jpg', 1, { size: 0, head: Buffer.alloc(0) })).status).toBe('rejected');
  });

  it('rejects when the REAL size breaks the quota even though the declared size fit', async () => {
    await testPool.query(
      `INSERT INTO tenant_storage_usage (tenant_id, bytes_used) VALUES ($1, $2)
       ON CONFLICT (tenant_id) DO UPDATE SET bytes_used = EXCLUDED.bytes_used`, [tenantId, 10 * 1024 ** 3 - 1000]);
    try {
      expect((await scan('sneaky.jpg', 1, { size: 5_000, head: JPEG })).status).toBe('rejected');
    } finally {
      await testPool.query(`UPDATE tenant_storage_usage SET bytes_used = 0 WHERE tenant_id = $1`, [tenantId]);
    }
  });

  it('promotes a real JPEG with a server-chosen type and credits the REAL size', async () => {
    const before = await usage();
    const after = await scan('yard.jpg', 1, { size: 4_321, head: JPEG });
    expect(after).toEqual({ status: 'ready', file_size_bytes: 4_321 });
    expect(promote).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'image/jpeg');
    expect((await usage()) - before).toBe(4_321);
  });
});
