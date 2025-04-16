'use client';

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  Sparkles,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

import LogOutBtn from './LogOutBtn';
import { Tables } from '@/database.types';

export function NavUser({ profile }: { profile: Tables<'profiles'> }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <Avatar className='h-8 w-8 rounded-lg'>
                <AvatarFallback className='rounded-lg'>
                  {(() => {
                    const name = profile.full_name;
                    if (!name || name.trim() === '') {
                      return '??';
                    }

                    const words = name.trim().split(/\s+/);
                    if (words.length === 1) {
                      return words[0].charAt(0).toUpperCase();
                    }

                    const firstInitial = words[0].charAt(0).toUpperCase();
                    const lastInitial = words[words.length - 1]
                      .charAt(0)
                      .toUpperCase();
                    return `${firstInitial}${lastInitial}`;
                  })()}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>
                  {profile.full_name}
                </span>
                <span className='truncate text-xs'>{profile.email}</span>
              </div>
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarFallback className='rounded-lg'>
                    {(() => {
                      const name = profile.full_name;
                      if (!name || name.trim() === '') {
                        return '??';
                      }

                      const words = name.trim().split(/\s+/);
                      if (words.length === 1) {
                        return words[0].charAt(0).toUpperCase();
                      }

                      const firstInitial = words[0].charAt(0).toUpperCase();
                      const lastInitial = words[words.length - 1]
                        .charAt(0)
                        .toUpperCase();
                      return `${firstInitial}${lastInitial}`;
                    })()}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>
                    {profile.full_name}
                  </span>
                  <span className='truncate text-xs'>{profile.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOutBtn />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
