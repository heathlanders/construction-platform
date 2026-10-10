// DamageReport.tsx — Field damage incident reporting with photos
// Business+ tier only (T-56).
// Offline-first: incident queued in AsyncStorage if network unavailable.
// Photo capture via expo-image-picker (URIs stored in queue; upload deferred to sync).

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mobileApi, uploadFile } from '@/lib/api';
import { enqueue, flushQueue, QUEUE_KEYS } from '@/lib/offline-queue';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { Text, Button } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AssetDamageReport'>;

interface QueuedDamage { assetId: string; body: Record<string, unknown>; photoUris?: string[] }

async function enqueueDamageReport(payload: QueuedDamage) {
  await enqueue(QUEUE_KEYS.assetDamage, payload);
}

/** Storage + retry policy come from the shared `offline-queue`. */
export async function flushDamageReportQueue() {
  await flushQueue<QueuedDamage>(QUEUE_KEYS.assetDamage, async (item) => {
    // Upload any queued photos first (asset photos = company path, no project) → file_ids.
    let photoPaths: string[] = Array.isArray(item.body.photo_paths) ? item.body.photo_paths as string[] : [];
    for (const uri of item.photoUris ?? []) {
      const fileId = await uploadFile(uri, `damage-${Date.now()}.jpg`, undefined, 'asset-photos');
      photoPaths = [...photoPaths, fileId];
    }
    await mobileApi(`/assets/${item.assetId}/damage-incidents`, {
      method: 'POST',
      body: JSON.stringify({ ...item.body, photo_paths: photoPaths }),
    });
  });
}

const DAMAGE_TYPES = [
  'collision', 'vandalism', 'weather', 'operational',
  'theft', 'fire', 'flood', 'other',
] as const;
type DamageType = typeof DAMAGE_TYPES[number];

// Damage severity is its own ordered ramp — DISTINCT from the OSHA incident SEVERITY map
// (minor/moderate/major/total_loss, not near_miss…fatality). These saturated hexes read on
// light + dark and are semantic-by-position (like the canonical severity literals).
const DAMAGE_SEVERITIES = [
  { value: 'minor', color: '#d97706' },
  { value: 'moderate', color: '#ea580c' },
  { value: 'major', color: '#dc2626' },
  { value: 'total_loss', color: '#7f1d1d' },
] as const;
type Severity = typeof DAMAGE_SEVERITIES[number]['value'];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DamageReport({ route, navigation }: Props) {
  const { assetId, assetName } = route.params;
  const { t } = useTranslation('common');
  const { palette } = useTheme();

  const [incidentDate, setIncidentDate] = useState(todayISO());
  const [damageType, setDamageType] = useState<DamageType>('operational');
  const [severity, setSeverity] = useState<Severity>('minor');
  const [description, setDescription] = useState('');
  const [estimatedRepair, setEstimatedRepair] = useState('');
  const [outOfService, setOutOfService] = useState(false);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isValid = description.trim().length > 0;

  const pickPhoto = async () => {
    if (photoUris.length >= 3) {
      Alert.alert('', 'Maximum 3 photos per report.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      // Try camera instead
      const camPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (camPerm.status !== 'granted') {
        Alert.alert('Permission Required', 'Camera or photo library access is needed to attach photos.');
        return;
      }
    }

    Alert.alert('Add Photo', 'Choose source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: false,
          });
          if (!result.canceled && result.assets[0]) {
            setPhotoUris((prev) => [...prev, result.assets[0].uri]);
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: false,
          });
          if (!result.canceled && result.assets[0]) {
            setPhotoUris((prev) => [...prev, result.assets[0].uri]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removePhoto = (uri: string) => {
    setPhotoUris((prev) => prev.filter((u) => u !== uri));
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);

    const estimatedCents = estimatedRepair
      ? Math.round(parseFloat(estimatedRepair) * 100)
      : undefined;

    const body: Record<string, unknown> = {
      incident_date: `${incidentDate}T${new Date().toTimeString().slice(0, 8)}`,
      damage_type: damageType,
      severity,
      description: description.trim(),
      estimated_repair_cents: estimatedCents,
      out_of_service: outOfService,
      out_of_service_start: outOfService ? new Date().toISOString() : undefined,
    };

    try {
      // Upload captured photos (asset photos = company path, no project) → photo_paths file_ids.
      // Offline upload throws (fetch) → falls to the queue below, which uploads on reconnect.
      const photoPaths: string[] = [];
      for (const uri of photoUris) {
        photoPaths.push(await uploadFile(uri, `damage-${Date.now()}.jpg`, undefined, 'asset-photos'));
      }
      await mobileApi(`/assets/${assetId}/damage-incidents`, {
        method: 'POST',
        body: JSON.stringify({ ...body, photo_paths: photoPaths }),
      });
      const msg = outOfService
        ? 'Damage reported. Asset marked OUT OF SERVICE.'
        : 'Damage report submitted.';
      Alert.alert('', msg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('error');
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        await enqueueDamageReport({ assetId, body, photoUris });
        Alert.alert('Saved Offline', 'Damage report will sync when reconnected.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(t('error'), msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="heading" style={styles.heading}>{assetName}</Text>

        <Text variant="label" style={styles.label}>Incident Date</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={incidentDate}
          onChangeText={setIncidentDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={palette.textMuted}
          keyboardType="numbers-and-punctuation"
        />

        <Text variant="label" style={styles.label}>Damage Type</Text>
        <View style={styles.chipRow}>
          {DAMAGE_TYPES.map((dt) => {
            const active = damageType === dt;
            return (
              <TouchableOpacity
                key={dt}
                style={[styles.chip, { borderColor: palette.border }, active && { backgroundColor: palette.accent, borderColor: palette.accent }]}
                onPress={() => setDamageType(dt)}
              >
                <Text variant="caption" color={active ? '#ffffff' : palette.textMuted} style={styles.chipText}>
                  {dt.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text variant="label" style={styles.label}>Severity</Text>
        <View style={styles.chipRow}>
          {DAMAGE_SEVERITIES.map((sv) => {
            const active = severity === sv.value;
            return (
              <TouchableOpacity
                key={sv.value}
                style={[styles.chip, { borderColor: palette.border }, active && { backgroundColor: sv.color, borderColor: sv.color }]}
                onPress={() => setSeverity(sv.value)}
              >
                <Text variant="caption" color={active ? '#ffffff' : palette.textMuted} style={styles.chipText}>
                  {sv.value.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text variant="label" style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea, inputStyle]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          placeholder="Describe what happened and what was damaged..."
          placeholderTextColor={palette.textMuted}
          textAlignVertical="top"
        />

        <Text variant="label" style={styles.label}>Estimated Repair Cost ($)</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={estimatedRepair}
          onChangeText={setEstimatedRepair}
          keyboardType="decimal-pad"
          placeholder="e.g. 1500.00"
          placeholderTextColor={palette.textMuted}
        />

        {/* Out of service toggle */}
        <View style={[styles.oosRow, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.oosInfo}>
            <Text variant="body">Mark Asset Out of Service</Text>
            <Text variant="caption" muted style={styles.oosHint}>Asset will be unavailable until cleared by PM or Owner.</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, { backgroundColor: outOfService ? STATUS.danger.fg : palette.surfaceAlt }]}
            hitSlop={8}
            onPress={() => setOutOfService((v) => !v)}
          >
            <Text variant="label" color={outOfService ? '#ffffff' : palette.textMuted}>{outOfService ? 'Yes' : 'No'}</Text>
          </TouchableOpacity>
        </View>

        {/* Photos */}
        <Text variant="label" style={styles.label}>Photos ({photoUris.length}/3)</Text>
        <View style={styles.photoRow}>
          {photoUris.map((uri) => (
            <View key={uri} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity style={styles.removePhoto} hitSlop={12} onPress={() => removePhoto(uri)}>
                <Text variant="micro" color="#ffffff">✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {photoUris.length < 3 && (
            <TouchableOpacity style={[styles.addPhoto, { borderColor: palette.border, backgroundColor: palette.surface }]} onPress={pickPhoto}>
              <Text style={styles.addPhotoIcon}>📷</Text>
              <Text variant="micro" muted>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {outOfService && (
          <View style={[styles.oosWarning, { backgroundColor: STATUS.danger.bg, borderColor: STATUS.danger.fg }]}>
            <Text variant="caption" color={STATUS.danger.fg}>
              ⚠️ Submitting this report will set the asset OUT OF SERVICE immediately.
            </Text>
          </View>
        )}

        <Button
          title="Submit Damage Report"
          variant="danger"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!isValid || submitting}
          fullWidth
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  heading: { marginBottom: 20 },

  label: { marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
  textArea: { minHeight: 100 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5 },
  chipText: { textTransform: 'capitalize' },

  oosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
  },
  oosInfo: { flex: 1, marginEnd: 12 },
  oosHint: { marginTop: 2 },
  toggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },

  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  photoWrapper: { width: 88, height: 88, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  photo: { width: '100%', height: '100%' },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    width: 88,
    height: 88,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoIcon: { fontSize: 22 },

  oosWarning: { borderRadius: 8, padding: 12, marginTop: 16, borderWidth: 1 },

  submitButton: { marginTop: 24 },
});
