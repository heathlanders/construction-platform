// screens/DocumentsScreen.tsx — project files browse + photo upload
// Photo upload (camera/library) via the T-27 quarantine pipeline; offline-queued.
// PDFs/office docs still upload from the web portal (no expo-document-picker — native dep).

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mobileApi, uploadFile } from '@/lib/api';
import { enqueue, flushQueue, QUEUE_KEYS } from '@/lib/offline-queue';
import { useTheme } from '@/lib/theme-context';
import { STATUS, type StatusTone } from '@/lib/theme';
import { Text, Card, Badge, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Documents'>;

// ─── Offline upload queue ───────────────────────────────────────────────────
// Storage + retry policy (backoff, attempt cap, drop-on-server-verdict) come from
// the shared `offline-queue`; this file only supplies the processor.

interface QueuedUpload { projectId: string; localUri: string; filename: string; contentType?: string; }

async function enqueueDocumentUpload(item: QueuedUpload) {
  await enqueue(QUEUE_KEYS.documents, item);
}

/** Drains the offline document-upload queue on reconnect (wired into runSyncSweep).
 *  Per-item presigned PUT via uploadFile(). */
export async function flushDocumentUploadQueue() {
  await flushQueue<QueuedUpload>(QUEUE_KEYS.documents, async (item) => {
    await uploadFile(item.localUri, item.filename, item.projectId, 'documents', item.contentType);
  });
}

interface ProjectFile {
  id: string;
  filename: string;
  content_type: string;
  file_size_bytes: number;
  status: string;
  download_url: string | null;
  created_at: string;
}

// File-scan status → semantic tone + i18n label key (routes through the canonical STATUS map).
const FILE_STATUS: Record<string, { tone: StatusTone; labelKey: string }> = {
  ready:    { tone: 'success', labelKey: 'status_ready' },
  scanning: { tone: 'warning', labelKey: 'status_scanning' },
  rejected: { tone: 'danger', labelKey: 'status_rejected' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fileIcon(contentType: string): string {
  if (contentType.startsWith('image/')) return '🖼️';
  if (contentType === 'application/pdf') return '📄';
  if (contentType.includes('word') || contentType.includes('document')) return '📝';
  if (contentType.includes('spreadsheet') || contentType.includes('excel')) return '📊';
  return '📁';
}

export function DocumentsScreen({ route }: Props) {
  const { projectId } = route.params;
  const { t } = useTranslation('documents');
  const { palette } = useTheme();

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await mobileApi<{ files: ProjectFile[] }>(
        `/files?project_id=${projectId}&limit=50`,
        { method: 'GET' },
      );
      setFiles(res.files);
    } catch {
      // offline — keep existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const doUpload = useCallback(async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    const uri = result.assets[0].uri;
    const filename = result.assets[0].fileName ?? `photo-${Date.now()}.jpg`;
    setUploading(true);
    try {
      await uploadFile(uri, filename, projectId, 'documents');
      await load(); // file now in /files (status=scanning), shows on refresh
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        await enqueueDocumentUpload({ projectId, localUri: uri, filename });
        Alert.alert('', t('saved_offline'));
      } else {
        Alert.alert(t('upload_error'), msg);
      }
    } finally {
      setUploading(false);
    }
  }, [projectId, load, t]);

  // PDF / office document upload via the system file picker (expo-document-picker — native module).
  const doUploadDocument = useCallback(async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv', 'text/plain',
      ],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    const asset = res.assets[0];
    const uri = asset.uri;
    const filename = asset.name || `document-${Date.now()}.pdf`;
    const contentType = asset.mimeType || 'application/pdf';
    setUploading(true);
    try {
      await uploadFile(uri, filename, projectId, 'documents', contentType);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        await enqueueDocumentUpload({ projectId, localUri: uri, filename, contentType });
        Alert.alert('', t('saved_offline'));
      } else {
        Alert.alert(t('upload_error'), msg);
      }
    } finally {
      setUploading(false);
    }
  }, [projectId, load, t]);

  const onUploadPress = useCallback(() => {
    Alert.alert(t('choose_source'), undefined, [
      { text: t('source_camera'), onPress: () => void doUpload(true) },
      { text: t('source_library'), onPress: () => void doUpload(false) },
      { text: t('source_document'), onPress: () => void doUploadDocument() },
      { text: t('cancel'), style: 'cancel' },
    ]);
  }, [doUpload, doUploadDocument, t]);

  async function openFile(url: string) {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  }

  function renderItem({ item }: { item: ProjectFile }) {
    const badge = FILE_STATUS[item.status] ?? FILE_STATUS.scanning;
    const canOpen = item.status === 'ready' && item.download_url;

    return (
      <Card
        style={styles.card}
        onPress={canOpen && item.download_url ? () => void openFile(item.download_url!) : undefined}
      >
        <View style={styles.cardRow}>
          <Text style={styles.icon}>{fileIcon(item.content_type)}</Text>
          <View style={styles.cardBody}>
            <Text variant="body" numberOfLines={2}>{item.filename}</Text>
            <Text variant="caption" muted style={styles.meta}>
              {formatBytes(item.file_size_bytes)} · {formatDate(item.created_at)}
            </Text>
          </View>
          <Badge label={t(badge.labelKey)} colors={STATUS[badge.tone]} />
        </View>
        {canOpen && (
          <Text variant="caption" color={palette.accent} style={styles.openLink}>{t('tap_to_open')}</Text>
        )}
      </Card>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={[styles.uploadNotice, { backgroundColor: STATUS.info.bg, borderBottomColor: palette.border }]}>
        <Text variant="caption" color={STATUS.info.fg} style={styles.uploadNoticeText}>
          {'📤  '}{t('upload_notice')}
        </Text>
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: palette.accent }, uploading && styles.uploadButtonDisabled]}
          onPress={onUploadPress}
          disabled={uploading}
        >
          {uploading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text variant="label" color="#ffffff">{t('upload')}</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="📁" title={t('empty')} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  uploadNotice: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadNoticeText: { flex: 1 },
  uploadButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonDisabled: { opacity: 0.6 },

  list: { padding: 12, gap: 10 },

  card: {},
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  icon: { fontSize: 24, lineHeight: 28 },
  cardBody: { flex: 1 },
  meta: { marginTop: 2 },
  openLink: { marginTop: 6 },
});
