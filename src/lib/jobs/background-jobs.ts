import { scheduleExportProcessing, cleanupExpiredExports } from '@/app/actions/auth/data-export-processor';
import { processScheduledDeletions } from './deletion-processor';

/**
 * Sistema de Jobs em Background
 * 
 * @description Este sistema simula um processador de jobs para tarefas
 * que precisam ser executadas em background. Em produção, seria
 * substituído por Bull Queue, AWS SQS, ou similar.
 */

export interface JobResult {
  success: boolean;
  message: string;
  processed?: number;
  errors?: number;
}

/**
 * Processa todas as tarefas em background pendentes
 * 
 * @description Esta função deveria ser chamada por um cron job
 * executando a cada 5-10 minutos para processar tasks pendentes
 */
export async function processBackgroundJobs(): Promise<JobResult[]> {
  const results: JobResult[] = [];
  
  try {
    console.log('🔄 Iniciando processamento de jobs em background...');

    // 1. Processar exportações de dados pendentes
    try {
      await scheduleExportProcessing();
      results.push({
        success: true,
        message: 'Exportações de dados processadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao processar exportações:', error);
      results.push({
        success: false,
        message: 'Falha ao processar exportações de dados'
      });
    }

    // 2. Processar exclusões agendadas
    try {
      const deletionResult = await processScheduledDeletions();
      results.push({
        success: true,
        message: `Exclusões processadas: ${deletionResult.processed} realizadas, ${deletionResult.errors} falhas`,
        processed: deletionResult.processed,
        errors: deletionResult.errors
      });
    } catch (error) {
      console.error('Erro ao processar exclusões:', error);
      results.push({
        success: false,
        message: 'Falha ao processar exclusões agendadas'
      });
    }

    // 3. Limpar arquivos expirados
    try {
      await cleanupExpiredExports();
      results.push({
        success: true,
        message: 'Limpeza de arquivos expirados realizada'
      });
    } catch (error) {
      console.error('Erro ao limpar arquivos:', error);
      results.push({
        success: false,
        message: 'Falha na limpeza de arquivos expirados'
      });
    }

    const totalSuccess = results.filter(r => r.success).length;
    const totalFailed = results.filter(r => !r.success).length;
    
    console.log(`✅ Jobs concluídos: ${totalSuccess} sucesso, ${totalFailed} falhas`);
    
    return results;

  } catch (error) {
    console.error('Erro crítico no processamento de jobs:', error);
    return [{
      success: false,
      message: 'Erro crítico no sistema de jobs'
    }];
  }
}

/**
 * Processa jobs específicos por tipo
 */
export async function processJobsByType(jobType: 'exports' | 'deletions' | 'cleanup'): Promise<JobResult> {
  try {
    switch (jobType) {
      case 'exports':
        await scheduleExportProcessing();
        return {
          success: true,
          message: 'Exportações processadas com sucesso'
        };

      case 'deletions':
        const result = await processScheduledDeletions();
        return {
          success: true,
          message: `Exclusões processadas: ${result.processed} realizadas`,
          processed: result.processed,
          errors: result.errors
        };

      case 'cleanup':
        await cleanupExpiredExports();
        return {
          success: true,
          message: 'Limpeza realizada com sucesso'
        };

      default:
        return {
          success: false,
          message: 'Tipo de job inválido'
        };
    }
  } catch (error) {
    console.error(`Erro ao processar job ${jobType}:`, error);
    return {
      success: false,
      message: `Falha ao processar job ${jobType}`
    };
  }
}

/**
 * Função para monitoramento de saúde do sistema de jobs
 */
export async function getJobsHealthStatus(): Promise<{
  healthy: boolean;
  issues: string[];
  pendingCounts: {
    exports: number;
    deletions: number;
    expired: number;
  };
}> {
  const issues: string[] = [];
  let pendingCounts = {
    exports: 0,
    deletions: 0,
    expired: 0
  };

  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase/server');
    const { cookies } = await import('next/headers');
    const supabase = createSupabaseAdminClient(await cookies());

    // Verificar exportações pendentes
    const { data: pendingExports, error: exportsError } = await supabase
      .from('user_data_exports')
      .select('id', { count: 'exact' })
      .eq('status', 'requested');

    if (exportsError) {
      issues.push('Erro ao verificar exportações pendentes');
    } else {
      pendingCounts.exports = pendingExports?.length || 0;
      if (pendingCounts.exports > 50) {
        issues.push(`Muitas exportações pendentes: ${pendingCounts.exports}`);
      }
    }

    // Verificar exclusões agendadas
    const { data: scheduledDeletions, error: deletionsError } = await supabase
      .from('user_deletion_requests')
      .select('id', { count: 'exact' })
      .eq('status', 'confirmed')
      .lt('scheduled_deletion_date', new Date().toISOString());

    if (deletionsError) {
      issues.push('Erro ao verificar exclusões agendadas');
    } else {
      pendingCounts.deletions = scheduledDeletions?.length || 0;
      if (pendingCounts.deletions > 10) {
        issues.push(`Muitas exclusões atrasadas: ${pendingCounts.deletions}`);
      }
    }

    // Verificar arquivos expirados
    const { data: expiredFiles, error: expiredError } = await supabase
      .from('user_data_exports')
      .select('id', { count: 'exact' })
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'completed');

    if (expiredError) {
      issues.push('Erro ao verificar arquivos expirados');
    } else {
      pendingCounts.expired = expiredFiles?.length || 0;
      if (pendingCounts.expired > 100) {
        issues.push(`Muitos arquivos expirados: ${pendingCounts.expired}`);
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
      pendingCounts
    };

  } catch (error) {
    console.error('Erro ao verificar saúde dos jobs:', error);
    return {
      healthy: false,
      issues: ['Erro crítico no sistema de monitoramento'],
      pendingCounts
    };
  }
}

/**
 * Simula um scheduler de jobs (em produção seria um cron job)
 */
export function startJobScheduler(): void {
  console.log('🚀 Iniciando scheduler de jobs em background...');
  
  // Processar jobs a cada 5 minutos
  setInterval(async () => {
    try {
      await processBackgroundJobs();
    } catch (error) {
      console.error('Erro no scheduler de jobs:', error);
    }
  }, 5 * 60 * 1000); // 5 minutos

  // Verificar saúde do sistema a cada 15 minutos
  setInterval(async () => {
    try {
      const health = await getJobsHealthStatus();
      if (!health.healthy) {
        console.warn('⚠️ Problemas detectados no sistema de jobs:', health.issues);
      }
    } catch (error) {
      console.error('Erro na verificação de saúde dos jobs:', error);
    }
  }, 15 * 60 * 1000); // 15 minutos
} 