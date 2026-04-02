'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Settings } from 'lucide-react';
import { useProfileStore } from '@/stores/profile-store';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your business overview' },
  '/roadmap': { title: 'Legal Roadmap', subtitle: 'Step-by-step registration guide' },
  '/funding': { title: 'Funding Matcher', subtitle: 'Québec programs you qualify for' },
  '/assistant': { title: 'AI Assistant', subtitle: 'Ask anything about your business' },
  '/starter-kit': { title: 'Starter Kit', subtitle: 'Download-ready templates' },
  '/intake': { title: 'Business Profile', subtitle: 'Tell us about your idea' },
  '/settings': { title: 'Settings', subtitle: 'Your profile and preferences' },
};

function getInitials(profile: { full_name?: string | null; business_name?: string | null } | null): string {
  if (profile?.full_name) {
    return profile.full_name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  if (profile?.business_name) {
    return profile.business_name.slice(0, 2).toUpperCase();
  }
  return 'U';
}

export default function TopBar() {
  const pathname = usePathname();
  const page = pageTitles[pathname] ?? { title: 'BZNS', subtitle: '' };
  const { profile } = useProfileStore();
  const initials = getInitials(profile);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="font-heading font-semibold text-slate-900 text-base leading-none">{page.title}</h1>
        {page.subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{page.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>

        <Link
          href="/settings"
          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Settings"
        >
          <Settings size={16} />
        </Link>

        {/* Avatar → settings */}
        <Link
          href="/settings"
          className="h-8 w-8 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center hover:border-brand-400 transition-colors"
          title={profile?.business_name ?? profile?.full_name ?? 'Your profile'}
        >
          <span className="text-xs font-bold text-brand-700">{initials}</span>
        </Link>
      </div>
    </header>
  );
}
