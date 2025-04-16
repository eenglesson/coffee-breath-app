'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { BookOpenText, Edit, GraduationCap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditStudentDialog from './EditStudentDialog';
import { Tables } from '@/database.types';

interface StudentListProps {
  searchResults: Tables<'students'>[];
  isSearching: boolean;
}

export default function StudentList({
  searchResults,
  isSearching,
}: StudentListProps) {
  const [students, setStudents] = useState<Tables<'students'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<object | null>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<Tables<'students'> | null>(null);
  const supabase = createClient();

  // Fetch user and initial students
  const fetchInitialData = async () => {
    try {
      // Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('Please log in to view students.');
        setLoading(false);
        return;
      }
      setUser(user);

      // Fetch students (RLS filters by school_id)
      const { data, error } = await supabase
        .from('students')
        .select(
          'id, full_name, school_year, interests, learning_difficulties, created_at, school_id, created_at, updated_at'
        )
        .order('full_name', { ascending: true });

      if (error) {
        throw error;
      }

      setStudents(data || []);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch students';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchInitialData();

    // Subscribe to changes on the students table
    const subscription = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
        },
        (payload) => {
          console.log('Change received:', payload);

          if (payload.eventType === 'INSERT') {
            setStudents((prev) => [...prev, payload.new as Tables<'students'>]);
          } else if (payload.eventType === 'UPDATE') {
            setStudents((prev) =>
              prev.map((student) =>
                student.id === payload.new.id
                  ? (payload.new as Tables<'students'>)
                  : student
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setStudents((prev) =>
              prev.filter((student) => student.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Handle opening the edit dialog
  const handleEditClick = (student: Tables<'students'>) => {
    setSelectedStudent(student);
  };

  // Handle closing the edit dialog
  const handleCloseDialog = () => {
    setSelectedStudent(null);
  };

  // Determine which students to display
  const displayedStudents =
    isSearching || searchResults.length > 0 ? searchResults : students;

  if (loading) {
    return (
      <div className='p-4'>
        <Card>
          <CardHeader>
            <h2 className='text-lg font-semibold'>Students</h2>
          </CardHeader>
          <CardContent>
            <p>Loading students...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className='p-4'>
        <Card>
          <CardHeader>
            <h2 className='text-lg font-semibold'>Students</h2>
          </CardHeader>
          <CardContent>
            <p>{error || 'Please log in to view students.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
      {displayedStudents.map((student) => (
        <Card
          key={student.id}
          className='h-[26rem] 2xl:h-[30rem] w-full flex flex-col overflow-hidden pb-0'
        >
          <CardHeader className='flex justify-between'>
            <aside>
              <h2 className='text-2xl first-letter:uppercase font-semibold'>
                {student.full_name ?? 'Unknown'}
              </h2>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <GraduationCap size={24} strokeWidth={1.5} />
                <span>Årskurs • {student.school_year ?? 'N/A'}</span>
              </div>
            </aside>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => handleEditClick(student)}
            >
              <Edit />
            </Button>
          </CardHeader>
          <CardContent className='flex-1 flex flex-col gap-4 overflow-hidden'>
            <aside className='flex-1 flex flex-col'>
              <div className='flex items-center gap-2 mb-1'>
                <div className='p-1.5 rounded-full bg-secondary'>
                  <BookOpenText size={20} className='text-primary' />
                </div>
                <h3 className='text-lg font-semibold'>Interests</h3>
              </div>
              <p className='leading-relaxed break-words text-accent-foreground line-clamp-3 overflow-hidden text-sm'>
                {student.interests ?? 'None'}
              </p>
            </aside>
            <aside className='flex-1 flex flex-col'>
              <div className='flex items-center gap-2 mb-1'>
                <div className='p-1.5 rounded-full bg-secondary'>
                  <Star size={20} className='text-primary' />
                </div>
                <h3 className='text-lg font-semibold'>Learning Style</h3>
              </div>
              <p className='leading-relaxed break-words text-accent-foreground line-clamp-3 overflow-hidden text-sm'>
                {student.learning_difficulties ?? 'None'}
              </p>
            </aside>
          </CardContent>
          <CardFooter className='bg-secondary/50 flex w-full justify-center p-2 '>
            <span className='text-sm text-muted-foreground flex items-center justify-between flex-col  '>
              <span className='font-semibold pr-1'>Last Updated </span>
              {new Date(student.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour12: false,
              })}
            </span>
          </CardFooter>
        </Card>
      ))}

      {selectedStudent && (
        <EditStudentDialog
          student={selectedStudent}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
}
