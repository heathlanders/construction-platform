'use client';

// Super-admin account settings — change password. Guarded by the (admin) layout.
import { useState, FormEvent } from 'react';

export default function AdminAccountPage() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setDone(false);
    if (next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      if (res.ok) {
        setDone(true);
        setCurrent(''); setNext(''); setConfirm('');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.message ?? 'Could not change password.');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = 'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900';

  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Account</h1>
      <p className="text-sm text-gray-500 mb-6">Change your super-admin password.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="current" className="block text-sm font-medium text-gray-700">Current password</label>
          <input id="current" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="next" className="block text-sm font-medium text-gray-700">New password</label>
          <input id="next" type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">Confirm new password</label>
          <input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {done && <p className="text-sm text-green-600">Password updated.</p>}

        <button type="submit" disabled={loading} className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
          {loading ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
