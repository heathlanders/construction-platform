// screens/PunchListScreen.tsx — offline-first punch list
// Writes to WatermelonDB first, attempts server push after
// T-12: version tracking on all records

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Q } from '@nozbe/watermelondb';
import { database } from '../lib/database';
import { PunchListItem } from '../models/PunchListItem';
import { mobileApi } from '../lib/api';
import { getUser } from '../lib/auth';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme-context';
import { Text, Card, Button, StatusBadge, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '../navigation/AppNavigator';

type PunchListRouteProp = RouteProp<RootStackParamList, 'PunchList'>;

export default function PunchListScreen(): React.ReactElement {
  const { t } = useTranslation('field');
  const { palette } = useTheme();
  const route = useRoute<PunchListRouteProp>();
  const { projectId } = route.params;

  const [items, setItems] = useState<PunchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(async () => {
    const collection = database.collections.get<PunchListItem>('punch_list_items');
    const results = await collection
      .query(Q.where('project_id', projectId), Q.where('is_deleted', false))
      .fetch();
    setItems(results);
  }, [projectId]);

  useEffect(() => {
    loadItems().finally(() => setLoading(false));
  }, [loadItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  const addItem = useCallback(async () => {
    const title = newTitle.trim();
    if (!title || submitting) return;

    setSubmitting(true);
    await getUser();

    // 1. Write to WatermelonDB first (offline-first)
    let localRecord: PunchListItem | null = null;
    await database.write(async () => {
      const collection = database.collections.get<PunchListItem>('punch_list_items');
      localRecord = await collection.create((r) => {
        r.project_id = projectId;
        r.title = title;
        r.description = newDescription.trim();
        r.status = 'open';
        r.server_id = '';
        r.version = 1;
        r.sync_status = 'pending';
        r.synced_at = null;
        r.is_deleted = false;
      });
    });

    setNewTitle('');
    setNewDescription('');
    await loadItems();

    // 2. Attempt server push
    try {
      const res = await mobileApi<{ punch_list_item: { id: string; version: number } }>(
        '/punch-list-items',
        {
          method: 'POST',
          body: JSON.stringify({
            project_id: projectId,
            title,
            description: newDescription.trim() || undefined,
            status: 'open',
          }),
        },
      );

      // 3. On success: update local record with server data
      if (localRecord) {
        await database.write(async () => {
          await (localRecord as PunchListItem).update((r) => {
            r.server_id = res.punch_list_item.id;
            r.version = res.punch_list_item.version;
            r.sync_status = 'synced';
            r.synced_at = new Date().toISOString();
          });
        });
        await loadItems();
      }
    } catch {
      // 4. Server push failed — leave as 'pending', sweep will retry
    } finally {
      setSubmitting(false);
    }
  }, [newTitle, newDescription, projectId, submitting, loadItems]);

  const renderItem = useCallback(({ item }: { item: PunchListItem }) => (
    <Card style={styles.item}>
      <View style={styles.itemHeader}>
        <Text variant="bodyStrong" style={styles.itemTitle}>{item.title}</Text>
        <StatusBadge status={item.status} label={t(`punch_list.status.${item.status}`)} />
      </View>
      {!!item.description && (
        <Text variant="caption" muted style={styles.itemDescription}>{item.description}</Text>
      )}
      {item.sync_status === 'pending' && (
        <Text variant="micro" muted style={styles.pendingIndicator}>{t('punch_list.pending_sync')}</Text>
      )}
    </Card>
  ), [t]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  const inputStyle = {
    backgroundColor: palette.surfaceAlt,
    borderColor: palette.border,
    color: palette.text,
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState icon="✅" title={t('punch_list.empty')} />}
        contentContainerStyle={styles.listContent}
      />

      {/* Inline add form */}
      <View style={[styles.addForm, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
        <Text variant="label" style={styles.addFormTitle}>{t('punch_list.add_item')}</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder={t('punch_list.title_placeholder')}
          placeholderTextColor={palette.textMuted}
          value={newTitle}
          onChangeText={setNewTitle}
          maxLength={200}
        />
        <TextInput
          style={[styles.input, styles.multilineInput, inputStyle]}
          placeholder={t('punch_list.description_placeholder')}
          placeholderTextColor={palette.textMuted}
          value={newDescription}
          onChangeText={setNewDescription}
          multiline
          numberOfLines={2}
          maxLength={1000}
        />
        <Button
          title={t('punch_list.add_item')}
          onPress={addItem}
          loading={submitting}
          disabled={!newTitle.trim() || submitting}
          fullWidth
          style={styles.submitButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  item: {
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    flex: 1,
    marginEnd: 8,
  },
  itemDescription: {
    marginTop: 6,
  },
  pendingIndicator: {
    marginTop: 4,
  },
  addForm: {
    borderTopWidth: 1,
    padding: 16,
  },
  addFormTitle: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  multilineInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 4,
  },
});
