import type { SupabaseClient } from '@supabase/supabase-js';
import { CoreModule } from './ModuleCatalogService';

// Este tipo deve eventualmente ser movido para um arquivo compartilhado
export type ModuleTenantStatus =
  | 'REQUESTED'
  | 'PENDING_APPROVAL'
  | 'PROVISIONING'
  | 'ENABLED'
  | 'UPGRADING'
  | 'UP_TO_DATE'
  | 'SUSPENDED'
  | 'DISABLED'
  | 'ARCHIVED'
  | 'ERROR';

export interface TenantModule {
  organization_id: string;
  module_id: string;
  status: ModuleTenantStatus;
  activated_at: string | null;
  updated_at: string | null;
  // Dados unidos da tabela core_modules
  core_modules: CoreModule;
}

export class TenantModuleService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Busca todos os módulos atribuídos a uma organização específica.
   * @param organizationId O UUID da organização.
   * @returns Uma promessa que resolve para um array de objetos TenantModule.
   */
  async getAssignedModules(organizationId: string): Promise<TenantModule[]> {
    const { data, error } = await this.supabase
      .from('tenant_module_assignments')
      .select(`
        *,
        core_modules (
          *
        )
      `)
      .eq('organization_id', organizationId);

    if (error) {
      console.error(`Erro ao buscar módulos para a organização ${organizationId}:`, error.message);
      throw new Error('Não foi possível buscar os módulos atribuídos.');
    }

    return data || [];
  }

  /**
   * Atualiza o status de um módulo para uma organização específica.
   * @param organizationId O UUID da organização.
   * @param moduleId O UUID do módulo.
   * @param status O novo status para o módulo.
   * @returns Uma promessa que resolve para o objeto TenantModule atualizado.
   */
  async updateModuleStatus(
    organizationId: string,
    moduleId: string,
    status: ModuleTenantStatus
  ): Promise<TenantModule | null> {
    const { data, error } = await this.supabase
      .from('tenant_module_assignments')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('module_id', moduleId)
      .select(`
        *,
        core_modules (
          *
        )
      `)
      .single();

    if (error) {
      console.error(`Erro ao atualizar status do módulo para org ${organizationId}, módulo ${moduleId}:`, error.message);
      throw new Error('Não foi possível atualizar o status do módulo.');
    }

    return data;
  }
} 