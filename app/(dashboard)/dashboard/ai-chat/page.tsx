import ChatInterface from '@/app/components/chat/chat-interface';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function page() {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser || !authUser.user) {
    redirect('/auth/login');
  }

  return (
    <div className='h-full w-full'>
      <ChatInterface />
    </div>
  );
}
