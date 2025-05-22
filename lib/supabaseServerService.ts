import { createClient } from './supabase/server';

export const supabaseServerService = {
  async getStudents() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .limit(30);

    if (error) {
      throw new Error(`Error fetching students: ${error.message}`);
    }

    return data;
  },

  async getAllStudents() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('students').select('*');

    if (error) {
      throw new Error(`Error fetching students: ${error.message}`);
    }

    return data;
  },
  async searchStudents(query: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`full_name.ilike.%${query}%,school_year.ilike.%${query}%`)
      .limit(10);

    if (error) {
      throw new Error(`Error fetching based on query: ${error.message}`);
    }
    return data;
  },
};
