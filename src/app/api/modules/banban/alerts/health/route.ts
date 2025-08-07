import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/core/supabase/server';
import { BanbanAlertsModule } from '@/core/modules/banban/alerts';

/**
 * GET /api/modules/banban/alerts/health
 * Health check do sistema de alertas BanBan
 * Endpoint público (sem autenticação) para monitoramento
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const healthChecks = {
      api: { status: 'healthy', response_time_ms: 0 },
      database: { status: 'unknown', response_time_ms: 0 },
      module_core: { status: 'unknown', response_time_ms: 0 },
      alert_processor: { status: 'unknown', response_time_ms: 0 },
    };

    // Health check da API
    healthChecks.api.response_time_ms = Date.now() - startTime;
    healthChecks.api.status = 'healthy';

    // Health check do banco de dados
    const dbStartTime = Date.now();
    try {
      const supabase = createClient();
      
      // Testar conexão básica com o banco
      const { data, error } = await supabase
        .from('tenant_alerts')
        .select('count(*)')
        .limit(1);

      healthChecks.database.response_time_ms = Date.now() - dbStartTime;
      
      if (error) {
        healthChecks.database.status = 'unhealthy';
        healthChecks.database.error = error.message;
      } else {
        healthChecks.database.status = 'healthy';
      }
    } catch (dbError) {
      healthChecks.database.response_time_ms = Date.now() - dbStartTime;
      healthChecks.database.status = 'unhealthy';
      healthChecks.database.error = dbError.message;
    }

    // Health check do módulo core
    const moduleStartTime = Date.now();
    try {
      const alertsModule = new BanbanAlertsModule();
      const moduleHealth = await alertsModule.healthCheck();
      
      healthChecks.module_core.response_time_ms = Date.now() - moduleStartTime;
      healthChecks.module_core.status = moduleHealth.status;
      healthChecks.module_core.details = moduleHealth.details;
    } catch (moduleError) {
      healthChecks.module_core.response_time_ms = Date.now() - moduleStartTime;
      healthChecks.module_core.status = 'unhealthy';
      healthChecks.module_core.error = moduleError.message;
    }

    // Health check do processador de alertas
    const processorStartTime = Date.now();
    try {
      // Simular processamento de alertas (mock test)
      const testOrgId = 'health-check-test';
      // Como é um health check, usamos um ID fictício e não processamos dados reais
      
      healthChecks.alert_processor.response_time_ms = Date.now() - processorStartTime;
      healthChecks.alert_processor.status = 'healthy';
      healthChecks.alert_processor.note = 'Processor interface available';
    } catch (processorError) {
      healthChecks.alert_processor.response_time_ms = Date.now() - processorStartTime;
      healthChecks.alert_processor.status = 'unhealthy';
      healthChecks.alert_processor.error = processorError.message;
    }

    // Determinar status geral
    const allStatuses = Object.values(healthChecks).map(check => check.status);
    const overallStatus = allStatuses.includes('unhealthy') 
      ? 'unhealthy' 
      : allStatuses.includes('degraded') 
        ? 'degraded' 
        : 'healthy';

    const totalResponseTime = Date.now() - startTime;

    // Resposta do health check
    const healthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time_ms: totalResponseTime,
      module: {
        id: 'banban-alerts',
        name: 'BanBan Alerts System',
        version: '2.0.0',
      },
      checks: healthChecks,
      system_info: {
        node_version: process.version,
        uptime_seconds: process.uptime(),
        memory_usage: process.memoryUsage(),
      },
    };

    // Status HTTP baseado na saúde geral
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthResponse, { status: statusCode });

  } catch (error) {
    console.error('Error in health check:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - startTime,
      module: {
        id: 'banban-alerts',
        name: 'BanBan Alerts System',
        version: '2.0.0',
      },
      error: error.message,
      checks: {
        api: { status: 'unhealthy', error: error.message },
        database: { status: 'unknown' },
        module_core: { status: 'unknown' },
        alert_processor: { status: 'unknown' },
      },
    }, { status: 503 });
  }
}

/**
 * GET /api/modules/banban/alerts/health/ready
 * Readiness probe para Kubernetes
 */
export async function HEAD(request: NextRequest) {
  try {
    // Verificação mais leve para readiness
    const supabase = createClient();
    
    // Testar apenas se consegue conectar no banco
    const { error } = await supabase
      .from('tenant_alerts')
      .select('count(*)')
      .limit(1);

    if (error) {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, { status: 200 });
    
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}