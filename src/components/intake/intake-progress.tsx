interface IntakeProgressProps {
  steps: string[];
  currentStep: number;
}

export default function IntakeProgress({ steps, currentStep }: IntakeProgressProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i < currentStep
                  ? 'bg-brand-600 text-white'
                  : i === currentStep
                  ? 'border-2 border-brand-600 text-brand-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span
              className={`mt-1 text-xs text-center ${
                i === currentStep ? 'text-brand-600 font-medium' : 'text-gray-400'
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px flex-1 mx-2 mt-[-12px] transition-colors ${
                i < currentStep ? 'bg-brand-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
