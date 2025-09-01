'use client';

import { createContext, useContext } from 'react';
import { Tables } from '@/database.types';

// Type for school information
export type SchoolInfo = Tables<'schools'>;

// Create the context with a default value
export const SchoolContext = createContext<SchoolInfo | null>(null);

// Provider component to supply complete school data to the component tree
export function SchoolProvider({
  school,
  children,
}: {
  school: SchoolInfo | null;
  children: React.ReactNode;
}) {
  return (
    <SchoolContext.Provider value={school}>{children}</SchoolContext.Provider>
  );
}

// Custom hook to access the complete school data
export function useSchool() {
  return useContext(SchoolContext);
}

// Custom hook to access just the school years (for backward compatibility)
export function useSchoolYears() {
  const school = useContext(SchoolContext);
  return school?.school_year || [];
}

// Custom hook to access school name
export function useSchoolName() {
  const school = useContext(SchoolContext);
  return school?.name || '';
}

// Custom hook to access school ID
export function useSchoolId() {
  const school = useContext(SchoolContext);
  return school?.id || '';
}
