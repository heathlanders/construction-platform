// Checkout.tsx — QR scan asset checkout / check-in
// Business+ tier only (T-56).
// Scans QR code → looks up asset by asset_number → shows checkout or check-in form.
// Requires network for timestamp accuracy — clock times must be server-recorded.
// QR code value: asset_number field (e.g. "AST-0042")

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text as RNText,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Q } from '@nozbe/watermelondb';
import { mobileApi } from '@/lib/api';
import { database } from '@/lib/database';
import type { CompanyAsset } from '@/models/CompanyAsset';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { Text, Card, Button } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AssetCheckout'>;

// Checkout/check-in action accents (literal by design — like tiles).
const CHECKOUT_ACCENT = '#065f46';

interface Asset {
  id: string;
  asset_number: string;
  name: string;
  asset_category: string;
  status: string;
  requires_operator_cert: boolean;
  required_cert_type: string | null;
}

interface ActiveCheckout {
  id: string;
  asset_id: string;
  checked_out_by: string;
  checked_out_at: string;
  expected_return_at: string | null;
  condition_out: string;
}

interface AssetsListResponse {
  assets: Asset[];
}

interface CheckoutResponse {
  checkout: ActiveCheckout;
}

const CONDITIONS = ['good', 'fair', 'damaged', 'needs_repair'] as const;
type Condition = typeof CONDITIONS[number];

export function Checkout({ route, navigation }: Props) {
  const preloadedAssetId = route.params?.assetId;
  const { t } = useTranslation('common');
  const { palette } = useTheme();

  // expo-camera 14 (Expo SDK 50): permissions hook is a static on Camera;
  // the scanner component is <Camera> with the camelCased barcode props.
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [scanning, setScanning] = useState(!preloadedAssetId);
  const [scanned, setScanned] = useState(false);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [activeCheckout, setActiveCheckout] = useState<ActiveCheckout | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(!!preloadedAssetId);
  /** Resolved from the offline cache — checkout/checkin need a connection. */
  const [offlineAsset, setOfflineAsset] = useState(false);

  const [conditionOut, setConditionOut] = useState<Condition>('good');
  const [conditionIn, setConditionIn] = useState<Condition>('good');
  const [notesOut] = useState('');
  const [notesIn] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load asset if preloaded by assetId
  const loadAsset = useCallback(async (assetId: string) => {
    setLoadingAsset(true);
    try {
      // Use list endpoint filtered by id to get asset + active checkout
      const [assetRes, checkoutsRes] = await Promise.all([
        mobileApi<{ asset: Asset }>(`/assets/${assetId}`),
        mobileApi<{ checkouts: ActiveCheckout[] }>(`/assets/${assetId}/checkouts?checked_in=false&limit=1`),
      ]);
      setAsset(assetRes.asset);
      setActiveCheckout(checkoutsRes.checkouts?.[0] ?? null);
      setScanning(false);
    } catch (err) {
      Alert.alert(t('error'), err instanceof Error ? err.message : t('error'));
    } finally {
      setLoadingAsset(false);
    }
  }, [t]);

  useEffect(() => {
    if (preloadedAssetId) {
      void loadAsset(preloadedAssetId);
    }
  }, [preloadedAssetId, loadAsset]);

  /** Resolve a scanned asset_number from the offline cache (schema v4).
   *  The yard is exactly where there's no signal — without this the scan dead-ends
   *  and the fuel / inspection / damage offline queues are unreachable. */
  const findCachedAsset = useCallback(async (assetNumber: string): Promise<Asset | null> => {
    try {
      const rows = await database.collections
        .get<CompanyAsset>('company_assets')
        .query(Q.where('asset_number', assetNumber), Q.where('is_deleted', false))
        .fetch();
      const r = rows[0];
      if (!r) return null;
      return {
        id: r.server_id,
        asset_number: r.asset_number,
        name: r.name,
        asset_category: r.asset_category,
        status: r.status,
        requires_operator_cert: r.requires_operator_cert,
        required_cert_type: r.required_cert_type,
      } as Asset;
    } catch {
      return null;
    }
  }, []);

  // QR scan handler
  const handleBarcodeScan = useCallback(async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    // QR value is the asset_number (e.g. "AST-0042")
    const assetNumber = data.trim().toUpperCase();
    try {
      const res = await mobileApi<AssetsListResponse>(`/assets?asset_number=${encodeURIComponent(assetNumber)}&limit=1`);
      const found = res.assets?.[0];
      if (!found) {
        Alert.alert('Asset Not Found', `No asset with number ${assetNumber}.`, [
          { text: 'Scan Again', onPress: () => setScanned(false) },
        ]);
        return;
      }

      const checkoutsRes = await mobileApi<{ checkouts: ActiveCheckout[] }>(
        `/assets/${found.id}/checkouts?checked_in=false&limit=1`
      );
      setAsset(found);
      setActiveCheckout(checkoutsRes.checkouts?.[0] ?? null);
      setScanning(false);
    } catch (err) {
      // Offline (or the API is down): resolve from the cache so the worker can still
      // log fuel / an inspection / damage against this asset. Checkout itself stays
      // online-only — T-57 operator-cert enforcement is server-side, and telling a
      // worker they have a machine they aren't certified for is worse than "reconnect".
      const cached = await findCachedAsset(assetNumber);
      if (cached) {
        setAsset(cached);
        setActiveCheckout(null);
        setScanning(false);
        setOfflineAsset(true);
        return;
      }
      Alert.alert(t('error'), err instanceof Error ? err.message : t('error'), [
        { text: 'Scan Again', onPress: () => setScanned(false) },
      ]);
    }
  }, [scanned, t, findCachedAsset]);

  const handleCheckout = async () => {
    if (!asset) return;
    setSubmitting(true);
    try {
      await mobileApi<CheckoutResponse>(`/assets/${asset.id}/checkout`, {
        method: 'POST',
        body: JSON.stringify({
          condition_out: conditionOut,
          notes_out: notesOut.trim() || undefined,
          qr_scan_out: true,
        }),
      });
      Alert.alert('Checked Out', `${asset.name} is now checked out to you.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('error');
      if (msg.includes('OPERATOR_CERT_REQUIRED')) {
        Alert.alert(
          'Certification Required',
          `This equipment requires a valid ${asset.required_cert_type?.replace(/_/g, ' ')} certification. Contact your supervisor.`,
        );
      } else {
        Alert.alert(t('error'), msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckin = async () => {
    if (!asset || !activeCheckout) return;
    setSubmitting(true);
    try {
      await mobileApi(`/assets/${asset.id}/checkin`, {
        method: 'POST',
        body: JSON.stringify({
          checkout_id: activeCheckout.id,
          condition_in: conditionIn,
          notes_in: notesIn.trim() || undefined,
          qr_scan_in: true,
        }),
      });
      Alert.alert('Checked In', `${asset.name} has been returned.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(t('error'), err instanceof Error ? err.message : t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Camera permission request ────────────────────────────────────────────────

  if (scanning && !permission?.granted) {
    if (permission === null) {
      return (
        <View style={[styles.centered, { backgroundColor: palette.background }]}>
          <ActivityIndicator size="large" color={palette.accent} />
        </View>
      );
    }
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <Text variant="body" align="center" style={styles.permText}>Camera access is needed to scan QR codes.</Text>
        <Button title="Grant Camera Access" onPress={requestPermission} />
      </View>
    );
  }

  // ── QR scanner (camera UI — literal white/scrim overlay is canonical) ──────────

  if (scanning) {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          onBarCodeScanned={scanned ? undefined : handleBarcodeScan}
          barCodeScannerSettings={{ barCodeTypes: ['qr'] }}
        />
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame} />
          <RNText style={styles.scanHint}>Point camera at asset QR code</RNText>
        </View>
        <TouchableOpacity style={styles.cancelScan} onPress={() => navigation.goBack()}>
          <RNText style={styles.cancelScanText}>Cancel</RNText>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Loading asset ────────────────────────────────────────────────────────────

  if (loadingAsset || !asset) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  const isCheckedOut = activeCheckout != null;

  // ── Checkout / check-in form ─────────────────────────────────────────────────

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.content}>
      {/* Asset header */}
      <Card style={styles.assetCard}>
        <Text variant="label" muted style={styles.assetNumber}>{asset.asset_number}</Text>
        <Text variant="title">{asset.name}</Text>
        <Text variant="caption" muted style={styles.assetCategory}>{asset.asset_category.replace(/_/g, ' ')}</Text>
        {isCheckedOut && (
          <View style={[styles.checkedOutBadge, { backgroundColor: STATUS.warning.bg }]}>
            <Text variant="micro" color={STATUS.warning.fg}>CURRENTLY CHECKED OUT</Text>
          </View>
        )}
      </Card>

      {!isCheckedOut ? (
        // ── Checkout form ──
        <>
          <Text variant="heading" style={styles.formTitle}>Check Out</Text>

          <Text variant="label" style={styles.label}>Condition</Text>
          <View style={styles.conditionRow}>
            {CONDITIONS.map((c) => {
              const active = conditionOut === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.conditionChip, { borderColor: palette.border }, active && { backgroundColor: palette.accent, borderColor: palette.accent }]}
                  onPress={() => setConditionOut(c)}
                >
                  <Text variant="caption" color={active ? '#ffffff' : palette.textMuted} style={styles.conditionText}>
                    {c.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {offlineAsset && (
            <Text variant="caption" style={{ color: STATUS.warning.fg, marginBottom: 8 }}>
              {t('assets.offline_checkout_blocked')}
            </Text>
          )}
          <Button
            title="Check Out"
            onPress={handleCheckout}
            loading={submitting}
            disabled={submitting || offlineAsset}
            fullWidth
            style={{ marginBottom: 12, backgroundColor: CHECKOUT_ACCENT }}
          />
        </>
      ) : (
        // ── Check-in form ──
        <>
          <Text variant="heading" style={styles.formTitle}>Check In</Text>
          <Text variant="caption" muted style={styles.checkinSub}>
            Checked out {new Date(activeCheckout.checked_out_at).toLocaleDateString()}
          </Text>

          <Text variant="label" style={styles.label}>Return Condition</Text>
          <View style={styles.conditionRow}>
            {CONDITIONS.map((c) => {
              const isDamage = c === 'damaged' || c === 'needs_repair';
              const active = conditionIn === c;
              const activeColor = isDamage ? STATUS.danger.fg : palette.accent;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.conditionChip, { borderColor: palette.border }, active && { backgroundColor: activeColor, borderColor: activeColor }]}
                  onPress={() => setConditionIn(c)}
                >
                  <Text variant="caption" color={active ? '#ffffff' : palette.textMuted} style={styles.conditionText}>
                    {c.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {(conditionIn === 'damaged' || conditionIn === 'needs_repair') && (
            <View style={[styles.damageNote, { backgroundColor: STATUS.danger.bg }]}>
              <Text variant="caption" color={STATUS.danger.fg}>
                ⚠️ Use "Report Damage" from Asset Detail to file a full damage report.
              </Text>
            </View>
          )}

          {offlineAsset && (
            <Text variant="caption" style={{ color: STATUS.warning.fg, marginBottom: 8 }}>
              {t('assets.offline_checkout_blocked')}
            </Text>
          )}
          <Button
            title="Check In"
            onPress={handleCheckin}
            loading={submitting}
            disabled={submitting || offlineAsset}
            fullWidth
            style={styles.actionButton}
          />
        </>
      )}

      {/* Scan different asset */}
      {!preloadedAssetId && (
        <Button
          title="Scan Different Asset"
          variant="ghost"
          onPress={() => { setAsset(null); setActiveCheckout(null); setScanned(false); setScanning(true); }}
          fullWidth
          style={styles.rescanButton}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },

  // Camera (literal overlay colors are canonical camera UI)
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  scanOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  scanHint: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 24, textShadowColor: '#000', textShadowRadius: 4 },
  cancelScan: { position: 'absolute', bottom: 40, alignSelf: 'center', padding: 14, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  cancelScanText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  permText: { lineHeight: 22 },

  // Asset card
  assetCard: { marginBottom: 20 },
  assetNumber: { letterSpacing: 0.5, marginBottom: 2 },
  assetCategory: { textTransform: 'capitalize' },
  checkedOutBadge: { marginTop: 8, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },

  formTitle: { marginBottom: 16 },
  checkinSub: { marginTop: -12, marginBottom: 16 },

  label: { marginBottom: 8 },
  conditionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  conditionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5 },
  conditionText: { textTransform: 'capitalize' },

  damageNote: { borderRadius: 8, padding: 12, marginBottom: 16 },

  actionButton: { marginBottom: 12 },
  rescanButton: { marginTop: 4 },
});
