// components/ui/Row.tsx — themed list row / ListItem (M1).
// title + optional subtitle on the left, optional right element (badge/chevron), tappable.
// ≥44pt tap target.

import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme-context';
import { Text } from './Text';

export interface RowProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Row({
  title,
  subtitle,
  left,
  right,
  onPress,
  style,
}: RowProps): React.ReactElement {
  const { palette } = useTheme();
  const body = (
    <>
      {left ? <View style={{ marginRight: 12 }}>{left}</View> : null}
      <View style={{ flex: 1 }}>
        <Text variant="subheading">{title}</Text>
        {subtitle ? (
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={{ marginLeft: 12 }}>{right}</View> : null}
    </>
  );

  const base: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1 }, style]}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{body}</View>;
}
