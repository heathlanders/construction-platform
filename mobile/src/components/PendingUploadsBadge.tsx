// PendingUploadsBadge.tsx — header indicator for work captured offline and still
// waiting to upload (task QA photos, project documents, asset inspections / fuel /
// damage reports, trade status changes).
//
// Until now these AsyncStorage queues were completely invisible: a worker who shot
// photos in a basement got one "Saved offline" alert and then had no way to tell
// whether anything was still pending. `ConflictBadge` only covers WatermelonDB
// conflicts, which is a different thing entirely.
//
// Poll-based (not reactive) — AsyncStorage has no change stream, and the queues only
// move on a sync sweep (foreground + every 3 min), so a slow poll is plenty.

import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { totalQueueDepth, listDeadLetters, retryDeadLetters, clearDeadLetters } from '@/lib/offline-queue';
import { runSyncSweep } from '@/lib/sync';

const POLL_MS = 15_000;

export function PendingUploadsBadge() {
  const { t } = useTranslation('common');
  const [count, setCount] = useState(0);
  /** Items the queue GAVE UP on — these need a decision, not just patience. */
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const [n, dead] = await Promise.all([totalQueueDepth(), listDeadLetters()]);
        if (alive) { setCount(n); setFailed(dead.length); }
      } catch {
        // storage unavailable — just don't render
      }
    };
    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const onPress = () => {
    if (failed === 0) { void runSyncSweep(); return; }
    // A dropped item is a dead end unless the worker is told: their capture is
    // still held on the device, but it will never upload on its own.
    Alert.alert(
      t('nav.uploads_failed_title', { count: failed }),
      t('nav.uploads_failed_body'),
      [
        { text: t('nav.uploads_discard'), style: 'destructive',
          onPress: () => { void clearDeadLetters().then(() => setFailed(0)); } },
        { text: t('nav.uploads_retry'),
          onPress: () => { void retryDeadLetters().then(() => { setFailed(0); void runSyncSweep(); }); } },
      ],
    );
  };

  if (count === 0 && failed === 0) return null;

  return (
    <TouchableOpacity
      // Tapping asks for an immediate sweep rather than waiting out the interval —
      // the natural "why is this still stuck?" reaction.
      onPress={onPress}
      style={styles.btn}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={failed > 0
        ? t('nav.uploads_failed_title', { count: failed })
        : t('nav.pending_uploads', { count })}
    >
      <Text style={styles.icon}>{failed > 0 ? '⚠️' : '⬆️'}</Text>
      <View style={[styles.badge, failed > 0 && styles.badgeFailed]}>
        <Text style={styles.badgeText}>{(failed || count) > 9 ? '9+' : (failed || count)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { marginEnd: 2, padding: 6 },
  icon: { fontSize: 18 },
  badge: { position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  // Failed ≠ pending: a different colour so "still working" and "gave up" don't look alike.
  badgeFailed: { backgroundColor: '#dc2626' },
});
