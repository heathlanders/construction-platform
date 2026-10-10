'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface Props {
  initialConnected: boolean;
}

export function AdpConnectButton({ initialConnected }: Props) {
  const { t } = useTranslation('payroll');
  const [connected, setConnected] = useState(initialConnected);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [syncMsg, setSyncMsg] = useState('');

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/integrations/adp/connect');
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'Failed to start ADP connection.');
        return;
      }
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/integrations/adp/disconnect', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'Failed to disconnect ADP.');
        return;
      }
      setConnected(false);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    setError('');
    try {
      const res = await fetch('/api/integrations/adp/sync-workers', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? t('payroll.integrations.sync_error'));
        return;
      }
      setSyncMsg(
        t('payroll.integrations.sync_success', {
          matched: data.matched ?? 0,
          unmatched: data.unmatched?.length ?? 0,
        }),
      );
    } catch {
      setError(t('payroll.integrations.sync_error'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap">
        {connected ? (
          <>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-success-bg text-status-success">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {t('payroll.integrations.adp.connected')}
            </span>
            <Button type="button" variant="secondary" loading={syncing} onClick={handleSync}>
              {syncing ? t('payroll.integrations.syncing') : t('payroll.integrations.sync_workers')}
            </Button>
            <Button type="button" variant="secondary" loading={loading} onClick={handleDisconnect}>
              {t('payroll.integrations.adp.disconnect')}
            </Button>
          </>
        ) : (
          <Button type="button" loading={loading} onClick={handleConnect}>
            {t('payroll.integrations.adp.connect')}
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {syncMsg && <p className="mt-2 text-sm text-green-700">{syncMsg}</p>}
    </div>
  );
}
