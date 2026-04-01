import { Check } from 'lucide-react';

interface IntakeProgressProps {
  steps: string[];
  currentStep: number;
}

export default function IntakeProgress({ steps, currentStep }: IntakeProgressProps) {
  return (
    <div className="relative">
      {/* Track line */}
      <div className="absolute top-4 left-0 right-0 h-px bg-slate-200 mx-8" aria-hidden="true">
        <div
          className="h-full bg-brand-500 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={step} className="flex flex-col items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 z-10 ${
                  done
                    ? 'bg-brand-600 text-white'
                    : active
                    ? 'bg-white border-2 border-brand-500 text-brand-600 shadow-brand-sm'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {done ? <Check size={13} strokeWidth={3} /> : <span>{i + 1}</span>}
              </div>
              <span
                className={`text-xs font-medium text-center leading-tight max-w-[60px] transition-colors ${
                  active ? 'text-brand-600' : done ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
