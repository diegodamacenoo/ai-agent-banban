/**
 * Configurações avançadas do módulo BanBan Alerts
 * Baseado nas especificações do module.json do backup
 */

export interface AlertTypeConfig {
  type: string;
  threshold: number;
  priority: 'critical' | 'attention' | 'moderate' | 'opportunity';
  auto_escalate: boolean;
}

export interface EscalationRule {
  immediate: boolean;
  escalate_after_minutes: number;
  max_escalations: number;
}

export interface PerformanceMetrics {
  target_response_time: string;
  target_throughput: string;
  target_availability: string;
  alert_delivery_sla: string;
  false_positive_rate: string;
}

export interface ModuleConfig {
  id: string;
  name: string;
  version: string;
  client_id: string;
  description: string;
  features: Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
  }>;
  business_rules: {
    alert_types: AlertTypeConfig[];
    escalation_rules: Record<string, EscalationRule>;
  };
  performance_metrics: PerformanceMetrics;
  api: {
    version: string;
    base_path: string;
    endpoints: Array<{
      path: string;
      method: string;
      description: string;
      auth_required: boolean;
    }>;
  };
}

/**
 * Configuração completa do módulo BanBan Alerts
 * Importada do module.json do backup
 */
export const BANBAN_ALERTS_MODULE_CONFIG: ModuleConfig = {
  id: "banban-alerts",
  name: "BanBan Alerts System",
  version: "2.0.0",
  client_id: "banban",
  description: "Sistema inteligente de alertas para o cliente BanBan Fashion, especializado em detectar oportunidades e problemas críticos no varejo de calçados e moda.",
  
  features: [
    {
      id: "real_time_alerts",
      name: "Alertas em Tempo Real",
      description: "Processamento e geração de alertas em tempo real baseados em eventos do ERP",
      enabled: true
    },
    {
      id: "smart_thresholds",
      name: "Thresholds Inteligentes",
      description: "Sistema de limites configuráveis específicos para varejo de moda",
      enabled: true
    },
    {
      id: "priority_classification",
      name: "Classificação de Prioridade",
      description: "Sistema de priorização automática com 4 níveis (crítico, atenção, moderado, oportunidade)",
      enabled: true
    },
    {
      id: "multi_channel_delivery",
      name: "Entrega Multi-Canal",
      description: "Envio de alertas via email, SMS, push notifications e dashboard",
      enabled: true
    },
    {
      id: "alert_aggregation",
      name: "Agregação de Alertas",
      description: "Agrupamento inteligente para evitar spam de notificações",
      enabled: true
    },
    {
      id: "escalation_rules",
      name: "Regras de Escalação",
      description: "Sistema automático de escalação baseado em tempo e prioridade",
      enabled: true
    },
    {
      id: "alert_analytics",
      name: "Analytics de Alertas",
      description: "Análise de padrões e efetividade dos alertas gerados",
      enabled: true
    },
    {
      id: "custom_rules_engine",
      name: "Engine de Regras Customizadas",
      description: "Sistema flexível para criação de regras específicas do negócio",
      enabled: true
    }
  ],

  business_rules: {
    alert_types: [
      {
        type: "STOCK_CRITICAL",
        threshold: 5,
        priority: "critical",
        auto_escalate: true
      },
      {
        type: "STOCK_LOW",
        threshold: 10,
        priority: "attention",
        auto_escalate: false
      },
      {
        type: "MARGIN_LOW",
        threshold: 0.31,
        priority: "moderate",
        auto_escalate: false
      },
      {
        type: "SLOW_MOVING",
        threshold: 30,
        priority: "attention",
        auto_escalate: false
      },
      {
        type: "OVERSTOCK",
        threshold: 500,
        priority: "moderate",
        auto_escalate: false
      },
      {
        type: "SEASONAL_OPPORTUNITY",
        threshold: 0.8,
        priority: "opportunity",
        auto_escalate: false
      }
    ],
    
    escalation_rules: {
      critical: {
        immediate: true,
        escalate_after_minutes: 15,
        max_escalations: 3
      },
      attention: {
        immediate: false,
        escalate_after_minutes: 60,
        max_escalations: 2
      },
      moderate: {
        immediate: false,
        escalate_after_minutes: 240,
        max_escalations: 1
      },
      opportunity: {
        immediate: false,
        escalate_after_minutes: 1440,
        max_escalations: 0
      }
    }
  },

  performance_metrics: {
    target_response_time: "< 500ms",
    target_throughput: "1000 alerts/min",
    target_availability: "99.9%",
    alert_delivery_sla: "< 30s",
    false_positive_rate: "< 5%"
  },

  api: {
    version: "v2",
    base_path: "/api/modules/banban/alerts",
    endpoints: [
      {
        path: "/",
        method: "GET",
        description: "Listar alertas ativos com filtros",
        auth_required: true
      },
      {
        path: "/",
        method: "POST",
        description: "Criar alerta manual",
        auth_required: true
      },
      {
        path: "/{id}",
        method: "GET",
        description: "Obter detalhes de um alerta específico",
        auth_required: true
      },
      {
        path: "/{id}/acknowledge",
        method: "POST",
        description: "Marcar alerta como reconhecido",
        auth_required: true
      },
      {
        path: "/{id}/resolve",
        method: "POST",
        description: "Resolver/fechar alerta",
        auth_required: true
      },
      {
        path: "/rules",
        method: "GET",
        description: "Listar regras de alertas configuradas",
        auth_required: true
      },
      {
        path: "/rules",
        method: "POST",
        description: "Criar nova regra de alerta",
        auth_required: true
      },
      {
        path: "/rules/{id}",
        method: "PUT",
        description: "Atualizar regra de alerta",
        auth_required: true
      },
      {
        path: "/thresholds",
        method: "GET",
        description: "Obter thresholds configurados",
        auth_required: true
      },
      {
        path: "/thresholds",
        method: "PUT",
        description: "Atualizar thresholds",
        auth_required: true
      },
      {
        path: "/analytics",
        method: "GET",
        description: "Obter analytics de alertas",
        auth_required: true
      },
      {
        path: "/health",
        method: "GET",
        description: "Health check do sistema de alertas",
        auth_required: false
      }
    ]
  }
};

/**
 * Utilitário para obter configuração de um tipo de alerta específico
 */
export function getAlertTypeConfig(alertType: string): AlertTypeConfig | undefined {
  return BANBAN_ALERTS_MODULE_CONFIG.business_rules.alert_types.find(
    config => config.type === alertType
  );
}

/**
 * Utilitário para obter regra de escalação por prioridade
 */
export function getEscalationRule(priority: string): EscalationRule | undefined {
  return BANBAN_ALERTS_MODULE_CONFIG.business_rules.escalation_rules[priority];
}

/**
 * Utilitário para verificar se um feature está habilitado
 */
export function isFeatureEnabled(featureId: string): boolean {
  const feature = BANBAN_ALERTS_MODULE_CONFIG.features.find(f => f.id === featureId);
  return feature?.enabled ?? false;
}

/**
 * Configurações dinâmicas do processador
 */
export interface ProcessorConfig {
  batchSize: number;
  maxAlertsPerRun: number;
  processingInterval: number;
  enableDebugMode: boolean;
  enableMetrics: boolean;
}

export const PROCESSOR_CONFIG: ProcessorConfig = {
  batchSize: 100,
  maxAlertsPerRun: 1000,
  processingInterval: 600000, // 10 minutos
  enableDebugMode: process.env.NODE_ENV === 'development',
  enableMetrics: true
};

export default BANBAN_ALERTS_MODULE_CONFIG;