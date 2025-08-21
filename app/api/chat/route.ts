import { convertToModelMessages, stepCountIs, streamText, UIMessage } from 'ai';
import { xai } from '@ai-sdk/xai';
import { addMessageToConversation } from '@/app/actions/messages/messages';
import { createClient } from '@/lib/supabase/server';
import { tavilySearchTool } from '@/app/tools/tavily-search'; // Import the tool from the new file (adjust path)
import { Json } from '@/database.types';

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

    // Use the imported tool in an object (required format for ToolSet)

    // Map searchMode: 'on' -> 'auto' (model can search if needed), else 'none' (never search)
    const searchChoice = searchMode === 'on' ? 'auto' : 'none';

    const requestStartTime = Date.now();

    const result = streamText({
      model: xai('grok-3-mini'),
      system:
        'You are a helpful assistant for teachers to create educational content and questions for students. Answer with same language as user. you have tools for giving the best answers. If you have Links provide them inside the repsonse where you think it is relevant.',
      messages: convertToModelMessages(messages),
      // Expose both Tavily web search and the sample weather tool
      tools: {
        web_search: tavilySearchTool,
      },
      // Let the model decide to use tools based on UI toggle
      toolChoice: searchChoice,
      // Encourage the model to finish with a final assistant message after tool calls
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      messageMetadata: ({ part }) => {
        // Send metadata when streaming starts
        if (part.type === 'start') {
          return {
            createdAt: Date.now(), // start time
          };
        }

        // Send additional metadata when streaming completes
        if (part.type === 'finish') {
          const endTime = Date.now();
          return {
            totalTokens: part.totalUsage?.totalTokens || 0, // total tokens used
            totalTime: endTime - requestStartTime, // Calculate total response time
          };
        }
      },
      onFinish: async ({ messages: finalMessages }) => {
        // Save messages to database if we have a conversation ID
        if (conversationId && finalMessages.length > 0) {
          try {
            // Save the AI response (always new)
            const latestMessage = finalMessages[finalMessages.length - 1];
            if (latestMessage.role === 'assistant') {
              console.log('latestMessage', latestMessage);

              const content = latestMessage.parts
                .map((part) => (part.type === 'text' ? part.text : ''))
                .join('');
              //add tools results and tool invocations
              await addMessageToConversation(
                conversationId,
                content,
                'assistant',
                latestMessage.metadata as Json
              );
            }
            console.log('finalMessages', finalMessages);
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
