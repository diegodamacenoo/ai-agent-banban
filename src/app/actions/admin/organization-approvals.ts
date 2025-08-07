'use server';

import { createSupabaseServerClient } from "@/core/supabase/server";
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export interface OrganizationApprovalsData {
  pending: number;
  approved: number;
  denied: number;
  lastRequestDate?: string;
}

export interface OrganizationModulesStatusData {
  total: number;
  enabled: number;
  provisioning: number;
  disabled: number;
  error: number;
  modules: Array<{
    id: string;
    name: string;
    status: 'ENABLED' | 'PROVISIONING' | 'DISABLED' | 'ERROR';
    maturity: 'GA' | 'BETA' | 'ALPHA';
  }>;
}

/**
 * Busca dados de aprovações de uma organização específica
 */
export async function getOrganizationApprovalsData(organizationId: string): Promise<{
  success: boolean;
  data?: OrganizationApprovalsData;
  error?: string;
}> {
  try {
    const supabase = await createSupabaseServerClient();

    // Buscar contadores de aprovações por status
    const { data: approvalCounts, error: countsError } = await supabase
      .from('module_approval_requests')
      .select('status')
      .eq('organization_id', organizationId);

    if (countsError) {
      console.error('Erro ao buscar contadores de aprovações:', countsError);
      return { success: false, error: countsError.message };
    }

    // Calcular contadores
    const pending = approvalCounts?.filter(r => r.status === 'PENDING').length || 0;
    const approved = approvalCounts?.filter(r => r.status === 'APPROVED').length || 0;
    const denied = approvalCounts?.filter(r => r.status === 'DENIED').length || 0;

    // Buscar data da última solicitação
    const { data: lastRequest, error: lastRequestError } = await supabase
      .from('module_approval_requests')
      .select('created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Não tratar como erro se não houver solicitações
    const lastRequestDate = lastRequest?.created_at;

    return {
      success: true,
      data: {
        pending,
        approved,
        denied,
        lastRequestDate
      }
    };
  } catch (error) {
    console.error('Erro ao buscar dados de aprovações:', error);
    return {
      success: false,
      error: 'Erro inesperado ao buscar dados de aprovações'
    };
  }
}

/**
 * Busca status dos módulos de uma organização específica
 */
export async function getOrganizationModulesStatusData(organizationId: string): Promise<{
  success: boolean;
  data?: OrganizationModulesStatusData;
  error?: string;
}> {
  try {
    const supabase = await createSupabaseServerClient();

    // Buscar módulos da organização
    const { data: modules, error: modulesError } = await supabase
      .from('tenant_module_assignments')
      .select('module_id, module_name, status, configuration')
      .eq('organization_id', organizationId);

    if (modulesError) {
      console.error('Erro ao buscar módulos da organização:', modulesError);
      return { success: false, error: modulesError.message };
    }

    if (!modules || modules.length === 0) {
      return {
        success: true,
        data: {
          total: 0,
          enabled: 0,
          provisioning: 0,
          disabled: 0,
          error: 0,
          modules: []
        }
      };
    }

    // Mapear status do banco para status da interface
    const mapStatus = (dbStatus: string): 'ENABLED' | 'PROVISIONING' | 'DISABLED' | 'ERROR' => {
      switch (dbStatus) {
        case 'active':
          return 'ENABLED';
        case 'implemented':
          return 'PROVISIONING';
        case 'planned':
        case 'archived':
          return 'DISABLED';
        case 'missing':
        case 'orphaned':
          return 'ERROR';
        default:
          return 'DISABLED';
      }
    };

    // Determinar maturidade baseada na configuração ou nome do módulo
    const getMaturity = (moduleId: string, config: any): 'GA' | 'BETA' | 'ALPHA' => {
      if (config?.maturity) return config.maturity;
      
      // Heurística baseada no nome do módulo
      if (moduleId.includes('ai') || moduleId.includes('experimental')) return 'ALPHA';
      if (moduleId.includes('beta') || moduleId.includes('webhook')) return 'BETA';
      return 'GA';
    };

    // Processar módulos
    const processedModules = modules.map(module => ({
      id: module.module_id,
      name: module.module_name,
      status: mapStatus(module.status),
      maturity: getMaturity(module.module_id, module.configuration)
    }));

    // Calcular contadores
    const enabled = processedModules.filter(m => m.status === 'ENABLED').length;
    const provisioning = processedModules.filter(m => m.status === 'PROVISIONING').length;
    const disabled = processedModules.filter(m => m.status === 'DISABLED').length;
    const error = processedModules.filter(m => m.status === 'ERROR').length;

    return {
      success: true,
      data: {
        total: modules.length,
        enabled,
        provisioning,
        disabled,
        error,
        modules: processedModules
      }
    };
  } catch (error) {
    console.error('Erro ao buscar status dos módulos:', error);
    return {
      success: false,
      error: 'Erro inesperado ao buscar status dos módulos'
    };
  }
}

// Schema para validação de aprovação/negação
const approvalActionSchema = z.object({
  requestId: z.string().uuid(),
  notes: z.string().optional(),
  autoStartProvisioning: z.boolean().default(true),
  notifyRequester: z.boolean().default(true),
  scheduleOutsideHours: z.boolean().default(false),
});

/**
 * Aprova uma solicitação de módulo
 */
export async function approveModuleRequest(formData: z.infer<typeof approvalActionSchema>): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validation = approvalActionSchema.safeParse(formData);
    
    if (!validation.success) {
      return { 
        success: false,
        error: validation.error.errors.map(e => e.message).join(', ') 
      };
    }

    const supabase = await createSupabaseServerClient();
    
    // Verificar se request existe e está pendente
    const { data: request, error: fetchError } = await supabase
      .from('module_approval_requests')
      .select('*')
      .eq('id', validation.data.requestId)
      .eq('status', 'PENDING')
      .single();

    if (fetchError || !request) {
      return { success: false, error: 'Solicitação não encontrada ou já processada.' };
    }

    // Atualizar status para APPROVED
    const { error: updateError } = await supabase
      .from('module_approval_requests')
      .update({
        status: 'APPROVED',
        approved_at: new Date().toISOString(),
        review_notes: validation.data.notes,
        metadata: {
          auto_start_provisioning: validation.data.autoStartProvisioning,
          notify_requester: validation.data.notifyRequester,
          schedule_outside_hours: validation.data.scheduleOutsideHours
        }
      })
      .eq('id', validation.data.requestId);

    if (updateError) {
      console.error('Erro ao aprovar solicitação:', updateError);
      return { success: false, error: 'Erro ao processar aprovação.' };
    }

    revalidatePath('/admin/organizations');
    return { success: true };
  } catch (error) {
    console.error('Erro inesperado em approveModuleRequest:', error);
    return { success: false, error: 'Erro inesperado ao aprovar solicitação.' };
  }
}

/**
 * Nega uma solicitação de módulo
 */
export async function denyModuleRequest(formData: z.infer<typeof approvalActionSchema>): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validation = approvalActionSchema.safeParse(formData);
    
    if (!validation.success) {
      return { 
        success: false,
        error: validation.error.errors.map(e => e.message).join(', ') 
      };
    }

    if (!validation.data.notes?.trim()) {
      return { success: false, error: 'Observações são obrigatórias para negação.' };
    }

    const supabase = await createSupabaseServerClient();
    
    // Verificar se request existe e está pendente
    const { data: request, error: fetchError } = await supabase
      .from('module_approval_requests')
      .select('*')
      .eq('id', validation.data.requestId)
      .eq('status', 'PENDING')
      .single();

    if (fetchError || !request) {
      return { success: false, error: 'Solicitação não encontrada ou já processada.' };
    }

    // Atualizar status para DENIED
    const { error: updateError } = await supabase
      .from('module_approval_requests')
      .update({
        status: 'DENIED',
        denied_at: new Date().toISOString(),
        review_notes: validation.data.notes,
        metadata: {
          notify_requester: validation.data.notifyRequester
        }
      })
      .eq('id', validation.data.requestId);

    if (updateError) {
      console.error('Erro ao negar solicitação:', updateError);
      return { success: false, error: 'Erro ao processar negação.' };
    }

    revalidatePath('/admin/organizations');
    return { success: true };
  } catch (error) {
    console.error('Erro inesperado em denyModuleRequest:', error);
    return { success: false, error: 'Erro inesperado ao negar solicitação.' };
  }
}