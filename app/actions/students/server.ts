'use server';
import { Tables } from '@/database.types';
import { createClient } from '@/lib/supabase/server';

// Internal helper - assumes user already verified by calling function
async function getUserSchoolId(user: { id: string }) {
  const supabase = await createClient();

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData?.school_id) {
    throw new Error('Failed to fetch teacher profile or school ID');
  }

  return profileData.school_id;
}

// Get students for the authenticated user's school
export async function getStudents() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const schoolId = await getUserSchoolId(user);

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId)
    .limit(30);

  if (error) {
    throw new Error(`Error fetching students: ${error.message}`);
  }

  return data;
}

// Get all students for the authenticated user's school
export async function getAllStudents() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const schoolId = await getUserSchoolId(user);

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId);

  if (error) {
    throw new Error(`Error fetching students: ${error.message}`);
  }

  return data;
}

// Search students in the authenticated user's school
export async function searchStudents(query: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const schoolId = await getUserSchoolId(user);

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId)
    .or(`full_name.ilike.%${query}%,school_year.ilike.%${query}%`)
    .limit(5);

  if (error) {
    throw new Error(`Error fetching based on query: ${error.message}`);
  }

  return data;
}

// Create a new student (with explicit auth check for mutations)
export async function createStudent(input: Tables<'students'>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const schoolId = await getUserSchoolId(user);

  const insertData = {
    full_name: input.full_name,
    school_year: input.school_year,
    interests: input.interests,
    learning_difficulties: input.learning_difficulties,
    student_badge: input.student_badge,
    school_id: schoolId, // Security: Automatically assigns to user's school
  };

  const { error } = await supabase.from('students').insert(insertData);

  if (error) {
    throw new Error(error.message);
  }
}

// Update an existing student
export async function updateStudent(
  studentId: string,
  input: Tables<'students'>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const userSchoolId = await getUserSchoolId(user);
  
  const { error } = await supabase
    .from('students')
    .update({
      full_name: input.full_name,
      school_year: input.school_year,
      interests: input.interests,
      learning_difficulties: input.learning_difficulties,
      student_badge: input.student_badge,
    })
    .eq('id', studentId)
    .eq('school_id', userSchoolId); // Security: Only update students from user's school

  if (error) {
    throw new Error(error.message);
  }
}

// Delete a student
export async function deleteStudent(studentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const userSchoolId = await getUserSchoolId(user);
  
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId)
    .eq('school_id', userSchoolId); // Security: Only delete students from user's school

  if (error) {
    throw new Error(error.message);
  }
}
