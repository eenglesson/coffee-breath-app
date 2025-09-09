import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/database.types';

export async function getSchoolYears() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  // Only return school years for the authenticated user's school
  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) {
    throw new Error('User profile or school not found');
  }

  const { data, error } = await supabase
    .from('schools')
    .select('school_year')
    .eq('id', profile.school_id);

  if (error) {
    console.error('Error fetching school years:', error.message);
    return [];
  }

  console.log('Fetched school years:', data);
  return data;
}

export async function getUserSchool(): Promise<Tables<'schools'> | null> {
  const supabase = await createClient();

  // First get the current user's profile to get their school_id
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error fetching user:', userError?.message);
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.school_id) {
    console.error(
      'Error fetching user profile or school_id:',
      profileError?.message
    );
    return null;
  }

  // Now fetch the complete school information
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('*')
    .eq('id', profile.school_id)
    .single();

  if (schoolError) {
    console.error('Error fetching school information:', schoolError.message);
    return null;
  }

  return school;
}
