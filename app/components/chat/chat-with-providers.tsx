'use client';

import { ConversationsProvider } from '@/lib/context/ConversationsContext';
import { ConversationSessionProvider } from '@/lib/context/ConversationSessionContext';
import ChatInterface from './chat-interface';
import { Database } from '@/database.types';

type DbMessage = Database['public']['Tables']['ai_messages']['Row'];

interface ChatWithProvidersProps {
  teacherId: string;
  conversationId?: string;
  initialMessages?: DbMessage[];
  onNewConversation?: (conversation: {
    id: string;
    title: string;
    created_at?: string;
    updated_at?: string;
  }) => void;
}

export default function ChatWithProviders({
  teacherId,
  conversationId,
  initialMessages,
  onNewConversation,
}: ChatWithProvidersProps) {
  return (
    <ConversationsProvider teacherId={teacherId}>
      <ConversationSessionProvider>
        <ChatInterface
          conversationId={conversationId}
          initialMessages={initialMessages}
          onNewConversation={onNewConversation}
        />
      </ConversationSessionProvider>
    </ConversationsProvider>
  );
}
