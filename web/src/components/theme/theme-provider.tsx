'use client';

// Theme provider — DESIGN.md §2.6. Mirrors mobile theme-context semantics:
// mode = system | light | dark, persisted in localStorage, resolves against the
// OS preference, and toggles the `.dark` class on <html> that the token layer
// (globals.css / tailwind.config.ts) keys off of. A blocking inline script in the
// root layout applies the class before paint (no flash) — this keeps it in sync
// after hydration and on system-preference change.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  resolved: Scheme;
  setTheme: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

const MEDIA = '(prefers-color-scheme: dark)';

function systemScheme(): Scheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia(MEDIA).matches ? 'dark' : 'light';
}

function resolve(mode: ThemeMode): Scheme {
  return mode === 'system' ? systemScheme() : mode;
}

function apply(scheme: Scheme): void {
  document.documentElement.classList.toggle('dark', scheme === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolved, setResolved] = useState<Scheme>('light');

  // Read persisted preference once on mount (client-only).
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore — private mode / disabled storage
    }
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setThemeState(stored);
    }
  }, []);

  // Apply + persist whenever mode changes; follow the OS while in `system`.
  useEffect(() => {
    const r = resolve(theme);
    setResolved(r);
    apply(r);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
    if (theme !== 'system') return;
    const mq = window.matchMedia(MEDIA);
    const onChange = () => {
      const rr = systemScheme();
      setResolved(rr);
      apply(rr);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => setThemeState(mode), []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
