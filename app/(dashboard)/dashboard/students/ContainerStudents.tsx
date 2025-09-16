'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import SearchSection from './SearchSection';
import StudentList from './StudentList';
import { Tables } from '@/database.types';

import { useStudentsQuery } from '@/app/actions/students/queries';

interface ContainerStudentsProps {
  initialStudents: Tables<'students'>[];
}

export default function ContainerStudents({
  initialStudents,
}: ContainerStudentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] =
    useState<Tables<'students'>[]>(initialStudents);
  const [isSearching, setIsSearching] = useState(false);

  // Race-condition safe: Data only updates on navigation/mutations, never while editing
  const { data: students = initialStudents, isLoading } =
    useStudentsQuery(initialStudents);

  // Search function without debouncing first
  const executeSearch = useCallback(
    async (query: string) => {
      if (query.trim() === '') {
        setSearchResults(students);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        // Use server action for search (consistent with auth flow)
        const { searchStudents } = await import(
          '@/app/actions/students/server'
        );
        const data = await searchStudents(query);
        setSearchResults(data);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [students]
  );

  // Debounced search function
  const performSearch = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (query: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => executeSearch(query), 350);
    };
  }, [executeSearch]);

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
