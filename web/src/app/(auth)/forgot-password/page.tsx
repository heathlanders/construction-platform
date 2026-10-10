'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [tenantSlug, setTenantSlug] = useState(searchParams.get('company') ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tenant_slug: tenantSlug }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: { message?: string } };
        setError(data?.error?.message ?? t('auth.login_error_generic'));
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError(t('auth.login_error_generic'));
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 p-4">
        <p className="text-sm font-medium text-green-800">{t('auth.check_email')}</p>
        <p className="text-sm text-green-700 mt-1">
          If an account exists for <strong>{email}</strong> at <strong>{tenantSlug}</strong>, you
          will receive a password reset link shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('auth.tenant_slug')}
        type="text"
        value={tenantSlug}
        onChange={(e) => setTenantSlug(e.target.value)}
        placeholder="your-company"
        required
        autoComplete="organization"
      />
      <Input
        label={t('auth.email')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        required
        autoComplete="email"
      />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {loading ? t('auth.sending') : t('auth.send_reset_link')}
      </Button>
    </form>
  );
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ConstructionOS</h1>
          <p className="mt-1 text-sm text-gray-500">{t('common.app_tagline')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('auth.reset_your_password')}</h2>
          <p className="text-sm text-gray-500 mb-6">
            {t('auth.reset_instructions')}
          </p>
          <Suspense fallback={<div className="text-sm text-gray-500">{t('common.loading')}</div>}>
            <ForgotPasswordForm />
          </Suspense>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            {t('auth.back_to_login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
