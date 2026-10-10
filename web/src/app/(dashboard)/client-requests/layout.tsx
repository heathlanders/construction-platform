import { RoleGate } from '@/components/auth/role-gate';

// Design Studio contractor pages — OWNER / PM / ESTIMATOR (mirrors the API). Defense-in-depth only.
export default function ClientRequestsLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allow={['owner', 'project_manager', 'estimator']} redirectTo="/projects">{children}</RoleGate>;
}
