import { AppSidebar } from '@/components/app-sidebar';
import NavbarHeader from '@/components/Navbar-header';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TanstackQueryProvider } from '@/lib/tanstack-query/tanstack-query-provider';
import { ConversationsProvider } from '@/lib/context/ConversationsContext';
import { ConversationSessionProvider } from '@/lib/context/ConversationSessionContext';
// import { SchoolYearsProvider } from '@/lib/context/SchoolYearContext';

import { getAuthenticatedProfile } from '@/app/actions/profiles/server';
// import { getSchoolYears } from '@/lib/schools/server';

import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    redirect('/auth/login');
  }

  // const schoolYearsData = await getSchoolYears();
  // Extract school_year array from the first row, or default to []
  // const schoolYears =
  // schoolYearsData.length > 0 ? schoolYearsData[0].school_year : [];
  return (
    <TanstackQueryProvider>
      <ConversationsProvider teacherId={profile.id}>
        <ConversationSessionProvider>
          <SidebarProvider>
            <AppSidebar profile={profile} />
            {/* <SchoolYearsProvider schoolYears={schoolYears}> */}
            <SidebarInset>
              <NavbarHeader />

              <main className='flex flex-1 flex-col gap-2 p-2 sm:p-4 pt-0 '>
                {children}
              </main>
            </SidebarInset>
            {/* </SchoolYearsProvider> */}
          </SidebarProvider>
        </ConversationSessionProvider>
      </ConversationsProvider>
    </TanstackQueryProvider>
  );
}
