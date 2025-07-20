/**
 * UniversalHomePage - Página Home unificada
 * Fase 4 - Route Simplification
 * 
 * Substitui múltiplas implementações de home/dashboard por uma única
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Organization } from '../lib/client-helpers';
import { DynamicModuleRegistry } from '@/core/modules/registry/DynamicModuleRegistry';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { 
  Home, 
  ExternalLink, 
  Activity, 
  BarChart3, 
  Bell, 
  Package,
  Settings,
  Users,
  FileText,
  Calendar,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface UniversalHomePageProps {
  organization: Organization;
  searchParams?: Record<string, string>;
}

interface ModuleSummary {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  navigation?: any;
}

/**
 * Página home que se adapta ao client_type e módulos disponíveis
 */
export const UniversalHomePage: React.FC<UniversalHomePageProps> = ({
  organization,
  searchParams
}) => {
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailableModules();
  }, [organization.id, organization.client_type]);

  const loadAvailableModules = async () => {
    try {
      setLoading(true);
      const registry = DynamicModuleRegistry.getInstance();
      const moduleConfigs = await registry.loadModuleConfiguration(
        organization.id
      );
      
      // Convert module configurations to ModuleSummary format
      const availableModules = moduleConfigs.map(config => ({
        slug: config.slug,
        name: config.name,
        description: config.description ?? undefined,
        icon: config.implementation?.icon_name ?? undefined,
        navigation: config.navigation,
      }));
      
      setModules(availableModules);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
      setModules([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  const getModuleIcon = (iconName?: string) => {
    const iconMap: Record<string, React.ComponentType> = {
      'BarChart3': BarChart3,
      'Activity': Activity,
      'Bell': Bell,
      'Package': Package,
      'Settings': Settings,
      'Users': Users,
      'FileText': FileText,
      'Calendar': Calendar,
      'TrendingUp': TrendingUp,
      'Home': Home
    };

    const Icon = iconName ? iconMap[iconName] || Activity : Activity;
    return <Icon className="w-6 h-6" />;
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Bem-vindo, {organization.name}
          </h1>
          <p className="text-muted-foreground">
            Dashboard principal - {organization.client_type}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {organization.client_type}
          </Badge>
          {!organization.is_implementation_complete && (
            <Badge variant="secondary">
              Em Implementação
            </Badge>
          )}
        </div>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Módulos Ativos</p>
                <p className="text-2xl font-bold">{modules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold text-green-600">
                  {organization.is_implementation_complete ? 'Completo' : 'Em Progresso'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Configuração</p>
                <p className="text-lg font-semibold">
                  {organization.client_type === 'banban' ? 'Avançada' : 'Padrão'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Último Acesso</p>
                <p className="text-lg font-semibold">Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Módulos Disponíveis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Módulos Disponíveis
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${organization.slug}/settings`}>
                <Settings className="w-4 h-4 mr-2" />
                Configurar
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => (
                <Card key={module.slug} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getModuleIcon(module.icon)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{module.name}</h3>
                        {module.description && (
                          <p className="text-sm text-muted-foreground">
                            {module.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      asChild
                    >
                      <Link href={`/${organization.slug}/${module.slug}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Acessar
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-600">
                Nenhum módulo configurado
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Entre em contato com o administrador para configurar módulos.
              </p>
              <Button variant="outline" asChild>
                <Link href={`/${organization.slug}/settings`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Ir para Configurações
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações Rápidas (se applicable) */}
      {modules.some(m => m.slug === 'alerts') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" asChild>
                <Link href={`/${organization.slug}/alerts`}>
                  <Bell className="w-4 h-4 mr-2" />
                  Ver Alertas
                </Link>
              </Button>
              
              {modules.some(m => m.slug === 'reports') && (
                <Button variant="outline" asChild>
                  <Link href={`/${organization.slug}/reports`}>
                    <FileText className="w-4 h-4 mr-2" />
                    Relatórios
                  </Link>
                </Button>
              )}
              
              {modules.some(m => m.slug === 'performance') && (
                <Button variant="outline" asChild>
                  <Link href={`/${organization.slug}/performance`}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Performance
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UniversalHomePage;