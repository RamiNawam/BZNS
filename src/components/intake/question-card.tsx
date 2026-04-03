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

    // ══════════════════════════════════════════════════════════════════════════
    // Step 0: Business Name + What it involves (classification Q1 & Q2)
    // ══════════════════════════════════════════════════════════════════════════
    case 0:
      return (
        <div className="card p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">Your business</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Let&apos;s start with the basics. We&apos;ll figure out the right permits, funding, and legal steps for you.
            </p>
          </div>

          {/* Business name */}
          <div>
            <FieldLabel htmlFor="business_name">What&apos;s the name of your business?</FieldLabel>
            <input
              id="business_name"
              type="text"
              placeholder="e.g., Yara's Kitchen, Studio Nova, QuickFix Reno…"
              value={intakeForm.business_name ?? ''}
              onChange={(e) => updateField('business_name', e.target.value)}
              className="input"
            />
            <Hint>Don&apos;t have one yet? Just type a working name — you can change it later.</Hint>
          </div>

          {/* Main activity */}
          <div className="space-y-2.5">
            <FieldLabel>What does your business mainly involve?</FieldLabel>
            {[
              { value: 'food',     label: 'Preparing or selling food',          desc: 'Baking, cooking, catering, meal prep, jams, sauces' },
              { value: 'services', label: 'Providing a service',                desc: 'Consulting, design, coaching, beauty, fitness, cleaning' },
              { value: 'products', label: 'Selling physical products',           desc: 'Online store, boutique, handmade goods, reselling' },
              { value: 'trades',   label: 'Construction or skilled trades',      desc: 'Plumbing, electrical, carpentry, painting, renovations' },
              { value: 'children', label: 'Caring for children',                 desc: 'Home daycare, nursery, babysitting' },
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
    // Step 1: Where you work + License (classification Q3 & Q4)
    // ══════════════════════════════════════════════════════════════════════════
    case 1:
      return (
        <div className="card p-8 space-y-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">How you&apos;ll operate</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              This helps us match the right permits and zoning rules.
            </p>
          </div>

          {/* Work location */}
          <div className="space-y-2.5">
            <FieldLabel>Where will you mainly work?</FieldLabel>
            {[
              { value: 'home',         label: 'From home',              desc: 'Kitchen, office, studio at your residence' },
              { value: 'commercial',   label: 'Rented / commercial space', desc: 'Store, studio, restaurant, workshop' },
              { value: 'client_sites', label: 'At client locations',    desc: 'You go to the client (renovations, cleaning, etc.)' },
              { value: 'online',       label: 'Online only',            desc: 'Remote work, e-commerce, digital services' },
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

          {/* License */}
          <div className="space-y-2.5">
            <FieldLabel>Does your work require a professional license or certification?</FieldLabel>
            {[
              { value: 'professional_order', label: 'Yes — regulated by a professional order', desc: 'Lawyer, accountant, engineer, architect, therapist, etc.' },
              { value: 'trade_cert',         label: 'Yes — trade certification (RBQ, etc.)',    desc: 'Licensed electrician, plumber, contractor, etc.' },
              { value: 'food_handling',      label: 'Yes — food handling permit',               desc: 'MAPAQ certification for food preparation' },
              { value: 'none',               label: 'No license required',                      desc: 'Most freelance, retail, and personal services' },
            ].map((opt) => (
              <RadioOption
                key={opt.value}
                name="license_type"
                value={opt.value}
                label={opt.label}
                desc={opt.desc}
                checked={intakeForm.license_type === opt.value}
                onChange={() => updateField('license_type', opt.value)}
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
            <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">Your pricing &amp; idea</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              How you charge affects tax obligations and financial projections.
            </p>
          </div>

          {/* Pricing model */}
          <div className="space-y-2.5">
            <FieldLabel>How will you charge your clients?</FieldLabel>
            {[
              { value: 'per_item',        label: 'Per item / product',       desc: 'Each sale is a fixed price (pastries, crafts, goods)' },
              { value: 'per_hour',        label: 'Per hour',                 desc: 'Hourly billing (consulting, freelance, tutoring)' },
              { value: 'per_session',     label: 'Per session / appointment', desc: 'Fixed price per visit (haircut, massage, training)' },
              { value: 'per_project',     label: 'Per project',              desc: 'Flat fee per job (photography, design, renovation)' },
              { value: 'subscription',    label: 'Monthly / recurring',      desc: 'Subscriptions, memberships, retainers, courses' },
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
            <FieldLabel htmlFor="business_idea">Describe your business in a few sentences</FieldLabel>
            <textarea
              id="business_idea"
              rows={4}
              placeholder="e.g., I want to sell homemade pastries from my kitchen and deliver in my neighbourhood…"
              value={intakeForm.business_idea ?? ''}
              onChange={(e) => updateField('business_idea', e.target.value)}
              className="input resize-none"
            />
            <Hint>
              This helps us generate your personalized legal roadmap. Be as specific or vague as you like.
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

    // ══════════════════════════════════════════════════════════════════════════
    // Step 4: About You (funding matching)
    // ══════════════════════════════════════════════════════════════════════════
    case 4:
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
