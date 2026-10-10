// components/ui/Text.tsx — themed Text with a fixed type scale (M1).
// <Text variant="heading">…</Text>. Color defaults to palette.text; muted → textMuted.
// Any RN TextProps (numberOfLines, onPress, style override…) pass through.

import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/lib/theme-context';
import { TYPE_SCALE, type TypeVariant } from './typography';

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  muted?: boolean;
  color?: string; // explicit override (e.g. statusColor().fg)
  align?: TextStyle['textAlign'];
}

export function Text({
  variant = 'body',
  muted = false,
  color,
  align,
  style,
  ...rest
}: TextProps): React.ReactElement {
  const { palette } = useTheme();
  const token = TYPE_SCALE[variant];
  const resolved = color ?? (muted ? palette.textMuted : palette.text);
  return (
    <RNText
      style={[
        {
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          fontWeight: token.fontWeight,
          color: resolved,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    />
  );
}
