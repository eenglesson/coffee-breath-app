'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AiMessage, UpdateMessageParams } from '@/lib/types/chat';
import { toast } from 'sonner';
import { addMessageToConversation as saAddMessageToConversation } from '@/app/actions/messages/messages';
import { createClient } from '@/lib/supabase/client';

// Clean cache sync utilities for AI SDK v5 integration
export function useMessageCache() {
  const queryClient = useQueryClient();

  const addMessageToCache = (conversationId: string, message: AiMessage) => {
    // Simply add the message to the messages cache (instant)
    queryClient.setQueryData(
      ['messages', conversationId],
      (old: AiMessage[] = []) => [...old, message]
    );
  };

  return { addMessageToCache };
}

interface ConversationUpdate {
  preview?: Array<{ content: string; sender: string }>;
  title?: string;
  updated_at?: string;
}

export function useConversationCache() {
  const queryClient = useQueryClient();

  const updateConversation = (
    conversationId: string,
    updates: ConversationUpdate
  ) => {
    // Update the conversation with new data (instant)
    queryClient.setQueriesData(
      { queryKey: ['conversations'] },
      (old: Array<{ id: string; [key: string]: unknown }> | undefined) => {
        if (!old) return old;
        return old.map((conv) =>
          conv.id === conversationId
            ? { ...conv, ...updates, updated_at: new Date().toISOString() }
            : conv
        );
      }
    );
  };

  return { updateConversation };
}

export function usePreviewCache() {
  const queryClient = useQueryClient();

  const updatePreview = (conversationId: string, message: AiMessage) => {
    // Update the preview cache with latest message (instant)
    queryClient.setQueryData(
      ['conversation-messages-preview', conversationId],
      (old: AiMessage[] = []) => [...old, message].slice(-5)
    );
  };

  return { updatePreview };
}

// Hook to fetch messages for a specific conversation
export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async (): Promise<AiMessage[]> => {
      if (!conversationId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(`Failed to load messages: ${error.message}`);
      return (data ?? []) as AiMessage[];
    },
    enabled: !!conversationId,
    staleTime: 10 * 60 * 1000, // 10 minutes - messages only change when added
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

// Hook to add a message with optimistic updates
export function useAddMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      newMessage: Omit<AiMessage, 'id' | 'created_at'>
    ): Promise<AiMessage> => {
      const senderUnion =
        newMessage.sender === 'assistant' ? 'assistant' : 'user';
      return saAddMessageToConversation(
        newMessage.conversation_id,
        newMessage.content,
        senderUnion,
        newMessage.metadata ?? null
      );
    },
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['messages', newMessage.conversation_id],
      });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData([
        'messages',
        newMessage.conversation_id,
      ]);

      // Optimistically add message
      const optimisticMessage: AiMessage = {
        ...newMessage,
        id: `optimistic-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(
        ['messages', newMessage.conversation_id],
        (old: AiMessage[] = []) => [...old, optimisticMessage]
      );

      return { previousMessages, optimisticMessage };
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['messages', newMessage.conversation_id],
        context?.previousMessages
      );
      toast.error('Failed to send message');
    },
    onSettled: (data, error, newMessage) => {
      // Always invalidate after error or success
      queryClient.invalidateQueries({
        queryKey: ['messages', newMessage.conversation_id],
      });
      // Also update conversation list to show new last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Invalidate preview cache for this conversation
      queryClient.invalidateQueries({
        queryKey: ['conversation-messages-preview', newMessage.conversation_id],
      });
    },
  });
}

// Hook to update a message with optimistic updates
export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateMessageParams): Promise<AiMessage> => {
      const supabase = createClient();

      const updateData: Partial<AiMessage> = {};
      if (params.content !== undefined) updateData.content = params.content;
      if (params.metadata !== undefined) updateData.metadata = params.metadata;

      const { data, error } = await supabase
        .from('ai_messages')
        .update(updateData)
        .eq('id', params.messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (params) => {
      // Find which conversation this message belongs to
      const conversationQueries = queryClient.getQueriesData({
        queryKey: ['messages'],
      });

      let conversationId: string | null = null;

      for (const [messages] of conversationQueries) {
        if (Array.isArray(messages)) {
          const message = messages.find(
            (m: AiMessage) => m.id === params.messageId
          );
          if (message) {
            conversationId = message.conversation_id;
            break;
          }
        }
      }

      if (!conversationId) return;

      // Optimistically update the message
      queryClient.setQueryData(
        ['messages', conversationId],
        (old: AiMessage[] = []) =>
          old.map((msg) =>
            msg.id === params.messageId
              ? {
                  ...msg,
                  ...(params.content !== undefined && {
                    content: params.content,
                  }),
                  ...(params.metadata !== undefined && {
                    metadata: params.metadata,
                  }),
                }
              : msg
          )
      );

      return { conversationId };
    },
    onError: () => {
      toast.error('Failed to update message');
    },
    onSettled: (data, error, variables, context) => {
      if (context?.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ['messages', context.conversationId],
        });
        queryClient.invalidateQueries({
          queryKey: ['conversation-messages-preview', context.conversationId],
        });
      }
    },
  });
}

// Hook to delete a message with optimistic updates
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string): Promise<string> => {
      const supabase = createClient();

      const { error } = await supabase
        .from('ai_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return messageId;
    },
    onMutate: async (messageId) => {
      // Find which conversation this message belongs to and remove it
      const conversationQueries = queryClient.getQueriesData({
        queryKey: ['messages'],
      });

      let conversationId: string | null = null;

      for (const [queryKey, messages] of conversationQueries) {
        if (Array.isArray(messages)) {
          const messageExists = messages.some(
            (m: AiMessage) => m.id === messageId
          );
          if (messageExists) {
            const updatedMessages = messages.filter(
              (m: AiMessage) => m.id !== messageId
            );
            queryClient.setQueryData(queryKey, updatedMessages);

            // Extract conversation ID from query key
            conversationId = (queryKey as string[])[1] as string;
            break;
          }
        }
      }

      return { conversationId };
    },
    onSuccess: () => {
      toast.success('Message deleted');
    },
    onError: () => {
      toast.error('Failed to delete message');
    },
    onSettled: (data, error, messageId, context) => {
      if (context?.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ['messages', context.conversationId],
        });
        // Update conversation list in case this was the last message
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({
          queryKey: ['conversation-messages-preview', context.conversationId],
        });
      }
    },
  });
}
