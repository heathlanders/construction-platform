'use client';

import { useEffect } from 'react';
import i18n from '@/lib/i18n';

const SUPPORTED_LANGS = ['en', 'es'];

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Gap 1: Keep document.documentElement.lang in sync with i18n language (SEO + a11y)
  useEffect(() => {
    const update = () => {
      document.documentElement.lang = i18n.language ?? 'en';
    };
    i18n.on('languageChanged', update);
    update(); // apply current language on mount
    return () => {
      i18n.off('languageChanged', update);
    };
  }, []);

  // Gap 2: T-09 locale resolution — JWT preferred_language → localStorage → browser → 'en'
  useEffect(() => {
    async function resolveLocale() {
      // First: check JWT preferred_language via /api/users/me
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          // GET /v1/users/me returns the user FLAT ({ language_preference, … }); older callers wrapped it in
          // { user }. Reading only `data.user` meant a saved language was never applied.
          const data = await res.json() as { language_preference?: string; user?: { language_preference?: string } };
          const jwtLang = data.user?.language_preference ?? data.language_preference;
          if (jwtLang && SUPPORTED_LANGS.includes(jwtLang)) {
            localStorage.setItem('lang', jwtLang);
            void i18n.changeLanguage(jwtLang);
            return;
          }
        }
      } catch {
        // network error — fall through to localStorage
      }

      // Second: localStorage (set by language switcher)
      const stored = localStorage.getItem('lang');
      if (stored && SUPPORTED_LANGS.includes(stored)) {
        void i18n.changeLanguage(stored);
        return;
      }

      // Third: browser locale
      const browser = navigator.language.split('-')[0];
      if (SUPPORTED_LANGS.includes(browser)) {
        void i18n.changeLanguage(browser);
        return;
      }

      // Fallback: English
      void i18n.changeLanguage('en');
    }
    void resolveLocale();
  }, []);

  return <>{children}</>;
}
