'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import IntakeProgress from './intake-progress';
import QuestionCard from './question-card';
import { useProfileStore } from '@/stores/profile-store';

const STEPS = ['Business Type', 'Your Business', 'Location', 'Finances', 'About You'];

export default function IntakeWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const { intakeForm, updateIntakeField, submitIntake, isLoading, error } = useProfileStore();

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
