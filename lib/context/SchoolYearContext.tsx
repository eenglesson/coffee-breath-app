'use client';

import { createContext, useContext } from 'react';
import { Tables } from '@/database.types';

// Type for school information
export type SchoolInfo = Tables<'schools'>;

// Type for profile information
export type ProfileInfo = Tables<'profiles'>;

// Create the context with a default value
export const SchoolContext = createContext<SchoolInfo | null>(null);

// Create profile context
export const ProfileContext = createContext<ProfileInfo | null>(null);

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

// Provider component to supply profile data to the component tree
export function ProfileProvider({
  profile,
  children,
}: {
  profile: ProfileInfo | null;
  children: React.ReactNode;
}) {
  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
}

// Custom hook to access the complete school data
export function useSchool() {
  return useContext(SchoolContext);
}

// Custom hook to access profile data
export function useProfile() {
  return useContext(ProfileContext);
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

// Custom hook to access profile name
export function useProfileName() {
  const profile = useContext(ProfileContext);
  return profile?.full_name || '';
}

// Custom hook to access profile email
export function useProfileEmail() {
  const profile = useContext(ProfileContext);
  return profile?.email || '';
}

// Custom hook to access profile ID
export function useProfileId() {
  const profile = useContext(ProfileContext);
  return profile?.id || '';
}
