'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { MessagesContextType } from '@/lib/types/chat';
import {
  useConversationMessages,
  useAddMessage,
} from '@/lib/hooks/chat/useMessages';
import { useConversationSession } from './ConversationSessionContext';

const MessagesContext = createContext<MessagesContextType | null>(null);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { conversationId } = useConversationSession();
  const addMessageMutation = useAddMessage();

  // Fetch messages for current conversation
  const {
    data: messages = [],
    isLoading,
    error,
  } = useConversationMessages(conversationId);

  const contextValue: MessagesContextType = {
    messages,
    isLoading,
    error,
    addMessage: addMessageMutation.mutate,
    isAddingMessage: addMessageMutation.isPending,
  };

  return (
    <MessagesContext.Provider value={contextValue}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}
