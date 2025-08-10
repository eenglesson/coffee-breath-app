'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createConversation } from '@/app/actions/conversations/conversations';
import { ChatInput } from './chat-input';
import { Conversation } from './conversation';
import { Database } from '@/database.types';
import { DefaultChatTransport } from 'ai';

type DbMessage = Database['public']['Tables']['ai_messages']['Row'];

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: DbMessage[];
  onNewConversation?: (conversation: {
    id: string;
    title: string;
    created_at?: string;
    updated_at?: string;
  }) => void;
}

export default function ChatInterface({
  conversationId: propConversationId,
  onNewConversation,
}: ChatInterfaceProps) {
  const pathname = usePathname();
  const [selectedStudents] = useState<
    {
      id: string;
      interests: string | null;
      learning_difficulties: string | null;
      school_year: string | null;
    }[]
  >([]);
  const [conversationId, setConversationId] = useState<string | null>(
    propConversationId || null
  );
  const [input, setInput] = useState('');

  // Sync internal conversationId state with prop changes
  useEffect(() => {
    setConversationId(propConversationId || null);
  }, [propConversationId]);

  const { messages, sendMessage, regenerate, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),

    onError: (error) => {
      console.error('useChat error:', error);
    },
  });

  // Custom submit function
  const onSubmit = async (messageToSend: string) => {
    if (!messageToSend.trim()) return;

    // Check if we're on create-questions page and this is the first message
    const isCreateQuestionsPage = pathname === '/dashboard/create-questions';
    const isFirstMessage = messages.length === 0;

    let currentConversationId = conversationId;

    if (isCreateQuestionsPage && isFirstMessage && !currentConversationId) {
      try {
        // Create conversation (without first message)
        const conversation = await createConversation(
          'Create Questions Session'
        );
        currentConversationId = conversation.id;

        // Update URL without page reload using history API
        window.history.replaceState(
          {},
          '',
          `/dashboard/create-questions/${currentConversationId}`
        );
        setConversationId(currentConversationId);

        // Notify parent component about new conversation
        if (onNewConversation) {
          onNewConversation({
            id: conversation.id,
            title: conversation.title || 'Create Questions Session',
            created_at: conversation.created_at || undefined,
            updated_at: conversation.updated_at || undefined,
          });
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
        // Fall back to normal chat
      }
    }

    // Submit to AI
    sendMessage(
      { text: messageToSend },
      {
        body: {
          selectedStudents,
          conversationId: currentConversationId,
        },
      }
    );
  };

  const handleInputSubmit = (message: string) => {
    onSubmit(message);
  };

  const handleEdit = (messageId: string, newText: string) => {
    // TODO: Implement message editing
    console.log('Edit message:', messageId, newText);
  };

  const handleReload = () => {
    regenerate();
  };

  // Check if no conversation is ongoing (no messages and no conversation ID)
  const noConversation = messages.length === 0 && !conversationId;

  return (
    <div className='relativeflex flex-col h-full'>
      <div className='flex-1 overflow-hidden'>
        <Conversation
          messages={messages}
          status={status}
          onEdit={handleEdit}
          onReload={handleReload}
        />
      </div>
      <div className='sticky bottom-0 left-0 right-0 z-20 '>
        <div className='mx-auto max-w-3xl p-4'>
          {noConversation && (
            <p className='mb-2 text-center text-muted-foreground'>
              What&apos;s on your mind?
            </p>
          )}
          <ChatInput
            value={input}
            onValueChange={setInput}
            onSubmit={handleInputSubmit}
            isLoading={status === 'streaming'}
            placeholder='Ask me to create questions for your students...'
          />
        </div>
      </div>
    </div>
  );
}
