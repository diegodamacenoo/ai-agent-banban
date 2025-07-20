export interface ClientModuleInterface {
  /** Identificador único do cliente */
  clientId: string;
  
  /** Configuração do frontend */
  frontendConfig: ClientFrontendConfig;
  
  /** Lista de módulos de backend utilizados */
  backendModules: string[];
  
  /** Mapeamento de endpoints da API */
  apiEndpoints: Record<string, string>;
  
  /** Configurações específicas do cliente */
  customConfig?: Record<string, any>;
}

export interface ClientFrontendConfig {
  /** Nome do cliente */
  name: string;
  
  /** Tipo do cliente */
  type: string;
  
  /** Features habilitadas */
  features: Record<string, boolean>;
  
  /** Configurações de tema */
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  /** Configurações de módulos */
  modules: Record<string, ModuleConfig>;
}

export interface ModuleConfig {
  /** Se o módulo está habilitado */
  enabled: boolean;
  
  /** Features customizadas do módulo */
  customFeatures?: string[];
  
  /** Features padrão do módulo */
  features?: string[];
  
  /** Configurações específicas do módulo */
  config?: Record<string, any>;
}

export interface BackendModuleInterface {
  /** Identificador único do módulo */
  moduleId: string;
  
  /** Cliente que utiliza este módulo */
  clientId: string;
  
  /** Configuração do módulo */
  configuration: Record<string, any>;
  
  /** Endpoints expostos pelo módulo */
  endpoints: string[];
  
  /** Validações específicas */
  validations?: Record<string, any>;
}

export interface ClientModuleRegistry {
  /** Registra um cliente no sistema */
  registerClient(client: ClientModuleInterface): void;
  
  /** Registra um módulo de backend */
  registerBackendModule(module: BackendModuleInterface): void;
  
  /** Obtém configuração do cliente */
  getClientConfig(clientId: string): ClientModuleInterface | null;
  
  /** Obtém módulos de um cliente */
  getClientModules(clientId: string): BackendModuleInterface[];
  
  /** Valida se cliente e módulos são compatíveis */
  validateClientModules(clientId: string): boolean;
} 