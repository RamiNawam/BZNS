'use client';

interface ExpenseInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

export default function ExpenseInput({
  label,
  value,
  onChange,
  placeholder = '0',
}: ExpenseInputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          $
        </span>
        <input
          type="number"
          min={0}
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
    </div>
  );
}
