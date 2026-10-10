// FuelLog.tsx — Log fuel fill-up for vehicles and equipment
// Business+ tier only (T-56).
// Offline-first: queued in AsyncStorage if network unavailable.

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mobileApi } from '@/lib/api';
import { enqueue, flushQueue, QUEUE_KEYS } from '@/lib/offline-queue';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { Text, Button } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AssetFuelLog'>;

// Fuel-category accent (literal by design — like a tile accent).
const FUEL_ACCENT = '#b45309';

interface QueuedFuelLog { assetId: string; body: Record<string, unknown> }

async function enqueueFuelLog(payload: QueuedFuelLog) {
  await enqueue(QUEUE_KEYS.assetFuelLogs, payload);
}

export async function flushFuelLogQueue() {
  await flushQueue<QueuedFuelLog>(QUEUE_KEYS.assetFuelLogs, async (item) => {
    await mobileApi(`/assets/${item.assetId}/fuel-logs`, {
      method: 'POST',
      body: JSON.stringify(item.body),
    });
  });
}

const FUEL_TYPES = ['gasoline', 'diesel', 'propane', 'electric', 'natural_gas', 'other'] as const;
type FuelType = typeof FUEL_TYPES[number];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FuelLog({ route, navigation }: Props) {
  const { assetId, assetName } = route.params;
  const { t } = useTranslation('common');
  const { palette } = useTheme();

  const [logDate, setLogDate] = useState(todayISO());
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [gallons, setGallons] = useState('');
  const [costPerGallon, setCostPerGallon] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [stationName, setStationName] = useState('');
  const [isFullFill, setIsFullFill] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const totalCostCents = Math.round(
    parseFloat(gallons || '0') * parseFloat(costPerGallon || '0') * 100
  );

  const isValid = gallons.trim() !== '' && parseFloat(gallons) > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);

    const costPerGallonCents = costPerGallon
      ? Math.round(parseFloat(costPerGallon) * 100)
      : undefined;

    const body: Record<string, unknown> = {
      log_date: logDate,
      fuel_type: fuelType,
      gallons: parseFloat(gallons),
      cost_per_gallon_cents: costPerGallonCents,
      total_cost_cents: costPerGallonCents
        ? Math.round(parseFloat(gallons) * costPerGallonCents)
        : 0,
      odometer_reading: odometerReading ? parseFloat(odometerReading) : undefined,
      is_full_fill: isFullFill,
      station_name: stationName.trim() || undefined,
    };

    try {
      await mobileApi(`/assets/${assetId}/fuel-logs`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      Alert.alert('', 'Fuel log saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('error');
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        await enqueueFuelLog({ assetId, body });
        Alert.alert('Saved Offline', 'Fuel log will sync when reconnected.', [
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

        <Text variant="label" style={styles.label}>Date</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={logDate}
          onChangeText={setLogDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={palette.textMuted}
          keyboardType="numbers-and-punctuation"
        />

        <Text variant="label" style={styles.label}>Fuel Type</Text>
        <View style={styles.chipRow}>
          {FUEL_TYPES.map((ft) => {
            const active = fuelType === ft;
            return (
              <TouchableOpacity
                key={ft}
                style={[styles.chip, { borderColor: palette.border }, active && { backgroundColor: FUEL_ACCENT, borderColor: FUEL_ACCENT }]}
                onPress={() => setFuelType(ft)}
              >
                <Text variant="caption" color={active ? '#ffffff' : palette.textMuted} style={styles.chipText}>
                  {ft.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text variant="label" style={styles.label}>Gallons *</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={gallons}
          onChangeText={setGallons}
          keyboardType="decimal-pad"
          placeholder="e.g. 24.5"
          placeholderTextColor={palette.textMuted}
        />

        <Text variant="label" style={styles.label}>Price per Gallon ($)</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={costPerGallon}
          onChangeText={setCostPerGallon}
          keyboardType="decimal-pad"
          placeholder="e.g. 3.89"
          placeholderTextColor={palette.textMuted}
        />

        {totalCostCents > 0 && (
          <Text variant="bodyStrong" color={FUEL_ACCENT} style={styles.totalPreview}>
            Total: ${(totalCostCents / 100).toFixed(2)}
          </Text>
        )}

        <Text variant="label" style={styles.label}>Odometer / Hours Reading</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={odometerReading}
          onChangeText={setOdometerReading}
          keyboardType="numeric"
          placeholder="e.g. 45231"
          placeholderTextColor={palette.textMuted}
        />

        <Text variant="label" style={styles.label}>Station Name (optional)</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={stationName}
          onChangeText={setStationName}
          placeholder="e.g. Pilot Flying J"
          placeholderTextColor={palette.textMuted}
        />

        <View style={styles.toggleRow}>
          <Text variant="label">Full Fill?</Text>
          <TouchableOpacity
            style={[styles.toggle, { backgroundColor: isFullFill ? STATUS.success.fg : palette.surfaceAlt }]}
            hitSlop={8}
            onPress={() => setIsFullFill((v) => !v)}
          >
            <Text variant="label" color={isFullFill ? '#ffffff' : palette.textMuted}>{isFullFill ? 'Yes' : 'No'}</Text>
          </TouchableOpacity>
        </View>
        <Text variant="micro" muted style={styles.toggleHint}>
          Partial fills are excluded from MPG/cost-per-hour calculations.
        </Text>

        <Button
          title="Save Fuel Log"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!isValid || submitting}
          fullWidth
          style={{ marginTop: 28, backgroundColor: FUEL_ACCENT }}
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

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5 },
  chipText: { textTransform: 'capitalize' },

  totalPreview: { marginTop: 8, marginStart: 4 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 4 },
  toggle: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  toggleHint: { marginBottom: 4 },

  submitButton: { marginTop: 28 },
});
