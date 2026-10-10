// lib/theme-context.tsx — ThemeProvider + useTheme().
// Resolves the user's persisted theme preference ('system' follows the OS color scheme) to a
// concrete Palette. setMode persists via preferences.ts (keyed by the current user).

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { type Palette, type ThemeMode, type Scheme, paletteFor } from '@/lib/theme';
import { loadPrefs, savePrefs } from '@/lib/preferences';
import { useCurrentUser } from '@/lib/user-context';

interface ThemeCtx {
  palette: Palette;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeCtx>({
  palette: paletteFor('light'),
  mode: 'system',
  setMode: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const os = useColorScheme();
  const { user } = useCurrentUser();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Load the persisted theme preference whenever the signed-in user changes.
  useEffect(() => {
    if (!user) return;
    void loadPrefs(user.user_id).then((p) => setModeState(p.theme));
  }, [user]);

  const setMode = useCallback(
    async (m: ThemeMode) => {
      setModeState(m);
      if (user) await savePrefs(user.user_id, { theme: m });
    },
    [user],
  );

  const scheme: Scheme = mode === 'system' ? (os === 'dark' ? 'dark' : 'light') : mode;
  const palette = paletteFor(scheme);

  return (
    <ThemeContext.Provider value={{ palette, mode, setMode }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}
