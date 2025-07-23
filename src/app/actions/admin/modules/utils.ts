import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BaseModule } from './schemas'; // Importar BaseModule do novo arquivo de schemas
import { conditionalDebugLog } from './system-config-utils';

/**
 * Função utilitária para verificar acesso administrativo
 */
export async function verifyAdminAccess() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { isAuthenticated: false, isAdmin: false, user: null };
  }

  // Verificar se é admin através do perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'master_admin';
  
  return { isAuthenticated: true, isAdmin, user };
}

// Funções utilitárias internas (não são server actions)
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífen
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
}

// Validar JSON Schema
export function validateJsonSchema(schema: Record<string, any>): boolean {
  try {
    // Validações básicas do JSON Schema
    if (typeof schema !== 'object' || schema === null) return false;
    
    // Se tem type, deve ser válido
    if (schema.type && !['string', 'number', 'integer', 'boolean', 'array', 'object'].includes(schema.type)) {
      return false;
    }
    
    // Se tem properties, deve ser objeto
    if (schema.properties && typeof schema.properties !== 'object') {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// Verificar dependências circulares
export async function checkCircularDependencies(moduleId: string, dependencies: string[]): Promise<boolean> {
  if (!dependencies.length) return false;
  
  const supabase = await createSupabaseServerClient();
  
  // Função recursiva para verificar dependências
  async function checkDependency(depId: string, visited: Set<string>): Promise<boolean> {
    if (visited.has(depId)) return true; // Dependência circular encontrada
    if (depId === moduleId) return true; // Autoreferência
    
    visited.add(depId);
    
    const { data: module } = await supabase
      .from('base_modules')
      .select('dependencies')
      .eq('id', depId)
      .single();
    
    if (module?.dependencies?.length) {
      for (const subDep of module.dependencies) {
        if (await checkDependency(subDep, visited)) return true;
      }
    }
    
    visited.delete(depId);
    return false;
  }
  
  for (const depId of dependencies) {
    if (await checkDependency(depId, new Set())) return true;
  }
  
  return false;
}

/**
 * Verificar dependências de módulo para um tenant
 */
export async function checkModuleDependenciesForTenant(
  organizationId: string, 
  dependencies: string[]
): Promise<{ satisfied: boolean; missing: string[] }> {
  const supabase = await createSupabaseServerClient();

  const { data: assignedModules, error } = await supabase
    .from('tenant_module_assignments')
    .select('base_module_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active');

  if (error) {
    console.error('Erro ao buscar assignments de módulos para o tenant:', error);
    return { satisfied: false, missing: dependencies };
  }

  const assignedModuleIds = new Set(assignedModules?.map(am => am.base_module_id));
  const missingDependencies: string[] = [];

  for (const depId of dependencies) {
    if (!assignedModuleIds.has(depId)) {
      // Buscar nome do módulo para melhor mensagem de erro
      const { data: module } = await supabase
        .from('base_modules')
        .select('name')
        .eq('id', depId)
        .single();
      missingDependencies.push(module?.name || depId);
    }
  }

  return {
    satisfied: missingDependencies.length === 0,
    missing: missingDependencies,
  };
}

/**
 * Enviar notificação de ativação de módulo para o tenant
 */
export async function notifyTenantModuleActivation(
  organizationId: string, 
  moduleName: string, 
  implementationName: string
): Promise<void> {
  // TODO: Implementar lógica de notificação (e-mail, webhook, etc.)
  await conditionalDebugLog('Notificação de módulo ativado', { organizationId, moduleName, implementationName });
}
