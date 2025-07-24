import CreateQuestionsClient from './page-client';
import { getConversationById } from '@/app/actions/conversations/conversations';
import { getConversationMessages } from '@/app/actions/messages/messages';
import { redirect } from 'next/navigation';
import { Database } from '@/database.types';

type Message = Database['public']['Tables']['ai_messages']['Row'];

interface CreateQuestionsPageProps {
  params: Promise<{
    conversationId?: string[];
  }>;
}

export default async function CreateQuestionsPage({
  params,
}: CreateQuestionsPageProps) {
  const { conversationId: conversationIdArray } = await params;
  const conversationId = conversationIdArray?.[0];
  let conversation = null;
  let messages: Message[] = [];

  // If we have a conversation ID, fetch the conversation and messages
  if (conversationId) {
    try {
      conversation = await getConversationById(conversationId);

      if (!conversation) {
        // Conversation doesn't exist or user doesn't have access, redirect to new chat
        redirect('/dashboard/create-questions');
      }

      messages = await getConversationMessages(conversationId);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      redirect('/dashboard/create-questions');
    }
  }

  return (
    <CreateQuestionsClient
      conversationId={conversationId}
      initialMessages={messages}
    />
  );
}
