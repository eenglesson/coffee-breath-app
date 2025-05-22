'use client';

import { createContext, useContext } from 'react';

// Create the context with a default value of an empty array
export const SchoolYearsContext = createContext<string[]>([]);

// Provider component to supply school years data to the component tree
export function SchoolYearsProvider({
  schoolYears,
  children,
}: {
  schoolYears: string[];
  children: React.ReactNode;
}) {
  return (
    <SchoolYearsContext.Provider value={schoolYears}>
      {children}
    </SchoolYearsContext.Provider>
  );
}

// Custom hook to access the school years data
export function useSchoolYears() {
  return useContext(SchoolYearsContext);
}
