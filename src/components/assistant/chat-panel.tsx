'use client';

import { useState } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import MessageBubble from './message-bubble';
import Button from '@/components/ui/button';

export default function ChatPanel() {
  const { messages, isLoading, sendMessage, clearMessages } = useChatStore();
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessage(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[600px] card p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-semibold text-gray-800">{t('assistant.title')}</span>
          <span className="h-2 w-2 rounded-full bg-green-400" />
        </div>
        <button
          onClick={clearMessages}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {t('assistant.clear')}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <p className="text-2xl mb-2">👋</p>
            <p>{t('assistant.emptyState')}</p>
            <div className="mt-4 space-y-2">
              {[
                t('assistant.suggestion1'),
                t('assistant.suggestion2'),
                t('assistant.suggestion3'),
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="block w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-sm text-gray-600"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex gap-2 items-center text-gray-400">
            <span className="text-lg">🤖</span>
            <div className="flex gap-1">
              <span className="animate-bounce">•</span>
              <span className="animate-bounce delay-100">•</span>
              <span className="animate-bounce delay-200">•</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('assistant.placeholder')}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="sm">
          {t('assistant.send')}
        </Button>
      </div>
    </div>
  );
}
