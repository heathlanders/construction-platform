'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { resolveNotificationUrl } from '@/lib/notification-url';
import { useTheme, type ThemeMode } from '@/components/theme/theme-provider';
import { useRealtime } from '@/components/realtime/realtime-provider';

const THEME_CYCLE: ThemeMode[] = ['system', 'light', 'dark'];
const THEME_GLYPH: Record<ThemeMode, string> = { system: '🖥', light: '☀', dark: '☾' };

interface TopNavProps {
  userName: string;
  tenantName?: string;
  role: string;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  category: string;
  read_at: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function TopNav({ userName, tenantName, role }: TopNavProps) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { theme, setTheme } = useTheme();
  const cycleTheme = () => setTheme(THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const refetchUnread = useCallback(() => {
    fetch('/api/notifications/unread-count')
      .then((r) => r.json())
      .then((d) => { if (typeof d.unread_count === 'number') setUnreadCount(d.unread_count); })
      .catch(() => {});
  }, []);

  useEffect(() => { refetchUnread(); }, [refetchUnread]);

  // Live bell: a counterparty shared event just fired (RealtimeProvider). The in-app
  // notification row is written async by the worker — debounce before refetching.
  const { eventTick } = useRealtime();
  useEffect(() => {
    if (eventTick === 0) return;
    const timer = setTimeout(() => {
      refetchUnread();
      if (dropdownOpen) void fetchNotificationsRef.current?.();
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTick]);

  useEffect(() => {
    fetch('/api/billing/subscription')
      .then((r) => r.json())
      .then((d) => {
        if (d?.subscription?.status === 'trial' && d?.subscription?.trial_ends_at) {
          const endsAt = new Date(d.subscription.trial_ends_at);
          const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86_400_000));
          setTrialDaysLeft(daysLeft);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const r = await fetch('/api/notifications?limit=10');
      const d = await r.json();
      setNotifications(d.notifications ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingNotifs(false);
    }
  }, []);
  const fetchNotificationsRef = useRef(fetchNotifications);
  fetchNotificationsRef.current = fetchNotifications;

  const toggleDropdown = () => {
    if (!dropdownOpen) fetchNotifications();
    setDropdownOpen((v) => !v);
  };

  const handleNotificationClick = async (n: Notification) => {
    setDropdownOpen(false);
    if (!n.read_at) {
      fetch(`/api/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {});
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
    }
    router.push(resolveNotificationUrl(n));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {trialDaysLeft !== null && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-6 py-2 flex items-center justify-between text-sm">
          <span className="text-amber-800 dark:text-amber-300">
            {t('trial.days_left', { count: trialDaysLeft })}
          </span>
          <Link href="/settings/billing" className="text-amber-700 dark:text-amber-400 font-medium hover:text-amber-900 dark:hover:text-amber-200 underline underline-offset-2">
            {t('trial.upgrade_now')}
          </Link>
        </div>
      )}
      <header className="h-16 bg-surface border-b border-line flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-sm text-muted">
          {tenantName && <span className="font-medium text-ink">{tenantName}</span>}
        </div>

        <div className="flex items-center gap-4">
          {/* Theme toggle — cycles system → light → dark */}
          <button
            onClick={cycleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-md text-base text-muted hover:bg-surface-alt hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label={`Theme: ${theme}. Click to change.`}
            title={`Theme: ${theme}`}
          >
            <span aria-hidden="true">{THEME_GLYPH[theme]}</span>
          </button>

          {/* Notification bell with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="relative text-muted hover:text-ink transition-colors"
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute end-0 top-8 z-50 w-96 rounded-lg border border-line bg-surface shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <span className="text-sm font-semibold text-ink">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifs ? (
                    <div className="px-4 py-6 text-center text-sm text-muted">Loading…</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full text-left px-4 py-3 border-b border-line last:border-b-0 transition-colors ${
                          n.read_at ? 'hover:bg-surface-alt' : 'bg-brand-500/10 hover:bg-brand-500/20'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read_at && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                          )}
                          {n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{n.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p>
                          </div>
                          <span className="shrink-0 text-xs text-muted">{timeAgo(n.created_at)}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-line px-4 py-2 text-center">
                  <Link
                    href="/notifications"
                    onClick={() => setDropdownOpen(false)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="text-sm">
            <Link href="/settings" className="text-ink font-medium hover:text-brand-600">
              {userName}
            </Link>
            <span className="ml-2 text-muted text-xs capitalize">{role.replace('_', ' ')}</span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm text-muted hover:text-ink disabled:opacity-50"
          >
            {loggingOut ? t('auth.signing_out') : t('auth.sign_out')}
          </button>
        </div>
      </header>
    </>
  );
}
