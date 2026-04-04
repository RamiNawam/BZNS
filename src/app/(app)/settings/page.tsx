"use client";

import { useState, useEffect } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { useRoadmapStore } from "@/stores/roadmap-store";
import { useFundingStore } from "@/stores/funding-store";
import { createClient } from "@/lib/supabase/client";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import { CLUSTERS } from "@/lib/clusters";
import { classifyBusiness } from "@/lib/classifier";

function computeAgeFromDob(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const immigrationOptions = [
  { value: "citizen", label: "Canadian citizen" },
  { value: "permanent_resident", label: "Permanent resident" },
  { value: "temporary_resident", label: "Temporary resident (work/study permit)" },
  { value: "refugee", label: "Refugee claimant / protected person" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const businessActivityOptions = [
  { value: "food", label: "Preparing or selling food" },
  { value: "services", label: "Providing a service" },
  { value: "professional", label: "Regulated profession" },
  { value: "products", label: "Selling physical products" },
  { value: "trades", label: "Construction or skilled trades" },
  { value: "children", label: "Caring for children" },
];

const workLocationOptions = [
  { value: "home", label: "From home" },
  { value: "commercial", label: "Rented / commercial space" },
  { value: "client_sites", label: "At client locations" },
  { value: "online", label: "Online only" },
];

const pricingModelOptions = [
  { value: "per_item", label: "Per item / product" },
  { value: "per_hour", label: "Per hour" },
  { value: "per_session", label: "Per session / appointment" },
  { value: "per_project", label: "Per project" },
  { value: "subscription", label: "Monthly / recurring" },
];

const locationOptions = [
  { value: "montreal", label: "Montréal" },
  { value: "quebec_city", label: "Québec City" },
  { value: "laval", label: "Laval" },
  { value: "other_quebec", label: "Other Québec municipality" },
];

const spokenLanguageOptions = [
  { code: "fr", label: "French" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Mandarin / Cantonese" },
  { code: "pt", label: "Portuguese" },
  { code: "ht", label: "Haitian Creole" },
  { code: "other", label: "Other" },
];

// ── Reusable form field wrappers ───────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors";
const selectCls = `${inputCls} cursor-pointer`;

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6 space-y-5">
      <h3 className="font-heading font-semibold text-slate-900 text-base">
        {title}
      </h3>
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
    full_name: "",
    business_name: "",
    business_activity: "",
    business_description: "",
    work_location: "",
    pricing_model: "",
    location: "montreal",
    borough: "",
    has_partners: false,
    date_of_birth: "",
    immigration_status: "citizen",
    languages: ["en"] as string[],
    preferred_language: "en",
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
      const intake = (profile.intake_answers ?? {}) as Record<string, unknown>;
      setForm({
        full_name: profile.full_name ?? "",
        business_name: profile.business_name ?? "",
        business_activity: (intake.business_activity as string) ?? "",
        business_description: profile.business_description ?? "",
        work_location: (intake.work_location as string) ?? "",
        pricing_model: (intake.pricing_model as string) ?? "",
        location: profile.municipality ?? "montreal",
        borough: profile.borough ?? "",
        has_partners: profile.has_partners ?? false,
        date_of_birth: (intake.date_of_birth as string) ?? "",
        immigration_status: profile.immigration_status ?? "citizen",
        languages: profile.languages_spoken ?? ["en"],
        preferred_language: profile.preferred_language ?? "en",
      });
    }
  }, [profile]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const handleSave = async () => {
    if (!profile?.id) return;
    console.log("[Settings] Saving profile updates", form);
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      // Reclassify cluster from the new classification fields
      const isHomeBased = form.work_location === "home";
      const newClusterId = classifyBusiness({
        business_activity: form.business_activity,
        work_location: form.work_location,
        pricing_model: form.pricing_model,
      });
      const clusterMeta = CLUSTERS[newClusterId];
      const clusterChanged = newClusterId !== profile.cluster_id;

      // Merge updated classification fields into intake_answers
      const prevIntake = (profile.intake_answers ?? {}) as Record<string, unknown>;
      const updatedIntakeAnswers = {
        ...prevIntake,
        business_name: form.business_name,
        business_activity: form.business_activity,
        work_location: form.work_location,
        pricing_model: form.pricing_model,
        business_idea: form.business_description,
        location: form.location,
        borough: form.borough,
        has_partners: form.has_partners,
        date_of_birth: form.date_of_birth || null,
        immigration_status: form.immigration_status,
        languages: form.languages,
        preferred_language: form.preferred_language,
      };

      const computedAge = computeAgeFromDob(form.date_of_birth);

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profile.id,
          updates: {
            full_name: form.full_name || null,
            business_name: form.business_name || null,
            business_description: form.business_description || null,
            municipality: form.location,
            borough: form.borough || null,
            is_home_based: isHomeBased,
            has_physical_location: !isHomeBased,
            has_partners: form.has_partners,
            age: computedAge,
            immigration_status: form.immigration_status,
            languages_spoken: form.languages,
            preferred_language: form.preferred_language,
            intake_answers: updatedIntakeAnswers,
            cluster_id: newClusterId,
            cluster_label: clusterMeta.label,
            cluster_complexity: clusterMeta.complexity,
            // Reset financial questionnaire when cluster changes so user gets new questions
            ...(clusterChanged && {
              financial_questionnaire_completed: false,
              financial_questionnaire_answers: null,
            }),
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Failed to save changes");
      }

      console.log("[Settings] Save OK — refreshing profile store");
      await loadProfile();
      useRoadmapStore.getState().markStale();
      useFundingStore.getState().markStale();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("[Settings] Save failed:", err);
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl font-bold text-slate-900">
          Settings
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your profile and business information.
        </p>
      </div>

      {/* Account & About You */}
      <Section title="Account">
        <Field
          label="Email"
          hint="Your login email — managed through magic link authentication."
        >
          <div
            className={`${inputCls} bg-slate-50 text-slate-500 cursor-default`}
          >
            {email ?? "—"}
          </div>
        </Field>
        <Field label="Full name">
          <input
            className={inputCls}
            placeholder="e.g. John Doe"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date of birth" hint="Some grants target entrepreneurs under 35 or over 50.">
            <input
              className={inputCls}
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={form.date_of_birth}
              onChange={(e) => set("date_of_birth", e.target.value)}
            />
          </Field>
          <Field label="Immigration status">
            <select
              className={selectCls}
              value={form.immigration_status}
              onChange={(e) => set("immigration_status", e.target.value)}
            >
              {immigrationOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Languages you work in">
          <div className="flex flex-wrap gap-2 mt-1">
            {spokenLanguageOptions.map((lang) => {
              const selected = form.languages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    const next = selected
                      ? form.languages.filter((l) => l !== lang.code)
                      : [...form.languages, lang.code];
                    set("languages", next);
                  }}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    selected
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-700"
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Preferred language for roadmap & AI assistant">
          <div className="grid grid-cols-2 gap-3">
            {(["en", "fr"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => set("preferred_language", lang)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                  form.preferred_language === lang
                    ? "border-brand-400 bg-brand-50 text-brand-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {lang === "en" ? "English" : "Français"}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Business */}
      <Section title="Your Business">
        <Field
          label="What does your business mainly involve?"
          hint="Used to select the right legal steps and funding programs."
        >
          <select
            className={selectCls}
            value={form.business_activity}
            onChange={(e) => set("business_activity", e.target.value)}
          >
            <option value="">Select…</option>
            {businessActivityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="How will you charge your clients?">
          <select
            className={selectCls}
            value={form.pricing_model}
            onChange={(e) => set("pricing_model", e.target.value)}
          >
            <option value="">Select…</option>
            {pricingModelOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Business name"
          hint="Leave blank if you haven't chosen a name yet."
        >
          <input
            className={inputCls}
            placeholder="e.g. Yara's Kitchen"
            value={form.business_name}
            onChange={(e) => set("business_name", e.target.value)}
          />
        </Field>

        <Field
          label="Business description"
          hint="A short summary of what you do. Used to personalize your roadmap."
        >
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="e.g. I sell homemade pastries and baked goods from my kitchen in Villeray."
            value={form.business_description}
            onChange={(e) => set("business_description", e.target.value)}
          />
        </Field>
      </Section>

      {/* Location & Setup */}
      <Section title="Location & Setup">
        <Field label="Which city or region are you in?">
          <select
            className={selectCls}
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
          >
            {locationOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        {form.location === "montreal" && (
          <Field
            label="Borough"
            hint="Helps match borough-specific grants and zoning info."
          >
            <input
              className={inputCls}
              placeholder="e.g. Rosemont–La Petite-Patrie"
              value={form.borough}
              onChange={(e) => set("borough", e.target.value)}
            />
          </Field>
        )}

        <Field label="Where will you mainly work?">
          <select
            className={selectCls}
            value={form.work_location}
            onChange={(e) => set("work_location", e.target.value)}
          >
            <option value="">Select…</option>
            {workLocationOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Will you have business partners or co-founders?">
          <div className="grid grid-cols-2 gap-3">
            {([true, false] as const).map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => set("has_partners", val)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                  form.has_partners === val
                    ? "border-brand-400 bg-brand-50 text-brand-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {val ? "Yes" : "No"}
              </button>
            ))}
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
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
