'use client';
// Updated 'MessageAssistant' to handle potential Markdown in tool content
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from '@/components/prompt-kit/message';
import { Loader } from '@/components/prompt-kit/loader';
import { cn } from '@/lib/utils';
import type { UIMessage as MessageAISDK } from '@ai-sdk/react';
import { Check, ClipboardPen, CopyIcon, RefreshCcw } from 'lucide-react';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/prompt-kit/reasoning';
import { Button } from '@/components/ui/button';

type MessageAssistantProps = {
  children: string;
  isLast?: boolean;
  hasScrollAnchor?: boolean;
  copied?: boolean;
  copyToClipboard?: () => void;
  onReload?: () => void;
  parts?: MessageAISDK['parts'];
  status?: 'streaming' | 'ready' | 'submitted' | 'error';
  className?: string;
  messageId: string;
  onQuote?: (text: string, messageId: string) => void;
  metadata?: MessageAISDK['metadata'];
};

export function MessageAssistant({
  children,
  isLast,
  hasScrollAnchor,
  copied,
  copyToClipboard,
  onReload,
  status,
  className,
  parts,
  metadata,
}: MessageAssistantProps) {
  const contentNullOrEmpty = children === null || children === '';
  const isLastStreaming = status === 'streaming' && isLast;
  const reasoningParts = parts?.find((part) => part.type === 'reasoning');
  const hasReasoning =
    reasoningParts && reasoningParts.text && reasoningParts.text.trim() !== '';
  const shouldShowInlineLoader =
    isLastStreaming && contentNullOrEmpty && !hasReasoning;

  // Format metadata.totalTime (ms) -> "Xs"
  // const totalTimeLabel = (() => {
  //   if (metadata && typeof metadata === 'object' && 'totalTime' in metadata) {
  //     const ms = Number((metadata as Record<string, unknown>).totalTime);
  //     if (Number.isFinite(ms)) return `${(ms / 1000).toFixed(1)}s`;
  //   }
  //   return null;
  // })();

  const thoughtDoneLabel = (() => {
    if (metadata && typeof metadata === 'object' && 'totalTime' in metadata) {
      const ms = Number((metadata as Record<string, unknown>).totalTime);
      if (Number.isFinite(ms)) {
        const secs = Math.max(0, Math.round(ms / 1000));
        return `Thought for ${secs}s`;
      }
    }
    return 'Thought';
  })();

  return (
    <Message
      className={cn(
        'group flex w-full max-w-3xl flex-1 items-start gap-4 px-2 sm:px-4 pb-4',
        hasScrollAnchor && 'min-h-scroll-anchor',
        className
      )}
    >
      <div
        className={cn(
          'relative flex min-w-full flex-col gap-2',
          isLast && 'pb-8'
        )}
      >
        {reasoningParts && reasoningParts.text ? (
          <Reasoning
            isStreaming={status === 'streaming'}
            autoOpen={isLast && status === 'streaming'}
            reasoningStreaming={
              status === 'streaming' && !!hasReasoning && contentNullOrEmpty
            }
          >
            <ReasoningTrigger className='text-muted-foreground'>
              {status === 'streaming' ? (
                'Thinking'
              ) : (
                <span className='inline-flex items-center gap-1.5 text-muted-foreground'>
                  {thoughtDoneLabel}
                </span>
              )}
            </ReasoningTrigger>
            <ReasoningContent markdown>{reasoningParts.text}</ReasoningContent>
          </Reasoning>
        ) : null}
        {contentNullOrEmpty && shouldShowInlineLoader ? (
          <div className='prose dark:prose-invert relative min-w-full bg-transparent p-0'>
            <Loader className='justify-start' />
          </div>
        ) : contentNullOrEmpty ? null : (
          <MessageContent
            className={cn(
              'prose dark:prose-invert relative min-w-full bg-transparent p-0',
              'prose-h1:scroll-m-20 prose-h1:text-2xl prose-h1:font-semibold prose-h2:mt-8 prose-h2:scroll-m-20 prose-h2:text-xl prose-h2:mb-3 prose-h2:font-medium prose-h3:scroll-m-20 prose-h3:text-base prose-h3:font-medium prose-h4:scroll-m-20 prose-h5:scroll-m-20 prose-h6:scroll-m-20 prose-strong:font-medium prose-table:block prose-table:overflow-y-auto'
            )}
            markdown={true}
          >
            {children}
          </MessageContent>
        )}
        {Boolean(isLastStreaming || contentNullOrEmpty) ? null : (
          <MessageActions
            className={cn(
              '-ml-2 flex gap-0 transition-opacity duration-150',
              isLast
                ? 'opacity-100'
                : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            )}
          >
            <MessageAction
              tooltip={copied ? 'Copied!' : 'Copy text'}
              side='bottom'
            >
              <Button
                className='hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition'
                aria-label='Copy text'
                onClick={copyToClipboard}
                type='button'
                variant='ghost'
              >
                {copied ? (
                  <Check className='size-4' />
                ) : (
                  <CopyIcon className='size-4' />
                )}
              </Button>
            </MessageAction>
            <MessageAction
              tooltip='Open in text editor (copies content)'
              side='bottom'
              delayDuration={0}
            >
              <Button
                variant='ghost'
                size='icon'
                className='rounded-full size-7.5'
              >
                <ClipboardPen className='size-4' />
              </Button>
            </MessageAction>
            {isLast ? (
              <MessageAction
                tooltip='Regenerate'
                side='bottom'
                delayDuration={0}
              >
                <Button
                  className='hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition'
                  aria-label='Regenerate'
                  onClick={onReload}
                  type='button'
                  variant='ghost'
                >
                  <RefreshCcw className='size-4' />
                </Button>
              </MessageAction>
            ) : null}
            {/* {totalTimeLabel ? (
              <MessageAction
                tooltip='Response time'
                side='bottom'
                delayDuration={0}
              >
                <button
                  className='flex size-7.5 ml-0.5 hover:bg-transparent items-center justify-center rounded-full bg-transparent transition'
                  aria-label='Response time'
                  type='button'
                >
                  <span className='text-xs font-medium'>{totalTimeLabel}</span>
                </button>
              </MessageAction>
            ) : null} */}
          </MessageActions>
        )}
        {/* {isQuoteEnabled && selectionInfo && selectionInfo.messageId && (
          <QuoteButton
            mousePosition={selectionInfo.position}
            onQuote={handleQuoteBtnClick}
            messageContainerRef={messageRef}
            onDismiss={clearSelection}
          />
        )} */}
      </div>
    </Message>
  );
}
