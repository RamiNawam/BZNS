import { create } from 'zustand';
import type { MessageRole } from '@/types/chat';

// Lightweight client-side message shape (no DB-required fields)
export interface ClientMessage {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
  sources?: string[] | null;
}

interface ChatStore {
  messages: ClientMessage[];
  isLoading: boolean;
  error: string | null;
  /** True after the static greeting has been shown this session */
  greeted: boolean;

  sendMessage: (
    content: string,
    extra?: { profile_id?: string; page_context?: string; context_data?: object },
  ) => Promise<void>;
  /** Show the static greeting as the first assistant message */
  showGreeting: () => void;
  clearMessages: () => void;
}

let _idCounter = 0;
function generateId() {
  return `msg_${Date.now()}_${++_idCounter}`;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  greeted: false,

  sendMessage: async (content, extra) => {
    const userMessage: ClientMessage = {
      id: generateId(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: extra?.profile_id,
          message: content,
          page_context: extra?.page_context,
          context_data: extra?.context_data,
          messages: get().messages.map(({ role, content: c }) => ({ role, content: c })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get assistant response');

      const data = await response.json();

      const assistantMessage: ClientMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.reply ?? '(No response)',
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      set({ isLoading: false });
    }
  },

  showGreeting: () => {
    if (get().greeted) return;
    set({
      greeted: true,
      messages: [
        {
          id: generateId(),
          role: 'assistant',
          content: 'Hey! How can I help you today?',
          created_at: new Date().toISOString(),
        },
      ],
    });
  },

  clearMessages: () => set({ messages: [], error: null, greeted: false }),
}));
