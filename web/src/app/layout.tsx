import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/components/i18n-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import * as Sentry from '@sentry/nextjs';

// Applies the persisted theme before first paint (no flash of the wrong theme).
// Kept in sync after hydration by ThemeProvider.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
  });
}

export const metadata: Metadata = {
  title: 'The Jobsite',
  description: 'The Operating System for Construction',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="bg-app text-ink antialiased">
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
