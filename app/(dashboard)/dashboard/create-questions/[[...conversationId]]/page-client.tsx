'use client';

import { useRouter } from 'next/navigation';
import { SquarePen } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { HistoryTrigger } from '@/components/conversation-history/command-history';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  deleteConversation,
  updateConversationTitle,
  getUserConversations,
} from '@/app/actions/conversations/conversations';
import Chat from '../../Chat/Chat';
import { Database } from '@/database.types';

type Message = Database['public']['Tables']['ai_messages']['Row'];

interface CreateQuestionsClientProps {
  conversationId?: string;
  initialMessages: Message[];
}

export default function CreateQuestionsClient({
  conversationId,
  initialMessages,
}: CreateQuestionsClientProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<
    Array<{
      id: string;
      title: string;
      created_at?: string;
      updated_at?: string;
    }>
  >([]);
  const [chatKey, setChatKey] = useState(0); // Force chat reset

  // Load conversations on page mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversations without caching
  const loadConversations = async () => {
    const freshConversations = await getUserConversations();

    const mappedConversations = freshConversations.map((conv) => ({
      id: conv.id,
      title: conv.title || 'Untitled Conversation',
      created_at: conv.created_at || undefined,
      updated_at: conv.updated_at || undefined,
    }));

    setConversations(mappedConversations);
    return mappedConversations;
  };

  // Add new conversation to the list (called when a new conversation is created)
  const addNewConversation = (newConversation: {
    id: string;
    title: string;
    created_at?: string;
    updated_at?: string;
  }) => {
    // Optimistic update - add to UI immediately
    setConversations((prev) => [newConversation, ...prev]);
  };

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchConversations = useMemo(() => {
    return () => Promise.resolve(conversations);
  }, [conversations]);

  const handleSelectConversation = (id: string) => {
    router.push(`/dashboard/create-questions/${id}`);
  };

  const handleNewChat = () => {
    // Check if we're already on the base create-questions route
    if (window.location.pathname === '/dashboard/create-questions') {
      // If already on base route, just reset the chat
      setChatKey((prev) => prev + 1);
      return;
    }

    // Clean navigation to base route and force chat reset
    router.push('/dashboard/create-questions');
    setChatKey((prev) => prev + 1); // Force chat component to remount
  };

  const handleSaveEdit = async (id: string, newTitle: string) => {
    // Optimistic update - update UI immediately
    const previousConversations = [...conversations];
    setConversations((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, title: newTitle } : conv))
    );

    try {
      // Then update the server
      await updateConversationTitle(id, newTitle);
    } catch (error) {
      // Rollback on error
      setConversations(previousConversations);
      console.error('Failed to update conversation title:', error);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    // Optimistic update - remove from UI immediately
    const previousConversations = [...conversations];
    setConversations((prev) => prev.filter((conv) => conv.id !== id));

    try {
      // Then delete from server
      await deleteConversation(id);

      // Navigate away if deleting current conversation
      if (conversationId === id) {
        router.push('/dashboard/create-questions');
      }
    } catch (error) {
      // Rollback on error
      setConversations(previousConversations);
      console.error('Failed to delete conversation:', error);
    }
  };

  return (
    <TooltipProvider>
      <div className='flex items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleNewChat}
              className='pointer-events-auto rounded-full flex flex-row gap-1 p-2 items-center bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors'
            >
              <SquarePen size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Start a new conversation</p>
          </TooltipContent>
        </Tooltip>
        <HistoryTrigger
          hasSidebar={false}
          fetchItems={fetchConversations}
          onSelect={handleSelectConversation}
          onSaveEdit={handleSaveEdit}
          onConfirmDelete={handleConfirmDelete}
          currentId={conversationId}
          itemName='conversation'
          hasPopover={true}
        />
      </div>

      <div className='flex-1 flex justify-center w-full'>
        <Chat
          key={
            conversationId ? `conv-${conversationId}` : `new-chat-${chatKey}`
          } // Reset chat when key changes
          conversationId={conversationId}
          initialMessages={conversationId ? initialMessages : []} // Explicitly pass empty array for new chats
          onNewConversation={addNewConversation}
        />
      </div>
    </TooltipProvider>
  );
}
