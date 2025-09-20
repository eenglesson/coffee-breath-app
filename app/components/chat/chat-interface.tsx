'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const createChatSessionId = useCallback(
    () => `chat-session-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    []
  );

  const [conversationId, setConversationId] = useState<string | null>(
    propConversationId || null
  );
  const [input, setInput] = useState('');
  const { searchMode, toggleSearchMode } = useSearchMode();
  const previousPathnameRef = useRef(pathname);
  const skipSeedRef = useRef(false);
  const streamingConversationIdRef = useRef<string | null>(null);
  const [chatSessionId, setChatSessionId] = useState(createChatSessionId);

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
    id: chatSessionId,
    onError: (error) => {
      console.error('useChat error:', error);
    },
    onFinish: async ({ message }) => {
      const completedConversationId = streamingConversationIdRef.current;

      // Clean cache sync when AI finishes responding
      if (message.role === 'assistant' && completedConversationId) {
        try {
          // Convert AI SDK message to DB format
          const dbMessage = convertUIMessageToDbMessage(
            message,
            completedConversationId
          );
          const fullMessage: AiMessage = {
            id: message.id,
            conversation_id: completedConversationId,
            content: dbMessage.content,
            sender: 'assistant',
            metadata: dbMessage.metadata || null,
            created_at: new Date().toISOString(),
          };

          // Update caches instantly (queryClient.setQueryData is synchronous)
          addMessageToCache(completedConversationId, fullMessage);

          updateConversation(completedConversationId, {
            preview: [
              {
                content:
                  fullMessage.content.length > 100
                    ? fullMessage.content.substring(0, 100) + '...'
                    : fullMessage.content,
                sender: fullMessage.sender,
              },
            ],
            last_message: fullMessage,
            message_count_delta: 1,
            append_message: fullMessage,
          });

          updatePreview(completedConversationId, fullMessage);
        } catch (error) {
          console.error('Failed to sync caches:', error);
        } finally {
          queryClient.invalidateQueries({
            queryKey: ['messages', completedConversationId],
          });
          streamingConversationIdRef.current = null;
        }
      }
    },
  });

  // Simple conversation loading: seed AI SDK with history once
  useEffect(() => {
    if (streamingConversationIdRef.current) return;

    if (
      currentConversationId &&
      dbMessages.length > 0 &&
      messages.length === 0 &&
      status === 'ready' &&
      !skipSeedRef.current
    ) {
      // Let AI SDK handle the conversation history
      setMessages(convertDbMessagesToUIMessages(dbMessages));
    }
  }, [
    currentConversationId,
    dbMessages,
    messages.length,
    status,
    setMessages,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleNewChatNavigation = () => {
      skipSeedRef.current = true;
      setChatSessionId(createChatSessionId());
      setMessages([]);
      setConversationId(null);
    };

    window.addEventListener('chat:new', handleNewChatNavigation);

    return () => {
      window.removeEventListener('chat:new', handleNewChatNavigation);
    };
  }, [setMessages, createChatSessionId]);

  useEffect(() => {
    const isFreshChat = !propConversationId && conversationId === null;

    if (isFreshChat && messages.length > 0) {
      setMessages([]);
    }
  }, [propConversationId, conversationId, messages.length, setMessages]);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    const navigatedToFreshChat =
      pathname === '/dashboard/ai-chat' &&
      previousPathname !== '/dashboard/ai-chat' &&
      !propConversationId;

    if (navigatedToFreshChat) {
      if (messages.length > 0) {
        setMessages([]);
      }

      if (conversationId !== null) {
        setConversationId(null);
      }

      skipSeedRef.current = false;
    }

    previousPathnameRef.current = pathname;
  }, [pathname, propConversationId, messages.length, conversationId, setMessages]);

  // Cache invalidation is now handled in useChat onFinish callback
  // This reduces race conditions and over-invalidating

  // Sync internal conversationId state with prop changes
  useEffect(() => {
    if (!propConversationId) return;

    if (conversationId !== propConversationId) {
      setConversationId(propConversationId);
    }

    skipSeedRef.current = false;
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
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) && query.queryKey[0] === 'conversations',
        });
        skipSeedRef.current = false;

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

    if (currentConversationId) {
      streamingConversationIdRef.current = currentConversationId;

      const optimisticUserMessage: AiMessage = {
        id: `optimistic-user-${Date.now()}`,
        conversation_id: currentConversationId,
        content: messageToSend,
        sender: 'user',
        metadata: null,
        created_at: new Date().toISOString(),
      };

      addMessageToCache(currentConversationId, optimisticUserMessage);

      updateConversation(currentConversationId, {
        preview: [
          {
            content:
              messageToSend.length > 100
                ? messageToSend.substring(0, 100) + '...'
                : messageToSend,
            sender: 'user',
          },
        ],
        last_message: optimisticUserMessage,
        message_count_delta: 1,
        append_message: optimisticUserMessage,
      });

      updatePreview(currentConversationId, optimisticUserMessage);
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
        <div className='relative flex flex-col justify-center items-center max-w-3xl w-full'>
          <div>
            <h1 className='absolute bottom-32 left-0 right-0 mb-2 text-3xl text-center font-medium tracking-tight'>
              What&apos;s on your mind?
            </h1>
          </div>
          <ChatInput
            className='px-2'
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
