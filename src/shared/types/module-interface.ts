// ================================================
// INTERFACES PADRONIZADAS PARA MÓDULOS
// ================================================
// Interfaces para a nova arquitetura de módulos (Fase 2)

/**
 * Interface principal que todos os módulos devem implementar
 */
export interface ModuleInterface {
  /** Identificador único do módulo */
  id: string;
  
  /** Nome amigável do módulo */
  name: string;
  
  /** Versão semântica do módulo */
  version: string;
  
  /** Categoria do módulo (custom, standard, etc.) */
  category: 'custom' | 'standard' | 'core';
  
  /** Fornecedor/desenvolvedor do módulo */
  vendor: string;
  
  /** Inicializa o módulo com configurações */
  initialize(config?: any): Promise<ModuleInitResult>;
  
  /** Finaliza o módulo e limpa recursos */
  shutdown(): Promise<ModuleShutdownResult>;
  
  /** Verifica a saúde do módulo */
  healthCheck(): Promise<ModuleHealthResult>;
  
  /** Retorna métricas do módulo */
  getMetrics(): any;
  
  /** Retorna endpoints expostos pelo módulo */
  getEndpoints(): string[];
  
  /** Retorna configuração atual do módulo */
  getConfig(): any;
}

/**
 * Resultado da inicialização do módulo
 */
export interface ModuleInitResult {
  /** Se a inicialização foi bem-sucedida */
  success: boolean;
  
  /** Mensagem descritiva */
  message: string;
  
  /** Dados adicionais da inicialização */
  data?: any;
}

/**
 * Resultado do shutdown do módulo
 */
export interface ModuleShutdownResult {
  /** Se o shutdown foi bem-sucedido */
  success: boolean;
  
  /** Mensagem descritiva */
  message: string;
}

/**
 * Resultado do health check
 */
export interface ModuleHealthResult {
  /** Se o módulo está saudável */
  healthy: boolean;
  
  /** Status textual */
  status: 'healthy' | 'unhealthy' | 'error' | 'degraded';
  
  /** Detalhes do health check */
  details: Record<string, any>;
  
  /** Timestamp da verificação */
  timestamp: string;
}

/**
 * Configuração base para todos os módulos
 */
export interface BaseModuleConfig {
  /** Se o módulo está habilitado */
  enabled?: boolean;
  
  /** Configurações de logging */
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enabled: boolean;
  };
  
  /** Configurações de performance */
  performance?: {
    timeout?: number;
    retries?: number;
    concurrency?: number;
  };
}

/**
 * Metadados do módulo
 */
export interface ModuleMetadata {
  /** ID do módulo */
  id: string;
  
  /** Nome do módulo */
  name: string;
  
  /** Versão do módulo */
  version: string;
  
  /** Categoria */
  category: string;
  
  /** Fornecedor */
  vendor: string;
  
  /** Descrição */
  description: string;
  
  /** Ponto de entrada */
  entrypoint: string;
  
  /** Arquitetura utilizada */
  architecture: string;
  
  /** Se foi refatorado */
  refactored: boolean;
  
  /** Data da refatoração */
  refactorDate: string;
  
  /** Status de conformidade */
  compliance: {
    hasManifest: boolean;
    hasSchema: boolean;
    hasMigrations: boolean;
    hasTests: boolean;
    hasPipeline: boolean;
    hasRegister: boolean;
  };
}

/**
 * Registry de módulos
 */
export interface ModuleRegistry {
  /** Registra um módulo */
  register(moduleFactory: () => Promise<ModuleInterface>): Promise<void>;
  
  /** Obtém um módulo pelo ID */
  get(id: string): ModuleInterface | null;
  
  /** Lista todos os módulos registrados */
  list(): ModuleInterface[];
  
  /** Remove um módulo do registry */
  unregister(id: string): Promise<void>;
  
  /** Verifica se um módulo está registrado */
  has(id: string): boolean;
} 
// INTERFACES PADRONIZADAS PARA MÓDULOS
// ================================================
// Interfaces para a nova arquitetura de módulos (Fase 2)

/**
 * Interface principal que todos os módulos devem implementar
 */
export interface ModuleInterface {
  /** Identificador único do módulo */
  id: string;
  
  /** Nome amigável do módulo */
  name: string;
  
  /** Versão semântica do módulo */
  version: string;
  
  /** Categoria do módulo (custom, standard, etc.) */
  category: 'custom' | 'standard' | 'core';
  
  /** Fornecedor/desenvolvedor do módulo */
  vendor: string;
  
  /** Inicializa o módulo com configurações */
  initialize(config?: any): Promise<ModuleInitResult>;
  
  /** Finaliza o módulo e limpa recursos */
  shutdown(): Promise<ModuleShutdownResult>;
  
  /** Verifica a saúde do módulo */
  healthCheck(): Promise<ModuleHealthResult>;
  
  /** Retorna métricas do módulo */
  getMetrics(): any;
  
  /** Retorna endpoints expostos pelo módulo */
  getEndpoints(): string[];
  
  /** Retorna configuração atual do módulo */
  getConfig(): any;
}

/**
 * Resultado da inicialização do módulo
 */
export interface ModuleInitResult {
  /** Se a inicialização foi bem-sucedida */
  success: boolean;
  
  /** Mensagem descritiva */
  message: string;
  
  /** Dados adicionais da inicialização */
  data?: any;
}

/**
 * Resultado do shutdown do módulo
 */
export interface ModuleShutdownResult {
  /** Se o shutdown foi bem-sucedido */
  success: boolean;
  
  /** Mensagem descritiva */
  message: string;
}

/**
 * Resultado do health check
 */
export interface ModuleHealthResult {
  /** Se o módulo está saudável */
  healthy: boolean;
  
  /** Status textual */
  status: 'healthy' | 'unhealthy' | 'error' | 'degraded';
  
  /** Detalhes do health check */
  details: Record<string, any>;
  
  /** Timestamp da verificação */
  timestamp: string;
}

/**
 * Configuração base para todos os módulos
 */
export interface BaseModuleConfig {
  /** Se o módulo está habilitado */
  enabled?: boolean;
  
  /** Configurações de logging */
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enabled: boolean;
  };
  
  /** Configurações de performance */
  performance?: {
    timeout?: number;
    retries?: number;
    concurrency?: number;
  };
}

/**
 * Metadados do módulo
 */
export interface ModuleMetadata {
  /** ID do módulo */
  id: string;
  
  /** Nome do módulo */
  name: string;
  
  /** Versão do módulo */
  version: string;
  
  /** Categoria */
  category: string;
  
  /** Fornecedor */
  vendor: string;
  
  /** Descrição */
  description: string;
  
  /** Ponto de entrada */
  entrypoint: string;
  
  /** Arquitetura utilizada */
  architecture: string;
  
  /** Se foi refatorado */
  refactored: boolean;
  
  /** Data da refatoração */
  refactorDate: string;
  
  /** Status de conformidade */
  compliance: {
    hasManifest: boolean;
    hasSchema: boolean;
    hasMigrations: boolean;
    hasTests: boolean;
    hasPipeline: boolean;
    hasRegister: boolean;
  };
}

/**
 * Registry de módulos
 */
export interface ModuleRegistry {
  /** Registra um módulo */
  register(moduleFactory: () => Promise<ModuleInterface>): Promise<void>;
  
  /** Obtém um módulo pelo ID */
  get(id: string): ModuleInterface | null;
  
  /** Lista todos os módulos registrados */
  list(): ModuleInterface[];
  
  /** Remove um módulo do registry */
  unregister(id: string): Promise<void>;
  
  /** Verifica se um módulo está registrado */
  has(id: string): boolean;
} 