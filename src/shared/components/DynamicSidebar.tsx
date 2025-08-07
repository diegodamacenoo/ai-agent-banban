/**
 * DynamicSidebar - Sidebar dinâmica baseada em configurações do banco
 * Fase 3 - Dynamic Navigation Implementation
 * 
 * Refatorado para usar shared/ui/sidebar.tsx seguindo o padrão do admin-sidebar.tsx
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/shared/utils/utils';
import { 
  Home, 
  Loader2, 
  AlertTriangle, 
  Settings, 
  ChevronDown, 
  ChevronRight
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Sidebar, SidebarContent, SidebarHeader } from '@/shared/ui/sidebar';
import { Badge } from '@/shared/ui/badge';
import { dynamicModuleRegistryClient } from '@/core/modules/registry/DynamicModuleRegistryClient';
import { 
  ModuleConfiguration, 
  NavigationItem, 
  ClientType 
} from '@/core/modules/types';

// Ícones dinâmicos do Lucide
import * as LucideIcons from 'lucide-react';

// Types para o DynamicSidebar
interface DynamicSidebarProps {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  clientType: ClientType;
  className?: string;
}

interface SidebarState {
  modules: ModuleConfiguration[];
  navigation: NavigationItem[];
  loading: boolean;
  error: string | null;
  lastLoaded: number;
}

/**
 * Hook para carregar navegação dinâmica
 */
function useDynamicNavigation(
  organizationId: string,
  clientType: ClientType,
  organizationSlug: string
) {
  const [state, setState] = useState<SidebarState>({
    modules: [],
    navigation: [],
    loading: true,
    error: null,
    lastLoaded: 0
  });

  const loadNavigation = useCallback(async () => {
    if (!organizationId) {
      setState(prev => ({ ...prev, loading: false, error: 'ID da organização não disponível' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.debug(`🔄 DynamicSidebar: Carregando navegação para org=${organizationSlug}`);

      // Usar nova API simplificada
      const apiResponse = await dynamicModuleRegistryClient.loadModuleConfiguration(organizationId);

      if (apiResponse.error) {
        throw new Error(apiResponse.error);
      }

      // Usar navegação já gerada pela API
      const generatedNavigation = apiResponse.navigation || [];

      // Verificar se já existe um item Home/Dashboard na navegação
      const hasHome = generatedNavigation.some(item => 
        item.id === 'home' || 
        item.id === 'dashboard' || 
        item.href === '/' || 
        item.href === '/dashboard' ||
        item.title?.toLowerCase() === 'home' ||
        item.title?.toLowerCase() === 'dashboard'
      );

      // Adicionar item Home apenas se não existir
      const navigationWithHome: NavigationItem[] = [
        ...(hasHome ? [] : [{
          id: 'home',
          title: 'Home',
          icon: 'Home',
          href: `/${organizationSlug}`,
          exact: true
        }]),
        ...generatedNavigation.map(item => ({
          ...item,
          href: item.href ? `/${organizationSlug}${item.href.startsWith('/') ? item.href : `/${item.href}`}` : undefined,
          items: item.items?.map(subItem => ({
            ...subItem,
            href: `/${organizationSlug}${subItem.href.startsWith('/') ? subItem.href : `/${subItem.href}`}`
          }))
        }))
      ];

      setState({
        modules: [], // Não precisamos mais dos módulos completos
        navigation: navigationWithHome,
        loading: false,
        error: null,
        lastLoaded: Date.now()
      });

      console.debug(`✅ DynamicSidebar: ${apiResponse.total} módulos e ${navigationWithHome.length} itens de navegação carregados`);
      console.debug('📋 Navegação final:', navigationWithHome);

    } catch (error) {
      console.error('❌ DynamicSidebar: Erro ao carregar navegação:', error);
      
      // Usar navegação de fallback (Home e Dashboard são a mesma coisa)
      const fallbackNavigation: NavigationItem[] = [
        {
          id: 'home',
          title: 'Home',
          icon: 'Home',
          href: `/${organizationSlug}`,
          exact: true
        },
        {
          id: 'insights',
          title: 'Insights',
          icon: 'BarChart3',
          href: `/${organizationSlug}/insights`
        }
      ];

      setState({
        modules: [],
        navigation: fallbackNavigation,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        lastLoaded: Date.now()
      });
    }
  }, [organizationId, organizationSlug]);

  // Carregar navegação inicial
  useEffect(() => {
    loadNavigation();
  }, [loadNavigation]);

  // Recarregar a cada 5 minutos (cache refresh)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - state.lastLoaded > 5 * 60 * 1000) { // 5 minutos
        loadNavigation();
      }
    }, 60 * 1000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [loadNavigation, state.lastLoaded]);

  return {
    ...state,
    reload: loadNavigation
  };
}

/**
 * Função para obter ícone dinâmico do Lucide
 */
function getLucideIcon(iconName?: string) {
  if (!iconName) return Home;
  
  // Buscar ícone no Lucide Icons
  const Icon = (LucideIcons as any)[iconName];
  return Icon || Home;
}

/**
 * Componente principal DynamicSidebar
 */
export const DynamicSidebar: React.FC<DynamicSidebarProps> = ({
  organizationId,
  organizationSlug,
  organizationName,
  clientType,
  className
}) => {
  const pathname = usePathname();
  const { navigation, loading, error, reload } = useDynamicNavigation(
    organizationId,
    clientType,
    organizationSlug
  );

  // Estado para controlar itens expandidos
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Expandir automaticamente seções baseado na rota atual
  useEffect(() => {
    const newExpanded: string[] = [];
    
    navigation.forEach(item => {
      if (item.items?.some(subItem => pathname === subItem.href || pathname.startsWith(`${subItem.href  }/`))) {
        newExpanded.push(item.id);
      }
    });
    
    setExpandedItems(prev => {
      const combined = [...new Set([...prev, ...newExpanded])];
      return combined;
    });
  }, [pathname, navigation]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Verificar se um subitem está ativo
  const isSubItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href  }/`);
  };

  // Verificar se algum subitem de um item pai está ativo
  const hasActiveSubItem = (item: NavigationItem) => {
    if (!item.items) return false;
    return item.items.some(subItem => pathname === subItem.href || pathname.startsWith(`${subItem.href  }/`));
  };

  // Lógica principal de ativação para itens principais
  const isActive = (item: NavigationItem) => {
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

  // Renderizar estado de loading
  if (loading) {
    return (
      <Sidebar variant="inset" className={cn("border-r border-zinc-200 p-0", className)}>
        <SidebarHeader className="border-b border-zinc-200 p-4 h-[75px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {organizationName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="font-medium text-zinc-900">{organizationName || 'Carregando...'}</h2>
              <p className="text-xs text-zinc-500">Carregando...</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="ml-2 text-muted-foreground">Carregando navegação...</span>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Renderizar estado de erro
  if (error) {
    return (
      <Sidebar variant="inset" className={cn("border-r border-zinc-200 p-0", className)}>
        <SidebarHeader className="border-b border-zinc-200 p-4 h-[75px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {organizationName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="font-medium text-zinc-900">{organizationName || 'Organização'}</h2>
              <p className="text-xs text-zinc-500">Erro ao carregar</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Erro ao carregar navegação</span>
            </div>
            <p className="text-xs text-muted-foreground">{error}</p>
            <button
              onClick={reload}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Tentar novamente
            </button>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar variant="inset" className={cn("border-r border-zinc-200 p-0", className)}>
      {/* Header */}
      <SidebarHeader className="border-b border-zinc-200 p-4 h-[75px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            {organizationName?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <h2 className="font-medium text-zinc-900">{organizationName || 'Sistema Axon'}</h2>
            <p className="text-xs text-zinc-500">Sistema Axon</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="p-2">
        <nav className="space-y-2">
          {navigation.length === 0 ? (
            // Mostrar mensagem quando não há módulos
            <div className="p-4 text-center text-gray-500">
              <div className="mb-2">
                <AlertTriangle className="h-8 w-8 mx-auto text-gray-400" />
              </div>
              <p className="text-sm">Nenhum módulo disponível</p>
              <p className="text-xs mt-1">Entre em contato com o administrador</p>
            </div>
          ) : (
            navigation.map((item) => {
            const IconComponent = getLucideIcon(item.icon);
            
            return (
              <div key={item.id}>
                {item.href ? (
                  // Item com link direto
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-10 font-medium text-md",
                        isActive(item)
                          ? "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
                          : "text-zinc-700 hover:bg-zinc-100"
                      )}
                    >
                      <IconComponent className="h-6 w-6" strokeWidth={2.5} />
                      {item.title}
                    </Button>
                  </Link>
                ) : (
                  // Item com submenu
                  <div>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between gap-3 h-10 text-md font-medium hover:bg-zinc-100",
                        hasActiveSubItem(item)
                          ? "bg-zinc-100 text-zinc-800 font-semibold"
                          : "text-zinc-700"
                      )}
                      onClick={() => toggleExpanded(item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-6 w-6" strokeWidth={2.5} />
                        {item.title}
                      </div>
                      {expandedItems.includes(item.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Submenu */}
                    {expandedItems.includes(item.id) && item.items && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.items.map((subItem) => (
                          <Link key={subItem.href} href={subItem.href}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full justify-start h-8 text-sm",
                                isSubItemActive(subItem.href)
                                  ? "bg-zinc-200 text-zinc-700 hover:bg-zinc-100"
                                  : "text-zinc-600 hover:bg-zinc-100"
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
            );
          })
          )}

          {/* Footer com informações de debug (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 pt-4 border-t border-zinc-200">
              <Link href="/admin/modules">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-3 h-8 text-sm text-zinc-600 hover:bg-zinc-100"
                >
                  <Settings className="h-4 w-4" />
                  Admin Módulos
                </Button>
              </Link>
              {!loading && !error && (
                <div className="mt-2 px-2">
                  <Badge variant="outline" className="text-xs">
                    {navigation.length} itens
                  </Badge>
                </div>
              )}
            </div>
          )}
        </nav>
      </SidebarContent>
    </Sidebar>
  );
};

/**
 * Hook para usar em layouts
 */
export const useDynamicSidebar = (
  organizationId: string,
  clientType: ClientType,
  organizationSlug: string
) => {
  return useDynamicNavigation(organizationId, clientType, organizationSlug);
};

/**
 * Wrapper para compatibilidade com o sistema antigo
 */
export const DynamicSidebarWrapper: React.FC<{
  organization?: {
    id?: string;
    slug?: string;
    company_trading_name?: string;
    company_legal_name?: string;
    client_type?: string;
  };
  className?: string;
}> = ({ organization, className }) => {
  // Se não tiver organização, renderizar estado de loading
  if (!organization) {
    return (
      <Sidebar variant="inset" className={cn("border-r border-zinc-200 p-0", className)}>
        <SidebarHeader className="border-b border-zinc-200 p-4 h-[75px]">
          <div className="flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="ml-2 text-muted-foreground">Carregando...</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="ml-2 text-muted-foreground">Carregando navegação...</span>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Determinar o nome da organização
  const organizationName = organization.company_trading_name || organization.company_legal_name || 'Sistema Axon';

  return (
    <DynamicSidebar
      organizationId={organization.id || ''}
      organizationSlug={organization.slug || ''}
      organizationName={organizationName}
      clientType={(organization.client_type as ClientType) || 'standard'}
      className={className}
    />
  );
};

export default DynamicSidebar;