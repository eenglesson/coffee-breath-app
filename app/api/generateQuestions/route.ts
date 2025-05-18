import grokEndPoint from '../grok';

// Define the expected request body interface
interface RequestBody {
  prompt: string;
  context: Message[];
}

// Define the message interface (expanded to include 'assistant' for API compatibility)
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  try {
    // Parse and validate the request body
    const { prompt, context }: RequestBody = await req.json();

    if (!prompt || !context || !Array.isArray(context)) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid prompt or context' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Optional: Validate each message in the context
    const isValidContext = context.every(
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

    if (!isValidContext) {
      return new Response(
        JSON.stringify({ error: 'Invalid message format in context' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create the full list of messages by appending the prompt as a user message
    const fullMessages: Message[] = [
      ...context,
      { role: 'user', content: prompt },
    ];

    // Send the messages to the Grok API
    const response = await grokEndPoint.chat.completions.create({
      model: 'grok-3-mini-beta',
      messages: fullMessages,
    });

    // Extract the assistant's response
    const assistantMessage = response.choices[0].message.content;

    // Return the response to the client
    return new Response(JSON.stringify({ answer: assistantMessage }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generateQuestions endpoint:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
