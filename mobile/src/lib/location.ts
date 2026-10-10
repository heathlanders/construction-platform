// lib/location.ts — best-effort device GPS capture for clock-in (Doc 20 Phase 6a / OQ-17
// additive half). Capture ONLY — permission denied, GPS off, or timeout resolves null and the
// punch proceeds without coords (never blocks). expo-location is already linked in the 1.1.0 APK
// (asset fuel-log GPS), so this is OTA-shippable.

import * as Location from 'expo-location';

export interface PunchLocation {
  clock_in_lat: number;
  clock_in_lng: number;
}

const TIMEOUT_MS = 4000;

export async function capturePunchLocation(): Promise<PunchLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ]);
    if (!pos) return null;
    return { clock_in_lat: pos.coords.latitude, clock_in_lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
