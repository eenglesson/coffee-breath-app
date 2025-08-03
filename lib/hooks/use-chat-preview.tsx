import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConversationMessages } from '@/app/actions/messages/messages';
import type { AiMessage } from '@/lib/types/chat';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'teacher' | 'ai';
  created_at: string;
}

interface UseChatPreviewReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  fetchPreview: (conversationId: string) => Promise<void>;
  clearPreview: () => void;
}

export function useChatPreview(): UseChatPreviewReturn {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use TanStack Query to fetch messages for the conversation
  const {
    data: rawMessages,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['conversation-messages-preview', conversationId],
    queryFn: () =>
      conversationId
        ? getConversationMessages(conversationId)
        : Promise.resolve(null),
    enabled: !!conversationId,
    staleTime: 15 * 60 * 1000, // 15 minutes - messages rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  // Transform AiMessage[] to ChatMessage[] format
  const messages: ChatMessage[] =
    rawMessages && Array.isArray(rawMessages)
      ? rawMessages
          .slice(-5) // Get last 5 messages for preview
          .map((msg: AiMessage) => ({
            id: msg.id,
            content: msg.content,
            role:
              msg.sender === 'teacher' || msg.sender === 'user'
                ? 'user'
                : 'assistant',
            created_at: msg.created_at,
          }))
      : [];

  const error = queryError ? String(queryError) : null;

  const fetchPreview = useCallback(async (newConversationId: string) => {
    if (!newConversationId) return;

    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the request to prevent rapid-fire calls
    debounceTimeoutRef.current = setTimeout(() => {
      setConversationId(newConversationId);
    }, 200); // 200ms debounce to prevent rapid calls
  }, []);

  const clearPreview = useCallback(() => {
    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Clear conversation ID to stop the query
    setConversationId(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    fetchPreview,
    clearPreview,
  };
}
