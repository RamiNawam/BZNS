'use client';

import LanguageToggle from '@/components/ui/language-toggle';

export default function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-sm text-gray-500">
        {/* Breadcrumb or page title injected by child pages */}
      </div>
      <div className="flex items-center gap-4">
        <LanguageToggle />
        <div className="h-8 w-8 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 text-sm font-semibold">
          {/* User avatar / initials */}
          U
        </div>
      </div>
    </header>
  );
}
