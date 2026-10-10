// components/ui/Button.tsx — themed button (M1). Variants: primary | secondary | ghost | danger.
// ≥44pt tap target by construction (minHeight 48). Pure JS.

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  ...rest
}: ButtonProps): React.ReactElement {
  const { palette } = useTheme();

  let bg = palette.accent;
  let fg = '#ffffff';
  let borderColor = 'transparent';
  if (variant === 'secondary') {
    bg = palette.surfaceAlt;
    fg = palette.text;
    borderColor = palette.border;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    fg = palette.accent;
  } else if (variant === 'danger') {
    bg = STATUS.danger.fg;
    fg = '#ffffff';
  }

  const isOff = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isOff}
      style={({ pressed }) => [
        {
          minHeight: 48,
          paddingHorizontal: 18,
          borderRadius: 10,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isOff ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View>
          <Text variant="bodyStrong" color={fg}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
