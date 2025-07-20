// Base error class
export { BaseError } from './base-error';

// HTTP errors
export {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  TimeoutError
} from './http-errors';

// Business errors
export {
  BusinessError,
  DataIntegrityError,
  ConfigurationError,
  ExternalServiceError,
  TenantError,
  ModuleError
} from './business-errors';

// Error utilities
export { ErrorHandler } from './error-handler';
export { ErrorLogger } from './error-logger';