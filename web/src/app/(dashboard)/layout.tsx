import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession, PORTAL_HOME } from '@/lib/session';
import { serverApi } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { ToastProvider } from '@/components/ui/toast';
import { ConfirmProvider } from '@/components/ui/confirm-dialog';
import { RealtimeProvider } from '@/components/realtime/realtime-provider';

interface MeResponse {
  user: { first_name: string; last_name: string; email: string };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  // External portal users (client / sub / homeowner) must never render the company dashboard.
  const portalHome = PORTAL_HOME[session.role];
  if (portalHome) redirect(portalHome);

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';

  // Fetch display name — fall back to email if unavailable (network error, expired token)
  let displayName = session.email;
  try {
    const me = await serverApi<MeResponse>('/users/me');
    displayName = `${me.user.first_name} ${me.user.last_name}`.trim() || session.email;
  } catch {
    // Non-fatal — use email from JWT
  }

  return (
    <ToastProvider>
      <RealtimeProvider>
        <ConfirmProvider>
          <div className="flex min-h-screen">
            <Sidebar role={session.role} currentPath={pathname} />
            <div className="flex-1 flex flex-col min-w-0">
              <TopNav userName={displayName} role={session.role} />
              <main className="flex-1 p-6 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </ConfirmProvider>
      </RealtimeProvider>
    </ToastProvider>
  );
}
