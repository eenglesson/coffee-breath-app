import { UIMessage } from 'ai';
import { Database } from '@/database.types';

type DbMessage = Database['public']['Tables']['ai_messages']['Row'];

/**
 * Convert database messages to AI SDK UIMessage format
 */
export function convertDbMessagesToUIMessages(
  dbMessages: DbMessage[]
): UIMessage[] {
  return dbMessages.map((dbMessage) => {
    const uiMessage: UIMessage = {
      id: dbMessage.id,
      role: dbMessage.sender === 'user' ? 'user' : 'assistant',
      parts: [
        {
          type: 'text',
          text: dbMessage.content,
        },
      ],
    };

    return uiMessage;
  });
}

/**
 * Convert AI SDK UIMessage to database message format
 */
export function convertUIMessageToDbMessage(
  uiMessage: UIMessage,
  conversationId: string
): Omit<
  Database['public']['Tables']['ai_messages']['Insert'],
  'id' | 'created_at'
> {
  const content = uiMessage.parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('');

  return {
    conversation_id: conversationId,
    content,
    sender: uiMessage.role === 'user' ? 'user' : 'assistant',
    metadata: null,
  };
}
