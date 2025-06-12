// Tipos de logs disponíveis
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

// Configuração do logger
export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  targets: {
    console: boolean;
    localStorage: boolean;
    // Futuramente pode ser expandido para outros destinos (API, etc)
  };
  modules: Record<string, boolean>; // Controle por módulo
}

// Níveis de log e seus valores numéricos (maior = mais detalhado)
const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
};

// Configuração padrão
const DEFAULT_CONFIG: LoggerConfig = {
  enabled: process.env.NODE_ENV === 'development',
  level: 'info',
  targets: {
    console: true,
    localStorage: false
  },
  modules: {}
};

// Chave para armazenar configuração no localStorage
const LOGGER_CONFIG_KEY = 'banban_logger_config';

// Classe principal do Logger
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  
  private constructor() {
    this.config = this.loadConfig();
  }
  
  /**
   * Obtém a instância única do Logger (Singleton)
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  /**
   * Carrega a configuração do localStorage ou usa o padrão
   */
  private loadConfig(): LoggerConfig {
    if (typeof window === 'undefined') {
      return DEFAULT_CONFIG;
    }
    
    try {
      const savedConfig = localStorage.getItem(LOGGER_CONFIG_KEY);
      if (savedConfig) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      // Falha ao carregar do localStorage, usa o padrão
    }
    
    return DEFAULT_CONFIG;
  }
  
  /**
   * Salva a configuração atual no localStorage
   */
  private saveConfig(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOGGER_CONFIG_KEY, JSON.stringify(this.config));
      } catch (error) {
        // Falha ao salvar no localStorage
      }
    }
  }
  
  /**
   * Verifica se um log deve ser exibido com base na configuração
   */
  private shouldLog(level: LogLevel, module?: string): boolean {
    if (!this.config.enabled) return false;
    
    // Verifica se o módulo está habilitado (se especificado)
    if (module && this.config.modules[module] === false) {
      return false;
    }
    
    // Verifica se o nível do log está habilitado
    return LOG_LEVEL_VALUES[level] <= LOG_LEVEL_VALUES[this.config.level];
  }
  
  /**
   * Executa o log em todos os destinos configurados
   */
  private execLog(level: LogLevel, module: string | undefined, args: any[]): void {
    if (!this.shouldLog(level, module)) return;
    
    const prefix = module ? `[${module}] ` : '';
    const formattedArgs = [prefix, ...args];
    
    if (this.config.targets.console && typeof console !== 'undefined') {
      switch (level) {
        case 'error':
          console.error(...formattedArgs);
          break;
        case 'warn':
          console.warn(...formattedArgs);
          break;
        case 'info':
          console.info(...formattedArgs);
          break;
        case 'debug':
        case 'trace':
          console.log(...formattedArgs);
          break;
      }
    }
    
    if (this.config.targets.localStorage && typeof localStorage !== 'undefined') {
      try {
        const logs = JSON.parse(localStorage.getItem('banban_logs') || '[]');
        logs.push({
          timestamp: new Date().toISOString(),
          level,
          module,
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ')
        });
        // Mantém apenas os últimos 100 logs
        if (logs.length > 100) logs.splice(0, logs.length - 100);
        localStorage.setItem('banban_logs', JSON.stringify(logs));
      } catch (error) {
        // Falha ao salvar no localStorage
      }
    }
  }
  
  /**
   * Ativa ou desativa todos os logs
   */
  public enable(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
  }
  
  /**
   * Define o nível de log
   */
  public setLevel(level: LogLevel): void {
    this.config.level = level;
    this.saveConfig();
  }
  
  /**
   * Ativa ou desativa o log para um módulo específico
   */
  public enableModule(module: string, enabled: boolean): void {
    this.config.modules[module] = enabled;
    this.saveConfig();
  }
  
  /**
   * Configura os alvos de log
   */
  public setTargets(targets: Partial<LoggerConfig['targets']>): void {
    this.config.targets = { ...this.config.targets, ...targets };
    this.saveConfig();
  }
  
  /**
   * Obtém a configuração atual
   */
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }
  
  /**
   * Reseta a configuração para o padrão
   */
  public resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }
  
  /**
   * Limpa os logs armazenados
   */
  public clearLogs(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('banban_logs');
    }
  }
  
  /**
   * Obtém os logs armazenados
   */
  public getLogs(): any[] {
    if (typeof localStorage === 'undefined') return [];
    
    try {
      return JSON.parse(localStorage.getItem('banban_logs') || '[]');
    } catch (error) {
      return [];
    }
  }
  
  // Métodos de log
  
  public error(module: string | undefined, ...args: any[]): void {
    this.execLog('error', module, args);
  }
  
  public warn(module: string | undefined, ...args: any[]): void {
    this.execLog('warn', module, args);
  }
  
  public info(module: string | undefined, ...args: any[]): void {
    this.execLog('info', module, args);
  }
  
  public debug(module: string | undefined, ...args: any[]): void {
    this.execLog('debug', module, args);
  }
  
  public trace(module: string | undefined, ...args: any[]): void {
    this.execLog('trace', module, args);
  }
}

// Função auxiliar para obter a instância do logger
export const getLogger = (): Logger => Logger.getInstance();

// Hook para uso em componentes React
export const createLogger = (module: string) => {
  const logger = getLogger();
  
  return {
    error: (...args: any[]) => logger.error(module, ...args),
    warn: (...args: any[]) => logger.warn(module, ...args),
    info: (...args: any[]) => logger.info(module, ...args),
    debug: (...args: any[]) => logger.debug(module, ...args),
    trace: (...args: any[]) => logger.trace(module, ...args)
  };
}; 