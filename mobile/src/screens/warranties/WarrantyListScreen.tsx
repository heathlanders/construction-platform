// screens/warranties/WarrantyListScreen.tsx — Builder warranty list (Business+)
// Offline-first: reads from WatermelonDB, syncs on mount.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { apiGet } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { Text, Card, StatusBadge, EmptyState } from '@/components/ui';

interface Warranty {
  id: string;
  title: string;
  property_address: string;
  homeowner_name: string;
  effective_date: string;
  status: string;
  open_claim_count: number;
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'WarrantyList'>;

export function WarrantyListScreen() {
  const { t } = useTranslation('warranties');
  const navigation = useNavigation<Nav>();
  const { palette } = useTheme();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<{ items?: Warranty[] }>('/v1/builder-warranties');
      setWarranties(res.items ?? []);
    } catch {
      // Offline — keep stale data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: Warranty }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('WarrantyDetail', { warrantyId: item.id, warrantyTitle: item.title })}
    >
      <View style={styles.cardHeader}>
        <Text variant="subheading" style={styles.cardTitle}>{item.title}</Text>
        <StatusBadge status={item.status} label={item.status} />
      </View>
      <Text variant="caption" muted style={styles.address}>{item.property_address}</Text>
      <Text variant="caption">{item.homeowner_name}</Text>
      {item.open_claim_count > 0 && (
        <View style={[styles.claimBadge, { backgroundColor: STATUS.warning.bg }]}>
          <Text variant="micro" color={STATUS.warning.fg}>{item.open_claim_count} {t('open_claims')}</Text>
        </View>
      )}
    </Card>
  );

  if (loading) return <ActivityIndicator style={[styles.center, { backgroundColor: palette.background }]} size="large" color={palette.accent} />;

  return (
    <FlatList
      style={{ backgroundColor: palette.background }}
      data={warranties}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListEmptyComponent={<EmptyState icon="🛡️" title={t('no_warranties')} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  card: {},
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { flex: 1, marginEnd: 8 },
  address: { marginBottom: 2 },
  claimBadge: { marginTop: 8, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
});
