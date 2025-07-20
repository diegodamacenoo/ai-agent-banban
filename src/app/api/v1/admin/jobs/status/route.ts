import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { getJobsHealthStatus, processJobsByType } from '@/core/jobs/background-jobs';
import { withRateLimit } from '@/core/api/rate-limiter';

/**
 * API de Monitoramento do Sistema de Jobs
 */

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'jobs-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'master_admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas master admins podem acessar esta API.' },
        { status: 403 }
      );
    }

    // Obter status de saúde dos jobs
    const healthStatus = await getJobsHealthStatus();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      system_health: healthStatus,
      endpoints: {
        trigger_jobs: '/api/admin/jobs/trigger',
        process_specific: '/api/admin/jobs/process'
      }
    });

  } catch (error) {
    console.error('Erro na API de status dos jobs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'jobs-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticação e permissões
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'master_admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas master admins podem executar jobs manualmente.' },
        { status: 403 }
      );
    }

    // Ler body da requisição
    const body = await request.json();
    const { jobType } = body;

    if (!jobType || !['exports', 'deletions', 'cleanup'].includes(jobType)) {
      return NextResponse.json(
        { error: 'Tipo de job inválido. Use: exports, deletions, ou cleanup' },
        { status: 400 }
      );
    }

    // Executar job específico
    const result = await processJobsByType(jobType);

    // Registrar execução manual
    await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: user.id,
        action_type: 'manual_job_execution',
        resource_type: 'system',
        resource_id: `job_${jobType}`,
        details: {
          job_type: jobType,
          result: result,
          triggered_by: 'admin_api',
          execution_time: new Date().toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      job_type: jobType,
      result: result,
      executed_at: new Date().toISOString(),
      executed_by: user.email
    });

  } catch (error) {
    console.error('Erro na execução manual de job:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
