'use server';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export async function getAuthenticatedProfile() {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  if (!authUser || !authUser.user) {
    redirect('/auth/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Error fetching profile:', profileError.message);
    redirect('/auth/login');
  }

  if (!profile) {
    console.error('No profile found for user:', authUser.user.id);
    redirect('/auth/login');
  }

  return profile;
}
