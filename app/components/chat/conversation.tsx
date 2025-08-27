// Updated 'Conversation' component to handle tool parts
'use client';

import {
  ChatContainerContent,
  ChatContainerRoot,
} from '@/components/prompt-kit/chat-container';
import { UIMessage as MessageType } from '@ai-sdk/react';
import { useRef } from 'react';
import { Message } from './message';
import { ScrollButton } from '@/components/prompt-kit/scroll-button';

type ConversationProps = {
  messages: MessageType[];
  status?: 'streaming' | 'ready' | 'submitted' | 'error';
  onEdit: (id: string, newText: string) => void;
  onReload: () => void;
  onQuote?: (text: string, messageId: string) => void;
};

export function Conversation({
  messages,
  status = 'ready',
  onEdit,
  onReload,
  onQuote,
}: ConversationProps) {
  const initialMessageCount = useRef(messages.length);

  if (!messages || messages.length === 0)
    return <div className='h-full w-full'></div>;

  return (
    <div className='relative flex w-full flex-col overflow-x-hidden '>
      <ChatContainerRoot className='relative flex-1 h-full overflow-auto'>
        <ChatContainerContent
          className='flex w-full flex-col justify-between pt-12 pb-24 max-w-3xl mx-auto px-2'
          style={{
            scrollbarGutter: 'stable both-edges',
            scrollbarWidth: 'none',
            scrollbarColor: 'transparent transparent',
          }}
        >
          {messages?.map((message, index) => {
            const isLast =
              index === messages.length - 1 && status !== 'submitted';
            const hasScrollAnchor =
              isLast && messages.length > initialMessageCount.current;

            // Extract text content from 'text' parts
            const textContent =
              message.parts
                ?.filter((part) => part.type === 'text')
                .map((part) => part.text)
                .join('\n') || '';

            // Only show the AI's reasoned answer (text parts)
            const fullContent = textContent;

            return (
              <Message
                key={message.id}
                id={message.id}
                variant={message.role}
                // attachments={message.experimental_attachments}
                isLast={isLast}
                onEdit={onEdit}
                onReload={onReload}
                hasScrollAnchor={hasScrollAnchor}
                parts={message.parts}
                status={status}
                onQuote={onQuote}
                metadata={message.metadata}
              >
                {fullContent}
              </Message>
            );
          })}

          <div className='sticky bottom-36 flex justify-end pr-4 z-50'>
            <ScrollButton />
          </div>
        </ChatContainerContent>
      </ChatContainerRoot>
    </div>
  );
}
