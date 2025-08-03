'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { ConversationsContextType } from '@/lib/types/chat';
import { useConversationHistory } from '@/lib/hooks/chat/useConversations';

const ConversationsContext = createContext<ConversationsContextType | null>(
  null
);

interface ConversationsProviderProps {
  children: ReactNode;
  teacherId: string;
}

export function ConversationsProvider({
  children,
  teacherId,
}: ConversationsProviderProps) {
  const {
    data: conversations = [],
    isLoading,
    error,
  } = useConversationHistory(teacherId);

  const contextValue: ConversationsContextType = {
    conversations,
    isLoading,
    error,
  };

  return (
    <ConversationsContext.Provider value={contextValue}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error(
      'useConversations must be used within a ConversationsProvider'
    );
  }
  return context;
}
