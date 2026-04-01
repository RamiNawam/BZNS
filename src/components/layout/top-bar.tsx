'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your business overview' },
  '/roadmap': { title: 'Legal Roadmap', subtitle: 'Step-by-step registration guide' },
  '/funding': { title: 'Funding Matcher', subtitle: 'Québec programs you qualify for' },
  '/assistant': { title: 'AI Assistant', subtitle: 'Ask anything about your business' },
  '/starter-kit': { title: 'Starter Kit', subtitle: 'Download-ready templates' },
  '/intake': { title: 'Business Profile', subtitle: 'Tell us about your idea' },
};

export default function TopBar() {
  const pathname = usePathname();
  const page = pageTitles[pathname] ?? { title: 'BZNS', subtitle: '' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="font-heading font-semibold text-slate-900 text-base leading-none">{page.title}</h1>
        {page.subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{page.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>

        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center">
          <span className="text-xs font-bold text-brand-700">Y</span>
        </div>
      </div>
    </header>
  );
}
