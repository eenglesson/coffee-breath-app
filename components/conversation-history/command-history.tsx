'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { cn } from '@/lib/utils';

import { Check, Pencil, Search, TextSearch, Trash2, X } from 'lucide-react';

// Type definition for conversation items
type ConversationItem = {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
};

// Simple placeholder for useBreakpoint hook (your original)
function useBreakpoint(breakpoint: number): boolean {
  const [isBelow, setIsBelow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsBelow(window.innerWidth < breakpoint);
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  // During SSR and before mounting, always return false to prevent hydration mismatches
  return mounted ? isBelow : false;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Utility functions for the advanced design
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Today';
  if (diffDays === 2) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays - 1} days ago`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
}

function groupItemsByDate(items: ConversationItem[], searchQuery: string) {
  const filteredItems = searchQuery
    ? items.filter((item) =>
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  const groups: { name: string; items: ConversationItem[] }[] = [];
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const todayItems: ConversationItem[] = [];
  const yesterdayItems: ConversationItem[] = [];
  const lastWeekItems: ConversationItem[] = [];
  const lastMonthItems: ConversationItem[] = [];
  const olderItems: ConversationItem[] = [];

  filteredItems.forEach((item) => {
    // Use updated_at if available, otherwise fall back to created_at
    const dateString = item.updated_at || item.created_at;
    if (!dateString) return; // Skip items without dates
    const itemDate = new Date(dateString);
    if (itemDate.toDateString() === today.toDateString()) {
      todayItems.push(item);
    } else if (itemDate.toDateString() === yesterday.toDateString()) {
      yesterdayItems.push(item);
    } else if (itemDate >= lastWeek) {
      lastWeekItems.push(item);
    } else if (itemDate >= lastMonth) {
      lastMonthItems.push(item);
    } else {
      olderItems.push(item);
    }
  });

  if (todayItems.length > 0) groups.push({ name: 'Today', items: todayItems });
  if (yesterdayItems.length > 0)
    groups.push({ name: 'Yesterday', items: yesterdayItems });
  if (lastWeekItems.length > 0)
    groups.push({ name: 'Last 7 days', items: lastWeekItems });
  if (lastMonthItems.length > 0)
    groups.push({ name: 'Last 30 days', items: lastMonthItems });
  if (olderItems.length > 0) groups.push({ name: 'Older', items: olderItems });

  return groups;
}

// Component for editing an item
function CommandItemEdit({
  item,
  editTitle,
  setEditTitle,
  onSave,
  onCancel,
}: {
  item: ConversationItem;
  editTitle: string;
  setEditTitle: (title: string) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
}) {
  return (
    <form
      className='flex w-full items-center justify-between'
      onSubmit={(e) => {
        e.preventDefault();
        onSave(item.id);
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
            onSave(item.id);
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

// Component for deleting an item
function CommandItemDelete({
  item,
  onConfirm,
  onCancel,
}: {
  item: ConversationItem;
  onConfirm: (id: string) => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm(item.id);
      }}
      className='flex w-full items-center justify-between'
    >
      <div className='flex flex-1 items-center'>
        <span className='line-clamp-1 text-base font-normal'>{item.title}</span>
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
              onConfirm(item.id);
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
              className='group/delete-confirm text-muted-foreground hover:text-destructive-foreground hover:bg-secondary-foreground/10 size-8 transition-colors duration-150'
              type='submit'
              aria-label='Confirm'
            >
              <Check className='group-hover/delete-confirm:text-green-700 size-4 transition-colors duration-150' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Confirm</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              variant='ghost'
              className='group/delete-cancel text-muted-foreground hover:text-foreground hover:bg-secondary-foreground/10 size-8 transition-colors duration-150'
              onClick={onCancel}
              type='button'
              aria-label='Cancel'
            >
              <X className='group-hover/delete-cancel:text-destructive size-4 transition-colors duration-150' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancel</TooltipContent>
        </Tooltip>
      </div>
    </form>
  );
}

// Component for displaying a normal item row
function CommandItemRow({
  item,
  onEdit,
  onDelete,
  editingId,
  deletingId,
  currentId,
  itemName,
}: {
  item: ConversationItem;
  onEdit: (item: ConversationItem) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  deletingId: string | null;
  currentId?: string;
  itemName: string;
}) {
  const isCurrentItem = item.id === currentId;

  return (
    <>
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <span className='line-clamp-1 text-base font-normal truncate'>
          {item?.title || `Untitled ${capitalize(itemName)}`}
        </span>
        {isCurrentItem && <Badge variant='outline'>current</Badge>}
      </div>

      {/* Date and actions container */}
      <div className='relative flex min-w-[120px] flex-shrink-0 justify-end'>
        {/* Date that shows by default but hides on selection */}
        <span
          className={cn(
            'text-muted-foreground text-sm font-normal opacity-100 transition-opacity duration-0',
            'group-data-[selected=true]:opacity-0',
            Boolean(editingId || deletingId) &&
              'group-data-[selected=true]:opacity-100'
          )}
        >
          {formatDate(item?.updated_at || item?.created_at)}
        </span>

        {/* Action buttons that appear on selection, positioned over the date */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-end gap-1 opacity-0 transition-opacity duration-0',
            'group-data-[selected=true]:opacity-100',
            Boolean(editingId || deletingId) &&
              'group-data-[selected=true]:opacity-0'
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant='ghost'
                className='group/edit hover:bg-secondary-foreground/10 size-8 transition-colors duration-150'
                onClick={(e) => {
                  e.stopPropagation();
                  if (item) onEdit(item);
                }}
                type='button'
                aria-label='Edit'
              >
                <Pencil className='text-muted-foreground group-hover/edit:text-foreground size-4 transition-colors duration-150' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant='ghost'
                className='group/delete text-muted-foreground hover:text-destructive hover:bg-secondary-foreground/10 size-8 transition-colors duration-150'
                onClick={(e) => {
                  e.stopPropagation();
                  if (item?.id) onDelete(item.id);
                }}
                type='button'
                aria-label='Delete'
              >
                <Trash2 className='text-muted-foreground group-hover/delete:text-destructive size-4 transition-colors duration-150' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}

// CommandHistory Component (your original structure with advanced design)
type CommandHistoryProps = {
  trigger: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  hasPopover?: boolean;
  fetchItems: () => Promise<ConversationItem[]>;
  onSelect: (id: string) => void;
  onSaveEdit: (id: string, newTitle: string) => Promise<void>;
  onConfirmDelete: (id: string) => Promise<void>;
  currentId?: string;
  itemName?: string;
};

export function CommandHistory({
  trigger,
  isOpen,
  setIsOpen,
  hasPopover = true,
  fetchItems,
  onSelect,
  onSaveEdit,
  onConfirmDelete,
  currentId,
  itemName = 'chat',
}: CommandHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchQuery('');
      setEditingId(null);
      setEditTitle('');
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchItems()
        .then((data) => {
          setItems(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching items:', error);
          setLoading(false);
        });
    }
  }, [isOpen, fetchItems]);

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedItems = groupItemsByDate(items, searchQuery);

  const handleSelect = (id: string) => {
    if (!editingId && !deletingId) {
      setIsOpen(false);
      onSelect(id);
    }
  };

  const handleEdit = (item: ConversationItem) => {
    setEditingId(item.id);
    setEditTitle(item.title || '');
  };

  const handleSaveEdit = async (id: string) => {
    await onSaveEdit(id, editTitle);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, title: editTitle } : item
      )
    );
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async (id: string) => {
    await onConfirmDelete(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    setDeletingId(null);
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  const renderItem = (item: ConversationItem) => {
    const isCurrentEditOrDelete =
      item.id === editingId || item.id === deletingId;
    const isEditOrDeleteMode = editingId || deletingId;

    return (
      <CommandItem
        key={item.id}
        onSelect={() => handleSelect(item.id)}
        className={cn(
          'group data-[selected=true]:bg-accent flex w-full items-center justify-between rounded-md',
          isCurrentEditOrDelete ? '!py-2' : 'py-2',
          isCurrentEditOrDelete && 'bg-accent data-[selected=true]:bg-accent',
          !isCurrentEditOrDelete &&
            isEditOrDeleteMode &&
            'data-[selected=true]:bg-transparent'
        )}
        value={item.id}
      >
        {editingId === item.id ? (
          <CommandItemEdit
            item={item}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        ) : deletingId === item.id ? (
          <CommandItemDelete
            item={item}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        ) : (
          <CommandItemRow
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            editingId={editingId}
            deletingId={deletingId}
            currentId={currentId}
            itemName={itemName}
          />
        )}
      </CommandItem>
    );
  };

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
      <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${itemName} history...`}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className='max-h-[480px] min-h-[480px] flex-1 [&>[cmdk-list-sizer]]:py-2 [&>[cmdk-list-sizer]]:space-y-6'>
            {loading ? (
              <div className='py-4 text-center text-sm text-muted-foreground'>
                Loading...
              </div>
            ) : filteredItems.length === 0 ? (
              <CommandEmpty>No {itemName} history found.</CommandEmpty>
            ) : searchQuery ? (
              // When searching, display a flat list without grouping
              <CommandGroup className='p-1.5'>
                {filteredItems.map((item) => renderItem(item))}
              </CommandGroup>
            ) : (
              // When not searching, display grouped by date
              groupedItems?.map((group) => (
                <CommandGroup
                  key={group.name}
                  heading={group.name}
                  className='space-y-0 px-1.5'
                >
                  {group.items.map((item) => renderItem(item))}
                </CommandGroup>
              ))
            )}
          </CommandList>

          <div className='border-t border-input bg-card py-3 px-4 bottom-0 left-0 right-0 flex items-center justify-between'>
            <div className='text-xs text-muted-foreground flex w-full items-center gap-2'>
              <div className='flex w-full flex-row items-center justify-between gap-1'>
                <div className='flex flex-1 flex-row items-center gap-4'>
                  <div className='flex flex-row items-center gap-1.5'>
                    <div className='flex flex-row items-center gap-0.5'>
                      <span className='inline-flex size-5 items-center justify-center rounded-sm border border-border bg-muted'>
                        ↑
                      </span>
                      <span className='inline-flex size-5 items-center justify-center rounded-sm border border-border bg-muted'>
                        ↓
                      </span>
                    </div>
                    <span>Navigate</span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <span className='inline-flex size-5 items-center justify-center rounded-sm border border-border bg-muted'>
                      ⏎
                    </span>
                    <span>Go to {itemName}</span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <div className='flex flex-row items-center gap-0.5'>
                      <span className='inline-flex size-5 items-center justify-center rounded-sm border border-border bg-muted'>
                        ⌘
                      </span>
                      <span className='inline-flex size-5 items-center justify-center rounded-sm border border-border bg-muted'>
                        K
                      </span>
                    </div>
                    <span>Toggle</span>
                  </div>
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='h-5 px-1 items-center justify-center inline-flex bg-muted border border-input rounded-sm'>
                    Esc
                  </span>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}

// DrawerHistory
type DrawerHistoryProps = {
  trigger: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  fetchItems: () => Promise<ConversationItem[]>;
  onSelect: (id: string) => void;
  onSaveEdit: (id: string, newTitle: string) => Promise<void>;
  onConfirmDelete: (id: string) => Promise<void>;
  currentId?: string;
  itemName?: string;
};

export function DrawerHistory({
  trigger,
  isOpen,
  setIsOpen,
  fetchItems,
  onSelect,
  onSaveEdit,
  onConfirmDelete,
  currentId,
  itemName = 'chat',
}: DrawerHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchQuery('');
      setEditingId(null);
      setEditTitle('');
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchItems()
        .then((data) => {
          setItems(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching items:', error);
          setLoading(false);
        });
    }
  }, [isOpen, fetchItems]);

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedItems = groupItemsByDate(items, searchQuery);

  const handleSelect = (id: string) => {
    setIsOpen(false);
    onSelect(id);
  };

  const handleEdit = (item: ConversationItem) => {
    setEditingId(item.id);
    setEditTitle(item.title || '');
  };

  const handleSaveEdit = async (id: string) => {
    await onSaveEdit(id, editTitle);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, title: editTitle } : item
      )
    );
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async (id: string) => {
    await onConfirmDelete(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    setDeletingId(null);
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  const renderItem = (item: ConversationItem) => (
    <div key={item.id}>
      <div className='space-y-1.5'>
        {editingId === item.id ? (
          <div className='bg-accent flex items-center justify-between rounded-lg px-2 py-2.5'>
            <form
              className='flex w-full items-center justify-between'
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit(item.id);
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
                    handleSaveEdit(item.id);
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
        ) : deletingId === item.id ? (
          <div className='bg-accent flex items-center justify-between rounded-lg px-2 py-2.5'>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmDelete(item.id);
              }}
              className='flex w-full items-center justify-between'
            >
              <div className='flex flex-1 items-center'>
                <span className='text-base font-normal'>{item.title}</span>
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
                      handleConfirmDelete(item.id);
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
          <div className='group flex items-center justify-between rounded-lg px-2 py-1.5'>
            <button
              onClick={() => handleSelect(item.id)}
              className='flex flex-1 flex-col items-start'
            >
              <div className='flex items-center gap-2'>
                <span className='line-clamp-1 text-left text-base font-normal'>
                  {item.title || `Untitled ${capitalize(itemName)}`}
                </span>
                {item.id === currentId && (
                  <Badge variant='outline'>current</Badge>
                )}
              </div>
              <span className='mr-2 text-xs font-normal text-gray-500'>
                {formatDate(item?.updated_at || item?.created_at)}
              </span>
            </button>
            <div className='flex items-center'>
              <div className='flex gap-1'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='text-muted-foreground hover:text-foreground size-8'
                  onClick={(e) => {
                    e.preventDefault();
                    handleEdit(item);
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
                    handleDelete(item.id);
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
        <DrawerHeader className='pb-0'>
          <DrawerTitle>Chat History</DrawerTitle>
        </DrawerHeader>
        <div className='max-h-[80vh] flex flex-col'>
          <div className='border-b pb-3 p-4'>
            <div className='relative'>
              <Input
                placeholder={`Search ${itemName}s...`}
                className='py-1.5 text-sm pl-8 rounded-lg'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className='absolute top-1/2 left-2.5 h-3.5 w-3.5 text-gray-400 -translate-y-1/2 transform' />
            </div>
          </div>

          <ScrollArea className='flex-1 overflow-auto'>
            <div className='flex flex-col px-4 pt-4 pb-8 space-y-6'>
              {loading ? (
                <div className='py-4 text-center text-sm text-muted-foreground'>
                  Loading...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className='py-4 text-center text-sm text-muted-foreground'>
                  No {itemName} history found.
                </div>
              ) : searchQuery ? (
                // When searching, display a flat list without grouping
                <div className='space-y-2'>
                  {filteredItems.map((item) => renderItem(item))}
                </div>
              ) : (
                // When not searching, display grouped by date
                groupedItems?.map((group) => (
                  <div key={group.name} className='space-y-0.5'>
                    <h3 className='text-muted-foreground pl-2 text-sm font-medium'>
                      {group.name}
                    </h3>
                    <div className='space-y-2'>
                      {group.items.map((item) => renderItem(item))}
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

// HistoryTrigger (simplified to match your original)
type HistoryTriggerProps = {
  hasSidebar: boolean;
  classNameTrigger?: string;
  icon?: React.ReactNode;
  label?: React.ReactNode | string;
  hasPopover?: boolean;
  fetchItems: () => Promise<ConversationItem[]>;
  onSelect: (id: string) => void;
  onSaveEdit: (id: string, newTitle: string) => Promise<void>;
  onConfirmDelete: (id: string) => Promise<void>;
  currentId?: string;
  itemName?: string;
};

export function HistoryTrigger({
  hasSidebar,
  classNameTrigger,
  icon,
  label,
  hasPopover = true,
  fetchItems,
  onSelect,
  onSaveEdit,
  onConfirmDelete,
  currentId,
  itemName = 'chat',
}: HistoryTriggerProps) {
  const isMobile = useBreakpoint(768);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultTrigger = (
    <button
      className={cn(
        'pointer-events-auto rounded-full flex flex-row gap-1 p-1.5 items-center bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors',
        hasSidebar ? 'hidden' : 'block',
        classNameTrigger
      )}
      type='button'
      onClick={() => setIsOpen(true)}
      aria-label='History'
      tabIndex={mounted && isMobile ? -1 : 0}
    >
      {icon || <TextSearch size={24} />}
      {label}
    </button>
  );

  // During SSR or before mounting, always use CommandHistory to prevent hydration issues
  if (!mounted) {
    return (
      <CommandHistory
        trigger={defaultTrigger}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        hasPopover={hasPopover}
        fetchItems={fetchItems}
        onSelect={onSelect}
        onSaveEdit={onSaveEdit}
        onConfirmDelete={onConfirmDelete}
        currentId={currentId}
        itemName={itemName}
      />
    );
  }

  if (isMobile) {
    return (
      <DrawerHistory
        trigger={defaultTrigger}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        fetchItems={fetchItems}
        onSelect={onSelect}
        onSaveEdit={onSaveEdit}
        onConfirmDelete={onConfirmDelete}
        currentId={currentId}
        itemName={itemName}
      />
    );
  }

  return (
    <CommandHistory
      trigger={defaultTrigger}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      hasPopover={hasPopover}
      fetchItems={fetchItems}
      onSelect={onSelect}
      onSaveEdit={onSaveEdit}
      onConfirmDelete={onConfirmDelete}
      currentId={currentId}
      itemName={itemName}
    />
  );
}
