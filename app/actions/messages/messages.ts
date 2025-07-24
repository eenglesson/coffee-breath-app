'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/database.types';
import { revalidatePath } from 'next/cache';

// Type aliases for convenience
type Message = Database['public']['Tables']['ai_messages']['Row'];
type MessageInsert = Database['public']['Tables']['ai_messages']['Insert'];

export async function addMessageToConversation(
  conversationId: string,
  content: string,
  sender: 'user' | 'assistant',
  metadata?: Database['public']['Tables']['ai_messages']['Row']['metadata']
): Promise<Message> {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser || !authUser.user) {
    throw new Error('Unauthorized');
  }

  // Verify conversation belongs to user
  const { data: conversation } = await supabase
    .from('ai_conversations')
    .select('teacher_id')
    .eq('id', conversationId)
    .eq('teacher_id', authUser.user.id)
    .single();

  if (!conversation) {
    throw new Error('Conversation not found or unauthorized');
  }

  const insertData: MessageInsert = {
    conversation_id: conversationId,
    content,
    sender,
    metadata: metadata || null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('ai_messages')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add message: ${error.message}`);
  }

  // Update conversation's updated_at timestamp
  await supabase
    .from('ai_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  revalidatePath(`/dashboard/create-questions/${conversationId}`);
  return data;
}

export async function getConversationMessages(
  conversationId: string
): Promise<Message[]> {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser || !authUser.user) {
    throw new Error('Unauthorized');
  }

  // Verify conversation belongs to user
  const { data: conversation } = await supabase
    .from('ai_conversations')
    .select('teacher_id')
    .eq('id', conversationId)
    .eq('teacher_id', authUser.user.id)
    .single();

  if (!conversation) {
    throw new Error('Conversation not found or unauthorized');
  }

  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  return data;
}
