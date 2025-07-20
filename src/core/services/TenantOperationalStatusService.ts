import { createSupabaseServerClient } from '@/core/supabase/server';
import {
  TenantOperationalStatus,
  StatusTransitionResult,
  UpdateStatusParams,
  ModuleRequestParams,
  ApprovalDecisionParams,
  TenantModuleOperational,
  ModuleApprovalRequest,
  TenantOperationalStats,
  isValidStatusTransition,
  getValidNextStatuses
} from '@/shared/types/tenant-operational-status';

export class TenantOperationalStatusService {
  /**
   * Atualiza o status operacional de um módulo para um tenant
   */
  static async updateStatus(params: UpdateStatusParams): Promise<StatusTransitionResult> {
    try {
      const supabase = await createSupabaseServerClient();

      // Buscar status atual
      const { data: currentModule, error: fetchError } = await supabase
        .from('tenant_module_assignments')
        .select('operational_status')
        .eq('organization_id', params.organization_id)
        .eq('module_id', params.module_id)
        .single();

      if (fetchError || !currentModule) {
        return {
          success: false,
          error: 'Módulo não encontrado para esta organização'
        };
      }

      const currentStatus = currentModule.operational_status as TenantOperationalStatus;

      // Validar transição
      if (!isValidStatusTransition(currentStatus, params.new_status)) {
        return {
          success: false,
          error: `Transição inválida de ${currentStatus} para ${params.new_status}`,
          validation_errors: [
            `Status atual: ${currentStatus}`,
            `Status solicitado: ${params.new_status}`,
            `Transições válidas: ${getValidNextStatuses(currentStatus).join(', ')}`
          ]
        };
      }

      // Preparar dados de atualização
      const updateData: any = {
        operational_status: params.new_status,
        last_status_change: new Date().toISOString(),
        status_change_reason: params.reason,
        updated_at: new Date().toISOString()
      };

      // Adicionar campos específicos baseados no status
      switch (params.new_status) {
        case 'PENDING_APPROVAL':
          updateData.approval_requested_at = new Date().toISOString();
          break;
        case 'PROVISIONING':
          updateData.provisioning_started_at = new Date().toISOString();
          if (params.changed_by) {
            updateData.approved_by = params.changed_by;
            updateData.approved_at = new Date().toISOString();
          }
          break;
        case 'ENABLED':
        case 'UP_TO_DATE':
          updateData.provisioning_completed_at = new Date().toISOString();
          updateData.health_status = 'healthy';
          updateData.error_details = null;
          updateData.retry_count = 0;
          break;
        case 'ERROR':
          updateData.error_details = params.metadata?.error_details || {};
          updateData.retry_count = (currentModule as any).retry_count + 1 || 1;
          updateData.health_status = 'critical';
          break;
        case 'SUSPENDED':
          updateData.health_status = 'warning';
          break;
        case 'DISABLED':
        case 'ARCHIVED':
          updateData.health_status = 'unknown';
          break;
      }

      // Executar atualização
      const { error: updateError } = await supabase
        .from('tenant_module_assignments')
        .update(updateData)
        .eq('organization_id', params.organization_id)
        .eq('module_id', params.module_id);

      if (updateError) {
        return {
          success: false,
          error: `Erro ao atualizar status: ${updateError.message}`
        };
      }

      // Registrar no histórico
      await this.recordStatusChange(
        params.organization_id,
        params.module_id,
        currentStatus,
        params.new_status,
        params.changed_by,
        params.reason,
        params.metadata
      );

      return {
        success: true,
        previous_status: currentStatus,
        new_status: params.new_status,
        metadata: params.metadata
      };

    } catch (error) {
      console.error('Erro ao atualizar status operacional:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Solicita habilitação de um módulo para um tenant
   */
  static async requestModule(params: ModuleRequestParams): Promise<StatusTransitionResult> {
    try {
      const supabase = await createSupabaseServerClient();

      // Verificar se o módulo existe e suas políticas
      const { data: module, error: moduleError } = await supabase
        .from('core_modules')
        .select('module_id, name, request_policy, default_visibility')
        .eq('module_id', params.module_id)
        .single();

      if (moduleError || !module) {
        return {
          success: false,
          error: 'Módulo não encontrado no catálogo'
        };
      }

      // Verificar se já existe uma atribuição
      const { data: existing } = await supabase
        .from('tenant_module_assignments')
        .select('operational_status')
        .eq('organization_id', params.organization_id)
        .eq('module_id', params.module_id)
        .single();

      if (existing) {
        return {
          success: false,
          error: 'Módulo já está atribuído a esta organização'
        };
      }

      // Verificar política de solicitação
      if (module.request_policy === 'DENY_ALL') {
        return {
          success: false,
          error: 'Este módulo não está disponível para solicitação'
        };
      }

      // Determinar status inicial baseado na política
      const initialStatus: TenantOperationalStatus = 
        module.request_policy === 'AUTO_APPROVE' ? 'PROVISIONING' : 'PENDING_APPROVAL';

      // Criar entrada na tenant_module_assignments
      const { error: insertError } = await supabase
        .from('tenant_module_assignments')
        .insert({
          organization_id: params.organization_id,
          module_id: params.module_id,
          operational_status: initialStatus,
          last_status_change: new Date().toISOString(),
          status_change_reason: params.reason || 'Solicitação inicial',
          approval_requested_at: initialStatus === 'PENDING_APPROVAL' ? new Date().toISOString() : null,
          provisioning_started_at: initialStatus === 'PROVISIONING' ? new Date().toISOString() : null,
          health_status: 'unknown',
          billing_enabled: false,
          usage_limits: {},
          current_usage: {},
          auto_upgrade: true,
          locked_version: false,
          retry_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        return {
          success: false,
          error: `Erro ao criar solicitação: ${insertError.message}`
        };
      }

      // Se requer aprovação manual, criar registro de solicitação
      if (initialStatus === 'PENDING_APPROVAL') {
        await supabase
          .from('module_approval_requests')
          .insert({
            organization_id: params.organization_id,
            module_id: params.module_id,
            requested_by: params.requested_by,
            request_reason: params.reason,
            request_metadata: params.metadata || {},
            status: 'PENDING',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      return {
        success: true,
        new_status: initialStatus,
        metadata: {
          requires_approval: initialStatus === 'PENDING_APPROVAL',
          auto_approved: initialStatus === 'PROVISIONING'
        }
      };

    } catch (error) {
      console.error('Erro ao solicitar módulo:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Aprova ou nega uma solicitação de módulo
   */
  static async processApproval(params: ApprovalDecisionParams): Promise<StatusTransitionResult> {
    try {
      const supabase = await createSupabaseServerClient();

      // Buscar solicitação
      const { data: request, error: requestError } = await supabase
        .from('module_approval_requests')
        .select('*')
        .eq('id', params.request_id)
        .eq('status', 'PENDING')
        .single();

      if (requestError || !request) {
        return {
          success: false,
          error: 'Solicitação não encontrada ou já processada'
        };
      }

      // Atualizar solicitação
      const { error: updateRequestError } = await supabase
        .from('module_approval_requests')
        .update({
          status: params.decision,
          reviewed_by: params.reviewed_by,
          review_notes: params.review_notes,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', params.request_id);

      if (updateRequestError) {
        return {
          success: false,
          error: `Erro ao atualizar solicitação: ${updateRequestError.message}`
        };
      }

      // Se aprovado, iniciar provisioning
      if (params.decision === 'APPROVED') {
        const statusResult = await this.updateStatus({
          organization_id: request.organization_id,
          module_id: request.module_id,
          new_status: 'PROVISIONING',
          changed_by: params.reviewed_by,
          reason: `Aprovado: ${params.review_notes || 'Sem observações'}`,
          metadata: params.metadata
        });

        return statusResult;
      } else {
        // Se negado, marcar como erro ou remover
        await this.updateStatus({
          organization_id: request.organization_id,
          module_id: request.module_id,
          new_status: 'ERROR',
          changed_by: params.reviewed_by,
          reason: `Negado: ${params.review_notes || 'Sem observações'}`,
          metadata: { denial_reason: params.review_notes, ...params.metadata }
        });

        return {
          success: true,
          new_status: 'ERROR',
          metadata: { decision: 'DENIED', reason: params.review_notes }
        };
      }

    } catch (error) {
      console.error('Erro ao processar aprovação:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Obtém módulos operacionais de um tenant
   */
  static async getTenantModules(organizationId: string): Promise<TenantModuleOperational[]> {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from('tenant_module_assignments')
        .select(`
          *,
          core_modules (
            module_id,
            name,
            description,
            maturity_status,
            status,
            default_visibility,
            request_policy,
            auto_enable_policy,
            category,
            pricing_tier,
            dependencies,
            is_available,
            requires_approval
          )
        `)
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar módulos do tenant:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Erro ao buscar módulos do tenant:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas de status operacional
   */
  static async getOperationalStats(organizationId?: string): Promise<TenantOperationalStats | null> {
    try {
      const supabase = await createSupabaseServerClient();

      // Usar função do banco para obter estatísticas
      const { data, error } = await supabase
        .rpc('get_tenant_operational_stats', {
          p_organization_id: organizationId || null
        });

      if (error) {
        console.error('Erro ao buscar estatísticas operacionais:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('Erro ao buscar estatísticas operacionais:', error);
      return null;
    }
  }

  /**
   * Obtém solicitações de aprovação pendentes
   */
  static async getPendingApprovals(): Promise<ModuleApprovalRequest[]> {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from('module_approval_requests')
        .select(`
          *,
          core_modules (
            module_id,
            name,
            description,
            maturity
          )
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar aprovações pendentes:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Erro ao buscar aprovações pendentes:', error);
      return [];
    }
  }

  /**
   * Registra mudança de status no histórico
   */
  private static async recordStatusChange(
    organizationId: string,
    moduleId: string,
    previousStatus: TenantOperationalStatus,
    newStatus: TenantOperationalStatus,
    changedBy?: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await createSupabaseServerClient();

      await supabase
        .from('tenant_module_status_history')
        .insert({
          organization_id: organizationId,
          module_id: moduleId,
          previous_status: previousStatus,
          new_status: newStatus,
          changed_by: changedBy,
          change_reason: reason,
          change_metadata: {
            timestamp: new Date().toISOString(),
            ...metadata
          },
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Erro ao registrar mudança de status:', error);
      // Não falhar a operação principal se o log falhar
    }
  }

  /**
   * Simula provisioning de um módulo (para desenvolvimento)
   */
  static async simulateProvisioning(
    organizationId: string,
    moduleId: string,
    success: boolean = true
  ): Promise<StatusTransitionResult> {
    // Simular delay de provisioning
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (success) {
      return await this.updateStatus({
        organization_id: organizationId,
        module_id: moduleId,
        new_status: 'ENABLED',
        reason: 'Provisioning concluído com sucesso',
        metadata: { simulation: true, duration_ms: 2000 }
      });
    } else {
      return await this.updateStatus({
        organization_id: organizationId,
        module_id: moduleId,
        new_status: 'ERROR',
        reason: 'Falha no provisioning (simulação)',
        metadata: { 
          simulation: true, 
          error_details: { 
            code: 'PROVISION_FAILED',
            message: 'Erro simulado de provisioning'
          }
        }
      });
    }
  }
} 