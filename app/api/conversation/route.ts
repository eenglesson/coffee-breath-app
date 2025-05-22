// app/api/conversation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import grokEndPoint from '../grok';

export async function POST(req: NextRequest) {
  try {
    const { prompt, context, students } = await req.json();

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

    // Validate students (optional, but must be an array if provided)
    if (students && !Array.isArray(students)) {
      return NextResponse.json(
        { error: 'Students must be an array' },
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
      type: 'user' | 'assistant';
      content: string | object;
      student?: {
        id: string;
        interests: string | null;
        learning_difficulties: string | null;
      };
    };

    // Convert context to ChatCompletionMessageParam format
    const baseMessages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'You are Grok, a witty and helpful AI built by xAI. Your mission is to assist teachers in creating engaging educational content, structured lesson plans, or learning new topics for their own growth. Respond in a conversational, friendly tone with a touch of humor when appropriate, as if chatting with a fellow educator. Always return a valid JSON object with the following fields:\n\n- "summary": a short, catchy summary of the response, perfect for grabbing students\' attention or sparking curiosity.\n- "content": the main response as a string containing markdown-formatted text. Use markdown syntax such as ### for section headings, paragraphs for explanatory text, - or * for unordered lists of key points or steps, 1. for ordered lists, and ** or * for emphasis or to highlight important terms. Structure the content to be clear, engaging, and easy to follow, whether it\'s for a lesson plan, student material, or personal learning.\n- "lists" (optional): an array of strings representing bullet points or steps, included only when the response naturally includes list-like information, such as activity steps or key takeaways.\n\nKeep the response concise but informative, ensuring it\'s tailored to the teacher\'s request and ready to be used in various educational contexts.',
      },
      ...context
        .filter((msg: ContextMessage) => msg.isComplete)
        .map((msg: ContextMessage) => ({
          role: msg.type as 'user' | 'assistant',
          content:
            typeof msg.content === 'string'
              ? msg.content
              : JSON.stringify(msg.content),
        })),
    ];

    // Handle case with no students
    if (!students || students.length === 0) {
      const messages: ChatCompletionMessageParam[] = [
        ...baseMessages,
        { role: 'user', content: prompt },
      ];
      const response = await grokEndPoint.chat.completions.create({
        model: 'grok-3-mini-beta',
        messages,
        stream: false,
      });

      if (!response.choices || !response.choices[0]?.message?.content) {
        console.error('Invalid API response:', response);
        return NextResponse.json(
          { error: 'No valid response from API' },
          { status: 500 }
        );
      }

      const assistantResponse = response.choices[0].message.content;
      return NextResponse.json({
        message: 'Prompt processed',
        response: assistantResponse,
      });
    }

    // Process prompts for each student
    const responses = await Promise.all(
      students.map(
        async (student: {
          id: string;
          interests: string | null;
          learning_difficulties: string | null;
        }) => {
          const studentPrompt = `
            ${prompt}
            
            For a student with the following details:
            - Interests: ${student.interests || 'None provided'}
            - Learning Difficulties: ${
              student.learning_difficulties || 'None provided'
            }
            
            Tailor the response to suit this student's needs and interests.
          `;
          const messages: ChatCompletionMessageParam[] = [
            ...baseMessages,
            { role: 'user', content: studentPrompt },
          ];

          try {
            const response = await grokEndPoint.chat.completions.create({
              model: 'grok-3-mini-beta',
              messages,
              stream: false,
            });

            if (!response.choices || !response.choices[0]?.message?.content) {
              console.error('Invalid API response for student:', student.id);
              return { studentId: student.id, response: null };
            }

            return {
              studentId: student.id,
              response: response.choices[0].message.content,
            };
          } catch (error) {
            console.error('Error for student:', student.id, error);
            return { studentId: student.id, response: null };
          }
        }
      )
    );

    // Check for failed responses
    const failedResponses = responses.filter((r) => !r.response);
    if (failedResponses.length > 0) {
      console.error('Some API responses failed:', failedResponses);
      return NextResponse.json(
        {
          error: 'Some responses could not be generated',
          failed: failedResponses,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Prompts processed for students',
      responses,
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
