'use client';

import { Card } from '@/components/ui/card';
import type { IntakeFormState } from '@/stores/profile-store';

interface QuestionCardProps {
  step: number;
  intakeForm: Partial<IntakeFormState>;
  updateField: <K extends keyof IntakeFormState>(key: K, value: IntakeFormState[K]) => void;
}

// ── Reusable primitives ───────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1">{children}</p>;
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
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
        checked
          ? 'border-teal-500 bg-teal-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 accent-teal-600"
      />
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        {desc && <div className="text-sm text-gray-500">{desc}</div>}
      </div>
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
      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
        selected
          ? 'bg-teal-600 text-white border-teal-600'
          : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
      }`}
    >
      {label}
    </button>
  );
}

// ── Step cards ────────────────────────────────────────────────────────────────

export default function QuestionCard({ step, intakeForm, updateField }: QuestionCardProps) {
  switch (step) {
    // ── Step 0: Your Business ─────────────────────────────────────────────────
    case 0:
      return (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Your business idea</h2>
          <p className="text-sm text-gray-500 mb-5">
            Describe what you want to build — no need to be formal. A sentence or two is perfect.
          </p>

          <div>
            <FieldLabel>What is your business idea?</FieldLabel>
            <textarea
              rows={4}
              placeholder="e.g., A food truck selling Haitian cuisine at Montréal street markets…"
              value={intakeForm.business_idea ?? ''}
              onChange={(e) => updateField('business_idea', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            <Hint>
              Be as specific or as vague as you like — we&apos;ll use this to personalise your roadmap.
            </Hint>
          </div>
        </Card>
      );

    // ── Step 1: Location & Setup ──────────────────────────────────────────────
    case 1:
      return (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Location &amp; setup</h2>
          <p className="text-sm text-gray-500 mb-5">
            Where and how you plan to operate affects which permits and programs apply to you.
          </p>

          <div className="space-y-5">
            {/* City / region */}
            <div>
              <FieldLabel>Which city or region are you operating in?</FieldLabel>
              <div className="space-y-2 mt-1">
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
            </div>

            {/* Borough (Montréal only) */}
            {intakeForm.location === 'montreal' && (
              <div>
                <FieldLabel>Which borough? (optional)</FieldLabel>
                <input
                  type="text"
                  placeholder="e.g., Rosemont–La Petite-Patrie, Plateau-Mont-Royal…"
                  value={intakeForm.borough ?? ''}
                  onChange={(e) => updateField('borough', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Hint>Helps us match borough-specific grants and zoning info.</Hint>
              </div>
            )}

            {/* Home-based */}
            <div>
              <FieldLabel>Will you operate from home, at least initially?</FieldLabel>
              <div className="flex gap-3 mt-1">
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
        </Card>
      );

    // ── Step 2: Finances ──────────────────────────────────────────────────────
    case 2:
      return (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Finances</h2>
          <p className="text-sm text-gray-500 mb-5">
            Rough estimates are totally fine — we use these to figure out GST/QST obligations
            and which funding programs you may qualify for.
          </p>

          <div className="space-y-5">
            {/* Expected monthly revenue */}
            <div>
              <FieldLabel>Expected monthly revenue (CAD)</FieldLabel>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g., 3000"
                  value={intakeForm.expected_monthly_revenue ?? ''}
                  onChange={(e) =>
                    updateField('expected_monthly_revenue', e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <Hint>
                Annual equivalent: ${((intakeForm.expected_monthly_revenue ?? 0) * 12).toLocaleString()} CAD.
                GST/QST registration is required above $30,000/year.
              </Hint>
            </div>

            {/* Business partners */}
            <div>
              <FieldLabel>Will you have business partners or co-founders?</FieldLabel>
              <div className="flex gap-3 mt-1">
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
        </Card>
      );

    // ── Step 3: About You ─────────────────────────────────────────────────────
    case 3:
      return (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">About you</h2>
          <p className="text-sm text-gray-500 mb-5">
            We use this to match you with funding programs and services you&apos;re eligible for.
            Everything is private and optional.
          </p>

          <div className="space-y-5">
            {/* Age */}
            <div>
              <FieldLabel>Your age (optional)</FieldLabel>
              <input
                type="number"
                min={16}
                max={99}
                placeholder="e.g., 28"
                value={intakeForm.age ?? ''}
                onChange={(e) =>
                  updateField('age', e.target.value ? Number(e.target.value) : null)
                }
                className="w-40 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Hint>Some grants target entrepreneurs under 35 or over 50.</Hint>
            </div>

            {/* Immigration status */}
            <div>
              <FieldLabel>Immigration status</FieldLabel>
              <div className="space-y-2 mt-1">
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
            </div>

            {/* Languages */}
            <div>
              <FieldLabel>Languages you&apos;re comfortable working in</FieldLabel>
              <div className="flex flex-wrap gap-2 mt-1">
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
            <div>
              <FieldLabel>Preferred language for your roadmap &amp; AI assistant</FieldLabel>
              <div className="flex gap-3 mt-1">
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
        </Card>
      );

    default:
      return null;
  }
}
