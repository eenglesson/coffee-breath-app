# TanStack Query Chat Implementation

This directory contains the complete TanStack Query implementation for the Teacher AI chat system, following the architecture described in `CHAT_ARCHITECTURE.md`.

## 📁 File Structure

```
lib/
├── types/
│   └── chat.ts                     # TypeScript types for chat functionality
├── context/
│   ├── ConversationSessionContext.tsx  # URL-based conversationId tracking
│   ├── ConversationsContext.tsx         # Conversations state management
│   ├── MessagesContext.tsx             # Messages state management
│   └── index.ts                        # Export all contexts
├── hooks/
│   └── chat/
│       ├── useConversations.ts         # Conversation CRUD hooks
│       ├── useMessages.ts              # Message CRUD hooks
│       └── index.ts                    # Export all hooks
└── examples/
    └── ChatImplementationExample.tsx   # Complete usage example
```

## 🚀 Quick Start

### 1. Provider Setup

Wrap your app with the providers in this hierarchy:

```tsx
import {
  ConversationSessionProvider,
  ConversationsProvider,
  MessagesProvider,
} from '@/lib/context';

function App() {
  const { user } = useAuth(); // Your auth implementation

  return (
    <ConversationSessionProvider>
      <ConversationsProvider teacherId={user.id}>
        <MessagesProvider>
          <YourChatComponents />
        </MessagesProvider>
      </ConversationsProvider>
    </ConversationSessionProvider>
  );
}
```

### 2. Using the Hooks

#### Get current conversation state:

```tsx
import { useConversationSession } from '@/lib/context';

function ChatComponent() {
  const { conversationId } = useConversationSession();

  // conversationId is null for clean chat, string for existing conversation
  if (!conversationId) {
    // Show new chat interface
  } else {
    // Show existing conversation
  }
}
```

#### Access conversations:

```tsx
import { useConversations } from '@/lib/context';

function ConversationList() {
  const { conversations, isLoading, error } = useConversations();

  return (
    <div>
      {conversations.map((conv) => (
        <div key={conv.id}>
          {conv.title} ({conv.message_count} messages)
        </div>
      ))}
    </div>
  );
}
```

#### Access messages:

```tsx
import { useMessages } from '@/lib/context';

function MessagesList() {
  const { messages, isLoading, addMessage } = useMessages();

  const handleSendMessage = () => {
    addMessage({
      conversation_id: conversationId,
      content: 'Hello!',
      sender: 'teacher',
      metadata: null,
    });
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

#### Create new conversations:

```tsx
import { useCreateConversation } from '@/lib/hooks/chat';

function NewChatButton() {
  const createConversation = useCreateConversation();
  const { user } = useAuth();

  const handleCreateChat = async () => {
    await createConversation.mutateAsync({
      teacherId: user.id,
      firstMessage: 'Hello, I need help with...',
      title: 'New Question',
    });
    // Automatically navigates to new conversation
  };

  return (
    <button onClick={handleCreateChat}>
      {createConversation.isPending ? 'Creating...' : 'New Chat'}
    </button>
  );
}
```

## 🎯 Key Features

### ✅ Optimistic Updates

All mutations use optimistic updates - the UI updates immediately before server confirmation:

```tsx
// When you send a message, it appears instantly
addMessage({ content: 'Hello!' });
// ↑ Shows in UI immediately, syncs to server in background
```

### ✅ URL-Based State Management

The conversation state is derived from the URL:

```tsx
// Clean chat state
/dashboard/ai-chat → conversationId = null

// Existing conversation
/dashboard/ai-chat/uuid → conversationId = uuid
```

### ✅ Smart Caching

TanStack Query handles intelligent caching:

- **Stale-while-revalidate**: Shows cached data immediately, fetches fresh data in background
- **Background sync**: Updates data without showing loading states
- **Automatic invalidation**: Related queries update when data changes

### ✅ Error Handling with Rollback

Failed operations automatically rollback optimistic updates:

```tsx
// If message send fails, it's automatically removed from UI
// If conversation creation fails, optimistic conversation is removed
// User sees error toast, UI reverts to previous state
```

## 🔧 Available Hooks

### Conversation Hooks

- `useConversationHistory(teacherId)` - Load all conversations
- `useCreateConversation()` - Create new conversation with optimistic updates
- `useUpdateConversationTitle()` - Update conversation title
- `useDeleteConversation()` - Delete conversation with navigation handling

### Message Hooks

- `useConversationMessages(conversationId)` - Load messages for conversation
- `useAddMessage()` - Add message with optimistic updates
- `useUpdateMessage()` - Update message content/metadata
- `useDeleteMessage()` - Delete message

### Context Hooks

- `useConversationSession()` - Get current conversationId from URL
- `useConversations()` - Access conversations list and loading state
- `useMessages()` - Access current conversation messages and actions

## 📱 URL Flow Examples

### Starting New Conversation

1. User visits `/dashboard/ai-chat` (conversationId = null)
2. User types first message
3. `useCreateConversation` creates conversation + first message
4. URL updates to `/dashboard/ai-chat/[id]` via `router.push()`
5. `useConversationSession` detects URL change, updates conversationId
6. `useMessages` loads messages for new conversationId
7. All happens without page reload ✨

### Loading Existing Conversation

1. User clicks conversation in history
2. `router.push('/dashboard/ai-chat/[id]')` changes URL
3. `useConversationSession` extracts conversationId from URL
4. `useMessages` automatically loads messages via TanStack Query
5. Cached data shows immediately, fresh data loads in background
6. No loading spinners for cached conversations ✨

## 🛠 TypeScript Support

All hooks and components are fully typed:

```tsx
// Types are automatically inferred
const { conversations } = useConversations();
//      ^ ConversationWithPreview[]

const { messages } = useMessages();
//      ^ AiMessage[]

// Parameters are type-checked
createConversation.mutate({
  teacherId: string, // ✅ Required
  firstMessage: string, // ✅ Required
  title: string, // ✅ Optional
  studentId: string, // ✅ Optional
});
```

## 🎨 Integration with Existing Code

This implementation is designed to work alongside your existing server actions. You can:

1. **Migrate gradually**: Use TanStack Query hooks for new features, keep server actions for existing code
2. **Mix approaches**: Server actions for complex operations, TanStack Query for simple CRUD
3. **Full migration**: Replace all server actions with TanStack Query hooks over time

## 📋 Next Steps

1. **Install dependencies** (if not already installed):

   ```bash
   npm install @tanstack/react-query sonner
   ```

2. **Update your root layout** to include the providers:

   ```tsx
   // In your root layout or main App component
   <TanstackQueryProvider>
     <ConversationSessionProvider>
       <ConversationsProvider teacherId={user.id}>
         <MessagesProvider>{children}</MessagesProvider>
       </ConversationsProvider>
     </ConversationSessionProvider>
   </TanstackQueryProvider>
   ```

3. **Replace existing chat components** with the new hooks:

   - Use `useMessages()` instead of direct database calls
   - Use `useConversations()` for conversation lists
   - Use `useCreateConversation()` for new conversations

4. **Test the optimistic updates**:
   - Send messages offline to see optimistic behavior
   - Create conversations and watch URL changes
   - Try error scenarios to see rollback behavior

The result will be a native app-like experience with zero page reloads and instant UI updates! 🚀
