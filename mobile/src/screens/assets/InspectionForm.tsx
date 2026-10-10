// InspectionForm.tsx — Pre-use asset inspection checklist (OSHA/DOT)
// Business+ tier only (T-56).
// Offline-first: inspection queued in AsyncStorage if network unavailable, flushed on reconnect.
// result='fail' sets asset OOS server-side — never auto-resolve in field.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mobileApi, uploadFile } from '@/lib/api';
import { enqueue, flushQueue, QUEUE_KEYS } from '@/lib/offline-queue';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { Text, Card, Button, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AssetInspection'>;

interface ChecklistItem {
  id: string;
  description: string;
  response_type: 'ok_defect_na' | 'text' | 'numeric';
  required: boolean;
}

interface Template {
  id: string;
  name: string;
  checklist_items: ChecklistItem[];
  inspection_frequency: string;
}

interface TemplatesResponse {
  templates: Template[];
}

type ItemResponse = 'ok' | 'defect' | 'na' | '';

// A defect can carry a captured photo. Online, the photo is uploaded through the
// T-27 quarantine pipeline (uploadFile) and the returned file_id is stored in
// `photo_path`. Offline, the local file uri is held in `photo_local_uri` and the
// upload is deferred to the flush on reconnect.
interface QueuedDefect {
  description: string;
  severity: string;
  photo_path?: string;
  photo_local_uri?: string;
}

/**
 * Upload any deferred defect photos (`photo_local_uri`) through uploadFile() and
 * replace them with the resulting `photo_path` (file_id). Mutates a copy of the
 * defects array; throws if any upload fails (so the caller can keep the item queued).
 */
async function resolveDefectPhotos(defects: QueuedDefect[] | undefined): Promise<QueuedDefect[] | undefined> {
  if (!defects?.length) return defects;
  const out: QueuedDefect[] = [];
  for (const d of defects) {
    if (d.photo_local_uri && !d.photo_path) {
      // Asset photos are not project-scoped → company-path upload (project_id omitted).
      const fileId = await uploadFile(d.photo_local_uri, `inspection-${Date.now()}.jpg`, undefined, 'asset-photos');
      const { photo_local_uri: _drop, ...rest } = d;
      out.push({ ...rest, photo_path: fileId });
    } else {
      out.push(d);
    }
  }
  return out;
}

interface QueuedInspection { assetId: string; body: Record<string, unknown> }

async function enqueueInspection(payload: QueuedInspection) {
  await enqueue(QUEUE_KEYS.assetInspections, payload);
}

/** Storage + retry policy come from the shared `offline-queue`. */
export async function flushInspectionQueue() {
  await flushQueue<QueuedInspection>(QUEUE_KEYS.assetInspections, async (item) => {
    // Upload any deferred defect photos first, then POST the inspection.
    const defects = await resolveDefectPhotos(item.body.defects_noted as QueuedDefect[] | undefined);
    const body = defects ? { ...item.body, defects_noted: defects } : item.body;
    await mobileApi(`/assets/${item.assetId}/inspections`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  });
}

// Response tone: ok → success · defect → danger · na → neutral (canonical STATUS).
const RESPONSE_TONE = { ok: 'success', defect: 'danger', na: 'neutral' } as const;

export function InspectionForm({ route, navigation }: Props) {
  const { assetId, assetName } = route.params;
  const { t } = useTranslation('common');
  const { palette } = useTheme();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [responses, setResponses] = useState<Record<string, ItemResponse>>({});
  const [textResponses, setTextResponses] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [meterReading, setMeterReading] = useState('');
  const [defectPhotos, setDefectPhotos] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Capture (or pick) a photo for a defect item. Stored as a local uri and only
  // uploaded at submit/flush time (offline-first — B4 quarantine queue).
  const captureDefectPhoto = async (itemId: string) => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    const launch = cam.status === 'granted' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await launch({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setDefectPhotos((prev) => ({ ...prev, [itemId]: result.assets[0].uri }));
    }
  };

  useEffect(() => {
    mobileApi<TemplatesResponse>('/asset-inspection-templates?limit=50')
      .then((res) => setTemplates(res.templates ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, []);

  const setResponse = (itemId: string, value: ItemResponse) => {
    setResponses((prev) => ({ ...prev, [itemId]: value }));
  };

  const overallResult = useCallback((): 'pass' | 'fail' | 'conditional' => {
    if (!selectedTemplate) return 'pass';
    const hasDefect = selectedTemplate.checklist_items.some(
      (item) => responses[item.id] === 'defect',
    );
    const missingRequired = selectedTemplate.checklist_items
      .filter((item) => item.required && item.response_type === 'ok_defect_na')
      .some((item) => !responses[item.id] || responses[item.id] === '');
    if (hasDefect) return 'fail';
    if (missingRequired) return 'conditional';
    return 'pass';
  }, [selectedTemplate, responses]);

  const handleSubmit = async () => {
    if (!selectedTemplate) {
      Alert.alert('', 'Select a checklist template first.');
      return;
    }

    const result = overallResult();

    if (result === 'fail') {
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Defect Found',
          'This inspection has defects and will set the asset OUT OF SERVICE. Continue?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Submit Fail', style: 'destructive', onPress: () => resolve(true) },
          ],
        );
      });
      if (!proceed) return;
    }

    setSubmitting(true);

    const checklist_responses = selectedTemplate.checklist_items.map((item) => ({
      item_id: item.id,
      response: item.response_type === 'ok_defect_na'
        ? (responses[item.id] || 'na')
        : undefined,
      note: textResponses[item.id] ?? undefined,
    }));

    const defects_noted = selectedTemplate.checklist_items
      .filter((item) => responses[item.id] === 'defect')
      .map((item) => ({
        description: item.description,
        severity: 'minor' as const,
        // Local uri held until upload (online: now; offline: on flush).
        ...(defectPhotos[item.id] ? { photo_local_uri: defectPhotos[item.id] } : {}),
      }));

    const body = {
      template_id: selectedTemplate.id,
      inspection_type: 'pre_use' as const,
      inspected_at: new Date().toISOString(),
      meter_reading: meterReading ? parseFloat(meterReading) : undefined,
      result,
      checklist_responses,
      defects_noted: defects_noted.length > 0 ? defects_noted : undefined,
      out_of_service: result === 'fail',
      notes: notes.trim() || undefined,
    };

    try {
      // Upload any captured defect photos through the quarantine pipeline first,
      // then POST the inspection with file_ids in place of the local uris.
      const resolved = await resolveDefectPhotos(body.defects_noted as QueuedDefect[] | undefined);
      const postBody = resolved ? { ...body, defects_noted: resolved } : body;
      await mobileApi(`/assets/${assetId}/inspections`, {
        method: 'POST',
        body: JSON.stringify(postBody),
      });
      const msg = result === 'fail'
        ? 'Inspection submitted. Asset set OUT OF SERVICE.'
        : 'Inspection submitted successfully.';
      Alert.alert('', msg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('error');
      if (msg.toLowerCase().includes('network') || msg.includes('fetch')) {
        // Offline (or photo upload failed offline) — queue the inspection with the
        // local photo uris intact; flushInspectionQueue uploads + posts on reconnect.
        await enqueueInspection({ assetId, body });
        Alert.alert('Saved Offline', 'Inspection saved. It will sync when you reconnect.', [
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

  if (loadingTemplates) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  // Step 1: Pick a template
  if (!selectedTemplate) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.content}>
        <Text variant="heading" style={styles.heading}>{assetName}</Text>
        <Text variant="body" muted style={styles.subheading}>Select inspection checklist</Text>
        {templates.length === 0 && (
          <EmptyState icon="📋" title="No inspection templates available." message="Create one in the web app." />
        )}
        {templates.map((tmpl) => (
          <Card key={tmpl.id} style={styles.templateRow} onPress={() => setSelectedTemplate(tmpl)}>
            <View style={styles.templateInfo}>
              <Text variant="subheading">{tmpl.name}</Text>
              <Text variant="caption" muted style={styles.templateMeta}>
                {tmpl.inspection_frequency.replace(/_/g, ' ')} · {tmpl.checklist_items.length} items
              </Text>
            </View>
            <Text variant="heading" muted>›</Text>
          </Card>
        ))}
      </ScrollView>
    );
  }

  // Step 2: Fill out checklist
  const result = overallResult();
  const resultTone = result === 'fail' ? STATUS.danger : result === 'conditional' ? STATUS.warning : STATUS.success;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.content}>
      <View style={styles.templateHeader}>
        <Text variant="heading">{selectedTemplate.name}</Text>
        <TouchableOpacity onPress={() => setSelectedTemplate(null)} hitSlop={12}>
          <Text variant="bodyStrong" color={palette.accent}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Meter reading */}
      <Text variant="label" style={styles.label}>Meter Reading (optional)</Text>
      <TextInput
        style={[styles.input, inputStyle]}
        value={meterReading}
        onChangeText={setMeterReading}
        keyboardType="numeric"
        placeholder="e.g. 45230"
        placeholderTextColor={palette.textMuted}
      />

      {/* Checklist items */}
      <Text variant="label" style={styles.label}>Checklist</Text>
      {selectedTemplate.checklist_items.map((item) => (
        <Card key={item.id} style={styles.checkItem}>
          <Text variant="caption" style={styles.checkDesc}>
            {item.required ? '* ' : ''}{item.description}
          </Text>
          {item.response_type === 'ok_defect_na' && (
            <View style={styles.responseRow}>
              {(['ok', 'defect', 'na'] as const).map((val) => {
                const selected = responses[item.id] === val;
                const color = STATUS[RESPONSE_TONE[val]].fg;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.responseChip, { borderColor: palette.border }, selected && { backgroundColor: color, borderColor: color }]}
                    onPress={() => setResponse(item.id, val)}
                  >
                    <Text variant="micro" color={selected ? '#ffffff' : color}>
                      {val.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {item.response_type === 'text' && (
            <TextInput
              style={[styles.input, inputStyle, { marginTop: 6 }]}
              value={textResponses[item.id] ?? ''}
              onChangeText={(v) => setTextResponses((p) => ({ ...p, [item.id]: v }))}
              placeholder="Enter response"
              placeholderTextColor={palette.textMuted}
            />
          )}
          {item.response_type === 'numeric' && (
            <TextInput
              style={[styles.input, inputStyle, { marginTop: 6 }]}
              value={textResponses[item.id] ?? ''}
              onChangeText={(v) => setTextResponses((p) => ({ ...p, [item.id]: v }))}
              keyboardType="numeric"
              placeholder="Enter value"
              placeholderTextColor={palette.textMuted}
            />
          )}
          {responses[item.id] === 'defect' && (
            <View style={styles.defectPhotoRow}>
              <TouchableOpacity
                style={[styles.defectPhotoBtn, { borderColor: STATUS.danger.fg, backgroundColor: STATUS.danger.bg }]}
                onPress={() => captureDefectPhoto(item.id)}
              >
                <Text variant="micro" color={STATUS.danger.fg}>
                  {defectPhotos[item.id] ? '📷 Change photo' : '📷 Add photo'}
                </Text>
              </TouchableOpacity>
              {defectPhotos[item.id] && (
                <Image source={{ uri: defectPhotos[item.id] }} style={[styles.defectThumb, { backgroundColor: palette.surfaceAlt }]} />
              )}
            </View>
          )}
        </Card>
      ))}

      {/* Notes */}
      <Text variant="label" style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea, inputStyle]}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        placeholder="Additional notes..."
        placeholderTextColor={palette.textMuted}
        textAlignVertical="top"
      />

      {/* Result preview */}
      <View style={[styles.resultBadge, { backgroundColor: resultTone.bg }]}>
        <Text variant="bodyStrong" color={resultTone.fg}>
          Result: {result.toUpperCase()}
          {result === 'fail' ? ' — Will set asset OUT OF SERVICE' : ''}
        </Text>
      </View>

      <Button
        title="Submit Inspection"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
        fullWidth
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  heading: { marginBottom: 4 },
  subheading: { marginBottom: 20 },

  templateRow: { marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  templateInfo: { flex: 1 },
  templateMeta: { marginTop: 2, textTransform: 'capitalize' },

  templateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },

  label: { marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 },
  textArea: { minHeight: 90 },

  checkItem: { marginBottom: 8 },
  checkDesc: { lineHeight: 18, marginBottom: 8 },
  responseRow: { flexDirection: 'row', gap: 8 },
  responseChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6, borderWidth: 1.5 },

  defectPhotoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  defectPhotoBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, borderWidth: 1.5 },
  defectThumb: { width: 44, height: 44, borderRadius: 6 },

  resultBadge: { borderRadius: 8, padding: 12, marginTop: 20, marginBottom: 16 },
});
