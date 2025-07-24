import { createClient } from '@/lib/supabase/server';

export async function getSchoolYears() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('schools').select('school_year');

  if (error) {
    console.error('Error fetching school years:', error.message);
    return [];
  }

  console.log('Fetched school years:', data);

  return data;
}
