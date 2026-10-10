import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { PortalHeader } from '@/components/portal/portal-header';

export default async function SubPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  // Only sub_portal users (JWT role is uppercase — compare case-insensitively).
  if ((session.role ?? '').toUpperCase() !== 'SUB_PORTAL') redirect('/');

  return (
    <div className="min-h-screen bg-app">
      <PortalHeader variant="sub" />
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
