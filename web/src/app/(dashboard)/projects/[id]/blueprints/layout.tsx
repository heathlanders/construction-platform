import { RoleGate } from '@/components/auth/role-gate';

// Blueprint pages are OWNER/PM (analyze, review, import) + FOREMAN (read) —
// mirrors the API's READ_ROLES. Defense-in-depth only; the API enforces.
export default function BlueprintsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <RoleGate
      allow={['owner', 'project_manager', 'foreman']}
      redirectTo={`/projects/${params.id}`}
    >
      {children}
    </RoleGate>
  );
}
