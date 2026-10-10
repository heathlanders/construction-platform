// components/WhatsNewModal.tsx — "What's New" popup shown once per version after login.
// Content comes from changelog.ts (layman bullets, locale-picked); chrome via the `whatsnew` i18n ns.
// Themed via useTheme. Pure JS → OTA-shippable. Dismiss marks the version seen (AppNavigator).

import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme-context';

interface Props {
  visible: boolean;
  version: string;
  bullets: string[];
  onClose: () => void;
}

export function WhatsNewModal({ visible, version, bullets, onClose }: Props): React.ReactElement {
  const { t } = useTranslation('whatsnew');
  const { palette } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={[styles.title, { color: palette.text }]}>{t('title')}</Text>
          <Text style={[styles.version, { color: palette.textMuted }]}>
            {t('version', { version })}
          </Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {bullets.map((b, i) => (
              <View key={i} style={styles.row}>
                <Text style={[styles.dot, { color: palette.accent }]}>•</Text>
                <Text style={[styles.bullet, { color: palette.text }]}>{b}</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.button, { backgroundColor: palette.accent }]}
            accessibilityRole="button"
            accessibilityLabel={t('dismiss')}
          >
            <Text style={styles.buttonText}>{t('dismiss')}</Text>
          </TouchableOpacity>

          <Text style={[styles.hint, { color: palette.textMuted }]}>{t('disable_hint')}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 420, borderRadius: 14, padding: 20, maxHeight: '80%' },
  emoji: { fontSize: 32, textAlign: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  version: { fontSize: 13, textAlign: 'center', marginTop: 2, marginBottom: 12 },
  list: { flexGrow: 0 },
  listContent: { paddingVertical: 4 },
  row: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  dot: { fontSize: 16, lineHeight: 22 },
  bullet: { flex: 1, fontSize: 15, lineHeight: 22 },
  button: { borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 10, lineHeight: 16 },
});
