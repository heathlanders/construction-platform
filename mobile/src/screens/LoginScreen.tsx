import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { mobileApi } from '@/lib/api';
import { storeAuth, StoredUser } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import { Text, Button } from '@/components/ui';

interface LoginResponse {
  token: string;
  user: StoredUser;
}

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t } = useTranslation('common');
  const { palette } = useTheme();
  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!tenantSlug.trim() || !email.trim() || !password) return;
    setLoading(true);
    try {
      const res = await mobileApi<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          tenant_slug: tenantSlug.trim(),
          email: email.trim(),
          password,
          platform: 'mobile',
        }),
      });
      await storeAuth(res.token);
      onLogin();
    } catch (err) {
      Alert.alert(t('error'), err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <Text variant="display" align="center" style={styles.appName}>The Jobsite</Text>
        <TextInput
          style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
          placeholder={t('tenant_slug_placeholder')}
          placeholderTextColor={palette.textMuted}
          value={tenantSlug}
          onChangeText={setTenantSlug}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="organizationName"
          accessibilityLabel={t('tenant_slug')}
        />
        <TextInput
          style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
          placeholder={t('email')}
          placeholderTextColor={palette.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          textContentType="emailAddress"
        />
        <TextInput
          style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
          placeholder={t('password')}
          placeholderTextColor={palette.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />
        <Button
          title={t('sign_in')}
          onPress={handleLogin}
          disabled={!tenantSlug || !email || !password}
          loading={loading}
          fullWidth
          style={styles.button}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  appName: {
    marginBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
  },
});
