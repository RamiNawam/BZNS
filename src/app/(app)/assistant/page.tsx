import ChatPanel from '@/components/assistant/chat-panel';

export default function AssistantPage() {
  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-500 mt-1">
          Ask anything about starting your business in Quebec — registration,
          taxes, funding, compliance, and more.
        </p>
      </div>
      <div className="flex-1">
        <ChatPanel />
      </div>
    </div>
  );
}
