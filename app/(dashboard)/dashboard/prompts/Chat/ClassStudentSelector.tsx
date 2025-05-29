'use client';
import type React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Users, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
import { getAllStudents } from '@/lib/client.student';
import { Tables } from '@/database.types';
import { formatName } from '@/app/utils/formatName';

// Define types for our data structure
type Student = {
  id: string;
  name: string;
  interests: string | null;
  learning_difficulties: string | null;
  school_year: string | null;
};

type Class = {
  id: string;
  name: string;
  students: Student[];
};

interface ClassStudentSelectorProps {
  setSelectedStudents: (
    students: {
      id: string;
      interests: string | null;
      learning_difficulties: string | null;
      school_year: string | null;
    }[]
  ) => void;
}

export default function ClassStudentSelector({
  setSelectedStudents,
}: ClassStudentSelectorProps) {
  const [expandedClasses, setExpandedClasses] = useState<
    Record<string, boolean>
  >({});
  const [selectedItems, setSelectedItems] = useState<{
    classes: Record<string, boolean>;
    students: Record<string, boolean>;
  }>({
    classes: {},
    students: {},
  });
  const [students, setStudents] = useState<Tables<'students'>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Fetch students from the database
  useEffect(() => {
    async function fetchStudents() {
      try {
        const data = await getAllStudents();
        setStudents(data);
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    }
    fetchStudents();
  }, []);

  // Compute classes from fetched students by grouping them by school_year
  const classes = useMemo(() => {
    const grouped = students.reduce((acc, student) => {
      const schoolYear = student.school_year || 'Unknown';
      if (!acc[schoolYear]) {
        acc[schoolYear] = {
          id: schoolYear,
          name: `Class ${schoolYear.toLocaleUpperCase()}`,
          students: [],
        };
      }
      acc[schoolYear].students.push({
        id: student.id,
        name: student.full_name || 'Unnamed',
        interests: student.interests,
        learning_difficulties: student.learning_difficulties,
        school_year: student.school_year,
      });
      return acc;
    }, {} as Record<string, Class>);
    return Object.values(grouped);
  }, [students]);

  // Filter content based on search term
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return { students: [], classes: [] };

    const term = searchTerm.toLowerCase();

    // Search students
    const matchingStudents = students
      .filter((student) =>
        (student.full_name || '').toLowerCase().includes(term)
      )
      .map((student) => ({
        id: student.id,
        name: student.full_name || 'Unnamed',
        interests: student.interests,
        learning_difficulties: student.learning_difficulties,
        school_year: student.school_year,
      }));

    // Search classes
    const matchingClasses = classes.filter(
      (classItem) =>
        classItem.name.toLowerCase().includes(term) ||
        classItem.id.toLowerCase().includes(term)
    );

    return { students: matchingStudents, classes: matchingClasses };
  }, [students, classes, searchTerm]);

  // Update parent component with selected student data
  useEffect(() => {
    const selectedStudentData = classes
      .flatMap((classItem) => classItem.students)
      .filter((student) => selectedItems.students[student.id])
      .map(({ id, interests, learning_difficulties, school_year }) => ({
        id,
        interests,
        learning_difficulties,
        school_year,
      }));
    setSelectedStudents(selectedStudentData);
  }, [selectedItems.students, classes, setSelectedStudents]);

  // Toggle class expansion
  const toggleClass = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedClasses((prev) => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };

  // Toggle class selection (double-click to select all)
  const handleClassClick = (classItem: Class, e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double click
      e.stopPropagation();
      selectEntireClass(classItem);
    } else {
      // Single click
      toggleClass(classItem.id, e);
    }
  };

  // Select entire class
  const selectEntireClass = (classItem: Class) => {
    const isCurrentlySelected = selectedItems.classes[classItem.id];
    const newClassSelection = {
      ...selectedItems.classes,
      [classItem.id]: !isCurrentlySelected,
    };

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

  // Toggle individual student from search results
  const toggleSearchedStudent = (student: Student, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const classId = student.school_year || 'Unknown';
    toggleStudentSelection(student.id, classId, e);
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

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Clear all selections
  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItems({
      classes: {},
      students: {},
    });
  };

  const hasSelections = getTotalSelectedStudents() > 0;
  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className=''>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                id='class-selector'
                variant='outline'
                className='text-muted-foreground rounded-full w-fit transition-all duration-200 hover:bg-accent'
              >
                <Users className='h-4 w-4' />
                <span className='font-medium'>
                  {getTotalSelectedStudents()}
                </span>
                <Separator orientation='vertical' className='h-4 mx-0.5' />
                <ChevronDown className='h-4 w-4 text-muted-foreground transition-transform duration-200' />
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>

          <TooltipContent
            sideOffset={4}
            className='dark:bg-popover bg-accent px-3 py-1 text-sm'
          >
            <p className='text-foreground'>Select students</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className='w-80 p-0 bg-popover text-popover-foreground border-border'>
          {/* Header */}
          <div className='p-3 border-b border-border'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='text-sm font-medium text-foreground'>
                Select Students
              </h3>
              {hasSelections && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-muted-foreground h-auto p-1 text-xs hover:text-destructive transition-colors duration-200'
                  onClick={clearAll}
                >
                  Clear All
                </Button>
              )}
            </div>

            {!isSearching && (
              <div className='text-xs text-muted-foreground mb-2'>
                Double-click classes to select all students
              </div>
            )}

            {/* Search Input */}
            <div className='relative'>
              <Search
                className={cn(
                  'absolute left-2 top-2.5 h-4 w-4 text-muted-foreground transition-colors duration-200',
                  isSearching && 'text-primary'
                )}
              />
              <Input
                placeholder='Search students or classes...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-8 pr-8 h-8 text-sm transition-all duration-200 focus:ring-2'
              />
              {searchTerm && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='absolute right-1 top-1 h-6 w-6 p-0 transition-opacity duration-200 hover:bg-destructive/10'
                  onClick={clearSearch}
                >
                  <X className='h-3 w-3' />
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className='h-64'>
            <div className='p-2'>
              {/* Search Results */}
              {isSearching && (
                <div className='space-y-1'>
                  {/* Search Results Header */}
                  {(searchResults.classes.length > 0 ||
                    searchResults.students.length > 0) && (
                    <div className='text-xs font-medium text-muted-foreground px-2 py-1 mb-1'>
                      {searchResults.classes.length +
                        searchResults.students.length}{' '}
                      result
                      {searchResults.classes.length +
                        searchResults.students.length !==
                      1
                        ? 's'
                        : ''}
                    </div>
                  )}

                  {/* Matching Classes */}
                  {searchResults.classes.map((classItem) => (
                    <div key={`search-class-${classItem.id}`} className='mb-1'>
                      <div
                        className={cn(
                          'flex items-center px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm transition-all duration-150',
                          selectedItems.classes[classItem.id] && 'bg-accent/50'
                        )}
                        onClick={(e) => handleClassClick(classItem, e)}
                      >
                        <div className='mr-2'>
                          {expandedClasses[classItem.id] ? (
                            <ChevronDown className='h-4 w-4 text-muted-foreground transition-transform duration-200' />
                          ) : (
                            <ChevronRight className='h-4 w-4 text-muted-foreground transition-transform duration-200' />
                          )}
                        </div>
                        <div className='flex-1'>
                          <div className='font-medium text-sm text-foreground'>
                            {classItem.name}
                          </div>
                        </div>
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

                      {/* Expanded students in search */}
                      {expandedClasses[classItem.id] && (
                        <div className='pl-6 space-y-1 mt-1 mb-2'>
                          {classItem.students.map((student) => (
                            <div
                              key={`search-class-student-${student.id}`}
                              className={cn(
                                'flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm transition-all duration-150',
                                selectedItems.students[student.id] &&
                                  'bg-accent/30'
                              )}
                              onClick={() =>
                                toggleStudentSelection(student.id, classItem.id)
                              }
                            >
                              <Checkbox
                                checked={!!selectedItems.students[student.id]}
                                className='mr-3'
                              />
                              <div className='font-medium text-sm text-foreground'>
                                {formatName(student.name)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Matching Students */}
                  {searchResults.students.map((student) => (
                    <div
                      key={`search-student-${student.id}`}
                      className={cn(
                        'flex items-center px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm transition-all duration-150',
                        selectedItems.students[student.id] && 'bg-accent/50'
                      )}
                      onClick={(e) => toggleSearchedStudent(student, e)}
                    >
                      <Checkbox
                        checked={!!selectedItems.students[student.id]}
                        className='mr-3'
                      />
                      <div className='flex-1'>
                        <div className='font-medium text-sm text-foreground'>
                          {formatName(student.name)}
                        </div>
                        {student.school_year && (
                          <div className='text-xs text-muted-foreground'>
                            Class {student.school_year.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* No Results */}
                  {searchResults.students.length === 0 &&
                    searchResults.classes.length === 0 && (
                      <div className='text-center py-6 text-muted-foreground text-sm'>
                        <Search className='h-8 w-8 mx-auto mb-2 opacity-50' />
                        No results found for &quot;{searchTerm}&quot;
                      </div>
                    )}
                </div>
              )}

              {/* Class List (when not searching) */}
              {!isSearching && (
                <div className='space-y-1'>
                  {classes.map((classItem) => (
                    <div key={classItem.id}>
                      <div
                        className={cn(
                          'flex items-center px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm transition-all duration-150',
                          selectedItems.classes[classItem.id] && 'bg-accent/50'
                        )}
                        onClick={(e) => handleClassClick(classItem, e)}
                        title='Double-click to select all students'
                      >
                        <div className='mr-2'>
                          {expandedClasses[classItem.id] ? (
                            <ChevronDown className='h-4 w-4 text-muted-foreground transition-transform duration-200' />
                          ) : (
                            <ChevronRight className='h-4 w-4 text-muted-foreground transition-transform duration-200' />
                          )}
                        </div>

                        <span className='font-medium text-sm flex-1 text-foreground'>
                          {classItem.name}
                        </span>

                        <Badge
                          variant={
                            getSelectedStudentCount(classItem) > 0
                              ? 'default'
                              : 'outline'
                          }
                          className='ml-2 text-xs transition-colors duration-200'
                        >
                          {getSelectedStudentCount(classItem)}/
                          {classItem.students.length}
                        </Badge>
                      </div>

                      {expandedClasses[classItem.id] && (
                        <div className='pl-6 space-y-1 mt-1 mb-2'>
                          {classItem.students.map((student) => (
                            <div
                              key={student.id}
                              className={cn(
                                'flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm transition-all duration-150',
                                selectedItems.students[student.id] &&
                                  'bg-accent/30'
                              )}
                              onClick={() =>
                                toggleStudentSelection(student.id, classItem.id)
                              }
                            >
                              <Checkbox
                                checked={!!selectedItems.students[student.id]}
                                className='mr-3'
                              />
                              <div className='font-medium text-sm text-foreground'>
                                {formatName(student.name)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
