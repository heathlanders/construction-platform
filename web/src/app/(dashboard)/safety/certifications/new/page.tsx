'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, Select } from '@/components/ui';

const CERT_TYPES = [
  'OSHA 10',
  'OSHA 30',
  'First Aid / CPR',
  'Forklift Operator',
  'Scaffolding',
  'Confined Space Entry',
  'Fall Protection',
  'Hazmat / HAZWOPER',
  'Electrical Safety',
  'Other',
];

interface User { id: string; first_name: string; last_name: string; email: string }

export default function NewCertificationPage() {
  const router = useRouter();
  const { t } = useTranslation('safety');

  const [userId, setUserId] = useState('');
  const [certType, setCertType] = useState('');
  const [customCertType, setCustomCertType] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [noExpiry, setNoExpiry] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users?limit=100')
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalCertType = certType === 'Other' ? customCertType.trim() : certType;
    if (!userId) { setError(t('certifications.worker_required')); return; }
    if (!finalCertType) { setError(t('certifications.cert_type_required')); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/safety-certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          cert_type: finalCertType,
          issued_at: issuedAt || null,
          expires_at: noExpiry ? null : (expiresAt || null),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error?.message ?? t('certifications.failed_to_add'));
        return;
      }
      router.push('/safety/certifications');
    } catch {
      setError(t('certifications.failed_to_add'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/safety" className="hover:text-ink">{t('certifications.back_to_safety')}</Link>
        <span>/</span>
        <Link href="/safety/certifications" className="hover:text-ink">{t('certifications.back_to_certs')}</Link>
        <span>/</span>
        <span className="text-ink">New</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-ink mb-6">{t('certifications.form_title')}</h1>

      {error && (
        <div className="mb-4 rounded-md border border-status-danger/40 bg-status-danger-bg px-4 py-3 text-sm text-status-danger">{error}</div>
      )}

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t('certifications.worker_label')}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          >
            <option value="">{t('certifications.select_worker')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
            ))}
          </Select>

          <Select
            label={t('certifications.cert_type_label')}
            value={certType}
            onChange={(e) => setCertType(e.target.value)}
            required
          >
            <option value="">{t('certifications.select_type')}</option>
            {CERT_TYPES.map((ct) => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </Select>

          {certType === 'Other' && (
            <Input
              label={t('certifications.custom_cert_label')}
              type="text"
              value={customCertType}
              onChange={(e) => setCustomCertType(e.target.value)}
              placeholder={t('certifications.custom_cert_placeholder')}
            />
          )}

          <Input
            label={t('certifications.issue_date_label')}
            type="date"
            value={issuedAt}
            onChange={(e) => setIssuedAt(e.target.value)}
          />

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-ink mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={noExpiry}
                onChange={(e) => setNoExpiry(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              {t('certifications.no_expiry_label')}
            </label>
            {!noExpiry && (
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} size="lg">
              {saving ? t('certifications.saving') : t('certifications.add_cert_button')}
            </Button>
            <Link href="/safety/certifications">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
