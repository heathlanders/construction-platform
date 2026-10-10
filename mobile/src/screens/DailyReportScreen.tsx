import React, { useState } from 'react';
import {
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { database } from '@/lib/database';
import { DailyReport } from '@/models/DailyReport';
import { mobileApi } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import { Text, Button } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'DailyReport'>;

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export function DailyReportScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const { t } = useTranslation('field');
  const { palette } = useTheme();

  const [reportDate, setReportDate] = useState(todayIso());
  const [conditions, setConditions] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!reportDate.trim()) return;
    setSaving(true);

    try {
      let localId: string | null = null;

      // Step 1: Write to WatermelonDB with sync_status 'pending'.
      // App works fully offline — local DB is the primary store.
      await database.write(async () => {
        const report = await database.get<DailyReport>('daily_reports').create((r) => {
          r.project_id = projectId;
          r.report_date = reportDate;
          r.conditions = conditions.trim() || null;
          r.notes = notes.trim() || null;
          r.server_id = '';
          r.version = 1; // T-12: optimistic locking
          r.sync_status = 'pending';
          r.synced_at = null;
          r.is_deleted = false;
        });
        localId = report.id;
      });

      // Step 2: Attempt background sync. Silent on failure — stays 'pending'.
      try {
        // Route is /v1/daily-reports with project_id in the body (no nested route);
        // the server stores free-text conditions inside the `weather` jsonb column.
        const serverRes = await mobileApi<{ daily_report: { id: string; version: number } }>(
          `/daily-reports`,
          {
            method: 'POST',
            body: JSON.stringify({
              project_id: projectId,
              report_date: reportDate,
              weather: conditions.trim() ? { conditions: conditions.trim() } : undefined,
              notes: notes.trim() || null,
            }),
          }
        );
        if (localId) {
          const report = await database.get<DailyReport>('daily_reports').find(localId);
          await database.write(async () => {
            await report.update((r) => {
              r.server_id = serverRes.daily_report.id;
              r.version = serverRes.daily_report.version;
              r.sync_status = 'synced';
              r.synced_at = new Date().toISOString();
            });
          });
        }
      } catch {
        // Offline — local record stays pending until next sync sweep.
      }

      Alert.alert('', t('daily_report_saved'));
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

  const inputStyle = {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    color: palette.text,
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="label" style={styles.label}>{t('daily_report.date')}</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={reportDate}
          onChangeText={setReportDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={palette.textMuted}
          keyboardType="numbers-and-punctuation"
        />

        <Text variant="label" style={styles.label}>{t('daily_report.conditions')}</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={conditions}
          onChangeText={setConditions}
          placeholderTextColor={palette.textMuted}
        />

        <Text variant="label" style={styles.label}>{t('daily_report.notes')}</Text>
        <TextInput
          style={[styles.input, styles.textArea, inputStyle]}
          value={notes}
          onChangeText={setNotes}
          placeholderTextColor={palette.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <Button
          title={t('daily_report.submit')}
          onPress={handleSubmit}
          loading={saving}
          disabled={!reportDate.trim() || saving}
          fullWidth
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20 },
  label: { marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { minHeight: 120 },
  button: { marginTop: 28 },
});
