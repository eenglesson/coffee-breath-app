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

// Query hook for fetching all students
export function useStudentsQuery() {
  return useQuery({
    queryKey: ['students'],
    queryFn: studentServer.getStudents,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentServer.createStudent,
    onSuccess: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentServer.deleteStudent,
    onSuccess: () => {
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
