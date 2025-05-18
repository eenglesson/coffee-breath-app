'use client';
import { useState, useEffect, useCallback } from 'react';
import SearchSection from './SearchSection';
import StudentList from './StudentList';
import { Tables } from '@/database.types';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

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

interface ContainerStudentsProps {
  initialStudents: Tables<'students'>[];
}

const supabase = createClient();

export default function ContainerStudents({
  initialStudents,
}: ContainerStudentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] =
    useState<Tables<'students'>[]>(initialStudents);
  const [isSearching, setIsSearching] = useState(false);
  const [students, setStudents] =
    useState<Tables<'students'>[]>(initialStudents);

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string) => {
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
          .limit(10);

        if (error) {
          throw new Error(`Error fetching based on query: ${error.message}`);
        }

        setSearchResults(data || []);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      }
    }, 400),
    [students]
  );

  // Trigger search when searchTerm changes
  useEffect(() => {
    performSearch(searchTerm);
  }, [searchTerm, performSearch]);

  // Set up real-time subscription
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newStudent = payload.new as Tables<'students'>;
            setStudents((prev) => [...prev, newStudent]);
            // If searching, re-run search to check if new student matches
            if (searchTerm.trim()) {
              performSearch(searchTerm);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedStudent = payload.new as Tables<'students'>;
            setStudents((prev) =>
              prev.map((student) =>
                student.id === updatedStudent.id ? updatedStudent : student
              )
            );
            // If searching, re-run search to update searchResults
            if (searchTerm.trim()) {
              performSearch(searchTerm);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedStudent = payload.old as { id: string };
            setStudents((prev) =>
              prev.filter((student) => student.id !== deletedStudent.id)
            );
            setSearchResults((prev) =>
              prev.filter((student) => student.id !== deletedStudent.id)
            );
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchTerm, performSearch]);

  return (
    <div>
      <h1 className='text-4xl font-bold'>Students</h1>
      <p className='text-sm text-muted-foreground mb-4'>
        Here you can manage your students. Click on a student to view their
        details, or add a new student.
      </p>
      <SearchSection searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <StudentList
        students={students}
        searchResults={searchResults}
        isSearching={isSearching}
      />
    </div>
  );
}
