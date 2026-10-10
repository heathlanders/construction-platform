// MyTimecardScreen.tsx — worker's own weekly timecard (open + submit).
//
// Mirrors web /timecards/my. Field workers open the current ISO week (auto-sums
// their time_entries → total + overtime) and submit it for OWNER/PM approval.
// Approve/reject stay web-only (office roles). API-only / online — timecards are
// not part of the offline WatermelonDB set (Enterprise Plan §B1).
// FSM (T-60): draft → submitted → approved/rejected. Submit is one-way from the field.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mobileApi } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { StatusBadge } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Timecard'>;

type TimecardStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

interface Timecard {
  id: string;
  user_id: string;
  week_start: string;
  status: TimecardStatus;
  total_hours: number | string;
  overtime_hours: number | string;
  rejection_note: string | null;
  version: number;
}

interface TimecardsResponse {
  timecards: Timecard[];
}

/** Monday of the current ISO week, as YYYY-MM-DD. */
function currentMondayISO(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

function weekKey(c: Timecard): string {
  return String(c.week_start).slice(0, 10);
}

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MyTimecardScreen(_: Props) {
  const { t } = useTranslation('field');
  const { t: tc } = useTranslation('common');
  const { palette } = useTheme();

  const [cards, setCards] = useState<Timecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);

  const monday = currentMondayISO();

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const user = await getUser();
      if (!user) throw new Error(tc('error'));
      const res = await mobileApi<TimecardsResponse>(`/timecards?user_id=${user.user_id}&limit=50`);
      setCards(res.timecards ?? []);
    } catch (err) {
      if (!quiet) Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tc]);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); void load(true); };

  // Active (non-rejected) card for the current week, plus any rejected one.
  const currentActive = cards.find((c) => weekKey(c) === monday && c.status !== 'rejected') ?? null;
  const currentRejected = cards.find((c) => weekKey(c) === monday && c.status === 'rejected') ?? null;

  const openWeek = async () => {
    setActing(true);
    try {
      await mobileApi<{ timecard: Timecard }>('/timecards', {
        method: 'POST',
        body: JSON.stringify({ week_start: monday }),
      });
      await load(true);
    } catch (err) {
      Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error'));
    } finally {
      setActing(false);
    }
  };

  const submitCard = (card: Timecard) => {
    Alert.alert(t('timecards.title'), t('timecards.confirm_submit'), [
      { text: tc('cancel'), style: 'cancel' },
      {
        text: t('timecards.submit'),
        onPress: async () => {
          setActing(true);
          try {
            await mobileApi(`/timecards/${card.id}/submit`, { method: 'POST', body: JSON.stringify({ version: card.version }) });
            Alert.alert('', t('timecards.submitted_ok'));
            await load(true);
          } catch (err) {
            Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error'));
          } finally {
            setActing(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={[styles.centered, { backgroundColor: palette.background }]}><ActivityIndicator size="large" color={palette.accent} /></View>;
  }

  const renderBadge = (status: TimecardStatus) => (
    <StatusBadge status={status} label={t(`timecards.status.${status}`)} />
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── Current week card ── */}
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: palette.textMuted }]}>{t('timecards.this_week')}</Text>
          {currentActive && renderBadge(currentActive.status)}
        </View>
        <Text style={[styles.weekOf, { color: palette.text }]}>{t('timecards.week_of', { date: fmtDate(monday) })}</Text>

        {currentActive ? (
          <>
            <View style={styles.hoursRow}>
              <View style={[styles.hoursCol, { backgroundColor: palette.surfaceAlt }]}>
                <Text style={[styles.hoursValue, { color: palette.text }]}>{Number(currentActive.total_hours).toFixed(2)}</Text>
                <Text style={[styles.hoursLabel, { color: palette.textMuted }]}>{t('timecards.total_hours')}</Text>
              </View>
              <View style={[styles.hoursCol, { backgroundColor: palette.surfaceAlt }]}>
                <Text style={[styles.hoursValue, { color: palette.text }]}>{Number(currentActive.overtime_hours).toFixed(2)}</Text>
                <Text style={[styles.hoursLabel, { color: palette.textMuted }]}>{t('timecards.overtime_hours')}</Text>
              </View>
            </View>

            {currentActive.status === 'draft' && (
              acting
                ? <ActivityIndicator style={styles.spinner} color={palette.accent} />
                : (
                  <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: palette.accent }]} onPress={() => submitCard(currentActive)} disabled={acting}>
                    <Text style={styles.primaryBtnText}>{t('timecards.submit')}</Text>
                  </TouchableOpacity>
                )
            )}
            {currentActive.status === 'submitted' && <Text style={[styles.note, { color: STATUS.warning.fg }]}>{t('timecards.submitted_note')}</Text>}
            {currentActive.status === 'approved' && <Text style={[styles.note, { color: STATUS.success.fg }]}>{t('timecards.approved_note')}</Text>}
          </>
        ) : (
          <>
            <Text style={[styles.empty, { color: palette.textMuted }]}>{t('timecards.no_card')}</Text>
            {currentRejected && (
              <Text style={[styles.rejected, { color: STATUS.danger.fg }]}>{t('timecards.rejected_note', { note: currentRejected.rejection_note ?? '' })}</Text>
            )}
            {acting
              ? <ActivityIndicator style={styles.spinner} color={palette.accent} />
              : (
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: palette.accent }]} onPress={openWeek} disabled={acting}>
                  <Text style={styles.primaryBtnText}>{currentRejected ? t('timecards.reopen') : t('timecards.open_week')}</Text>
                </TouchableOpacity>
              )}
          </>
        )}
      </View>

      {/* ── History ── */}
      <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>{t('timecards.history')}</Text>
      {cards.length === 0 ? (
        <Text style={[styles.empty, { color: palette.textMuted }]}>{t('timecards.empty_history')}</Text>
      ) : (
        cards.map((c) => (
          <View key={c.id} style={[styles.historyRow, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.historyInfo}>
              <Text style={[styles.historyWeek, { color: palette.text }]}>{fmtDate(weekKey(c))}</Text>
              <Text style={[styles.historyHours, { color: palette.textMuted }]}>
                {Number(c.total_hours).toFixed(2)} {t('timecards.hours_unit')}
                {Number(c.overtime_hours) > 0 ? `  ·  OT ${Number(c.overtime_hours).toFixed(2)}` : ''}
              </Text>
            </View>
            {renderBadge(c.status)}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  weekOf: { fontSize: 18, fontWeight: '600', marginTop: 4, marginBottom: 16 },

  hoursRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  hoursCol: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  hoursValue: { fontSize: 26, fontWeight: '700' },
  hoursLabel: { fontSize: 12, marginTop: 2 },

  primaryBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  spinner: { marginTop: 12 },
  note: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: 4 },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  rejected: { fontSize: 13, marginBottom: 12, textAlign: 'center' },

  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1 },
  historyInfo: { flex: 1 },
  historyWeek: { fontSize: 15, fontWeight: '600' },
  historyHours: { fontSize: 13, marginTop: 2 },
});
