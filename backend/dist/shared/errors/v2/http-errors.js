"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = exports.ServiceUnavailableError = exports.InternalServerError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = void 0;
const base_error_1 = require("./base-error");
class ValidationError extends base_error_1.BaseError {
    constructor(message, context) {
        super(message, 400, 'VALIDATION_ERROR', true, context);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends base_error_1.BaseError {
    constructor(message = 'Authentication required', context) {
        super(message, 401, 'AUTHENTICATION_ERROR', true, context);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends base_error_1.BaseError {
    constructor(message = 'Insufficient permissions', context) {
        super(message, 403, 'AUTHORIZATION_ERROR', true, context);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends base_error_1.BaseError {
    constructor(message = 'Resource not found', context) {
        super(message, 404, 'NOT_FOUND_ERROR', true, context);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends base_error_1.BaseError {
    constructor(message = 'Resource conflict', context) {
        super(message, 409, 'CONFLICT_ERROR', true, context);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends base_error_1.BaseError {
    constructor(message = 'Rate limit exceeded', context) {
        super(message, 429, 'RATE_LIMIT_ERROR', true, context);
    }
}
exports.RateLimitError = RateLimitError;
class InternalServerError extends base_error_1.BaseError {
    constructor(message = 'Internal server error', context) {
        super(message, 500, 'INTERNAL_SERVER_ERROR', false, context);
    }
}
exports.InternalServerError = InternalServerError;
class ServiceUnavailableError extends base_error_1.BaseError {
    constructor(message = 'Service temporarily unavailable', context) {
        super(message, 503, 'SERVICE_UNAVAILABLE_ERROR', true, context);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
class TimeoutError extends base_error_1.BaseError {
    constructor(message = 'Request timeout', context) {
        super(message, 504, 'TIMEOUT_ERROR', true, context);
    }
}
exports.TimeoutError = TimeoutError;
//# sourceMappingURL=http-errors.js.map