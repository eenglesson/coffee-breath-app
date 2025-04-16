'use client';
import { useState, useCallback } from 'react';
import SearchSection from './SearchSection';
import StudentList from './StudentList';
import { Tables } from '@/database.types';
import { createClient } from '@/lib/supabase/client';

// Custom debounce function
function debounce<F extends (...args: string[]) => void>(
  func: F,
  wait: number
) {
  let timeout: NodeJS.Timeout | null;
  return function (...args: Parameters<F>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function Page() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Tables<'students'>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Search students in the students table
  const searchStudents = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Check if user is authenticated
      const { data: authUser, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authUser?.user) {
        setError('Please log in to search for students.');
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .select(
          'id, full_name, school_year, interests, learning_difficulties, created_at, school_id, updated_at'
        )
        .or(`full_name.ilike.%${query}%, school_year.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching students:', error.message);
        setError('Failed to search students. Please try again.');
        setSearchResults([]);
        return;
      }

      setSearchResults(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchStudents(query);
    }, 400),
    []
  );

  return (
    <div>
      <h1 className='text-4xl font-bold'>Students</h1>
      <p className='text-sm text-muted-foreground mb-4'>
        Here you can manage your students. Click on a student to view their
        details, or add a new student.
      </p>
      <SearchSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        isSearching={isSearching}
        setIsSearching={setIsSearching}
        error={error}
        setError={setError}
        debouncedSearch={debouncedSearch}
      />
      <StudentList searchResults={searchResults} isSearching={isSearching} />
    </div>
  );
}
