'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  ConversationWithPreview,
  AiConversation,
  CreateConversationParams,
  UpdateConversationTitleParams,
  CreateConversationResponse,
} from '@/lib/types/chat';
import { toast } from 'sonner';
import {
  createConversation as saCreateConversation,
  updateConversationTitle as saUpdateConversationTitle,
  deleteConversation as saDeleteConversation,
  getUserConversationsWithPreview as saGetUserConversationsWithPreview,
} from '@/app/actions/conversations/conversations';

// Hook to fetch all conversations for a teacher
export function useConversationHistory(teacherId: string) {
  return useQuery({
    queryKey: ['conversations', teacherId],
    queryFn: async (): Promise<ConversationWithPreview[]> =>
      saGetUserConversationsWithPreview(),
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
      // Create conversation via server action
      const conversation = await saCreateConversation(
        params.title || 'New Conversation'
      );

      // Add first message if provided using server action from messages
      let firstMessage = undefined;
      if (params.firstMessage) {
        const { addMessageToConversation } = await import(
          '@/app/actions/messages/messages'
        );
        firstMessage = await addMessageToConversation(
          conversation.id,
          params.firstMessage,
          'user',
          null
        );
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
      router.push(`/dashboard/ai-chat/${conversation.id}`);
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
      return saUpdateConversationTitle(params.conversationId, params.title);
    },
    onMutate: async (params) => {
      // Optimistically update the title in cache
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            Array.isArray(query.queryKey) && query.queryKey[0] === 'conversations',
        },
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
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === 'conversations',
      });
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
      await saDeleteConversation(conversationId);
      return conversationId;
    },
    onMutate: async (conversationId) => {
      // Optimistically remove from cache
      queryClient.setQueriesData(
        {
          predicate: (query) =>
            Array.isArray(query.queryKey) && query.queryKey[0] === 'conversations',
        },
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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('chat:new'));
        }
        router.push('/dashboard/ai-chat');
      }

      toast.success('Conversation deleted');
    },
    onError: () => {
      toast.error('Failed to delete conversation');
    },
    onSettled: (conversationId) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === 'conversations',
      });
      if (conversationId) {
        queryClient.removeQueries({ queryKey: ['messages', conversationId] });
        queryClient.removeQueries({
          queryKey: ['conversation-messages-preview', conversationId],
        });
      }
    },
  });
}
