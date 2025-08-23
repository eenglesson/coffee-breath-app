'use client';

import { useKeyShortcut } from '@/app/hooks/use-key-shortcut';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ConversationWithPreview } from '@/lib/types/chat';
import { useConversationSession } from '@/lib/context';
import { cn } from '@/lib/utils';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { CommandFooter } from './command-footer';
import { formatDate, groupConversationsByDate } from './utils';
import { ChatPreviewPanel } from './chat-preview-panel';
import { useChatPreview } from '@/lib/hooks/use-chat-preview';

type CommandHistoryProps = {
  conversationHistory: ConversationWithPreview[];
  onSaveEdit: (id: string, newTitle: string) => Promise<void>;
  onConfirmDelete: (id: string) => Promise<void>;
  trigger: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void;
  hasPopover?: boolean;
  showPreview?: boolean;
};

type CommandItemEditProps = {
  conversation: ConversationWithPreview;
  editTitle: string;
  setEditTitle: (title: string) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
};

type CommandItemDeleteProps = {
  conversation: ConversationWithPreview;
  onConfirm: (id: string) => void;
  onCancel: () => void;
};

type CommandItemRowProps = {
  conversation: ConversationWithPreview;
  onEdit: (conversation: ConversationWithPreview) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  deletingId: string | null;
};

// Component for editing a chat item
function CommandItemEdit({
  conversation,
  editTitle,
  setEditTitle,
  onSave,
  onCancel,
}: CommandItemEditProps) {
  return (
    <form
      className='flex w-full items-center justify-between'
      onSubmit={(e) => {
        e.preventDefault();
        onSave(conversation.id);
      }}
    >
      <Input
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        className='border-input h-8 flex-1 rounded border bg-transparent px-3 py-1 text-sm'
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSave(conversation.id);
          }
        }}
      />
      <div className='ml-2 flex gap-1'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              variant='ghost'
              className='group/edit-confirm text-muted-foreground hover:bg-primary/10 size-8 transition-colors duration-150'
              type='submit'
              aria-label='Confirm'
            >
              <Check className='group-hover/edit-confirm:text-primary size-4 transition-colors duration-150' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Confirm</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              variant='ghost'
              className='group/edit-cancel text-muted-foreground hover:bg-primary/10 size-8 transition-colors duration-150'
              type='button'
              onClick={onCancel}
              aria-label='Cancel'
            >
              <X className='group-hover/edit-cancel:text-primary size-4 transition-colors duration-150' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancel</TooltipContent>
        </Tooltip>
      </div>
    </form>
  );
}

// Component for deleting a conversation item
function CommandItemDelete({
  conversation,
  onConfirm,
  onCancel,
}: CommandItemDeleteProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm(conversation.id);
      }}
      className='flex w-full items-center justify-between'
    >
      <div className='flex flex-1 items-center'>
        <span className='line-clamp-1 text-base font-normal'>
          {conversation.title}
        </span>
        <input
          type='text'
          className='sr-only hidden'
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            } else if (e.key === 'Enter') {
              e.preventDefault();
              onConfirm(conversation.id);
            }
          }}
        />
      </div>
      <div className='ml-2 flex gap-1'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              variant='ghost'
              className='group/delete-confirm text-muted-foreground hover:text-destructive-foreground hover:bg-primary/10 size-8 transition-colors duration-150'
              type='submit'
              aria-label='Confirm'
            >
              <Check className='group-hover/delete-confirm:text-primary size-4 transition-colors duration-150' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Confirm</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              variant='ghost'
              className='group/delete-cancel text-muted-foreground hover:text-foreground hover:bg-primary/10 size-8 transition-colors duration-150'
              onClick={onCancel}
              type='button'
              aria-label='Cancel'
            >
              <X className='group-hover/delete-cancel:text-primary size-4 transition-colors duration-150' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancel</TooltipContent>
        </Tooltip>
      </div>
    </form>
  );
}

// Component for displaying a normal conversation row
function CommandItemRow({
  conversation,
  onEdit,
  onDelete,
  editingId,
  deletingId,
}: CommandItemRowProps) {
  const { conversationId } = useConversationSession();
  const isCurrentConversation = conversation.id === conversationId;

  return (
    <>
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <span className='line-clamp-1 text-base font-normal'>
          {conversation?.title || 'Untitled Conversation'}
        </span>
        {isCurrentConversation && <Badge variant='outline'>current</Badge>}
      </div>

      <div className='relative flex min-w-[140px] flex-shrink-0 items-center justify-end'>
        <div className='text-muted-foreground mr-2 text-xs transition-opacity duration-200 group-hover:opacity-0'>
          {formatDate(conversation.updated_at || conversation.created_at)}
        </div>

        <div className='absolute right-0 flex translate-x-1 gap-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant='ghost'
                className='group/edit text-muted-foreground hover:bg-primary/10 size-8 transition-colors duration-150'
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(conversation);
                }}
                disabled={!!editingId || !!deletingId}
                aria-label='Edit'
              >
                <Pencil className='group-hover/edit:text-primary size-4 transition-colors duration-150' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant='ghost'
                className='group/delete text-muted-foreground hover:text-destructive-foreground hover:bg-primary/10 size-8 transition-colors duration-150'
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conversation.id);
                }}
                disabled={!!editingId || !!deletingId}
                aria-label='Delete'
              >
                <Trash2 className='group-hover/delete:text-primary size-4 transition-colors duration-150' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}

type CustomCommandDialogProps = React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

// Custom CommandDialog with className support
function CustomCommandDialog({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  onOpenChange,
  open,
  ...props
}: CustomCommandDialogProps) {
  return (
    <Dialog {...props} onOpenChange={onOpenChange} open={open}>
      <DialogHeader className='sr-only'>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn('overflow-hidden border-none p-0', className)}
      >
        <Command className='[&_[cmdk-group-heading]]:text-muted-foreground border-none **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 [&_[cmdk-item]_svg]:border-none'>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function CommandHistory({
  conversationHistory,
  onSaveEdit,
  onConfirmDelete,
  trigger,
  isOpen,
  setIsOpen,
  onOpenChange,
  hasPopover = true,
  showPreview = true,
}: CommandHistoryProps) {
  const { conversationId } = useConversationSession();
  const router = useRouter();
  const hasPrefetchedRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [hoveredConversationId, setHoveredConversationId] = useState<
    string | null
  >(null);
  const [isPreviewPanelHovered, setIsPreviewPanelHovered] = useState(false);

  // Chat preview functionality
  const { messages, isLoading, error, fetchPreview, clearPreview } =
    useChatPreview();

  if (isOpen && !hasPrefetchedRef.current) {
    const recentConversations = conversationHistory.slice(0, 10);
    recentConversations.forEach((conversation) => {
      router.prefetch(`/dashboard/ai-chat/${conversation.id}`);
    });
    hasPrefetchedRef.current = true;
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);

    if (!open) {
      setSearchQuery('');
      setEditingId(null);
      setEditTitle('');
      setDeletingId(null);
      setSelectedConversationId(null);
      setHoveredConversationId(null);
      setIsPreviewPanelHovered(false);
      clearPreview();
      hasPrefetchedRef.current = false;
    }
  };

  useKeyShortcut(
    (e: KeyboardEvent) => e.key === 'k' && (e.metaKey || e.ctrlKey),
    () => handleOpenChange(!isOpen)
  );

  const handleConversationHover = useCallback(
    (conversationId: string | null) => {
      if (!showPreview) return;

      setHoveredConversationId(conversationId);

      // Fetch preview when hovering over a conversation
      if (conversationId) {
        fetchPreview(conversationId);
      }
    },
    [showPreview, fetchPreview]
  );

  const handlePreviewHover = useCallback(
    (isHovering: boolean) => {
      if (!showPreview) return;

      setIsPreviewPanelHovered(isHovering);

      // Only clear the hovered conversation if we're not hovering the preview panel
      // and there are already loaded messages
      if (!isHovering && !hoveredConversationId) {
        setHoveredConversationId(null);
      }
    },
    [showPreview, hoveredConversationId]
  );

  const handleEdit = useCallback((conversation: ConversationWithPreview) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title || '');
  }, []);

  const handleSaveEdit = useCallback(
    async (id: string) => {
      setEditingId(null);
      await onSaveEdit(id, editTitle);
    },
    [editTitle, onSaveEdit]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditTitle('');
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id);
  }, []);

  const handleConfirmDelete = useCallback(
    async (id: string) => {
      setDeletingId(null);
      await onConfirmDelete(id);

      // Clear preview and selection if the deleted conversation was being previewed
      if (hoveredConversationId === id || selectedConversationId === id) {
        setHoveredConversationId(null);
        setSelectedConversationId(null);
        clearPreview();
      }
    },
    [
      onConfirmDelete,
      hoveredConversationId,
      selectedConversationId,
      clearPreview,
    ]
  );

  const handleCancelDelete = useCallback(() => {
    setDeletingId(null);
  }, []);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return query
      ? conversationHistory.filter((conversation) =>
          (conversation.title || '').toLowerCase().includes(query)
        )
      : conversationHistory;
  }, [conversationHistory, searchQuery]);

  const groupedConversations = useMemo(
    () => groupConversationsByDate(conversationHistory, searchQuery),
    [conversationHistory, searchQuery]
  );

  const activePreviewConversationId =
    hoveredConversationId ||
    (isPreviewPanelHovered ? hoveredConversationId : null);

  // Auto-select first conversation when dialog opens
  useEffect(() => {
    if (
      isOpen &&
      showPreview &&
      !hoveredConversationId &&
      filteredConversations.length > 0
    ) {
      const firstConversation = searchQuery
        ? filteredConversations[0]
        : groupedConversations?.[0]?.conversations[0];

      if (firstConversation) {
        setHoveredConversationId(firstConversation.id);
        fetchPreview(firstConversation.id);
      }
    }
  }, [
    isOpen,
    showPreview,
    hoveredConversationId,
    filteredConversations,
    groupedConversations,
    searchQuery,
    fetchPreview,
  ]);

  const renderConversationItem = useCallback(
    (conversation: ConversationWithPreview) => {
      const isCurrentConversationSession = conversation.id === conversationId;
      const isCurrentConversationEditOrDelete =
        conversation.id === editingId || conversation.id === deletingId;
      const isEditOrDeleteMode = editingId || deletingId;
      const isSelected = conversation.id === selectedConversationId;

      return (
        <CommandItem
          key={conversation.id}
          onSelect={() => {
            if (showPreview) {
              setSelectedConversationId(conversation.id);
            }

            if (isCurrentConversationSession) {
              setIsOpen(false);
              return;
            }
            if (!editingId && !deletingId) {
              router.push(`/dashboard/ai-chat/${conversation.id}`);
              // Close the command history after navigating
              setIsOpen(false);
            }
          }}
          className={cn(
            'group group data-[selected=true]:bg-accent flex w-full items-center justify-between rounded-md',
            isCurrentConversationEditOrDelete ? '!py-2' : 'py-2',
            isCurrentConversationEditOrDelete &&
              'bg-accent data-[selected=true]:bg-accent',
            !isCurrentConversationEditOrDelete &&
              isEditOrDeleteMode &&
              'data-[selected=true]:bg-transparent',
            isSelected && showPreview && 'bg-accent/50'
          )}
          value={conversation.id}
          onMouseEnter={() => {
            handleConversationHover(conversation.id);
          }}
        >
          {editingId === conversation.id ? (
            <CommandItemEdit
              conversation={conversation}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          ) : deletingId === conversation.id ? (
            <CommandItemDelete
              conversation={conversation}
              onConfirm={handleConfirmDelete}
              onCancel={handleCancelDelete}
            />
          ) : (
            <CommandItemRow
              conversation={conversation}
              onEdit={handleEdit}
              onDelete={handleDelete}
              editingId={editingId}
              deletingId={deletingId}
            />
          )}
        </CommandItem>
      );
    },
    [
      conversationId,
      router,
      setIsOpen,
      editingId,
      deletingId,
      editTitle,
      selectedConversationId,
      showPreview,
      handleSaveEdit,
      handleCancelEdit,
      handleConfirmDelete,
      handleCancelDelete,
      handleEdit,
      handleDelete,
      handleConversationHover,
    ]
  );

  return (
    <>
      {hasPopover ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>History ⌘+K</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}

      <CustomCommandDialog
        onOpenChange={handleOpenChange}
        open={isOpen}
        title='Conversation History'
        description='Search through your past conversations'
        className={cn(showPreview ? 'sm:max-w-[900px]' : 'sm:max-w-3xl')}
      >
        <CommandInput
          placeholder='Search history...'
          value={searchQuery}
          onValueChange={(value) => setSearchQuery(value)}
        />

        <div className='grid grid-cols-5'>
          <div className={cn(showPreview ? 'col-span-2' : 'col-span-5')}>
            <CommandList
              className={cn(
                'max-h-[480px] min-h-[480px] flex-1 [&>[cmdk-list-sizer]]:space-y-6 [&>[cmdk-list-sizer]]:py-2'
              )}
            >
              {filteredConversations.length === 0 && (
                <CommandEmpty>No conversation history found.</CommandEmpty>
              )}

              {searchQuery ? (
                <CommandGroup className='p-1.5'>
                  {filteredConversations.map((conversation) =>
                    renderConversationItem(conversation)
                  )}
                </CommandGroup>
              ) : (
                groupedConversations?.map((group) => (
                  <CommandGroup
                    key={group.name}
                    heading={group.name}
                    className='space-y-0 px-1.5'
                  >
                    {group.conversations.map((conversation) =>
                      renderConversationItem(conversation)
                    )}
                  </CommandGroup>
                ))
              )}
            </CommandList>
          </div>

          {showPreview && (
            <ChatPreviewPanel
              conversationId={activePreviewConversationId}
              onHover={handlePreviewHover}
              messages={messages}
              isLoading={isLoading}
              error={error}
              onFetchPreview={fetchPreview}
            />
          )}
        </div>
        <CommandFooter />
      </CustomCommandDialog>
    </>
  );
}
