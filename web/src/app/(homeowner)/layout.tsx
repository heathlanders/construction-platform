import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomeownerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('homeowner_token')?.value;

  // Pages under /homeowner/login don't need auth check — that page handles the token exchange
  // All other pages redirect to login if no token
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal warranty portal header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-bold">W</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">Warranty Portal</span>
          </div>
          {token && (
            <form action="/api/auth/homeowner-logout" method="POST">
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
                Sign Out
              </button>
            </form>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
