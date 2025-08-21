'use client';

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/prompt-kit/prompt-input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ArrowUp, GlobeIcon, MoreHorizontal, Paperclip } from 'lucide-react';
import type React from 'react';

export interface ChatInputProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  searchMode?: boolean;
  onToggleSearch?: () => void;
}

function ChatInput({
  value = '',
  onValueChange,
  onSubmit,
  isLoading = false,
  placeholder = 'Type your message...',
  disabled = false,
  className,
  searchMode = false,
  onToggleSearch,
}: ChatInputProps) {
  const handleSubmit = () => {
    if (!value.trim() || isLoading || disabled) return;
    onSubmit?.(value.trim());
  };

  return (
    <div className={`w-full ${className || ''} `}>
      <PromptInput
        isLoading={isLoading}
        value={value}
        onValueChange={onValueChange}
        onSubmit={handleSubmit}
        className='border-input backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs'
      >
        <div className='flex flex-col'>
          <PromptInputTextarea
            placeholder={placeholder}
            className='min-h-[44px] text-foreground pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base dark:bg-transparent'
            disabled={disabled}
          />

          <PromptInputActions className='mt-5 flex w-full items-center justify-between gap-2 px-3 pb-3'>
            <div className='flex items-center gap-2'>
              <PromptInputAction tooltip='Add attachment'>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-9 rounded-full'
                  disabled={disabled}
                >
                  <Paperclip size={18} />
                </Button>
              </PromptInputAction>

              <PromptInputAction
                tooltip={searchMode ? 'Web search enabled' : 'Search web'}
              >
                <Button
                  variant='outline'
                  className={cn(
                    'rounded-full',
                    searchMode &&
                      '!border-[#0091FF]/30  !text-[#0091FF] hover:!text-[#0091FF] !bg-[#0091FF]/10'
                  )}
                  onClick={onToggleSearch}
                >
                  <GlobeIcon className='size-4' />
                  Search
                </Button>
              </PromptInputAction>

              <PromptInputAction tooltip='More options'>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-9 rounded-full'
                  disabled={disabled}
                >
                  <MoreHorizontal size={18} />
                </Button>
              </PromptInputAction>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                size='icon'
                disabled={!value.trim() || isLoading || disabled}
                onClick={handleSubmit}
                className='size-9 rounded-full'
              >
                {!isLoading ? (
                  <ArrowUp size={18} />
                ) : (
                  <span className='size-3 rounded-xs bg-white animate-pulse' />
                )}
              </Button>
            </div>
          </PromptInputActions>
        </div>
      </PromptInput>
    </div>
  );
}

export { ChatInput };
