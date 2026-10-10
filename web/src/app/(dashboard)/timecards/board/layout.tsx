import { RoleGate } from '@/components/auth/role-gate';

// Live on-the-clock board + punch correction = OWNER / PM only (mirrors API).
export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allow={['owner', 'project_manager']}>{children}</RoleGate>;
}
