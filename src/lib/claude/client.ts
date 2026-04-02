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
  model = 'claude-opus-4-5',
  maxTokens = 4096
): Promise<string> {
  const client = getAnthropicClient();

  console.log(`[Claude] Calling model=${model} max_tokens=${maxTokens} system_prompt_chars=${systemPrompt.length}`);
  const start = Date.now();

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const elapsed = Date.now() - start;
  console.log(`[Claude] Done in ${elapsed}ms | input_tokens=${response.usage.input_tokens} output_tokens=${response.usage.output_tokens} stop_reason=${response.stop_reason}`);

  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }
  return block.text;
}
