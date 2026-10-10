'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { t } = useTranslation('common');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-700">
          {t('auth.reset_invalid_token')}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwords_no_match'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({})) as { error?: { message?: string } };

      if (!res.ok) {
        const code = (data as { error?: { code?: string; message?: string } })?.error?.code;
        if (code === 'INVALID_TOKEN') {
          setError(t('auth.reset_invalid_token'));
        } else {
          setError(data?.error?.message ?? t('auth.login_error_generic'));
        }
        setLoading(false);
        return;
      }

      setDone(true);
      // Redirect to login after a brief delay
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError(t('auth.login_error_generic'));
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 p-4">
        <p className="text-sm font-medium text-green-800">{t('auth.password_reset_success')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="New password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
        minLength={8}
        autoComplete="new-password"
      />
      <Input
        label="Confirm new password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••••"
        required
        minLength={8}
        autoComplete="new-password"
      />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {loading ? t('auth.setting_password') : t('auth.set_password_button')}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ConstructionOS</h1>
          <p className="mt-1 text-sm text-gray-500">{t('common.app_tagline')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('auth.set_new_password')}</h2>
          <p className="text-sm text-gray-500 mb-6">
            {t('auth.set_new_password_hint')}
          </p>
          <Suspense fallback={<div className="text-sm text-gray-500">{t('common.loading')}</div>}>
            <ResetPasswordForm />
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
