"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseError = void 0;
class BaseError extends Error {
    constructor(message, statusCode, errorCode, isOperational = true, context) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = isOperational;
        this.context = context;
        this.timestamp = new Date().toISOString();
        Object.setPrototypeOf(this, new.target.prototype);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    toJSON() {
        return {
            success: false,
            error: {
                type: this.errorCode,
                message: this.message,
                timestamp: this.timestamp,
                context: this.context
            }
        };
    }
    static isOperationalError(error) {
        if (error instanceof BaseError) {
            return error.isOperational;
        }
        return false;
    }
}
exports.BaseError = BaseError;
//# sourceMappingURL=base-error.js.map