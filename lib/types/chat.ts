import { Database } from '@/database.types';

// Type aliases based on database schema
export type AiConversation =
  Database['public']['Tables']['ai_conversations']['Row'];
export type AiConversationInsert =
  Database['public']['Tables']['ai_conversations']['Insert'];
export type AiConversationUpdate =
  Database['public']['Tables']['ai_conversations']['Update'];

export type AiMessage = Database['public']['Tables']['ai_messages']['Row'];
export type AiMessageInsert =
  Database['public']['Tables']['ai_messages']['Insert'];
export type AiMessageUpdate =
  Database['public']['Tables']['ai_messages']['Update'];

// Extended types for UI
export interface ConversationWithMessages extends AiConversation {
  messages: AiMessage[];
  last_message?: AiMessage;
  message_count: number;
}

export interface ConversationWithPreview extends AiConversation {
  messages: AiMessage[];
  last_message?: AiMessage;
  message_count: number;
  preview: AiMessage[]; // Last 3 messages for preview
}

// Optimistic update types
export interface OptimisticMessage
  extends Omit<AiMessage, 'id' | 'created_at'> {
  id: string;
  created_at: string;
}

export interface OptimisticConversation
  extends Omit<AiConversation, 'id' | 'created_at' | 'updated_at'> {
  id: string;
  created_at: string;
  updated_at: string;
}

// API response types
export interface CreateConversationResponse {
  conversation: AiConversation;
  firstMessage?: AiMessage;
}

// Context types
export interface ConversationSessionContextType {
  conversationId: string | null;
}

export interface ConversationsContextType {
  conversations: ConversationWithPreview[];
  isLoading: boolean;
  error: Error | null;
}

export interface MessagesContextType {
  messages: AiMessage[];
  isLoading: boolean;
  error: Error | null;
  addMessage: (message: Omit<AiMessage, 'id' | 'created_at'>) => void;
  isAddingMessage: boolean;
}

// Hook parameter types
export interface CreateConversationParams {
  teacherId: string;
  studentId?: string | null;
  title?: string;
  firstMessage: string;
}

export interface UpdateConversationTitleParams {
  conversationId: string;
  title: string;
}

export interface UpdateMessageParams {
  messageId: string;
  content?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}
