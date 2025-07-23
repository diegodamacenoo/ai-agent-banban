# 🚀 Guia de Desenvolvimento de Módulos - Axon System

**Versão:** 2.0.0  
**Data:** 02/01/2025  
**Última Atualização:** Baseada na arquitetura genérica multi-tenant atual

## 📖 Visão Geral

Este guia fornece instruções detalhadas para desenvolver módulos de alta qualidade no sistema Axon, seguindo a arquitetura genérica multi-tenant implementada e as melhores práticas identificadas no projeto.

### 🎯 Objetivos deste Guia

- ✅ Padronizar o desenvolvimento de módulos
- ✅ Garantir qualidade e segurança dos módulos
- ✅ Facilitar manutenção e escalabilidade
- ✅ Integrar com sistema de lifecycle e health monitoring
- ✅ Implementar isolamento multi-tenant robusto

---

## 🏗️ Sistema de Módulos - Arquitetura 3 Camadas

### 📋 Base Modules (Catálogo)
- **Localização DB**: `base_modules` table
- **Função**: Definições conceituais reutilizáveis
- **Exemplos**: performance, analytics, banban-insights
- **Características**: Slug único, metadados, schema de configuração

```sql
-- Módulo base no catálogo
INSERT INTO base_modules (slug, name, category, supports_multi_tenant) 
VALUES ('performance', 'Performance Analytics', 'analytics', true);
```

### 🔧 Module Implementations (Implementações)
- **Localização DB**: `module_implementations` table  
- **Localização Código**: `src/core/modules/{client}/` ou `backend/src/modules/custom/`
- **Função**: Implementações específicas de módulos base
- **Características**: `component_path`, audience targeting, dependencies

```sql
-- Implementação específica para Banban
INSERT INTO module_implementations (
  base_module_id, implementation_key, component_path, audience
) VALUES (
  'base-module-id', 'banban-custom', 
  '/widgets/banban-performance-widget.tsx', 'banban'
);
```

### 🎯 Tenant Module Assignments (Atribuições)
- **Localização DB**: `tenant_module_assignments` table
- **Função**: Associa módulos a organizações específicas
- **Características**: `is_active`, `is_visible`, `custom_config`, `permissions_override`

```sql
-- Atribuição para organização
INSERT INTO tenant_module_assignments (
  tenant_id, base_module_id, implementation_id, 
  is_active, is_visible, custom_config
) VALUES (
  'org-id', 'base-module-id', 'impl-id',
  true, true, '{"fashionMetrics": true}'
);
```

---

## 🛠️ Setup Inicial

### 1. Preparação do Ambiente

```bash
# Clonar templates do sistema atual
cd context/04-development/templates/

# Para módulo base/genérico
cp -r standard-module/ ../../../src/core/modules/template/meu-modulo/

# Para módulo cliente-específico (Banban)
cp -r custom-module/ ../../../src/core/modules/banban/meu-modulo/

# Backend modular (se necessário)
cp -r backend-module/ ../../../backend/src/modules/custom/meu-modulo/

# Navegar para o módulo
cd ../../../src/core/modules/banban/meu-modulo/
```

### 🚀 ModuleDiscoveryService - SISTEMA ATUAL

```typescript
// ✅ IMPLEMENTADO: Descoberta automática de módulos
class ModuleDiscoveryService {
  // Scan de módulos disponíveis em /src/core/modules/
  async scanAvailableModules(): Promise<DiscoveredModule[]>
  
  // Validação inteligente (vs pastas de apoio)
  async validateModuleIntegrity(moduleSlug: string): Promise<ValidationResult>
  
  // Detecção de módulos órfãos v2.0.0
  async detectOrphanedModules(): Promise<OrphanedModule[]>
  
  // Health monitoring e relatórios de integridade
  async generateHealthReport(): Promise<ModuleHealthReport>
  
  // Debug condicional controlável via UI
  async enableDebugMode(moduleSlug: string, enabled: boolean): Promise<void>
}
```

### 🔍 ModuleFileMonitor - LIFECYCLE AVANÇADO

```typescript
// ✅ IMPLEMENTADO: Monitoramento de arquivos e mudanças
class ModuleFileMonitor {
  // Monitora mudanças em arquivos de módulos
  watchModuleFiles(moduleSlug: string): void
  
  // Auditoria completa via module_file_audit table
  async recordFileChange(filePath: string, changeType: string): Promise<void>
  
  // Invalidação automática de cache
  async invalidateModuleCache(moduleSlug: string): Promise<void>
}
```

### 2. Configuração Inicial

```bash
# Instalar dependências
npm install @supabase/supabase-js zod date-fns lodash

# Dependências de desenvolvimento
npm install -D @types/node typescript jest @typescript-eslint/eslint-plugin

# Configurar TypeScript
touch tsconfig.json
```

### 3. Estrutura de Arquivos - PADRÃO ATUAL

```
meu-modulo/
├── module.json                 # 📄 Manifesto (OBRIGATÓRIO)
├── README.md                   # 📚 Documentação (OBRIGATÓRIO)
├── types/
│   ├── index.ts               # Tipos principais + Zod schemas
│   ├── interfaces.ts          # Interfaces de negócio
│   └── api.ts                 # Tipos de API/responses
├── services/
│   ├── index.ts              # Export principal
│   ├── MeuModuloService.ts   # Serviço principal
│   ├── validators.ts         # Validações Zod
│   └── cache.ts              # Gerenciamento de cache
├── handlers/
│   ├── index.ts              # Server Actions (não API handlers)
│   ├── server-actions.ts     # Server Actions do Next.js
│   └── webhook-handlers.ts   # Webhooks (se aplicável)
├── components/                 # Componentes React (OBRIGATÓRIO)
│   ├── index.ts             
│   ├── MeuModuloWidget.tsx   # Widget dashboard
│   ├── MeuModuloConfig.tsx   # Painel configuração
│   └── MeuModuloPage.tsx     # Página principal
├── utils/
│   ├── index.ts
│   ├── helpers.ts
│   └── constants.ts
├── tests/                      # Testes (OBRIGATÓRIO - coverage ≥ 70%)
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── migrations/                 # Migrações SQL (se usar BD)
│   └── 20250102000000_initial.sql
├── docs/
│   ├── API.md
│   ├── SETUP.md
│   └── EXAMPLES.md
└── .env.example               # Variáveis de ambiente
```

### 📁 Estrutura Backend Modular (Fastify) - SE NECESSÁRIO

```
backend/src/modules/custom/meu-modulo/
├── index.ts                   # Export principal
├── schemas/
│   └── meu-modulo-schemas.ts  # Schemas Fastify
├── services/
│   └── meu-modulo-service.ts  # Lógica de negócio
├── types/
│   └── meu-modulo-types.ts    # Tipos específicos
└── tests/
    └── meu-modulo.test.ts     # Testes do backend
```

---

## 📝 Manifesto do Módulo (module.json)

### Template Completo - Standard

```json
{
  "name": "Analytics Avançado",
  "slug": "advanced-analytics",
  "version": "1.0.0",
  "description": "Módulo de análise avançada com IA e machine learning",
  "category": "analytics",
  "maturity_status": "GA",
  "pricing_tier": "free",
  "author": "Axon Team",
  "vendor": "Axon Systems",
  "entrypoint": "src/index.ts",
  "dependencies": {
    "required": ["@supabase/supabase-js", "zod"],
    "optional": ["date-fns", "lodash", "recharts"]
  },
  "compatibility_matrix": {
    "min_axon_version": "1.0.0",
    "max_axon_version": "2.0.0",
    "supported_client_types": ["banban", "default", "standard"],
    "supported_features": ["multi-tenant", "rls", "audit-logging", "real-time", "analytics"]
  },
  "usage_based_pricing": {
    "enabled": false
  },
  "server_actions": [
    {
      "name": "getAdvancedAnalyticsData",
      "description": "Get module data via Server Action",
      "file": "handlers/server-actions.ts",
      "authenticated": true,
      "permissions": ["advanced-analytics.read"]
    },
    {
      "name": "updateAdvancedAnalyticsConfig",
      "description": "Update module configuration",
      "file": "handlers/server-actions.ts",
      "authenticated": true,
      "permissions": ["advanced-analytics.write"]
    }
  ],
  "backend_endpoints": [
    {
      "path": "/health",
      "method": "GET",
      "description": "Health check endpoint",
      "authenticated": false,
      "handler": "healthCheck"
    }
  ],
  "database_tables": [
    "advanced_analytics_data",
    "advanced_analytics_config", 
    "advanced_analytics_metrics"
  ],
  "permissions": {
    "read": ["advanced-analytics.read"],
    "write": ["advanced-analytics.write"],
    "admin": ["advanced-analytics.admin"],
    "configure": ["advanced-analytics.configure"]
  },
  "rls_policies": [
    {
      "table": "advanced_analytics_data",
      "policy": "organization_isolation",
      "description": "Users can only access their organization data"
    }
  ],
  "integrations": {
    "supabase": {
      "enabled": true,
      "required_extensions": ["uuid-ossp"]
    },
    "webhooks": {
      "enabled": false,
      "events": []
    },
    "realtime": {
      "enabled": true,
      "channels": ["advanced-analytics-updates"]
    }
  },
  "ui_components": {
    "dashboard_widget": {
      "component_path": "components/AdvancedAnalyticsWidget",
      "default_size": "medium",
      "resizable": true,
      "discovered_by_module_scanner": true
    },
    "config_panel": {
      "component_path": "components/AdvancedAnalyticsConfig",
      "sections": ["general", "advanced", "permissions"]
    },
    "main_page": {
      "component_path": "components/AdvancedAnalyticsPage",
      "route": "/modules/advanced-analytics",
      "requires_navigation_entry": true
    }
  },
  "module_lifecycle": {
    "health_monitoring": true,
    "file_watching": true,
    "audit_logging": true,
    "cache_invalidation": true,
    "debug_mode": false
  },
  "navigation": {
    "primary": {
      "title": "Analytics Avançado",
      "icon": "BarChart3",
      "path": "/modules/advanced-analytics",
      "order": 100
    },
    "submenu": []
  }
}
```

---

## 🎨 Implementação de Tipos TypeScript

### types/index.ts

```typescript
import { z } from 'zod';

/**
 * Interface principal dos dados do módulo
 */
export interface AdvancedAnalyticsData {
  id: string;
  organizationId: string;
  name: string;
  status: AdvancedAnalyticsStatus;
  properties: Record<string, unknown>;
  metrics?: AdvancedAnalyticsMetrics;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status possíveis do módulo
 */
export type AdvancedAnalyticsStatus = 'active' | 'inactive' | 'processing' | 'error';

/**
 * Configuração específica do módulo
 */
export interface AdvancedAnalyticsConfig {
  enabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  cacheTtl: number;
  maxBatchSize: number;
  retryAttempts: number;
  autoRefresh: boolean;
  refreshInterval: number;
  customSettings?: Record<string, unknown>;
}

/**
 * Métricas do módulo
 */
export interface AdvancedAnalyticsMetrics {
  totalProcessed: number;
  successRate: number;
  averageProcessingTime: number;
  lastProcessedAt?: Date;
  errorCount: number;
  cacheHitRate?: number;
}

/**
 * Resposta padrão das operações do módulo
 */
export interface AdvancedAnalyticsResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  metadata?: {
    processingTime?: number;
    itemsProcessed?: number;
    organizationId?: string;
    [key: string]: unknown;
  };
}

/**
 * Contexto do módulo
 */
export interface AdvancedAnalyticsContext {
  organizationId: string;
  userId?: string;
  config?: Partial<AdvancedAnalyticsConfig>;
  logger?: any;
  supabase?: any;
}

// Schemas de validação Zod
export const AdvancedAnalyticsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  logLevel: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  cacheTtl: z.number().min(60).max(86400).default(3600),
  maxBatchSize: z.number().min(1).max(1000).default(100),
  retryAttempts: z.number().min(0).max(10).default(3),
  autoRefresh: z.boolean().default(true),
  refreshInterval: z.number().min(60000).max(3600000).default(300000),
  customSettings: z.record(z.unknown()).optional()
});

export const AdvancedAnalyticsDataSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  status: z.enum(['active', 'inactive', 'processing', 'error']),
  properties: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Tipos derivados dos schemas
export type AdvancedAnalyticsConfigInput = z.infer<typeof AdvancedAnalyticsConfigSchema>;
export type AdvancedAnalyticsDataInput = z.infer<typeof AdvancedAnalyticsDataSchema>;
```

---

## ⚙️ Serviços e Lógica de Negócio

### services/AdvancedAnalyticsService.ts

```typescript
import { createSupabaseServerClient } from '@/core/supabase/server';
import { 
  AdvancedAnalyticsData, 
  AdvancedAnalyticsConfig, 
  AdvancedAnalyticsResponse, 
  AdvancedAnalyticsContext,
  AdvancedAnalyticsConfigSchema,
  AdvancedAnalyticsMetrics
} from '../types';

/**
 * Serviço principal do módulo Advanced Analytics
 * Responsável por toda a lógica de negócio e operações do módulo
 */
export class AdvancedAnalyticsService {
  private supabase: any;
  private config: AdvancedAnalyticsConfig;
  private context: AdvancedAnalyticsContext;
  private logger: any;
  private tableName = 'advanced_analytics_data';
  private configTableName = 'advanced_analytics_config';
  private metricsTableName = 'advanced_analytics_metrics';
  
  constructor(context: AdvancedAnalyticsContext) {
    this.context = context;
    this.supabase = context.supabase || createSupabaseServerClient();
    this.config = this.validateConfig(context.config || {});
    this.logger = context.logger || this.createLogger();
  }
  
  /**
   * Inicializar o módulo
   */
  async initialize(): Promise<AdvancedAnalyticsResponse<boolean>> {
    const startTime = Date.now();
    
    try {
      this.logger.info('🚀 Inicializando módulo Advanced Analytics...', {
        module: 'advanced-analytics',
        organizationId: this.context.organizationId
      });
      
      // Verificar dependências
      await this.checkDependencies();
      
      // Configurar recursos necessários
      await this.setupResources();
      
      // Validar configuração
      await this.validateConfiguration();
      
      // Verificar permissões
      await this.checkPermissions();
      
      const processingTime = Date.now() - startTime;
      
      this.logger.info('✅ Módulo Advanced Analytics inicializado com sucesso', {
        module: 'advanced-analytics',
        organizationId: this.context.organizationId,
        processingTime
      });
      
      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString(),
        metadata: {
          processingTime,
          organizationId: this.context.organizationId
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('❌ Erro ao inicializar módulo Advanced Analytics:', {
        module: 'advanced-analytics',
        organizationId: this.context.organizationId,
        error: (error as Error).message,
        processingTime
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
        metadata: {
          processingTime,
          organizationId: this.context.organizationId
        }
      };
    }
  }
  
  /**
   * Verificar saúde do módulo
   */
  async healthCheck(): Promise<AdvancedAnalyticsResponse<{ status: string; details: Record<string, unknown> }>> {
    try {
      const health = {
        status: 'healthy' as const,
        details: {
          moduleEnabled: this.config.enabled,
          organizationId: this.context.organizationId,
          databaseConnection: true,
          configValid: true,
          lastCheck: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      
      // Verificar conexão com banco
      const { error } = await this.supabase
        .from(this.tableName)
        .select('count(*)')
        .limit(1);
      
      if (error) {
        health.status = 'unhealthy';
        health.details.databaseConnection = false;
        health.details.error = error.message;
      }
      
      // Verificar configuração
      if (!this.config.enabled) {
        health.status = 'disabled';
        health.details.moduleEnabled = false;
      }
      
      return {
        success: true,
        data: health,
        timestamp: new Date().toISOString(),
        metadata: {
          organizationId: this.context.organizationId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no health check',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Métodos privados auxiliares
  
  private validateConfig(config: any): AdvancedAnalyticsConfig {
    try {
      return AdvancedAnalyticsConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Configuração inválida: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }
  
  private createLogger() {
    return {
      info: (msg: string, meta?: any) => console.log(`[INFO] [advanced-analytics] ${msg}`, meta || ''),
      error: (msg: string, meta?: any) => console.error(`[ERROR] [advanced-analytics] ${msg}`, meta || ''),
      debug: (msg: string, meta?: any) => this.config.logLevel === 'debug' && console.debug(`[DEBUG] [advanced-analytics] ${msg}`, meta || ''),
      warn: (msg: string, meta?: any) => console.warn(`[WARN] [advanced-analytics] ${msg}`, meta || '')
    };
  }
  
  private async checkDependencies(): Promise<void> {
    // Verificar se a organização existe
    const { error } = await this.supabase
      .from('organizations')
      .select('id')
      .eq('id', this.context.organizationId)
      .single();
    
    if (error) {
      throw new Error(`Organização não encontrada: ${error.message}`);
    }
  }
  
  private async setupResources(): Promise<void> {
    // Implementar configuração de recursos específicos do módulo
  }
  
  private async validateConfiguration(): Promise<void> {
    // Validar se todas as configurações estão corretas
  }
  
  private async checkPermissions(): Promise<void> {
    // Verificar se o usuário tem permissões necessárias
  }
}

export default AdvancedAnalyticsService;
```

---

## 🧪 Testes (Obrigatório - Coverage ≥ 70%)

### tests/unit/AdvancedAnalyticsService.test.ts

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import AdvancedAnalyticsService from '../../services/AdvancedAnalyticsService';
import { AdvancedAnalyticsContext } from '../../types';

describe('AdvancedAnalyticsService', () => {
  let service: AdvancedAnalyticsService;
  let mockContext: AdvancedAnalyticsContext;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      limit: jest.fn().mockReturnThis()
    };

    mockContext = {
      organizationId: 'test-org-id',
      userId: 'test-user-id',
      supabase: mockSupabase,
      config: {
        enabled: true,
        logLevel: 'info',
        cacheTtl: 3600,
        maxBatchSize: 100,
        retryAttempts: 3,
        autoRefresh: true,
        refreshInterval: 300000
      }
    };

    service = new AdvancedAnalyticsService(mockContext);
  });

  describe('initialize', () => {
    it('deve inicializar com sucesso quando todas as dependências estão disponíveis', async () => {
      const result = await service.initialize();

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.metadata?.organizationId).toBe('test-org-id');
    });

    it('deve falhar quando a organização não existe', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Organization not found' }
      });

      const result = await service.initialize();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Organização não encontrada');
    });
  });

  describe('healthCheck', () => {
    it('deve retornar status healthy quando tudo está funcionando', async () => {
      const result = await service.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('healthy');
      expect(result.data?.details.moduleEnabled).toBe(true);
    });

    it('deve retornar status disabled quando módulo está desabilitado', async () => {
      const disabledContext = {
        ...mockContext,
        config: { ...mockContext.config, enabled: false }
      };
      
      const disabledService = new AdvancedAnalyticsService(disabledContext);
      const result = await disabledService.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('disabled');
      expect(result.data?.details.moduleEnabled).toBe(false);
    });

    it('deve retornar status unhealthy quando há erro no banco', async () => {
      mockSupabase.select.mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      });

      const result = await service.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('unhealthy');
      expect(result.data?.details.databaseConnection).toBe(false);
    });
  });
});
```

---

## 🎨 Componentes React

### components/AdvancedAnalyticsWidget.tsx

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Loader2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { AdvancedAnalyticsData, AdvancedAnalyticsMetrics } from '../types';

interface AdvancedAnalyticsWidgetProps {
  organizationId: string;
  config?: any;
  onError?: (error: string) => void;
}

export function AdvancedAnalyticsWidget({
  organizationId,
  config = {},
  onError
}: AdvancedAnalyticsWidgetProps) {
  const [data, setData] = useState<AdvancedAnalyticsData[]>([]);
  const [metrics, setMetrics] = useState<AdvancedAnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, config.refreshInterval || 300000);
    return () => clearInterval(interval);
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ USAR SERVER ACTIONS (não fetch API)
      const { getAdvancedAnalyticsData, getAdvancedAnalyticsMetrics } = await import('../handlers/server-actions');
      
      const dataResult = await getAdvancedAnalyticsData(organizationId);
      if (!dataResult.success) {
        throw new Error(dataResult.error || 'Erro ao carregar dados');
      }
      setData(dataResult.data || []);

      // Carregar métricas via Server Action
      const metricsResult = await getAdvancedAnalyticsMetrics(organizationId);

      if (metricsResult.success) {
        setMetrics(metricsResult.data);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analytics Avançado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando dados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Analytics Avançado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" onClick={handleRefresh}>
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analytics Avançado
          </div>
          <Badge variant={data.length > 0 ? "default" : "secondary"}>
            {data.length} análises
          </Badge>
        </CardTitle>
        <CardDescription>
          Análise avançada com IA e machine learning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Métricas principais */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.totalProcessed}
                </div>
                <div className="text-sm text-gray-600">Total Processado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.successRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Taxa de Sucesso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.averageProcessingTime}ms
                </div>
                <div className="text-sm text-gray-600">Tempo Médio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.errorCount}
                </div>
                <div className="text-sm text-gray-600">Erros</div>
              </div>
            </div>
          )}

          {/* Lista de dados recentes */}
          <div className="space-y-2">
            <h4 className="font-medium">Análises Recentes</h4>
            {data.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma análise disponível</p>
            ) : (
              <div className="space-y-2">
                {data.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge 
                      variant={item.status === 'active' ? 'default' : 'secondary'}
                    >
                      {item.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Atualizar
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/modules/advanced-analytics">
                Ver Detalhes
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdvancedAnalyticsWidget;
```

---

## 🗃️ Migrações SQL

### migrations/20250102000000_initial_advanced_analytics.sql

```sql
-- Migração inicial para o módulo Advanced Analytics
-- Data: 2025-01-02
-- Módulo: advanced-analytics

-- Criar tabela principal de dados
CREATE TABLE IF NOT EXISTS advanced_analytics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'processing', 'error')),
  properties JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT advanced_analytics_data_org_name_unique UNIQUE (organization_id, name)
);

-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS advanced_analytics_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Uma configuração por organização
  CONSTRAINT advanced_analytics_config_org_unique UNIQUE (organization_id)
);

-- Criar tabela de métricas
CREATE TABLE IF NOT EXISTS advanced_analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_advanced_analytics_data_org_id ON advanced_analytics_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_advanced_analytics_data_status ON advanced_analytics_data(status);
CREATE INDEX IF NOT EXISTS idx_advanced_analytics_data_created_at ON advanced_analytics_data(created_at);

CREATE INDEX IF NOT EXISTS idx_advanced_analytics_config_org_id ON advanced_analytics_config(organization_id);

CREATE INDEX IF NOT EXISTS idx_advanced_analytics_metrics_org_id ON advanced_analytics_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_advanced_analytics_metrics_created_at ON advanced_analytics_metrics(created_at);

-- Políticas RLS (Row Level Security)
ALTER TABLE advanced_analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_analytics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_analytics_metrics ENABLE ROW LEVEL SECURITY;

-- Política de isolamento por organização para dados
CREATE POLICY "advanced_analytics_data_organization_isolation" ON advanced_analytics_data
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

-- Política de isolamento por organização para configurações
CREATE POLICY "advanced_analytics_config_organization_isolation" ON advanced_analytics_config
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

-- Política de isolamento por organização para métricas
CREATE POLICY "advanced_analytics_metrics_organization_isolation" ON advanced_analytics_metrics
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_advanced_analytics_data_updated_at 
  BEFORE UPDATE ON advanced_analytics_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advanced_analytics_config_updated_at 
  BEFORE UPDATE ON advanced_analytics_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advanced_analytics_metrics_updated_at 
  BEFORE UPDATE ON advanced_analytics_metrics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE advanced_analytics_data IS 'Dados principais do módulo Advanced Analytics';
COMMENT ON TABLE advanced_analytics_config IS 'Configurações por organização do módulo Advanced Analytics';
COMMENT ON TABLE advanced_analytics_metrics IS 'Métricas de uso e performance do módulo Advanced Analytics';

COMMENT ON COLUMN advanced_analytics_data.properties IS 'Dados específicos do módulo em formato JSONB';
COMMENT ON COLUMN advanced_analytics_config.config IS 'Configurações específicas em formato JSONB';
COMMENT ON COLUMN advanced_analytics_metrics.metrics IS 'Métricas coletadas em formato JSONB';

-- Log da migração
INSERT INTO migrations_log (name, applied_at, description) 
VALUES (
  '20250102000000_initial_advanced_analytics',
  NOW(),
  'Migração inicial para o módulo Advanced Analytics - tabelas de dados, configurações e métricas com RLS'
) ON CONFLICT (name) DO NOTHING;
```

---

## 📋 Checklist de Desenvolvimento Completo

### **📄 Planejamento e Documentação**
- [ ] Especificação técnica aprovada
- [ ] Escopo e funcionalidades definidas
- [ ] Tipo de módulo escolhido (Standard/Custom)
- [ ] Dependências e integrações mapeadas
- [ ] Permissões e políticas RLS definidas

### **🏗️ Implementação Base**
- [ ] Estrutura de arquivos criada conforme template
- [ ] `module.json` configurado completamente
- [ ] `README.md` documentado com exemplos
- [ ] Tipos TypeScript definidos em `types/index.ts`
- [ ] Schemas Zod implementados para validação
- [ ] Serviço principal implementado
- [ ] Handlers de API criados

### **🎨 Interface e UX**
- [ ] Widget para dashboard implementado
- [ ] Painel de configuração criado
- [ ] Página principal do módulo (se aplicável)
- [ ] Componentes responsivos e acessíveis
- [ ] Design system seguido (Shadcn/ui)

### **🗃️ Banco de Dados**
- [ ] Migrações SQL criadas e testadas
- [ ] Políticas RLS implementadas
- [ ] Índices de performance configurados
- [ ] Triggers para updated_at
- [ ] Comentários de documentação

### **🔒 Segurança**
- [ ] Validação de entrada com Zod
- [ ] Sanitização de logs sensíveis
- [ ] Autenticação e autorização implementadas
- [ ] Isolamento multi-tenant verificado
- [ ] Rate limiting configurado (se aplicável)

### **🧪 Testes e Qualidade**
- [ ] Testes unitários (coverage ≥ 70%)
- [ ] Testes de integração com Supabase
- [ ] Testes de componentes React
- [ ] Testes de API endpoints
- [ ] Performance testada com dados reais
- [ ] Lint e formatação configurados

### **📈 Monitoramento**
- [ ] Health check endpoint implementado
- [ ] Logs estruturados configurados
- [ ] Métricas de uso coletadas
- [ ] Error tracking configurado
- [ ] Alertas configurados (se aplicável)

### **🚀 Deploy e Produção**
- [ ] Variáveis de ambiente documentadas
- [ ] CI/CD pipeline validado
- [ ] Deploy em staging testado
- [ ] Rollback strategy definida
- [ ] Monitoramento em produção validado
- [ ] Documentação de troubleshooting

---

## 🔧 Troubleshooting Comum

### 1. Problemas de Conexão Supabase
```typescript
// Verificar se cliente está configurado corretamente
const { error } = await supabase.from('test').select('*').limit(1);
if (error) {
  console.error('Erro de conexão:', error.message);
}
```

### 2. Validação Zod Falhando
```typescript
try {
  const validated = MySchema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Erro de validação:', error.errors);
  }
}
```

### 3. RLS Bloqueando Queries
```sql
-- Verificar se usuário tem organização
SELECT auth.uid(), 
       p.organization_id 
FROM profiles p 
WHERE p.id = auth.uid();

-- Testar política RLS
EXPLAIN ANALYZE 
SELECT * FROM minha_tabela 
WHERE organization_id = 'org-id';
```

### 4. Health Check Falhando
```typescript
// Verificar dependências básicas
const healthDetails = {
  database: await this.testDatabaseConnection(),
  config: this.validateCurrentConfig(),
  permissions: await this.checkUserPermissions(),
  integrations: await this.testExternalAPIs()
};
```

---

## ## 🔄 Sistema de Lifecycle - ESTADO ATUAL

### ✅ ModuleDiscoveryService Implementado

```typescript
// Principais funcionalidades disponíveis
const discovery = new ModuleDiscoveryService();

// 1. Descoberta automática
const modules = await discovery.scanAvailableModules();
console.log('Módulos encontrados:', modules.length);

// 2. Validação de integridade
const validation = await discovery.validateModuleIntegrity('meu-modulo');
if (!validation.isValid) {
  console.error('Problemas encontrados:', validation.issues);
}

// 3. Detecção de órfãos
const orphans = await discovery.detectOrphanedModules();
if (orphans.length > 0) {
  console.warn('Módulos órfãos detectados:', orphans);
}

// 4. Relatório de saúde
const health = await discovery.generateHealthReport();
console.log('Score de saúde:', health.healthScore);
```

### 🔍 Sistema de Auditoria Ativo

```sql
-- ✅ Tabela de auditoria implementada
module_file_audit {
  id UUID PRIMARY KEY,
  module_slug VARCHAR(255),
  file_path VARCHAR(500),
  change_type VARCHAR(50), -- created, modified, deleted, moved
  old_content_hash VARCHAR(64),
  new_content_hash VARCHAR(64),
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW()
}
```

### 📚 Recursos Adicionais

- [Templates de Módulos](./templates/) - Templates atualizados para nova arquitetura
- [Arquitetura do Sistema](../02-architecture/) - Documentação da arquitetura 3-camadas
- [Schema Reference](../06-database/schema-reference.md) - Schema completo atualizado
- [Module Lifecycle](../05-operations/module-lifecycle-system.md) - Sistema de lifecycle completo
- [Server Actions Guide](../08-server-actions/) - Padrões de Server Actions
- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de TypeScript](https://www.typescriptlang.org/docs/)
- [Documentação do Zod](https://zod.dev/)
- [Guia de Testes com Jest](https://jestjs.io/docs/getting-started)

---

**Este guia fornece uma base completa para desenvolver módulos profissionais e robustos no sistema Axon, seguindo todas as melhores práticas identificadas na arquitetura atual e garantindo qualidade, segurança e escalabilidade.** 