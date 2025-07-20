import { BaseError } from './base-error';
export declare class ValidationError extends BaseError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class AuthenticationError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare class AuthorizationError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare class NotFoundError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare class ConflictError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare class RateLimitError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare class InternalServerError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare class ServiceUnavailableError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare class TimeoutError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
//# sourceMappingURL=http-errors.d.ts.map