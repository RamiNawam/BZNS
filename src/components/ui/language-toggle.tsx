'use client';

import { useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import { locales, localeLabels } from '@/lib/i18n/config';

interface LanguageToggleProps {
  currentLocale?: Locale;
  onChange?: (locale: Locale) => void;
}

export default function LanguageToggle({
  currentLocale = 'en',
  onChange,
}: LanguageToggleProps) {
  const [locale, setLocale] = useState<Locale>(currentLocale);

  function handleToggle() {
    const next: Locale = locale === 'en' ? 'fr' : 'en';
    setLocale(next);
    onChange?.(next);
    // TODO: Integrate with next-intl router for full i18n routing
  }

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      aria-label={`Switch to ${locale === 'en' ? 'Français' : 'English'}`}
    >
      <span>{localeLabels[locale]}</span>
      <span className="text-gray-400">↕</span>
    </button>
  );
}
