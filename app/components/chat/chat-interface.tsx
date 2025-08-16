'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { createConversation } from '@/app/actions/conversations/conversations';
import { getConversationMessages } from '@/app/actions/messages/messages';
import { ChatInput } from './chat-input';
import { Conversation } from './conversation';
import { Database } from '@/database.types';
import { DefaultChatTransport } from 'ai';
import { convertDbMessagesToUIMessages } from '@/lib/utils/message-conversion';

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
  const queryClient = useQueryClient();
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

  // Use TanStack Query v5 to load messages - handles caching, deduplication, and race conditions automatically
  const currentConversationId = propConversationId || conversationId;
  const { data: dbMessages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', currentConversationId],
    queryFn: () => getConversationMessages(currentConversationId!),
    enabled: !!currentConversationId,
    staleTime: 15 * 60 * 1000, // 15 minutes - same as useChatPreview for consistency
    gcTime: 30 * 60 * 1000, // 30 minutes cache retention
  });

  const { messages, sendMessage, regenerate, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onError: (error) => {
      console.error('useChat error:', error);
    },
  });

  // Update useChat messages when TanStack Query data changes
  useEffect(() => {
    if (dbMessages && Array.isArray(dbMessages)) {
      const uiMessages = convertDbMessagesToUIMessages(dbMessages);
      setMessages(uiMessages);
    } else if (!currentConversationId) {
      // Clear messages if no conversation ID
      setMessages([]);
    }
  }, [dbMessages, currentConversationId, setMessages]);

  // Invalidate caches when streaming completes (AI SDK v5: no per-send onFinish)
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    if ((prev === 'streaming' || prev === 'submitted') && status === 'ready') {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      const idForInvalidation = propConversationId || conversationId;
      if (idForInvalidation) {
        queryClient.invalidateQueries({
          queryKey: ['messages', idForInvalidation],
        });
        queryClient.invalidateQueries({
          queryKey: ['conversation-messages-preview', idForInvalidation],
        });
      }
    }
    prevStatusRef.current = status;
  }, [status, propConversationId, conversationId, queryClient]);

  // Sync internal conversationId state with prop changes
  useEffect(() => {
    setConversationId(propConversationId || null);
  }, [propConversationId]);

  // Custom submit function
  const onSubmit = async (messageToSend: string) => {
    if (!messageToSend.trim()) return;

    // Check if we're on create-questions page and this is the first message
    const isCreateQuestionsPage = pathname === '/dashboard/create-questions';
    const isFirstMessage = messages.length === 0;

    // Prefer the URL param id if present to avoid transient null state
    let currentConversationId = propConversationId || conversationId;

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
        // Ensure history shows the newly created conversation
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

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
    setInput('');
  };

  const handleEdit = (messageId: string, newText: string) => {
    // TODO: Implement message editing
    console.log('Edit message:', messageId, newText);
  };

  const handleReload = () => {
    regenerate();
  };

  // Starter prompt only for brand-new chats (no id in URL, no messages)
  const showStarter =
    !isLoadingMessages && !propConversationId && messages.length === 0;

  return (
    <section className='w-full max-w-3xl mx-auto h-full flex flex-col'>
      {showStarter ? (
        <div className='flex flex-col h-full justify-center items-center'>
          <div>
            <h1 className='mb-6 text-3xl text-center font-medium tracking-tight'>
              What&apos;s on your mind?
            </h1>
          </div>
          <ChatInput
            value={input}
            onValueChange={setInput}
            onSubmit={handleInputSubmit}
            isLoading={status === 'streaming'}
            placeholder='Ask me to create questions for your students...'
          />
        </div>
      ) : (
        <div className='flex flex-col h-full'>
          <div className='flex-1 overflow-y-auto'>
            <Conversation
              messages={messages}
              status={isLoadingMessages ? 'streaming' : status}
              onEdit={handleEdit}
              onReload={handleReload}
            />
          </div>
          <div className='sticky mt-auto bottom-4 max-w-3xl'>
            <ChatInput
              className=''
              value={input}
              onValueChange={setInput}
              onSubmit={handleInputSubmit}
              isLoading={status === 'streaming'}
              placeholder='Ask me to create questions for your students...'
            />
          </div>
        </div>
      )}
    </section>
  );
}
