'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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

// Optimized version - assumes middleware already verified auth
export async function getProfileOptimized() {
  const supabase = await createClient();
  
  // No auth check needed - middleware already did this
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id) // user exists due to middleware
    .single();
    
  return profile;
}

// Combine profile and school fetching in single query
export async function getProfileWithSchool() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Single query with join to get both profile and school
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      schools:school_id (*)
    `)
    .eq('id', user!.id)
    .single();
    
  if (error || !data) {
    console.error('Error fetching profile with school:', error?.message);
    throw new Error('Failed to fetch profile data');
  }
    
  return {
    profile: data,
    school: data.schools
  };
}
