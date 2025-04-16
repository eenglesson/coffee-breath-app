'use client';

import * as React from 'react';
import { Bot, Calculator, Omega, SquareTerminal, Users } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Tables } from '@/database.types';

// Sample data (unchanged)
const data = {
  teams: [
    {
      name: 'Matematics',
      logo: Calculator,
      plan: 'Enterprise',
    },
    {
      name: 'Physics',
      logo: Omega,
      plan: 'Startup',
    },
  ],
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: 'Students',
      url: '/students',
      icon: Users,
    },
    {
      title: 'Prompts',
      url: '/prompts',
      icon: Bot,
    },
  ],
};

export function AppSidebar({
  profile,
  ...props
}: React.ComponentProps<typeof Sidebar> & { profile: Tables<'profiles'> }) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser profile={profile} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
