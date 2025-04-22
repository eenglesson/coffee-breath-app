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
import { updateStudent, deleteStudent } from '@/lib/supabase/students'; // Import reusable functions
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

export const schoolYears = [
  { value: '0a', label: '0A' },
  { value: '0b', label: '0B' },
  { value: '1a', label: '1A' },
  { value: '1b', label: '1B' },
  { value: '2a', label: '2A' },
  { value: '2b', label: '2B' },
  { value: '3a', label: '3A' },
  { value: '3b', label: '3B' },
  { value: '4a', label: '4A' },
  { value: '4b', label: '4B' },
  { value: '5a', label: '5A' },
  { value: '5b', label: '5B' },
  { value: '6a', label: '6A' },
  { value: '6b', label: '6B' },
  { value: '7a', label: '7A' },
  { value: '7b', label: '7B' },
  { value: '8a', label: '8A' },
  { value: '8b', label: '8B' },
  { value: '9a', label: '9A' },
  { value: '9b', label: '9B' },
];

// Define the Zod schema for the form
const studentSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  yearInSchool: z.string().min(1, 'Year in school is required'),
  interests: z.string().min(1, 'Interests are required'),
  learningDifficulties: z.string().optional(),
});

interface EditStudentDialogProps {
  student: {
    id: string;
    full_name: string | null;
    school_year: string | null;
    interests: string | null;
    learning_difficulties: string | null;
  };
  onClose: () => void;
}

export default function EditStudentDialog({
  student,
  onClose,
}: EditStudentDialogProps) {
  // State for confirmation dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Initialize the form with zodResolver and pre-populated values
  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      fullName: student.full_name ?? '',
      yearInSchool: student.school_year ?? '',
      interests: student.interests ?? '',
      learningDifficulties: student.learning_difficulties ?? '',
    },
  });

  // Handle form submission for updating
  const onSubmit: SubmitHandler<z.infer<typeof studentSchema>> = async (
    data
  ) => {
    try {
      await updateStudent(student.id, {
        fullName: data.fullName.toLowerCase(),
        yearInSchool: data.yearInSchool.toLocaleLowerCase(),
        interests: data.interests,
        learningDifficulties: data.learningDifficulties,
      });
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
          className='sm:max-w-[500px] overflow-y-auto
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
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
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
                          {schoolYears.map((year) => (
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
                <div className='flex flex-col-reverse md:flex-row gap-2'>
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
                &ldquo;{student.full_name}&rdquo;
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
