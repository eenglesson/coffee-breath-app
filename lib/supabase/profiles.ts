import { Tables } from '@/database.types';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Input type for updating profiles (matches expected input fields)
export interface ProfileInput {
  fullName?: string;
  email?: string;
  schoolId?: string;
}

// Get the authenticated user's profile
export async function getUserProfile(): Promise<Tables<'profiles'>> {
  const supabase = createClient();
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Profile not found');
    }

    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch profile';
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}

// Update the authenticated user's profile
export async function updateProfile(input: ProfileInput) {
  const supabase = createClient();
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('User not authenticated');
    }

    const updateData: Partial<Tables<'profiles'>> = {};
    if (input.fullName !== undefined) updateData.full_name = input.fullName;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.schoolId !== undefined) updateData.school_id = input.schoolId;

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields provided for update');
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userData.user.id);

    if (error) {
      throw new Error(error.message);
    }

    toast.success('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update profile';
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}
