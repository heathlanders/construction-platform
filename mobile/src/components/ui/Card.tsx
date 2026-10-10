// components/ui/Card.tsx — themed surface container (M1).
// Optional onPress makes it a tappable row (≥44pt). Consumes palette.surface + border.

import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme-context';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({
  children,
  onPress,
  style,
  padded = true,
}: CardProps): React.ReactElement {
  const { palette } = useTheme();
  const base: ViewStyle = {
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: padded ? 14 : 0,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [base, { minHeight: 44, opacity: pressed ? 0.9 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
