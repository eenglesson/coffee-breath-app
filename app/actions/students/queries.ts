'use client';
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as studentServer from './server';
import { Tables } from '@/database.types';

// Debounce utility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel?: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel?: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

// Query hook for fetching all students with stale-while-revalidate pattern
export function useStudentsQuery(initialData?: Tables<'students'>[]) {
  return useQuery({
    queryKey: ['students'],
    queryFn: studentServer.getStudents,
    initialData, // Use SSR data for instant navigation ⚡
    staleTime: 0, // Always consider data stale → checks for other teachers' updates
    refetchOnMount: true, // Always refetch when navigating to page
    refetchOnWindowFocus: true, // Fresh data when returning to tab
    gcTime: 1000 * 60 * 5, // Keep cached for 5 minutes
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentServer.createStudent,
    // Optimistic update: add the new student locally immediately
    onMutate: async (newStudent) => {
      await queryClient.cancelQueries({ queryKey: ['students'] });

      const previousStudents =
        queryClient.getQueryData<Tables<'students'>[]>(['students']) || [];

      const tempId =
        (typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `temp-${Date.now()}`) as string;

      const optimisticStudent: Tables<'students'> = {
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        full_name: newStudent.full_name ?? null,
        school_year: newStudent.school_year ?? null,
        interests: newStudent.interests ?? null,
        learning_difficulties: newStudent.learning_difficulties ?? null,
        student_badge: newStudent.student_badge ?? null,
        // Will be set by server; avoid guessing
        school_id: null,
      } as Tables<'students'>;

      queryClient.setQueryData<Tables<'students'>[]>(
        ['students'],
        [optimisticStudent, ...previousStudents]
      );

      return { previousStudents };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStudents) {
        queryClient.setQueryData(['students'], context.previousStudents);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentId,
      input,
    }: {
      studentId: string;
      input: Tables<'students'>;
    }) => studentServer.updateStudent(studentId, input),
    // Optimistic update: update the student locally
    onMutate: async ({ studentId, input }) => {
      await queryClient.cancelQueries({ queryKey: ['students'] });

      const previousStudents =
        queryClient.getQueryData<Tables<'students'>[]>(['students']) || [];

      const nextStudents = previousStudents.map((student) =>
        student.id === studentId
          ? ({
              ...student,
              full_name: input.full_name ?? student.full_name,
              school_year: input.school_year ?? student.school_year,
              interests: input.interests ?? student.interests,
              learning_difficulties:
                input.learning_difficulties ?? student.learning_difficulties,
              student_badge: input.student_badge ?? student.student_badge,
              updated_at: new Date().toISOString(),
            } as Tables<'students'>)
          : student
      );

      queryClient.setQueryData<Tables<'students'>[]>(
        ['students'],
        nextStudents
      );

      return { previousStudents };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStudents) {
        queryClient.setQueryData(['students'], context.previousStudents);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentServer.deleteStudent,
    // Optimistic update: remove the student locally
    onMutate: async (studentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['students'] });

      const previousStudents =
        queryClient.getQueryData<Tables<'students'>[]>(['students']) || [];

      const nextStudents = previousStudents.filter(
        (student) => student.id !== studentId
      );

      queryClient.setQueryData<Tables<'students'>[]>(
        ['students'],
        nextStudents
      );

      return { previousStudents };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStudents) {
        queryClient.setQueryData(['students'], context.previousStudents);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useSearchStudents() {
  return useMutation({
    mutationFn: studentServer.searchStudents,
    // No cache invalidation needed for search - it's a fresh query each time
  });
}

export function useGetStudents() {
  return useMutation({
    mutationFn: studentServer.getStudents,
    // No cache invalidation needed for read operations
  });
}

export function useGetAllStudents() {
  return useMutation({
    mutationFn: studentServer.getAllStudents,
    // No cache invalidation needed for read operations
  });
}

// Custom hook for debounced search that can be used in components
export function useStudentSearch() {
  const searchMutation = useSearchStudents();

  const debouncedSearch = React.useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.trim()) {
          return await searchMutation.mutateAsync(query);
        }
        return [];
      }, 350),
    [searchMutation]
  );

  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel?.();
    };
  }, [debouncedSearch]);

  return {
    search: debouncedSearch,
    isLoading: searchMutation.isPending,
    error: searchMutation.error,
    data: searchMutation.data,
  };
}
