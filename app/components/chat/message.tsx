import { Markdown } from '@/components/prompt-kit/markdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Copy, Edit, RotateCcw, Trash2 } from 'lucide-react';

export type MessageProps = {
  id: string;
  children: React.ReactNode;
  attachments?: unknown[];
  isLast?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newText: string) => void;
  onReload?: () => void;
  hasScrollAnchor?: boolean;
  parts?: unknown[];
  status?: 'streaming' | 'ready' | 'submitted' | 'error';
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

const Message = ({
  id,
  children,
  isLast,
  onDelete,
  onEdit,
  onReload,
  hasScrollAnchor,
  className,
  ...props
}: MessageProps) => {
  const handleCopy = async () => {
    if (typeof children === 'string') {
      await navigator.clipboard.writeText(children);
    }
  };

  return (
    <div
      className={cn(
        'group min-h-scroll-anchor flex w-full max-w-3xl flex-col items-start gap-2 px-6 pb-2',
        className
      )}
      {...props}
    >
      <div className='flex gap-3 w-full'>
        <MessageAvatar
          src='/api/placeholder/32/32'
          alt='AI Assistant'
          fallback='AI'
        />
        <div className='flex-1 min-w-0'>
          <MessageContent markdown={true}>{children as string}</MessageContent>

          <MessageActions className='opacity-0 group-hover:opacity-100 transition-opacity mt-2'>
            <MessageAction tooltip='Copy message'>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleCopy}
                className='h-6 w-6 p-0'
              >
                <Copy className='h-3 w-3' />
              </Button>
            </MessageAction>

            {onEdit && (
              <MessageAction tooltip='Edit message'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() =>
                    onEdit(id, typeof children === 'string' ? children : '')
                  }
                  className='h-6 w-6 p-0'
                >
                  <Edit className='h-3 w-3' />
                </Button>
              </MessageAction>
            )}

            {onReload && isLast && (
              <MessageAction tooltip='Regenerate response'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={onReload}
                  className='h-6 w-6 p-0'
                >
                  <RotateCcw className='h-3 w-3' />
                </Button>
              </MessageAction>
            )}

            {onDelete && (
              <MessageAction tooltip='Delete message'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => onDelete(id)}
                  className='h-6 w-6 p-0 hover:text-destructive'
                >
                  <Trash2 className='h-3 w-3' />
                </Button>
              </MessageAction>
            )}
          </MessageActions>
        </div>
      </div>

      {hasScrollAnchor && <div className='scroll-anchor' />}
    </div>
  );
};

export type MessageAvatarProps = {
  src: string;
  alt: string;
  fallback?: string;
  delayMs?: number;
  className?: string;
};

const MessageAvatar = ({
  src,
  alt,
  fallback,
  delayMs,
  className,
}: MessageAvatarProps) => {
  return (
    <Avatar className={cn('h-8 w-8 shrink-0', className)}>
      <AvatarImage src={src} alt={alt} />
      {fallback && (
        <AvatarFallback delayMs={delayMs}>{fallback}</AvatarFallback>
      )}
    </Avatar>
  );
};

export type MessageContentProps = {
  children: React.ReactNode;
  markdown?: boolean;
  className?: string;
} & React.ComponentProps<typeof Markdown> &
  React.HTMLProps<HTMLDivElement>;

const MessageContent = ({
  children,
  markdown = false,
  className,
  ...props
}: MessageContentProps) => {
  const classNames = cn(
    'rounded-lg p-2 text-foreground bg-secondary prose break-words whitespace-normal',
    className
  );

  return markdown ? (
    <Markdown className={classNames} {...props}>
      {children as string}
    </Markdown>
  ) : (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

export type MessageActionsProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

const MessageActions = ({
  children,
  className,
  ...props
}: MessageActionsProps) => (
  <div
    className={cn('text-muted-foreground flex items-center gap-2', className)}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionProps = {
  className?: string;
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
} & React.ComponentProps<typeof Tooltip>;

const MessageAction = ({
  tooltip,
  children,
  className,
  side = 'top',
  ...props
}: MessageActionProps) => {
  return (
    <TooltipProvider>
      <Tooltip {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className={className}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export {
  Message,
  MessageAvatar,
  MessageContent,
  MessageActions,
  MessageAction,
};
