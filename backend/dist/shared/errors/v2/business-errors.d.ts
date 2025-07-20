import { BaseError } from './base-error';
export declare class BusinessError extends BaseError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class DataIntegrityError extends BaseError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class ConfigurationError extends BaseError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class ExternalServiceError extends BaseError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class TenantError extends BaseError {
    constructor(message: string, context?: Record<string, any>);
}
export declare class ModuleError extends BaseError {
    constructor(message: string, context?: Record<string, any>);
}
//# sourceMappingURL=business-errors.d.ts.map