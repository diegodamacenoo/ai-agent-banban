export declare class ErrorLogger {
    static logError(error: Error, context?: Record<string, any>): void;
    static logAuthError(error: Error, userId?: string, userEmail?: string): void;
    static logValidationError(error: Error, payload?: any): void;
    static logExternalServiceError(error: Error, service: string, operation?: string): void;
    static logTenantError(error: Error, tenantId?: string): void;
    static logModuleError(error: Error, module: string, tenantId?: string): void;
}
//# sourceMappingURL=error-logger.d.ts.map