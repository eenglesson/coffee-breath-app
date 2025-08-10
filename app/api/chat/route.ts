import { convertToModelMessages, streamText } from 'ai';
import { xai } from '@ai-sdk/xai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: xai('grok-3-mini'), // Use a valid model ID like 'grok-3-mini' or 'grok-3'
      system: 'You are a helpful assistant.',
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
