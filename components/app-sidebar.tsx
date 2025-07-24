'use client';

import * as React from 'react';
import {
  Bot,
  Calculator,
  Coffee,
  MessageSquareText,
  Omega,
  Presentation,
  SquareTerminal,
  Users,
} from 'lucide-react';
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
const paths = {
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
      url: '/dashboard/students',
      icon: Users,
    },
    {
      title: 'Ai',
      // url: '/dashboard/ai-assistant',
      url: '#',
      icon: Bot,
      isActive: true,
      items: [
        {
          title: 'Coffee breath AI',
          icon: Coffee,
          url: '/dashboard/coffee-breath-ai',
        },
        {
          title: 'Create Lesson Plan',
          icon: Presentation,
          url: '/dashboard/create-lesson-plan',
        },
        {
          title: 'Create Questions',
          url: '/dashboard/create-questions',
          icon: MessageSquareText,
        },
      ],
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
        <TeamSwitcher teams={paths.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={paths.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser profile={profile} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
