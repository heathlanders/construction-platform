'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  role: string;
  currentPath?: string;
}

interface NavItem {
  href: string;
  labelKey: string;
  roles?: string[]; // if undefined = visible to all
}

// Roles that can view financial data
const FINANCIAL_ROLES = ['owner', 'project_manager', 'estimator', 'accountant'];

const NAV_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'nav.dashboard' },
  { href: '/projects', labelKey: 'nav.projects' },
  { href: '/projects/map', labelKey: 'nav.map' },
  { href: '/timecards', labelKey: 'nav.timecards' },
  { href: '/people', labelKey: 'nav.people', roles: ['owner', 'project_manager', 'foreman'] },
  { href: '/vendors', labelKey: 'nav.vendors', roles: ['owner', 'project_manager', 'estimator'] },
  { href: '/cost-codes', labelKey: 'nav.cost_codes', roles: ['owner', 'project_manager', 'estimator', 'accountant'] },
  { href: '/users', labelKey: 'nav.team', roles: ['owner', 'project_manager'] },
  { href: '/financial', labelKey: 'nav.financial', roles: FINANCIAL_ROLES },
  { href: '/reports/profitability', labelKey: 'nav.reports', roles: ['owner', 'accountant'] },
  { href: '/documents', labelKey: 'nav.documents' },
  { href: '/safety', labelKey: 'nav.safety' },
  { href: '/assets', labelKey: 'nav.assets', roles: ['owner', 'project_manager'] },
  { href: '/warranties', labelKey: 'nav.warranties', roles: ['owner', 'project_manager'] },
  { href: '/connections', labelKey: 'nav.connections', roles: ['owner', 'project_manager'] },
  { href: '/client-requests', labelKey: 'nav.client_requests', roles: ['owner', 'project_manager', 'estimator'] },
  { href: '/settings', labelKey: 'nav.settings', roles: ['owner', 'project_manager'] },
  { href: '/settings/api-keys', labelKey: 'nav.api_keys' },
];

export function Sidebar({ role, currentPath }: SidebarProps) {
  const { t, i18n } = useTranslation('common');
  const pathname = usePathname();
  const activePath = currentPath ?? pathname ?? '';

  const roleLc = (role ?? '').toLowerCase();
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(roleLc));

  const handleLang = (lang: string) => {
    void i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
    fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language_preference: lang }),
    }).catch(() => {});
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-700">
        <span className="text-white font-bold text-lg tracking-tight">ConstructionOS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = activePath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
              ].join(' ')}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Language switcher */}
      <div className="px-3 py-4 border-t border-gray-700 flex items-center gap-2">
        <button
          onClick={() => handleLang('en')}
          className={[
            'px-2 py-1 rounded text-sm transition-colors',
            i18n.language === 'en'
              ? 'font-semibold text-white'
              : 'text-gray-400 hover:text-gray-200',
          ].join(' ')}
        >
          EN
        </button>
        <button
          onClick={() => handleLang('es')}
          className={[
            'px-2 py-1 rounded text-sm transition-colors',
            i18n.language === 'es'
              ? 'font-semibold text-white'
              : 'text-gray-400 hover:text-gray-200',
          ].join(' ')}
        >
          ES
        </button>
      </div>
    </aside>
  );
}
