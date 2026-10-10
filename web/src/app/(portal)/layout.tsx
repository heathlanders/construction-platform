import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { PortalHeader } from '@/components/portal/portal-header';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Portal is only for client_portal role
  if (session.role !== 'client_portal') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-app">
      <PortalHeader variant="client" />
      <main className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
