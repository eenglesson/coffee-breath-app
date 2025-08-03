'use client';

import React, { useState } from 'react';
import {
  ConversationSessionProvider,
  ConversationsProvider,
  MessagesProvider,
  useConversationSession,
  useMessages,
} from '@/lib/context';
import { useCreateConversation } from '@/lib/hooks/chat';
import { HistoryTrigger } from '@/app/components/history/history-trigger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Clock } from 'lucide-react';

// Example Chat Input Component
function ChatInput({ teacherId }: { teacherId: string }) {
  const { conversationId } = useConversationSession();
  const { addMessage, isAddingMessage } = useMessages();
  const createConversation = useCreateConversation();

  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsSubmitting(true);

    try {
      if (conversationId) {
        // Add message to existing conversation
        addMessage({
          conversation_id: conversationId,
          content: input,
          sender: 'user',
          metadata: null,
        });
      } else {
        // Create new conversation with first message
        await createConversation.mutateAsync({
          teacherId: teacherId,
          firstMessage: input,
          title: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
        });
      }

      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex gap-2'>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
        placeholder='Type your message... (Enter to send, Shift+Enter for new line)'
        disabled={isSubmitting || isAddingMessage}
        className='flex-1'
      />
      <Button
        onClick={handleSubmit}
        disabled={!input.trim() || isSubmitting || isAddingMessage}
        size='sm'
      >
        {isSubmitting || isAddingMessage ? (
          'Sending...'
        ) : (
          <>
            <Send className='mr-2 h-4 w-4' />
            Send
          </>
        )}
      </Button>
    </div>
  );
}

// Example Messages Display Component
function MessagesDisplay() {
  const { messages, isLoading } = useMessages();

  if (isLoading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div className='space-y-4'>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-lg p-4 ${
            message.sender === 'teacher'
              ? 'bg-blue-100 ml-auto max-w-xs'
              : 'bg-gray-100 mr-auto max-w-xs'
          }`}
        >
          <div className='text-sm font-medium'>
            {message.sender === 'teacher' ? 'You' : 'AI Assistant'}
          </div>
          <div className='mt-1'>{message.content}</div>
          <div className='text-xs text-gray-500 mt-2'>
            {new Date(message.created_at).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}

// Example implementation following the architecture pattern
export function ChatImplementationExample({
  teacherId,
}: {
  teacherId: string;
}) {
  return (
    <ConversationSessionProvider>
      <ConversationsProvider teacherId={teacherId}>
        <MessagesProvider>
          <div className='flex h-screen flex-col'>
            {/* Header with history trigger */}
            <div className='flex items-center justify-between border-b p-4'>
              <h1 className='text-xl font-semibold'>AI Chat Assistant</h1>
              <div className='flex items-center gap-2'>
                <HistoryTrigger
                  hasSidebar={false}
                  icon={<Clock className='h-4 w-4' />}
                  label='History'
                />
              </div>
            </div>

            {/* Main chat area */}
            <div className='flex flex-1 flex-col'>
              {/* Messages */}
              <div className='flex-1 overflow-y-auto p-4'>
                <MessagesDisplay />
              </div>

              {/* Input */}
              <div className='border-t p-4'>
                <ChatInput teacherId={teacherId} />
              </div>
            </div>
          </div>
        </MessagesProvider>
      </ConversationsProvider>
    </ConversationSessionProvider>
  );
}

export default ChatImplementationExample;
