'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface AdaptedQuestion {
  original: string;
  adapted: string;
  explanation: string;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface StudentWithAdaptedQuestions {
  id: string;
  name: string;
  school_year?: string;
  interests?: string;
  learning_difficulties?: string;
  adaptedQuestions: AdaptedQuestion[];
}

interface AdaptedQuestionsTableProps {
  students: StudentWithAdaptedQuestions[];
  originalQuestions: string[];
  adaptationFocus: string;
}

export default function AdaptedQuestionsTable({
  students,
  originalQuestions,
  adaptationFocus,
}: AdaptedQuestionsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const toggleRow = (studentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedRows(newExpanded);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems((prev) => new Set([...prev, id]));
      setTimeout(
        () =>
          setCopiedItems((prev) => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          }),
        2000
      );
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className='space-y-4 w-full max-w-full '>
      {/* Header */}
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='text-foreground'>
            📚 Adapted Questions for Students
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            {students.length} students • {originalQuestions.length} questions •
            Focus: {adaptationFocus}
          </p>
        </CardHeader>
        <CardContent>
          <div className=' p-3 rounded-md space-y-1 w-full'>
            <p className='text-sm font-medium text-foreground'>
              Original Questions:
            </p>
            {originalQuestions.map((q, idx) => (
              <div
                key={idx}
                className='text-sm text-muted-foreground break-words'
              >
                • {q}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className='w-full p-0 overflow-hidden'>
        <CardContent className='p-0 w-full'>
          <div className='w-full overflow-hidden'>
            <Table className='w-full table-fixed'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-8'></TableHead>
                  <TableHead className='min-w-[120px]'>Student</TableHead>
                  <TableHead className='w-24'>Grade</TableHead>
                  <TableHead className='text-right w-28'>Questions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className=''>
                {students.map((student) => (
                  <React.Fragment key={student.id}>
                    <TableRow
                      className='cursor-pointer hover:bg-muted/50'
                      onClick={() => toggleRow(student.id)}
                    >
                      <TableCell className='w-8'>
                        {expandedRows.has(student.id) ? (
                          <ChevronDown className='h-4 w-4 text-muted-foreground' />
                        ) : (
                          <ChevronRight className='h-4 w-4 text-muted-foreground' />
                        )}
                      </TableCell>
                      <TableCell className='font-medium text-foreground min-w-[120px]'>
                        {student.name}
                      </TableCell>
                      <TableCell className='text-muted-foreground w-24 text-sm'>
                        {student.school_year || 'N/A'}
                      </TableCell>
                      <TableCell className='text-right w-28'>
                        <Badge variant='secondary' className='text-xs'>
                          {student.adaptedQuestions.length}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Content */}
                    {expandedRows.has(student.id) && (
                      <TableRow>
                        <TableCell colSpan={4} className='p-0'>
                          <div className='bg-muted/30 p-4 border-t w-full max-w-full'>
                            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 flex-wrap'>
                              <h4 className='font-semibold text-foreground text-sm sm:text-base'>
                                Questions for {student.name}
                              </h4>
                              <Button
                                size='sm'
                                variant='outline'
                                className='w-fit flex-shrink-0'
                                onClick={() => {
                                  const allQuestions = student.adaptedQuestions
                                    .map((q) => q.adapted)
                                    .join('\n\n');
                                  copyToClipboard(
                                    allQuestions,
                                    `all-${student.id}`
                                  );
                                }}
                              >
                                {copiedItems.has(`all-${student.id}`) ? (
                                  <Check className='h-4 w-4' />
                                ) : (
                                  <Copy className='h-4 w-4' />
                                )}
                                Copy All
                              </Button>
                            </div>

                            <div className='space-y-3'>
                              {student.adaptedQuestions.map((q, idx) => (
                                <div
                                  key={idx}
                                  className='bg-card p-3 sm:p-4 rounded-lg border shadow-sm w-full'
                                >
                                  <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3 flex-wrap'>
                                    <div className='flex flex-wrap gap-2 min-w-0'>
                                      <span className='font-medium text-primary text-sm flex-shrink-0'>
                                        Q{idx + 1}
                                      </span>
                                      {q.subject && (
                                        <Badge
                                          variant='outline'
                                          className='text-xs'
                                        >
                                          {q.subject}
                                        </Badge>
                                      )}
                                      {q.difficulty && (
                                        <Badge
                                          className={`text-xs ${getDifficultyColor(
                                            q.difficulty
                                          )}`}
                                        >
                                          {q.difficulty}
                                        </Badge>
                                      )}
                                    </div>
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      className='w-fit h-fit p-1 flex-shrink-0'
                                      onClick={() =>
                                        copyToClipboard(
                                          q.adapted,
                                          `q-${student.id}-${idx}`
                                        )
                                      }
                                    >
                                      {copiedItems.has(
                                        `q-${student.id}-${idx}`
                                      ) ? (
                                        <Check className='h-3 w-3' />
                                      ) : (
                                        <Copy className='h-3 w-3' />
                                      )}
                                    </Button>
                                  </div>

                                  <div className='space-y-3 w-full min-w-0 text-wrap'>
                                    <div>
                                      <p className='text-xs text-muted-foreground mb-1'>
                                        Original:
                                      </p>
                                      <p className='text-sm bg-muted/50 p-2 rounded italic text-muted-foreground break-words overflow-wrap-anywhere'>
                                        {q.original}
                                      </p>
                                    </div>

                                    <div>
                                      <p className='text-xs text-green-600 dark:text-green-400 mb-1'>
                                        Adapted:
                                      </p>
                                      <p className='text-sm font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded border-l-4 border-green-500 text-foreground break-words overflow-wrap-anywhere'>
                                        {q.adapted}
                                      </p>
                                    </div>

                                    <div>
                                      <p className='text-xs text-blue-600 dark:text-blue-400 mb-1'>
                                        Why this change:
                                      </p>
                                      <p className='text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded break-words overflow-wrap-anywhere '>
                                        {q.explanation}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
