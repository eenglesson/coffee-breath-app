// Updated 'Conversation' component to handle tool parts
'use client';

import {
  ChatContainerContent,
  ChatContainerRoot,
} from '@/components/prompt-kit/chat-container';
import { UIMessage as MessageType } from '@ai-sdk/react';
import { useRef } from 'react';
import { Message } from './message';

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
    <div className='relative flex h-full w-full flex-col overflow-x-hidden'>
      <ChatContainerRoot className='relative flex-1 h-full overflow-auto'>
        <ChatContainerContent
          className='flex w-full flex-col justify-between pt-12 pb-4'
          style={{
            scrollbarGutter: 'stable both-edges',
            scrollbarWidth: 'none',
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
        </ChatContainerContent>
        {/* <div className='absolute bottom-4 right-4 z-50'>
          <ScrollButton />
        </div> */}
      </ChatContainerRoot>
    </div>
  );
}
