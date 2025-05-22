// lib/supabase/client-service.ts

import { Tables } from '@/database.types';
import { createClient } from './supabase/client';

export async function getAllStudents() {
  const supabase = createClient();
  const { data, error } = await supabase.from('students').select('*');

  if (error) {
    throw new Error(`Error fetching students: ${error.message}`);
  }

  return data as Tables<'students'>[];
}
