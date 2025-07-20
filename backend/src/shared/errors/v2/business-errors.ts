import { BaseError } from './base-error';

/**
 * Erro de lógica de negócio
 */
export class BusinessError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 422, 'BUSINESS_ERROR', true, context);
  }
}

/**
 * Erro de dados inválidos ou inconsistentes
 */
export class DataIntegrityError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 422, 'DATA_INTEGRITY_ERROR', true, context);
  }
}

/**
 * Erro de configuração
 */
export class ConfigurationError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, 'CONFIGURATION_ERROR', false, context);
  }
}

/**
 * Erro de integração externa
 */
export class ExternalServiceError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', true, context);
  }
}

/**
 * Erro de tenant/multi-tenancy
 */
export class TenantError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, 'TENANT_ERROR', true, context);
  }
}

/**
 * Erro de módulo não encontrado ou inválido
 */
export class ModuleError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 404, 'MODULE_ERROR', true, context);
  }
}