'use client';
import * as React from "react"
import { memo, useMemo } from 'react';

import { NavPrimary } from "@/app/ui/sidebar/components/nav-primary"
import { NavSecondary } from "@/app/ui/sidebar/components/nav-secondary"
import { NavUser } from "@/app/ui/sidebar/components/nav-user"
import { SidebarLogo } from "@/app/ui/sidebar/components/sidebar-logo"
import { SidebarContextProvider } from "./contexts/sidebar-context"

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
  Package,
  Activity,
  BarChart3,
  AlertTriangle,
  TrendingUp,
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

// Menu items - memoizado para evitar recriação desnecessária
const MENU_DATA = {
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Performance",
      url: "/performance",
      icon: TrendingUp,
    },
    {
      title: "Insights",
      url: "/alertas",
      icon: AlertTriangle,
    },
    {
      title: "Catálogo",
      url: "/catalog",
      icon: Package,
    },
    /*{
      title: "Eventos",
      url: "/events",
      icon: Activity,
    },
    */
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
} as const;

interface UserData {
  id: string;
  email: string;
  name: any;
  avatar: any;
}

interface AppSidebarProps {
  userData: UserData;
}

export const AppSidebar = memo(function AppSidebar({ userData }: AppSidebarProps) {
  return (
    <SidebarContextProvider>
      <Sidebar variant="inset" className="border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarLogo />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <NavPrimary items={MENU_DATA.navMain} />
          {/*<NavSecondary items={MENU_DATA.navSecondary} />*/}
        </SidebarContent>

        <SidebarFooter>
          <NavUser userData={userData} />
        </SidebarFooter>
      </Sidebar>
    </SidebarContextProvider>
  )
})
