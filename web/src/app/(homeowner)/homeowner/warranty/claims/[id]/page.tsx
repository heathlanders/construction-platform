'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface HomeownerClaim {
  id: string;
  claim_number: string;
  title: string;
  description: string;
  trade_category: string;
  status: string;
  reported_date: string;
  resolution_notes: string | null;
}

interface Attachment {
  id: string;
  file_name: string;
  url: string;
  created_at: string;
}

// Simplified status steps visible to homeowner
const STATUS_STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'repair_scheduled', label: 'Repair Scheduled' },
  { key: 'repair_complete', label: 'Repair Complete' },
  { key: 'closed', label: 'Closed' },
];

const IN_PROGRESS_STATUSES = ['under_review', 'sub_notified', 'sub_accepted', 'sub_disputed'];
const REPAIR_SCHEDULED_STATUSES = ['repair_scheduled'];
const REPAIR_COMPLETE_STATUSES = ['repair_complete'];
const CLOSED_STATUSES = ['closed', 'denied'];

function getStepIndex(status: string): number {
  if (status === 'submitted') return 0;
  if (IN_PROGRESS_STATUSES.includes(status)) return 1;
  if (REPAIR_SCHEDULED_STATUSES.includes(status)) return 2;
  if (REPAIR_COMPLETE_STATUSES.includes(status)) return 3;
  if (CLOSED_STATUSES.includes(status)) return 4;
  return 0;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function HomeownerClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('warranties');
  const [claim, setClaim] = useState<HomeownerClaim | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/homeowner/warranty/claims/${id}`).then(r => r.json()),
      fetch(`/api/homeowner/warranty/claims/${id}/attachments`).then(r => r.json()),
    ])
      .then(([cd, ad]) => {
        if (cd.claim) setClaim(cd.claim as HomeownerClaim);
        if (ad.attachments) setAttachments(ad.attachments as Attachment[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!claim) return <div className="text-center py-16 text-gray-400">{t('errors.load_failed')}</div>;

  const currentStep = getStepIndex(claim.status);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/homeowner/warranty" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          {t('homeowner.back_to_warranty')}
        </Link>
        <p className="text-xs font-mono text-gray-400 mb-1">{claim.claim_number}</p>
        <h1 className="text-2xl font-bold text-gray-900">{claim.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('col.reported_date')}: {formatDate(claim.reported_date)}</p>
      </div>

      {/* Status stepper */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-6">{t('homeowner.claim_status')}</h2>
        <div className="flex items-center">
          {STATUS_STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                  i < currentStep ? 'bg-blue-600 border-blue-600 text-white' :
                  i === currentStep ? 'border-blue-600 text-blue-600 bg-white' :
                  'border-gray-300 text-gray-300 bg-white'
                }`}>
                  {i < currentStep ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (i + 1)}
                </div>
                <p className={`text-xs mt-2 text-center w-16 ${i <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </p>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">{t('col.description')}</h2>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{claim.description}</p>
        <p className="text-xs text-gray-400 mt-3">{t(`trade_category.${claim.trade_category}`)}</p>
      </div>

      {/* Builder notes */}
      {claim.resolution_notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-3">{t('homeowner.gc_response')}</h2>
          <p className="text-sm text-blue-900 whitespace-pre-wrap">{claim.resolution_notes}</p>
        </div>
      )}

      {/* Attachments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('claim_detail.attachments')}</h2>
          <button className="text-sm text-blue-600 hover:underline">{t('homeowner.upload_more')}</button>
        </div>
        {attachments.length === 0 ? (
          <p className="text-sm text-gray-400">{t('claim_detail.no_attachments')}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {attachments.map(att => (
              <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="block rounded-lg bg-gray-100 aspect-square overflow-hidden hover:opacity-80">
                {att.url.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                  <img src={att.url} alt={att.file_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-gray-500 p-2 text-center">{att.file_name}</div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
