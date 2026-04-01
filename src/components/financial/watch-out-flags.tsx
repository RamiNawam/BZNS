import type { WatchOutFlag } from '@/types/financial';

const TYPE_CONFIG: Record<WatchOutFlag['type'], { emoji: string; border: string; bg: string; text: string; heading: string }> = {
  warning: { emoji: '⚠️', border: 'border-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-700', heading: 'text-yellow-800' },
  info:    { emoji: 'ℹ️', border: 'border-blue-200',   bg: 'bg-blue-50',   text: 'text-blue-700',   heading: 'text-blue-800'   },
  tip:     { emoji: '💡', border: 'border-teal-200',   bg: 'bg-teal-50',   text: 'text-teal-700',   heading: 'text-teal-800'   },
};

interface WatchOutFlagsProps {
  warnings: WatchOutFlag[];
}

export default function WatchOutFlags({ warnings }: WatchOutFlagsProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((flag, i) => {
        const cfg = TYPE_CONFIG[flag.type];
        return (
          <div key={i} className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3`}>
            <p className={`text-sm font-semibold ${cfg.heading} flex items-center gap-1`}>
              <span>{cfg.emoji}</span> {flag.title}
            </p>
            <p className={`text-sm ${cfg.text} mt-0.5`}>{flag.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
