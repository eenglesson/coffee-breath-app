'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ConversationWithPreview,
  AiConversation,
  CreateConversationParams,
  UpdateConversationTitleParams,
  CreateConversationResponse,
} from '@/lib/types/chat';
import { toast } from 'sonner';

// Hook to fetch all conversations for a teacher
export function useConversationHistory(teacherId: string) {
  return useQuery({
    queryKey: ['conversations', teacherId],
    queryFn: async (): Promise<ConversationWithPreview[]> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('ai_conversations')
        .select(
          `
          *,
          messages:ai_messages(
            id,
            conversation_id,
            content,
            sender,
            created_at,
            metadata
          )
        `
        )
        .eq('teacher_id', teacherId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map((conversation) => ({
        ...conversation,
        last_message: conversation.messages[conversation.messages.length - 1],
        message_count: conversation.messages.length,
        preview: conversation.messages.slice(-3), // Last 3 messages for preview
      }));
    },
    enabled: !!teacherId,
    staleTime: 30 * 60 * 1000, // 30 minutes - conversations rarely change
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache longer
  });
}

// Hook to create a new conversation with optimistic updates
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (
      params: CreateConversationParams
    ): Promise<CreateConversationResponse> => {
      const supabase = createClient();

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          teacher_id: params.teacherId,
          student_id: params.studentId || null,
          title: params.title || 'New Conversation',
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add first message if provided
      let firstMessage = undefined;
      if (params.firstMessage) {
        const { data: message, error: msgError } = await supabase
          .from('ai_messages')
          .insert({
            conversation_id: conversation.id,
            content: params.firstMessage,
            sender: 'user',
            metadata: null,
          })
          .select()
          .single();

        if (msgError) throw msgError;
        firstMessage = message;
      }

      return { conversation, firstMessage };
    },
    onMutate: async (params) => {
      // Create optimistic conversation
      const optimisticConversation: ConversationWithPreview = {
        id: `optimistic-${Date.now()}`,
        teacher_id: params.teacherId,
        student_id: params.studentId || null,
        title: params.title || 'New Conversation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
        message_count: 0,
        preview: [],
      };

      // Update conversations list optimistically
      await queryClient.cancelQueries({
        queryKey: ['conversations', params.teacherId],
      });

      const previousConversations = queryClient.getQueryData([
        'conversations',
        params.teacherId,
      ]);

      queryClient.setQueryData(
        ['conversations', params.teacherId],
        (old: ConversationWithPreview[] = []) => [
          optimisticConversation,
          ...old,
        ]
      );

      return { previousConversations, optimisticConversation };
    },
    onSuccess: ({ conversation }) => {
      // Navigate to new conversation immediately
      router.push(`/dashboard/create-questions/${conversation.id}`);
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousConversations) {
        queryClient.setQueryData(
          ['conversations', variables.teacherId],
          context.previousConversations
        );
      }
      toast.error('Failed to create conversation');
    },
    onSettled: (data, error, variables) => {
      // Always invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: ['conversations', variables.teacherId],
      });
    },
  });
}

// Hook to update conversation title with optimistic updates
export function useUpdateConversationTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: UpdateConversationTitleParams
    ): Promise<AiConversation> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('ai_conversations')
        .update({
          title: params.title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.conversationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (params) => {
      // Optimistically update the title in cache
      queryClient.setQueriesData(
        { queryKey: ['conversations'] },
        (old: ConversationWithPreview[] | undefined) => {
          if (!old) return old;
          return old.map((conv) =>
            conv.id === params.conversationId
              ? {
                  ...conv,
                  title: params.title,
                  updated_at: new Date().toISOString(),
                }
              : conv
          );
        }
      );
    },
    onError: () => {
      toast.error('Failed to update conversation title');
    },
    onSettled: (data, error, params) => {
      // Invalidate specific conversation queries
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({
        queryKey: ['messages', params.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['conversation-messages-preview', params.conversationId],
      });
    },
  });
}

// Hook to delete conversation with optimistic updates
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (conversationId: string): Promise<string> => {
      const supabase = createClient();

      // Delete messages first (cascade should handle this, but being explicit)
      await supabase
        .from('ai_messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete conversation
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      return conversationId;
    },
    onMutate: async (conversationId) => {
      // Optimistically remove from cache
      queryClient.setQueriesData(
        { queryKey: ['conversations'] },
        (old: ConversationWithPreview[] | undefined) => {
          if (!old) return old;
          return old.filter((conv) => conv.id !== conversationId);
        }
      );
    },
    onSuccess: (conversationId) => {
      // Navigate away if we're currently viewing this conversation
      const currentPath = window.location.pathname;
      if (currentPath.includes(conversationId)) {
        router.push('/dashboard/create-questions');
      }

      toast.success('Conversation deleted');
    },
    onError: () => {
      toast.error('Failed to delete conversation');
    },
    onSettled: (conversationId) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (conversationId) {
        queryClient.removeQueries({ queryKey: ['messages', conversationId] });
        queryClient.removeQueries({
          queryKey: ['conversation-messages-preview', conversationId],
        });
      }
    },
  });
}
