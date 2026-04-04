'use client';

import type { IntakeFormState } from '@/stores/profile-store';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface QuestionCardProps {
  step: number;
  intakeForm: Partial<IntakeFormState>;
  updateField: <K extends keyof IntakeFormState>(key: K, value: IntakeFormState[K]) => void;
}

// ── Reusable primitives ───────────────────────────────────────────────────────

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="label">{children}</label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{children}</p>;
}

function RadioOption({
  name,
  value,
  label,
  desc,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  desc?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all duration-150 ${
        checked
          ? 'border-brand-400 bg-brand-50 shadow-inner-brand'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
      }`}>
        {checked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
      </div>
      <div>
        <div className={`text-sm font-medium transition-colors ${checked ? 'text-brand-900' : 'text-slate-800'}`}>{label}</div>
        {desc && <div className="text-xs text-slate-500 mt-0.5">{desc}</div>}
      </div>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
    </label>
  );
}

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150 ${
        selected
          ? 'bg-brand-600 text-white border-brand-600 shadow-brand-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-700'
      }`}
    >
      {label}
    </button>
  );
}

// ── Step cards ────────────────────────────────────────────────────────────────

export default function QuestionCard({ step, intakeForm, updateField }: QuestionCardProps) {
  const { t } = useTranslation();

  switch (step) {

    // ══════════════════════════════════════════════════════════════════════════
    // Step 0: Business Name + What it involves (classification Q1 & Q2)
    // ══════════════════════════════════════════════════════════════════════════
    case 0:
      return (
        <div className="card p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">{t('intake.q0.title')}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {t('intake.q0.subtitle')}
            </p>
          </div>

          {/* Business name */}
          <div>
            <FieldLabel htmlFor="business_name">{t('intake.q0.nameLabel')}</FieldLabel>
            <input
              id="business_name"
              type="text"
              placeholder={t('intake.q0.namePlaceholder')}
              value={intakeForm.business_name ?? ''}
              onChange={(e) => updateField('business_name', e.target.value)}
              className="input"
            />
            <Hint>{t('intake.q0.nameHint')}</Hint>
          </div>

          {/* Main activity */}
          <div className="space-y-2.5">
            <FieldLabel>{t('intake.q0.activityLabel')}</FieldLabel>
            {[
              { value: 'food',         label: t('intake.q0.food'),         desc: t('intake.q0.foodDesc') },
              { value: 'services',     label: t('intake.q0.services'),     desc: t('intake.q0.servicesDesc') },
              { value: 'professional', label: t('intake.q0.professional'), desc: t('intake.q0.professionalDesc') },
              { value: 'products',     label: t('intake.q0.products'),     desc: t('intake.q0.productsDesc') },
              { value: 'trades',       label: t('intake.q0.trades'),       desc: t('intake.q0.tradesDesc') },
              { value: 'children',     label: t('intake.q0.children'),     desc: t('intake.q0.childrenDesc') },
            ].map((opt) => (
              <RadioOption
                key={opt.value}
                name="business_activity"
                value={opt.value}
                label={opt.label}
                desc={opt.desc}
                checked={intakeForm.business_activity === opt.value}
                onChange={() => updateField('business_activity', opt.value)}
              />
            ))}
          </div>
        </div>
      );

    // ══════════════════════════════════════════════════════════════════════════
    // Step 1: Where you work (classification Q3)
    // ══════════════════════════════════════════════════════════════════════════
    case 1:
      return (
        <div className="card p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">{t('intake.q1.title')}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {t('intake.q1.subtitle')}
            </p>
          </div>

          {/* Work location */}
          <div className="space-y-2.5">
            <FieldLabel>{t('intake.q1.locationLabel')}</FieldLabel>
            {[
              { value: 'home',         label: t('intake.q1.home'),         desc: t('intake.q1.homeDesc') },
              { value: 'commercial',   label: t('intake.q1.commercial'),   desc: t('intake.q1.commercialDesc') },
              { value: 'client_sites', label: t('intake.q1.clientSites'),  desc: t('intake.q1.clientSitesDesc') },
              { value: 'online',       label: t('intake.q1.online'),       desc: t('intake.q1.onlineDesc') },
            ].map((opt) => (
              <RadioOption
                key={opt.value}
                name="work_location"
                value={opt.value}
                label={opt.label}
                desc={opt.desc}
                checked={intakeForm.work_location === opt.value}
                onChange={() => updateField('work_location', opt.value)}
              />
            ))}
          </div>

        </div>
      );

    // ══════════════════════════════════════════════════════════════════════════
    // Step 2: Pricing model + Describe your idea (classification Q5 + roadmap)
    // ══════════════════════════════════════════════════════════════════════════
    case 2:
      return (
        <div className="card p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">{t('intake.q2.title')}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {t('intake.q2.subtitle')}
            </p>
          </div>

          {/* Pricing model */}
          <div className="space-y-2.5">
            <FieldLabel>{t('intake.q2.pricingLabel')}</FieldLabel>
            {[
              { value: 'per_item',        label: t('intake.q2.perItem'),        desc: t('intake.q2.perItemDesc') },
              { value: 'per_hour',        label: t('intake.q2.perHour'),        desc: t('intake.q2.perHourDesc') },
              { value: 'per_session',     label: t('intake.q2.perSession'),     desc: t('intake.q2.perSessionDesc') },
              { value: 'per_project',     label: t('intake.q2.perProject'),     desc: t('intake.q2.perProjectDesc') },
              { value: 'subscription',    label: t('intake.q2.subscription'),   desc: t('intake.q2.subscriptionDesc') },
            ].map((opt) => (
              <RadioOption
                key={opt.value}
                name="pricing_model"
                value={opt.value}
                label={opt.label}
                desc={opt.desc}
                checked={intakeForm.pricing_model === opt.value}
                onChange={() => updateField('pricing_model', opt.value)}
              />
            ))}
          </div>

          {/* Business description (for roadmap) */}
          <div>
            <FieldLabel htmlFor="business_idea">{t('intake.q2.descLabel')}</FieldLabel>
            <textarea
              id="business_idea"
              rows={4}
              placeholder={t('intake.q2.descPlaceholder')}
              value={intakeForm.business_idea ?? ''}
              onChange={(e) => updateField('business_idea', e.target.value)}
              className="input resize-none"
            />
            <Hint>
              {t('intake.q2.descHint')}
            </Hint>
          </div>
        </div>
      );

    // ══════════════════════════════════════════════════════════════════════════
    // Step 3: Location & Setup (legal roadmap)
    // ══════════════════════════════════════════════════════════════════════════
    case 3:
      return (
        <div className="card p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">{t('intake.q3.title')}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {t('intake.q3.subtitle')}
            </p>
          </div>

          {/* City */}
          <div className="space-y-2.5">
            <FieldLabel>{t('intake.q3.cityLabel')}</FieldLabel>
            {[
              { value: 'montreal', label: t('intake.q3.montreal'), desc: t('intake.q3.montrealDesc') },
              { value: 'quebec_city', label: t('intake.q3.quebecCity'), desc: t('intake.q3.quebecCityDesc') },
              { value: 'laval', label: t('intake.q3.laval'), desc: t('intake.q3.lavalDesc') },
              { value: 'other_quebec', label: t('intake.q3.otherQuebec'), desc: t('intake.q3.otherQuebecDesc') },
            ].map((opt) => (
              <RadioOption
                key={opt.value}
                name="location"
                value={opt.value}
                label={opt.label}
                desc={opt.desc}
                checked={intakeForm.location === opt.value}
                onChange={() => updateField('location', opt.value)}
              />
            ))}
          </div>

          {/* Borough (Montréal only) */}
          {intakeForm.location === 'montreal' && (
            <div>
              <FieldLabel htmlFor="borough">{t('intake.q3.boroughLabel')}</FieldLabel>
              <input
                id="borough"
                type="text"
                placeholder={t('intake.q3.boroughPlaceholder')}
                value={intakeForm.borough ?? ''}
                onChange={(e) => updateField('borough', e.target.value)}
                className="input"
              />
              <Hint>{t('intake.q3.boroughHint')}</Hint>
            </div>
          )}

          {/* Partners */}
          <div className="space-y-2.5">
            <FieldLabel>{t('intake.q3.partnersLabel')}</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <RadioOption
                name="has_partners"
                value="yes"
                label={t('intake.q3.yes')}
                desc={t('intake.q3.yesDesc')}
                checked={intakeForm.has_partners === true}
                onChange={() => updateField('has_partners', true)}
              />
              <RadioOption
                name="has_partners"
                value="no"
                label={t('intake.q3.no')}
                desc={t('intake.q3.noDesc')}
                checked={intakeForm.has_partners === false}
                onChange={() => updateField('has_partners', false)}
              />
            </div>
          </div>
        </div>
      );

    // ══════════════════════════════════════════════════════════════════════════
    // Step 4: About You (funding matching)
    // ══════════════════════════════════════════════════════════════════════════
    case 4:
      return (
        <div className="card p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">{t('intake.q4.title')}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {t('intake.q4.subtitle')}
            </p>
          </div>

          {/* Age */}
          <div>
            <FieldLabel htmlFor="age">{t('intake.q4.ageLabel')}</FieldLabel>
            <input
              id="age"
              type="number"
              inputMode="numeric"
              min={16}
              max={99}
              placeholder="e.g., 28"
              value={intakeForm.age ?? ''}
              onChange={(e) =>
                updateField('age', e.target.value ? Number(e.target.value) : null)
              }
              className="input w-32"
            />
            <Hint>{t('intake.q4.ageHint')}</Hint>
          </div>

          {/* Immigration status */}
          <div className="space-y-2.5">
            <FieldLabel>{t('intake.q4.immigrationLabel')}</FieldLabel>
            {[
              { value: 'citizen', label: t('intake.q4.citizen') },
              { value: 'permanent_resident', label: t('intake.q4.permanentResident') },
              { value: 'temporary_resident', label: t('intake.q4.temporaryResident') },
              { value: 'refugee', label: t('intake.q4.refugee') },
              { value: 'prefer_not_to_say', label: t('intake.q4.preferNotToSay') },
            ].map((opt) => (
              <RadioOption
                key={opt.value}
                name="immigration_status"
                value={opt.value}
                label={opt.label}
                checked={intakeForm.immigration_status === opt.value}
                onChange={() => updateField('immigration_status', opt.value)}
              />
            ))}
          </div>

          {/* Languages */}
          <div>
            <FieldLabel>{t('intake.q4.languagesLabel')}</FieldLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { code: 'fr', label: t('intake.q4.french') },
                { code: 'en', label: t('intake.q4.english') },
                { code: 'es', label: t('intake.q4.spanish') },
                { code: 'ar', label: t('intake.q4.arabic') },
                { code: 'zh', label: t('intake.q4.mandarin') },
                { code: 'pt', label: t('intake.q4.portuguese') },
                { code: 'ht', label: t('intake.q4.creole') },
                { code: 'other', label: t('intake.q4.otherLang') },
              ].map((lang) => {
                const langs = intakeForm.languages ?? [];
                const selected = langs.includes(lang.code);
                return (
                  <ToggleChip
                    key={lang.code}
                    label={lang.label}
                    selected={selected}
                    onClick={() => {
                      const next = selected
                        ? langs.filter((l) => l !== lang.code)
                        : [...langs, lang.code];
                      updateField('languages', next);
                    }}
                  />
                );
              })}
            </div>
            <Hint>{t('intake.q4.languagesHint')}</Hint>
          </div>

          {/* Preferred language */}
          <div className="space-y-2.5">
            <FieldLabel>{t('intake.q4.prefLangLabel')}</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <RadioOption
                name="preferred_language"
                value="en"
                label="English"
                checked={intakeForm.preferred_language === 'en'}
                onChange={() => updateField('preferred_language', 'en')}
              />
              <RadioOption
                name="preferred_language"
                value="fr"
                label="Français"
                checked={intakeForm.preferred_language === 'fr'}
                onChange={() => updateField('preferred_language', 'fr')}
              />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
