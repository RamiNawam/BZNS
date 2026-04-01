import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

/**
 * Returns a singleton Anthropic client.
 * Only instantiate server-side (API routes, Server Actions).
 */
export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _client;
}

/**
 * Send a non-streaming message to Claude and return the text response.
 */
export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  model = 'claude-opus-4-5'
): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }
  return block.text;
}
