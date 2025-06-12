'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseClient } from '@/lib/supabase/server';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES, captureRequestInfo } from '@/lib/utils/audit-logger';
import crypto from 'crypto';

// Schemas de validação
const requestDataExportSchema = z.object({
  format: z.enum(['json', 'csv', 'pdf'], {
    errorMap: () => ({ message: 'Formato deve ser JSON, CSV ou PDF' })
  })
});

const requestAccountDeletionSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória para confirmar exclusão')
});

const confirmAccountDeletionSchema = z.object({
  token: z.string().min(1, 'Token de verificação é obrigatório')
});

// Tipos
export type DataExportFormat = z.infer<typeof requestDataExportSchema>['format'];
export type ActionResult = { success: boolean; error?: string; data?: any };

/**
 * Solicita exportação dos dados pessoais do usuário
 * 
 * @description Esta função inicia o processo de exportação dos dados pessoais
 * do usuário no formato solicitado. O arquivo será gerado de forma assíncrona
 * e um email será enviado quando estiver pronto para download.
 * 
 * @param {DataExportFormat} format - Formato da exportação (json, csv, pdf)
 * @returns {Promise<ActionResult>} Resultado da operação
 * 
 * @security Requer usuário autenticado
 * @audit Registra solicitação de exportação
 */
export async function requestDataExport(format: DataExportFormat): Promise<ActionResult> {
  try {
    const parsed = requestDataExportSchema.safeParse({ format });
    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.errors.map(e => e.message).join(', ')
      };
    }

    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    // Verificar se já existe exportação pendente
    const { data: existingExport, error: checkError } = await supabase
      .from('user_data_exports')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .in('status', ['requested', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkError) {
      console.error('Erro ao verificar exportações existentes:', checkError);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }

    if (existingExport && existingExport.length > 0) {
      return { 
        success: false, 
        error: 'Já existe uma exportação em andamento. Aguarde a conclusão.' 
      };
    }

    // Gerar token de download
    const downloadToken = crypto.randomBytes(32).toString('hex');

    // Criar registro de exportação
    const { data: insertedExport, error: insertError } = await supabase
      .from('user_data_exports')
      .insert({
        user_id: user.id,
        format,
        download_token: downloadToken,
        status: 'requested'
      })
      .select('id')
      .single();

    if (insertError || !insertedExport) {
      console.error('Erro ao criar solicitação de exportação:', insertError);
      return { success: false, error: 'Erro ao processar solicitação de exportação.' };
    }

    // Registrar auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.DATA_EXPORTED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: { format }
    });

    // Para demonstração, processar imediatamente
    // Em produção, isso seria um job assíncrono
    try {
      const { processDataExport } = await import('./data-export-processor');
      // Processar após um breve delay
      setTimeout(() => processDataExport(insertedExport.id), 1000);
    } catch (error) {
      console.error('Erro ao iniciar processamento da exportação:', error);
    }
    
    revalidatePath('/settings');
    return { 
      success: true, 
      data: { 
        message: 'Solicitação de exportação recebida. Você receberá um email quando os dados estiverem prontos para download.',
        format 
      }
    };

  } catch (error: any) {
    console.error('Erro inesperado em requestDataExport:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Desativa temporariamente a conta do usuário
 * 
 * @description Esta função altera o status da conta para 'inactive' e encerra
 * todas as sessões ativas. O usuário pode reativar fazendo login novamente.
 * 
 * @returns {Promise<ActionResult>} Resultado da operação
 * 
 * @security Requer usuário autenticado
 * @audit Registra ação em audit_logs
 */
export async function deactivateAccount(): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, organization_id, status, first_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil do usuário:', profileError);
      return { success: false, error: 'Erro ao buscar dados do usuário.' };
    }

    // Verificar se conta já está desativada
    if (profile.status === 'inactive') {
      return { success: false, error: 'Conta já está desativada.' };
    }

    // Verificar se é o último admin da organização
    if (profile.role === 'organization_admin' && profile.organization_id) {
      const { data: adminCount, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .eq('role', 'organization_admin')
        .eq('status', 'active');

      if (countError) {
        console.error('Erro ao verificar contagem de admins:', countError);
        return { success: false, error: 'Erro interno. Tente novamente.' };
      }

      if (adminCount && adminCount.length <= 1) {
        return { 
          success: false, 
          error: 'Não é possível desativar a conta do último administrador da organização. Transfira a administração para outro usuário primeiro.' 
        };
      }
    }

    // Verificar se há solicitação de exclusão pendente
    const { data: pendingDeletion, error: deletionError } = await supabase
      .from('user_deletion_requests')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .limit(1);

    if (deletionError) {
      console.error('Erro ao verificar solicitações de exclusão:', deletionError);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }

    if (pendingDeletion && pendingDeletion.length > 0) {
      return { 
        success: false, 
        error: 'Não é possível desativar a conta pois há uma solicitação de exclusão pendente.' 
      };
    }

    // Desativar conta
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao desativar conta:', updateError);
      return { success: false, error: 'Erro ao desativar conta.' };
    }

    // Registrar auditoria
    const { ipAddress: ipAddress2, userAgent: userAgent2, organizationId: organizationId2 } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: 'account_deactivated',
      resource_type: AUDIT_RESOURCE_TYPES.PROFILE,
      resource_id: user.id,
      ip_address: ipAddress2,
      user_agent: userAgent2,
      organization_id: organizationId2,
      details: { previous_status: profile.status }
    });

    // Encerrar sessão
    await supabase.auth.signOut();

    revalidatePath('/settings');
    return { 
      success: true, 
      data: { message: 'Conta desativada com sucesso. Você pode reativá-la fazendo login novamente.' }
    };

  } catch (error: any) {
    console.error('Erro inesperado em deactivateAccount:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Solicita exclusão permanente da conta do usuário
 * 
 * @description Esta função inicia o processo de exclusão permanente da conta.
 * Valida a senha, cria uma solicitação com período de carência de 7 dias
 * e envia email de confirmação.
 * 
 * @param {string} password - Senha atual para confirmação
 * @returns {Promise<ActionResult>} Resultado da operação
 * 
 * @security Requer usuário autenticado e senha válida
 * @audit Registra solicitação de exclusão
 */
export async function requestAccountDeletion(password: string): Promise<ActionResult> {
  try {
    const parsed = requestAccountDeletionSchema.safeParse({ password });
    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.errors.map(e => e.message).join(', ')
      };
    }

    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    // Verificar senha atual
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password
    });

    if (passwordError) {
      return { success: false, error: 'Senha incorreta.' };
    }

    // Buscar perfil para verificações
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, organization_id, status, first_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil do usuário:', profileError);
      return { success: false, error: 'Erro ao buscar dados do usuário.' };
    }

    // Verificar se é o último admin da organização
    if (profile.role === 'organization_admin' && profile.organization_id) {
      const { data: adminCount, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .eq('role', 'organization_admin')
        .eq('status', 'active');

      if (countError) {
        console.error('Erro ao verificar contagem de admins:', countError);
        return { success: false, error: 'Erro interno. Tente novamente.' };
      }

      if (adminCount && adminCount.length <= 1) {
        return { 
          success: false, 
          error: 'Não é possível excluir a conta do último administrador da organização. Transfira a administração para outro usuário primeiro.' 
        };
      }
    }

    // Verificar se já existe solicitação pendente
    const { data: existingRequest, error: checkError } = await supabase
      .from('user_deletion_requests')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkError) {
      console.error('Erro ao verificar solicitações existentes:', checkError);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }

    if (existingRequest && existingRequest.length > 0) {
      return { 
        success: false, 
        error: 'Já existe uma solicitação de exclusão pendente. Verifique seu email ou aguarde o processamento.' 
      };
    }

    // Gerar token de verificação
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Criar solicitação de exclusão
    const { error: insertError } = await supabase
      .from('user_deletion_requests')
      .insert({
        user_id: user.id,
        verification_token: verificationToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        password_verified_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Erro ao criar solicitação de exclusão:', insertError);
      return { success: false, error: 'Erro ao processar solicitação de exclusão.' };
    }

    // Registrar auditoria
    const { ipAddress: ipAddress3, userAgent: userAgent3, organizationId: organizationId3 } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: 'account_deletion_requested',
      resource_type: AUDIT_RESOURCE_TYPES.PROFILE,
      resource_id: user.id,
      ip_address: ipAddress3,
      user_agent: userAgent3,
      organization_id: organizationId3,
      details: { 
        token_expires_at: tokenExpiresAt.toISOString(),
        user_email: user.email 
      }
    });

    // Enviar email de confirmação com o token
    try {
      const { sendAccountDeletionConfirmation } = await import('@/lib/email/resend');
      const emailSent = await sendAccountDeletionConfirmation(
        user.email!,
        profile?.first_name || 'Usuário',
        verificationToken
      );

      if (!emailSent) {
        console.error('Falha ao enviar email de confirmação de exclusão');
      }
    } catch (emailError) {
      console.error('Erro ao enviar email de confirmação:', emailError);
    }
    
    revalidatePath('/settings');
    return { 
      success: true, 
      data: { 
        message: 'Solicitação de exclusão recebida. Um email de confirmação foi enviado. A exclusão será processada em 7 dias após a confirmação.',
        verificationToken // Em produção, não retornar o token
      }
    };

  } catch (error: any) {
    console.error('Erro inesperado em requestAccountDeletion:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Confirma exclusão da conta via token de verificação
 * 
 * @description Esta função confirma a exclusão da conta usando o token
 * enviado por email e agenda a exclusão para 7 dias.
 * 
 * @param {string} token - Token de verificação do email
 * @returns {Promise<ActionResult>} Resultado da operação
 * 
 * @security Token único e com expiração de 24h
 * @audit Registra confirmação de exclusão
 */
export async function confirmAccountDeletion(token: string): Promise<ActionResult> {
  try {
    const parsed = confirmAccountDeletionSchema.safeParse({ token });
    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.errors.map(e => e.message).join(', ')
      };
    }

    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Buscar solicitação pelo token
    const { data: deletionRequest, error: findError } = await supabase
      .from('user_deletion_requests')
      .select('*')
      .eq('verification_token', token)
      .eq('status', 'pending')
      .single();

    if (findError || !deletionRequest) {
      return { 
        success: false, 
        error: 'Token de verificação inválido ou expirado.' 
      };
    }

    // Verificar se token não expirou
    if (new Date() > new Date(deletionRequest.token_expires_at)) {
      return { 
        success: false, 
        error: 'Token de verificação expirado. Solicite uma nova exclusão.' 
      };
    }

    // Calcular data de exclusão (7 dias a partir de agora)
    const scheduledDeletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Atualizar solicitação para confirmada
    const { error: updateError } = await supabase
      .from('user_deletion_requests')
      .update({
        status: 'confirmed',
        scheduled_deletion_date: scheduledDeletionDate.toISOString()
      })
      .eq('id', deletionRequest.id);

    if (updateError) {
      console.error('Erro ao confirmar exclusão:', updateError);
      return { success: false, error: 'Erro ao confirmar exclusão.' };
    }

    // Registrar auditoria
    const { ipAddress: ipAddress4, userAgent: userAgent4, organizationId: organizationId4 } = await captureRequestInfo(deletionRequest.user_id);
    await createAuditLog({
      actor_user_id: deletionRequest.user_id,
      action_type: 'account_deletion_confirmed',
      resource_type: AUDIT_RESOURCE_TYPES.PROFILE,
      resource_id: deletionRequest.user_id,
      ip_address: ipAddress4,
      user_agent: userAgent4,
      organization_id: organizationId4,
      details: { 
        scheduled_deletion_date: scheduledDeletionDate.toISOString(),
        token_used: token.substring(0, 8) + '...' // Log parcial do token
      }
    });

    return { 
      success: true, 
      data: { 
        message: `Exclusão confirmada. Sua conta será excluída permanentemente em ${scheduledDeletionDate.toLocaleDateString('pt-BR')}. Você pode cancelar até lá fazendo login novamente.`,
        scheduledDate: scheduledDeletionDate.toISOString()
      }
    };

  } catch (error: any) {
    console.error('Erro inesperado em confirmAccountDeletion:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Cancela uma solicitação de exclusão de conta
 * 
 * @description Esta função cancela uma solicitação de exclusão pendente ou confirmada,
 * permitindo que o usuário mantenha sua conta ativa.
 * 
 * @returns {Promise<ActionResult>} Resultado da operação
 * 
 * @security Requer usuário autenticado
 * @audit Registra cancelamento da exclusão
 */
export async function cancelAccountDeletion(): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    // Buscar solicitação pendente ou confirmada
    const { data: deletionRequest, error: findError } = await supabase
      .from('user_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError) {
      console.error('Erro ao buscar solicitação de exclusão:', findError);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }

    if (!deletionRequest || deletionRequest.length === 0) {
      return { 
        success: false, 
        error: 'Não há solicitação de exclusão para cancelar.' 
      };
    }

    const request = deletionRequest[0];

    // Cancelar solicitação
    const { error: updateError } = await supabase
      .from('user_deletion_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'cancelled_by_user'
      })
      .eq('id', request.id);

    if (updateError) {
      console.error('Erro ao cancelar exclusão:', updateError);
      return { success: false, error: 'Erro ao cancelar exclusão.' };
    }

    // Registrar auditoria
    const { ipAddress: ipAddress5, userAgent: userAgent5, organizationId: organizationId5 } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: 'account_deletion_cancelled',
      resource_type: AUDIT_RESOURCE_TYPES.PROFILE,
      resource_id: user.id,
      ip_address: ipAddress5,
      user_agent: userAgent5,
      organization_id: organizationId5,
      details: {
        original_request_id: request.id,
        was_confirmed: request.status === 'confirmed',
        scheduled_deletion_date: request.scheduled_deletion_date
      }
    });

    // Buscar dados do usuário para email
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .single();

    // Enviar notificação de cancelamento
    try {
      const { sendDeletionCancelledNotification } = await import('@/lib/email/resend');
      const emailSent = await sendDeletionCancelledNotification(
        user.email!,
        profile?.first_name || 'Usuário'
      );

      if (!emailSent) {
        console.error('Falha ao enviar notificação de cancelamento');
      }
    } catch (emailError) {
      console.error('Erro ao enviar notificação de cancelamento:', emailError);
    }

    revalidatePath('/settings');
    return {
      success: true,
      data: {
        message: 'Solicitação de exclusão cancelada com sucesso. Sua conta permanecerá ativa.'
      }
    };

  } catch (error: any) {
    console.error('Erro inesperado em cancelAccountDeletion:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
} 