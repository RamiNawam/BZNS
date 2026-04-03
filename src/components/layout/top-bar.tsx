'use client';

import Link from 'next/link';
import { Bell, Settings } from 'lucide-react';
import { useProfileStore } from '@/stores/profile-store';

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
  const { profile } = useProfileStore();
  const initials = getInitials(profile);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6 shrink-0">
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
