'use server';

import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/core/supabase/server';
import { createAuditLog } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { processDataExportSchema, type ProcessDataExportData } from '@/core/schemas/auth';
import { captureRequestInfo } from '@/core/auth/request-info';

/**
 * Processamento real de exportação de dados com Supabase Storage
 */

export type ExportData = {
  user_id: string;
  export_date: string;
  personal_data: any;
  profile_data: any;
  activity_data: any;
  system_data: any;
};

/**
 * Processa uma exportação de dados do usuário usando Supabase Storage
 * 
 * @description Esta função processa uma exportação de dados real,
 * gerando o arquivo e salvando no Supabase Storage.
 * 
 * @param {ProcessDataExportData} data - Dados da exportação a ser processada
 * @returns {Promise<boolean>} Sucesso do processamento
 * 
 * @security Apenas para uso interno do sistema - não requer verificação de usuário
 * @internal Esta função é chamada pelo sistema, não por usuários diretamente
 */
export async function processDataExport(data: ProcessDataExportData): Promise<boolean> {
  const parsed = processDataExportSchema.safeParse(data);
  if (!parsed.success) {
    console.error('Dados inválidos para processamento de exportação:', parsed.error.errors);
    return false;
  }

  const { exportId } = parsed.data;
  try {
    const supabase = await createSupabaseAdminClient();
    
    // Buscar dados da exportação
    const { data: exportData, error: exportError } = await supabase
      .from('user_data_exports')
      .select('*')
      .eq('id', exportId)
      .eq('status', 'requested')
      .single();
      
    if (exportError || !exportData) {
      console.error('Exportação não encontrada ou já processada:', exportId);
      return false;
    }

    // Atualizar status para processando
    await supabase
      .from('user_data_exports')
      .update({ status: 'processing' })
      .eq('id', exportId);

    console.debug(`Iniciando processamento da exportação ${exportId}`);

    try {
      // Coletar dados do usuário
      const userData = await collectUserData(exportData.user_id);
      
      // Gerar arquivo baseado no formato
      const fileContent = generateExportFile(userData, exportData.format);
      const fileBuffer = Buffer.from(fileContent, 'utf8');
      
      // Definir nome e caminho do arquivo
      const fileName = `${exportData.user_id}/${exportId}.${exportData.format}`;
      
      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('data-exports')
        .upload(fileName, fileBuffer, {
          contentType: getContentType(exportData.format),
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Gerar URL assinada para download (válida por 30 dias)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('data-exports')
        .createSignedUrl(fileName, 30 * 24 * 60 * 60); // 30 dias

      if (urlError) {
        throw new Error(`Erro ao gerar URL: ${urlError.message}`);
      }
      
      // Atualizar registro com sucesso
      await supabase
        .from('user_data_exports')
        .update({
          status: 'completed',
          file_url: signedUrlData.signedUrl,
          file_size_bytes: fileBuffer.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', exportId);

      // Registrar auditoria
      const { ipAddress, userAgent, organizationId } = await captureRequestInfo(exportData.user_id);
      await createAuditLog({
        actor_user_id: exportData.user_id,
        action_type: AUDIT_ACTION_TYPES.DATA_EXPORT_COMPLETED,
        resource_type: AUDIT_RESOURCE_TYPES.DATA_CONTROLLER,
        resource_id: exportData.user_id,
        ip_address: ipAddress,
        user_agent: userAgent,
        organization_id: organizationId,
        details: {
          export_id: exportId,
          format: exportData.format,
          file_size_bytes: fileBuffer.length,
          storage_path: fileName,
          processing_duration_ms: Date.now() - new Date(exportData.created_at).getTime()
        }
      });

      // Enviar notificação por email
      await sendExportNotification(exportData.user_id, exportData.format, exportData.download_token);

      // Nota: revalidatePath não é necessário aqui pois esta é uma função interna
      // que processa exportações em background. A UI será atualizada via polling
      // ou notificações quando o usuário acessar a página de configurações.

      console.debug(`Exportação ${exportId} processada com sucesso`);
      return true;

    } catch (processingError) {
      console.error('Erro durante processamento da exportação:', processingError);
      
      // Atualizar status para falha
      await supabase
        .from('user_data_exports')
        .update({
          status: 'failed',
          error_message: processingError instanceof Error ? processingError.message : 'Erro interno durante processamento',
          completed_at: new Date().toISOString()
        })
        .eq('id', exportId);

      return false;
    }

  } catch (error) {
    console.error('Erro crítico no processamento da exportação:', error);
    return false;
  }
}

/**
 * Coleta todos os dados do usuário para exportação
 */
async function collectUserData(userId: string): Promise<ExportData> {
  const supabase = await createSupabaseAdminClient();
  const currentDate = new Date().toISOString();

  try {
    // Buscar dados do perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Buscar dados de autenticação (limitado para privacidade)
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    // Buscar sessões recentes
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Buscar logs de auditoria recentes (últimos 90 dias)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('action_type, created_at, details')
      .eq('actor_user_id', userId)
      .gte('created_at', threeMonthsAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    // Buscar exportações anteriores
    const { data: previousExports } = await supabase
      .from('user_data_exports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Retornar dados estruturados
    return {
      user_id: userId,
      export_date: currentDate,
      personal_data: {
        email: authUser?.user?.email,
        phone: authUser?.user?.phone,
        created_at: authUser?.user?.created_at,
        last_sign_in: authUser?.user?.last_sign_in_at
      },
      profile_data: profile,
      activity_data: {
        sessions,
        audit_logs: auditLogs,
        previous_exports: previousExports
      },
      system_data: {
        export_timestamp: currentDate,
        data_retention_period: '90 days'
      }
    };

  } catch (error) {
    console.error('Erro ao coletar dados do usuário:', error);
    throw new Error('Falha ao coletar dados do usuário');
  }
}

/**
 * Gera arquivo de exportação no formato solicitado
 */
function generateExportFile(data: ExportData, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
      
    case 'csv':
      // Gerar CSV mais completo
      const csvLines = [
        'Campo,Valor,Categoria',
        `ID do Usuário,${data.user_id},Identificação`,
        `Data da Exportação,${data.export_date},Sistema`,
        `Email,${data.personal_data.email || ''},Dados Pessoais`,
        `Nome,${data.personal_data.first_name || ''},Dados Pessoais`,
        `Sobrenome,${data.personal_data.last_name || ''},Dados Pessoais`,
        `Telefone,${data.personal_data.phone || ''},Dados Pessoais`,
        `Data de Criação,${data.personal_data.created_at || ''},Dados Pessoais`,
        `Email Confirmado,${data.personal_data.email_confirmed_at || ''},Dados Pessoais`,
        `Último Login,${data.personal_data.last_sign_in_at || ''},Atividade`,
        `Bio,${data.profile_data.bio || ''},Perfil`,
        `Localização,${data.profile_data.location || ''},Perfil`,
        `Website,${data.profile_data.website || ''},Perfil`,
        `Papel,${data.profile_data.role || ''},Perfil`,
        `Status,${data.profile_data.status || ''},Perfil`,
        `Organização,${data.profile_data.organization_id || ''},Perfil`,
        `Total de Sessões,${data.activity_data.total_sessions},Atividade`,
        `Total de Ações,${data.activity_data.audit_summary.total_actions},Atividade`,
        `Período de Auditoria,${data.activity_data.audit_summary.period_start} a ${data.activity_data.audit_summary.period_end},Atividade`,
        `Exportações Anteriores,${data.activity_data.export_history.length},Histórico`
      ];
      return csvLines.join('\n');
      
    case 'pdf':
      // Gerar um PDF mais estruturado (ainda textual, mas com melhor formatação)
      return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 800
>>
stream
BT
/F1 16 Tf
72 720 Td
(EXPORTAÇÃO DE DADOS PESSOAIS) Tj
0 -30 Td
/F1 12 Tf
(Gerado em: ${data.export_date}) Tj
0 -20 Td
(Usuário: ${data.personal_data.email || 'N/A'}) Tj
0 -20 Td
(ID: ${data.user_id}) Tj

0 -40 Td
/F1 14 Tf
(DADOS PESSOAIS) Tj
0 -20 Td
/F1 10 Tf
(Nome: ${data.personal_data.first_name || ''} ${data.personal_data.last_name || ''}) Tj
0 -15 Td
(Email: ${data.personal_data.email || ''}) Tj
0 -15 Td
(Telefone: ${data.personal_data.phone || 'N/A'}) Tj
0 -15 Td
(Data de Criação: ${data.personal_data.created_at || 'N/A'}) Tj

0 -30 Td
/F1 14 Tf
(DADOS DO PERFIL) Tj
0 -20 Td
/F1 10 Tf
(Bio: ${(data.profile_data.bio || 'N/A').substring(0, 50)}) Tj
0 -15 Td
(Localização: ${data.profile_data.location || 'N/A'}) Tj
0 -15 Td
(Website: ${data.profile_data.website || 'N/A'}) Tj
0 -15 Td
(Papel: ${data.profile_data.role || 'N/A'}) Tj

0 -30 Td
/F1 14 Tf
(ESTATÍSTICAS DE ATIVIDADE) Tj
0 -20 Td
/F1 10 Tf
(Total de Sessões: ${data.activity_data.total_sessions}) Tj
0 -15 Td
(Total de Ações: ${data.activity_data.audit_summary.total_actions}) Tj
0 -15 Td
(Exportações Anteriores: ${data.activity_data.export_history.length}) Tj

0 -40 Td
/F1 8 Tf
(Este documento foi gerado automaticamente pelo sistema.) Tj
0 -12 Td
(Para questões sobre seus dados, contate: suporte@aiagentbanban.com) Tj
0 -12 Td
(Base legal: GDPR Artigo 20 - Direito à portabilidade de dados) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000215 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
1200
%%EOF`;

    default:
      return JSON.stringify(data, null, 2);
  }
}

/**
 * Determina o content-type baseado no formato
 */
function getContentType(format: string): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Envia notificação de exportação concluída
 */
async function sendExportNotification(userId: string, format: string, downloadToken: string): Promise<void> {
  try {
    const supabase = await createSupabaseAdminClient();
    
    // Buscar dados do usuário
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.user?.email;
    
    if (!userEmail) {
      console.error('Email não encontrado para o usuário:', userId);
      return;
    }

    // Buscar nome do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', userId)
      .single();

    const firstName = profile?.first_name || 'Usuário';

    // Enviar email real usando Resend
    const { sendDataExportNotification } = await import('@/lib/email/resend');
    const emailSent = await sendDataExportNotification(userEmail, firstName, format, downloadToken);
    
    // Registrar tentativa de notificação em auditoria
    const { ipAddress, userAgent, organizationId } = await captureRequestInfo(userId);
    await createAuditLog({
      actor_user_id: userId,
      action_type: 'export_notification_sent',
      resource_type: 'user_data',
      resource_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      organization_id: organizationId,
      details: {
        email: userEmail,
        format,
        download_token: `${downloadToken.substring(0, 8)  }...`,
        email_sent: emailSent,
        notification_method: 'resend'
      }
    });

    if (emailSent) {
      console.debug(`ðŸ“§ Notificação de exportação enviada para: ${userEmail}`);
    } else {
      console.error(`âŒ Falha ao enviar notificação para: ${userEmail}`);
    }

  } catch (error) {
    console.error('Erro ao enviar notificação de exportação:', error);
  }
}

/**
 * Agenda o processamento de exportações pendentes
 * 
 * @description Esta função seria chamada por um cron job ou sistema de queue
 * para processar exportações que estão com status 'requested'
 */
export async function scheduleExportProcessing(): Promise<void> {
  try {
    const supabase = await createSupabaseAdminClient();
    
    // Buscar exportações pendentes
    const { data: pendingExports, error } = await supabase
      .from('user_data_exports')
      .select('id')
      .eq('status', 'requested')
      .order('created_at', { ascending: true })
      .limit(10); // Processar máximo 10 por vez

    if (error) {
      console.error('Erro ao buscar exportações pendentes:', error);
      return;
    }

    if (!pendingExports || pendingExports.length === 0) {
      console.debug('Nenhuma exportação pendente encontrada');
      return;
    }

    console.debug(`ðŸ" Processando ${pendingExports.length} exportações pendentes`);

    // Processar cada exportação
    const results = await Promise.allSettled(
      pendingExports.map(exportItem => processDataExport(exportItem.id))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;

    console.debug(`âœ… Exportações processadas: ${successful} sucesso, ${failed} falhas`);

  } catch (error) {
    console.error('Erro crítico no agendamento de exportações:', error);
  }
}

/**
 * Limpa arquivos de exportação expirados do storage
 */
export async function cleanupExpiredExports(): Promise<void> {
  try {
    const supabase = await createSupabaseAdminClient();
    
    // Buscar exportações expiradas
    const { data: expiredExports, error } = await supabase
      .from('user_data_exports')
      .select('id, user_id, file_url')
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'completed')
      .limit(50);

    if (error) {
      console.error('Erro ao buscar exportações expiradas:', error);
      return;
    }

    if (!expiredExports || expiredExports.length === 0) {
      console.debug('Nenhuma exportação expirada encontrada');
      return;
    }

    console.debug(`ðŸ§¹ Limpando ${expiredExports.length} exportações expiradas`);

    for (const exp of expiredExports) {
      try {
        // Deletar arquivo do storage
        const fileName = `${exp.user_id}/${exp.id}`;
        await supabase.storage
          .from('data-exports')
          .remove([fileName]);

        // Atualizar status para expirado
        await supabase
          .from('user_data_exports')
          .update({ 
            status: 'expired',
            file_url: null
          })
          .eq('id', exp.id);

        console.debug(`ðŸ—'ï¸ Exportação ${exp.id} limpa com sucesso`);
      } catch (cleanupError) {
        console.error(`Erro ao limpar exportação ${exp.id}:`, cleanupError);
      }
    }

  } catch (error) {
    console.error('Erro crítico na limpeza de exportações:', error);
  }
} 
