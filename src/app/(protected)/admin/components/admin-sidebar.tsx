'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/shared/hooks/use-user';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/shared/utils/utils';
import {
  Home,
  Building2,
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Activity,
  Palette,
  Sparkle,
  Package,
  TestTube,
  Bell,
  HelpCircle,
  User,
  LogOut
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from '@/shared/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { createSupabaseBrowserClient } from '@/core/supabase/client';

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
      { title: 'Gestão de Módulos', href: '/admin/modules/management' },
      { title: 'Desenvolvimento', href: '/admin/modules/development' },
      { title: 'Estatísticas', href: '/admin/modules/statistics' },
      { title: 'Versão Legacy', href: '/admin/modules/legacy' },
      { title: 'Módulos Planejados', href: '/admin/modules/planned' }
    ]
  },
  {
    title: 'Ferramentas',
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
    title: 'Design System',
    href: '/admin/design-system',
    icon: Palette
  }
];

// Menu items configuration
const FOOTER_MENU_ITEMS = [
  { icon: Settings, label: 'Configurações' },
  { icon: Bell, label: 'Notificações' }
] as const;

const USER_DROPDOWN_ITEMS = [
  { icon: User, label: 'Perfil' },
  { icon: HelpCircle, label: 'Help & Support' }
] as const;

// Reusable menu items component
function FooterMenuItems() {
  return (
    <div className="space-y-1">
      {FOOTER_MENU_ITEMS.map(({ icon: Icon, label }) => (
        <Button
          key={label}
          variant="ghost"
          className="w-full justify-start gap-3 h-9 text-sm"
        >
          <Icon className="h-6 w-6" />
          {label}
        </Button>
      ))}
    </div>
  );
}

// Types for user data
interface ProcessedUserData {
  displayName: string;
  displayEmail: string;
  avatarUrl: string | null;
  fullName: string;
}

// User data processing hook
function useUserData() {
  const { user, profile } = useUser();

  const processUserData = useCallback((user: any, profile: any): ProcessedUserData => {
    const displayName = profile?.first_name || user.email?.split('@')[0] || 'Usuário';
    const displayEmail = user.email || 'email@exemplo.com';
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
    const fullName = profile?.first_name && profile?.last_name 
      ? `${profile.first_name} ${profile.last_name}` 
      : displayName;

    return { displayName, displayEmail, avatarUrl, fullName };
  }, []);

  const userData = user ? processUserData(user, profile) : null;

  return { userData };
}


// User dropdown component
function UserDropdown({ userData, onLogout }: { userData: ProcessedUserData; onLogout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto p-3 justify-between hover:bg-gray-100"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userData.avatarUrl || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                {userData.fullName.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium text-gray-900">
                {userData.displayName}
              </span>
              <span className="text-xs text-gray-500 truncate max-w-[120px]">
                {userData.displayEmail}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {USER_DROPDOWN_ITEMS.map(({ icon: Icon, label }) => (
          <DropdownMenuItem key={label} icon={Icon}>
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={LogOut} onClick={onLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


// Main component
function AdminSidebarFooter() {
  const router = useRouter();
  const { userData } = useUserData();

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      router.push('/login');
    }
  };

  // Dados padrão quando userData não está disponível
  const displayData = userData || {
    displayName: 'Usuário',
    displayEmail: 'user@example.com',
    avatarUrl: null,
    fullName: 'Usuário'
  };

  return (
    <div className="space-y-3">
      <FooterMenuItems />
      <UserDropdown userData={displayData} onLogout={handleLogout} />
    </div>
  );
}

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  
  
  // Expandir automaticamente seções baseado na rota atual
  const getInitialExpandedItems = () => {
    const expanded = ['Organizações']; // Sempre expandido por padrão
    
    if (pathname.startsWith('/admin/modules')) {
      expanded.push('Módulos');
      
      // Expandir ferramentas se estiver nas rotas específicas
      if (pathname.includes('/ab-testing') || 
          pathname.includes('/permissions') || 
          pathname.includes('/notifications') || 
          pathname.includes('/analytics')) {
        expanded.push('Ferramentas');
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

  // Verificar se um subitem está ativo
  const isSubItemActive = (href: string) => {
    // Verificação exata apenas - evita conflitos de prefixo
    return pathname === href;
  };

  // Verificar se algum subitem de um item pai está ativo
  const hasActiveSubItem = (item: any) => {
    if (!item.items) return false;
    const hasActive = item.items.some((subItem: any) => isSubItemActive(subItem.href));
    return hasActive;
  };

  // Lógica principal de ativação para itens principais
  const isActive = (item: any) => {
    if (!item.href) {
      // Item sem href (só com subitens) - ativo se algum subitem estiver ativo
      return hasActiveSubItem(item);
    }
    
    // Item com href - verificar se é exato ou por prefixo
    if (item.exact) {
      return pathname === item.href;
    }
    
    // Se tem subitens, só ativar se não houver subitem ativo
    // Isso evita pai+filho ativos simultaneamente para o mesmo nível
    if (item.items && item.items.length > 0) {
      const hasActiveSub = hasActiveSubItem(item);
      if (hasActiveSub) {
        return false; // Não ativar o pai se um filho está ativo
      }
    }
    
    return pathname.startsWith(item.href);
  };

  return (
    <div 
      className={cn(
        "h-full w-full flex flex-col bg-[hsl(var(--sidebar-background))]",
        className
      )}
      style={{ height: '100%' }}
    >
      {/* Navigation - flex-1 para ocupar espaço disponível */}
      <nav className="flex-1 p-2 pt-4 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => (
            <div key={item.title}>
              {item.href ? (
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-10 font-medium text-sm",
                      isActive(item)
                        ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="h-6 w-6" strokeWidth={2.3}/>
                    {item.title}
                  </Button>
                </Link>
              ) : (
                <div>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between gap-3 h-10 text-sm font-medium hover:bg-gray-100",
                      hasActiveSubItem(item)
                        ? "bg-blue-50 text-blue-800 font-semibold"
                        : "text-gray-700"
                    )}
                    onClick={() => toggleExpanded(item.title)}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-6 w-6" strokeWidth={2.3}/>
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
                                ? "bg-blue-100 text-blue-900 hover:bg-blue-200 font-medium"
                                : "text-gray-600 hover:bg-gray-100"
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
      
      {/* Footer - sempre no final */}
      <div className="p-2 border-t border-[hsl(var(--border))]">
        <AdminSidebarFooter />
      </div>
    </div>
  );
} 
