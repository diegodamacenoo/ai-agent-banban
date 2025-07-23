import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export interface ModuleInfo {
  name: string;
  type: 'standard' | 'custom' | 'base';
  version: string;
  description: string;
  endpoints: string[];
  features: string[];
  status?: 'active' | 'inactive' | 'maintenance';
  inheritsFrom?: string;
}

export interface ModuleInstance {
  name: string;
  version: string;
  description: string;
  
  /**
   * Register module routes and schemas with Fastify
   */
  register(fastify: FastifyInstance, prefix?: string): Promise<void>;
  
  /**
   * Handle generic module requests
   */
  handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<any>;
  
  /**
   * Get module information and metadata
   */
  getModuleInfo(): ModuleInfo;
  
  /**
   * Get list of endpoints provided by the module
   */
  getEndpoints(): string[];
}

export interface TenantModule extends ModuleInstance {
  // Alias para compatibilidade com código existente
}

// Re-export original interface for compatibility
export interface TenantModuleCompat {
  getModuleInfo(): ModuleInfo;
  handleRequest(request: any, reply: any): Promise<any>;
  register(server: any, prefix?: string): Promise<void>;
}

// Additional interfaces for performance modules
export interface ModuleConfig {
  name: string;
  version: string;
  enabled: boolean;
  settings: Record<string, any>;
}

export interface BusinessMetricsParams {
  organizationId: string;
  tenantId?: string;
  dateFrom?: string;
  dateTo?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  filters?: Record<string, any>;
}

export interface CustomMetricsParams {
  organizationId: string;
  tenantId?: string;
  metricType: string;
  metrics?: string;
  parameters: Record<string, any>;
}

export interface PerformanceMetrics {
  summary: {
    total_events: number;
    success_rate: number;
    avg_processing_time: number;
  };
  trends: Array<{
    date: string;
    count: number;
    avg_time: number;
  }>;
  errors: Array<{
    type: string;
    count: number;
    last_occurrence: string;
  }>;
  revenue?: number | {
    total: number;
    growth: number;
    period?: string;
  };
  orders?: {
    count: number;
    averageValue: number;
    growth: number;
  };
  customers?: {
    total: number;
    active: number;
    growth: number;
  };
  [key: string]: any;
}