'use client';

import { type LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar(); // 👈 grab it here

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu className='gap-1'>
        {items.map((item) => {
          // You can use pathname here to compare with item.url for styling logic
          const isCurrentPage = pathname === item.url;

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isCurrentPage}
              className='group/collapsible'
            >
              <SidebarMenuItem>
                <Link
                  href={item.url}
                  className='flex items-center cursor-default gap-2'
                  onClick={() => {
                    if (isMobile) setOpenMobile(false); // 👈 autoclose
                  }}
                >
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={
                      isCurrentPage ? 'bg-accent text-accent-foreground' : ''
                    }
                  >
                    {item.icon && <item.icon size={16} />}

                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>

                <CollapsibleContent></CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
