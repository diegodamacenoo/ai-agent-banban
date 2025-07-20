'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { createSupabaseAdminClient } from '@/core/supabase/admin';
import { createAuditLog } from '@/features/security/audit-logger/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { captureRequestInfo } from '@/core/auth/request-info';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Schemas de validação
const requestDataExportSchema = z.object({
  format: z.enum(['json', 'csv', 'pdf'], {
    errorMap: () => ({ message: 'Formato deve ser JSON, CSV ou PDF' })
  })
});

const requestAccountDeletionSchema = z.object({
  password: z.string().min(1, 'Senha Ã© obrigatÃ³ria para confirmar exclusÃ£o')
});

const confirmAccountDeletionSchema = z.object({
  token: z.string().min(1, 'Token de verificaÃ§Ã£o Ã© obrigatÃ³rio')
});

// Tipos
export type DataExportFormat = z.infer<typeof requestDataExportSchema>['format'];
export type ActionResult<T = unknown> = { 
  success: boolean; 
  error?: string; 
  data?: T;
};

/**
 * Solicita exportaÃ§Ã£o dos dados pessoais do usuÃ¡rio
 * 
 * @description Esta funÃ§Ã£o inicia o processo de exportaÃ§Ã£o dos dados pessoais
 * do usuÃ¡rio no formato solicitado. O arquivo serÃ¡ gerado de forma assÃ­ncrona
 * e um email serÃ¡ enviado quando estiver pronto para download.
 * 
 * @param {DataExportFormat} format - Formato da exportaÃ§Ã£o (json, csv, pdf)
 * @returns {Promise<ActionResult>} Resultado da operaÃ§Ã£o
 * 
 * @security Requer usuÃ¡rio autenticado
 * @audit Registra solicitaÃ§Ã£o de exportaÃ§Ã£o
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

    const supabase = createSupabaseBrowserClient();
    
    // Verificar autenticaÃ§Ã£o
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'UsuÃ¡rio nÃ£o autenticado.' };
    }

    // Verificar se jÃ¡ existe exportaÃ§Ã£o pendente
    const { data: existingExport, error: checkError } = await supabase
      .from('user_data_exports')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .in('status', ['requested', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkError) {
      console.error('Erro ao verificar exportaÃ§Ãµes existentes:', checkError);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }

    if (existingExport && existingExport.length > 0) {
      return { 
        success: false, 
        error: 'JÃ¡ existe uma exportaÃ§Ã£o em andamento. Aguarde a conclusÃ£o.' 
      };
    }

    // Gerar token de download
    const downloadToken = crypto.randomBytes(32).toString('hex');

    // Criar registro de exportaÃ§Ã£o
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
      console.error('Erro ao criar solicitaÃ§Ã£o de exportaÃ§Ã£o:', insertError);
      return { success: false, error: 'Erro ao processar solicitaÃ§Ã£o de exportaÃ§Ã£o.' };
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

    // Para demonstraÃ§Ã£o, processar imediatamente
    // Em produÃ§Ã£o, isso seria um job assÃ­ncrono
    try {
      const { processDataExport } = await import('./data-export-processor');
      // Processar apÃ³s um breve delay
      setTimeout(() => processDataExport(insertedExport.id), 1000);
    } catch (error) {
      console.error('Erro ao iniciar processamento da exportaÃ§Ã£o:', error);
    }
    
    revalidatePath('/settings');
    return { 
      success: true, 
      data: { 
        message: 'SolicitaÃ§Ã£o de exportaÃ§Ã£o recebida. VocÃª receberÃ¡ um email quando os dados estiverem prontos para download.',
        format 
      }
    };

  } catch (error: any) {
    console.error('Erro inesperado em requestDataExport:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Desativa temporariamente a conta do usuÃ¡rio
 * 
 * @description Esta função altera o status da conta para 'INACTIVE' e encerra
 * todas as sessÃµes ativas. O usuÃ¡rio pode reativar fazendo login novamente.
 * 
 * @returns {Promise<ActionResult>} Resultado da operaÃ§Ã£o
 * 
 * @security Requer usuÃ¡rio autenticado
 * @audit Registra aÃ§Ã£o em audit_logs
 */
export async function deactivateAccount(): Promise<ActionResult> {
  try {
    const supabase = createSupabaseBrowserClient();
    
    // Verificar autenticaÃ§Ã£o
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'UsuÃ¡rio nÃ£o autenticado.' };
    }

    // Buscar perfil do usuÃ¡rio
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, organization_id, status, first_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil do usuÃ¡rio:', profileError);
      return { success: false, error: 'Erro ao buscar dados do usuÃ¡rio.' };
    }

    // Verificar se conta jÃ¡ estÃ¡ desativada
    if (profile.status === 'INACTIVE') {
      return { success: false, error: 'Conta jÃ¡ estÃ¡ desativada.' };
    }

    // Verificar se Ã© o Ãºltimo admin da organizaÃ§Ã£o
    if (profile.role === 'organization_admin' && profile.organization_id) {
      const { data: adminCount, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .eq('role', 'organization_admin')
        .eq('status', 'ACTIVE');

      if (countError) {
        console.error('Erro ao verificar contagem de admins:', countError);
        return { success: false, error: 'Erro interno. Tente novamente.' };
      }

      if (adminCount && adminCount.length <= 1) {
        return { 
          success: false, 
          error: 'NÃ£o Ã© possÃ­vel desativar a conta do Ãºltimo administrador da organizaÃ§Ã£o. Transfira a administraÃ§Ã£o para outro usuÃ¡rio primeiro.' 
        };
      }
    }

    // Verificar se hÃ¡ solicitaÃ§Ã£o de exclusÃ£o pendente
    const { data: pendingDeletion, error: deletionError } = await supabase
      .from('user_deletion_requests')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['PENDING', 'CONFIRMED'])
      .limit(1);

    if (deletionError) {
      console.error('Erro ao verificar solicitaÃ§Ãµes de exclusÃ£o:', deletionError);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }

    if (pendingDeletion && pendingDeletion.length > 0) {
      return { 
        success: false, 
        error: 'NÃ£o Ã© possÃ­vel desativar a conta pois hÃ¡ uma solicitaÃ§Ã£o de exclusÃ£o pendente.' 
      };
    }

    // Desativar conta
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        status: 'INACTIVE',
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
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: user.id,
      ip_address: ipAddress2,
      user_agent: userAgent2,
      organization_id: organizationId2,
      details: { 
        action: 'account_deactivated',
        previous_status: profile.status 
      }
    });

    // Encerrar sessÃ£o
    await supabase.auth.signOut();

    revalidatePath('/settings');
    return { 
      success: true, 
      data: { message: 'Conta desativada com sucesso. VocÃª pode reativÃ¡-la fazendo login novamente.' }
    };

  } catch (error: any) {
    console.error('Erro inesperado em deactivateAccount:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Solicita exclusÃ£o permanente da conta do usuÃ¡rio
 * 
 * @description Esta funÃ§Ã£o inicia o processo de exclusÃ£o permanente da conta.
 * Valida a senha, cria uma solicitaÃ§Ã£o com perÃ­odo de carÃªncia de 7 dias
 * e envia email de confirmaÃ§Ã£o.
 * 
 * @param {string} password - Senha atual para confirmaÃ§Ã£o
 * @returns {Promise<ActionResult>} Resultado da operaÃ§Ã£o
 * 
 * @security Requer usuÃ¡rio autenticado e senha vÃ¡lida
 * @audit Registra solicitaÃ§Ã£o de exclusÃ£o
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
    const supabase = createSupabaseBrowserClient();
    
    // Verificar autenticaÃ§Ã£o
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'UsuÃ¡rio nÃ£o autenticado.' };
    }

    // Verificar senha atual
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password
    });

    if (passwordError) {
      return { success: false, error: 'Senha incorreta.' };
    }

    // Buscar perfil para verificaÃ§Ãµes
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, organization_id, status, first_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil do usuÃ¡rio:', profileError);
      return { success: false, error: 'Erro ao buscar dados do usuÃ¡rio.' };
    }

    // Verificar se Ã© o Ãºltimo admin da organizaÃ§Ã£o
    if (profile.role === 'organization_admin' && profile.organization_id) {
      const { data: adminCount, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .eq('role', 'organization_admin')
        .eq('status', 'ACTIVE');

      if (countError) {
        console.error('Erro ao verificar contagem de admins:', countError);
        return { success: false, error: 'Erro interno. Tente novamente.' };
      }

      if (adminCount && adminCount.length <= 1) {
        return { 
          success: false, 
          error: 'NÃ£o Ã© possÃ­vel excluir a conta do Ãºltimo administrador da organizaÃ§Ã£o. Transfira a administraÃ§Ã£o para outro usuÃ¡rio primeiro.' 
        };
      }
    }

    // Verificar se jÃ¡ existe solicitaÃ§Ã£o pendente
    const { data: existingRequest, error: checkError } = await supabase
      .from('user_deletion_requests')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .in('status', ['PENDING', 'CONFIRMED'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkError) {
      console.error('Erro ao verificar solicitaÃ§Ãµes existentes:', checkError);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }

    if (existingRequest && existingRequest.length > 0) {
      return { 
        success: false, 
        error: 'JÃ¡ existe uma solicitaÃ§Ã£o de exclusÃ£o pendente. Verifique seu email ou aguarde o processamento.' 
      };
    }

    // Gerar token de verificaÃ§Ã£o
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Criar solicitaÃ§Ã£o de exclusÃ£o
    const { error: insertError } = await supabase
      .from('user_deletion_requests')
      .insert({
        user_id: user.id,
        verification_token: verificationToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        password_verified_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Erro ao criar solicitaÃ§Ã£o de exclusÃ£o:', insertError);
      return { success: false, error: 'Erro ao processar solicitaÃ§Ã£o de exclusÃ£o.' };
    }

    // Registrar auditoria
    const { ipAddress: ipAddress3, userAgent: userAgent3, organizationId: organizationId3 } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: user.id,
      ip_address: ipAddress3,
      user_agent: userAgent3,
      organization_id: organizationId3,
      details: { 
        action: 'account_deletion_requested',
        token_expires_at: tokenExpiresAt.toISOString(),
        user_email: user.email 
      }
    });

    // Enviar email de confirmaÃ§Ã£o com o token
    try {
      const { sendAccountDeletionConfirmation } = await import('@/lib/email/resend');
      const emailSent = await sendAccountDeletionConfirmation(
        user.email!,
        profile?.first_name || 'UsuÃ¡rio',
        verificationToken
      );

      if (!emailSent) {
        console.error('Falha ao enviar email de confirmaÃ§Ã£o de exclusÃ£o');
      }
    } catch (emailError) {
      console.error('Erro ao enviar email de confirmaÃ§Ã£o:', emailError);
    }
    
    revalidatePath('/settings');
    return { 
      success: true, 
      data: { 
        message: 'SolicitaÃ§Ã£o de exclusÃ£o recebida. Um email de confirmaÃ§Ã£o foi enviado. A exclusÃ£o serÃ¡ processada em 7 dias apÃ³s a confirmaÃ§Ã£o.',
        verificationToken // Em produÃ§Ã£o, nÃ£o retornar o token
      }
    };

  } catch (error: any) {
    console.error('Erro inesperado em requestAccountDeletion:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Confirma exclusÃ£o da conta via token de verificaÃ§Ã£o
 * 
 * @description Esta funÃ§Ã£o confirma a exclusÃ£o da conta usando o token
 * enviado por email e agenda a exclusÃ£o para 7 dias.
 * 
 * @param {string} token - Token de verificaÃ§Ã£o do email
 * @returns {Promise<ActionResult>} Resultado da operaÃ§Ã£o
 * 
 * @security Token Ãºnico e com expiraÃ§Ã£o de 24h
 * @audit Registra confirmaÃ§Ã£o de exclusÃ£o
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
    const supabase = createSupabaseBrowserClient();
    
    // Buscar solicitaÃ§Ã£o pelo token
    const { data: deletionRequest, error: findError } = await supabase
      .from('user_deletion_requests')
      .select('*')
      .eq('verification_token', token)
      .eq('status', 'PENDING')
      .single();

    if (findError || !deletionRequest) {
      return { 
        success: false, 
        error: 'Token de verificaÃ§Ã£o invÃ¡lido ou expirado.' 
      };
    }

    // Verificar se token nÃ£o expirou
    if (new Date() > new Date(deletionRequest.token_expires_at)) {
      return { 
        success: false, 
        error: 'Token de verificaÃ§Ã£o expirado. Solicite uma nova exclusÃ£o.' 
      };
    }

    // Calcular data de exclusÃ£o (7 dias a partir de agora)
    const scheduledDeletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Atualizar solicitaÃ§Ã£o para confirmada
    const { error: updateError } = await supabase
      .from('user_deletion_requests')
      .update({
        status: 'confirmed',
        scheduled_deletion_date: scheduledDeletionDate.toISOString()
      })
      .eq('id', deletionRequest.id);

    if (updateError) {
      console.error('Erro ao confirmar exclusÃ£o:', updateError);
      return { success: false, error: 'Erro ao confirmar exclusÃ£o.' };
    }

    // Registrar auditoria
    const { ipAddress: ipAddress4, userAgent: userAgent4, organizationId: organizationId4 } = await captureRequestInfo(deletionRequest.user_id);
    await createAuditLog({
      actor_user_id: deletionRequest.user_id,
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: deletionRequest.user_id,
      ip_address: ipAddress4,
      user_agent: userAgent4,
      organization_id: organizationId4,
      details: { 
        action: 'account_deletion_confirmed',
        scheduled_deletion_date: scheduledDeletionDate.toISOString(),
        token_used: `${token.substring(0, 8)  }...` // Log parcial do token
      }
    });

    return { 
      success: true, 
      data: { 
        message: `ExclusÃ£o confirmada. Sua conta serÃ¡ excluÃ­da permanentemente em ${scheduledDeletionDate.toLocaleDateString('pt-BR')}. VocÃª pode cancelar atÃ© lÃ¡ fazendo login novamente.`,
        scheduledDate: scheduledDeletionDate.toISOString()
      }
    };

  } catch (error: any) {
    console.error('Erro inesperado em confirmAccountDeletion:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Cancela uma solicitaÃ§Ã£o de exclusÃ£o de conta
 * 
 * @description Esta funÃ§Ã£o cancela uma solicitaÃ§Ã£o de exclusÃ£o pendente ou confirmada,
 * permitindo que o usuÃ¡rio mantenha sua conta ativa.
 * 
 * @returns {Promise<ActionResult>} Resultado da operaÃ§Ã£o
 * 
 * @security Requer usuÃ¡rio autenticado
 * @audit Registra cancelamento da exclusÃ£o
 */
export async function cancelAccountDeletion(): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseBrowserClient();
    
    // Verificar autenticaÃ§Ã£o
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'UsuÃ¡rio nÃ£o autenticado.' };
    }

    // Buscar solicitaÃ§Ã£o pendente ou confirmada
    const { data: deletionRequest, error: findError } = await supabase
      .from('user_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['PENDING', 'CONFIRMED'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError) {
      console.error('Erro ao buscar solicitaÃ§Ã£o de exclusÃ£o:', findError);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }

    if (!deletionRequest || deletionRequest.length === 0) {
      return { 
        success: false, 
        error: 'NÃ£o hÃ¡ solicitaÃ§Ã£o de exclusÃ£o para cancelar.' 
      };
    }

    const request = deletionRequest[0];

    // Cancelar solicitaÃ§Ã£o
    const { error: updateError } = await supabase
      .from('user_deletion_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'cancelled_by_user'
      })
      .eq('id', request.id);

    if (updateError) {
      console.error('Erro ao cancelar exclusÃ£o:', updateError);
      return { success: false, error: 'Erro ao cancelar exclusÃ£o.' };
    }

    // Registrar auditoria
    const { ipAddress: ipAddress5, userAgent: userAgent5, organizationId: organizationId5 } = await captureRequestInfo(user.id);
    await createAuditLog({
      actor_user_id: user.id,
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: user.id,
      ip_address: ipAddress5,
      user_agent: userAgent5,
      organization_id: organizationId5,
      details: {
        action: 'account_deletion_cancelled',
        original_request_id: request.id,
        was_confirmed: request.status === 'confirmed',
        scheduled_deletion_date: request.scheduled_deletion_date
      }
    });

    // Buscar dados do usuÃ¡rio para email
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .single();

    // Enviar notificaÃ§Ã£o de cancelamento
    try {
      const { sendDeletionCancelledNotification } = await import('@/lib/email/resend');
      const emailSent = await sendDeletionCancelledNotification(
        user.email!,
        profile?.first_name || 'UsuÃ¡rio'
      );

      if (!emailSent) {
        console.error('Falha ao enviar notificaÃ§Ã£o de cancelamento');
      }
    } catch (emailError) {
      console.error('Erro ao enviar notificaÃ§Ã£o de cancelamento:', emailError);
    }

    revalidatePath('/settings');
    return {
      success: true,
      data: {
        message: 'SolicitaÃ§Ã£o de exclusÃ£o cancelada com sucesso. Sua conta permanecerÃ¡ ativa.'
      }
    };

  } catch (error: any) {
    console.error('Erro inesperado em cancelAccountDeletion:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
}

 
