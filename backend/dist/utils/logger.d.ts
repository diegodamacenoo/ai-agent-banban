import pino from 'pino';
declare const logger: import("pino").Logger<never, boolean>;
export declare const createTenantLogger: (tenantId: string, clientType: "custom" | "standard") => pino.Logger<never, boolean>;
export declare const createRouteLogger: (method: string, path: string, requestId?: string) => pino.Logger<never, boolean>;
export declare const createPluginLogger: (pluginName: string) => pino.Logger<never, boolean>;
export declare const logError: (error: Error, context?: Record<string, any>) => void;
export declare const logPerformance: (operation: string, duration: number, context?: Record<string, any>) => void;
export declare const logAudit: (action: string, userId?: string, tenantId?: string, details?: Record<string, any>) => void;
export { logger };
//# sourceMappingURL=logger.d.ts.map