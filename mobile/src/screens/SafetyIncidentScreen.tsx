// screens/SafetyIncidentScreen.tsx — Field incident reporting + emergency procedures
// Locked decisions: T-13 (Tier 3 safety conflict — blocks until Safety Officer resolves),
//                   T-40 (safety notifications cannot be disabled),
//                   P-09 (EN + ES required)
// Offline-first: incident written to WatermelonDB immediately, synced on reconnect.
// T-13: safety incidents are Tier 3 — server-side conflict blocks (no auto-resolve in the field).

import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Q } from '@nozbe/watermelondb';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { database } from '@/lib/database';
import { mobileApi } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { SafetyIncident } from '@/models/SafetyIncident';
import { useTheme } from '@/lib/theme-context';
import { severityColor, STATUS } from '@/lib/theme';
import { Text, Card, Button, SeverityBadge } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Safety'>;

// Ordered low→high (canonical severityColor supplies the color).
const SEVERITIES = ['near_miss', 'first_aid', 'recordable', 'lost_time', 'fatality'] as const;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SafetyIncidentScreen({ route }: Props) {
  const { projectId } = route.params;
  const { t } = useTranslation('safety');
  const { palette } = useTheme();

  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('near_miss');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const collection = database.collections.get<SafetyIncident>('safety_incidents');
    const sub = collection
      // observeWithColumns — a plain .observe() is silent on field edits of rows already
      // in the list, so a status/severity change or a sync_status flip (pending → synced,
      // or → conflict) would never reach the screen.
      .query(Q.where('project_id', projectId), Q.where('is_deleted', false))
      .observeWithColumns(['description', 'severity', 'status', 'incident_date', 'sync_status', 'version'])
      .subscribe((rows) => setIncidents(rows));
    return () => sub.unsubscribe();
  }, [projectId]);

  async function submit() {
    if (!description.trim()) {
      Alert.alert(t('required'), t('error_description_required'));
      return;
    }
    setSubmitting(true);

    await getUser();
    const collection = database.collections.get<SafetyIncident>('safety_incidents');

    // 1. Write to local DB immediately (offline-first)
    let localRecord: SafetyIncident;
    await database.write(async () => {
      localRecord = await collection.create((r) => {
        r.project_id = projectId;
        r.incident_date = incidentDate;
        r.description = description.trim();
        r.severity = severity;
        r.status = 'open';
        r.server_id = '';
        r.version = 1;
        r.sync_status = 'pending';
        r.synced_at = null;
        r.is_deleted = false;
      });
    });

    // 2. Attempt immediate push to server (non-blocking — will retry on sync sweep)
    try {
      const res = await mobileApi<{ safety_incident: { id: string; version: number } }>(
        '/safety-incidents',
        {
          method: 'POST',
          body: JSON.stringify({
            project_id: projectId,
            incident_date: incidentDate,
            description: description.trim(),
            severity,
          }),
        },
      );

      await database.write(async () => {
        await localRecord!.update((r) => {
          r.server_id = res.safety_incident.id;
          r.version = res.safety_incident.version;
          r.sync_status = 'synced';
          r.synced_at = new Date().toISOString();
        });
      });

      Alert.alert('', t('submitted'));
    } catch {
      // Network failure — incident already saved locally, will sync when reconnected
      Alert.alert('', t('pending_sync'));
    }

    // Reset form
    setDescription('');
    setSeverity('near_miss');
    setIncidentDate(new Date().toISOString().slice(0, 10));
    setShowForm(false);
    setSubmitting(false);
  }

  const inputStyle = { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.content}>
      {/* Emergency procedures — always visible at top */}
      <View style={[styles.emergencyBox, { backgroundColor: STATUS.danger.bg, borderColor: STATUS.danger.fg }]}>
        <Text variant="bodyStrong" color={STATUS.danger.fg} style={styles.emergencyTitle}>{t('emergency_title')}</Text>
        <Text variant="caption" color={STATUS.danger.fg} style={styles.emergencyItem}>{'• '}{t('call_911')}</Text>
        <Text variant="caption" color={STATUS.danger.fg} style={styles.emergencyItem}>{'• '}{t('contact_supervisor')}</Text>
        <Text variant="caption" color={STATUS.danger.fg} style={styles.emergencyItem}>{'• '}{t('do_not_move')}</Text>
      </View>

      {/* Required note banner */}
      <View style={[styles.noticeBanner, { backgroundColor: STATUS.warning.bg, borderColor: STATUS.warning.fg }]}>
        <Text variant="caption" color={STATUS.warning.fg} style={styles.noticeText}>{t('required_note')}</Text>
      </View>

      {/* Incident list */}
      <Text variant="label" muted style={styles.sectionLabel}>{t('incidents_title').toUpperCase()}</Text>

      {incidents.length === 0 && !showForm && (
        <Text variant="body" muted style={styles.emptyText}>{t('empty')}</Text>
      )}

      {incidents.map((inc) => (
        <Card key={inc.id} style={styles.incidentCard}>
          <View style={styles.incidentHeader}>
            <Text variant="caption" muted style={styles.incidentDate}>{formatDate(inc.incident_date)}</Text>
            <SeverityBadge severity={inc.severity} label={t(`severity.${inc.severity}`)} />
            {inc.sync_status === 'pending' && (
              <View style={[styles.pendingDot, { backgroundColor: palette.textMuted }]} />
            )}
          </View>
          <Text variant="body" numberOfLines={3}>{inc.description}</Text>
        </Card>
      ))}

      {/* Report form */}
      {showForm ? (
        <Card style={styles.form}>
          <Text variant="heading" style={styles.formTitle}>{t('report_title')}</Text>

          <Text variant="label" style={styles.label}>{t('incident_date')}</Text>
          <TextInput
            style={[styles.input, inputStyle]}
            value={incidentDate}
            onChangeText={setIncidentDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={palette.textMuted}
          />

          <Text variant="label" style={styles.label}>{t('severity')}</Text>
          <View style={styles.severityRow}>
            {SEVERITIES.map((value) => {
              const c = severityColor(value);
              const active = severity === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.severityChip, { borderColor: c }, active && { backgroundColor: c }]}
                  onPress={() => setSeverity(value)}
                >
                  <Text variant="caption" color={active ? '#ffffff' : c}>
                    {t(`severity.${value}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text variant="label" style={styles.label}>{t('description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea, inputStyle]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder={t('description_placeholder')}
            placeholderTextColor={palette.textMuted}
          />

          <Button
            title={submitting ? t('submitting') : t('report_button')}
            variant="danger"
            onPress={submit}
            loading={submitting}
            disabled={submitting}
            fullWidth
            style={styles.submitButton}
          />
          <Button title={t('cancel', { ns: 'common' })} variant="ghost" onPress={() => setShowForm(false)} fullWidth style={styles.cancelButton} />
        </Card>
      ) : (
        <Button title={t('report_button')} variant="danger" onPress={() => setShowForm(true)} fullWidth style={styles.reportButton} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },

  emergencyBox: {
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  emergencyTitle: { marginBottom: 6 },
  emergencyItem: { lineHeight: 20 },

  noticeBanner: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  noticeText: { lineHeight: 18 },

  sectionLabel: { letterSpacing: 0.5, marginBottom: 10 },
  emptyText: { marginBottom: 20 },

  incidentCard: { marginBottom: 10 },
  incidentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  incidentDate: { flex: 1 },
  pendingDot: { width: 8, height: 8, borderRadius: 4 },

  form: { marginTop: 8 },
  formTitle: { marginBottom: 16 },

  label: { marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  severityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  severityChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1.5,
  },

  submitButton: { marginTop: 20 },
  cancelButton: { marginTop: 8 },
  reportButton: { marginTop: 12 },
});
