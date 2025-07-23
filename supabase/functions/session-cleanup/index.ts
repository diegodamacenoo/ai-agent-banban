import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface SessionCleanupResponse {
  success: boolean;
  message: string;
  stats?: {
    deactivated_sessions: number;
    deleted_sessions: number;
    execution_time_ms: number;
  };
  error?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    const startTime = Date.now();

    // Verificar se é uma requisição POST com autorização
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Método não permitido. Use POST.' 
        }),
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar autorização via header
    const authHeader = req.headers.get('Authorization');
    const expectedToken = Deno.env.get('CRON_SECRET');
    
    if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não autorizado' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Configurar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧹 Iniciando limpeza automática de sessões...');

    // 1. Desativar sessões inativas há mais de 24 horas
    const { data: deactivatedData, error: deactivateError } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('is_active', true)
      .lt('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select('id');

    if (deactivateError) {
      console.error('❌ Erro ao desativar sessões:', deactivateError);
      throw deactivateError;
    }

    const deactivatedCount = deactivatedData?.length || 0;
    console.log(`✅ ${deactivatedCount} sessões desativadas por inatividade`);

    // 2. Deletar sessões muito antigas (mais de 30 dias)
    const { data: deletedData, error: deleteError } = await supabase
      .from('user_sessions')
      .delete()
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .select('id');

    if (deleteError) {
      console.error('❌ Erro ao deletar sessões antigas:', deleteError);
      throw deleteError;
    }

    const deletedCount = deletedData?.length || 0;
    console.log(`🗑️ ${deletedCount} sessões antigas deletadas`);

    // 3. Registrar log de auditoria
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        action_type: 'SYSTEM_CLEANUP',
        resource_type: 'SESSION',
        details: {
          cleaned_at: new Date().toISOString(),
          action: 'automatic_session_cleanup',
          deactivated_sessions: deactivatedCount,
          deleted_sessions: deletedCount,
          execution_time_ms: Date.now() - startTime
        },
        created_at: new Date().toISOString()
      });

    if (auditError) {
      console.warn('⚠️ Erro ao registrar log de auditoria:', auditError);
      // Não falhar a operação por causa do log
    }

    const executionTime = Date.now() - startTime;
    console.log(`🎉 Limpeza concluída em ${executionTime}ms`);

    const response: SessionCleanupResponse = {
      success: true,
      message: 'Limpeza de sessões executada com sucesso',
      stats: {
        deactivated_sessions: deactivatedCount,
        deleted_sessions: deletedCount,
        execution_time_ms: executionTime
      }
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        }
      }
    );

  } catch (error) {
    console.error('💥 Erro na limpeza de sessões:', error);
    
    const response: SessionCleanupResponse = {
      success: false,
      message: 'Erro na limpeza de sessões',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});