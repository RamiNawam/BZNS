import IntakeWizard from '@/components/intake/intake-wizard';

export default function IntakePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
        <p className="text-gray-500 mt-1">
          Tell us about your business idea to get a personalised roadmap and
          funding matches.
        </p>
      </div>
      <IntakeWizard />
    </div>
  );
}
