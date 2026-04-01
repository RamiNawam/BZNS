interface WatchOutFlagsProps {
  warnings: string[];
}

export default function WatchOutFlags({ warnings }: WatchOutFlagsProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-2">
      <p className="text-sm font-semibold text-yellow-800">Watch out</p>
      <ul className="space-y-1">
        {warnings.map((warning, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-yellow-700">
            <span className="mt-0.5 flex-shrink-0">⚠️</span>
            <span>{warning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
