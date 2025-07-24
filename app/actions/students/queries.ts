'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as studentServer from './server';
import { Tables } from '@/database.types';

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
