'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import SearchSection from './SearchSection';
import StudentList from './StudentList';
import { Tables } from '@/database.types';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  const [students, setStudents] =
    useState<Tables<'students'>[]>(initialStudents);

  const supabase = useMemo(() => createClient(), []);
  const studentsChannel = useRef<RealtimeChannel | null>(null);
  const realtimeUpdateBuffer = useRef<Map<string, Tables<'students'>>>(
    new Map()
  );
  const lastRealtimeUpdate = useRef<number>(0);
  const REALTIME_THROTTLE_MS = 500; // Throttle real-time updates

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

  // Throttled real-time update handler
  const handleRealtimeUpdate = useCallback(() => {
    const now = Date.now();
    if (now - lastRealtimeUpdate.current < REALTIME_THROTTLE_MS) {
      return;
    }
    lastRealtimeUpdate.current = now;

    setStudents((prev) => {
      const updatedStudents = [...prev];

      // Apply buffered updates
      realtimeUpdateBuffer.current.forEach((student, id) => {
        const existingIndex = updatedStudents.findIndex((s) => s.id === id);
        if (existingIndex >= 0) {
          updatedStudents[existingIndex] = student;
        } else {
          updatedStudents.push(student);
        }
      });

      // Clear buffer after applying
      realtimeUpdateBuffer.current.clear();

      return updatedStudents;
    });

    // Only trigger search if there's an active search term
    if (searchTerm.trim()) {
      performSearch(searchTerm);
    }
  }, [searchTerm, performSearch]);

  // Setup real-time subscription with proper lifecycle management
  useEffect(() => {
    if (studentsChannel.current) return;

    studentsChannel.current = supabase
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
            realtimeUpdateBuffer.current.set(newStudent.id, newStudent);
            handleRealtimeUpdate();
          } else if (payload.eventType === 'UPDATE') {
            const updatedStudent = payload.new as Tables<'students'>;
            realtimeUpdateBuffer.current.set(updatedStudent.id, updatedStudent);
            handleRealtimeUpdate();
          } else if (payload.eventType === 'DELETE') {
            const deletedStudent = payload.old as { id: string };
            realtimeUpdateBuffer.current.delete(deletedStudent.id);

            setStudents((prev) =>
              prev.filter((student) => student.id !== deletedStudent.id)
            );

            if (searchTerm.trim()) {
              setSearchResults((prev) =>
                prev.filter((student) => student.id !== deletedStudent.id)
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (studentsChannel.current) {
        studentsChannel.current.unsubscribe();
        studentsChannel.current = null;
      }
    };
  }, [supabase, handleRealtimeUpdate, searchTerm]);

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
        isSearching={isSearching}
      />
    </div>
  );
}
