'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditStudentDialog from './EditStudentDialog';
import { Tables } from '@/database.types';
import { formatName } from '@/app/utils/formatName';
import { formatDate } from '@/app/components/history/utils';
import StudentBadge, { StudentBadgeTypeIds } from '@/components/student-badge';

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
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
      {displayedStudents.map((student) => (
        <Card
          key={student.id}
          className='h-[24rem] flex-1 w-full flex flex-col overflow-hidden pb-4 gap-0 rounded-3xl [&_>*]:p-2 p-2'
        >
          <CardHeader className='flex justify-between'>
            <aside>
              <h2 className='text-2xl font-semibold'>
                {formatName(student.full_name)}
              </h2>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <span>
                  Class{' '}
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
          <CardContent className='flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap min-w-0 py-2'>
            {student.student_badge && student.student_badge.length > 0 ? (
              student.student_badge.map((badgeId) => (
                <StudentBadge
                  key={badgeId}
                  type={badgeId as StudentBadgeTypeIds}
                />
              ))
            ) : (
              <span className='text-sm text-muted-foreground italic'>
                No selected badges
              </span>
            )}
          </CardContent>
          <CardContent className='flex flex-col mt-2 gap-4'>
            <aside className='flex-1 flex flex-col'>
              <div className='flex items-center gap-2 mb-1'>
                <h3 className='text-sm font-medium'>Interests</h3>
              </div>
              <p className='leading-relaxed break-words text-muted-foreground line-clamp-3 overflow-hidden text-sm'>
                {student.interests || 'No information provided'}
              </p>
            </aside>
            <aside className='flex-1 flex flex-col'>
              <div className='flex items-center gap-2 mb-1'>
                <h3 className='text-sm font-medium'>Learning Style</h3>
              </div>
              <p className='leading-relaxed break-words text-muted-foreground line-clamp-3 overflow-hidden text-sm'>
                {student.learning_difficulties || 'No information provided'}
              </p>
            </aside>
          </CardContent>
          <CardFooter className=' flex w-full justify-center mt-auto'>
            <span className='text-sm text-muted-foreground flex items-center  gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              {student.updated_at ? 'Updated ' : 'Created '}
              {student.updated_at
                ? formatDate(student.updated_at)
                : formatDate(student.created_at)}
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
