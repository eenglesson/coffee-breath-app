import { AppSidebar } from '@/components/app-sidebar';
import NavbarHeader from '@/components/Navbar-header';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TanstackQueryProvider } from '@/lib/tanstack-query/tanstack-query-provider';
import { ConversationsProvider } from '@/lib/context/ConversationsContext';
import { ConversationSessionProvider } from '@/lib/context/ConversationSessionContext';
import { SchoolProvider } from '@/lib/context/SchoolYearContext';

import { getAuthenticatedProfile } from '@/app/actions/profiles/server';
import { getUserSchool } from '@/app/actions/schools/server';

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

  // Fetch the complete school information for the user
  const school = await getUserSchool();

  return (
    <TanstackQueryProvider>
      <SchoolProvider school={school}>
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
      </SchoolProvider>
    </TanstackQueryProvider>
  );
}
