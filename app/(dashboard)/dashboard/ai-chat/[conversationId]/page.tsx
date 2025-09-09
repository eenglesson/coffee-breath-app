import ChatInterface from '@/app/components/chat/chat-interface';

interface PageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  // Auth is handled by middleware - no need for redundant checks

  return (
    <div className='h-full w-full'>
      <ChatInterface conversationId={conversationId} />
    </div>
  );
}
