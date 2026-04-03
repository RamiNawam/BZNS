'use client';

import { useState, useEffect } from 'react';
import { useProfileStore } from '@/stores/profile-store';
import { useRoadmapStore } from '@/stores/roadmap-store';
import { createClient } from '@/lib/supabase/client';
import { Save, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const immigrationOptions = [
  { value: 'citizen', label: 'Canadian Citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident' },
  { value: 'work_permit', label: 'Work Permit' },
  { value: 'student', label: 'Student Visa' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
];

const businessTypeOptions = [
  { value: 'food', label: 'Food & Bakery' },
  { value: 'freelance', label: 'Freelance / Consulting' },
  { value: 'daycare', label: 'Childcare' },
  { value: 'retail', label: 'Retail' },
  { value: 'personal_care', label: 'Personal Care' },
  { value: 'other', label: 'Other' },
];

// ── Reusable form field wrappers ───────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors';
const selectCls = `${inputCls} cursor-pointer`;

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-5">
      <h3 className="font-heading font-semibold text-slate-900 text-base">{title}</h3>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { profile, loadProfile } = useProfileStore();
  const [email, setEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    business_name: '',
    business_type: 'other',
    business_description: '',
    municipality: '',
    borough: '',
    is_home_based: true,
    expected_monthly_revenue: '',
    age: '',
    immigration_status: 'citizen',
    preferred_language: 'en',
  });

  // Get email from Supabase auth session
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  // Populate form from loaded profile
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        business_name: profile.business_name ?? '',
        business_type: profile.business_type ?? 'other',
        business_description: profile.business_description ?? '',
        municipality: profile.municipality ?? '',
        borough: profile.borough ?? '',
        is_home_based: profile.is_home_based ?? true,
        expected_monthly_revenue: profile.expected_monthly_revenue != null ? String(profile.expected_monthly_revenue) : '',
        age: profile.age != null ? String(profile.age) : '',
        immigration_status: profile.immigration_status ?? 'citizen',
        preferred_language: profile.preferred_language ?? 'en',
      });
    }
  }, [profile]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const handleSave = async () => {
    if (!profile?.id) return;
    console.log('[Settings] Saving profile updates', form);
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile.id,
          updates: {
            full_name: form.full_name || null,
            business_name: form.business_name || null,
            business_type: form.business_type,
            business_description: form.business_description || null,
            municipality: form.municipality,
            borough: form.borough || null,
            is_home_based: form.is_home_based,
            has_physical_location: !form.is_home_based,
            expected_monthly_revenue: form.expected_monthly_revenue ? Number(form.expected_monthly_revenue) : null,
            age: form.age ? Number(form.age) : null,
            immigration_status: form.immigration_status,
            preferred_language: form.preferred_language,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? 'Failed to save changes');
      }

      console.log('[Settings] Save OK — refreshing profile store');
      await loadProfile();
      useRoadmapStore.getState().markStale();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[Settings] Save failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your profile and business information.</p>
      </div>

      {/* Roadmap notice */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info size={15} className="mt-0.5 shrink-0 text-amber-600" />
        <span>
          After saving changes to your business type or location, go to your dashboard and click
          <strong className="font-semibold"> Generate My Roadmap</strong> to get updated steps.
        </span>
      </div>

      {/* Account */}
      <Section title="Account">
        <Field label="Email" hint="Your login email — managed through magic link authentication.">
          <div className={`${inputCls} bg-slate-50 text-slate-500 cursor-default`}>
            {email ?? '—'}
          </div>
        </Field>
        <Field label="Full name">
          <input
            className={inputCls}
            placeholder="e.g. Yara Haddad"
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
          />
        </Field>
        <Field label="Preferred language">
          <select
            className={selectCls}
            value={form.preferred_language}
            onChange={(e) => set('preferred_language', e.target.value)}
          >
            {languageOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </Section>

      {/* Business */}
      <Section title="Your Business">
        <Field label="Business type" hint="Used to select the right legal steps and funding programs for your roadmap.">
          <select
            className={selectCls}
            value={form.business_type}
            onChange={(e) => set('business_type', e.target.value)}
          >
            {businessTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Business name" hint="Leave blank if you haven't chosen a name yet.">
          <input
            className={inputCls}
            placeholder="e.g. Yara's Kitchen"
            value={form.business_name}
            onChange={(e) => set('business_name', e.target.value)}
          />
        </Field>

        <Field label="Business description" hint="A short summary of what you do. Used to personalize your roadmap.">
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="e.g. I sell homemade pastries and baked goods from my kitchen in Villeray."
            value={form.business_description}
            onChange={(e) => set('business_description', e.target.value)}
          />
        </Field>
      </Section>

      {/* Location */}
      <Section title="Location">
        <Field label="City / Municipality">
          <input
            className={inputCls}
            placeholder="e.g. Montreal"
            value={form.municipality}
            onChange={(e) => set('municipality', e.target.value)}
          />
        </Field>
        <Field label="Borough" hint="Montréal borough, if applicable (e.g. Villeray, Plateau-Mont-Royal).">
          <input
            className={inputCls}
            placeholder="e.g. Villeray"
            value={form.borough}
            onChange={(e) => set('borough', e.target.value)}
          />
        </Field>
        <Field label="Business location">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => set('is_home_based', !form.is_home_based)}
              className={`relative h-5 w-9 rounded-full transition-colors ${form.is_home_based ? 'bg-brand-500' : 'bg-slate-200'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.is_home_based ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </div>
            <span className="text-sm text-slate-700">Home-based business</span>
          </label>
        </Field>
      </Section>

      {/* About you */}
      <Section title="About You">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Age">
            <input
              className={inputCls}
              type="number"
              min={16}
              max={99}
              placeholder="e.g. 26"
              value={form.age}
              onChange={(e) => set('age', e.target.value)}
            />
          </Field>
          <Field label="Immigration status">
            <select
              className={selectCls}
              value={form.immigration_status}
              onChange={(e) => set('immigration_status', e.target.value)}
            >
              {immigrationOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Revenue */}
      <Section title="Revenue">
        <Field
          label="Expected monthly revenue (CAD)"
          hint="Used to calculate your tax snapshot and GST/QST registration threshold."
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">$</span>
            <input
              className={`${inputCls} pl-7`}
              type="number"
              min={0}
              placeholder="e.g. 2000"
              value={form.expected_monthly_revenue}
              onChange={(e) => set('expected_monthly_revenue', e.target.value)}
            />
          </div>
        </Field>
      </Section>

      {/* Save bar */}
      <div className="flex items-center justify-between gap-4 sticky bottom-0 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl px-5 py-3.5 shadow-lg">
        <div className="text-sm">
          {saved && (
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 size={15} />
              Changes saved
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1.5 text-red-600 font-medium">
              <AlertCircle size={15} />
              {error}
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !profile?.id}
          className="btn-primary gap-2 disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

    </div>
  );
}
