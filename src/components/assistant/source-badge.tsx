interface SourceBadgeProps {
  /** KB filename e.g. "gst_qst.json" or a display label */
  source: string;
}

/** Strips the file extension and title-cases a KB source name for display */
function formatLabel(raw: string): string {
  return raw
    .replace(/\.\w+$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
      📎 {formatLabel(source)}
    </span>
  );
}
