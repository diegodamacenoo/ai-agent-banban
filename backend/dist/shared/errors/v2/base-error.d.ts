export declare abstract class BaseError extends Error {
    readonly statusCode: number;
    readonly errorCode: string;
    readonly isOperational: boolean;
    readonly context?: Record<string, any>;
    readonly timestamp: string;
    constructor(message: string, statusCode: number, errorCode: string, isOperational?: boolean, context?: Record<string, any>);
    toJSON(): {
        success: boolean;
        error: {
            type: string;
            message: string;
            timestamp: string;
            context: Record<string, any> | undefined;
        };
    };
    static isOperationalError(error: Error): boolean;
}
//# sourceMappingURL=base-error.d.ts.map