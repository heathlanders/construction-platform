'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  initialConnected: boolean;
  initialRealmId?: string;
}

export function QuickBooksConnectButton({ initialConnected, initialRealmId }: Props) {
  const [connected, setConnected] = useState(initialConnected);
  const [realmId, setRealmId] = useState(initialRealmId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/integrations/quickbooks/connect');
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'Failed to start QuickBooks connection.');
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
      const res = await fetch('/api/integrations/quickbooks/disconnect', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'Failed to disconnect QuickBooks.');
        return;
      }
      setConnected(false);
      setRealmId(undefined);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        {connected ? (
          <>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-success-bg text-status-success">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              QuickBooks Connected
            </span>
            {realmId && (
              <span className="text-xs text-gray-500">Realm: {realmId}</span>
            )}
            <Button
              type="button"
              variant="secondary"
              loading={loading}
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            type="button"
            loading={loading}
            onClick={handleConnect}
          >
            Connect QuickBooks
          </Button>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
