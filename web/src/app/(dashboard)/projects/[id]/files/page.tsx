'use client';

// Files page — pre-signed upload to quarantine, then triple validation before live storage.
// Locked decisions: A-06, T-05, T-27, T-28, T-29
// Upload flow: request upload URL from API → PUT to quarantine → API enqueues file.scan job
// Files are NOT accessible until scan passes (status = 'ready').

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface FileRecord {
  id: string;
  filename: string;
  status: string; // scanning | ready | rejected
  file_size_bytes: number;
  created_at: string;
  download_url?: string;
}

const STATUS_COLORS: Record<string, string> = {
  scanning: '#d97706',
  ready:    '#16a34a',
  rejected: '#dc2626',
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProjectFilesPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const { t } = useTranslation('projects');
  const statusLabel = (s: string) => t(`files.status.${s}`, { defaultValue: s });
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/files?project_id=${projectId}&limit=100`);
      const data = (await res.json()) as { files?: FileRecord[] };
      setFiles(data.files ?? []);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setUploadProgress(t('files.progress_requesting'));

    try {
      // 1. Request a quarantine pre-signed URL from our API (T-27)
      const initRes = await fetch('/api/files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          filename: file.name,
          content_type: file.type || 'application/octet-stream',
          file_size_bytes: file.size,
        }),
      });

      if (!initRes.ok) {
        const err = (await initRes.json()) as { error?: { message?: string } };
        throw new Error(err.error?.message ?? t('files.err_upload_url'));
      }

      const { upload_url } = (await initRes.json()) as { upload_url: string; file_id: string };

      setUploadProgress(t('files.progress_uploading'));

      // 2. PUT file directly to quarantine storage using pre-signed URL (T-27)
      // The scan job was already enqueued by the API in step 1
      const putRes = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });

      if (!putRes.ok) throw new Error(t('files.err_storage'));

      setUploadProgress(t('files.progress_scanning'));

      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh file list
      await loadFiles();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('files.err_upload'));
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/projects" className="hover:text-ink">{t('files.crumb_projects')}</Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-ink">{t('files.crumb_project')}</Link>
        <span>/</span>
        <Link href={`/projects/${projectId}/documents`} className="hover:text-ink">{t('files.crumb_documents')}</Link>
        <span>/</span>
        <span className="text-ink">{t('files.crumb_files')}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink">{t('files.title')}</h1>
      </div>

      {/* Upload form */}
      <div className="bg-surface rounded-lg border border-line p-5 mb-6">
        <h2 className="text-sm font-semibold text-ink mb-3">{t('files.upload_heading')}</h2>
        <p className="text-xs text-muted mb-4">{t('files.upload_help')}</p>

        <form onSubmit={handleUpload} className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            className="text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-surface-alt file:text-ink hover:file:bg-surface-alt"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.dwg,.dxf,.rvt,.ifc,.mp4,.mov,.avi,.mkv"
          />
          <button
            type="submit"
            disabled={uploading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {uploading ? t('files.uploading') : t('files.upload_button')}
          </button>
        </form>

        {uploadProgress && (
          <p className="text-sm text-brand-600 mt-3">{uploadProgress}</p>
        )}
        {uploadError && (
          <p className="text-sm text-red-600 mt-3">{uploadError}</p>
        )}
      </div>

      {/* File list */}
      {loading ? (
        <p className="text-sm text-muted">{t('files.loading')}</p>
      ) : files.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-lg border border-line">
          <p className="text-muted">{t('files.empty')}</p>
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-alt">
                <th className="text-start px-4 py-3 font-medium text-muted">{t('files.col_filename')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted">{t('files.col_size')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted">{t('files.col_status')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted">{t('files.col_uploaded')}</th>
                <th className="text-start px-4 py-3 font-medium text-muted"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {files.map((f) => (
                <tr key={f.id} className="hover:bg-surface-alt">
                  <td className="px-4 py-3 text-ink max-w-xs truncate">{f.filename}</td>
                  <td className="px-4 py-3 text-muted">{formatBytes(f.file_size_bytes)}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        color: STATUS_COLORS[f.status] ?? '#6b7280',
                        backgroundColor: `${STATUS_COLORS[f.status] ?? '#6b7280'}15`,
                      }}
                    >
                      {statusLabel(f.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{formatDate(f.created_at)}</td>
                  <td className="px-4 py-3">
                    {f.status === 'ready' && f.download_url && (
                      <a
                        href={f.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:text-brand-700 text-xs font-medium"
                      >
                        {t('files.download')}
                      </a>
                    )}
                    {f.status === 'rejected' && (
                      <span className="text-red-500 text-xs">{t('files.status.rejected')}</span>
                    )}
                    {f.status === 'scanning' && (
                      <span className="text-amber-600 text-xs">{t('files.status.scanning')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
