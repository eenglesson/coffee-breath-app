//app/components/Navbar-header.tsx
'use client';

import { HistoryTrigger } from '@/app/components/history/history-trigger';
import DynamicBreadcrumb from './DynamicBreadCrumb';
import { Separator } from './ui/separator';
import { SidebarTrigger } from './ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { SquarePen } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export default function NavbarHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Only show HistoryTrigger on ai-chat paths
  const isCreateQuestionsPath = pathname.startsWith('/dashboard/ai-chat');

  return (
    <header className='sticky backdrop-blur supports-[backdrop-filter]:bg-background/85 z-5 top-0 flex h-16 shrink-0 items-center justify-between transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center justify-between gap-2 px-4 min-w-0 flex-1'>
        <SidebarTrigger className='-ml-1 rounded-lg' />
        <Separator
          orientation='vertical'
          className='mr-2 data-[orientation=vertical]:h-4 hidden md:block'
        />
        <div className='min-w-0 flex-1 hidden md:block'>
          <DynamicBreadcrumb />
        </div>
        {isCreateQuestionsPath && (
          <div className='flex items-center gap-2'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label='New Chat'
                    className='text-muted-foreground hover:text-foreground hover:bg-muted pointer-events-auto rounded-lg p-2 transition-colors'
                    onClick={() => router.push('/dashboard/ai-chat')}
                  >
                    <SquarePen size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New Chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <HistoryTrigger hasSidebar={false} />
          </div>
        )}
      </div>
    </header>
  );
}
