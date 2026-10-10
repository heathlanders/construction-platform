// components/ui/Screen.tsx — themed screen wrapper (M1).
// Fills with palette.background + applies safe-area insets. Optional scroll.

import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme-context';

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: { top?: boolean; bottom?: boolean };
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = { top: false, bottom: true },
  style,
  contentStyle,
}: ScreenProps): React.ReactElement {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingTop: edges.top ? insets.top : 0,
    paddingBottom: edges.bottom ? insets.bottom : 0,
    paddingHorizontal: padded ? 16 : 0,
  };

  if (scroll) {
    return (
      <ScrollView
        style={[{ flex: 1, backgroundColor: palette.background }, style]}
        contentContainerStyle={[pad, { paddingVertical: padded ? 16 : 0 }, contentStyle]}
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <View style={[{ flex: 1, backgroundColor: palette.background }, pad, style]}>{children}</View>
  );
}
