import ChatInterface from '@/app/components/chat/chat-interface';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser || !authUser.user) {
    redirect('/auth/login');
  }

  return (
    <div className='h-full w-full'>
      <ChatInterface conversationId={conversationId} />
    </div>
  );
}
