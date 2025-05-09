import { ChatOpenAI } from '@langchain/openai';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const message = url.searchParams.get('message');
  if (!message) {
    return new Response('Message is required', { status: 400 });
  }

  // Initialize the AI model with streaming enabled
  const grok = new ChatOpenAI({
    apiKey: process.env.XAI_API_KEY!, // Set this in your .env file
    model: 'grok-3-mini', // Adjust model as needed
    configuration: { baseURL: 'https://api.x.ai/v1' }, // Adjust baseURL if different
    streaming: true,
  });

  // Stream the AI response
  const stream = await grok.stream([
    {
      role: 'system',
      content:
        'You are a helpful assistant named Teacher-ai that helps me generate information for me as a teacher for example lesson plans questions that is for students and other stuff, or for the students that need help with their learning process. give in dangerouslySetInnerHTML format.',
    },
    { role: 'user', content: message },
  ]);

  // Set SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };

  const encoder = new TextEncoder();

  // Create a readable stream for SSE
  const sseStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.content;
        if (text) {
          controller.enqueue(encoder.encode(`data: ${text}\n\n`));
        }
      }
      // Signal the end of the stream
      controller.enqueue(encoder.encode('event: end\n\n'));
      controller.close();
    },
  });

  return new Response(sseStream, { headers });
}

// For App Router, export config if needed
export const config = {
  runtime: 'edge', // Optional: Use Edge runtime for better streaming performance
};
