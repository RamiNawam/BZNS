import type { ChatMessage } from '@/types/chat';
import SourceBadge from './source-badge';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
          🤖
        </div>
      )}

      <div className={`max-w-[80%] space-y-2`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {message.sources.map((source, i) => (
              <SourceBadge key={i} source={source} />
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="h-7 w-7 rounded-full bg-brand-200 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
          👤
        </div>
      )}
    </div>
  );
}
