"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/shared/utils/utils";
import {
  BarChart,
  Calendar,
  CreditCard,
  Settings,
  User,
} from "lucide-react";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart,
  },
  {
    title: "Agenda",
    href: "/agenda",
    icon: Calendar,
  },
  {
    title: "Perfil",
    href: "/settings/profile",
    icon: User,
  },
  {
    title: "Faturamento",
    href: "/settings/billing",
    icon: CreditCard,
  },
  {
    title: "ConfiguraÃ§Ãµes",
    href: "/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-x-2 lg:space-x-4 p-4 pt-0">
      <div className="flex h-[60px] items-center px-6">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold">BanBan</span>
        </Link>
      </div>
      <div className="space-y-1">
        {sidebarNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "transparent"
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
} 
