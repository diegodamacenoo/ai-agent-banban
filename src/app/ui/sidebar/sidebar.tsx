'use client';
import * as React from "react"
import { usePathname } from 'next/navigation';

import { NavMain } from "@/app/ui/sidebar/nav-main"
import { NavSecondary } from "@/app/ui/sidebar/nav-secondary"
import { NavUser } from "@/app/ui/sidebar/nav-user"

import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  ChevronUp,
  ArrowUpCircleIcon,
  HelpCircleIcon,
  SearchIcon,
  SettingsIcon,
  Users,
} from "lucide-react"
import Link from 'next/link';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import clsx from "clsx";

// Menu items.
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Relatórios",
      url: "#",
      icon: Inbox,
    },
    {
      title: "Usuários",
      url: "#",
      icon: Users,
    },
  ],
  navSecondary: [
    {
      title: "Chat 01",
      url: "#",
    },
    {
      title: "Chat 02",
      url: "#",
    },
    {
      title: "Chat 03",
      url: "#",
    }
  ],
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

}

export function AppSidebar({ userData }: { userData: { id: string; email: string; name: any; avatar: any; } }) {
  const pathname = usePathname();
  return (
    <Sidebar variant="inset">

      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser userData={userData} />
      </SidebarFooter>

    </Sidebar>
  )
}
