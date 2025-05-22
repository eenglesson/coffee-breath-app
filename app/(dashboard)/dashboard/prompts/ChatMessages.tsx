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
    <h1 className='text-2xl font-bold text-foreground mt-4 mb-2' {...props} />
  ),
  h2: ({ ...props }) => (
    <h2
      className='text-xl font-semibold text-foreground mt-3 mb-2'
      {...props}
    />
  ),
  h3: ({ ...props }) => (
    <h3 className='text-lg font-medium text-foreground mt-2 mb-1' {...props} />
  ),
  p: ({ ...props }) => (
    <p className='text-foreground/80 my-2 leading-relaxed' {...props} />
  ),
  a: ({ ...props }) => (
    <a
      className='text-primary hover:text-primary/80 underline underline-offset-2'
      target='_blank'
      rel='noopener noreferrer'
      {...props}
    />
  ),
  ul: ({ ...props }) => (
    <ul className='list-disc pl-6 my-2 text-foreground/80' {...props} />
  ),
  ol: ({ ...props }) => (
    <ol className='list-decimal pl-6 my-2 text-foreground/80' {...props} />
  ),
  li: ({ ...props }) => <li className='my-1 text-foreground/80' {...props} />,
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
          className='bg-muted text-foreground/80 px-1 py-0.5 rounded font-mono text-sm'
          {...props}
        />
      );
    }

    // For block code, use Highlight.js with GitHub Dark theme
    return (
      <pre className='bg-muted text-foreground p-4 rounded-md my-2 font-mono text-sm overflow-x-auto'>
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
      className='border-l-4 border-primary bg-muted text-foreground/80 pl-4 py-2 my-2 italic'
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
