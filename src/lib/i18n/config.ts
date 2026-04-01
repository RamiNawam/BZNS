/**
 * i18n configuration for BZNS.
 * Uses next-intl for bilingual (English / French) support.
 */

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
};
