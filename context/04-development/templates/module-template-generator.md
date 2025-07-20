# 🏗️ Template Generator para Módulos - Axon System

**Versão:** 2.0.0  
**Data:** 02/01/2025  
**Uso:** Template para criação rápida de módulos

## 🎯 **Como Usar Este Template**

### **Passo 1: Definir Variáveis**
Antes de usar os templates, defina estas variáveis:

```bash
# Variáveis do módulo
MODULE_NAME="Analytics Avançado"           # Nome amigável do módulo
MODULE_SLUG="advanced-analytics"           # Identificador único (kebab-case)
MODULE_CLASS="AdvancedAnalytics"           # Nome da classe (PascalCase)
MODULE_TYPE="standard"                     # Tipo: "standard" ou cliente específico (ex: "banban")
MODULE_DESCRIPTION="Módulo de análise avançada com IA e machine learning"
MODULE_AUTHOR="Axon Team"
MODULE_CATEGORY="analytics"                # analytics, operations, insights, reports, settings, admin
CLIENT_NAME="BanBan Team"                  # Para módulos custom
CLIENT_ORGANIZATION="BanBan Fashion"       # Para módulos custom
CLIENT_SLUG="banban"                       # Para módulos custom
CLIENT_DOMAIN="banban.com.br"              # Para módulos custom
```

### **Passo 2: Criar Estrutura**
```bash
# Para módulos padrão
mkdir -p src/core/modules/standard/${MODULE_SLUG}

# Para módulos customizados
mkdir -p src/core/modules/${CLIENT_SLUG}/${MODULE_SLUG}

# Criar subdiretórios
mkdir -p ${MODULE_PATH}/{types,services,handlers,utils,tests,docs,migrations,components}

# Navegar para o módulo
cd ${MODULE_PATH}
```

---

## 📁 **Templates de Arquivos Atualizados**

### **module.json** (Manifesto Principal)
```json
{
  "name": "${MODULE_NAME}",
  "slug": "${MODULE_SLUG}",
  "version": "1.0.0",
  "description": "${MODULE_DESCRIPTION}",
  "category": "${MODULE_CATEGORY}",
  "maturity_status": "GA",
  "pricing_tier": "${MODULE_TYPE === 'standard' ? 'free' : 'premium'}",
  "author": "${MODULE_AUTHOR}",
  "vendor": "${MODULE_TYPE === 'standard' ? 'Axon Systems' : CLIENT_ORGANIZATION}",
  "entrypoint": "src/index.ts",
  "dependencies": {
    "required": [
      "@supabase/supabase-js",
      "zod"
    ],
    "optional": [
      "date-fns",
      "lodash",
      "recharts"
    ]
  },
  "compatibility_matrix": {
    "min_axon_version": "1.0.0",
    "max_axon_version": "2.0.0",
    "supported_client_types": [
      "${MODULE_TYPE === 'standard' ? 'banban,default,standard' : CLIENT_SLUG}"
    ],
    "supported_features": [
      "multi-tenant",
      "rls",
      "audit-logging",
      "real-time",
      "analytics"
    ]
  },
  "usage_based_pricing": {
    "enabled": ${MODULE_TYPE !== 'standard'},
    "per_call": 0.001,
    "per_token": 0.0001,
    "per_gb": 0.10
  },
  "api_endpoints": [
    {
      "path": "/api/modules/${MODULE_SLUG}/health",
      "method": "GET",
      "description": "Health check endpoint",
      "authenticated": false,
      "handler": "healthCheck"
    },
    {
      "path": "/api/modules/${MODULE_SLUG}/data",
      "method": "GET",
      "description": "Get module data",
      "authenticated": true,
      "handler": "getData",
      "permissions": ["${MODULE_SLUG}.read"]
    },
    {
      "path": "/api/modules/${MODULE_SLUG}/data",
      "method": "POST",
      "description": "Process module data",
      "authenticated": true,
      "handler": "processData",
      "permissions": ["${MODULE_SLUG}.write"]
    },
    {
      "path": "/api/modules/${MODULE_SLUG}/config",
      "method": "GET",
      "description": "Get module configuration",
      "authenticated": true,
      "handler": "getConfig",
      "permissions": ["${MODULE_SLUG}.configure"]
    },
    {
      "path": "/api/modules/${MODULE_SLUG}/config",
      "method": "PUT",
      "description": "Update module configuration",
      "authenticated": true,
      "handler": "updateConfig",
      "permissions": ["${MODULE_SLUG}.admin"]
    }
  ],
  "database_tables": [
    "${MODULE_TYPE === 'standard' ? MODULE_SLUG : CLIENT_SLUG + '_' + MODULE_SLUG}_data",
    "${MODULE_TYPE === 'standard' ? MODULE_SLUG : CLIENT_SLUG + '_' + MODULE_SLUG}_config",
    "${MODULE_TYPE === 'standard' ? MODULE_SLUG : CLIENT_SLUG + '_' + MODULE_SLUG}_metrics"
  ],
  "permissions": {
    "read": ["${MODULE_SLUG}.read"],
    "write": ["${MODULE_SLUG}.write"],
    "admin": ["${MODULE_SLUG}.admin"],
    "configure": ["${MODULE_SLUG}.configure"]
  },
  "rls_policies": [
    {
      "table": "${MODULE_TYPE === 'standard' ? MODULE_SLUG : CLIENT_SLUG + '_' + MODULE_SLUG}_data",
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
      "channels": ["${MODULE_SLUG}-updates"]
    }
  },
  "ui_components": {
    "dashboard_widget": {
      "component_path": "components/${MODULE_CLASS}Widget",
      "default_size": "medium",
      "resizable": true
    },
    "config_panel": {
      "component_path": "components/${MODULE_CLASS}Config",
      "sections": ["general", "advanced", "permissions"]
    }
  },
  "navigation": {
    "primary": {
      "title": "${MODULE_NAME}",
      "icon": "BarChart3",
      "path": "/modules/${MODULE_SLUG}",
      "order": 100
    },
    "submenu": []
  }
}
```

### **types/index.ts** (Tipos TypeScript)
```typescript
import { z } from 'zod';

/**
 * Interface principal dos dados do módulo
 */
export interface ${MODULE_CLASS}Data {
  id: string;
  organizationId: string;
  name: string;
  status: ${MODULE_CLASS}Status;
  properties: Record<string, unknown>;
  metrics?: ${MODULE_CLASS}Metrics;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status possíveis do módulo
 */
export type ${MODULE_CLASS}Status = 'active' | 'inactive' | 'processing' | 'error';

/**
 * Configuração específica do módulo
 */
export interface ${MODULE_CLASS}Config {
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
export interface ${MODULE_CLASS}Metrics {
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
export interface ${MODULE_CLASS}Response<T = unknown> {
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
 * Parâmetros de entrada para processamento
 */
export interface ${MODULE_CLASS}Input {
  organizationId: string;
  data: Record<string, unknown>;
  options?: {
    batchSize?: number;
    priority?: 'low' | 'normal' | 'high';
    async?: boolean;
    validateOnly?: boolean;
  };
}

/**
 * Contexto do módulo
 */
export interface ${MODULE_CLASS}Context {
  organizationId: string;
  userId?: string;
  config?: Partial<${MODULE_CLASS}Config>;
  logger?: any;
  supabase?: any;
}

// Schemas de validação Zod
export const ${MODULE_CLASS}ConfigSchema = z.object({
  enabled: z.boolean().default(true),
  logLevel: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  cacheTtl: z.number().min(60).max(86400).default(3600),
  maxBatchSize: z.number().min(1).max(1000).default(100),
  retryAttempts: z.number().min(0).max(10).default(3),
  autoRefresh: z.boolean().default(true),
  refreshInterval: z.number().min(60000).max(3600000).default(300000),
  customSettings: z.record(z.unknown()).optional()
});

export const ${MODULE_CLASS}DataSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  status: z.enum(['active', 'inactive', 'processing', 'error']),
  properties: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ${MODULE_CLASS}InputSchema = z.object({
  organizationId: z.string().uuid(),
  data: z.record(z.unknown()),
  options: z.object({
    batchSize: z.number().min(1).max(1000).optional(),
    priority: z.enum(['low', 'normal', 'high']).optional(),
    async: z.boolean().optional(),
    validateOnly: z.boolean().optional()
  }).optional()
});

// Tipos derivados dos schemas
export type ${MODULE_CLASS}ConfigInput = z.infer<typeof ${MODULE_CLASS}ConfigSchema>;
export type ${MODULE_CLASS}DataInput = z.infer<typeof ${MODULE_CLASS}DataSchema>;
export type ${MODULE_CLASS}ProcessInput = z.infer<typeof ${MODULE_CLASS}InputSchema>;
```

### **services/${MODULE_CLASS}Service.ts** (Serviço Principal)
```typescript
import { createSupabaseServerClient } from '@/core/supabase/server';
import { 
  ${MODULE_CLASS}Data, 
  ${MODULE_CLASS}Config, 
  ${MODULE_CLASS}Response, 
  ${MODULE_CLASS}Input,
  ${MODULE_CLASS}Context,
  ${MODULE_CLASS}ConfigSchema,
  ${MODULE_CLASS}InputSchema,
  ${MODULE_CLASS}Metrics
} from '../types';

/**
 * Serviço principal do módulo ${MODULE_CLASS}
 * Responsável por toda a lógica de negócio e operações do módulo
 */
export class ${MODULE_CLASS}Service {
  private supabase: any;
  private config: ${MODULE_CLASS}Config;
  private context: ${MODULE_CLASS}Context;
  private logger: any;
  private tableName = '${MODULE_TYPE === 'standard' ? MODULE_SLUG : CLIENT_SLUG + '_' + MODULE_SLUG}_data';
  private configTableName = '${MODULE_TYPE === 'standard' ? MODULE_SLUG : CLIENT_SLUG + '_' + MODULE_SLUG}_config';
  private metricsTableName = '${MODULE_TYPE === 'standard' ? MODULE_SLUG : CLIENT_SLUG + '_' + MODULE_SLUG}_metrics';
  
  constructor(context: ${MODULE_CLASS}Context) {
    this.context = context;
    this.supabase = context.supabase || createSupabaseServerClient();
    this.config = this.validateConfig(context.config || {});
    this.logger = context.logger || this.createLogger();
  }
  
  /**
   * Inicializar o módulo
   */
  async initialize(): Promise<${MODULE_CLASS}Response<boolean>> {
    const startTime = Date.now();
    
    try {
      this.logger.info('🚀 Inicializando módulo ${MODULE_NAME}...', {
        module: '${MODULE_SLUG}',
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
      
      this.logger.info('✅ Módulo ${MODULE_NAME} inicializado com sucesso', {
        module: '${MODULE_SLUG}',
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
      
      this.logger.error('❌ Erro ao inicializar módulo ${MODULE_NAME}:', {
        module: '${MODULE_SLUG}',
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
   * Processar dados do módulo
   */
  async processData(input: ${MODULE_CLASS}Input): Promise<${MODULE_CLASS}Response<${MODULE_CLASS}Data>> {
    const startTime = Date.now();
    
    try {
      // Validar entrada
      const validatedInput = ${MODULE_CLASS}InputSchema.parse(input);
      
      this.logger.info('📊 Processando dados...', {
        module: '${MODULE_SLUG}',
        organizationId: validatedInput.organizationId,
        dataSize: Object.keys(validatedInput.data).length
      });
      
      // Verificar se o módulo está habilitado
      if (!this.config.enabled) {
        throw new Error('Módulo está desabilitado');
      }
      
      // Processar dados em lotes se necessário
      const results = await this.processBatch(validatedInput);
      
      // Atualizar métricas
      await this.updateMetrics(validatedInput.organizationId, results);
      
      const processingTime = Date.now() - startTime;
      
      this.logger.info('✅ Dados processados com sucesso', {
        module: '${MODULE_SLUG}',
        organizationId: validatedInput.organizationId,
        processingTime
      });
      
      return {
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
        metadata: {
          processingTime,
          itemsProcessed: 1,
          organizationId: validatedInput.organizationId
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('❌ Erro ao processar dados:', {
        module: '${MODULE_SLUG}',
        organizationId: input.organizationId,
        error: (error as Error).message,
        processingTime
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no processamento',
        timestamp: new Date().toISOString(),
        metadata: {
          processingTime,
          organizationId: input.organizationId
        }
      };
    }
  }
  
  /**
   * Obter configuração atual do módulo
   */
  async getConfig(): Promise<${MODULE_CLASS}Response<${MODULE_CLASS}Config>> {
    try {
      const { data, error } = await this.supabase
        .from(this.configTableName)
        .select('*')
        .eq('organization_id', this.context.organizationId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      const config = data?.config || this.config;
      
      return {
        success: true,
        data: config,
        timestamp: new Date().toISOString(),
        metadata: {
          organizationId: this.context.organizationId
        }
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter configuração:', {
        module: '${MODULE_SLUG}',
        organizationId: this.context.organizationId,
        error: (error as Error).message
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter configuração',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Atualizar configuração do módulo
   */
  async updateConfig(newConfig: Partial<${MODULE_CLASS}Config>): Promise<${MODULE_CLASS}Response<${MODULE_CLASS}Config>> {
    try {
      const mergedConfig = {
        ...this.config,
        ...newConfig
      };
      
      // Validar nova configuração
      const validatedConfig = this.validateConfig(mergedConfig);
      
      const { data, error } = await this.supabase
        .from(this.configTableName)
        .upsert({
          organization_id: this.context.organizationId,
          config: validatedConfig,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Atualizar configuração local
      this.config = validatedConfig;
      
      this.logger.info('⚙️ Configuração atualizada', {
        module: '${MODULE_SLUG}',
        organizationId: this.context.organizationId
      });
      
      return {
        success: true,
        data: data.config,
        timestamp: new Date().toISOString(),
        metadata: {
          organizationId: this.context.organizationId
        }
      };
    } catch (error) {
      this.logger.error('❌ Erro ao atualizar configuração:', {
        module: '${MODULE_SLUG}',
        organizationId: this.context.organizationId,
        error: (error as Error).message
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar configuração',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Obter métricas do módulo
   */
  async getMetrics(): Promise<${MODULE_CLASS}Response<${MODULE_CLASS}Metrics>> {
    try {
      const { data, error } = await this.supabase
        .from(this.metricsTableName)
        .select('*')
        .eq('organization_id', this.context.organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      const metrics = data?.metrics || this.getDefaultMetrics();
      
      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
        metadata: {
          organizationId: this.context.organizationId
        }
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter métricas:', {
        module: '${MODULE_SLUG}',
        organizationId: this.context.organizationId,
        error: (error as Error).message
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter métricas',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Verificar saúde do módulo
   */
  async healthCheck(): Promise<${MODULE_CLASS}Response<{ status: string; details: Record<string, unknown> }>> {
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
  
  private validateConfig(config: any): ${MODULE_CLASS}Config {
    try {
      return ${MODULE_CLASS}ConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(\`Configuração inválida: \${error.errors.map(e => e.message).join(', ')}\`);
      }
      throw error;
    }
  }
  
  private createLogger() {
    return {
      info: (msg: string, meta?: any) => console.log(\`[INFO] [${MODULE_SLUG}] \${msg}\`, meta || ''),
      error: (msg: string, meta?: any) => console.error(\`[ERROR] [${MODULE_SLUG}] \${msg}\`, meta || ''),
      debug: (msg: string, meta?: any) => this.config.logLevel === 'debug' && console.debug(\`[DEBUG] [${MODULE_SLUG}] \${msg}\`, meta || ''),
      warn: (msg: string, meta?: any) => console.warn(\`[WARN] [${MODULE_SLUG}] \${msg}\`, meta || '')
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
      throw new Error(\`Organização não encontrada: \${error.message}\`);
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
  
  private async processBatch(input: ${MODULE_CLASS}Input): Promise<${MODULE_CLASS}Data> {
    // Implementar lógica específica do módulo
    const result: ${MODULE_CLASS}Data = {
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      name: '${MODULE_NAME} Data',
      status: 'active',
      properties: input.data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Salvar no banco
    const { error } = await this.supabase
      .from(this.tableName)
      .insert({
        id: result.id,
        organization_id: result.organizationId,
        name: result.name,
        status: result.status,
        properties: result.properties,
        created_at: result.createdAt.toISOString(),
        updated_at: result.updatedAt.toISOString()
      });
    
    if (error) {
      throw new Error(\`Erro ao salvar dados: \${error.message}\`);
    }
    
    return result;
  }
  
  private async updateMetrics(organizationId: string, results: ${MODULE_CLASS}Data): Promise<void> {
    // Atualizar métricas do módulo
    const metrics = {
      totalProcessed: 1,
      successRate: 100,
      averageProcessingTime: 100,
      lastProcessedAt: new Date(),
      errorCount: 0
    };
    
    await this.supabase
      .from(this.metricsTableName)
      .upsert({
        organization_id: organizationId,
        metrics,
        updated_at: new Date().toISOString()
      });
  }
  
  private getDefaultMetrics(): ${MODULE_CLASS}Metrics {
    return {
      totalProcessed: 0,
      successRate: 0,
      averageProcessingTime: 0,
      errorCount: 0
    };
  }
}

export default ${MODULE_CLASS}Service;
```

### **components/${MODULE_CLASS}Widget.tsx** (Componente React)
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Loader2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { ${MODULE_CLASS}Data, ${MODULE_CLASS}Metrics } from '../types';

interface ${MODULE_CLASS}WidgetProps {
  organizationId: string;
  config?: any;
  onError?: (error: string) => void;
}

export function ${MODULE_CLASS}Widget({
  organizationId,
  config = {},
  onError
}: ${MODULE_CLASS}WidgetProps) {
  const [data, setData] = useState<${MODULE_CLASS}Data[]>([]);
  const [metrics, setMetrics] = useState<${MODULE_CLASS}Metrics | null>(null);
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

      // Carregar dados do módulo
      const dataResponse = await fetch(\`/api/modules/${MODULE_SLUG}/data?organizationId=\${organizationId}\`);
      const dataResult = await dataResponse.json();

      if (!dataResult.success) {
        throw new Error(dataResult.error || 'Erro ao carregar dados');
      }

      setData(dataResult.data || []);

      // Carregar métricas
      const metricsResponse = await fetch(\`/api/modules/${MODULE_SLUG}/metrics?organizationId=\${organizationId}\`);
      const metricsResult = await metricsResponse.json();

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
            ${MODULE_NAME}
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
            ${MODULE_NAME}
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
            ${MODULE_NAME}
          </div>
          <Badge variant={data.length > 0 ? "default" : "secondary"}>
            {data.length} itens
          </Badge>
        </CardTitle>
        <CardDescription>
          ${MODULE_DESCRIPTION}
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
            <h4 className="font-medium">Dados Recentes</h4>
            {data.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum dado disponível</p>
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
              <a href={\`/modules/${MODULE_SLUG}\`}>
                Ver Detalhes
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ${MODULE_CLASS}Widget;
```

---

## 🚀 **Script de Geração Automática Atualizado**

### **generate-module.sh**
```bash
#!/bin/bash

# Script para gerar módulo automaticamente
# Uso: ./generate-module.sh <nome-modulo> <tipo> [categoria] [autor] [cliente]

set -e

# Parâmetros
MODULE_SLUG=${1:-"new-module"}
MODULE_TYPE=${2:-"standard"}
MODULE_CATEGORY=${3:-"analytics"}
MODULE_AUTHOR=${4:-"Axon Team"}
CLIENT_SLUG=${5:-""}

# Derivar nomes
MODULE_NAME=$(echo $MODULE_SLUG | sed 's/-/ /g' | sed 's/\b\w/\U&/g')
MODULE_CLASS=$(echo $MODULE_SLUG | sed -r 's/(^|-)([a-z])/\U\2/g')
MODULE_DESCRIPTION="Módulo de $MODULE_CATEGORY para o sistema Axon"

# Configurações específicas por tipo
if [ "$MODULE_TYPE" = "standard" ]; then
    BASE_DIR="src/core/modules/standard/$MODULE_SLUG"
    PRICING_TIER="free"
    CLIENT_NAME="Axon Team"
    CLIENT_ORGANIZATION="Axon Systems"
    CLIENT_DOMAIN="axon.dev"
else
    if [ -z "$CLIENT_SLUG" ]; then
        echo "❌ Para módulos custom, especifique o cliente: ./generate-module.sh <modulo> custom <categoria> <autor> <cliente>"
        exit 1
    fi
    BASE_DIR="src/core/modules/$CLIENT_SLUG/$MODULE_SLUG"
    PRICING_TIER="premium"
    CLIENT_NAME="$CLIENT_SLUG Team"
    CLIENT_ORGANIZATION="$CLIENT_SLUG Organization"
    CLIENT_DOMAIN="$CLIENT_SLUG.com"
fi

echo "🚀 Gerando módulo: $MODULE_NAME"
echo "📁 Tipo: $MODULE_TYPE"
echo "📂 Localização: $BASE_DIR"
echo "💰 Pricing: $PRICING_TIER"

# Criar estrutura de diretórios
mkdir -p "$BASE_DIR"/{types,services,handlers,utils,tests,docs,migrations,components}

# Gerar arquivos
echo "📄 Gerando arquivos..."

# module.json
cat > "$BASE_DIR/module.json" << EOF
{
  "name": "$MODULE_NAME",
  "slug": "$MODULE_SLUG",
  "version": "1.0.0",
  "description": "$MODULE_DESCRIPTION",
  "category": "$MODULE_CATEGORY",
  "maturity_status": "GA",
  "pricing_tier": "$PRICING_TIER",
  "author": "$MODULE_AUTHOR",
  "vendor": "$CLIENT_ORGANIZATION",
  "entrypoint": "src/index.ts"
}
EOF

# types/index.ts
cat > "$BASE_DIR/types/index.ts" << EOF
export interface ${MODULE_CLASS}Data {
  id: string;
  organizationId: string;
  name: string;
  status: 'active' | 'inactive' | 'processing' | 'error';
  properties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ${MODULE_CLASS}Config {
  enabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  cacheTtl: number;
  maxBatchSize: number;
  retryAttempts: number;
  autoRefresh: boolean;
  refreshInterval: number;
  customSettings?: Record<string, unknown>;
}

export interface ${MODULE_CLASS}Response<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
EOF

# README.md
cat > "$BASE_DIR/README.md" << EOF
# $MODULE_NAME

## Descrição
$MODULE_DESCRIPTION

## Características
- Tipo: $MODULE_TYPE
- Categoria: $MODULE_CATEGORY
- Pricing: $PRICING_TIER

## Instalação
Este módulo é automaticamente descoberto pelo sistema de lifecycle do Axon.

## Configuração
\`\`\`typescript
const config = {
  enabled: true,
  logLevel: 'info',
  cacheTtl: 3600
};
\`\`\`

## API
- \`GET /api/modules/$MODULE_SLUG/health\` - Health check
- \`GET /api/modules/$MODULE_SLUG/data\` - Obter dados
- \`POST /api/modules/$MODULE_SLUG/data\` - Processar dados

## Desenvolvimento
1. Implementar lógica em \`services/${MODULE_CLASS}Service.ts\`
2. Customizar tipos em \`types/index.ts\`
3. Adicionar componentes em \`components/\`
4. Escrever testes em \`tests/\`

## Changelog
### v1.0.0 ($(date +%Y-%m-%d))
- Versão inicial do módulo
EOF

echo "✅ Módulo $MODULE_NAME gerado com sucesso!"
echo "📝 Próximos passos:"
echo "   1. Implementar lógica em $BASE_DIR/services/"
echo "   2. Customizar tipos em $BASE_DIR/types/"
echo "   3. Adicionar testes em $BASE_DIR/tests/"
echo "   4. Registrar no sistema de módulos"
```

---

## 📋 **Checklist de Criação de Módulo Atualizado**

### **Planejamento** ✅
- [ ] Definir escopo e funcionalidades específicas
- [ ] Escolher tipo (Standard/Custom) e cliente-alvo
- [ ] Definir categoria e dependências técnicas
- [ ] Mapear permissões e políticas RLS necessárias
- [ ] Aprovar especificação técnica e de negócio

### **Implementação** ✅
- [ ] Criar estrutura de arquivos usando template
- [ ] Implementar manifesto module.json completo
- [ ] Desenvolver serviços principais com validação Zod
- [ ] Criar tipos TypeScript robustos
- [ ] Implementar handlers de API
- [ ] Configurar integração com Supabase
- [ ] Implementar componentes React (se necessário)

### **Testes** ✅
- [ ] Escrever testes unitários (coverage ≥ 70%)
- [ ] Testar integração com sistema Axon
- [ ] Validar performance com dados reais
- [ ] Verificar políticas de segurança RLS
- [ ] Testar health checks e monitoramento

### **Documentação** ✅
- [ ] README completo com exemplos
- [ ] Documentação da API com schemas
- [ ] Guia de configuração e deployment
- [ ] Exemplos de uso e integração
- [ ] Changelog com versioning semântico

### **Deploy e Produção** ✅
- [ ] Registrar no sistema de discovery de módulos
- [ ] Configurar rotas API no sistema
- [ ] Aplicar migrações de banco com RLS
- [ ] Configurar monitoramento e alertas
- [ ] Validar em ambiente de produção
- [ ] Documentar troubleshooting

---

**Este template fornece uma base completa e atualizada para criar módulos profissionais e robustos no sistema Axon, seguindo todas as melhores práticas identificadas na arquitetura atual.** 