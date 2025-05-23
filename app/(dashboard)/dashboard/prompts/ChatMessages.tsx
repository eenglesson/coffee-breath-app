import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@radix-ui/react-tooltip';
import { CheckIcon, Copy, RefreshCcw } from 'lucide-react';
import ReactMarkdown, { Components } from 'react-markdown';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

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

const markdownComponents: Components = {
  h1: ({ ...props }) => (
    <h1 className='text-3xl font-bold text-foreground mt-6 mb-3' {...props} />
  ),
  h2: ({ ...props }) => (
    <h2
      className='text-2xl font-semibold text-foreground mt-5 mb-3 border-b border-foreground/20 pb-1'
      {...props}
    />
  ),
  h3: ({ ...props }) => (
    <h3 className='text-2xl font-medium text-foreground mt-4 mb-2' {...props} />
  ),
  p: ({ ...props }) => (
    <p
      className='text-foreground text-base font-medium my-3 leading-relaxed'
      {...props}
    />
  ),
  a: ({ ...props }) => (
    <a
      className='text-primary hover:text-green-600 underline underline-offset-4 font-medium'
      target='_blank'
      rel='noopener noreferrer'
      {...props}
    />
  ),
  ul: ({ ...props }) => (
    <ul className='list-disc pl-8 my-3 text-muted ' {...props} />
  ),
  ol: ({ ...props }) => (
    <ol className='list-decimal pl-8 my-3 text-muted font-medium' {...props} />
  ),
  li: ({ ...props }) => (
    <li className='my-2 text-card-foreground text-base' {...props} />
  ),
  code: ({
    inline,
    className,
    ...props
  }: {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
  }) => {
    const language = className?.replace('language-', '') || 'text';

    if (inline) {
      return (
        <code
          className='bg-muted text-foreground px-1.5 py-0.5 rounded-md font-mono text-sm font-medium'
          {...props}
        />
      );
    }

    return (
      <pre className='bg-muted text-foreground p-4 rounded-lg my-3 font-mono text-sm overflow-x-auto'>
        <code
          className={`language-${language}`}
          dangerouslySetInnerHTML={{
            __html: hljs.highlight(props.children as string, { language })
              .value,
          }}
        />
      </pre>
    );
  },
  blockquote: ({ ...props }) => (
    <blockquote
      className='border-l-4 border-primary bg-muted/50 text-foreground pl-4 py-3 my-3 font-medium'
      {...props}
    />
  ),
};

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
          <div className='prose max-w-none'>
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
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
