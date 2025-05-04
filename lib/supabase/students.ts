import { Tables } from '@/database.types';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Get the authenticated user's school_id from profiles table
async function getUserSchoolId(supabase: ReturnType<typeof createClient>) {
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
export async function createStudent(input: Tables<'students'>) {
  const supabase = createClient();
  try {
    const school_id = await getUserSchoolId(supabase);

    const { error } = await supabase.from('students').insert([
      {
        full_name: input.full_name,
        school_year: input.school_year,
        interests: input.interests,
        learning_difficulties: input.learning_difficulties,
        school_id,
      },
    ]);

    if (error) {
      throw new Error(error.message);
    }

    toast.success('Student profile added successfully!');
  } catch (error) {
    console.error('Error creating student:', error);
    toast.error(
      error instanceof Error ? error.message : 'Failed to add student'
    );
    throw error; // Rethrow to allow caller to handle if needed
  }
}

// Update an existing student
export async function updateStudent(
  studentId: string,
  input: Tables<'students'>
) {
  const supabase = createClient();
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

    toast.success('Student profile updated successfully!');
  } catch (error) {
    console.error('Error updating student:', error);
    toast.error(
      error instanceof Error ? error.message : 'Failed to update student'
    );
    throw error;
  }
}

// Delete a student
export async function deleteStudent(studentId: string) {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (error) {
      throw new Error(error.message);
    }

    toast.success('Student profile deleted successfully!');
  } catch (error) {
    console.error('Error deleting student:', error);
    toast.error(
      error instanceof Error ? error.message : 'Failed to delete student'
    );
    throw error;
  }
}
