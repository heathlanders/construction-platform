import { RoleGate } from '@/components/auth/role-gate';

// Clock in/out = field-capable roles (API: OWNER/PM/FOREMAN/FIELD_TECH).
export default function ClockLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow={['owner', 'project_manager', 'foreman', 'field_tech']}>
      {children}
    </RoleGate>
  );
}
