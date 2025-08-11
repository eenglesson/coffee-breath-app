'use client';

import { useBreakpoint } from '@/app/hooks/use-breakpoint';
import { cn } from '@/lib/utils';
import { useState } from 'react';

import { useConversations, useConversationSession } from '@/lib/context';
import {
  useDeleteConversation,
  useUpdateConversationTitle,
} from '@/lib/hooks/chat';
import { CommandHistory } from './command-history';
import { DrawerHistory } from './drawer-history';
import { TextSearch } from 'lucide-react';

type HistoryTriggerProps = {
  hasSidebar: boolean;
  classNameTrigger?: string;
  icon?: React.ReactNode;
  label?: React.ReactNode | string;
  hasPopover?: boolean;
};

export function HistoryTrigger({
  hasSidebar,
  classNameTrigger,
  icon,
  label,
  hasPopover = true,
}: HistoryTriggerProps) {
  const isMobile = useBreakpoint(768);
  const { conversations } = useConversations();
  const { conversationId } = useConversationSession();
  const updateTitle = useUpdateConversationTitle();
  const deleteConversation = useDeleteConversation();
  const [isOpen, setIsOpen] = useState(false);

  const handleSaveEdit = async (id: string, newTitle: string) => {
    await updateTitle.mutateAsync({ conversationId: id, title: newTitle });
  };

  const handleConfirmDelete = async (id: string) => {
    if (id === conversationId) {
      setIsOpen(false);
    }
    await deleteConversation.mutateAsync(id);
  };

  const defaultTrigger = (
    <button
      className={cn(
        'text-muted-foreground hover:text-foreground hover:bg-muted pointer-events-auto rounded-full p-1.5 transition-colors',
        hasSidebar ? 'hidden' : 'block',
        classNameTrigger
      )}
      type='button'
      onClick={() => setIsOpen(true)}
      aria-label='Search'
      tabIndex={isMobile ? -1 : 0}
    >
      {icon || <TextSearch size={22} />}
      {label}
    </button>
  );

  if (isMobile) {
    return (
      <DrawerHistory
        conversationHistory={conversations}
        onSaveEdit={handleSaveEdit}
        onConfirmDelete={handleConfirmDelete}
        trigger={defaultTrigger}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    );
  }

  return (
    <CommandHistory
      conversationHistory={conversations}
      onSaveEdit={handleSaveEdit}
      onConfirmDelete={handleConfirmDelete}
      trigger={defaultTrigger}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      onOpenChange={setIsOpen}
      hasPopover={hasPopover}
      showPreview={true}
    />
  );
}
