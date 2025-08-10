'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { AiMessage, UpdateMessageParams } from '@/lib/types/chat';
import { toast } from 'sonner';

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

      if (error) throw error;
      return data;
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
      const supabase = createClient();

      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          ...newMessage,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's updated_at timestamp
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', newMessage.conversation_id);

      return data;
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
