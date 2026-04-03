'use client';

import { useEffect } from 'react';
import { Map } from 'lucide-react';
import { useProfileStore } from '@/stores/profile-store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import RoadmapList from '@/components/roadmap/roadmap-list';

export default function RoadmapPage() {
  const { profile, loadProfile } = useProfileStore();
  const { t } = useTranslation();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">{t('roadmap.title')}</h1>
        <p className="page-subtitle">
          {t('roadmap.subtitle')}
        </p>
      </div>

      {/* No profile yet */}
      {!profile?.intake_completed && (
        <div className="card p-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100 mx-auto">
            <Map size={24} className="text-slate-400" />
          </div>
          <div>
            <p className="font-heading font-semibold text-slate-900">{t('roadmap.noRoadmapProfile')}</p>
            <p className="text-sm text-slate-500 mt-1">{t('roadmap.empty')}</p>
          </div>
        </div>
      )}

      {/* Roadmap — always render when profile exists; RoadmapList handles empty/loading states */}
      {profile?.intake_completed && <RoadmapList />}

    </div>
  );
}
