'use client';

import { z } from 'zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { createStudent } from '@/app/actions/students/server';
import { Tables } from '@/database.types';
import { useSchoolYears } from '@/lib/context/SchoolYearContext';

// Define the Zod schema for the form
const studentSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  yearInSchool: z.string().min(1, 'Year in school is required'),
  interests: z.string().min(1, 'Interests are required'),
  learningDifficulties: z.string().optional(),
});

interface AddStudentFormProps {
  onClose: () => void;
}

export default function AddStudentDialog({ onClose }: AddStudentFormProps) {
  // Initialize the form with zodResolver and default values
  const schoolYears = useSchoolYears();

  const schoolYearOptions = schoolYears.map((year) => ({
    value: year,
    label: year.toUpperCase(),
  }));

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      fullName: '',
      yearInSchool: '',
      interests: '',
      learningDifficulties: '',
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<z.infer<typeof studentSchema>> = async (
    data
  ) => {
    try {
      await createStudent({
        full_name: data.fullName.toLowerCase(),
        school_year: data.yearInSchool.toLowerCase(),
        interests: data.interests,
        learning_difficulties: data.learningDifficulties,
      } as Tables<'students'>);
      form.reset();
      onClose();
    } catch (error) {
      // Error handling is already done in createStudent, but we catch here to prevent unhandled promise rejection
      console.error('Error in form submission:', error);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
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
                    <Input
                      placeholder='Enter full name'
                      {...field}
                      className='placeholder:text-sm'
                    />
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
                  <FormLabel>Class</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className='bg-background border-input w-full px-3'>
                        <SelectValue placeholder='Select students class' />
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
                      className='h-32 text-sm placeholder:text-sm '
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button type='submit'>Add Student</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
