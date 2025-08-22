# Teacher AI Chat Application Architecture: Complete URL & State Management Flow

## Overview

The Teacher AI chat application implements a sophisticated optimistic update system that provides seamless user experience during conversation creation and message sending. The system manages conversations between teachers and students using `ai_conversations` and `ai_messages` tables. Here's exactly how it works:

## Key Technologies

- **AI SDK's `useChat`**: Core streaming chat functionality
- **React Context**: State management (Conversations, Messages, Session)
- **TanStack Query**: Smart caching, background sync, and optimistic updates
- **Supabase**: Database persistence with `ai_conversations` and `ai_messages` tables
- **History API**: URL manipulation without page reloads

## Core Architecture Components

### 1. Context Providers Hierarchy

```tsx
<ConversationsProvider>
  {' '}
  // Manages all teacher-student conversations
  <MessagesProvider>
    {' '}
    // Manages current conversation messages
    <ConversationSessionProvider>
      {' '}
      // Tracks current conversationId from URL
      <Chat />
    </ConversationSessionProvider>
  </MessagesProvider>
</ConversationsProvider>
```

### 2. Session Management (`ConversationSessionProvider`)

```tsx
export function ConversationSessionProvider({ children }) {
  const pathname = usePathname();
  const conversationId = useMemo(() => {
    if (pathname?.startsWith('/dashboard/ai-chat/'))
      return pathname.split('/dashboard/ai-chat/')[1];
    return null;
  }, [pathname]);

  return (
    <ConversationSessionContext.Provider value={{ conversationId }}>
      {children}
    </ConversationSessionContext.Provider>
  );
}
```

**Key Points:**

- Extracts `conversationId` directly from URL pathname at `/dashboard/ai-chat/[conversationId]`
- When URL changes from `/dashboard/ai-chat` to `/dashboard/ai-chat/[conversationId]`, `conversationId` updates reactively
- No page reload needed - just React state update

## Complete Chat Creation & Message Flow

### Phase 1: Initial State (Create Questions Page)

```
URL: /dashboard/ai-chat
conversationId: null
messages: []
UI: Shows clean chat interface - ready for new conversation
```

**Key Point**: When URL has NO `conversationId`, it's always a **clean chat** state - ready to create a new conversation with the first message.

### Phase 2: Teacher Types First Message

1. **Teacher clicks send** → `submit()` function in chat component
2. **Optimistic Message Creation**:

   ```tsx
   const optimisticMessage = {
     id: `optimistic-${Date.now().toString()}`,
     content: input,
     sender: 'teacher',
     conversation_id: conversationId,
     metadata: null,
     created_at: new Date().toISOString(),
   };

   // Add to UI immediately
   setMessages((prev) => [...prev, optimisticMessage]);
   setInput(''); // Clear input
   ```

3. **Conversation Creation Check** (`ensureConversationExists`):

   ```tsx
   if (messages.length === 0) {
     // First message - need to create conversation
     const newConversation = await createNewConversation(
       teacherId,
       input, // Use first message as title
       selectedModel,
       isAuthenticated
     );

     // Update URL immediately (no reload!)
     window.history.pushState(
       null,
       '',
       `/dashboard/ai-chat/${newConversation.id}`
     );

     return newConversation.id;
   }
   ```

### Phase 3: URL Update Without Reload

**Critical Insight**: `window.history.pushState()` changes URL without triggering navigation:

```tsx
// URL changes from "/dashboard/ai-chat" to "/dashboard/ai-chat/[conversationId]"
window.history.pushState(null, '', `/dashboard/ai-chat/${newConversation.id}`);

// This triggers React re-render because:
// 1. usePathname() detects URL change
// 2. ConversationSessionProvider updates conversationId
// 3. Components re-render with new conversationId
```

### Phase 4: TanStack Query Optimistic Updates

**Optimistic Conversation Creation with TanStack Query**:

```tsx
// 1. Create optimistic conversation in UI immediately
const optimisticConversation = {
  id: `optimistic-${Date.now()}`,
  teacher_id: teacherId,
  student_id: null,
  title: title || 'New Conversation',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// TanStack Query handles optimistic updates automatically
queryClient.setQueryData(['conversations', teacherId], (old) => [
  optimisticConversation,
  ...(old || []),
]);

// 2. Create real conversation via Supabase
const { data: conversation, error } = await supabase
  .from('ai_conversations')
  .insert({
    teacher_id: teacherId,
    student_id: studentId,
    title: title || 'New Conversation',
  })
  .select()
  .single();

// 3. TanStack Query automatically replaces optimistic with real data
```

**TanStack Query Storage**:

```tsx
// Immediate cache update
queryClient.setQueryData(['conversations', teacherId], newData);

// Background database persistence via Supabase
const { data, error } = await supabase
  .from('ai_conversations')
  .insert(conversationData)
  .select();
```

### Phase 5: AI Streaming with useChat

The application uses AI SDK's `useChat` hook for streaming:

```tsx
const { messages, input, handleSubmit, status, setMessages, setInput } =
  useChat({
    api: '/api/chat',
    initialMessages,
    onFinish: cacheAndAddMessage, // Cache completed messages
    onError: handleError,
  });
```

**Streaming Process**:

1. **User message** already optimistically added
2. **API call** with chat context:
   ```tsx
   const options = {
     body: {
       chatId: currentChatId,
       userId: uid,
       model: selectedModel,
       isAuthenticated,
       systemPrompt,
       enableSearch,
     },
     experimental_attachments: attachments,
   };
   handleSubmit(undefined, options);
   ```
3. **Assistant response streams** in real-time via `useChat`
4. **Final message cached** via `onFinish` callback

## Data Loading Strategy with TanStack Query

### Messages Provider with TanStack Query

```tsx
export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { conversationId } = useConversationSession();

  // Load messages for current conversation
  const {
    data: messages = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async (): Promise<AiMessage[]> => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
    staleTime: 1 * 60 * 1000, // 1 minute - shows cached data immediately
    refetchOnWindowFocus: false,
  });

  return (
    <MessagesContext.Provider value={{ messages, isLoading, error }}>
      {children}
    </MessagesContext.Provider>
  );
}
```

### Conversations Provider with TanStack Query

```tsx
export function ConversationsProvider({ children, teacherId }) {
  const {
    data: conversations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['conversations', teacherId],
    queryFn: async (): Promise<ConversationWithMessages[]> => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select(
          `
          *,
          messages:ai_messages(
            id,
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
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - background sync
    refetchOnWindowFocus: true,
  });

  return (
    <ConversationsContext.Provider value={{ conversations, isLoading }}>
      {children}
    </ConversationsContext.Provider>
  );
}
```

### URL Reactivity Without Reloads

### How URL Changes Trigger React Updates

1. **URL Change**: `window.history.pushState()` changes browser URL
2. **Next.js Detection**: `usePathname()` hook detects pathname change
3. **Context Update**: `ConversationSessionProvider` computes new `conversationId`
4. **Component Re-renders**: All consumers of `useConversationSession()` update
5. **Data Loading**: `MessagesProvider` sees new `conversationId`, loads messages via TanStack Query

### Why No Page Reload Occurs

- **No navigation event**: `pushState` only changes URL, doesn't trigger navigation
- **React handles updates**: State changes cause re-renders, not page loads
- **SPA architecture**: Everything stays in the same page context

## Complete CRUD Operations for Your Database

### 1. Conversation CRUD Operations

#### Create Conversation

```tsx
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teacherId,
      studentId = null,
      title,
      firstMessage,
    }) => {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          teacher_id: teacherId,
          student_id: studentId,
          title: title || 'New Conversation',
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add first message if provided
      if (firstMessage) {
        const { data: message, error: msgError } = await supabase
          .from('ai_messages')
          .insert({
            conversation_id: conversation.id,
            content: firstMessage,
            sender: 'teacher',
            metadata: null,
          })
          .select()
          .single();

        if (msgError) throw msgError;
      }

      return conversation;
    },
    onSuccess: (conversation, { teacherId }) => {
      // Invalidate conversations list to show new conversation
      queryClient.invalidateQueries({ queryKey: ['conversations', teacherId] });
    },
  });
}
```

#### Read Conversations (with Preview)

```tsx
export function useConversationHistory(teacherId: string) {
  return useQuery({
    queryKey: ['conversations', teacherId],
    queryFn: async (): Promise<ConversationWithPreview[]> => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select(
          `
          id,
          teacher_id,
          student_id,
          title,
          created_at,
          updated_at,
          messages:ai_messages(
            id,
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

#### Update Conversation Title

```tsx
export function useUpdateConversationTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      title,
    }: {
      conversationId: string;
      title: string;
    }) => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .update({
          title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ conversationId, title }) => {
      // Optimistically update the title in cache
      queryClient.setQueriesData(
        { queryKey: ['conversations'] },
        (old: ConversationWithPreview[] | undefined) => {
          if (!old) return old;
          return old.map((conv) =>
            conv.id === conversationId
              ? { ...conv, title, updated_at: new Date().toISOString() }
              : conv
          );
        }
      );
    },
    onSettled: (data, error, { conversationId }) => {
      // Invalidate specific conversation queries
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}
```

#### Delete Conversation

```tsx
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (conversationId: string) => {
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
    onSuccess: (conversationId, _, context) => {
      // Navigate away if we're currently viewing this conversation
      const currentPath = window.location.pathname;
      if (currentPath.includes(conversationId)) {
        router.push('/dashboard/ai-chat');
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.removeQueries({ queryKey: ['messages', conversationId] });
    },
  });
}
```

### 2. Message CRUD Operations

#### Create Message (with Optimistic Updates)

```tsx
export function useAddMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newMessage: Omit<AiMessage, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert(newMessage)
        .select()
        .single();

      if (error) throw error;
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
    },
  });
}
```

#### Update Message (Edit)

```tsx
export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      content,
      metadata,
    }: {
      messageId: string;
      content?: string;
      metadata?: any;
    }) => {
      const updateData: any = {};
      if (content !== undefined) updateData.content = content;
      if (metadata !== undefined) updateData.metadata = metadata;

      const { data, error } = await supabase
        .from('ai_messages')
        .update(updateData)
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ messageId, content, metadata }) => {
      // Find which conversation this message belongs to
      const conversationQueries = queryClient.getQueriesData({
        queryKey: ['messages'],
      });

      let conversationId: string | null = null;

      for (const [queryKey, messages] of conversationQueries) {
        if (Array.isArray(messages)) {
          const message = messages.find((m: AiMessage) => m.id === messageId);
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
            msg.id === messageId
              ? {
                  ...msg,
                  ...(content !== undefined && { content }),
                  ...(metadata !== undefined && { metadata }),
                }
              : msg
          )
      );

      return { conversationId };
    },
    onSettled: (data, error, variables, context) => {
      if (context?.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ['messages', context.conversationId],
        });
      }
    },
  });
}
```

#### Delete Message

```tsx
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
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
    onSettled: (data, error, messageId, context) => {
      if (context?.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ['messages', context.conversationId],
        });
        // Update conversation list in case this was the last message
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });
}
```

### 3. Conversation History Component with CRUD

```tsx
export function ConversationHistory() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: conversations = [], isLoading } = useConversationHistory(
    user.id
  );
  const deleteConversation = useDeleteConversation();
  const updateTitle = useUpdateConversationTitle();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleConversationClick = (conversationId: string) => {
    router.push(`/dashboard/ai-chat/${conversationId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation.mutate(conversationId);
    }
  };

  const handleEditClick = (
    e: React.MouseEvent,
    conversation: AiConversation
  ) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditTitle(conversation.title || '');
  };

  const handleSaveTitle = (conversationId: string) => {
    updateTitle.mutate({ conversationId, title: editTitle });
    setEditingId(null);
  };

  if (isLoading) {
    return <ConversationHistorySkeleton />;
  }

  return (
    <div className='space-y-2'>
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => handleConversationClick(conversation.id)}
          className='group cursor-pointer rounded-lg border p-4 hover:bg-gray-50'
        >
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              {editingId === conversation.id ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle(conversation.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={() => handleSaveTitle(conversation.id)}
                  className='rounded border px-2 py-1 text-sm font-medium'
                  autoFocus
                />
              ) : (
                <h3 className='text-sm font-medium'>
                  {conversation.title || 'Untitled Conversation'}
                </h3>
              )}

              {conversation.last_message && (
                <p className='mt-1 truncate text-xs text-gray-600'>
                  {conversation.last_message.content}
                </p>
              )}

              {/* Message preview */}
              {conversation.preview && conversation.preview.length > 0 && (
                <div className='mt-2 space-y-1'>
                  {conversation.preview.map((msg) => (
                    <div
                      key={msg.id}
                      className='truncate text-xs text-gray-500'
                    >
                      <span className='font-medium'>
                        {msg.sender === 'teacher' ? 'You' : 'AI'}:
                      </span>{' '}
                      {msg.content}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <div className='text-xs text-gray-500'>
                <div>{formatRelativeTime(conversation.updated_at)}</div>
                <div>{conversation.message_count} messages</div>
              </div>

              {/* Action buttons - only show on hover */}
              <div className='flex gap-1 opacity-0 group-hover:opacity-100'>
                <button
                  onClick={(e) => handleEditClick(e, conversation)}
                  className='rounded p-1 hover:bg-gray-200'
                  title='Edit title'
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, conversation.id)}
                  className='rounded p-1 text-red-600 hover:bg-red-100'
                  title='Delete conversation'
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Error Handling & Rollback

```tsx
try {
  const newChat = await createNewChatFromDb(
    userId,
    title,
    model,
    isAuthenticated
  );

  // Replace optimistic with real
  setChats((prev) => [newChat, ...prev.filter((c) => c.id !== optimisticId)]);

  return newChat;
} catch {
  // Rollback optimistic changes
  setChats(prev); // Restore previous state
  toast({ title: 'Failed to create chat', status: 'error' });
}
```

## Multi-Model Chat Support

The app also supports multi-model conversations:

```tsx
// Each model gets its own useChat instance
const chatHooks = Array.from({ length: MAX_MODELS }, (_, index) =>
  useChat({
    api: '/api/chat',
    onError: (error) => {
      const model = models[index];
      if (model) {
        toast({
          title: `Error with ${model.name}`,
          description: error.message,
          status: 'error',
        });
      }
    },
  })
);

// All models respond to same user message
await Promise.all(
  selectedChats.map(async (chat) => {
    const options = {
      body: {
        chatId: chatIdToUse,
        userId: uid,
        model: chat.model.id,
        isAuthenticated: !!user?.id,
        systemPrompt: systemPrompt,
        message_group_id, // Groups responses together
      },
    };

    chat.append({ role: 'user', content: prompt }, options);
  })
);
```

## Database Schema Integration

### ai_conversations Table

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  student_id UUID REFERENCES students(id), -- Optional: only when specific student context is needed
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ai_messages Table

```sql
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id),
  content TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'teacher' or 'assistant'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Complete Implementation Guide

### 1. Conversation History & Loading

#### TypeScript Types (based on your database schema)

```tsx
interface AiConversation {
  id: string;
  teacher_id: string;
  student_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

interface AiMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender: 'teacher' | 'assistant';
  metadata: any | null;
  created_at: string;
}

interface ConversationWithMessages extends AiConversation {
  messages: AiMessage[];
  last_message?: AiMessage;
  message_count: number;
}
```

#### Conversation History Hook with TanStack Query

```tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useConversationHistory(teacherId: string) {
  return useQuery({
    queryKey: ['conversations', teacherId],
    queryFn: async (): Promise<ConversationWithMessages[]> => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select(
          `
          *,
          messages:ai_messages(
            id,
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
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keeps data in cache
  });
}
```

#### Conversation History Component

```tsx
export function ConversationHistory() {
  const { user } = useAuth();
  const { data: conversations = [], isLoading } = useConversationHistory(
    user.id
  );
  const router = useRouter();

  const handleConversationClick = (conversationId: string) => {
    // This triggers the URL update without reload
    router.push(`/dashboard/ai-chat/${conversationId}`);
  };

  if (isLoading) {
    return <ConversationHistorySkeleton />;
  }

  return (
    <div className='space-y-2'>
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => handleConversationClick(conversation.id)}
          className='cursor-pointer rounded-lg border p-4 hover:bg-gray-50'
        >
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium'>
                {conversation.title || 'Untitled Conversation'}
              </h3>
              {conversation.last_message && (
                <p className='mt-1 truncate text-xs text-gray-600'>
                  {conversation.last_message.content}
                </p>
              )}
            </div>
            <div className='ml-4 text-xs text-gray-500'>
              <div>{formatRelativeTime(conversation.updated_at)}</div>
              <div>{conversation.message_count} messages</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 2. Loading Specific Conversation (When Clicking from History)

#### Conversation Messages Hook

```tsx
export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async (): Promise<AiMessage[]> => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
}
```

#### Messages Provider with TanStack Query

```tsx
export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { conversationId } = useConversationSession();
  const queryClient = useQueryClient();

  // Fetch messages for current conversation
  const {
    data: messages = [],
    isLoading,
    error,
  } = useConversationMessages(conversationId);

  // Optimistic message mutation
  const addMessageMutation = useMutation({
    mutationFn: async (newMessage: Omit<AiMessage, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert(newMessage)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['messages', conversationId],
      });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData([
        'messages',
        conversationId,
      ]);

      // Optimistically add message
      const optimisticMessage: AiMessage = {
        ...newMessage,
        id: `optimistic-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(
        ['messages', conversationId],
        (old: AiMessage[] = []) => [...old, optimisticMessage]
      );

      return { previousMessages, optimisticMessage };
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['messages', conversationId],
        context?.previousMessages
      );
      toast.error('Failed to send message');
    },
    onSettled: () => {
      // Always invalidate after error or success
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  const contextValue = {
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
```

### 3. Creating New Conversations

#### New Conversation Hook

```tsx
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      teacherId,
      studentId = null,
      title,
      firstMessage,
    }: {
      teacherId: string;
      studentId?: string | null;
      title?: string;
      firstMessage: string;
    }) => {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          teacher_id: teacherId,
          student_id: studentId,
          title: title || 'New Conversation',
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add first message
      const { data: message, error: msgError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversation.id,
          content: firstMessage,
          sender: 'teacher',
          metadata: null,
        })
        .select()
        .single();

      if (msgError) throw msgError;

      return { conversation, firstMessage: message };
    },
    onMutate: async ({ teacherId, title, firstMessage }) => {
      // Create optimistic conversation
      const optimisticConversation: AiConversation = {
        id: `optimistic-${Date.now()}`,
        teacher_id: teacherId,
        student_id: null,
        title: title || 'New Conversation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Update conversations list optimistically
      await queryClient.cancelQueries({
        queryKey: ['conversations', teacherId],
      });
      const previousConversations = queryClient.getQueryData([
        'conversations',
        teacherId,
      ]);

      queryClient.setQueryData(
        ['conversations', teacherId],
        (old: ConversationWithMessages[] = []) => [
          {
            ...optimisticConversation,
            messages: [],
            message_count: 0,
          },
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
```

#### Chat Input Component for New Conversations

```tsx
export function ChatInput() {
  const { user } = useAuth();
  const { conversationId } = useConversationSession();
  const { addMessage } = useMessages();
  const createConversation = useCreateConversation();

  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsSubmitting(true);

    try {
      if (conversationId) {
        // Add message to existing conversation
        addMessage({
          conversation_id: conversationId,
          content: input,
          sender: 'teacher',
          metadata: null,
        });
      } else {
        // Create new conversation with first message
        await createConversation.mutateAsync({
          teacherId: user.id,
          firstMessage: input,
          title: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
        });
      }

      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex gap-2'>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder='Type your message...'
        disabled={isSubmitting}
        className='flex-1 rounded border p-2'
      />
      <button
        onClick={handleSubmit}
        disabled={!input.trim() || isSubmitting}
        className='rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50'
      >
        {isSubmitting ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
```

### 4. Complete URL Flow Integration

#### Session Provider (URL Tracking)

```tsx
export function ConversationSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const conversationId = useMemo(() => {
    if (pathname?.startsWith('/dashboard/ai-chat/')) {
      const id = pathname.split('/dashboard/ai-chat/')[1];
      return id === 'new' ? null : id; // 'new' also means clean chat
    }
    return null; // No conversationId = clean chat
  }, [pathname]);

  return (
    <ConversationSessionContext.Provider value={{ conversationId }}>
      {children}
    </ConversationSessionContext.Provider>
  );
}
```

### URL States Explained:

1. **Clean Chat**:

   - `/dashboard/ai-chat` → `conversationId = null`
   - `/dashboard/ai-chat/new` → `conversationId = null`
   - Ready to create new conversation

2. **Existing Conversation**:
   - `/dashboard/ai-chat/[uuid]` → `conversationId = uuid`
   - Loads existing conversation messages

````

#### Complete Flow Summary

1. **Starting New Conversation (Clean Chat)**:
   - URL: `/dashboard/ai-chat` (conversationId = null)
   - Teacher types first message → Creates conversation → URL becomes `/dashboard/ai-chat/[id]`

2. **Loading from History**:
   - Click conversation → `router.push('/dashboard/ai-chat/[id]')`
   - URL changes → `ConversationSessionProvider` updates → `MessagesProvider` loads messages via TanStack Query

3. **Back to Clean Chat**:
   - Navigate to `/dashboard/ai-chat` → `conversationId = null` → Empty chat ready for new conversation

4. **Optimistic Updates**: All mutations use TanStack Query's optimistic update pattern with automatic rollback on errors

5. **Caching**: TanStack Query handles all caching, background sync, and invalidation automatically

### Chat State Logic:

```tsx
const { conversationId } = useConversationSession()

// Clean chat state - ready for new conversation
if (!conversationId) {
  // Show empty chat interface
  // First message will create new conversation
}

// Existing conversation state
if (conversationId) {
  // Load and display conversation messages
  // Continue existing conversation
}
````

## Key Files & Functions

### Core Hooks

- `useConversationHistory` - Loads all teacher's conversations with TanStack Query
- `useConversationMessages` - Loads messages for specific conversation
- `useCreateConversation` - Creates new conversations with optimistic updates
- `useChat` (AI SDK) - Streaming chat functionality

### Context Providers

- `ConversationsProvider` - Global conversation list management via TanStack Query
- `MessagesProvider` - Current conversation message management with optimistic updates
- `ConversationSessionProvider` - URL-based conversationId extraction

### API Endpoints

- `/api/chat` - Streaming AI responses
- Direct Supabase queries for conversations and messages

### Storage Layers

- **TanStack Query** - Intelligent caching, background sync, optimistic updates
- **Supabase** - Direct database queries to `ai_conversations` and `ai_messages` tables

## Performance Optimizations

1. **TanStack Query Cache**: Automatic stale-while-revalidate caching strategy
2. **Background Sync**: Fetch fresh data without blocking UI
3. **Optimistic Updates**: UI updates before server confirmation with automatic rollback
4. **Smart Invalidation**: Only refetch when necessary based on query keys
5. **React Memoization**: Prevent unnecessary re-renders

## Summary: The Magic Behind the Seamless Experience

1. **Optimistic Updates**: UI updates instantly before server confirmation via TanStack Query
2. **History API**: URL changes without page reloads via `pushState`
3. **React Context**: URL changes trigger reactive state updates
4. **TanStack Query**: Intelligent caching with automatic background sync and optimistic updates
5. **AI SDK Integration**: Streaming responses with built-in state management
6. **Error Recovery**: Automatic rollback mechanisms for failed operations
7. **Teacher-Student Context**: Conversations optionally linked to specific students via `student_id`

The result is a conversation experience that feels instant and never shows loading states during normal operation, while maintaining data consistency between client cache and remote database.

## Flow Diagram

```

```

Teacher Types Message
↓
Optimistic UI Update (instant) - TanStack Query
↓
Create Conversation (if first message)

- Insert into ai_conversations table
- Link teacher_id and optionally student_id
  ↓
  Update URL via pushState (no reload)
- /dashboard/ai-chat/[conversationId]
  ↓
  usePathname() detects change
  ↓
  ConversationSessionProvider updates conversationId
  ↓
  TanStack Query loads conversation messages
- Query ai_messages WHERE conversation_id = ?
- Uses cached data first, then background sync
  ↓
  AI streaming response begins
- Insert teacher message into ai_messages
- Stream assistant response
- Insert final assistant message
  ↓
  TanStack Query automatic cache invalidation
  ↓
  Background sync updates with final data

````

### Key Points for Zero Page Reloads:

1. **Initial Load**: TanStack Query shows cached data instantly, no loading spinners
2. **URL Changes**: `pushState` + React Context = instant updates, never `window.location`
3. **Message Sending**: Optimistic updates mean UI updates before server response
4. **Conversation Switching**: `router.push()` triggers React re-renders, not page navigation
5. **Background Sync**: All server calls happen behind the scenes while UI stays responsive

**The Result**: Teachers can click conversations, send messages, and navigate with **zero page reloads** - everything feels like a native desktop app.```

This architecture ensures that teachers never experience loading states or page reloads during normal conversation interactions, creating a native app-like experience in the browser while maintaining proper teacher-student relationship context when needed.
````
