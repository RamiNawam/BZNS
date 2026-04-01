import type { SourceCitation } from '@/types/chat';

interface SourceBadgeProps {
  source: SourceCitation;
}

export default function SourceBadge({ source }: SourceBadgeProps) {
  const content = (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-300 transition-colors">
      📎 {source.label}
    </span>
  );

  if (source.url) {
    return (
      <a href={source.url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}
