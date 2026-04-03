import { useCallback } from 'react';
import { useLocaleStore } from '@/stores/locale-store';
import en from './en.json';
import fr from './fr.json';
import type { Locale } from './config';

const messages: Record<Locale, Record<string, unknown>> = { en, fr };

/**
 * Resolve a dot-separated key like "nav.dashboard" from a nested object.
 */
function resolve(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : path;
}

/**
 * Hook that returns a `t()` function bound to the current locale.
 *
 * Usage:
 *   const { t, locale } = useTranslation();
 *   t('nav.dashboard') // → "Dashboard" or "Tableau de bord"
 */
export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback(
    (key: string) => resolve(messages[locale], key),
    [locale],
  );

  return { t, locale };
}
