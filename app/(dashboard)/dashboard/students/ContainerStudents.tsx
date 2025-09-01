'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import SearchSection from './SearchSection';
import StudentList from './StudentList';
import { Tables } from '@/database.types';
import { createClient } from '@/lib/supabase/client';

import { useStudentsQuery } from '@/app/actions/students/queries';

interface ContainerStudentsProps {
  initialStudents: Tables<'students'>[];
}

// Custom debounce function specifically for string functions
function debounceSearch(
  func: (query: string) => Promise<void>,
  wait: number
): (query: string) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (query: string) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(query), wait);
  };
}

export default function ContainerStudents({
  initialStudents,
}: ContainerStudentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] =
    useState<Tables<'students'>[]>(initialStudents);
  const [isSearching, setIsSearching] = useState(false);

  // Use TanStack Query for students data
  const { data: students = initialStudents, isLoading } = useStudentsQuery();

  const supabase = useMemo(() => createClient(), []);

  // Debounced search function - optimized to avoid unnecessary queries
  const performSearch = useMemo(
    () =>
      debounceSearch(async (query: string) => {
        if (query.trim() === '') {
          setSearchResults(students);
          setIsSearching(false);
          return;
        }

        setIsSearching(true);
        try {
          const sanitizedQuery = query.trim().replace(/[%_]/g, '\\$&');
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .or(
              `full_name.ilike.%${sanitizedQuery}%,school_year.ilike.%${sanitizedQuery}%`
            )
            .limit(5);

          if (error) {
            throw new Error(`Error fetching based on query: ${error.message}`);
          }
          setSearchResults(data || []);
        } catch (error) {
          console.error('Search failed:', error);
          setSearchResults([]);
        }
      }, 350),
    [supabase, students]
  );

  // Update search results when students data changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults(students);
    } else {
      // Re-run search with current term when students data updates
      performSearch(searchTerm);
    }
  }, [students, searchTerm, performSearch]);

  // Note: Real-time updates are now handled by TanStack Query cache invalidation
  // The mutations in queries.ts will invalidate the cache, triggering a refetch

  // Handler for search input change
  const handleSearchTermChange = useCallback(
    (term: string) => {
      setSearchTerm(term);
      performSearch(term);
    },
    [performSearch]
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
        setSearchTerm={handleSearchTermChange}
      />
      <StudentList
        students={students}
        searchResults={searchResults}
        isSearching={isSearching || isLoading}
      />
    </div>
  );
}
