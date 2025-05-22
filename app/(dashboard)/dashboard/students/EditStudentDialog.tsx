'use client';

import { z } from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateStudent, deleteStudent } from '@/lib/server.students'; // Import reusable functions
import { useState } from 'react';
import { Trash } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatName } from '@/app/utils/formatName';
import { Tables } from '@/database.types';
import { useSchoolYears } from '@/lib/context/SchoolYearContext';

// Define the Zod schema for the form
const studentSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  yearInSchool: z.string().min(1, 'Year in school is required'),
  interests: z.string().min(1, 'Interests are required'),
  learningDifficulties: z.string().nullable(),
});

interface EditStudentDialogProps {
  student: Pick<
    Tables<'students'>,
    'id' | 'full_name' | 'school_year' | 'interests' | 'learning_difficulties'
  >;

  onClose: () => void;
}

export default function EditStudentDialog({
  student,
  onClose,
}: EditStudentDialogProps) {
  // State for confirmation dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const schoolYears = useSchoolYears();

  const schoolYearOptions = schoolYears.map((year) => ({
    value: year,
    label: year.toUpperCase(),
  }));
  // Initialize the form with zodResolver and pre-populated values
  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      fullName: student.full_name ?? '',
      yearInSchool: student.school_year ?? '',
      interests: student.interests ?? '',
      learningDifficulties: student.learning_difficulties ?? null,
    },
  });

  // Handle form submission for updating
  const onSubmit: SubmitHandler<z.infer<typeof studentSchema>> = async (
    data
  ) => {
    try {
      await updateStudent(student.id, {
        full_name: data.fullName.toLowerCase(),
        school_year: data.yearInSchool.toLowerCase(),
        interests: data.interests,
        learning_difficulties: data.learningDifficulties,
      } as Tables<'students'>);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      await deleteStudent(student.id);
      setIsConfirmDialogOpen(false); // Close confirmation dialog
      onClose(); // Close the edit dialog
    } catch (error) {
      console.error('Error deleting student:', error);
      setIsConfirmDialogOpen(false); // Close confirmation dialog on error
    }
  };

  return (
    <>
      {/* Main Edit Dialog */}
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent
          className='sm:max-w-[600px] overflow-y-auto 
'
        >
          <DialogHeader>
            <DialogTitle>
              Editing{' '}
              <span className='text-primary'>
                {formatName(student.full_name)}
              </span>
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 '>
              <FormField
                control={form.control}
                name='fullName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter full name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='yearInSchool'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year in School</FormLabel>
                    <FormControl>
                      <Select
                        {...field}
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className='bg-background border-input w-full px-3'>
                          <SelectValue placeholder='Select year in school' />
                        </SelectTrigger>
                        <SelectContent className='max-h-[200px] overflow-y-auto z-[1500]'>
                          {schoolYearOptions.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='interests'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interests</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Enter interests separated by commas (e.g., BMX, skateboarding)'
                        {...field}
                        className='h-32 text-sm placeholder:text-sm '
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='learningDifficulties'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning Difficulties (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Enter difficulties separated by commas (e.g., spelling, attention)'
                        {...field}
                        value={field.value || ''}
                        className='h-32 text-sm placeholder:text-sm'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className='flex flex-col-reverse sm:justify-between w-full'>
                <Button
                  type='button'
                  variant='destructive'
                  onClick={() => setIsConfirmDialogOpen(true)}
                >
                  <Trash className='h-4 w-4' />
                  Delete
                </Button>
                <div className='flex flex-col-reverse sm:flex-row gap-2'>
                  <Button type='button' variant='outline' onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type='submit'>Save Changes</Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deletion */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-bold'>
                &ldquo;{formatName(student.full_name)}&rdquo;
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
