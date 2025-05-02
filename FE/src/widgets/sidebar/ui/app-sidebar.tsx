import { Home, Inbox } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import { type SidebarItem } from '../model/types';

const items: SidebarItem[] = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'AMR 관제',
    url: '/control',
    icon: Inbox,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible='icon'>
      <SidebarInset>
        <SidebarContent>
          <SidebarGroup>
            {/* Logo Section */}
            <SidebarHeader className="flex justify-between">
              {/* <div className="flex items-center">
                <span className="text-xl font-bold text-white">FLIP</span>
              </div> */}
              <SidebarTrigger />
            </SidebarHeader>
            <SidebarSeparator />
            
            {/* Menu Section */}
            <SidebarGroupContent className="mt-4">
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </SidebarInset>
    </Sidebar>
  );
}
