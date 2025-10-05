'use client';

import {
  MessageAction,
  MessageActions,
  Message as MessageContainer,
  MessageContent,
} from '@/components/prompt-kit/message';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
// import { Message as MessageType } from '@ai-sdk/react';
import { Check, CopyIcon } from 'lucide-react';
import { useRef, useState } from 'react';

export type MessageUserProps = {
  hasScrollAnchor?: boolean;
  // attachments?: MessageType['experimental_attachments'];
  children: string;
  copied: boolean;
  copyToClipboard: () => void;
  onEdit: (id: string, newText: string) => void;
  onReload: () => void;
  id: string;
  className?: string;
};

export function MessageUser({
  hasScrollAnchor,

  children,
  copied,
  copyToClipboard,
  onEdit,
  onReload,
  id,
  className,
}: MessageUserProps) {
  const [editInput, setEditInput] = useState(children);
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditInput(children);
  };

  const handleSave = () => {
    if (onEdit) {
      onEdit(id, editInput);
    }
    onReload();
    setIsEditing(false);
  };

  return (
    <MessageContainer
      className={cn(
        'group flex w-full max-w-3xl flex-col items-end gap-0.5 sm:px-4 px-2 pb-4',
        hasScrollAnchor && 'min-h-scroll-anchor',
        className
      )}
    >
      {isEditing ? (
        <div
          className='bg-accent relative flex min-w-[180px] flex-col gap-2 rounded-3xl px-5 py-2.5'
          style={{
            width: contentRef.current?.offsetWidth,
          }}
        >
          <textarea
            className='w-full resize-none bg-transparent outline-none'
            value={editInput}
            onChange={(e) => setEditInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
              if (e.key === 'Escape') {
                handleEditCancel();
              }
            }}
            autoFocus
          />
          <div className='flex justify-end gap-2'>
            <Button size='sm' variant='ghost' onClick={handleEditCancel}>
              Cancel
            </Button>
            <Button size='sm' onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <MessageContent
          className='bg-accent relative max-w-[70%] rounded-3xl rounded-br-md px-5 py-2.5'
          markdown={true}
          ref={contentRef}
          components={{
            code: ({ children }) => <>{children}</>,
            pre: ({ children }) => <>{children}</>,
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
          }}
        >
          {children}
        </MessageContent>
      )}
      <MessageActions className='flex gap-0 sm:opacity-0 transition-opacity duration-0 opacity-100 sm:group-hover:opacity-100'>
        <MessageAction tooltip={copied ? 'Copied!' : 'Copy text'} side='bottom'>
          <button
            className='hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition'
            aria-label='Copy text'
            onClick={copyToClipboard}
            type='button'
          >
            <span className='relative flex items-center justify-center'>
              <CopyIcon
                className={cn(
                  'size-4 transition-all duration-150 ease-out',
                  copied ? 'opacity-0 blur-[2px]' : 'opacity-100 blur-0'
                )}
              />
              <Check
                className={cn(
                  'size-4 absolute transition-all duration-150 ease-out',
                  copied ? 'opacity-100 blur-0' : 'opacity-0 blur-[2px]'
                )}
              />
            </span>
          </button>
        </MessageAction>
        {/* @todo: add when ready */}
        {/* <MessageAction
          tooltip={isEditing ? "Save" : "Edit"}
          side="bottom"
          delayDuration={0}
        >
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition"
            aria-label="Edit"
            onClick={() => setIsEditing(!isEditing)}
            type="button"
          >
            <PencilSimple className="size-4" />
          </button>
        </MessageAction> */}
        {/* <MessageAction tooltip='Delete' side='bottom'>
          <button
            className='hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition'
            aria-label='Delete'
            onClick={() => {}}
            type='button'
          >
            <Trash className='size-4' />
          </button>
        </MessageAction> */}
      </MessageActions>
    </MessageContainer>
  );
}
