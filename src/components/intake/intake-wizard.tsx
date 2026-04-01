'use client';

import { useState } from 'react';
import IntakeProgress from './intake-progress';
import QuestionCard from './question-card';
import Button from '@/components/ui/button';
import { useProfileStore } from '@/stores/profile-store';

const STEPS = ['Your Business', 'Location & Setup', 'Finances', 'About You'];

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

  return (
    <div className="space-y-6">
      <IntakeProgress steps={STEPS} currentStep={currentStep} />

      <QuestionCard
        step={currentStep}
        intakeForm={intakeForm}
        updateField={updateIntakeField}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        <Button onClick={handleNext} isLoading={isLoading}>
          {currentStep === STEPS.length - 1 ? 'Save & Generate Roadmap' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
