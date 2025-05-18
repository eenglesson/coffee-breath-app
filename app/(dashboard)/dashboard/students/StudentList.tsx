'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Edit, GraduationCap, Heart, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditStudentDialog from './EditStudentDialog';
import { Tables } from '@/database.types';
import { formatName } from '@/app/utils/formatName';

interface StudentListProps {
  students: Tables<'students'>[];
  searchResults: Tables<'students'>[];
  isSearching: boolean;
}

export default function StudentList({
  students,
  searchResults,
  isSearching,
}: StudentListProps) {
  const [selectedStudent, setSelectedStudent] =
    useState<Tables<'students'> | null>(null);

  // Handle opening the edit dialog
  const handleEditClick = (student: Tables<'students'>) => {
    setSelectedStudent(student);
  };

  // Handle closing the edit dialog
  const handleCloseDialog = () => {
    setSelectedStudent(null);
  };

  // Determine which students to display
  const displayedStudents = isSearching ? searchResults : students;

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
      {displayedStudents.map((student) => (
        <Card
          key={student.id}
          className='h-[26rem] hover:shadow-lg ease-in duration-75 2xl:h-[30rem] w-full flex flex-col overflow-hidden pb-0'
        >
          <CardHeader className='flex justify-between'>
            <aside>
              <h2 className='text-2xl font-semibold'>
                {formatName(student.full_name)}
              </h2>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <GraduationCap size={24} strokeWidth={1.5} />
                <span>
                  Class •{' '}
                  {formatName(student.school_year, {
                    capitalizeLastLetter: true,
                  })}
                </span>
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
                  <Heart size={20} className='text-primary' />
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
                  <Info size={20} className='text-primary' />
                </div>
                <h3 className='text-lg font-semibold'>Learning Style</h3>
              </div>
              <p className='leading-relaxed break-words text-accent-foreground line-clamp-3 overflow-hidden text-sm'>
                {student.learning_difficulties ?? 'None'}
              </p>
            </aside>
          </CardContent>
          <CardFooter className='bg-secondary/50 flex w-full justify-center p-2'>
            <span className='text-sm text-muted-foreground flex items-center justify-between flex-col'>
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
