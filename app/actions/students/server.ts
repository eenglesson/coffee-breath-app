'use server';
import { Tables } from '@/database.types';
import { createClient } from '@/lib/supabase/server';

// Get the authenticated user's school_id from profiles table
export async function getStudents() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('students').select('*').limit(30);

  if (error) {
    throw new Error(`Error fetching students: ${error.message}`);
  }

  return data;
}

export async function getAllStudents() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('students').select('*');

  if (error) {
    throw new Error(`Error fetching students: ${error.message}`);
  }

  return data;
}

export async function getUserSchoolId() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error('User not authenticated');
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profileData?.school_id) {
    throw new Error('Failed to fetch teacher profile or school ID');
  }

  return profileData.school_id;
}

// Create a new student
export async function createStudent(
  input: Tables<'students'> & { badges?: string | null }
) {
  const supabase = await createClient();
  try {
    const school_id = await getUserSchoolId();

    const insertData: any = {
      full_name: input.full_name,
      school_year: input.school_year,
      interests: input.interests,
      learning_difficulties: input.learning_difficulties,
      school_id,
    };

    // Handle badges if provided (store as JSON string since database doesn't have badges column yet)
    if (input.badges !== undefined) {
      insertData.badges = input.badges;
    }

    const { error } = await supabase.from('students').insert([insertData]);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error creating student:', error);

    throw error; // Rethrow to allow caller to handle if needed
  }
}

// Update an existing student
export async function updateStudent(
  studentId: string,
  input: Tables<'students'>
) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from('students')
      .update({
        full_name: input.full_name,
        school_year: input.school_year,
        interests: input.interests,
        learning_difficulties: input.learning_difficulties,
      })
      .eq('id', studentId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error updating student:', error);

    throw error;
  }
}

// Delete a student
export async function deleteStudent(studentId: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error deleting student:', error);

    throw error;
  }
}
