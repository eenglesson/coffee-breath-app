import React, { useState, useMemo } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UsersIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';

// Define the Student interface
interface Student {
  id: number;
  full_name: string;
  classId: string;
}

// Define the props interface for the component
interface StudentSelectorProps {
  students: Student[];
}

// Define the type for grouped students
type GroupedStudents = {
  [className: string]: Student[];
};

// Define the selection state interface
interface SelectionState {
  checked: boolean;
  indeterminate: boolean;
}

const StudentSelector: React.FC<StudentSelectorProps> = ({ students }) => {
  // State for selected student IDs
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // State for expanded classes
  const [expandedClasses, setExpandedClasses] = useState<
    Record<string, boolean>
  >({});

  // Memoized grouping of students by className
  const groupedStudents: GroupedStudents = useMemo(() => {
    const groups: GroupedStudents = {};
    students.forEach((student) => {
      const className = student.classId;
      if (!groups[className]) {
        groups[className] = [];
      }
      groups[className].push(student);
    });
    return groups;
  }, [students]);

  // Array of class names
  const classes: string[] = Object.keys(groupedStudents).sort();

  // Function to determine the selection state of a class
  const getClassSelectionState = (className: string): SelectionState => {
    const classStudents = groupedStudents[className];
    const selectedInClass = classStudents.filter((student) =>
      selectedIds.includes(student.id)
    ).length;
    if (selectedInClass === 0) {
      return { checked: false, indeterminate: false };
    } else if (selectedInClass === classStudents.length) {
      return { checked: true, indeterminate: false };
    } else {
      return { checked: false, indeterminate: true };
    }
  };

  // Function to toggle class expansion
  const toggleClassExpansion = (className: string) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [className]: !prev[className],
    }));
  };

  // Filtered list of selected students
  const selectedStudents: Student[] = students.filter((s) =>
    selectedIds.includes(s.id)
  );

  console.log('Selected students:', selectedStudents);

  return (
    <div>
      <Popover>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                className='text-muted-foreground rounded-full w-fit'
                aria-label='Select students'
              >
                <UsersIcon />
                <span>{selectedIds.length}</span>
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent
            sideOffset={4}
            className='bg-accent px-3 py-1 text-sm'
          >
            <p className='text-foreground'>Select students</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent className='w-64'>
          <div className='h-64 overflow-y-auto'>
            {classes.map((className) => {
              const { checked, indeterminate } =
                getClassSelectionState(className);
              const isExpanded = expandedClasses[className] ?? false;
              return (
                <div key={className} className='mb-4'>
                  <div className='flex items-center'>
                    <button
                      onClick={() => toggleClassExpansion(className)}
                      aria-expanded={isExpanded}
                      className='flex items-center cursor-pointer bg-transparent border-none p-0'
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className='w-4 h-4 mr-1' />
                      ) : (
                        <ChevronRightIcon className='w-4 h-4 mr-1' />
                      )}
                      {className}
                    </button>
                    <input
                      type='checkbox'
                      checked={checked}
                      ref={(el: HTMLInputElement | null) => {
                        if (el) {
                          el.indeterminate = indeterminate;
                        }
                      }}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const isChecked = e.target.checked;
                        const classStudents = groupedStudents[className];
                        if (isChecked) {
                          setSelectedIds((prev) => [
                            ...new Set([
                              ...prev,
                              ...classStudents.map((s) => s.id),
                            ]),
                          ]);
                        } else {
                          setSelectedIds((prev) =>
                            prev.filter(
                              (id) => !classStudents.some((s) => s.id === id)
                            )
                          );
                        }
                      }}
                      className='ml-2'
                      aria-label={`Select all students in ${className}`}
                    />
                  </div>
                  {isExpanded && (
                    <div className='ml-1'>
                      {groupedStudents[className].map((student) => (
                        <label key={student.id} className='block'>
                          <input
                            type='checkbox'
                            checked={selectedIds.includes(student.id)}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              const isChecked = e.target.checked;
                              if (isChecked) {
                                setSelectedIds((prev) => [...prev, student.id]);
                              } else {
                                setSelectedIds((prev) =>
                                  prev.filter((id) => id !== student.id)
                                );
                              }
                            }}
                          />
                          {student.full_name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default StudentSelector;
