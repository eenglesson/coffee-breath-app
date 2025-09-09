import ChatInterface from '@/app/components/chat/chat-interface';

export default async function page() {
  // Auth is handled by middleware - no need for redundant checks
  return (
    <div className='h-full w-full'>
      <ChatInterface />
    </div>
  );
}
