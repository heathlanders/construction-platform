'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface CoverageItem {
  id: string;
  coverage_tier: string;
  description: string;
  expiry_date: string | null;
}

interface HomeownerWarranty {
  id: string;
  title: string;
  coverage_items: CoverageItem[];
}

const TRADE_CATEGORIES = ['general', 'electrical', 'plumbing', 'hvac', 'structural', 'framing', 'roofing', 'other'];

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function NewHomeownerClaimPage() {
  const { t } = useTranslation('warranties');
  const router = useRouter();
  const [warranty, setWarranty] = useState<HomeownerWarranty | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    trade_category: 'general',
    coverage_item_id: '',
  });
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/homeowner/warranty')
      .then(r => r.json())
      .then(d => { if (d.warranty) setWarranty(d.warranty as HomeownerWarranty); })
      .catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setPhotoFiles(files);
  };

  const submit = async () => {
    if (!form.title || !form.description) return;
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/homeowner/warranty/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          trade_category: form.trade_category,
          coverage_item_id: form.coverage_item_id || null,
          reported_date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data?.error?.message ?? t('homeowner.submit_error'));
        return;
      }
      router.replace('/homeowner/warranty');
    } catch { setError(t('homeowner.submit_error')); } finally { setSubmitting(false); }
  };

  return (
    <div>
      <Link href="/homeowner/warranty" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        {t('homeowner.back_to_warranty')}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('homeowner.form_title')}</h1>
      <p className="text-gray-500 text-sm mb-8">{t('homeowner.form_description')}</p>

      {error && <div className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-5">{error}</div>}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.claim_title')}</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.claim_description')}</label>
          <textarea
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Describe the issue in detail…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('col.trade_category')}</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.trade_category}
            onChange={e => setForm(f => ({ ...f, trade_category: e.target.value }))}
          >
            {TRADE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{t(`trade_category.${cat}`)}</option>
            ))}
          </select>
        </div>

        {warranty && warranty.coverage_items.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.coverage_item')}</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.coverage_item_id}
              onChange={e => setForm(f => ({ ...f, coverage_item_id: e.target.value }))}
            >
              <option value="">{t('homeowner.select_coverage')}</option>
              {warranty.coverage_items.map(ci => (
                <option key={ci.id} value={ci.id}>
                  {ci.description}
                  {ci.expiry_date ? ` (expires ${formatDate(ci.expiry_date)})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.photos')}</label>
          <p className="text-xs text-gray-500 mb-2">{t('homeowner.max_photos')}</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {photoFiles.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">{photoFiles.length} photo(s) selected</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={submit}
            disabled={submitting || !form.title || !form.description}
            className="flex-1 text-sm py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? t('homeowner.submitting') : t('homeowner.submit')}
          </button>
          <Link
            href="/homeowner/warranty"
            className="px-6 py-3 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 text-center"
          >
            {t('form.cancel')}
          </Link>
        </div>
      </div>
    </div>
  );
}
