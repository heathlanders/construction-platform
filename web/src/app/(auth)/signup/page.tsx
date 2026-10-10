'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

export default function SignupPage() {
  const router = useRouter();
  const { t } = useTranslation('common');

  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value);
    setCompanySlug(toSlug(value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          company_slug: companySlug,
          first_name: firstName,
          last_name: lastName,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const code = data?.error?.code;
        if (code === 'SLUG_TAKEN') {
          setError(t('auth.login_error_slug_taken'));
        } else if (code === 'VALIDATION_ERROR') {
          const firstField = data?.error?.fields?.[0];
          setError(firstField?.message ?? t('auth.login_error_validation'));
        } else {
          setError(data?.error?.message ?? t('auth.login_error_generic'));
        }
        setLoading(false);
        return;
      }

      router.push('/projects');
      router.refresh();
    } catch {
      setError(t('auth.login_error_generic'));
      setLoading(false);
    }
  };

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
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('auth.start_trial_title')}</h2>
          <p className="text-sm text-gray-500 mb-6">{t('auth.trial_subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.company_name')}
              type="text"
              value={companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              placeholder="Acme Construction"
              required
              autoComplete="organization"
            />

            <div>
              <Input
                label={t('auth.tenant_slug')}
                type="text"
                value={companySlug}
                onChange={(e) => setCompanySlug(e.target.value)}
                placeholder="acme-construction"
                required
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-gray-400">
                {t('auth.slug_hint')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('auth.first_name')}
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                required
                autoComplete="given-name"
              />
              <Input
                label={t('auth.last_name')}
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                required
                autoComplete="family-name"
              />
            </div>

            <Input
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />

            <Input
              label={t('auth.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? t('auth.signing_up') : t('auth.start_trial_button')}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          {t('auth.already_have_account')}{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            {t('auth.sign_in_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}
