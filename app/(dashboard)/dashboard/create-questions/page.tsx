import { ChatImplementationExample } from '@/lib/examples/ChatImplementationExample';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function page() {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser || !authUser.user) {
    redirect('/auth/login');
  }
  console.log(authUser);

  return (
    <div>
      <ChatImplementationExample teacherId={authUser.user?.id} />
    </div>
  );
}
