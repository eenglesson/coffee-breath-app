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
  const { data: dbMessages = [], isLoading: isLoadingMessages } =
    useConversationMessages(currentConversationId ?? null);

  const { messages, sendMessage, regenerate, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onError: (error) => {
      console.error('useChat error:', error);
    },
    onFinish: (message) => {
      console.log('useChat onFinish:', message);
    },
  });

  // Minimal, safe hydration: when a conversation loads and chat is idle,
  // seed useChat only if it currently has no messages.
  useEffect(() => {
    const id = currentConversationId;
    if (!id) return;
    if (status !== 'ready') return;
    if (!dbMessages || dbMessages.length === 0) return;
    if (messages.length > 0) return;

    setMessages(convertDbMessagesToUIMessages(dbMessages));
  }, [currentConversationId, dbMessages, messages.length, setMessages, status]);

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
            searchMode={searchMode}
            onToggleSearch={toggleSearch}
          />
        </div>
      ) : (
        <div className='flex flex-col h-full'>
          <div className='flex-1 overflow-y-auto'>
            <Conversation
              messages={messages}
              status={status}
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
