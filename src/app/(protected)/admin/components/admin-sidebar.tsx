'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils/utils';
import {
  Crown,
  Home,
  Building2,
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Activity,
  Palette,
  Sparkles,
  Sparkle,
  Package,
  Code2,
  TestTube,
  Shield,
  Bell,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Sidebar, SidebarContent, SidebarHeader } from '@/shared/ui/sidebar';

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: Home,
    exact: true
  },
  {
    title: 'Organizações',
    icon: Building2,
    items: [
      { title: 'Todas as Organizações', href: '/admin/organizations' },
      { title: 'Gerenciar Usuários', href: '/admin/users' }
    ]
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3
  },
  {
    title: 'Módulos',
    icon: Package,
    items: [
      { title: 'Gestão de Módulos', href: '/admin/modules' },
      { title: 'Módulos Planejados', href: '/admin/modules/planned' },
      { title: 'Navegação Dinâmica', href: '/admin/modules/dynamic-navigation' },
      { title: 'Integração', href: '/admin/modules/integration' },
      { title: 'Versionamento', href: '/admin/modules/versioning' }
    ]
  },
  {
    title: 'Ferramentas Avançadas',
    icon: TestTube,
    items: [
      { title: 'A/B Testing', href: '/admin/modules/ab-testing' },
      { title: 'Permissões', href: '/admin/modules/permissions' },
      { title: 'Notificações', href: '/admin/modules/notifications' },
      { title: 'Analytics', href: '/admin/modules/analytics' }
    ]
  },
  {
    title: 'Logs & Auditoria',
    href: '/admin/audit',
    icon: Activity
  },
  {
    title: 'Configurações',
    href: '/admin/settings',
    icon: Settings
  },
  {
    title: 'Design System',
    href: '/admin/design-system',
    icon: Palette
  }
];

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  
  // Expandir automaticamente seções baseado na rota atual
  const getInitialExpandedItems = () => {
    const expanded = ['Organizações']; // Sempre expandido por padrão
    
    if (pathname.startsWith('/admin/modules')) {
      expanded.push('Módulos');
      
      // Expandir ferramentas avançadas se estiver nas rotas específicas
      if (pathname.includes('/ab-testing') || 
          pathname.includes('/permissions') || 
          pathname.includes('/notifications') || 
          pathname.includes('/analytics')) {
        expanded.push('Ferramentas Avançadas');
      }
    }
    
    return expanded;
  };
  
  const [expandedItems, setExpandedItems] = useState<string[]>(getInitialExpandedItems());

  // Atualizar itens expandidos quando a rota mudar
  useEffect(() => {
    const newExpanded = getInitialExpandedItems();
    setExpandedItems(prev => {
      const combined = [...new Set([...prev, ...newExpanded])];
      return combined;
    });
  }, [pathname]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isSubItemActive = (href: string) => {
    return pathname === href;
  };

  return (
    <Sidebar variant="inset" className="p-0 bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--border))]">
      <SidebarHeader className="p-4 h-[75px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <Sparkle className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-medium text-[var(--sidebar-foreground)]">Axon</h2>
            <p className="text-xs text-[var(--sidebar-foreground)]">Painel de Controle</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <nav className="space-y-2">
          {adminNavItems.map((item) => (
            <div key={item.title}>
              {item.href ? (
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-10 font-medium text-md",
                      isActive(item.href, item.exact)
                        ? "bg-[hsl(var(--input))] text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
                        : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
                    )}
                  >
                    <item.icon className="h-6 w-6" strokeWidth={2.5}/>
                    {item.title}
                  </Button>
                </Link>
              ) : (
                <div>
                  <Button
                    variant="ghost"
                    className="w-full justify-between gap-3 h-10 text-md font-medium text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
                    onClick={() => toggleExpanded(item.title)}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-6 w-6" strokeWidth={2.5}/>
                      {item.title}
                    </div>
                    {expandedItems.includes(item.title) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>

                  {expandedItems.includes(item.title) && item.items && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.items.map((subItem) => (
                        <Link key={subItem.href} href={subItem.href}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start h-8 text-sm",
                              isSubItemActive(subItem.href)
                                ? "bg-[var(--input)] text-[var(--sidebar-foreground)] hover:bg-[hsl(var(--sidebar-accent))]"
                                : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
                            )}
                          >
                            {subItem.title}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </SidebarContent>
    </Sidebar>
  );
} 
