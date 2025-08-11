// filename: chat-preview-panel.tsx

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { MessageContent } from '@/components/prompt-kit/message';
import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockGroup,
} from '@/components/prompt-kit/code-block';
import Image from 'next/image';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'teacher' | 'ai';
  created_at: string;
}

type ChatPreviewPanelProps = {
  conversationId: string | null;
  onHover?: (isHovering: boolean) => void;
  messages?: ChatMessage[];
  isLoading?: boolean;
  error?: string | null;
  onFetchPreview?: (conversationId: string) => Promise<void>;
};

function MessageBubble({
  content,
  role,
}: {
  content: string;
  role: 'user' | 'assistant' | 'teacher' | 'ai';
}) {
  const isUser = role === 'user' || role === 'teacher';

  if (isUser) {
    return (
      <div className='flex justify-end'>
        <div className='max-w-[70%]'>
          <MessageContent
            className='bg-accent relative rounded-3xl px-5 py-2.5'
            markdown={true}
            components={{
              h1: ({ children }) => <p>{children}</p>,
              h2: ({ children }) => <p>{children}</p>,
              h3: ({ children }) => <p>{children}</p>,
              h4: ({ children }) => <p>{children}</p>,
              h5: ({ children }) => <p>{children}</p>,
              h6: ({ children }) => <p>{children}</p>,
              p: ({ children }) => <p>{children}</p>,
              li: ({ children }) => <p>- {children}</p>,
              ul: ({ children }) => <>{children}</>,
              ol: ({ children }) => <>{children}</>,
              code: ({ children }) => (
                <code className='bg-muted rounded px-1 text-xs'>
                  {children}
                </code>
              ),
              pre: ({ children }) => {
                let codeText = '';
                let language = 'plaintext';
                try {
                  const child = Array.isArray(children)
                    ? (children as unknown[])[0]
                    : (children as unknown);
                  if (
                    child &&
                    typeof child === 'object' &&
                    'props' in (child as Record<string, unknown>)
                  ) {
                    const props =
                      (
                        child as {
                          props?: { children?: unknown; className?: string };
                        }
                      ).props ?? {};
                    const raw = props.children as unknown;
                    if (typeof raw === 'string') codeText = raw;
                    else if (Array.isArray(raw))
                      codeText = (raw as unknown[]).join('');
                    else codeText = String(raw ?? '');
                    if (typeof props.className === 'string') {
                      const m = props.className.match(/language-(\w+)/);
                      if (m) language = m[1];
                    }
                  } else {
                    codeText =
                      typeof children === 'string'
                        ? children
                        : String(children ?? '');
                  }
                } catch {
                  codeText = String(children ?? '');
                }
                return (
                  <CodeBlock>
                    <CodeBlockGroup className='flex h-9 items-center justify-between px-4'>
                      <div className='text-muted-foreground py-1 pr-2 font-mono text-xs'>
                        {language}
                      </div>
                    </CodeBlockGroup>
                    <CodeBlockCode
                      className='text-xs'
                      code={codeText}
                      language={language}
                    />
                  </CodeBlock>
                );
              },
            }}
          >
            {content}
          </MessageContent>
        </div>
      </div>
    );
  }

  return (
    <div className='flex justify-start'>
      <div className='max-w-[400px]'>
        <MessageContent
          className='text-foreground bg-transparent p-0 text-sm'
          markdown={true}
          components={{
            h1: ({ children }) => (
              <div className='mb-1 text-base font-semibold dark:text-foreground'>
                {children}
              </div>
            ),
            h2: ({ children }) => (
              <div className='mb-1 text-sm font-medium dark:text-foreground'>
                {children}
              </div>
            ),
            h3: ({ children }) => (
              <div className='mb-1 text-sm font-medium dark:text-foreground'>
                {children}
              </div>
            ),
            h4: ({ children }) => (
              <div className='text-sm font-medium dark:text-foreground'>
                {children}
              </div>
            ),
            h5: ({ children }) => (
              <div className='text-sm font-medium dark:text-foreground  '>
                {children}
              </div>
            ),
            h6: ({ children }) => (
              <div className='text-sm font-medium dark:text-foreground'>
                {children}
              </div>
            ),
            strong: ({ children }) => (
              <strong className='font-bold dark:text-foreground'>
                {children}
              </strong>
            ),
            a: ({ href }) => (
              <a
                href={href ?? ''}
                target='_blank'
                rel='noopener noreferrer'
                className='bg-muted text-muted-foreground hover:bg-muted-foreground/30 hover:text-primary inline-flex h-5 max-w-32 items-center gap-1 overflow-hidden rounded-full py-0 pr-2 pl-1 text-xs leading-none overflow-ellipsis whitespace-nowrap no-underline transition-colors duration-150'
              >
                <Image
                  src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
                    href ?? ''
                  )}`}
                  alt={`${href} favicon`}
                  width={14}
                  height={14}
                  className='size-3.5 rounded-full align-text-bottom'
                  unoptimized
                />
                <span className='overflow-hidden font-normal text-ellipsis whitespace-nowrap leading-[1.2]'>
                  {href?.replace('www.', '')}
                </span>
              </a>
            ),
            p: ({ children }) => <div className='mb-1'>{children}</div>,
            li: ({ children }) => <div>• {children}</div>,
            ul: ({ children }) => <div className='space-y-0.5'>{children}</div>,
            ol: ({ children }) => <div className='space-y-0.5'>{children}</div>,
            code: ({ children }) => (
              <code className='bg-muted dark:bg-accent dark:text-accent-foreground/90 rounded px-1 text-xs'>
                {children}
              </code>
            ),
            pre: ({ children }) => {
              let codeText = '';
              let language = 'plaintext';
              try {
                const child = Array.isArray(children)
                  ? (children as unknown[])[0]
                  : (children as unknown);
                if (
                  child &&
                  typeof child === 'object' &&
                  'props' in (child as Record<string, unknown>)
                ) {
                  const props =
                    (
                      child as {
                        props?: { children?: unknown; className?: string };
                      }
                    ).props ?? {};
                  const raw = props.children as unknown;
                  if (typeof raw === 'string') codeText = raw;
                  else if (Array.isArray(raw))
                    codeText = (raw as unknown[]).join('');
                  else codeText = String(raw ?? '');
                  if (typeof props.className === 'string') {
                    const m = props.className.match(/language-(\w+)/);
                    if (m) language = m[1];
                  }
                } else {
                  codeText =
                    typeof children === 'string'
                      ? children
                      : String(children ?? '');
                }
              } catch {
                codeText = String(children ?? '');
              }
              return (
                <CodeBlock>
                  <CodeBlockGroup className='flex h-9 items-center justify-between px-4'>
                    <div className='text-muted-foreground py-1 pr-2 font-mono text-xs'>
                      {language}
                    </div>
                  </CodeBlockGroup>
                  <CodeBlockCode
                    className='text-xs'
                    code={codeText}
                    language={language}
                  />
                </CodeBlock>
              );
            },
          }}
        >
          {content}
        </MessageContent>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className='flex h-full items-center justify-center'>
      <div className='text-muted-foreground flex items-center gap-2'>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span className='text-sm'>Loading messages...</span>
      </div>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  const isNetworkError =
    error.includes('fetch') ||
    error.includes('network') ||
    error.includes('HTTP') ||
    error.includes('Failed to fetch');

  return (
    <div className='flex h-full items-center justify-center p-4'>
      <div className='text-muted-foreground max-w-[300px] space-y-3 text-center'>
        <div className='flex justify-center'>
          <AlertCircle className='text-muted-foreground/50 h-8 w-8' />
        </div>
        <div className='space-y-1'>
          <p className='text-sm font-medium'>Failed to load preview</p>
          <p className='text-xs break-words opacity-70'>{error}</p>
        </div>
        {isNetworkError && onRetry && (
          <Button
            variant='outline'
            size='sm'
            onClick={onRetry}
            className='h-8 text-xs'
          >
            <RefreshCw className='mr-1 h-3 w-3' />
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className='flex h-32 items-center justify-center p-4'>
      <p className='text-muted-foreground text-center text-sm'>
        No messages in this conversation yet
      </p>
    </div>
  );
}

function DefaultState() {
  return (
    <div className='flex h-full items-center justify-center p-4'>
      <div className='text-muted-foreground space-y-2 text-center'>
        <p className='text-sm opacity-60'>Select a conversation to preview</p>
      </div>
    </div>
  );
}

export function ChatPreviewPanel({
  conversationId,
  onHover,
  messages = [],
  isLoading = false,
  error = null,
  onFetchPreview,
}: ChatPreviewPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const handleRetry = () => {
    if (retryCount < maxRetries && conversationId && onFetchPreview) {
      setRetryCount((prev) => prev + 1);
      onFetchPreview(conversationId);
    }
  };

  // Immediately scroll to bottom when conversationId changes or messages load
  useLayoutEffect(() => {
    if (conversationId && messages.length > 0 && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [conversationId, messages.length]);

  return (
    <div
      className='bg-background col-span-3 border-l'
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      key={conversationId}
    >
      <div className='h-[480px]'>
        {!conversationId && <DefaultState />}
        {conversationId && isLoading && <LoadingState />}
        {conversationId && error && !isLoading && (
          <ErrorState
            error={error}
            onRetry={retryCount < maxRetries ? handleRetry : undefined}
          />
        )}
        {conversationId && !isLoading && !error && messages.length === 0 && (
          <EmptyState />
        )}
        {conversationId && !isLoading && !error && messages.length > 0 && (
          <ScrollArea ref={scrollAreaRef} className='h-full'>
            <div className='space-y-4 p-6'>
              <div className='flex justify-center'>
                <div className='text-muted-foreground bg-muted/50 rounded-full px-2 py-1 text-xs'>
                  Last {messages.length} messages
                </div>
              </div>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  content={message.content}
                  role={message.role}
                />
              ))}
            </div>
            <div ref={bottomRef} />
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
