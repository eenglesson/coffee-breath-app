'use client';
import { useState, useRef } from 'react';
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
  let timeout: NodeJS.Timeout | null = null;
  return function (...args: Parameters<F>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface ContainerStudentsProps {
  initialStudents: Tables<'students'>[];
}

const supabase = createClient();

// Real-time subscription setup (not idiomatic, but per requirements)
let studentsChannel: RealtimeChannel | null = null;
let setStudentsGlobal:
  | ((cb: (prev: Tables<'students'>[]) => Tables<'students'>[]) => void)
  | null = null;
let setSearchResultsGlobal:
  | ((cb: (prev: Tables<'students'>[]) => Tables<'students'>[]) => void)
  | null = null;
let getSearchTerm: (() => string) | null = null;
let performSearchGlobal: ((query: string) => void) | null = null;

function setupRealtime() {
  if (studentsChannel) return;
  studentsChannel = supabase
    .channel('students-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'students',
      },
      (payload) => {
        if (!setStudentsGlobal) return;
        if (payload.eventType === 'INSERT') {
          const newStudent = payload.new as Tables<'students'>;
          setStudentsGlobal((prev) => [...prev, newStudent]);
          if (getSearchTerm && performSearchGlobal && getSearchTerm().trim()) {
            performSearchGlobal(getSearchTerm());
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedStudent = payload.new as Tables<'students'>;
          setStudentsGlobal((prev) =>
            prev.map((student) =>
              student.id === updatedStudent.id ? updatedStudent : student
            )
          );
          if (getSearchTerm && performSearchGlobal && getSearchTerm().trim()) {
            performSearchGlobal(getSearchTerm());
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedStudent = payload.old as { id: string };
          setStudentsGlobal((prev) =>
            prev.filter((student) => student.id !== deletedStudent.id)
          );
          if (setSearchResultsGlobal) {
            setSearchResultsGlobal((prev) =>
              prev.filter((student) => student.id !== deletedStudent.id)
            );
          }
        }
      }
    )
    .subscribe();
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

  // Expose setters for global use in real-time handler
  setStudentsGlobal = setStudents;
  setSearchResultsGlobal = setSearchResults;
  getSearchTerm = () => searchTerm;

  // Debounced search function
  const performSearch = useRef(
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
    }, 350)
  ).current;

  performSearchGlobal = performSearch;

  // Setup real-time subscription once (not idiomatic, but per requirements)
  setupRealtime();

  // Handler for search input change
  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    performSearch(term);
  };

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
