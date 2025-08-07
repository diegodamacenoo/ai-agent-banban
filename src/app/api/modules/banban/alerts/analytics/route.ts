import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/core/supabase/server';
import { alertMetricsService } from '@/core/modules/banban/alerts/services/alert-metrics';
import { z } from 'zod';

// Schema para filtros de analytics
const AnalyticsFiltersSchema = z.object({
  period: z.enum(['24h', '7d', '30d', '90d', 'custom']).default('30d'),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  alert_types: z.array(z.string()).optional(),
  priorities: z.array(z.enum(['CRITICAL', 'WARNING', 'INFO', 'OPPORTUNITY'])).optional(),
  include_resolved: z.boolean().default(true),
});

/**
 * GET /api/modules/banban/alerts/analytics
 * Obter analytics completos de alertas
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar organização do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Extrair parâmetros de query
    const { searchParams } = new URL(request.url);
    const filters = AnalyticsFiltersSchema.parse({
      period: searchParams.get('period'),
      from_date: searchParams.get('from_date'),
      to_date: searchParams.get('to_date'),
      alert_types: searchParams.get('alert_types')?.split(','),
      priorities: searchParams.get('priorities')?.split(','),
      include_resolved: searchParams.get('include_resolved') !== 'false',
    });

    // Calcular datas baseado no período
    let fromDate: Date;
    let toDate: Date = new Date();

    if (filters.period === 'custom') {
      if (!filters.from_date || !filters.to_date) {
        return NextResponse.json(
          { error: 'from_date and to_date are required for custom period' },
          { status: 400 }
        );
      }
      fromDate = new Date(filters.from_date);
      toDate = new Date(filters.to_date);
    } else {
      const periodHours = {
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
        '90d': 24 * 90,
      };
      fromDate = new Date(Date.now() - periodHours[filters.period] * 60 * 60 * 1000);
    }

    // Construir query de alertas
    let alertsQuery = supabase
      .from('tenant_alerts')
      .select('*')
      .eq('tenant_id', profile.organization_id)
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString());

    if (filters.alert_types?.length) {
      alertsQuery = alertsQuery.in('alert_type', filters.alert_types);
    }

    if (filters.priorities?.length) {
      alertsQuery = alertsQuery.in('priority', filters.priorities);
    }

    if (!filters.include_resolved) {
      alertsQuery = alertsQuery.neq('status', 'RESOLVED');
    }

    const { data: alerts, error: alertsError } = await alertsQuery.order('created_at', { ascending: false });

    if (alertsError) {
      console.error('Error fetching alerts for analytics:', alertsError);
      return NextResponse.json(
        { error: 'Failed to fetch alerts data' },
        { status: 500 }
      );
    }

    // Calcular métricas usando o serviço de métricas
    const basicMetrics = alertMetricsService.calculateAlertMetrics(alerts || []);

    // Métricas avançadas
    const advancedMetrics = calculateAdvancedMetrics(alerts || [], fromDate, toDate);

    // Tendências temporais
    const temporalTrends = calculateTemporalTrends(alerts || [], filters.period);

    // Métricas de performance
    const performanceMetrics = await calculatePerformanceMetrics(supabase, profile.organization_id, fromDate, toDate);

    // Top alertas por impacto
    const topAlertsByImpact = calculateTopAlertsByImpact(alerts || []);

    return NextResponse.json({
      data: {
        period: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          duration_hours: Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60)),
        },
        filters: filters,
        basic_metrics: basicMetrics,
        advanced_metrics: advancedMetrics,
        temporal_trends: temporalTrends,
        performance_metrics: performanceMetrics,
        top_alerts_by_impact: topAlertsByImpact,
      },
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in GET /api/modules/banban/alerts/analytics:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calcular métricas avançadas
 */
function calculateAdvancedMetrics(alerts: any[], fromDate: Date, toDate: Date) {
  const now = new Date();
  const periodHours = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60);

  // Taxa de geração de alertas
  const alertGenerationRate = alerts.length / periodHours;

  // Distribuição por hora do dia
  const hourlyDistribution = Array(24).fill(0);
  alerts.forEach(alert => {
    const hour = new Date(alert.created_at).getHours();
    hourlyDistribution[hour]++;
  });

  // Distribuição por dia da semana
  const weeklyDistribution = Array(7).fill(0);
  alerts.forEach(alert => {
    const dayOfWeek = new Date(alert.created_at).getDay();
    weeklyDistribution[dayOfWeek]++;
  });

  // Taxa de false positives (estimativa baseada em alertas resolvidos rapidamente)
  const quicklyResolvedAlerts = alerts.filter(alert => {
    if (alert.status !== 'RESOLVED' || !alert.resolved_at) return false;
    const resolutionTime = new Date(alert.resolved_at).getTime() - new Date(alert.created_at).getTime();
    return resolutionTime < 5 * 60 * 1000; // Menos de 5 minutos
  });
  const falsePositiveRate = quicklyResolvedAlerts.length / Math.max(alerts.length, 1);

  // Efetividade por tipo de alerta
  const effectivenessByType = {};
  const alertsByType = alerts.reduce((acc, alert) => {
    if (!acc[alert.alert_type]) acc[alert.alert_type] = [];
    acc[alert.alert_type].push(alert);
    return acc;
  }, {});

  Object.entries(alertsByType).forEach(([type, typeAlerts]: [string, any[]]) => {
    const resolvedAlerts = typeAlerts.filter(a => a.status === 'RESOLVED');
    const avgResolutionTime = resolvedAlerts.length > 0
      ? resolvedAlerts.reduce((sum, alert) => {
          if (!alert.resolution_time_minutes) return sum;
          return sum + alert.resolution_time_minutes;
        }, 0) / resolvedAlerts.length
      : null;

    effectivenessByType[type] = {
      total_alerts: typeAlerts.length,
      resolved_alerts: resolvedAlerts.length,
      resolution_rate: resolvedAlerts.length / typeAlerts.length,
      avg_resolution_time_minutes: avgResolutionTime,
    };
  });

  return {
    alert_generation_rate_per_hour: alertGenerationRate,
    false_positive_rate: falsePositiveRate,
    hourly_distribution: hourlyDistribution,
    weekly_distribution: weeklyDistribution,
    effectiveness_by_type: effectivenessByType,
  };
}

/**
 * Calcular tendências temporais
 */
function calculateTemporalTrends(alerts: any[], period: string) {
  let bucketSize: number;
  let bucketFormat: (date: Date) => string;

  // Determinar tamanho do bucket baseado no período
  switch (period) {
    case '24h':
      bucketSize = 60 * 60 * 1000; // 1 hora
      bucketFormat = (date) => date.toISOString().substring(0, 13) + ':00:00.000Z';
      break;
    case '7d':
      bucketSize = 24 * 60 * 60 * 1000; // 1 dia
      bucketFormat = (date) => date.toISOString().substring(0, 10) + 'T00:00:00.000Z';
      break;
    case '30d':
    case '90d':
    default:
      bucketSize = 24 * 60 * 60 * 1000; // 1 dia
      bucketFormat = (date) => date.toISOString().substring(0, 10) + 'T00:00:00.000Z';
      break;
  }

  // Agrupar alertas em buckets
  const buckets: { [key: string]: any[] } = {};
  alerts.forEach(alert => {
    const bucketKey = bucketFormat(new Date(alert.created_at));
    if (!buckets[bucketKey]) buckets[bucketKey] = [];
    buckets[bucketKey].push(alert);
  });

  // Converter para array ordenado
  const timeline = Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([timestamp, bucketAlerts]) => ({
      timestamp,
      count: bucketAlerts.length,
      by_priority: {
        CRITICAL: bucketAlerts.filter(a => a.priority === 'CRITICAL').length,
        WARNING: bucketAlerts.filter(a => a.priority === 'WARNING').length,
        INFO: bucketAlerts.filter(a => a.priority === 'INFO').length,
        OPPORTUNITY: bucketAlerts.filter(a => a.priority === 'OPPORTUNITY').length,
      },
      by_status: {
        ACTIVE: bucketAlerts.filter(a => a.status === 'ACTIVE').length,
        ACKNOWLEDGED: bucketAlerts.filter(a => a.status === 'ACKNOWLEDGED').length,
        RESOLVED: bucketAlerts.filter(a => a.status === 'RESOLVED').length,
        ARCHIVED: bucketAlerts.filter(a => a.status === 'ARCHIVED').length,
      },
    }));

  return {
    bucket_size_ms: bucketSize,
    timeline,
  };
}

/**
 * Calcular métricas de performance
 */
async function calculatePerformanceMetrics(supabase: any, tenantId: string, fromDate: Date, toDate: Date) {
  try {
    // SLA compliance por prioridade
    const { data: resolvedAlerts } = await supabase
      .from('tenant_alerts')
      .select('priority, resolution_time_minutes, created_at, resolved_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'RESOLVED')
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .not('resolution_time_minutes', 'is', null);

    // SLA targets em minutos
    const slaTargets = {
      'CRITICAL': 60,    // 1 hora
      'WARNING': 240,    // 4 horas  
      'INFO': 1440,      // 1 dia
      'OPPORTUNITY': 2880, // 2 dias
    };

    const slaCompliance = {};
    Object.keys(slaTargets).forEach(priority => {
      const priorityAlerts = (resolvedAlerts || []).filter(a => a.priority === priority);
      const compliantAlerts = priorityAlerts.filter(a => a.resolution_time_minutes <= slaTargets[priority]);
      
      slaCompliance[priority] = {
        total_alerts: priorityAlerts.length,
        compliant_alerts: compliantAlerts.length,
        compliance_rate: priorityAlerts.length > 0 ? compliantAlerts.length / priorityAlerts.length : 0,
        avg_resolution_time_minutes: priorityAlerts.length > 0
          ? priorityAlerts.reduce((sum, a) => sum + a.resolution_time_minutes, 0) / priorityAlerts.length
          : 0,
        sla_target_minutes: slaTargets[priority],
      };
    });

    // Taxa de entrega de notificações
    const { data: deliveries } = await supabase
      .from('tenant_alert_deliveries')
      .select('status, delivery_type')
      .eq('tenant_id', tenantId)
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString());

    const deliveryStats = (deliveries || []).reduce((acc, delivery) => {
      if (!acc[delivery.delivery_type]) {
        acc[delivery.delivery_type] = { total: 0, successful: 0 };
      }
      acc[delivery.delivery_type].total++;
      if (delivery.status === 'delivered') {
        acc[delivery.delivery_type].successful++;
      }
      return acc;
    }, {});

    Object.keys(deliveryStats).forEach(type => {
      deliveryStats[type].success_rate = deliveryStats[type].successful / deliveryStats[type].total;
    });

    return {
      sla_compliance: slaCompliance,
      delivery_stats: deliveryStats,
    };

  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    return {
      sla_compliance: {},
      delivery_stats: {},
    };
  }
}

/**
 * Calcular top alertas por impacto
 */
function calculateTopAlertsByImpact(alerts: any[]) {
  // Calcular score de impacto baseado em prioridade, duração e escalações
  const priorityScores = {
    'CRITICAL': 4,
    'WARNING': 3,
    'INFO': 2,
    'OPPORTUNITY': 1,
  };

  const alertsWithImpact = alerts.map(alert => {
    let impactScore = priorityScores[alert.priority] || 1;
    
    // Penalizar alertas não resolvidos há muito tempo
    if (alert.status !== 'RESOLVED') {
      const ageHours = (new Date().getTime() - new Date(alert.created_at).getTime()) / (1000 * 60 * 60);
      impactScore *= Math.min(3, 1 + ageHours / 24); // Multiplica até 3x baseado na idade
    }
    
    return {
      ...alert,
      impact_score: impactScore,
    };
  });

  // Ordenar por score de impacto e retornar top 10
  return alertsWithImpact
    .sort((a, b) => b.impact_score - a.impact_score)
    .slice(0, 10)
    .map(alert => ({
      id: alert.id,
      title: alert.title,
      alert_type: alert.alert_type,
      priority: alert.priority,
      status: alert.status,
      created_at: alert.created_at,
      impact_score: alert.impact_score,
    }));
}