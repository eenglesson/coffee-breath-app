'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ConversationSessionContextType } from '@/lib/types/chat';

const ConversationSessionContext =
  createContext<ConversationSessionContextType | null>(null);

export function ConversationSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const conversationId = useMemo(() => {
    if (pathname?.startsWith('/dashboard/create-questions/')) {
      const id = pathname.split('/dashboard/create-questions/')[1];
      // Handle 'new' route or empty as null (clean chat state)
      return id === 'new' || !id ? null : id;
    }
    return null; // No conversationId = clean chat state
  }, [pathname]);

  return (
    <ConversationSessionContext.Provider value={{ conversationId }}>
      {children}
    </ConversationSessionContext.Provider>
  );
}

export function useConversationSession() {
  const context = useContext(ConversationSessionContext);
  if (!context) {
    throw new Error(
      'useConversationSession must be used within a ConversationSessionProvider'
    );
  }
  return context;
}
