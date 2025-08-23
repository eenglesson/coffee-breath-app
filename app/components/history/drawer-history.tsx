import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ConversationWithPreview } from '@/lib/types/chat';
import { Check, Search, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
// import { useParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { formatDate, groupConversationsByDate } from './utils';

type DrawerHistoryProps = {
  conversationHistory: ConversationWithPreview[];
  onSaveEdit: (id: string, newTitle: string) => Promise<void>;
  onConfirmDelete: (id: string) => Promise<void>;
  trigger: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export function DrawerHistory({
  conversationHistory,
  onSaveEdit,
  onConfirmDelete,
  trigger,
  isOpen,
  setIsOpen,
}: DrawerHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // const params = useParams<{ chatId: string }>();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        setSearchQuery('');
        setEditingId(null);
        setEditTitle('');
        setDeletingId(null);
      }
    },
    [setIsOpen]
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
    },
    [onConfirmDelete]
  );

  const handleCancelDelete = useCallback(() => {
    setDeletingId(null);
  }, []);

  // Memoize filtered conversations to avoid recalculating on every render
  const filteredConversations = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let filtered = query
      ? conversationHistory.filter((conversation) =>
          (conversation.title || '').toLowerCase().includes(query)
        )
      : conversationHistory;

    // Always sort by updated_at descending (latest first)
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || '').getTime();
      const dateB = new Date(b.updated_at || b.created_at || '').getTime();
      return dateB - dateA;
    });

    return filtered;
  }, [conversationHistory, searchQuery]);

  // Group conversations by time periods - memoized to avoid recalculation
  const groupedConversations = useMemo(
    () => groupConversationsByDate(conversationHistory, searchQuery),
    [conversationHistory, searchQuery]
  );

  // Render conversation item
  const renderConversationItem = useCallback(
    (conversation: ConversationWithPreview) => (
      <div key={conversation.id}>
        <div className='space-y-1.5'>
          {editingId === conversation.id ? (
            <div className='bg-accent flex items-center justify-between rounded-lg px-2 py-2.5'>
              <form
                className='flex w-full items-center justify-between'
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveEdit(conversation.id);
                }}
              >
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className='h-8 flex-1'
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveEdit(conversation.id);
                    }
                  }}
                />
                <div className='ml-2 flex gap-1'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-8 w-8'
                    type='submit'
                  >
                    <Check className='size-4' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-8 w-8'
                    type='button'
                    onClick={handleCancelEdit}
                  >
                    <X className='size-4' />
                  </Button>
                </div>
              </form>
            </div>
          ) : deletingId === conversation.id ? (
            <div className='bg-accent flex items-center justify-between rounded-lg px-2 py-2.5'>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleConfirmDelete(conversation.id);
                }}
                className='flex w-full items-center justify-between'
              >
                <div className='flex flex-1 items-center'>
                  <span className='text-base font-normal'>
                    {conversation.title}
                  </span>
                  <input
                    type='text'
                    className='sr-only'
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelDelete();
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmDelete(conversation.id);
                      }
                    }}
                  />
                </div>
                <div className='ml-2 flex gap-1'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-muted-foreground hover:text-destructive size-8'
                    type='submit'
                  >
                    <Check className='size-4' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-muted-foreground hover:text-destructive size-8'
                    onClick={handleCancelDelete}
                    type='button'
                  >
                    <X className='size-4' />
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div
              className='group flex items-center justify-between rounded-lg px-2 py-1.5'
              onClick={() => {
                // Close the drawer on selection regardless of current route
                handleOpenChange(false);
              }}
            >
              <Link
                href={`/dashboard/ai-chat/${conversation.id}`}
                key={conversation.id}
                className='flex flex-1 flex-col items-start'
                prefetch
              >
                <span className='line-clamp-1 text-base font-normal'>
                  {conversation.title || 'Untitled Conversation'}
                </span>
                <span className='mr-2 text-xs font-normal text-gray-500'>
                  {formatDate(
                    conversation?.updated_at || conversation?.created_at
                  )}
                </span>
              </Link>
              <div className='flex items-center'>
                <div className='flex gap-1'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-muted-foreground hover:text-foreground size-8'
                    onClick={(e) => {
                      e.preventDefault();
                      handleEdit(conversation);
                    }}
                    type='button'
                  >
                    <Pencil className='size-4' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-muted-foreground hover:text-destructive size-8'
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(conversation.id);
                    }}
                    type='button'
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    [
      handleOpenChange,
      editingId,
      deletingId,
      editTitle,
      handleSaveEdit,
      handleCancelEdit,
      handleConfirmDelete,
      handleCancelDelete,
      handleEdit,
      handleDelete,
    ]
  );

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        </TooltipTrigger>
        <TooltipContent>History</TooltipContent>
      </Tooltip>
      <DrawerContent>
        <DrawerHeader className='sr-only'>
          <DrawerTitle>History</DrawerTitle>
        </DrawerHeader>
        <div className='flex h-dvh max-h-[80vh] flex-col'>
          <div className='border-b p-4 pb-3'>
            <div className='relative'>
              <Input
                placeholder='Search...'
                className='rounded-lg py-1.5 pl-8 text-sm'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className='absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 transform text-gray-400' />
            </div>
          </div>

          <ScrollArea className='flex-1 overflow-auto'>
            <div className='flex flex-col space-y-6 px-4 pt-4 pb-8'>
              {filteredConversations.length === 0 ? (
                <div className='text-muted-foreground py-4 text-center text-sm'>
                  No conversation history found.
                </div>
              ) : searchQuery ? (
                // When searching, display a flat list without grouping
                <div className='space-y-2'>
                  {filteredConversations.map((conversation) =>
                    renderConversationItem(conversation)
                  )}
                </div>
              ) : (
                // When not searching, display grouped by date
                groupedConversations?.map((group) => (
                  <div key={group.name} className='space-y-0.5'>
                    <h3 className='text-muted-foreground pl-2 text-sm font-medium'>
                      {group.name}
                    </h3>
                    <div className='space-y-2'>
                      {group.conversations.map((conversation) =>
                        renderConversationItem(conversation)
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
