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

  return (
    <TanstackQueryProvider>
      <ConversationsProvider teacherId={profile.id}>
        <ConversationSessionProvider>
          <SidebarProvider>
            <AppSidebar profile={profile} />
            <SidebarInset>
              <NavbarHeader /> 
              <main>{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </ConversationSessionProvider>
      </ConversationsProvider>
    </TanstackQueryProvider>
  );
}
