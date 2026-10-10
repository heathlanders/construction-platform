// components/ui/index.ts — shared mobile UI kit (M1 — Mobile Design Parity).
//
// USAGE (adopt incrementally, one screen cluster per session):
//   import { Screen, Card, Row, Text, Button, StatusBadge, SeverityBadge, EmptyState } from '@/components/ui';
//
//   <Screen scroll>
//     <Text variant="title">Permits</Text>
//     <Card onPress={open}>
//       <Row title={p.permit_type} subtitle={p.permit_number}
//            right={<StatusBadge status={p.status} />} />
//     </Card>
//     <EmptyState icon="📋" title={t('permits.empty')} />
//   </Screen>
//
// RULES:
// - Chrome color (bg/surface/text/border) comes from useTheme().palette — never literal grays.
// - State badges: status → <StatusBadge status=…>, incident severity → <SeverityBadge severity=…>.
//   Both route through lib/theme statusColor()/severityColor(). Never hardcode status/severity hex.
// - Trade + tile accent colors stay literal at call sites (semantic, canonical by design).
// - Typography: <Text variant=…> off the fixed scale — no raw fontSize on chrome text.
// - Everything is pure JS/RN (no native deps) → OTA-shippable.

export { Text, type TextProps } from './Text';
export { TYPE_SCALE, type TypeVariant, type TypeToken } from './typography';
export { Badge, StatusBadge, SeverityBadge } from './Badge';
export { Button, type ButtonVariant, type ButtonProps } from './Button';
export { Card, type CardProps } from './Card';
export { Screen, type ScreenProps } from './Screen';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { Row, type RowProps } from './Row';
