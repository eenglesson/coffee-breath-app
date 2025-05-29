import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@radix-ui/react-tooltip';
import { CheckIcon, Copy, RefreshCcw } from 'lucide-react';
import { MessageContent } from '@/components/prompt-kit/message';
import { cn } from '@/lib/utils';

export type Message = {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  userMessageId?: string;
  isComplete: boolean;
};

interface ChatMessagesProps {
  messages: Message[];
  onRedo: (userMessageId: string) => void;
}

export default function ChatMessages({ messages, onRedo }: ChatMessagesProps) {
  return (
    <div className='flex-1 overflow-y-auto max-w-4xl mx-auto'>
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} onRedo={onRedo} />
      ))}
      <div />
    </div>
  );
}

function Message({
  message,
  onRedo,
}: {
  message: Message;
  onRedo: (userMessageId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.type === 'user';
  const isComplete = message.isComplete;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <CardContent
        className={`p-4 rounded-lg ${
          isUser ? 'sm:max-w-[80%] text-white' : 'w-full'
        }`}
      >
        {isUser ? (
          <p className='text-base font-normal bg-accent text-foreground rounded-lg p-3'>
            {message.content}
          </p>
        ) : (
          <MessageContent
            className={cn(
              'prose dark:prose-invert relative min-w-full bg-transparent p-0',
              'prose-h1:scroll-m-20 prose-h1:text-2xl prose-h1:font-semibold prose-h2:mt-8 prose-h2:scroll-m-20 prose-h2:text-xl prose-h2:mb-3 prose-h2:font-medium prose-h3:scroll-m-20 prose-h3:text-base prose-h3:font-medium prose-h4:scroll-m-20 prose-h5:scroll-m-20 prose-h6:scroll-m-20 prose-strong:font-bold prose-table:block prose-table:overflow-y-auto'
            )}
            markdown={true}
          >
            {message.content}
          </MessageContent>
        )}
        <CardFooter
          className={`mt-2 p-0 flex gap-2 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          {!isUser && isComplete && (
            <>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-muted-foreground rounded-full'
                    onClick={() =>
                      message.userMessageId && onRedo(message.userMessageId)
                    }
                    aria-label='Regenerate response'
                  >
                    <RefreshCcw className='w-4 h-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side='bottom'
                  sideOffset={4}
                  className='bg-accent px-3 py-1 text-sm rounded-full'
                >
                  <p>Regenerate</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant='ghost'
                className='text-muted-foreground rounded-full'
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1000);
                }}
                aria-label='Copy message'
              >
                {copied ? (
                  <CheckIcon className='w-4 h-4 text-foreground' />
                ) : (
                  <Copy
                    className='w-4 h-4'
                    style={{ transform: 'scaleX(-1)' }}
                  />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side='bottom'
              sideOffset={4}
              className='bg-accent px-3 py-1 text-sm rounded-full'
            >
              <p>{copied ? 'Copied!' : 'Copy'}</p>
            </TooltipContent>
          </Tooltip>
        </CardFooter>
      </CardContent>
    </div>
  );
}
