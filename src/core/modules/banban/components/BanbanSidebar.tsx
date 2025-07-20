'use client';

import Link from "next/link";
import { 
  type LucideIcon, 
  Lightbulb, 
  BarChart3,
  Activity,
  Settings,
  Home,
  Database
} from "lucide-react";
import clsx from "clsx";
import { memo, useMemo } from "react";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";
import { Badge } from "@/shared/ui/badge";
import { useClientType } from "@/shared/hooks/useClientType";

interface BanbanNavItem {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly icon?: LucideIcon;
  readonly badge?: string;
  readonly badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  readonly requiredPermissions?: string[];
  readonly description?: string;
}

// Menu items do módulo Banban
const BANBAN_MENU_ITEMS: readonly BanbanNavItem[] = [
  {
    id: "banban-overview",
    title: "Visão Geral",
    url: "/banban",
    icon: Home,
    description: "Dashboard principal do Banban Intelligence"
  },
  {
    id: "insights",
    title: "Insights",
    url: "/banban/insights",
    icon: Lightbulb,
    requiredPermissions: ["view-banban-insights"],
    badge: "47",
    badgeVariant: "default",
    description: "Insights acionáveis gerados automaticamente"
  },
  {
    id: "performance",
    title: "Performance",
    url: "/banban/performance",
    icon: BarChart3,
    requiredPermissions: ["view-banban-performance"],
    description: "Métricas de performance e análises"
  },
  {
    id: "data-processing",
    title: "Processamento",
    url: "/banban/data-processing",
    icon: Database,
    requiredPermissions: ["view-banban-data-processing"],
    badge: "ATIVO",
    badgeVariant: "secondary",
    description: "Status do processamento de dados em tempo real"
  },
  {
    id: "banban-settings",
    title: "Configurações",
    url: "/banban/settings",
    icon: Settings,
    requiredPermissions: ["config-banban"],
    badge: "ADMIN",
    badgeVariant: "outline",
    description: "Configurações do módulo Banban"
  }
] as const;

interface BanbanSidebarProps {
  className?: string;
}

export const BanbanSidebar = memo(function BanbanSidebar({ 
  className 
}: BanbanSidebarProps) {
  const pathname = usePathname();
  const { hasPermission, isLoading } = useClientType();

  // Filtrar items baseado nas permissões
  const filteredItems = useMemo(() => {
    if (isLoading) return [];

    return BANBAN_MENU_ITEMS.filter(item => {
      // Se tem permissões necessárias, verificar se o usuário as possui
      if (item.requiredPermissions) {
        return item.requiredPermissions.every(permission => 
          hasPermission(permission)
        );
      }
      return true;
    });
  }, [hasPermission, isLoading]);

  const renderedItems = useMemo(() => {
    return filteredItems.map((item) => {
      const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
      
      return (
        <SidebarMenuItem key={item.id}>
          <Link href={item.url} prefetch={true}>
            <SidebarMenuButton
              tooltip={item.description || item.title}
              className={clsx(
                "transition-all duration-200 hover:scale-[1.02]",
                { 
                  "bg-accent text-accent-foreground shadow-sm": isActive
                }
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                {/* Ícone */}
                <span className="flex-shrink-0">
                  {item.icon ? (
                    <item.icon className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 bg-gray-300 rounded" />
                  )}
                </span>

                {/* Título */}
                <span className="truncate flex-1">
                  {item.title}
                </span>

                {/* Badge */}
                {item.badge && (
                  <Badge 
                    variant={item.badgeVariant || "default"} 
                    className={clsx(
                      "text-xs px-1.5 py-0.5 h-5 transition-all duration-200",
                      isActive && "animate-pulse"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      );
    });
  }, [filteredItems, pathname]);

  if (isLoading) {
    return (
      <SidebarGroup className={className}>
        <SidebarGroupLabel>Banban Intelligence</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="space-y-2 p-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className={className}>
      <SidebarGroupLabel className="flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Banban Intelligence
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {renderedItems}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});

// Hook para usar informações da sidebar do Banban
export function useBanbanSidebar() {
  const { hasPermission } = useClientType();

  const availableItems = BANBAN_MENU_ITEMS.filter(item => {
    if (item.requiredPermissions) {
      return item.requiredPermissions.every(permission => 
        hasPermission(permission)
      );
    }
    return true;
  });

  return {
    items: availableItems,
    hasAccess: (itemId: string) => {
      const item = BANBAN_MENU_ITEMS.find(i => i.id === itemId);
      if (!item) return false;
      
      if (item.requiredPermissions) {
        return item.requiredPermissions.every(permission => 
          hasPermission(permission)
        );
      }
      return true;
    }
  };
} 