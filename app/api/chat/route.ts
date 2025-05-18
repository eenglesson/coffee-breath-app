import { createClient } from '@/lib/supabase/server';
import grokEndPoint from '../grok';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Type guard to validate Message[]
function isMessageArray(value: unknown): value is Message[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (msg) =>
      typeof msg === 'object' &&
      msg !== null &&
      'role' in msg &&
      'content' in msg &&
      (msg.role === 'system' ||
        msg.role === 'user' ||
        msg.role === 'assistant') &&
      typeof msg.content === 'string'
  );
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const conversationId = url.searchParams.get('conversationId');
  const message = url.searchParams.get('message');

  // Validate query parameters
  if (!conversationId || !message) {
    return new Response(
      JSON.stringify({ error: 'Missing conversationId or message' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Fetch existing conversation from Supabase
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116: no rows found
      throw error;
    }

    // Extract raw messages (typed as Json)
    const rawMessages = conversation?.messages;
    let messages: Message[] = [];

    // Validate and assign messages
    if (rawMessages) {
      if (!isMessageArray(rawMessages)) {
        throw new Error('Invalid messages format in database');
      }
      messages = rawMessages; // TypeScript now knows this is Message[]
    }

    // Append the new user message
    const fullMessages: Message[] = [
      ...messages,
      { role: 'user', content: message },
    ];

    // Call the Grok API with streaming enabled
    const stream = await grokEndPoint.chat.completions.create({
      model: 'grok-3-mini-beta',
      messages: fullMessages,
      stream: true,
    });

    // Set up a ReadableStream for SSE
    const sseStream = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            // Send each chunk as an SSE event
            controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        // Update the database with the full conversation
        const updatedMessages = [
          ...messages,
          { role: 'user', content: message },
          { role: 'assistant', content: fullContent },
        ];
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ id: conversationId, messages: updatedMessages });

        if (updateError) throw updateError;

        // Signal the end of the stream
        controller.enqueue('event: end\ndata: {}\n\n');
        controller.close();
      },
    });

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
