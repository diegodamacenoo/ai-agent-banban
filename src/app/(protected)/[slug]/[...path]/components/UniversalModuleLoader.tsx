/**
 * UniversalModuleLoader - Carregador universal de módulos
 * Fase 4 - Route Simplification
 * 
 * Substitui o DynamicModulePage.tsx com integração completa ao DynamicModuleRegistry
 */

'use client';

import React, { useState, useEffect } from 'react';
import { dynamicModuleRegistry } from '@/core/modules/registry/DynamicModuleRegistry';
import { Organization, resolveSubModulePath } from '../lib/client-helpers';
import { ModuleErrorFallback } from './ModuleErrorFallback';
import { LoadingFallback } from './LoadingFallback';
import { ModuleNotFound } from './ModuleNotFound';

interface UniversalModuleLoaderProps {
  organization: Organization;
  moduleSlug: string;
  subPath?: string[];
  searchParams?: Record<string, string>;
  originalParams?: any;
}

interface ModuleState {
  Component: React.ComponentType<any> | null;
  moduleData: any;
  loading: boolean;
  error: string | null;
}

/**
 * Carregador universal que funciona com qualquer módulo registrado
 */
export const UniversalModuleLoader: React.FC<UniversalModuleLoaderProps> = ({
  organization,
  moduleSlug,
  subPath = [],
  searchParams = {},
  originalParams
}) => {
  const [state, setState] = useState<ModuleState>({
    Component: null,
    moduleData: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    loadModule();
  }, [organization.id, organization.client_type, moduleSlug, subPath.join('/')]);

  const loadModule = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.debug(`🔄 UniversalModuleLoader: Carregando ${moduleSlug} para ${organization.client_type}`);

            const loadedModule = await dynamicModuleRegistry.loadAndGetComponent(organization.id, moduleSlug);

      if (!loadedModule) {
        throw new Error(`Módulo '${moduleSlug}' não encontrado ou não disponível`);
      }

      const { component: Component, config: moduleData } = loadedModule;

      console.debug(`📊 Dados do módulo carregados:`, {
        slug: moduleData.slug,
        name: moduleData.name,
        componentPath: moduleData.implementation.component_path
      });

      // A lógica de sub-rota pode ser removida se o componente principal já a gerencia
      // ou ajustada se necessário. Por enquanto, vamos simplificar.
      
      console.debug(`✅ Componente carregado com sucesso: ${moduleData.implementation.component_path}`);

      setState({
        Component,
        moduleData,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error(`❌ Erro ao carregar módulo ${moduleSlug}:`, error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  };

  // Estados de loading e erro
  if (state.loading) {
    return <LoadingFallback type="module" moduleSlug={moduleSlug} />;
  }

  if (state.error) {
    return (
      <ModuleErrorFallback
        error={state.error}
        moduleSlug={moduleSlug}
        organization={organization}
        onRetry={loadModule}
      />
    );
  }

  if (!state.Component || !state.moduleData) {
    return (
      <ModuleNotFound
        moduleSlug={moduleSlug}
        organization={organization}
        availableModules={[]} // TODO: Carregar módulos disponíveis
      />
    );
  }

  // 4. Renderizar componente com props padronizadas
  const moduleProps = {
    // Props originais para compatibilidade
    params: originalParams || {
      slug: organization.slug,
      module: moduleSlug,
      path: subPath
    },
    
    // Props da organização
    organization,
    
    // Props do módulo
    moduleData: state.moduleData,
    moduleSlug,
    
    // Props de navegação
    subPath,
    searchParams,
    
    // Props de rota
    route: `/${organization.slug}/${moduleSlug}${subPath.length > 0 ? `/${subPath.join('/')}` : ''}`,
    
    // Props de configuração
    config: state.moduleData.implementation.config || {},
    permissions: state.moduleData.implementation.permissions || [],
    
    // Props de contexto
    clientType: organization.client_type,
    organizationId: organization.id,
    organizationSlug: organization.slug,
    
    // Metadata do módulo
    moduleMetadata: {
      name: state.moduleData.name,
      description: state.moduleData.description,
      version: state.moduleData.version || '1.0.0',
      icon: state.moduleData.implementation.icon_name
    }
  };

  console.debug(`🎨 Renderizando módulo ${moduleSlug} com props:`, {
    component: state.Component.name || 'AnonymousComponent',
    propsKeys: Object.keys(moduleProps),
    route: moduleProps.route
  });

  return (
    <div className="universal-module-container">
      <state.Component {...moduleProps} />
    </div>
  );
};

export default UniversalModuleLoader;