// components/ProfileEditor.tsx — edit own name (Doc 19 #8 profile). Prefilled from the JWT user
// (useCurrentUser); saves via PATCH /v1/users/:id (self-edit allowed — isSelf, no role gate).
// No PATCH /users/me exists; web does the same GET-me → PATCH-:id dance. Email is read-only.
// ⚠️ The display name elsewhere comes from the JWT and only refreshes on next login (the token
// isn't reissued on edit) — the form shows the new value immediately; nav/header names update at relogin.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mobileApi } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';
import { useCurrentUser } from '@/lib/user-context';

export function ProfileEditor(): React.ReactElement | null {
  const { t } = useTranslation('profile');
  const { palette } = useTheme();
  const { user, refresh } = useCurrentUser();
  const [first, setFirst] = useState(user?.first_name ?? '');
  const [last, setLast] = useState(user?.last_name ?? '');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const dirty = first.trim() !== (user.first_name ?? '') || last.trim() !== (user.last_name ?? '');
  const valid = first.trim().length > 0 && last.trim().length > 0;

  const save = async () => {
    if (!dirty || !valid) return;
    setSaving(true);
    try {
      await mobileApi(`/users/${user.user_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ first_name: first.trim(), last_name: last.trim() }),
      });
      await refresh();
      Alert.alert('', t('saved', { defaultValue: 'Profile saved' }));
    } catch (e) {
      Alert.alert(t('save_failed', { defaultValue: 'Could not save' }), e instanceof Error ? e.message : '');
    } finally { setSaving(false); }
  };

  return (
    <View style={[styles.card, { backgroundColor: palette.surface }]}>
      <Text style={[styles.label, { color: palette.textMuted }]}>{t('first_name', { defaultValue: 'First name' })}</Text>
      <TextInput
        value={first}
        onChangeText={setFirst}
        style={[styles.input, { color: palette.text, borderColor: palette.border }]}
        placeholder={t('first_name', { defaultValue: 'First name' })}
        placeholderTextColor={palette.textMuted}
      />
      <Text style={[styles.label, { color: palette.textMuted }]}>{t('last_name', { defaultValue: 'Last name' })}</Text>
      <TextInput
        value={last}
        onChangeText={setLast}
        style={[styles.input, { color: palette.text, borderColor: palette.border }]}
        placeholder={t('last_name', { defaultValue: 'Last name' })}
        placeholderTextColor={palette.textMuted}
      />
      <Text style={[styles.label, { color: palette.textMuted }]}>{t('email', { defaultValue: 'Email' })}</Text>
      <Text style={[styles.readonly, { color: palette.text }]}>{user.email}</Text>

      <TouchableOpacity
        onPress={save}
        disabled={!dirty || !valid || saving}
        style={[styles.btn, { backgroundColor: palette.accent }, (!dirty || !valid || saving) && styles.btnDisabled]}
        accessibilityRole="button"
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('save', { defaultValue: 'Save' })}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 10, padding: 14, marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  readonly: { fontSize: 15, paddingVertical: 6 },
  btn: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
