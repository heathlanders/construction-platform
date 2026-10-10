// lib/changelog.ts — in-app "What's New" release notes in layman's terms.
// Single source of truth for the current app version + per-version notes (EN/ES).
// The popup shows after login when the latest version hasn't been seen by this user AND
// update messages aren't disabled (preferences.hideUpdateMessages). Per-user "last seen"
// version lives at AsyncStorage `whatsnew:lastSeen:{user_id}` (mirrors the prefs:* / sync:* convention).
//
// To ship release notes: prepend a new entry to CHANGELOG (newest FIRST) and bump app.json `version`
// to match. Notes are plain, jargon-free sentences — no internal feature names. Both EN and ES required.

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChangelogEntry {
  version: string; // must match app.json "version" when bumped, e.g. '1.0.0'
  date: string; // ISO date — display only
  en: string[]; // layman bullets, English
  es: string[]; // layman bullets, Spanish
}

// Newest FIRST. CHANGELOG[0] is the current release shown after login.
export const CHANGELOG: ChangelogEntry[] = [
  {
    // Native release (new app version 1.2.0 — requires installing the updated app; adds the
    // MapLibre map module). OTA cannot cross this boundary — reinstall from get.thejobsite.app.
    version: '1.2.0',
    date: '2026-07-17',
    en: [
      'New Map: see your job sites near you, sorted by distance, with one-tap directions.',
      'Get directions to any project right from its detail page.',
      'Optional: share your location when you clock in so the office can see who is on which site.',
    ],
    es: [
      'Nuevo Mapa: vea sus obras cercanas, ordenadas por distancia, con direcciones de un toque.',
      'Obtenga direcciones a cualquier proyecto desde su página de detalle.',
      'Opcional: comparta su ubicación al fichar para que la oficina vea quién está en cada obra.',
    ],
  },
  {
    // Native release (new app version 1.1.0 — requires installing the updated app).
    version: '1.1.0',
    date: '2026-06-30',
    en: [
      'Attach PDFs and Office files (Word, Excel) to a project, not just photos.',
      'Add photos to an equipment damage report — they upload with the report.',
    ],
    es: [
      'Adjunta archivos PDF y de Office (Word, Excel) a un proyecto, no solo fotos.',
      'Agrega fotos a un reporte de daños de equipo — se suben junto con el reporte.',
    ],
  },
  {
    // OTA changelog marker — these shipped over-the-air on app version 1.0.0 (runtimeVersion
    // unchanged, so current installs receive them). The version string here only drives the
    // What's New popup; it does NOT need to match app.json until a native (new-runtime) release.
    version: '1.0.1',
    date: '2026-06-30',
    en: [
      'Choose which alerts you get — and how (push, email, or text) — under Notifications in Settings.',
      'Take task photos with no signal — they upload automatically once you are back online.',
      'Update your name in Settings.',
      'Managers can refresh a task’s step-by-step work instructions with one tap.',
    ],
    es: [
      'Elige qué avisos recibes — y cómo (push, correo o mensaje) — en Notificaciones dentro de Configuración.',
      'Toma fotos de una tarea sin señal — se suben solas cuando vuelves a tener conexión.',
      'Actualiza tu nombre en Configuración.',
      'Los gerentes pueden actualizar las instrucciones paso a paso de una tarea con un toque.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-06-29',
    en: [
      'Your home screen now shows only the buttons your job needs — less clutter.',
      'Dark mode is here. Switch it on in Settings.',
      'Change the app between English and Spanish anytime in Settings.',
      'Clock in and out and send your weekly timecard right from your phone.',
      'Add photos to a task to show the work is done.',
    ],
    es: [
      'Tu pantalla de inicio ahora muestra solo los botones que tu trabajo necesita — menos desorden.',
      'Llegó el modo oscuro. Actívalo en Configuración.',
      'Cambia la app entre inglés y español cuando quieras en Configuración.',
      'Marca entrada y salida y envía tu parte de horas semanal desde tu teléfono.',
      'Agrega fotos a una tarea para mostrar que el trabajo está hecho.',
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0].version;

export function latestEntry(): ChangelogEntry {
  return CHANGELOG[0];
}

/** Bullets for the active UI locale (falls back to English). */
export function bulletsFor(entry: ChangelogEntry, language: string | undefined): string[] {
  return language === 'es' ? entry.es : entry.en;
}

const SEEN_KEY = (userId: string): string => `whatsnew:lastSeen:${userId}`;

export async function getLastSeenVersion(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SEEN_KEY(userId));
  } catch {
    return null;
  }
}

export async function setLastSeenVersion(
  userId: string,
  version: string = CURRENT_VERSION,
): Promise<void> {
  try {
    await AsyncStorage.setItem(SEEN_KEY(userId), version);
  } catch {
    /* non-fatal — popup will just show again next launch */
  }
}
