interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  showValue?: boolean;
  color?: 'brand' | 'green' | 'yellow' | 'red';
}

const colorClasses = {
  brand: 'bg-brand-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
};

export default function ProgressBar({
  value,
  label,
  showValue = false,
  color = 'brand',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-1">
      {(label || showValue) && (
        <div className="flex justify-between text-sm text-gray-600">
          {label && <span>{label}</span>}
          {showValue && <span>{clamped}%</span>}
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
