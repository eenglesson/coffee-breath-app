'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Plus,
  X,
  BookOpen,
  Users,
  Clock,
  Target,
  Search,
  Shield,
} from 'lucide-react';
import { useLessonPlan } from '@/hooks/useLessonPlan';
import {
  LessonPlanRequest,
  StudentContext,
} from '@/lib/lesson-plan/lesson-plan';
import {
  formatDuration,
  getActivityTypeColor,
  getAssessmentTypeColor,
} from '@/lib/lesson-plan/lesson-plan-utils';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const lessonPlanSchema = z.object({
  topic: z.string().min(1, { message: 'Topic is required' }),
  additionalInfo: z.string().optional(),
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
  duration: z
    .number({ invalid_type_error: 'Duration must be a number' })
    .min(15, { message: 'Duration must be at least 15 minutes' })
    .max(480, { message: 'Duration must be at most 480 minutes' }),
  learningObjectives: z
    .array(
      z.object({
        value: z.string().min(1, { message: 'Objective cannot be empty' }),
      })
    )
    .min(1, { message: 'At least one learning objective is required' }),
  studentIds: z
    .array(z.string())
    .min(1, { message: 'At least one student must be selected' })
    .max(30, { message: 'Maximum 30 students can be selected' }),
});

type FormValues = z.infer<typeof lessonPlanSchema>;

export default function CreateLessonPlanClient({
  initialStudents,
}: {
  initialStudents: StudentContext[];
}) {
  const router = useRouter();
  const {
    lessonPlan,
    isLoading: isCreatingLesson,
    error,
    createLessonPlan,
    reset,
  } = useLessonPlan();
  const students = initialStudents;
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(lessonPlanSchema),
    defaultValues: {
      topic: '',
      additionalInfo: '',
      gradeLevel: '',
      subject: '',
      duration: 60,
      learningObjectives: [{ value: '' }],
      studentIds: [],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray<
    FormValues,
    'learningObjectives'
  >({
    control: form.control,
    name: 'learningObjectives',
  });

  const toggleStudentSelection = (studentId: string) => {
    const currentIds = form.getValues('studentIds');
    let newIds;
    if (currentIds.includes(studentId)) {
      newIds = currentIds.filter((id) => id !== studentId);
    } else {
      newIds = currentIds.length < 30 ? [...currentIds, studentId] : currentIds;
    }
    form.setValue('studentIds', newIds, { shouldValidate: true });
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    const request: LessonPlanRequest = {
      topic: data.topic,
      additionalInfo: data.additionalInfo || undefined,
      studentIds: data.studentIds,
      gradeLevel: data.gradeLevel || undefined,
      subject: data.subject || undefined,
      duration: data.duration,
      learningObjectives: data.learningObjectives.map((obj) => obj.value),
    };
    await createLessonPlan(request);
  });

  // Filter students based on search query
  const filteredStudents = students.filter(
    (student) =>
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.school_year?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.interests?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const watchedStudentIds = form.watch('studentIds');

  return (
    <div className='container mx-auto py-8 space-y-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Create Lesson Plan</h1>
          <p className='text-muted-foreground'>
            Generate personalized lesson plans based on your students needs
          </p>
        </div>
        <Button variant='outline' onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {/* GDPR Privacy Notice */}
      <Alert>
        <Shield className='h-4 w-4' />
        <AlertDescription>
          <strong>Privacy Notice:</strong> Student names and personal
          information are anonymized before being processed by AI. Only
          aggregated, non-identifying information (interests, learning needs,
          grade levels) is used to personalize lesson plans.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {lessonPlan ? (
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BookOpen className='h-5 w-5' />
                {lessonPlan.title}
              </CardTitle>
              <CardDescription>
                {lessonPlan.subject} • {lessonPlan.gradeLevel} •{' '}
                {formatDuration(lessonPlan.duration)}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Learning Objectives */}
              {lessonPlan.learningObjectives.length > 0 && (
                <div>
                  <h3 className='font-semibold mb-3 flex items-center gap-2'>
                    <Target className='h-4 w-4' />
                    Learning Objectives
                  </h3>
                  <ul className='list-disc list-inside space-y-1'>
                    {lessonPlan.learningObjectives.map((objective, index) => (
                      <li key={index} className='text-sm'>
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Materials */}
              {lessonPlan.materials.length > 0 && (
                <div>
                  <h3 className='font-semibold mb-3'>Materials Needed</h3>
                  <div className='flex flex-wrap gap-2'>
                    {lessonPlan.materials.map((material, index) => (
                      <Badge key={index} variant='secondary'>
                        {material}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Activities */}
              <div>
                <h3 className='font-semibold mb-3'>Activities</h3>
                <div className='space-y-4'>
                  {lessonPlan.activities.map((activity, index) => (
                    <Card key={index} className='border-l-4 border-l-blue-500'>
                      <CardContent className='pt-4'>
                        <div className='flex items-start justify-between mb-2'>
                          <h4 className='font-medium'>{activity.title}</h4>
                          <Badge
                            className={getActivityTypeColor(activity.type)}
                          >
                            {activity.type}
                          </Badge>
                        </div>
                        <p className='text-sm text-muted-foreground mb-3'>
                          {activity.description}
                        </p>
                        <div className='flex items-center gap-4 text-xs text-muted-foreground mb-3'>
                          <span className='flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            {activity.duration} min
                          </span>
                        </div>
                        {activity.instructions.length > 0 && (
                          <div>
                            <h5 className='font-medium text-sm mb-2'>
                              Instructions:
                            </h5>
                            <ol className='list-decimal list-inside space-y-1 text-sm'>
                              {activity.instructions.map((instruction, idx) => (
                                <li key={idx}>{instruction}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Assessment */}
              {lessonPlan.assessment.length > 0 && (
                <div>
                  <h3 className='font-semibold mb-3'>Assessment</h3>
                  <div className='space-y-3'>
                    {lessonPlan.assessment.map((assessment, index) => (
                      <Card key={index}>
                        <CardContent className='pt-4'>
                          <div className='flex items-start justify-between mb-2'>
                            <h4 className='font-medium'>
                              {assessment.description}
                            </h4>
                            <Badge
                              className={getAssessmentTypeColor(
                                assessment.type
                              )}
                            >
                              {assessment.type}
                            </Badge>
                          </div>
                          {assessment.criteria &&
                            assessment.criteria.length > 0 && (
                              <div>
                                <h5 className='font-medium text-sm mb-2'>
                                  Criteria:
                                </h5>
                                <ul className='list-disc list-inside space-y-1 text-sm'>
                                  {assessment.criteria.map((criterion, idx) => (
                                    <li key={idx}>{criterion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Context (Anonymized) */}
              {lessonPlan.studentContext.length > 0 && (
                <div>
                  <h3 className='font-semibold mb-3 flex items-center gap-2'>
                    <Users className='h-4 w-4' />
                    Student Context ({lessonPlan.studentContext.length}{' '}
                    students)
                  </h3>
                  <Alert>
                    <Shield className='h-4 w-4' />
                    <AlertDescription>
                      <strong>Privacy Protected:</strong> The following
                      information is anonymized and aggregated for privacy
                      compliance.
                    </AlertDescription>
                  </Alert>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                    {lessonPlan.studentContext.map((student) => (
                      <Card key={student.id} className='p-3'>
                        <div className='text-sm'>
                          <p className='font-medium'>
                            Student #{student.id.slice(-4)}
                          </p>
                          <p className='text-muted-foreground'>
                            Grade: {student.school_year || 'N/A'}
                          </p>
                          {student.interests && (
                            <p className='text-xs mt-1'>
                              Interests: {student.interests}
                            </p>
                          )}
                          {student.learning_difficulties && (
                            <p className='text-xs mt-1 text-orange-600'>
                              Considerations: {student.learning_difficulties}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className='flex gap-4'>
            <Button onClick={reset} variant='outline'>
              Create Another Lesson Plan
            </Button>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Information</CardTitle>
              <CardDescription>
                Provide the basic details for your lesson plan
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='topic'>Lesson Topic *</Label>
                <Input id='topic' {...form.register('topic')} />
                {form.formState.errors.topic && (
                  <p className='text-sm text-destructive'>
                    {form.formState.errors.topic.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='additionalInfo'>Additional Information</Label>
                <Textarea
                  id='additionalInfo'
                  rows={3}
                  {...form.register('additionalInfo')}
                />
                {form.formState.errors.additionalInfo && (
                  <p className='text-sm text-destructive'>
                    {form.formState.errors.additionalInfo.message}
                  </p>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='subject'>Subject</Label>
                  <Input id='subject' {...form.register('subject')} />
                  {form.formState.errors.subject && (
                    <p className='text-sm text-destructive'>
                      {form.formState.errors.subject.message}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='gradeLevel'>Grade Level</Label>
                  <Input id='gradeLevel' {...form.register('gradeLevel')} />
                  {form.formState.errors.gradeLevel && (
                    <p className='text-sm text-destructive'>
                      {form.formState.errors.gradeLevel.message}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='duration'>Duration (minutes)</Label>
                  <Input
                    id='duration'
                    type='number'
                    {...form.register('duration', { valueAsNumber: true })}
                  />
                  {form.formState.errors.duration && (
                    <p className='text-sm text-destructive'>
                      {form.formState.errors.duration.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Objectives</CardTitle>
              <CardDescription>
                What should students learn from this lesson?
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {fields.map((field, index) => (
                <div key={field.id} className='flex gap-2'>
                  <div className='flex-1 space-y-2'>
                    <Input
                      {...form.register(`learningObjectives.${index}.value`)}
                    />
                    {form.formState.errors.learningObjectives?.[index]
                      ?.value && (
                      <p className='text-sm text-destructive'>
                        {
                          form.formState.errors.learningObjectives[index].value
                            ?.message
                        }
                      </p>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      onClick={() => remove(index)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              ))}
              {form.formState.errors.learningObjectives &&
                !Array.isArray(form.formState.errors.learningObjectives) && (
                  <p className='text-sm text-destructive'>
                    {form.formState.errors.learningObjectives.message}
                  </p>
                )}
              <Button
                type='button'
                variant='outline'
                onClick={() => append({ value: '' })}
                className='w-full'
              >
                <Plus className='h-4 w-4 mr-2' />
                Add Learning Objective
              </Button>
            </CardContent>
          </Card>

          {/* Student Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Students</CardTitle>
              <CardDescription>
                Choose up to 30 students to personalize the lesson plan (names
                are anonymized for AI processing)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='mb-4'>
                <p className='text-sm text-muted-foreground mb-2'>
                  Selected: {watchedStudentIds.length}/30 students
                </p>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search students by name, grade, or interests...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
              {form.formState.errors.studentIds && (
                <p className='text-sm text-destructive mb-4'>
                  {form.formState.errors.studentIds.message}
                </p>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto'>
                {filteredStudents.map((student) => (
                  <Card
                    key={student.id}
                    className={`cursor-pointer transition-colors ${
                      watchedStudentIds.includes(student.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => toggleStudentSelection(student.id)}
                  >
                    <CardContent className='p-3'>
                      <div className='text-sm'>
                        <p className='font-medium'>
                          {student.full_name || 'Student'}
                        </p>
                        <p className='text-muted-foreground'>
                          Grade: {student.school_year || 'N/A'}
                        </p>
                        {student.interests && (
                          <p className='text-xs mt-1 truncate'>
                            Interests: {student.interests}
                          </p>
                        )}
                        {student.learning_difficulties && (
                          <p className='text-xs mt-1 text-orange-600 truncate'>
                            Considerations: {student.learning_difficulties}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredStudents.length === 0 && (
                <div className='text-center py-8 text-muted-foreground'>
                  <Users className='h-8 w-8 mx-auto mb-2' />
                  <p>No students found matching your search.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className='flex justify-end gap-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isCreatingLesson}>
              {isCreatingLesson ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating Lesson Plan...
                </>
              ) : (
                'Create Lesson Plan'
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
