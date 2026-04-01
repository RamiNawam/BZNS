'use client';

import { useState } from 'react';
import IntakeProgress from './intake-progress';
import QuestionCard from './question-card';
import Button from '@/components/ui/button';
import { useProfileStore } from '@/stores/profile-store';

const STEPS = ['Basics', 'Structure', 'Finances', 'About You'];

export default function IntakeWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const { profile, updateField, saveProfile, isLoading } = useProfileStore();

  function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      saveProfile();
    }
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  return (
    <div className="space-y-6">
      <IntakeProgress steps={STEPS} currentStep={currentStep} />

      <QuestionCard step={currentStep} profile={profile ?? {}} updateField={updateField} />

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
