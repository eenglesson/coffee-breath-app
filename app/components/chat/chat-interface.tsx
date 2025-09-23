'use client';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { createConversation } from '@/app/actions/conversations/conversations';
// import { getConversationMessages } from '@/app/actions/messages/messages';
import { ChatInput } from './chat-input';
import { Conversation } from './conversation';
import { Database } from '@/database.types';
import { DefaultChatTransport } from 'ai';
import { convertDbMessagesToUIMessages } from '@/lib/utils/message-conversion';
import { useConversationMessages } from '@/lib/hooks/chat/useMessages';
import { useSearchMode } from '@/app/hooks/use-search-mode';

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
  const conversationIdRef = useRef<string | null>(
    currentConversationId ?? null
  );
  const previousConversationIdRef = useRef<string | null>(
    currentConversationId ?? null
  );

  useEffect(() => {
    conversationIdRef.current = currentConversationId ?? null;
  }, [currentConversationId]);

  const { data: dbMessages = [], isLoading: isLoadingMessages } =
    useConversationMessages(currentConversationId ?? null);

  // useChat uses stable ID that never changes - prevents transcript loss!
  const { messages, sendMessage, regenerate, status, setMessages } = useChat({
    id: 'current-chat', // Stable key - hook state survives URL changes

    experimental_throttle: 50,
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onError: (error) => {
      console.error('useChat error:', error);
    },
    onFinish: async () => {
      const activeConversationId = conversationIdRef.current;
      if (!activeConversationId) return;
      queryClient.invalidateQueries({
        queryKey: ['messages', activeConversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({
        queryKey: ['conversation-messages-preview', activeConversationId],
      });
    },
  });

  // Sync loaded messages from DB to useChat state
  useEffect(() => {
    if (dbMessages.length > 0) {
      setMessages(convertDbMessagesToUIMessages(dbMessages));
    }
  }, [dbMessages, setMessages]);

  // Sync conversationId with props
  useEffect(() => {
    if (propConversationId !== undefined) {
      setConversationId((prev) =>
        prev === propConversationId ? prev : propConversationId
      );
      return;
    }
    // For base route, ensure null state
    if (pathname === '/dashboard/ai-chat') {
      setConversationId((prev) => (prev === null ? prev : null));
    }
  }, [propConversationId, pathname]);

  useEffect(() => {
    const previousConversationId = previousConversationIdRef.current;
    if (previousConversationId === currentConversationId) {
      return;
    }
    if (!currentConversationId) {
      setMessages([]);
      setInput('');
    } else if (previousConversationId) {
      setMessages([]);
      setInput('');
    } else {
      setInput('');
    }
    previousConversationIdRef.current = currentConversationId ?? null;
  }, [currentConversationId, setMessages]);

  // Custom submit function - optimistic approach
  const onSubmit = async (messageToSend: string) => {
    if (!messageToSend.trim()) return;

    const isCreateQuestionsPage = pathname === '/dashboard/ai-chat';
    const isFirstMessage = messages.length === 0;
    let currentConversationId = propConversationId || conversationId;

    if (isCreateQuestionsPage && isFirstMessage && !currentConversationId) {
      try {
        // 1. Create conversation first
        const conversation = await createConversation(
          'Create Questions Session'
        );
        currentConversationId = conversation.id;

        // 2. Update URL without remounting (ChatSessionProvider picks this up reactively)
        const targetPath = `/dashboard/ai-chat/${currentConversationId}`;
        if (pathname !== targetPath) {
          window.history.pushState(null, '', targetPath); // No remount!
        }

        // 3. Update local state
        setConversationId(currentConversationId);
        conversationIdRef.current = currentConversationId;

        // 4. Cache update for conversations list
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
        return;
      }
    }

    // Send message with correct conversationId (useChat ID stays stable)
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
