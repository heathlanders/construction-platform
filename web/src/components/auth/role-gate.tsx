import { redirect } from 'next/navigation';
import { getSession, hasRole } from '@/lib/session';

/**
 * Server-side role gate. Reads the JWT role from the session cookie and
 * redirects when the current user's role is not in `allow`.
 *
 * Roles are the lowercase user_role enum values (owner, project_manager,
 * foreman, field_tech, …) — the same casing the Sidebar filters on.
 *
 * Defense-in-depth only: the API is the source of truth and rejects
 * unauthorized actions regardless. This stops a user reaching a view they
 * have no business in (e.g. a Field Tech opening the approval queue).
 */
export async function RoleGate({
  allow,
  redirectTo = '/timecards/my',
  children,
}: {
  allow: string[];
  redirectTo?: string;
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session.role, allow)) redirect(redirectTo);
  return <>{children}</>;
}
