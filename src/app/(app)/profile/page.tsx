'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, MapPin, DollarSign, Globe, Pencil, Check, X, Loader2, ChevronLeft,
} from 'lucide-react';
import { useProfileStore } from '@/stores/profile-store';
import { useRoadmapStore } from '@/stores/roadmap-store';
import { useFundingStore } from '@/stores/funding-store';
import { CLUSTERS, type ClusterID } from '@/lib/clusters';
import type { Profile } from '@/types/profile';

/** Map business_type + is_home_based back to a default cluster */
function deriveCluster(businessType: string, isHomeBased: boolean): ClusterID {
  switch (businessType) {
    case 'food':          return isHomeBased ? 'C1' : 'C7';
    case 'freelance':     return 'C2';
    case 'daycare':       return 'C3';
    case 'retail':        return isHomeBased ? 'C5' : 'C6';
    case 'personal_care': return 'C9';
    default:              return 'C2';
  }
}

// ── Inline editable field ─────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  onSave,
  type = 'text',
  placeholder = '—',
}: {
  label: string;
  value: string | number | null;
  onSave: (val: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));

  function commit() {
    onSave(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(String(value ?? ''));
    setEditing(false);
  }

  if (editing) {
    return (
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
            className="input py-1.5 text-sm flex-1"
          />
          <button type="button" onClick={commit} className="h-8 w-8 flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700">
            <Check size={13} />
          </button>
          <button type="button" onClick={cancel} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <button
        type="button"
        onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
        className="group flex items-center gap-2 text-sm text-slate-800 hover:text-brand-700 transition-colors"
      >
        <span>{value !== null && value !== '' ? String(value) : <span className="text-slate-400">{placeholder}</span>}</span>
        <Pencil size={11} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
      </button>
    </div>
  );
}

// ── Select field ──────────────────────────────────────────────────────────────

function SelectField<T extends string>({
  label,
  value,
  options,
  onSave,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onSave: (val: T) => void;
}) {
  const [editing, setEditing] = useState(false);
  const display = options.find((o) => o.value === value)?.label ?? '—';

  if (editing) {
    return (
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onSave(opt.value); setEditing(false); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                value === opt.value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-400 hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group flex items-center gap-2 text-sm text-slate-800 hover:text-brand-700 transition-colors"
      >
        <span>{display}</span>
        <Pencil size={11} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
      </button>
    </div>
  );
}

// ── Toggle field (boolean) ────────────────────────────────────────────────────

function BoolField({ label, value, onSave }: { label: string; value: boolean; onSave: (v: boolean) => void }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <button
        type="button"
        onClick={() => onSave(!value)}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
          value ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}
      >
        {value ? 'Yes' : 'No'}
        <Pencil size={10} />
      </button>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-brand-50">
          <Icon size={15} className="text-brand-600" />
        </div>
        <h2 className="font-heading font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {children}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loadProfile, isLoading } = useProfileStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  async function patchProfile(update: Partial<Profile>) {
    setSaving(true);
    try {
      // Reclassify cluster when business type or home-based changes
      const nextType = (update.business_type ?? profile!.business_type) as string;
      const nextHome = update.is_home_based ?? profile!.is_home_based;
      const newClusterId = deriveCluster(nextType, nextHome);
      const clusterChanged = newClusterId !== profile!.cluster_id;

      const fullUpdate: Partial<Profile> = {
        ...update,
        ...(clusterChanged && {
          cluster_id: newClusterId,
          cluster_label: CLUSTERS[newClusterId].label,
          cluster_complexity: CLUSTERS[newClusterId].complexity,
          financial_questionnaire_completed: false,
          financial_questionnaire_answers: null,
        }),
      };

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profile!.id, updates: fullUpdate }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      useProfileStore.setState({ profile: data.profile });

      // Mark dependent data as stale
      if (update.business_type || update.is_home_based || update.municipality) {
        useRoadmapStore.getState().markStale();
        useFundingStore.getState().markStale();
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
          >
            <ChevronLeft size={14} /> Back
          </button>
          <h1 className="page-title">Business Profile</h1>
          <p className="page-subtitle">Click any field to edit it.</p>
        </div>
        {(saving || saved) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {saving ? <><Loader2 size={11} className="animate-spin" /> Saving…</> : <><span className="text-emerald-500">✓</span> Saved</>}
          </div>
        )}
      </div>

      {/* Business */}
      <Section icon={User} title="Your Business">
        <EditableField
          label="Business name"
          value={profile.business_name}
          placeholder="Not set"
          onSave={(v) => patchProfile({ business_name: v })}
        />
        <SelectField
          label="Business type"
          value={profile.business_type}
          options={[
            { value: 'food', label: 'Food & Bakery' },
            { value: 'freelance', label: 'Freelance / Consulting' },
            { value: 'daycare', label: 'Childcare / Daycare' },
            { value: 'retail', label: 'Retail' },
            { value: 'personal_care', label: 'Personal Care' },
            { value: 'other', label: 'Other' },
          ]}
          onSave={(v) => patchProfile({ business_type: v })}
        />
        <div className="sm:col-span-2">
          <EditableField
            label="Business description"
            value={profile.business_description}
            placeholder="Describe your business idea…"
            onSave={(v) => patchProfile({ business_description: v })}
          />
        </div>
        <BoolField
          label="Home-based"
          value={profile.is_home_based}
          onSave={(v) => patchProfile({ is_home_based: v })}
        />
        <BoolField
          label="Has business partners"
          value={profile.has_partners}
          onSave={(v) => patchProfile({ has_partners: v })}
        />
      </Section>

      {/* Location */}
      <Section icon={MapPin} title="Location">
        <EditableField
          label="Municipality"
          value={profile.municipality}
          onSave={(v) => patchProfile({ municipality: v })}
        />
        <EditableField
          label="Borough"
          value={profile.borough}
          placeholder="Not set"
          onSave={(v) => patchProfile({ borough: v })}
        />
      </Section>

      {/* Finances */}
      <Section icon={DollarSign} title="Finances">
        <EditableField
          label="Expected monthly revenue (CAD)"
          value={profile.expected_monthly_revenue}
          placeholder="Not set"
          type="number"
          onSave={(v) => patchProfile({ expected_monthly_revenue: v ? Number(v) : null })}
        />
        <EditableField
          label="Number of employees"
          value={profile.num_employees}
          type="number"
          onSave={(v) => patchProfile({ num_employees: Number(v) })}
        />
      </Section>

      {/* Personal */}
      <Section icon={Globe} title="About You">
        <EditableField
          label="Age"
          value={profile.age}
          placeholder="Not set"
          type="number"
          onSave={(v) => patchProfile({ age: v ? Number(v) : null })}
        />
        <SelectField
          label="Immigration status"
          value={profile.immigration_status}
          options={[
            { value: 'citizen', label: 'Canadian citizen' },
            { value: 'permanent_resident', label: 'Permanent resident' },
            { value: 'work_permit', label: 'Work / study permit' },
            { value: 'student', label: 'Student' },
          ]}
          onSave={(v) => patchProfile({ immigration_status: v })}
        />
        <SelectField
          label="Preferred language"
          value={profile.preferred_language as 'en' | 'fr'}
          options={[
            { value: 'en', label: 'English' },
            { value: 'fr', label: 'Français' },
          ]}
          onSave={(v) => patchProfile({ preferred_language: v })}
        />
      </Section>

    </div>
  );
}
