// lib/user-context.tsx — app-wide current-user/role context.
// Loads the stored JWT user once (getUser reads SecureStore) and exposes it synchronously
// so manifest-driven tile/header filtering renders without a flash of un-gated UI.
// Call refresh() after login / logout / language change.

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getUser, type StoredUser } from '@/lib/auth';
import { loadPrefs } from '@/lib/preferences';
import { applyLanguage } from '@/lib/i18n';

interface CurrentUserCtx {
  user: StoredUser | null;
  role: string | undefined; // lowercase JWT role
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<CurrentUserCtx>({
  user: null,
  role: undefined,
  loading: true,
  refresh: async () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // Must ALWAYS clear `loading` — a throw here (e.g. SecureStore decrypt failing after a
    // reinstall, or a corrupt prefs read) used to leave the app stuck on the startup spinner
    // forever. Treat any failure as logged-out and fall through to the login screen.
    try {
      const u = await getUser();
      setUser(u);
      // Resolve UI language: saved preference → JWT preferred_language → 'en' (T-09).
      if (u) {
        const prefs = await loadPrefs(u.user_id);
        applyLanguage(prefs.language ?? u.preferred_language);
      }
    } catch (e) {
      console.warn('[RoleProvider] refresh failed; treating as logged-out', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ user, role: user?.role, loading, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCurrentUser(): CurrentUserCtx {
  return useContext(Ctx);
}
