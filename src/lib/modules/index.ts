// ========================================
// NOVA ARQUITETURA DE MÓDULOS - HELPER
// Data: 2025-07-11
// Objetivo: Funções para trabalhar com a nova estrutura de módulos
// ========================================

import { createSupabaseServerClient } from '@/core/supabase/server';
import { cache } from 'react';

interface ModuleImplementation {
  id: string;
  implementation_key: string;
  name: string;
  component_path: string;
  audience: 'generic' | 'client-specific' | 'enterprise';
  component_type: 'basic' | 'standard' | 'advanced' | 'enterprise';
  is_default: boolean;
}

interface BaseModule {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
}

interface TenantModuleAssignment {
  tenant_id: string;
  base_module_id: string;
  implementation_id: string;
  is_active: boolean;
  custom_config: Record<string, any>;
  assigned_at: string;
}

interface ModuleResult {
  implementation: ModuleImplementation;
  config: Record<string, any>;
  isActive: boolean;
  baseModule: BaseModule;
}

/**
 * Busca a implementação ativa de um módulo para um tenant específico
 * Com cache para evitar múltiplas requests durante SSR
 */
export const getModuleImplementation = cache(async function getModuleImplementation(
  tenantSlug: string, 
  moduleSlug: string
): Promise<ModuleResult | null> {
  const supabase = await createSupabaseServerClient();

  try {
    // Primeiro, buscar o tenant_id pelo slug
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (orgError || !organization) {
      console.error('Organização não encontrada:', tenantSlug);
      return null;
    }

    // Buscar assignment do tenant para o módulo
    const { data: assignment, error: assignmentError } = await supabase
      .from('tenant_module_assignments')
      .select(`
        *,
        base_modules!inner(*),
        module_implementations(*)
      `)
      .eq('tenant_id', organization.id)
      .eq('base_modules.slug', moduleSlug)
      .eq('is_active', true)
      .single();

    if (assignmentError || !assignment) {
      // Se não houver assignment, buscar implementação padrão
      console.debug(`Sem assignment para ${tenantSlug}/${moduleSlug}, buscando padrão`);
      return await getDefaultModuleImplementation(moduleSlug);
    }

    return {
      implementation: assignment.module_implementations,
      config: assignment.custom_config || {},
      isActive: assignment.is_active,
      baseModule: assignment.base_modules
    };

  } catch (error) {
    console.error('Erro ao buscar implementação do módulo:', error);
    return await getDefaultModuleImplementation(moduleSlug);
  }
});

/**
 * Busca a implementação padrão de um módulo
 * Com cache para evitar múltiplas requests
 */
export const getDefaultModuleImplementation = cache(async function getDefaultModuleImplementation(
  moduleSlug: string
): Promise<ModuleResult | null> {
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('base_modules')
      .select(`
        *,
        module_implementations!inner(*)
      `)
      .eq('slug', moduleSlug)
      .eq('is_active', true)
      .eq('module_implementations.is_default', true)
      .single();

    if (error || !data) {
      console.error('Implementação padrão não encontrada:', moduleSlug);
      return null;
    }

    return {
      implementation: data.module_implementations[0],
      config: {},
      isActive: true,
      baseModule: {
        id: data.id,
        slug: data.slug,
        name: data.name,
        description: data.description,
        category: data.category,
        is_active: data.is_active
      }
    };

  } catch (error) {
    console.error('Erro ao buscar implementação padrão:', error);
    return null;
  }
});

/**
 * Lista todos os módulos disponíveis para um tenant
 */
export async function getAvailableModules(tenantSlug: string): Promise<BaseModule[]> {
  const supabase = await createSupabaseServerClient();

  try {
    // Buscar tenant
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (orgError || !organization) {
      console.error('Organização não encontrada:', tenantSlug);
      return [];
    }

    // Buscar módulos ativos do tenant
    const { data: modules, error } = await supabase
      .from('tenant_module_assignments')
      .select(`
        base_modules!inner(*)
      `)
      .eq('tenant_id', organization.id)
      .eq('is_active', true)
      .eq('base_modules.is_active', true);

    if (error) {
      console.error('Erro ao buscar módulos disponíveis:', error);
      return [];
    }

    return modules.map(m => m.base_modules);

  } catch (error) {
    console.error('Erro ao buscar módulos disponíveis:', error);
    return [];
  }
}

/**
 * Lista todas as implementações disponíveis para um módulo
 */
export async function getModuleImplementations(
  moduleSlug: string
): Promise<ModuleImplementation[]> {
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('module_implementations')
      .select(`
        *,
        base_modules!inner(*)
      `)
      .eq('base_modules.slug', moduleSlug)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('implementation_key');

    if (error) {
      console.error('Erro ao buscar implementações do módulo:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('Erro ao buscar implementações do módulo:', error);
    return [];
  }
}

/**
 * Atualiza a configuração customizada de um módulo para um tenant
 */
export async function updateModuleConfig(
  tenantSlug: string,
  moduleSlug: string,
  config: Record<string, any>
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  try {
    // Buscar tenant
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (orgError || !organization) {
      console.error('Organização não encontrada:', tenantSlug);
      return false;
    }

    // Buscar base_module
    const { data: baseModule, error: moduleError } = await supabase
      .from('base_modules')
      .select('id')
      .eq('slug', moduleSlug)
      .single();

    if (moduleError || !baseModule) {
      console.error('Módulo não encontrado:', moduleSlug);
      return false;
    }

    // Atualizar configuração
    const { error: updateError } = await supabase
      .from('tenant_module_assignments')
      .update({ 
        custom_config: config,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', organization.id)
      .eq('base_module_id', baseModule.id);

    if (updateError) {
      console.error('Erro ao atualizar configuração:', updateError);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Erro ao atualizar configuração do módulo:', error);
    return false;
  }
}

/**
 * Converte component path para nome do componente React
 */
export function getComponentNameFromPath(componentPath: string): string {
  // /implementations/BanbanPerformanceImplementation -> BanbanPerformanceImplementation
  const match = componentPath.match(/\/implementations\/([A-Za-z0-9_-]+)$/);
  return match ? match[1] : 'DefaultImplementation';
}

/**
 * Helper para log de debug durante migração
 */
export function logModuleOperation(
  operation: string, 
  tenant: string, 
  module: string, 
  details?: any
): void {
  // Logs suprimidos para limpar terminal - reativar se necessário para debug
  // if (process.env.NODE_ENV === 'development') {
  //   console.debug(`[MODULES] ${operation}: ${tenant}/${module}`, details);
  // }
}