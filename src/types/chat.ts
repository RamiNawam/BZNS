export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: SourceCitation[];
  createdAt: string;
}

export interface SourceCitation {
  label: string;
  url?: string;
  section?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}
