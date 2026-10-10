// screens/warranties/NewClaimScreen.tsx — Submit a new warranty claim

import React, { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { apiPost } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import { Text, Button } from '@/components/ui';

type RouteT = RouteProp<RootStackParamList, 'NewWarrantyClaim'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'NewWarrantyClaim'>;

const CATEGORIES = ['workmanship', 'systems', 'structural', 'other'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export function NewClaimScreen() {
  const { t } = useTranslation('warranties');
  const route = useRoute<RouteT>();
  const navigation = useNavigation<Nav>();
  const { palette } = useTheme();
  const { warrantyId } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('workmanship');
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>('medium');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(t('error'), t('title_and_description_required'));
      return;
    }
    setSubmitting(true);
    try {
      await apiPost(`/v1/builder-warranties/${warrantyId}/claims`, {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(t('error'), e?.message ?? t('submit_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text };

  const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }, active && { backgroundColor: palette.accent, borderColor: palette.accent }]}
      onPress={onPress}
    >
      <Text variant="caption" color={active ? '#ffffff' : palette.textMuted} style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text variant="label" style={styles.label}>{t('claim_title')} *</Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={title}
          onChangeText={setTitle}
          placeholder={t('title_placeholder')}
          placeholderTextColor={palette.textMuted}
          maxLength={200}
        />

        <Text variant="label" style={styles.label}>{t('description')} *</Text>
        <TextInput
          style={[styles.input, styles.multiline, inputStyle]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('description_placeholder')}
          placeholderTextColor={palette.textMuted}
          multiline
          numberOfLines={5}
          maxLength={2000}
        />

        <Text variant="label" style={styles.label}>{t('category')}</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <Chip key={cat} label={t(`category_${cat}`)} active={category === cat} onPress={() => setCategory(cat)} />
          ))}
        </View>

        <Text variant="label" style={styles.label}>{t('priority')}</Text>
        <View style={styles.chipRow}>
          {PRIORITIES.map((p) => (
            <Chip key={p} label={t(`priority_${p}`)} active={priority === p} onPress={() => setPriority(p)} />
          ))}
        </View>

        <Button
          title={t('submit_claim')}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          fullWidth
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 4 },
  label: { marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  multiline: { height: 120, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { textTransform: 'capitalize' },
  submitButton: { marginTop: 24 },
});
