'use client';
import ChatBotTextArea from './ChatBotTextArea';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import ChatMessages, { Message } from './ChatMessages';
import { createConversation } from '@/app/actions/conversations/conversations';
import { Database } from '@/database.types';

type DbMessage = Database['public']['Tables']['ai_messages']['Row'];

interface ChatProps {
  conversationId?: string;
  initialMessages?: DbMessage[];
  onNewConversation?: (conversation: {
    id: string;
    title: string;
    created_at?: string;
    updated_at?: string;
  }) => void;
}

export default function Chat({
  conversationId: propConversationId,
  initialMessages = [],
  onNewConversation,
}: ChatProps) {
  const pathname = usePathname();
  const [selectedStudents, setSelectedStudents] = useState<
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sync internal conversationId state with prop changes
  useEffect(() => {
    setConversationId(propConversationId || null);
  }, [propConversationId]);

  // Convert DB messages to useChat format
  const initialChatMessages = initialMessages.map((msg) => ({
    id: msg.id, // No need to convert to string since it's already UUID string
    role: msg.sender as 'user' | 'assistant',
    content: msg.content,
  }));

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
  } = useChat({
    api: '/api/chat',
    body: { selectedStudents, conversationId },
    initialMessages: initialChatMessages,
  });

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Only scroll when new messages are added, not on every change
  const prevMessagesLength = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
      prevMessagesLength.current = messages.length;
    }
  }, [messages]);

  // Custom handleSubmit to handle URL updates and save to conversation
  const handleSubmit = async (
    e: React.FormEvent,
    options?: {
      body?: {
        selectedStudents: {
          id: string;
          interests: string | null;
          learning_difficulties: string | null;
          school_year: string | null;
        }[];
      };
    }
  ) => {
    if (options?.body?.selectedStudents) {
      setSelectedStudents(options.body.selectedStudents);
    }

    // Check if we're on create-questions page and this is the first message
    const isCreateQuestionsPage = pathname === '/dashboard/create-questions';
    const isFirstMessage = messages.length === 0 && input.trim();

    if (isCreateQuestionsPage && isFirstMessage && !conversationId) {
      try {
        // Create conversation (without first message)
        const conversation = await createConversation(
          'Create Questions Session'
        );
        const newConversationId = conversation.id;

        // Update URL without page reload using history API
        window.history.replaceState(
          {},
          '',
          `/dashboard/create-questions/${newConversationId}`
        );
        setConversationId(newConversationId);

        // Notify parent component about new conversation
        if (onNewConversation) {
          onNewConversation({
            id: conversation.id,
            title: conversation.title || 'Create Questions Session',
            created_at: conversation.created_at || undefined,
            updated_at: conversation.updated_at || undefined,
          });
        }

        // Now submit to AI with the conversation ID
        originalHandleSubmit(e, {
          body: {
            selectedStudents: options?.body?.selectedStudents || [],
            conversationId: newConversationId,
          },
        });
        return;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        // Fall back to normal chat
      }
    }

    // Normal chat submission - include conversationId if we have one
    originalHandleSubmit(e, {
      body: {
        selectedStudents: options?.body?.selectedStudents || [],
        conversationId: conversationId,
      },
    });
  };

  // Map AI SDK messages to ChatMessages' Message type
  const formattedMessages: Message[] = messages.map((msg, index) => ({
    id: msg.id,
    type: msg.role as 'user' | 'assistant',
    content: msg.content,
    userMessageId:
      msg.role === 'assistant' && index > 0
        ? messages[index - 1]?.id
        : undefined,
    isComplete: true,
  }));

  return (
    <section className='w-full max-w-5xl h-full flex flex-col'>
      {messages.length === 0 ? (
        <div className='flex flex-col items-center justify-center h-full'>
          <ChatBotTextArea
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
          />
        </div>
      ) : (
        <div className='flex flex-col h-full'>
          <div ref={chatContainerRef} className='flex-1 overflow-y-auto pb-4'>
            <ChatMessages messages={formattedMessages} />
            <div ref={messagesEndRef} />
          </div>
          <div className='sticky bottom-4'>
            <ChatBotTextArea
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}
    </section>
  );
}
