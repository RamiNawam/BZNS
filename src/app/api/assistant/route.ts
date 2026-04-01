import { NextRequest, NextResponse } from 'next/server';
// import Anthropic from '@anthropic-ai/sdk';
// import { selectKnowledgeBase } from '@/lib/knowledge-base/selector';
// import { buildSystemPrompt } from '@/lib/claude/prompts';

/**
 * POST /api/assistant — Stream a Claude AI response to a user message,
 * grounded in the BZNS knowledge base.
 */

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, profileContext } = body;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: 'messages array is required' },
      { status: 400 }
    );
  }

  // TODO: Select relevant knowledge base files based on message intent
  // const relevantContext = await selectKnowledgeBase(messages[messages.length - 1].content);

  // TODO: Build grounded system prompt
  // const systemPrompt = buildSystemPrompt({ profileContext, knowledgeBase: relevantContext });

  // TODO: Call Claude API (streaming)
  // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const stream = await anthropic.messages.stream({ model: 'claude-opus-4-5', max_tokens: 1024, system: systemPrompt, messages });

  // TODO: Return a streaming response
  // return new Response(stream.toReadableStream(), { headers: { 'Content-Type': 'text/event-stream' } });

  return NextResponse.json({
    message: 'Assistant endpoint stub — implement streaming with Claude SDK',
    userMessage: messages[messages.length - 1]?.content ?? '',
    reply:
      'Bonjour! I am the BZNS assistant. This is a stub response. Implement the Claude SDK integration in this route.',
  });
}
