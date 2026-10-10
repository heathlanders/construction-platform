// T-07: JWT stored in SecureStore only — never AsyncStorage.
// AsyncStorage is unencrypted on-device; SecureStore uses iOS Keychain / Android Keystore.

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'platform_token';
const USER_KEY = 'platform_user';

export interface StoredUser {
  user_id: string;
  tenant_id: string;
  role: string;
  email: string;
  first_name: string;
  last_name: string;
  preferred_language: string;
  exp: number;
}

// Hermes (React Native) has no global `atob`, so decode base64 ourselves.
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decodeBase64(input: string): string {
  const str = input.replace(/=+$/, '');
  let output = '';
  let bc = 0;
  let bs = 0;
  for (let i = 0; i < str.length; i++) {
    const idx = B64_CHARS.indexOf(str.charAt(i));
    if (idx === -1) continue;
    bs = bc % 4 ? bs * 64 + idx : idx;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
}

function parseJwt(token: string): Record<string, unknown> {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    decodeBase64(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload) as Record<string, unknown>;
}

export async function storeAuth(token: string): Promise<void> {
  const payload = parseJwt(token) as unknown as StoredUser;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(payload));
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getUser(): Promise<StoredUser | null> {
  // SecureStore.getItemAsync can THROW (not just return null) when the encrypted blob can't be
  // decrypted — e.g. a stale Android Keystore key after a reinstall, or a corrupt value. Treat any
  // such failure as logged-out (clear + return null) so the app never hangs on it.
  let raw: string | null;
  try {
    raw = await SecureStore.getItemAsync(USER_KEY);
  } catch (e) {
    console.warn('[auth] getUser: SecureStore read failed; clearing', e);
    await clearAuth().catch(() => {});
    return null;
  }
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as StoredUser;
    // Mobile tokens have 30-day expiry (A-05). Clear on expiry.
    if (Date.now() / 1000 > user.exp) {
      await clearAuth();
      return null;
    }
    return user;
  } catch (e) {
    console.warn('[auth] getUser: corrupt stored user; clearing', e);
    await clearAuth().catch(() => {});
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}
