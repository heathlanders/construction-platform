// screens/warranties/ClaimDetailScreen.tsx — Warranty claim detail with status timeline

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { apiGet } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import { STATUS, type StatusTone } from '@/lib/theme';
import { Text, Badge } from '@/components/ui';

type RouteT = RouteProp<RootStackParamList, 'WarrantyClaim'>;

interface StatusHistoryEntry {
  to_status: string;
  changed_at: string;
}

interface ClaimDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  scheduled_repair_date?: string;
  completed_at?: string;
  resolution_notes?: string;
  created_at: string;
  status_history: StatusHistoryEntry[];
}

const STATUS_ORDER = ['submitted', 'acknowledged', 'under_investigation', 'repair_scheduled', 'repair_complete'];
const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  under_investigation: 'Under Investigation',
  repair_scheduled: 'Repair Scheduled',
  repair_complete: 'Complete',
  denied: 'Denied',
  closed: 'Closed',
};

// Claim priority → semantic tone (canonical STATUS colors).
const PRIORITY_TONE: Record<string, StatusTone> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  urgent: 'action',
};

export function ClaimDetailScreen() {
  const { t } = useTranslation('warranties');
  const route = useRoute<RouteT>();
  const { palette } = useTheme();
  const { warrantyId, claimId } = route.params;
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!claimId) return;
    try {
      const data = await apiGet<ClaimDetail>(`/v1/builder-warranties/${warrantyId}/claims/${claimId}`);
      setClaim(data);
    } catch {
      // Offline
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [warrantyId, claimId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator style={[styles.center, { backgroundColor: palette.background }]} size="large" color={palette.accent} />;
  if (!claim) return <Text variant="body" muted align="center" style={styles.centerText}>{t('not_found')}</Text>;

  const currentStepIndex = STATUS_ORDER.indexOf(claim.status);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      {/* Header */}
      <View style={[styles.section, { backgroundColor: palette.surface }]}>
        <View style={styles.row}>
          <Text variant="heading" style={styles.sectionTitle}>{claim.title}</Text>
          <Badge label={claim.priority} colors={STATUS[PRIORITY_TONE[claim.priority] ?? 'neutral']} />
        </View>
        <Text variant="caption" muted style={styles.category}>{claim.category.replace('_', ' ')}</Text>
        <Text variant="body" style={styles.description}>{claim.description}</Text>
      </View>

      {/* Status stepper */}
      <View style={[styles.section, { backgroundColor: palette.surface }]}>
        <Text variant="heading" style={styles.sectionTitle}>{t('status')}</Text>
        {STATUS_ORDER.map((step, idx) => {
          const isComplete = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const dotColor = isComplete ? STATUS.success.fg : isCurrent ? palette.accent : palette.border;
          return (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: dotColor }]} />
              <Text variant="body" muted={!isCurrent} style={isCurrent ? styles.stepLabelCurrent : undefined}>{STATUS_LABELS[step]}</Text>
            </View>
          );
        })}
      </View>

      {/* Details */}
      {claim.scheduled_repair_date && (
        <View style={[styles.section, { backgroundColor: palette.surface }]}>
          <Text variant="caption" muted>{t('scheduled_repair')}: {claim.scheduled_repair_date.split('T')[0]}</Text>
        </View>
      )}
      {claim.resolution_notes && (
        <View style={[styles.section, { backgroundColor: palette.surface }]}>
          <Text variant="heading" style={styles.sectionTitle}>{t('resolution_notes')}</Text>
          <Text variant="body" style={styles.description}>{claim.resolution_notes}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  centerText: { marginTop: 48 },
  section: { marginBottom: 12, padding: 16 },
  sectionTitle: { marginBottom: 8, flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  category: { marginBottom: 8 },
  description: { lineHeight: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  stepDot: { width: 12, height: 12, borderRadius: 6, marginEnd: 12 },
  stepLabelCurrent: { fontWeight: '600' },
});
