'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useProfileStore } from '@/stores/profile-store';
import MessageBubble from './message-bubble';

// ── Route → readable context ─────────────────────────────────────────────────

const PAGE_CONTEXT_MAP: Record<string, string> = {
  '/dashboard': 'viewing their dashboard overview',
  '/roadmap': 'viewing their legal roadmap',
  '/funding': 'viewing available funding programs',
  '/financial': 'viewing their financial snapshot',
  '/starter-kit': 'viewing the starter kit',
  '/intake': 'completing their business intake',
};

function pageContextFromPath(pathname: string): string {
  for (const [route, ctx] of Object.entries(PAGE_CONTEXT_MAP)) {
    if (pathname === route || pathname.startsWith(route + '/')) return ctx;
  }
  return 'browsing the app';
}

// ── Context data fetched once on mount ───────────────────────────────────────

interface AssistantContextData {
  roadmap_steps?: unknown[];
  financial_snapshot?: unknown;
  funding_matches?: unknown[];
}

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [contextData, setContextData] = useState<AssistantContextData>({});
  const [contextLoaded, setContextLoaded] = useState(false);

  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, showGreeting, clearMessages } = useChatStore();
  const { profile } = useProfileStore();

  // Fetch full data context once on mount
  useEffect(() => {
    if (!profile?.id || contextLoaded) return;

    async function fetchContext() {
      try {
        const [roadmapRes, snapshotRes, fundingRes] = await Promise.all([
          fetch(`/api/roadmap?profile_id=${profile!.id}`),
          fetch(`/api/financial-snapshot?profile_id=${profile!.id}`),
          fetch(`/api/funding?profile_id=${profile!.id}`),
        ]);

        const roadmapData = roadmapRes.ok ? await roadmapRes.json() : null;
        const snapshotData = snapshotRes.ok ? await snapshotRes.json() : null;
        const fundingData = fundingRes.ok ? await fundingRes.json() : null;

        setContextData({
          roadmap_steps: roadmapData?.steps ?? [],
          financial_snapshot: snapshotData?.snapshot ?? null,
          funding_matches: fundingData?.matches ?? [],
        });
      } catch {
        // Non-critical — assistant works with partial context
      } finally {
        setContextLoaded(true);
      }
    }

    fetchContext();
  }, [profile?.id, contextLoaded]);

  // Static greeting on first open
  function handleOpen() {
    setIsOpen(true);
    showGreeting();
  }

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessage(trimmed, {
      profile_id: profile?.id,
      page_context: pageContextFromPath(pathname),
      context_data: contextData,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Expanded chat panel */}
      <div
        className={`fixed bottom-20 right-5 z-50 w-[380px] h-[520px] flex flex-col rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-90 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center text-sm">
              🤖
            </div>
            <div>
              <span className="font-semibold text-slate-800 text-sm">BZNS Assistant</span>
              <span className="ml-2 h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearMessages}
              className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-slate-400 text-xs mt-6 px-4">
              <p className="text-lg mb-1.5">👋</p>
              <p>Ask me anything about your business in Quebec.</p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex gap-2 items-center text-slate-400">
              <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center text-xs">
                🤖
              </div>
              <div className="flex gap-1 text-xs">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce [animation-delay:0.1s]">•</span>
                <span className="animate-bounce [animation-delay:0.2s]">•</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-2.5 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about registration, taxes, funding..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={14} className={input.trim() && !isLoading ? 'text-white' : 'text-slate-400'} />
          </button>
        </div>
      </div>

      {/* Floating bubble button */}
      <button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-slate-700 hover:bg-slate-800 rotate-0'
            : 'bg-teal-600 hover:bg-teal-700 hover:scale-105'
        }`}
      >
        {isOpen ? (
          <X size={20} className="text-white" />
        ) : (
          <MessageSquare size={20} className="text-white" />
        )}
      </button>
    </>
  );
}
