import { BaseError } from './base-error';
import { logger } from '../../../utils/logger';

/**
 * Classe responsável por fazer log estruturado de erros
 */
export class ErrorLogger {
  /**
   * Registra um erro com contexto apropriado
   */
  static logError(error: Error, context?: Record<string, any>) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    };

    if (error instanceof BaseError) {
      errorInfo.statusCode = error.statusCode;
      errorInfo.errorCode = error.errorCode;
      errorInfo.isOperational = error.isOperational;
      errorInfo.context = error.context;
      errorInfo.timestamp = error.timestamp;

      // Log com nível apropriado baseado no tipo de erro
      if (error.statusCode >= 500) {
        logger.error('Server error occurred', errorInfo);
      } else if (error.statusCode >= 400) {
        logger.warn('Client error occurred', errorInfo);
      } else {
        logger.info('Error occurred', errorInfo);
      }
    } else {
      // Para erros não customizados, sempre log como error
      logger.error('Unexpected error occurred', errorInfo);
    }
  }

  /**
   * Registra um erro de autenticação
   */
  static logAuthError(error: Error, userId?: string, userEmail?: string) {
    this.logError(error, {
      userId,
      userEmail,
      type: 'authentication'
    });
  }

  /**
   * Registra um erro de validação
   */
  static logValidationError(error: Error, payload?: any) {
    this.logError(error, {
      payload,
      type: 'validation'
    });
  }

  /**
   * Registra um erro de serviço externo
   */
  static logExternalServiceError(error: Error, service: string, operation?: string) {
    this.logError(error, {
      service,
      operation,
      type: 'external_service'
    });
  }

  /**
   * Registra um erro de tenant
   */
  static logTenantError(error: Error, tenantId?: string) {
    this.logError(error, {
      tenantId,
      type: 'tenant'
    });
  }

  /**
   * Registra um erro de módulo
   */
  static logModuleError(error: Error, module: string, tenantId?: string) {
    this.logError(error, {
      module,
      tenantId,
      type: 'module'
    });
  }
}