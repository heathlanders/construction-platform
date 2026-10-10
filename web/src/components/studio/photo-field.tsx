'use client';

// Photo field — capture/choose → re-encode in the browser → studio upload (quarantine + scan).
//
// Re-encoding through a canvas does two jobs: it bakes the EXIF orientation into the pixels (the
// server strips EXIF, which would otherwise leave phone photos sideways) and it drops the metadata
// (home GPS) before the file ever leaves the device. Large photos are downscaled to keep uploads fast.

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldDef, PhotoDto } from './types';
import { apiError } from './types';

const MAX_SIDE = 2400;

async function reencode(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.85));
}

interface Props {
  field: FieldDef;
  value: string[];
  photos: PhotoDto[];
  uploadUrl: string; // POST endpoint for the presigned upload
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function PhotoField({ field, value, photos, uploadUrl, onChange, disabled }: Props) {
  const { t } = useTranslation('studio');
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [local, setLocal] = useState<Record<string, string>>({}); // file id → object URL preview
  const max = field.max ?? 6;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    setBusy(true);
    const ids = [...value];
    try {
      for (const file of Array.from(files).slice(0, max - ids.length)) {
        if (!/^image\//.test(file.type)) { setError(t('photos.only_jpg_png')); continue; }
        const blob = await reencode(file);
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`, content_type: 'image/jpeg', file_size_bytes: blob.size }),
        });
        if (!res.ok) { setError(await apiError(res, t('photos.failed'))); continue; }
        const up = await res.json();
        const put = await fetch(up.upload_url, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
        if (!put.ok) { setError(t('photos.failed')); continue; }
        ids.push(up.file_id);
        setLocal((m) => ({ ...m, [up.file_id]: URL.createObjectURL(blob) }));
      }
      onChange(ids);
    } catch {
      setError(t('photos.failed'));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  const byId = new Map(photos.map((p) => [p.id, p]));
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-ink">{field.label}</legend>
      {field.help && <p className="text-sm text-muted">{field.help}</p>}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((id) => {
          const p = byId.get(id);
          const src = p?.url ?? local[id];
          return (
            <div key={id} className="relative aspect-square overflow-hidden rounded-md border border-line bg-surface-alt">
              {p?.status === 'rejected' ? (
                <div className="flex h-full items-center justify-center bg-status-danger-bg p-2 text-center text-xs text-status-danger">{t('photos.failed')}</div>
              ) : src ? <img src={src} alt="" className="h-full w-full object-cover" /> : (
                <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted">{t('photos.checking')}</div>
              )}
              {!disabled && (
                <button
                  type="button" onClick={() => onChange(value.filter((x) => x !== id))}
                  className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white" aria-label={t('photos.remove')}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
      {!disabled && value.length < max && (
        <>
          <input ref={input} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          <button
            type="button" disabled={busy} onClick={() => input.current?.click()}
            className="w-full rounded-lg border-2 border-dashed border-line px-4 py-6 text-sm font-medium text-brand-700 hover:border-brand-500 disabled:opacity-50"
          >
            {busy ? t('photos.uploading') : t('photos.take')}
          </button>
        </>
      )}
      {error && <p className="text-sm text-status-danger">{error}</p>}
    </fieldset>
  );
}
