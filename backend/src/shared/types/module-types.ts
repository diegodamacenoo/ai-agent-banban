import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export interface ModuleInfo {
  name: string;
  type: 'standard' | 'custom';
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