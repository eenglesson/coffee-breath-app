'use server';
import { Tables } from '@/database.types';
import { createClient } from '@/lib/supabase/server';

// Get students - RLS handles school filtering automatically
export async function getStudents() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .limit(30); // RLS policies automatically filter by user's school
    
  if (error) {
    throw new Error(`Error fetching students: ${error.message}`);
  }
  
  return data || [];
}

// Get all students - RLS handles school filtering automatically
export async function getAllStudents() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('students')
    .select('*'); // RLS policies automatically filter by user's school
    
  if (error) {
    throw new Error(`Error fetching students: ${error.message}`);
  }
  
  return data || [];
}

// Search students - RLS handles school filtering automatically
export async function searchStudents(query: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .or(`full_name.ilike.%${query}%,school_year.ilike.%${query}%`)
    .limit(5); // RLS policies automatically filter by user's school
    
  if (error) {
    throw new Error(`Error fetching based on query: ${error.message}`);
  }
  
  return data || [];
}

// Create a new student - RLS handles school assignment
export async function createStudent(input: Tables<'students'>) {
  const supabase = await createClient();
  
  const insertData = {
    full_name: input.full_name,
    school_year: input.school_year,
    interests: input.interests,
    learning_difficulties: input.learning_difficulties,
    student_badge: input.student_badge,
    // RLS will automatically set correct school_id based on authenticated user
  };

  const { error } = await supabase.from('students').insert(insertData);

  if (error) {
    throw new Error(error.message);
  }
}

// Update an existing student - RLS handles school isolation
export async function updateStudent(
  studentId: string,
  input: Tables<'students'>
) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('students')
    .update({
      full_name: input.full_name,
      school_year: input.school_year,
      interests: input.interests,
      learning_difficulties: input.learning_difficulties,
      student_badge: input.student_badge,
    })
    .eq('id', studentId); // RLS ensures user can only update their school's students

  if (error) {
    throw new Error(error.message);
  }
}

// Delete a student - RLS handles school isolation
export async function deleteStudent(studentId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId); // RLS ensures user can only delete their school's students

  if (error) {
    throw new Error(error.message);
  }
}
