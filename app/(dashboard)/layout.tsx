import { AppSidebar } from '@/components/app-sidebar';
import NavbarHeader from '@/components/Navbar-header';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TanstackQueryProvider } from '@/lib/tanstack-query/tanstack-query-provider';
import { ConversationsProvider } from '@/lib/context/ConversationsContext';
import { ConversationSessionProvider } from '@/lib/context/ConversationSessionContext';
import {
  SchoolProvider,
  ProfileProvider,
} from '@/lib/context/SchoolYearContext';

import { getProfileWithSchool } from '@/app/actions/profiles/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already verified auth, so fetch data directly
  // Combined query reduces database calls from 3+ to 1
  const { profile, school } = await getProfileWithSchool();

  return (
    <TanstackQueryProvider>
      <ProfileProvider profile={profile}>
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
      </ProfileProvider>
    </TanstackQueryProvider>
  );
}
