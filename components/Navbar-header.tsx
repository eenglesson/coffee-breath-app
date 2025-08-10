//app/components/Navbar-header.tsx
'use client';

import { HistoryTrigger } from '@/app/components/history/history-trigger';
import DynamicBreadcrumb from './DynamicBreadCrumb';
import { Separator } from './ui/separator';
import { SidebarTrigger } from './ui/sidebar';
import { usePathname } from 'next/navigation';

export default function NavbarHeader() {
  const pathname = usePathname();

  // Only show HistoryTrigger on create-questions paths
  const isCreateQuestionsPath = pathname.startsWith(
    '/dashboard/create-questions'
  );

  return (
    <header className='sticky bg-background z-5 top-0 flex h-16 shrink-0 items-center justify-between transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4 min-w-0 flex-1'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mr-2 data-[orientation=vertical]:h-4'
        />
        <div className='min-w-0 flex-1'>
          <DynamicBreadcrumb />
        </div>

        {isCreateQuestionsPath && <HistoryTrigger hasSidebar={false} />}
      </div>
    </header>
  );
}
