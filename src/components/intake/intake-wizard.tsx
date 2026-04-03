'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import IntakeProgress from './intake-progress';
import QuestionCard from './question-card';
import { useProfileStore } from '@/stores/profile-store';

const STEPS = ['Business Type', 'Your Business', 'Location', 'Finances', 'About You'];

export default function IntakeWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const { profile, intakeForm, updateIntakeField, submitIntake, isLoading, error } = useProfileStore();

  // Pre-populate form from existing profile when editing
  useEffect(() => {
    if (!profile?.intake_completed) return;
    if (intakeForm.business_idea) return; // already populated (e.g. partial save)

    updateIntakeField('business_idea', profile.business_description ?? '');
    updateIntakeField('location', profile.municipality ?? 'montreal');
    updateIntakeField('borough', profile.borough ?? '');
    updateIntakeField('is_home_based', profile.is_home_based ?? true);
    updateIntakeField('expected_monthly_revenue', profile.expected_monthly_revenue ?? null);
    updateIntakeField('has_partners', profile.has_partners ?? false);
    updateIntakeField('age', profile.age ?? null);
    if (profile.immigration_status) updateIntakeField('immigration_status', profile.immigration_status);
    if (profile.languages_spoken?.length) updateIntakeField('languages', profile.languages_spoken);
    updateIntakeField('preferred_language', profile.preferred_language ?? 'en');
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      submitIntake();
    }
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="space-y-8">

      {/* Progress */}
      <IntakeProgress steps={STEPS} currentStep={currentStep} />

      {/* Question */}
      <QuestionCard
        step={currentStep}
        intakeForm={intakeForm}
        updateField={updateIntakeField}
      />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="btn-ghost gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <div className="flex items-center gap-2">
          {/* Step dots */}
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-6 bg-brand-500'
                  : i < currentStep
                  ? 'w-1.5 bg-brand-300'
                  : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={isLoading}
          className={`btn-primary gap-2 disabled:opacity-60 ${isLastStep ? 'px-6' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Generating your roadmap…
            </>
          ) : isLastStep ? (
            <>
              <Sparkles size={15} />
              Generate my roadmap
            </>
          ) : (
            <>
              Next
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>

    </div>
  );
}
