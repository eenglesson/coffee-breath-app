import { AppSidebar } from '@/components/app-sidebar';
import DynamicBreadCrumb from '@/components/DynamicBreadCrumb';

import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ModeToggle } from '@/components/ui/toggle-dark-light-mode';
import { getAuthenticatedProfile } from '@/lib/supabase/server.profiles';

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
    <SidebarProvider>
      <AppSidebar profile={profile} />
      <SidebarInset>
        <header className='sticky z-50 bg-background top-0 flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 mr-2'>
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator
              orientation='vertical'
              className='mr-2 data-[orientation=vertical]:h-4'
            />
            <DynamicBreadCrumb />
          </div>
          <ModeToggle />
        </header>
        <main className='flex flex-1 flex-col gap-2 p-4 pt-0'>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
