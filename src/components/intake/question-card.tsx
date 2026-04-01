'use client';

import { Card } from '@/components/ui/card';
import Input from '@/components/ui/input';
import type { ProfileFormData } from '@/types/profile';

interface QuestionCardProps {
  step: number;
  profile: Partial<ProfileFormData>;
  updateField: <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => void;
}

export default function QuestionCard({ step, profile, updateField }: QuestionCardProps) {
  switch (step) {
    case 0:
      return (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Tell us about your business</h2>
          <div className="space-y-4">
            <Input
              label="Business Name (optional)"
              placeholder="e.g., Café Lumière"
              value={profile.businessName ?? ''}
              onChange={(e) => updateField('businessName', e.target.value)}
            />
            <Input
              label="Industry / Sector"
              placeholder="e.g., Food & beverage, Consulting, Retail..."
              value={profile.sector ?? ''}
              onChange={(e) => updateField('sector', e.target.value)}
            />
            <Input
              label="City"
              placeholder="e.g., Montreal"
              value={profile.city ?? ''}
              onChange={(e) => updateField('city', e.target.value)}
            />
          </div>
        </Card>
      );

    case 1:
      return (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Business structure</h2>
          <div className="space-y-3">
            {[
              { value: 'sole_proprietorship', label: 'Sole Proprietorship', desc: 'Simplest — you and your business are one' },
              { value: 'general_partnership', label: 'General Partnership', desc: 'Two or more partners sharing profits & liabilities' },
              { value: 'incorporation', label: 'Corporation (Inc.)', desc: 'Separate legal entity — more complex but limited liability' },
              { value: 'undecided', label: 'Not sure yet', desc: 'We\'ll help you decide' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                  profile.businessStructure === option.value
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="structure"
                  value={option.value}
                  checked={profile.businessStructure === option.value}
                  onChange={() => updateField('businessStructure', option.value as ProfileFormData['businessStructure'])}
                  className="mt-0.5 accent-brand-600"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>
      );

    case 2:
      return (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Financial projections</h2>
          <div className="space-y-4">
            <Input
              label="Expected Annual Revenue (CAD)"
              type="number"
              placeholder="e.g., 50000"
              value={profile.revenueProjection ?? ''}
              onChange={(e) => updateField('revenueProjection', Number(e.target.value))}
              hint="Rough estimate is fine — used to determine GST/QST registration and funding eligibility"
            />
            <Input
              label="Number of Employees (including yourself)"
              type="number"
              placeholder="1"
              value={profile.employeesCount ?? 1}
              onChange={(e) => updateField('employeesCount', Number(e.target.value))}
            />
          </div>
        </Card>
      );

    case 3:
      return (
        <Card>
          <h2 className="text-lg font-semibold mb-4">About you (for funding matches)</h2>
          <p className="text-sm text-gray-500 mb-4">
            This information is used solely to match you with programs you may be eligible for.
            All fields are optional.
          </p>
          <div className="space-y-4">
            <Input
              label="Age"
              type="number"
              placeholder="e.g., 28"
              value={profile.age ?? ''}
              onChange={(e) => updateField('age', Number(e.target.value))}
            />
            <div className="space-y-2">
              {[
                { key: 'isWoman', label: 'I identify as a woman' },
                { key: 'isIndigenous', label: 'I identify as Indigenous (First Nations, Métis, or Inuit)' },
                { key: 'isNewcomer', label: 'I am a newcomer to Canada (immigrant / refugee)' },
                { key: 'isVisibleMinority', label: 'I am a visible minority' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!(profile as Record<string, unknown>)[item.key]}
                    onChange={(e) => updateField(item.key as keyof ProfileFormData, e.target.checked as never)}
                    className="rounded accent-brand-600"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </Card>
      );

    default:
      return null;
  }
}
