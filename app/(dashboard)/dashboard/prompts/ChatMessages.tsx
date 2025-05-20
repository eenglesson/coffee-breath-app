import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@radix-ui/react-tooltip';
import { CheckIcon, Copy, RefreshCcw } from 'lucide-react';

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
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatMessages({
  messages,
  onRedo,
  messagesEndRef,
}: ChatMessagesProps) {
  return (
    <div className='flex-1 overflow-y-auto max-w-4xl space-y-4'>
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} onRedo={onRedo} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

function Message({
  message,
  onRedo,
}: {
  message: Message;
  onRedo?: (userMessageId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.type === 'user';
  const isComplete = message.isComplete;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-center'}`}>
      <CardContent
        className={`w-full p-3  ${
          isUser ? 'max-w-[70%]' : 'border-none shadow-none'
        }`}
      >
        {isUser ? (
          <>
            <p className='bg-primary/95 p-3 text-white rounded-t-xl rounded-bl-xl rounded-br-xs '>
              {message.content}
            </p>
            <div className='flex justify-end gap-2 mt-2'>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-muted-foreground hover:primary rounded-full'
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1000);
                    }}
                    aria-label='Copy message'
                  >
                    {copied ? (
                      <CheckIcon className='text-foreground' />
                    ) : (
                      <Copy style={{ transform: 'scaleX(-1)' }} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side='bottom'
                  sideOffset={4}
                  className='bg-accent px-3 py-1 text-sm rounded-full'
                >
                  <p>Copy</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: message.content }} />
        )}
        {!isUser && isComplete && (
          <CardFooter className='mt-2 p-0 flex gap-1 mb-8'>
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  variant='ghost'
                  className='text-muted-foreground hover:primary rounded-full'
                  onClick={() =>
                    onRedo &&
                    message.userMessageId &&
                    onRedo(message.userMessageId)
                  }
                  aria-label='Regenerate response'
                >
                  <RefreshCcw />
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
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  variant='ghost'
                  className='text-muted-foreground hover:primary rounded-full'
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1000);
                  }}
                  aria-label='Copy message'
                >
                  {copied ? (
                    <CheckIcon className='text-foreground' />
                  ) : (
                    <Copy style={{ transform: 'scaleX(-1)' }} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side='bottom'
                sideOffset={4}
                className='bg-accent px-3 py-1 text-sm rounded-full'
              >
                <p>Copy</p>
              </TooltipContent>
            </Tooltip>
          </CardFooter>
        )}
      </CardContent>
    </div>
  );
}
