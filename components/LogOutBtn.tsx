'use client';

import { createClient } from '@/lib/supabase/client';
import { LogOutIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogoutBtn() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error.message);
        return;
      }
      // Redirect to homepage or login page after logout
      router.push('/auth/login');
      router.refresh(); // Refresh to update UI (e.g., remove user-specific content)
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    }
  };

  return (
    <div
      onClick={handleLogout}
      className='flex items-center gap-2 text-destructive w-full h-full'
    >
      <LogOutIcon className='text-destructive' />
      <span>Logout</span>
    </div>
  );
}
