import { BaseError } from './base-error';

/**
 * Erro de validação de entrada (400)
 */
export class ValidationError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, context);
  }
}

/**
 * Erro de autenticação (401)
 */
export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, 401, 'AUTHENTICATION_ERROR', true, context);
  }
}

/**
 * Erro de autorização (403)
 */
export class AuthorizationError extends BaseError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 403, 'AUTHORIZATION_ERROR', true, context);
  }
}

/**
 * Erro de recurso não encontrado (404)
 */
export class NotFoundError extends BaseError {
  constructor(message: string = 'Resource not found', context?: Record<string, any>) {
    super(message, 404, 'NOT_FOUND_ERROR', true, context);
  }
}

/**
 * Erro de conflito (409)
 */
export class ConflictError extends BaseError {
  constructor(message: string = 'Resource conflict', context?: Record<string, any>) {
    super(message, 409, 'CONFLICT_ERROR', true, context);
  }
}

/**
 * Erro de limite de taxa excedido (429)
 */
export class RateLimitError extends BaseError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, any>) {
    super(message, 429, 'RATE_LIMIT_ERROR', true, context);
  }
}

/**
 * Erro interno do servidor (500)
 */
export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal server error', context?: Record<string, any>) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false, context);
  }
}

/**
 * Erro de serviço externo indisponível (503)
 */
export class ServiceUnavailableError extends BaseError {
  constructor(message: string = 'Service temporarily unavailable', context?: Record<string, any>) {
    super(message, 503, 'SERVICE_UNAVAILABLE_ERROR', true, context);
  }
}

/**
 * Erro de timeout (504)
 */
export class TimeoutError extends BaseError {
  constructor(message: string = 'Request timeout', context?: Record<string, any>) {
    super(message, 504, 'TIMEOUT_ERROR', true, context);
  }
}