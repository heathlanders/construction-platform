// screens/warranties/WarrantyDetailScreen.tsx — Warranty detail + coverage grid

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { apiGet } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import { STATUS, type StatusTone } from '@/lib/theme';
import { Text, StatusBadge } from '@/components/ui';

type RouteT = RouteProp<RootStackParamList, 'WarrantyDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'WarrantyDetail'>;

interface CoverageItem {
  id: string;
  coverage_type: string;
  title: string;
  duration_months: number;
  expiry_date: string;
}

interface RecentClaim {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface WarrantyDetail {
  id: string;
  title: string;
  property_address: string;
  homeowner_name: string;
  homeowner_email: string;
  effective_date: string;
  status: string;
  coverage_items: CoverageItem[];
  recent_claims: RecentClaim[];
}

// Coverage-type → semantic tone (rendered badge-style: STATUS.bg fill + STATUS.fg text,
// readable on both light + dark — the light tints matched these tones already).
const COVERAGE_TONE: Record<string, StatusTone> = {
  workmanship: 'info',
  systems: 'success',
  structural: 'danger',
  custom: 'action',
};

export function WarrantyDetailScreen() {
  const { t } = useTranslation('warranties');
  const route = useRoute<RouteT>();
  const navigation = useNavigation<Nav>();
  const { palette } = useTheme();
  const { warrantyId } = route.params;
  const [warranty, setWarranty] = useState<WarrantyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<WarrantyDetail>(`/v1/builder-warranties/${warrantyId}`);
      setWarranty(data);
    } catch {
      // Offline — keep stale
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [warrantyId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator style={[styles.center, { backgroundColor: palette.background }]} size="large" color={palette.accent} />;
  if (!warranty) return <Text variant="body" muted align="center" style={styles.centerText}>{t('not_found')}</Text>;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      {/* Header */}
      <View style={[styles.section, { backgroundColor: palette.surface }]}>
        <Text variant="heading" style={styles.sectionTitle}>{t('property')}</Text>
        <Text variant="body" style={styles.value}>{warranty.property_address}</Text>
        <Text variant="caption" muted style={styles.label}>{t('homeowner')}: {warranty.homeowner_name}</Text>
        <Text variant="caption" muted style={styles.label}>{t('effective')}: {warranty.effective_date.split('T')[0]}</Text>
      </View>

      {/* Coverage items */}
      <View style={[styles.section, { backgroundColor: palette.surface }]}>
        <Text variant="heading" style={styles.sectionTitle}>{t('coverage')}</Text>
        {warranty.coverage_items.map((item) => {
          const tone = STATUS[COVERAGE_TONE[item.coverage_type] ?? 'neutral'];
          return (
            <View key={item.id} style={[styles.coverageCard, { backgroundColor: tone.bg }]}>
              <Text variant="bodyStrong" color={tone.fg}>{item.title}</Text>
              <Text variant="caption" color={tone.fg} style={styles.coverageMeta}>{item.duration_months} {t('months')} · {t('expires')} {item.expiry_date.split('T')[0]}</Text>
            </View>
          );
        })}
      </View>

      {/* Recent claims */}
      <View style={[styles.section, { backgroundColor: palette.surface }]}>
        <View style={styles.row}>
          <Text variant="heading" style={styles.sectionTitle}>{t('recent_claims')}</Text>
          <TouchableOpacity hitSlop={12} onPress={() => navigation.navigate('WarrantyClaim', { warrantyId, claimId: '', warrantyTitle: warranty.title })}>
            <Text variant="bodyStrong" color={palette.accent}>{t('new_claim')}</Text>
          </TouchableOpacity>
        </View>
        {warranty.recent_claims.length === 0
          ? <Text variant="caption" muted align="center" style={styles.empty}>{t('no_claims')}</Text>
          : warranty.recent_claims.map((claim) => (
            <TouchableOpacity key={claim.id} style={[styles.claimRow, { borderBottomColor: palette.border }]}
              onPress={() => navigation.navigate('WarrantyClaim', { warrantyId, claimId: claim.id, warrantyTitle: warranty.title })}>
              <Text variant="body" style={styles.claimTitle}>{claim.title}</Text>
              <StatusBadge status={claim.status} label={claim.status.replace(/_/g, ' ')} />
            </TouchableOpacity>
          ))
        }
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  centerText: { marginTop: 48 },
  section: { marginBottom: 12, padding: 16 },
  sectionTitle: { marginBottom: 10 },
  value: { marginBottom: 4 },
  label: { marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  coverageCard: { borderRadius: 8, padding: 12, marginBottom: 8 },
  coverageMeta: { marginTop: 2, opacity: 0.85 },
  claimRow: { paddingVertical: 10, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claimTitle: { flex: 1, marginEnd: 8 },
  empty: { paddingVertical: 12 },
});
