'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/intake', label: 'Business Profile', icon: '📋' },
  { href: '/roadmap', label: 'Roadmap', icon: '🗺️' },
  { href: '/funding', label: 'Funding', icon: '💰' },
  { href: '/starter-kit', label: 'Starter Kit', icon: '📄' },
  { href: '/assistant', label: 'AI Assistant', icon: '🤖' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link href="/" className="text-2xl font-bold text-brand-700">
          BZNS
        </Link>
        <p className="text-xs text-gray-500 mt-1">Micro-Business Launchpad</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <span>⚙️</span>
          <span>Account</span>
        </Link>
      </div>
    </aside>
  );
}
