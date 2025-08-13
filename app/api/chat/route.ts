import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { xai } from '@ai-sdk/xai';
import { addMessageToConversation } from '@/app/actions/messages/messages';
import { createClient } from '@/lib/supabase/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
      conversationId,
      searchMode,
    }: {
      messages: UIMessage[];
      conversationId?: string;
      searchMode?: string;
    } = await req.json();

    // Verify user is authenticated
    const supabase = await createClient();
    const { data: authUser } = await supabase.auth.getUser();

    if (!authUser || !authUser.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // Persist the latest user message immediately so it appears in history
    if (conversationId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        try {
          const userContent = lastMessage.parts
            .map((part) => (part.type === 'text' ? part.text : ''))
            .join('');
          if (userContent.trim().length > 0) {
            await addMessageToConversation(conversationId, userContent, 'user');
          }
        } catch (e) {
          console.error('Failed to save user message to database:', e);
        }
      }
    }

    const result = streamText({
      model: xai('grok-3-mini'),
      system:
        'You are a helpful assistant for teachers to create educational content and questions for students.',
      messages: convertToModelMessages(messages),
      providerOptions: {
        xai: {
          searchParameters: {
            mode: searchMode || 'off',
            returnCitations: true,
            maxSearchResults: 5,
          },
        },
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: finalMessages }) => {
        // Save messages to database if we have a conversation ID
        if (conversationId && finalMessages.length > 0) {
          try {
            // Save the AI response (always new)
            const latestMessage = finalMessages[finalMessages.length - 1];
            if (latestMessage.role === 'assistant') {
              const content = latestMessage.parts
                .map((part) => (part.type === 'text' ? part.text : ''))
                .join('');

              await addMessageToConversation(
                conversationId,
                content,
                'assistant'
              );
            }
          } catch (error) {
            console.error('Failed to save messages to database:', error);
            // Don't fail the response if saving fails
          }
        }
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
