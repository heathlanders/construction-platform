'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface Props {
  unreadCount: number;
}

export function MarkAllRead({ unreadCount }: Props) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);

  if (unreadCount === 0) return null;

  async function markAll() {
    setLoading(true);
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={markAll}
      disabled={loading}
      className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
    >
      {loading ? t('notifications_page.marking') : t('notifications_page.mark_all_read')}
    </button>
  );
}
