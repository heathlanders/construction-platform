import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { database } from '@/lib/database';
import { TimeEntry } from '@/models/TimeEntry';
import { mobileApi } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { CalendarPicker } from '@/components/CalendarPicker';
import { useTheme } from '@/lib/theme-context';
import { Text as UIText, Button } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

function fmtLongDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

type Props = NativeStackScreenProps<RootStackParamList, 'TimeEntry'>;

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

// Employee time entry: date + hours (+ optional notes) against this project.
// No rate / cost-code / budget — pay rate is an admin setting (user_payroll_settings),
// resolved server-side; job-costing is set by PM/office, not the field worker.
export function TimeEntryScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const { t } = useTranslation('field');
  const { palette } = useTheme();

  const [date, setDate] = useState(todayIso());
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCal, setShowCal] = useState(false);

  const handleSubmit = async () => {
    const hoursNum = parseFloat(hours);
    if (!date || isNaN(hoursNum) || hoursNum <= 0) return;

    setSaving(true);
    try {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');

      let localId: string | null = null;

      // Step 1: Write to WatermelonDB with sync_status 'pending' (offline-first).
      await database.write(async () => {
        const entry = await database.get<TimeEntry>('time_entries').create((r) => {
          r.project_id = projectId;
          r.user_id = user.user_id;
          r.date = date;
          r.hours_worked = hoursNum;
          r.hourly_rate_cents = null; // admin-set rate, resolved server-side
          r.cost_code_id = null;
          r.budget_line_item_id = null;
          r.notes = notes.trim() || null;
          r.server_id = '';
          r.version = 1; // T-12: optimistic locking starts at 1
          r.sync_status = 'pending';
          r.synced_at = null;
          r.is_deleted = false;
        });
        localId = entry.id;
      });

      // Step 2: Attempt background sync. Silent on failure — stays 'pending'.
      try {
        const serverRes = await mobileApi<{ time_entry: { id: string; version: number } }>(
          `/time-entries`,
          {
            method: 'POST',
            body: JSON.stringify({
              project_id: projectId,
              user_id: user.user_id,
              date,
              hours_worked: hoursNum,
              notes: notes.trim() || null,
            }),
          }
        );
        if (localId) {
          const entry = await database.get<TimeEntry>('time_entries').find(localId);
          await database.write(async () => {
            await entry.update((r) => {
              r.server_id = serverRes.time_entry.id;
              r.version = serverRes.time_entry.version;
              r.sync_status = 'synced';
              r.synced_at = new Date().toISOString();
            });
          });
        }
      } catch {
        // Offline — local record stays pending until next sync sweep.
      }

      Alert.alert('', t('time_logged'));
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        t('error', { ns: 'common' }),
        err instanceof Error ? err.message : t('error', { ns: 'common' })
      );
    } finally {
      setSaving(false);
    }
  };

  const isValid = date.trim().length > 0 && parseFloat(hours) > 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={[styles.container, { backgroundColor: palette.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <UIText variant="label" muted style={styles.label}>{t('date')}</UIText>
        <TouchableOpacity style={[styles.select, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => setShowCal(true)} accessibilityRole="button">
          <UIText>{fmtLongDate(date)}</UIText>
          <Text style={styles.selectIcon}>📅</Text>
        </TouchableOpacity>

        <UIText variant="label" muted style={styles.label}>{t('hours')}</UIText>
        <TextInput style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]} value={hours} onChangeText={setHours} placeholder="8.0" placeholderTextColor={palette.textMuted} keyboardType="decimal-pad" />

        <UIText variant="label" muted style={styles.label}>{t('notes')}</UIText>
        <TextInput style={[styles.input, styles.textArea, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]} value={notes} onChangeText={setNotes} multiline numberOfLines={4} textAlignVertical="top" />

        <Button
          title={t('submit')}
          onPress={handleSubmit}
          loading={saving}
          disabled={!isValid || saving}
          fullWidth
          style={{ marginTop: 28 }}
        />
      </ScrollView>

      <CalendarPicker visible={showCal} value={date} palette={palette}
        onSelect={(d) => setDate(d)} onClose={() => setShowCal(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20 },
  label: { marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  select: { borderWidth: 1, borderRadius: 8, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectIcon: { fontSize: 16 },
  textArea: { minHeight: 96 },
});
