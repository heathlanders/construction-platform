// lib/preferences.ts — per-user UI preferences in AsyncStorage.
// Key: prefs:{user_id}:v1 (mirrors the established sync:* / conflict:* / opt:* convention).
// These are display preferences only — the permission gate (tileManifest) always wins, so a
// hidden tile can never reveal an action the role isn't allowed.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '@/lib/theme';

export interface UserPreferences {
  /** Tile i18n keys the user chose to hide (subset of role-allowed tiles only). */
  hiddenTiles: string[];
  language: 'en' | 'es';
  theme: ThemeMode;
  /** When true, suppress the "What's New" popup shown after login (changelog.ts). */
  hideUpdateMessages: boolean;
}

export const DEFAULT_PREFS: UserPreferences = {
  hiddenTiles: [],
  language: 'en',
  theme: 'system',
  hideUpdateMessages: false,
};

const KEY = (userId: string): string => `prefs:${userId}:v1`;

export async function loadPrefs(userId: string): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY(userId));
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<UserPreferences>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function savePrefs(
  userId: string,
  patch: Partial<UserPreferences>,
): Promise<UserPreferences> {
  const current = await loadPrefs(userId);
  const next: UserPreferences = { ...current, ...patch };
  await AsyncStorage.setItem(KEY(userId), JSON.stringify(next));
  return next;
}
