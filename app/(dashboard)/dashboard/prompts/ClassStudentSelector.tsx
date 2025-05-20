'use client';

import type React from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Define types for our data structure
type Student = {
  id: string;
  name: string;
};

type Class = {
  id: string;
  name: string;
  students: Student[];
};

// Sample data
const classes: Class[] = [
  {
    id: 'class-1',
    name: 'Mathematics 101',
    students: [
      { id: 'student-1', name: 'Jenny Hamilton' },
      { id: 'student-2', name: 'Paul Smith' },
      { id: 'student-3', name: 'Luna Wyen' },
    ],
  },
  {
    id: 'class-2',
    name: 'Programming',
    students: [
      { id: 'student-4', name: 'Alex Johnson' },
      { id: 'student-5', name: 'Maria Garcia' },
    ],
  },
  {
    id: 'class-3',
    name: 'Physics 303',
    students: [
      { id: 'student-6', name: 'David Lee' },
      { id: 'student-7', name: 'Sarah Brown' },
      { id: 'student-8', name: 'James Wilson' },
      { id: 'student-9', name: 'Emma Davis' },
    ],
  },
];

export default function ClassStudentSelector() {
  // State for expanded classes
  const [expandedClasses, setExpandedClasses] = useState<
    Record<string, boolean>
  >({});

  // State for selected items (both classes and students)
  const [selectedItems, setSelectedItems] = useState<{
    classes: Record<string, boolean>;
    students: Record<string, boolean>;
  }>({
    classes: {},
    students: {},
  });

  // State for dropdown open/close

  // Toggle class expansion
  const toggleClass = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedClasses((prev) => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };

  // Toggle class selection
  const toggleClassSelection = (classItem: Class, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const isCurrentlySelected = selectedItems.classes[classItem.id];
    const newClassSelection = {
      ...selectedItems.classes,
      [classItem.id]: !isCurrentlySelected,
    };

    // If selecting a class, select all its students
    // If deselecting a class, deselect all its students
    const newStudentSelection = { ...selectedItems.students };

    classItem.students.forEach((student) => {
      newStudentSelection[student.id] = !isCurrentlySelected;
    });

    setSelectedItems({
      classes: newClassSelection,
      students: newStudentSelection,
    });
  };

  // Toggle student selection
  const toggleStudentSelection = (
    studentId: string,
    classId: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();

    const newStudentSelection = {
      ...selectedItems.students,
      [studentId]: !selectedItems.students[studentId],
    };

    // Check if all students in the class are selected
    const classStudents = classes.find((c) => c.id === classId)?.students || [];
    const allStudentsSelected = classStudents.every(
      (student) => newStudentSelection[student.id]
    );

    setSelectedItems({
      classes: {
        ...selectedItems.classes,
        [classId]: allStudentsSelected,
      },
      students: newStudentSelection,
    });
  };

  // Get total selected students count
  const getTotalSelectedStudents = () => {
    return Object.values(selectedItems.students).filter(Boolean).length;
  };

  // Get selected student count for a class
  const getSelectedStudentCount = (classItem: Class) => {
    return classItem.students.filter(
      (student) => selectedItems.students[student.id]
    ).length;
  };

  // Clear all selections and collapse all classes
  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItems({
      classes: {},
      students: {},
    });
    setExpandedClasses({});
  };

  return (
    <div className=''>
      <div className=''>
        <div>
          <Popover>
            <Tooltip>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    id='class-selector'
                    variant='outline'
                    className='text-muted-foreground rounded-full w-fit'
                  >
                    <Users className='h-4 w-4' />
                    <span className='font-medium'>
                      {getTotalSelectedStudents() > 0
                        ? getTotalSelectedStudents()
                        : 0}
                    </span>
                    <Separator orientation='vertical' className='h-4 mx-0.5' />
                    <ChevronDown className='h-4 w-4 text-muted-foreground' />
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>

              <TooltipContent
                sideOffset={4}
                className='bg-popover px-3 py-1 text-sm'
              >
                <p className='text-foreground'>Select students</p>
              </TooltipContent>
            </Tooltip>

            <PopoverContent className='w-64 p-0 bg-popover text-popover-foreground border-border'>
              <ScrollArea className='h-64 px-2'>
                <div className='flex items-center w-full justify-between p-2 gap-2'>
                  <h3 className='text-body font-medium text-foreground'>
                    Select Students
                  </h3>

                  {/* <Input
                          type='text'
                          placeholder='Search...'
                          className='w-full h-8'
                          onChange={(e) => console.log(e.target.value)}
                        /> */}
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-muted-foreground'
                    onClick={clearAll}
                  >
                    Clear All
                  </Button>
                </div>
                <div className='p-1'>
                  {classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      className='rounded-sm mb-1 last:mb-0'
                    >
                      {/* Class header */}
                      <div
                        className={cn(
                          'flex items-center px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-default rounded-sm',
                          selectedItems.classes[classItem.id] && 'bg-accent/50'
                        )}
                        onClick={(e) => toggleClass(classItem.id, e)}
                      >
                        {/* Class checkbox */}
                        <Checkbox
                          id={`class-${classItem.id}`}
                          checked={!!selectedItems.classes[classItem.id]}
                          onCheckedChange={() =>
                            toggleClassSelection(classItem)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className='mr-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                        />

                        {/* Expand/collapse icon */}
                        <div
                          className='mr-2'
                          onClick={(e) => toggleClass(classItem.id, e)}
                        >
                          {expandedClasses[classItem.id] ? (
                            <ChevronDown className='h-4 w-4 text-muted-foreground' />
                          ) : (
                            <ChevronRight className='h-4 w-4 text-muted-foreground' />
                          )}
                        </div>

                        {/* Class name */}
                        <span className='font-medium text-sm flex-1 text-foreground'>
                          {classItem.name}
                        </span>

                        {/* Selection counter */}
                        <Badge
                          variant={
                            getSelectedStudentCount(classItem) > 0
                              ? 'default'
                              : 'outline'
                          }
                          className='ml-2 text-xs'
                        >
                          {getSelectedStudentCount(classItem)}/
                          {classItem.students.length}
                        </Badge>
                      </div>

                      {/* Students list (shown when class is expanded) */}
                      {expandedClasses[classItem.id] && (
                        <div className='pl-9 pr-2 space-y-1 mt-1 mb-2'>
                          {classItem.students.map((student) => (
                            <div
                              key={student.id}
                              className={cn(
                                'flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-default rounded-sm',
                                selectedItems.students[student.id] &&
                                  'bg-accent/30'
                              )}
                              onClick={() =>
                                toggleStudentSelection(student.id, classItem.id)
                              }
                            >
                              {/* Student checkbox */}
                              <Checkbox
                                id={`student-${student.id}`}
                                checked={!!selectedItems.students[student.id]}
                                onCheckedChange={() =>
                                  toggleStudentSelection(
                                    student.id,
                                    classItem.id
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                                className='mr-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                              />

                              {/* Student info - only name */}
                              <div className='font-medium text-sm text-foreground'>
                                {student.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
