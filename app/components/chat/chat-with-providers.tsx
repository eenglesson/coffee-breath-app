'use client';

import { ConversationsProvider } from '@/lib/context/ConversationsContext';
import { ConversationSessionProvider } from '@/lib/context/ConversationSessionContext';
import ChatInterface from './chat-interface';

interface ChatWithProvidersProps {
  teacherId: string;
  conversationId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialMessages?: any[];
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
