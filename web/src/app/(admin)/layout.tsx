import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLogoutButton from './_LogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('platform_token')?.value;

  if (!token) redirect('/admin/login');

  // Decode JWT payload (no verification — just check claims for routing)
  const [, payload] = token.split('.');
  let claims: { role?: string; tenant_id?: string } = {};
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64').toString()) as { role?: string; tenant_id?: string };
  } catch {
    redirect('/admin/login');
  }

  if (claims.role !== 'SUPER_ADMIN') redirect('/dashboard');

  // These pages resolve at the ROOT (the (admin) route group adds no path segment),
  // so the hrefs are root-relative — NOT '/admin/*' (which would 404).
  const NAV_ITEMS = [
    { href: '/tenants', label: 'Tenants' },
    { href: '/jurisdictions', label: 'Jurisdictions' },
    { href: '/jobs', label: 'DLQ Jobs' },
    { href: '/portal-migrations', label: 'Portal Migrations' },
    { href: '/audit-log', label: 'Audit Log' },
    { href: '/account', label: 'Account' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">Platform Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <AdminLogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
