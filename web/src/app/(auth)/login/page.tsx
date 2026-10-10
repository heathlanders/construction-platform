'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/projects';
  const { t } = useTranslation('common');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tenant_slug: tenantSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        const code = data?.error?.code;
        if (code === 'INVALID_CREDENTIALS') {
          setError(t('auth.login_error_invalid'));
        } else if (code === 'TENANT_SUSPENDED') {
          setError(t('auth.login_error_suspended'));
        } else {
          setError(data?.error?.message ?? t('auth.login_error_generic'));
        }
        setLoading(false);
        return;
      }

      // client_portal users go to portal, others go to their intended destination
      const destination = data.role === 'client_portal' ? '/portal' : from;
      router.push(destination);
      router.refresh();
    } catch {
      setError(t('auth.login_error_generic'));
      setLoading(false);
    }
  };

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
      <div>
        <Input
          label={t('auth.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
        <div className="mt-1 text-right">
          <Link
            href={`/forgot-password${tenantSlug ? `?company=${encodeURIComponent(tenantSlug)}` : ''}`}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {t('auth.forgot_password')}
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {loading ? t('auth.signing_in') : t('auth.login')}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ConstructionOS</h1>
          <p className="mt-1 text-sm text-gray-500">{t('common.app_tagline')}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('auth.sign_in_to_account')}</h2>
          <Suspense fallback={<div className="text-sm text-gray-500">{t('common.loading')}</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          {t('auth.no_account')}{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
            {t('auth.start_free_trial')}
          </Link>
        </p>
      </div>
    </div>
  );
}
