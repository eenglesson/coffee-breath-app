'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { createConversation } from '@/app/actions/conversations/conversations';
// import { getConversationMessages } from '@/app/actions/messages/messages';
import { ChatInput } from './chat-input';
import { Conversation } from './conversation';
import { Database } from '@/database.types';
import { DefaultChatTransport } from 'ai';
import { convertDbMessagesToUIMessages } from '@/lib/utils/message-conversion';
import {
  useConversationMessages,
  useMessageCache,
  useConversationCache,
  usePreviewCache,
} from '@/lib/hooks/chat/useMessages';
import { useSearchMode } from '@/app/hooks/use-search-mode';
import { convertUIMessageToDbMessage } from '@/lib/utils/message-conversion';
import { AiMessage } from '@/lib/types/chat';
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
  const { searchMode, toggleSearchMode } = useSearchMode();

  // Use shared TanStack hook to load messages and leverage centralized cache keys and timings
  const currentConversationId = propConversationId || conversationId;
  const { data: dbMessages = [], isLoading: isLoadingMessages } =
    useConversationMessages(currentConversationId ?? null);

  const { addMessageToCache } = useMessageCache();
  const { updateConversation } = useConversationCache();
  const { updatePreview } = usePreviewCache();

  const { messages, sendMessage, regenerate, status, setMessages } = useChat({
    experimental_throttle: 50,
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onError: (error) => {
      console.error('useChat error:', error);
    },
    onFinish: async ({ message }) => {
      // Clean cache sync when AI finishes responding
      if (message.role === 'assistant' && currentConversationId) {
        try {
          // Convert AI SDK message to DB format
          const dbMessage = convertUIMessageToDbMessage(
            message,
            currentConversationId
          );
          const fullMessage: AiMessage = {
            id: message.id,
            conversation_id: currentConversationId,
            content: dbMessage.content,
            sender: 'assistant',
            metadata: dbMessage.metadata || null,
            created_at: new Date().toISOString(),
          };

          // Update caches instantly (queryClient.setQueryData is synchronous)
          addMessageToCache(currentConversationId, fullMessage);

          updateConversation(currentConversationId, {
            preview: [
              {
                content:
                  fullMessage.content.length > 100
                    ? fullMessage.content.substring(0, 100) + '...'
                    : fullMessage.content,
                sender: fullMessage.sender,
              },
            ],
          });

          updatePreview(currentConversationId, fullMessage);
        } catch (error) {
          console.error('Failed to sync caches:', error);
        }
      }
    },
  });

  // Simple conversation loading: seed AI SDK with history once
  useEffect(() => {
    if (
      currentConversationId &&
      dbMessages.length > 0 &&
      messages.length === 0 &&
      status === 'ready'
    ) {
      // Let AI SDK handle the conversation history
      setMessages(convertDbMessagesToUIMessages(dbMessages));
    }
  }, [currentConversationId, dbMessages, messages.length, status, setMessages]);

  // Cache invalidation is now handled in useChat onFinish callback
  // This reduces race conditions and over-invalidating

  // Sync internal conversationId state with prop changes
  useEffect(() => {
    if (propConversationId && propConversationId !== conversationId) {
      setConversationId(propConversationId);
    }
  }, [propConversationId, conversationId]);

  // Custom submit function
  const onSubmit = async (messageToSend: string) => {
    if (!messageToSend.trim()) return;

    // Check if we're on ai-chat page and this is the first message
    const isCreateQuestionsPage = pathname === '/dashboard/ai-chat';
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

        // Update URL without forcing a remount; keep streaming in-place
        try {
          window.history.replaceState(
            {},
            '',
            `/dashboard/ai-chat/${currentConversationId}`
          );
        } catch {}

        setConversationId(currentConversationId);
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

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
          searchMode: searchMode ? 'on' : 'off',
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

  const toggleSearch = () => {
    toggleSearchMode();
  };

  // removed sessionStorage-based first-message handoff; we stream in-place

  // Starter prompt only for brand-new chats (no id in URL, no messages)
  const showStarter =
    !isLoadingMessages && !propConversationId && messages.length === 0;

  return (
    <section className='w-full h-[calc(100vh-64px)] flex items-center justify-center'>
      {showStarter ? (
        <div className='flex flex-col justify-center items-center max-w-3xl w-full'>
          <div>
            <h1 className='mb-2 text-3xl text-center font-medium tracking-tight'>
              What&apos;s on your mind?
            </h1>
          </div>
          <ChatInput
            value={input}
            onValueChange={setInput}
            onSubmit={handleInputSubmit}
            isLoading={status === 'streaming'}
            placeholder='Ask me to create questions for your students...'
            searchMode={searchMode}
            onToggleSearch={toggleSearch}
          />
        </div>
      ) : (
        <div className='w-full relative'>
          <div className='relative flex flex-col h-[calc(100vh-64px)] w-full'>
            {' '}
            {/* 100vh - 64px header height */}
            <Conversation
              messages={messages}
              status={status}
              onEdit={handleEdit}
              onReload={handleReload}
            />
          </div>
          <div className='absolute bottom-2 left-0 right-0 w-full max-w-3xl mx-auto px-2'>
            <ChatInput
              value={input}
              onValueChange={setInput}
              onSubmit={handleInputSubmit}
              isLoading={status === 'streaming'}
              placeholder='Ask me anything...'
              searchMode={searchMode}
              onToggleSearch={toggleSearch}
            />
          </div>
        </div>
      )}
    </section>
  );
}
