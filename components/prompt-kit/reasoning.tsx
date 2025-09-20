'use client';

import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Markdown } from './markdown';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type ReasoningContextType = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isStreaming?: boolean;
};

const ReasoningContext = createContext<ReasoningContextType | undefined>(
  undefined
);

function useReasoningContext() {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error(
      'useReasoningContext must be used within a Reasoning provider'
    );
  }
  return context;
}

export type ReasoningProps = {
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isStreaming?: boolean;
  autoOpen?: boolean; // when true, auto-open on streaming start
  autoClose?: boolean; // when true, auto-close after streaming ends if auto-opened and not user-toggled
  reasoningStreaming?: boolean; // true only while the reasoning part is streaming
};
function Reasoning({
  children,
  className,
  open,
  onOpenChange,
  isStreaming,
  autoOpen = false,
  autoClose = true,
  reasoningStreaming,
}: ReasoningProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [wasAutoOpened, setWasAutoOpened] = useState(false);
  const userInteractedRef = useRef(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    userInteractedRef.current = true;
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  useEffect(() => {
    // Auto-open when reasoning begins streaming
    if (autoOpen && reasoningStreaming && !wasAutoOpened) {
      if (!isControlled) setInternalOpen(true);
      setWasAutoOpened(true);
    }
    // Auto-close when reasoning finishes streaming (not the entire message)
    if (
      autoClose &&
      wasAutoOpened &&
      reasoningStreaming === false &&
      !userInteractedRef.current
    ) {
      if (!isControlled) setInternalOpen(false);
      setWasAutoOpened(false);
    }
  }, [autoOpen, autoClose, reasoningStreaming, wasAutoOpened, isControlled]);

  return (
    <ReasoningContext.Provider
      value={{
        isOpen,
        onOpenChange: handleOpenChange,
        isStreaming,
      }}
    >
      <div className={className}>{children}</div>
    </ReasoningContext.Provider>
  );
}

export type ReasoningTriggerProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLButtonElement>;

function ReasoningTrigger({
  children,
  className,
  ...props
}: ReasoningTriggerProps) {
  const { isOpen, onOpenChange, isStreaming } = useReasoningContext();

  return (
    <button
      type='button'
      className={cn(
        'group/trigger flex cursor-pointer items-center gap-2',
        className
      )}
      onClick={() => onOpenChange(!isOpen)}
      {...props}
    >
      <span className='relative inline-flex h-4 w-4 items-center justify-center'>
        {/* Chevron: visible while streaming; when not streaming, visible on hover and hidden otherwise */}
        <ChevronDownIcon
          className={cn(
            'absolute left-0 top-0 size-4 transition duration-150 ease-out',
            isOpen ? 'rotate-180' : '',
            isStreaming
              ? 'opacity-100'
              : 'opacity-0 group-hover/trigger:opacity-100'
          )}
        />
        {/* Lightbulb: default when not streaming; hidden on hover or when streaming */}
        <svg
          width='18'
          height='18'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className={cn(
            'size-4 transition-opacity duration-150 ease-out',
            isStreaming
              ? 'opacity-0'
              : 'opacity-100 group-hover/trigger:opacity-0'
          )}
        >
          <path
            d='M19 9C19 12.866 15.866 17 12 17C8.13398 17 4.99997 12.866 4.99997 9C4.99997 5.13401 8.13398 3 12 3C15.866 3 19 5.13401 19 9Z'
            className='fill-yellow-100 dark:fill-yellow-300 origin-center transition-[transform,opacity] duration-100 scale-0 opacity-0'
          ></path>
          <path
            d='M15 16.1378L14.487 15.2794L14 15.5705V16.1378H15ZM8.99997 16.1378H9.99997V15.5705L9.51293 15.2794L8.99997 16.1378ZM18 9C18 11.4496 16.5421 14.0513 14.487 15.2794L15.5129 16.9963C18.1877 15.3979 20 12.1352 20 9H18ZM12 4C13.7598 4 15.2728 4.48657 16.3238 5.33011C17.3509 6.15455 18 7.36618 18 9H20C20 6.76783 19.082 4.97946 17.5757 3.77039C16.0931 2.58044 14.1061 2 12 2V4ZM5.99997 9C5.99997 7.36618 6.64903 6.15455 7.67617 5.33011C8.72714 4.48657 10.2401 4 12 4V2C9.89382 2 7.90681 2.58044 6.42427 3.77039C4.91791 4.97946 3.99997 6.76783 3.99997 9H5.99997ZM9.51293 15.2794C7.4578 14.0513 5.99997 11.4496 5.99997 9H3.99997C3.99997 12.1352 5.81225 15.3979 8.48701 16.9963L9.51293 15.2794ZM9.99997 19.5001V16.1378H7.99997V19.5001H9.99997ZM10.5 20.0001C10.2238 20.0001 9.99997 19.7763 9.99997 19.5001H7.99997C7.99997 20.8808 9.11926 22.0001 10.5 22.0001V20.0001ZM13.5 20.0001H10.5V22.0001H13.5V20.0001ZM14 19.5001C14 19.7763 13.7761 20.0001 13.5 20.0001V22.0001C14.8807 22.0001 16 20.8808 16 19.5001H14ZM14 16.1378V19.5001H16V16.1378H14Z'
            fill='currentColor'
          ></path>
          <path d='M9 16.0001H15' stroke='currentColor'></path>
          <path
            d='M12 16V12'
            stroke='currentColor'
            strokeLinecap='square'
          ></path>
          <g>
            <path
              d='M20 7L19 8'
              stroke='currentColor'
              strokeLinecap='round'
              className='transition-[transform,opacity] duration-100 ease-in-out translate-x-0 translate-y-0 opacity-0'
            ></path>
            <path
              d='M20 9L19 8'
              stroke='currentColor'
              strokeLinecap='round'
              className='transition-[transform,opacity] duration-100 ease-in-out translate-x-0 translate-y-0 opacity-0'
            ></path>
            <path
              d='M4 7L5 8'
              stroke='currentColor'
              strokeLinecap='round'
              className='transition-[transform,opacity] duration-100 ease-in-out translate-x-0 translate-y-0 opacity-0'
            ></path>
            <path
              d='M4 9L5 8'
              stroke='currentColor'
              strokeLinecap='round'
              className='transition-[transform,opacity] duration-100 ease-in-out translate-x-0 translate-y-0 opacity-0'
            ></path>
          </g>
        </svg>
      </span>
      <span className='text-foreground'>{children}</span>
    </button>
  );
}

export type ReasoningContentProps = {
  children: React.ReactNode;
  className?: string;
  markdown?: boolean;
  contentClassName?: string;
  maxOpenHeight?: number; // fixed height (px) when open for scrollability
} & React.HTMLAttributes<HTMLDivElement>;

function ReasoningContent({
  children,
  className,
  contentClassName,
  markdown = false,
  maxOpenHeight = 140,
  ...props
}: ReasoningContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isOpen } = useReasoningContext();

  // Update open/closed height smoothly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.maxHeight = isOpen ? `${maxOpenHeight}px` : '0px';
  }, [isOpen, maxOpenHeight]);

  const rendered = markdown ? (
    <Markdown>{children as string}</Markdown>
  ) : (
    <>{children}</>
  );

  // Auto-scroll expanded ScrollArea to bottom when content changes
  useEffect(() => {
    if (!isOpen) return;
    const viewport = containerRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLDivElement | null;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [isOpen, children]);

  return (
    <div className={cn('w-full', className)} {...props}>
      {/* Collapsed preview (small, bottom-aligned, newest visible) */}

      {/* Expanded card with internal scroll */}
      <div
        ref={containerRef}
        className={cn(
          'overflow-hidden transition-[max-height] duration-150 ease-out',
          isOpen ? 'mt-2' : ''
        )}
        style={{ maxHeight: '0px' }}
      >
        {isOpen ? (
          <div style={{ height: `${maxOpenHeight}px` }} className='w-full '>
            <Card className='h-full w-full overflow-hidden rounded-lg py-0 shadow-none'>
              <CardContent
                className={cn('h-full w-full p-0', contentClassName)}
              >
                <ScrollArea className='h-full w-full bg-transparent'>
                  <div className='prose prose-sm dark:prose-invert w-full px-3 py-3 pr-5 text-accent-foreground'>
                    {rendered}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { Reasoning, ReasoningTrigger, ReasoningContent };
