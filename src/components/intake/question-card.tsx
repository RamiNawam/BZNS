'use client';

import type { IntakeFormState } from '@/stores/profile-store';

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
  switch (step) {

    // ── Step 0: Your Business ──────────────────────────────────────────────────
    case 0:
      return (
        <div className="card p-8 space-y-5">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">Your business idea</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Describe what you want to build — no need to be formal. A sentence or two is perfect.
            </p>
          </div>

          <div>
            <FieldLabel htmlFor="business_idea">What is your business idea?</FieldLabel>
            <textarea
              id="business_idea"
              rows={5}
              placeholder="e.g., I want to sell homemade pastries from my kitchen and deliver in my neighbourhood…"
              value={intakeForm.business_idea ?? ''}
              onChange={(e) => updateField('business_idea', e.target.value)}
              className="input resize-none"
            />
            <Hint>
              Be as specific or vague as you like — we&apos;ll use this to personalise your roadmap.
            </Hint>
          </div>
        </div>
      );

    // ── Step 1: Location & Setup ───────────────────────────────────────────────
    case 1:
      return (
        <div className="card p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">Location &amp; setup</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Where and how you plan to operate affects which permits and programs apply to you.
            </p>
          </div>

          {/* City */}
          <div className="space-y-2.5">
            <FieldLabel>Which city or region are you in?</FieldLabel>
            {[
              { value: 'montreal', label: 'Montréal', desc: 'Island of Montréal (CMM)' },
              { value: 'quebec_city', label: 'Québec City', desc: 'Capitale-Nationale region' },
              { value: 'laval', label: 'Laval', desc: 'North Shore suburb of Montréal' },
              { value: 'other_quebec', label: 'Other Québec municipality', desc: 'Anywhere else in the province' },
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
              <FieldLabel htmlFor="borough">Which borough? (optional)</FieldLabel>
              <input
                id="borough"
                type="text"
                placeholder="e.g., Rosemont–La Petite-Patrie, Plateau-Mont-Royal…"
                value={intakeForm.borough ?? ''}
                onChange={(e) => updateField('borough', e.target.value)}
                className="input"
              />
              <Hint>Helps us match borough-specific grants and zoning info.</Hint>
            </div>
          )}

          {/* Home-based */}
          <div className="space-y-2.5">
            <FieldLabel>Will you operate from home, at least initially?</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <RadioOption
                name="is_home_based"
                value="yes"
                label="Yes — home-based"
                checked={intakeForm.is_home_based === true}
                onChange={() => updateField('is_home_based', true)}
              />
              <RadioOption
                name="is_home_based"
                value="no"
                label="No — separate location"
                checked={intakeForm.is_home_based === false}
                onChange={() => updateField('is_home_based', false)}
              />
            </div>
          </div>
        </div>
      );

    // ── Step 2: Finances ───────────────────────────────────────────────────────
    case 2:
      return (
        <div className="card p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">Finances</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Rough estimates are totally fine — we use these to calculate GST/QST obligations
              and match funding programs.
            </p>
          </div>

          {/* Monthly revenue */}
          <div>
            <FieldLabel htmlFor="monthly_rev">Expected monthly revenue (CAD)</FieldLabel>
            <div className="relative mt-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">$</span>
              <input
                id="monthly_rev"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="e.g., 3 000"
                value={intakeForm.expected_monthly_revenue ?? ''}
                onChange={(e) =>
                  updateField('expected_monthly_revenue', e.target.value ? Number(e.target.value) : null)
                }
                className="input pl-7"
              />
            </div>
            <Hint>
              Annual: ${((intakeForm.expected_monthly_revenue ?? 0) * 12).toLocaleString()} CAD.
              GST/QST registration required above $30,000/year.
            </Hint>
          </div>

          {/* Partners */}
          <div className="space-y-2.5">
            <FieldLabel>Will you have business partners or co-founders?</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <RadioOption
                name="has_partners"
                value="yes"
                label="Yes"
                desc="Partnership or multi-shareholder corp"
                checked={intakeForm.has_partners === true}
                onChange={() => updateField('has_partners', true)}
              />
              <RadioOption
                name="has_partners"
                value="no"
                label="No"
                desc="Sole founder / owner"
                checked={intakeForm.has_partners === false}
                onChange={() => updateField('has_partners', false)}
              />
            </div>
          </div>
        </div>
      );

    // ── Step 3: About You ──────────────────────────────────────────────────────
    case 3:
      return (
        <div className="card p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">About you</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Used to match funding programs and services you qualify for.
              Everything is private and optional.
            </p>
          </div>

          {/* Age */}
          <div>
            <FieldLabel htmlFor="age">Your age (optional)</FieldLabel>
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
            <Hint>Some grants target entrepreneurs under 35 or over 50.</Hint>
          </div>

          {/* Immigration status */}
          <div className="space-y-2.5">
            <FieldLabel>Immigration status</FieldLabel>
            {[
              { value: 'citizen', label: 'Canadian citizen' },
              { value: 'permanent_resident', label: 'Permanent resident' },
              { value: 'temporary_resident', label: 'Temporary resident (work/study permit)' },
              { value: 'refugee', label: 'Refugee claimant / protected person' },
              { value: 'prefer_not_to_say', label: 'Prefer not to say' },
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
            <FieldLabel>Languages you&apos;re comfortable working in</FieldLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { code: 'fr', label: 'French' },
                { code: 'en', label: 'English' },
                { code: 'es', label: 'Spanish' },
                { code: 'ar', label: 'Arabic' },
                { code: 'zh', label: 'Mandarin / Cantonese' },
                { code: 'pt', label: 'Portuguese' },
                { code: 'ht', label: 'Haitian Creole' },
                { code: 'other', label: 'Other' },
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
            <Hint>Select all that apply. We&apos;ll surface resources in your languages.</Hint>
          </div>

          {/* Preferred language */}
          <div className="space-y-2.5">
            <FieldLabel>Preferred language for your roadmap &amp; AI assistant</FieldLabel>
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
