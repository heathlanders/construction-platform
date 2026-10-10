// components/RoleGate.tsx — UX-only role gate (parity with web/src/components/auth/role-gate.tsx).
// Renders children only when the current user's role is in `allow`; otherwise `fallback`.
// Defense-in-depth — the API is the source of truth and rejects unauthorized actions regardless.

import React from 'react';
import { hasRole, type Role } from '@/lib/tileManifest';
import { useCurrentUser } from '@/lib/user-context';

export function RoleGate({
  allow,
  children,
  fallback = null,
}: {
  allow: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactElement {
  const { role } = useCurrentUser();
  return <>{hasRole(role, allow) ? children : fallback}</>;
}
