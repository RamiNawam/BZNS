'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

export default function IntakeWelcome() {
  const { t } = useTranslation();
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-brand-700">{t('appLayout.welcomeToBZNS')}</h1>
      <p className="text-slate-500 mt-2">
        {t('appLayout.intakePrompt')}
      </p>
    </div>
  );
}
