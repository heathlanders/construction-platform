'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MarkAllRead } from '@/components/mark-all-read';
import { resolveNotificationUrl } from '@/lib/notification-url';
import { PageHeader, Badge, EmptyState } from '@/components/ui';

interface Notification {
  id: string;
  title: string;
  body: string;
  category: string;
  read_at: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function NotificationsPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetch('/api/notifications?limit=100')
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications ?? []))
      .catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  const handleClick = async (n: Notification) => {
    if (!n.read_at) {
      fetch(`/api/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {});
      setNotifications((prev) =>
        prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)
      );
    }
    router.push(resolveNotificationUrl(n));
  };

  return (
    <div>
      <PageHeader
        title={t('notifications.title')}
        actions={<MarkAllRead unreadCount={unreadCount} />}
        className="mb-4"
      />

      <p className="text-sm text-muted mb-6">
        <span className="font-medium text-ink">{notifications.length}</span> total
        {' · '}
        <span className="font-medium text-brand-600">{unreadCount}</span> {t('notifications.unread')}
      </p>

      {notifications.length === 0 ? (
        <EmptyState title={t('notifications.empty')} />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => handleClick(n)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  n.read_at
                    ? 'bg-surface border-line hover:bg-surface-alt'
                    : 'bg-brand-50 border-brand-100 hover:bg-brand-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="text-xs text-muted">{formatDate(n.created_at)}</span>
                    {!n.read_at && (
                      <span className="inline-block w-2 h-2 rounded-full bg-brand-500" />
                    )}
                  </div>
                </div>
                <div className="mt-1">
                  <Badge className="bg-status-neutral-bg text-status-neutral capitalize">
                    {n.category.replace('_', ' ')}
                  </Badge>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
