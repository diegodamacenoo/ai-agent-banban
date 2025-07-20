export interface DevelopmentLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: 'module' | 'build' | 'test' | 'deploy' | 'performance' | 'security';
  moduleId?: string;
  message: string;
  details?: any;
  source: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface LogFilter {
  levels?: string[];
  categories?: string[];
  modules?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

export interface LogAggregationResult {
  logs: DevelopmentLog[];
  totalCount: number;
  summary: {
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    byModule: Record<string, number>;
  };
}

class LogAggregatorService {
  private subscribers: Map<string, (log: DevelopmentLog) => void> = new Map();
  private logBuffer: DevelopmentLog[] = [];
  private maxBufferSize = 1000;

  constructor() {
    // Simula geração de logs em tempo real
    this.startLogGeneration();
  }

  private startLogGeneration() {
    setInterval(() => {
      const log = this.generateMockLog();
      this.addLog(log);
    }, 2000 + Math.random() * 3000); // Entre 2-5 segundos
  }

  private generateMockLog(): DevelopmentLog {
    const levels: DevelopmentLog['level'][] = ['debug', 'info', 'warn', 'error', 'critical'];
    const categories: DevelopmentLog['category'][] = ['module', 'build', 'test', 'deploy', 'performance', 'security'];
    const modules = ['banban/inventory', 'banban/performance', 'standard/analytics', 'standard/reports'];
    const sources = ['webpack', 'typescript', 'eslint', 'jest', 'supabase', 'next.js'];

    const level = levels[Math.floor(Math.random() * levels.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const moduleId = Math.random() > 0.3 ? modules[Math.floor(Math.random() * modules.length)] : undefined;
    const source = sources[Math.floor(Math.random() * sources.length)];

    const messages = this.getMessagesForLevel(level, category, moduleId);
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      moduleId,
      message,
      source,
      details: this.generateLogDetails(level, category),
      metadata: {
        buildId: `build_${Math.floor(Math.random() * 1000)}`,
        sessionId: 'session_abc123',
        environment: 'development'
      }
    };
  }

  private getMessagesForLevel(level: string, category: string, moduleId?: string): string[] {
    const moduleText = moduleId ? ` [${moduleId}]` : '';
    
    switch (level) {
      case 'debug':
        return [
          `Iniciando análise de dependências${moduleText}`,
          `Cache de builds atualizado${moduleText}`,
          `Validando estrutura de arquivos${moduleText}`,
          `Executando testes unitários${moduleText}`
        ];
      case 'info':
        return [
          `Build compilado com sucesso${moduleText}`,
          `Testes executados: 15 passed, 0 failed${moduleText}`,
          `Módulo validado e funcionando${moduleText}`,
          `Deploy realizado para ambiente de desenvolvimento${moduleText}`
        ];
      case 'warn':
        return [
          `Dependência desatualizada detectada${moduleText}`,
          `Função com complexidade alta encontrada${moduleText}`,
          `Import não utilizado detectado${moduleText}`,
          `Performance abaixo do esperado${moduleText}`
        ];
      case 'error':
        return [
          `Erro de compilação TypeScript${moduleText}`,
          `Teste unitário falhando${moduleText}`,
          `Dependência circular detectada${moduleText}`,
          `Arquivo de configuração inválido${moduleText}`
        ];
      case 'critical':
        return [
          `Build completamente quebrado${moduleText}`,
          `Falha crítica de segurança detectada${moduleText}`,
          `Módulo essencial não está funcionando${moduleText}`,
          `Deploy falhou por erro crítico${moduleText}`
        ];
      default:
        return [`Log ${level} para categoria ${category}${moduleText}`];
    }
  }

  private generateLogDetails(level: string, category: string): any {
    switch (category) {
      case 'build':
        return {
          duration: Math.floor(Math.random() * 30000) + 1000, // 1-31 segundos
          filesProcessed: Math.floor(Math.random() * 50) + 10,
          warnings: Math.floor(Math.random() * 5),
          errors: level === 'error' || level === 'critical' ? Math.floor(Math.random() * 3) + 1 : 0
        };
      case 'test':
        return {
          testsRun: Math.floor(Math.random() * 20) + 5,
          passed: Math.floor(Math.random() * 18) + 5,
          failed: level === 'error' ? Math.floor(Math.random() * 3) + 1 : 0,
          coverage: Math.floor(Math.random() * 30) + 70 // 70-100%
        };
      case 'performance':
        return {
          responseTime: Math.floor(Math.random() * 2000) + 100, // 100-2100ms
          memoryUsage: Math.floor(Math.random() * 50) + 20, // 20-70MB
          cpuUsage: Math.floor(Math.random() * 80) + 10 // 10-90%
        };
      default:
        return {
          timestamp: new Date().toISOString(),
          additionalInfo: `Detalhes específicos para ${category}`
        };
    }
  }

  private addLog(log: DevelopmentLog) {
    // Adiciona ao buffer
    this.logBuffer.unshift(log);
    
    // Mantém tamanho do buffer
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(0, this.maxBufferSize);
    }

    // Notifica subscribers
    this.subscribers.forEach(callback => callback(log));
  }

  subscribe(id: string, callback: (log: DevelopmentLog) => void) {
    this.subscribers.set(id, callback);
    
    return () => {
      this.subscribers.delete(id);
    };
  }

  async getLogs(
    filter: LogFilter = {},
    page = 1,
    pageSize = 50
  ): Promise<LogAggregationResult> {
    let filteredLogs = [...this.logBuffer];

    // Aplica filtros
    if (filter.levels && filter.levels.length > 0) {
      filteredLogs = filteredLogs.filter(log => filter.levels!.includes(log.level));
    }

    if (filter.categories && filter.categories.length > 0) {
      filteredLogs = filteredLogs.filter(log => filter.categories!.includes(log.category));
    }

    if (filter.modules && filter.modules.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        log.moduleId && filter.modules!.includes(log.moduleId)
      );
    }

    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchTerm) ||
        log.source.toLowerCase().includes(searchTerm) ||
        (log.moduleId?.toLowerCase().includes(searchTerm))
      );
    }

    if (filter.dateRange) {
      filteredLogs = filteredLogs.filter(log =>
        log.timestamp >= filter.dateRange!.start &&
        log.timestamp <= filter.dateRange!.end
      );
    }

    // Paginação
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    // Gera resumo
    const summary = {
      byLevel: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byModule: {} as Record<string, number>
    };

    filteredLogs.forEach(log => {
      summary.byLevel[log.level] = (summary.byLevel[log.level] || 0) + 1;
      summary.byCategory[log.category] = (summary.byCategory[log.category] || 0) + 1;
      if (log.moduleId) {
        summary.byModule[log.moduleId] = (summary.byModule[log.moduleId] || 0) + 1;
      }
    });

    return {
      logs: paginatedLogs,
      totalCount: filteredLogs.length,
      summary
    };
  }

  async exportLogs(filter: LogFilter = {}, format: 'json' | 'csv' = 'json'): Promise<string> {
    const result = await this.getLogs(filter, 1, 10000); // Exporta até 10k logs
    
    if (format === 'json') {
      return JSON.stringify(result.logs, null, 2);
    }

    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'moduleId', 'message', 'source'];
      const csvRows = [
        headers.join(','),
        ...result.logs.map(log => [
          log.timestamp.toISOString(),
          log.level,
          log.category,
          log.moduleId || '',
          `"${log.message.replace(/"/g, '""')}"`,
          log.source
        ].join(','))
      ];
      return csvRows.join('\n');
    }

    return '';
  }

  async getLogStatistics(timeRange: 'hour' | 'day' | 'week' = 'day') {
    const now = new Date();
    const startTime = new Date();
    
    switch (timeRange) {
      case 'hour':
        startTime.setHours(now.getHours() - 1);
        break;
      case 'day':
        startTime.setDate(now.getDate() - 1);
        break;
      case 'week':
        startTime.setDate(now.getDate() - 7);
        break;
    }

    const logsInRange = this.logBuffer.filter(log => log.timestamp >= startTime);

    return {
      totalLogs: logsInRange.length,
      errorRate: logsInRange.filter(log => log.level === 'error' || log.level === 'critical').length / logsInRange.length,
      topCategories: Object.entries(
        logsInRange.reduce((acc, log) => {
          acc[log.category] = (acc[log.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort(([,a], [,b]) => b - a).slice(0, 5),
      topModules: Object.entries(
        logsInRange.reduce((acc, log) => {
          if (log.moduleId) {
            acc[log.moduleId] = (acc[log.moduleId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      ).sort(([,a], [,b]) => b - a).slice(0, 5)
    };
  }
}

export const logAggregatorService = new LogAggregatorService(); 