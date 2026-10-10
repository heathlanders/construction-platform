// components/ui/EmptyState.tsx — themed empty/placeholder (M1).

import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: string; // emoji glyph
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps): React.ReactElement {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 }}>
      {icon ? <Text style={{ fontSize: 40, lineHeight: 46 }}>{icon}</Text> : null}
      <Text variant="heading" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="body" muted align="center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: 8 }} />
      ) : null}
    </View>
  );
}
