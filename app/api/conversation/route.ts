// app/api/conversation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import grokEndPoint from '../grok';

export async function POST(req: NextRequest) {
  try {
    const { prompt, context } = await req.json();

    // Validate prompt
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate context
    if (!Array.isArray(context)) {
      return NextResponse.json(
        { error: 'Context must be an array' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        { error: 'XAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Define type for context messages
    type ContextMessage = {
      isComplete: boolean;
      type: string;
      content: string | object;
    };

    // Convert context to ChatCompletionMessageParam format
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'You are Grok, a witty and helpful AI built by xAI. Your mission is to assist teachers in creating engaging educational content, structured lesson plans, or learning new topics for their own growth. Respond in a conversational, friendly tone with a touch of humor when appropriate, as if chatting with a fellow educator. Always return a valid JSON object with the following fields:\n\n- "summary": a short, catchy summary of the response, perfect for grabbing students\' attention or sparking curiosity.\n- "content": the main response as a string containing HTML-formatted text. Use appropriate HTML tags such as <h3> for section headings, <p> for explanatory paragraphs, <ul> and <li> for lists of key points or steps, and <span> for emphasis or to highlight important terms. Structure the content to be clear, engaging, and easy to follow, whether it\'s for a lesson plan, student material, or personal learning.\n- "lists" (optional): an array of strings representing bullet points or steps, included only when the response naturally includes list-like information, such as activity steps or key takeaways.\n\nKeep the response concise but informative, ensuring it\'s tailored to the teacher\'s request and ready to be used in various educational contexts.',
      },
      ...context
        .filter((msg: ContextMessage) => msg.isComplete)
        .map((msg: ContextMessage) => ({
          role:
            msg.type === 'user' ? ('user' as const) : ('assistant' as const),
          content:
            typeof msg.content === 'string'
              ? msg.content
              : JSON.stringify(msg.content),
        })),
      { role: 'user', content: prompt },
    ];

    // Add the current prompt to the messages
    messages.push({ role: 'user', content: prompt });

    // Call xAI API without streaming
    const response = await grokEndPoint.chat.completions.create({
      model: 'grok-3-mini-beta',
      messages,
      stream: false,
    });

    // Check for valid response
    if (!response.choices || !response.choices[0]?.message?.content) {
      console.error('Invalid API response:', response);
      return NextResponse.json(
        { error: 'No valid response from API' },
        { status: 500 }
      );
    }

    // Extract assistant response
    const assistantResponse = response.choices[0].message.content;

    // Return the response
    return NextResponse.json({
      message: 'Prompt processed',
      response: assistantResponse,
    });
  } catch (error: unknown) {
    console.error('Error processing request:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process request: ${errorMessage}` },
      { status: 500 }
    );
  }
}
