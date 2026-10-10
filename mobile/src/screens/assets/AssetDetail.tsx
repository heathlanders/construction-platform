// AssetDetail.tsx — View asset record, navigate to sub-screens
// Business+ tier only (T-56). API returns 402 for Starter/Professional.
// No offline cache — assets are looked up by scan or from list; treat as read-only view.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mobileApi } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { Text, Card, StatusBadge } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AssetDetail'>;

interface Asset {
  id: string;
  asset_number: string;
  name: string;
  asset_category: string;
  asset_type: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  status: string;
  condition: string | null;
  home_location: string | null;
  meter_type: string;
  current_meter_reading: number | null;
  requires_operator_cert: boolean;
  required_cert_type: string | null;
  ownership_type: string;
}

interface AssetResponse {
  asset: Asset;
}

export function AssetDetail({ route, navigation }: Props) {
  const { assetId } = route.params;
  const { t } = useTranslation('common');
  const { palette } = useTheme();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAsset = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await mobileApi<AssetResponse>(`/assets/${assetId}`);
      setAsset(res.asset);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('error');
      if (msg.includes('402')) {
        Alert.alert('Business+ Required', 'Asset management requires a Business or Enterprise plan.');
        navigation.goBack();
      } else if (!quiet) {
        Alert.alert(t('error'), msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assetId, t, navigation]);

  useEffect(() => { void loadAsset(); }, [loadAsset]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadAsset(true);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  if (!asset) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── Header card ── */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text variant="label" muted style={styles.assetNumber}>{asset.asset_number}</Text>
          <StatusBadge status={asset.status} label={asset.status.replace(/_/g, ' ')} />
        </View>
        <Text variant="title">{asset.name}</Text>
        {(asset.make || asset.model) && (
          <Text variant="body" style={styles.assetMeta}>
            {[asset.year, asset.make, asset.model].filter(Boolean).join(' ')}
          </Text>
        )}
        <Text variant="caption" muted style={styles.assetCategory}>
          {asset.asset_category.replace(/_/g, ' ')} · {asset.ownership_type}
        </Text>
      </Card>

      {/* ── Details ── */}
      <Card style={styles.detailCard}>
        {asset.condition && (
          <Row label="Condition" value={asset.condition.replace(/_/g, ' ')} />
        )}
        {asset.home_location && (
          <Row label="Home Location" value={asset.home_location} />
        )}
        {asset.current_meter_reading != null && asset.meter_type !== 'none' && (
          <Row
            label={asset.meter_type === 'odometer' ? 'Odometer' : 'Hours'}
            value={`${asset.current_meter_reading.toLocaleString()} ${asset.meter_type === 'odometer' ? 'mi' : 'hrs'}`}
          />
        )}
        {asset.requires_operator_cert && (
          <View style={[styles.certWarning, { backgroundColor: STATUS.warning.bg }]}>
            <Text variant="caption" color={STATUS.warning.fg} style={styles.certWarningText}>
              ⚠️ Requires {asset.required_cert_type?.replace(/_/g, ' ')} certification
            </Text>
          </View>
        )}
      </Card>

      {/* ── Actions ── */}
      <Text variant="label" muted style={styles.sectionLabel}>ACTIONS</Text>

      <ActionButton
        label="Pre-Use Inspection"
        color="#1e40af"
        onPress={() => navigation.navigate('AssetInspection', { assetId: asset.id, assetName: asset.name })}
      />
      <ActionButton
        label="Check Out / Check In"
        color="#065f46"
        onPress={() => navigation.navigate('AssetCheckout', { assetId: asset.id })}
      />
      {asset.meter_type !== 'none' || asset.asset_category === 'vehicle' ? (
        <ActionButton
          label="Log Fuel"
          color="#b45309"
          onPress={() => navigation.navigate('AssetFuelLog', { assetId: asset.id, assetName: asset.name })}
        />
      ) : null}
      <ActionButton
        label="Report Damage"
        color={STATUS.danger.fg}
        onPress={() => navigation.navigate('AssetDamageReport', { assetId: asset.id, assetName: asset.name })}
      />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: palette.border }]}>
      <Text variant="caption" muted>{label}</Text>
      <Text variant="caption" style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// Action-category accent colors (blue/green/amber/red) are literal by design — like tiles.
function ActionButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: palette.surface, borderColor: palette.border, borderLeftColor: color }]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text variant="bodyStrong" color={color}>{label}</Text>
      <Text variant="heading" muted>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerCard: { marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  assetNumber: { letterSpacing: 0.5 },
  assetMeta: { marginBottom: 2 },
  assetCategory: { textTransform: 'capitalize' },

  detailCard: { marginBottom: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  rowValue: { textAlign: 'right', flex: 1, marginStart: 12 },
  certWarning: { borderRadius: 8, padding: 10, marginTop: 8 },
  certWarningText: {},

  sectionLabel: { letterSpacing: 0.5, marginBottom: 10 },
  actionButton: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderWidth: 1,
  },
});
