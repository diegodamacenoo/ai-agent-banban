'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';
import type {
  ModuleDetail,
  TenantStatus,
  RealTimeMetrics,
  UsageChartData,
  ActivityLog,
  ModuleIssue,
  TestResult,
  LoadTestResult,
  ValidationResult,
  RestartResult,
  CacheResult
} from '@/app/(protected)/admin/modules/[moduleId]/types/module-details';

// Dados principais do módulo
export async function getModuleDetails(moduleId: string): Promise<{ data: ModuleDetail | null; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('base_modules')
      .select(`
        *,
        implementations:module_implementations(*),
        tenant_assignments:tenant_module_assignments(
          *,
          organizations(id, company_trading_name, slug)
        )
      `)
      .eq('slug', moduleId)
      .single();

    if (error) {
      console.error('Error fetching module details:', error);
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Módulo não encontrado' };
    }

    // Transformar dados para o formato esperado
    const moduleDetail: ModuleDetail = {
      id: data.id,
      slug: data.slug,
      name: data.name,
      description: data.description || '',
      category: data.category,
      is_active: data.is_active,
      implementations: data.implementations || [],
      tenant_assignments: (data.tenant_assignments || []).map((assignment: any) => ({
        ...assignment,
        tenant_name: assignment.organizations?.company_trading_name,
        tenant_slug: assignment.organizations?.slug
      })),
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    return { data: moduleDetail };
  } catch (error) {
    console.error('Unexpected error in getModuleDetails:', error);
    return { data: null, error: 'Erro interno do servidor' };
  }
}

// Status dos tenants para este módulo
export async function getModuleTenantStatus(moduleId: string): Promise<{ data: TenantStatus[]; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // AIDEV-NOTE: A query foi reescrita para usar JOINs explícitos e ser mais robusta.
    // A sintaxe !inner era ambígua e poderia falhar se a relação não fosse detectada.
    const { data, error } = await supabase
      .from('tenant_module_assignments')
      .select(`
        tenant_id,
        is_active,
        organization:organizations(
          id,
          company_trading_name,
          company_legal_name,
          slug
        ),
        implementation:module_implementations(
          id,
          implementation_key,
          name,
          component_path
        )
      `)
      .eq('base_module_id', moduleId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching tenant status:', error);
      return { data: [], error: error.message };
    }

    // Simular status online/offline (em produção viria de métricas reais)
    const tenantStatuses: TenantStatus[] = (data || []).map((assignment: any) => {
      const lastActivity = new Date(Date.now() - Math.random() * 300000); // Últimos 5min
      const isOnline = Math.random() > 0.1; // 90% chance de estar online
      const responseTime = Math.floor(Math.random() * 500) + 100; // 100-600ms
      
      const orgName = assignment.organization?.company_trading_name || 
                     assignment.organization?.company_legal_name || 
                     'Unknown Organization';
      const orgSlug = assignment.organization?.slug || 'unknown';
      
      return {
        tenant_id: assignment.tenant_id,
        tenant_name: orgName,
        tenant_slug: orgSlug,
        implementation_key: assignment.implementation?.implementation_key || 'default',
        implementation_name: assignment.implementation?.name || 'Default Implementation',
        is_online: isOnline,
        last_activity: lastActivity.toISOString(),
        response_time: responseTime,
        error_count: isOnline ? 0 : Math.floor(Math.random() * 3),
        status_color: isOnline ? 'green' : (responseTime > 400 ? 'yellow' : 'red')
      };
    });

    return { data: tenantStatuses };
  } catch (error) {
    console.error('Unexpected error in getModuleTenantStatus:', error);
    return { data: [], error: 'Erro interno do servidor' };
  }
}

// Métricas em tempo real do módulo
export async function getModuleRealTimeMetrics(moduleId: string): Promise<{ data: RealTimeMetrics | null; error?: string }> {
  try {
    // AIDEV-NOTE: Em produção, estas métricas viriam de sistema de monitoramento real
    // Por enquanto, simular dados realistas
    
    const metrics: RealTimeMetrics = {
      module_id: moduleId,
      current_usage: Math.floor(Math.random() * 50) + 10, // 10-60 usuários
      avg_response_time: Math.floor(Math.random() * 200) + 150, // 150-350ms
      uptime_percentage: 99.8 - Math.random() * 0.5, // 99.3-99.8%
      cache_hit_rate: 90 + Math.random() * 8, // 90-98%
      last_sync: new Date().toISOString(),
      total_requests_today: Math.floor(Math.random() * 1000) + 500, // 500-1500 requests
      active_connections: Math.floor(Math.random() * 20) + 5 // 5-25 conexões
    };

    return { data: metrics };
  } catch (error) {
    console.error('Unexpected error in getModuleRealTimeMetrics:', error);
    return { data: null, error: 'Erro interno do servidor' };
  }
}

// Dados para gráfico de uso
export async function getModuleUsageChart(moduleId: string, days: number = 7): Promise<{ data: UsageChartData[]; error?: string }> {
  try {
    // AIDEV-NOTE: Em produção, vir de analytics/metrics database
    // Simular dados dos últimos N dias
    
    const chartData: UsageChartData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      chartData.push({
        date: date.toISOString().split('T')[0],
        requests: Math.floor(Math.random() * 200) + 100,
        response_time: Math.floor(Math.random() * 100) + 200,
        errors: Math.floor(Math.random() * 5),
        unique_users: Math.floor(Math.random() * 30) + 10
      });
    }

    return { data: chartData };
  } catch (error) {
    console.error('Unexpected error in getModuleUsageChart:', error);
    return { data: [], error: 'Erro interno do servidor' };
  }
}

// Log de atividades específico do módulo
export async function getModuleActivityLog(moduleId: string, limit: number = 50): Promise<{ data: ActivityLog[]; error?: string }> {
  try {
    // AIDEV-NOTE: Em produção, vir de sistema de logs centralizado
    // Simular logs recentes
    
    const eventTypes = ['access', 'config_change', 'system', 'performance', 'error'] as const;
    const severities = ['info', 'warning', 'error'] as const;
    
    const logs: ActivityLog[] = [];
    
    for (let i = 0; i < limit; i++) {
      const createdAt = new Date(Date.now() - Math.random() * 86400000); // Último dia
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const severity = eventType === 'error' ? 'error' : 
                      eventType === 'performance' ? 'warning' : 'info';
      
      logs.push({
        id: `log_${i}`,
        module_id: moduleId,
        tenant_id: Math.random() > 0.3 ? `tenant_${Math.floor(Math.random() * 4)}` : undefined,
        tenant_name: Math.random() > 0.3 ? ['Banban Fashion', 'CA Store', 'Riachuelo', 'Demo Corp'][Math.floor(Math.random() * 4)] : undefined,
        event_type: eventType,
        event_description: generateEventDescription(eventType),
        metadata: { timestamp: createdAt.toISOString() },
        created_at: createdAt.toISOString(),
        severity
      });
    }
    
    // Ordenar por data mais recente
    logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { data: logs };
  } catch (error) {
    console.error('Unexpected error in getModuleActivityLog:', error);
    return { data: [], error: 'Erro interno do servidor' };
  }
}

// Issues e problemas do módulo
export async function getModuleIssues(moduleId: string): Promise<{ data: ModuleIssue[]; error?: string }> {
  try {
    // AIDEV-NOTE: Em produção, vir de sistema de monitoramento
    // Simular alguns issues comuns
    
    const issues: ModuleIssue[] = [];
    
    // Adicionar alguns issues baseados em probabilidade
    if (Math.random() > 0.7) {
      issues.push({
        id: 'issue_timeout',
        module_id: moduleId,
        tenant_id: 'demo_tenant',
        tenant_name: 'Demo Corp',
        issue_type: 'error',
        title: 'Connection timeout detectado',
        description: 'Tenant Demo Corp apresentando timeouts nos últimos 2 minutos',
        suggested_actions: [
          'Reiniciar módulo para este tenant',
          'Verificar conectividade de rede',
          'Analisar logs detalhados'
        ],
        is_resolved: false,
        created_at: new Date(Date.now() - 120000).toISOString() // 2min atrás
      });
    }
    
    if (Math.random() > 0.6) {
      issues.push({
        id: 'issue_deprecated',
        module_id: moduleId,
        tenant_id: 'banban_tenant',
        tenant_name: 'Banban Fashion',
        issue_type: 'warning',
        title: 'Configuração deprecated detectada',
        description: 'Tenant usando chave de configuração "old_kpi_format" que será removida em v2.1',
        suggested_actions: [
          'Atualizar configuração automaticamente',
          'Agendar migração para próxima manutenção',
          'Ignorar até próxima versão'
        ],
        is_resolved: false,
        created_at: new Date(Date.now() - 3600000).toISOString() // 1h atrás
      });
    }

    return { data: issues };
  } catch (error) {
    console.error('Unexpected error in getModuleIssues:', error);
    return { data: [], error: 'Erro interno do servidor' };
  }
}

// Debug Tools - Testar implementação
export async function testModuleImplementation(moduleId: string, tenantId?: string): Promise<{ data: TestResult; error?: string }> {
  try {
    // AIDEV-NOTE: Em produção, executar testes reais da implementação
    
    const startTime = Date.now();
    
    // Simular teste
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    const executionTime = Date.now() - startTime;
    const success = Math.random() > 0.1; // 90% success rate
    
    const result: TestResult = {
      success,
      message: success ? 
        `Teste executado com sucesso${tenantId ? ` para tenant ${tenantId}` : ' para todos os tenants'}` :
        `Falha no teste${tenantId ? ` para tenant ${tenantId}` : ''}: Timeout na conexão`,
      details: {
        tested_components: ['ModuleLoader', 'DataFetcher', 'Renderer'],
        tenant_id: tenantId,
        execution_steps: success ? 3 : 2
      },
      execution_time: executionTime,
      timestamp: new Date().toISOString()
    };

    return { data: result };
  } catch (error) {
    console.error('Unexpected error in testModuleImplementation:', error);
    return { 
      data: { 
        success: false, 
        message: 'Erro interno durante teste', 
        execution_time: 0, 
        timestamp: new Date().toISOString() 
      }, 
      error: 'Erro interno do servidor' 
    };
  }
}

// Debug Tools - Simular carga
export async function simulateModuleLoad(moduleId: string): Promise<{ data: LoadTestResult; error?: string }> {
  try {
    // AIDEV-NOTE: Em produção, executar teste de carga real
    
    // Simular teste de carga
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result: LoadTestResult = {
      requests_per_second: Math.floor(Math.random() * 100) + 50,
      avg_response_time: Math.floor(Math.random() * 200) + 100,
      error_rate: Math.random() * 2, // 0-2%
      peak_memory_usage: Math.floor(Math.random() * 50) + 25, // 25-75MB
      success: true,
      timestamp: new Date().toISOString()
    };

    return { data: result };
  } catch (error) {
    console.error('Unexpected error in simulateModuleLoad:', error);
    return {
      data: {
        requests_per_second: 0,
        avg_response_time: 0,
        error_rate: 100,
        peak_memory_usage: 0,
        success: false,
        timestamp: new Date().toISOString()
      },
      error: 'Erro interno do servidor'
    };
  }
}

// Função helper para gerar descrições de eventos
function generateEventDescription(eventType: string): string {
  const descriptions = {
    access: [
      'Usuário acessou dashboard principal',
      'Módulo carregado com sucesso',
      'Query de dados executada',
      'Interface renderizada'
    ],
    config_change: [
      'Configuração JSON atualizada',
      'Parâmetros de módulo alterados',
      'Cache invalidado após mudança',
      'Nova configuração aplicada'
    ],
    system: [
      'Health check executado',
      'Backup automático realizado',
      'Limpeza de cache agendada',
      'Monitoramento de performance ativado'
    ],
    performance: [
      'Tempo de resposta acima do limite',
      'Cache miss detectado',
      'Query lenta identificada',
      'Memory usage elevado'
    ],
    error: [
      'Falha na conexão com banco',
      'Timeout na requisição',
      'Erro de validação de dados',
      'Exceção não tratada capturada'
    ]
  };
  
  const eventDescriptions = descriptions[eventType as keyof typeof descriptions] || ['Evento não categorizado'];
  return eventDescriptions[Math.floor(Math.random() * eventDescriptions.length)];
}