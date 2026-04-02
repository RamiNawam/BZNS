'use client';

import { useState } from 'react';
import { FileText, ExternalLink, Lightbulb, StickyNote, Loader2 } from 'lucide-react';
import type { RoadmapStep } from '@/types/roadmap';
import { useRoadmapStore } from '@/stores/roadmap-store';

interface StepDetailProps {
  step: RoadmapStep;
}

export default function StepDetail({ step }: StepDetailProps) {
  const { updateStepStatus } = useRoadmapStore();
  const [notes, setNotes] = useState(step.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleNotesSave() {
    if (notes === (step.notes ?? '')) return;
    setSaving(true);
    try {
      await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: step.id, status: step.status, notes }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 pb-5 pt-4 space-y-4">

      {/* Why this matters */}
      {step.why_needed && (
        <div className="card-brand rounded-xl p-4 flex gap-3">
          <Lightbulb size={16} className="text-brand-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-1">
              Why this matters
            </p>
            <p className="text-sm text-brand-800 leading-relaxed">{step.why_needed}</p>
          </div>
        </div>
      )}

      {/* Documents required */}
      {step.required_documents && step.required_documents.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Documents required
          </p>
          <ul className="space-y-1.5">
            {step.required_documents.map((doc) => (
              <li key={doc} className="flex items-center gap-2.5 text-sm text-slate-600">
                <FileText size={13} className="text-slate-400 shrink-0" />
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Government link */}
      {step.government_url && (
        <a
          href={step.government_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary btn-sm gap-2 inline-flex"
        >
          <ExternalLink size={13} />
          Official government page
        </a>
      )}

      {/* Notes */}
      <div>
        <label htmlFor={`notes-${step.id}`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          <StickyNote size={12} />
          Your notes
        </label>
        <textarea
          id={`notes-${step.id}`}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesSave}
          placeholder="e.g., Got my NEQ — number is 1234567890"
          className="input resize-none text-sm"
        />
        {(saving || saved) && (
          <p className="text-xs mt-1.5 flex items-center gap-1.5 text-slate-400">
            {saving ? (
              <><Loader2 size={11} className="animate-spin" /> Saving…</>
            ) : (
              <><span className="text-emerald-500">✓</span> Saved</>
            )}
          </p>
        )}
      </div>

    </div>
  );
}
