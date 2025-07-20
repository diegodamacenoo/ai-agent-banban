// Sistema de logging seguro que redacta dados sensÃ­veis

import { 
  type AuditActionType,
  type AuditResourceType,
  type AuditLogEntry,
  type Result
} from '@/core/schemas/audit';

interface LogData {
  [key: string]: any;
}

interface SafeLoggerConfig {
  sensitiveKeys: string[];
  redactValue: string;
  enabledInProduction: boolean;
}

const DEFAULT_CONFIG: SafeLoggerConfig = {
  sensitiveKeys: [
    'password', 'senha', 'pwd',
    'token', 'accessToken', 'refreshToken', 'apiKey', 'api_key',
    'secret', 'secretKey', 'privateKey', 'private_key',
    'credential', 'credentials', 'auth', 'authorization',
    'ssn', 'cpf', 'cnpj', 'credit_card', 'creditCard',
    'phone', 'telefone', 'email', // parcialmente redactados
    'address', 'endereco', 'location'
  ],
  redactValue: '[REDACTED]',
  enabledInProduction: process.env.NODE_ENV !== 'production'
};

/**
 * Redacta dados sensÃ­veis de um objeto
 */
const redactSensitiveData = (data: any, config = DEFAULT_CONFIG): any => {
  if (!data) return data;
  
  if (typeof data === 'string') {
    // Verifica se a string parece ser um campo sensÃ­vel
    const lowerData = data.toLowerCase();
    if (config.sensitiveKeys.some(key => lowerData.includes(key))) {
      return config.redactValue;
    }
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item, config));
  }
  
  if (typeof data === 'object' && data !== null) {
    const redacted: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // Verifica se a chave Ã© sensÃ­vel
      if (config.sensitiveKeys.includes(lowerKey)) {
        redacted[key] = config.redactValue;
      }
      // RedaÃ§Ã£o parcial para emails
      else if (lowerKey.includes('email') && typeof value === 'string') {
        redacted[key] = maskEmail(value);
      }
      // RedaÃ§Ã£o parcial para telefones
      else if (lowerKey.includes('phone') || lowerKey.includes('telefone')) {
        redacted[key] = maskPhone(value as string);
      }
      // RecursÃ£o para objetos aninhados
      else if (typeof value === 'object') {
        redacted[key] = redactSensitiveData(value, config);
      }
      else {
        redacted[key] = value;
      }
    }
    
    return redacted;
  }
  
  return data;
};

/**
 * Mascara email parcialmente (mostra apenas primeiros 3 caracteres)
 */
const maskEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '[INVALID_EMAIL]';
  
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return '[INVALID_EMAIL]';
  
  const username = email.substring(0, atIndex);
  const domain = email.substring(atIndex);
  
  if (username.length <= 3) {
    return `${username[0]}***${domain}`;
  }
  
  return `${username.substring(0, 3)}***${domain}`;
};

/**
 * Mascara telefone parcialmente
 */
const maskPhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '[INVALID_PHONE]';
  
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 8) return '[INVALID_PHONE]';
  
  const visible = cleaned.substring(0, 2);
  const masked = '*'.repeat(cleaned.length - 4);
  const lastDigits = cleaned.substring(cleaned.length - 2);
  
  return `${visible}${masked}${lastDigits}`;
};

/**
 * Adiciona contexto de seguranÃ§a ao log
 */
const addSecurityContext = (data: LogData): LogData => {
  return {
    ...data,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,
    // NÃ£o incluir dados sensÃ­veis do request aqui
  };
};

/**
 * Logger seguro principal
 */
export const safeLogger = {
  info: (message: string, data?: LogData) => {
    if (!DEFAULT_CONFIG.enabledInProduction && process.env.NODE_ENV === 'production') {
      return; // NÃ£o loga em produÃ§Ã£o se desabilitado
    }
    
    const sanitizedData = data ? redactSensitiveData(data) : undefined;
    const contextData = sanitizedData ? addSecurityContext(sanitizedData) : undefined;
    
    console.debug(`[INFO] ${message}`, contextData || '');
  },
  
  warn: (message: string, data?: LogData) => {
    const sanitizedData = data ? redactSensitiveData(data) : undefined;
    const contextData = sanitizedData ? addSecurityContext(sanitizedData) : undefined;
    
    console.warn(`[WARN] ${message}`, contextData || '');
  },
  
  error: (message: string, error?: any) => {
    const sanitizedError = error ? redactSensitiveData(error) : undefined;
    const contextData = sanitizedError ? addSecurityContext(sanitizedError) : undefined;
    
    console.error(`[ERROR] ${message}`, contextData || '');
  },
  
  debug: (message: string, data?: LogData) => {
    if (process.env.NODE_ENV === 'production') {
      return; // Nunca loga debug em produÃ§Ã£o
    }
    
    const sanitizedData = data ? redactSensitiveData(data) : undefined;
    console.debug(`[DEBUG] ${message}`, sanitizedData || '');
  },
  
  // Log de auditoria para aÃ§Ãµes crÃ­ticas
  audit: (action: string, userId?: string, data?: LogData) => {
    const auditData = {
      action,
      userId: userId || 'anonymous',
      ...data
    };
    
    const sanitizedData = redactSensitiveData(auditData);
    const contextData = addSecurityContext(sanitizedData);
    
    // Em produÃ§Ã£o, isso deveria ir para um sistema de auditoria dedicado
    console.debug(`[AUDIT] ${action}`, contextData);
  },
  
  // Log de seguranÃ§a para eventos suspeitos
  security: (event: string, details?: LogData) => {
    const securityData = {
      event,
      severity: 'HIGH',
      ...details
    };
    
    const sanitizedData = redactSensitiveData(securityData);
    const contextData = addSecurityContext(sanitizedData);
    
    // Em produÃ§Ã£o, isso deveria disparar alertas
    console.error(`[SECURITY] ${event}`, contextData);
  }
};

/**
 * Wrapper para console.log que redacta automaticamente
 */
export const safeConsoleLog = (...args: any[]) => {
  const sanitizedArgs = args.map(arg => redactSensitiveData(arg));
  console.debug(...sanitizedArgs);
};

/**
 * ConfiguraÃ§Ã£o customizada do logger
 */
export const configureSafeLogger = (config: Partial<SafeLoggerConfig>) => {
  Object.assign(DEFAULT_CONFIG, config);
};

/**
 * UtilitÃ¡rios de redaÃ§Ã£o
 */
export const redactionUtils = {
  redactSensitiveData,
  maskEmail,
  maskPhone,
  addSecurityContext
};

// Tipos exportados
export interface AuditLogData {
  action: string;
  userId?: string;
  resource?: string;
  resourceId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SecurityLogData {
  event: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip?: string;
  userAgent?: string;
  userId?: string;
  details?: Record<string, any>;
}

/**
 * Safe logger for sensitive operations
 * Ensures no sensitive data is logged while maintaining audit trail
 */
export class SafeLogger {
  private static instance: SafeLogger;
  private readonly sensitiveFields: Set<string>;

  private constructor() {
    this.sensitiveFields = new Set([
      'password',
      'senha',
      'token',
      'secret',
      'key',
      'apiKey',
      'api_key',
      'authorization',
      'auth',
      'credentials',
      'credit_card',
      'creditCard',
      'ssn',
      'social_security',
      'tax_id',
      'taxId'
    ]);
  }

  public static getInstance(): SafeLogger {
    if (!SafeLogger.instance) {
      SafeLogger.instance = new SafeLogger();
    }
    return SafeLogger.instance;
  }

  /**
   * Safely logs an audit event by removing sensitive data
   */
  public async logAudit(
    actionType: AuditActionType,
    resourceType: AuditResourceType,
    data: Record<string, any>
  ): Promise<Result<AuditLogEntry, Error>> {
    try {
      const sanitizedData = this.sanitizeData(data);
      
      const logEntry: AuditLogEntry = {
        action_type: actionType,
        resource_type: resourceType,
        actor_user_id: sanitizedData.userId || 'system',
        resource_id: sanitizedData.resourceId,
        organization_id: sanitizedData.organizationId,
        details: sanitizedData,
        timestamp: new Date().toISOString()
      };

      // Log to audit system
      console.info('[AUDIT]', {
        action: actionType,
        resource: resourceType,
        ...sanitizedData
      });

      return { success: true, data: logEntry };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error in safe logging')
      };
    }
  }

  /**
   * Sanitizes data by removing or masking sensitive fields
   */
  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = Array.isArray(value)
          ? value.map(item => 
              typeof item === 'object' 
                ? this.sanitizeData(item) 
                : this.isSensitiveValue(item) ? '[REDACTED]' : item
            )
          : this.sanitizeData(value);
      } else {
        sanitized[key] = this.isSensitiveValue(value) ? '[REDACTED]' : value;
      }
    }

    return sanitized;
  }

  /**
   * Checks if a field name indicates sensitive data
   */
  private isSensitiveField(fieldName: string): boolean {
    const normalizedField = fieldName.toLowerCase();
    return this.sensitiveFields.has(normalizedField) ||
           Array.from(this.sensitiveFields).some(field => 
             normalizedField.includes(field)
           );
  }

  /**
   * Checks if a value appears to be sensitive data
   */
  private isSensitiveValue(value: any): boolean {
    if (typeof value !== 'string') return false;

    // Check for common sensitive data patterns
    const sensitivePatterns = [
      /^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$/, // Credit card
      /^\d{3}-\d{2}-\d{4}$/, // SSN
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, // Password-like
      /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/, // JWT
      /^(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]+$/, // API keys
    ];

    return sensitivePatterns.some(pattern => pattern.test(value));
  }
} 
