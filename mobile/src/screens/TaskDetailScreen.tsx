// screens/TaskDetailScreen.tsx — task detail: codes & compliance (read-only), QA photos
// (field roles capture + upload, online-only), dependencies, and editable status/% for OWNER/PM.
// Mirrors PermitDetailScreen. Locked decisions: A-13, T-09, T-12, T-27 (quarantine upload).

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, Image, StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { mobileApi, uploadFile, ApiError } from '../lib/api';
import { enqueueTaskPhoto } from '../lib/photo-queue';
import { hasRole, type Role } from '../lib/tileManifest';
import { useCurrentUser } from '../lib/user-context';
import { useTheme } from '@/lib/theme-context';
import { statusColor, STATUS } from '@/lib/theme';
import { Text } from '@/components/ui';
import type { RootStackParamList } from '../navigation/AppNavigator';

type RouteP = RouteProp<RootStackParamList, 'TaskDetail'>;

interface ComplianceStep {
  inspection_type: string; title: string; code_hint: string | null;
  required: boolean; status: string; result: string | null;
  inspection_date: string | null; inspector_name: string | null;
}
interface CodeRef { code_type: string; section: string; note?: string }
interface EquipmentNeed { type: string; category: string; reason: string; optional?: boolean }
interface TaskEquip extends EquipmentNeed { owned_count?: number; available_count?: number; asset_ids?: string[] }
interface WorkStep {
  id: string; step_order: number; title: string; instruction: string; detail: string | null;
  code_refs: CodeRef[]; tools: string[]; materials: string[]; safety: string[]; equipment?: EquipmentNeed[];
  gating_inspection_type: string | null; qa_check: string | null;
}
interface Codes {
  code_type: string; code_edition: string | null; nec_edition: string | null;
  jurisdiction_notes: string | null;
  ahj: { ahj_name: string; ahj_level: string; phone?: string } | null;
  compliance: ComplianceStep[]; task_code_refs: CodeRef[]; has_permit: boolean; task_scoped: boolean;
}
interface DepEdge { id: string; title: string; status: string; }
interface Photo { id: string; caption: string | null; download_url: string | null; first_name: string | null; last_name: string | null; }
interface TaskRow {
  id: string; project_id: string; title: string; status: string; percent_complete: number;
  trade_type: string | null; phase: string | null; csi_division: string | null; version: number;
}
interface Detail { task: TaskRow; codes: Codes | null; steps: WorkStep[]; task_equipment?: TaskEquip[]; predecessors: DepEdge[]; successors: DepEdge[]; photos: Photo[]; }

// Lowercase to match the JWT role claim (one convention via hasRole).
const EDIT_ROLES: Role[] = ['owner', 'project_manager'];
const PHOTO_ROLES: Role[] = ['owner', 'project_manager', 'foreman', 'field_tech', 'safety_officer'];
const STATUSES = ['not_started', 'in_progress', 'on_hold', 'complete'];

export function TaskDetailScreen(): React.ReactElement {
  const route = useRoute<RouteP>();
  const { taskId } = route.params;
  const { t } = useTranslation('tasks');
  const { role } = useCurrentUser();
  const { palette } = useTheme();
  const canEdit = hasRole(role, EDIT_ROLES);
  const canPhoto = hasRole(role, PHOTO_ROLES);

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await mobileApi<Detail>(`/schedule-tasks/${taskId}/detail`);
      setDetail(data);
    } catch { /* offline */ }
  }, [taskId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load().finally(() => setRefreshing(false)); }, [load]);

  const setStatus = async (status: string) => {
    if (!detail) return;
    setSavingStatus(true);
    try {
      await mobileApi(`/schedule-tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, version: detail.task.version }),
      });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Update failed';
      Alert.alert(t('update_failed', { defaultValue: 'Update failed' }), /version/i.test(msg) ? t('conflict', { defaultValue: 'This task was updated elsewhere — reload.' }) : msg);
    } finally { setSavingStatus(false); }
  };

  const rebuildSteps = async () => {
    setRebuilding(true);
    try {
      await mobileApi(`/schedule-tasks/${taskId}/build-steps`, { method: 'POST' });
      await load();
      Alert.alert('', t('rebuilt', { defaultValue: 'Work steps rebuilt' }));
    } catch (e) {
      Alert.alert(t('rebuild_failed', { defaultValue: 'Could not rebuild steps' }), e instanceof Error ? e.message : '');
    } finally { setRebuilding(false); }
  };

  const attachWithRetry = async (fileId: string) => {
    for (let i = 0; i < 12; i++) {
      try {
        await mobileApi(`/schedule-tasks/${taskId}/photos`, {
          method: 'POST', body: JSON.stringify({ file_id: fileId, photo_type: 'proof' }),
        });
        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (/scanning|not ready|FILE_NOT_READY/i.test(msg)) { await new Promise((r) => setTimeout(r, 1500)); continue; }
        throw e;
      }
    }
    return false;
  };

  const addPhoto = async () => {
    if (!detail) return;
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    const launch = cam.status === 'granted' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await launch({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    setUploading(true);
    try {
      const fileId = await uploadFile(uri, `task-${Date.now()}.jpg`, detail.task.project_id);
      const ok = await attachWithRetry(fileId);
      if (!ok) Alert.alert('', t('still_scanning', { defaultValue: 'Photo is still being processed — pull to refresh shortly.' }));
      else await load();
    } catch (e) {
      // Network failure (not a hard ApiError) → queue for upload on reconnect (Doc 19 #3).
      if (!(e instanceof ApiError)) {
        await enqueueTaskPhoto({ taskId, projectId: detail.task.project_id, localUri: uri });
        Alert.alert('', t('common:saved_offline', { defaultValue: 'No connection — saved. It will upload when you reconnect.' }));
      } else {
        Alert.alert(t('upload_failed', { defaultValue: 'Photo upload failed' }), e.message);
      }
    } finally { setUploading(false); }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      await mobileApi(`/schedule-tasks/${taskId}/photos/${photoId}`, { method: 'DELETE' });
      await load();
    } catch { /* ignore */ }
  };

  if (loading) {
    return <View style={[styles.centered, { backgroundColor: palette.background }]}><ActivityIndicator size="large" color={palette.accent} /></View>;
  }
  if (!detail) {
    return <View style={[styles.centered, { backgroundColor: palette.background }]}><Text variant="body" muted>{t('load_failed', { defaultValue: 'Failed to load task' })}</Text></View>;
  }

  const { task, codes, steps, task_equipment: taskEquipment = [], predecessors, successors, photos } = detail;
  const equipLabel = (ty: string) => ty.replace(/_/g, ' ');
  const cardStyle = [styles.card, { backgroundColor: palette.surface, borderColor: palette.border }];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Summary */}
      <View style={cardStyle}>
        <Text variant="heading">{task.title}</Text>
        <Text variant="caption" muted style={styles.meta}>
          {(task.trade_type ?? 'general')} · {(task.phase ?? 'unassigned').replace(/_/g, ' ')}
          {task.csi_division ? ` · ${task.csi_division}` : ''}
        </Text>
        {/* Editable status (OWNER/PM) */}
        <Text variant="caption" muted style={styles.fieldLabel}>{t('status', { defaultValue: 'Status' })}</Text>
        <View style={styles.statusRow}>
          {STATUSES.map((s) => {
            const active = task.status === s;
            return (
              <TouchableOpacity
                key={s}
                disabled={!canEdit || savingStatus}
                onPress={() => setStatus(s)}
                style={[
                  styles.statusBtn,
                  { borderColor: palette.border },
                  active && { backgroundColor: palette.accent, borderColor: palette.accent },
                  !canEdit && styles.statusBtnDisabled,
                ]}
              >
                <Text variant="caption" color={active ? '#fff' : palette.text} style={styles.statusBtnText}>
                  {t(`status_${s}`, { defaultValue: s.replace(/_/g, ' ') })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text variant="caption" style={styles.percent}>{task.percent_complete}% {t('complete_suffix', { defaultValue: 'complete' })}</Text>
      </View>

      {/* Work Steps (laborer-facing) */}
      <View style={styles.sectionHeaderRow}>
        <Text variant="label" muted style={styles.sectionLabel}>{t('work_steps', { defaultValue: 'Work Steps' })}</Text>
        {canEdit ? (
          <TouchableOpacity onPress={rebuildSteps} disabled={rebuilding} accessibilityRole="button">
            <Text variant="bodyStrong" color={palette.accent} style={styles.addLink}>{rebuilding ? t('rebuilding', { defaultValue: 'Rebuilding…' }) : t('rebuild_steps', { defaultValue: 'Rebuild' })}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {steps.length === 0 ? (
        <Text variant="body" muted style={styles.empty}>{t('no_steps', { defaultValue: 'No work steps yet.' })}</Text>
      ) : (
        steps.map((s) => (
          <View key={s.id} style={cardStyle}>
            <Text variant="bodyStrong">{s.step_order}. {s.title}</Text>
            <Text variant="caption" style={styles.stepInstruction}>{s.instruction}</Text>
            {s.detail ? <Text variant="caption" muted style={styles.stepDetail}>{s.detail}</Text> : null}
            {s.code_refs.length > 0 ? (
              <Text variant="micro" muted style={styles.stepMeta}>{t('code_refs', { defaultValue: 'Codes' })}: {s.code_refs.map((r) => `${r.code_type} ${r.section}`).join(', ')}</Text>
            ) : null}
            {s.gating_inspection_type ? (
              <Text variant="micro" muted style={styles.stepMeta}>{t('signs_off', { defaultValue: 'Inspection' })}: {s.gating_inspection_type.replace(/_/g, ' ')}</Text>
            ) : null}
            {(s.equipment?.length ?? 0) > 0 ? <Text variant="micro" color={STATUS.action.fg} style={styles.stepMeta}>{t('equipment', { defaultValue: 'Equipment' })}: {s.equipment!.map((e) => equipLabel(e.type) + (e.optional ? '*' : '')).join(', ')}</Text> : null}
            {s.tools.length > 0 ? <Text variant="micro" muted style={styles.stepMeta}>{t('tools', { defaultValue: 'Tools' })}: {s.tools.join(', ')}</Text> : null}
            {s.materials.length > 0 ? <Text variant="micro" muted style={styles.stepMeta}>{t('materials', { defaultValue: 'Materials' })}: {s.materials.join(', ')}</Text> : null}
            {s.safety.length > 0 ? <Text variant="micro" color={STATUS.warning.fg} style={styles.stepMeta}>{t('safety', { defaultValue: 'Safety' })}: {s.safety.join('; ')}</Text> : null}
            {s.qa_check ? <Text variant="micro" color={STATUS.success.fg} style={styles.stepMeta}>{t('qa', { defaultValue: 'QA' })}: {s.qa_check}</Text> : null}
          </View>
        ))
      )}

      {/* Equipment (union across steps; owned/available shown for Business+) */}
      {taskEquipment.length > 0 ? (
        <>
          <Text variant="label" muted style={styles.sectionLabel}>{t('equipment', { defaultValue: 'Equipment' })}</Text>
          {taskEquipment.map((e) => (
            <View key={e.type} style={cardStyle}>
              <Text variant="bodyStrong">{equipLabel(e.type)}{e.optional ? <Text variant="micro" muted> {t('equipment_optional', { defaultValue: '(optional)' })}</Text> : null}</Text>
              <Text variant="caption" muted style={styles.stepDetail}>{e.reason}</Text>
              {e.owned_count !== undefined ? (
                <Text variant="micro" color={e.available_count && e.available_count > 0 ? STATUS.success.fg : STATUS.warning.fg} style={styles.stepMeta}>
                  {e.available_count && e.available_count > 0
                    ? t('equipment_available', { defaultValue: '{{n}} available', n: e.available_count })
                    : e.owned_count > 0
                      ? t('equipment_owned_none_free', { defaultValue: '{{n}} owned, none free', n: e.owned_count })
                      : t('equipment_none_owned', { defaultValue: 'not in fleet' })}
                </Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}

      {/* Codes & Compliance */}
      <Text variant="label" muted style={styles.sectionLabel}>{t('codes', { defaultValue: 'Codes & Compliance' })}</Text>
      {codes ? (
        <View style={cardStyle}>
          <View style={[styles.codeBadge, { backgroundColor: STATUS.action.bg }]}>
            <Text variant="caption" color={STATUS.action.fg}>{codes.code_type} {codes.code_edition ?? codes.nec_edition ?? ''}</Text>
          </View>
          {codes.ahj ? (
            <Text variant="caption" muted style={styles.meta}>
              {codes.ahj.ahj_name} ({t(`ahj_level_${codes.ahj.ahj_level}`, { defaultValue: codes.ahj.ahj_level })})
              {codes.ahj.phone ? ` · ${codes.ahj.phone}` : ''}
            </Text>
          ) : null}
          {codes.jurisdiction_notes ? <Text variant="micro" color={STATUS.warning.fg} style={styles.notes}>{codes.jurisdiction_notes}</Text> : null}
          <Text variant="micro" muted style={styles.subLabel}>{t('inspections', { defaultValue: 'Inspection sequence' })}</Text>
          {codes.compliance.map((c) => (
            <View key={c.inspection_type} style={styles.inspRow}>
              <View style={[styles.inspDot, { backgroundColor: statusColor(c.status).fg }]} />
              <View style={{ flex: 1 }}>
                <Text variant="caption">
                  {c.title}{!c.required ? ` (${t('optional', { defaultValue: 'optional' })})` : ''}
                </Text>
                <Text variant="micro" muted style={styles.inspMeta}>
                  {t(`insp_status_${c.status}`, { defaultValue: c.status.replace(/_/g, ' ') })}
                  {c.inspector_name ? ` · ${c.inspector_name}` : ''}
                  {c.inspection_date ? ` · ${String(c.inspection_date).slice(0, 10)}` : ''}
                </Text>
                {c.code_hint ? <Text variant="micro" muted>{c.code_hint}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text variant="body" muted style={styles.empty}>{t('no_codes', { defaultValue: 'No trade set — no applicable codes.' })}</Text>
      )}

      {/* QA Photos */}
      <View style={styles.sectionHeaderRow}>
        <Text variant="label" muted style={styles.sectionLabel}>{t('photos', { defaultValue: 'QA / Proof Photos' })}</Text>
        {canPhoto ? (
          <TouchableOpacity onPress={addPhoto} disabled={uploading} accessibilityRole="button">
            <Text variant="bodyStrong" color={palette.accent} style={styles.addLink}>{uploading ? t('uploading', { defaultValue: 'Uploading…' }) : t('add_photo', { defaultValue: '+ Add photo' })}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {photos.length === 0 ? (
        <Text variant="body" muted style={styles.empty}>{t('no_photos', { defaultValue: 'No photos yet.' })}</Text>
      ) : (
        <View style={styles.photoGrid}>
          {photos.map((p) => (
            <View key={p.id} style={styles.photoWrap}>
              {p.download_url ? <Image source={{ uri: p.download_url }} style={styles.photo} /> : <View style={[styles.photoPlaceholder, { backgroundColor: palette.surfaceAlt }]} />}
              {canEdit ? (
                <TouchableOpacity onPress={() => deletePhoto(p.id)} style={styles.photoDelete}><Text variant="body" color="#fff" style={styles.photoDeleteText}>×</Text></TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {/* Dependencies */}
      <Text variant="label" muted style={styles.sectionLabel}>{t('dependencies', { defaultValue: 'Dependencies' })}</Text>
      <View style={cardStyle}>
        <Text variant="micro" muted style={styles.subLabel}>{t('predecessors', { defaultValue: 'Prerequisites' })}</Text>
        {predecessors.length === 0 ? <Text variant="caption" muted>—</Text> : predecessors.map((d) => <Text key={d.id} variant="caption" style={styles.depText}>• {d.title}</Text>)}
        <Text variant="micro" muted style={[styles.subLabel, { marginTop: 10 }]}>{t('successors', { defaultValue: 'Unblocks' })}</Text>
        {successors.length === 0 ? <Text variant="caption" muted>—</Text> : successors.map((d) => <Text key={d.id} variant="caption" style={styles.depText}>• {d.title}</Text>)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginVertical: 12 },
  card: {
    borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  meta: { marginTop: 6, textTransform: 'capitalize' },
  fieldLabel: { marginTop: 14, marginBottom: 6 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  statusBtnDisabled: { opacity: 0.5 },
  statusBtnText: { textTransform: 'capitalize' },
  percent: { marginTop: 10, fontWeight: '600' },
  sectionLabel: { textTransform: 'uppercase', marginBottom: 8 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addLink: { marginBottom: 8 },
  codeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  notes: { marginTop: 8, lineHeight: 16, fontStyle: 'italic' },
  subLabel: { textTransform: 'uppercase', marginTop: 12, marginBottom: 6 },
  inspRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  inspDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 10 },
  inspMeta: { marginTop: 1, textTransform: 'capitalize' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  photoWrap: { position: 'relative' },
  photo: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#E5E7EB' },
  photoPlaceholder: { width: 100, height: 100, borderRadius: 8 },
  photoDelete: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  photoDeleteText: { lineHeight: 16 },
  depText: { marginBottom: 2 },
  stepInstruction: { marginTop: 4 },
  stepDetail: { marginTop: 2 },
  stepMeta: { marginTop: 4 },
});
