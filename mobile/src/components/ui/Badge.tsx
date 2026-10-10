// components/ui/Badge.tsx — pill badges (M1).
// Badge: explicit { fg, bg }. StatusBadge: routes a domain status → statusColor().
// SeverityBadge: routes incident severity → severityColor() (fg + derived tint bg).

import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { statusColor, severityColor, type StatusColors } from '@/lib/theme';
import { Text } from './Text';

function tint(hex: string): string {
  // low-alpha fill from an fg hex so any severity/status fg reads on light+dark.
  return hex + '22';
}

export function Badge({
  label,
  colors,
  style,
}: {
  label: string;
  colors: StatusColors;
  style?: ViewStyle;
}): React.ReactElement {
  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: colors.bg,
        },
        style,
      ]}
    >
      <Text variant="micro" color={colors.fg}>
        {label}
      </Text>
    </View>
  );
}

// Render a domain status string. `label` overrides the displayed text (else humanized status).
export function StatusBadge({
  status,
  label,
  style,
}: {
  status: string | null | undefined;
  label?: string;
  style?: ViewStyle;
}): React.ReactElement {
  const text = label ?? humanize(status);
  return <Badge label={text} colors={statusColor(status)} style={style} />;
}

export function SeverityBadge({
  severity,
  label,
  style,
}: {
  severity: string | null | undefined;
  label?: string;
  style?: ViewStyle;
}): React.ReactElement {
  const fg = severityColor(severity);
  return (
    <Badge label={label ?? humanize(severity)} colors={{ fg, bg: tint(fg) }} style={style} />
  );
}

function humanize(s: string | null | undefined): string {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
